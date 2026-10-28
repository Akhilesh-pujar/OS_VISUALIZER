import React, { useState } from "react";
import ProcessConceptBasics from "./ch3/ProcessConceptBasics.jsx";
import ProcessStatesViz from "./ch3/ProcessStatesViz.jsx";
import ProcessSchedulingViz from "./ch3/ProcessSchedulingViz.jsx";
import ProcessOperationsViz from "./ch3/ProcessOperationsViz.jsx";
import IPCMechanismsViz from "./ch3/IPCMechanismsViz.jsx";
import ProcessQuizInteractive from "./ch3/ProcessQuizInteractive.jsx";

const FONT = "'Lexend', sans-serif";

const TOPICS = [
  {
    id: "concept",
    num: "01",
    title: "Process Concept & Memory Layout",
    icon: "📋",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#93c5fd",
    tag: "Core Fundamental",
    summary: "Program vs. Process, 6-segment memory layout (Stack, Heap, BSS, Data, Text), and PCB data structure fields.",
    keyPoints: ["Program in execution", "Virtual Address Space", "task_struct / PCB", "malloc() dynamic heap"],
    component: ProcessConceptBasics
  },
  {
    id: "states",
    num: "02",
    title: "Process States & 5-State Lifecycle",
    icon: "🔄",
    color: "#047857",
    bg: "#ecfdf5",
    border: "#86efac",
    tag: "Lifecycle Machine",
    summary: "The 5-state lifecycle: New, Ready, Running, Waiting, Terminated. Interactive animated state transitions.",
    keyPoints: ["Scheduler Dispatch", "Timer Interrupts", "I/O Blocking & Wakeup", "exit() syscall"],
    component: ProcessStatesViz
  },
  {
    id: "scheduling",
    num: "03",
    title: "Process Scheduling & 3D Queues",
    icon: "⚙️",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    tag: "CPU & Queues",
    summary: "Left selection of Job, Ready, Device queues with interactive 3D visualizers, 3 Schedulers, and Context Switch simulator.",
    keyPoints: ["3 Scheduling Queues", "3 Schedulers compared", "Save/Restore PCB", "Gantt Round-Robin"],
    component: ProcessSchedulingViz
  },
  {
    id: "operations",
    num: "04",
    title: "Operations: fork, exec, Zombies & Orphans",
    icon: "🌱",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    tag: "Process Management",
    summary: "UNIX process creation via fork() + exec(), Copy-on-Write, the Process Tree hierarchy, and Zombie vs Orphan processes.",
    keyPoints: ["fork() cloning", "exec() image replace", "Process Tree (PID 1)", "Zombies vs Orphans"],
    component: ProcessOperationsViz
  },
  {
    id: "ipc",
    num: "05",
    title: "Interprocess Communication & 3D Channels",
    icon: "📡",
    color: "#be185d",
    bg: "#fdf2f8",
    border: "#fbcfe8",
    tag: "Data Exchange",
    summary: "Left selection of Shared Memory, Message Passing, Pipes, and Sockets with 3D animation, plus Producer-Consumer Bounded Buffer.",
    keyPoints: ["Shared Memory (Zero-copy)", "Message Passing mailboxes", "Bounded Buffer (5 slots)", "Anonymous Pipes"],
    component: IPCMechanismsViz
  },
  {
    id: "quiz",
    num: "06",
    title: "Student Knowledge Assessment",
    icon: "🎓",
    color: "#000000",
    bg: "#f8fafc",
    border: "#000000",
    tag: "Exam Readiness",
    summary: "Interactive test with 6 conceptual questions covering all Chapter 3 topics, instant feedback, and score tracker.",
    keyPoints: ["Multiple-choice questions", "Instant explanation", "Score calculation", "Mastery Badge"],
    component: ProcessQuizInteractive
  }
];

