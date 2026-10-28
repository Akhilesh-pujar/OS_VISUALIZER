import React, { useState } from "react";

const FONT = "'Lexend', sans-serif";

const QUESTIONS = [
  {
    q: "What is the primary difference between a 'Program' and a 'Process'?",
    options: [
      "A program is written in high-level code, while a process is machine bytecode.",
      "A program is a passive binary file on disk; a process is an active program in execution loaded in RAM.",
      "A program requires a GPU; a process runs only on a physical CPU core.",
      "A program has an OS Process Control Block (PCB); a process does not."
    ],
    correct: 1,
    explanation: "A program is a passive entity (executable binary stored on disk). When loaded into RAM and allocated hardware resources and a PID by the OS kernel, it becomes an active process."
  },
  {
    q: "Which memory segment grows upward towards higher memory addresses when malloc() or new() is invoked?",
    options: [
      "The Stack segment",
      "The Text segment",
      "The Heap segment",
      "The BSS segment"
    ],
    correct: 2,
    explanation: "The Heap segment handles dynamic runtime memory allocation and grows upward (towards higher memory addresses), while the Stack segment grows downward."
  },
  {
    q: "Which scheduler is responsible for controlling the 'Degree of Multiprogramming'?",
    options: [
      "Short-Term Scheduler (CPU Scheduler)",
      "Medium-Term Scheduler (Swapper)",
      "Long-Term Scheduler (Job Scheduler)",
      "I/O Device Driver Interrupt Handler"
    ],
    correct: 2,
    explanation: "The Long-Term Scheduler selects processes from secondary disk storage into main memory, thereby directly controlling the total number of processes residing in RAM."
  },
  {
    q: "Why is a CPU Context Switch considered 'pure system overhead'?",
    options: [
      "Because it overheats the physical CPU silicon package.",
      "Because the CPU executes zero productive user work while saving and restoring Process Control Blocks (PCBs).",
      "Because it permanently clears random user cache files.",
      "Because it requires rebooting the operating system kernel."
    ],
    correct: 1,
    explanation: "During a context switch, the CPU solely executes kernel routines to snapshot registers and reload the next process state. No useful user execution happens during this time."
  },
  {
    q: "What is the key consequence if a child process terminates with exit(), but its parent never invokes wait()?",
    options: [
      "The child process becomes an Orphan and is killed immediately.",
      "The child process becomes a Zombie, retaining its PID and entry in the kernel process table.",
      "The operating system crashes with an unrecoverable kernel panic.",
      "The child process automatically restarts from main()."
    ],
    correct: 1,
    explanation: "A terminated process whose parent has not called wait() is a Zombie. Its entry in the kernel process table remains allocated so the parent can read its exit status code."
  },
  {
    q: "Between Shared Memory and Message Passing IPC, which model provides maximum data transfer speed?",
    options: [
      "Message Passing, because it uses system calls.",
      "Shared Memory, because processes read/write directly to RAM without kernel intervention after setup.",
      "Both models have identical speed.",
      "Neither model allows communication on the same machine."
    ],
    correct: 1,
    explanation: "Shared Memory operates at hardware memory speeds (~100 ns) with zero data copies. Message Passing requires kernel context switches and multiple memory buffer copies."
  }
];

export default function ProcessQuizInteractive() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const handleSelect = (idx) => {
    if (showAnswer) return;
    setSelectedOpt(idx);
    setShowAnswer(true);
    if (idx === QUESTIONS[currentIdx].correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setShowAnswer(false);
    if (currentIdx + 1 < QUESTIONS.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setShowAnswer(false);
    setQuizFinished(false);
  };

  const q = QUESTIONS[currentIdx];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1040, margin: "0 auto", padding: "1.5rem" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
        borderRadius: 16,
        padding: "1.75rem 2rem",
        marginBottom: "2rem",
        color: "#ffffff"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#38bdf8", marginBottom: "0.3rem" }}>
          Student Mastery Assessment
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#ffffff", lineHeight: 1.2 }}>
          Chapter 3: Process Management Knowledge Check
        </h1>
        <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, margin: 0, lineHeight: 1.6 }}>
          Test your mastery of memory segments, 5-state transitions, scheduling queues, context switches, zombies, and IPC mechanisms.
        </p>
      </div>

      {!quizFinished ? (
        <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 16, padding: "2rem", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          {/* Progress Indicator */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#000000" }}>
              Question {currentIdx + 1} of {QUESTIONS.length}
            </span>
            <span style={{ background: "#eff6ff", border: "1.5px solid #000000", color: "#000000", fontWeight: 800, fontSize: "14px", padding: "0.25rem 0.75rem", borderRadius: 20 }}>
              Score: {score}
            </span>
          </div>

          <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 4, marginBottom: "1.75rem", overflow: "hidden", border: "1px solid #000000" }}>
            <div style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%`, height: "100%", background: "#2563eb", transition: "width 0.3s" }} />
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", lineHeight: 1.4, margin: "0 0 1.5rem 0" }}>
            {q.q}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {q.options.map((opt, idx) => {
              let btnBg = "#ffffff";
              let btnBorder = "#000000";

              if (showAnswer) {
                if (idx === q.correct) {
                  btnBg = "#ecfdf5";
                  btnBorder = "#059669";
                } else if (idx === selectedOpt) {
                  btnBg = "#fef2f2";
                  btnBorder = "#dc2626";
                }
              } else if (selectedOpt === idx) {
                btnBg = "#eff6ff";
                btnBorder = "#2563eb";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={showAnswer}
                  style={{
                    background: btnBg,
                    border: `2px solid ${btnBorder}`,
                    color: "#000000",
                    borderRadius: 12,
                    padding: "1rem 1.25rem",
                    textAlign: "left",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: showAnswer ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: showAnswer && idx === q.correct ? "#059669" : showAnswer && idx === selectedOpt ? "#dc2626" : "#000000",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "14px",
                    flexShrink: 0
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          {showAnswer && (
            <div style={{
              background: selectedOpt === q.correct ? "#f0fdf4" : "#fef2f2",
              border: "2px solid #000000",
              borderRadius: 12,
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem"
            }}>
              <div style={{ fontWeight: 900, fontSize: "16px", color: "#000000", marginBottom: "0.3rem" }}>
                {selectedOpt === q.correct ? "🎉 Correct Answer!" : "❌ Incorrect"}
              </div>
              <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: 0 }}>
                {q.explanation}
              </p>
            </div>
          )}

          {showAnswer && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handleNext}
                style={{
                  background: "#000000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  padding: "0.75rem 1.75rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {currentIdx + 1 < QUESTIONS.length ? "Next Question ➔" : "View Final Score 🏆"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "2px solid #000000", borderRadius: 16, padding: "2.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
            {score >= 5 ? "🎖️" : score >= 3 ? "👏" : "📚"}
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#000000", margin: "0 0 0.5rem 0" }}>
            Assessment Complete!
          </h2>
          <p style={{ fontSize: "16px", color: "#000000", margin: "0 0 1.5rem 0" }}>
            You scored <strong>{score}</strong> out of <strong>{QUESTIONS.length}</strong>!
          </p>

          <div>
            <button
              onClick={handleRestart}
              style={{
                background: "#000000",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "0.75rem 1.75rem",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              🔄 Retake Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
