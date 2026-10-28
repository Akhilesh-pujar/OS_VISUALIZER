// Sliding Window Counter Algorithm
// Memory-efficient hybrid between fixed window and sliding log.
// Approximates requests = currentWindowCount + previousWindowCount * (1 - timeElapsedFraction)

class SlidingWindowCounterManager {
  constructor() {
    // Map of key -> { currentWindow: ts, currentCount: n, previousCount: n }
    this.counters = new Map();
  }

  check(key, limit = 5, windowSeconds = 60) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const currentWindowStart = Math.floor(now / windowMs) * windowMs;

    let entry = this.counters.get(key);
    if (!entry) {
      entry = {
        currentWindow: currentWindowStart,
        currentCount: 0,
        previousCount: 0
      };
    } else {
      // Check if we advanced windows
      const windowDiff = Math.floor((currentWindowStart - entry.currentWindow) / windowMs);
      if (windowDiff === 1) {
        entry.previousCount = entry.currentCount;
        entry.currentWindow = currentWindowStart;
        entry.currentCount = 0;
      } else if (windowDiff > 1) {
        entry.previousCount = 0;
        entry.currentWindow = currentWindowStart;
        entry.currentCount = 0;
      }
    }

    const timeIntoWindow = now - entry.currentWindow;
    const currentWindowWeight = timeIntoWindow / windowMs;
    const previousWindowWeight = 1 - currentWindowWeight;

    const estimatedRequests = Math.floor(
      entry.previousCount * previousWindowWeight + entry.currentCount
    );

    let allowed = false;
    let remaining = 0;
    const resetTime = entry.currentWindow + windowMs;
    let retryAfter = 0;

    if (estimatedRequests < limit) {
      entry.currentCount += 1;
      this.counters.set(key, entry);
      allowed = true;
      remaining = Math.max(0, limit - (estimatedRequests + 1));
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
      currentCount: estimatedRequests + (allowed ? 1 : 0),
      windowSeconds,
      breakdown: {
        currentCount: entry.currentCount,
        previousCount: entry.previousCount,
        currentWindowWeight: Number(currentWindowWeight.toFixed(2))
      },
      algorithm: 'sliding-window-counter'
    };
  }

  resetKey(key) {
    this.counters.delete(key);
  }

  resetAll() {
    this.counters.clear();
  }
}

export const slidingWindowCounter = new SlidingWindowCounterManager();
