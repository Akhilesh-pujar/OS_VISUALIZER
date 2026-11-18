import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Room3DLanding from './Room3DLanding.jsx';

const FONT = "'Times New Roman', Times, serif";

// ── All 5 OS Chapters with exact routes & topic mappings ──────────────────────
const OS_CHAPTERS = [
  {
    key: 'osStructures',
    route: 'os-structures',
    chapterNum: 'Chapter 2',
    title: 'OS Structures',
    subtitle: '& Virtual Machines',
    icon: '🖥️',
    color: '#6d28d9',
    bg: '#faf5ff',
    border: '#c4b5fd',
    cpuBlock: 'hal',
    cpuLabel: 'HAL & Ring 0 Kernel',
    topics: [
      { id: 'simple', label: 'Simple Structure' },
      { id: 'layered', label: 'Layered OS' },
      { id: 'microkernel', label: 'Microkernel' },
      { id: 'modules', label: 'Kernel Modules' },
      { id: 'vmware', label: 'Virtual Machines' },
    ],
  },
  {
    key: 'processConcepts',
    route: 'process-concepts',
    chapterNum: 'Chapter 3',
    title: 'Process Management',
    subtitle: '& Inter-Process Comm',
    icon: '⚙️',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
    cpuBlock: 'pcb',
    cpuLabel: 'PCB & Execution Context',
    topics: [
      { id: 'concept', label: 'PCB & Memory' },
      { id: 'states', label: 'Process 5-States' },
      { id: 'scheduling', label: 'Ready Queues' },
      { id: 'operations', label: 'fork() / exec()' },
      { id: 'ipc', label: 'IPC & Pipes' },
    ],
  },
  {
    key: 'threadsConcepts',
    route: 'threads-concepts',
    chapterNum: 'Chapter 4',
    title: 'Threads & Concurrency',
    subtitle: '& Thread Libraries',
    icon: '🧵',
    color: '#047857',
    bg: '#f0fdf4',
    border: '#86efac',
    cpuBlock: 'smt',
    cpuLabel: 'SMT Cores & Thread Context',
    topics: [
      { id: 'overview', label: 'Thread Overview' },
      { id: 'models', label: 'Kernel vs User' },
      { id: 'libraries', label: 'Pthreads & Win32' },
      { id: 'issues', label: 'Threading Issues (TLS)' },
    ],
  },
  {
    key: 'cpuScheduling',
    route: 'cpu-scheduling',
    chapterNum: 'Chapter 5',
    title: 'CPU Scheduling',
    subtitle: '& Dispatcher Algorithms',
    icon: '⏱️',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    cpuBlock: 'sched',
    cpuLabel: 'Dispatcher & APIC Timer',
    topics: [
      { id: 'fcfs', label: 'FCFS & Convoy' },
      { id: 'sjf', label: 'SJF / SRTF' },
      { id: 'rr', label: 'Round-Robin' },
      { id: 'priority', label: 'Priority & Aging' },
      { id: 'mlfq', label: 'MLFQ Queues' },
    ],
  },
  {
    key: 'synchronizationConcepts',
    route: 'synchronization',
    chapterNum: 'Chapter 6',
    title: 'Process Synchronization',
    subtitle: '& Classic Concurrency Problems',
    icon: '🔒',
    color: '#be185d',
    bg: '#fdf2f8',
    border: '#fbcfe8',
    cpuBlock: 'sync',
    cpuLabel: 'Atomic Bus & Cache Lock',
    topics: [
      { id: 'critical', label: 'Critical Section' },
      { id: 'peterson', label: "Peterson's Solution" },
      { id: 'hardware', label: 'Hardware Atomics' },
      { id: 'semaphores', label: 'Semaphores' },
      { id: 'classic', label: 'Classic Problems' },
    ],
  },
];

