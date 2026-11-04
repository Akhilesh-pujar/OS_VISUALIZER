import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function SJFScheduling() {
  const [mode, setMode] = useState("preemptive"); // "nonpreemptive" or "preemptive" (SRTF)
  const [preset, setPreset] = useState("standard"); // "standard" or "chain"
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [alpha, setAlpha] = useState(0.5); // For exponential smoothing formula
  const rafRef = useRef(null);

  // Standard Silberschatz Example
  const STANDARD_PROCESSES = [
    { id: "P1", arrival: 0, burst: 8, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", arrival: 1, burst: 4, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", arrival: 2, burst: 9, color: "#d97706", bg: "#fffbeb" },
    { id: "P4", arrival: 3, burst: 5, color: "#9333ea", bg: "#faf5ff" }
  ];

  // High-preemption cascade example
  const CHAIN_PROCESSES = [
    { id: "P1", arrival: 0, burst: 10, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", arrival: 2, burst: 2, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", arrival: 3, burst: 1, color: "#d97706", bg: "#fffbeb" },
    { id: "P4", arrival: 5, burst: 4, color: "#9333ea", bg: "#faf5ff" }
  ];

  const rawProcesses = preset === "standard" ? STANDARD_PROCESSES : CHAIN_PROCESSES;

  // Compute Schedule based on mode
  const calculateSchedule = () => {
    if (mode === "nonpreemptive") {
      // Non-Preemptive SJF:
      // At any time current process finishes, choose process with smallest burst time among arrived processes.
      let currentTime = 0;
      const completed = [];
      const timeline = [];
      const unarrived = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);
      const readyQueue = [];

      while (completed.length < rawProcesses.length) {
        // Enqueue arrived
        while (unarrived.length > 0 && unarrived[0].arrival <= currentTime) {
          readyQueue.push(unarrived.shift());
        }

        if (readyQueue.length === 0) {
          // Idle until next arrival
          const nextArr = unarrived[0].arrival;
          timeline.push({ procId: "IDLE", start: currentTime, end: nextArr, color: "#e2e8f0" });
          currentTime = nextArr;
          continue;
        }

        // Sort ready queue by burst time
        readyQueue.sort((a, b) => a.burst - b.burst);
        const curr = readyQueue.shift();

        const start = currentTime;
        const end = start + curr.burst;
        timeline.push({ procId: curr.id, start, end, color: curr.color });
        currentTime = end;

        const completionTime = end;
        const turnaroundTime = completionTime - curr.arrival;
        const waitingTime = turnaroundTime - curr.burst;
        const responseTime = start - curr.arrival;

        completed.push({
          ...curr,
          completionTime,
          turnaroundTime,
          waitingTime,
          responseTime
        });
      }

      return { timeline, completed, totalDuration: currentTime };
    } else {
      // Preemptive SJF (SRTF - Shortest Remaining Time First)
      // Simulation evaluated tick by tick (unit 1)
      const remaining = {};
      const firstResponse = {};
      rawProcesses.forEach((p) => {
        remaining[p.id] = p.burst;
      });

      let currentTime = 0;
      const timeline = [];
      const completed = [];
      const preemptionEvents = [];

      const maxArrival = Math.max(...rawProcesses.map((p) => p.arrival));
      const totalBurst = rawProcesses.reduce((acc, p) => acc + p.burst, 0);
      const maxPossibleTime = maxArrival + totalBurst + 10;

      let lastProcId = null;
      let sliceStart = 0;

      while (completed.length < rawProcesses.length && currentTime < maxPossibleTime) {
        // Find arrived and incomplete processes
        const ready = rawProcesses.filter((p) => p.arrival <= currentTime && remaining[p.id] > 0);

        if (ready.length === 0) {
          if (lastProcId !== "IDLE") {
            if (lastProcId !== null) {
              const prev = rawProcesses.find((p) => p.id === lastProcId);
              timeline.push({ procId: lastProcId, start: sliceStart, end: currentTime, color: prev ? prev.color : "#e2e8f0" });
            }
            lastProcId = "IDLE";
            sliceStart = currentTime;
          }
          currentTime += 1;
          continue;
        }

        // Pick process with minimum remaining time
        ready.sort((a, b) => remaining[a.id] - remaining[b.id] || a.arrival - b.arrival);
        const selected = ready[0];

        if (firstResponse[selected.id] === undefined) {
          firstResponse[selected.id] = currentTime;
        }

        if (lastProcId !== selected.id) {
          if (lastProcId !== null) {
            const prev = rawProcesses.find((p) => p.id === lastProcId);
            timeline.push({
              procId: lastProcId,
              start: sliceStart,
              end: currentTime,
              color: prev ? prev.color : "#e2e8f0"
            });
            if (lastProcId !== "IDLE" && remaining[lastProcId] > 0) {
              preemptionEvents.push({
                time: currentTime,
                preempted: lastProcId,
                preemptor: selected.id,
                reason: `${selected.id} (rem: ${remaining[selected.id]}) < ${lastProcId} (rem: ${remaining[lastProcId]})`
              });
            }
          }
          lastProcId = selected.id;
          sliceStart = currentTime;
        }

        // Execute 1 unit
        remaining[selected.id] -= 1;
        currentTime += 1;

        if (remaining[selected.id] === 0) {
          const compTime = currentTime;
          const tat = compTime - selected.arrival;
          const wt = tat - selected.burst;
          const rt = firstResponse[selected.id] - selected.arrival;
          completed.push({
            ...selected,
            completionTime: compTime,
            turnaroundTime: tat,
            waitingTime: wt,
            responseTime: rt
          });
        }
      }

      if (lastProcId !== null && sliceStart < currentTime) {
        const prev = rawProcesses.find((p) => p.id === lastProcId);
        timeline.push({
          procId: lastProcId,
          start: sliceStart,
          end: currentTime,
          color: prev ? prev.color : "#e2e8f0"
        });
      }

      return { timeline, completed, totalDuration: currentTime, preemptionEvents };
    }
  };

  const { timeline, completed, totalDuration, preemptionEvents = [] } = calculateSchedule();

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const speed = 0.05; // smooth increment
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

  // Find currently running slice
  const currentSlice = timeline.find((s) => playbackTime >= s.start && playbackTime < s.end) || timeline[timeline.length - 1];

  // Averages
  const avgWait = (completed.reduce((acc, p) => acc + p.waitingTime, 0) / (completed.length || 1)).toFixed(2);
  const avgTat = (completed.reduce((acc, p) => acc + p.turnaroundTime, 0) / (completed.length || 1)).toFixed(2);
  const avgRt = (completed.reduce((acc, p) => acc + p.responseTime, 0) / (completed.length || 1)).toFixed(2);

  // Compute remaining burst of each process at playbackTime
  const getProcessStateAtTime = (p) => {
    if (playbackTime < p.arrival) return { status: "Not Arrived", remaining: p.burst };
    // count executed time up to playbackTime
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
              Shortest-Job-First (SJF) & Shortest-Remaining-Time-First (SRTF)
            </h2>
            <p style={{ fontSize: "14px", margin: 0, color: "#000000", lineHeight: 1.5 }}>
              Associates each process with the length of its next CPU burst. When the CPU becomes available, it is assigned to the process that has the smallest next CPU burst.
            </p>
          </div>
          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: "0.5rem", background: "#f8fafc", padding: "0.3rem", borderRadius: 8, border: "2px solid #000000" }}>
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
              Non-Preemptive SJF
            </button>
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
              Preemptive SJF (SRTF)
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar & Presets */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "220px", maxWidth: "380px" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
            Time: {playbackTime.toFixed(1)} / {totalDuration} ms
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

        {/* Dataset Preset Buttons */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>Dataset:</span>
          <button
            onClick={() => { setPreset("standard"); setPlaybackTime(0); setIsPlaying(false); }}
            style={{
              background: preset === "standard" ? "#eff6ff" : "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 6,
              padding: "0.35rem 0.75rem",
              fontSize: "14px",
              fontWeight: preset === "standard" ? 900 : 600,
              cursor: "pointer"
            }}
          >
            Standard 4-Process
          </button>
          <button
            onClick={() => { setPreset("chain"); setPlaybackTime(0); setIsPlaying(false); }}
            style={{
              background: preset === "chain" ? "#eff6ff" : "#ffffff",
              color: "#000000",
              border: "2px solid #000000",
              borderRadius: 6,
              padding: "0.35rem 0.75rem",
              fontSize: "14px",
              fontWeight: preset === "chain" ? 900 : 600,
              cursor: "pointer"
            }}
          >
            Preemption Chain
          </button>
        </div>
      </div>

      {/* Mode Callout Banner */}
      <div style={{
        background: mode === "preemptive" ? "#eff6ff" : "#fefce8",
        border: "2px solid #000000",
        borderRadius: 10,
        padding: "0.85rem 1.25rem",
        marginBottom: "1.5rem",
        fontSize: "14px",
        lineHeight: 1.6,
        color: "#000000"
      }}>
        {mode === "preemptive" ? (
          <div>
            <strong>⚡ Preemptive SJF (SRTF - Shortest Remaining Time First):</strong> When a new process arrives at the ready queue, if its burst time is less than the remaining execution time of the currently executing process, the CPU <strong>preempts</strong> the current process and context-switches to the new one. This provably achieves the minimal average waiting time!
          </div>
        ) : (
          <div>
            <strong>🛡️ Non-Preemptive SJF:</strong> Once the CPU has been allocated to a process, that process holds the CPU until it either terminates or yields for I/O. Even if a much shorter job arrives shortly after, it must wait in the Ready Queue until the current burst concludes.
          </div>
        )}
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
            Visual Gantt Chart Timeline (0 → {totalDuration} ms)
          </h3>
          <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
            Current CPU: {currentSlice ? currentSlice.procId : "IDLE"}
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
                  borderRight: "2px solid #000000",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: slice.procId === "IDLE" ? "#000000" : "#ffffff",
                  fontWeight: 900,
                  fontSize: "14px",
                  position: "relative",
                  boxShadow: isCurrentlyActive ? "inset 0 0 10px rgba(0,0,0,0.4)" : "none"
                }}
              >
                <span>{slice.procId}</span>
                <span style={{ fontSize: "11px", opacity: 0.9 }}>{slice.end - slice.start} ms</span>
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
                fontSize: "12px",
                fontWeight: 800,
                color: "#000000"
              }}
            >
              {slice.end}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2-COLUMN VIEW: LIVE CPU / QUEUE + METRICS TABLE ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Left Box: Live CPU & Ready Queue at Time t */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 1rem 0", color: "#000000" }}>
            Real-Time CPU Core & Ready Queue (at t = {playbackTime.toFixed(1)} ms)
          </h3>

          {/* Active CPU Display */}
          <div style={{
            border: "2px solid #000000",
            borderRadius: 10,
            padding: "1rem",
            background: "#f8fafc",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: currentSlice && currentSlice.procId !== "IDLE" ? currentSlice.color : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: "16px",
                border: "2px solid #000000"
              }}>
                {currentSlice ? currentSlice.procId : "IDLE"}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
                  CPU Core 0: {currentSlice && currentSlice.procId !== "IDLE" ? `Executing ${currentSlice.procId}` : "CPU Idle"}
                </div>
                <div style={{ fontSize: "13px", color: "#000000" }}>
                  Slice Window: [{currentSlice ? currentSlice.start : 0}ms – {currentSlice ? currentSlice.end : 0}ms]
                </div>
              </div>
            </div>
            <div style={{
              background: currentSlice && currentSlice.procId !== "IDLE" ? "#dcfce7" : "#f1f5f9",
              border: "1px solid #000000",
              borderRadius: 6,
              padding: "0.25rem 0.6rem",
              fontSize: "12px",
              fontWeight: 800,
              color: "#000000"
            }}>
              {currentSlice && currentSlice.procId !== "IDLE" ? "BUSY" : "IDLE"}
            </div>
          </div>

          {/* Dynamic Process Inspection Cards */}
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000", marginBottom: "0.5rem" }}>
            Process Remaining Burst States:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {rawProcesses.map((p) => {
              const state = getProcessStateAtTime(p);
              const isRun = state.status.includes("Running");
              return (
                <div
                  key={p.id}
                  style={{
                    border: "2px solid #000000",
                    borderRadius: 8,
                    padding: "0.6rem 0.8rem",
                    background: isRun ? "#eff6ff" : "#ffffff",
                    boxShadow: isRun ? "0 2px 8px rgba(37,99,235,0.2)" : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 900, color: p.color, fontSize: "14px" }}>{p.id}</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      padding: "0.15rem 0.4rem",
                      borderRadius: 4,
                      background: isRun ? "#2563eb" : state.remaining === 0 ? "#16a34a" : "#f1f5f9",
                      color: isRun || state.remaining === 0 ? "#ffffff" : "#000000"
                    }}>
                      {state.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#000000", marginTop: "0.35rem" }}>
                    Arrival: {p.arrival} ms | Total: {p.burst} ms
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#000000", marginTop: "0.2rem" }}>
                    Remaining Burst: {state.remaining.toFixed(1)} ms
                  </div>
                </div>
              );
            })}
          </div>

          {/* Preemption Event Log (SRTF only) */}
          {mode === "preemptive" && preemptionEvents.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000", marginBottom: "0.4rem" }}>
                Preemption Log:
              </div>
              <div style={{ maxHeight: "100px", overflowY: "auto", fontSize: "12px", background: "#f8fafc", border: "1px solid #000000", borderRadius: 6, padding: "0.5rem" }}>
                {preemptionEvents.map((evt, idx) => (
                  <div key={idx} style={{ marginBottom: "0.3rem", color: "#000000" }}>
                    ⏱ <strong>t = {evt.time}ms:</strong> Process <span style={{ color: "#dc2626", fontWeight: 800 }}>{evt.preempted}</span> preempted by <span style={{ color: "#16a34a", fontWeight: 800 }}>{evt.preemptor}</span> ({evt.reason})
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Box: Metrics Table & Calculations */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 12,
          padding: "1.25rem"
        }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 1rem 0", color: "#000000" }}>
            Calculations & Metrics Table
          </h3>

          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #000000", background: "#f8fafc" }}>
                  <th style={{ padding: "0.5rem" }}>Process</th>
                  <th style={{ padding: "0.5rem" }}>AT (ms)</th>
                  <th style={{ padding: "0.5rem" }}>BT (ms)</th>
                  <th style={{ padding: "0.5rem" }}>CT (ms)</th>
                  <th style={{ padding: "0.5rem" }}>TAT (CT-AT)</th>
                  <th style={{ padding: "0.5rem" }}>WT (TAT-BT)</th>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
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

          <div style={{ fontSize: "13px", color: "#000000", lineHeight: 1.5, background: "#f8fafc", padding: "0.75rem", borderRadius: 8, border: "1px solid #000000" }}>
            💡 <strong>Formulas:</strong><br />
            • Turnaround Time (TAT) = Completion Time (CT) − Arrival Time (AT)<br />
            • Waiting Time (WT) = Turnaround Time (TAT) − Burst Time (BT)<br />
            • Response Time (RT) = First CPU Time − Arrival Time (AT)
          </div>
        </div>
      </div>

      {/* ── THEORETICAL DEEP DIVE: EXPONENTIAL SMOOTHING & STARVATION ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #000000",
        borderRadius: 12,
        padding: "1.25rem",
        marginBottom: "1rem"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#000000" }}>
          Predicting Next CPU Burst: Exponential Averaging
        </h3>
        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#000000", margin: "0 0 1rem 0" }}>
          Although SJF is provably optimal for minimizing average waiting time, <strong>the OS cannot know the length of the next CPU burst in advance</strong>. Operating systems approximate SJF by predicting the next burst as an exponential weighted average of historical bursts:
        </p>

        <div style={{
          background: "#f1f5f9",
          border: "2px solid #000000",
          borderRadius: 8,
          padding: "0.85rem",
          fontSize: "14px",
          fontFamily: "monospace",
          fontWeight: 800,
          color: "#000000",
          marginBottom: "1rem"
        }}>
          τ_(n+1) = α · t_n + (1 - α) · τ_n
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, marginBottom: "0.3rem" }}>
              <span>Smoothing Factor (α): {alpha}</span>
              <span>{alpha === 0 ? "Pure History (No recent weight)" : alpha === 1 ? "Pure Recent Burst" : "Balanced Smoothing"}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              style={{ width: "100%", cursor: "pointer" }}
            />
            <div style={{ fontSize: "13px", color: "#000000", marginTop: "0.4rem" }}>
              • If α = 0, then τ_(n+1) = τ_n (Recent CPU history has no effect).<br />
              • If α = 1, then τ_(n+1) = t_n (Only the most recent burst matters).<br />
              • Commonly α = 0.5 balances recent behavior with historical average.
            </div>
          </div>

          <div style={{ border: "2px solid #000000", borderRadius: 8, padding: "0.85rem", background: "#fef2f2" }}>
            <div style={{ fontSize: "14px", fontWeight: 900, color: "#dc2626", marginBottom: "0.3rem" }}>
              ⚠️ The Major Pitfall: Starvation (Indefinite Blocking)
            </div>
            <p style={{ fontSize: "13px", color: "#000000", margin: 0, lineHeight: 1.5 }}>
              A major vulnerability of both Preemptive and Non-Preemptive SJF is <strong>Starvation</strong>: if short processes continuously arrive in the Ready Queue, a long CPU-bound process may <em>never</em> be granted the CPU. The textbook solution to starvation is <strong>Aging</strong> (gradually increasing process priority the longer it waits).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
