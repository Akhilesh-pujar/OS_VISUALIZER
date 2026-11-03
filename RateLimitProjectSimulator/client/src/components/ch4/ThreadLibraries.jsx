import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

// Code lines for each library — used for line-by-line execution pointer
const PTHREAD_LINES = [
  '#include <pthread.h>',
  '#include <stdio.h>',
  '',
  'int sum = 0;',
  'void *runner(void *param);',
  '',
  'int main(int argc, char *argv[]) {',
  '    pthread_t tid;',
  '    pthread_attr_t attr;',
  '',
  '    pthread_attr_init(&attr);',
  '    /* Create the worker thread */',
  '    pthread_create(&tid, &attr, runner, argv[1]);',
  '',
  '    /* Wait for worker to finish */',
  '    pthread_join(tid, NULL);',
  '    printf("sum = %d\\n", sum);',
  '    return 0;',
  '}',
  '',
  'void *runner(void *param) {',
  '    int upper = atoi(param);',
  '    for (int i = 1; i <= upper; i++)',
  '        sum += i;',
  '    pthread_exit(0);',
  '}'
];

const WIN32_LINES = [
  '#include <windows.h>',
  '#include <stdio.h>',
  '',
  'DWORD Sum = 0;',
  'DWORD WINAPI Summation(LPVOID Param) {',
  '    DWORD Upper = *(DWORD *)Param;',
  '    for (DWORD i = 1; i <= Upper; i++)',
  '        Sum += i;',
  '    return 0;',
  '}',
  '',
  'int main(int argc, char *argv[]) {',
  '    DWORD ThreadId;',
  '    HANDLE ThreadHandle;',
  '    DWORD Param = 10;',
  '',
  '    /* Create worker thread */',
  '    ThreadHandle = CreateThread(',
  '        NULL, 0, Summation, &Param, 0, &ThreadId);',
  '',
  '    /* Wait for thread */',
  '    WaitForSingleObject(ThreadHandle, INFINITE);',
  '    CloseHandle(ThreadHandle);',
  '    printf("Sum = %d\\n", Sum);',
  '    return 0;',
  '}'
];

const JAVA_LINES = [
  'class Summation implements Runnable {',
  '    private int upper;',
  '    private int sum;',
  '',
  '    public Summation(int u) { this.upper = u; }',
  '',
  '    @Override',
  '    public void run() {',
  '        for (int i = 1; i <= upper; i++)',
  '            sum += i;',
  '    }',
  '    public int getSum() { return sum; }',
  '}',
  '',
  'public class Driver {',
  '    public static void main(String[] args) {',
  '        Summation task = new Summation(10);',
  '        Thread worker = new Thread(task);',
  '        /* Start worker thread */',
  '        worker.start();',
  '',
  '        try {',
  '            /* Wait for thread */',
  '            worker.join();',
  '            System.out.println("Sum = " + task.getSum());',
  '        } catch (InterruptedException ie) { }',
  '    }',
  '}'
];

// Execution steps: which lines are "active" at each step, plus runtime state
const PTHREAD_STEPS = [
  { line: 7, label: "main() entry", sum: 0, phase: "main", desc: "Program starts. Main thread begins execution at main()." },
  { line: 10, label: "pthread_attr_init()", sum: 0, phase: "main", desc: "Initialize thread attribute object with default values." },
  { line: 12, label: "pthread_create()", sum: 0, phase: "fork", desc: "OS kernel creates a new thread. Worker thread starts running runner() concurrently." },
  { line: 20, label: "runner() starts", sum: 0, phase: "worker", desc: "Worker thread enters runner(). It receives argv[1] as parameter." },
  { line: 22, label: "for loop: summing", sum: 15, phase: "worker", desc: "Worker thread computes sum: 1+2+3+4+5 = 15. Main thread is blocked on join()." },
  { line: 24, label: "pthread_exit(0)", sum: 55, phase: "worker", desc: "Worker finishes (sum=55). Calls pthread_exit(0) to terminate and signal completion." },
  { line: 15, label: "pthread_join() returns", sum: 55, phase: "join", desc: "Main thread unblocks! pthread_join() returns. Worker thread resources freed." },
  { line: 16, label: "printf(sum)", sum: 55, phase: "done", desc: "Main thread prints: 'sum = 55'. Program terminates normally." }
];

