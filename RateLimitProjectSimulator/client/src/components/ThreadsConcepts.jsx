import React, { useState, useRef, useEffect } from "react";
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
    summary: "What is a thread, Single vs Multithreaded architecture, 4 benefits (Responsiveness, Resource Sharing, Economy, Scalability), and Process vs Thread matrix.",
    keyPoints: ["Lightweight Process", "Shared Code & Data", "Registers & Stack", "Multicore Scalability"],
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
    summary: "The 4 fundamental mappings between user-level threads and kernel-level threads: Many-to-One, One-to-One, Many-to-Many, and Two-Level hybrid.",
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
    summary: "Hands-on exploration of POSIX Pthreads (IEEE 1003.1c), Windows Win32 Thread API, and Java JVM Threads with live execution simulation.",
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
    summary: "Critical nuances in multithreaded systems: fork() & exec() semantics, synchronous vs asynchronous signals, thread cancellation, TLS, and LWPs.",
    keyPoints: ["fork() vs fork1()", "Signal Delivery Routing", "Deferred Cancellation", "Thread-Local Storage (TLS)", "LWPs & Upcalls"],
    component: ThreadingIssues
  }
];

export default function ThreadsConcepts({ onBack }) {
  const [activeTopic, setActiveTopic] = useState("overview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTopicIndex = TOPICS.findIndex((t) => t.id === activeTopic);
  const currentTopicObj = TOPICS[currentTopicIndex] || TOPICS[0];
  const ActiveComponent = currentTopicObj.component;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () => {
    if (currentTopicIndex < TOPICS.length - 1) {
      setActiveTopic(TOPICS[currentTopicIndex + 1].id);
      setDropdownOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentTopicIndex > 0) {
      setActiveTopic(TOPICS[currentTopicIndex - 1].id);
      setDropdownOpen(false);
    }
  };

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
        {/* Left: Back & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={onBack}
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
            ← Home Portal
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ background: "#ffffff", color: "#000000", border: "1.5px solid #000000", fontSize: "14px", fontWeight: 900, padding: "0.2rem 0.6rem", borderRadius: 6, textTransform: "uppercase" }}>
              Chapter 4
            </span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
              Operating Systems: Threads &amp; Concurrency
            </span>
          </div>
        </div>

        {/* Right: Dropdown Topic Selector */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Topic:
            </span>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
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
                gap: "0.6rem",
                boxShadow: dropdownOpen ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
                minWidth: "290px",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{currentTopicObj.icon}</span>
                <span style={{ fontWeight: 900 }}>Topic {currentTopicObj.num}: {currentTopicObj.title}</span>
              </div>
              <span style={{ fontSize: "12px", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                ▼
              </span>
            </button>
          </div>

          {/* Floating Dropdown Menu */}
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "360px",
              background: "#ffffff",
              border: "2px solid #000000",
              borderRadius: 12,
              boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
              overflow: "hidden",
              zIndex: 999
            }}>
              <div style={{ background: "#f8fafc", padding: "0.6rem 1rem", borderBottom: "1.5px solid #000000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#000000" }}>
                Select Concepts Topic (Chapter 4)
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {TOPICS.map((topic, idx) => {
                  const isSelected = activeTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => {
                        setActiveTopic(topic.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        border: "none",
                        borderBottom: idx < TOPICS.length - 1 ? "1px solid #e2e8f0" : "none",
                        padding: "0.85rem 1rem",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        borderLeft: isSelected ? "4px solid #2563eb" : "4px solid transparent",
                        transition: "all 0.15s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "#ffffff";
                      }}
                    >
                      <span style={{ fontSize: "1.3rem", marginTop: "2px" }}>{topic.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000" }}>
                            Topic {topic.num}: {topic.title}
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: "14px", fontWeight: 900, color: "#2563eb" }}>✓</span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#000000", lineHeight: 1.4, margin: "0 0 0.35rem 0" }}>
                          {topic.summary}
                        </div>
                        <span style={{
                          display: "inline-block",
                          fontSize: "11px",
                          fontWeight: 800,
                          padding: "0.1rem 0.5rem",
                          borderRadius: 6,
                          background: topic.bg,
                          border: "1px solid #000000",
                          color: "#000000"
                        }}>
                          {topic.tag}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Topic Banner & Navigation Controls Bar ── */}
      <div style={{
        background: "#f8fafc",
        borderBottom: "2px solid #000000",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        {/* Left: Active Topic Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: currentTopicObj.bg,
            border: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6rem"
          }}>
            {currentTopicObj.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.2rem" }}>
              <span style={{ fontSize: "14px", fontWeight: 900, background: currentTopicObj.bg, border: "1px solid #000000", borderRadius: 6, padding: "0.15rem 0.5rem", color: "#000000" }}>
                Topic {currentTopicObj.num} of 04
              </span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000", background: "#ffffff", border: "1px solid #000000", borderRadius: 6, padding: "0.15rem 0.5rem" }}>
                {currentTopicObj.tag}
              </span>
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: 0 }}>
              {currentTopicObj.title}
            </h1>
          </div>
        </div>

        {/* Right: Key Point Pills + Prev/Next Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {currentTopicObj.keyPoints.map((pt, pIdx) => (
              <span
                key={pIdx}
                style={{
                  fontSize: "12px",
                  background: "#ffffff",
                  color: "#000000",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 6,
                  fontWeight: 700,
                  border: "1px solid #000000"
                }}
              >
                ✓ {pt}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.4rem", marginLeft: "0.5rem" }}>
            <button
              onClick={handlePrev}
              disabled={currentTopicIndex === 0}
              style={{
                background: currentTopicIndex === 0 ? "#e2e8f0" : "#ffffff",
                border: "2px solid #000000",
                borderRadius: 8,
                padding: "0.45rem 0.85rem",
                fontSize: "14px",
                fontWeight: 800,
                color: "#000000",
                cursor: currentTopicIndex === 0 ? "not-allowed" : "pointer"
              }}
            >
              ◀ Prev Topic
            </button>
            <button
              onClick={handleNext}
              disabled={currentTopicIndex === TOPICS.length - 1}
              style={{
                background: currentTopicIndex === TOPICS.length - 1 ? "#e2e8f0" : "#eff6ff",
                color: "#000000",
                border: "2px solid #000000",
                borderRadius: 8,
                padding: "0.45rem 0.85rem",
                fontSize: "14px",
                fontWeight: 900,
                cursor: currentTopicIndex === TOPICS.length - 1 ? "not-allowed" : "pointer"
              }}
            >
              Next Topic ▶
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Topic Visualizer View ── */}
      <main style={{ flex: 1, padding: "1.25rem 1rem 3rem" }}>
        <ActiveComponent />
      </main>
    </div>
  );
}