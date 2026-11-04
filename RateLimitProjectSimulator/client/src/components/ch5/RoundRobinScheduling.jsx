import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function RoundRobinScheduling() {
  const [quantum, setQuantum] = useState(4); // Default time quantum q = 4
  const [contextSwitchCost, setContextSwitchCost] = useState(0); // 0, 0.5, or 1 ms
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef(null);

  // Standard Silberschatz 4-process dataset
  const PROCESSES = [
    { id: "P1", arrival: 0, burst: 12, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", arrival: 1, burst: 6, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", arrival: 2, burst: 8, color: "#d97706", bg: "#fffbeb" },
    { id: "P4", arrival: 3, burst: 4, color: "#9333ea", bg: "#faf5ff" }
  ];

  // Calculate Round Robin Timeline
  const calculateSchedule = () => {
    const unarrived = [...PROCESSES].sort((a, b) => a.arrival - b.arrival);
    const readyQueue = [];
    const remaining = {};
    const firstResponse = {};
    PROCESSES.forEach((p) => {
      remaining[p.id] = p.burst;
    });

    let currentTime = 0;
    const timeline = [];
    const completed = [];
    let contextSwitches = 0;

    // Safety limit
    let safety = 0;
    while ((completed.length < PROCESSES.length || readyQueue.length > 0) && safety < 500) {
      safety++;

      // Enqueue all newly arrived processes up to currentTime
      while (unarrived.length > 0 && unarrived[0].arrival <= currentTime) {
        readyQueue.push(unarrived.shift());
      }

      if (readyQueue.length === 0) {
        if (unarrived.length > 0) {
          const nextArr = unarrived[0].arrival;
          timeline.push({ procId: "IDLE", start: currentTime, end: nextArr, color: "#e2e8f0", isCs: false });
          currentTime = nextArr;
          continue;
        } else {
          break;
        }
      }

      // Dequeue process from head of circular queue
      const currentProc = readyQueue.shift();

      if (firstResponse[currentProc.id] === undefined) {
        firstResponse[currentProc.id] = currentTime;
      }

      const execTime = Math.min(quantum, remaining[currentProc.id]);
      const start = currentTime;
      const end = start + execTime;

      timeline.push({
        procId: currentProc.id,
        start,
        end,
        color: currentProc.color,
        isCs: false
      });

      currentTime = end;
      remaining[currentProc.id] -= execTime;

      // In the meantime, while currentProc was executing, other processes may have arrived
      while (unarrived.length > 0 && unarrived[0].arrival <= currentTime) {
        readyQueue.push(unarrived.shift());
      }

      if (remaining[currentProc.id] > 0) {
        // Re-enqueue at tail
        readyQueue.push(currentProc);
        contextSwitches++;
        if (contextSwitchCost > 0) {
          timeline.push({
            procId: "CS",
            start: currentTime,
            end: currentTime + contextSwitchCost,
            color: "#64748b",
            isCs: true
          });
          currentTime += contextSwitchCost;
        }
      } else {
        // Process finished
        const ct = currentTime;
        const tat = ct - currentProc.arrival;
        const wt = tat - currentProc.burst;
        const rt = firstResponse[currentProc.id] - currentProc.arrival;
        completed.push({
          ...currentProc,
          completionTime: ct,
          turnaroundTime: tat,
          waitingTime: wt,
          responseTime: rt
        });
        if (readyQueue.length > 0) {
          contextSwitches++;
          if (contextSwitchCost > 0) {
            timeline.push({
              procId: "CS",
              start: currentTime,
              end: currentTime + contextSwitchCost,
              color: "#64748b",
              isCs: true
            });
            currentTime += contextSwitchCost;
          }
        }
      }
    }

    return { timeline, completed, totalDuration: currentTime, contextSwitches };
  };

  const { timeline, completed, totalDuration, contextSwitches } = calculateSchedule();

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const speed = 0.06;
    const tick = () => {
      setPlaybackTime((prev) => {
        if (prev >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return Math.min(totalDuration, prev + speed);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, totalDuration]);

  // Current slice
  const currentSlice = timeline.find((s) => playbackTime >= s.start && playbackTime < s.end) || timeline[timeline.length - 1];

  // Averages
  const avgWait = (completed.reduce((acc, p) => acc + p.waitingTime, 0) / (completed.length || 1)).toFixed(2);
  const avgTat = (completed.reduce((acc, p) => acc + p.turnaroundTime, 0) / (completed.length || 1)).toFixed(2);
  const avgRt = (completed.reduce((acc, p) => acc + p.responseTime, 0) / (completed.length || 1)).toFixed(2);

  // Compute remaining burst of each process at playbackTime
  const getProcessStateAtTime = (p) => {
    if (playbackTime < p.arrival) return { status: "Not Arrived", remaining: p.burst };
    let executed = 0;
    timeline.forEach((slice) => {
      if (slice.procId === p.id && !slice.isCs) {
        if (playbackTime >= slice.end) {
          executed += (slice.end - slice.start);
        } else if (playbackTime > slice.start) {
          executed += (playbackTime - slice.start);
        }
      }
    });
    const rem = Math.max(0, p.burst - executed);
    if (rem <= 0.05) return { status: "Terminated", remaining: 0 };
    if (currentSlice && currentSlice.procId === p.id) return { status: "Running (CPU)", remaining: rem };
    return { status: "Ready Queue", remaining: rem };
  };

  return (
    <div style={{ fontFamily: FONT, background: "#ffffff", color: "#000000", padding: "1.5rem" }}>
      {/* Title & Introduction */}
      <div style={{ marginBottom: "1.5rem", borderBottom: "2px solid #000000", paddingBottom: "1rem" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
          Round-Robin (RR) Scheduling
        </h2>
        <p style={{ fontSize: "14px", margin: 0, color: "#000000", lineHeight: 1.5 }}>
          Designed especially for time-sharing systems. Similar to FCFS scheduling, but <strong>preemption</strong> is added to enable the system to switch between processes. A small unit of time, called a <strong>time quantum</strong> or time slice ($q$), is allocated to each process in a circular ready queue.
        </p>
      </div>

      {/* Control Strip & Interactive Quantum Slider */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1rem",
        marginBottom: "1.5rem"
      }}>
        {/* Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? "#dc2626" : "#16a34a",
              color: "#ffffff",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.45rem 1rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            {isPlaying ? "⏸ Pause" : "▶ Run Simulation"}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setPlaybackTime((t) => Math.max(0, Math.floor(t - 1))); }}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.45rem 0.85rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            ◀ Step
          </button>
          <button
            onClick={() => { setIsPlaying(false); setPlaybackTime((t) => Math.min(totalDuration, Math.floor(t + 1))); }}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.45rem 0.85rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            Step ▶
          </button>
          <button
            onClick={() => { setIsPlaying(false); setPlaybackTime(0); }}
            style={{
              background: "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.45rem 0.85rem",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer"
            }}
          >
            ↻ Reset
          </button>
        </div>

        {/* Time Slider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px", maxWidth: "300px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
            t: {playbackTime.toFixed(1)} / {totalDuration} ms
          </span>
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.1}
            value={playbackTime}
            onChange={(e) => { setIsPlaying(false); setPlaybackTime(parseFloat(e.target.value)); }}
            style={{ flex: 1, cursor: "pointer" }}
          />
        </div>

        {/* Quantum Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#f8fafc", padding: "0.4rem 0.8rem", borderRadius: 8, border: "2px solid #000000" }}>
          <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000" }}>Quantum (q):</span>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {[1, 2, 4, 6, 8, 15].map((q) => (
              <button
                key={q}
                onClick={() => { setQuantum(q); setPlaybackTime(0); setIsPlaying(false); }}
                style={{
                  background: quantum === q ? "#000000" : "#ffffff",
                  color: quantum === q ? "#ffffff" : "#000000",
                  border: "1px solid #000000",
                  borderRadius: 6,
                  padding: "0.25rem 0.55rem",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {q}ms
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quantum Impact Informational Banner */}
      <div style={{
        background: quantum <= 2 ? "#fef2f2" : quantum >= 10 ? "#fffbeb" : "#eff6ff",
        border: "2px solid #000000",
        borderRadius: 10,
        padding: "0.85rem 1.25rem",
        marginBottom: "1.5rem",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "#000000"
      }}>
        {quantum <= 2 && (
          <div>
            <strong>⚠️ Very Small Time Quantum (q = {quantum} ms):</strong> High responsiveness, but causes <strong>{contextSwitches} context switches</strong>! In real hardware, frequent context switching wastes substantial CPU cycles reloading registers and TLB caches.
          </div>
        )}
        {quantum >= 10 && (
          <div>
            <strong>ℹ️ Large Time Quantum (q = {quantum} ms):</strong> When $q$ is large, Round Robin degenerates into <strong>FCFS (First-Come, First-Served)</strong>. Interactive responsiveness degrades and the Convoy Effect can emerge.
          </div>
        )}
        {quantum > 2 && quantum < 10 && (
          <div>
            <strong>✨ Balanced Time Quantum (q = {quantum} ms):</strong> Follows the textbook rule of thumb: ~80% of CPU bursts should complete within a single quantum, yielding swift interactive response without excessive context switch penalties.
          </div>
        )}
      </div>

      {/* ── 3D CIRCULAR QUEUE ARCHITECTURE DIAGRAM ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1rem",
        marginBottom: "1.5rem",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#000000" }}>
            Circular Ready Queue Loop & Dispatcher Architecture
          </h3>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#000000" }}>
            Total Context Switches: {contextSwitches}
          </span>
        </div>

        <svg viewBox="0 0 840 250" style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <marker id="rr-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#000000" />
            </marker>
          </defs>

          {/* Central Loop Path */}
          <path
            d="M 220 70 L 620 70 A 45 45 0 0 1 665 115 L 665 135 A 45 45 0 0 1 620 180 L 220 180 A 45 45 0 0 1 175 135 L 175 115 A 45 45 0 0 1 220 70 Z"
            fill="#f8fafc"
            stroke="#000000"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />

          {/* Flow Direction Arrows on Track */}
          <line x1="380" y1="70" x2="440" y2="70" stroke="#000000" strokeWidth="2.5" markerEnd="url(#rr-arr)" />
          <line x1="665" y1="120" x2="665" y2="135" stroke="#000000" strokeWidth="2.5" markerEnd="url(#rr-arr)" />
          <line x1="460" y1="180" x2="400" y2="180" stroke="#000000" strokeWidth="2.5" markerEnd="url(#rr-arr)" />
          <line x1="175" y1="130" x2="175" y2="115" stroke="#000000" strokeWidth="2.5" markerEnd="url(#rr-arr)" />

          {/* Ready Queue Head & Tail labels */}
          <text x="210" y="55" fontSize="13" fontWeight="900" fill="#16a34a" fontFamily="Lexend">
            Head of Ready Queue (Next Up)
          </text>
          <text x="610" y="202" fontSize="13" fontWeight="900" fill="#dc2626" fontFamily="Lexend" textAnchor="end">
            Tail: Re-enqueued if Remaining &gt; 0
          </text>

          {/* The Central CPU Core Station */}
          <g transform="translate(360, 95)">
            <rect
              x="0"
              y="0"
              width="120"
              height="60"
              rx="8"
              fill={currentSlice && currentSlice.procId !== "IDLE" && !currentSlice.isCs ? currentSlice.color : "#e2e8f0"}
              stroke="#000000"
              strokeWidth="2.5"
            />
            <text x="60" y="26" textAnchor="middle" fontSize="14" fontWeight="900" fill={currentSlice && currentSlice.procId !== "IDLE" && !currentSlice.isCs ? "#ffffff" : "#000000"} fontFamily="Lexend">
              CPU CORE
            </text>
            <text x="60" y="46" textAnchor="middle" fontSize="12" fontWeight="800" fill={currentSlice && currentSlice.procId !== "IDLE" && !currentSlice.isCs ? "#ffffff" : "#000000"} fontFamily="Lexend">
              {currentSlice ? (currentSlice.isCs ? "⚡ Context Switch" : `${currentSlice.procId} (q = ${quantum})`) : "IDLE"}
            </text>
          </g>

          {/* Process Queue Nodes placed along the ring */}
          {PROCESSES.map((p, idx) => {
            const st = getProcessStateAtTime(p);
            const isRun = st.status.includes("Running");
            const isTerm = st.remaining === 0;

            // positions along top or bottom
            const coords = [
              { x: 230, y: 70 },
              { x: 570, y: 70 },
              { x: 570, y: 180 },
              { x: 230, y: 180 }
            ][idx];

            return (
              <g key={p.id} transform={`translate(${coords.x - 30}, ${coords.y - 20})`}>
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="40"
                  rx="6"
                  fill={isTerm ? "#f1f5f9" : isRun ? p.color : "#ffffff"}
                  stroke={isRun ? "#000000" : "#64748b"}
                  strokeWidth={isRun ? "3" : "1.5"}
                />
                <text x="30" y="17" textAnchor="middle" fontSize="13" fontWeight="900" fill={isRun ? "#ffffff" : "#000000"} fontFamily="Lexend">
                  {p.id}
                </text>
                <text x="30" y="32" textAnchor="middle" fontSize="11" fontWeight="800" fill={isRun ? "#ffffff" : isTerm ? "#94a3b8" : "#000000"} fontFamily="Lexend">
                  {st.remaining.toFixed(0)}ms rem
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── LIVE INTERACTIVE GANTT CHART ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#000000" }}>
            Visual Gantt Chart (q = {quantum} ms)
          </h3>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
            Total Slices: {timeline.length}
          </span>
        </div>

        {/* Timeline Bar */}
        <div style={{ position: "relative", width: "100%", height: "55px", display: "flex", border: "2px solid #000000", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }}>
          {timeline.map((slice, idx) => {
            const widthPct = ((slice.end - slice.start) / totalDuration) * 100;
            const isCurrentlyActive = playbackTime >= slice.start && playbackTime < slice.end;
            return (
              <div
                key={idx}
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: slice.procId === "IDLE" ? "#cbd5e1" : slice.procId === "CS" ? "#475569" : slice.color,
                  borderRight: "1px solid #000000",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: slice.procId === "IDLE" ? "#000000" : "#ffffff",
                  fontWeight: 900,
                  fontSize: "13px",
                  position: "relative",
                  boxShadow: isCurrentlyActive ? "inset 0 0 10px rgba(0,0,0,0.5)" : "none"
                }}
              >
                <span>{slice.procId}</span>
                <span style={{ fontSize: "10px", opacity: 0.9 }}>{slice.end - slice.start}ms</span>
              </div>
            );
          })}

          {/* Time Scrubber Head Indicator */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${(playbackTime / (totalDuration || 1)) * 100}%`,
              width: "3px",
              background: "#dc2626",
              boxShadow: "0 0 8px rgba(220,38,38,0.8)",
              zIndex: 10,
              transition: isPlaying ? "none" : "left 0.1s ease"
            }}
          >
            <div style={{
              position: "absolute",
              top: "-8px",
              left: "-5px",
              width: "13px",
              height: "13px",
              background: "#dc2626",
              borderRadius: "50%",
              border: "2px solid #ffffff"
            }} />
          </div>
        </div>

        {/* Time Axis Labels */}
        <div style={{ position: "relative", width: "100%", height: "24px", marginTop: "0.35rem" }}>
          <span style={{ position: "absolute", left: "0%", fontSize: "12px", fontWeight: 800, color: "#000000" }}>0</span>
          {timeline.map((slice, idx) => (
            <span
              key={idx}
              style={{
                position: "absolute",
                left: `${(slice.end / totalDuration) * 100}%`,
                transform: "translateX(-50%)",
                fontSize: "11px",
                fontWeight: 800,
                color: "#000000"
              }}
            >
              {slice.end}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2-COLUMN VIEW: PROCESS STATE & METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left: Process Inspection */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 1rem 0", color: "#000000" }}>
            Process Status (at t = {playbackTime.toFixed(1)} ms)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            {PROCESSES.map((p) => {
              const state = getProcessStateAtTime(p);
              const isRun = state.status.includes("Running");
              return (
                <div
                  key={p.id}
                  style={{
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.75rem",
                    background: isRun ? "#eff6ff" : "#ffffff",
                    boxShadow: isRun ? "0 2px 8px rgba(37,99,235,0.2)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 900, color: p.color, fontSize: "15px" }}>{p.id}</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: 4,
                      background: isRun ? "#2563eb" : state.remaining === 0 ? "#16a34a" : "#f1f5f9",
                      color: isRun || state.remaining === 0 ? "#ffffff" : "#000000"
                    }}>
                      {state.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#000000", marginTop: "0.4rem" }}>
                    Arrival: {p.arrival} ms | Burst: {p.burst} ms
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#000000", marginTop: "0.2rem" }}>
                    Remaining: {state.remaining.toFixed(1)} ms
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #000000", borderRadius: 8, padding: "0.75rem", fontSize: "13px", lineHeight: 1.5 }}>
            🔄 <strong>Round Robin Rule:</strong> Each process gets up to <strong>{quantum} ms</strong> per turn. If unfinished, it is preempted by the timer interrupt and moved to the back of the queue.
          </div>
        </div>

        {/* Right: Metrics Table */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 1rem 0", color: "#000000" }}>
            Performance Metrics
          </h3>

          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000000", background: "#f8fafc" }}>
                  <th style={{ padding: "0.5rem" }}>Process</th>
                  <th style={{ padding: "0.5rem" }}>AT</th>
                  <th style={{ padding: "0.5rem" }}>BT</th>
                  <th style={{ padding: "0.5rem" }}>CT</th>
                  <th style={{ padding: "0.5rem" }}>TAT</th>
                  <th style={{ padding: "0.5rem" }}>WT</th>
                  <th style={{ padding: "0.5rem" }}>RT</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.5rem", fontWeight: 800, color: p.color }}>{p.id}</td>
                    <td style={{ padding: "0.5rem" }}>{p.arrival}</td>
                    <td style={{ padding: "0.5rem" }}>{p.burst}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 800 }}>{p.completionTime}</td>
                    <td style={{ padding: "0.5rem" }}>{p.turnaroundTime}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 800, color: "#16a34a" }}>{p.waitingTime}</td>
                    <td style={{ padding: "0.5rem" }}>{p.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Average KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#f0fdf4", textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#000000" }}>Avg Waiting Time</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#16a34a", marginTop: "0.2rem" }}>{avgWait} ms</div>
            </div>
            <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#eff6ff", textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#000000" }}>Avg Turnaround Time</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#2563eb", marginTop: "0.2rem" }}>{avgTat} ms</div>
            </div>
            <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#faf5ff", textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#000000" }}>Avg Response Time</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#9333ea", marginTop: "0.2rem" }}>{avgRt} ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

