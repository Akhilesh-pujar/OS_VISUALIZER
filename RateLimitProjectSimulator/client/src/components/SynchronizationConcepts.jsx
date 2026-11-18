import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CriticalSectionProblem from "./ch6/CriticalSectionProblem.jsx";
import PetersonsSolution from "./ch6/PetersonsSolution.jsx";
import SyncHardware from "./ch6/SyncHardware.jsx";
import Semaphores from "./ch6/Semaphores.jsx";
import ClassicProblems from "./ch6/ClassicProblems.jsx";

const FONT = "'Lexend', sans-serif";

const TOPICS = [
  {
    id: "critical",
    num: "01",
    title: "The Critical-Section Problem",
    icon: "⚠️",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    tag: "Race Conditions & Criteria",
    summary: "Race condition anatomy via CPU register simulation, the 4-part critical section structure, and the 3 correctness criteria tested against 3 naive locking attempts.",
    keyPoints: ["Race Condition Simulator", "Entry / CS / Exit / Remainder", "Mutual Exclusion", "Progress & Bounded Waiting"],
    component: CriticalSectionProblem,
  },
  {
    id: "peterson",
    num: "02",
    title: "Peterson's Solution",
    icon: "🤝",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    tag: "Software 2-Process Solution",
    summary: "Interactive 2-process step-by-step simulator with shared flag[] and turn variables, rigorous proof of all 3 criteria, and why it fails on modern out-of-order CPUs.",
    keyPoints: ["Interactive P0 / P1 Stepper", "flag[] + turn Variables", "Formal Correctness Proof", "Memory Barrier Issue"],
    component: PetersonsSolution,
  },
  {
    id: "hardware",
    num: "03",
    title: "Synchronization Hardware",
    icon: "⚙️",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde047",
    tag: "Atomic CPU Instructions",
    summary: "Atomic test_and_set() 2-core live simulator, interactive compare_and_swap() (CAS) playground with custom inputs, and the bounded-waiting circular token ring algorithm.",
    keyPoints: ["test_and_set() Multi-Core", "CAS Interactive Tester", "Circular Bounded-Wait Ring", "Spinlock vs. Block Trade-off"],
    component: SyncHardware,
  },
  {
    id: "semaphores",
    num: "04",
    title: "Semaphores",
    icon: "🚦",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#d8b4fe",
    tag: "Dijkstra's Primitive",
    summary: "Live counting/binary semaphore playground with blocked process queue, busy-wait vs. block/wakeup code comparison, deadlock hazard, and the Mars Pathfinder priority inversion walkthrough.",
    keyPoints: ["Counting & Binary Modes", "Blocked Process Queue", "Busy-Wait vs. Block/Wakeup", "Mars Pathfinder Bug"],
    component: Semaphores,
  },
  {
    id: "classic",
    num: "05",
    title: "Classic Synchronization Problems",
    icon: "🏛️",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#6ee7b7",
    tag: "Canonical OS Problems",
    summary: "Bounded-Buffer (Producer–Consumer) with live buffer visualization, Readers–Writers problem with starvation demonstration, and Dining Philosophers with deadlock trigger & 4 solutions.",
    keyPoints: ["Bounded-Buffer / Producer-Consumer", "Readers-Writers & Starvation", "Dining Philosophers Deadlock", "4 Deadlock Solutions"],
    component: ClassicProblems,
  },
];

