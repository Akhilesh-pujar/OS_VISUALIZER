// Traffic Generator Service
// Allows simulating synthetic load scenarios against local endpoints

export const runTrafficScenario = async (scenarioType, options = {}, serverBaseUrl = 'http://localhost:5000') => {
  const { count = 10, userId = 'user_alice', delayMs = 100, endpoint = '/api/v1/public/quotes' } = options;

  const results = [];

  for (let i = 0; i < count; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`${serverBaseUrl}${endpoint}?userId=${userId}`, {
        method: endpoint.includes('login') || endpoint.includes('heavy-compute') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: endpoint.includes('login') ? JSON.stringify({ username: userId }) : undefined
      });

      const data = await response.json().catch(() => ({}));
      results.push({
        index: i + 1,
        status: response.status,
        statusText: response.statusText,
        remaining: response.headers.get('x-ratelimit-remaining'),
        reset: response.headers.get('x-ratelimit-reset'),
        retryAfter: response.headers.get('retry-after'),
        algorithm: response.headers.get('x-ratelimit-algorithm'),
        latencyMs: Date.now() - start,
        data
      });
    } catch (err) {
      results.push({
        index: i + 1,
        status: 500,
        error: err.message
      });
    }

    if (delayMs > 0 && i < count - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return results;
};
