import React, { useState } from "react";
import ThreadOverview from "./ch4/ThreadOverview.jsx";
import MultithreadingModels from "./ch4/MultithreadingModels.jsx";
import ThreadLibraries from "./ch4/ThreadLibraries.jsx";
import ThreadingIssues from "./ch4/ThreadingIssues.jsx";

const FONT = "'Lexend', sans-serif";

const TOPICS = [
  {
    id: "overview",
    num: "01",
    title: "Thread Overview & Benefits",
    icon: "🧵",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    tag: "Core Concurrency",
    summary: "What is a thread, Single-threaded vs. Multithreaded architecture, 4 benefits (Responsiveness, Resource Sharing, Economy, Scalability), and Process vs. Thread comparison.",
    keyPoints: ["Lightweight Process", "Shared Code & Data", "Independent Registers & Stack", "Multicore Scalability"],
    component: ThreadOverview
  },
  {
    id: "models",
    num: "02",
    title: "Multithreading Models (Kernel vs User)",
    icon: "🔀",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#86efac",
    tag: "Architecture Mapping",
    summary: "The 4 fundamental mappings between user-level threads and kernel-level threads: Many-to-One, One-to-One, Many-to-Many, and the Two-Level hybrid model.",
    keyPoints: ["Many-to-One (Green Threads)", "One-to-One (Linux/Windows)", "Many-to-Many (Multiplexed)", "Two-Level Bound Model"],
    component: MultithreadingModels
  },
  {
    id: "libraries",
    num: "03",
    title: "Thread Libraries & Code Execution",
    icon: "📚",
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fde047",
    tag: "Programming APIs",
    summary: "Hands-on exploration of POSIX Pthreads (IEEE 1003.1c), Windows Win32 Thread API, and Java JVM Threads with live execution simulation and API comparison.",
    keyPoints: ["pthread_create / join", "Win32 CreateThread", "Java Runnable / Executor", "Thread Lifecycles"],
    component: ThreadLibraries
  },
  {
    id: "issues",
    num: "04",
    title: "Threading Issues & System Pitfalls",
    icon: "⚠️",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    tag: "OS Implementation",
    summary: "Critical nuances in multithreaded systems: fork() & exec() duplication semantics, synchronous vs. asynchronous signal handling, thread cancellation, TLS, and scheduler activations.",
    keyPoints: ["fork() vs fork1()", "Signal Delivery Routing", "Deferred Cancellation", "Thread-Local Storage (TLS)", "LWPs & Upcalls"],
    component: ThreadingIssues
  }
];

export default function ThreadsConcepts({ onBack }) {
  const [activeTopic, setActiveTopic] = useState("catalog");

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
            onClick={activeTopic === "catalog" ? onBack : () => setActiveTopic("catalog")}
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
            ← {activeTopic === "catalog" ? "Home Portal" : "Chapter 4 Index"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ background: "#000000", color: "#ffffff", fontSize: "14px", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: 6, textTransform: "uppercase" }}>
              Chapter 4
            </span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
              Operating Systems: Threads &amp; Concurrency
            </span>
          </div>
        </div>

        {/* Quick Topic Switcher Pills */}
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <button
            onClick={() => setActiveTopic("catalog")}
            style={{
              background: activeTopic === "catalog" ? "#000000" : "#ffffff",
              color: activeTopic === "catalog" ? "#ffffff" : "#000000",
              border: "1.5px solid #000000",
              borderRadius: 6,
              padding: "0.35rem 0.8rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
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
                gap: "0.3rem"
              }}
            >
              <span>{t.icon}</span>
              <span>{t.num}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main style={{ flex: 1, padding: activeTopic === "catalog" ? "2.5rem 2rem 4rem" : "1rem 1rem 3rem" }}>
        {activeTopic === "catalog" ? (
          <div style={{ maxWidth: 1140, margin: "0 auto" }}>
            {/* Hero Banner */}
            <div style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #4338ca 100%)",
              borderRadius: 20,
              padding: "2.5rem 2.75rem",
              color: "#ffffff",
              marginBottom: "2.5rem",
              boxShadow: "0 10px 25px -5px rgba(67,56,202,0.25)"
            }}>
              <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 100, padding: "0.25rem 0.9rem", fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                Silberschatz OS Operating System Concepts · Chapter 4
              </div>
              <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.85rem 0", color: "#ffffff", lineHeight: 1.2 }}>
                Chapter 4: Threads &amp; Concurrency Educational Suite
              </h1>
              <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, maxWidth: 700, lineHeight: 1.7, margin: "0 0 1.5rem 0" }}>
                Master thread architecture, multicore parallelism, multithreading mapping models (Many-to-One, One-to-One, Many-to-Many), Pthreads / Win32 / Java code execution, and system-level issues like signal routing and cancellation.
              </p>

              {/* Quick stats ribbon */}
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: "1.25rem" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>4 Core Topics</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>Silberschatz Coverage</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>3 Thread APIs</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>POSIX, Win32, Java</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>4 Kernel Models</div>
                  <div style={{ fontSize: "14px", color: "#ffffff", opacity: 0.9 }}>User vs Kernel Mapping</div>
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
                Click any module below to open its dedicated interactive visualizer
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
                onClick={() => setActiveTopic("catalog")}
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
                ← Back to Chapter 4 Catalog
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
