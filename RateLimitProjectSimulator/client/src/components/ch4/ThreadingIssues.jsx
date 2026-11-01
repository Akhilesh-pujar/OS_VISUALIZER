import React, { useState } from "react";

const FONT = "'Lexend', sans-serif";

export default function ThreadingIssues() {
  const [activeIssue, setActiveIssue] = useState("forkExec"); // "forkExec", "signals", "cancellation", "tls", "scheduler"

  const ISSUES = [
    {
      id: "forkExec",
      name: "① fork() & exec() Semantics",
      icon: "🌱",
      badge: "Process Duplication",
      desc: "Does fork() duplicate all threads in the process or only the thread that invoked fork()? How does exec() behave immediately after?"
    },
    {
      id: "signals",
      name: "② Signal Handling in Threads",
      icon: "🚨",
      badge: "Interrupt Routing",
      desc: "Synchronous vs. Asynchronous signals: Which thread receives the signal? To the calling thread, to all threads, or to a dedicated handler thread?"
    },
    {
      id: "cancellation",
      name: "③ Thread Cancellation",
      icon: "🛑",
      badge: "Target Termination",
      desc: "Terminating a target thread before it has completed. Compares Asynchronous Cancellation vs. Deferred Cancellation (cancellation points)."
    },
    {
      id: "tls",
      name: "④ Thread-Local Storage (TLS)",
      icon: "🔒",
      badge: "Thread-Specific Data",
      desc: "Giving each thread its own unique copy of certain data. Unlike local function variables, TLS persists across entire function calls."
    },
    {
      id: "scheduler",
      name: "⑤ Scheduler Activations & LWP",
      icon: "⚙️",
      badge: "Lightweight Processes",
      desc: "Communication between the kernel and user-level thread library via LWPs and upcalls to prevent blocking the entire process."
    }
  ];

  const current = ISSUES.find((i) => i.id === activeIssue);

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Split Layout: Left Selector + Right Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
        {/* Left Column: Issues List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
            Select Threading Issue:
          </div>
          {ISSUES.map((issue) => {
            const isSelected = activeIssue === issue.id;
            return (
              <button
                key={issue.id}
                onClick={() => setActiveIssue(issue.id)}
                style={{
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 10,
                  padding: "0.9rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  borderLeft: isSelected ? "6px solid #2563eb" : "2px solid #000000",
                  boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.12)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{issue.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000", background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>
                    {issue.badge}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#000000", marginBottom: "0.2rem" }}>
                  {issue.name}
                </div>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.45, margin: 0 }}>
                  {issue.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Deep Explanation & Interactive SVG */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          <div style={{ fontSize: "18px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
            {current.name} (Silberschatz Chapter 4.6)
          </div>

          {/* ──────────────── ISSUE 1: FORK & EXEC ──────────────── */}
          {activeIssue === "forkExec" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                <strong>The Core Question: </strong>If one thread in a program calls <code>fork()</code>, does the new process duplicate <em>all</em> threads, or is the new child process single-threaded (duplicating only the calling thread)?
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#eff6ff" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                    Scenario A: Duplicating ALL Threads
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 0.75rem 0", lineHeight: 1.5 }}>
                    Used when the child process will continue running concurrent services without executing a new program.
                  </p>
                  <div style={{ background: "#ffffff", border: "1px solid #000000", borderRadius: 6, padding: "0.5rem", fontSize: "12px", fontFamily: "monospace" }}>
                    fork() ➔ Child has Thread 1, 2, 3 identical copies
                  </div>
                </div>

                <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#f0fdf4" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                    Scenario B: exec() Called Immediately
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 0.75rem 0", lineHeight: 1.5 }}>
                    If <code>exec()</code> is invoked immediately after <code>fork()</code>, duplicating all threads is wasteful! <code>exec()</code> replaces the entire address space and all threads anyway.
                  </p>
                  <div style={{ background: "#ffffff", border: "1px solid #000000", borderRadius: 6, padding: "0.5rem", fontSize: "12px", fontFamily: "monospace" }}>
                    fork1() ➔ Only caller thread duplicated ➔ exec() overrides
                  </div>
                </div>
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#fefce8" }}>
                <strong style={{ fontSize: "14px" }}>UNIX Solution: </strong>Many UNIX systems support two versions of fork(): one that duplicates all threads and another (often called <code>fork1()</code>) that duplicates only the thread that invoked the system call.
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 2: SIGNALS ──────────────── */}
          {activeIssue === "signals" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                A <strong>signal</strong> is used in UNIX systems to notify a process that a particular event has occurred. All signals follow the pattern:
                <br />
                <code>Signal generated ➔ Signal delivered to process ➔ Signal handled by default or user handler</code>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#ffffff" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                    Synchronous Signals
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>
                    Delivered to the <strong>exact thread that caused the signal</strong>.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "14px", lineHeight: 1.6 }}>
                    <li>Division by zero (SIGFPE)</li>
                    <li>Illegal memory access (SIGSEGV)</li>
                  </ul>
                </div>

                <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#ffffff" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                    Asynchronous Signals
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>
                    Generated by an external event. Destination thread is ambiguous!
                  </p>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "14px", lineHeight: 1.6 }}>
                    <li>Ctrl+C termination (SIGINT)</li>
                    <li>Timer expiration (SIGALRM)</li>
                  </ul>
                </div>
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#eff6ff" }}>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.3rem" }}>
                  Where Should the OS Deliver an Asynchronous Signal?
                </div>
                <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                  1. Deliver the signal to the thread to which the signal applies.<br />
                  2. Deliver the signal to <em>every</em> thread in the process.<br />
                  3. Deliver the signal to certain designated threads in the process.<br />
                  4. Assign a specific dedicated thread to receive all signals for the process (POSIX <code>pthread_sigmask()</code>).
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 3: THREAD CANCELLATION ──────────────── */}
          {activeIssue === "cancellation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                <strong>Thread Cancellation: </strong>Terminating a target thread before it finishes. Example: If multiple threads search a database concurrently and one finds the result, the others can be safely cancelled.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#fef2f2" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                    1. Asynchronous Cancellation
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: "0 0 0.5rem 0" }}>
                    One thread terminates the target thread <strong>immediately</strong>.
                  </p>
                  <p style={{ fontSize: "14px", color: "#000000", margin: 0, fontWeight: 700 }}>
                    ⚠️ Danger: If the thread is updating shared data in mid-write or holds a mutex lock, asynchronous cancellation leaves the system corrupted or deadlocked!
                  </p>
                </div>

                <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#f0fdf4" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                    2. Deferred Cancellation (Standard)
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: "0 0 0.5rem 0" }}>
                    The target thread periodically checks whether it should terminate at defined <strong>Cancellation Points</strong> (e.g., <code>pthread_testcancel()</code>).
                  </p>
                  <p style={{ fontSize: "14px", color: "#000000", margin: 0, fontWeight: 700 }}>
                    ✓ Safe: Allows the target thread to clean up allocated buffers, unlock mutexes, and exit safely.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 4: TLS ──────────────── */}
          {activeIssue === "tls" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                <strong>Thread-Local Storage (TLS): </strong>
                In most circumstances, threads share data. However, in some situations, each thread needs its own personal copy of certain data. For instance, in a transaction-processing system, each thread might need a unique transaction identifier.
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#ffffff" }}>
                <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.75rem" }}>
                  Memory Scope Hierarchy:
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                  <div style={{ border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#eff6ff" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900 }}>Local Variables</div>
                    <div style={{ fontSize: "14px", marginTop: "0.3rem" }}>Visible only during a single function execution (stored on Thread Stack).</div>
                  </div>
                  <div style={{ border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#fef9c3" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900 }}>Thread-Local Storage</div>
                    <div style={{ fontSize: "14px", marginTop: "0.3rem" }}>Unique to each thread, but visible across <em>all</em> functions called by that thread.</div>
                  </div>
                  <div style={{ border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#f0fdf4" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900 }}>Global / Static Data</div>
                    <div style={{ fontSize: "14px", marginTop: "0.3rem" }}>Shared by <em>all</em> threads across the entire process (stored in Data segment).</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── ISSUE 5: SCHEDULER ACTIVATIONS ──────────────── */}
          {activeIssue === "scheduler" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 10, padding: "1rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                <strong>Lightweight Process (LWP): </strong>
                In Many-to-Many and Two-Level models, the OS kernel provides an intermediate data structure between user threads and kernel threads called a Lightweight Process (LWP). To the user-thread library, the LWP appears to be a virtual processor on which the application can schedule a user thread.
              </div>

              {/* LWP Architecture SVG */}
              <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#ffffff" }}>
                <svg viewBox="0 0 700 200" style={{ width: "100%", height: "auto" }}>
                  {/* User Thread */}
                  <rect x="50" y="20" width="160" height="40" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                  <text x="130" y="45" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">User Thread</text>

                  {/* LWP Box */}
                  <rect x="270" y="20" width="160" height="40" rx="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
                  <text x="350" y="45" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">LWP (Virtual CPU)</text>

                  {/* Kernel Thread */}
                  <rect x="490" y="20" width="160" height="40" rx="6" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
                  <text x="570" y="45" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">Kernel Thread</text>

                  {/* Connecting lines */}
                  <line x1="210" y1="40" x2="270" y2="40" stroke="#000000" strokeWidth="2" />
                  <line x1="430" y1="40" x2="490" y2="40" stroke="#000000" strokeWidth="2" />

                  {/* Upcall Arrow */}
                  <path d="M 570 65 L 570 130 L 130 130 L 130 65" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5 5" />
                  <text x="350" y="155" textAnchor="middle" fontSize="14" fontWeight="900" fill="#dc2626" fontFamily="Lexend">
                    ⚡ Upcall: Kernel notifies user thread library that a thread is about to block
                  </text>
                </svg>
              </div>

              <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#fef2f2" }}>
                <strong style={{ fontSize: "14px" }}>Upcall Mechanism: </strong>
                The kernel sends an <strong>upcall</strong> to inform the application's thread library that a thread is about to block. The library can then immediately reassign the LWP to run another runnable user thread, keeping CPU cores 100% utilized!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Matrix ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
          THREADING ISSUES &amp; MITIGATION STRATEGIES
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Issue Area</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Core Problem</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Standard OS Solution</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["fork() / exec()", "Duplicating unwanted threads", "fork1() duplicates only caller; exec() replaces memory"],
              ["Signal Handling", "Which thread receives async signal", "pthread_sigmask() assigns designated signal handler thread"],
              ["Cancellation", "Shared locks left locked on kill", "Deferred cancellation using explicit cancellation points"],
              ["Thread-Local Storage", "Need per-thread global state", "__thread (C) / ThreadLocal (Java) memory sections"],
              ["Scheduler Activations", "User library unaware of kernel block", "Upcall mechanism running on LWPs (Lightweight Processes)"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 4 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#000000" }}>{row[0]}</td>
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
