import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function ThreadingIssues() {
  const [activeIssue, setActiveIssue] = useState("scheduler"); // Set scheduler default or keep forkExec
  const [forkMode, setForkMode] = useState("all"); // "all" or "single"
  const [signalTarget, setSignalTarget] = useState("specific"); // "specific", "all", "dedicated"
  const [cancelMode, setCancelMode] = useState("deferred"); // "async" or "deferred"
  const [animT, setAnimT] = useState(0);
  const [forkStep, setForkStep] = useState(0);

  // 3D Scheduler Activation States
  const [schedStep, setSchedStep] = useState(0); // 0 to 4
  const [schedAutoPlay, setSchedAutoPlay] = useState(false);
  const [schedTilt, setSchedTilt] = useState({ rx: 20, ry: -14 });
  const rafRef = useRef(null);

  useEffect(() => {
    let t = 0;
    const loop = () => { t += 0.015; setAnimT(t); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Auto-advance fork animation
  useEffect(() => {
    const timer = setInterval(() => {
      setForkStep((s) => (s + 1) % 4);
    }, 2500);
    return () => clearInterval(timer);
  }, [forkMode]);

  // Scheduler activation auto-play stepper
  useEffect(() => {
    if (!schedAutoPlay) return;
    const timer = setInterval(() => {
      setSchedStep((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [schedAutoPlay]);

  const ISSUES = [
    { id: "scheduler", name: "① Scheduler Activations & LWP", icon: "⚙️", badge: "3D LWP Architecture", desc: "Communication between kernel and user thread library via LWPs and upcalls to prevent blocking." },
    { id: "forkExec", name: "② fork() & exec() Semantics", icon: "🌱", badge: "Process Duplication", desc: "Does fork() duplicate all threads or only the calling thread? How does exec() interact?" },
    { id: "signals", name: "③ Signal Handling in Threads", icon: "🚨", badge: "Interrupt Routing", desc: "Synchronous vs Asynchronous signals: which thread receives the signal?" },
    { id: "cancellation", name: "④ Thread Cancellation", icon: "🛑", badge: "Target Termination", desc: "Asynchronous Cancellation vs Deferred Cancellation with cancellation points." },
    { id: "tls", name: "⑤ Thread-Local Storage (TLS)", icon: "🔒", badge: "Thread-Specific Data", desc: "Each thread gets its own copy of data. Unlike locals, TLS persists across all function calls." }
  ];

  // Steps for Scheduler Activations 3D simulation
  const SCHED_STEPS = [
    {
      step: 0,
      title: "State 0: Normal Concurrent Execution",
      desc: "User Threads UT-1 and UT-2 are actively running on LWP-1 and LWP-2. Both CPU cores are 100% utilized.",
      ut1State: "running",
      ut2State: "running",
      ut3State: "ready",
      lwp1State: "active",
      lwp2State: "active",
      upcallActive: false,
      bannerBg: "#f0fdf4"
    },
    {
      step: 1,
      title: "State 1: UT-2 Issues Blocking I/O Syscall",
      desc: "Thread UT-2 calls read() on a slow disk file. The OS kernel traps the syscall and prepares to block Kernel Thread KT-2.",
      ut1State: "running",
      ut2State: "blocking",
      ut3State: "ready",
      lwp1State: "active",
      lwp2State: "blocked_io",
      upcallActive: false,
      bannerBg: "#fef2f2"
    },
    {
      step: 2,
      title: "State 2: Kernel Fires UPCALL to User Library",
      desc: "Instead of letting the entire process stall, the kernel allocates an Upcall LWP and sends an UPCALL: 'Thread UT-2 is blocked!'",
      ut1State: "running",
      ut2State: "blocked_kernel",
      ut3State: "ready",
      lwp1State: "active",
      lwp2State: "upcall_firing",
      upcallActive: true,
      bannerBg: "#eff6ff"
    },
    {
      step: 3,
      title: "State 3: Library Reassigns LWP to Ready Thread UT-3",
      desc: "The user-space thread library handler receives the upcall, saves UT-2's state, and dispatches runnable UT-3 onto the LWP! Core 1 stays 100% active!",
      ut1State: "running",
      ut2State: "waiting_io",
      ut3State: "running",
      lwp1State: "active",
      lwp2State: "active_ut3",
      upcallActive: false,
      bannerBg: "#f0fdf4"
    },
    {
      step: 4,
      title: "State 4: I/O Completes ➔ Second Upcall Resumes UT-2",
      desc: "Disk data arrives. Kernel sends a second upcall to notify the library. UT-2 is placed back on the Ready Queue to run when next available.",
      ut1State: "running",
      ut2State: "ready",
      ut3State: "running",
      lwp1State: "active",
      lwp2State: "active_ut3",
      upcallActive: true,
      bannerBg: "#fefce8"
    }
  ];

  const currentSched = SCHED_STEPS[schedStep];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
        {/* Left Column: Issues List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, marginBottom: "0.2rem" }}>Select Threading Issue:</div>
          {ISSUES.map((issue) => {
            const isSelected = activeIssue === issue.id;
            return (
              <button
                key={issue.id}
                onClick={() => setActiveIssue(issue.id)}
                style={{
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  border: "2px solid #000000", borderRadius: 10,
                  padding: "0.9rem 1rem", textAlign: "left", cursor: "pointer",
                  borderLeft: isSelected ? "6px solid #2563eb" : "2px solid #000000",
                  boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.12)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{issue.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: 800, background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>{issue.badge}</span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, marginBottom: "0.2rem" }}>{issue.name}</div>
                <p style={{ fontSize: "14px", lineHeight: 1.45, margin: 0 }}>{issue.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Visualizer Area */}
        <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 14, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ fontSize: "18px", fontWeight: 900, textTransform: "uppercase" }}>
            {ISSUES.find((i) => i.id === activeIssue)?.name} (Silberschatz Ch 4.6)
          </div>

          {/* ──────────────── ISSUE 1: SCHEDULER ACTIVATIONS (3D VISUALIZER) ──────────────── */}
          {activeIssue === "scheduler" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              {/* Stepper Controls Bar */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#f8fafc", border: "2px solid #000000", borderRadius: 10,
                padding: "0.6rem 1rem", flexWrap: "wrap", gap: "0.5rem"
              }}>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button
                    onClick={() => setSchedStep((s) => Math.max(0, s - 1))}
                    disabled={schedStep === 0}
                    style={{ background: schedStep === 0 ? "#e2e8f0" : "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: schedStep === 0 ? "not-allowed" : "pointer" }}
                  >
                    ◀ Prev Step
                  </button>
                  <button
                    onClick={() => setSchedStep((s) => Math.min(SCHED_STEPS.length - 1, s + 1))}
                    disabled={schedStep >= SCHED_STEPS.length - 1}
                    style={{ background: schedStep >= SCHED_STEPS.length - 1 ? "#e2e8f0" : "#2563eb", color: schedStep >= SCHED_STEPS.length - 1 ? "#000000" : "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: schedStep >= SCHED_STEPS.length - 1 ? "not-allowed" : "pointer" }}
                  >
                    Next Step ▶
                  </button>
                  <button
                    onClick={() => setSchedAutoPlay(!schedAutoPlay)}
                    style={{ background: schedAutoPlay ? "#dc2626" : "#16a34a", color: "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
                  >
                    {schedAutoPlay ? "⏸ Pause" : "▶ Auto Play"}
                  </button>
                  <button
                    onClick={() => { setSchedStep(0); setSchedAutoPlay(false); }}
                    style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
                  >
                    ↻ Reset
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800 }}>3D View:</span>
                  <button onClick={() => setSchedTilt({ rx: 20, ry: -14 })} style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 6, padding: "0.25rem 0.5rem", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>Isometric</button>
                  <button onClick={() => setSchedTilt({ rx: 10, ry: 0 })} style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 6, padding: "0.25rem 0.5rem", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}>Front</button>
                </div>
              </div>

              {/* Status Banner */}
              <div style={{
                background: currentSched.bannerBg,
                border: "2px solid #000000",
                borderRadius: 10,
                padding: "0.85rem 1rem",
                fontSize: "14px",
                lineHeight: 1.5
              }}>
                <div style={{ fontSize: "16px", fontWeight: 900, marginBottom: "0.25rem" }}>
                  {currentSched.title}
                </div>
                <div>{currentSched.desc}</div>
              </div>

              {/* ── 3D Viewport ── */}
              <div style={{
                perspective: "1100px",
                background: "#ffffff",
                borderRadius: 14,
                border: "2px solid #000000",
                padding: "1.5rem",
                overflow: "hidden",
                minHeight: "440px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.03)"
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: "760px",
                  transform: `rotateX(${schedTilt.rx}deg) rotateY(${schedTilt.ry}deg)`,
                  transformStyle: "preserve-3d",
                  transition: "transform 0.4s ease"
                }}>
                  <svg viewBox="0 0 760 420" style={{ width: "100%", height: "auto", overflow: "visible" }}>
                    <defs>
                      <marker id="upcallArr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
                      </marker>
                    </defs>

                    {/* ════ 1. USER-SPACE 3D DECK (TOP) ════ */}
                    <g id="user-space-3d">
                      <polygon points="30,20 730,20 700,90 0,90" fill="#eff6ff" stroke="#000000" strokeWidth="2" filter="drop-shadow(0 8px 12px rgba(0,0,0,0.08))" />
                      <polygon points="0,90 700,90 700,98 0,98" fill="#bfdbfe" stroke="#000000" strokeWidth="1" />
                      <text x="35" y="15" fill="#000000" fontSize="13" fontWeight="900" fontFamily="Lexend">
                        1. USER SPACE — Thread Library Scheduler
                      </text>

                      {/* User Thread Tokens */}
                      {[
                        { id: "UT-1", name: "User T1", x: 140, state: currentSched.ut1State },
                        { id: "UT-2", name: "User T2 (I/O)", x: 300, state: currentSched.ut2State },
                        { id: "UT-3", name: "User T3 (Ready)", x: 460, state: currentSched.ut3State },
                        { id: "UT-4", name: "User T4 (Idle)", x: 620, state: "idle" }
                      ].map((t, idx) => {
                        const isBlocked = t.state.includes("block") || t.state.includes("wait");
                        const isRunning = t.state === "running";
                        const fill = isBlocked ? "#fee2e2" : isRunning ? "#f0fdf4" : "#ffffff";
                        return (
                          <g key={idx} transform={`translate(${t.x}, 55)`}>
                            <ellipse cx="0" cy="12" rx="24" ry="8" fill="rgba(0,0,0,0.12)" />
                            <path d="M -22 -6 L 22 -6 L 22 8 A 22 7 0 0 1 -22 8 Z" fill={fill} stroke="#000000" strokeWidth="1.5" />
                            <ellipse cx="0" cy="-6" rx="22" ry="7" fill={fill} stroke="#000000" strokeWidth="2" />
                            <text x="0" y="-2" textAnchor="middle" fontSize="11" fontWeight="900" fill="#000000" fontFamily="Lexend">{t.id}</text>
                            <text x="0" y="24" textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">
                              {t.state === "running" ? "⚡ Running" : isBlocked ? "⏸ Blocked" : "Ready"}
                            </text>
                          </g>
                        );
                      })}
                    </g>

                    {/* ════ 2. LWP FLOATING INTERMEDIATE DECK (MIDDLE) ════ */}
                    <g id="lwp-deck-3d">
                      <polygon points="40,150 720,150 690,220 10,220" fill="#fefce8" stroke="#000000" strokeWidth="2" filter="drop-shadow(0 8px 12px rgba(0,0,0,0.08))" />
                      <polygon points="10,220 690,220 690,228 10,228" fill="#fef08a" stroke="#000000" strokeWidth="1" />
                      <text x="45" y="142" fill="#000000" fontSize="13" fontWeight="900" fontFamily="Lexend">
                        2. LIGHTWEIGHT PROCESSES (LWPs) — Virtual Processors
                      </text>

                      {/* LWP Virtual Core 1 */}
                      <g transform="translate(200, 185)">
                        <rect x="-80" y="-20" width="160" height="40" rx="8" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                        <text x="0" y="-3" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000000" fontFamily="Lexend">LWP-1 (Virtual Core 0)</text>
                        <text x="0" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">Dispatched to UT-1</text>
                      </g>

                      {/* LWP Virtual Core 2 */}
                      <g transform="translate(540, 185)">
                        <rect
                          x="-80"
                          y="-20"
                          width="160"
                          height="40"
                          rx="8"
                          fill={currentSched.lwp2State.includes("blocked") ? "#fee2e2" : "#ffffff"}
                          stroke="#000000"
                          strokeWidth="2"
                        />
                        <text x="0" y="-3" textAnchor="middle" fontSize="12" fontWeight="900" fill={currentSched.lwp2State.includes("blocked") ? "#dc2626" : "#000000"} fontFamily="Lexend">
                          {currentSched.lwp2State.includes("blocked") ? "LWP-2 (BLOCKED ON I/O)" : "LWP-2 (Virtual Core 1)"}
                        </text>
                        <text x="0" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">
                          {schedStep >= 3 ? "Reassigned ➔ UT-3" : schedStep >= 1 ? "Waiting for Disk I/O" : "Dispatched to UT-2"}
                        </text>
                      </g>

                      {/* Connecting beams from user threads to LWPs */}
                      <line x1="140" y1="70" x2="200" y2="165" stroke="#000000" strokeWidth="2.5" />
                      {schedStep < 3 ? (
                        <line x1="300" y1="70" x2="540" y2="165" stroke={schedStep >= 1 ? "#dc2626" : "#000000"} strokeWidth="2.5" strokeDasharray={schedStep >= 1 ? "4 4" : "none"} />
                      ) : (
                        <line x1="460" y1="70" x2="540" y2="165" stroke="#16a34a" strokeWidth="3" />
                      )}
                    </g>

                    {/* ════ 3. UPCALL WAVE ANIMATION ════ */}
                    {currentSched.upcallActive && (
                      <g id="upcall-animation">
                        <path
                          d="M 540 260 Q 640 190 540 120 Q 480 80 460 70"
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="3.5"
                          strokeDasharray="6 6"
                          markerEnd="url(#upcallArr)"
                        >
                          <animate attributeName="strokeDashoffset" values="40;0" dur="0.8s" repeatCount="indefinite" />
                        </path>
                        <g transform="translate(560, 110)">
                          <rect x="0" y="0" width="170" height="36" rx="6" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
                          <text x="85" y="16" textAnchor="middle" fontSize="11" fontWeight="900" fill="#dc2626" fontFamily="Lexend">⚡ KERNEL UPCALL!</text>
                          <text x="85" y="28" textAnchor="middle" fontSize="10" fontWeight="800" fill="#000000" fontFamily="Lexend">"Allocate new LWP for UT-3"</text>
                        </g>
                      </g>
                    )}

                    {/* ════ 4. KERNEL & PHYSICAL CPU DECK (BOTTOM) ════ */}
                    <g id="kernel-deck-3d">
                      <polygon points="30,280 730,280 700,380 0,380" fill="#f0fdf4" stroke="#000000" strokeWidth="2" filter="drop-shadow(0 10px 16px rgba(0,0,0,0.08))" />
                      <polygon points="0,380 700,380 700,388 0,388" fill="#bbf7d0" stroke="#000000" strokeWidth="1" />
                      <text x="35" y="272" fill="#000000" fontSize="13" fontWeight="900" fontFamily="Lexend">
                        3. KERNEL SPACE — Physical CPU Core Dispatch &amp; Hardware Interrupts
                      </text>

                      {/* Physical Core 0 */}
                      <g transform="translate(200, 330)">
                        <rect x="-80" y="-25" width="160" height="50" rx="8" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                        <text x="0" y="-6" textAnchor="middle" fontSize="13" fontWeight="900" fill="#000000" fontFamily="Lexend">CPU CORE 0</text>
                        <text x="0" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">Kernel Thread KT-1 (100% active)</text>
                      </g>

                      {/* Physical Core 1 */}
                      <g transform="translate(540, 330)">
                        <rect
                          x="-80"
                          y="-25"
                          width="160"
                          height="50"
                          rx="8"
                          fill={schedStep === 1 || schedStep === 2 ? "#fee2e2" : "#ffffff"}
                          stroke="#000000"
                          strokeWidth="2"
                        />
                        <text x="0" y="-6" textAnchor="middle" fontSize="13" fontWeight="900" fill={schedStep === 1 || schedStep === 2 ? "#dc2626" : "#000000"} fontFamily="Lexend">CPU CORE 1</text>
                        <text x="0" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">
                          {schedStep === 1 || schedStep === 2 ? "Handling I/O Trap" : "Running LWP-2 (100% active)"}
                        </text>
                      </g>

                      {/* Connect LWPs to Kernel Cores */}
                      <line x1="200" y1="205" x2="200" y2="305" stroke="#000000" strokeWidth="2.5" />
                      <line x1="540" y1="205" x2="540" y2="305" stroke={schedStep >= 1 && schedStep <= 2 ? "#dc2626" : "#000000"} strokeWidth="2.5" strokeDasharray={schedStep >= 1 && schedStep <= 2 ? "4 4" : "none"} />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Explanatory summary card */}
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem", fontSize: "14px", lineHeight: 1.6 }}>
                <strong>Why Scheduler Activations are superior to pure Many-to-One: </strong>
                In a pure user-level thread library, if a thread makes a blocking call, the kernel blocks the entire process because the kernel doesn't know there are other user threads waiting.
                With <strong>Scheduler Activations</strong>, the kernel proactively informs the user library via an <strong>upcall</strong> whenever a thread blocks. The user library can then immediately schedule another runnable thread onto an available LWP, ensuring hardware CPU cores never sit idle!
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 2: FORK & EXEC ──────────────── */}
          {activeIssue === "forkExec" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => { setForkMode("all"); setForkStep(0); }} style={{ flex: 1, background: forkMode === "all" ? "#2563eb" : "#ffffff", color: forkMode === "all" ? "#ffffff" : "#000000", border: "2px solid #000000", borderRadius: 8, padding: "0.5rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
                  Scenario A: fork() duplicates ALL threads
                </button>
                <button onClick={() => { setForkMode("single"); setForkStep(0); }} style={{ flex: 1, background: forkMode === "single" ? "#16a34a" : "#ffffff", color: forkMode === "single" ? "#ffffff" : "#000000", border: "2px solid #000000", borderRadius: 8, padding: "0.5rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
                  Scenario B: fork1() + exec() immediately
                </button>
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
                <svg viewBox="0 0 700 340" style={{ width: "100%", height: "auto" }}>
                  <defs>
                    <marker id="fk-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#000000" />
                    </marker>
                  </defs>

                  <rect x="20" y="20" width="280" height="300" rx="12" fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" />
                  <text x="160" y="45" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">Parent Process (PID 100)</text>

                  {["Thread 1 (main)", "Thread 2 (worker)", "Thread 3 (I/O)"].map((name, i) => {
                    const y = 60 + i * 80;
                    const isCaller = i === 0;
                    return (
                      <g key={i}>
                        <rect x="40" y={y} width="240" height="60" rx="8" fill={isCaller && forkStep >= 1 ? "#fbbf24" : "#ffffff"} stroke={isCaller ? "#2563eb" : "#000000"} strokeWidth={isCaller ? "2.5" : "1.5"} />
                        <text x="60" y={y + 22} fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">{name}</text>
                        <text x="60" y={y + 40} fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                          {isCaller && forkStep >= 1 ? "⚡ Calling fork()..." : "Running normally"}
                        </text>
                        {isCaller && forkStep >= 1 && (
                          <text x="60" y={y + 54} fontSize="11" fontWeight="800" fill="#dc2626" fontFamily="Lexend">
                            {forkMode === "all" ? "fork() → clones entire address space" : "fork1() → only this thread copied"}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {forkStep >= 1 && (
                    <line x1="300" y1="160" x2="380" y2="160" stroke="#000000" strokeWidth="3" markerEnd="url(#fk-arr)" />
                  )}
                  {forkStep >= 1 && (
                    <text x="340" y="148" textAnchor="middle" fontSize="14" fontWeight="900" fill="#dc2626" fontFamily="Lexend">
                      {forkMode === "all" ? "fork()" : "fork1()"}
                    </text>
                  )}

                  {forkStep >= 2 && (
                    <g>
                      <rect x="390" y="20" width="290" height="300" rx="12" fill={forkMode === "single" && forkStep >= 3 ? "#fef9c3" : "#f0fdf4"} stroke="#16a34a" strokeWidth="2.5" />
                      <text x="535" y="45" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                        Child Process (PID 101)
                      </text>

                      {forkMode === "all" ? (
                        ["Thread 1 (copy)", "Thread 2 (copy)", "Thread 3 (copy)"].map((name, i) => {
                          const y = 60 + i * 80;
                          return (
                            <g key={i}>
                              <rect x="410" y={y} width="250" height="60" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5" />
                              <text x="430" y={y + 22} fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">{name}</text>
                              <text x="430" y={y + 40} fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">Running independently in child</text>
                            </g>
                          );
                        })
                      ) : (
                        <g>
                          <rect x="410" y="60" width="250" height="60" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                          <text x="430" y="82" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Thread 1 (only caller)</text>
                          <text x="430" y="100" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                            {forkStep >= 3 ? "⚡ exec() replaces entire image!" : "Sole thread in child process"}
                          </text>

                          {forkStep >= 3 && (
                            <g>
                              <rect x="410" y="140" width="250" height="140" rx="8" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5" />
                              <text x="535" y="170" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">exec("/bin/ls")</text>
                              <text x="535" y="195" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000" fontFamily="Lexend">New program loaded!</text>
                              <text x="535" y="215" textAnchor="middle" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">Old address space destroyed.</text>
                              <text x="535" y="235" textAnchor="middle" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">Duplicating all threads was unnecessary.</text>
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 3: SIGNALS ──────────────── */}
          {activeIssue === "signals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[
                  { id: "specific", label: "Deliver to specific thread" },
                  { id: "all", label: "Deliver to ALL threads" },
                  { id: "dedicated", label: "Dedicated signal handler thread" }
                ].map((opt) => (
                  <button key={opt.id} onClick={() => setSignalTarget(opt.id)} style={{
                    flex: 1, background: signalTarget === opt.id ? "#dc2626" : "#ffffff",
                    color: signalTarget === opt.id ? "#ffffff" : "#000000",
                    border: "2px solid #000000", borderRadius: 8, padding: "0.45rem", fontSize: "14px", fontWeight: 800, cursor: "pointer"
                  }}>{opt.label}</button>
                ))}
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
                <svg viewBox="0 0 700 320" style={{ width: "100%", height: "auto" }}>
                  <defs>
                    <marker id="sig-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                      <path d="M0,0 L0,8 L8,4 z" fill="#dc2626" />
                    </marker>
                  </defs>

                  <rect x="20" y="120" width="120" height="80" rx="10" fill="#fef2f2" stroke="#dc2626" strokeWidth="2.5" />
                  <text x="80" y="152" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">🚨 Signal</text>
                  <text x="80" y="172" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">SIGINT (Ctrl+C)</text>
                  <text x="80" y="190" textAnchor="middle" fontSize="11" fontWeight="700" fill="#000000" fontFamily="Lexend">Asynchronous</text>

                  <rect x="200" y="20" width="480" height="280" rx="12" fill="#f8fafc" stroke="#000000" strokeWidth="2" />
                  <text x="440" y="45" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">Multithreaded Process (3 Threads)</text>

                  {["Thread 1 (UI)", "Thread 2 (Networking)", "Thread 3 (Compute)"].map((name, i) => {
                    const y = 60 + i * 78;
                    const isTarget = signalTarget === "specific" ? i === 1 : signalTarget === "all" ? true : i === 2;
                    const isDedicated = signalTarget === "dedicated" && i === 2;
                    return (
                      <g key={i}>
                        <rect
                          x="230"
                          y={y}
                          width="420"
                          height="62"
                          rx="8"
                          fill={isTarget ? (isDedicated ? "#fef9c3" : "#fecaca") : "#ffffff"}
                          stroke={isTarget ? "#dc2626" : "#000000"}
                          strokeWidth={isTarget ? "3" : "1.5"}
                        />
                        <text x="250" y={y + 22} fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                          {isDedicated ? "★ " : ""}{name}
                        </text>
                        <text x="250" y={y + 40} fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                          {isTarget
                            ? (isDedicated ? "Dedicated signal handler — pthread_sigmask() blocks signals on other threads" : "⚡ Signal received! Running signal handler...")
                            : (signalTarget === "dedicated" ? "Signal blocked via pthread_sigmask()" : "Not targeted")}
                        </text>
                      </g>
                    );
                  })}

                  {signalTarget === "specific" && (
                    <line x1="140" y1="160" x2="230" y2="138" stroke="#dc2626" strokeWidth="3" markerEnd="url(#sig-arr)" />
                  )}
                  {signalTarget === "all" && (
                    <g>
                      <line x1="140" y1="140" x2="230" y2="91" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#sig-arr)" />
                      <line x1="140" y1="160" x2="230" y2="160" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#sig-arr)" />
                      <line x1="140" y1="180" x2="230" y2="238" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#sig-arr)" />
                    </g>
                  )}
                  {signalTarget === "dedicated" && (
                    <line x1="140" y1="160" x2="230" y2="248" stroke="#dc2626" strokeWidth="3" markerEnd="url(#sig-arr)" />
                  )}
                </svg>
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 4: THREAD CANCELLATION ──────────────── */}
          {activeIssue === "cancellation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => setCancelMode("async")} style={{ flex: 1, background: cancelMode === "async" ? "#dc2626" : "#ffffff", color: cancelMode === "async" ? "#ffffff" : "#000000", border: "2px solid #000000", borderRadius: 8, padding: "0.5rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
                  ⚠️ Asynchronous Cancellation (Dangerous)
                </button>
                <button onClick={() => setCancelMode("deferred")} style={{ flex: 1, background: cancelMode === "deferred" ? "#16a34a" : "#ffffff", color: cancelMode === "deferred" ? "#ffffff" : "#000000", border: "2px solid #000000", borderRadius: 8, padding: "0.5rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
                  ✓ Deferred Cancellation (Safe)
                </button>
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
                <svg viewBox="0 0 700 280" style={{ width: "100%", height: "auto" }}>
                  <defs>
                    <marker id="cn-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#dc2626" />
                    </marker>
                  </defs>

                  <rect x="20" y="30" width="160" height="60" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                  <text x="100" y="55" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Cancelling Thread</text>
                  <text x="100" y="73" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">pthread_cancel(tid)</text>

                  <line x1="180" y1="60" x2="240" y2="60" stroke="#dc2626" strokeWidth="3" markerEnd="url(#cn-arr)" />
                  <text x="210" y="50" textAnchor="middle" fontSize="11" fontWeight="900" fill="#dc2626" fontFamily="Lexend">CANCEL</text>

                  <rect x="240" y="20" width="440" height="250" rx="10" fill={cancelMode === "async" ? "#fef2f2" : "#f0fdf4"} stroke={cancelMode === "async" ? "#dc2626" : "#16a34a"} strokeWidth="2.5" />
                  <text x="460" y="45" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">Target Thread Execution Timeline</text>

                  {["mutex_lock()", "Updating shared DB...", "Allocating buffer...", "pthread_testcancel()", "mutex_unlock()"].map((task, i) => {
                    const x = 260 + i * 82;
                    const isCancelPoint = i === 3;
                    const killed = cancelMode === "async" && i === 1;
                    return (
                      <g key={i}>
                        <rect x={x} y="60" width="74" height="130" rx="6"
                          fill={killed ? "#fecaca" : isCancelPoint ? "#bbf7d0" : "#ffffff"}
                          stroke={killed ? "#dc2626" : isCancelPoint ? "#16a34a" : "#000000"}
                          strokeWidth={killed || isCancelPoint ? "2.5" : "1.5"} />
                        <text x={x + 37} y="90" textAnchor="middle" fontSize="10" fontWeight="800" fill="#000000" fontFamily="Lexend" transform={`rotate(-90, ${x + 37}, 130)`}>
                          {task}
                        </text>
                        {killed && (
                          <g>
                            <line x1={x} y1="60" x2={x + 74} y2="190" stroke="#dc2626" strokeWidth="3" />
                            <line x1={x + 74} y1="60" x2={x} y2="190" stroke="#dc2626" strokeWidth="3" />
                            <text x={x + 37} y="210" textAnchor="middle" fontSize="11" fontWeight="900" fill="#dc2626" fontFamily="Lexend">KILLED HERE!</text>
                          </g>
                        )}
                        {cancelMode === "deferred" && isCancelPoint && (
                          <g>
                            <text x={x + 37} y="210" textAnchor="middle" fontSize="11" fontWeight="900" fill="#16a34a" fontFamily="Lexend">Safe exit</text>
                            <text x={x + 37} y="225" textAnchor="middle" fontSize="10" fontWeight="700" fill="#000000" fontFamily="Lexend">Cleanup runs</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 5: TLS ──────────────── */}
          {activeIssue === "tls" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
                <svg viewBox="0 0 700 320" style={{ width: "100%", height: "auto" }}>
                  <rect x="20" y="20" width="660" height="285" rx="12" fill="#f8fafc" stroke="#000000" strokeWidth="2" />
                  <text x="350" y="45" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">Process Address Space</text>

                  <rect x="40" y="55" width="620" height="50" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                  <text x="350" y="78" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    📦 Global/Static Data (Shared by ALL threads): int global_counter = 42
                  </text>
                  <text x="350" y="96" textAnchor="middle" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                    Stored in .data segment — single copy, shared memory, needs mutex for safe access
                  </text>

                  {["Thread A", "Thread B", "Thread C"].map((name, i) => {
                    const x = 50 + i * 210;
                    const tlsValues = [1001, 2002, 3003];
                    const stackVals = ["x=10", "y=20", "z=30"];
                    const colors = ["#2563eb", "#16a34a", "#dc2626"];
                    return (
                      <g key={i}>
                        <rect x={x} y="120" width="190" height="170" rx="8" fill="#ffffff" stroke={colors[i]} strokeWidth="2" />
                        <text x={x + 95} y="142" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">{name}</text>

                        <rect x={x + 10} y="150" width="170" height="46" rx="6" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2" />
                        <text x={x + 95} y="170" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000000" fontFamily="Lexend">🔒 TLS: __thread txn_id</text>
                        <text x={x + 95} y="188" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">= {tlsValues[i]}</text>

                        <rect x={x + 10} y="204" width="170" height="40" rx="6" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
                        <text x={x + 95} y="222" textAnchor="middle" fontSize="12" fontWeight="900" fill="#000000" fontFamily="Lexend">Stack (local): {stackVals[i]}</text>
                        <text x={x + 95} y="238" textAnchor="middle" fontSize="11" fontWeight="700" fill="#000000" fontFamily="Lexend">Only visible inside current fn</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Matrix */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
          THREADING ISSUES &amp; MITIGATION STRATEGIES
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Issue Area</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Core Problem</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Standard OS Solution</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Scheduler Activations", "User library unaware of kernel block", "Upcall mechanism via LWPs"],
              ["fork() / exec()", "Duplicating unwanted threads", "fork1() duplicates only caller; exec() replaces memory"],
              ["Signal Handling", "Which thread receives async signal", "pthread_sigmask() + dedicated handler thread"],
              ["Cancellation", "Shared locks left locked on kill", "Deferred cancellation at cancellation points"],
              ["Thread-Local Storage", "Per-thread global state needed", "__thread (C) / ThreadLocal (Java)"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 4 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900 }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem" }}>{row[1]}</td>
                <td style={{ padding: "0.75rem 1rem" }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}