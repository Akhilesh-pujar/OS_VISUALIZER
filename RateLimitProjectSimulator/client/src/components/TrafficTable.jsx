import React, { useState } from 'react';
import { Eye, Trash2, Filter, Search, ShieldAlert, Check, X, ArrowUpRight } from 'lucide-react';

export default function TrafficTable({ logs, onClearLogs, onInspectRequest }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = (logs || []).filter(log => {
    // Status filter
    if (filterStatus === 'allowed' && log.statusCode >= 300) return false;
    if (filterStatus === 'blocked' && log.statusCode !== 429) return false;
    if (filterStatus === 'banned' && log.statusCode !== 403) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const userMatch = (log.userId || '').toLowerCase().includes(q);
      const epMatch = (log.endpoint || '').toLowerCase().includes(q);
      const algMatch = (log.algorithm || '').toLowerCase().includes(q);
      return userMatch || epMatch || algMatch;
    }

    return true;
  });

  const getStatusBadge = (statusCode) => {
    if (statusCode < 300) {
      return (
        <span className="status-badge s200">
          <Check size={14} />
          <span>{statusCode} OK</span>
        </span>
      );
    }
    if (statusCode === 429) {
      return (
        <span className="status-badge s429">
          <X size={14} />
          <span>429 THROTTLED</span>
        </span>
      );
    }
    return (
      <span className="status-badge s403">
        <ShieldAlert size={14} />
        <span>{statusCode} BANNED</span>
      </span>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Table Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '2px solid #000000', paddingBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#000000' }}>
            <span>LIVE GATEWAY INGRESS STREAM</span>
            <span style={{ 
              fontSize: '0.92rem', 
              background: '#000000', 
              padding: '3px 12px', 
              borderRadius: 'var(--radius-full)', 
              color: '#ffffff',
              fontWeight: 800
            }}>
              {filteredLogs.length} events
            </span>
          </h3>
          <p style={{ fontSize: '1rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
            Real-time telemetry stream showing allowed, throttled, and banned HTTP calls.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
            <input 
              type="text" 
              placeholder="Filter user or route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: 'var(--radius-md)',
                color: '#000000',
                fontSize: '0.95rem',
                fontWeight: 700,
                padding: '0.65rem 1rem 0.65rem 2.4rem',
                width: '210px'
              }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'allowed', label: 'Allowed (200)' },
              { id: 'blocked', label: 'Blocked (429)' },
              { id: 'banned', label: 'Banned (403)' }
            ].map(f => (
              <button
                key={f.id}
                className={`chip-btn ${filterStatus === f.id ? 'active' : ''}`}
                onClick={() => setFilterStatus(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Clear Logs Button */}
          <button 
            className="icon-btn" 
            onClick={onClearLogs} 
            title="Clear request history"
          >
            <Trash2 size={16} color="var(--accent-rose)" />
          </button>
        </div>
      </div>

      {/* Traffic Table */}
      <div className="traffic-table-container">
        <table className="traffic-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Status</th>
              <th>Method & Route</th>
              <th>Client / User</th>
              <th>Tier</th>
              <th>Algorithm</th>
              <th>Quota Left</th>
              <th>Cooldown</th>
              <th>Latency</th>
              <th>Abuse Flag</th>
              <th style={{ textAlign: 'right' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '3.5rem', color: '#334155', fontSize: '1.1rem', fontWeight: 700 }}>
                  No traffic captured yet. Dispatch a call using the Request Simulator!
                </td>
              </tr>
            ) : (
              filteredLogs.slice(0, 40).map((log, index) => {
                const date = new Date(log.timestamp);
                const timeStr = date.toTimeString().split(' ')[0] + '.' + String(date.getMilliseconds()).padStart(3, '0');
                return (
                  <tr 
                    key={log._id || index} 
                    className={index === 0 ? 'flash-row' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onInspectRequest(log)}
                    title="Click row to inspect headers and response payload"
                  >
                    <td className="mono-text" style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                      {timeStr}
                    </td>
                    <td>{getStatusBadge(log.statusCode)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 900, 
                          color: '#000000',
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1.5px solid #000000',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {log.method}
                        </span>
                        <span className="mono-text" style={{ fontSize: '0.95rem', color: '#000000', fontWeight: 800 }}>
                          {log.endpoint}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        fontWeight: 800, 
                        color: log.userId.includes('hacker') ? 'var(--accent-rose)' : '#000000',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.95rem'
                      }}>
                        {log.userId}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#ffffff',
                        border: '1.5px solid #000000',
                        color: '#000000'
                      }}>
                        {log.clientTier || 'Free'}
                      </span>
                    </td>
                    <td>
                      <span className="mono-text" style={{ fontSize: '0.88rem', color: '#1e293b' }}>
                        {log.algorithm || 'sliding-log'}
                      </span>
                    </td>
                    <td>
                      <span className="mono-text" style={{ 
                        fontWeight: 900, 
                        color: log.remaining === 0 ? 'var(--accent-rose)' : '#000000',
                        fontSize: '1.05rem'
                      }}>
                        {log.remaining ?? 0} / {log.limit || 5}
                      </span>
                    </td>
                    <td className="mono-text" style={{ fontSize: '0.92rem' }}>
                      {log.statusCode === 429 ? (
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 900, background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent-rose)' }}>
                          retry in {Math.max(1, Math.ceil((new Date(log.resetTime).getTime() - new Date(log.timestamp).getTime()) / 1000))}s
                        </span>
                      ) : (
                        <span style={{ color: '#64748b' }}>0s</span>
                      )}
                    </td>
                    <td className="mono-text" style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                      {log.latencyMs || 4}ms
                    </td>
                    <td>
                      {log.abuseDetected ? (
                        <span style={{
                          fontSize: '0.82rem',
                          fontWeight: 900,
                          color: 'var(--accent-rose)',
                          background: '#fee2e2',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid var(--accent-rose)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <ShieldAlert size={12} />
                          <span>{log.abuseType || 'BURST'}</span>
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="icon-btn" 
                        style={{ marginLeft: 'auto', width: '36px', height: '36px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectRequest(log);
                        }}
                        title="Inspect HTTP payload and rate limiting headers"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
