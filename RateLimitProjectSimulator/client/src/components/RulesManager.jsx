import React, { useState } from 'react';
import { Sliders, Check, Save, RotateCcw, Shield, Plus } from 'lucide-react';

export default function RulesManager({ rules, onUpdateRule, onRefreshRules }) {
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const startEdit = (rule) => {
    setEditingRule(rule.ruleId);
    setFormData({
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
      algorithm: rule.algorithm,
      enabled: rule.enabled
    });
  };

  const handleSave = async (ruleId) => {
    setSaving(true);
    try {
      await onUpdateRule(ruleId, formData);
      setSaveSuccess(ruleId);
      setTimeout(() => setSaveSuccess(null), 2500);
      setEditingRule(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000000', paddingBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#000000' }}>
            <Sliders size={22} color="#000000" />
            <span>API GATEWAY RATE LIMIT POLICIES</span>
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>
            Configurable gateway policies persisted in database. Modify limits, time windows, and algorithms per route.
          </p>
        </div>

        <button 
          className="icon-btn" 
          onClick={onRefreshRules}
          title="Refresh rules from database"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
        {(rules || []).map(rule => {
          const isEditing = editingRule === rule.ruleId;

          return (
            <div 
              key={rule.ruleId}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                border: isEditing ? '2.5px solid #000000' : '2px solid #000000',
                background: isEditing ? '#f8fafc' : '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxSizing: 'border-box',
                minWidth: 0
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#000000' }}>
                    {rule.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#000000', fontFamily: 'var(--font-mono)', fontWeight: 800, marginTop: '3px' }}>
                    Route: {rule.endpointPattern}
                  </div>
                </div>

                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  background: rule.enabled ? 'var(--accent-emerald-bg)' : 'var(--accent-rose-bg)',
                  color: rule.enabled ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: `1.5px solid ${rule.enabled ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`
                }}>
                  {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="control-group">
                      <label className="control-label">Limit (Req)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="100"
                        value={formData.limit} 
                        onChange={(e) => setFormData({ ...formData, limit: Number(e.target.value) })}
                        className="control-input"
                      />
                    </div>
                    <div className="control-group">
                      <label className="control-label">Window (s)</label>
                      <input 
                        type="number" 
                        min="5" 
                        max="300"
                        value={formData.windowSeconds} 
                        onChange={(e) => setFormData({ ...formData, windowSeconds: Number(e.target.value) })}
                        className="control-input"
                      />
                    </div>
                  </div>

                  <div className="control-group">
                    <label className="control-label">Algorithm</label>
                    <select 
                      value={formData.algorithm}
                      onChange={(e) => setFormData({ ...formData, algorithm: e.target.value })}
                      className="control-select"
                    >
                      <option value="sliding-window-log">Sliding Window Log</option>
                      <option value="sliding-window-counter">Sliding Window Counter</option>
                      <option value="token-bucket">Token Bucket</option>
                      <option value="fixed-window">Fixed Window</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button 
                      className="success-btn" 
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => handleSave(rule.ruleId)}
                      disabled={saving}
                    >
                      <Save size={15} />
                      <span>{saving ? 'Saving...' : 'Apply Policy'}</span>
                    </button>
                    <button 
                      className="burst-btn" 
                      onClick={() => setEditingRule(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, 1fr)', 
                    gap: '0.5rem', 
                    background: '#f8fafc', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1.5px solid #000000',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 800 }}>QUOTA</div>
                      <div style={{ fontWeight: 900, color: '#000000', fontFamily: 'var(--font-mono)' }}>{rule.limit} req</div>
                    </div>
                    <div>
                      <div style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 800 }}>WINDOW</div>
                      <div style={{ fontWeight: 900, color: '#000000', fontFamily: 'var(--font-mono)' }}>{rule.windowSeconds}s</div>
                    </div>
                    <div>
                      <div style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 800 }}>ALGO</div>
                      <div style={{ fontWeight: 800, color: '#000000', fontSize: '0.78rem', marginTop: '2px' }}>
                        {rule.algorithm.replace('sliding-window-', 'sw-')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
                      ID: {rule.ruleId}
                    </span>
                    <button 
                      className="burst-btn" 
                      style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                      onClick={() => startEdit(rule)}
                    >
                      Configure Policy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
