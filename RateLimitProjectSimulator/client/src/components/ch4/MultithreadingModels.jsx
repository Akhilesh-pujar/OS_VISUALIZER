import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function MultithreadingModels() {
  const [activeModel, setActiveModel] = useState("oneToOne"); // "manyToOne", "oneToOne", "manyToMany", "twoLevel"
  const [animTime, setAnimTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [blockedThreadId, setBlockedThreadId] = useState(null); // Simulated blocked thread
  const [loadLevel, setLoadLevel] = useState("normal"); // "normal", "heavy"
  const [tilt3D, setTilt3D] = useState({ rx: 18, ry: -12 });
  const rafRef = useRef(null);

  // Animation frame loop
  useEffect(() => {
    let t = 0;
    const speed = loadLevel === "heavy" ? 0.025 : 0.014;
    const loop = () => {
      if (!isPaused) {
        t += speed;
        setAnimTime(t);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPaused, loadLevel]);

  const MODELS = [
    {
      id: "manyToOne",
      name: "① Many-to-One Model",
      icon: "🔻",
      badge: "User-Level (Green Threads)",
      tagline: "Many User Threads ➔ 1 Kernel Thread",
      desc: "All user-space threads multiplex onto a single kernel thread. Extremely fast context switching in user-space, but if ONE thread performs a blocking I/O call, ALL threads freeze because the single kernel thread is blocked.",
      realWorld: "Ruby green threads, GNU Pth, Python gevent / greenlet, early Solaris.",
      userThreadsCount: 4,
      kernelThreadsCount: 1,
      pros: ["Zero kernel mode traps for thread switching", "Very low memory footprint per thread"],
      cons: ["Entire process freezes on any blocking syscall", "Cannot run in parallel across multiple CPU cores"]
    },
    {
      id: "oneToOne",
      name: "② One-to-One Model",
      icon: "↔️",
      badge: "Modern OS Standard",
      tagline: "1 User Thread ➔ 1 Kernel Thread",
      desc: "Every user thread has a 1:1 dedicated kernel thread dispatched directly by the OS scheduler onto physical CPU cores. High concurrency: a blocking thread does NOT block other threads.",
      realWorld: "Linux NPTL (pthread), Windows Win32 threads, Java standard Virtual Machine threads, macOS.",
      userThreadsCount: 4,
      kernelThreadsCount: 4,
      pros: ["True hardware parallelism across multicore CPUs", "One thread blocking does not stall others"],
      cons: ["Creating each thread incurs kernel memory & syscall overhead", "OS kernel thread limits restrict scalability to thousands"]
    },
    {
      id: "manyToMany",
      name: "③ Many-to-Many Model",
      icon: "🔀",
      badge: "Multiplexed Hybrid",
      tagline: "M User Threads ➔ N Kernel Threads (M > N)",
      desc: "Multiplexes many user-level threads onto a smaller/equal pool of kernel threads. Developers can create millions of lightweight user threads without overwhelming the kernel, while kernel threads run concurrently on CPUs.",
      realWorld: "Go Goroutines (M:N runtime scheduler), Erlang BEAM VM, Java Project Loom (Virtual Threads), Solaris < 9.",
      userThreadsCount: 6,
      kernelThreadsCount: 3,
      pros: ["Best of both worlds: unblocked execution + massive thread count", "Optimal kernel thread pool utilization"],
      cons: ["High implementation complexity inside language runtime and OS", "Requires coordination mechanism (Scheduler Activations)"]
    },
    {
      id: "twoLevel",
      name: "④ Two-Level Model",
      icon: "⭐",
      badge: "Hybrid + Dedicated Pinned Thread",
      tagline: "M:N Multiplexing + Pinned Real-time Core",
      desc: "Combines Many-to-Many multiplexing with the ability to permanently bind critical latency-sensitive user threads (e.g., Audio engine, High-Frequency Trading feed) directly to a dedicated kernel thread.",
      realWorld: "Solaris 8, HP-UX, Real-time Linux with CPU affinity (sched_setaffinity), Audio DSP engines.",
      userThreadsCount: 5,
      kernelThreadsCount: 3,
      pros: ["Critical threads get guaranteed real-time low-latency priority", "General worker tasks remain multiplexed efficiently"],
      cons: ["Complex runtime scheduling logic", "Requires careful CPU core partitioning"]
    }
  ];

  const current = MODELS.find((m) => m.id === activeModel);

  const handleSimulateBlock = (tid) => {
    setBlockedThreadId((prev) => (prev === tid ? null : tid));
  };

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Top Control Bar ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#f8fafc", border: "2px solid #000000", borderRadius: 12,
        padding: "0.85rem 1.25rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase" }}>
            3D ENGINE CONTROLS:
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: isPaused ? "#16a34a" : "#000000",
              color: "#ffffff",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.4rem 0.9rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {isPaused ? "▶ Resume 3D Flow" : "⏸ Pause 3D Flow"}
          </button>
          <button
            onClick={() => setLoadLevel(loadLevel === "normal" ? "heavy" : "normal")}
            style={{
              background: loadLevel === "heavy" ? "#dc2626" : "#ffffff",
              color: loadLevel === "heavy" ? "#ffffff" : "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.4rem 0.9rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {loadLevel === "heavy" ? "🔥 High Traffic Load" : "⚡ Normal Load"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "14px", fontWeight: 800 }}>3D Tilt:</span>
          <button
            onClick={() => setTilt3D({ rx: 24, ry: -18 })}
            style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
          >
            Perspective 1
          </button>
          <button
            onClick={() => setTilt3D({ rx: 12, ry: 0 })}
            style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
          >
            Frontal 3D
          </button>
          <button
            onClick={() => setTilt3D({ rx: 32, ry: -25 })}
            style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
          >
            Isometric
          </button>
        </div>
      </div>

      {/* ── Split Layout: Left Selector + Right 3D Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
        {/* Left Column: Model Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
            Select Multithreading Model:
          </div>
          {MODELS.map((m) => {
            const isSelected = activeModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveModel(m.id);
                  setBlockedThreadId(null);
                }}
                style={{
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 10,
                  padding: "0.9rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  borderLeft: isSelected ? "6px solid #2563eb" : "2px solid #000000",
                  boxShadow: isSelected ? "0 6px 16px rgba(37,99,235,0.18)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>{m.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#000000", background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>
                    {m.badge}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
                  {m.name}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#2563eb", marginBottom: "0.3rem" }}>
                  {m.tagline}
                </div>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.45, margin: 0 }}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Working 3D Animated Visualizer */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
        }}>
          {/* Header Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
                {current.name} — Interactive 3D Architecture
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#2563eb" }}>
                Real-World: {current.realWorld}
              </div>
            </div>
            <div style={{ fontSize: "13px", fontWeight: 800, background: "#f8fafc", border: "1.5px solid #000000", padding: "0.3rem 0.7rem", borderRadius: 8 }}>
              💡 Click any User Thread in the 3D view to simulate Blocking I/O!
            </div>
          </div>

          {/* ── 3D Viewport Container ── */}
          <div style={{
            perspective: "1100px",
            background: "#ffffff",
            borderRadius: 14,
            border: "2px solid #000000",
            padding: "2rem 1.5rem",
            overflow: "hidden",
            position: "relative",
            minHeight: "440px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.03)"
          }}>
            {/* Ambient grid lines in background */}
            <div style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              pointerEvents: "none"
            }} />

            {/* 3D Scene Container with CSS rotation */}
            <div style={{
              width: "100%",
              maxWidth: "760px",
              transform: `rotateX(${tilt3D.rx}deg) rotateY(${tilt3D.ry}deg)`,
              transformStyle: "preserve-3d",
              transition: "transform 0.4s cubic-bezier(0.2,0.8,0.2,1)"
            }}>
              <svg viewBox="0 0 760 410" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                <defs>
                  <marker id="streamArr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#000000" />
                  </marker>
                </defs>

                {/* ══════════════ LAYER 1: 3D USER SPACE FLOATING DECK ══════════════ */}
                <g id="user-deck">
                  {/* 3D Extruded Plate (User Space) */}
                  <polygon
                    points="30,40 730,40 700,120 0,120"
                    fill="#eff6ff"
                    stroke="#000000"
                    strokeWidth="2"
                    filter="drop-shadow(0 8px 12px rgba(0,0,0,0.08))"
                  />
                  {/* 3D Depth Rim */}
                  <polygon points="0,120 700,120 700,128 0,128" fill="#bfdbfe" stroke="#000000" strokeWidth="1" />
                  <text x="35" y="32" fill="#000000" fontSize="14" fontWeight="900" fontFamily="Lexend" letterSpacing="0.06em">
                    3D USER SPACE — User-Level Thread Runtime (High Speed Mappings)
                  </text>

                  {/* Render User Threads on Deck */}
                  {Array.from({ length: current.userThreadsCount }).map((_, i) => {
                    const total = current.userThreadsCount;
                    const step = 600 / (total + 1);
                    const cx = 70 + (i + 1) * step;
                    const cy = 80;
                    const isPinned = activeModel === "twoLevel" && i === total - 1;
                    const isBlocked = blockedThreadId === i;
                    const threadFill = isBlocked ? "#fee2e2" : isPinned ? "#fef9c3" : "#ffffff";
                    const strokeColor = isBlocked ? "#dc2626" : isPinned ? "#ca8a04" : "#2563eb";

                    return (
                      <g
                        key={i}
                        onClick={() => handleSimulateBlock(i)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* 3D Base Shadow */}
                        <ellipse cx={cx} cy={cy + 16} rx="26" ry="10" fill="rgba(0,0,0,0.12)" />
                        
                        {/* Extruded 3D Cylinder Token */}
                        <path
                          d={`M ${cx - 24} ${cy - 8} L ${cx + 24} ${cy - 8} L ${cx + 24} ${cy + 12} A 24 10 0 0 1 ${cx - 24} ${cy + 12} Z`}
                          fill={isBlocked ? "#fca5a5" : isPinned ? "#fde047" : "#bfdbfe"}
                          stroke="#000000"
                          strokeWidth="1.5"
                        />
                        <ellipse
                          cx={cx}
                          cy={cy - 8}
                          rx="24"
                          ry="10"
                          fill={threadFill}
                          stroke="#000000"
                          strokeWidth="2"
                        />

                        {/* Thread Label */}
                        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontWeight="900" fill="#000000" fontFamily="Lexend">
                          {isPinned ? "★ PINNED" : `T${i + 1}`}
                        </text>
                        <text x={cx} y={cy + 28} textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">
                          {isBlocked ? "BLOCKED (I/O)" : isPinned ? "Audio / HFT" : `User Thread ${i + 1}`}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* ══════════════ LAYER 2: 3D PIPELINE CONDUITS & GLOWING DATA PARTICLES ══════════════ */}
                <g id="conduits">
                  {/* Connect user threads to kernel threads based on current active model */}
                  {activeModel === "manyToOne" && (
                    Array.from({ length: 4 }).map((_, i) => {
                      const step = 600 / 5;
                      const ux = 70 + (i + 1) * step;
                      const uy = 100;
                      const kx = 360;
                      const ky = 270;
                      const isProcessFrozen = blockedThreadId !== null;
                      const pPos = (animTime * 0.8 + i * 0.25) % 1;
                      const px = ux + (kx - ux) * pPos;
                      const py = uy + (ky - uy) * pPos;

                      return (
                        <g key={i}>
                          <line
                            x1={ux}
                            y1={uy}
                            x2={kx}
                            y2={ky}
                            stroke={isProcessFrozen ? "#dc2626" : "#000000"}
                            strokeWidth={isProcessFrozen ? "2.5" : "2"}
                            strokeDasharray={isProcessFrozen ? "5 5" : "none"}
                          />
                          {!isProcessFrozen && !isPaused && (
                            <circle cx={px} cy={py} r="6" fill="#2563eb" stroke="#000000" strokeWidth="1.5" />
                          )}
                        </g>
                      );
                    })
                  )}

                  {activeModel === "oneToOne" && (
                    Array.from({ length: 4 }).map((_, i) => {
                      const step = 600 / 5;
                      const ux = 70 + (i + 1) * step;
                      const uy = 100;
                      const kx = ux;
                      const ky = 270;
                      const isThisBlocked = blockedThreadId === i;
                      const pPos = (animTime * 0.9 + i * 0.25) % 1;
                      const py = uy + (ky - uy) * pPos;

                      return (
                        <g key={i}>
                          <line
                            x1={ux}
                            y1={uy}
                            x2={kx}
                            y2={ky}
                            stroke={isThisBlocked ? "#dc2626" : "#000000"}
                            strokeWidth="3"
                            strokeDasharray={isThisBlocked ? "4 4" : "none"}
                          />
                          {!isThisBlocked && !isPaused && (
                            <circle cx={kx} cy={py} r="6" fill="#16a34a" stroke="#000000" strokeWidth="1.5" />
                          )}
                        </g>
                      );
                    })
                  )}

                  {activeModel === "manyToMany" && (
                    Array.from({ length: 6 }).map((_, uIdx) => {
                      const uStep = 600 / 7;
                      const ux = 70 + (uIdx + 1) * uStep;
                      const uy = 100;
                      const kTarget = uIdx % 3;
                      const kStep = 600 / 4;
                      const kx = 100 + (kTarget + 1) * kStep;
                      const ky = 270;
                      const isThisBlocked = blockedThreadId === uIdx;
                      const pPos = (animTime * 0.8 + uIdx * 0.16) % 1;
                      const px = ux + (kx - ux) * pPos;
                      const py = uy + (ky - uy) * pPos;

                      return (
                        <g key={uIdx}>
                          <line
                            x1={ux}
                            y1={uy}
                            x2={kx}
                            y2={ky}
                            stroke={isThisBlocked ? "#dc2626" : "#000000"}
                            strokeWidth="2"
                            strokeDasharray={isThisBlocked ? "4 4" : "none"}
                          />
                          {!isThisBlocked && !isPaused && (
                            <circle cx={px} cy={py} r="5" fill="#7c3aed" stroke="#000000" strokeWidth="1.5" />
                          )}
                        </g>
                      );
                    })
                  )}

                  {activeModel === "twoLevel" && (
                    <g>
                      {[0, 1, 2, 3].map((uIdx) => {
                        const uStep = 600 / 6;
                        const ux = 70 + (uIdx + 1) * uStep;
                        const uy = 100;
                        const kTarget = uIdx % 2;
                        const kStep = 600 / 4;
                        const kx = 100 + (kTarget + 1) * kStep;
                        const ky = 270;
                        const isThisBlocked = blockedThreadId === uIdx;
                        const pPos = (animTime * 0.8 + uIdx * 0.2) % 1;
                        const px = ux + (kx - ux) * pPos;
                        const py = uy + (ky - uy) * pPos;
                        return (
                          <g key={uIdx}>
                            <line x1={ux} y1={uy} x2={kx} y2={ky} stroke={isThisBlocked ? "#dc2626" : "#000000"} strokeWidth="2" strokeDasharray={isThisBlocked ? "4 4" : "none"} />
                            {!isThisBlocked && !isPaused && (
                              <circle cx={px} cy={py} r="5" fill="#7c3aed" stroke="#000000" strokeWidth="1.5" />
                            )}
                          </g>
                        );
                      })}
                      {(() => {
                        const ux = 70 + 5 * (600 / 6);
                        const uy = 100;
                        const kx = 100 + 3 * (600 / 4);
                        const ky = 270;
                        const pPos = (animTime * 1.2) % 1;
                        const py = uy + (ky - uy) * pPos;
                        return (
                          <g>
                            <line x1={ux} y1={uy} x2={kx} y2={ky} stroke="#ca8a04" strokeWidth="4" />
                            {!isPaused && (
                              <circle cx={kx} cy={py} r="7" fill="#eab308" stroke="#000000" strokeWidth="2" />
                            )}
                          </g>
                        );
                      })()}
                    </g>
                  )}
                </g>

                {/* ══════════════ LAYER 3: 3D KERNEL SPACE & MULTICORE CPU PLATFORM ══════════════ */}
                <g id="kernel-deck">
                  {/* 3D Extruded Plate (Kernel Space) */}
                  <polygon
                    points="30,240 730,240 700,340 0,340"
                    fill="#f0fdf4"
                    stroke="#000000"
                    strokeWidth="2"
                    filter="drop-shadow(0 10px 16px rgba(0,0,0,0.08))"
                  />
                  <polygon points="0,340 700,340 700,348 0,348" fill="#bbf7d0" stroke="#000000" strokeWidth="1" />
                  <text x="35" y="232" fill="#000000" fontSize="14" fontWeight="900" fontFamily="Lexend" letterSpacing="0.06em">
                    3D KERNEL SPACE &amp; PHYSICAL MULTICORE CPU DISPATCH
                  </text>

                  {/* Render Kernel Threads & CPU Cores */}
                  {activeModel === "manyToOne" && (
                    <g>
                      <g transform="translate(360, 290)">
                        <rect x="-80" y="-30" width="160" height="60" rx="10" fill={blockedThreadId !== null ? "#fee2e2" : "#ffffff"} stroke="#000000" strokeWidth="2.5" />
                        <text x="0" y="-10" textAnchor="middle" fontSize="14" fontWeight="900" fill={blockedThreadId !== null ? "#dc2626" : "#000000"} fontFamily="Lexend">
                          {blockedThreadId !== null ? "⚠️ CORE 0 FROZEN" : "CPU CORE 0"}
                        </text>
                        <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">
                          {blockedThreadId !== null ? "Blocked by Thread " + (blockedThreadId + 1) : "Kernel Thread #1 (Active)"}
                        </text>
                        <text x="0" y="24" textAnchor="middle" fontSize="11" fontWeight="700" fill="#000000" fontFamily="Lexend">
                          {blockedThreadId !== null ? "All user threads stalled!" : "100% CPU dispatch"}
                        </text>
                      </g>
                    </g>
                  )}

                  {activeModel === "oneToOne" && (
                    Array.from({ length: 4 }).map((_, i) => {
                      const step = 600 / 5;
                      const cx = 70 + (i + 1) * step;
                      const isThisBlocked = blockedThreadId === i;
                      return (
                        <g key={i} transform={`translate(${cx}, 290)`}>
                          <rect x="-55" y="-30" width="110" height="60" rx="8" fill={isThisBlocked ? "#fee2e2" : "#ffffff"} stroke="#000000" strokeWidth="2" />
                          <text x="0" y="-10" textAnchor="middle" fontSize="13" fontWeight="900" fill={isThisBlocked ? "#dc2626" : "#000000"} fontFamily="Lexend">
                            {isThisBlocked ? "⚠️ STALLED" : `CORE ${i}`}
                          </text>
                          <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">
                            {`Kernel T${i + 1}`}
                          </text>
                          <text x="0" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#000000" fontFamily="Lexend">
                            {isThisBlocked ? "Blocked on I/O" : "Running parallel"}
                          </text>
                        </g>
                      );
                    })
                  )}

                  {activeModel === "manyToMany" && (
                    Array.from({ length: 3 }).map((_, i) => {
                      const step = 600 / 4;
                      const cx = 100 + (i + 1) * step;
                      return (
                        <g key={i} transform={`translate(${cx}, 290)`}>
                          <rect x="-70" y="-30" width="140" height="60" rx="8" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                          <text x="0" y="-10" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000000" fontFamily="Lexend">
                            {`CPU CORE ${i}`}
                          </text>
                          <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">
                            {`Pool Worker KT-${i + 1}`}
                          </text>
                          <text x="0" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#000000" fontFamily="Lexend">
                            Multiplexing Goroutines
                          </text>
                        </g>
                      );
                    })
                  )}

                  {activeModel === "twoLevel" && (
                    <g>
                      {[0, 1].map((i) => {
                        const step = 600 / 4;
                        const cx = 100 + (i + 1) * step;
                        return (
                          <g key={i} transform={`translate(${cx}, 290)`}>
                            <rect x="-65" y="-30" width="130" height="60" rx="8" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                            <text x="0" y="-10" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000000" fontFamily="Lexend">
                              {`CORE ${i} (Pool)`}
                            </text>
                            <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">
                              {`Pool Worker ${i + 1}`}
                            </text>
                            <text x="0" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#000000" fontFamily="Lexend">
                              M:N multiplexed
                            </text>
                          </g>
                        );
                      })}
                      {(() => {
                        const cx = 100 + 3 * (600 / 4);
                        return (
                          <g transform={`translate(${cx}, 290)`}>
                            <rect x="-75" y="-30" width="150" height="60" rx="8" fill="#fef9c3" stroke="#000000" strokeWidth="2.5" />
                            <text x="0" y="-10" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000000" fontFamily="Lexend">
                              ★ CORE 2 (PINNED)
                            </text>
                            <text x="0" y="10" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000000" fontFamily="Lexend">
                              Dedicated Real-time
                            </text>
                            <text x="0" y="24" textAnchor="middle" fontSize="10" fontWeight="800" fill="#000000" fontFamily="Lexend">
                              Zero Latency / No switch
                            </text>
                          </g>
                        );
                      })()}
                    </g>
                  )}
                </g>

                {/* 3D Floor Shadow */}
                <ellipse cx="360" cy="385" rx="340" ry="16" fill="rgba(0,0,0,0.06)" />
              </svg>
            </div>
          </div>

          {/* ── Interactive State Notice ── */}
          <div style={{
            background: blockedThreadId !== null
              ? (activeModel === "manyToOne" ? "#fef2f2" : "#fffbeb")
              : "#f0fdf4",
            border: "2px solid #000000",
            borderRadius: 10,
            padding: "0.85rem 1.25rem",
            fontSize: "14px",
            lineHeight: 1.5,
            color: "#000000"
          }}>
            {blockedThreadId !== null ? (
              activeModel === "manyToOne" ? (
                <span>
                  🚨 <strong>PROCESS DEADLOCK DETECTED!</strong> User Thread {blockedThreadId + 1} issued a blocking I/O system call.
                  Because the <strong>Many-to-One</strong> model only maps to a single kernel thread, the entire process and ALL other user threads are completely frozen!
                </span>
              ) : (
                <span>
                  ⚡ <strong>ISOLATED BLOCKING:</strong> User Thread {blockedThreadId + 1} issued a blocking call.
                  In <strong>{current.name}</strong>, other threads continue running normally on available CPU cores without interruption!
                </span>
              )
            ) : (
              <span>
                ✓ <strong>All systems operational:</strong> Threads are streaming smoothly through the 3D runtime pipeline. Click any User Thread on the top deck to simulate a blocking I/O syscall and observe the difference!
              </span>
            )}
          </div>

          {/* Pros vs Cons Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                ✓ Advantages (Pros)
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                {current.pros.map((p, i) => (
                  <li key={i}><strong>{p}</strong></li>
                ))}
              </ul>
            </div>

            <div style={{ background: "#fef2f2", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                ✗ Disadvantages (Cons)
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                {current.cons.map((c, i) => (
                  <li key={i}><strong>{c}</strong></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Model Matrix Comparison Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
          MULTITHREADING MODELS FEATURE MATRIX
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Model</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Concurrency on Multicore</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Blocking I/O Behavior</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Kernel Overhead</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Dominant Industry Usage</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Many-to-One", "No (1 core only)", "Entire process blocks", "Zero kernel overhead", "Ruby green threads, GNU Pth"],
              ["One-to-One", "Full hardware parallel", "Independent (others run)", "1 kernel thread per user thread", "Modern Standard (Linux, Windows, macOS)"],
              ["Many-to-Many", "True concurrency", "Non-blocking (pools)", "Low to moderate", "Go Goroutines, Java Project Loom, Erlang"],
              ["Two-Level", "True concurrency + Priority", "Non-blocking", "Moderate", "Specialized real-time (Solaris 8, Audio DSP)"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 3 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#000000" }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[1]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[2]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[3]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}