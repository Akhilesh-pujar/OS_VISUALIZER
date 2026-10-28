import React, { useState } from 'react';
import LandingPage from './components/LandingPage.jsx';
import OSStructures from './components/OSStructures.jsx';
import ProcessConcepts from './components/ProcessConcepts.jsx';
import App from './App.jsx';

/**
 * RootRouter — top-level navigator between:
 *   'home'         → LandingPage (two buttons)
 *   'rateLimiter'  → Existing Rate Limiter App
 *   'osStructures' → New 3D OS Structures page
 */
export default function RootRouter() {
  const [page, setPage] = useState('home');

  if (page === 'home') {
    return <LandingPage onNavigate={setPage} />;
  }

  if (page === 'osStructures') {
    return <OSStructures onBack={() => setPage('home')} />;
  }

  if (page === 'processConcepts') {
    return <ProcessConcepts onBack={() => setPage('home')} />;
  }

  // rateLimiter
  return (
    <div>
      {/* Thin back-to-home ribbon */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 2rem',
        background: '#ffffff',
        borderBottom: '2px solid #000000',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        zIndex: 9999,
        position: 'sticky', top: 0,
      }}>
        <button
          onClick={() => setPage('home')}
          style={{
            background: '#000000',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '0.45rem 1.1rem',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#000000'; }}
        >
          ← Home Dashboard
        </button>
        <span style={{ fontSize: '0.95rem', color: '#000000', fontWeight: 800 }}>
          API Rate Limiter &amp; Sliding Window Gateway Simulator
        </span>
      </div>
      <App />
    </div>
  );
}
