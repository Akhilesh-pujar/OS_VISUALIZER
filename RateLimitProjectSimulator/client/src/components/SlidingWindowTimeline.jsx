import React, { useState, useEffect } from 'react';
import { Clock, Info, CheckCircle2, XCircle, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export default function SlidingWindowTimeline({ 
  selectedUser, 
  selectedEndpoint, 
  rateLimit = 5, 
  windowSeconds = 60,
  recentRequests = []
}) {
  const [now, setNow] = useState(Date.now());

  // Keep a local 1-second tick to update countdowns smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  // Filter requests for the currently selected user and endpoint within window
  const userRequests = recentRequests.filter(req => {
    const reqTime = new Date(req.timestamp).getTime();
    return req.userId === selectedUser && 
           reqTime >= windowStart && 
           reqTime <= now;
  });

  const allowedInWindow = userRequests.filter(r => r.statusCode < 300);
  const blockedInWindow = userRequests.filter(r => r.statusCode >= 400);

  // Used slots count
  const usedSlots = Math.min(rateLimit, allowedInWindow.length);
  const remainingSlots = Math.max(0, rateLimit - usedSlots);

  // Oldest request in the window dictates the next reset
  const oldestAllowed = allowedInWindow.length > 0 
    ? allowedInWindow.reduce((earliest, curr) => {
        const t = new Date(curr.timestamp).getTime();
        return t < earliest ? t : earliest;
      }, new Date(allowedInWindow[0].timestamp).getTime())
    : null;

  const secondsUntilNextSlot = oldestAllowed 
    ? Math.max(0, Math.ceil((oldestAllowed + windowMs - now) / 1000))
    : 0;

  return (
    <div className="glass-panel window-visualizer">
      {/* Top Header & Countdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #000000', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#000000' }}>
            <Clock size={24} color="#000000" />
            <span>SLIDING WINDOW TIMELINE</span>
          </h3>
          <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
            Tracking requests for <b style={{ color: '#000000', textDecoration: 'underline' }}>{selectedUser}</b> within the active <b>{windowSeconds}s</b> window.
          </p>
        </div>

        {/* Live Slot Expiry Countdown - High Contrast Projector Badge */}
        <div style={{
          background: usedSlots >= rateLimit ? '#fef2f2' : '#f8fafc',
          border: `2.5px solid ${usedSlots >= rateLimit ? 'var(--accent-rose)' : '#000000'}`,
          padding: '8px 18px',
          borderRadius: 'var(--radius-md)',
          textAlign: 'right',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '0.82rem', color: '#334155', textTransform: 'uppercase', fontWeight: 800 }}>
            {usedSlots >= rateLimit ? 'LIMIT EXHAUSTED' : 'NEXT QUOTA REFILL'}
          </div>
          <div style={{ 
            fontSize: '1.35rem', 
            fontWeight: 900, 
            fontFamily: 'var(--font-mono)', 
            color: usedSlots >= rateLimit ? 'var(--accent-rose)' : '#000000' 
          }}>
            {secondsUntilNextSlot > 0 ? `+1 slot in ${secondsUntilNextSlot}s` : '100% Capacity Ready'}
          </div>
        </div>
      </div>

      {/* Quota Slot Blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#000000' }}>
          <span>Active Quota Allocation: <b style={{ fontSize: '1.25rem', color: remainingSlots === 0 ? 'var(--accent-rose)' : '#000000' }}>{remainingSlots}</b> of {rateLimit} available</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#1e293b' }}>
            {allowedInWindow.length} permitted / {blockedInWindow.length} throttled
          </span>
        </div>

        <div className="slots-container">
          {Array.from({ length: rateLimit }).map((_, idx) => {
            const isUsed = idx < usedSlots;
            const isOverCapacity = idx === rateLimit - 1 && usedSlots >= rateLimit;
            return (
              <div 
                key={idx} 
                className={`slot-box ${isUsed ? (isOverCapacity ? 'exhausted' : 'used-allowed') : 'empty'}`}
                title={isUsed ? `Slot ${idx + 1}: In use` : `Slot ${idx + 1}: Available`}
              >
                {isUsed ? (isOverCapacity ? 'LOCKED' : 'USED') : 'FREE'}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Sliding Timeline Bar */}
      <div className="timeline-track-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, color: '#000000' }}>
            Sliding Time Horizon: [{windowSeconds}s ago → Now]
          </span>
          <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#000000' }}>
            Window Size: {windowSeconds} seconds
          </span>
        </div>

        {/* The Timeline Track */}
        <div className="timeline-axis">
          {/* Shaded sliding window background */}
          <div 
            className="timeline-progress-bar" 
            style={{ width: '100%' }}
          />

          {/* Render Request Dots */}
          {userRequests.map((req, i) => {
            const reqTime = new Date(req.timestamp).getTime();
            const ageMs = now - reqTime;
            // Position: 0% is windowStart (windowSeconds ago), 100% is right now
            const percent = Math.min(100, Math.max(0, 100 - (ageMs / windowMs) * 100));
            const isAllowed = req.statusCode < 300;

            return (
              <div
                key={req._id || i}
                className={`timeline-request-dot ${isAllowed ? 'dot-allowed' : 'dot-blocked'}`}
                style={{ left: `${percent}%` }}
                title={`Req #${i + 1}: ${req.statusCode} ${req.endpoint} (${Math.round(ageMs / 1000)}s ago)`}
              />
            );
          })}
        </div>

        {/* Labels below timeline */}
        <div className="timeline-labels">
          <span>- {windowSeconds}s (Window Boundary)</span>
          <span style={{ color: '#000000' }}>- {Math.round(windowSeconds / 2)}s</span>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 900 }}>Now (Incoming Calls)</span>
        </div>
      </div>

      {/* Explanatory Callout */}
      <div style={{
        padding: '1.15rem 1.4rem',
        borderRadius: 'var(--radius-md)',
        background: '#f8fafc',
        border: '2px solid #000000',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '1rem',
        color: '#000000',
        fontWeight: 600
      }}>
        <Info size={22} color="#000000" style={{ flexShrink: 0 }} />
        <div>
          <b>Sliding Window Log Mechanics:</b> Every request's exact millisecond timestamp is preserved in a sorted set.
          As time moves forward, older request dots pass beyond the left boundary (<b>-{windowSeconds}s</b>) and are automatically evicted, restoring quota slots for new traffic.
        </div>
      </div>
    </div>
  );
}
