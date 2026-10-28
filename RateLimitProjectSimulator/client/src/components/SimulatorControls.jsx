import React, { useState, useEffect } from 'react';
import { Send, Zap, Flame, Skull, Play, Square, User, Globe, Key, Clock, ShieldCheck, Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SimulatorControls({ 
  selectedUser, 
  setSelectedUser, 
  selectedEndpoint, 
  setSelectedEndpoint, 
  selectedAlgorithm, 
  setSelectedAlgorithm, 
  rateLimit, 
  setRateLimit, 
  windowSeconds, 
  setWindowSeconds, 
  clientTier, 
  setClientTier,
  onSendRequest, 
  onRunBurst,
  isSending,
  lastResponse
}) {
  const [autoLoop, setAutoLoop] = useState(false);

  const presetUsers = [
    { id: 'user_alice', label: 'Alice (Normal)', icon: User, isDanger: false },
    { id: 'user_bob', label: 'Bob (Tester)', icon: User, isDanger: false },
    { id: 'user_charlie', label: 'Charlie (Dev)', icon: User, isDanger: false },
    { id: 'bot_hacker', label: 'Bot_Hacker (Attacker)', icon: Skull, isDanger: true }
  ];

  const endpoints = [
    { path: '/api/v1/public/quotes', method: 'GET', label: 'Public Quotes (5 req/min default)' },
    { path: '/api/v1/auth/login', method: 'POST', label: 'Auth / Login (Strict: 3 req/min)' },
    { path: '/api/v1/search', method: 'GET', label: 'Search Query (Token Bucket Burst)' },
    { path: '/api/v1/heavy-compute', method: 'POST', label: 'Heavy Compute (Strict: 2 req/min)' },
    { path: '/api/v1/user/profile', method: 'GET', label: 'User Profile (Standard)' }
  ];

  const algorithms = [
    { id: 'sliding-window-log', label: 'Sliding Window Log (Millisecond Precision)' },
    { id: 'sliding-window-counter', label: 'Sliding Window Counter (Smooth Approx)' },
    { id: 'token-bucket', label: 'Token Bucket (Refill & Burst)' },
    { id: 'fixed-window', label: 'Fixed Window (Classic Minute Reset)' }
  ];

  // Auto-traffic loop
  useEffect(() => {
    let interval = null;
    if (autoLoop) {
      interval = setInterval(() => {
        onSendRequest();
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoLoop, onSendRequest]);

  return (
    <div className="glass-panel simulator-panel">
      {/* Header */}
      <div className="panel-title-wrap">
        <div className="panel-title">
          <Gauge size={24} color="#000000" />
          <span>REQUEST SIMULATOR</span>
        </div>
        <span style={{ 
          fontSize: '0.95rem', 
          color: '#000000', 
          fontFamily: 'var(--font-mono)', 
          fontWeight: 700,
          background: '#f1f5f9',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1.5px solid #000000'
        }}>
          Port 5000 API
        </span>
      </div>

      {/* User Selection */}
      <div className="control-group">
        <div className="control-label">
          <span>Client / User Identity</span>
          <span style={{ color: '#000000', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            Active: {selectedUser}
          </span>
        </div>
        <div className="chips-row">
          {presetUsers.map(u => (
            <button
              key={u.id}
              className={`chip-btn ${u.isDanger ? 'danger' : ''} ${selectedUser === u.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(u.id)}
            >
              <u.icon size={16} />
              <span>{u.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Client Tier Selector */}
      <div className="control-group">
        <div className="control-label">
          <span>API Key / Client Tier</span>
          <span style={{ color: '#334155', fontWeight: 700 }}>Quota Multiplier</span>
        </div>
        <div className="chips-row">
          {[
            { tier: 'free', label: 'Free (1x)', key: 'none' },
            { tier: 'pro', label: 'Pro (4x)', key: 'pro-tier-key' },
            { tier: 'enterprise', label: 'Enterprise (20x)', key: 'enterprise-tier-key' }
          ].map(t => (
            <button
              key={t.tier}
              className={`chip-btn ${clientTier === t.tier ? 'active' : ''}`}
              style={{ flex: '1 1 auto', justifyContent: 'center', textAlign: 'center' }}
              onClick={() => setClientTier(t.tier)}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Endpoint */}
      <div className="control-group">
        <div className="control-label">
          <span>Target Endpoint</span>
        </div>
        <select 
          className="control-select" 
          value={selectedEndpoint} 
          onChange={(e) => setSelectedEndpoint(e.target.value)}
        >
          {endpoints.map(ep => (
            <option key={ep.path} value={ep.path}>
              [{ep.method}] {ep.path} — {ep.label}
            </option>
          ))}
        </select>
      </div>

      {/* Algorithm Selector */}
      <div className="control-group">
        <div className="control-label">
          <span>Rate Limit Algorithm</span>
        </div>
        <select 
          className="control-select" 
          value={selectedAlgorithm} 
          onChange={(e) => setSelectedAlgorithm(e.target.value)}
        >
          {algorithms.map(alg => (
            <option key={alg.id} value={alg.id}>{alg.label}</option>
          ))}
        </select>
      </div>

      {/* Quota Sliders */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
        <div className="control-group" style={{ flex: '1 1 140px' }}>
          <div className="control-label">
            <span>Rate Limit</span>
            <span className="slider-badge">{rateLimit} req</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="15" 
            value={rateLimit} 
            onChange={(e) => setRateLimit(Number(e.target.value))}
            className="range-slider"
          />
        </div>

        <div className="control-group" style={{ flex: '1 1 140px' }}>
          <div className="control-label">
            <span>Time Window</span>
            <span className="slider-badge">{windowSeconds}s</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="120" 
            step="5"
            value={windowSeconds} 
            onChange={(e) => setWindowSeconds(Number(e.target.value))}
            className="range-slider"
          />
        </div>
      </div>

      {/* Single Fire Button - Big Projector Master Button */}
      <button 
        className="fire-btn" 
        onClick={() => onSendRequest()}
        disabled={isSending}
      >
        <Send size={22} />
        <span>{isSending ? 'DISPATCHING CALL...' : 'SEND SINGLE REQUEST'}</span>
      </button>

      {/* Preset Burst Scenarios */}
      <div className="control-group">
        <div className="control-label">
          <span>Preset Load Scenarios</span>
        </div>
        <div className="burst-grid">
          <button 
            className="burst-btn" 
            onClick={() => onRunBurst(5, 80)}
            title="Rapidly fire 5 requests (fills the standard quota)"
          >
            <Zap size={18} />
            <span>Burst 5 Reqs</span>
          </button>

          <button 
            className="burst-btn" 
            onClick={() => onRunBurst(8, 60)}
            title="Fire 8 requests to trigger 429 Too Many Requests"
          >
            <Flame size={18} />
            <span>Exceed Quota (8x)</span>
          </button>

          <button 
            className="burst-btn danger" 
            onClick={() => onRunBurst(15, 30)}
            title="Send 15 rapid requests: triggers DDoS flag & 45s Auto-Ban!"
          >
            <Skull size={18} />
            <span>DDoS Flood (15x)</span>
          </button>

          <button 
            className={`burst-btn ${autoLoop ? 'danger' : ''}`}
            onClick={() => setAutoLoop(!autoLoop)}
          >
            {autoLoop ? <Square size={18} /> : <Play size={18} />}
            <span>{autoLoop ? 'Stop Loop' : 'Continuous (2.5s)'}</span>
          </button>
        </div>
      </div>

      {/* Latest Response Status Banner - High Contrast & Large for Projector */}
      {lastResponse && (
        <div style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          background: lastResponse.status === 200 
            ? '#f0fdf4' 
            : lastResponse.status === 429 
              ? '#fef2f2' 
              : '#f5f3ff',
          border: `3px solid ${
            lastResponse.status === 200 
              ? 'var(--accent-emerald)' 
              : lastResponse.status === 429 
                ? 'var(--accent-rose)' 
                : 'var(--accent-purple)'
          }`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ 
              fontWeight: 900, 
              fontSize: '1.35rem',
              color: lastResponse.status === 200 
                ? 'var(--accent-emerald)' 
                : lastResponse.status === 429 
                  ? 'var(--accent-rose)' 
                  : 'var(--accent-purple)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {lastResponse.status === 200 ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              <span>HTTP {lastResponse.status} {lastResponse.statusText || (lastResponse.status === 429 ? 'TOO MANY REQUESTS' : 'OK')}</span>
            </div>
            <span style={{ color: '#000000', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              {lastResponse.latencyMs || 4}ms latency
            </span>
          </div>

          <div style={{ 
            color: '#000000', 
            fontSize: '1.1rem',
            fontWeight: 800,
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1.5px solid rgba(0,0,0,0.15)',
            paddingTop: '0.6rem'
          }}>
            <span>
              Remaining Quota: <b style={{ fontSize: '1.3rem', color: lastResponse.remaining === 0 ? 'var(--accent-rose)' : '#000000' }}>{lastResponse.remaining ?? '0'}</b> / {rateLimit}
            </span>
            {lastResponse.retryAfter ? (
              <span style={{ 
                color: 'var(--accent-rose)', 
                fontWeight: 900,
                background: '#fee2e2',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1.5px solid var(--accent-rose)'
              }}>
                RETRY AFTER: {lastResponse.retryAfter}s
              </span>
            ) : (
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>
                STATUS: PERMITTED
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
