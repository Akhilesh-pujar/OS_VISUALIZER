import React, { useEffect, useRef } from 'react';

export default function LandingPage({ onNavigate }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    particlesRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2.5 + 0.8,
      color: Math.random() > 0.5 ? '59,130,246' : '139,92,246',
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,130,220,${0.08 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},0.3)`;
        ctx.fill();
      });
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrameRef.current); window.removeEventListener('resize', resize); };
  }, []);

  const MODULES = [
    // {
    //   tag: 'Live Tool', tagColor: '#0369a1', tagBg: '#e0f2fe', tagBorder: '#bae6fd',
    //   num: null, icon: '⚡', iconBg: 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
    //   title: 'Rate Limiter & API Gateway',
    //   desc: 'Real-time simulator for Token Bucket, Sliding Window & Fixed Window algorithms. Monitor live traffic, detect abuse, manage firewall rules.',
    //   topics: ['Token Bucket', 'Sliding Window', 'Fixed Window', 'WebSocket', 'Abuse Detection'],
    //   topicColor: '#0369a1', topicBg: '#e0f2fe', topicBorder: '#bae6fd',
    //   cta: 'Launch Dashboard', ctaColor: '#0ea5e9',
    //   border: '#bae6fd', grad: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)',
    //   shadow: '0 20px 60px rgba(14,165,233,0.18)', key: 'rateLimiter',
    // },
    {
      tag: 'Module 1', tagColor: '#6d28d9', tagBg: '#ede9fe', tagBorder: '#ddd6fe',
      num: '01', icon: '🖥️', iconBg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)',
      title: 'OS Structures & Virtual Machines',
      desc: 'Animated 3D walkthroughs of OS kernel architectures — Simple, Layered, Microkernel, Modules — plus Virtual Machines & VMware.',
      topics: ['Simple Structure', 'Layered OS', 'Microkernel', 'Modules', 'VMs', 'VMware'],
      topicColor: '#6d28d9', topicBg: '#ede9fe', topicBorder: '#ddd6fe',
      cta: 'Explore Module 1', ctaColor: '#7c3aed',
      border: '#ddd6fe', grad: 'linear-gradient(135deg,#faf5ff 0%,#ede9fe 100%)',
      shadow: '0 20px 60px rgba(124,58,237,0.18)', key: 'osStructures',
    },
    {
      tag: 'Module 2', tagColor: '#1d4ed8', tagBg: '#dbeafe', tagBorder: '#bfdbfe',
      num: '02', icon: '⚙️', iconBg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)',
      title: 'Process Management',
      desc: 'Interactive visualizations for Process Concept, Process Scheduling (ready queues, Gantt charts), Operations on Processes (fork/exec/context switch), and IPC (Shared Memory, Message Passing, Pipes).',
      topics: ['Process Concept', 'PCB & States', 'Scheduling', 'Context Switch', 'fork / exec', 'IPC'],
      topicColor: '#1d4ed8', topicBg: '#dbeafe', topicBorder: '#bfdbfe',
      cta: 'Explore Module 2', ctaColor: '#2563eb',
      border: '#bfdbfe', grad: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)',
      shadow: '0 20px 60px rgba(37,99,235,0.18)', key: 'processConcepts',
    },
  ];

  return (
    <div style={{
      position: 'relative', minHeight: '100vh',
      background: 'linear-gradient(145deg,#f8faff 0%,#eef2ff 40%,#faf5ff 100%)',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '-8%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(147,197,253,0.35) 0%,transparent 70%)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', bottom: '-5%', right: '-5%', width: 550, height: 550, background: 'radial-gradient(circle,rgba(196,181,253,0.3) 0%,transparent 70%)', borderRadius: '50%', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '3rem 2rem 4rem', width: '100%', maxWidth: 1100 }}>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', border: '1.5px solid #bae6fd', borderRadius: '100px', padding: '0.4rem 1.1rem', fontSize: '0.78rem', color: '#0369a1', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', boxShadow: '0 2px 12px rgba(14,165,233,0.12)', marginBottom: '2rem' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', display: 'inline-block', animation: 'blink 1.8s infinite' }} />
          Interactive CS Learning Platform
        </div>

        <h1 style={{ fontSize: 'clamp(2.2rem,5.5vw,4.4rem)', fontWeight: 900, lineHeight: 1.08, marginBottom: '0.9rem', color: '#0f172a', letterSpacing: '-0.03em' }}>
          Systems &amp; Architecture<br />
          <span style={{ background: 'linear-gradient(90deg,#2563eb,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Visual Explorer</span>
        </h1>

        <p style={{ fontSize: '1rem', color: '#475569', maxWidth: 560, margin: '0 auto 3rem', lineHeight: 1.75 }}>
          Learn OS concepts through <strong style={{ color: '#2563eb' }}>live animated visualizers</strong>. Pick a module below to get started.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', justifyContent: 'flex-start' }}>
          <div style={{ width: 32, height: 3, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', borderRadius: 2 }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b' }}>Table of Contents</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem', textAlign: 'left' }}>
          {MODULES.map(m => (
            <button
              key={m.key}
              id={`btn-${m.key}`}
              onClick={() => onNavigate(m.key)}
              style={{ background: m.grad, border: `1.5px solid ${m.border}`, borderRadius: '20px', padding: '2rem 1.85rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)', textAlign: 'left', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.015)'; e.currentTarget.style.boxShadow = m.shadow; e.currentTarget.style.borderColor = m.ctaColor; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = m.border; }}
            >
              {m.num && (
                <div style={{ position: 'absolute', top: 12, right: 18, fontSize: '3.5rem', fontWeight: 900, color: m.tagBg, lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.04em' }}>{m.num}</div>
              )}
              <div style={{ width: 52, height: 52, borderRadius: '14px', background: m.iconBg, border: `1.5px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{m.icon}</div>
              <div style={{ display: 'inline-block', background: m.tagBg, border: `1px solid ${m.tagBorder}`, borderRadius: '100px', padding: '0.18rem 0.75rem', fontSize: '0.68rem', color: m.tagColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.85rem' }}>{m.tag}</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>{m.title}</h2>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: 1.7, marginBottom: '1.25rem' }}>{m.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1.5rem' }}>
                {m.topics.map(t => (
                  <span key={t} style={{ background: m.topicBg, border: `1px solid ${m.topicBorder}`, borderRadius: '6px', padding: '0.18rem 0.6rem', fontSize: '0.7rem', color: m.topicColor, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: m.ctaColor, fontSize: '0.88rem', fontWeight: 700 }}>
                {m.cta}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', marginTop: '3.5rem', borderTop: '1.5px solid #e2e8f0', paddingTop: '2.5rem', flexWrap: 'wrap' }}>
          {[{ val: '2', label: 'OS Modules' }, { val: '10+', label: 'Visualizers' }, { val: '3', label: 'Rate Algorithms' }, { val: 'Live', label: 'Animations' }].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </div>
  );
}