export default function ProcessConcepts({ onBack }) {
  const [activeTopic, setActiveTopic] = useState("overview");

  const currentTopicObj = TOPICS.find((t) => t.id === activeTopic);
  const ActiveComponent = currentTopicObj?.component;

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: FONT, color: "#000000", display: "flex", flexDirection: "column" }}>
      {/* ── Top Navigation Bar ── */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "#ffffff",
        borderBottom: "2px solid #000000",
        padding: "0.75rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={activeTopic === "overview" ? onBack : () => setActiveTopic("overview")}
            style={{
              background: "#ffffff",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.45rem 1rem",
              fontSize: "14px",
              fontWeight: 800,
              color: "#000000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
          >
            ← {activeTopic === "overview" ? "Home Portal" : "Chapter 3 Index"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ background: "#000000", color: "#ffffff", fontSize: "14px", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: 6, textTransform: "uppercase" }}>
              Chapter 3
            </span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
              Operating Systems: Process Management
            </span>
          </div>
        </div>

        {/* Quick Topic Switcher Pills */}
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <button
            onClick={() => setActiveTopic("overview")}
            style={{
              background: activeTopic === "overview" ? "#000000" : "#ffffff",
              color: activeTopic === "overview" ? "#ffffff" : "#000000",
              border: "1.5px solid #000000",
              borderRadius: 6,
              padding: "0.35rem 0.8rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            📑 Index
          </button>
          {TOPICS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTopic(t.id)}
              style={{
                background: activeTopic === t.id ? t.color : "#ffffff",
                color: activeTopic === t.id ? "#ffffff" : "#000000",
                border: "1.5px solid #000000",
                borderRadius: 6,
                padding: "0.35rem 0.75rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                transition: "all 0.15s"
              }}
            >
              <span>{t.icon}</span>
              <span>{t.num}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main style={{ flex: 1, padding: activeTopic === "overview" ? "2.5rem 2rem 4rem" : "1rem 1rem 3rem" }}>
        {activeTopic === "overview" ? (
          <div style={{ maxWidth: 1140, margin: "0 auto" }}>
            {/* Hero Banner */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)",
              borderRadius: 20,
              padding: "2.5rem 2.75rem",
              color: "#ffffff",
              marginBottom: "2.5rem",
              boxShadow: "0 10px 25px -5px rgba(37,99,235,0.25)"
            }}>
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 100, padding: "0.25rem 0.9rem", fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                Silberschatz OS Operating System Concepts · Chapter 3
              </div>
              <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.85rem 0", color: "#ffffff", lineHeight: 1.2 }}>
                Chapter 3: Process Management Educational Suite
              </h1>
              <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, maxWidth: 700, lineHeight: 1.7, margin: "0 0 1.5rem 0" }}>
                Explore interactive visualizers for Process Concept, Memory Layout, 5-State Machine, Process Scheduling Queues, Schedulers, Context Switching, fork/exec, Zombies &amp; Orphans, and Interprocess Communication.
              </p>

              {/* Quick stats ribbon */}
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: "1.25rem" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>5 Topics</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>Core Concepts</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>3D Visualizers</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>Queues &amp; Channels</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>Interactive Quiz</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>Knowledge Test</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>EduTech UX</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>High Contrast Lexend</div>
                </div>
              </div>
            </div>

            {/* Topic Grid */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: 0 }}>
                Select a Topic to Explore
              </h2>
              <span style={{ fontSize: "14px", color: "#000000", fontWeight: 700 }}>
                Click any module below to open its dedicated visualizer
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
              {TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => setActiveTopic(topic.id)}
                  style={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 16,
                    padding: "1.75rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 12px 24px ${topic.color}35`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: topic.bg,
                        border: "2px solid #000000",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.4rem"
                      }}>
                        {topic.icon}
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 800, background: topic.bg, color: "#000000", padding: "0.2rem 0.6rem", borderRadius: 16, border: "1.5px solid #000000" }}>
                        Topic {topic.num}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                      {topic.title}
                    </h3>
                    <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: "0 0 1.25rem 0" }}>
                      {topic.summary}
                    </p>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
                      {topic.keyPoints.map((pt, pIdx) => (
                        <span key={pIdx} style={{ fontSize: "14px", background: "#f8fafc", color: "#000000", padding: "0.2rem 0.55rem", borderRadius: 6, fontWeight: 700, border: "1px solid #000000" }}>
                          ✓ {pt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "0.9rem",
                    borderTop: "1.5px solid #000000",
                    color: "#000000",
                    fontWeight: 800,
                    fontSize: "14px"
                  }}>
                    <span>Open Interactive Visualizer</span>
                    <span style={{ fontSize: "1.1rem" }}>➔</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Topic View */
          <div>
            <div style={{ maxWidth: 1200, margin: "0 auto 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setActiveTopic("overview")}
                style={{
                  background: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.45rem 1rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000000",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                ← Back to Topic Catalog
              </button>
              <div style={{ fontSize: "14px", color: "#000000", fontWeight: 800 }}>
                Active: <strong>{currentTopicObj?.title}</strong>
              </div>
            </div>

            {ActiveComponent && <ActiveComponent />}
          </div>
        )}
      </main>
    </div>
  );
}
