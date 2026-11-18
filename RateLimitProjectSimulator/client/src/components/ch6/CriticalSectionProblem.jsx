import React, { useState, useEffect, useRef } from "react";
import Classroom3DSync from "./Classroom3DSync.jsx";

const FONT = "'Lexend', sans-serif";

export default function CriticalSectionProblem() {
  const [activeTab, setActiveTab] = useState("race");

  // --- Sub-Tab 1: Race Condition Simulator State ---
  const [interleavingScenario, setInterleavingScenario] = useState("preempt_t1"); // "sequential", "preempt_t1", "preempt_t2"
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1400);

  // Simulation execution steps based on scenario
  const SCENARIOS = {
    sequential: {
      title: "Sequential Execution (No Race Condition)",
      desc: "Thread 1 (Producer) executes all 3 instructions to increment counter from 5 to 6. Then Thread 2 (Consumer) executes all 3 instructions to decrement counter from 6 to 5. Correct final value: 5.",
      steps: [
        { thread: "T1", asm: "R1 = counter", r1: 5, r2: null, mem: 5, note: "T1 loads shared memory (5) into register R1" },
        { thread: "T1", asm: "R1 = R1 + 1", r1: 6, r2: null, mem: 5, note: "T1 adds 1 in register R1 (now 6), memory still 5" },
        { thread: "T1", asm: "counter = R1", r1: 6, r2: null, mem: 6, note: "T1 writes R1 (6) back to memory. Counter is now 6." },
        { thread: "T2", asm: "R2 = counter", r1: 6, r2: 6, mem: 6, note: "T2 loads shared memory (6) into register R2" },
        { thread: "T2", asm: "R2 = R2 - 1", r1: 6, r2: 5, mem: 6, note: "T2 subtracts 1 in register R2 (now 5)" },
        { thread: "T2", asm: "counter = R2", r1: 6, r2: 5, mem: 5, note: "T2 writes R2 (5) back to memory. Correct final value: 5!" }
      ]
    },
    preempt_t1: {
      title: "Race Condition 1: Context Switch After T1 Read (Lost Increment)",
      desc: "T1 reads 5 and calculates 6 in R1, but gets PREEMPTED before writing to memory! T2 runs completely and writes 4 to memory. T1 resumes and overwrites memory with 6! Final value = 6 (or 4 if T2 writes last).",
      steps: [
        { thread: "T1", asm: "R1 = counter", r1: 5, r2: null, mem: 5, note: "T1 loads shared memory (5) into register R1" },
        { thread: "T1", asm: "R1 = R1 + 1", r1: 6, r2: null, mem: 5, note: "T1 computes R1 = 6. [PREEMPTION IMMINENT!]" },
        { thread: "OS", asm: "CONTEXT SWITCH (T1 -> T2)", r1: 6, r2: null, mem: 5, note: "OS timer interrupt! T1 state saved. T2 dispatched to CPU." },
        { thread: "T2", asm: "R2 = counter", r1: 6, r2: 5, mem: 5, note: "T2 reads stale counter (5) from memory into R2!" },
        { thread: "T2", asm: "R2 = R2 - 1", r1: 6, r2: 4, mem: 5, note: "T2 computes R2 = 4 in register." },
        { thread: "T2", asm: "counter = R2", r1: 6, r2: 4, mem: 4, note: "T2 writes 4 to memory. Counter is now 4." },
        { thread: "OS", asm: "CONTEXT SWITCH (T2 -> T1)", r1: 6, r2: 4, mem: 4, note: "T2 finishes. OS switches back to T1 with saved R1=6." },
        { thread: "T1", asm: "counter = R1", r1: 6, r2: 4, mem: 6, note: "CRITICAL HAZARD! T1 writes R1 (6) to memory, destroying T2's work! Final = 6 instead of 5!" }
      ]
    },
    preempt_t2: {
      title: "Race Condition 2: Context Switch After T2 Read (Lost Decrement)",
      desc: "T1 and T2 both read 5. T1 completes first and writes 6 to counter. Then T2 wakes up with stale R2=4 and writes counter = 4, overwriting T1's increment!",
      steps: [
        { thread: "T1", asm: "R1 = counter", r1: 5, r2: null, mem: 5, note: "T1 reads counter (5) into R1" },
        { thread: "OS", asm: "CONTEXT SWITCH (T1 -> T2)", r1: 5, r2: null, mem: 5, note: "CPU preempts T1 immediately after load." },
        { thread: "T2", asm: "R2 = counter", r1: 5, r2: 5, mem: 5, note: "T2 also reads counter (5) into R2" },
        { thread: "T2", asm: "R2 = R2 - 1", r1: 5, r2: 4, mem: 5, note: "T2 decrements: R2 is now 4" },
        { thread: "OS", asm: "CONTEXT SWITCH (T2 -> T1)", r1: 5, r2: 4, mem: 5, note: "OS switches back to T1 before T2 can write!" },
        { thread: "T1", asm: "R1 = R1 + 1", r1: 6, r2: 4, mem: 5, note: "T1 computes R1 = 6" },
        { thread: "T1", asm: "counter = R1", r1: 6, r2: 4, mem: 6, note: "T1 writes 6 to memory. Counter is 6." },
        { thread: "OS", asm: "CONTEXT SWITCH (T1 -> T2)", r1: 6, r2: 4, mem: 6, note: "OS returns to T2 to finish its last instruction." },
        { thread: "T2", asm: "counter = R2", r1: 6, r2: 4, mem: 4, note: "DISASTER! T2 overwrites memory with 4! T1's increment is completely lost! Final = 4!" }
      ]
    }
  };

  const currentSteps = SCENARIOS[interleavingScenario].steps;
  const currentStepData = currentSteps[stepIndex] || currentSteps[0];

  // Auto-play timer
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= currentSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, simSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentSteps.length, simSpeed]);

  const handleScenarioChange = (s) => {
    setInterleavingScenario(s);
    setStepIndex(0);
    setIsPlaying(false);
  };

  // --- Sub-Tab 2: Anatomy State ---
  const [anatomyStep, setAnatomyStep] = useState("entry"); // "entry", "critical", "exit", "remainder"

  // --- Sub-Tab 3: Criteria Testbench State ---
  const [selectedLockAlg, setSelectedLockAlg] = useState("lock_variable");

  const ALGORITHMS = {
    lock_variable: {
      name: "Attempt 1: Simple Lock Variable (while(lock == 1); lock = 1;)",
      code: `// Shared: int lock = 0;
void process() {
    while (lock == 1); // Wait until lock is 0
    lock = 1;          // Acquire lock
    /* CRITICAL SECTION */
    lock = 0;          // Release lock
    /* Remainder Section */
}`,
      mutualExclusion: { pass: false, reason: "FAILS! If P0 checks lock==0, gets preempted before setting lock=1, P1 also sees lock==0 and enters CS. Both in CS simultaneously!" },
      progress: { pass: true, reason: "Satisfied: If lock=0, an arriving process enters immediately without indefinite wait." },
      boundedWaiting: { pass: false, reason: "FAILS! No ordering or guarantee on who grabs lock first when multiple processes wait." },
      badge: "❌ Broken in Multiprocessing"
    },
    strict_alternation: {
      name: "Attempt 2: Strict Alternation (Turn Variable)",
      code: `// Shared: int turn = 0;
void process0() {
    while (turn != 0); // Wait for turn 0
    /* CRITICAL SECTION */
    turn = 1;          // Hand turn to P1
    /* Remainder Section */
}`,
      mutualExclusion: { pass: true, reason: "PASSES: turn can only be 0 or 1, so both cannot be in CS at the same time." },
      progress: { pass: false, reason: "FAILS! If P0 leaves CS, sets turn=1, but P1 is stuck in its remainder section or terminates, P0 can NEVER enter CS again! Violates progress!" },
      boundedWaiting: { pass: true, reason: "PASSES: Processes take strict alternate turns (P0 -> P1 -> P0)." },
      badge: "⚠️ Fails Progress Requirement"
    },
    flag_variable: {
      name: "Attempt 3: Flag Array (Ready Flags)",
      code: `// Shared: boolean flag[2] = {false, false};
void process0() {
    flag[0] = true;    // Express interest
    while (flag[1]);   // Wait while P1 wants in
    /* CRITICAL SECTION */
    flag[0] = false;
}`,
      mutualExclusion: { pass: true, reason: "PASSES: Neither enters if the other's flag is true." },
      progress: { pass: false, reason: "FAILS DEADLOCK! If both set flag[0]=true and flag[1]=true simultaneously, both loop in while() forever waiting for the other to release!" },
      boundedWaiting: { pass: false, reason: "FAILS due to mutual deadlock stalling both indefinitely." },
      badge: "💀 Deadlock Hazard"
    }
  };

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "0.5rem" }}>
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "3d_classroom", label: "🏫 3D Classroom Analogy (Teacher Access)" },
          { id: "race", label: "⚡ The Race Condition Hazard" },
          { id: "anatomy", label: "🏛️ Critical Section Anatomy" },
          { id: "criteria", label: "⚖️ The 3 Golden Criteria" }
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
          TAB 1: RACE CONDITION SIMULATOR
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "race" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Overview Banner */}
          <div style={{ background: "#eff6ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🚨</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Why Concurrency Breaks Without Synchronization: The Race Condition
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              A <strong>race condition</strong> occurs when several processes access and manipulate the same shared data concurrently,
              and the outcome of the execution depends on the particular order in which access takes place.
              Even a single high-level line of code like <code style={{ background: "#ffffff", padding: "2px 6px", border: "1px solid #000000", borderRadius: 4 }}>counter++</code> compiles down to <strong>three separate machine instructions</strong> in the CPU!
            </p>
          </div>

          {/* Interactive Scenario Picker & Playback Controls */}
          <div style={{
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b" }}>
                  Select Interleaving Schedule
                </span>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                  {[
                    { id: "sequential", label: "✅ 1. Sequential (No Hazard)", color: "#16a34a" },
                    { id: "preempt_t1", label: "⚠️ 2. Preempt T1 after Read (Final=6)", color: "#dc2626" },
                    { id: "preempt_t2", label: "⚠️ 3. Preempt T2 after Read (Final=4)", color: "#dc2626" }
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => handleScenarioChange(sc.id)}
                      style={{
                        background: interleavingScenario === sc.id ? "#000000" : "#f8fafc",
                        color: interleavingScenario === sc.id ? "#ffffff" : "#000000",
                        border: "2px solid #000000",
                        borderRadius: 8,
                        padding: "0.45rem 0.85rem",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: isPlaying ? "#ea580c" : "#2563eb",
                    color: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.45rem 1rem",
                    fontSize: "13px",
                    fontWeight: 900,
                    cursor: "pointer"
                  }}
                >
                  {isPlaying ? "⏸ Pause" : "▶ Auto Play"}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIndex((prev) => Math.min(prev + 1, currentSteps.length - 1));
                  }}
                  disabled={stepIndex >= currentSteps.length - 1}
                  style={{
                    background: "#ffffff",
                    color: "#000000",
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.45rem 0.85rem",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: stepIndex >= currentSteps.length - 1 ? "not-allowed" : "pointer",
                    opacity: stepIndex >= currentSteps.length - 1 ? 0.5 : 1
                  }}
                >
                  Step Next ⏩
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIndex(0);
                  }}
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
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "12px", fontWeight: 700 }}>
                  <span>Speed:</span>
                  <select
                    value={simSpeed}
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    style={{ border: "1.5px solid #000000", borderRadius: 6, padding: "0.2rem 0.4rem", fontFamily: FONT, fontWeight: 700 }}
                  >
                    <option value={2000}>0.5x Slow</option>
                    <option value={1400}>1.0x Normal</option>
                    <option value={800}>1.8x Fast</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scenario Description Banner */}
            <div style={{ background: "#f8fafc", border: "1.5px dashed #000000", borderRadius: 8, padding: "0.75rem 1rem" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000", marginBottom: "0.2rem" }}>
                {SCENARIOS[interleavingScenario].title}
              </div>
              <div style={{ fontSize: "13px", color: "#334155" }}>
                {SCENARIOS[interleavingScenario].desc}
              </div>
            </div>
          </div>

          {/* Live CPU & Memory Visualizer Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* Thread 1 (Producer) Core Box */}
            <div style={{
              background: currentStepData.thread === "T1" ? "#eff6ff" : "#ffffff",
              border: currentStepData.thread === "T1" ? "3px solid #2563eb" : "2px solid #000000",
              borderRadius: 12,
              padding: "1.25rem",
              transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>🧵</span>
                  <span style={{ fontWeight: 900, fontSize: "15px" }}>Thread 1: Producer</span>
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "0.2rem 0.5rem",
                  borderRadius: 6,
                  background: currentStepData.thread === "T1" ? "#2563eb" : "#e2e8f0",
                  color: currentStepData.thread === "T1" ? "#ffffff" : "#000000",
                  border: "1px solid #000000"
                }}>
                  {currentStepData.thread === "T1" ? "ACTIVE ON CPU" : "IDLE / WAITING"}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginBottom: "0.5rem" }}>
                High-level code: <code style={{ fontWeight: 800, color: "#000" }}>counter++</code>
              </div>
              <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "0.4rem" }}>
                  Private Hardware Register (R1)
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb" }}>
                    {currentStepData.r1 !== null ? currentStepData.r1 : "—"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {currentStepData.r1 !== null ? "(loaded into CPU register)" : "(uninitialized)"}
                  </span>
                </div>
              </div>
              {/* Assembly steps */}
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "12px" }}>
                {[
                  { op: "R1 = counter", desc: "Load from RAM into R1" },
                  { op: "R1 = R1 + 1", desc: "ALU increment" },
                  { op: "counter = R1", desc: "Store R1 back to RAM" }
                ].map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: 6,
                      background: currentStepData.thread === "T1" && currentStepData.asm.startsWith(ins.op.split(" ")[0]) ? "#bfdbfe" : "#f8fafc",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "monospace",
                      fontWeight: 700
                    }}
                  >
                    <span>{ins.op}</span>
                    <span style={{ color: "#64748b", fontSize: "11px", fontFamily: FONT }}>{ins.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared RAM Box */}
            <div style={{
              background: "#ffffff",
              border: "3px solid #000000",
              borderRadius: 12,
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
            }}>
              <span style={{ fontSize: "1.8rem", marginBottom: "0.2rem" }}>💾</span>
              <div style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                Shared Main Memory (RAM)
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, margin: "0.2rem 0" }}>
                Variable: <code style={{ color: "#000000" }}>counter</code>
              </div>
              <div style={{
                background: "#f1f5f9",
                border: "2px solid #000000",
                borderRadius: 10,
                padding: "0.5rem 1.5rem",
                marginTop: "0.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "3rem", fontWeight: 900, color: currentStepData.mem === 5 ? "#16a34a" : "#dc2626" }}>
                  {currentStepData.mem}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b" }}>
                  {stepIndex === currentSteps.length - 1 ? (currentStepData.mem === 5 ? "CORRECT VALUE" : "CORRUPTED VALUE!") : "CURRENT VALUE"}
                </span>
              </div>
              <div style={{ marginTop: "0.75rem", fontSize: "12px", textAlign: "center", color: "#475569" }}>
                Expected after (+1) and (-1): <strong>5</strong>
              </div>
            </div>

            {/* Thread 2 (Consumer) Core Box */}
            <div style={{
              background: currentStepData.thread === "T2" ? "#fef2f2" : "#ffffff",
              border: currentStepData.thread === "T2" ? "3px solid #dc2626" : "2px solid #000000",
              borderRadius: 12,
              padding: "1.25rem",
              transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>🧵</span>
                  <span style={{ fontWeight: 900, fontSize: "15px" }}>Thread 2: Consumer</span>
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  padding: "0.2rem 0.5rem",
                  borderRadius: 6,
                  background: currentStepData.thread === "T2" ? "#dc2626" : "#e2e8f0",
                  color: currentStepData.thread === "T2" ? "#ffffff" : "#000000",
                  border: "1px solid #000000"
                }}>
                  {currentStepData.thread === "T2" ? "ACTIVE ON CPU" : "IDLE / WAITING"}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#475569", marginBottom: "0.5rem" }}>
                High-level code: <code style={{ fontWeight: 800, color: "#000" }}>counter--</code>
              </div>
              <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "0.4rem" }}>
                  Private Hardware Register (R2)
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 900, color: "#dc2626" }}>
                    {currentStepData.r2 !== null ? currentStepData.r2 : "—"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {currentStepData.r2 !== null ? "(loaded into CPU register)" : "(uninitialized)"}
                  </span>
                </div>
              </div>
              {/* Assembly steps */}
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "12px" }}>
                {[
                  { op: "R2 = counter", desc: "Load from RAM into R2" },
                  { op: "R2 = R2 - 1", desc: "ALU decrement" },
                  { op: "counter = R2", desc: "Store R2 back to RAM" }
                ].map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "0.35rem 0.6rem",
                      borderRadius: 6,
                      background: currentStepData.thread === "T2" && currentStepData.asm.startsWith(ins.op.split(" ")[0]) ? "#fecaca" : "#f8fafc",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "monospace",
                      fontWeight: 700
                    }}
                  >
                    <span>{ins.op}</span>
                    <span style={{ color: "#64748b", fontSize: "11px", fontFamily: FONT }}>{ins.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stepper Execution Log Bar */}
          <div style={{
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                background: currentStepData.thread === "OS" ? "#eab308" : currentStepData.thread === "T1" ? "#2563eb" : "#dc2626",
                color: currentStepData.thread === "OS" ? "#000000" : "#ffffff",
                fontWeight: 900,
                fontSize: "12px",
                padding: "0.25rem 0.6rem",
                borderRadius: 6,
                border: "1.5px solid #000000"
              }}>
                Step {stepIndex + 1} of {currentSteps.length}
              </span>
              <div>
                <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "15px" }}>
                  {currentStepData.asm}
                </span>
                <span style={{ marginLeft: "0.75rem", fontSize: "13px", color: "#475569" }}>
                  — {currentStepData.note}
                </span>
              </div>
            </div>
            {stepIndex === currentSteps.length - 1 && (
              <span style={{
                fontSize: "12px",
                fontWeight: 900,
                padding: "0.3rem 0.75rem",
                borderRadius: 6,
                border: "1.5px solid #000000",
                background: currentStepData.mem === 5 ? "#dcfce7" : "#fee2e2",
                color: currentStepData.mem === 5 ? "#166534" : "#991b1b"
              }}>
                {currentStepData.mem === 5 ? "Result Valid: Counter = 5" : `CRITICAL RACE HAZARD: Result Counter = ${currentStepData.mem}!`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: CRITICAL SECTION ANATOMY
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "anatomy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0" }}>
              The 4 Architectural Sections of a Concurrent Process
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              To prevent race conditions, any code that reads or writes shared memory is isolated into a <strong>Critical Section (CS)</strong>.
              A process must request permission to enter, execute safely inside without interference, and then signal upon exit.
            </p>
          </div>

          {/* Interactive Flow Diagram */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem"
          }}>
            {[
              {
                id: "entry",
                num: "01",
                name: "Entry Section",
                icon: "🚪",
                color: "#2563eb",
                bg: "#eff6ff",
                border: "#93c5fd",
                role: "Requests Permission",
                desc: "Code where the process asks for permission to enter its critical section. It sets flags, tests locks, or calls wait()/acquire(). If another process is inside, it waits or sleeps here."
              },
              {
                id: "critical",
                num: "02",
                name: "Critical Section (CS)",
                icon: "🛡️",
                color: "#dc2626",
                bg: "#fef2f2",
                border: "#fca5a5",
                role: "Accesses Shared Data",
                desc: "The protected zone where shared variables, tables, or hardware registers are modified. MUST satisfy Mutual Exclusion: at most ONE process inside at any instant."
              },
              {
                id: "exit",
                num: "03",
                name: "Exit Section",
                icon: "🔓",
                color: "#16a34a",
                bg: "#f0fdf4",
                border: "#86efac",
                role: "Releases Access",
                desc: "Code executed immediately after leaving the critical section. Releases locks, resets flags, or calls signal()/release() to wake up queued waiting processes."
              },
              {
                id: "remainder",
                num: "04",
                name: "Remainder Section",
                icon: "🌱",
                color: "#7c3aed",
                bg: "#faf5ff",
                border: "#d8b4fe",
                role: "Non-Critical Execution",
                desc: "The remaining ordinary code executed by the process that does NOT touch any shared state (local computation, logging, independent I/O). Must never block others!"
              }
            ].map((sec) => {
              const isSelected = anatomyStep === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => setAnatomyStep(sec.id)}
                  style={{
                    background: isSelected ? sec.bg : "#ffffff",
                    border: isSelected ? `3px solid ${sec.color}` : "2px solid #000000",
                    borderRadius: 12,
                    padding: "1.25rem",
                    cursor: "pointer",
                    boxShadow: isSelected ? "3px 3px 0px #000000" : "none",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.6rem" }}>{sec.icon}</span>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "0.15rem 0.5rem",
                        borderRadius: 6,
                        background: sec.bg,
                        border: "1px solid #000000",
                        color: "#000000"
                      }}>
                        Part {sec.num}
                      </span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 900, marginBottom: "0.2rem" }}>
                      {sec.name}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: sec.color, marginBottom: "0.6rem" }}>
                      ● {sec.role}
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#334155", margin: 0 }}>
                      {sec.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Canonical C Code Template with Interactive Highlight */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 900, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>💻</span> Canonical General Structure of Process P<sub>i</sub>
            </div>
            <pre style={{
              background: "#0f172a",
              color: "#f8fafc",
              padding: "1.25rem",
              borderRadius: 8,
              border: "1.5px solid #000000",
              fontFamily: "monospace",
              fontSize: "14px",
              lineHeight: 1.8,
              overflowX: "auto",
              margin: 0
            }}>
{`do {
`}
<span style={{
  background: anatomyStep === "entry" ? "#1e3a8a" : "transparent",
  color: anatomyStep === "entry" ? "#93c5fd" : "#38bdf8",
  padding: "2px 6px",
  borderRadius: 4,
  display: "inline-block",
  width: "100%"
}}>
{`    /* 1. ENTRY SECTION */
    acquire_lock();               // Request permission (e.g. wait(mutex), test_and_set)`}
</span>
{`
`}
<span style={{
  background: anatomyStep === "critical" ? "#7f1d1d" : "transparent",
  color: anatomyStep === "critical" ? "#fca5a5" : "#f87171",
  padding: "2px 6px",
  borderRadius: 4,
  display: "inline-block",
  width: "100%"
}}>
{`    /* 2. CRITICAL SECTION */
    balance = balance + deposit;  // Manipulate shared state safely`}
</span>
{`
`}
<span style={{
  background: anatomyStep === "exit" ? "#14532d" : "transparent",
  color: anatomyStep === "exit" ? "#86efac" : "#4ade80",
  padding: "2px 6px",
  borderRadius: 4,
  display: "inline-block",
  width: "100%"
}}>
{`    /* 3. EXIT SECTION */
    release_lock();               // Release permission (e.g. signal(mutex), lock = false)`}
</span>
{`
`}
<span style={{
  background: anatomyStep === "remainder" ? "#581c87" : "transparent",
  color: anatomyStep === "remainder" ? "#d8b4fe" : "#c084fc",
  padding: "2px 6px",
  borderRadius: 4,
  display: "inline-block",
  width: "100%"
}}>
{`    /* 4. REMAINDER SECTION */
    perform_local_logging();      // Non-critical operations`}
</span>
{`
} while (true);`}
            </pre>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: THE 3 GOLDEN CRITERIA & FAILED ATTEMPTS TESTBENCH
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "criteria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Criteria Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "#eff6ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>1️⃣</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>Mutual Exclusion</h3>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#1e293b", margin: 0 }}>
                If process <strong>P<sub>i</sub></strong> is executing in its critical section, then <strong>no other processes</strong> can be executing in their critical sections simultaneously.
                This is the absolute non-negotiable correctness condition.
              </p>
            </div>

            <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>2️⃣</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>Progress</h3>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#1e293b", margin: 0 }}>
                If no process is in its critical section and some processes wish to enter, only those processes <strong>not in their remainder section</strong> can participate in deciding who enters next, and this selection <strong>cannot be postponed indefinitely</strong>.
              </p>
            </div>

            <div style={{ background: "#fefce8", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>3️⃣</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>Bounded Waiting</h3>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#1e293b", margin: 0 }}>
                There must exist a <strong>bound (limit)</strong> on the number of times other processes are allowed to enter their critical sections after a process has made a request to enter and before that request is granted.
                Guarantees <strong>no starvation</strong>!
              </p>
            </div>
          </div>

          {/* Interactive Naive Lock Testbench */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: "0 0 0.25rem 0" }}>
                  Interactive Testbench: Why Naive Software Solutions Fail
                </h3>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Select an algorithm to evaluate whether it satisfies all 3 criteria.
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {Object.keys(ALGORITHMS).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedLockAlg(key)}
                    style={{
                      background: selectedLockAlg === key ? "#000000" : "#f1f5f9",
                      color: selectedLockAlg === key ? "#ffffff" : "#000000",
                      border: "2px solid #000000",
                      borderRadius: 8,
                      padding: "0.45rem 0.85rem",
                      fontSize: "13px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    {key === "lock_variable" ? "Attempt 1: Lock Var" : key === "strict_alternation" ? "Attempt 2: Strict Turn" : "Attempt 3: Flag Array"}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Algorithm Details */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
              {/* Code */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "13px", fontWeight: 900 }}>Pseudocode Implementation:</span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#dc2626" }}>
                    {ALGORITHMS[selectedLockAlg].badge}
                  </span>
                </div>
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
                  {ALGORITHMS[selectedLockAlg].code}
                </pre>
              </div>

              {/* Criteria Scorecard */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <span style={{ fontSize: "13px", fontWeight: 900 }}>3 Criteria Scorecard:</span>

                {/* Mutual Exclusion */}
                <div style={{
                  border: "1.5px solid #000000",
                  borderRadius: 8,
                  padding: "0.65rem 0.85rem",
                  background: ALGORITHMS[selectedLockAlg].mutualExclusion.pass ? "#f0fdf4" : "#fef2f2"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span>{ALGORITHMS[selectedLockAlg].mutualExclusion.pass ? "✅" : "❌"}</span>
                    <strong style={{ fontSize: "13px" }}>Mutual Exclusion</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#334155" }}>
                    {ALGORITHMS[selectedLockAlg].mutualExclusion.reason}
                  </div>
                </div>

                {/* Progress */}
                <div style={{
                  border: "1.5px solid #000000",
                  borderRadius: 8,
                  padding: "0.65rem 0.85rem",
                  background: ALGORITHMS[selectedLockAlg].progress.pass ? "#f0fdf4" : "#fef2f2"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span>{ALGORITHMS[selectedLockAlg].progress.pass ? "✅" : "❌"}</span>
                    <strong style={{ fontSize: "13px" }}>Progress</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#334155" }}>
                    {ALGORITHMS[selectedLockAlg].progress.reason}
                  </div>
                </div>

                {/* Bounded Waiting */}
                <div style={{
                  border: "1.5px solid #000000",
                  borderRadius: 8,
                  padding: "0.65rem 0.85rem",
                  background: ALGORITHMS[selectedLockAlg].boundedWaiting.pass ? "#f0fdf4" : "#fef2f2"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                    <span>{ALGORITHMS[selectedLockAlg].boundedWaiting.pass ? "✅" : "❌"}</span>
                    <strong style={{ fontSize: "13px" }}>Bounded Waiting</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#334155" }}>
                    {ALGORITHMS[selectedLockAlg].boundedWaiting.reason}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
