import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function MultilevelQueueScheduling() {
  const [activeModel, setActiveModel] = useState("mlfq"); // "mlq" (Fixed) or "mlfq" (Feedback)
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableAging, setEnableAging] = useState(true);
  const rafRef = useRef(null);

  // Processes with varied characteristics:
  // P1: Short Interactive job (burst 5) -> completes in Q0
  // P2: Medium job (burst 14) -> moves from Q0 to Q1 and completes in Q1
  // P3: Heavy CPU-bound batch job (burst 32) -> demoted all the way to Q2 (FCFS)
  // P4: Late arriving interactive job (arrival 12, burst 4) -> preempts lower queues!
  const PROCESSES = [
    { id: "P1", name: "Text Editor (Interactive)", arrival: 0, burst: 5, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", name: "Web Browser Render (Medium)", arrival: 1, burst: 14, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", name: "Video Encoder (Batch/Heavy)", arrival: 2, burst: 30, color: "#d97706", bg: "#fffbeb" },
    { id: "P4", name: "Mouse Click Handler (Urgent)", arrival: 10, burst: 4, color: "#9333ea", bg: "#faf5ff" }
  ];

  // Simulation calculation for MLFQ
  const calculateMLFQ = () => {
    // Q0: RR q=8
    // Q1: RR q=16
    // Q2: FCFS
    const q0 = [];
    const q1 = [];
    const q2 = [];
    const unarrived = [...PROCESSES].sort((a, b) => a.arrival - b.arrival);
    const remaining = {};
    const queueLevel = {}; // current queue of process
    const waitInQueue = {};
    const firstResponse = {};

    PROCESSES.forEach((p) => {
      remaining[p.id] = p.burst;
      queueLevel[p.id] = 0;
      waitInQueue[p.id] = 0;
    });

    let currentTime = 0;
    const timeline = [];
    const completed = [];
    const events = [];

    const totalBurst = PROCESSES.reduce((acc, p) => acc + p.burst, 0);
    const maxLimit = totalBurst + 40;

    while (completed.length < PROCESSES.length && currentTime < maxLimit) {
      // Arriving processes enter Q0
      while (unarrived.length > 0 && unarrived[0].arrival <= currentTime) {
        const arr = unarrived.shift();
        q0.push(arr.id);
        queueLevel[arr.id] = 0;
        events.push({ time: currentTime, text: `${arr.id} entered top priority Queue Q0 (RR q=8)` });
      }

      // Check Aging: promote if waited >= 25ms in Q2 or Q1
      if (enableAging) {
        for (let i = q2.length - 1; i >= 0; i--) {
          const pid = q2[i];
          if (waitInQueue[pid] >= 24) {
            q2.splice(i, 1);
            q1.push(pid);
            queueLevel[pid] = 1;
            waitInQueue[pid] = 0;
            events.push({ time: currentTime, text: `🛡️ AGING PROMOTION: ${pid} promoted from Q2 to Q1` });
          }
        }
        for (let i = q1.length - 1; i >= 0; i--) {
          const pid = q1[i];
          if (waitInQueue[pid] >= 24) {
            q1.splice(i, 1);
            q0.push(pid);
            queueLevel[pid] = 0;
            waitInQueue[pid] = 0;
            events.push({ time: currentTime, text: `🛡️ AGING PROMOTION: ${pid} promoted from Q1 to Q0` });
          }
        }
      }

      // Select highest priority non-empty queue
      let activePid = null;
      let quantum = 0;
      let activeQueueName = "";

      if (q0.length > 0) {
        activePid = q0.shift();
        quantum = 8;
        activeQueueName = "Q0 (RR q=8)";
      } else if (q1.length > 0) {
        activePid = q1.shift();
        quantum = 16;
        activeQueueName = "Q1 (RR q=16)";
      } else if (q2.length > 0) {
        activePid = q2.shift();
        quantum = remaining[activePid]; // FCFS runs to completion or until preempted
        activeQueueName = "Q2 (FCFS)";
      }

      if (!activePid) {
        if (unarrived.length > 0) {
          const nextArr = unarrived[0].arrival;
          timeline.push({ procId: "IDLE", queue: "NONE", start: currentTime, end: nextArr, color: "#e2e8f0" });
          currentTime = nextArr;
          continue;
        } else {
          break;
        }
      }

      if (firstResponse[activePid] === undefined) {
        firstResponse[activePid] = currentTime;
      }

      // We run for min(quantum, remaining, or until a higher priority process arrives)
      // Check if any process arrives before quantum finishes
      let sliceTime = Math.min(quantum, remaining[activePid]);
      let wasPreemptedEarly = false;

      // In Q1 or Q2, if an arrival happens into Q0 earlier, preempt!
      if (activeQueueName.startsWith("Q1") || activeQueueName.startsWith("Q2")) {
        const nextArr = unarrived.find((p) => p.arrival > currentTime && p.arrival < currentTime + sliceTime);
        if (nextArr) {
          sliceTime = nextArr.arrival - currentTime;
          wasPreemptedEarly = true;
        }
      }

      const procObj = PROCESSES.find((p) => p.id === activePid);
      const start = currentTime;
      const end = start + sliceTime;

      timeline.push({
        procId: activePid,
        queue: activeQueueName,
        start,
        end,
        color: procObj.color
      });

      currentTime = end;
      remaining[activePid] -= sliceTime;

      // Update wait times for other queued processes
      [...q0, ...q1, ...q2].forEach((id) => {
        waitInQueue[id] = (waitInQueue[id] || 0) + sliceTime;
      });

      // Enqueue any new arrivals during execution
      while (unarrived.length > 0 && unarrived[0].arrival <= currentTime) {
        const arr = unarrived.shift();
        q0.push(arr.id);
        queueLevel[arr.id] = 0;
        events.push({ time: currentTime, text: `${arr.id} arrived and placed in Q0` });
      }

      // Re-queue or complete
      if (remaining[activePid] === 0) {
        const ct = currentTime;
        const tat = ct - procObj.arrival;
        const wt = tat - procObj.burst;
        completed.push({
          ...procObj,
          completionTime: ct,
          turnaroundTime: tat,
          waitingTime: wt,
          responseTime: firstResponse[activePid] - procObj.arrival
        });
        events.push({ time: currentTime, text: `🎉 ${activePid} finished execution and terminated!` });
      } else {
        // Demotion logic
        if (activeQueueName.startsWith("Q0")) {
          q1.push(activePid);
          queueLevel[activePid] = 1;
          waitInQueue[activePid] = 0;
          events.push({ time: currentTime, text: `⬇️ DEMOTION: ${activePid} exceeded 8ms quantum; demoted to Q1 (q=16)` });
        } else if (activeQueueName.startsWith("Q1")) {
          if (wasPreemptedEarly) {
            // Put back in Q1
            q1.unshift(activePid);
          } else {
            q2.push(activePid);
            queueLevel[activePid] = 2;
            waitInQueue[activePid] = 0;
            events.push({ time: currentTime, text: `⬇️ DEMOTION: ${activePid} exceeded 16ms quantum; demoted to Q2 (FCFS)` });
          }
        } else {
          // In Q2
          q2.unshift(activePid);
        }
      }
    }

    return { timeline, completed, totalDuration: currentTime, events };
  };

  const { timeline, completed, totalDuration, events } = calculateMLFQ();

  // Playback timer
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const speed = 0.08;
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

  const currentSlice = timeline.find((s) => playbackTime >= s.start && playbackTime < s.end) || timeline[timeline.length - 1];

  const avgWait = (completed.reduce((acc, p) => acc + p.waitingTime, 0) / (completed.length || 1)).toFixed(2);
  const avgTat = (completed.reduce((acc, p) => acc + p.turnaroundTime, 0) / (completed.length || 1)).toFixed(2);

  return (
    <div style={{ fontFamily: FONT, background: "#ffffff", color: "#000000", padding: "1.5rem" }}>
      {/* Title & Introduction */}
      <div style={{ marginBottom: "1.5rem", borderBottom: "2px solid #000000", paddingBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              Multilevel Queue & Multilevel Feedback Queue (MLFQ) Scheduling
            </h2>
            <p style={{ fontSize: "14px", margin: 0, color: "#000000", lineHeight: 1.5 }}>
              Partitions the ready queue into multiple discrete queues based on process characteristics. In <strong>MLFQ</strong>, processes are allowed to dynamically move between queues according to their CPU burst behavior and waiting time.
            </p>
          </div>
          {/* Model Switcher */}
          <div style={{ display: "flex", gap: "0.5rem", background: "#f8fafc", padding: "0.3rem", borderRadius: 8, border: "2px solid #000000" }}>
            <button
              onClick={() => setActiveModel("mlfq")}
              style={{
                background: activeModel === "mlfq" ? "#000000" : "#ffffff",
                color: activeModel === "mlfq" ? "#ffffff" : "#000000",
                border: "1px solid #000000",
                borderRadius: 6,
                padding: "0.4rem 0.85rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Multilevel Feedback Queue (MLFQ)
            </button>
            <button
              onClick={() => setActiveModel("mlq")}
              style={{
                background: activeModel === "mlq" ? "#000000" : "#ffffff",
                color: activeModel === "mlq" ? "#ffffff" : "#000000",
                border: "1px solid #000000",
                borderRadius: 6,
                padding: "0.4rem 0.85rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Fixed Multilevel Queue (MLQ)
            </button>
          </div>
        </div>
      </div>

      {/* Control Strip & Aging Toggle */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px", maxWidth: "320px" }}>
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

        {/* Aging Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: enableAging ? "#dcfce7" : "#f8fafc", padding: "0.4rem 0.8rem", borderRadius: 8, border: "2px solid #000000" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "14px", fontWeight: 900 }}>
            <input
              type="checkbox"
              checked={enableAging}
              onChange={(e) => { setEnableAging(e.target.checked); setPlaybackTime(0); setIsPlaying(false); }}
              style={{ cursor: "pointer", width: 16, height: 16 }}
            />
            <span>🛡️ Dynamic Aging (Promote Starved Processes)</span>
          </label>
        </div>
      </div>

      {/* ── 3-TIER MULTILEVEL QUEUE ARCHITECTURE DIAGRAM ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#000000" }}>
            {activeModel === "mlfq" ? "3-Tier Multilevel Feedback Queue (Silberschatz Model)" : "Fixed Multilevel Queues (Static Separation)"}
          </h3>
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#000000" }}>
            Active Slice: {currentSlice ? `${currentSlice.procId} on ${currentSlice.queue}` : "IDLE"}
          </span>
        </div>

        <svg viewBox="0 0 840 280" style={{ width: "100%", height: "auto", display: "block" }}>
          <defs>
            <marker id="ml-arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" fill="#000000" />
            </marker>
          </defs>

          {/* Queue 0: Highest Priority (RR q=8) */}
          <rect x="20" y="20" width="580" height="60" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" />
          <text x="35" y="45" fontSize="14" fontWeight="900" fill="#1d4ed8" fontFamily="Lexend">
            Queue 0 (Q0): Round Robin (quantum = 8 ms)
          </text>
          <text x="35" y="65" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
            Highest Priority — New arrivals enter here. Short I/O-bound interactive bursts finish fast!
          </text>

          {/* Demotion Arrow Q0 -> Q1 */}
          <path d="M 600 50 L 640 50 L 640 130 L 600 130" fill="none" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#ml-arr)" />
          <text x="650" y="95" fontSize="11" fontWeight="800" fill="#dc2626" fontFamily="Lexend">
            Demoted if &gt; 8ms
          </text>

          {/* Queue 1: Medium Priority (RR q=16) */}
          <rect x="20" y="105" width="580" height="60" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
          <text x="35" y="130" fontSize="14" fontWeight="900" fill="#15803d" fontFamily="Lexend">
            Queue 1 (Q1): Round Robin (quantum = 16 ms)
          </text>
          <text x="35" y="150" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
            Medium Priority — Serviced only when Q0 is empty.
          </text>

          {/* Demotion Arrow Q1 -> Q2 */}
          <path d="M 600 135 L 640 135 L 640 215 L 600 215" fill="none" stroke="#dc2626" strokeWidth="2.5" markerEnd="url(#ml-arr)" />
          <text x="650" y="180" fontSize="11" fontWeight="800" fill="#dc2626" fontFamily="Lexend">
            Demoted if &gt; 16ms
          </text>

          {/* Aging Promotion Arrow (Green upward curve on left) */}
          {enableAging && (
            <path d="M 20 220 L 5 220 L 5 45 L 20 45" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="5 3" markerEnd="url(#ml-arr)" />
          )}

          {/* Queue 2: Lowest Priority (FCFS) */}
          <rect x="20" y="190" width="580" height="60" rx="8" fill="#fffbeb" stroke="#d97706" strokeWidth="2.5" />
          <text x="35" y="215" fontSize="14" fontWeight="900" fill="#b45309" fontFamily="Lexend">
            Queue 2 (Q2): FCFS (First-Come, First-Served)
          </text>
          <text x="35" y="235" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
            Lowest Priority — Long CPU-bound background jobs run here without disturbing interactive users.
          </text>

          {/* CPU Core Dispatch Box on Far Right */}
          <rect x="715" y="90" width="115" height="90" rx="10" fill="#ffffff" stroke="#000000" strokeWidth="3" />
          <text x="772" y="125" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
            CPU CORE
          </text>
          <text x="772" y="150" textAnchor="middle" fontSize="12" fontWeight="800" fill={currentSlice && currentSlice.procId !== "IDLE" ? currentSlice.color : "#64748b"} fontFamily="Lexend">
            {currentSlice ? currentSlice.procId : "IDLE"}
          </text>
        </svg>
      </div>

      {/* ── LIVE GANTT CHART ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1.5rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#000000" }}>
            Visual Gantt Chart Timeline (0 → {totalDuration} ms)
          </h3>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
            Current CPU: {currentSlice ? `${currentSlice.procId} (${currentSlice.queue})` : "IDLE"}
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
                  background: slice.procId === "IDLE" ? "#cbd5e1" : slice.color,
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

      {/* ── 2-COLUMN VIEW: SIMULATION LOG & METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left: Simulation Event Log */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 1rem 0", color: "#000000" }}>
            Live MLFQ Transition & Demotion Events
          </h3>

          <div style={{ maxHeight: "260px", overflowY: "auto", fontSize: "13px", background: "#f8fafc", border: "1px solid #000000", borderRadius: 8, padding: "0.75rem" }}>
            {events.map((evt, idx) => (
              <div key={idx} style={{ marginBottom: "0.5rem", paddingBottom: "0.4rem", borderBottom: "1px dashed #cbd5e1" }}>
                <span style={{ fontWeight: 800, color: "#2563eb" }}>t = {evt.time} ms:</span> {evt.text}
              </div>
            ))}
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
            Performance Metrics & Summary
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#f0fdf4", textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#000000" }}>Avg Waiting Time</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#16a34a", marginTop: "0.2rem" }}>{avgWait} ms</div>
            </div>
            <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.75rem", background: "#eff6ff", textAlign: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#000000" }}>Avg Turnaround Time</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#2563eb", marginTop: "0.2rem" }}>{avgTat} ms</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