const WIN32_STEPS = [
  { line: 11, label: "main() entry", sum: 0, phase: "main", desc: "Program starts. Main thread enters main()." },
  { line: 17, label: "CreateThread()", sum: 0, phase: "fork", desc: "Win32 kernel creates a new thread running Summation(). Returns HANDLE." },
  { line: 4, label: "Summation() starts", sum: 0, phase: "worker", desc: "Worker thread enters Summation(). Reads Upper value from pointer." },
  { line: 6, label: "for loop: summing", sum: 15, phase: "worker", desc: "Worker computes Sum: 1+2+3+...+10. Main is blocked on WaitForSingleObject." },
  { line: 8, label: "return 0", sum: 55, phase: "worker", desc: "Worker finishes (Sum=55). Returns 0 and thread object becomes signaled." },
  { line: 21, label: "WaitForSingleObject returns", sum: 55, phase: "join", desc: "Main thread unblocks! The thread HANDLE is now in signaled state." },
  { line: 22, label: "CloseHandle()", sum: 55, phase: "done", desc: "Main closes the thread handle. Kernel frees thread object. Prints Sum = 55." }
];

const JAVA_STEPS = [
  { line: 15, label: "main() entry", sum: 0, phase: "main", desc: "JVM starts. Main thread enters Driver.main()." },
  { line: 16, label: "new Summation(10)", sum: 0, phase: "main", desc: "Create Summation task object with upper=10." },
  { line: 19, label: "worker.start()", sum: 0, phase: "fork", desc: "JVM creates a new OS thread (via JNI). Worker calls run() method." },
  { line: 7, label: "run() starts", sum: 0, phase: "worker", desc: "Worker thread enters run(). Begins summing loop." },
  { line: 8, label: "for loop: summing", sum: 15, phase: "worker", desc: "Worker computes sum: 1+2+...+10 = 55. Main blocked on join()." },
  { line: 10, label: "run() returns", sum: 55, phase: "worker", desc: "run() method returns. JVM marks thread as TERMINATED." },
  { line: 23, label: "worker.join() returns", sum: 55, phase: "join", desc: "Main thread unblocks. join() returns successfully." },
  { line: 24, label: "println()", sum: 55, phase: "done", desc: "Prints: 'Sum = 55'. JVM main thread finishes." }
];