export default function SynchronizationConcepts({ onBack, defaultTopic }) {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const handleBack = onBack || (() => navigate('/'));
  const [activeTopic, setActiveTopic] = useState(topicId || defaultTopic || "critical");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTopicIndex = TOPICS.findIndex((t) => t.id === activeTopic);
  const currentTopicObj = TOPICS[currentTopicIndex] || TOPICS[0];
  const ActiveComponent = currentTopicObj.component;

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
        position: "sticky", top: 0, zIndex: 100,
        background: "#ffffff", borderBottom: "2px solid #000000",
        padding: "0.75rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        {/* Left: Back & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={handleBack}
            style={{
              background: "#ffffff", border: "2px solid #000000", borderRadius: 8,
              padding: "0.45rem 1rem", fontSize: "14px", fontWeight: 800, color: "#000000",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
          >
            ← Home Portal
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{
              background: "#ffffff", color: "#000000", border: "1.5px solid #000000",
              fontSize: "14px", fontWeight: 900, padding: "0.2rem 0.6rem",
              borderRadius: 6, textTransform: "uppercase",
            }}>
              Chapter 6
            </span>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
              Process Synchronization
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
                background: "#ffffff", border: "2px solid #000000", borderRadius: 8,
                padding: "0.45rem 1rem", fontSize: "14px", fontWeight: 800, color: "#000000",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem",
                boxShadow: dropdownOpen ? "0 4px 12px rgba(0,0,0,0.12)" : "none",
                minWidth: "300px", justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>{currentTopicObj.icon}</span>
                <span style={{ fontWeight: 900 }}>Topic {currentTopicObj.num}: {currentTopicObj.title}</span>
              </div>
              <span style={{ fontSize: "12px", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
            </button>
          </div>

          {/* Floating Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: "380px", background: "#ffffff",
              border: "2px solid #000000", borderRadius: 12,
              boxShadow: "0 12px 28px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 999,
            }}>
              <div style={{ background: "#f8fafc", padding: "0.6rem 1rem", borderBottom: "1.5px solid #000000", fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Select Topic (Chapter 6)
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {TOPICS.map((topic, idx) => {
                  const isSelected = activeTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => { setActiveTopic(topic.id); setDropdownOpen(false); }}
                      style={{
                        background: isSelected ? topic.bg : "#ffffff",
                        border: "none",
                        borderBottom: idx < TOPICS.length - 1 ? "1px solid #e2e8f0" : "none",
                        padding: "0.85rem 1rem", textAlign: "left", cursor: "pointer",
                        display: "flex", alignItems: "flex-start", gap: "0.75rem",
                        borderLeft: isSelected ? `4px solid ${topic.color}` : "4px solid transparent",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#ffffff"; }}
                    >
                      <span style={{ fontSize: "1.3rem", marginTop: "2px" }}>{topic.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000" }}>
                            Topic {topic.num}: {topic.title}
                          </span>
                          {isSelected && <span style={{ fontSize: "14px", fontWeight: 900, color: topic.color }}>✓</span>}
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", lineHeight: 1.4, marginBottom: "0.35rem" }}>
                          {topic.summary.slice(0, 90)}…
                        </div>
                        <span style={{
                          display: "inline-block", fontSize: "11px", fontWeight: 800,
                          padding: "0.1rem 0.5rem", borderRadius: 6,
                          background: topic.bg, border: "1px solid #000000", color: "#000000",
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

      {/* ── Topic Banner & Navigation Controls ── */}
      <div style={{
        background: "#f8fafc", borderBottom: "2px solid #000000",
        padding: "1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
      }}>
        {/* Left: Active Topic Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: currentTopicObj.bg, border: "2px solid #000000",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem",
          }}>
            {currentTopicObj.icon}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.2rem" }}>
              <span style={{
                fontSize: "14px", fontWeight: 900,
                background: currentTopicObj.bg, border: "1px solid #000000",
                borderRadius: 6, padding: "0.15rem 0.5rem", color: "#000000",
              }}>
                Topic {currentTopicObj.num} of {String(TOPICS.length).padStart(2, "0")}
              </span>
              <span style={{
                fontSize: "14px", fontWeight: 800, color: "#000000",
                background: "#ffffff", border: "1px solid #000000",
                borderRadius: 6, padding: "0.15rem 0.5rem",
              }}>
                {currentTopicObj.tag}
              </span>
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: 0 }}>
              {currentTopicObj.title}
            </h1>
          </div>
        </div>

        {/* Right: Key Point Pills + Prev/Next */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {currentTopicObj.keyPoints.map((pt, pIdx) => (
              <span
                key={pIdx}
                style={{
                  fontSize: "12px", background: "#ffffff", color: "#000000",
                  padding: "0.25rem 0.6rem", borderRadius: 6, fontWeight: 700,
                  border: "1px solid #000000",
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
                border: "2px solid #000000", borderRadius: 8,
                padding: "0.45rem 0.85rem", fontSize: "14px", fontWeight: 800,
                color: "#000000", cursor: currentTopicIndex === 0 ? "not-allowed" : "pointer",
              }}
            >
              ◀ Prev Topic
            </button>
            <button
              onClick={handleNext}
              disabled={currentTopicIndex === TOPICS.length - 1}
              style={{
                background: currentTopicIndex === TOPICS.length - 1 ? "#e2e8f0" : currentTopicObj.bg,
                color: "#000000", border: "2px solid #000000", borderRadius: 8,
                padding: "0.45rem 0.85rem", fontSize: "14px", fontWeight: 900,
                cursor: currentTopicIndex === TOPICS.length - 1 ? "not-allowed" : "pointer",
              }}
            >
              Next Topic ▶
            </button>
          </div>
        </div>
      </div>

      {/* ── Active Topic Component ── */}
      <main style={{ flex: 1, padding: "1.25rem 1rem 3rem" }}>
        <ActiveComponent />
      </main>
    </div>
  );
}
