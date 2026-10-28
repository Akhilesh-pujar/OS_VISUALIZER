import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

const STATES = [
  { id: "new", label: "New", icon: "🌱", x: 80, y: 200, color: "#6d28d9", bg: "#f5f3ff", desc: "The process is currently being created by the OS. Memory structures and initial PCB are allocated in kernel memory.", example: "Double clicking an app icon or calling fork() in C code." },
  { id: "ready", label: "Ready", icon: "⏳", x: 280, y: 80, color: "#1d4ed8", bg: "#eff6ff", desc: "The process is loaded into RAM and is waiting to be assigned to a processor core by the short-term CPU scheduler.", example: "Your code editor is open in the background waiting for CPU time slice." },
  { id: "running", label: "Running", icon: "⚡", x: 520, y: 80, color: "#047857", bg: "#ecfdf5", desc: "Instructions are being executed on a physical CPU core. Only one process can run per CPU core at any given nanosecond.", example: "Active tab rendering frames on the screen right now." },
  { id: "waiting", label: "Waiting", icon: "⏸️", x: 400, y: 260, color: "#b45309", bg: "#fffbeb", desc: "The process is blocked waiting for some event or hardware I/O to occur (disk read, keyboard input, network packet).", example: "Calling read() on a slow SSD — process yields CPU until data arrives." },
  { id: "terminated", label: "Terminated", icon: "💀", x: 700, y: 80, color: "#b91c1c", bg: "#fef2f2", desc: "The process has finished execution via exit() or signal. Its PCB is held until the parent calls wait() to read exit status.", example: "Closing a CLI terminal window — exit code 0 returned to parent." },
];

const TRANSITIONS_DATA = [
  { from: 0, to: 1, label: "admitted", path: "M 132 205 Q 190 130 278 100" },
  { from: 1, to: 2, label: "scheduler dispatch", path: "M 338 88 L 518 88" },
  { from: 2, to: 1, label: "interrupt / time-slice", path: "M 518 100 L 338 100" },
  { from: 2, to: 3, label: "I/O wait", path: "M 545 115 Q 510 200 455 262" },
  { from: 3, to: 1, label: "I/O done", path: "M 365 258 Q 310 230 292 118" },
  { from: 2, to: 4, label: "exit()", path: "M 575 88 L 698 88" },
];

const CYCLE = [0, 1, 2, 3, 1, 2, 4];
const CYCLE_LABELS = [
  "🌱 Process Created (NEW) — Kernel allocates PCB and PID",
  "⏳ Admitted to READY queue — Waiting for CPU dispatch",
  "⚡ Dispatched to CPU (RUNNING) — Instructions executing",
  "⏸️ I/O Request Issued (WAITING) — Process blocks on disk",
  "⏳ I/O Complete (DMA Interrupt) — Moves back to READY",
  "⚡ Dispatched to CPU again (RUNNING) — Second CPU burst",
  "💀 Process Calls exit() (TERMINATED) — Awaiting parent reap"
];

