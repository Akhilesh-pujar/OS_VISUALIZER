import React from 'react';
import { Shield, Activity, RefreshCw, Database, Radio, Layers, Sliders, AlertOctagon, BookOpen } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, socketConnected, dbStatus, onResetState, resetting }) {
  return (
    <header className="top-header">
      <div className="header-content">
        {/* Brand */}
        <div className="brand-wrapper">
          <div className="brand-logo-icon">
            <Shield size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="brand-title">PULSEGUARD</span>
              <span className="brand-badge">MERN Gateway</span>
            </div>
            <div style={{ fontSize: '0.92rem', color: '#1e293b', fontWeight: 700, marginTop: '2px' }}>
              API Rate Limiting, Sliding Windows &amp; Abuse Prevention
            </div>
          </div>
        </div>

        {/* Status Pills & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Socket.io Live Status */}
          <div className="live-indicator" title="Socket.io Real-Time Connection">
            <div className={`pulse-dot ${socketConnected ? '' : 'disconnected'}`} 
                 style={{ 
                   backgroundColor: socketConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                   border: '1.5px solid #000000'
                 }} />
            <span>{socketConnected ? 'LIVE GATEWAY FEED' : 'RECONNECTING'}</span>
          </div>

          {/* Database Mode Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.92rem',
            fontWeight: 800,
            background: '#ffffff',
            border: '2px solid #000000',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            color: '#000000'
          }} title={`DB Mode: ${dbStatus?.mode || 'in-memory-mongo'}`}>
            <Database size={16} color="#000000" />
            <span>
              {dbStatus?.mode === 'mongodb' ? 'MongoDB (Local)' : 'In-Memory Mongo'}
            </span>
          </div>

          {/* Emergency Reset Button */}
          <button 
            className="danger-btn" 
            onClick={onResetState}
            disabled={resetting}
            title="Reset all client sliding windows, buckets, and active bans"
            style={{ fontSize: '1rem', padding: '0.65rem 1.25rem' }}
          >
            <RefreshCw size={16} className={resetting ? 'spin-anim' : ''} />
            <span>Reset Quotas</span>
          </button>
        </div>
      </div>
    </header>
  );
}
