import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, ShieldCheck, UserX, Plus, Trash2, Clock, Zap } from 'lucide-react';

export default function AbuseConsole({ bans, onAddBan, onRemoveBan, abuseIncidents }) {
  const [targetUser, setTargetUser] = useState('');
  const [banReason, setBanReason] = useState('Manual Administrative Quarantine');
  const [banDuration, setBanDuration] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUser.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddBan({
        identifierType: 'userId',
        identifierValue: targetUser.trim(),
        reason: banReason,
        durationSeconds: Number(banDuration)
      });
      setTargetUser('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#000000' }}>
            <AlertOctagon size={22} color="var(--accent-rose)" />
            <span>ABUSE PREVENTION &amp; FIREWALL CONSOLE</span>
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
            Automated DDoS mitigation, rapid micro-burst detection, and client blacklisting.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--accent-rose-bg)',
          border: '2px solid var(--accent-rose)',
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.9rem',
          fontWeight: 800,
          color: 'var(--accent-rose)'
        }}>
          <ShieldAlert size={16} />
          <span>Active Bans: {(bans || []).length}</span>
        </div>
      </div>

      {/* Two Column Layout: Manual Ban Form & Security Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        {/* Manual Blacklist Form */}
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
            <UserX size={18} color="var(--accent-rose)" />
            <span>Add Client to Blacklist</span>
          </div>

          <div className="control-group">
            <label className="control-label">User ID or Client IP</label>
            <input 
              type="text" 
              placeholder="e.g. user_attacker or 192.168.1.100"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="control-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="control-group">
              <label className="control-label">Quarantine Duration</label>
              <select 
                value={banDuration} 
                onChange={(e) => setBanDuration(Number(e.target.value))}
                className="control-select"
              >
                <option value={30}>30 Seconds</option>
                <option value={60}>1 Minute</option>
                <option value={300}>5 Minutes</option>
                <option value={3600}>1 Hour</option>
              </select>
            </div>

            <div className="control-group">
              <label className="control-label">Ban Reason</label>
              <input 
                type="text" 
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="control-input"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="danger-btn" 
            style={{ justifyContent: 'center', padding: '0.85rem', marginTop: '0.5rem' }}
            disabled={isSubmitting}
          >
            <Plus size={16} />
            <span>{isSubmitting ? 'Enforcing...' : 'Enforce Security Quarantine'}</span>
          </button>
        </form>

        {/* Protection Mechanics Summary */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', boxSizing: 'border-box' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000' }}>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
            <span>Active Automated Protection Rules</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem', color: '#1e293b' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <Zap size={18} color="#000000" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <b style={{ color: '#000000' }}>Micro-Burst DDoS Sentinel:</b> Triggers an immediate alert if any client fires &gt; 7 requests within 350ms.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <Clock size={18} color="var(--accent-rose)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <b style={{ color: '#000000' }}>Consecutive 429 Escalation:</b> If an agent ignores 429 warnings and generates 6 consecutive throttled requests within 25s, it is automatically banned for 45s.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <AlertOctagon size={18} color="var(--accent-purple)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <b style={{ color: '#000000' }}>Gateway Firewall Gatekeeper:</b> All requests from blacklisted entities are dropped with HTTP 403 Forbidden before reaching upstream controllers.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blacklist Table */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.85rem', color: '#000000' }}>
          Active Blacklisted Entities
        </div>

        <div className="traffic-table-container">
          <table className="traffic-table">
            <thead>
              <tr>
                <th>Identifier</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Banned At</th>
                <th>Status / Expiry</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(!bans || bans.length === 0) ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: '#334155', fontWeight: 700, fontSize: '1rem' }}>
                    No active bans. All clients are in good standing.
                  </td>
                </tr>
              ) : (
                bans.map(ban => {
                  const now = Date.now();
                  const expiresTime = new Date(ban.expiresAt).getTime();
                  const isExpired = now >= expiresTime;
                  const secondsLeft = Math.max(0, Math.ceil((expiresTime - now) / 1000));

                  return (
                    <tr key={ban._id}>
                      <td className="mono-text" style={{ fontWeight: 800, color: 'var(--accent-rose)' }}>
                        {ban.identifierValue}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', textTransform: 'uppercase', color: '#000000', fontWeight: 800 }}>
                          {ban.identifierType}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                        {ban.reason}
                      </td>
                      <td className="mono-text" style={{ fontSize: '0.88rem', color: '#334155' }}>
                        {new Date(ban.bannedAt).toLocaleTimeString()}
                      </td>
                      <td>
                        {isExpired ? (
                          <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Expired</span>
                        ) : (
                          <span className="mono-text" style={{ fontSize: '0.92rem', color: 'var(--accent-rose)', fontWeight: 800 }}>
                            Expires in {secondsLeft}s
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="burst-btn"
                          style={{ padding: '4px 10px', fontSize: '0.82rem', marginLeft: 'auto' }}
                          onClick={() => onRemoveBan(ban._id)}
                        >
                          Remove Ban
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
    </div>
  );
}
