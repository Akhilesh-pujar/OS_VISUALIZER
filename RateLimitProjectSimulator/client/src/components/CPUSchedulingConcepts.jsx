import React, { useState, useRef, useEffect } from "react";
import FCFSScheduling from "./ch5/FCFSScheduling.jsx";
import SJFScheduling from "./ch5/SJFScheduling.jsx";
import RoundRobinScheduling from "./ch5/RoundRobinScheduling.jsx";
import PriorityScheduling from "./ch5/PriorityScheduling.jsx";
import MultilevelQueueScheduling from "./ch5/MultilevelQueueScheduling.jsx";

const FONT = "'Lexend', sans-serif";

const TOPICS = [
  {
    id: "fcfs",
    num: "01",
    title: "First-Come, First-Served (FCFS)",
    icon: "⏱️",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    tag: "Non-Preemptive Baseline",
    summary: "The simplest CPU-scheduling algorithm: process that requests the CPU first is allocated the CPU first. Demonstrates the critical Convoy Effect.",
    keyPoints: ["FIFO Ready Queue", "Convoy Effect Demo", "Non-Preemptive Execution", "High Average Wait Time"],
    component: FCFSScheduling
  },
  {
    id: "sjf",
    num: "02",
    title: "Shortest-Job-First (SJF & SRTF)",
    icon: "⚡",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#86efac",
    tag: "Optimal Average Wait",
    summary: "Associates each process with the length of its next CPU burst. Features both Non-Preemptive SJF and Preemptive SJF (Shortest Remaining Time First).",
    keyPoints: ["Provably Optimal AWT", "Preemptive SRTF", "Exponential Averaging Prediction", "Starvation Hazard"],
    component: SJFScheduling
  },
  {
    id: "rr",
    num: "03",
    title: "Round-Robin (RR) Scheduling",
    icon: "🔄",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde047",
    tag: "Time-Sharing Core",
    summary: "Preemptive scheduling designed for time-sharing systems. Allocates a fixed time quantum (q) across a circular FIFO ready queue.",
    keyPoints: ["Time Quantum (q) Slider", "Circular Ready Queue", "Context Switch Trade-off", "Degenerates to FCFS if q Large"],
    component: RoundRobinScheduling
  },
  {
    id: "priority",
    num: "04",
    title: "Priority Scheduling & Aging",
    icon: "⭐",
    color: "#9333ea",
    bg: "#faf5ff",
    border: "#d8b4fe",
    tag: "Priority Dispatch",
    summary: "Allocates CPU to highest-priority processes (Preemptive vs Non-Preemptive). Explores Starvation, Aging solutions, and the Mars Pathfinder Priority Inversion.",
    keyPoints: ["Priority Hierarchy (1 = Top)", "Indefinite Starvation", "Dynamic Aging Boost", "Priority Inversion & Inheritance"],
    component: PriorityScheduling
  },
  {
    id: "mlfq",
    num: "05",
    title: "Multilevel Queue & MLFQ",
    icon: "📶",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fca5a5",
    tag: "Modern OS Schedulers",
    summary: "Partitions the ready queue into multiple priority tiers (Q0: RR q=8, Q1: RR q=16, Q2: FCFS). Demonstrates dynamic process demotion and aging promotion.",
    keyPoints: ["Multi-Tier Queue Hierarchy", "Interactive vs Batch Separation", "Dynamic Demotion on Timeout", "Aging Escalation"],
    component: MultilevelQueueScheduling
  }
];

