import React, { useState } from "react";

const FONT = "'Lexend', sans-serif";

export default function Semaphores() {
  const [activeTab, setActiveTab] = useState("playground");

  // ── Tab 1: Semaphore Playground State ──
  const [capacity, setCapacity] = useState(3); // e.g. 3 database connections
  const [semValue, setSemValue] = useState(3);
  const [activeProcesses, setActiveProcesses] = useState([]); // list of process IDs holding resource
  const [waitingQueue, setWaitingQueue] = useState([]); // list of process IDs blocked
  const [nextPid, setNextPid] = useState(1);
  const [semLog, setSemLog] = useState(["Counting Semaphore initialized with capacity = 3."]);

  const addSemLog = (msg) => {
    setSemLog((prev) => [msg, ...prev.slice(0, 10)]);
  };

  const handleWait = () => {
    const pid = nextPid;
    setNextPid((p) => p + 1);

    // Dijkstra's non-busy waiting logic:
    // S->value--; if (S->value < 0) { add to S->list; block(); }
    setSemValue((val) => {
      const newVal = val - 1;
      if (newVal < 0) {
        setWaitingQueue((q) => [...q, pid]);
        addSemLog(`⏳ P${pid} called wait(S): S->value is now ${newVal} (< 0). No resources free! P${pid} is BLOCKED and put in queue.`);
      } else {
        setActiveProcesses((a) => [...a, pid]);
        addSemLog(`🟢 P${pid} called wait(S): S->value is now ${newVal} (>= 0). Resource allocated! P${pid} enters CS.`);
      }
      return newVal;
    });
  };

  const handleSignal = () => {
    if (activeProcesses.length === 0 && waitingQueue.length === 0 && semValue === capacity) {
      addSemLog("⚠️ S is already at maximum capacity. No active processes to release.");
      return;
    }

    // Dijkstra's non-busy waiting signal:
    // S->value++; if (S->value <= 0) { remove P from S->list; wakeup(P); }
    setSemValue((val) => {
      const newVal = val + 1;
      if (waitingQueue.length > 0) {
        const [wokenPid, ...rest] = waitingQueue;
        setWaitingQueue(rest);
        setActiveProcesses((a) => {
          // Release first active process (or just transition woken to active)
          const remainingActive = a.slice(1);
          return [...remainingActive, wokenPid];
        });
        addSemLog(`🔔 signal(S) called: S->value is now ${newVal}. Queue had waiting processes! OS woke up P${wokenPid} and dispatched it to CS!`);
      } else {
        setActiveProcesses((a) => a.slice(1));
        addSemLog(`🔓 signal(S) called: S->value is now ${newVal}. One resource freed back to pool.`);
      }
      return newVal;
    });
  };

  const resetPlayground = (newCap = capacity) => {
    setCapacity(newCap);
    setSemValue(newCap);
    setActiveProcesses([]);
    setWaitingQueue([]);
    setNextPid(1);
    setSemLog([`Semaphore reset. Capacity = ${newCap}, S->value = ${newCap}.`]);
  };

  // ── Tab 3: Deadlock & Mars Pathfinder State ──
  const [deadlockState, setDeadlockState] = useState({
    p0Step: "idle", // "idle", "holds_s", "waiting_q"
    p1Step: "idle", // "idle", "holds_q", "waiting_s"
    sLockedBy: null,
    qLockedBy: null
  });

  const [pathfinderState, setPathfinderState] = useState({
    useInheritance: false,
    step: 0,
    info: "Click 'Next Step' to walk through the Mars Pathfinder priority anomaly."
  });

  const PATHFINDER_STEPS = [
    {
      title: "Step 1: Low-Priority Task (L) Acquires Mutex",
      desc: "Task L (Meteorological Weather Gatherer) runs occasionally, acquires the shared 'Info_Bus_Mutex', and begins publishing temperature data.",
      lPriority: 10,
      lState: "running_with_mutex",
      mState: "idle",
      hState: "idle",
      alert: "L is in its Critical Section holding Info_Bus_Mutex."
    },
    {
      title: "Step 2: High-Priority Task (H) Preempts L and Requests Mutex",
      desc: "Task H (Attitude Control / Radio Link) wakes up! Since H has highest priority, it preempts L and runs. But H immediately needs 'Info_Bus_Mutex'. It calls wait(mutex) and gets BLOCKED because L holds it!",
      lPriority: 10,
      lState: "blocked_waiting_cpu",
      mState: "idle",
      hState: "blocked_on_mutex",
      alert: "H is sleeping waiting for mutex. CPU should return to L so it can finish its CS and release the mutex."
    },
    {
      title: "Step 3: Disaster! Medium-Priority Tasks (M) Preempt L!",
      desc: "Before L can finish its CS, Medium-priority Communications tasks (M) wake up! Since M (Priority 20) is higher than L (Priority 10), M PREEMPTS L! M doesn't need the mutex, so M runs uninterrupted for seconds!",
      lPriority: 10,
      lState: "starved_by_m",
      mState: "running_hogging_cpu",
      hState: "blocked_on_mutex",
      alert: "PRIORITY INVERSION! Medium task M is indirectly starving High task H! L cannot finish to release mutex!"
    },
    {
      title: "Step 4: Watchdog Timer Trips & Spacecraft Reboots!",
      desc: "Task H has been starved so long that the hardware Watchdog Timer detects system unresponsiveness and forces a total system reboot! Data is lost on Mars!",
      lPriority: 10,
      lState: "rebooted",
      mState: "rebooted",
      hState: "rebooted",
      alert: "🚨 SYSTEM CRASH: Total reset triggered on the surface of Mars!"
    }
  ];

  const PATHFINDER_FIXED_STEPS = [
    {
      title: "Step 1: Low-Priority Task (L) Acquires Mutex",
      desc: "Task L (Priority 10) acquires Info_Bus_Mutex and begins working in its Critical Section.",
      lPriority: 10,
      lState: "running_with_mutex",
      mState: "idle",
      hState: "idle",
      alert: "L is in CS."
    },
    {
      title: "Step 2: Task H Requests Mutex -> Priority Inheritance Kicks In!",
      desc: "Task H (Priority 30) requests the mutex and blocks. Under Priority Inheritance, the OS instantly BOOSTS Task L's priority to 30 (H's priority) as long as it holds H's mutex!",
      lPriority: 30, // Inherited!
      lState: "boosted_running",
      mState: "idle",
      hState: "blocked_on_mutex",
      alert: "⚡ PRIORITY INHERITANCE: L's priority dynamically promoted from 10 -> 30!"
    },
    {
      title: "Step 3: Medium Task M Wakes Up But Cannot Preempt Boosted L!",
      desc: "Medium task M (Priority 20) attempts to run, but L now has Priority 30! M cannot preempt L. L quickly finishes its Critical Section and calls signal(mutex).",
      lPriority: 10, // Returns to normal
      lState: "finished_cs",
      mState: "ready",
      hState: "running_mutex_acquired",
      alert: "✓ L finishes CS immediately, drops back to Priority 10, and passes mutex directly to H!"
    },
    {
      title: "Step 4: High-Priority Task H Runs Successfully!",
      desc: "Task H acquires the mutex, completes attitude control calculations without delay, and feeds the watchdog timer. Mission saved!",
      lPriority: 10,
      lState: "idle",
      mState: "ready",
      hState: "complete",
      alert: "🏆 SUCCESS: No priority inversion, zero restarts!"
    }
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "0.5rem" }}>
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "playground", label: "🚦 1. Semaphore Playground (Counting & Binary)" },
          { id: "mechanics", label: "⚙️ 2. Busy-Wait vs Block/Wakeup Queue Mechanics" },
          { id: "hazards", label: "🪐 3. Deadlocks & The Mars Pathfinder Bug" }
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
          TAB 1: SEMAPHORE PLAYGROUND
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "playground" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Header Banner */}
          <div style={{ background: "#faf5ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🚦</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Dijkstra's Semaphore: The Gold Standard OS Synchronization Primitive
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              A semaphore is an integer variable accessed exclusively through two atomic operations:
              <strong style={{ color: "#7c3aed" }}> wait()</strong> (P — decrements) and
              <strong style={{ color: "#16a34a" }}> signal()</strong> (V — increments).
              Use the interactive controls below to simulate a resource pool (e.g. database connections or printers) and observe the blocked queue when capacity is exceeded!
            </p>
          </div>

          {/* Mode Switcher & Monitor */}
          <div style={{
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "13px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>Mode:</span>
              <button
                onClick={() => resetPlayground(1)}
                style={{
                  background: capacity === 1 ? "#000000" : "#f1f5f9",
                  color: capacity === 1 ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.85rem",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Binary Semaphore (Mutex, Cap = 1)
              </button>
              <button
                onClick={() => resetPlayground(3)}
                style={{
                  background: capacity === 3 ? "#000000" : "#f1f5f9",
                  color: capacity === 3 ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.85rem",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Counting Semaphore (Pool, Cap = 3)
              </button>
            </div>

            {/* Live Semaphore S Counter Box */}
            <div style={{
              background: semValue > 0 ? "#f0fdf4" : semValue === 0 ? "#eff6ff" : "#fef2f2",
              border: "2px solid #000000",
              borderRadius: 10,
              padding: "0.5rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>
                  Internal Counter
                </div>
                <div style={{ fontSize: "14px", fontWeight: 900 }}>
                  S-&gt;value
                </div>
              </div>
              <span style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                color: semValue > 0 ? "#16a34a" : semValue === 0 ? "#2563eb" : "#dc2626"
              }}>
                {semValue}
              </span>
            </div>
          </div>

          {/* Meaning of Value Explainer */}
          <div style={{
            background: "#f8fafc",
            border: "1.5px dashed #000000",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            fontSize: "13px",
            lineHeight: 1.5
          }}>
            {semValue > 0 && (
              <span style={{ color: "#166534", fontWeight: 700 }}>
                🟢 <strong>S-&gt;value is Positive ({semValue}):</strong> Exactly {semValue} resource slot{semValue > 1 ? "s are" : " is"} immediately available. Arriving processes will enter without blocking!
              </span>
            )}
            {semValue === 0 && (
              <span style={{ color: "#1e40af", fontWeight: 700 }}>
                🔵 <strong>S-&gt;value is Zero (0):</strong> All resources are currently in use. The next process to call wait() will block!
              </span>
            )}
            {semValue < 0 && (
              <span style={{ color: "#991b1b", fontWeight: 700 }}>
                🔴 <strong>S-&gt;value is Negative ({semValue}):</strong> Magnitude |{semValue}| represents the <strong>exact count of processes ({Math.abs(semValue)})</strong> currently sleeping in the OS blocked queue!
              </span>
            )}
          </div>

          {/* Interactive Resource Slots & Waiting Queue View */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
            {/* Active Resource Holders */}
            <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 900, fontSize: "15px" }}>
                  🛡️ Active Resource Slots ({activeProcesses.length} / {capacity})
                </span>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
                  Inside Critical Section
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", minHeight: "65px", alignItems: "center" }}>
                {Array.from({ length: capacity }).map((_, slotIdx) => {
                  const pid = activeProcesses[slotIdx];
                  return (
                    <div
                      key={slotIdx}
                      style={{
                        flex: 1,
                        minWidth: "75px",
                        height: "65px",
                        borderRadius: 10,
                        border: pid ? "2px solid #16a34a" : "2px dashed #cbd5e1",
                        background: pid ? "#dcfce7" : "#f8fafc",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900
                      }}
                    >
                      {pid ? (
                        <>
                          <span style={{ fontSize: "13px", color: "#166534" }}>Process</span>
                          <span style={{ fontSize: "18px", color: "#166534" }}>P{pid}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>FREE</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waiting Queue (PCB List) */}
            <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontWeight: 900, fontSize: "15px" }}>
                  ⏳ OS Blocked Queue S-&gt;list ({waitingQueue.length} Waiting)
                </span>
                <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700 }}>
                  Sleep state / PCB blocked
                </span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", minHeight: "65px", alignItems: "center" }}>
                {waitingQueue.length === 0 ? (
                  <div style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                    No processes waiting. (Queue empty)
                  </div>
                ) : (
                  waitingQueue.map((pid, qIdx) => (
                    <div
                      key={pid}
                      style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: 8,
                        background: "#fee2e2",
                        border: "2px solid #dc2626",
                        color: "#991b1b",
                        fontWeight: 900,
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem"
                      }}
                    >
                      <span>💤 P{pid}</span>
                      <span style={{ fontSize: "10px", background: "#ffffff", padding: "1px 4px", borderRadius: 4, border: "1px solid #dc2626" }}>
                        #{qIdx + 1}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Interactive Action Buttons */}
          <div style={{
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={handleWait}
                style={{
                  background: "#7c3aed",
                  color: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem 1.2rem",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                + Spawn Process: Call wait(S) [P]
              </button>
              <button
                onClick={handleSignal}
                disabled={activeProcesses.length === 0 && waitingQueue.length === 0}
                style={{
                  background: activeProcesses.length === 0 && waitingQueue.length === 0 ? "#e2e8f0" : "#16a34a",
                  color: activeProcesses.length === 0 && waitingQueue.length === 0 ? "#94a3b8" : "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem 1.2rem",
                  fontSize: "14px",
                  fontWeight: 900,
                  cursor: activeProcesses.length === 0 && waitingQueue.length === 0 ? "not-allowed" : "pointer"
                }}
              >
                - Call signal(S) [V] (Release)
              </button>
              <button
                onClick={() => resetPlayground()}
                style={{
                  background: "#f1f5f9",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem 1rem",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ↺ Reset
              </button>
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
            {semLog.map((l, i) => (
              <div key={i} style={{ color: i === 0 ? "#000" : "#64748b" }}>
                › {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: BUSY-WAIT VS NON-BUSY WAIT MECHANICS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "mechanics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0" }}>
              Implementation Trade-off: Spinlocks vs Non-Busy Waiting
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              The classic definition of <code style={{ fontWeight: 800 }}>wait()</code> uses a busy-waiting loop (<code style={{ fontWeight: 800 }}>while (S &lt;= 0); S--;</code>).
              While useful for short locks on multiprocessors (spinlocks), it burns CPU power. Modern operating systems implement semaphores using <strong>process blocking and queues</strong>.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
            {/* Approach 1: Spinlock */}
            <div style={{ background: "#fffbeb", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🔄</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>1. Busy-Waiting (Spinlock)</h3>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#475569" }}>
                Process repeatedly evaluates condition in a tight loop. No context switches required.
              </p>
              <pre style={{
                background: "#0f172a",
                color: "#fde047",
                padding: "0.85rem",
                borderRadius: 8,
                fontSize: "12px",
                fontFamily: "monospace",
                lineHeight: 1.6,
                margin: "0.5rem 0"
              }}>
{`wait(S) {
    while (S <= 0); // Busy wait (spin)
    S--;
}

signal(S) {
    S++;
}`}
              </pre>
              <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
                <div style={{ color: "#166534", fontWeight: 700, marginBottom: "0.2rem" }}>
                  ✓ PRO: Zero context switch overhead if lock is held for extremely short durations (&lt; 2 context switches).
                </div>
                <div style={{ color: "#991b1b", fontWeight: 700 }}>
                  ✗ CON: 100% CPU burn while spinning. Catastrophic on uniprocessors!
                </div>
              </div>
            </div>

            {/* Approach 2: Non-Busy Waiting with Block/Wakeup */}
            <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>💤</span>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>2. Non-Busy Waiting (OS Queue)</h3>
              </div>
              <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#475569" }}>
                Process suspends itself via <code style={{ fontWeight: 800 }}>block()</code> and is placed in a waiting queue. Another process invokes <code style={{ fontWeight: 800 }}>wakeup()</code>.
              </p>
              <pre style={{
                background: "#0f172a",
                color: "#86efac",
                padding: "0.85rem",
                borderRadius: 8,
                fontSize: "12px",
                fontFamily: "monospace",
                lineHeight: 1.6,
                margin: "0.5rem 0"
              }}>
{`typedef struct {
    int value;
    struct process *list;
} semaphore;

void wait(semaphore *S) {
    S->value--;
    if (S->value < 0) {
        add this process to S->list;
        block(); // OS sleep
    }
}

void signal(semaphore *S) {
    S->value++;
    if (S->value <= 0) {
        remove P from S->list;
        wakeup(P); // OS wake
    }
}`}
              </pre>
              <div style={{ fontSize: "12px", lineHeight: 1.5 }}>
                <div style={{ color: "#166534", fontWeight: 700, marginBottom: "0.2rem" }}>
                  ✓ PRO: CPU is instantly yielded to other ready processes. 0% wasted CPU.
                </div>
                <div style={{ color: "#991b1b", fontWeight: 700 }}>
                  ✗ CON: Incurs context switch overhead (saving/restoring registers, TLB flush).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: DEADLOCKS & MARS PATHFINDER
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "hazards" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Section A: Deadlock with 2 Semaphores */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.4rem" }}>💀</span>
              <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>
                Semaphore Deadlock Hazard: Inconsistent Acquisition Order
              </h3>
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.6, color: "#334155" }}>
              Suppose two semaphores <code style={{ fontWeight: 800 }}>S</code> and <code style={{ fontWeight: 800 }}>Q</code> are initialized to 1.
              If Process P0 acquires <code style={{ fontWeight: 800 }}>S</code> first and Process P1 acquires <code style={{ fontWeight: 800 }}>Q</code> first,
              both will block forever on their second <code style={{ fontWeight: 800 }}>wait()</code> call!
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.75rem" }}>
              <div style={{ background: "#eff6ff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem" }}>
                <strong style={{ fontSize: "14px" }}>Process P0</strong>
                <pre style={{ background: "#0f172a", color: "#93c5fd", padding: "0.5rem", borderRadius: 6, fontSize: "12px", fontFamily: "monospace", marginTop: "0.35rem" }}>
{`wait(S); // S locks
wait(Q); // Blocks waiting for Q!`}
                </pre>
              </div>
              <div style={{ background: "#fef2f2", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem" }}>
                <strong style={{ fontSize: "14px" }}>Process P1</strong>
                <pre style={{ background: "#0f172a", color: "#fca5a5", padding: "0.5rem", borderRadius: 6, fontSize: "12px", fontFamily: "monospace", marginTop: "0.35rem" }}>
{`wait(Q); // Q locks
wait(S); // Blocks waiting for S!`}
                </pre>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", background: "#fee2e2", border: "1.5px solid #dc2626", borderRadius: 8, padding: "0.6rem", fontSize: "13px", color: "#991b1b", fontWeight: 700 }}>
              🛑 DEADLOCK! P0 is waiting for Q (held by P1), and P1 is waiting for S (held by P0). Neither can ever make progress!
            </div>
          </div>

          {/* Section B: The Mars Pathfinder Priority Inversion */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🪐</span>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0 }}>
                    Real-World Case Study: The Mars Pathfinder Priority Inversion (1997)
                  </h3>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    How NASA JPL engineers solved an interplanetary deadlock with Priority Inheritance
                  </div>
                </div>
              </div>

              {/* Protocol Toggle */}
              <button
                onClick={() => setPathfinderState((s) => ({ ...s, useInheritance: !s.useInheritance, step: 0 }))}
                style={{
                  background: pathfinderState.useInheritance ? "#16a34a" : "#dc2626",
                  color: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.45rem 1rem",
                  fontSize: "13px",
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                {pathfinderState.useInheritance ? "🛡️ Priority Inheritance: ON" : "❌ Priority Inheritance: OFF"}
              </button>
            </div>

            {/* Stepper controller */}
            {(() => {
              const activeSteps = pathfinderState.useInheritance ? PATHFINDER_FIXED_STEPS : PATHFINDER_STEPS;
              const currentStepData = activeSteps[pathfinderState.step];
              return (
                <div>
                  {/* Current step banner */}
                  <div style={{
                    background: pathfinderState.useInheritance ? "#f0fdf4" : "#fef2f2",
                    border: "2px solid #000000",
                    borderRadius: 10,
                    padding: "1rem",
                    marginBottom: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <span style={{ fontWeight: 900, fontSize: "15px" }}>
                        {currentStepData.title}
                      </span>
                      <span style={{ fontSize: "12px", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: 6, border: "1px solid #000000", background: "#ffffff" }}>
                        Step {pathfinderState.step + 1} of 4
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", lineHeight: 1.5, margin: "0 0 0.5rem 0", color: "#334155" }}>
                      {currentStepData.desc}
                    </p>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: pathfinderState.useInheritance ? "#166534" : "#991b1b" }}>
                      {currentStepData.alert}
                    </div>
                  </div>

                  {/* 3 Tasks Visualizer */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                    {/* Low Task */}
                    <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#eff6ff" }}>
                      <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>Low Priority Task</div>
                      <div style={{ fontSize: "14px", fontWeight: 900 }}>Weather Logger (L)</div>
                      <div style={{ fontSize: "12px", marginTop: "0.25rem" }}>
                        Priority: <strong>{currentStepData.lPriority}</strong> {currentStepData.lPriority > 10 ? "(BOOSTED!)" : ""}
                      </div>
                      <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: 700, marginTop: "0.25rem" }}>
                        State: {currentStepData.lState}
                      </div>
                    </div>

                    {/* Med Task */}
                    <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#fffbeb" }}>
                      <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>Medium Priority Task</div>
                      <div style={{ fontSize: "14px", fontWeight: 900 }}>Communications (M)</div>
                      <div style={{ fontSize: "12px", marginTop: "0.25rem" }}>
                        Priority: <strong>20</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#d97706", fontWeight: 700, marginTop: "0.25rem" }}>
                        State: {currentStepData.mState}
                      </div>
                    </div>

                    {/* High Task */}
                    <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#fef2f2" }}>
                      <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b" }}>High Priority Task</div>
                      <div style={{ fontSize: "14px", fontWeight: 900 }}>Attitude Control (H)</div>
                      <div style={{ fontSize: "12px", marginTop: "0.25rem" }}>
                        Priority: <strong>30</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700, marginTop: "0.25rem" }}>
                        State: {currentStepData.hState}
                      </div>
                    </div>
                  </div>

                  {/* Stepper buttons */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setPathfinderState((s) => ({ ...s, step: Math.min(s.step + 1, 3) }))}
                      disabled={pathfinderState.step >= 3}
                      style={{
                        background: pathfinderState.step >= 3 ? "#e2e8f0" : "#000000",
                        color: pathfinderState.step >= 3 ? "#94a3b8" : "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 8,
                        padding: "0.45rem 1rem",
                        fontSize: "13px",
                        fontWeight: 900,
                        cursor: pathfinderState.step >= 3 ? "not-allowed" : "pointer"
                      }}
                    >
                      Next Step ⏩
                    </button>
                    <button
                      onClick={() => setPathfinderState((s) => ({ ...s, step: 0 }))}
                      style={{
                        background: "#f1f5f9",
                        border: "2px solid #000000",
                        borderRadius: 8,
                        padding: "0.45rem 0.85rem",
                        fontSize: "13px",
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      ↺ Restart Stepper
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
