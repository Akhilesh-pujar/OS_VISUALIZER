import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function ThreadOverview() {
  const [activeTab, setActiveTab] = useState("concept");
  const [reqCount, setReqCount] = useState(0);
  const [apacheThreads, setApacheThreads] = useState([]);
  const [nginxQueue, setNginxQueue] = useState([]);
  const [animT, setAnimT] = useState(0);
  const rafRef = useRef(null);

  // Animation loop
  useEffect(() => {
    let t = 0;
    const loop = () => {
      t += 0.012;
      setAnimT(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Auto-generate incoming client requests
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      setReqCount((c) => c + 1);
      // Apache: spawn a new thread for each request (cap at 6)
      setApacheThreads((prev) => {
        const next = [...prev, { id, age: 0 }].slice(-6);
        return next;
      });
      // Nginx: add to event queue (cap at 8)
      setNginxQueue((prev) => {
        const next = [...prev, { id, age: 0 }].slice(-8);
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Age out completed requests
  useEffect(() => {
    const timer = setInterval(() => {
      setApacheThreads((prev) => prev.filter((t) => t.age < 3).map((t) => ({ ...t, age: t.age + 1 })));
      setNginxQueue((prev) => prev.filter((t) => t.age < 2).map((t) => ({ ...t, age: t.age + 1 })));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const lerp = (a, b, f) => a + (b - a) * Math.min(1, Math.max(0, f));

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          { id: "concept", label: "🌐 Apache vs Nginx — Thread-per-Request vs Event Loop" },
          { id: "benefits", label: "⚡ 4 Key Benefits of Multithreading" },
          { id: "comparison", label: "📊 Process vs Thread Deep Comparison" }
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

      {/* ── Tab 1: Apache vs Nginx Real-World Architecture ── */}
      {activeTab === "concept" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ background: "#f8fafc", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: "0 0 0.5rem 0" }}>
              Real-World Threading: Apache HTTP Server vs Nginx
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: 0 }}>
              The difference between single-threaded and multithreaded architecture is best understood through two of the most popular web servers:
              <strong> Apache (thread-per-request)</strong> spawns a dedicated OS thread or process for every incoming client connection.
              <strong> Nginx (event-loop + workers)</strong> uses a small fixed pool of worker processes, each running a non-blocking event loop that can handle thousands of connections concurrently without spawning new threads.
            </p>
          </div>

          {/* Live traffic counter */}
          <div style={{
            display: "flex", justifyContent: "center", gap: "2rem", padding: "0.75rem",
            background: "#eff6ff", border: "2px solid #000000", borderRadius: 10
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: 900 }}>📡 Incoming Client Requests</div>
              <div style={{ fontSize: "16px", fontWeight: 800 }}>Total: {reqCount} | Apache Active Threads: {apacheThreads.length} | Nginx Queued Events: {nginxQueue.length}</div>
            </div>
          </div>

          {/* Side-by-side animated architecture */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            {/* ── LEFT: Apache Thread-per-Request ── */}
            <div style={{ border: "2px solid #000000", borderRadius: 14, overflow: "hidden", background: "#ffffff" }}>
              <div style={{ background: "#fef2f2", color: "#000000", borderBottom: "2px solid #000000", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: 900 }}>🦊 Apache HTTP Server (MPM Worker)</span>
                <span style={{ fontSize: "14px", fontWeight: 800, background: "#ffffff", border: "1px solid #000000", color: "#000000", padding: "0.2rem 0.6rem", borderRadius: 6 }}>Thread-per-Request</span>
              </div>
              <div style={{ padding: "1rem" }}>
                <svg viewBox="0 0 420 380" style={{ width: "100%", height: "auto" }}>
                  <defs>
                    <marker id="ap-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#000000" />
                    </marker>
                  </defs>

                  {/* Clients column */}
                  <text x="45" y="18" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Clients</text>
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = 30 + i * 55;
                    const active = i < apacheThreads.length;
                    return (
                      <g key={i}>
                        <rect x="10" y={y} width="70" height="40" rx="8" fill={active ? "#fef2f2" : "#f8fafc"} stroke={active ? "#dc2626" : "#000000"} strokeWidth={active ? "2.5" : "1.5"} />
                        <text x="45" y={y + 17} textAnchor="middle" fontSize="18" fontFamily="Lexend">{active ? "👤" : "·"}</text>
                        <text x="45" y={y + 33} textAnchor="middle" fontSize="10" fontWeight="800" fill="#000000" fontFamily="Lexend">{active ? `Req #${i + 1}` : "idle"}</text>
                        {/* Arrow to dedicated thread */}
                        {active && (
                          <line x1="80" y1={y + 20} x2="150" y2={y + 20} stroke="#dc2626" strokeWidth="2" markerEnd="url(#ap-arr)" />
                        )}
                      </g>
                    );
                  })}

                  {/* Apache Server Box */}
                  <rect x="150" y="10" width="250" height="360" rx="10" fill="#fff5f5" stroke="#dc2626" strokeWidth="2.5" />
                  <text x="275" y="32" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Apache Server Process</text>

                  {/* Individual threads */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = 42 + i * 52;
                    const active = i < apacheThreads.length;
                    const processing = active && apacheThreads[i]?.age === 0;
                    return (
                      <g key={i}>
                        <rect
                          x="165"
                          y={y}
                          width="220"
                          height="42"
                          rx="6"
                          fill={processing ? "#fecaca" : active ? "#fee2e2" : "#f8fafc"}
                          stroke={active ? "#dc2626" : "#000000"}
                          strokeWidth={processing ? "2.5" : "1.5"}
                          strokeDasharray={active ? "none" : "3 3"}
                        />
                        <text x="185" y={y + 18} fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                          Thread #{i + 1}
                        </text>
                        <text x="185" y={y + 34} fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                          {processing ? "⚡ Processing request..." : active ? "✓ Serving response" : "💤 Sleeping (idle)"}
                        </text>
                        {/* CPU/Memory indicator */}
                        {active && (
                          <rect x="360" y={y + 8} width="18" height="18" rx="3" fill={processing ? "#dc2626" : "#fca5a5"} stroke="#000000" strokeWidth="1" />
                        )}
                      </g>
                    );
                  })}
                </svg>

                <div style={{ background: "#fef2f2", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#000000", marginBottom: "0.3rem" }}>⚠️ Problem: Thread Explosion Under Load</div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.5 }}>
                    Each client request spawns a dedicated OS thread with its own stack (~1-8 MB of RAM). 10,000 concurrent connections = 10,000 threads = massive memory usage and context-switch overhead. This is why Apache struggles under C10K loads.
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Nginx Event-Loop + Workers ── */}
            <div style={{ border: "2px solid #000000", borderRadius: 14, overflow: "hidden", background: "#ffffff" }}>
              <div style={{ background: "#f0fdf4", color: "#000000", borderBottom: "2px solid #000000", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "16px", fontWeight: 900 }}>⚡ Nginx (Event-Driven Architecture)</span>
                <span style={{ fontSize: "14px", fontWeight: 800, background: "#ffffff", border: "1px solid #000000", color: "#000000", padding: "0.2rem 0.6rem", borderRadius: 6 }}>Non-Blocking Event Loop</span>
              </div>
              <div style={{ padding: "1rem" }}>
                <svg viewBox="0 0 420 380" style={{ width: "100%", height: "auto" }}>
                  {/* Clients column */}
                  <text x="45" y="18" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Clients</text>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                    const y = 26 + i * 43;
                    const active = i < nginxQueue.length;
                    return (
                      <g key={i}>
                        <rect x="10" y={y} width="60" height="32" rx="6" fill={active ? "#f0fdf4" : "#f8fafc"} stroke={active ? "#16a34a" : "#000000"} strokeWidth={active ? "2" : "1"} />
                        <text x="40" y={y + 14} textAnchor="middle" fontSize="14" fontFamily="Lexend">{active ? "👤" : "·"}</text>
                        <text x="40" y={y + 27} textAnchor="middle" fontSize="9" fontWeight="800" fill="#000000" fontFamily="Lexend">{active ? `#${i + 1}` : ""}</text>
                      </g>
                    );
                  })}

                  {/* All requests funnel into single event queue */}
                  <path d="M 70 50 L 120 165 M 70 100 L 120 165 M 70 150 L 120 165 M 70 200 L 120 185 M 70 250 L 120 185 M 70 300 L 120 185 M 70 340 L 120 185" stroke="#16a34a" strokeWidth="1.5" />

                  {/* Nginx Master Process Box */}
                  <rect x="110" y="10" width="300" height="360" rx="10" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
                  <text x="260" y="32" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Nginx Master Process (PID 1)</text>

                  {/* Event Queue */}
                  <rect x="130" y="42" width="260" height="38" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                  <text x="260" y="60" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    epoll / kqueue Event Queue
                  </text>
                  <text x="260" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#000000" fontFamily="Lexend">
                    {nginxQueue.length} events pending | Non-blocking I/O multiplexing
                  </text>

                  {/* Worker processes (fixed count) */}
                  {[0, 1, 2, 3].map((w) => {
                    const y = 90 + w * 68;
                    const eventsPerWorker = Math.ceil(nginxQueue.length / 4);
                    const workerEvents = Math.min(eventsPerWorker, nginxQueue.length - w * eventsPerWorker);
                    const busy = workerEvents > 0;
                    return (
                      <g key={w}>
                        <rect
                          x="130"
                          y={y}
                          width="260"
                          height="58"
                          rx="8"
                          fill={busy ? "#bbf7d0" : "#f0fdf4"}
                          stroke="#16a34a"
                          strokeWidth="2"
                        />
                        <text x="148" y={y + 18} fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                          Worker Process #{w + 1}
                        </text>
                        <text x="148" y={y + 34} fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                          {busy ? `⚡ Event loop processing ${Math.max(0, workerEvents)} connection(s)` : "🔄 Idle — waiting on epoll_wait()"}
                        </text>
                        <text x="148" y={y + 50} fontSize="11" fontWeight="700" fill="#000000" fontFamily="Lexend">
                          Single thread → handles 10,000+ connections via non-blocking I/O
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div style={{ background: "#f0fdf4", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", marginTop: "0.5rem" }}>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#000000", marginBottom: "0.3rem" }}>✓ Solution: Event-Driven Non-Blocking Architecture</div>
                  <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.5 }}>
                    Nginx uses a fixed number of worker processes (typically = CPU cores). Each worker runs a single-threaded event loop using epoll/kqueue that handles thousands of concurrent connections without creating new threads. This is why Nginx can handle 100K+ concurrent connections with minimal memory.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
              APACHE VS NGINX ARCHITECTURE COMPARISON
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000000" }}>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Attribute</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>🦊 Apache (Thread-per-Request)</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>⚡ Nginx (Event Loop)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Threading Model", "One OS thread per client connection", "Fixed worker pool with async event loop"],
                  ["Memory per 10K connections", "~10-80 GB (1-8 MB stack per thread)", "~2.5 MB (shared event buffer)"],
                  ["Context Switch Cost", "High (10K threads competing for CPU)", "Near zero (single thread per worker)"],
                  ["Blocking I/O", "Blocks only the assigned thread", "Never blocks — uses non-blocking syscalls"],
                  ["Concurrency Limit", "Hundreds to low thousands", "100,000+ connections per worker"],
                  ["Best For", "Dynamic content (PHP mod_php)", "Static content, reverse proxy, load balancing"]
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < 5 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 900 }}>{row[0]}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{row[1]}</td>
                    <td style={{ padding: "0.75rem 1rem" }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Benefits ── */}
      {activeTab === "benefits" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
          {[
            { num: "01", title: "Responsiveness", icon: "⚡", color: "#2563eb", bg: "#eff6ff", desc: "Multithreading allows a program to continue running even if part of it is blocked. Example: Nginx's event loop keeps serving other requests even when one connection is waiting for a slow database query.", example: "Web Browser: one thread renders UI while another downloads images over the network. Without threads, the UI would freeze on every network request." },
            { num: "02", title: "Resource Sharing", icon: "🤝", color: "#16a34a", bg: "#f0fdf4", desc: "Threads share code, data, and files by default — no IPC overhead! Apache worker threads all share the same loaded modules and configuration in memory.", example: "Nginx workers share the same configuration, SSL certificates, and cached content in shared memory without needing pipes or sockets between them." },
            { num: "03", title: "Economy", icon: "💰", color: "#ca8a04", bg: "#fefce8", desc: "Thread creation is 10-30x faster than process creation. Context switching between threads is 5x cheaper because page tables and TLB cache stay valid.", example: "Apache (MPM Worker) spawning a thread per request is still faster than Apache (Prefork) spawning a process per request — that's why MPM Worker replaced Prefork." },
            { num: "04", title: "Scalability (Multicore)", icon: "🚀", color: "#9333ea", bg: "#faf5ff", desc: "Threads run in parallel on multiple CPU cores. Nginx runs one worker per CPU core to utilize all available hardware.", example: "A 16-core server running Nginx with 16 workers can process 16 requests truly simultaneously. Apache with 16 threads can do the same, but needs 1000 threads for 1000 concurrent users." }
          ].map((item) => (
            <div key={item.num} style={{ border: "2px solid #000000", borderRadius: 12, padding: "1.5rem", background: item.bg, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                  <span style={{ fontSize: "1.6rem" }}>{item.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 900, background: "#f1f5f9", color: "#000000", border: "1.5px solid #000000", padding: "0.2rem 0.6rem", borderRadius: 6 }}>Benefit #{item.num}</span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: "0 0 0.5rem 0" }}>{item.title}</h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: "0 0 1rem 0" }}>{item.desc}</p>
              </div>
              <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", fontSize: "14px", color: "#000000" }}>
                <strong>Real-World Example: </strong>{item.example}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 3: Process vs Thread Table ── */}
      {activeTab === "comparison" && (
        <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
          <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
            PROCESS VS. THREAD ARCHITECTURAL COMPARISON
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #000000" }}>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Attribute</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Process (Apache Prefork = 1 process/request)</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Thread (Apache MPM Worker = 1 thread/request)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Address Space", "Independent: each Apache child has its own virtual memory (mod_php runs isolated)", "Shared: all Apache worker threads share the same loaded modules, config, and heap"],
                ["Creation Cost", "Heavy (~10ms): copies page tables, file descriptors, signal handlers", "Light (~0.1ms): allocates only a new stack and register context within existing process"],
                ["Context Switch", "High: flushes CPU TLB cache, swaps CR3 page directory register", "Low: TLB stays valid, only swaps stack pointer (SP) and register file"],
                ["Communication", "Requires IPC: pipes, shared memory (scoreboard), sockets", "Direct memory access: threads read/write shared heap variables directly"],
                ["Failure Isolation", "Safe: Apache Prefork child crash does not kill other children", "Risky: one thread segfault in MPM Worker kills the entire worker process"],
                ["Concurrency Limit", "Low: each process = ~30 MB overhead × 1000 = 30 GB RAM", "Medium: each thread = ~1 MB stack × 1000 = 1 GB RAM"]
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: idx < 5 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 900 }}>{row[0]}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{row[1]}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