export default function CPUSchedulingConcepts({ onBack }) {
  const [activeTopic, setActiveTopic] = useState("fcfs");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTopicIndex = TOPICS.findIndex((t) => t.id === activeTopic);
  const currentTopicObj = TOPICS[currentTopicIndex] || TOPICS[0];
  const ActiveComponent = currentTopicObj.component;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrev = () => {
    if (currentTopicIndex > 0) {
      setActiveTopic(TOPICS[currentTopicIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentTopicIndex < TOPICS.length - 1) {
      setActiveTopic(TOPICS[currentTopicIndex + 1].id);
    }
  };

  return (
    <div style={{ fontFamily: FONT, background: "#ffffff", minHeight: "100vh", color: "#000000" }}>
      {/* ── TOP STICKY HEADER WITH DROPDOWN NAVIGATION ── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#ffffff",
        borderBottom: "2px solid #000000",
        padding: "0.85rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
      }}>
        {/* Left: Back button & Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={onBack}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.45rem 0.9rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            ← Home Portal
          </button>
          <div>
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#475569", fontWeight: 800 }}>
              Silberschatz Operating System Concepts • Chapter 5
            </div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#000000", lineHeight: 1.2 }}>
              CPU Scheduling Simulator
            </div>
          </div>
        </div>

        {/* Center / Right: Interactive Topic Selector Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} ref={dropdownRef}>
          {/* Quick Step Buttons */}
          <button
            onClick={handlePrev}
            disabled={currentTopicIndex === 0}
            style={{
              background: "#ffffff",
              color: currentTopicIndex === 0 ? "#cbd5e1" : "#000000",
              border: `2px solid ${currentTopicIndex === 0 ? "#e2e8f0" : "#000000"}`,
              borderRadius: 8,
              padding: "0.45rem 0.75rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: currentTopicIndex === 0 ? "not-allowed" : "pointer"
            }}
          >
            ◀
          </button>

          {/* Dropdown Toggle Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                background: "#ffffff",
                color: "#000000",
                border: "2px solid #000000",
                borderRadius: 8,
                padding: "0.45rem 1rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                minWidth: "280px",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>{currentTopicObj.icon}</span>
                <span>{currentTopicObj.num}. {currentTopicObj.title}</span>
              </div>
              <span style={{ fontSize: "11px" }}>{dropdownOpen ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown Menu Items */}
            {dropdownOpen && (
              <div style={{
                position: "absolute",
                top: "110%",
                right: 0,
                width: "360px",
                background: "#ffffff",
                border: "2px solid #000000",
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                overflow: "hidden",
                zIndex: 60
              }}>
                <div style={{ padding: "0.5rem 0.75rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 800, color: "#64748b" }}>
                  SELECT CPU SCHEDULING ALGORITHM
                </div>
                {TOPICS.map((topic, idx) => {
                  const isActive = topic.id === activeTopic;
                  return (
                    <div
                      key={topic.id}
                      onClick={() => {
                        setActiveTopic(topic.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        padding: "0.75rem 1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        background: isActive ? "#eff6ff" : "#ffffff",
                        cursor: "pointer",
                        borderBottom: idx < TOPICS.length - 1 ? "1px solid #f1f5f9" : "none",
                        transition: "background 0.15s ease"
                      }}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: topic.bg,
                        border: `1.5px solid #000000`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "15px"
                      }}>
                        {topic.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: isActive ? 900 : 700, color: "#000000" }}>
                          {topic.num}. {topic.title}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>
                          {topic.tag}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentTopicIndex === TOPICS.length - 1}
            style={{
              background: "#ffffff",
              color: currentTopicIndex === TOPICS.length - 1 ? "#cbd5e1" : "#000000",
              border: `2px solid ${currentTopicIndex === TOPICS.length - 1 ? "#e2e8f0" : "#000000"}`,
              borderRadius: 8,
              padding: "0.45rem 0.75rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: currentTopicIndex === TOPICS.length - 1 ? "not-allowed" : "pointer"
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* ── ALGORITHM HERO OVERVIEW CARD ── */}
      <div style={{ maxWidth: "1400px", margin: "1.5rem auto 0 auto", padding: "0 1.5rem" }}>
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ maxWidth: "800px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "20px" }}>{currentTopicObj.icon}</span>
              <span style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
                Section {currentTopicObj.num}: {currentTopicObj.title}
              </span>
              <span style={{
                background: currentTopicObj.bg,
                border: "1px solid #000000",
                borderRadius: 4,
                padding: "0.15rem 0.5rem",
                fontSize: "11px",
                fontWeight: 800,
                color: "#000000"
              }}>
                {currentTopicObj.tag}
              </span>
            </div>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.5 }}>
              {currentTopicObj.summary}
            </p>
          </div>

          {/* Key Topics Badges */}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", maxWidth: "420px" }}>
            {currentTopicObj.keyPoints.map((pt, i) => (
              <span
                key={i}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #000000",
                  borderRadius: 6,
                  padding: "0.25rem 0.55rem",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#000000"
                }}
              >
                ✓ {pt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTIVE ALGORITHM COMPONENT CONTAINER ── */}
      <div style={{ maxWidth: "1400px", margin: "1rem auto 3rem auto" }}>
        <ActiveComponent />
      </div>
    </div>
  );
}

