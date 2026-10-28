import React, { useState } from 'react';
import { BookOpen, Shield, Cpu, Layers, GitCompare, Terminal, Copy, Check } from 'lucide-react';

export default function ConceptsGuide({ selectedUser, selectedEndpoint, rateLimit, windowSeconds }) {
  const [copied, setCopied] = useState(false);

  const curlCommand = `curl -i -X GET "http://localhost:5000${selectedEndpoint}?userId=${selectedUser}" \\
  -H "x-user-id: ${selectedUser}" \\
  -H "x-api-key: free-tier-key"`;

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ borderBottom: '2px solid #000000', paddingBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#000000' }}>
          <BookOpen size={24} color="#000000" />
          <span>SYSTEM DESIGN &amp; ARCHITECTURAL CONCEPTS</span>
        </h3>
        <p style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
          Technical reference on rate limiting algorithms, sliding windows, abuse defense, and API gateway pipelines.
        </p>
      </div>

      {/* Grid of Concept Cards */}
      <div className="concept-grid">
        {/* Card 1: Sliding Window Log */}
        <div className="concept-card">
          <div className="concept-icon">
            <Layers size={24} />
          </div>
          <div className="concept-title">1. Sliding Window Log</div>
          <p className="concept-desc">
            Maintains a sorted list of timestamps for every request in memory. When a request arrives, timestamps older than <code>[now - window]</code> are removed. If remaining length &lt; limit, the request is permitted.
          </p>
          <div className="concept-formula">
            Condition: Count(t &gt; now - 60s) &lt; 5
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 800 }}>
            ✓ 100% Boundary Accuracy (zero 2x edge-burst loopholes).
          </div>
        </div>

        {/* Card 2: Sliding Window Counter */}
        <div className="concept-card">
          <div className="concept-icon">
            <GitCompare size={24} />
          </div>
          <div className="concept-title">2. Sliding Window Counter</div>
          <p className="concept-desc">
            A hybrid algorithm combining fixed window memory efficiency with sliding window smoothing. It calculates estimated load based on weighted requests in the previous and current discrete windows.
          </p>
          <div className="concept-formula">
            Count = Current + Previous × (1 - Elapsed%)
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>
            ✓ O(1) Memory footprint, ideal for distributed Redis clusters.
          </div>
        </div>

        {/* Card 3: Token Bucket */}
        <div className="concept-card">
          <div className="concept-icon">
            <Cpu size={24} />
          </div>
          <div className="concept-title">3. Token Bucket Algorithm</div>
          <p className="concept-desc">
            A bucket of capacity <i>B</i> is refilled with tokens at a constant rate <i>R</i> tokens/sec. Each request consumes 1 token. Requests are rejected when the bucket is empty.
          </p>
          <div className="concept-formula">
            Tokens = Min(B, Current + Δt × RefillRate)
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 800 }}>
            ✓ Handles legitimate bursts smoothly while bounding sustained rate.
          </div>
        </div>

        {/* Card 4: Abuse Prevention & Gateways */}
        <div className="concept-card">
          <div className="concept-icon">
            <Shield size={24} />
          </div>
          <div className="concept-title">4. Abuse Prevention &amp; Gateways</div>
          <p className="concept-desc">
            API Gateways act as the perimeter reverse proxy. When an agent exceeds limits, the gateway returns standard HTTP headers:
            <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, and <code>Retry-After</code>.
          </p>
          <div className="concept-formula">
            HTTP 429 Too Many Requests | HTTP 403 Forbidden
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 800 }}>
            ✓ Auto-quarantine protects upstream database and compute layers.
          </div>
        </div>
      </div>

      {/* Terminal / cURL Tester */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 900, color: '#000000' }}>
            <Terminal size={20} color="#000000" />
            <span>Terminal / cURL Verification</span>
          </div>

          <button 
            onClick={() => copyCode(curlCommand)}
            style={{
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.88rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy cURL'}</span>
          </button>
        </div>

        <div className="code-block" style={{ color: '#000000', fontSize: '0.95rem' }}>
          {curlCommand}
        </div>
      </div>
    </div>
  );
}
