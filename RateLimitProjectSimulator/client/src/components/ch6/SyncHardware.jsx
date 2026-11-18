import React, { useState, useEffect } from "react";

const FONT = "'Lexend', sans-serif";

export default function SyncHardware() {
  const [activeTab, setActiveTab] = useState("tas");

  // ── Tab 1: TestAndSet State ──
  const [tasLock, setTasLock] = useState(false); // false = available, true = locked
  const [coreStates, setCoreStates] = useState([
    { id: 0, name: "Core 0", state: "idle", oldVal: null },
    { id: 1, name: "Core 1", state: "idle", oldVal: null }
  ]);
  const [tasLog, setTasLog] = useState(["Hardware Bus Initialized: lock = false (0)"]);

  const addTasLog = (msg) => {
    setTasLog((prev) => [msg, ...prev.slice(0, 10)]);
  };

  const handleCoreTAS = (coreIdx) => {
    // Atomic TestAndSet instruction execution
    const currentLock = tasLock;
    // Set lock to true in hardware regardless
    setTasLock(true);

    if (!currentLock) {
      // Returned false -> acquired lock!
      setCoreStates((prev) =>
        prev.map((c, i) => (i === coreIdx ? { ...c, state: "in_cs", oldVal: false } : c))
      );
      addTasLog(`⚡ ${coreStates[coreIdx].name}: test_and_set(&lock) returned FALSE. Core acquired lock and entered CS!`);
    } else {
      // Returned true -> already locked, must spin!
      setCoreStates((prev) =>
        prev.map((c, i) => (i === coreIdx ? { ...c, state: "spinning", oldVal: true } : c))
      );
      addTasLog(`⏳ ${coreStates[coreIdx].name}: test_and_set(&lock) returned TRUE. Lock already held! Core continues spinning.`);
    }
  };

  const handleCoreRelease = (coreIdx) => {
    setTasLock(false);
    setCoreStates((prev) =>
      prev.map((c, i) => (i === coreIdx ? { ...c, state: "idle", oldVal: null } : c))
    );
    addTasLog(`🔓 ${coreStates[coreIdx].name}: lock = false. Lock released!`);
  };

  const resetTAS = () => {
    setTasLock(false);
    setCoreStates([
      { id: 0, name: "Core 0", state: "idle", oldVal: null },
      { id: 1, name: "Core 1", state: "idle", oldVal: null }
    ]);
    setTasLog(["Hardware bus reset: lock = false"]);
  };

  // ── Tab 2: CompareAndSwap (CAS) State ──
  const [casValue, setCasValue] = useState(0); // 0 = unlocked, 1 = locked
  const [expectedVal, setExpectedVal] = useState(0);
  const [newVal, setNewVal] = useState(1);
  const [casResult, setCasResult] = useState(null);

  const runCAS = () => {
    const temp = casValue;
    if (casValue === expectedVal) {
      setCasValue(newVal);
      setCasResult({
        returned: temp,
        success: true,
        desc: `SUCCESS: *value (${temp}) matched expected (${expectedVal}). *value updated to ${newVal}!`
      });
    } else {
      setCasResult({
        returned: temp,
        success: false,
        desc: `FAILED: *value (${temp}) did NOT match expected (${expectedVal}). *value unchanged!`
      });
    }
  };

  // ── Tab 3: Bounded-Waiting Algorithm 3 (Circular Queue) ──
  const [ringWaiting, setRingWaiting] = useState([false, false, false, false]);
  const [ringLock, setRingLock] = useState(false);
  const [ringCurrentCS, setRingCurrentCS] = useState(null); // null or process index 0..3
  const [ringLog, setRingLog] = useState(["Algorithm 3 initialized. 4 processes ready."]);

  const addRingLog = (msg) => {
    setRingLog((prev) => [msg, ...prev.slice(0, 8)]);
  };

  const handleProcessRequest = (idx) => {
    if (ringCurrentCS === idx) return;
    setRingWaiting((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });

    if (!ringLock && ringCurrentCS === null) {
      // Lock is free, process can enter directly
      setRingLock(true);
      setRingWaiting((prev) => {
        const next = [...prev];
        next[idx] = false;
        return next;
      });
      setRingCurrentCS(idx);
      addRingLog(`Process P${idx} acquired lock with test_and_set and entered Critical Section.`);
    } else {
      addRingLog(`Process P${idx} marked waiting[${idx}] = true and is waiting in circular queue.`);
    }
  };

  const handleProcessExit = (idx) => {
    if (ringCurrentCS !== idx) return;

    // Scan circularly for next waiting process: j = (i + 1) % n
    let j = (idx + 1) % 4;
    while (j !== idx && !ringWaiting[j]) {
      j = (j + 1) % 4;
    }

    if (j === idx) {
      // No one else is waiting! Release lock
      setRingLock(false);
      setRingCurrentCS(null);
      addRingLog(`Process P${idx} exited. No other processes waiting. lock set to FALSE.`);
    } else {
      // Hand baton directly to Pj without releasing lock!
      setRingWaiting((prev) => {
        const next = [...prev];
        next[j] = false;
        return next;
      });
      setRingCurrentCS(j);
      addRingLog(`Process P${idx} exited and passed entry baton DIRECTLY to waiting Process P${j}! (Bounded Waiting satisfied)`);
    }
  };

  const resetRing = () => {
    setRingWaiting([false, false, false, false]);
    setRingLock(false);
    setRingCurrentCS(null);
    setRingLog(["Circular Ring Reset."]);
  };

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "0.5rem" }}>
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "tas", label: "⚙️ 1. Test-and-Set (test_and_set) Instruction" },
          { id: "cas", label: "🔄 2. Compare-and-Swap (CAS / CMPXCHG)" },
          { id: "bounded", label: "🎯 3. Bounded-Waiting Algorithm with Hardware" }
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
          TAB 1: TEST-AND-SET (TAS)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "tas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#fefce8", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>⚡</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Hardware Atomicity: The Test-and-Set (TAS) Primitive
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              Software solutions struggle because read and write instructions can be interrupted mid-flight.
              Modern CPUs solve this by providing special <strong>atomic machine instructions</strong> (executed in a single indivisible memory bus cycle).
              The classic instruction is <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>test_and_set(&lock)</code>:
              it returns the <em>original value</em> and sets the lock to <em>true</em> in one clock cycle!
            </p>
          </div>

          {/* Central Bus & Lock Monitor */}
          <div style={{
            background: "#ffffff",
            border: "3px solid #000000",
            borderRadius: 14,
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: tasLock ? "#fee2e2" : "#dcfce7",
                border: "2px solid #000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.8rem"
              }}>
                {tasLock ? "🔒" : "🔓"}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Hardware Memory Bus Register
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900 }}>
                  Shared Lock Variable: <code style={{ color: tasLock ? "#dc2626" : "#16a34a" }}>boolean lock = {tasLock ? "true (1)" : "false (0)"}</code>
                </div>
              </div>
            </div>

            <button
              onClick={resetTAS}
              style={{
                background: "#f1f5f9",
                border: "2px solid #000000",
                borderRadius: 8,
                padding: "0.45rem 1rem",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              ↺ Reset Hardware
            </button>
          </div>

          {/* Core 0 & Core 1 Multi-Core Arena */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {coreStates.map((core, idx) => (
              <div
                key={core.id}
                style={{
                  background: core.state === "in_cs" ? "#eff6ff" : core.state === "spinning" ? "#fffbeb" : "#ffffff",
                  border: core.state === "in_cs" ? "3px solid #2563eb" : core.state === "spinning" ? "2px solid #d97706" : "2px solid #000000",
                  borderRadius: 12,
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>🖥️</span>
                    <span style={{ fontSize: "16px", fontWeight: 900 }}>{core.name} (CPU Thread)</span>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 900,
                    padding: "0.2rem 0.6rem",
                    borderRadius: 6,
                    border: "1px solid #000000",
                    background: core.state === "in_cs" ? "#2563eb" : core.state === "spinning" ? "#fef3c7" : "#f1f5f9",
                    color: core.state === "in_cs" ? "#ffffff" : core.state === "spinning" ? "#92400e" : "#000000"
                  }}>
                    {core.state === "in_cs" ? "INSIDE CRITICAL SECTION" : core.state === "spinning" ? "SPINNING (BUSY-WAIT)" : "IDLE"}
                  </span>
                </div>

                {/* TAS Code for Core */}
                <pre style={{
                  background: "#0f172a",
                  color: "#cbd5e1",
                  padding: "0.85rem",
                  borderRadius: 8,
                  border: "1.5px solid #000000",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  lineHeight: 1.6,
                  margin: 0
                }}>
{`do {
    // 1. Indivisible atomic hardware instruction
`}
<span style={{
  background: core.state === "spinning" ? "#78350f" : "transparent",
  color: core.state === "spinning" ? "#fef08a" : "#38bdf8",
  padding: "1px 4px",
  borderRadius: 4,
  display: "block"
}}>
{`    while (test_and_set(&lock)); // spin`}
</span>
<span style={{
  background: core.state === "in_cs" ? "#1e40af" : "transparent",
  color: core.state === "in_cs" ? "#93c5fd" : "#60a5fa",
  fontWeight: 700,
  padding: "1px 4px",
  borderRadius: 4,
  display: "block"
}}>
{`    /* CRITICAL SECTION */`}
</span>
<span style={{ color: "#4ade80", display: "block" }}>
{`    lock = false; // 2. Release`}
</span>
{`    /* Remainder Section */
} while (true);`}
                </pre>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleCoreTAS(idx)}
                    disabled={core.state === "in_cs"}
                    style={{
                      flex: 1,
                      background: core.state === "in_cs" ? "#e2e8f0" : "#2563eb",
                      color: core.state === "in_cs" ? "#94a3b8" : "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: 8,
                      padding: "0.5rem",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: core.state === "in_cs" ? "not-allowed" : "pointer"
                    }}
                  >
                    Execute test_and_set(&lock) ⚡
                  </button>
                  <button
                    onClick={() => handleCoreRelease(idx)}
                    disabled={core.state !== "in_cs"}
                    style={{
                      background: core.state === "in_cs" ? "#16a34a" : "#f1f5f9",
                      color: core.state === "in_cs" ? "#ffffff" : "#94a3b8",
                      border: "2px solid #000000",
                      borderRadius: 8,
                      padding: "0.5rem 0.85rem",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: core.state === "in_cs" ? "pointer" : "not-allowed"
                    }}
                  >
                    Release lock 🔓
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluation of Simple TestAndSet */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 900, marginBottom: "0.5rem" }}>
              ⚠️ Critical Analysis: Does Simple TestAndSet Satisfy All 3 Criteria?
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", fontSize: "13px" }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #16a34a", padding: "0.6rem", borderRadius: 8 }}>
                <strong>✅ Mutual Exclusion:</strong> Guaranteed. Because <code style={{ fontWeight: 800 }}>test_and_set</code> is atomic, exactly one thread can receive <code style={{ fontWeight: 800 }}>false</code> when lock was 0.
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #16a34a", padding: "0.6rem", borderRadius: 8 }}>
                <strong>✅ Progress:</strong> Guaranteed. When lock is released (<code style={{ fontWeight: 800 }}>lock=false</code>), the next core to execute TAS immediately claims it.
              </div>
              <div style={{ background: "#fef2f2", border: "1px solid #dc2626", padding: "0.6rem", borderRadius: 8 }}>
                <strong>❌ Bounded Waiting: FAILS!</strong> A process waiting in the <code style={{ fontWeight: 800 }}>while</code> loop might spin indefinitely if another core repeatedly snatches the lock. Starvation is possible!
              </div>
            </div>
          </div>

          {/* Event Log */}
          <div style={{
            background: "#f8fafc",
            border: "1.5px solid #cbd5e1",
            borderRadius: 8,
            padding: "0.6rem 0.85rem",
            maxHeight: "100px",
            overflowY: "auto",
            fontFamily: "monospace",
            fontSize: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem"
          }}>
            {tasLog.map((l, i) => (
              <div key={i} style={{ color: i === 0 ? "#000" : "#64748b" }}>
                › {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: COMPARE-AND-SWAP (CAS)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "cas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🔄</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Compare-and-Swap (CAS / CMPXCHG): The Foundation of Lock-Free Algorithms
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              The <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>compare_and_swap(&value, expected, new_value)</code> instruction
              operates on three operands: it checks if the current memory content equals <code style={{ fontWeight: 800 }}>expected</code>; only if true does it swap in <code style={{ fontWeight: 800 }}>new_value</code>.
              It always returns the <strong>original value</strong> before any swap.
            </p>
          </div>

          {/* Interactive CAS Playground */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 900, marginBottom: "1rem" }}>
              🧪 Interactive CAS Instruction Tester
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
              {/* Memory Address Value */}
              <div style={{ background: "#eff6ff", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Current Memory Value
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, margin: "0.25rem 0" }}>
                  *value = <span style={{ fontSize: "2rem", color: "#2563eb", fontWeight: 900 }}>{casValue}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  (0 = unlocked, 1 = locked)
                </div>
              </div>

              {/* Expected Value Input */}
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Param 1: expected
                </div>
                <input
                  type="number"
                  value={expectedVal}
                  onChange={(e) => setExpectedVal(Number(e.target.value))}
                  style={{
                    width: "100%",
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    padding: "0.35rem",
                    marginTop: "0.35rem",
                    border: "2px solid #000000",
                    borderRadius: 6,
                    fontFamily: FONT
                  }}
                />
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "0.25rem" }}>
                  Value CPU expects to find
                </div>
              </div>

              {/* New Value Input */}
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Param 2: new_value
                </div>
                <input
                  type="number"
                  value={newVal}
                  onChange={(e) => setNewVal(Number(e.target.value))}
                  style={{
                    width: "100%",
                    fontSize: "1.5rem",
                    fontWeight: 900,
                    padding: "0.35rem",
                    marginTop: "0.35rem",
                    border: "2px solid #000000",
                    borderRadius: 6,
                    fontFamily: FONT
                  }}
                />
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "0.25rem" }}>
                  Value to write if match
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                onClick={runCAS}
                style={{
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.6rem 1.5rem",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                Execute atomic compare_and_swap(&value, {expectedVal}, {newVal}) ⚡
              </button>
              <button
                onClick={() => { setCasValue(0); setCasResult(null); }}
                style={{
                  background: "#f1f5f9",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.6rem 1rem",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Reset *value = 0
              </button>
            </div>

            {/* Result Box */}
            {casResult && (
              <div style={{
                marginTop: "1rem",
                padding: "0.85rem 1.25rem",
                borderRadius: 8,
                border: "2px solid #000000",
                background: casResult.success ? "#dcfce7" : "#fee2e2",
                color: casResult.success ? "#166534" : "#991b1b"
              }}>
                <div style={{ fontWeight: 900, fontSize: "14px", marginBottom: "0.2rem" }}>
                  Returned Original Value: {casResult.returned}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>
                  {casResult.desc}
                </div>
              </div>
            )}
          </div>

          {/* C Implementation Comparison */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 900, marginBottom: "0.5rem" }}>
              Mutual Exclusion Lock Using CAS
            </h3>
            <pre style={{
              background: "#0f172a",
              color: "#38bdf8",
              padding: "1rem",
              borderRadius: 8,
              border: "1.5px solid #000000",
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: 1.6,
              margin: 0
            }}>
{`// Shared variable initialized to 0
int lock = 0;

void acquire_lock() {
    // Repeatedly compare lock to 0. If 0, atomically set to 1 and exit loop!
    while (compare_and_swap(&lock, 0, 1) != 0);
}

void release_lock() {
    lock = 0;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: BOUNDED-WAITING WITH HARDWARE (ALGORITHM 3)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "bounded" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#faf5ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🎯</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Satisfying Bounded Waiting: The Circular Token Ring Algorithm
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              To satisfy <strong>Bounded Waiting</strong>, the OS maintains a shared boolean array <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>boolean waiting[n]</code> and a global <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>boolean lock</code>.
              When a process leaves its critical section, it scans circularly: <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>j = (i + 1) % n</code>.
              If another process is waiting, it hands the entry baton directly by setting <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>waiting[j] = false</code> without setting <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>lock = false</code>!
              Every process waits at most <strong>n - 1</strong> turns!
            </p>
          </div>

          {/* Interactive Circular Ring of 4 Processes */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>
                Circular Process Ring (N = 4)
              </h3>
              <button
                onClick={resetRing}
                style={{
                  background: "#f1f5f9",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.35rem 0.85rem",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ↺ Reset Ring
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              {[0, 1, 2, 3].map((i) => {
                const isInside = ringCurrentCS === i;
                const isWaiting = ringWaiting[i];
                return (
                  <div
                    key={i}
                    style={{
                      background: isInside ? "#eff6ff" : isWaiting ? "#fefce8" : "#f8fafc",
                      border: isInside ? "3px solid #2563eb" : isWaiting ? "2px solid #ca8a04" : "2px solid #000000",
                      borderRadius: 12,
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 900, fontSize: "16px" }}>Process P{i}</span>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 900,
                          padding: "0.15rem 0.5rem",
                          borderRadius: 6,
                          border: "1px solid #000000",
                          background: isInside ? "#2563eb" : isWaiting ? "#fde047" : "#e2e8f0",
                          color: isInside ? "#ffffff" : "#000000"
                        }}>
                          {isInside ? "IN CRITICAL SECTION" : isWaiting ? "QUEUED IN waiting[]" : "IDLE"}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "0.5rem" }}>
                        waiting[{i}] = <strong>{isWaiting ? "TRUE" : "FALSE"}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => handleProcessRequest(i)}
                        disabled={isInside || isWaiting}
                        style={{
                          flex: 1,
                          background: isInside || isWaiting ? "#e2e8f0" : "#000000",
                          color: isInside || isWaiting ? "#94a3b8" : "#ffffff",
                          border: "1.5px solid #000000",
                          borderRadius: 6,
                          padding: "0.4rem",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: isInside || isWaiting ? "not-allowed" : "pointer"
                        }}
                      >
                        Request CS 🚪
                      </button>
                      <button
                        onClick={() => handleProcessExit(i)}
                        disabled={!isInside}
                        style={{
                          background: isInside ? "#16a34a" : "#f1f5f9",
                          color: isInside ? "#ffffff" : "#94a3b8",
                          border: "1.5px solid #000000",
                          borderRadius: 6,
                          padding: "0.4rem 0.75rem",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: isInside ? "pointer" : "not-allowed"
                        }}
                      >
                        Exit CS 🔓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Circular Ring Event Log */}
            <div style={{
              background: "#f8fafc",
              border: "1.5px solid #cbd5e1",
              borderRadius: 8,
              padding: "0.6rem 0.85rem",
              marginTop: "1rem",
              maxHeight: "90px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem"
            }}>
              {ringLog.map((l, i) => (
                <div key={i} style={{ color: i === 0 ? "#000" : "#64748b" }}>
                  › {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
