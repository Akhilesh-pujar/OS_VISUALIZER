import React from 'react';
import { X, ShieldCheck, ShieldAlert, Clock, ArrowRight, Copy, Check } from 'lucide-react';

export default function RequestModal({ log, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBlocked = log.statusCode === 429;
  const isBanned = log.statusCode === 403;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontSize: '1rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              background: isBlocked ? '#fee2e2' : isBanned ? '#f3e8ff' : '#dcfce7',
              color: isBlocked ? 'var(--accent-rose)' : isBanned ? 'var(--accent-purple)' : 'var(--accent-emerald)',
              border: `2px solid ${isBlocked ? 'var(--accent-rose)' : isBanned ? 'var(--accent-purple)' : 'var(--accent-emerald)'}`
            }}>
              {log.statusCode} {log.statusText}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000000' }}>
              {log.method} {log.endpoint}
            </span>
          </div>

          <button className="icon-btn" onClick={onClose} style={{ width: '40px', height: '40px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Rate Limit Analysis Box */}
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: isBlocked ? '#fef2f2' : '#f0fdf4',
            border: `2.5px solid ${isBlocked ? 'var(--accent-rose)' : 'var(--accent-emerald)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            fontSize: '1.05rem'
          }}>
            <div style={{ 
              fontWeight: 900, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '1.15rem',
              color: isBlocked ? 'var(--accent-rose)' : 'var(--accent-emerald)' 
            }}>
              {isBlocked ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
              <span>{isBlocked ? 'Rate Limit Quota Exceeded' : 'Request Processed Successfully'}</span>
            </div>
            <div style={{ color: '#000000', lineHeight: 1.6, fontWeight: 600 }}>
              {log.blockedReason || `Request permitted under '${log.algorithm}' algorithm. ${log.remaining} of ${log.limit} requests remain in the active window.`}
            </div>
          </div>

          {/* Key Telemetry Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid #000000' }}>
              <div style={{ fontSize: '0.85rem', color: '#334155', textTransform: 'uppercase', fontWeight: 800 }}>Client Identity</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#000000', marginTop: '0.35rem' }}>
                {log.userId}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid #000000' }}>
              <div style={{ fontSize: '0.85rem', color: '#334155', textTransform: 'uppercase', fontWeight: 800 }}>Remaining Quota</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: log.remaining === 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '0.35rem' }}>
                {log.remaining ?? 0} / {log.limit || 5}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '2px solid #000000' }}>
              <div style={{ fontSize: '0.85rem', color: '#334155', textTransform: 'uppercase', fontWeight: 800 }}>Algorithm</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#000000', marginTop: '0.35rem' }}>
                {log.algorithm || 'sliding-log'}
              </div>
            </div>
          </div>

          {/* Standard Headers Sent by Gateway */}
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase', color: '#000000', marginBottom: '0.5rem' }}>
              Standard Gateway Headers (RFC 6585)
            </div>
            <div className="code-block" style={{ fontSize: '1rem', color: '#000000', lineHeight: 1.7 }}>
              <div><b>X-RateLimit-Limit:</b> {log.limit || 5}</div>
              <div><b>X-RateLimit-Remaining:</b> {log.remaining ?? 0}</div>
              <div><b>X-RateLimit-Reset:</b> {log.resetTime || 'N/A'} (Epoch ms)</div>
              <div><b>X-RateLimit-Algorithm:</b> {log.algorithm || 'sliding-window-log'}</div>
              <div><b>X-Client-Tier:</b> {log.clientTier || 'Free'}</div>
              {isBlocked && (
                <div style={{ color: 'var(--accent-rose)', fontWeight: 900, marginTop: '4px' }}>
                  Retry-After: {Math.max(1, Math.ceil((new Date(log.resetTime).getTime() - new Date(log.timestamp).getTime()) / 1000))} (seconds)
                </div>
              )}
            </div>
          </div>

          {/* Raw JSON Data */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, textTransform: 'uppercase', color: '#000000' }}>
                Full Telemetry Payload
              </span>
              <button 
                onClick={handleCopy}
                style={{
                  background: '#000000',
                  color: '#ffffff',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="code-block" style={{ maxHeight: '200px', fontSize: '0.92rem' }}>
              {JSON.stringify(log, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
