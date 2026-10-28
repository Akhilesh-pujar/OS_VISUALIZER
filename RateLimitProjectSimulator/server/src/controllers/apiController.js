const quotes = [
  { text: "Rate limiting protects distributed systems from cascading failures.", author: "Site Reliability Engineering" },
  { text: "Sliding window log achieves zero edge-burst vulnerability with exact timestamp auditing.", author: "System Design" },
  { text: "Token buckets allow smooth bursts while enforcing average sustained throughput.", author: "Network Architecture" },
  { text: "Defense in depth: combine rate limits with anomaly detection and automated IP quarantines.", author: "Security Engineering" },
  { text: "Fast responses build trust; resilient infrastructure ensures availability.", author: "Cloud Gateway Principles" }
];

export const getQuotes = (req, res) => {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  res.json({
    success: true,
    message: "Request successfully processed within rate quota.",
    data: quote,
    rateLimit: req.rateLimitInfo
  });
};

export const getPublicData = (req, res) => {
  res.json({
    success: true,
    service: "Public Weather & Telemetry Feed",
    metrics: {
      temperature: "24°C",
      humidity: "48%",
      serverHealth: "OPTIMAL",
      clusterNodes: 12
    },
    rateLimit: req.rateLimitInfo
  });
};

export const postLogin = (req, res) => {
  const { username } = req.body || {};
  res.json({
    success: true,
    message: `Authentication challenge verified for ${username || req.rateLimitInfo?.userId || 'user'}.`,
    token: `jwt_sim_${Math.random().toString(36).substring(2)}`,
    rateLimit: req.rateLimitInfo
  });
};

export const getSearch = (req, res) => {
  const query = req.query.q || 'distributed-systems';
  res.json({
    success: true,
    query,
    resultsCount: 42,
    results: [
      { id: 1, title: `High Throughput Rate Limiting in Node.js & Redis`, score: 0.98 },
      { id: 2, title: `Sliding Window Logs vs Leaky Bucket Tradeoffs`, score: 0.94 },
      { id: 3, title: `DDoS Mitigation at API Gateways`, score: 0.91 }
    ],
    rateLimit: req.rateLimitInfo
  });
};

export const postHeavyCompute = (req, res) => {
  // Simulate slight compute delay
  const computeStart = Date.now();
  let hash = 0;
  for (let i = 0; i < 500000; i++) {
    hash = (hash + i) % 1000000;
  }

  res.json({
    success: true,
    message: "Heavy computational task finished.",
    computeDurationMs: Date.now() - computeStart,
    hashResult: hash,
    rateLimit: req.rateLimitInfo
  });
};

export const getUserProfile = (req, res) => {
  res.json({
    success: true,
    profile: {
      userId: req.rateLimitInfo?.userId || 'user_demo',
      tier: req.rateLimitInfo?.clientTier || 'Free',
      role: 'Developer',
      status: 'Active'
    },
    rateLimit: req.rateLimitInfo
  });
};
