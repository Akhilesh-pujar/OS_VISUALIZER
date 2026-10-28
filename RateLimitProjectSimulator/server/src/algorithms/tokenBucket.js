// Token Bucket Algorithm
// Allows bursts up to bucket capacity, refilled at a constant steady rate.
// Widely used by AWS API Gateway, Cloudflare, GitHub APIs.

class TokenBucketManager {
  constructor() {
    // Map of key -> { tokens: number, lastRefill: number, capacity: number, refillRate: number }
    this.buckets = new Map();
  }

  check(key, capacity = 5, refillRate = 0.083) { // 5 tokens / 60s ≈ 0.0833 tokens/sec
    const now = Date.now();

    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: capacity,
        lastRefill: now,
        capacity,
        refillRate
      };
    } else {
      // Calculate token replenishment since last refill
      const elapsedSeconds = (now - bucket.lastRefill) / 1000;
      const refilledTokens = elapsedSeconds * refillRate;
      bucket.tokens = Math.min(capacity, bucket.tokens + refilledTokens);
      bucket.lastRefill = now;
      bucket.capacity = capacity;
      bucket.refillRate = refillRate;
    }

    let allowed = false;
    let remaining = 0;
    let retryAfter = 0;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(key, bucket);
      allowed = true;
      remaining = Math.floor(bucket.tokens);
      retryAfter = 0;
    } else {
      this.buckets.set(key, bucket);
      allowed = false;
      remaining = 0;
      const deficit = 1 - bucket.tokens;
      retryAfter = Math.max(1, Math.ceil(deficit / refillRate));
    }

    const resetTime = now + (capacity - bucket.tokens) / refillRate * 1000;

    return {
      allowed,
      limit: capacity,
      remaining,
      tokensAvailable: Number(bucket.tokens.toFixed(2)),
      capacity,
      refillRate,
      resetTime: Math.round(resetTime),
      retryAfter,
      algorithm: 'token-bucket'
    };
  }

  resetKey(key) {
    this.buckets.delete(key);
  }

  resetAll() {
    this.buckets.clear();
  }
}

export const tokenBucket = new TokenBucketManager();
