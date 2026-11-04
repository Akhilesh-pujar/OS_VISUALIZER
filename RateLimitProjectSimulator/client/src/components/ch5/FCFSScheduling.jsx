import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function FCFSScheduling() {
  const [mode, setMode] = useState("nonpreemptive"); // "nonpreemptive", "preemptive"
  const [preset, setPreset] = useState("convoy"); // "convoy", "standard"
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const rafRef = useRef(null);

  // Preset processes
  // Convoy effect: P1 arrives at 0 with large burst (24), while P2, P3, P4 arrive shortly after with short bursts (3, 3, 3)
  const CONVOY_PROCESSES = [
    { id: "P1", arrival: 0, burst: 20, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", arrival: 1, burst: 3, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", arrival: 2, burst: 4, color: "#ca8a04", bg: "#fefce8" },
    { id: "P4", arrival: 3, burst: 2, color: "#9333ea", bg: "#faf5ff" }
  ];

  const STANDARD_PROCESSES = [
    { id: "P1", arrival: 0, burst: 5, color: "#2563eb", bg: "#eff6ff" },
    { id: "P2", arrival: 1, burst: 4, color: "#16a34a", bg: "#f0fdf4" },
    { id: "P3", arrival: 2, burst: 2, color: "#ca8a04", bg: "#fefce8" },
    { id: "P4", arrival: 4, burst: 6, color: "#9333ea", bg: "#faf5ff" }
  ];

  const rawProcesses = preset === "convoy" ? CONVOY_PROCESSES : STANDARD_PROCESSES;

  // Build FCFS Gantt chart timeline
  // In classic FCFS (non-preemptive): ordered purely by arrival time
  // In simulated preemptive arrival: if new arrival occurs and CPU is idle or higher priority slice
  const calculateSchedule = () => {
    const procs = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);
    const timeline = []; // { procId, start, end, color }
    let currentTime = 0;
    const completed = [];

    procs.forEach((p) => {
      if (currentTime < p.arrival) {
        timeline.push({ procId: "IDLE", start: currentTime, end: p.arrival, color: "#e2e8f0" });
        currentTime = p.arrival;
      }
      const start = currentTime;
      const end = start + p.burst;
      timeline.push({ procId: p.id, start, end, color: p.color });
      currentTime = end;

      const completionTime = end;
      const turnaroundTime = completionTime - p.arrival;
      const waitingTime = turnaroundTime - p.burst;
      completed.push({
        ...p,
        completionTime,
        turnaroundTime,
        waitingTime
      });
    });

    const totalDuration = currentTime;
    const avgWT = completed.length > 0 ? (completed.reduce((acc, c) => acc + c.waitingTime, 0) / completed.length).toFixed(2) : 0;
    const avgTAT = completed.length > 0 ? (completed.reduce((acc, c) => acc + c.turnaroundTime, 0) / completed.length).toFixed(2) : 0;

    return { timeline, completed, totalDuration, avgWT, avgTAT };
  };

  const schedule = calculateSchedule();

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackTime((prev) => {
        if (prev >= schedule.totalDuration) {
          setIsPlaying(false);
          return schedule.totalDuration;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying, schedule.totalDuration]);

  // Find currently running process at playbackTime
  const currentBlock = schedule.timeline.find((b) => playbackTime >= b.start && playbackTime < b.end) || schedule.timeline[schedule.timeline.length - 1];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Overview & Concept Banner ── */}
      <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 900, margin: 0 }}>
            First-Come, First-Served (FCFS) Scheduling
          </h2>
          <span style={{ fontSize: "13px", fontWeight: 800, background: "#eff6ff", border: "1.5px solid #000000", padding: "0.2rem 0.6rem", borderRadius: 6 }}>
            Silberschatz Section 5.3.1
          </span>
        </div>
        <p style={{ fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
          By far the simplest CPU scheduling algorithm: the process that requests the CPU first is allocated the CPU first. It is managed with a standard FIFO queue.
          While easy to implement, FCFS suffers heavily from the <strong>Convoy Effect</strong> — short processes get trapped behind a single long, CPU-bound process, causing high average waiting times.
        </p>
      </div>

      {/* ── Preset & Playback Controls ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#f8fafc", border: "2px solid #000000", borderRadius: 12,
        padding: "0.85rem 1.25rem", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem"
      }}>
        {/* Preset Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "14px", fontWeight: 900 }}>Select Dataset:</span>
          <button
            onClick={() => { setPreset("convoy"); setPlaybackTime(0); setIsPlaying(false); }}
            style={{
              background: preset === "convoy" ? "#dc2626" : "#ffffff",
              color: preset === "convoy" ? "#ffffff" : "#000000",
              border: "2px solid #000000", borderRadius: 8,
              padding: "0.4rem 0.8rem", fontSize: "14px", fontWeight: 800, cursor: "pointer"
            }}
          >
            🚨 Convoy Effect Demo
          </button>
          <button
            onClick={() => { setPreset("standard"); setPlaybackTime(0); setIsPlaying(false); }}
            style={{
              background: preset === "standard" ? "#2563eb" : "#ffffff",
              color: preset === "standard" ? "#ffffff" : "#000000",
              border: "2px solid #000000", borderRadius: 8,
              padding: "0.4rem 0.8rem", fontSize: "14px", fontWeight: 800, cursor: "pointer"
            }}
          >
            ⚖️ Balanced Arrival
          </button>
        </div>

        {/* Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              background: isPlaying ? "#dc2626" : "#16a34a",
              color: "#ffffff",
              border: "2px solid #000000", borderRadius: 8,
              padding: "0.4rem 0.9rem", fontSize: "14px", fontWeight: 800, cursor: "pointer"
            }}
          >
            {isPlaying ? "⏸ Pause" : "▶ Run Simulation"}
          </button>
          <button
            onClick={() => setPlaybackTime((t) => Math.max(0, t - 1))}
            disabled={playbackTime === 0}
            style={{ background: playbackTime === 0 ? "#e2e8f0" : "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: playbackTime === 0 ? "not-allowed" : "pointer" }}
          >
            ◀ Step
          </button>
          <button
            onClick={() => setPlaybackTime((t) => Math.min(schedule.totalDuration, t + 1))}
            disabled={playbackTime >= schedule.totalDuration}
            style={{ background: playbackTime >= schedule.totalDuration ? "#e2e8f0" : "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: playbackTime >= schedule.totalDuration ? "not-allowed" : "pointer" }}
          >
            Step ▶
          </button>
          <button
            onClick={() => { setPlaybackTime(0); setIsPlaying(false); }}
            style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
          >
            ↻ Reset
          </button>
          <span style={{ fontSize: "14px", fontWeight: 900, marginLeft: "0.5rem" }}>
            Time: t = {playbackTime} ms
          </span>
        </div>
      </div>

      {/* ── Interactive Gantt Chart Visualizer ── */}
      <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 14, padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
            FCFS CPU Gantt Chart Timeline
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800 }}>
            Active on CPU at t={playbackTime}: <span style={{ padding: "0.2rem 0.6rem", background: currentBlock?.procId === "IDLE" ? "#e2e8f0" : "#eff6ff", border: "1.5px solid #000000", borderRadius: 6, fontWeight: 900 }}>{currentBlock?.procId}</span>
          </div>
        </div>

        {/* Gantt Bar Visualization */}
        <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#f8fafc", overflowX: "auto" }}>
          <div style={{ display: "flex", minWidth: "700px", height: "70px", border: "2px solid #000000", borderRadius: 8, overflow: "hidden", position: "relative" }}>
            {schedule.timeline.map((block, idx) => {
              const widthPct = ((block.end - block.start) / schedule.totalDuration) * 100;
              const isPast = playbackTime >= block.end;
              const isCurrent = playbackTime >= block.start && playbackTime < block.end;

              return (
                <div
                  key={idx}
                  style={{
                    width: `${widthPct}%`,
                    background: block.procId === "IDLE" ? "#e2e8f0" : block.color,
                    color: block.procId === "IDLE" ? "#000000" : "#ffffff",
                    borderRight: idx < schedule.timeline.length - 1 ? "2px solid #000000" : "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    opacity: isCurrent ? 1 : isPast ? 0.9 : 0.45,
                    transition: "opacity 0.2s"
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: 900 }}>{block.procId}</span>
                  <span style={{ fontSize: "11px", fontWeight: 800 }}>{block.end - block.start} ms</span>
                </div>
              );
            })}
          </div>

          {/* Time markers beneath Gantt */}
          <div style={{ display: "flex", minWidth: "700px", justifyContent: "space-between", marginTop: "0.5rem", position: "relative" }}>
            <span>0</span>
            {schedule.timeline.map((block, idx) => (
              <span key={idx} style={{ position: "absolute", left: `${(block.end / schedule.totalDuration) * 100}%`, transform: "translateX(-50%)", fontSize: "12px", fontWeight: 900 }}>
                {block.end}
              </span>
            ))}
          </div>
        </div>

        {/* Convoy Notice Callout */}
        {preset === "convoy" && (
          <div style={{ background: "#fef2f2", border: "2px solid #000000", borderRadius: 10, padding: "1rem", marginTop: "1rem", fontSize: "14px", lineHeight: 1.5 }}>
            <strong>🚨 The Convoy Effect Explained: </strong>
            Process <code>P1</code> arrived first at <code>t = 0</code> with a burst of <code>20 ms</code>.
            Processes <code>P2</code>, <code>P3</code>, and <code>P4</code> arrived right after, needing only 2–4 ms each!
            Because FCFS is non-preemptive, they are forced to wait the entire 20 ms for P1 to finish.
            This results in an astronomical Average Waiting Time of <strong>{schedule.avgWT} ms</strong>!
          </div>
        )}
      </div>

      {/* ── Process Metrics Calculation Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff", marginBottom: "1.5rem" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
          FCFS PROCESS SCHEDULE &amp; EXECUTION METRICS
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000000", background: "#ffffff" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Process ID</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Arrival Time (AT)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Burst Time (BT)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Completion Time (CT)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Turnaround Time (TAT = CT - AT)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Waiting Time (WT = TAT - BT)</th>
            </tr>
          </thead>
          <tbody>
            {schedule.completed.map((p, idx) => (
              <tr key={p.id} style={{ borderBottom: idx < schedule.completed.length - 1 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900 }}>
                  <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: p.color, marginRight: 8 }} />
                  {p.id}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>{p.arrival} ms</td>
                <td style={{ padding: "0.75rem 1rem" }}>{p.burst} ms</td>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 800 }}>{p.completionTime} ms</td>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 800 }}>{p.turnaroundTime} ms</td>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: p.waitingTime > 15 ? "#dc2626" : "#000000" }}>
                  {p.waitingTime} ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary Footer Bar */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "1rem", background: "#eff6ff", borderTop: "2px solid #000000" }}>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 800 }}>Average Waiting Time (AWT): </span>
            <strong style={{ fontSize: "16px", color: "#2563eb" }}>{schedule.avgWT} ms</strong>
          </div>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 800 }}>Average Turnaround Time (ATAT): </span>
            <strong style={{ fontSize: "16px", color: "#2563eb" }}>{schedule.avgTAT} ms</strong>
          </div>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 800 }}>CPU Utilization: </span>
            <strong style={{ fontSize: "16px", color: "#16a34a" }}>100%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

