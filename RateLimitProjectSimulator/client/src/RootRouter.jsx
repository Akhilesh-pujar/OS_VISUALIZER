import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage.jsx';
import OSStructures from './components/OSStructures.jsx';
import ProcessConcepts from './components/ProcessConcepts.jsx';
import ThreadsConcepts from './components/ThreadsConcepts.jsx';
import CPUSchedulingConcepts from './components/CPUSchedulingConcepts.jsx';
import SynchronizationConcepts from './components/SynchronizationConcepts.jsx';
import App from './App.jsx';

function RateLimiterView() {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 2rem',
        background: '#ffffff',
        borderBottom: '2px solid #000000',
        fontFamily: "'Times New Roman', Times, serif",
        zIndex: 9999,
        position: 'sticky', top: 0,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#000000',
            border: '2px solid #000000',
            borderRadius: '8px',
            padding: '0.45rem 1.1rem',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'all 0.15s',
            fontFamily: "'Times New Roman', Times, serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1e293b'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#000000'; }}
        >
          ← Home Dashboard
        </button>
        <span style={{ fontSize: '0.95rem', color: '#000000', fontWeight: 700 }}>
          API Rate Limiter &amp; Sliding Window Gateway Simulator
        </span>
      </div>
      <App />
    </div>
  );
}

export default function RootRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* Chapter 2: OS Structures */}
        <Route path="/os-structures" element={<OSStructures />} />
        <Route path="/os-structures/:topicId" element={<OSStructures />} />
        
        {/* Chapter 3: Process Concepts */}
        <Route path="/process-concepts" element={<ProcessConcepts />} />
        <Route path="/process-concepts/:topicId" element={<ProcessConcepts />} />
        
        {/* Chapter 4: Threads & Concurrency */}
        <Route path="/threads-concepts" element={<ThreadsConcepts />} />
        <Route path="/threads-concepts/:topicId" element={<ThreadsConcepts />} />
        
        {/* Chapter 5: CPU Scheduling */}
        <Route path="/cpu-scheduling" element={<CPUSchedulingConcepts />} />
        <Route path="/cpu-scheduling/:topicId" element={<CPUSchedulingConcepts />} />
        
        {/* Chapter 6: Process Synchronization */}
        <Route path="/synchronization" element={<SynchronizationConcepts />} />
        <Route path="/synchronization/:topicId" element={<SynchronizationConcepts />} />
        
        {/* Rate Limiter tool */}
        <Route path="/rate-limiter" element={<RateLimiterView />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
