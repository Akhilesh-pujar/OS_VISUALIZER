import { RequestLog } from '../models/RequestLog.js';
import { RateLimitRule, defaultRules } from '../models/RateLimitRule.js';
import { BannedClient } from '../models/BannedClient.js';
import { slidingWindowLog } from '../algorithms/slidingWindowLog.js';
import { slidingWindowCounter } from '../algorithms/slidingWindowCounter.js';
import { tokenBucket } from '../algorithms/tokenBucket.js';
import { fixedWindow } from '../algorithms/fixedWindow.js';
import { dbStatus } from '../config/db.js';

export const getMetrics = async (req, res) => {
  try {
    const allLogs = await RequestLog.find({});
    const logs = Array.isArray(allLogs) ? allLogs : (allLogs.exec ? await allLogs.exec() : await allLogs);

    const total = logs.length;
    const allowed = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
    const blocked = logs.filter(l => l.statusCode === 429).length;
    const banned = logs.filter(l => l.statusCode === 403).length;
    const rejectionRate = total > 0 ? Number(((blocked + banned) / total * 100).toFixed(1)) : 0;

    const uniqueUsers = new Set(logs.map(l => l.userId)).size;
    const abuseCount = logs.filter(l => l.abuseDetected).length;

    // Breakdown by endpoint
    const endpointCounts = {};
    const algorithmCounts = {};
    for (const l of logs) {
      endpointCounts[l.endpoint] = (endpointCounts[l.endpoint] || 0) + 1;
      const alg = l.algorithm || 'sliding-window-log';
      algorithmCounts[alg] = (algorithmCounts[alg] || 0) + 1;
    }

    // Top users by requests
    const userReqMap = {};
    for (const l of logs) {
      if (!userReqMap[l.userId]) {
        userReqMap[l.userId] = { userId: l.userId, total: 0, allowed: 0, blocked: 0 };
      }
      userReqMap[l.userId].total += 1;
      if (l.statusCode === 429 || l.statusCode === 403) {
        userReqMap[l.userId].blocked += 1;
      } else {
        userReqMap[l.userId].allowed += 1;
      }
    }
    const topUsers = Object.values(userReqMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Recent 1-minute activity buckets (last 60 seconds)
    const now = Date.now();
    const timeSlots = [];
    for (let i = 11; i >= 0; i--) {
      const slotStart = now - (i + 1) * 5000;
      const slotEnd = now - i * 5000;
      const slotLogs = logs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= slotStart && t < slotEnd;
      });
      timeSlots.push({
        label: `${Math.round((now - slotEnd) / 1000)}s ago`,
        allowed: slotLogs.filter(l => l.statusCode < 300).length,
        blocked: slotLogs.filter(l => l.statusCode >= 400).length
      });
    }

    res.json({
      success: true,
      data: {
        totalRequests: total,
        allowedRequests: allowed,
        blockedRequests: blocked,
        bannedRequests: banned,
        rejectionRate,
        activeUsersCount: Math.max(1, uniqueUsers),
        abuseIncidents: abuseCount,
        endpointBreakdown: endpointCounts,
        algorithmBreakdown: algorithmCounts,
        topUsers,
        activityTimeline: timeSlots,
        dbStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const { status, endpoint, userId, limit = 50 } = req.query;
    const filter = {};
    if (status === 'allowed') filter.statusCode = 200;
    if (status === 'blocked') filter.statusCode = 429;
    if (status === 'banned') filter.statusCode = 403;
    if (endpoint) filter.endpoint = endpoint;
    if (userId) filter.userId = userId;

    let query = RequestLog.find(filter);
    if (query.sort) {
      query = query.sort({ timestamp: -1 });
    }
    if (query.limit) {
      query = query.limit(parseInt(limit));
    }
    const logs = Array.isArray(query) ? query : (query.exec ? await query.exec() : await query);

    res.json({
      success: true,
      count: logs.length,
      logs: Array.isArray(logs) ? logs.slice(0, parseInt(limit)) : []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const clearLogs = async (req, res) => {
  try {
    await RequestLog.deleteMany({});
    res.json({ success: true, message: 'Request telemetry logs purged.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getRules = async (req, res) => {
  try {
    let rules = await RateLimitRule.find({});
    if (!Array.isArray(rules) && rules.exec) rules = await rules.exec();
    if (!rules || rules.length === 0) {
      await RateLimitRule.initDefaults();
      rules = await RateLimitRule.find({});
      if (rules.exec) rules = await rules.exec();
    }
    res.json({ success: true, rules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    const updated = await RateLimitRule.findOneAndUpdate({ ruleId }, updates, { new: true });
    res.json({ success: true, rule: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const resetSimulatorState = async (req, res) => {
  try {
    slidingWindowLog.resetAll();
    slidingWindowCounter.resetAll();
    tokenBucket.resetAll();
    fixedWindow.resetAll();
    await BannedClient.deleteMany({});
    res.json({ success: true, message: 'All in-memory sliding windows, buckets and rate limits reset.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getBans = async (req, res) => {
  try {
    let bans = await BannedClient.find({});
    if (!Array.isArray(bans) && bans.exec) bans = await bans.exec();
    res.json({ success: true, bans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const addBan = async (req, res) => {
  try {
    const { identifierType = 'userId', identifierValue, reason, durationSeconds = 60 } = req.body;
    if (!identifierValue) {
      return res.status(400).json({ success: false, error: 'Identifier value is required' });
    }

    const expiresAt = new Date(Date.now() + durationSeconds * 1000);
    const ban = await BannedClient.create({
      identifierType,
      identifierValue,
      reason: reason || 'Manual Administrator Blacklist',
      bannedAt: new Date(),
      expiresAt
    });

    res.json({ success: true, ban });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const removeBan = async (req, res) => {
  try {
    const { id } = req.params;
    await BannedClient.deleteOne({ _id: id });
    res.json({ success: true, message: 'Ban removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getClientState = (req, res) => {
  const { userId } = req.params;
  const endpoint = req.query.endpoint || '/api/v1/public/quotes';
  const clientKey = `${userId}:${endpoint}`;

  const logTimestamps = slidingWindowLog.getClientTimestamps(clientKey, 60);
  const now = Date.now();
  const windowMs = 60000;

  res.json({
    success: true,
    userId,
    endpoint,
    clientKey,
    now,
    windowStart: now - windowMs,
    slidingWindowLog: {
      count: logTimestamps.length,
      limit: 5,
      timestamps: logTimestamps.map(t => ({
        time: t,
        ageSeconds: Math.round((now - t) / 1000),
        expiresInSeconds: Math.max(0, Math.round((t + windowMs - now) / 1000))
      }))
    }
  });
};
