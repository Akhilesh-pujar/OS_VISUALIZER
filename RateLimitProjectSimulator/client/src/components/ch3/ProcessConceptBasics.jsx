import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

const SEGMENTS = [
  { label: "Stack Segment", sub: "grows ↓ (local variables, return address frames)", bg: "#bfdbfe", border: "#2563eb", tc: "#000000", icon: "📚", detail: "Stack frames for active function calls. Each function call pushes local variables, arguments, and return instruction address. Fixed maximum limit (e.g., 8MB on Linux). Stack overflow happens if recursive calls exceed this limit." },
  { label: "Free Address Space", sub: "buffer gap between growing stack and heap", bg: "#ffffff", border: "#000000", tc: "#000000", icon: "↕️", detail: "Virtual address room separating heap and stack. Ensures that the dynamic heap and functional stack do not immediately collide." },
  { label: "Heap Segment", sub: "grows ↑ dynamic memory via malloc(), new()", bg: "#bbf7d0", border: "#16a34a", tc: "#000000", icon: "🏗️", detail: "Dynamically allocated memory requested at runtime via malloc() or new(). Managed by user application or runtime garbage collector. Memory leaks happen when memory is not released." },
  { label: "BSS Segment", sub: "uninitialized global and static variables", bg: "#e9d5ff", border: "#9333ea", tc: "#000000", icon: "📦", detail: "Block Started by Symbol. Variables declared globally without explicit initial values (e.g., int counter;). Initialized to all zeroes by kernel at load time." },
  { label: "Data Segment", sub: "initialized global and static variables", bg: "#fef08a", border: "#ca8a04", tc: "#000000", icon: "📊", detail: "Stores global variables that have explicit non-zero starting values (e.g., int max_users = 100;). Separated into read-write and read-only (.rodata) regions." },
  { label: "Text Segment", sub: "read-only compiled machine instructions", bg: "#fecaca", border: "#dc2626", tc: "#000000", icon: "📝", detail: "The raw compiled CPU instructions (binary code). Marked read-only by OS MMU to prevent self-modifying code. Shared among multiple running processes of the same program." },
];

const PCB_FIELDS = [
  { f: "Process State", d: "new, ready, running, waiting, or terminated. Read by scheduler on every timer tick.", icon: "🔄", color: "#bfdbfe" },
  { f: "Process ID (PID)", d: "Unique numerical identifier assigned by kernel (1 to 32768 on Linux). PID 1 is always systemd/init.", icon: "🆔", color: "#bbf7d0" },
  { f: "Program Counter (PC)", d: "Memory address of the NEXT instruction to be executed. Snapshotted on context switch.", icon: "📍", color: "#fef08a" },
  { f: "CPU Registers", d: "Hardware register state: accumulators, index registers, stack pointer (RSP), flags.", icon: "💻", color: "#e9d5ff" },
  { f: "Memory Management Limits", d: "Base and limit registers, page tables, segment tables defining valid address bounds.", icon: "🔒", color: "#fecaca" },
  { f: "Open File Descriptors Table", d: "Array of open files, sockets, pipes (0=stdin, 1=stdout, 2=stderr). Inherited on fork().", icon: "📁", color: "#bbf7d0" },
  { f: "CPU Scheduling Info", d: "Process priority, scheduling queue pointers, nice value, CPU burst history.", icon: "⚖️", color: "#fef08a" },
  { f: "Accounting Information", d: "CPU time consumed, clock elapsed time, page faults, I/O count, billing metrics.", icon: "📈", color: "#fce7f3" },
];

