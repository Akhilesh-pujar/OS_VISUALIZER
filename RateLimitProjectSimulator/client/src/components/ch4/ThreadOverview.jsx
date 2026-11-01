import React, { useState } from "react";

const FONT = "'Lexend', sans-serif";

export default function ThreadOverview() {
  const [activeTab, setActiveTab] = useState("concept"); // "concept", "comparison", "benefits"
  const [threadCount, setThreadCount] = useState(3);

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Sub-navigation ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { id: "concept", label: "Single vs Multithreaded Process Architecture" },
          { id: "benefits", label: "4 Key Benefits of Multithreading" },
          { id: "comparison", label: "Process vs Thread Deep Comparison" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#000000" : "#ffffff",
              color: activeTab === tab.id ? "#ffffff" : "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.55rem 1.1rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Single vs Multithreaded Architecture ── */}
      {activeTab === "concept" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: "0 0 0.5rem 0" }}>
              What is a Thread? (Lightweight Process)
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: 0 }}>
              A thread is a basic unit of CPU utilization. It comprises a <strong>Thread ID</strong>, a <strong>Program Counter (PC)</strong>, a <strong>Register Set</strong>, and a <strong>Stack</strong>.
              It shares with other threads belonging to the same process its <strong>code section</strong>, <strong>data section</strong>, and other operating-system resources such as <strong>open files and signals</strong>.
            </p>
          </div>

          {/* Side-by-side Architectural Comparison SVG */}
          <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1.5rem", background: "#ffffff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
                Silberschatz Figure 4.1: Single-Threaded vs. Multithreaded Process
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "14px", fontWeight: 800 }}>Threads in Process B:</span>
                {[2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setThreadCount(cnt)}
                    style={{
                      background: threadCount === cnt ? "#2563eb" : "#ffffff",
                      color: threadCount === cnt ? "#ffffff" : "#000000",
                      border: "1.5px solid #000000",
                      borderRadius: 6,
                      padding: "0.25rem 0.6rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    {cnt} Threads
                  </button>
                ))}
              </div>
            </div>

            <svg viewBox="0 0 900 380" style={{ width: "100%", height: "auto" }}>
              {/* ── LEFT: Single-Threaded Process ── */}
              <rect x="30" y="20" width="380" height="340" rx="12" fill="#f8fafc" stroke="#000000" strokeWidth="2.5" />
              <text x="220" y="48" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                Single-Threaded Process
              </text>

              {/* Shared items header bar */}
              <g transform="translate(50, 65)">
                <rect x="0" y="0" width="105" height="42" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                <text x="52" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">code</text>

                <rect x="115" y="0" width="105" height="42" rx="6" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                <text x="167" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">data</text>

                <rect x="230" y="0" width="110" height="42" rx="6" fill="#fefce8" stroke="#ca8a04" strokeWidth="2" />
                <text x="285" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">files</text>
              </g>

              {/* Single Thread Private State */}
              <rect x="90" y="130" width="260" height="180" rx="10" fill="#ffffff" stroke="#000000" strokeWidth="2" />
              <text x="220" y="155" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                Single Thread Execution Unit
              </text>

              {/* Thread private registers & stack */}
              <rect x="110" y="170" width="100" height="40" rx="6" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5" />
              <text x="160" y="195" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">registers</text>

              <rect x="230" y="170" width="100" height="40" rx="6" fill="#fce7f3" stroke="#db2777" strokeWidth="1.5" />
              <text x="280" y="195" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">stack</text>

              {/* Animated thread wavy thread execution line */}
              <path
                d="M 220 230 Q 210 250 220 270 T 220 300"
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <text x="220" y="325" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                Thread #1 (Only 1 instruction stream)
              </text>

              {/* ── RIGHT: Multi-Threaded Process ── */}
              <rect x="470" y="20" width="400" height="340" rx="12" fill="#f8fafc" stroke="#000000" strokeWidth="2.5" />
              <text x="670" y="48" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                Multithreaded Process ({threadCount} Threads)
              </text>

              {/* Shared items header bar */}
              <g transform="translate(490, 65)">
                <rect x="0" y="0" width="115" height="42" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                <text x="57" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">code (shared)</text>

                <rect x="125" y="0" width="115" height="42" rx="6" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                <text x="182" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">data (shared)</text>

                <rect x="250" y="0" width="110" height="42" rx="6" fill="#fefce8" stroke="#ca8a04" strokeWidth="2" />
                <text x="305" y="26" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">files (shared)</text>
              </g>

              {/* Threads list */}
              {Array.from({ length: threadCount }).map((_, i) => {
                const colWidth = 360 / threadCount;
                const startX = 490 + i * colWidth + 5;
                const innerWidth = colWidth - 10;
                const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea"];
                const threadColor = colors[i % colors.length];

                return (
                  <g key={i}>
                    <rect
                      x={startX}
                      y="130"
                      width={innerWidth}
                      height="210"
                      rx="8"
                      fill="#ffffff"
                      stroke={threadColor}
                      strokeWidth="2"
                    />
                    <text x={startX + innerWidth / 2} y="152" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                      Thread T{i + 1}
                    </text>

                    {/* Private registers */}
                    <rect x={startX + 6} y="165" width={innerWidth - 12} height="28" rx="4" fill="#ede9fe" stroke="#000000" strokeWidth="1" />
                    <text x={startX + innerWidth / 2} y="184" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">registers</text>

                    {/* Private stack */}
                    <rect x={startX + 6} y="200" width={innerWidth - 12} height="28" rx="4" fill="#fce7f3" stroke="#000000" strokeWidth="1" />
                    <text x={startX + innerWidth / 2} y="219" textAnchor="middle" fontSize="12" fontWeight="800" fill="#000000" fontFamily="Lexend">stack</text>

                    {/* Thread execution wiggle */}
                    <path
                      d={`M ${startX + innerWidth / 2} 240 Q ${startX + innerWidth / 2 - 8} 265 ${startX + innerWidth / 2} 290 T ${startX + innerWidth / 2} 320`}
                      fill="none"
                      stroke={threadColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* ── Tab 2: 4 Key Benefits ── */}
      {activeTab === "benefits" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
          {[
            {
              num: "01",
              title: "Responsiveness",
              icon: "⚡",
              color: "#2563eb",
              bg: "#eff6ff",
              desc: "Multithreading an interactive application allows a program to continue running even if part of it is blocked or performing a lengthy operation.",
              example: "A web browser: one thread renders images and handles button clicks while another thread downloads data over a slow network."
            },
            {
              num: "02",
              title: "Resource Sharing",
              icon: "🤝",
              color: "#16a34a",
              bg: "#f0fdf4",
              desc: "Processes can only share resources through techniques such as shared memory and message passing (which require explicit programmer orchestration).",
              example: "Threads share the memory and resources of the process by default! Code and Data segments are accessible directly without system calls."
            },
            {
              num: "03",
              title: "Economy",
              icon: "💰",
              color: "#ca8a04",
              bg: "#fefce8",
              desc: "Allocating memory and resources for process creation is costly (Solaris: process creation is 30x slower; context switching is 5x slower than threads).",
              example: "Context switching between threads is vastly faster because memory mappings (page tables) do not need to be flushed from the CPU TLB cache."
            },
            {
              num: "04",
              title: "Scalability (Multicore)",
              icon: "🚀",
              color: "#9333ea",
              bg: "#faf5ff",
              desc: "The benefits of multithreading are dramatically increased in a multiprocessor/multicore architecture where threads can run in parallel on different cores.",
              example: "A single-threaded process can only run on 1 CPU core regardless of how many cores the machine has (e.g. 1 core out of 16)."
            }
          ].map((item) => (
            <div
              key={item.num}
              style={{
                border: "2px solid #000000",
                borderRadius: 12,
                padding: "1.5rem",
                background: item.bg,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                  <span style={{ fontSize: "1.6rem" }}>{item.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 900, background: "#000000", color: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: 6 }}>
                    Benefit #{item.num}
                  </span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
                  {item.desc}
                </p>
              </div>
              <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", fontSize: "14px", color: "#000000" }}>
                <strong>Real-World Example: </strong>{item.example}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 3: Process vs Thread Comparison Table ── */}
      {activeTab === "comparison" && (
        <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
          <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
            PROCESS VS. THREAD ARCHITECTURAL COMPARISON
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Attribute</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Process (Heavyweight)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Thread (Lightweight)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Address Space", "Independent, isolated virtual memory space", "Shared with parent process and sibling threads"],
                ["Creation Cost", "Heavy: copies page tables, file tables, descriptors", "Light: allocates only a stack and register context"],
                ["Context Switch Overhead", "High: flushes CPU TLB, swaps page directories", "Very low: CPU cache remains valid, only registers/stack swap"],
                ["Communication", "Requires explicit IPC (pipes, shared memory, sockets)", "Direct variable reading/writing across shared heap/data"],
                ["Failure Impact", "Isolated: crash in one process does not kill others", "Shared risk: segfault in one thread terminates entire process"],
                ["Scheduling Entity", "Historically the unit of CPU allocation", "Modern OS unit of dispatch and scheduling on CPU cores"]
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: idx < 5 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#000000" }}>{row[0]}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[1]}</td>
                  <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}