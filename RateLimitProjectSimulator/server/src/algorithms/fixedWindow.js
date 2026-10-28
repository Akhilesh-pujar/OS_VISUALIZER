// Fixed Window Counter Algorithm
// Tracks request count in discrete static time blocks (e.g., 12:00:00 - 12:01:00).
// Exhibits edge boundary burst vulnerability.

class FixedWindowCounterManager {
  constructor() {
    // Map of key -> { windowStart: number, count: number }
    this.counters = new Map();
  }

  check(key, limit = 5, windowSeconds = 60) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const currentWindowStart = Math.floor(now / windowMs) * windowMs;

    let entry = this.counters.get(key);
    if (!entry || entry.windowStart !== currentWindowStart) {
      entry = {
        windowStart: currentWindowStart,
        count: 0
      };
    }

    let allowed = false;
    let remaining = 0;
    const resetTime = currentWindowStart + windowMs;
    let retryAfter = 0;

    if (entry.count < limit) {
      entry.count += 1;
      this.counters.set(key, entry);
      allowed = true;
      remaining = Math.max(0, limit - entry.count);
      retryAfter = 0;
    } else {
      this.counters.set(key, entry);
      allowed = false;
      remaining = 0;
      retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    }

    return {
      allowed,
      limit,
      remaining,
      resetTime,
      retryAfter,
      currentCount: entry.count,
      windowSeconds,
      windowStart: entry.windowStart,
      algorithm: 'fixed-window'
    };
  }

  resetKey(key) {
    this.counters.delete(key);
  }

  resetAll() {
    this.counters.clear();
  }
}

export const fixedWindow = new FixedWindowCounterManager();
