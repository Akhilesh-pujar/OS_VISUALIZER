// Sliding Window Log Algorithm
// Keeps exact timestamps of every request in the sliding window.
// Provides precise 100% boundary accuracy.

class SlidingWindowLogManager {
  constructor() {
    // Map of key -> Array<number> (timestamps in ms)
    this.logs = new Map();
  }

  check(key, limit = 5, windowSeconds = 60) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const windowStart = now - windowMs;

    let timestamps = this.logs.get(key) || [];

    // Filter out timestamps older than the sliding window start
    timestamps = timestamps.filter(ts => ts > windowStart);

    const currentCount = timestamps.length;
    let allowed = false;
    let remaining = 0;
    let resetTime = now + windowMs;
    let retryAfter = 0;

    if (currentCount < limit) {
      // Allowed: record this request's timestamp
      timestamps.push(now);
      this.logs.set(key, timestamps);
      allowed = true;
      remaining = Math.max(0, limit - timestamps.length);
      // Reset is when the oldest timestamp in the active window will expire
      resetTime = timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;
      retryAfter = 0;
    } else {
      // Blocked
      this.logs.set(key, timestamps);
      allowed = false;
      remaining = 0;
      resetTime = timestamps[0] + windowMs;
      retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    }

    return {
      allowed,
      limit,
      remaining,
      resetTime,
      retryAfter,
      currentCount: timestamps.length,
      windowSeconds,
      timestamps: [...timestamps],
      algorithm: 'sliding-window-log'
    };
  }

  getClientTimestamps(key, windowSeconds = 60) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const timestamps = (this.logs.get(key) || []).filter(ts => ts > now - windowMs);
    return timestamps;
  }

  resetKey(key) {
    this.logs.delete(key);
  }

  resetAll() {
    this.logs.clear();
  }
}

export const slidingWindowLog = new SlidingWindowLogManager();
