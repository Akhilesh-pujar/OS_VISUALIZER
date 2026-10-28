import React, { useState, useEffect, useRef } from "react";

/* ─── Shared UI ─────────────────────────────────────────────────────── */
function BackBtn({ onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? "#f3f4f6" : "none", border: "1.5px solid #d1d5db", borderRadius: "8px", padding: "0.38rem 1rem", color: "#374151", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.2s" }}>
      ← Home
    </button>
  );
}
function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: "0.7rem 1.4rem", background: active ? "#111827" : "transparent", border: "none", borderRight: "1px solid #e5e7eb", color: active ? "#fff" : "#6b7280", fontWeight: active ? 700 : 500, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}
function SimBtn({ active, onClick, children, accent }) {
  return (
    <button onClick={onClick} style={{ background: active ? (accent || "#111827") : "#f3f4f6", color: active ? "#fff" : "#374151", border: active ? "none" : "1.5px solid #d1d5db", borderRadius: "8px", padding: "0.4rem 1rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

/* ─── VIZ 1: PROCESS CONCEPT ─────────────────────────────────────────
   • Process State Diagram (5 states, animated token)
   • PCB table  •  Memory layout
────────────────────────────────────────────────────────────────────── */
function ProcessConceptViz({ mode }) {
  const [stateIdx, setStateIdx] = useState(1);
  const [pcbRow, setPcbRow]     = useState(-1);
  const tmr = useRef(null);

  const STATES = [
    { id: "new",        label: "new",        cx: 105, cy: 240, rx: 52, ry: 34 },
    { id: "ready",      label: "ready",      cx: 295, cy: 170, rx: 56, ry: 36 },
    { id: "running",    label: "running",    cx: 525, cy: 170, rx: 62, ry: 36 },
    { id: "waiting",    label: "waiting",    cx: 410, cy: 315, rx: 58, ry: 36 },
    { id: "terminated", label: "terminated", cx: 740, cy: 170, rx: 70, ry: 36 },
  ];
  const CYCLE       = [0, 1, 2, 3, 1, 2, 4];
  const CYCLE_NOTES = [
    "Process CREATED — OS allocates PCB in kernel memory",
    "admitted → enters READY queue (waiting for CPU)",
    "scheduler dispatch → CPU assigned, state = RUNNING",
    "I/O request issued → process moves to WAITING queue",
    "I/O complete → process back to READY queue",
    "scheduler picks again → RUNNING for next CPU burst",
    "exit() called → TERMINATED, PCB freed by OS",
  ];
  const PCB_ROWS = [
    { label: "process state",      blue: true  },
    { label: "process number",     blue: false },
    { label: "program counter",    blue: false },
    { label: "registers",          blue: true  },
    { label: "memory limits",      blue: false },
    { label: "list of open files", blue: true  },
    { label: "· · ·",             blue: false },
  ];

  useEffect(() => {
    if (mode === "idle") { setStateIdx(1); setPcbRow(-1); return; }
    let i = 0;
    const tick = () => {
      setStateIdx(CYCLE[i % CYCLE.length]);
      setPcbRow(i % 7);
      i++;
      tmr.current = setTimeout(tick, mode === "single" ? 1500 : 600);
    };
    tick();
    return () => clearTimeout(tmr.current);
  }, [mode]);

  const note = mode === "idle" ? "Press ⚡ Step-by-Step to animate the lifecycle" : CYCLE_NOTES[CYCLE.indexOf(stateIdx) >= 0 ? CYCLE.indexOf(stateIdx) : 0];

  return (
    <div style={{ width: "100%", maxWidth: 980 }}>
      <div style={{ padding: "0.55rem 1rem", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: "#1d4ed8", marginBottom: "1.25rem" }}>
        → {note}
      </div>
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* State diagram */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.4rem" }}>Diagram of Process State</div>
          <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <svg viewBox="0 0 860 380" style={{ width: "100%", height: "auto" }}>
              <defs>
                <marker id="pc1" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
                </marker>
              </defs>
              {/* Arrows */}
              <path d="M 155 234 Q 215 196 240 183" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#pc1)" />
              <text x="188" y="200" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">admitted</text>

              <path d="M 351 170 L 463 170" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#pc1)" />
              <text x="407" y="162" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">scheduler dispatch</text>

              <path d="M 463 186 L 351 186" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#pc1)" />
              <text x="407" y="200" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">interrupt</text>

              <path d="M 587 170 L 670 170" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#pc1)" />
              <text x="628" y="162" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">exit</text>

              <path d="M 500 202 Q 496 264 466 302" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#pc1)" />
              <text x="536" y="260" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">I/O or event wait</text>

              <path d="M 355 308 Q 322 280 308 215" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#pc1)" />
              <text x="278" y="264" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">I/O or event</text>
              <text x="278" y="278" fontSize="11" fill="#374151" textAnchor="middle" fontFamily="Inter,sans-serif">completion</text>

              {/* Nodes */}
              {STATES.map((s, i) => (
                <g key={s.id}>
                  <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
                    fill={i === stateIdx ? "#bfdbfe" : "#f0f9ff"}
                    stroke={i === stateIdx ? "#2563eb" : "#6b7280"}
                    strokeWidth={i === stateIdx ? 2.5 : 1.5} />
                  <text x={s.cx} y={s.cy + 5} textAnchor="middle" fontSize="15"
                    fontWeight={i === stateIdx ? 700 : 500}
                    fill={i === stateIdx ? "#1d4ed8" : "#111827"}
                    fontFamily="Inter,sans-serif">{s.label}</text>
                </g>
              ))}
              {/* Legend */}
              <rect x={10} y={348} width={840} height={26} fill="#f9fafb" rx={5} />
              <text x={20} y={365} fontSize="12" fill="#374151" fontFamily="Inter,sans-serif">Active state: </text>
              <text x={95} y={365} fontSize="12" fontWeight="700" fill="#1d4ed8" fontFamily="Inter,sans-serif">{STATES[stateIdx]?.label.toUpperCase()}</text>
              <text x={250} y={365} fontSize="12" fill="#374151" fontFamily="Inter,sans-serif">  Blue = current state · Arrows = valid transitions</text>
            </svg>
          </div>
        </div>

        {/* PCB + Memory */}
        <div style={{ width: 200 }}>
          <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.4rem" }}>Process Control Block</div>
          <div style={{ border: "2px solid #374151", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ background: "#374151", color: "#fff", padding: "0.45rem 0", fontSize: "0.82rem", fontWeight: 700, textAlign: "center" }}>PCB</div>
            {PCB_ROWS.map((r, i) => (
              <div key={i} style={{ padding: "0.46rem 0.85rem", fontSize: "0.78rem", textAlign: "center", background: i === pcbRow ? "#bfdbfe" : r.blue ? "#e0f2fe" : "#fff", borderTop: "1px solid #d1d5db", color: "#111827", fontWeight: i === pcbRow ? 700 : 400, transition: "background 0.35s" }}>
                {r.label}
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.69rem", color: "#6b7280", marginTop: "0.4rem", lineHeight: 1.5 }}>Blue = updated on context switch</p>

          <div style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.35rem" }}>Process in Memory</div>
            {[
              { label: "stack  (grows ↓)", bg: "#bfdbfe", b: "#93c5fd" },
              { label: "↕  free space",    bg: "#f9fafb", b: "#e5e7eb" },
              { label: "heap   (grows ↑)", bg: "#bbf7d0", b: "#86efac" },
              { label: "BSS  (uninit)",    bg: "#e9d5ff", b: "#c4b5fd" },
              { label: "data   (init)",    bg: "#fde68a", b: "#fcd34d" },
              { label: "text   (code)",    bg: "#fecaca", b: "#fca5a5" },
            ].map((seg, i) => (
              <div key={i} style={{ padding: "0.3rem 0.5rem", fontSize: "0.69rem", background: seg.bg, border: `1px solid ${seg.b}`, marginBottom: "-1px", color: "#111827" }}>{seg.label}</div>
            ))}
            <div style={{ fontSize: "0.67rem", color: "#9ca3af", marginTop: "0.25rem" }}>0x0000 (low) ↑ → 0xFFFF (high)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── VIZ 2: PROCESS SCHEDULING ─────────────────────────────────────
   Ready Queue → CPU → I/O → back  •  Gantt chart  •  Scheduler types
────────────────────────────────────────────────────────────────────── */
function ProcessSchedulingViz({ mode }) {
  const [phase, setPhase]   = useState(0);
  const [gantt, setGantt]   = useState([]);
  const tmr  = useRef(null);
  const gRef = useRef([]);

  const PROCS = [
    { id: "P1", bg: "#bfdbfe", fg: "#1d4ed8" },
    { id: "P2", bg: "#bbf7d0", fg: "#15803d" },
    { id: "P3", bg: "#fde68a", fg: "#92400e" },
    { id: "P4", bg: "#fecaca", fg: "#991b1b" },
    { id: "P5", bg: "#e9d5ff", fg: "#6d28d9" },
  ];
  const NOTES = [
    "P1 waits in the Ready Queue",
    "Short-term Scheduler dispatches P1 → CPU executes",
    "P1 issues I/O request → blocked, moves to I/O Queue",
    "I/O device processes P1's request",
    "I/O complete → P1 returns to Ready Queue",
  ];

  useEffect(() => {
    if (mode === "idle") { setPhase(0); setGantt([]); gRef.current = []; return; }
    let i = 0;
    const tick = () => {
      const p = i % NOTES.length;
      setPhase(p);
      if (p === 1) {
        const proc = PROCS[Math.floor(i / NOTES.length) % PROCS.length];
        gRef.current = [...gRef.current.slice(-7), proc];
        setGantt([...gRef.current]);
      }
      i++;
      tmr.current = setTimeout(tick, mode === "single" ? 1300 : 420);
    };
    tick();
    return () => clearTimeout(tmr.current);
  }, [mode]);

  const rqOn  = phase === 0 || phase === 4;
  const cpuOn = phase === 1;
  const ioqOn = phase === 2;
  const ioOn  = phase === 3;

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <div style={{ padding: "0.55rem 1rem", background: "#fffbeb", border: "1.5px solid #fcd34d", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: "#92400e", marginBottom: "1.25rem" }}>
        {mode === "idle" ? "Press ⚡ Step-by-Step to animate scheduling" : `→ ${NOTES[phase]}`}
      </div>

      <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.4rem" }}>Representation of Process Scheduling</div>
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <svg viewBox="0 0 820 310" style={{ width: "100%", height: "auto" }}>
          <defs>
            <marker id="ps2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
            </marker>
          </defs>

          {/* → ready queue */}
          <path d="M 15 70 L 138 70" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />

          {/* READY QUEUE */}
          <rect x={140} y={52} width={172} height={36} rx={4}
            fill={rqOn ? "#bfdbfe" : "#f3f4f6"} stroke={rqOn ? "#2563eb" : "#9ca3af"} strokeWidth={rqOn ? 2.5 : 1.5} />
          <text x={226} y={74} textAnchor="middle" fontSize="14" fontWeight="600" fill="#111827" fontFamily="Inter,sans-serif">ready queue</text>

          {/* ready queue → CPU */}
          <path d="M 312 70 L 445 70" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />

          {/* CPU */}
          <ellipse cx={510} cy={70} rx={52} ry={28}
            fill={cpuOn ? "#bfdbfe" : "#f3f4f6"} stroke={cpuOn ? "#2563eb" : "#9ca3af"} strokeWidth={cpuOn ? 2.5 : 1.5} />
          <text x={510} y={75} textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">CPU</text>

          {/* CPU → right rail */}
          <path d="M 562 70 L 808 70" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />
          <line x1={805} y1={70} x2={805} y2={270} stroke="#374151" strokeWidth="1.5" />

          {/* I/O request */}
          <rect x={630} y={134} width={138} height={34} rx={4} fill={ioqOn ? "#fde68a" : "#f3f4f6"} stroke="#9ca3af" strokeWidth="1.5" />
          <text x={699} y={154} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">I/O request</text>
          <path d="M 805 151 L 768 151" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />

          {/* I/O queue */}
          <rect x={340} y={134} width={138} height={34} rx={4} fill={ioqOn ? "#bfdbfe" : "#f3f4f6"} stroke="#9ca3af" strokeWidth="1.5" />
          <text x={409} y={154} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">I/O queue</text>
          <path d="M 630 151 L 478 151" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />

          {/* I/O device */}
          <ellipse cx={224} cy={151} rx={48} ry={27}
            fill={ioOn ? "#bfdbfe" : "#f3f4f6"} stroke={ioOn ? "#2563eb" : "#9ca3af"} strokeWidth={ioOn ? 2.5 : 1.5} />
          <text x={224} y={156} textAnchor="middle" fontSize="14" fontWeight="600" fill="#111827" fontFamily="Inter,sans-serif">I/O</text>
          <path d="M 340 151 L 272 151" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />

          {/* I/O → ready queue (loop back) */}
          <path d="M 224 124 L 224 70 L 140 70" stroke="#374151" strokeWidth="1.5" fill="none" />

          {/* Time slice expired */}
          <rect x={630} y={195} width={138} height={36} rx={4} fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
          <text x={699} y={210} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">time slice</text>
          <text x={699} y={225} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">expired</text>
          <path d="M 805 213 L 768 213" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />
          <path d="M 630 213 L 15 213 L 15 70" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />

          {/* Fork a child */}
          <rect x={630} y={248} width={138} height={36} rx={4} fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
          <text x={699} y={263} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">fork a</text>
          <text x={699} y={277} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">child</text>
          <path d="M 805 266 L 768 266" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />
          <path d="M 630 266 L 388 266" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ps2)" />
          <ellipse cx={316} cy={266} rx={68} ry={22} fill="#f0f9ff" stroke="#9ca3af" strokeWidth="1.5" />
          <text x={316} y={261} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">child</text>
          <text x={316} y={275} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">executes</text>

          {/* wait for interrupt */}
          <rect x={630} y={292} width={138} height={10} rx={4} fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1.5" />
          <text x={699} y={300} textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Inter,sans-serif">wait for an interrupt  →  interrupt occurs  (loop back)</text>
        </svg>
      </div>

      {/* Gantt */}
      {gantt.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.35rem" }}>CPU Execution Gantt Chart</div>
          <div style={{ display: "flex", border: "1.5px solid #d1d5db", borderRadius: 8, overflow: "hidden" }}>
            {gantt.map((g, i) => (
              <div key={i} style={{ flex: 1, padding: "0.5rem 0", textAlign: "center", background: g.bg, fontSize: "0.82rem", fontWeight: 700, color: g.fg, borderRight: "1px solid #d1d5db" }}>{g.id}</div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: "0.67rem", color: "#9ca3af", marginTop: "0.15rem" }}>
            {gantt.map((_, i) => <div key={i} style={{ flex: 1, textAlign: "center" }}>{i * 10}ms</div>)}
          </div>
        </div>
      )}

      {/* Scheduler types */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "1.25rem" }}>
        {[
          { name: "Long-term Scheduler", sub: "(Job Scheduler)", desc: "Selects jobs from the disk pool and admits them to the ready queue. Controls degree of multiprogramming. Runs infrequently." },
          { name: "Short-term Scheduler", sub: "(CPU Scheduler)", desc: "Selects next process from ready queue and allocates CPU. Runs every ~100ms — must be extremely fast." },
          { name: "Medium-term Scheduler", sub: "(Swapper)", desc: "Temporarily removes processes from memory (swap out) to reduce multiprogramming. Later swaps them back in." },
        ].map((s, i) => (
          <div key={i} style={{ border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "0.85rem", background: "#fff" }}>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#111827" }}>{s.name}</div>
            <div style={{ fontSize: "0.71rem", color: "#6b7280", marginBottom: "0.4rem" }}>{s.sub}</div>
            <div style={{ fontSize: "0.75rem", color: "#374151", lineHeight: 1.55 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── VIZ 3: OPERATIONS ON PROCESSES ────────────────────────────────
   CPU Switch P0↔P1 diagram  •  fork/exec/exit/wait cards
────────────────────────────────────────────────────────────────────── */
function OperationsViz({ mode }) {
  const [step, setStep]     = useState(0);
  const [zombie, setZombie] = useState(false);
  const tmr = useRef(null);

  const STEPS = [
    { label: "P0 executing user code on CPU",                     p0: true,  os: "",                       p1: false },
    { label: "Interrupt / syscall → OS saves PCB₀",              p0: false, os: "save state into PCB₀",   p1: false },
    { label: "OS loads PCB₁ → P1 scheduled to run",              p0: false, os: "reload state from PCB₁", p1: false },
    { label: "P1 executing on CPU",                               p0: false, os: "",                       p1: true  },
    { label: "Interrupt → OS saves PCB₁",                         p0: false, os: "save state into PCB₁",   p1: false },
    { label: "OS reloads PCB₀ → P0 resumes",                     p0: false, os: "reload state from PCB₀", p1: false },
    { label: "P0 resumes execution",                              p0: true,  os: "",                       p1: false },
  ];

  useEffect(() => {
    if (mode === "idle") { setStep(0); setZombie(false); return; }
    let i = 0;
    const tick = () => {
      setStep(i % STEPS.length);
      setZombie(mode === "high" && i > 5);
      i++;
      tmr.current = setTimeout(tick, mode === "single" ? 1400 : 480);
    };
    tick();
    return () => clearTimeout(tmr.current);
  }, [mode]);

  const cur = STEPS[step];

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <div style={{ padding: "0.55rem 1rem", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: "#15803d", marginBottom: "1.25rem" }}>
        {mode === "idle" ? "Press ⚡ Step-by-Step to animate the context switch" : `Step ${step + 1}/7 — ${cur.label}`}
      </div>

      <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.4rem" }}>CPU Switch From Process to Process</div>
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <svg viewBox="0 0 820 390" style={{ width: "100%", height: "auto" }}>
          <defs>
            <marker id="op3" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#2563eb" />
            </marker>
          </defs>

          {/* Column headers */}
          <rect x={28} y={10} width={182} height={28} fill="#e0f2fe" rx={4} />
          <text x={119} y={29} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">process P₀</text>
          <rect x={308} y={10} width={204} height={28} fill="#e0f2fe" rx={4} />
          <text x={410} y={29} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">operating system</text>
          <rect x={610} y={10} width={182} height={28} fill="#e0f2fe" rx={4} />
          <text x={701} y={29} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">process P₁</text>

          {/* Timeline lines */}
          <line x1={119} y1={42} x2={119} y2={378} stroke="#374151" strokeWidth="2.5" />
          <line x1={701} y1={42} x2={701} y2={378} stroke="#374151" strokeWidth="2.5" />

          {/* P0 executing arrow */}
          <polygon points="119,48 110,64 128,64" fill={cur.p0 ? "#2563eb" : "#9ca3af"} />
          <line x1={119} y1={64} x2={119} y2={116} stroke={cur.p0 ? "#2563eb" : "#d1d5db"} strokeWidth="3" />
          <text x={46} y={96} fontSize="12" fill={cur.p0 ? "#2563eb" : "#9ca3af"} fontFamily="Inter,sans-serif" fontWeight={cur.p0 ? "700" : "400"}>executing</text>

          {/* interrupt → OS */}
          <text x={264} y={124} fontSize="11" fill="#6b7280" textAnchor="middle" fontFamily="Inter,sans-serif">interrupt or system call</text>
          <path d="M 119 118 Q 252 122 305 136" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#op3)" />

          {/* OS save PCB₀ */}
          <rect x={308} y={139} width={204} height={30} rx={4}
            fill={cur.os === "save state into PCB₀" ? "#bfdbfe" : "#f3f4f6"} stroke="#9ca3af" strokeWidth="1.5" />
          <text x={410} y={158} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">save state into PCB₀</text>
          <text x={410} y={190} textAnchor="middle" fontSize="20" fill="#9ca3af">· · ·</text>

          <text x={46} y={198} fontSize="12" fill="#9ca3af" fontFamily="Inter,sans-serif">idle</text>
          <text x={732} y={198} fontSize="12" fill="#9ca3af" fontFamily="Inter,sans-serif">idle</text>

          {/* OS reload PCB₁ */}
          <rect x={308} y={200} width={204} height={30} rx={4}
            fill={cur.os === "reload state from PCB₁" ? "#bfdbfe" : "#f3f4f6"} stroke="#9ca3af" strokeWidth="1.5" />
          <text x={410} y={219} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">reload state from PCB₁</text>

          {/* OS → P1 */}
          <path d="M 512 222 Q 602 226 696 236" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#op3)" />

          {/* P1 executing */}
          <polygon points="701,240 692,256 710,256" fill={cur.p1 ? "#2563eb" : "#9ca3af"} />
          <line x1={701} y1={256} x2={701} y2={304} stroke={cur.p1 ? "#2563eb" : "#d1d5db"} strokeWidth="3" />
          <text x={732} y={284} fontSize="12" fill={cur.p1 ? "#2563eb" : "#9ca3af"} fontFamily="Inter,sans-serif" fontWeight={cur.p1 ? "700" : "400"}>executing</text>

          {/* P1 interrupt → OS */}
          <text x={556} y={312} fontSize="11" fill="#6b7280" textAnchor="middle" fontFamily="Inter,sans-serif">interrupt or system call</text>
          <path d="M 701 306 Q 568 309 514 322" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#op3)" />

          {/* OS save PCB₁ */}
          <rect x={308} y={326} width={204} height={30} rx={4}
            fill={cur.os === "save state into PCB₁" ? "#bfdbfe" : "#f3f4f6"} stroke="#9ca3af" strokeWidth="1.5" />
          <text x={410} y={345} textAnchor="middle" fontSize="12" fill="#111827" fontFamily="Inter,sans-serif">save state into PCB₁</text>
          <text x={410} y={372} textAnchor="middle" fontSize="20" fill="#9ca3af">· · ·</text>

          {/* P0 resume */}
          <polygon points="119,362 110,376 128,376" fill={cur.p0 ? "#2563eb" : "#9ca3af"} />
          <text x={46} y={376} fontSize="12" fill={cur.p0 ? "#2563eb" : "#9ca3af"} fontFamily="Inter,sans-serif" fontWeight={cur.p0 ? "700" : "400"}>executing</text>
        </svg>
      </div>

      {zombie && (
        <div style={{ marginTop: "0.75rem", padding: "0.7rem 1rem", background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 8, fontSize: "0.82rem", color: "#991b1b", fontWeight: 600 }}>
          🧟 ZOMBIE ALERT — Child exited but parent has not called wait(). PCB entry held in kernel. A fork-bomb without cleanup exhausts the PID table!
        </div>
      )}

      {/* Operation cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
        {[
          { op: "fork()",  bg: "#bfdbfe", desc: "Duplicate parent. Returns 0 to child, child PID to parent. Copy-on-Write pages." },
          { op: "exec()",  bg: "#bbf7d0", desc: "Replace process image with new binary. Same PID, new address space." },
          { op: "exit()",  bg: "#fde68a", desc: "Terminate. Send SIGCHLD to parent. Process becomes zombie until wait() called." },
          { op: "wait()",  bg: "#e9d5ff", desc: "Parent blocks until child exits. Reaps zombie, collects exit status, frees PCB." },
        ].map((o, i) => (
          <div key={i} style={{ background: o.bg, border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "0.75rem" }}>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: "0.92rem", fontWeight: 800, color: "#111827", marginBottom: "0.35rem" }}>{o.op}</div>
            <div style={{ fontSize: "0.74rem", color: "#374151", lineHeight: 1.55 }}>{o.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── VIZ 4: IPC ─────────────────────────────────────────────────────
   Shared Memory  •  Message Passing  •  Pipes — all animated
────────────────────────────────────────────────────────────────────── */
function IPCViz({ mode }) {
  const [t, setT]   = useState(0);
  const raf = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    if (mode === "idle") { setT(0); return; }
    const step = mode === "single" ? 0.007 : 0.022;
    const loop = () => { tRef.current += step; setT(tRef.current); raf.current = requestAnimationFrame(loop); };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [mode]);

  const lerp = (a, b, f) => a + (b - a) * Math.min(1, Math.max(0, f));
  const sm = t % 1;
  const mp = (t + 0.38) % 1;
  const pp = (t + 0.7) % 1;

  return (
    <div style={{ width: "100%", maxWidth: 900 }}>
      <div style={{ padding: "0.55rem 1rem", background: "#f5f3ff", border: "1.5px solid #c4b5fd", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: "#5b21b6", marginBottom: "1.25rem" }}>
        {mode === "idle" ? "Press ⚡ Step-by-Step to animate IPC data flow" : "→ All 3 IPC channels active — watch data packets flow A → B"}
      </div>

      <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.4rem" }}>Interprocess Communication — All 3 Mechanisms</div>
      <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <svg viewBox="0 0 820 390" style={{ width: "100%", height: "auto" }}>
          <defs>
            <marker id="ip4" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#374151" />
            </marker>
          </defs>

          {/* Process A */}
          <rect x={18} y={28} width={122} height={330} rx={8} fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
          <text x={79} y={56} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">Process A</text>
          <text x={79} y={74} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="Inter,sans-serif">(Producer)</text>

          {/* Process B */}
          <rect x={680} y={28} width={122} height={330} rx={8} fill="#f0fdf4" stroke="#15803d" strokeWidth="2" />
          <text x={741} y={56} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827" fontFamily="Inter,sans-serif">Process B</text>
          <text x={741} y={74} textAnchor="middle" fontSize="11" fill="#6b7280" fontFamily="Inter,sans-serif">(Consumer)</text>

          {/* ① Shared Memory */}
          <text x={410} y={108} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d4ed8" fontFamily="Inter,sans-serif">① Shared Memory</text>
          <rect x={228} y={112} width={364} height={44} rx={6} fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="2" />
          <text x={410} y={132} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0369a1" fontFamily="Inter,sans-serif">Kernel-Mapped Shared Region</text>
          <text x={410} y={149} textAnchor="middle" fontSize="11" fill="#0891b2" fontFamily="Inter,sans-serif">shmget()  shmat()  —  ~100 ns  —  zero-copy</text>
          <path d="M 140 134 L 228 134" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ip4)" />
          <path d="M 592 134 L 680 134" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ip4)" />
          <text x={184} y={127} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="Inter,sans-serif">write()</text>
          <text x={636} y={127} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="Inter,sans-serif">read()</text>
          {mode !== "idle" && <circle cx={lerp(140, 680, sm)} cy={134} r={9} fill="#2563eb" opacity="0.85" />}

          {/* ② Message Passing */}
          <text x={410} y={215} textAnchor="middle" fontSize="13" fontWeight="700" fill="#15803d" fontFamily="Inter,sans-serif">② Message Passing</text>
          <rect x={308} y={220} width={204} height={44} rx={6} fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
          <text x={410} y={240} textAnchor="middle" fontSize="13" fontWeight="600" fill="#15803d" fontFamily="Inter,sans-serif">Mailbox / Message Queue</text>
          <text x={410} y={256} textAnchor="middle" fontSize="11" fill="#166534" fontFamily="Inter,sans-serif">send()  receive()  —  ~1–5 µs</text>
          <path d="M 140 242 L 308 242" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ip4)" />
          <path d="M 512 242 L 680 242" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ip4)" />
          <text x={224} y={235} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="Inter,sans-serif">send(msg)</text>
          <text x={596} y={235} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="Inter,sans-serif">receive(msg)</text>
          {mode !== "idle" && <rect x={lerp(140, 680, mp) - 13} y={235} width={26} height={14} rx={4} fill="#22c55e" opacity="0.9" />}

          {/* ③ Pipe */}
          <text x={410} y={318} textAnchor="middle" fontSize="13" fontWeight="700" fill="#92400e" fontFamily="Inter,sans-serif">③ Anonymous Pipe (FIFO)</text>
          <rect x={248} y={323} width={324} height={40} rx={6} fill="#fef9c3" stroke="#fde047" strokeWidth="2" />
          <text x={410} y={340} textAnchor="middle" fontSize="12" fontWeight="600" fill="#854d0e" fontFamily="Inter,sans-serif">Kernel FIFO Buffer  (64 KB default)</text>
          <text x={410} y={356} textAnchor="middle" fontSize="11" fill="#92400e" fontFamily="Inter,sans-serif">pipe()  write(fd[1]) → read(fd[0])  —  ~500 ns</text>
          <path d="M 140 342 L 248 342" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ip4)" />
          <path d="M 572 342 L 680 342" stroke="#374151" strokeWidth="1.5" fill="none" markerEnd="url(#ip4)" />
          <text x={194} y={335} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="Inter,sans-serif">write()</text>
          <text x={626} y={335} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="Inter,sans-serif">read()</text>
          {mode !== "idle" && (
            <polygon
              points={`${lerp(140, 680, pp)},337 ${lerp(140, 680, pp) - 9},350 ${lerp(140, 680, pp) + 9},350`}
              fill="#eab308" opacity="0.9"
            />
          )}

          {/* OS kernel label */}
          <rect x={180} y={376} width={460} height={10} fill="#f3f4f6" rx={3} />
          <text x={410} y={386} textAnchor="middle" fontSize="10" fill="#9ca3af" fontFamily="Inter,sans-serif">All IPC mechanisms are managed by the OS Kernel</text>
        </svg>
      </div>

      {/* Comparison table */}
      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontSize: "0.71rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: "0.35rem" }}>IPC Mechanism Comparison</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.79rem" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              {["Mechanism", "Latency", "Throughput", "Sync Needed?", "Real-world Use"].map(h => (
                <th key={h} style={{ padding: "0.48rem 0.7rem", textAlign: "left", borderBottom: "2px solid #d1d5db", color: "#374151", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Shared Memory",   "~100 ns",  "10+ GB/s", "Yes (mutex/sem)", "Redis, video frames"],
              ["Message Passing", "1–5 µs",   "~200 MB/s","No",              "Android Binder, Mach ports"],
              ["Pipe (anon)",     "~500 ns",  "~1 GB/s",  "Partial",         "Shell pipelines (ls | grep)"],
              ["Socket",          "5–50 µs",  "Varies",   "No",              "HTTP, microservices"],
            ].map((row, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: "0.42rem 0.7rem", color: j === 0 ? "#111827" : "#374151", fontWeight: j === 0 ? 700 : 400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── SECTION CONFIG ──────────────────────────────────────────────── */
const SECTIONS = [
  {
    id: "process-concept", label: "Process Concept", icon: "📋",
    Viz: ProcessConceptViz,
    info: {
      title: "What is a Process?",
      what: "A process is a program in execution. It includes the program text (code), current activity (PC + registers), stack (function calls), data section (global vars), and heap (dynamic memory). The OS tracks every process via a PCB.",
      points: [
        "Program = passive binary on disk. Process = active execution in RAM with its own resources",
        "Each process has a unique PID assigned by the OS kernel",
        "PCB = Process Control Block — the complete OS data structure for a process",
        "5 states: New → Ready → Running → Waiting → Terminated",
        "Context switch saves/restores the entire PCB (~1–10 µs overhead per switch)",
      ],
      table: [
        { a: "new → ready",        b: "admitted by long-term scheduler" },
        { a: "ready → running",    b: "scheduler dispatch (CPU assigned)" },
        { a: "running → waiting",  b: "I/O request or event wait" },
        { a: "waiting → ready",    b: "I/O complete or event fires" },
        { a: "running → ready",    b: "interrupt / time-slice expired" },
        { a: "running → terminated", b: "exit() syscall called" },
      ],
      tableTitle: "State Transitions",
    },
  },
  {
    id: "scheduling", label: "Process Scheduling", icon: "⚙️",
    Viz: ProcessSchedulingViz,
    info: {
      title: "Process Scheduling",
      what: "The CPU scheduler decides which ready process gets the CPU next. Multiprogramming keeps CPU busy by switching between processes whenever one waits for I/O.",
      points: [
        "Ready Queue: linked list of PCBs of all processes waiting for CPU",
        "I/O Queue: separate queue per device — processes wait here for I/O",
        "Context switch: save PCB₀, restore PCB₁ — pure overhead (0 user work)",
        "CPU Burst: duration process runs before next I/O request",
        "I/O-bound vs CPU-bound processes affect optimal scheduling strategy",
      ],
      table: [
        { a: "Long-term",   b: "Job pool → ready queue (infrequent)" },
        { a: "Short-term",  b: "Ready → CPU every ~100ms (very fast)" },
        { a: "Medium-term", b: "Swap processes in/out of RAM (moderate)" },
      ],
      tableTitle: "Scheduler Types",
    },
  },
  {
    id: "operations", label: "Operations on Processes", icon: "🌳",
    Viz: OperationsViz,
    info: {
      title: "Process Operations",
      what: "UNIX creates processes via fork() + exec(). fork() duplicates the parent (Copy-on-Write). exec() loads a new binary. exit() terminates; wait() cleans zombie PCBs.",
      points: [
        "fork(): child is exact copy — returns 0 to child, child PID to parent",
        "Copy-on-Write (CoW): pages shared until a write occurs → cheap fork()",
        "exec(): replaces entire address space with new binary (same PID)",
        "Zombie: child exited, PCB kept until parent calls wait()",
        "Orphan: parent died first — init (PID 1) adopts all orphaned children",
        "Windows: uses CreateProcess() — combines fork+exec in one call",
      ],
      table: [
        { a: "fork()",  b: "Duplicate PCB, CoW page tables, new PID" },
        { a: "exec()",  b: "Load ELF binary, reset PC/stack/heap" },
        { a: "exit()",  b: "Free resources, send SIGCHLD, become zombie" },
        { a: "wait()",  b: "Reap zombie, collect exit code, free PCB" },
      ],
      tableTitle: "Syscall Reference",
    },
  },
  {
    id: "ipc", label: "IPC", icon: "📡",
    Viz: IPCViz,
    info: {
      title: "Interprocess Communication",
      what: "IPC lets cooperating processes exchange data. Two fundamental models: Shared Memory (fastest, needs sync) and Message Passing (structured, no race conditions).",
      points: [
        "Shared Memory: map same physical pages into both processes — zero copy",
        "Message Passing: send()/receive() via OS kernel — 2 copies, no sync needed",
        "Pipe: unidirectional FIFO byte stream — 64 KB kernel buffer",
        "Named Pipe (FIFO): like pipe but accessible via filesystem path",
        "Socket: IPC across machine boundaries — same API as local sockets",
        "Shared memory always needs mutex/semaphore to avoid race conditions",
      ],
      table: [
        { a: "Shared Mem",   b: "shmget() shmat() — ~100ns, 10 GB/s" },
        { a: "Msg Queue",    b: "msgsnd() msgrcv() — ~1-5µs, 200 MB/s" },
        { a: "Pipe",         b: "pipe() write(fd[1]) read(fd[0]) — ~500ns" },
        { a: "Socket",       b: "socket() bind() connect() — 5-50µs" },
      ],
      tableTitle: "Syscalls & Performance",
    },
  },
];

/* ─── MAIN EXPORT ────────────────────────────────────────────────── */
export default function ProcessConcepts({ onBack }) {
  const [active, setActive] = useState("process-concept");
  const [mode,   setMode]   = useState("idle");

  const sec = SECTIONS.find(s => s.id === active);
  const { Viz, info } = sec;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Inter','Segoe UI',sans-serif", color: "#111827", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 2rem", background: "#ffffff", borderBottom: "2px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.07)" }}>
        <BackBtn onClick={onBack} />
        <span style={{ background: "#111827", color: "#fff", borderRadius: "6px", padding: "0.25rem 0.75rem", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Module 2
        </span>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>Process Management — Interactive Visualizer</div>
          <div style={{ fontSize: "0.71rem", color: "#6b7280" }}>Process Concept · Scheduling · Operations · IPC</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 700, color: "#374151" }}>{sec.icon} {sec.label}</div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", background: "#f9fafb", borderBottom: "2px solid #e5e7eb", overflowX: "auto" }}>
        {SECTIONS.map(s => (
          <TabBtn key={s.id} active={active === s.id} onClick={() => { setActive(s.id); setMode("idle"); }}>
            {s.icon} {s.label}
          </TabBtn>
        ))}
      </div>

      {/* ── Controls ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.6rem 1.5rem", background: "#fff", borderBottom: "1.5px solid #e5e7eb" }}>
        <span style={{ fontSize: "0.73rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7280" }}>Animate:</span>
        <SimBtn active={mode === "idle"}   onClick={() => setMode("idle")}   accent="#6b7280">👁 Overview</SimBtn>
        <SimBtn active={mode === "single"} onClick={() => setMode("single")} accent="#2563eb">⚡ Step-by-Step</SimBtn>
        <SimBtn active={mode === "high"}   onClick={() => setMode("high")}   accent="#dc2626">🔥 High Load</SimBtn>
        <div style={{ marginLeft: "auto", fontSize: "0.73rem", color: "#9ca3af", fontStyle: "italic" }}>
          Step-by-Step = trace one process · High Load = see edge cases
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0, overflow: "hidden" }}>

        {/* Visualization */}
        <div style={{ overflowY: "auto", padding: "1.75rem 2rem", background: "#ffffff" }}>
          <Viz mode={mode} />
        </div>

        {/* Info Panel */}
        <div style={{ overflowY: "auto", padding: "1.5rem", background: "#f9fafb", borderLeft: "2px solid #e5e7eb" }}>
          <div style={{ width: 36, height: 4, background: "#111827", borderRadius: 2, marginBottom: "0.8rem" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>{info.title}</h2>

          <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.75, marginBottom: "1rem", padding: "0.7rem", background: "#eff6ff", borderRadius: 8, borderLeft: "3px solid #2563eb" }}>
            {info.what}
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.69rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#374151", marginBottom: "0.45rem" }}>Key Points</div>
            {info.points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "0.45rem", marginBottom: "0.35rem", fontSize: "0.8rem", color: "#374151", lineHeight: 1.55 }}>
                <span style={{ color: "#111827", fontWeight: 800, flexShrink: 0 }}>→</span>{p}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "0.69rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#374151", marginBottom: "0.45rem" }}>{info.tableTitle}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.77rem" }}>
              <tbody>
                {info.table.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb", background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "0.4rem 0.6rem", fontFamily: "'Courier New',monospace", fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>{r.a}</td>
                    <td style={{ padding: "0.4rem 0.6rem", color: "#374151" }}>{r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div style={{ fontSize: "0.69rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", marginBottom: "0.45rem" }}>Other Topics</div>
            {SECTIONS.filter(s => s.id !== active).map(s => (
              <button key={s.id} onClick={() => { setActive(s.id); setMode("idle"); }}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", textAlign: "left", background: "transparent", border: "none", borderRadius: 6, padding: "0.4rem 0.6rem", cursor: "pointer", color: "#6b7280", fontSize: "0.8rem", fontWeight: 500, transition: "all 0.15s", marginBottom: "0.1rem" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e5e7eb"; e.currentTarget.style.color = "#111827"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6b7280"; }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

