import React, { useState, useEffect } from "react";
import Classroom3DSync from "./Classroom3DSync.jsx";

const FONT = "'Lexend', sans-serif";

export default function PetersonsSolution() {
  const [activeTab, setActiveTab] = useState("simulator");

  // --- Sub-Tab 1: Peterson's Simulator State ---
  // Shared Variables
  const [turn, setTurn] = useState(0);
  const [flag, setFlag] = useState([false, false]);

  // Process States: 0 = remainder, 1 = set_flag, 2 = set_turn, 3 = while_check, 4 = critical, 5 = reset_flag
  const [p0Step, setP0Step] = useState(0);
  const [p1Step, setP1Step] = useState(0);

  const [inCS, setInCS] = useState(null); // null, 0, 1, or "VIOLATION"
  const [log, setLog] = useState(["Simulation initialized. Both processes are in Remainder Section."]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const addLog = (msg) => {
    setLog((prev) => [msg, ...prev.slice(0, 15)]);
  };

  // Reset simulator
  const handleReset = () => {
    setIsAutoPlaying(false);
    setTurn(0);
    setFlag([false, false]);
    setP0Step(0);
    setP1Step(0);
    setInCS(null);
    setLog(["Simulator reset. Shared variables: turn = 0, flag = [false, false]."]);
  };

  // Step Process 0
  const stepP0 = () => {
    if (p0Step === 0) {
      // Move from remainder to requesting CS (set flag[0] = true)
      setFlag((f) => [true, f[1]]);
      setP0Step(1);
      addLog("P0: flag[0] = true (P0 announces intention to enter CS)");
    } else if (p0Step === 1) {
      // Set turn = 1 (courtesy to P1)
      setTurn(1);
      setP0Step(2);
      addLog("P0: turn = 1 (P0 politely offers turn to P1)");
    } else if (p0Step === 2) {
      // While check: while (flag[1] && turn == 1)
      const isBlocked = flag[1] && turn === 1;
      if (isBlocked) {
        addLog("P0: Blocked in while(flag[1] && turn == 1)! (flag[1] is TRUE and turn == 1)");
      } else {
        // Enters Critical Section!
        setP0Step(3);
        setInCS((current) => {
          if (current === 1) {
            addLog("🚨 MUTUAL EXCLUSION VIOLATION! Both P0 and P1 in CS!");
            return "VIOLATION";
          }
          addLog("🟢 P0: ENTERED CRITICAL SECTION!");
          return 0;
        });
      }
    } else if (p0Step === 3) {
      // In CS -> Exit section: flag[0] = false
      setFlag((f) => [false, f[1]]);
      setP0Step(4);
      setInCS((current) => (current === 0 ? null : current));
      addLog("P0: flag[0] = false (P0 leaves Critical Section and resets flag)");
    } else if (p0Step === 4) {
      // Back to remainder
      setP0Step(0);
      addLog("P0: Returned to Remainder Section.");
    }
  };

  // Step Process 1
  const stepP1 = () => {
    if (p1Step === 0) {
      // Move from remainder to requesting CS (set flag[1] = true)
      setFlag((f) => [f[0], true]);
      setP1Step(1);
      addLog("P1: flag[1] = true (P1 announces intention to enter CS)");
    } else if (p1Step === 1) {
      // Set turn = 0 (courtesy to P0)
      setTurn(0);
      setP1Step(2);
      addLog("P1: turn = 0 (P1 politely offers turn to P0)");
    } else if (p1Step === 2) {
      // While check: while (flag[0] && turn == 0)
      const isBlocked = flag[0] && turn === 0;
      if (isBlocked) {
        addLog("P1: Blocked in while(flag[0] && turn == 0)! (flag[0] is TRUE and turn == 0)");
      } else {
        // Enters Critical Section!
        setP1Step(3);
        setInCS((current) => {
          if (current === 0) {
            addLog("🚨 MUTUAL EXCLUSION VIOLATION! Both P0 and P1 in CS!");
            return "VIOLATION";
          }
          addLog("🟢 P1: ENTERED CRITICAL SECTION!");
          return 1;
        });
      }
    } else if (p1Step === 3) {
      // In CS -> Exit section: flag[1] = false
      setFlag((f) => [f[0], false]);
      setP1Step(4);
      setInCS((current) => (current === 1 ? null : current));
      addLog("P1: flag[1] = false (P1 leaves Critical Section and resets flag)");
    } else if (p1Step === 4) {
      // Back to remainder
      setP1Step(0);
      addLog("P1: Returned to Remainder Section.");
    }
  };

  // Trigger simultaneous request race
  const triggerConflict = () => {
    handleReset();
    // Both set flags to true
    setFlag([true, true]);
    // Suppose P0 set turn=1 first, then P1 set turn=0 last!
    setTurn(0);
    setP0Step(2);
    setP1Step(2);
    addLog("⚡ CONFLICT TEST: Both P0 and P1 requested entry! P1 set turn=0 last, so P0 gets to enter first!");
  };

  // Auto-play stepper
  useEffect(() => {
    let timer = null;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        // Randomly pick a runnable process
        const p0CanAdvance = p0Step === 3 || p0Step === 4 || p0Step === 0 || p0Step === 1 || !(flag[1] && turn === 1);
        const p1CanAdvance = p1Step === 3 || p1Step === 4 || p1Step === 0 || p1Step === 1 || !(flag[0] && turn === 0);

        if (p0CanAdvance && (!p1CanAdvance || Math.random() > 0.5)) {
          stepP0();
        } else if (p1CanAdvance) {
          stepP1();
        }
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, p0Step, p1Step, flag, turn]);

  // Labels for process steps
  const P0_STEP_LABELS = [
    "0. In Remainder Section",
    "1. Entry: flag[0] = true;",
    "2. Entry: turn = 1;",
    "3. INSIDE CRITICAL SECTION",
    "4. Exit: flag[0] = false;"
  ];

  const P1_STEP_LABELS = [
    "0. In Remainder Section",
    "1. Entry: flag[1] = true;",
    "2. Entry: turn = 0;",
    "3. INSIDE CRITICAL SECTION",
    "4. Exit: flag[1] = false;"
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "0.5rem" }}>
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "3d_classroom", label: "🏫 3D Classroom Analogy (Teacher Access)" },
          { id: "simulator", label: "🎮 Peterson's Interactive 2-Process Simulator" },
          { id: "proof", label: "📜 Mathematical Proof of 3 Criteria" },
          { id: "modern_cpu", label: "⚡ Modern CPU Reality & Memory Barriers" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#000000" : "#ffffff",
              color: activeTab === tab.id ? "#ffffff" : "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.6rem 1.25rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: activeTab === tab.id ? "3px 3px 0px #000000" : "none"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0: 3D CLASSROOM REAL-WORLD ANALOGY
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "3d_classroom" && (
        <Classroom3DSync />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: INTERACTIVE SIMULATOR
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "simulator" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Concept Header */}
          <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🤝</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Peterson's Algorithm: The Elegant Software Solution for 2 Processes
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Formulated by Gary L. Peterson in 1981, this algorithmic solution uses two shared variables:
              an array <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>boolean flag[2]</code> and an integer <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>int turn</code>.
              It perfectly guarantees <strong>Mutual Exclusion</strong>, <strong>Progress</strong>, and <strong>Bounded Waiting</strong> without hardware support!
            </p>
          </div>

          {/* Shared Memory Monitor */}
          <div style={{
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.6rem" }}>💾</span>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Shared Variable
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>
                  flag[0] (P0 Wants In?)
                </div>
              </div>
              <span style={{
                fontSize: "14px",
                fontWeight: 900,
                padding: "0.3rem 0.8rem",
                borderRadius: 8,
                border: "2px solid #000000",
                background: flag[0] ? "#2563eb" : "#f1f5f9",
                color: flag[0] ? "#ffffff" : "#64748b"
              }}>
                {flag[0] ? "TRUE" : "FALSE"}
              </span>
            </div>

            <div style={{ width: "2px", height: "40px", background: "#e2e8f0" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.6rem" }}>🔄</span>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Tie-Breaker Courtesy
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>
                  turn (Whose Turn Priority)
                </div>
              </div>
              <span style={{
                fontSize: "18px",
                fontWeight: 900,
                padding: "0.2rem 1rem",
                borderRadius: 8,
                border: "2px solid #000000",
                background: turn === 0 ? "#eff6ff" : "#fef2f2",
                color: turn === 0 ? "#2563eb" : "#dc2626"
              }}>
                P{turn}
              </span>
            </div>

            <div style={{ width: "2px", height: "40px", background: "#e2e8f0" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontSize: "1.6rem" }}>💾</span>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Shared Variable
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800 }}>
                  flag[1] (P1 Wants In?)
                </div>
              </div>
              <span style={{
                fontSize: "14px",
                fontWeight: 900,
                padding: "0.3rem 0.8rem",
                borderRadius: 8,
                border: "2px solid #000000",
                background: flag[1] ? "#dc2626" : "#f1f5f9",
                color: flag[1] ? "#ffffff" : "#64748b"
              }}>
                {flag[1] ? "TRUE" : "FALSE"}
              </span>
            </div>
          </div>

          {/* Critical Section Room Visualization */}
          <div style={{
            background: inCS === "VIOLATION" ? "#fee2e2" : inCS !== null ? "#ecfdf5" : "#f8fafc",
            border: inCS === "VIOLATION" ? "3px solid #dc2626" : inCS !== null ? "3px solid #16a34a" : "2px dashed #000000",
            borderRadius: 14,
            padding: "1.25rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "130px",
            transition: "all 0.25s"
          }}>
            <div style={{ fontSize: "12px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b" }}>
              Protected Zone
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, margin: "0.25rem 0" }}>
              🛡️ The Critical Section Chamber (Capacity = 1)
            </div>
            {inCS === null && (
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#64748b" }}>
                [ EMPTY — Safe for an arriving process to enter ]
              </div>
            )}
            {inCS === 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#2563eb", color: "#ffffff", padding: "0.4rem 1rem", borderRadius: 8, border: "2px solid #000000" }}>
                <span>🧵</span>
                <span style={{ fontWeight: 900, fontSize: "15px" }}>Process P0 is Executing inside Critical Section!</span>
              </div>
            )}
            {inCS === 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#dc2626", color: "#ffffff", padding: "0.4rem 1rem", borderRadius: 8, border: "2px solid #000000" }}>
                <span>🧵</span>
                <span style={{ fontWeight: 900, fontSize: "15px" }}>Process P1 is Executing inside Critical Section!</span>
              </div>
            )}
            {inCS === "VIOLATION" && (
              <div style={{ background: "#dc2626", color: "#ffffff", padding: "0.5rem 1.25rem", borderRadius: 8, border: "2px solid #000000", fontWeight: 900 }}>
                🚨 FATAL COLLISION! Both P0 and P1 entered simultaneously!
              </div>
            )}
          </div>

          {/* Interactive Steppers & Code Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
            {/* Process 0 Column */}
            <div style={{
              background: "#ffffff",
              border: p0Step === 3 ? "3px solid #2563eb" : "2px solid #000000",
              borderRadius: 12,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🔷</span>
                  <span style={{ fontWeight: 900, fontSize: "16px" }}>Process P0</span>
                </div>
                <button
                  onClick={stepP0}
                  style={{
                    background: "#2563eb",
                    color: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.4rem 0.85rem",
                    fontSize: "13px",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  Step P0 ⏩
                </button>
              </div>

              {/* Status pill */}
              <div style={{
                background: "#eff6ff",
                border: "1.5px solid #2563eb",
                borderRadius: 8,
                padding: "0.4rem 0.6rem",
                fontSize: "12px",
                fontWeight: 800,
                color: "#1d4ed8"
              }}>
                Current: {P0_STEP_LABELS[p0Step]}
              </div>

              {/* Code Box */}
              <pre style={{
                background: "#0f172a",
                color: "#cbd5e1",
                padding: "1rem",
                borderRadius: 8,
                border: "1.5px solid #000000",
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1.7,
                margin: 0
              }}>
{`do {
`}
<span style={{ background: p0Step === 1 ? "#1e40af" : "transparent", color: p0Step === 1 ? "#93c5fd" : "inherit", padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    flag[0] = true;`}
</span>
<span style={{ background: p0Step === 2 ? "#1e40af" : "transparent", color: p0Step === 2 ? "#93c5fd" : "inherit", padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    turn = 1;`}
</span>
<span style={{
  background: p0Step === 2 && flag[1] && turn === 1 ? "#7f1d1d" : "transparent",
  color: p0Step === 2 && flag[1] && turn === 1 ? "#fca5a5" : "inherit",
  padding: "1px 4px",
  borderRadius: 4,
  display: "block"
}}>
{`    while (flag[1] && turn == 1);`}
</span>
<span style={{ background: p0Step === 3 ? "#1e40af" : "transparent", color: p0Step === 3 ? "#93c5fd" : "#60a5fa", fontWeight: 700, padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    /* CRITICAL SECTION */`}
</span>
<span style={{ background: p0Step === 4 ? "#1e40af" : "transparent", color: p0Step === 4 ? "#93c5fd" : "inherit", padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    flag[0] = false;`}
</span>
{`    /* REMAINDER SECTION */
} while (true);`}
              </pre>

              {p0Step === 2 && flag[1] && turn === 1 && (
                <div style={{ background: "#fee2e2", border: "1.5px solid #dc2626", borderRadius: 8, padding: "0.5rem", fontSize: "12px", color: "#991b1b", fontWeight: 700 }}>
                  ⏳ P0 is actively SPINNING in while() loop because P1 has turn (turn=1) and P1 wants to enter (flag[1]=true)!
                </div>
              )}
            </div>

            {/* Process 1 Column */}
            <div style={{
              background: "#ffffff",
              border: p1Step === 3 ? "3px solid #dc2626" : "2px solid #000000",
              borderRadius: 12,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🔴</span>
                  <span style={{ fontWeight: 900, fontSize: "16px" }}>Process P1</span>
                </div>
                <button
                  onClick={stepP1}
                  style={{
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.4rem 0.85rem",
                    fontSize: "13px",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  Step P1 ⏩
                </button>
              </div>

              {/* Status pill */}
              <div style={{
                background: "#fef2f2",
                border: "1.5px solid #dc2626",
                borderRadius: 8,
                padding: "0.4rem 0.6rem",
                fontSize: "12px",
                fontWeight: 800,
                color: "#b91c1c"
              }}>
                Current: {P1_STEP_LABELS[p1Step]}
              </div>

              {/* Code Box */}
              <pre style={{
                background: "#0f172a",
                color: "#cbd5e1",
                padding: "1rem",
                borderRadius: 8,
                border: "1.5px solid #000000",
                fontFamily: "monospace",
                fontSize: "13px",
                lineHeight: 1.7,
                margin: 0
              }}>
{`do {
`}
<span style={{ background: p1Step === 1 ? "#991b1b" : "transparent", color: p1Step === 1 ? "#fecaca" : "inherit", padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    flag[1] = true;`}
</span>
<span style={{ background: p1Step === 2 ? "#991b1b" : "transparent", color: p1Step === 2 ? "#fecaca" : "inherit", padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    turn = 0;`}
</span>
<span style={{
  background: p1Step === 2 && flag[0] && turn === 0 ? "#7f1d1d" : "transparent",
  color: p1Step === 2 && flag[0] && turn === 0 ? "#fca5a5" : "inherit",
  padding: "1px 4px",
  borderRadius: 4,
  display: "block"
}}>
{`    while (flag[0] && turn == 0);`}
</span>
<span style={{ background: p1Step === 3 ? "#991b1b" : "transparent", color: p1Step === 3 ? "#fecaca" : "#f87171", fontWeight: 700, padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    /* CRITICAL SECTION */`}
</span>
<span style={{ background: p1Step === 4 ? "#991b1b" : "transparent", color: p1Step === 4 ? "#fecaca" : "inherit", padding: "1px 4px", borderRadius: 4, display: "block" }}>
{`    flag[1] = false;`}
</span>
{`    /* REMAINDER SECTION */
} while (true);`}
              </pre>

              {p1Step === 2 && flag[0] && turn === 0 && (
                <div style={{ background: "#fee2e2", border: "1.5px solid #dc2626", borderRadius: 8, padding: "0.5rem", fontSize: "12px", color: "#991b1b", fontWeight: 700 }}>
                  ⏳ P1 is actively SPINNING in while() loop because P0 has turn (turn=0) and P0 wants to enter (flag[0]=true)!
                </div>
              )}
            </div>
          </div>

          {/* Master Controller Toolbar & Live Log */}
          <div style={{
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={triggerConflict}
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.45rem 0.85rem",
                    fontSize: "13px",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  ⚡ Simulate Simultaneous Request Collision
                </button>
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  style={{
                    background: isAutoPlaying ? "#ea580c" : "#16a34a",
                    color: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.45rem 0.85rem",
                    fontSize: "13px",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  {isAutoPlaying ? "⏸ Pause Auto" : "▶ Random Auto Run"}
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    background: "#f1f5f9",
                    color: "#000000",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.45rem 0.85rem",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  ↺ Reset
                </button>
              </div>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
                💡 Tip: Click "Step P0" or "Step P1" to see how turn breaks ties!
              </span>
            </div>

            {/* Event log */}
            <div style={{
              background: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              borderRadius: 8,
              padding: "0.6rem 0.85rem",
              maxHeight: "110px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem"
            }}>
              {log.map((entry, idx) => (
                <div key={idx} style={{ color: idx === 0 ? "#0f172a" : "#64748b", fontWeight: idx === 0 ? 800 : 400 }}>
                  › {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: MATHEMATICAL PROOF OF 3 CRITERIA
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "proof" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0" }}>
              Rigorous Proof: Why Peterson's Solution Satisfies All 3 Requirements
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Textbooks routinely ask students to prove Peterson's solution. Below is the step-by-step mathematical reasoning that guarantees correctness.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* Proof 1: Mutual Exclusion */}
            <div style={{ background: "#eff6ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🛡️</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>1. Mutual Exclusion is Preserved</h3>
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#1e293b" }}>
                <p style={{ margin: "0 0 0.5rem 0" }}>
                  Assume for contradiction that <strong>both P0 and P1 are in their critical sections at the same time</strong>.
                </p>
                <ol style={{ paddingLeft: "1.2rem", margin: "0 0 0.5rem 0" }}>
                  <li>For P0 to enter CS, either <code style={{ fontWeight: 800 }}>flag[1] == false</code> OR <code style={{ fontWeight: 800 }}>turn == 0</code>.</li>
                  <li>For P1 to enter CS, either <code style={{ fontWeight: 800 }}>flag[0] == false</code> OR <code style={{ fontWeight: 800 }}>turn == 1</code>.</li>
                  <li>Both are in CS, so both previously set <code style={{ fontWeight: 800 }}>flag[0] = true</code> and <code style={{ fontWeight: 800 }}>flag[1] = true</code>.</li>
                  <li>Therefore, both must have evaluated their respective <code style={{ fontWeight: 800 }}>turn</code> conditions: P0 required <code style={{ fontWeight: 800 }}>turn == 0</code> and P1 required <code style={{ fontWeight: 800 }}>turn == 1</code>.</li>
                </ol>
                <div style={{ background: "#dbeafe", padding: "0.5rem", borderRadius: 6, fontWeight: 800 }}>
                  ⚖️ But <code style={{ color: "#000" }}>turn</code> is a single integer in memory! It can equal 0 or 1, but NEVER BOTH simultaneously. Hence, contradiction! Mutual exclusion holds!
                </div>
              </div>
            </div>

            {/* Proof 2: Progress */}
            <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>🚀</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>2. Progress Requirement is Met</h3>
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#1e293b" }}>
                <p style={{ margin: "0 0 0.5rem 0" }}>
                  Can processes ever get permanently stuck preventing anyone from entering?
                </p>
                <ul style={{ paddingLeft: "1.2rem", margin: "0 0 0.5rem 0" }}>
                  <li><strong>Case A:</strong> Only P0 wants to enter. P1 has <code style={{ fontWeight: 800 }}>flag[1] == false</code>. P0 immediately bypasses the while loop and enters without delay!</li>
                  <li><strong>Case B:</strong> Both want to enter simultaneously. Both set <code style={{ fontWeight: 800 }}>flag=true</code>. One of them writes to <code style={{ fontWeight: 800 }}>turn</code> first, and the other writes last.</li>
                  <li>The final value of <code style={{ fontWeight: 800 }}>turn</code> is determined by the last write. If P1 wrote last, <code style={{ fontWeight: 800 }}>turn == 0</code>, so P0 enters CS immediately!</li>
                </ul>
                <div style={{ background: "#dcfce7", padding: "0.5rem", borderRadius: 6, fontWeight: 800 }}>
                  ⚖️ Neither process can prevent the other unless it is actively contending, and at least one is guaranteed to enter!
                </div>
              </div>
            </div>

            {/* Proof 3: Bounded Waiting */}
            <div style={{ background: "#fefce8", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.4rem" }}>⏳</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>3. Bounded Waiting is Guaranteed</h3>
              </div>
              <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#1e293b" }}>
                <p style={{ margin: "0 0 0.5rem 0" }}>
                  Can P1 starve P0 by re-entering the critical section repeatedly?
                </p>
                <ol style={{ paddingLeft: "1.2rem", margin: "0 0 0.5rem 0" }}>
                  <li>Suppose P1 exits its critical section. It sets <code style={{ fontWeight: 800 }}>flag[1] = false</code>.</li>
                  <li>If P1 immediately attempts to re-enter, it must execute its entry code again:
                    <br />1. <code style={{ fontWeight: 800 }}>flag[1] = true</code>
                    <br />2. <code style={{ fontWeight: 800 }}>turn = 0</code> (P1 MUST give turn back to P0!)
                  </li>
                  <li>Because P0 is already waiting with <code style={{ fontWeight: 800 }}>flag[0] == true</code>, and <code style={{ fontWeight: 800 }}>turn</code> is now 0, P0's while loop immediately terminates!</li>
                </ol>
                <div style={{ background: "#fef08a", padding: "0.5rem", borderRadius: 6, fontWeight: 800 }}>
                  ⚖️ P0 will wait for at most ONE entry by P1 before getting its turn! Bound = 1 turn!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: MODERN CPU REALITY & MEMORY BARRIERS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "modern_cpu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#fef2f2", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>⚠️</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Why Peterson's Algorithm Fails on Modern Multi-Core Processors!
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Peterson's algorithm was designed assuming <strong>Sequential Consistency</strong> (instructions execute strictly in source-code order).
              On modern x86, ARM, and Apple Silicon CPUs, compilers and hardware out-of-order execution pipelines <strong>reorder independent memory reads and writes</strong> to maximize throughput.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* The Reordering Hazard */}
            <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 900, marginBottom: "0.5rem" }}>
                ⚡ How Hardware Pipeline Reordering Breaks Peterson
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#334155" }}>
                In Process P0's entry code:
              </p>
              <pre style={{ background: "#0f172a", color: "#f87171", padding: "0.75rem", borderRadius: 6, fontSize: "12px", fontFamily: "monospace" }}>
{`// Written Order in C:
flag[0] = true;   // Write 1
turn = 1;         // Write 2
while (flag[1] && turn == 1); // Read flag[1]`}
              </pre>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#334155" }}>
                Because <code style={{ fontWeight: 800 }}>flag[0]</code> and <code style={{ fontWeight: 800 }}>turn</code> are independent variables at different memory addresses,
                an optimizing compiler or CPU Store Buffer can reorder the instructions so that the processor checks <code style={{ fontWeight: 800 }}>flag[1]</code> <em>before</em> flushing <code style={{ fontWeight: 800 }}>flag[0] = true</code> to main memory!
                <br /><br />
                If both CPUs do this, both see <code style={{ fontWeight: 800 }}>flag = false</code> and <strong>both enter the Critical Section simultaneously!</strong>
              </p>
            </div>

            {/* The Modern Fix: Memory Barriers */}
            <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 900, marginBottom: "0.5rem" }}>
                🔒 The Solution: Memory Barriers / Fences
              </h3>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#334155" }}>
                A <strong>Memory Barrier</strong> (or Memory Fence, such as <code style={{ fontWeight: 800 }}>mfence</code> on x86 or <code style={{ fontWeight: 800 }}>dmb</code> on ARM) instructs the CPU and compiler that all prior writes must be globally visible before subsequent reads or writes can execute:
              </p>
              <pre style={{ background: "#0f172a", color: "#4ade80", padding: "0.75rem", borderRadius: 6, fontSize: "12px", fontFamily: "monospace" }}>
{`// Modern Fixed Implementation in C11/C++20:
flag[0].store(true, std::memory_order_seq_cst);
turn.store(1, std::memory_order_seq_cst);
std::atomic_thread_fence(std::memory_order_seq_cst);

while (flag[1].load(std::memory_order_seq_cst) && 
       turn.load(std::memory_order_seq_cst) == 1);`}
              </pre>
              <div style={{ background: "#f0fdf4", border: "1px solid #16a34a", borderRadius: 8, padding: "0.5rem", fontSize: "12px", fontWeight: 700, color: "#166534", marginTop: "0.5rem" }}>
                ✓ With sequential consistency fences, Peterson's algorithm works correctly on modern multi-core chips!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