export default function ProcessConceptBasics() {
  const [heapLevel, setHeapLevel] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [hovSeg, setHovSeg] = useState(null);
  const timerRef = useRef(null);

  const startAnim = () => {
    if (animating) return;
    setAnimating(true);
    setHeapLevel(0);
    let lvl = 0;
    const grow = () => {
      lvl += 1;
      setHeapLevel(lvl);
      if (lvl < 4) timerRef.current = setTimeout(grow, 400);
      else setAnimating(false);
    };
    timerRef.current = setTimeout(grow, 300);
  };

  const resetAnim = () => {
    clearTimeout(timerRef.current);
    setAnimating(false);
    setHeapLevel(0);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #4f46e5 100%)",
        borderRadius: 16,
        padding: "1.75rem 2rem",
        marginBottom: "2rem",
        color: "#ffffff"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#bae6fd", marginBottom: "0.3rem" }}>
          Chapter 3 · Topic 1
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#ffffff", lineHeight: 1.2 }}>
          What is a Process? Program vs. Process &amp; Memory Layout
        </h1>
        <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, margin: 0, lineHeight: 1.6 }}>
          A process is a program in execution — an active living entity loaded in RAM with its own virtual address space, CPU state, and kernel PCB.
        </p>
      </div>

      {/* ── Program vs Process ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.4rem 0", color: "#000000" }}>
          Program vs. Process Comparison
        </h2>
        <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 1.25rem 0", lineHeight: 1.6 }}>
          Understanding the difference between passive binary files on disk and active execution entities in RAM.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 1fr", gap: "1rem", alignItems: "stretch" }}>
          {/* Program Card */}
          <div style={{ background: "#fff7ed", border: "2px solid #000000", borderRadius: 14, padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>💾</div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
              Program (Passive Entity)
            </h3>
            <ul style={{ margin: 0, padding: "0 0 0 1.2rem", fontSize: "14px", color: "#000000", lineHeight: 1.8 }}>
              <li>Stored permanently on <strong>secondary storage (Disk/SSD)</strong>.</li>
              <li>Consists of an executable file format (ELF on Linux, PE on Windows).</li>
              <li>Has no CPU registers, no program counter, no allocated memory.</li>
              <li>One single program file can be used to launch multiple processes.</li>
              <li>Exists indefinitely until explicitly erased from disk.</li>
            </ul>
            <div style={{ marginTop: "1rem", background: "#ffedd5", border: "1.5px solid #000000", borderRadius: 8, padding: "0.5rem 0.8rem", fontSize: "14px", fontWeight: 800, color: "#000000" }}>
              Example: /usr/bin/python3 on disk
            </div>
          </div>

          {/* Transition Icon */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.3rem" }}>⚡</span>
            <div style={{ width: 2, flex: 1, background: "#000000", minHeight: 60 }} />
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000", textAlign: "center" }}>
              exec() / Click
            </div>
            <div style={{ width: 2, flex: 1, background: "#000000", minHeight: 60 }} />
            <span style={{ fontSize: "1.3rem" }}>➔</span>
          </div>

          {/* Process Card */}
          <div style={{ background: "#eff6ff", border: "2px solid #000000", borderRadius: 14, padding: "1.5rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>🔥</div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
              Process (Active Entity)
            </h3>
            <ul style={{ margin: 0, padding: "0 0 0 1.2rem", fontSize: "14px", color: "#000000", lineHeight: 1.8 }}>
              <li>Loaded into <strong>Main Memory (RAM)</strong> and assigned CPU cycles.</li>
              <li>Maintains hardware registers, program counter, and memory limits.</li>
              <li>Assigned a unique Process Identifier (PID) and kernel PCB.</li>
              <li>Runs concurrently with other processes under OS scheduling.</li>
              <li>Terminates and is deallocated upon calling exit().</li>
            </ul>
            <div style={{ marginTop: "1rem", background: "#dbeafe", border: "1.5px solid #000000", borderRadius: 8, padding: "0.5rem 0.8rem", fontSize: "14px", fontWeight: 800, color: "#000000" }}>
              Example: python3 [PID 4082] in RAM
            </div>
          </div>
        </div>
      </div>

      {/* ── Virtual Memory Layout (6 Segments) ── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.4rem 0", color: "#000000" }}>
          Process Memory Layout in Virtual RAM
        </h2>
        <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 1.25rem 0", lineHeight: 1.6 }}>
          Every process address space is structured into discrete segments. Click any segment to view its description. Test dynamic heap growth with the interactive button below.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.75rem", alignItems: "flex-start" }}>
          {/* Visual Memory Stack */}
          <div>
            <div style={{ border: "2px solid #000000", borderRadius: 14, overflow: "hidden", background: "#ffffff", boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
              <div style={{ background: "#000000", color: "#ffffff", padding: "0.6rem", textAlign: "center", fontSize: "14px", fontWeight: 800 }}>
                High Address (0xFFFFFFFF)
              </div>
              {SEGMENTS.map((seg, i) => (
                <div
                  key={i}
                  onClick={() => setHovSeg(hovSeg === i ? null : i)}
                  style={{
                    padding: i === 2 ? `${0.75 + heapLevel * 0.3}rem 1rem` : "0.85rem 1rem",
                    background: seg.bg,
                    borderBottom: "1.5px solid #000000",
                    cursor: "pointer",
                    borderLeft: hovSeg === i ? `6px solid #000000` : `6px solid ${seg.border}`,
                    transition: "all 0.25s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{seg.icon}</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>{seg.label}</div>
                      <div style={{ fontSize: "14px", color: "#000000" }}>{seg.sub}</div>
                    </div>
                  </div>
                  {i === 2 && heapLevel > 0 && (
                    <div style={{ marginTop: "0.4rem", fontSize: "14px", fontWeight: 800, color: "#15803d" }}>
                      ↑ malloc() growing dynamic heap... (+{heapLevel * 16}KB allocated)
                    </div>
                  )}
                </div>
              ))}
              <div style={{ background: "#000000", color: "#ffffff", padding: "0.6rem", textAlign: "center", fontSize: "14px", fontWeight: 800 }}>
                Low Address (0x00000000)
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                onClick={startAnim}
                disabled={animating}
                style={{
                  flex: 1,
                  background: animating ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.5rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: animating ? "not-allowed" : "pointer"
                }}
              >
                {animating ? "Allocating..." : "▶ Animate malloc()"}
              </button>
              <button
                onClick={resetAnim}
                style={{
                  flex: 1,
                  background: "#ffffff",
                  color: "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.5rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ↺ Reset
              </button>
            </div>
          </div>

          {/* Segment Detail / Grid */}
          <div>
            {hovSeg !== null ? (
              <div style={{ background: SEGMENTS[hovSeg].bg, border: "2px solid #000000", borderRadius: 14, padding: "1.5rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.3rem" }}>{SEGMENTS[hovSeg].icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  {SEGMENTS[hovSeg].label}
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: "0 0 1rem 0" }}>
                  {SEGMENTS[hovSeg].detail}
                </p>
                <button
                  onClick={() => setHovSeg(null)}
                  style={{
                    background: "#000000",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.45rem 1rem",
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Show All Segments Overview
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                {SEGMENTS.map((seg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setHovSeg(idx)}
                    style={{
                      background: seg.bg,
                      border: "2px solid #000000",
                      borderRadius: 12,
                      padding: "1rem",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)"
                    }}
                  >
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#000000", marginBottom: "0.25rem" }}>
                      {seg.icon} {seg.label}
                    </div>
                    <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: 0 }}>
                      {seg.sub}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Process Control Block (PCB) Fields Accordion ── */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.4rem 0", color: "#000000" }}>
          Process Control Block (PCB) Structure
        </h2>
        <p style={{ fontSize: "14px", color: "#000000", margin: "0 0 1.25rem 0", lineHeight: 1.6 }}>
          The master kernel data structure (<code>struct task_struct</code> in Linux). Click any field to read its architectural purpose.
        </p>

        <div style={{ border: "2px solid #000000", borderRadius: 14, overflow: "hidden", background: "#ffffff" }}>
          <div style={{ background: "#000000", color: "#ffffff", padding: "0.75rem 1.25rem", fontSize: "14px", fontWeight: 800 }}>
            struct task_struct &#123; /* Linux Process Control Block */ &#125;
          </div>
          {PCB_FIELDS.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: expanded === idx ? item.color : idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                  border: "none",
                  borderTop: "1.5px solid #000000",
                  padding: "0.9rem 1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#000000" }}>
                    {item.f}
                  </span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000" }}>
                  {expanded === idx ? "▲" : "▼"}
                </span>
              </button>
              {expanded === idx && (
                <div style={{ background: "#ffffff", borderTop: "1px solid #000000", padding: "0.9rem 1.25rem", fontSize: "14px", color: "#000000", lineHeight: 1.6, borderLeft: "6px solid #000000" }}>
                  {item.d}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
