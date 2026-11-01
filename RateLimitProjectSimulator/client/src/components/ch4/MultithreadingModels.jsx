import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function MultithreadingModels() {
  const [activeModel, setActiveModel] = useState("oneToOne"); // "manyToOne", "oneToOne", "manyToMany", "twoLevel"
  const [animTime, setAnimTime] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let t = 0;
    const loop = () => {
      t += 0.015;
      setAnimTime(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const MODELS = [
    {
      id: "manyToOne",
      name: "① Many-to-One Model",
      icon: "🔻",
      badge: "User-Level Threading",
      desc: "Maps many user-level threads to a single kernel thread. Thread management is efficient in user space, but an entire process blocks if one thread makes a blocking system call.",
      pros: ["Very fast thread switching (no kernel trap)", "Low memory overhead"],
      cons: ["Entire process blocks if one thread issues blocking I/O", "Cannot run in parallel on multicore CPUs"],
      examples: "Solaris Green Threads, GNU Portable Threads"
    },
    {
      id: "oneToOne",
      name: "② One-to-One Model",
      icon: "↔️",
      badge: "Modern Standard",
      desc: "Maps each user thread to a separate kernel thread. Provides true multicore concurrency and unblocked execution, but creating each user thread requires creating a kernel thread.",
      pros: ["True parallel execution on multicore processors", "One blocking thread does not block others"],
      cons: ["Creating each thread incurs kernel overhead", "Kernel thread limits restrict total thread count"],
      examples: "Linux (NPTL), Windows (Win32), macOS"
    },
    {
      id: "manyToMany",
      name: "③ Many-to-Many Model",
      icon: "🔀",
      badge: "Multiplexed Hybrid",
      desc: "Multiplexes many user-level threads to a smaller or equal number of kernel threads. Developers can create as many user threads as necessary while kernel threads run concurrently on CPUs.",
      pros: ["Best of both worlds: unblocked execution + unlimited user threads", "Optimal kernel thread pool utilization"],
      cons: ["High implementation complexity inside runtime scheduler and OS", "Difficult scheduler activations coordination"],
      examples: "Solaris (prior to version 9), IRIX, Tru64 UNIX"
    },
    {
      id: "twoLevel",
      name: "④ Two-Level Model",
      icon: "⭐",
      badge: "Flexible Binding",
      desc: "A variation of the Many-to-Many model that still multiplexes user threads, but also allows a critical user-level thread to be bound permanently to a dedicated kernel thread.",
      pros: ["Critical real-time threads get dedicated kernel priority", "General tasks stay multiplexed efficiently"],
      cons: ["Most complex runtime scheduling logic", "Rarely needed with modern fast kernel threads"],
      examples: "Solaris 8, HP-UX"
    }
  ];

  const current = MODELS.find((m) => m.id === activeModel);

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Split Layout: Left Selector + Right Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
        {/* Left Column: Model Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
            Select Multithreading Model:
          </div>
          {MODELS.map((m) => {
            const isSelected = activeModel === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModel(m.id)}
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
                  <span style={{ fontSize: "1.1rem" }}>{m.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000", background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>
                    {m.badge}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#000000", marginBottom: "0.2rem" }}>
                  {m.name}
                </div>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.45, margin: 0 }}>
                  {m.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Animated Mapping Visualizer */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
              {current.name} (Mapping Architecture)
            </div>
            <span style={{ fontSize: "14px", fontWeight: 800, padding: "0.25rem 0.75rem", background: "#f8fafc", border: "1.5px solid #000000", borderRadius: 8 }}>
              OS Examples: {current.examples}
            </span>
          </div>

          {/* Animated SVG Diagram */}
          <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
            <svg viewBox="0 0 780 320" style={{ width: "100%", height: "auto" }}>
              <defs>
                <marker id="map-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#000000" />
                </marker>
              </defs>

              {/* Boundary: User Space (Top) vs Kernel Space (Bottom) */}
              <rect x="20" y="20" width="740" height="120" rx="10" fill="#f8fafc" stroke="#000000" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="35" y="45" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">USER SPACE (User Threads)</text>

              <rect x="20" y="180" width="740" height="120" rx="10" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="35" y="205" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">KERNEL SPACE (Kernel Threads &amp; CPU Cores)</text>

              {/* ── MANY-TO-ONE ── */}
              {activeModel === "manyToOne" && (
                <g>
                  {/* 4 User Threads */}
                  {[120, 260, 400, 540].map((x, i) => (
                    <g key={i}>
                      <rect x={x} y="60" width="100" height="45" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                      <text x={x + 50} y="88" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                        User T{i + 1}
                      </text>
                      {/* Connecting line to single kernel thread */}
                      <line x1={x + 50} y1="105" x2="380" y2="225" stroke="#000000" strokeWidth="2" markerEnd="url(#map-arr)" />
                    </g>
                  ))}
                  {/* Single Kernel Thread */}
                  <rect x="310" y="225" width="140" height="50" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5" />
                  <text x="380" y="255" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    Kernel Thread (1)
                  </text>
                </g>
              )}

              {/* ── ONE-TO-ONE ── */}
              {activeModel === "oneToOne" && (
                <g>
                  {[120, 280, 440, 600].map((x, i) => (
                    <g key={i}>
                      <rect x={x} y="60" width="110" height="45" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                      <text x={x + 55} y="88" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                        User T{i + 1}
                      </text>
                      {/* 1:1 straight arrow to matching kernel thread */}
                      <line x1={x + 55} y1="105" x2={x + 55} y2="225" stroke="#16a34a" strokeWidth="2.5" markerEnd="url(#map-arr)" />
                      {/* Kernel Thread */}
                      <rect x={x} y="225" width="110" height="50" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
                      <text x={x + 55} y="255" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                        Kernel T{i + 1}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* ── MANY-TO-MANY ── */}
              {activeModel === "manyToMany" && (
                <g>
                  {/* 5 User Threads */}
                  {[90, 220, 350, 480, 610].map((x, i) => (
                    <g key={i}>
                      <rect x={x} y="60" width="95" height="45" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                      <text x={x + 47} y="88" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                        User T{i + 1}
                      </text>
                    </g>
                  ))}
                  {/* Cross connections to 3 Kernel Threads */}
                  <line x1="137" y1="105" x2="200" y2="225" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="267" y1="105" x2="200" y2="225" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="397" y1="105" x2="390" y2="225" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="527" y1="105" x2="580" y2="225" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="657" y1="105" x2="580" y2="225" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#map-arr)" />

                  {/* 3 Kernel Threads */}
                  {[140, 330, 520].map((x, k) => (
                    <g key={k}>
                      <rect x={x} y="225" width="120" height="50" rx="8" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" />
                      <text x={x + 60} y="255" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                        Kernel T{k + 1}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* ── TWO-LEVEL ── */}
              {activeModel === "twoLevel" && (
                <g>
                  {/* Multiplexed user threads */}
                  {[90, 220, 350, 480].map((x, i) => (
                    <g key={i}>
                      <rect x={x} y="60" width="95" height="45" rx="6" fill="#ffffff" stroke="#000000" strokeWidth="2" />
                      <text x={x + 47} y="88" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                        User T{i + 1}
                      </text>
                    </g>
                  ))}
                  {/* Multiplexed lines */}
                  <line x1="137" y1="105" x2="200" y2="225" stroke="#000000" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="267" y1="105" x2="200" y2="225" stroke="#000000" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="397" y1="105" x2="390" y2="225" stroke="#000000" strokeWidth="2" markerEnd="url(#map-arr)" />
                  <line x1="527" y1="105" x2="390" y2="225" stroke="#000000" strokeWidth="2" markerEnd="url(#map-arr)" />

                  {[140, 330].map((x, k) => (
                    <g key={k}>
                      <rect x={x} y="225" width="120" height="50" rx="8" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2" />
                      <text x={x + 60} y="255" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                        Pool K-Thread {k + 1}
                      </text>
                    </g>
                  ))}

                  {/* Bound Dedicated Thread on right */}
                  <rect x="610" y="60" width="120" height="45" rx="6" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
                  <text x="670" y="88" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    ★ Bound User T5
                  </text>
                  <line x1="670" y1="105" x2="670" y2="225" stroke="#ca8a04" strokeWidth="3" markerEnd="url(#map-arr)" />
                  <rect x="600" y="225" width="140" height="50" rx="8" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5" />
                  <text x="670" y="255" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    ★ Dedicated Kernel T
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Pros vs Cons Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div style={{ background: "#f0fdf4", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                ✓ Advantages (Pros)
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                {current.pros.map((p, i) => (
                  <li key={i}><strong>{p}</strong></li>
                ))}
              </ul>
            </div>

            <div style={{ background: "#fef2f2", border: "2px solid #000000", borderRadius: 10, padding: "1rem" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.5rem" }}>
                ✗ Disadvantages (Cons)
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "14px", lineHeight: 1.6, color: "#000000" }}>
                {current.cons.map((c, i) => (
                  <li key={i}><strong>{c}</strong></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comparison Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
          MULTITHREADING MODELS FEATURE MATRIX
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Model</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Concurrency on Multicore</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Blocking I/O Behavior</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Kernel Overhead</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Dominant Industry Usage</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Many-to-One", "No (1 core only)", "Entire process blocks", "Zero kernel overhead", "Legacy (Solaris Green Threads)"],
              ["One-to-One", "Full hardware parallel", "Independent (others run)", "1 kernel thread per user thread", "Modern Standard (Linux, Windows, macOS)"],
              ["Many-to-Many", "True concurrency", "Non-blocking (pools)", "Low to moderate", "Historic (Solaris < 9, IRIX)"],
              ["Two-Level", "True concurrency + Priority", "Non-blocking", "Moderate", "Specialized real-time OS (Solaris 8)"]
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