export default function ProcessStatesViz() {
  const [activeState, setActiveState] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1600);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      clearTimeout(timerRef.current);
      return;
    }
    let idx = cycleIdx;
    const run = () => {
      setCycleIdx(idx);
      setActiveState(CYCLE[idx % CYCLE.length]);
      idx = (idx + 1) % CYCLE.length;
      timerRef.current = setTimeout(run, speed);
    };
    timerRef.current = setTimeout(run, speed);
    return () => clearTimeout(timerRef.current);
  }, [playing, speed]);

  const reset = () => {
    setPlaying(false);
    setCycleIdx(0);
    setActiveState(0);
    clearTimeout(timerRef.current);
  };

  const curState = STATES[activeState];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #065f46 0%, #059669 60%, #10b981 100%)",
        borderRadius: 16,
        padding: "1.75rem 2rem",
        marginBottom: "2rem",
        color: "#ffffff"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a7f3d0", marginBottom: "0.3rem" }}>
          Chapter 3 · Topic 2
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#ffffff", lineHeight: 1.2 }}>
          Process States &amp; 5-State Lifecycle Diagram
        </h1>
        <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, margin: 0, lineHeight: 1.6 }}>
          Watch how every process transitions between New, Ready, Running, Waiting, and Terminated driven by scheduling and interrupts.
        </p>
      </div>

      {/* ── Control Ribbon ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setPlaying(!playing)}
            style={{
              background: playing ? "#000000" : "#059669",
              color: "#ffffff",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.5rem 1.25rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {playing ? "⏸ Pause Animation" : "▶ Auto-Play 5-State Lifecycle"}
          </button>
          <button
            onClick={reset}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.5rem 1.25rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            ↺ Reset
          </button>
        </div>

        <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
          Current Phase: {CYCLE_LABELS[cycleIdx]}
        </div>
      </div>

      {/* ── SVG 5-State Visualizer ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 16,
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
      }}>
        <svg viewBox="0 0 820 340" style={{ width: "100%", height: "auto" }}>
          <defs>
            <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#000000" />
            </marker>
          </defs>

          {/* Transitions */}
          {TRANSITIONS_DATA.map((tr, i) => (
            <g key={i}>
              <path d={tr.path} stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#arr)" />
              <text
                x={(i === 0 ? 200 : i === 1 ? 425 : i === 2 ? 425 : i === 3 ? 530 : i === 4 ? 300 : 640)}
                y={(i === 1 ? 75 : i === 2 ? 116 : i === 3 ? 200 : i === 4 ? 220 : i === 5 ? 75 : 145)}
                textAnchor="middle"
                fontSize="14"
                fontWeight="800"
                fill="#000000"
                fontFamily="Lexend"
              >
                {tr.label}
              </text>
            </g>
          ))}

          {/* States */}
          {STATES.map((st, i) => {
            const isCur = activeState === i;
            return (
              <g key={i} onClick={() => { setPlaying(false); setActiveState(i); }} style={{ cursor: "pointer" }}>
                <ellipse
                  cx={st.x + 42}
                  cy={st.y + 22}
                  rx={58}
                  ry={34}
                  fill={isCur ? st.bg : "#ffffff"}
                  stroke={isCur ? st.color : "#000000"}
                  strokeWidth={isCur ? "3.5" : "2"}
                />
                <text x={st.x + 42} y={st.y + 16} textAnchor="middle" fontSize="16" fontFamily="Lexend">
                  {st.icon}
                </text>
                <text x={st.x + 42} y={st.y + 34} textAnchor="middle" fontSize="16" fill="#000000" fontWeight="900" fontFamily="Lexend">
                  {st.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Active State Inspector ── */}
      <div style={{
        background: curState.bg,
        border: `2px solid ${curState.color}`,
        borderRadius: 14,
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "2rem" }}>{curState.icon}</span>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: 0 }}>
              {curState.label} State Deep-Dive
            </h3>
            <p style={{ fontSize: "14px", color: "#000000", margin: "0.2rem 0 0 0" }}>
              {curState.desc}
            </p>
          </div>
        </div>
        <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.6rem 0.9rem", fontSize: "14px", color: "#000000", marginTop: "0.75rem" }}>
          <strong>Real-World Trigger:</strong> {curState.example}
        </div>
      </div>

      {/* ── State Transition Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 14, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#000000", color: "#ffffff", padding: "0.75rem 1.25rem", fontSize: "14px", fontWeight: 800 }}>
          Master Table of Valid State Transitions
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 800 }}>Transition</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 800 }}>Triggering Event</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 800 }}>Practical OS Example</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["New ➔ Ready", "Long-term scheduler admits process", "Application loaded from disk into memory"],
              ["Ready ➔ Running", "Short-term scheduler dispatches", "CPU core assigned to execute instructions"],
              ["Running ➔ Ready", "Timer interrupt / time slice expired", "10ms quantum finished, preempted by OS"],
              ["Running ➔ Waiting", "I/O or event wait syscall", "read() called on disk or recv() on socket"],
              ["Waiting ➔ Ready", "I/O completion interrupt", "DMA controller finishes read, raises interrupt"],
              ["Running ➔ Terminated", "exit() syscall called", "Program returns from main() routine"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #000000" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 800, color: "#000000" }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[1]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