const HARDWARE_COMPONENTS = [
  { icon: '💾', label: 'Disk & Secondary Storage', sub: 'Non-volatile storage, block I/O, paging file' },
  { icon: '🧠', label: 'Main Memory (RAM)', sub: 'Physical memory frames, DDR5 bus, MMU paging' },
  { icon: '🔁', label: 'DMA Controller', sub: 'Direct Memory Access, bypasses CPU for bulk I/O' },
  { icon: '⚡', label: 'I/O & Interrupt Controller', sub: 'APIC, IRQ vector lines, hardware trap interrupts' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('3d_room'); // '3d_room' | 'architecture_map'
  const [hoveredChapter, setHoveredChapter] = useState(null);
  const [loadingDest, setLoadingDest] = useState(null);
  const [animTime, setAnimTime] = useState(0);

  // Animation frame for bus pulses
  const rafRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      frame++;
      setAnimTime(frame);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleNavigate = (routePath, topicId = null) => {
    const targetUrl = topicId ? `/${routePath}/${topicId}` : `/${routePath}`;
    setLoadingDest(targetUrl);
    setTimeout(() => {
      navigate(targetUrl);
    }, 450);
  };

  if (viewMode === '3d_room') {
    return <Room3DLanding onOpenArchitecture={() => setViewMode('architecture_map')} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: FONT,
      color: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      boxSizing: 'border-box',
    }}>
      {/* ── Minimalist Clean Loading Transition ── */}
      {loadingDest && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(3px)',
        }}>
          <div style={{
            fontSize: '1.25rem', fontWeight: 700,
            marginBottom: '0.75rem', letterSpacing: '0.02em',
          }}>
            Loading Visualizer…
          </div>
          <div style={{
            width: 220, height: 3, background: '#e2e8f0',
            borderRadius: 3, overflow: 'hidden', border: '1px solid #000000',
          }}>
            <div style={{
              height: '100%', background: '#000000',
              animation: 'progressFill 0.45s ease-in-out forwards',
            }} />
          </div>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Top Header ── */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '1.5px solid #000000', borderRadius: 100,
              padding: '0.25rem 0.85rem', fontSize: '0.72rem', color: '#000000',
              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: '#ffffff', boxShadow: '2px 2px 0px #000000',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#000000', display: 'inline-block' }} />
              Interactive Operating System Architecture Map
            </div>

            <button
              onClick={() => setViewMode('3d_room')}
              style={{
                background: '#000000',
                color: '#ffffff',
                border: '1.5px solid #000000',
                borderRadius: 100,
                padding: '0.25rem 0.95rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: FONT,
                boxShadow: '2px 2px 0px #000000',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>🎮</span> 3D Gaming Rig Room View
            </button>
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 700,
            margin: '0 0 0.35rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            Operating Systems Visual Explorer
          </h1>

          <p style={{
            fontSize: '1rem',
            color: '#374151',
            maxWidth: 680,
            margin: '0 auto',
            lineHeight: 1.5,
          }}>
            Explore the relationship between <strong>Hardware</strong>, the <strong>CPU Socket &amp; Kernel</strong>, and each <strong>OS Software Subsystem</strong>.
            Click any chapter or specific topic below to launch its visualizer.
          </p>
        </div>

        {/* ── Main Unified Architecture Board ── */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 14,
          padding: '1.5rem',
          boxShadow: '5px 5px 0px #000000',
          display: 'grid',
          gridTemplateColumns: '280px 300px 1fr',
          gap: '1.25rem',
          alignItems: 'stretch',
        }}>

          {/* ══════════════════════════════════════════════════════════════════
              COLUMN 1: HARDWARE LAYER (Left)
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            borderRight: '1.5px dashed #cbd5e1',
            paddingRight: '1.25rem',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#000000', textAlign: 'center',
              paddingBottom: '0.6rem', borderBottom: '1.5px solid #000000',
              marginBottom: '0.85rem',
            }}>
              Hardware Layer
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'space-around' }}>
              {HARDWARE_COMPONENTS.map((hw, i) => (
                <div key={hw.label} style={{
                  background: '#fcfcfc',
                  border: '1.5px solid #000000',
                  borderRadius: 8,
                  padding: '0.75rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  boxShadow: '2px 2px 0px #000000',
                }}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{hw.icon}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000', lineHeight: 1.2 }}>
                      {hw.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: 1.3 }}>
                      {hw.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '0.85rem',
              background: '#f8fafc',
              border: '1px solid #000000',
              borderRadius: 6,
              padding: '0.4rem',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#334155',
            }}>
              Physical Electronic Circuits &amp; Peripherals
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              COLUMN 2: MODERN CPU PACKAGE & SOC DIE MAPPING (Center)
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-between',
            padding: '0 0.5rem',
          }}>
            <div style={{
              fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#000000', textAlign: 'center',
              paddingBottom: '0.6rem', borderBottom: '1.5px solid #000000',
              width: '100%', marginBottom: '0.85rem',
            }}>
              CPU Socket &amp; Kernel
            </div>

            {/* ── Modern CPU Package ── */}
            <div style={{
              width: '100%',
              maxWidth: 270,
              background: '#1e293b',
              border: '2.5px solid #000000',
              borderRadius: 12,
              padding: '8px',
              boxShadow: '4px 4px 0px #000000',
              position: 'relative',
              boxSizing: 'border-box',
            }}>
              {/* Golden Pin 1 Triangle in top-left corner */}
              <div style={{
                position: 'absolute', top: 3, left: 3,
                width: 0, height: 0,
                borderTop: '9px solid #eab308',
                borderRight: '9px solid transparent',
              }} />

              {/* Silicon Substrate Board */}
              <div style={{
                background: '#0f172a',
                border: '1.5px solid #334155',
                borderRadius: 8,
                padding: '8px',
                color: '#f8fafc',
                display: 'flex', flexDirection: 'column', gap: '6px',
              }}>
                {/* IHS Heatspreader Laser Inscription */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #334155', paddingBottom: '4px',
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8' }}>
                    CPU DIE MAPPING
                  </span>
                  <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 700 }}>
                    ● 64-BIT RING 0
                  </span>
                </div>

                {/* Over-Die OS Chapter Blocks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {OS_CHAPTERS.map((ch) => {
                    const isHovered = hoveredChapter === ch.key;
                    return (
                      <div
                        key={ch.key}
                        onClick={() => handleNavigate(ch.route)}
                        onMouseEnter={() => setHoveredChapter(ch.key)}
                        onMouseLeave={() => setHoveredChapter(null)}
                        style={{
                          background: isHovered ? ch.bg : '#1e293b',
                          border: isHovered ? `1.5px solid ${ch.color}` : '1px solid #334155',
                          borderRadius: 5,
                          padding: '5px 7px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '12px' }}>{ch.icon}</span>
                          <div>
                            <div style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: isHovered ? '#000000' : '#f8fafc',
                              lineHeight: 1.1,
                            }}>
                              {ch.cpuLabel}
                            </div>
                            <div style={{
                              fontSize: '9px',
                              color: isHovered ? ch.color : '#94a3b8',
                              fontWeight: 700,
                            }}>
                              {ch.chapterNum} Target
                            </div>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          color: isHovered ? ch.color : '#64748b',
                          fontWeight: 700,
                        }}>
                          →
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Bus Indicator */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: '3px', borderTop: '1px solid #334155', fontSize: '9px', color: '#64748b',
                }}>
                  <span>L1/L2/L3 CACHE</span>
                  <span style={{ color: '#38bdf8' }}>MESI SYSTEM BUS</span>
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '11px', fontWeight: 700, color: '#475569',
              textAlign: 'center', marginTop: '0.85rem',
            }}>
              Hardware-Software Interconnect
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              COLUMN 3: SOFTWARE CHAPTERS & DIRECT TOPIC NAVIGATION (Right)
              ══════════════════════════════════════════════════════════════════ */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            borderLeft: '1.5px dashed #cbd5e1',
            paddingLeft: '1.25rem',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingBottom: '0.6rem', borderBottom: '1.5px solid #000000',
              marginBottom: '0.85rem',
            }}>
              <span style={{
                fontSize: '12px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: '#000000',
              }}>
                Software Layer — Chapters
              </span>
              <span style={{
                fontSize: '10px', color: '#64748b', fontWeight: 700,
                background: '#f1f5f9', border: '1px solid #cbd5e1',
                padding: '2px 6px', borderRadius: 4,
              }}>
                Scrollable List (5 Modules)
              </span>
            </div>

            {/* ── Scrollable Right Container ── */}
            <div
              className="os-chapters-scroll"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '440px',
                overflowY: 'auto',
                paddingRight: '0.4rem',
              }}
            >
              {OS_CHAPTERS.map((ch) => {
                const isHovered = hoveredChapter === ch.key;
                return (
                  <div
                    key={ch.key}
                    onMouseEnter={() => setHoveredChapter(ch.key)}
                    onMouseLeave={() => setHoveredChapter(null)}
                    style={{
                      background: isHovered ? '#fafafa' : '#ffffff',
                      border: isHovered ? `2px solid ${ch.color}` : '1.5px solid #000000',
                      borderRadius: 10,
                      padding: '0.75rem 0.9rem',
                      boxShadow: isHovered ? `3px 3px 0px ${ch.color}` : '2px 2px 0px #000000',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    {/* Chapter Title Bar (clickable to open chapter) */}
                    <div
                      onClick={() => handleNavigate(ch.route)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>{ch.icon}</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              fontSize: '14px', fontWeight: 700,
                              color: isHovered ? ch.color : '#000000',
                              lineHeight: 1.2,
                            }}>
                              {ch.title}
                            </span>
                            <span style={{
                              fontSize: '10px', fontWeight: 700,
                              background: ch.bg, border: `1px solid ${ch.border}`,
                              color: ch.color, padding: '1px 5px', borderRadius: 4,
                            }}>
                              {ch.chapterNum}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                            {ch.subtitle}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(ch.route);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: 700,
                          color: isHovered ? ch.color : '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px 6px',
                        }}
                        title="Open Module"
                      >
                        Launch →
                      </button>
                    </div>

                    {/* Direct Topic Pills (Individually Clickable) */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                      paddingTop: '0.2rem',
                      borderTop: '1px dashed #e2e8f0',
                    }}>
                      {ch.topics.map((tp) => (
                        <button
                          key={tp.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(ch.route, tp.id);
                          }}
                          className="os-topic-pill"
                          style={{
                            background: '#ffffff',
                            border: '1px solid #000000',
                            borderRadius: 4,
                            padding: '2px 7px',
                            fontSize: '10px',
                            fontWeight: 700,
                            fontFamily: FONT,
                            color: '#000000',
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#000000';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = '#000000';
                          }}
                        >
                          {tp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: '0.85rem',
              background: '#f8fafc',
              border: '1px solid #000000',
              borderRadius: 6,
              padding: '0.4rem',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#334155',
            }}>
              Runs in Ring 0 (Kernel) &amp; Ring 3 (User Space)
            </div>
          </div>
        </div>

        {/* ── Footer Information Row ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.5rem 0',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#64748b',
        }}>
          <div>
            Operating System Concepts — 10th Edition (Silberschatz, Galvin, Gagne)
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontWeight: 700 }}>
            <span>✓ 5 Chapters Connected</span>
            <span>✓ Direct Topic Routing</span>
            <span>✓ High-Performance Architecture</span>
          </div>
        </div>

      </div>

      {/* ── Custom CSS for Scrollbars & Minimalist Transitions ── */}
      <style>{`
        .os-chapters-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .os-chapters-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .os-chapters-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .os-chapters-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
