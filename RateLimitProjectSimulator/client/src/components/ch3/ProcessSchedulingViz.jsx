import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function ProcessSchedulingViz() {
  const [selectedView, setSelectedView] = useState("queues"); // "queues", "schedulers", "switch"
  const [mode, setMode] = useState("single"); // "idle", "single", "high"
  const [phase, setPhase] = useState(0);
  const [gantt, setGantt] = useState([]);
  const [csStep, setCsStep] = useState(0);
  const tmrRef = useRef(null);
  const gRef = useRef([]);

  const PROCS = [
    { id: "P1", bg: "#bfdbfe", fg: "#000000" },
    { id: "P2", bg: "#bbf7d0", fg: "#000000" },
    { id: "P3", bg: "#fde68a", fg: "#000000" },
    { id: "P4", bg: "#fecaca", fg: "#000000" },
    { id: "P5", bg: "#e9d5ff", fg: "#000000" },
  ];

  const NOTES = [
    "P1 waits in the Ready Queue in main memory",
    "Short-term Scheduler dispatches P1 ➔ CPU core begins execution",
    "P1 issues an I/O request ➔ blocked, moved to I/O Queue",
    "I/O device controller processes P1's request (DMA transfer)",
    "I/O completes (interrupt raised) ➔ P1 returns to Ready Queue"
  ];

  // Scheduling queue animation loop
  useEffect(() => {
    if (mode === "idle") {
      setPhase(0);
      setGantt([]);
      gRef.current = [];
      return;
    }
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
      tmrRef.current = setTimeout(tick, mode === "single" ? 1400 : 480);
    };
    tick();
    return () => clearTimeout(tmrRef.current);
  }, [mode]);

  const rqActive = phase === 0 || phase === 4;
  const cpuActive = phase === 1;
  const ioqActive = phase === 2;
  const ioDevActive = phase === 3;

  const VIEWS = [
    {
      id: "queues",
      title: "① Representation of Process Scheduling",
      icon: "⚙️",
      badge: "Textbook Queue Model",
      desc: "Full Silberschatz model: Ready Queue, CPU execution, I/O Queue, time slice expirations, and child forks."
    },
    {
      id: "schedulers",
      title: "② 3 Schedulers: Long, Short & Medium",
      icon: "⏱️",
      badge: "Operating Planes",
      desc: "Compare Long-Term (Job Scheduler), Short-Term (CPU Scheduler), and Medium-Term (Swapper)."
    },
    {
      id: "switch",
      title: "③ CPU Context Switch Timeline",
      icon: "🔄",
      badge: "Save PCB₀ ➔ Load PCB₁",
      desc: "Timeline of CPU switching from Process P₀ to Process P₁ through the operating system kernel."
    }
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Mode Control Buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#000000" }}>
          ANIMATE:
        </span>
        <button
          onClick={() => setMode("idle")}
          style={{
            background: mode === "idle" ? "#000000" : "#ffffff",
            color: mode === "idle" ? "#ffffff" : "#000000",
            border: "2px solid #000000",
            borderRadius: 8,
            padding: "0.45rem 1.1rem",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          👁 Overview
        </button>
        <button
          onClick={() => setMode("single")}
          style={{
            background: mode === "single" ? "#2563eb" : "#ffffff",
            color: mode === "single" ? "#ffffff" : "#000000",
            border: "2px solid #000000",
            borderRadius: 8,
            padding: "0.45rem 1.1rem",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          ⚡ Step-by-Step
        </button>
        <button
          onClick={() => setMode("high")}
          style={{
            background: mode === "high" ? "#dc2626" : "#ffffff",
            color: mode === "high" ? "#ffffff" : "#000000",
            border: "2px solid #000000",
            borderRadius: 8,
            padding: "0.45rem 1.1rem",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          🔥 High Load
        </button>
      </div>

      {/* ── Dynamic Status Banner ── */}
      <div style={{
        padding: "0.75rem 1.25rem",
        background: "#fffbeb",
        border: "2px solid #000000",
        borderRadius: 10,
        fontSize: "14px",
        fontWeight: 800,
        color: "#000000",
        marginBottom: "1.5rem"
      }}>
        {mode === "idle" ? "— Press ⚡ Step-by-Step to trace processes traversing scheduling queues" : `➔ ${NOTES[phase]}`}
      </div>

      {/* ── Split Layout: Left Selector + Right Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "stretch", marginBottom: "2rem" }}>
        {/* Left Column: Model Selection List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
            Select Scheduling View:
          </div>
          {VIEWS.map((v) => {
            const isSelected = selectedView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setSelectedView(v.id)}
                style={{
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  border: `2px solid #000000`,
                  borderRadius: 10,
                  padding: "0.9rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 6px 16px rgba(0,0,0,0.12)" : "none",
                  borderLeft: isSelected ? "6px solid #2563eb" : "2px solid #000000",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{v.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000", background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>
                    {v.badge}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#000000", marginBottom: "0.2rem" }}>
                  {v.title}
                </div>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.45, margin: 0 }}>
                  {v.desc}
                </p>
              </button>
            );
          })}

          {/* Quick Concept Highlights Box */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 10, padding: "1rem", marginTop: "0.5rem" }}>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.4rem" }}>
              Core Queue Axioms:
            </div>
            <ul style={{ margin: 0, padding: "0 0 0 1.1rem", fontSize: "14px", color: "#000000", lineHeight: 1.6 }}>
              <li><strong>Ready Queue:</strong> Linked list of PCBs in RAM waiting for CPU.</li>
              <li><strong>I/O Queue:</strong> Blocked processes waiting for device drivers.</li>
              <li><strong>Multiprogramming:</strong> CPU switches to another process when current process yields for I/O.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Visualizer */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.85rem" }}>
              {selectedView === "queues" ? "REPRESENTATION OF PROCESS SCHEDULING" : selectedView === "schedulers" ? "SCHEDULER LEVELS & DEGREE OF MULTIPROGRAMMING" : "CPU SWITCH FROM PROCESS TO PROCESS"}
            </div>

            {/* View 1: Silberschatz Queue Model */}
            {selectedView === "queues" && (
              <div>
                <div style={{ border: "2px solid #000000", borderRadius: 12, background: "#ffffff", boxShadow: "0 6px 20px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "1rem" }}>
                  <svg viewBox="0 0 830 320" style={{ width: "100%", height: "auto" }}>
                    <defs>
                      <marker id="ps-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L8,3 z" fill="#000000" />
                      </marker>
                    </defs>

                    {/* Entrance to Ready Queue */}
                    <path d="M 15 70 L 138 70" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />

                    {/* READY QUEUE */}
                    <rect
                      x="140"
                      y="50"
                      width="175"
                      height="40"
                      rx="6"
                      fill={rqActive ? "#bfdbfe" : "#f8fafc"}
                      stroke="#000000"
                      strokeWidth={rqActive ? "3.5" : "2"}
                    />
                    <text x="227" y="75" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                      ready queue
                    </text>

                    {/* Ready queue ➔ CPU */}
                    <path d="M 315 70 L 445 70" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />

                    {/* CPU */}
                    <ellipse
                      cx="510"
                      cy="70"
                      rx="54"
                      ry="30"
                      fill={cpuActive ? "#bbf7d0" : "#f8fafc"}
                      stroke="#000000"
                      strokeWidth={cpuActive ? "3.5" : "2"}
                    />
                    <text x="510" y="76" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                      CPU
                    </text>

                    {/* CPU ➔ Right distribution rail */}
                    <path d="M 564 70 L 805 70" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />
                    <line x1="805" y1="70" x2="805" y2="270" stroke="#000000" strokeWidth="2" />

                    {/* Branch 1: I/O Request ➔ I/O Queue ➔ I/O Device ➔ loop */}
                    <rect x="630" y="132" width="138" height="34" rx="4" fill={ioqActive ? "#fef08a" : "#ffffff"} stroke="#000000" strokeWidth="2" />
                    <text x="699" y="154" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">I/O request</text>
                    <path d="M 805 149 L 768 149" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />

                    <rect x="340" y="132" width="138" height="34" rx="4" fill={ioqActive ? "#bfdbfe" : "#ffffff"} stroke="#000000" strokeWidth="2" />
                    <text x="409" y="154" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">I/O queue</text>
                    <path d="M 630 149 L 478 149" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />

                    <ellipse cx="224" cy="149" rx="48" ry="27" fill={ioDevActive ? "#bbf7d0" : "#ffffff"} stroke="#000000" strokeWidth={ioDevActive ? "3" : "2"} />
                    <text x="224" y="155" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">I/O</text>
                    <path d="M 340 149 L 272 149" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />

                    {/* I/O loop back to Ready Queue */}
                    <path d="M 224 122 L 224 70 L 140 70" stroke="#000000" strokeWidth="2" fill="none" />

                    {/* Branch 2: Time Slice Expired ➔ loop */}
                    <rect x="630" y="195" width="138" height="36" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                    <text x="699" y="210" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">time slice</text>
                    <text x="699" y="225" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">expired</text>
                    <path d="M 805 213 L 768 213" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />
                    <path d="M 630 213 L 15 213 L 15 70" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />

                    {/* Branch 3: Fork a child ➔ child executes */}
                    <rect x="630" y="248" width="138" height="36" rx="4" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                    <text x="699" y="263" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">fork a</text>
                    <text x="699" y="277" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">child</text>
                    <path d="M 805 266 L 768 266" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />
                    <path d="M 630 266 L 388 266" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ps-arr)" />
                    <ellipse cx="316" cy="266" rx="68" ry="22" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                    <text x="316" y="262" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">child</text>
                    <text x="316" y="276" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">executes</text>

                    {/* Branch 4: Wait for an interrupt */}
                    <rect x="630" y="293" width="138" height="12" rx="3" fill="#ffffff" stroke="#000000" strokeWidth="1" />
                    <text x="410" y="303" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000" fontFamily="Lexend">
                      wait for an interrupt ➔ interrupt occurs (loop back)
                    </text>
                  </svg>
                </div>

                {/* Gantt Chart strip */}
                {gantt.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#000000", marginBottom: "0.35rem" }}>
                      CPU Execution Gantt Chart:
                    </div>
                    <div style={{ display: "flex", border: "2px solid #000000", borderRadius: 8, overflow: "hidden" }}>
                      {gantt.map((g, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            padding: "0.45rem 0",
                            textAlign: "center",
                            background: g.bg,
                            fontSize: "14px",
                            fontWeight: 900,
                            color: "#000000",
                            borderRight: "1px solid #000000"
                          }}
                        >
                          {g.id}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", fontSize: "14px", fontWeight: 700, color: "#000000", marginTop: "0.2rem" }}>
                      {gantt.map((_, i) => (
                        <div key={i} style={{ flex: 1, textAlign: "center" }}>{i * 10}ms</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View 2: Schedulers Hierarchy */}
            {selectedView === "schedulers" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                {[
                  {
                    name: "Long-term Scheduler",
                    sub: "(Job Scheduler)",
                    role: "Controls Degree of Multiprogramming",
                    desc: "Selects jobs from secondary storage disk pool and admits them into RAM. Runs infrequently (seconds to minutes)."
                  },
                  {
                    name: "Short-term Scheduler",
                    sub: "(CPU Scheduler)",
                    role: "Selects Process from Ready Queue",
                    desc: "Allocates CPU to next ready process. Runs every 10ms to 100ms. Must be blazing fast to avoid scheduling overhead."
                  },
                  {
                    name: "Medium-term Scheduler",
                    sub: "(Swapper)",
                    role: "Reduces Multiprogramming under Pressure",
                    desc: "Temporarily swaps blocked/inactive processes out of RAM to disk swap space. Swaps them back in when RAM frees up."
                  }
                ].map((s, idx) => (
                  <div key={idx} style={{ border: "2px solid #000000", borderRadius: 12, padding: "1.25rem", background: "#ffffff" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>{s.name}</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000", marginBottom: "0.4rem" }}>{s.sub}</div>
                    <div style={{ background: "#eff6ff", border: "1px solid #000000", padding: "0.4rem 0.6rem", borderRadius: 6, fontSize: "14px", fontWeight: 800, color: "#000000", marginBottom: "0.5rem" }}>
                      {s.role}
                    </div>
                    <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: 0 }}>
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* View 3: CPU Context Switch Timeline */}
            {selectedView === "switch" && (
              <div style={{ border: "2px solid #000000", borderRadius: 12, background: "#ffffff", padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#000000", margin: 0 }}>
                    CPU Switch From Process to Process (Context Switch)
                  </h3>
                  <button
                    onClick={() => setCsStep((prev) => (prev + 1) % 4)}
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      padding: "0.4rem 0.9rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Next Switch Step ➔
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "1rem", alignItems: "center" }}>
                  <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: csStep === 0 ? "#eff6ff" : "#ffffff", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>Process P₀</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", marginTop: "0.3rem" }}>
                      {csStep === 0 ? "🔥 Executing" : "Idle / Suspended"}
                    </div>
                  </div>

                  <div style={{ border: "2px dashed #000000", borderRadius: 10, padding: "1rem", background: csStep === 1 || csStep === 2 ? "#fef2f2" : "#ffffff", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>Operating System Kernel</div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000", marginTop: "0.3rem" }}>
                      {csStep === 1 ? "Save State into PCB₀" : csStep === 2 ? "Reload State from PCB₁" : "Waiting for interrupt"}
                    </div>
                    <div style={{ fontSize: "14px", color: "#000000", marginTop: "0.2rem" }}>
                      Pure System Overhead (~1 to 10 µs)
                    </div>
                  </div>

                  <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: csStep === 3 ? "#ecfdf5" : "#ffffff", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>Process P₁</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", marginTop: "0.3rem" }}>
                      {csStep === 3 ? "🔥 Executing" : "Waiting in Ready Queue"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Schedulers Summary Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          SCHEDULER TYPES COMPARISON
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Scheduler</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Location Plane</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Execution Frequency</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Primary Objective</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Long-term (Job)", "Disk pool ➔ Ready Queue", "Infrequent (seconds / minutes)", "Controls degree of multiprogramming in RAM"],
              ["Short-term (CPU)", "Ready Queue ➔ CPU core", "Very frequent (every ~10ms to 100ms)", "Allocates CPU to next ready process; must be extremely fast"],
              ["Medium-term (Swapper)", "Memory ⇄ Swap disk", "Intermediate (upon RAM pressure)", "Swaps out inactive processes to prevent thrashing"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 2 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#000000" }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[1]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[2]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
