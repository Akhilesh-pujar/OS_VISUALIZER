import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function IPCMechanismsViz() {
  const [activeChannel, setActiveChannel] = useState("all"); // "all", "shm", "msg", "pipe", "buffer", "socket"
  const [mode, setMode] = useState("single"); // "idle", "single", "high"
  const [t, setT] = useState(0);
  const [bufferItems, setBufferItems] = useState(["Payload A", "Payload B"]);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  // Animation frame loop for packet movement
  useEffect(() => {
    if (mode === "idle") {
      setT(0);
      return;
    }
    const step = mode === "single" ? 0.008 : 0.024;
    const loop = () => {
      tRef.current += step;
      setT(tRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mode]);

  const lerp = (a, b, f) => a + (b - a) * Math.min(1, Math.max(0, f));
  const smPos = t % 1;
  const mpPos = (t + 0.38) % 1;
  const ppPos = (t + 0.72) % 1;

  const handleProduce = () => {
    if (bufferItems.length < 5) {
      setBufferItems([...bufferItems, `Payload #${bufferItems.length + 1}`]);
    }
  };

  const handleConsume = () => {
    if (bufferItems.length > 0) {
      setBufferItems(bufferItems.slice(1));
    }
  };

  const CHANNELS = [
    {
      id: "all",
      name: "All 3 IPC Channels (Unified View)",
      icon: "⚡",
      badge: "Full System View",
      desc: "Simultaneous animated data flow across Shared Memory, Message Passing, and Anonymous FIFO Pipes."
    },
    {
      id: "shm",
      name: "① Shared Memory Architecture",
      icon: "🧠",
      badge: "~100 ns (Zero-Copy)",
      desc: "Direct RAM access via mapped pages (shmget/shmat). Maximum throughput (10+ GB/s) bypassing the kernel."
    },
    {
      id: "msg",
      name: "② Message Passing Architecture",
      icon: "📨",
      badge: "1–5 µs (Mailboxes)",
      desc: "Structured discrete packets copied via kernel mailboxes (send/receive). Safe across distributed network nodes."
    },
    {
      id: "pipe",
      name: "③ Anonymous Pipe (FIFO)",
      icon: "🚰",
      badge: "~500 ns (Kernel Buffer)",
      desc: "Unidirectional byte stream (64KB buffer). Used heavily in terminal command pipelines (ls | grep)."
    },
    {
      id: "buffer",
      name: "④ Bounded Buffer Producer-Consumer",
      icon: "📦",
      badge: "Capacity Constraint",
      desc: "Interactive 5-slot circular buffer simulating producer blocking on full buffer and consumer blocking on empty."
    },
    {
      id: "socket",
      name: "⑤ Network Sockets (Cross-Machine)",
      icon: "🌐",
      badge: "5–50 µs (Distributed)",
      desc: "Endpoint defined by IP Address + Port number. Used for client-server HTTP, RPC, and microservices."
    }
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Mode Control Buttons ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <span style={{ fontSize: "14px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", color: "#000000" }}>
          ANIMATE:
        </span>
        <button
          onClick={() => setMode("idle")}
          style={{
            background: mode === "idle" ? "#000000" : "#ffffff",
            color: mode === "idle" ? "#ffffff" : "#000000",
            border: "2px solid #000000",
            borderRadius: 8,
            padding: "0.45rem 1.1rem",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          👁 Overview
        </button>
        <button
          onClick={() => setMode("single")}
          style={{
            background: mode === "single" ? "#2563eb" : "#ffffff",
            color: mode === "single" ? "#ffffff" : "#000000",
            border: "2px solid #000000",
            borderRadius: 8,
            padding: "0.45rem 1.1rem",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          ⚡ Step-by-Step
        </button>
        <button
          onClick={() => setMode("high")}
          style={{
            background: mode === "high" ? "#dc2626" : "#ffffff",
            color: mode === "high" ? "#ffffff" : "#000000",
            border: "2px solid #000000",
            borderRadius: 8,
            padding: "0.45rem 1.1rem",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}
        >
          🔥 High Load
        </button>
      </div>

      {/* ── Status Banner (Matches Image Exactly) ── */}
      <div style={{
        padding: "0.75rem 1.25rem",
        background: "#f5f3ff",
        border: "2px solid #000000",
        borderRadius: 10,
        fontSize: "14px",
        fontWeight: 800,
        color: "#000000",
        marginBottom: "1.5rem"
      }}>
        {mode === "idle"
          ? "— Overview mode active: Select a channel on the left to inspect or switch to Step-by-Step animation"
          : "— All 3 IPC channels active — watch data packets flow A ➔ B in real time"}
      </div>

      {/* ── Split Layout: Left Selector + Right Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "stretch", marginBottom: "2rem" }}>
        {/* Left Column: Channels List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
            Select IPC Mechanism:
          </div>
          {CHANNELS.map((ch) => {
            const isSelected = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                style={{
                  background: isSelected ? "#eff6ff" : "#ffffff",
                  border: `2px solid #000000`,
                  borderRadius: 10,
                  padding: "0.9rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: isSelected ? "0 6px 16px rgba(0,0,0,0.12)" : "none",
                  borderLeft: isSelected ? "6px solid #2563eb" : "2px solid #000000",
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "1.1rem" }}>{ch.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000", background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>
                    {ch.badge}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#000000", marginBottom: "0.2rem" }}>
                  {ch.name}
                </div>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.45, margin: 0 }}>
                  {ch.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: 3D/Interactive Visualizer */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>
              INTERPROCESS COMMUNICATION — {activeChannel === "all" ? "ALL 3 MECHANISMS" : activeChannel.toUpperCase()}
            </div>

            {/* 3D Container with SVG Flow Diagram */}
            {activeChannel !== "buffer" ? (
              <div style={{
                border: "2px solid #000000",
                borderRadius: 12,
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                padding: "0.75rem",
                overflow: "hidden",
                perspective: "1000px"
              }}>
                <svg
                  viewBox="0 0 820 400"
                  style={{
                    width: "100%",
                    height: "auto",
                    transform: "perspective(800px) rotateX(2deg)",
                    transformOrigin: "center"
                  }}
                >
                  <defs>
                    <marker id="ipc-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#000000" />
                    </marker>
                  </defs>

                  {/* Process A (Producer) */}
                  <rect
                    x="20"
                    y="30"
                    width="120"
                    height="330"
                    rx="10"
                    fill="#eff6ff"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                  <text x="80" y="65" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    Process A
                  </text>
                  <text x="80" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000" fontFamily="Lexend">
                    (Producer)
                  </text>

                  {/* Process B (Consumer) */}
                  <rect
                    x="680"
                    y="30"
                    width="120"
                    height="330"
                    rx="10"
                    fill="#f0fdf4"
                    stroke="#16a34a"
                    strokeWidth="3"
                  />
                  <text x="740" y="65" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    Process B
                  </text>
                  <text x="740" y="86" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000" fontFamily="Lexend">
                    (Consumer)
                  </text>

                  {/* ──────────────── CHANNEL 1: SHARED MEMORY ──────────────── */}
                  <g opacity={activeChannel === "all" || activeChannel === "shm" ? 1 : 0.25}>
                    <text x="410" y="105" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                      ① Shared Memory
                    </text>
                    <rect
                      x="220"
                      y="112"
                      width="380"
                      height="46"
                      rx="8"
                      fill="#e0f2fe"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                    />
                    <text x="410" y="132" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                      Kernel-Mapped Shared Region
                    </text>
                    <text x="410" y="149" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000" fontFamily="Lexend">
                      shmget() shmat() — ~100 ns — zero-copy
                    </text>

                    {/* Connecting arrows */}
                    <path d="M 140 135 L 220 135" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ipc-arr)" />
                    <path d="M 600 135 L 680 135" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ipc-arr)" />
                    <text x="180" y="125" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">write()</text>
                    <text x="640" y="125" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">read()</text>

                    {/* Animated moving circle token */}
                    {mode !== "idle" && (
                      <circle
                        cx={lerp(140, 680, smPos)}
                        cy="135"
                        r="10"
                        fill="#2563eb"
                        stroke="#000000"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>

                  {/* ──────────────── CHANNEL 2: MESSAGE PASSING ──────────────── */}
                  <g opacity={activeChannel === "all" || activeChannel === "msg" ? 1 : 0.25}>
                    <text x="410" y="210" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                      ② Message Passing
                    </text>
                    <rect
                      x="290"
                      y="218"
                      width="240"
                      height="46"
                      rx="8"
                      fill="#dcfce7"
                      stroke="#16a34a"
                      strokeWidth="2.5"
                    />
                    <text x="410" y="238" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                      Mailbox / Message Queue
                    </text>
                    <text x="410" y="255" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000" fontFamily="Lexend">
                      send() receive() — ~1–5 µs
                    </text>

                    {/* Connecting arrows */}
                    <path d="M 140 241 L 290 241" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ipc-arr)" />
                    <path d="M 530 241 L 680 241" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ipc-arr)" />
                    <text x="215" y="232" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">send(msg)</text>
                    <text x="605" y="232" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">receive(msg)</text>

                    {/* Animated moving rect packet */}
                    {mode !== "idle" && (
                      <rect
                        x={lerp(140, 680, mpPos) - 14}
                        y="233"
                        width="28"
                        height="16"
                        rx="4"
                        fill="#16a34a"
                        stroke="#000000"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>

                  {/* ──────────────── CHANNEL 3: ANONYMOUS PIPE ──────────────── */}
                  <g opacity={activeChannel === "all" || activeChannel === "pipe" ? 1 : 0.25}>
                    <text x="410" y="315" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                      ③ Anonymous Pipe (FIFO)
                    </text>
                    <rect
                      x="240"
                      y="323"
                      width="340"
                      height="44"
                      rx="8"
                      fill="#fef9c3"
                      stroke="#ca8a04"
                      strokeWidth="2.5"
                    />
                    <text x="410" y="342" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                      Kernel FIFO Buffer (64 KB default)
                    </text>
                    <text x="410" y="359" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000" fontFamily="Lexend">
                      pipe() write(fd[1]) ➔ read(fd[0]) — ~500 ns
                    </text>

                    {/* Connecting arrows */}
                    <path d="M 140 345 L 240 345" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ipc-arr)" />
                    <path d="M 580 345 L 680 345" stroke="#000000" strokeWidth="2" fill="none" markerEnd="url(#ipc-arr)" />
                    <text x="190" y="336" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">write()</text>
                    <text x="630" y="336" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">read()</text>

                    {/* Animated moving triangle token */}
                    {mode !== "idle" && (
                      <polygon
                        points={`${lerp(140, 680, ppPos)},337 ${lerp(140, 680, ppPos) - 10},352 ${lerp(140, 680, ppPos) + 10},352`}
                        fill="#eab308"
                        stroke="#000000"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>

                  {/* OS Kernel footer text */}
                  <rect x="220" y="380" width="380" height="18" fill="#f1f5f9" rx="4" />
                  <text x="410" y="393" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    All IPC mechanisms are managed by the OS Kernel
                  </text>
                </svg>
              </div>
            ) : (
              /* Interactive Bounded Buffer View */
              <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 900, color: "#000000", margin: 0 }}>
                      Bounded Buffer Simulation (5 Slots)
                    </h3>
                    <p style={{ fontSize: "14px", color: "#000000", margin: "0.2rem 0 0 0" }}>
                      Shared queue between Producer and Consumer.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={handleProduce}
                      disabled={bufferItems.length >= 5}
                      style={{
                        background: bufferItems.length >= 5 ? "#e2e8f0" : "#2563eb",
                        color: bufferItems.length >= 5 ? "#94a3b8" : "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 8,
                        padding: "0.45rem 0.9rem",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: bufferItems.length >= 5 ? "not-allowed" : "pointer"
                      }}
                    >
                      ➕ Produce ({bufferItems.length}/5)
                    </button>
                    <button
                      onClick={handleConsume}
                      disabled={bufferItems.length === 0}
                      style={{
                        background: bufferItems.length === 0 ? "#e2e8f0" : "#16a34a",
                        color: bufferItems.length === 0 ? "#94a3b8" : "#ffffff",
                        border: "2px solid #000000",
                        borderRadius: 8,
                        padding: "0.45rem 0.9rem",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: bufferItems.length === 0 ? "not-allowed" : "pointer"
                      }}
                    >
                      ➖ Consume
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const item = bufferItems[idx];
                    return (
                      <div
                        key={idx}
                        style={{
                          height: "80px",
                          borderRadius: 10,
                          border: `2px ${item ? "solid #000000" : "dashed #000000"}`,
                          background: item ? "#eff6ff" : "#f8fafc",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>Slot #{idx}</span>
                        <span style={{ fontSize: "14px", fontWeight: 900, color: item ? "#1d4ed8" : "#000000", marginTop: "0.2rem" }}>
                          {item || "EMPTY"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── IPC Mechanism Comparison Table (Matches Image Exactly) ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          IPC MECHANISM COMPARISON
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Mechanism</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Latency</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Throughput</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Sync Needed?</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Real-world Use</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Shared Memory", "~100 ns", "10+ GB/s", "Yes (mutex/sem)", "Redis, video frames"],
              ["Message Passing", "1–5 µs", "~200 MB/s", "No", "Android Binder, Mach ports"],
              ["Pipe (anon)", "~500 ns", "~1 GB/s", "Partial", "Shell pipelines (ls | grep)"],
              ["Socket", "5–50 µs", "Varies", "No", "HTTP, microservices"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 3 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#000000" }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[1]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[2]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[3]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}>{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
