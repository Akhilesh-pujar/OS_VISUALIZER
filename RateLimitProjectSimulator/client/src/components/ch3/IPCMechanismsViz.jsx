import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function IPCMechanismsViz() {
  const [activeChannel, setActiveChannel] = useState("all"); 
  // "all", "shm", "msg", "pipe", "buffer", "socket", "posix", "alpc"
  const [mode, setMode] = useState("single"); // "idle", "single", "high"
  const [t, setT] = useState(0);
  const [bufferItems, setBufferItems] = useState(["Payload A", "Payload B"]);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  // POSIX Step state
  const [posixStep, setPosixStep] = useState(0);
  const [posixPlaying, setPosixPlaying] = useState(false);

  // ALPC Step state
  const [alpcStep, setAlpcStep] = useState(0);
  const [alpcMsgSize, setAlpcMsgSize] = useState("small"); // "small", "medium", "large"

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

  // POSIX auto-play stepper
  useEffect(() => {
    if (!posixPlaying) return;
    const interval = setInterval(() => {
      setPosixStep((prev) => (prev >= 6 ? 0 : prev + 1));
    }, 2200);
    return () => clearInterval(interval);
  }, [posixPlaying]);

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
      id: "posix",
      name: "⑤ POSIX Shared Memory API (C Code)",
      icon: "💻",
      badge: "Fig 3.17 & 3.18",
      desc: "Animated execution trace of POSIX shm_open(), ftruncate(), mmap(), sprintf(), and shm_unlink() with memory inspection."
    },
    {
      id: "alpc",
      name: "⑥ Windows ALPC (Fig 3.19)",
      icon: "🪟",
      badge: "Windows RPC Kernel",
      desc: "Advanced Local Procedure Calls: Connection Ports, Communication Ports, Section Objects, and 3 Message Passing Techniques."
    },
    {
      id: "socket",
      name: "⑦ Network Sockets (Cross-Machine)",
      icon: "🌐",
      badge: "5–50 µs (Distributed)",
      desc: "Endpoint defined by IP Address + Port number. Used for client-server HTTP, RPC, and microservices."
    }
  ];

  // POSIX Code Step Definitions
  const POSIX_STEPS = [
    {
      step: 0,
      title: "Step 0: Initial State",
      activeProducerLine: null,
      activeConsumerLine: null,
      desc: "Producer and Consumer processes are initialized. Shared memory object '/OS' does not yet exist in RAM.",
      shmState: { exists: false, mapped: false, content: "", size: 0, unlinked: false }
    },
    {
      step: 1,
      title: "Step 1: shm_open() & ftruncate() [Producer]",
      activeProducerLine: 18,
      activeConsumerLine: null,
      desc: "Producer invokes shm_open('OS', O_CREAT | O_RDWR, 0666) to create the POSIX kernel shared memory object, then calls ftruncate(shm_fd, 4096) to allocate 4 KB.",
      shmState: { exists: true, mapped: false, content: "[Allocated 4096 Bytes in /dev/shm/OS]", size: 4096, unlinked: false }
    },
    {
      step: 2,
      title: "Step 2: mmap() into Producer Virtual Address Space",
      activeProducerLine: 20,
      activeConsumerLine: null,
      desc: "Producer calls mmap(0, SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0) to map the shared physical memory pages directly into its virtual address space (ptr).",
      shmState: { exists: true, mapped: true, content: "[Pages mapped to Producer ptr @ 0x7ffd0000]", size: 4096, unlinked: false }
    },
    {
      step: 3,
      title: "Step 3: sprintf(ptr, 'Hello') & sprintf(ptr, 'World!')",
      activeProducerLine: 21,
      activeConsumerLine: null,
      desc: "Producer writes message_0 ('Hello') and message_1 ('World!') directly into memory using sprintf. Zero-copy write directly to RAM!",
      shmState: { exists: true, mapped: true, content: "HelloWorld!", size: 4096, unlinked: false }
    },
    {
      step: 4,
      title: "Step 4: Consumer opens shm_open() & mmap()",
      activeProducerLine: null,
      activeConsumerLine: 15,
      desc: "Consumer opens existing object via shm_open('OS', O_RDONLY, 0666) and maps it with PROT_READ. Notice both processes now map the exact same physical RAM pages!",
      shmState: { exists: true, mapped: true, content: "HelloWorld!", size: 4096, unlinked: false }
    },
    {
      step: 5,
      title: "Step 5: printf('%s', (char *)ptr) [Consumer Reads]",
      activeProducerLine: null,
      activeConsumerLine: 17,
      desc: "Consumer reads the string 'HelloWorld!' directly from memory with printf. No kernel intervention or message copying overhead occurred.",
      shmState: { exists: true, mapped: true, content: "HelloWorld!", size: 4096, unlinked: false }
    },
    {
      step: 6,
      title: "Step 6: shm_unlink('OS') [Cleanup]",
      activeProducerLine: null,
      activeConsumerLine: 18,
      desc: "Consumer calls shm_unlink('OS'). The shared memory object name is removed. Once all processes close their file descriptors, the OS reclaims the 4096 bytes.",
      shmState: { exists: false, mapped: false, content: "[Unlinked & Freed by Kernel]", size: 0, unlinked: true }
    }
  ];

  const currentPosix = POSIX_STEPS[posixStep];

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

      {/* ── Status Banner ── */}
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
        {activeChannel === "posix"
          ? "— POSIX Shared Memory API (Silberschatz Figures 3.17 & 3.18) — Inspect real C code & zero-copy RAM execution"
          : activeChannel === "alpc"
          ? "— Windows ALPC (Silberschatz Figure 3.19) — High performance local RPC message-passing facility"
          : mode === "idle"
          ? "— Overview mode active: Select a channel on the left to inspect or switch to Step-by-Step animation"
          : "— All IPC channels active — watch data packets flow A ➔ B in real time"}
      </div>

      {/* ── Split Layout: Left Selector + Right Visualizer ── */}
      <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
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

        {/* Right Column: Visualizer Area */}
        <div style={{
          background: "#ffffff",
          border: "2px solid #000000",
          borderRadius: 14,
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          {/* Header Title */}
          <div style={{ fontSize: "18px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {activeChannel === "all"
              ? "INTERPROCESS COMMUNICATION — ALL 3 MECHANISMS"
              : activeChannel === "posix"
              ? "POSIX SHARED MEMORY API — PRODUCER & CONSUMER C CODE (FIG 3.17 & 3.18)"
              : activeChannel === "alpc"
              ? "ADVANCED LOCAL PROCEDURE CALLS (ALPC) IN WINDOWS (FIG 3.19)"
              : `INTERPROCESS COMMUNICATION — ${activeChannel.toUpperCase()}`}
          </div>

          {/* ──────────────── VIEW A: POSIX SHARED MEMORY CODE VISUALIZER ──────────────── */}
          {activeChannel === "posix" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Stepper Controls */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                border: "2px solid #000000",
                borderRadius: 10,
                padding: "0.75rem 1rem",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => setPosixStep((s) => Math.max(0, s - 1))}
                    disabled={posixStep === 0}
                    style={{
                      background: posixStep === 0 ? "#e2e8f0" : "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.4rem 0.8rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: posixStep === 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    ◀ Prev Step
                  </button>
                  <button
                    onClick={() => setPosixStep((s) => Math.min(POSIX_STEPS.length - 1, s + 1))}
                    disabled={posixStep === POSIX_STEPS.length - 1}
                    style={{
                      background: posixStep === POSIX_STEPS.length - 1 ? "#e2e8f0" : "#2563eb",
                      color: posixStep === POSIX_STEPS.length - 1 ? "#000000" : "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.4rem 0.8rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: posixStep === POSIX_STEPS.length - 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Next Step ▶
                  </button>
                  <button
                    onClick={() => setPosixPlaying(!posixPlaying)}
                    style={{
                      background: posixPlaying ? "#dc2626" : "#16a34a",
                      color: "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.4rem 0.8rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    {posixPlaying ? "⏸ Pause" : "▶ Auto Play"}
                  </button>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
                  Step {posixStep + 1} of {POSIX_STEPS.length}: <strong>{currentPosix.title}</strong>
                </div>
              </div>

              {/* Step Explanatory Banner */}
              <div style={{
                background: "#eff6ff",
                border: "2px solid #000000",
                borderRadius: 8,
                padding: "0.75rem 1rem",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#000000"
              }}>
                <strong>Action: </strong>{currentPosix.desc}
              </div>

              {/* Live Physical Shared Memory Inspection Bar */}
              <div style={{
                border: "2px solid #000000",
                borderRadius: 10,
                padding: "0.9rem 1.25rem",
                background: currentPosix.shmState.exists ? "#f0fdf4" : "#fef2f2",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
                    🧠 Kernel POSIX Shared Memory Object: <code>/dev/shm/OS</code>
                  </span>
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    padding: "0.2rem 0.6rem",
                    borderRadius: 6,
                    border: "1px solid #000000",
                    background: currentPosix.shmState.exists ? "#bbf7d0" : "#fecaca",
                    color: "#000000"
                  }}>
                    {currentPosix.shmState.exists ? `ACTIVE (${currentPosix.shmState.size} Bytes)` : "UNALLOCATED"}
                  </span>
                </div>
                <div style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "1.5px solid #000000",
                  fontFamily: "monospace",
                  padding: "0.6rem 0.9rem",
                  borderRadius: 6,
                  fontSize: "14px",
                  fontWeight: 800,
                  minHeight: "36px",
                  display: "flex",
                  alignItems: "center"
                }}>
                  {currentPosix.shmState.content || "/* Memory unallocated. Call shm_open() to create object */"}
                </div>
              </div>

              {/* Side-by-Side C Code: Figure 3.17 (Producer) & Figure 3.18 (Consumer) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Producer Code Card */}
                <div style={{ border: "2px solid #000000", borderRadius: 10, overflow: "hidden", background: "#ffffff" }}>
                  <div style={{ background: "#f8fafc", color: "#000000", borderBottom: "2px solid #000000", padding: "0.6rem 0.9rem", fontSize: "14px", fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
                    <span>Figure 3.17: Producer Process (POSIX shm)</span>
                    <span style={{ color: "#2563eb" }}>writer.c</span>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: "0.75rem",
                    background: "#ffffff",
                    color: "#000000",
                    fontSize: "13px",
                    lineHeight: 1.45,
                    fontFamily: "Consolas, monospace",
                    overflowX: "auto",
                    fontWeight: 600
                  }}>
{`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <fcntl.h>
#include <sys/shm.h>
#include <sys/stat.h>
#include <sys/mman.h>

int main()
{
  const int SIZE = 4096;
  const char *name = "OS";
  const char *message_0 = "Hello";
  const char *message_1 = "World!";
  int shm_fd;
  void *ptr;

  /* 1. Create shared memory object */
  shm_fd = shm_open(name, O_CREAT | O_RDWR, 0666);
  /* 2. Configure size in bytes */
  ftruncate(shm_fd, SIZE);
  /* 3. Memory map the object */
  ptr = mmap(0, SIZE, PROT_WRITE, MAP_SHARED, shm_fd, 0);
  /* 4. Write data zero-copy */
  sprintf(ptr, "%s", message_0);
  ptr += strlen(message_0);
  sprintf(ptr, "%s", message_1);
  ptr += strlen(message_1);
  return 0;
}`}
                  </pre>
                  <div style={{ padding: "0.6rem", background: "#f8fafc", borderTop: "1px solid #000000", fontSize: "14px", fontWeight: 700, color: "#000000" }}>
                    Status: {posixStep >= 1 && posixStep <= 3 ? "⚡ Executing syscalls..." : posixStep > 3 ? "✓ Execution completed" : "Waiting to execute"}
                  </div>
                </div>

                {/* Consumer Code Card */}
                <div style={{ border: "2px solid #000000", borderRadius: 10, overflow: "hidden", background: "#ffffff" }}>
                  <div style={{ background: "#f8fafc", color: "#000000", borderBottom: "2px solid #000000", padding: "0.6rem 0.9rem", fontSize: "14px", fontWeight: 900, display: "flex", justifyContent: "space-between" }}>
                    <span>Figure 3.18: Consumer Process (POSIX shm)</span>
                    <span style={{ color: "#16a34a" }}>reader.c</span>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: "0.75rem",
                    background: "#ffffff",
                    color: "#000000",
                    fontSize: "13px",
                    lineHeight: 1.45,
                    fontFamily: "Consolas, monospace",
                    overflowX: "auto",
                    fontWeight: 600
                  }}>
{`#include <stdio.h>
#include <stdlib.h>
#include <fcntl.h>
#include <sys/shm.h>
#include <sys/stat.h>
#include <sys/mman.h>

int main()
{
  const int SIZE = 4096;
  const char *name = "OS";
  int shm_fd;
  void *ptr;

  /* 1. Open existing shared object */
  shm_fd = shm_open(name, O_RDONLY, 0666);
  /* 2. Memory map for read */
  ptr = mmap(0, SIZE, PROT_READ, MAP_SHARED, shm_fd, 0);
  /* 3. Read directly from RAM */
  printf("%s", (char *)ptr);
  /* 4. Remove shared memory object */
  shm_unlink(name);
  return 0;
}`}
                  </pre>
                  <div style={{ padding: "0.6rem", background: "#f8fafc", borderTop: "1px solid #000000", fontSize: "14px", fontWeight: 700, color: "#000000" }}>
                    Status: {posixStep >= 4 ? "⚡ Reading & Unlinking RAM" : "Waiting for Producer to write"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── VIEW B: WINDOWS ALPC (FIGURE 3.19) ──────────────── */}
          {activeChannel === "alpc" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* ALPC interactive stepper */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                border: "2px solid #000000",
                borderRadius: 10,
                padding: "0.75rem 1rem",
                flexWrap: "wrap",
                gap: "0.5rem"
              }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000" }}>Message Size:</span>
                  <button
                    onClick={() => setAlpcMsgSize("small")}
                    style={{
                      background: alpcMsgSize === "small" ? "#2563eb" : "#ffffff",
                      color: alpcMsgSize === "small" ? "#ffffff" : "#000000",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.35rem 0.75rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    ≤ 256 Bytes (Queue Copy)
                  </button>
                  <button
                    onClick={() => setAlpcMsgSize("medium")}
                    style={{
                      background: alpcMsgSize === "medium" ? "#2563eb" : "#ffffff",
                      color: alpcMsgSize === "medium" ? "#ffffff" : "#000000",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.35rem 0.75rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    &gt; 256 Bytes (Section Object)
                  </button>
                  <button
                    onClick={() => setAlpcMsgSize("large")}
                    style={{
                      background: alpcMsgSize === "large" ? "#2563eb" : "#ffffff",
                      color: alpcMsgSize === "large" ? "#ffffff" : "#000000",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.35rem 0.75rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Huge Data (Direct Address API)
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setAlpcStep((s) => (s + 1) % 4)}
                    style={{
                      background: "#000000",
                      color: "#ffffff",
                      border: "2px solid #000000",
                      borderRadius: 6,
                      padding: "0.35rem 0.75rem",
                      fontSize: "14px",
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Next Stage (Stage {alpcStep + 1}/4) ➔
                  </button>
                </div>
              </div>

              {/* Exact SVG Diagram of Figure 3.19 */}
              <div style={{
                border: "2px solid #000000",
                borderRadius: 12,
                background: "#ffffff",
                padding: "1rem",
                boxShadow: "0 6px 20px rgba(0,0,0,0.06)"
              }}>
                <svg viewBox="0 0 760 420" style={{ width: "100%", height: "auto" }}>
                  <defs>
                    <marker id="alpc-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#000000" />
                    </marker>
                    <marker id="alpc-arrow-bi" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                      <polygon points="0 0, 8 3, 0 6" fill="#000000" />
                    </marker>
                  </defs>

                  {/* Client Box (Tall rectangle on left) */}
                  <rect
                    x="20"
                    y="40"
                    width="140"
                    height="340"
                    fill="#bae6fd"
                    stroke="#000000"
                    strokeWidth="2.5"
                    rx="4"
                  />
                  <text x="90" y="28" textAnchor="middle" fontSize="18" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    Client
                  </text>
                  <text x="90" y="210" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000" fontFamily="Lexend">
                    User Process
                  </text>
                  <text x="90" y="230" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000" fontFamily="Lexend">
                    (RPC Caller)
                  </text>

                  {/* Server Box (Tall rectangle on right) */}
                  <rect
                    x="600"
                    y="40"
                    width="140"
                    height="340"
                    fill="#bae6fd"
                    stroke="#000000"
                    strokeWidth="2.5"
                    rx="4"
                  />
                  <text x="670" y="28" textAnchor="middle" fontSize="18" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    Server
                  </text>
                  <text x="670" y="210" textAnchor="middle" fontSize="14" fontWeight="700" fill="#000000" fontFamily="Lexend">
                    Subsystem Server
                  </text>
                  <text x="670" y="230" textAnchor="middle" fontSize="14" fontWeight="600" fill="#000000" fontFamily="Lexend">
                    (e.g., Win32 / POSIX)
                  </text>

                  {/* ── Box 1: Connection Port (Top Middle) ── */}
                  <rect
                    x="290"
                    y="55"
                    width="180"
                    height="50"
                    fill="#bae6fd"
                    stroke="#000000"
                    strokeWidth="2.5"
                    rx="2"
                  />
                  <text x="380" y="85" textAnchor="middle" fontSize="16" fontWeight="900" fill="#000000" fontFamily="Lexend">
                    Connection Port
                  </text>

                  {/* Arrow: Client -> Connection Port (Connection request) */}
                  <line x1="160" y1="80" x2="290" y2="80" stroke="#000000" strokeWidth="2.5" markerEnd="url(#alpc-arrow)" />
                  <text x="225" y="65" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Connection
                  </text>
                  <text x="225" y="77" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    request
                  </text>

                  {/* Arrow: Connection Port -> Server (Handle) */}
                  <line x1="470" y1="80" x2="600" y2="80" stroke="#000000" strokeWidth="2.5" markerEnd="url(#alpc-arrow)" />
                  <text x="535" y="73" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Handle
                  </text>

                  {/* ── Box 2: Client Communication Port ── */}
                  <rect
                    x="270"
                    y="140"
                    width="220"
                    height="50"
                    fill="#bae6fd"
                    stroke="#000000"
                    strokeWidth="2.5"
                    rx="2"
                  />
                  <text x="380" y="162" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Client
                  </text>
                  <text x="380" y="179" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Communication Port
                  </text>

                  {/* Arrow: Client Communication Port -> Client (Handle) */}
                  <line x1="270" y1="165" x2="160" y2="165" stroke="#000000" strokeWidth="2.5" markerEnd="url(#alpc-arrow)" />
                  <text x="215" y="157" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Handle
                  </text>

                  {/* Vertical bidirectional arrows between Client Comm Port & Server Comm Port */}
                  <line x1="365" y1="190" x2="365" y2="225" stroke="#000000" strokeWidth="2.5" markerEnd="url(#alpc-arrow)" />
                  <line x1="395" y1="225" x2="395" y2="190" stroke="#000000" strokeWidth="2.5" markerEnd="url(#alpc-arrow)" />

                  {/* ── Box 3: Server Communication Port ── */}
                  <rect
                    x="270"
                    y="225"
                    width="220"
                    height="50"
                    fill="#bae6fd"
                    stroke="#000000"
                    strokeWidth="2.5"
                    rx="2"
                  />
                  <text x="380" y="247" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Server
                  </text>
                  <text x="380" y="264" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Communication Port
                  </text>

                  {/* Arrow: Server Communication Port -> Server (Handle) */}
                  <line x1="490" y1="250" x2="600" y2="250" stroke="#000000" strokeWidth="2.5" markerEnd="url(#alpc-arrow)" />
                  <text x="545" y="242" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Handle
                  </text>

                  {/* ── Box 4: Shared Section Object (> 256 bytes) ── */}
                  <rect
                    x="290"
                    y="325"
                    width="180"
                    height="60"
                    fill={alpcMsgSize === "medium" ? "#fef08a" : "#bae6fd"}
                    stroke="#000000"
                    strokeWidth="2.5"
                    rx="2"
                  />
                  <text x="380" y="350" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Shared
                  </text>
                  <text x="380" y="367" textAnchor="middle" fontSize="16" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    Section Object
                  </text>
                  <text x="380" y="380" textAnchor="middle" fontSize="14" fontWeight="800" fill="#000000" fontFamily="Lexend">
                    (&gt; 256 bytes)
                  </text>

                  {/* Bidirectional arrows between Client and Section Object */}
                  <line x1="160" y1="355" x2="290" y2="355" stroke="#000000" strokeWidth="2.5" markerStart="url(#alpc-arrow)" markerEnd="url(#alpc-arrow)" />
                  {/* Bidirectional arrows between Server and Section Object */}
                  <line x1="470" y1="355" x2="600" y2="355" stroke="#000000" strokeWidth="2.5" markerStart="url(#alpc-arrow)" markerEnd="url(#alpc-arrow)" />

                  {/* Animated message packet based on selected mode */}
                  {alpcMsgSize === "small" && (
                    <circle
                      cx={lerp(270, 490, (t * 0.8) % 1)}
                      cy="175"
                      r="7"
                      fill="#2563eb"
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                  )}
                  {alpcMsgSize === "medium" && (
                    <circle
                      cx={lerp(160, 600, (t * 0.6) % 1)}
                      cy="355"
                      r="8"
                      fill="#ea580c"
                      stroke="#000000"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>

                <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "16px", fontWeight: 900, color: "#000000" }}>
                  Figure 3.19: Advanced local procedure calls (ALPC) in Windows.
                </div>
              </div>

              {/* 3 Message-Passing Techniques Cards */}
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
                3 ALPC Message-Passing Techniques (Silberschatz):
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div style={{
                  border: `2px solid #000000`,
                  borderRadius: 10,
                  padding: "1rem",
                  background: alpcMsgSize === "small" ? "#eff6ff" : "#ffffff",
                  boxShadow: alpcMsgSize === "small" ? "0 4px 12px rgba(37,99,235,0.2)" : "none"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.4rem" }}>
                    1. Small Messages (≤ 256 B)
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: 0 }}>
                    The port's message queue is used as intermediate storage. Small messages are copied directly from the client address space to the server via the port channel.
                  </p>
                </div>

                <div style={{
                  border: `2px solid #000000`,
                  borderRadius: 10,
                  padding: "1rem",
                  background: alpcMsgSize === "medium" ? "#fffbeb" : "#ffffff",
                  boxShadow: alpcMsgSize === "medium" ? "0 4px 12px rgba(234,88,12,0.2)" : "none"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.4rem" }}>
                    2. Larger Messages (&gt; 256 B)
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: 0 }}>
                    Passed through a <strong>Section Object</strong> (shared memory region). A small pointer message is sent through the port queue referencing the shared section, avoiding data copying.
                  </p>
                </div>

                <div style={{
                  border: `2px solid #000000`,
                  borderRadius: 10,
                  padding: "1rem",
                  background: alpcMsgSize === "large" ? "#fdf2f8" : "#ffffff",
                  boxShadow: alpcMsgSize === "large" ? "0 4px 12px rgba(219,39,119,0.2)" : "none"
                }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000", marginBottom: "0.4rem" }}>
                    3. Direct Address Space API
                  </div>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.5, margin: 0 }}>
                    When data is too large even for a Section Object, an API allows server processes to read and write directly into the client's address space without intermediary buffering.
                  </p>
                </div>
              </div>

              {/* Windows Architecture Callout */}
              <div style={{
                background: "#f1f5f9",
                border: "2px solid #000000",
                borderRadius: 10,
                padding: "1rem",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#000000"
              }}>
                <strong>Key Architectural Insight: </strong>
                The ALPC facility in Windows is <em>not</em> part of the standard Win32 API and is not directly visible to normal application programmers. Instead, applications invoke standard <strong>Remote Procedure Calls (RPC)</strong>. When an RPC target resides on the local machine, the Windows kernel automatically translates it into an ALPC invocation for maximum performance.
              </div>
            </div>
          )}

          {/* ──────────────── VIEW C: ORIGINAL 3D SVG FLOW (FOR ALL, SHM, MSG, PIPE, SOCKET) ──────────────── */}
          {activeChannel !== "buffer" && activeChannel !== "posix" && activeChannel !== "alpc" && (
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
          )}

          {/* ──────────────── VIEW D: INTERACTIVE BOUNDED BUFFER ──────────────── */}
          {activeChannel === "buffer" && (
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
                      color: bufferItems.length >= 5 ? "#000000" : "#ffffff",
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
                      color: bufferItems.length === 0 ? "#000000" : "#ffffff",
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

      {/* ── IPC Mechanism Comparison Table ── */}
      <div style={{ border: "2px solid #000000", borderRadius: 12, overflow: "hidden", background: "#ffffff" }}>
        <div style={{ background: "#f8fafc", borderBottom: "2px solid #000000", padding: "0.85rem 1.25rem", fontSize: "16px", fontWeight: 900, color: "#000000", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          IPC MECHANISM COMPARISON (SILBERSCHATZ CHAPTER 3)
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
              ["Shared Memory (POSIX)", "~100 ns", "10+ GB/s", "Yes (mutex/sem)", "Redis, video frames, GPU pipelines"],
              ["Windows ALPC", "1–3 µs", "High (Section Obj)", "Kernel handled", "Win32 subsystem, Local RPC services"],
              ["Message Passing", "1–5 µs", "~200 MB/s", "No (Mailbox)", "Android Binder, Mach microkernel ports"],
              ["Pipe (Anonymous FIFO)", "~500 ns", "~1 GB/s", "Partial (blocking)", "Shell pipelines (ls | grep)"],
              ["Socket (TCP/IP)", "5–50 µs", "Varies", "No", "HTTP, microservices, gRPC"]
            ].map((row, idx) => (
              <tr key={idx} style={{ borderBottom: idx < 4 ? "1px solid #000000" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
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