export default function ThreadLibraries() {
  const [activeLib, setActiveLib] = useState("pthreads");
  const [stepIdx, setStepIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [animT, setAnimT] = useState(0);
  const rafRef = useRef(null);

  // Get current data
  const codeLines = activeLib === "pthreads" ? PTHREAD_LINES : activeLib === "windows" ? WIN32_LINES : JAVA_LINES;
  const steps = activeLib === "pthreads" ? PTHREAD_STEPS : activeLib === "windows" ? WIN32_STEPS : JAVA_STEPS;
  const current = steps[stepIdx] || steps[0];

  // Animation loop for SVG particles
  useEffect(() => {
    let t = 0;
    const loop = () => { t += 0.02; setAnimT(t); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Auto-play stepper
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= steps.length - 1) { setAutoPlay(false); return prev; }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [autoPlay, steps.length]);

  const LIBRARIES = [
    { id: "pthreads", name: "① POSIX Pthreads (C)", icon: "🐧", badge: "POSIX Standard", desc: "IEEE 1003.1c — pthread_create, pthread_join, pthread_exit. Linux and macOS." },
    { id: "windows", name: "② Win32 Thread API (C)", icon: "🪟", badge: "Windows Kernel", desc: "CreateThread(), WaitForSingleObject(), CloseHandle(). Windows NT kernel threads." },
    { id: "java", name: "③ Java JVM Threads", icon: "☕", badge: "JVM Runtime", desc: "Thread class, Runnable interface, thread.start(), thread.join(). Cross-platform via JVM." }
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* Split Layout: Left Code + Right Simulation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
        {/* ── LEFT: Code Panel with Line Pointer ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Library Selector Tabs */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {LIBRARIES.map((lib) => (
              <button
                key={lib.id}
                onClick={() => { setActiveLib(lib.id); setStepIdx(0); setAutoPlay(false); }}
                style={{
                  flex: 1,
                  background: activeLib === lib.id ? "#000000" : "#ffffff",
                  color: activeLib === lib.id ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.5rem 0.6rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                <span>{lib.icon}</span>
                <span>{lib.id === "pthreads" ? "Pthreads" : lib.id === "windows" ? "Win32" : "Java"}</span>
              </button>
            ))}
          </div>

          {/* Code Panel with yellow line-pointer */}
          <div style={{ border: "2px solid #000000", borderRadius: 10, overflow: "hidden", background: "#ffffff" }}>
            <div style={{ background: "#f8fafc", color: "#000000", borderBottom: "2px solid #000000", padding: "0.5rem 1rem", fontSize: "14px", fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
              <span>{activeLib === "pthreads" ? "POSIX C Code (IEEE 1003.1c)" : activeLib === "windows" ? "Win32 C Code (Windows SDK)" : "Java JVM Threads (Runnable)"}</span>
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#2563eb" }}>Line {current.line + 1} active</span>
            </div>
            <div style={{
              background: "#ffffff",
              maxHeight: "520px",
              overflowY: "auto",
              padding: "0.5rem 0"
            }}>
              {codeLines.map((line, idx) => {
                const isActive = idx === current.line;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: isActive ? "#fef08a" : "transparent",
                      color: "#000000",
                      fontFamily: "Consolas, monospace",
                      fontSize: "13px",
                      lineHeight: "22px",
                      padding: "0 0.5rem",
                      transition: "background 0.15s"
                    }}
                  >
                    {/* Line number gutter */}
                    <span style={{
                      width: "36px",
                      textAlign: "right",
                      paddingRight: "10px",
                      color: "#000000",
                      fontWeight: isActive ? 900 : 700,
                      opacity: isActive ? 1 : 0.6,
                      userSelect: "none",
                      flexShrink: 0
                    }}>
                      {idx + 1}
                    </span>
                    {/* Execution pointer arrow */}
                    <span style={{
                      width: "20px",
                      flexShrink: 0,
                      fontWeight: 900,
                      color: isActive ? "#dc2626" : "transparent",
                      fontSize: "14px"
                    }}>
                      {isActive ? "▶" : ""}
                    </span>
                    {/* Code text */}
                    <span style={{ fontWeight: isActive ? 900 : 600, color: "#000000" }}>
                      {line || "\u00A0"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Live Simulation Panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Controls Bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f8fafc", border: "2px solid #000000", borderRadius: 10,
            padding: "0.6rem 1rem", flexWrap: "wrap", gap: "0.5rem"
          }}>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                disabled={stepIdx === 0}
                style={{ background: stepIdx === 0 ? "#e2e8f0" : "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: stepIdx === 0 ? "not-allowed" : "pointer" }}
              >◀ Prev</button>
              <button
                onClick={() => setStepIdx((s) => Math.min(steps.length - 1, s + 1))}
                disabled={stepIdx >= steps.length - 1}
                style={{ background: stepIdx >= steps.length - 1 ? "#e2e8f0" : "#2563eb", color: stepIdx >= steps.length - 1 ? "#000000" : "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: stepIdx >= steps.length - 1 ? "not-allowed" : "pointer" }}
              >Next ▶</button>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                style={{ background: autoPlay ? "#dc2626" : "#16a34a", color: "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
              >{autoPlay ? "⏸ Pause" : "▶ Auto"}</button>
              <button
                onClick={() => { setStepIdx(0); setAutoPlay(false); }}
                style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 6, padding: "0.35rem 0.7rem", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}
              >↻ Reset</button>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 800 }}>Step {stepIdx + 1}/{steps.length}</span>
          </div>

          {/* Step Info Banner */}
          <div style={{
            background: current.phase === "worker" ? "#f0fdf4" : current.phase === "fork" ? "#eff6ff" : current.phase === "join" ? "#fef9c3" : "#f8fafc",
            border: "2px solid #000000", borderRadius: 10, padding: "0.75rem 1rem"
          }}>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.25rem" }}>
              {current.label}
            </div>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.5 }}>
              {current.desc}
            </p>
          </div>

          {/* Animated Thread Execution SVG */}
          <div style={{ border: "2px solid #000000", borderRadius: 12, padding: "1rem", background: "#ffffff" }}>
            <svg viewBox="0 0 440 260" style={{ width: "100%", height: "auto" }}>
              <defs>
                <marker id="lib-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#000000" />
                </marker>
              </defs>

              {/* Main thread timeline */}
              <rect x="20" y="30" width="400" height="50" rx="8" fill={current.phase === "main" || current.phase === "done" ? "#dbeafe" : "#f1f5f9"} stroke="#2563eb" strokeWidth="2" />
              <text x="40" y="55" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Main Thread</text>
              <text x="40" y="72" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                {current.phase === "main" ? "⚡ Executing..." : current.phase === "fork" ? "⚡ Creating worker..." : current.phase === "worker" ? "⏸ Blocked on join()/wait()" : current.phase === "join" ? "⚡ Unblocked! Continuing..." : "✓ Finished. sum = " + current.sum}
              </text>

              {/* Fork point */}
              <circle cx="220" cy="80" r="8" fill={current.phase === "fork" ? "#2563eb" : "#94a3b8"} stroke="#000000" strokeWidth="2" />
              <text x="220" y="100" textAnchor="middle" fontSize="11" fontWeight="800" fill="#000000" fontFamily="Lexend">
                {activeLib === "pthreads" ? "pthread_create()" : activeLib === "windows" ? "CreateThread()" : "worker.start()"}
              </text>

              {/* Worker thread bar */}
              <path d="M 220 80 Q 240 140 300 140 L 380 140 Q 400 140 400 110" fill="none" stroke={current.phase === "worker" ? "#16a34a" : "#94a3b8"} strokeWidth={current.phase === "worker" ? "4" : "2"} />
              <rect x="120" y="118" width="280" height="50" rx="8" fill={current.phase === "worker" ? "#dcfce7" : "#f1f5f9"} stroke={current.phase === "worker" ? "#16a34a" : "#94a3b8"} strokeWidth="2" />
              <text x="140" y="142" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">Worker Thread</text>
              <text x="140" y="160" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                {current.phase === "worker" ? `⚡ Computing sum... current = ${current.sum}` : (stepIdx > 2 ? `✓ Done. sum = ${current.sum}` : "💤 Not yet created")}
              </text>

              {/* Animated particle on worker thread */}
              {current.phase === "worker" && (
                <circle
                  cx={220 + ((animT * 80) % 200)}
                  cy="140"
                  r="6"
                  fill="#16a34a"
                  stroke="#000000"
                  strokeWidth="1.5"
                />
              )}

              {/* Shared variable panel */}
              <rect x="20" y="190" width="400" height="55" rx="8" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2" />
              <text x="40" y="215" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                📦 Shared Variable: sum = {current.sum}
              </text>
              <text x="40" y="235" fontSize="12" fontWeight="700" fill="#000000" fontFamily="Lexend">
                Stored in process Data segment — accessible by both Main and Worker threads
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* API Equivalence Table */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, textTransform: "uppercase" }}>
          THREAD LIBRARIES API EQUIVALENCE TABLE
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Operation</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>POSIX Pthreads (C)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Windows Win32 (C)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", fontWeight: 900 }}>Java (JVM)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Thread Creation", "pthread_create()", "CreateThread()", "new Thread(r).start()"],
              ["Thread Termination", "pthread_exit()", "ExitThread()", "run() returns"],
              ["Wait / Join", "pthread_join()", "WaitForSingleObject()", "thread.join()"],
              ["Thread ID Type", "pthread_t", "DWORD ThreadId", "long thread.getId()"],
              ["Handle / Struct", "pthread_attr_t", "HANDLE", "Thread object ref"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 4 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900 }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem" }}><code>{row[1]}</code></td>
                <td style={{ padding: "0.75rem 1rem" }}><code>{row[2]}</code></td>
                <td style={{ padding: "0.75rem 1rem" }}><code>{row[3]}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
