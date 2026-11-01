import React, { useState } from "react";

const FONT = "'Lexend', sans-serif";

export default function ThreadLibraries() {
  const [activeLib, setActiveLib] = useState("pthreads"); // "pthreads", "windows", "java"
  const [workerState, setWorkerState] = useState("idle"); // "idle", "running", "joined"

  const LIBRARIES = [
    {
      id: "pthreads",
      name: "① POSIX Pthreads (C / UNIX)",
      icon: "🐧",
      badge: "POSIX Standard",
      desc: "IEEE 1003.1c specification standard for thread creation and synchronization. Provided either as user-level or kernel-level library on Linux and macOS."
    },
    {
      id: "windows",
      name: "② Win32 Thread API (Windows C)",
      icon: "🪟",
      badge: "Windows Kernel",
      desc: "The primary thread management API on Microsoft Windows systems. Uses CreateThread(), WaitForSingleObject(), and security descriptors."
    },
    {
      id: "java",
      name: "③ Java JVM Threads (Java)",
      icon: "☕",
      badge: "JVM Runtime",
      desc: "Threads are fundamental to the Java language. Managed directly by the JVM and typically mapped to underlying host OS kernel threads (One-to-One)."
    }
  ];

  const current = LIBRARIES.find((l) => l.id === activeLib);

  const handleSimulate = () => {
    setWorkerState("running");
    setTimeout(() => {
      setWorkerState("joined");
    }, 1800);
  };

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Split Layout: Left Selector + Right Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
        {/* Left Column: Library List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.2rem" }}>
            Select Thread Library:
          </div>
          {LIBRARIES.map((lib) => {
            const isSelected = activeLib === lib.id;
            return (
              <button
                key={lib.id}
                onClick={() => {
                  setActiveLib(lib.id);
                  setWorkerState("idle");
                }}
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
                  <span style={{ fontSize: "1.1rem" }}>{lib.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000", background: "#f1f5f9", border: "1px solid #000000", padding: "0.15rem 0.5rem", borderRadius: 12 }}>
                    {lib.badge}
                  </span>
                </div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#000000", marginBottom: "0.2rem" }}>
                  {lib.name}
                </div>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.45, margin: 0 }}>
                  {lib.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Column: Code & Execution Visualizer */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          {/* Header & Simulator Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
              {current.name} (Code &amp; Execution)
            </div>
            <button
              onClick={handleSimulate}
              disabled={workerState === "running"}
              style={{
                background: workerState === "running" ? "#e2e8f0" : "#2563eb",
                color: workerState === "running" ? "#000000" : "#ffffff",
                border: "2px solid #000000",
                borderRadius: 8,
                padding: "0.45rem 1rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: workerState === "running" ? "not-allowed" : "pointer"
              }}
            >
              {workerState === "running" ? "⚡ Thread Running..." : "▶ Run Thread Simulation"}
            </button>
          </div>

          {/* Interactive Life-Cycle Flow SVG */}
          <div style={{ border: "2px solid #000000", borderRadius: 10, padding: "1rem", background: "#f8fafc" }}>
            <svg viewBox="0 0 740 160" style={{ width: "100%", height: "auto" }}>
              <defs>
                <marker id="th-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#000000" />
                </marker>
              </defs>

              {/* Main Thread Line */}
              <line x1="40" y1="50" x2="700" y2="50" stroke="#000000" strokeWidth="3" markerEnd="url(#th-arr)" />
              <text x="50" y="35" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                Parent / Main Thread
              </text>

              {/* Thread Fork/Create Point */}
              <circle cx="200" cy="50" r="7" fill="#2563eb" stroke="#000000" strokeWidth="2" />
              <text x="200" y="35" textAnchor="middle" fontSize="12" fontWeight="800" fill="#2563eb" fontFamily="Lexend">
                {activeLib === "pthreads" ? "pthread_create()" : activeLib === "windows" ? "CreateThread()" : "th.start()"}
              </text>

              {/* Worker Thread Line Branch */}
              <path
                d="M 200 50 Q 230 110 320 110 L 480 110 Q 550 110 570 50"
                fill="none"
                stroke={workerState === "running" ? "#16a34a" : "#000000"}
                strokeWidth={workerState === "running" ? "4" : "2.5"}
                strokeDasharray={workerState === "idle" ? "4 4" : "none"}
              />
              <text x="400" y="132" textAnchor="middle" fontSize="14" fontWeight="900" fill="#000000" fontFamily="Lexend">
                Worker Thread (Runs concurrently in background)
              </text>

              {/* Join/Wait Point */}
              <circle cx="570" cy="50" r="7" fill="#dc2626" stroke="#000000" strokeWidth="2" />
              <text x="570" y="35" textAnchor="middle" fontSize="12" fontWeight="800" fill="#dc2626" fontFamily="Lexend">
                {activeLib === "pthreads" ? "pthread_join()" : activeLib === "windows" ? "WaitForSingleObject()" : "th.join()"}
              </text>

              {/* Active token indicator */}
              {workerState === "running" && (
                <circle cx="400" cy="110" r="8" fill="#16a34a" stroke="#000000" strokeWidth="2" />
              )}
            </svg>
            <div style={{ textAlign: "center", fontSize: "14px", fontWeight: 800, color: "#000000", marginTop: "0.3rem" }}>
              Status: {workerState === "idle" ? "Thread initialized. Press 'Run Thread Simulation' to start." : workerState === "running" ? "⚡ Thread running in background..." : "✓ Thread completed work & joined parent!"}
            </div>
          </div>

          {/* Actual Code Examples */}
          <div style={{ border: "2px solid #000000", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#000000", color: "#ffffff", padding: "0.5rem 1rem", fontSize: "14px", fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
              <span>
                {activeLib === "pthreads" ? "POSIX C Code (IEEE 1003.1c)" : activeLib === "windows" ? "Win32 C Code (Windows SDK)" : "Java Multithreading (JVM Runnable)"}
              </span>
              <span>Syntax: Standard OS Reference</span>
            </div>
            <pre style={{
              margin: 0,
              padding: "1rem",
              background: "#000000",
              color: "#ffffff",
              fontSize: "12px",
              lineHeight: 1.45,
              fontFamily: "Consolas, monospace",
              overflowX: "auto"
            }}>
{activeLib === "pthreads" &&
`#include <pthread.h>
#include <stdio.h>

int sum = 0; /* Shared data between threads */
void *runner(void *param); /* Worker thread function */

int main(int argc, char *argv[]) {
    pthread_t tid;       /* Thread identifier */
    pthread_attr_t attr; /* Set of thread attributes */

    pthread_attr_init(&attr);
    /* 1. Create the worker thread */
    pthread_create(&tid, &attr, runner, argv[1]);

    /* 2. Wait for worker thread to finish execution */
    pthread_join(tid, NULL);
    printf("sum = %d\\n", sum);
    return 0;
}

void *runner(void *param) {
    int upper = atoi(param);
    for (int i = 1; i <= upper; i++) sum += i;
    pthread_exit(0);
}`}

{activeLib === "windows" &&
`#include <windows.h>
#include <stdio.h>

DWORD Sum = 0;
DWORD WINAPI Summation(LPVOID Param) {
    DWORD Upper = *(DWORD *)Param;
    for (DWORD i = 1; i <= Upper; i++) Sum += i;
    return 0;
}

int main(int argc, char *argv[]) {
    DWORD ThreadId;
    HANDLE ThreadHandle;
    DWORD Param = 10;

    /* 1. Create worker thread via Win32 API */
    ThreadHandle = CreateThread(
        NULL, 0, Summation, &Param, 0, &ThreadId);

    /* 2. Wait for the thread to complete */
    WaitForSingleObject(ThreadHandle, INFINITE);

    /* 3. Close handle to free kernel object */
    CloseHandle(ThreadHandle);
    printf("Sum = %d\\n", Sum);
    return 0;
}`}

{activeLib === "java" &&
`class Summation implements Runnable {
    private int upper;
    private int sum;

    public Summation(int upper) { this.upper = upper; }

    @Override
    public void run() {
        for (int i = 1; i <= upper; i++) sum += i;
    }
    public int getSum() { return sum; }
}

public class Driver {
    public static void main(String[] args) {
        Summation task = new Summation(10);
        /* 1. Create and start Java Thread */
        Thread worker = new Thread(task);
        worker.start();

        try {
            /* 2. Wait for thread to terminate */
            worker.join();
            System.out.println("Sum = " + task.getSum());
        } catch (InterruptedException ie) { }
    }
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* ── Key API Functions Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
          THREAD LIBRARIES API EQUIVALENCE TABLE
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ background: "#ffffff", borderBottom: "2px solid #000000" }}>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Operation</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>POSIX Pthreads (C)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Windows Win32 (C)</th>
              <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "#000000", fontWeight: 900 }}>Java (JVM)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Thread Creation", "pthread_create()", "CreateThread()", "new Thread(runnable).start()"],
              ["Thread Termination", "pthread_exit()", "ExitThread()", "run() method returns"],
              ["Wait / Join", "pthread_join()", "WaitForSingleObject()", "thread.join()"],
              ["Thread ID Type", "pthread_t", "DWORD ThreadId", "long thread.getId()"],
              ["Handle / Struct", "pthread_attr_t", "HANDLE", "Thread instance object"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 4 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 900, color: "#000000" }}>{row[0]}</td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}><code>{row[1]}</code></td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}><code>{row[2]}</code></td>
                <td style={{ padding: "0.75rem 1rem", color: "#000000" }}><code>{row[3]}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}