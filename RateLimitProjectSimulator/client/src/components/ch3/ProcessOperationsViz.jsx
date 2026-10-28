import React, { useState } from "react";

const FONT = "'Lexend', sans-serif";

export default function ProcessOperationsViz() {
  const [activeTab, setActiveTab] = useState("creation");
  const [forkStep, setForkStep] = useState(0);
  const [zombieState, setZombieState] = useState("normal"); // "normal", "zombie", "orphan"

  // Process Tree Data
  const PROCESS_TREE = {
    name: "systemd / init (PID 1)",
    role: "Root ancestor of all Linux processes; adopts orphans",
    color: "#6d28d9",
    bg: "#f5f3ff",
    children: [
      {
        name: "sshd daemon (PID 1024)",
        role: "Remote SSH Connection Manager",
        color: "#1d4ed8",
        bg: "#eff6ff",
        children: [
          { name: "bash shell (PID 4050)", role: "Interactive User Shell", color: "#047857", bg: "#ecfdf5" },
          { name: "node server.js (PID 4051)", role: "Backend Web Service", color: "#047857", bg: "#ecfdf5" }
        ]
      },
      {
        name: "nginx master (PID 1100)",
        role: "Reverse Proxy & Load Balancer",
        color: "#b45309",
        bg: "#fffbeb",
        children: [
          { name: "nginx worker #1 (PID 1101)", role: "Handling Port 80 HTTP", color: "#b45309", bg: "#fffbeb" },
          { name: "nginx worker #2 (PID 1102)", role: "Handling Port 443 HTTPS", color: "#b45309", bg: "#fffbeb" }
        ]
      }
    ]
  };

  const FORK_STEPS = [
    {
      title: "1. Parent Invokes fork() System Call",
      code: `pid_t pid = fork();\n// OS duplicates parent PCB & allocates new PID`,
      parentState: "Calling fork() system call",
      childState: "Does not exist yet",
      detail: "The kernel traps the call. It creates a brand new PCB, assigns a new unique PID, and establishes page tables.",
      highlight: "fork"
    },
    {
      title: "2. Address Space Duplicated via Copy-on-Write (CoW)",
      code: `// Child receives PID 0\n// Parent receives child PID (e.g., 3450)`,
      parentState: "PID: 3449 (Executing concurrently)",
      childState: "PID: 3450 (Ready in memory)",
      detail: "Child memory pages point to identical physical parent pages marked read-only. Physical copying only occurs if one writes.",
      highlight: "cow"
    },
    {
      title: "3. Child Invokes exec() to Replace Image",
      code: `if (pid == 0) {\n  execlp("/bin/ls", "ls", NULL);\n}`,
      parentState: "Parent invokes wait(&status)",
      childState: "New binary /bin/ls loaded",
      detail: "The exec() call overwrites the child text, data, heap, and stack segments with the new binary. The PID remains 3450!",
      highlight: "exec"
    },
    {
      title: "4. Child Exits & Parent Collects Status via wait()",
      code: `exit(0); // Child terminates\nwait(&status); // Parent reaps PCB`,
      parentState: "Reaped child exit code cleanly!",
      childState: "Terminated & PCB destroyed",
      detail: "Parent's wait() unblocks. The OS deletes the child PCB from the process table. Zero zombie remnants left.",
      highlight: "wait"
    }
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #047857 0%, #059669 60%, #10b981 100%)",
        borderRadius: 16,
        padding: "1.75rem 2rem",
        marginBottom: "2rem",
        color: "#ffffff"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a7f3d0", marginBottom: "0.3rem" }}>
          Chapter 3 · Topic 4
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#ffffff", lineHeight: 1.2 }}>
          Operations on Processes: Creation, Hierarchy, Zombies &amp; Orphans
        </h1>
        <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, margin: 0, lineHeight: 1.6 }}>
          Learn how processes spawn children with fork() and exec(), build the tree of processes, and handle termination edge cases.
        </p>
      </div>

      {/* ── Sub-navigation ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem", borderBottom: "2px solid #000000", paddingBottom: "0.5rem" }}>
        {[
          { id: "creation", label: "1. Process Creation (fork + exec)", icon: "🌱" },
          { id: "tree", label: "2. The Process Hierarchy Tree", icon: "🌳" },
          { id: "zombie", label: "3. Termination: Zombies & Orphans", icon: "🧟" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#000000" : "#ffffff",
              color: activeTab === tab.id ? "#ffffff" : "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.55rem 1.25rem",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.15s"
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: CREATION ── */}
      {activeTab === "creation" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              UNIX Process Creation Flow: fork() followed by exec()
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.6 }}>
              UNIX separates process creation into two distinct system calls: <code>fork()</code> to clone address space, and <code>exec()</code> to replace the memory image with a new executable.
            </p>
          </div>

          {/* Stepper buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {FORK_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setForkStep(idx)}
                style={{
                  flex: 1,
                  background: forkStep === idx ? "#000000" : "#ffffff",
                  color: forkStep === idx ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Step {idx + 1}
              </button>
            ))}
          </div>

          {/* Active Step Card */}
          {(() => {
            const cur = FORK_STEPS[forkStep];
            return (
              <div style={{
                background: "#f0fdf4",
                border: "2px solid #000000",
                borderRadius: 16,
                padding: "1.75rem",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "1.5rem",
                marginBottom: "2rem"
              }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                    {cur.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
                    {cur.detail}
                  </p>

                  <div style={{
                    background: "#000000",
                    color: "#ffffff",
                    padding: "0.85rem 1.1rem",
                    borderRadius: 10,
                    fontFamily: "monospace",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap"
                  }}>
                    {cur.code}
                  </div>
                </div>

                {/* Visual Boxes: Parent & Child */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
                  <div style={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 12,
                    padding: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#000000", fontSize: "16px" }}>Parent Process (PID 3449)</span>
                      <span style={{ fontSize: "14px", background: "#dbeafe", color: "#000000", padding: "0.2rem 0.5rem", borderRadius: 8, fontWeight: 800 }}>
                        {cur.parentState}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "16px", color: "#000000", fontWeight: 900 }}>
                    {forkStep === 0 ? "⏳ Preparing Fork..." : "↓ Duplicated via fork() ↓"}
                  </div>

                  <div style={{
                    background: forkStep === 0 ? "#f8fafc" : "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 12,
                    padding: "1rem",
                    opacity: forkStep === 0 ? 0.6 : 1
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#000000", fontSize: "16px" }}>Child Process (PID 3450)</span>
                      <span style={{ fontSize: "14px", background: forkStep === 0 ? "#e2e8f0" : "#d1fae5", color: "#000000", padding: "0.2rem 0.5rem", borderRadius: 8, fontWeight: 800 }}>
                        {cur.childState}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 2: PROCESS TREE ── */}
      {activeTab === "tree" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              UNIX Hierarchy: Tree of Processes (ps -ef --forest)
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.6 }}>
              All processes in a Linux system trace their lineage back to a single ancestor: <code>systemd</code> (PID 1).
            </p>
          </div>

          <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 16, padding: "1.75rem" }}>
            <div style={{ background: PROCESS_TREE.bg, border: "2px solid #000000", borderRadius: 10, padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontWeight: 900, color: "#000000", fontSize: "16px" }}>
                👑 {PROCESS_TREE.name}
              </div>
              <p style={{ fontSize: "14px", color: "#000000", margin: "0.2rem 0 0 0" }}>{PROCESS_TREE.role}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", paddingLeft: "1.5rem", borderLeft: "3px dashed #000000" }}>
              {PROCESS_TREE.children.map((sub, idx) => (
                <div key={idx} style={{ background: sub.bg, border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
                  <div style={{ fontWeight: 800, color: "#000000", fontSize: "16px" }}>
                    🔹 {sub.name}
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: "0.2rem 0 0.75rem 0" }}>{sub.role}</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingLeft: "1rem", borderLeft: "2px solid #000000" }}>
                    {sub.children.map((leaf, lIdx) => (
                      <div key={lIdx} style={{ background: "#ffffff", borderRadius: 6, padding: "0.5rem 0.75rem", fontSize: "14px", fontWeight: 700, color: "#000000", border: "1.5px solid #000000" }}>
                        ↳ {leaf.name} ({leaf.role})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ZOMBIES VS ORPHANS ── */}
      {activeTab === "zombie" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              Process Termination Edge Cases: Zombies vs. Orphans
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.6 }}>
              A critical exam concept: What happens when a child terminates before its parent, or a parent terminates before its child?
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {[
              { id: "normal", label: "Normal Reaping (wait() called)" },
              { id: "zombie", label: "Zombie Process 🧟" },
              { id: "orphan", label: "Orphan Process 🐣" }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setZombieState(btn.id)}
                style={{
                  background: zombieState === btn.id ? "#000000" : "#ffffff",
                  color: zombieState === btn.id ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem 1.15rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{
            background: zombieState === "zombie" ? "#fef2f2" : zombieState === "orphan" ? "#eff6ff" : "#f0fdf4",
            border: "2px solid #000000",
            borderRadius: 16,
            padding: "1.75rem",
            marginBottom: "1.5rem"
          }}>
            {zombieState === "normal" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  ✅ Normal Execution: Proper Reaping with wait()
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: 0 }}>
                  Child terminates and calls exit(). The parent concurrently calls wait(&amp;status). The OS delivers the exit code to the parent and cleans up the child PCB immediately.
                </p>
              </div>
            )}

            {zombieState === "zombie" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  🧟 The Zombie Process (Terminated but Unreaped)
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: "0 0 0.75rem 0" }}>
                  A process that has finished execution (called exit()), but whose <strong>parent has not yet invoked wait()</strong>.
                </p>
                <div style={{ background: "#ffffff", border: "1.5px solid #000000", padding: "0.85rem", borderRadius: 8, fontSize: "14px", color: "#000000" }}>
                  <strong>⚠️ The Danger:</strong> Although the zombie consumes no CPU or memory, its <strong>PID entry in the kernel process table cannot be released</strong>. If a parent continuously spawns processes without reaping, the PID table fills up and no other program can start!
                </div>
              </div>
            )}

            {zombieState === "orphan" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  🐣 The Orphan Process (Parent Died First)
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: "0 0 0.75rem 0" }}>
                  A running child process whose <strong>parent process has already terminated</strong> (crashed or completed).
                </p>
                <div style={{ background: "#ffffff", border: "1.5px solid #000000", padding: "0.85rem", borderRadius: 8, fontSize: "14px", color: "#000000" }}>
                  <strong>🛡️ OS Resolution:</strong> Linux automatically re-parents the orphan to <code>systemd / init</code> (PID 1). Init periodically executes wait() to reap terminating orphans, preventing orphan zombies!
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
