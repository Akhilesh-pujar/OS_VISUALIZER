import { RequestLog } from '../models/RequestLog.js';
import { RateLimitRule } from '../models/RateLimitRule.js';
import { BannedClient } from '../models/BannedClient.js';
import { slidingWindowLog } from '../algorithms/slidingWindowLog.js';
import { slidingWindowCounter } from '../algorithms/slidingWindowCounter.js';
import { tokenBucket } from '../algorithms/tokenBucket.js';
import { fixedWindow } from '../algorithms/fixedWindow.js';
import { broadcastRequestEvent, broadcastAbuseAlert } from '../services/socketService.js';

// In-memory tracking for abuse detection & consecutive violations
const consecutiveViolations = new Map(); // key -> { count: number, lastViolation: number }
const rapidBurstTracker = new Map(); // key -> Array<number>

export const rateLimiterMiddleware = async (req, res, next) => {
  const startTime = Date.now();

  // Extract client identity (supports header, query, or fallback IP)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userId = req.headers['x-user-id'] || req.query.userId || 'user_alice';
  const apiKey = req.headers['x-api-key'] || req.query.apiKey || 'none';
  const method = req.method;
  const endpoint = req.baseUrl + (req.path === '/' ? '' : req.path);

  // Determine client tier
  let clientTier = 'Free';
  let tierMultiplier = 1;
  if (apiKey === 'pro-tier-key' || req.query.tier === 'pro') {
    clientTier = 'Pro';
    tierMultiplier = 4;
  } else if (apiKey === 'enterprise-tier-key' || req.query.tier === 'enterprise') {
    clientTier = 'Enterprise';
    tierMultiplier = 20;
  }

  // Gateway identifier key (Rate limit is tracked per User ID + Endpoint)
  const clientKey = `${userId}:${endpoint}`;

  // 1. Abuse Check: Blacklist / Active Ban
  const activeBan = await BannedClient.findOne({
    $or: [
      { identifierValue: userId },
      { identifierValue: ip },
      { identifierValue: apiKey }
    ]
  });

  if (activeBan && new Date(activeBan.expiresAt).getTime() > startTime) {
    const remainingSeconds = Math.ceil((new Date(activeBan.expiresAt).getTime() - startTime) / 1000);
    const latencyMs = Date.now() - startTime;

    const logEntry = await RequestLog.create({
      timestamp: new Date(),
      ip,
      userId,
      apiKey,
      clientTier,
      endpoint,
      method,
      statusCode: 403,
      statusText: 'Forbidden (Banned Client)',
      algorithm: 'abuse-firewall',
      limit: 0,
      remaining: 0,
      resetTime: new Date(activeBan.expiresAt).getTime(),
      windowSeconds: 60,
      latencyMs,
      abuseDetected: true,
      abuseType: 'ACTIVE_SECURITY_BAN',
      blockedReason: `Client banned due to: ${activeBan.reason}. Ban expires in ${remainingSeconds}s.`
    });

    broadcastRequestEvent(logEntry);

    res.setHeader('X-Security-Status', 'BLOCKED');
    res.setHeader('Retry-After', remainingSeconds);
    return res.status(403).json({
      error: 'Forbidden',
      status: 403,
      reason: 'CLIENT_BANNED',
      message: `Access denied. Client is banned due to: ${activeBan.reason}`,
      expiresInSeconds: remainingSeconds
    });
  }

  // 2. Abuse Check: Rapid Burst Anomaly Detection (>7 requests in 350ms)
  let burstTimestamps = rapidBurstTracker.get(clientKey) || [];
  burstTimestamps = burstTimestamps.filter(t => t > startTime - 350);
  burstTimestamps.push(startTime);
  rapidBurstTracker.set(clientKey, burstTimestamps);

  let abuseFlag = null;
  if (burstTimestamps.length >= 7) {
    abuseFlag = 'RAPID_BURST_DDOS';
    broadcastAbuseAlert({
      type: 'RAPID_BURST_ATTACK',
      userId,
      ip,
      endpoint,
      rate: `${burstTimestamps.length} requests in 350ms`,
      timestamp: startTime
    });
  }

  // 3. Find matching Rate Limit Rule
  const allRules = await RateLimitRule.find({ enabled: true });
  // Find specific route rule or fallback to global rule
  let matchedRule = allRules.find(r => r.endpointPattern === endpoint) || 
                    allRules.find(r => r.endpointPattern === '*') || {
                      algorithm: 'sliding-window-log',
                      limit: 5,
                      windowSeconds: 60,
                      bucketCapacity: 5,
                      refillRate: 5 / 60
                    };

  // Allow simulator overrides via query params (for live interactive tweaking in dashboard!)
  const algorithm = req.query.simAlgorithm || matchedRule.algorithm || 'sliding-window-log';
  const effectiveLimit = Math.max(1, (parseInt(req.query.simLimit) || matchedRule.limit || 5) * tierMultiplier);
  const effectiveWindow = parseInt(req.query.simWindow) || matchedRule.windowSeconds || 60;
  const effectiveCapacity = Math.max(1, (parseInt(req.query.simCapacity) || matchedRule.bucketCapacity || effectiveLimit) * tierMultiplier);
  const effectiveRefillRate = (matchedRule.refillRate || (effectiveLimit / effectiveWindow)) * tierMultiplier;

  // 4. Run Rate Limiter Algorithm
  let evalResult;
  if (algorithm === 'token-bucket') {
    evalResult = tokenBucket.check(clientKey, effectiveCapacity, effectiveRefillRate);
  } else if (algorithm === 'sliding-window-counter') {
    evalResult = slidingWindowCounter.check(clientKey, effectiveLimit, effectiveWindow);
  } else if (algorithm === 'fixed-window') {
    evalResult = fixedWindow.check(clientKey, effectiveLimit, effectiveWindow);
  } else {
    // Default: sliding-window-log
    evalResult = slidingWindowLog.check(clientKey, effectiveLimit, effectiveWindow);
  }

  // 5. Check Consecutive Violations for Auto-Ban
  let violationEntry = consecutiveViolations.get(clientKey) || { count: 0, lastViolation: 0 };
  if (!evalResult.allowed) {
    violationEntry.count += 1;
    violationEntry.lastViolation = startTime;
    consecutiveViolations.set(clientKey, violationEntry);

    // Auto-ban after 6 consecutive 429 rejections within 25 seconds
    if (violationEntry.count >= 6) {
      const banExpires = new Date(Date.now() + 45 * 1000); // 45 seconds ban
      await BannedClient.create({
        identifierType: 'userId',
        identifierValue: userId,
        reason: 'Repeated excessive rate limit violations (6+ continuous rejected requests)',
        violationCount: violationEntry.count,
        bannedAt: new Date(),
        expiresAt: banExpires
      });

      broadcastAbuseAlert({
        type: 'AUTO_BAN_ENFORCED',
        userId,
        ip,
        endpoint,
        reason: 'Automated 45-second ban triggered by repeated 429 spamming',
        expiresAt: banExpires
      });

      violationEntry.count = 0;
      consecutiveViolations.set(clientKey, violationEntry);
    }
  } else {
    // Gradual violation reset on success
    if (violationEntry.count > 0 && startTime - violationEntry.lastViolation > 10000) {
      violationEntry.count = Math.max(0, violationEntry.count - 1);
      consecutiveViolations.set(clientKey, violationEntry);
    }
  }

  // 6. Set standard Rate Limiting HTTP Headers
  res.setHeader('X-RateLimit-Limit', evalResult.limit);
  res.setHeader('X-RateLimit-Remaining', evalResult.remaining);
  res.setHeader('X-RateLimit-Reset', evalResult.resetTime);
  res.setHeader('X-RateLimit-Algorithm', evalResult.algorithm);
  res.setHeader('X-Client-Tier', clientTier);

  const latencyMs = Math.max(1, Date.now() - startTime);

  // If Blocked: return 429 Too Many Requests
  if (!evalResult.allowed) {
    res.setHeader('Retry-After', evalResult.retryAfter);
    res.setHeader('X-RateLimit-Blocked', 'true');

    const logEntry = await RequestLog.create({
      timestamp: new Date(),
      ip,
      userId,
      apiKey,
      clientTier,
      endpoint,
      method,
      statusCode: 429,
      statusText: 'Too Many Requests',
      algorithm: evalResult.algorithm,
      limit: evalResult.limit,
      remaining: evalResult.remaining,
      resetTime: evalResult.resetTime,
      windowSeconds: effectiveWindow,
      latencyMs,
      abuseDetected: !!abuseFlag,
      abuseType: abuseFlag,
      blockedReason: `Rate limit of ${evalResult.limit} requests per ${effectiveWindow}s exceeded. Try again in ${evalResult.retryAfter}s.`
    });

    broadcastRequestEvent(logEntry);

    return res.status(429).json({
      error: 'Too Many Requests',
      statusCode: 429,
      message: `Rate limit exceeded. Allowed: ${evalResult.limit} requests per ${effectiveWindow}s.`,
      algorithm: evalResult.algorithm,
      limit: evalResult.limit,
      remaining: evalResult.remaining,
      retryAfter: evalResult.retryAfter,
      resetTime: evalResult.resetTime,
      clientId: userId,
      endpoint
    });
  }

  // If Allowed: attach rate limit info to request and proceed
  req.rateLimitInfo = {
    ...evalResult,
    userId,
    clientTier,
    latencyMs
  };

  // Intercept response finish to log 200/201 response
  res.on('finish', async () => {
    const finalLatency = Math.max(1, Date.now() - startTime);
    const logEntry = await RequestLog.create({
      timestamp: new Date(),
      ip,
      userId,
      apiKey,
      clientTier,
      endpoint,
      method,
      statusCode: res.statusCode,
      statusText: res.statusMessage || 'OK',
      algorithm: evalResult.algorithm,
      limit: evalResult.limit,
      remaining: evalResult.remaining,
      resetTime: evalResult.resetTime,
      windowSeconds: effectiveWindow,
      latencyMs: finalLatency,
      abuseDetected: !!abuseFlag,
      abuseType: abuseFlag,
      blockedReason: null
    });

    broadcastRequestEvent(logEntry);
  });

  next();
};
