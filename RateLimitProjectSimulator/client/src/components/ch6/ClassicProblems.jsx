import React, { useState, useEffect, useRef } from "react";
import DiningPhilosophers3D from "./DiningPhilosophers3D.jsx";

const FONT = "'Lexend', sans-serif";

export default function ClassicProblems() {
  const [activeTab, setActiveTab] = useState("bounded");

  // ── Tab 1: Bounded-Buffer / Producer-Consumer ─────────────────────────────
  const BUFFER_SIZE = 5;
  const [buffer, setBuffer] = useState([]); // array of items
  const [bbLog, setBbLog] = useState(["Bounded-Buffer initialized. mutex=1, empty=5, full=0."]);
  const [bbAuto, setBbAuto] = useState(false);
  const bbTimer = useRef(null);

  const addBbLog = (msg) => setBbLog((p) => [msg, ...p.slice(0, 12)]);

  const produce = () => {
    if (buffer.length >= BUFFER_SIZE) {
      addBbLog("⏳ Producer: wait(empty)… buffer is FULL! Producer BLOCKS until consumer removes an item.");
      return;
    }
    const item = `Item-${Math.floor(Math.random() * 90 + 10)}`;
    setBuffer((b) => [...b, item]);
    addBbLog(`🟢 Producer: wait(empty)✓ → wait(mutex)✓ → placed [${item}] in slot ${buffer.length} → signal(mutex) → signal(full)`);
  };

  const consume = () => {
    if (buffer.length === 0) {
      addBbLog("⏳ Consumer: wait(full)… buffer is EMPTY! Consumer BLOCKS until producer adds an item.");
      return;
    }
    const item = buffer[0];
    setBuffer((b) => b.slice(1));
    addBbLog(`🔴 Consumer: wait(full)✓ → wait(mutex)✓ → consumed [${item}] → signal(mutex) → signal(empty)`);
  };

  useEffect(() => {
    if (bbAuto) {
      bbTimer.current = setInterval(() => {
        if (Math.random() > 0.4) produce(); else consume();
      }, 1100);
    }
    return () => clearInterval(bbTimer.current);
  }, [bbAuto, buffer]);

  // ── Tab 2: Readers-Writers Problem ───────────────────────────────────────
  const [rwReaders, setRwReaders] = useState(0);    // active reader count
  const [rwWriterIn, setRwWriterIn] = useState(false);
  const [rwWriterWaiting, setRwWriterWaiting] = useState(false);
  const [rwLog, setRwLog] = useState(["Readers-Writers initialized. read_count=0, mutex=1, rw_mutex=1."]);

  const addRwLog = (msg) => setRwLog((p) => [msg, ...p.slice(0, 12)]);

  const readerEnter = () => {
    if (rwWriterIn) { addRwLog("⏳ Reader: wait(mutex)… Writer is in CS! Reader BLOCKS."); return; }
    setRwReaders((r) => r + 1);
    addRwLog(`📖 Reader enters: read_count → ${rwReaders + 1}. ${rwReaders === 0 ? "First reader! Acquired rw_mutex (blocks writers)." : "Not first reader — no need to acquire rw_mutex."}`);
  };

  const readerExit = () => {
    if (rwReaders === 0) { addRwLog("⚠️ No readers currently inside."); return; }
    const newCount = rwReaders - 1;
    setRwReaders(newCount);
    addRwLog(`📖 Reader exits: read_count → ${newCount}. ${newCount === 0 ? "Last reader! Released rw_mutex (writers may proceed)." : "Other readers still inside."}`);
  };

  const writerEnter = () => {
    if (rwWriterIn || rwReaders > 0) {
      setRwWriterWaiting(true);
      addRwLog(`✏️ Writer: wait(rw_mutex)… ${rwReaders > 0 ? `${rwReaders} reader(s) active!` : "Another writer in CS!"} Writer BLOCKS.`);
      return;
    }
    setRwWriterIn(true);
    setRwWriterWaiting(false);
    addRwLog("✏️ Writer: wait(rw_mutex)✓ → Writer has EXCLUSIVE access to database!");
  };

  const writerExit = () => {
    if (!rwWriterIn) { addRwLog("⚠️ No writer currently inside."); return; }
    setRwWriterIn(false);
    setRwWriterWaiting(false);
    addRwLog("✏️ Writer: signal(rw_mutex) → Writer released lock. Readers or next writer may enter.");
  };

  // ── Tab 3: Dining Philosophers ────────────────────────────────────────────
  const N = 5;
  // States: 'thinking' | 'hungry' | 'eating'
  const [philState, setPhilState] = useState(Array(N).fill("thinking"));
  const [forks, setForks] = useState(Array(N).fill(true)); // true = available
  const [dpLog, setDpLog] = useState(["5 philosophers at the table. 5 forks available."]);

  const addDpLog = (msg) => setDpLog((p) => [msg, ...p.slice(0, 12)]);

  const leftFork = (i) => i;
  const rightFork = (i) => (i + 1) % N;

  const philPickup = (i) => {
    if (philState[i] !== "thinking") return;
    const lf = leftFork(i), rf = rightFork(i);
    setPhilState((s) => { const n = [...s]; n[i] = "hungry"; return n; });
    if (forks[lf] && forks[rf]) {
      setForks((f) => { const n = [...f]; n[lf] = false; n[rf] = false; return n; });
      setPhilState((s) => { const n = [...s]; n[i] = "eating"; return n; });
      addDpLog(`🍝 P${i} picks up Fork ${lf} & Fork ${rf} → EATING! (wait(fork[${lf}]) + wait(fork[${rf}]))`);
    } else {
      addDpLog(`⏳ P${i} is HUNGRY but Fork ${!forks[lf] ? lf : rf} is taken. P${i} BLOCKS waiting for forks.`);
    }
  };

  const philPutdown = (i) => {
    if (philState[i] !== "eating") return;
    const lf = leftFork(i), rf = rightFork(i);
    setForks((f) => { const n = [...f]; n[lf] = true; n[rf] = true; return n; });
    setPhilState((s) => { const n = [...s]; n[i] = "thinking"; return n; });
    addDpLog(`💭 P${i} puts down Fork ${lf} & Fork ${rf} → THINKING. (signal(fork[${lf}]) + signal(fork[${rf}]))`);
  };

  const resetDp = () => {
    setPhilState(Array(N).fill("thinking"));
    setForks(Array(N).fill(true));
    setDpLog(["Dining Philosophers reset."]);
  };

  const tryDeadlock = () => {
    // All philosophers pick up their LEFT fork simultaneously
    setPhilState(Array(N).fill("hungry"));
    setForks(Array(N).fill(false)); // all forks taken by left-pick
    setDpLog([
      "🚨 DEADLOCK SIMULATED! Every philosopher picked up their LEFT fork simultaneously.",
      "Each now waits for their RIGHT fork — which is held by their right neighbor.",
      "Circular wait! No philosopher can ever eat. System is completely deadlocked.",
    ]);
  };

  const STATE_EMOJI = { thinking: "💭", hungry: "😤", eating: "🍝" };
  const STATE_COLOR = { thinking: "#6b7280", hungry: "#d97706", eating: "#16a34a" };
  const STATE_BG = { thinking: "#f9fafb", hungry: "#fffbeb", eating: "#f0fdf4" };

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "0.5rem" }}>
      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "bounded", label: "🏭 Bounded-Buffer (Producer–Consumer)" },
          { id: "readers", label: "📚 Readers–Writers Problem" },
          { id: "dining", label: "🍽️ Dining Philosophers Problem" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#000000" : "#ffffff",
              color: activeTab === tab.id ? "#ffffff" : "#000000",
              border: "2px solid #000000", borderRadius: 8,
              padding: "0.6rem 1.25rem", fontSize: "14px", fontWeight: 800,
              cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: activeTab === tab.id ? "3px 3px 0px #000000" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: BOUNDED-BUFFER
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "bounded" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#faf5ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🏭</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Classic Problem 1: Bounded-Buffer (Producer–Consumer)
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              A <strong>shared circular buffer</strong> of size N sits between a Producer and Consumer.
              Three semaphores govern safe access: <code style={{ background: "#fff", padding: "2px 6px", border: "1px solid #000", borderRadius: 4 }}>mutex = 1</code> (mutual exclusion on buffer access),
              <code style={{ background: "#fff", padding: "2px 6px", border: "1px solid #000", borderRadius: 4 }}> empty = N</code> (counts free slots),
              <code style={{ background: "#fff", padding: "2px 6px", border: "1px solid #000", borderRadius: 4 }}> full = 0</code> (counts filled slots).
            </p>
          </div>

          {/* Semaphore Status Row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "0.75rem",
          }}>
            {[
              { label: "mutex", val: 1, desc: "Buffer access lock", color: "#7c3aed", bg: "#faf5ff" },
              { label: "empty (free slots)", val: BUFFER_SIZE - buffer.length, desc: `${BUFFER_SIZE - buffer.length} slots available`, color: "#2563eb", bg: "#eff6ff" },
              { label: "full (filled slots)", val: buffer.length, desc: `${buffer.length} items ready`, color: "#16a34a", bg: "#f0fdf4" },
            ].map((s) => (
              <div key={s.label} style={{ background: s.bg, border: "2px solid #000000", borderRadius: 10, padding: "0.85rem 1rem" }}>
                <div style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.06em" }}>{s.label}</div>
                <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "11px", color: "#475569" }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Buffer Visualizer */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ fontWeight: 900, fontSize: "14px", marginBottom: "0.75rem" }}>
              Shared Circular Buffer (capacity = {BUFFER_SIZE})
            </div>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "stretch" }}>
              {Array.from({ length: BUFFER_SIZE }).map((_, idx) => {
                const item = buffer[idx];
                return (
                  <div key={idx} style={{
                    flex: 1, minHeight: 72, border: "2px solid #000000",
                    borderRadius: 8, background: item ? "#f0fdf4" : "#f8fafc",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 800, transition: "all 0.2s",
                    boxShadow: item ? "2px 2px 0px #16a34a" : "none",
                  }}>
                    {item ? (
                      <>
                        <span style={{ fontSize: "1.2rem" }}>📦</span>
                        <span style={{ color: "#166534", fontSize: 11 }}>{item}</span>
                      </>
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: 11 }}>Slot {idx}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div style={{
            background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1rem 1.25rem",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem",
          }}>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button onClick={produce} style={{ background: "#7c3aed", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1.1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>
                + Produce Item
              </button>
              <button onClick={consume} style={{ background: "#16a34a", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1.1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>
                - Consume Item
              </button>
              <button onClick={() => setBbAuto(!bbAuto)} style={{ background: bbAuto ? "#ea580c" : "#2563eb", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1.1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>
                {bbAuto ? "⏸ Stop Auto" : "▶ Auto Simulate"}
              </button>
              <button onClick={() => { setBuffer([]); setBbLog(["Reset."]); setBbAuto(false); }} style={{ background: "#f1f5f9", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 0.85rem", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Semaphore Code + Log */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "1.25rem" }}>
            <pre style={{ background: "#0f172a", color: "#38bdf8", padding: "1rem", borderRadius: 8, border: "1.5px solid #000", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.65, margin: 0 }}>
{`// Semaphores:
semaphore mutex = 1;
semaphore empty = N;   // N free slots
semaphore full  = 0;   // 0 items initially

// Producer Process:
do {
    produce_item(next_produced);
    wait(empty);        // decrement free slots
    wait(mutex);        // lock buffer access
    buffer[in] = next_produced;
    in = (in + 1) % N;
    signal(mutex);      // unlock
    signal(full);       // increment filled slots
} while (true);

// Consumer Process:
do {
    wait(full);         // decrement filled slots
    wait(mutex);        // lock buffer access
    next_consumed = buffer[out];
    out = (out + 1) % N;
    signal(mutex);      // unlock
    signal(empty);      // increment free slots
    consume_item(next_consumed);
} while (true);`}
            </pre>
            <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "0.6rem 0.85rem", maxHeight: 240, overflowY: "auto", fontFamily: "monospace", fontSize: "12px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {bbLog.map((l, i) => (
                <div key={i} style={{ color: i === 0 ? "#0f172a" : "#64748b", fontWeight: i === 0 ? 800 : 400 }}>› {l}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: READERS-WRITERS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "readers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#eff6ff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>📚</span>
              <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
                Classic Problem 2: The Readers–Writers Problem
              </h2>
            </div>
            <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
              A shared database can be accessed by <strong>Readers</strong> (simultaneous read is safe — no conflict!) or
              <strong> Writers</strong> (require EXCLUSIVE access — no reader or writer may enter). Two semaphores:
              <code style={{ background: "#fff", padding: "2px 6px", border: "1px solid #000", borderRadius: 4 }}> rw_mutex = 1</code> (writer lock) and
              <code style={{ background: "#fff", padding: "2px 6px", border: "1px solid #000", borderRadius: 4 }}> mutex = 1</code> (protect read_count). Problem: Writers can STARVE!
            </p>
          </div>

          {/* Live DB View */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "1.25rem" }}>
            {/* Database */}
            <div style={{
              background: rwWriterIn ? "#fef2f2" : rwReaders > 0 ? "#f0fdf4" : "#f8fafc",
              border: rwWriterIn ? "3px solid #dc2626" : rwReaders > 0 ? "3px solid #16a34a" : "2px solid #000000",
              borderRadius: 12, padding: "1.25rem", textAlign: "center",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160, transition: "all 0.2s",
            }}>
              <span style={{ fontSize: "2.5rem", marginBottom: "0.4rem" }}>🗄️</span>
              <div style={{ fontWeight: 900, fontSize: "16px" }}>Shared Database</div>
              {rwWriterIn && <div style={{ marginTop: "0.5rem", background: "#dc2626", color: "#fff", padding: "0.3rem 0.85rem", borderRadius: 6, fontWeight: 900, fontSize: "13px" }}>EXCLUSIVE WRITE IN PROGRESS</div>}
              {!rwWriterIn && rwReaders > 0 && <div style={{ marginTop: "0.5rem", background: "#16a34a", color: "#fff", padding: "0.3rem 0.85rem", borderRadius: 6, fontWeight: 900, fontSize: "13px" }}>{rwReaders} CONCURRENT READER{rwReaders > 1 ? "S" : ""} ACTIVE</div>}
              {!rwWriterIn && rwReaders === 0 && <div style={{ marginTop: "0.5rem", color: "#64748b", fontWeight: 700, fontSize: "13px" }}>IDLE — available</div>}
              {rwWriterWaiting && <div style={{ marginTop: "0.4rem", background: "#fef3c7", border: "1px solid #000", color: "#92400e", padding: "0.3rem 0.75rem", borderRadius: 6, fontWeight: 800, fontSize: "12px" }}>⏳ Writer queued — waiting!</div>}
            </div>

            {/* Semaphore Values */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {[
                { label: "read_count", val: rwReaders, desc: "Active reader count", color: "#16a34a", bg: "#f0fdf4" },
                { label: "rw_mutex", val: rwWriterIn || rwReaders > 0 ? 0 : 1, desc: "1=free, 0=locked by reader/writer", color: "#2563eb", bg: "#eff6ff" },
                { label: "mutex", val: 1, desc: "Protects read_count changes", color: "#7c3aed", bg: "#faf5ff" },
              ].map((s) => (
                <div key={s.label} style={{ background: s.bg, border: "2px solid #000000", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 900, color: "#000" }}>{s.label}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{s.desc}</div>
                  </div>
                  <span style={{ fontSize: "1.75rem", fontWeight: 900, color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={readerEnter} style={{ background: "#16a34a", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>📖 Reader Enter</button>
            <button onClick={readerExit} style={{ background: "#15803d", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>📖 Reader Exit</button>
            <div style={{ width: 1, height: 32, background: "#e2e8f0" }} />
            <button onClick={writerEnter} style={{ background: "#dc2626", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>✏️ Writer Enter</button>
            <button onClick={writerExit} style={{ background: "#b91c1c", color: "#fff", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 1rem", fontSize: "13px", fontWeight: 900, cursor: "pointer" }}>✏️ Writer Exit</button>
            <button onClick={() => { setRwReaders(0); setRwWriterIn(false); setRwWriterWaiting(false); setRwLog(["Reset."]); }} style={{ background: "#f1f5f9", border: "2px solid #000", borderRadius: 8, padding: "0.5rem 0.85rem", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>↺ Reset</button>
          </div>

          {/* Event log */}
          <div style={{ background: "#f8fafc", border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "0.6rem 0.85rem", maxHeight: 110, overflowY: "auto", fontFamily: "monospace", fontSize: "12px", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            {rwLog.map((l, i) => <div key={i} style={{ color: i === 0 ? "#0f172a" : "#64748b" }}>› {l}</div>)}
          </div>

          {/* Writers-Preference note */}
          <div style={{ background: "#fef3c7", border: "2px solid #000000", borderRadius: 10, padding: "0.85rem 1.1rem", fontSize: "13px", lineHeight: 1.6 }}>
            <strong>⚠️ Starvation Hazard (First Readers-Writers Problem):</strong> The classic solution above gives <em>readers preference</em>. As long as even one reader is active, new readers keep joining and writers starve forever!
            The <strong>Second Readers-Writers Problem</strong> gives writers priority (no new readers enter once a writer is waiting) — but then readers can starve!
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: DINING PHILOSOPHERS (3D Interactive Table)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "dining" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <DiningPhilosophers3D />

          {/* Deadlock Solutions Panel */}
          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h3 style={{ fontWeight: 900, fontSize: "15px", margin: "0 0 0.75rem 0" }}>
              💡 Four Textbook Solutions to Avoid Dining Philosopher Deadlock
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "0.6rem", fontSize: "13px" }}>
              {[
                { n: "①", title: "Allow at most N-1 philosophers", desc: "At most 4 philosophers at the table simultaneously ensures at least one can always eat." },
                { n: "②", title: "Pick both forks atomically", desc: "Philosopher picks up both forks only when BOTH are free simultaneously (atomic critical section)." },
                { n: "③", title: "Asymmetric solution", desc: "Odd philosophers pick left then right; even philosophers pick right then left. Breaks circular wait!" },
                { n: "④", title: "Monitor-based solution", desc: "Philosophers enter only if both neighbors are not eating. Uses a condition variable per philosopher." },
              ].map((s) => (
                <div key={s.n} style={{ background: "#f8fafc", border: "1.5px solid #000", borderRadius: 8, padding: "0.7rem 0.85rem" }}>
                  <div style={{ fontWeight: 900, marginBottom: "0.25rem" }}>{s.n} {s.title}</div>
                  <div style={{ color: "#475569", lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
