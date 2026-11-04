import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function PriorityScheduling() {
  const [mode, setMode] = useState("preemptive"); // "preemptive" or "nonpreemptive"
  const [enableAging, setEnableAging] = useState(false);
  const [agingRate, setAgingRate] = useState(2); // every X ms, priority decreases by 1 (higher rank)
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef(null);

  // Standard Priority Dataset (smaller integer = higher priority)
  // P3 is low priority (priority 4) and has long burst -> prime candidate for starvation without aging!
  const INITIAL_PROCESSES = [
    { id: "P1", arrival: 0, burst: 10, priority: 3, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", arrival: 1, burst: 2, priority: 1, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", arrival: 2, burst: 7, priority: 4, color: "#d97706", bg: "#fffbeb" }, // Starved process!
    { id: "P4", arrival: 3, burst: 3, priority: 2, color: "#9333ea", bg: "#faf5ff" },
    { id: "P5", arrival: 5, burst: 4, priority: 1, color: "#e11d48", bg: "#fff1f2" }
  ];

  // Calculate schedule with optional dynamic aging
  const calculateSchedule = () => {
    const remaining = {};
    const effectivePriority = {};
    const firstResponse = {};
    const waitTimes = {};

    INITIAL_PROCESSES.forEach((p) => {
      remaining[p.id] = p.burst;
      effectivePriority[p.id] = p.priority;
      waitTimes[p.id] = 0;
    });

    let currentTime = 0;
    const timeline = [];
    const completed = [];
    const priorityHistory = []; // record for graphing/visualizing aging

    const totalBurst = INITIAL_PROCESSES.reduce((acc, p) => acc + p.burst, 0);
    const maxArrival = Math.max(...INITIAL_PROCESSES.map((p) => p.arrival));
    const maxLimit = totalBurst + maxArrival + 10;

    let lastProcId = null;
    let sliceStart = 0;

    if (mode === "nonpreemptive") {
      // Non-Preemptive Priority
      const unarrived = [...INITIAL_PROCESSES].sort((a, b) => a.arrival - b.arrival);
      const readyQueue = [];

      while (completed.length < INITIAL_PROCESSES.length && currentTime < maxLimit) {
        while (unarrived.length > 0 && unarrived[0].arrival <= currentTime) {
          readyQueue.push(unarrived.shift());
        }

        if (readyQueue.length === 0) {
          if (unarrived.length > 0) {
            const nextArr = unarrived[0].arrival;
            timeline.push({ procId: "IDLE", start: currentTime, end: nextArr, color: "#e2e8f0" });
            currentTime = nextArr;
            continue;
          } else {
            break;
          }
        }

        // Apply aging to waiting processes if enabled
        if (enableAging) {
          readyQueue.forEach((p) => {
            const waited = currentTime - p.arrival;
            const boost = Math.floor(waited / agingRate);
            p.currentPriority = Math.max(1, p.priority - boost);
          });
        } else {
          readyQueue.forEach((p) => { p.currentPriority = p.priority; });
        }

        // Sort by currentPriority (ascending), then arrival
        readyQueue.sort((a, b) => a.currentPriority - b.currentPriority || a.arrival - b.arrival);
        const selected = readyQueue.shift();

        const start = currentTime;
        const end = start + selected.burst;
        timeline.push({ procId: selected.id, start, end, color: selected.color });
        currentTime = end;

        const ct = end;
        const tat = ct - selected.arrival;
        const wt = tat - selected.burst;
        completed.push({
          ...selected,
          finalPriority: selected.currentPriority,
          completionTime: ct,
          turnaroundTime: tat,
          waitingTime: wt,
          responseTime: start - selected.arrival
        });
      }
    } else {
      // Preemptive Priority: tick by tick evaluation
      while (completed.length < INITIAL_PROCESSES.length && currentTime < maxLimit) {
        // Ready processes
        const ready = INITIAL_PROCESSES.filter((p) => p.arrival <= currentTime && remaining[p.id] > 0);

        if (ready.length === 0) {
          if (lastProcId !== "IDLE") {
            if (lastProcId !== null) {
              const prev = INITIAL_PROCESSES.find((p) => p.id === lastProcId);
              timeline.push({ procId: lastProcId, start: sliceStart, end: currentTime, color: prev ? prev.color : "#e2e8f0" });
            }
            lastProcId = "IDLE";
            sliceStart = currentTime;
          }
          currentTime += 1;
          continue;
        }

        // Apply Aging to ready processes
        ready.forEach((p) => {
          if (enableAging && p.id !== lastProcId) {
            waitTimes[p.id] += 1;
            const boost = Math.floor(waitTimes[p.id] / agingRate);
            effectivePriority[p.id] = Math.max(1, p.priority - boost);
          } else {
            if (!enableAging) effectivePriority[p.id] = p.priority;
          }
        });

        // Pick highest priority (lowest integer value)
        ready.sort((a, b) => effectivePriority[a.id] - effectivePriority[b.id] || a.arrival - b.arrival);
        const selected = ready[0];

        if (firstResponse[selected.id] === undefined) {
          firstResponse[selected.id] = currentTime;
        }

        if (lastProcId !== selected.id) {
          if (lastProcId !== null) {
            const prev = INITIAL_PROCESSES.find((p) => p.id === lastProcId);
            timeline.push({
              procId: lastProcId,
              start: sliceStart,
              end: currentTime,
              color: prev ? prev.color : "#e2e8f0"
            });
          }
          lastProcId = selected.id;
          sliceStart = currentTime;
        }

        // Execute 1 unit
        remaining[selected.id] -= 1;
        currentTime += 1;

        if (remaining[selected.id] === 0) {
          const ct = currentTime;
          const tat = ct - selected.arrival;
          const wt = tat - selected.burst;
          completed.push({
            ...selected,
            finalPriority: effectivePriority[selected.id],
            completionTime: ct,
            turnaroundTime: tat,
            waitingTime: wt,
            responseTime: firstResponse[selected.id] - selected.arrival
          });
        }
      }

      if (lastProcId !== null && sliceStart < currentTime) {
        const prev = INITIAL_PROCESSES.find((p) => p.id === lastProcId);
        timeline.push({ procId: lastProcId, start: sliceStart, end: currentTime, color: prev ? prev.color : "#e2e8f0" });
      }
    }

    return { timeline, completed, totalDuration: currentTime };
  };

  const { timeline, completed, totalDuration } = calculateSchedule();

  // Playback loop
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

  const currentSlice = timeline.find((s) => playbackTime >= s.start && playbackTime < s.end) || timeline[timeline.length - 1];

  const avgWait = (completed.reduce((acc, p) => acc + p.waitingTime, 0) / (completed.length || 1)).toFixed(2);
  const avgTat = (completed.reduce((acc, p) => acc + p.turnaroundTime, 0) / (completed.length || 1)).toFixed(2);
  const avgRt = (completed.reduce((acc, p) => acc + p.responseTime, 0) / (completed.length || 1)).toFixed(2);

  // Compute remaining burst of each process at playbackTime
  const getProcessStateAtTime = (p) => {
    if (playbackTime < p.arrival) return { status: "Not Arrived", remaining: p.burst };
    let executed = 0;
    timeline.forEach((slice) => {
      if (slice.procId === p.id) {
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              Priority CPU Scheduling & The Aging Solution
            </h2>
            <p style={{ fontSize: "14px", margin: 0, color: "#000000", lineHeight: 1.5 }}>
              A priority number (integer) is assigned to each process. CPU is allocated to the process with the highest priority (lowest integer value: 1 = Highest, 5 = Lowest).
            </p>
          </div>
          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: "0.5rem", background: "#f8fafc", padding: "0.3rem", borderRadius: 8, border: "2px solid #000000" }}>
            <button
              onClick={() => { setMode("preemptive"); setPlaybackTime(0); setIsPlaying(false); }}
              style={{
                background: mode === "preemptive" ? "#000000" : "#ffffff",
                color: mode === "preemptive" ? "#ffffff" : "#000000",
                border: "1px solid #000000",
                borderRadius: 6,
                padding: "0.4rem 0.85rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Preemptive Priority
            </button>
            <button
              onClick={() => { setMode("nonpreemptive"); setPlaybackTime(0); setIsPlaying(false); }}
              style={{
                background: mode === "nonpreemptive" ? "#000000" : "#ffffff",
                color: mode === "nonpreemptive" ? "#ffffff" : "#000000",
                border: "1px solid #000000",
                borderRadius: 6,
                padding: "0.4rem 0.85rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Non-Preemptive Priority
            </button>
          </div>
        </div>
      </div>

      {/* Control Strip & Interactive Aging Toggle */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px", maxWidth: "280px" }}>
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

        {/* Dynamic Aging Activation Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: enableAging ? "#dcfce7" : "#f8fafc", padding: "0.4rem 0.8rem", borderRadius: 8, border: "2px solid #000000" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "14px", fontWeight: 900 }}>
            <input
              type="checkbox"
              checked={enableAging}
              onChange={(e) => { setEnableAging(e.target.checked); setPlaybackTime(0); setIsPlaying(false); }}
              style={{ cursor: "pointer", width: 16, height: 16 }}
            />
            <span>🛡️ Enable Aging (Anti-Starvation)</span>
          </label>
          {enableAging && (
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#16a34a" }}>
              (+1 priority every {agingRate}ms waited)
            </span>
          )}
        </div>
      </div>

      {/* Starvation vs Aging Educational Banner */}
      <div style={{
        background: enableAging ? "#f0fdf4" : "#fef2f2",
        border: "2px solid #000000",
        borderRadius: 10,
        padding: "0.85rem 1.25rem",
        marginBottom: "1.5rem",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "#000000"
      }}>
        {enableAging ? (
          <div>
            <strong>✅ Aging Active:</strong> Process <strong>P3 (Initial Priority 4)</strong> has its priority steadily boosted the longer it waits in the Ready Queue. Notice how P3 is no longer starved and completes much earlier!
          </div>
        ) : (
          <div>
            <strong>⚠️ Starvation in Effect:</strong> Process <strong>P3 (Priority 4)</strong> is starved! Newer processes with higher priority (P2, P4, P5 with priorities 1 and 2) repeatedly preempt or run before P3. Toggle <em>"Enable Aging"</em> above to witness the textbook cure.
          </div>
        )}
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
            Active: {currentSlice ? currentSlice.procId : "IDLE"}
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

      {/* ── 2-COLUMN: PROCESS CARDS & METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Left: Process Inspection */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 1rem 0", color: "#000000" }}>
            Ready Queue & Priority Status (at t = {playbackTime.toFixed(1)} ms)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            {INITIAL_PROCESSES.map((p) => {
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
                  <div style={{ fontSize: "12px", color: "#000000", marginTop: "0.35rem" }}>
                    Arrival: {p.arrival} ms | Burst: {p.burst} ms
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 900, color: p.priority === 4 ? "#dc2626" : "#000000", marginTop: "0.2rem" }}>
                    Base Priority: {p.priority} {p.priority === 1 ? "(Highest)" : p.priority === 4 ? "(Lowest)" : ""}
                  </div>
                  <div style={{ fontSize: "12px", color: "#000000", marginTop: "0.2rem" }}>
                    Remaining: {state.remaining.toFixed(1)} ms
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #000000", borderRadius: 8, padding: "0.75rem", fontSize: "13px", lineHeight: 1.5 }}>
            📌 <strong>Priority Rule:</strong> Smaller number indicates higher priority ($1 &gt; 2 &gt; 3 &gt; 4$). In preemptive mode, an arriving process with lower priority integer preempts the currently running job.
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
            Performance Metrics & Waiting Times
          </h3>

          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000000", background: "#f8fafc" }}>
                  <th style={{ padding: "0.5rem" }}>Process</th>
                  <th style={{ padding: "0.5rem" }}>Base Prio</th>
                  <th style={{ padding: "0.5rem" }}>AT</th>
                  <th style={{ padding: "0.5rem" }}>BT</th>
                  <th style={{ padding: "0.5rem" }}>CT</th>
                  <th style={{ padding: "0.5rem" }}>TAT</th>
                  <th style={{ padding: "0.5rem" }}>WT</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.5rem", fontWeight: 800, color: p.color }}>{p.id}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 800 }}>{p.priority}</td>
                    <td style={{ padding: "0.5rem" }}>{p.arrival}</td>
                    <td style={{ padding: "0.5rem" }}>{p.burst}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 800 }}>{p.completionTime}</td>
                    <td style={{ padding: "0.5rem" }}>{p.turnaroundTime}</td>
                    <td style={{ padding: "0.5rem", fontWeight: 800, color: p.id === "P3" && !enableAging ? "#dc2626" : "#16a34a" }}>
                      {p.waitingTime} ms
                    </td>
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

      {/* ── REAL-WORLD CASE STUDY: PRIORITY INVERSION & MARS PATHFINDER ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1.25rem"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#000000" }}>
          🚀 Real-World System Pitfall: Priority Inversion & Mars Pathfinder
        </h3>
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000", margin: "0 0 1rem 0" }}>
          A major scheduling hazard occurs when a higher-priority process needs to read or modify kernel data that are currently being accessed by a lower-priority process.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "#f8fafc", border: "1px solid #000000", borderRadius: 8, padding: "1rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 900, color: "#dc2626", marginBottom: "0.4rem" }}>
              The Incident (July 1997 on Mars):
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#000000", margin: 0 }}>
              The Mars Pathfinder spacecraft began experiencing total system resets on Mars. A high-priority information bus management task was blocked waiting on a shared mutex held by a low-priority meteorological task. A medium-priority communications task preempted the low-priority task, preventing it from ever finishing and releasing the mutex! The high-priority task starved, triggering a watchdog reset.
            </p>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #000000", borderRadius: 8, padding: "1rem" }}>
            <div style={{ fontSize: "14px", fontWeight: 900, color: "#16a34a", marginBottom: "0.4rem" }}>
              The Solution: Priority Inheritance Protocol
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.5, color: "#000000", margin: 0 }}>
              Under <strong>Priority Inheritance</strong>, any process that is accessing a resource needed by a higher-priority process temporarily <strong>inherits the higher priority</strong> until it finishes with the resource. In Mars Pathfinder, JPL engineers remotely uploaded a patch to enable priority inheritance in VxWorks, curing the problem entirely!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

