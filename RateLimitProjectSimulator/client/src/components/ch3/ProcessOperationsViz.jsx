import React, { useState, useEffect, useRef } from "react";

const FONT = "'Lexend', sans-serif";

export default function ProcessOperationsViz() {
  const [activeTab, setActiveTab] = useState("tree"); // Default directly to tree or creation
  const [forkStep, setForkStep] = useState(0);
  const [zombieState, setZombieState] = useState("normal"); // "normal", "zombie", "orphan"

  // ─── TREE VISUALIZER STATE & ANIMATIONS ──────────────────────────────
  const [treeStage, setTreeStage] = useState(4); // 0: Kernel Boot (PID 1), 1: Daemons, 2: Sessions/Workers, 3: Shell, 4: Full Tree
  const [autoPlayTree, setAutoPlayTree] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState("4050"); // default to bash
  const [extraSpawned, setExtraSpawned] = useState(false); // student can spawn a custom process
  const treeTimerRef = useRef(null);

  // Auto-play loop for tree hierarchy expansion
  useEffect(() => {
    if (!autoPlayTree) {
      clearTimeout(treeTimerRef.current);
      return;
    }
    treeTimerRef.current = setTimeout(() => {
      setTreeStage((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 2200);
    return () => clearTimeout(treeTimerRef.current);
  }, [autoPlayTree, treeStage]);

  // Tree nodes definition with SVG layout coordinates (880x480 canvas)
  const ALL_TREE_NODES = [
    // Level 0: Root
    {
      id: "1",
      pid: 1,
      ppid: 0,
      name: "systemd",
      fullCmd: "/lib/systemd/systemd --system",
      role: "Root of all Linux processes; adopted parent of all orphans",
      level: 0,
      stageReq: 0,
      icon: "👑",
      x: 440,
      y: 42,
      w: 180,
      h: 46,
      color: "#6d28d9",
      bg: "#f5f3ff",
      user: "root"
    },
    // Level 1: Core Daemons spawned by systemd
    {
      id: "1024",
      pid: 1024,
      ppid: 1,
      name: "sshd daemon",
      fullCmd: "/usr/sbin/sshd -D",
      role: "OpenSSH server listening on port 22 for incoming connections",
      level: 1,
      stageReq: 1,
      icon: "🔒",
      x: 180,
      y: 135,
      w: 160,
      h: 46,
      color: "#1d4ed8",
      bg: "#eff6ff",
      user: "root"
    },
    {
      id: "1100",
      pid: 1100,
      ppid: 1,
      name: "nginx master",
      fullCmd: "nginx: master process /usr/sbin/nginx",
      role: "Web server master process; manages worker thread pool",
      level: 1,
      stageReq: 1,
      icon: "🌐",
      x: 440,
      y: 135,
      w: 160,
      h: 46,
      color: "#b45309",
      bg: "#fffbeb",
      user: "root"
    },
    {
      id: "840",
      pid: 840,
      ppid: 1,
      name: "systemd-logind",
      fullCmd: "/lib/systemd/systemd-logind",
      role: "Manages user logins, seats, and virtual consoles",
      level: 1,
      stageReq: 1,
      icon: "👤",
      x: 700,
      y: 135,
      w: 160,
      h: 46,
      color: "#475569",
      bg: "#f8fafc",
      user: "root"
    },
    // Level 2: Worker sessions & Nginx workers
    {
      id: "3010",
      pid: 3010,
      ppid: 1024,
      name: "sshd [priv]",
      fullCmd: "sshd: student [priv]",
      role: "Privileged child handling remote SSH handshake for student",
      level: 2,
      stageReq: 2,
      icon: "🔑",
      x: 180,
      y: 228,
      w: 160,
      h: 46,
      color: "#1d4ed8",
      bg: "#eff6ff",
      user: "root"
    },
    {
      id: "1101",
      pid: 1101,
      ppid: 1100,
      name: "nginx worker #1",
      fullCmd: "nginx: worker process (port 80)",
      role: "Non-blocking worker servicing client HTTP traffic",
      level: 2,
      stageReq: 2,
      icon: "⚡",
      x: 350,
      y: 228,
      w: 150,
      h: 46,
      color: "#b45309",
      bg: "#fffbeb",
      user: "www-data"
    },
    {
      id: "1102",
      pid: 1102,
      ppid: 1100,
      name: "nginx worker #2",
      fullCmd: "nginx: worker process (port 443)",
      role: "Worker handling TLS encryption and SSL sockets",
      level: 2,
      stageReq: 2,
      icon: "⚡",
      x: 520,
      y: 228,
      w: 150,
      h: 46,
      color: "#b45309",
      bg: "#fffbeb",
      user: "www-data"
    },
    {
      id: "1220",
      pid: 1220,
      ppid: 840,
      name: "login session",
      fullCmd: "/bin/login -- student",
      role: "TTY1 virtual console login prompt",
      level: 2,
      stageReq: 2,
      icon: "🖥️",
      x: 700,
      y: 228,
      w: 160,
      h: 46,
      color: "#475569",
      bg: "#f8fafc",
      user: "root"
    },
    // Level 3: Interactive Shell
    {
      id: "4050",
      pid: 4050,
      ppid: 3010,
      name: "bash shell",
      fullCmd: "-bash",
      role: "Interactive command shell reading user keystrokes from pts/0",
      level: 3,
      stageReq: 3,
      icon: "💻",
      x: 180,
      y: 320,
      w: 160,
      h: 46,
      color: "#047857",
      bg: "#ecfdf5",
      user: "student"
    },
    // Level 4: Spawned child commands under bash
    {
      id: "4051",
      pid: 4051,
      ppid: 4050,
      name: "python server.py",
      fullCmd: "python3 server.py --port 5000",
      role: "Backend API application spawned via fork() + exec()",
      level: 4,
      stageReq: 4,
      icon: "🐍",
      x: 100,
      y: 412,
      w: 150,
      h: 46,
      color: "#047857",
      bg: "#ecfdf5",
      user: "student"
    },
    {
      id: "4052",
      pid: 4052,
      ppid: 4050,
      name: "ps -ef --forest",
      fullCmd: "ps -ef --forest",
      role: "Current CLI command inspecting and outputting the tree",
      level: 4,
      stageReq: 4,
      icon: "🌲",
      x: 270,
      y: 412,
      w: 150,
      h: 46,
      color: "#be185d",
      bg: "#fdf2f8",
      user: "student"
    }
  ];

  // Optional student-spawned process
  const EXTRA_NODE = {
    id: "4053",
    pid: 4053,
    ppid: 4050,
    name: "grep 'ERROR'",
    fullCmd: "grep --color=auto ERROR logs.txt",
    role: "Dynamically spawned child filter command",
    level: 4,
    stageReq: 4,
    icon: "🔍",
    x: 440,
    y: 412,
    w: 150,
    h: 46,
    color: "#2563eb",
    bg: "#eff6ff",
    user: "student"
  };

  const visibleNodes = ALL_TREE_NODES.filter((n) => n.stageReq <= treeStage);
  if (extraSpawned && treeStage >= 4) {
    visibleNodes.push(EXTRA_NODE);
  }

  // Branch lines: connect parent node center-bottom to child node center-top
  const EDGES = [
    { from: "1", to: "1024" },
    { from: "1", to: "1100" },
    { from: "1", to: "840" },
    { from: "1024", to: "3010" },
    { from: "1100", to: "1101" },
    { from: "1100", to: "1102" },
    { from: "840", to: "1220" },
    { from: "3010", to: "4050" },
    { from: "4050", to: "4051" },
    { from: "4050", to: "4052" }
  ];

  if (extraSpawned) {
    EDGES.push({ from: "4050", to: "4053" });
  }

  const visibleEdges = EDGES.filter((edge) => {
    const parentNode = visibleNodes.find((n) => n.id === edge.from);
    const childNode = visibleNodes.find((n) => n.id === edge.to);
    return parentNode && childNode;
  });

  const selectedNode = (extraSpawned && selectedNodeId === "4053")
    ? EXTRA_NODE
    : ALL_TREE_NODES.find((n) => n.id === selectedNodeId) || ALL_TREE_NODES[0];

  const STAGE_DESCRIPTIONS = [
    "Stage 1/5: Linux Kernel Boots ➔ Kernel executes /lib/systemd/systemd as PID 1 (PPID 0). It is the sole root of all processes.",
    "Stage 2/5: systemd forks Core Daemons ➔ systemd calls fork() + exec() to launch SSH daemon (PID 1024), Nginx (PID 1100), and Logind (PID 840).",
    "Stage 3/5: Daemons fork Worker Sessions ➔ Incoming SSH request arrives; sshd spawns privileged handler (PID 3010); Nginx forks worker processes.",
    "Stage 4/5: User Shell Initialized ➔ sshd worker authenticates student and executes -bash (PID 4050) as an interactive PTS session.",
    "Stage 5/5: Full Tree Operational ➔ Student runs commands ($ python server.py and $ ps -ef); bash forks child processes concurrently."
  ];

  // ─── TAB 1: FORK / EXEC STEPS DATA ──────────────────────────────────
  const FORK_STEPS = [
    {
      title: "1. Parent Invokes fork() System Call",
      code: `pid_t pid = fork();\n// OS duplicates parent PCB & allocates new PID`,
      parentState: "Calling fork() system call",
      childState: "Does not exist yet",
      detail: "The kernel traps the call. It creates a brand new PCB, assigns a new unique PID, and establishes page tables.",
      highlight: "fork"
    },
    {
      title: "2. Address Space Duplicated via Copy-on-Write (CoW)",
      code: `// Child receives PID 0\n// Parent receives child PID (e.g., 3450)`,
      parentState: "PID: 3449 (Executing concurrently)",
      childState: "PID: 3450 (Ready in memory)",
      detail: "Child memory pages point to identical physical parent pages marked read-only. Physical copying only occurs if one writes.",
      highlight: "cow"
    },
    {
      title: "3. Child Invokes exec() to Replace Image",
      code: `if (pid == 0) {\n  execlp("/bin/ls", "ls", NULL);\n}`,
      parentState: "Parent invokes wait(&status)",
      childState: "New binary /bin/ls loaded",
      detail: "The exec() call overwrites the child text, data, heap, and stack segments with the new binary. The PID remains 3450!",
      highlight: "exec"
    },
    {
      title: "4. Child Exits & Parent Collects Status via wait()",
      code: `exit(0); // Child terminates\nwait(&status); // Parent reaps PCB`,
      parentState: "Reaped child exit code cleanly!",
      childState: "Terminated & PCB destroyed",
      detail: "Parent's wait() unblocks. The OS deletes the child PCB from the process table. Zero zombie remnants left.",
      highlight: "wait"
    }
  ];

  return (
    <div style={{ fontFamily: FONT, color: "#000000", maxWidth: 1220, margin: "0 auto", padding: "1.25rem" }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #047857 0%, #059669 60%, #10b981 100%)",
        borderRadius: 16,
        padding: "1.75rem 2rem",
        marginBottom: "1.75rem",
        color: "#ffffff"
      }}>
        <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#a7f3d0", marginBottom: "0.3rem" }}>
          Chapter 3 · Topic 4
        </div>
        <h1 style={{ fontSize: "18px", fontWeight: 900, margin: "0 0 0.5rem 0", color: "#ffffff", lineHeight: 1.2 }}>
          Operations on Processes: Creation, UNIX Hierarchy Tree, Zombies &amp; Orphans
        </h1>
        <p style={{ fontSize: "14px", color: "#ffffff", opacity: 0.95, margin: 0, lineHeight: 1.6 }}>
          Explore the living hierarchy of processes: watch how PID 1 spawns daemons, sessions, and shells with real-time branching animations.
        </p>
      </div>

      {/* ── Sub-navigation ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "2px solid #000000", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
        {[
          { id: "tree", label: "1. The UNIX Hierarchy Tree (ps -ef --forest)", icon: "🌳" },
          { id: "creation", label: "2. Process Creation (fork + exec)", icon: "🌱" },
          { id: "zombie", label: "3. Termination: Zombies & Orphans", icon: "🧟" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#000000" : "#ffffff",
              color: activeTab === tab.id ? "#ffffff" : "#000000",
              border: "2px solid #000000",
              borderRadius: 8,
              padding: "0.55rem 1.25rem",
              fontWeight: 800,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "all 0.15s"
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: THE PROCESS HIERARCHY TREE ── */}
      {activeTab === "tree" && (
        <div>
          {/* Header & Sub-banner */}
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              UNIX Hierarchy: Tree of Processes (ps -ef --forest)
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.6 }}>
              Every process in Linux (except PID 1) is born through a parent process via <code>fork()</code>. This creates a directed parent-child tree. Click any node to inspect its lineage.
            </p>
          </div>

          {/* Interactive Animation Control Strip */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff",
            border: "2px solid #000000",
            borderRadius: 12,
            padding: "0.85rem 1.25rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
                Tree Animation:
              </span>
              <button
                onClick={() => setAutoPlayTree(!autoPlayTree)}
                style={{
                  background: autoPlayTree ? "#dc2626" : "#047857",
                  color: "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.9rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {autoPlayTree ? "⏸ Pause Spawning" : "▶ Auto-Play Tree Growth"}
              </button>
              <button
                onClick={() => { setAutoPlayTree(false); setTreeStage((prev) => Math.max(0, prev - 1)); }}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.85rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ⏮ Prev Stage
              </button>
              <button
                onClick={() => { setAutoPlayTree(false); setTreeStage((prev) => Math.min(4, prev + 1)); }}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.85rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ⏭ Next Stage
              </button>
              <button
                onClick={() => { setAutoPlayTree(false); setTreeStage(0); setExtraSpawned(false); }}
                style={{
                  background: "#ffffff",
                  color: "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.85rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                ↺ Reset to Boot
              </button>
            </div>

            {/* Interactive Student Action Buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  setTreeStage(4);
                  setExtraSpawned(!extraSpawned);
                  if (!extraSpawned) setSelectedNodeId("4053");
                }}
                style={{
                  background: extraSpawned ? "#fef08a" : "#2563eb",
                  color: extraSpawned ? "#000000" : "#ffffff",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.4rem 0.9rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {extraSpawned ? "✕ Terminate Spawned Child" : "🌱 Fork New Child from bash"}
              </button>
            </div>
          </div>

          {/* Dynamic Explanatory Banner */}
          <div style={{
            background: "#eff6ff",
            border: "2px solid #000000",
            borderRadius: 10,
            padding: "0.75rem 1.25rem",
            fontSize: "14px",
            fontWeight: 800,
            color: "#000000",
            marginBottom: "1.5rem"
          }}>
            {STAGE_DESCRIPTIONS[treeStage]}
          </div>

          {/* ── 2-Column Split: True SVG Tree Structure on Left/Center + Terminal & Inspector on Right ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start", marginBottom: "2rem" }}>
            {/* SVG Tree Canvas */}
            <div style={{
              background: "#ffffff",
              border: "2px solid #000000",
              borderRadius: 16,
              padding: "1rem",
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#000000", textTransform: "uppercase" }}>
                  Visual Hierarchy Diagram
                </span>
                <span style={{ fontSize: "14px", color: "#000000", fontWeight: 700 }}>
                  Showing {visibleNodes.length} Active Processes
                </span>
              </div>

              <svg viewBox="0 0 880 475" style={{ width: "100%", height: "auto", display: "block" }}>
                <defs>
                  {/* Arrow marker for tree edges */}
                  <marker id="tree-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                    <polygon points="0 0, 7 3.5, 0 7" fill="#000000" />
                  </marker>

                  {/* Pulsing glow animation filter */}
                  <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Draw Hierarchical Connector Lines with Orthogonal Elbows */}
                {visibleEdges.map((edge, idx) => {
                  const parent = visibleNodes.find((n) => n.id === edge.from);
                  const child = visibleNodes.find((n) => n.id === edge.to);
                  if (!parent || !child) return null;

                  const startX = parent.x;
                  const startY = parent.y + parent.h / 2;
                  const endX = child.x;
                  const endY = child.y - child.h / 2;
                  const midY = startY + (endY - startY) * 0.45;

                  const isPathSelected = selectedNode && (selectedNode.id === child.id || selectedNode.id === parent.id);

                  return (
                    <g key={idx}>
                      {/* Tree branch line */}
                      <path
                        d={`M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`}
                        stroke="#000000"
                        strokeWidth={isPathSelected ? "3" : "2"}
                        fill="none"
                        markerEnd="url(#tree-arrow)"
                        strokeDasharray={isPathSelected ? "none" : "none"}
                      />

                      {/* Animated traveling particle indicating active parent-child relationship */}
                      <circle r="3.5" fill={isPathSelected ? "#2563eb" : "#000000"}>
                        <animateMotion
                          path={`M ${startX} ${startY} V ${midY} H ${endX} V ${endY}`}
                          dur={`${2.2 + (idx % 3) * 0.4}s`}
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>
                  );
                })}

                {/* Draw Tree Nodes */}
                {visibleNodes.map((node) => {
                  const isSelected = selectedNode && selectedNode.id === node.id;
                  const isRoot = node.id === "1";

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      transform={`translate(${node.x - node.w / 2}, ${node.y - node.h / 2})`}
                    >
                      {/* Node Box */}
                      <rect
                        width={node.w}
                        height={node.h}
                        rx="10"
                        fill={isSelected ? "#eff6ff" : node.bg}
                        stroke="#000000"
                        strokeWidth={isSelected ? "3.5" : "2"}
                        filter="url(#node-glow)"
                      />

                      {/* Icon */}
                      <text x="14" y="29" fontSize="16" fontFamily="Lexend">
                        {node.icon}
                      </text>

                      {/* Process Name */}
                      <text
                        x="38"
                        y="22"
                        fontSize="14"
                        fontWeight="900"
                        fill="#000000"
                        fontFamily="Lexend"
                      >
                        {node.name}
                      </text>

                      {/* Badges: PID & PPID */}
                      <text
                        x="38"
                        y="38"
                        fontSize="14"
                        fontWeight="700"
                        fill="#000000"
                        fontFamily="Lexend"
                      >
                        PID: {node.pid} · PPID: {node.ppid}
                      </text>

                      {/* Root badge if systemd */}
                      {isRoot && (
                        <rect
                          x={node.w - 52}
                          y="6"
                          width="46"
                          height="16"
                          rx="4"
                          fill="#6d28d9"
                        />
                      )}
                      {isRoot && (
                        <text
                          x={node.w - 29}
                          y="18"
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="900"
                          fill="#ffffff"
                          fontFamily="Lexend"
                        >
                          ROOT
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right Column: Node Inspector & Simulated Terminal Forest Output */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Selected Node Details Card */}
              <div style={{
                background: selectedNode.bg,
                border: "2px solid #000000",
                borderRadius: 14,
                padding: "1.25rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000000" }}>
                    {selectedNode.icon} {selectedNode.name}
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 900, background: "#000000", color: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: 6 }}>
                    PID {selectedNode.pid}
                  </span>
                </div>

                <div style={{ fontSize: "14px", color: "#000000", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  {selectedNode.role}
                </div>

                <div style={{ background: "#ffffff", border: "1.5px solid #000000", borderRadius: 8, padding: "0.75rem", fontSize: "14px", color: "#000000", lineHeight: 1.6 }}>
                  <div><strong>Parent PID (PPID):</strong> {selectedNode.ppid} ({selectedNode.ppid === 0 ? "Kernel Boot" : selectedNode.ppid === 1 ? "systemd" : "Ancestor Daemon"})</div>
                  <div><strong>Execution User:</strong> {selectedNode.user}</div>
                  <div><strong>Full Command:</strong> <code>{selectedNode.fullCmd}</code></div>
                  <div><strong>Tree Depth Level:</strong> Level {selectedNode.level}</div>
                </div>
              </div>

              {/* Linux Terminal View (ps -ef --forest) */}
              <div style={{
                background: "#000000",
                color: "#ffffff",
                border: "2px solid #000000",
                borderRadius: 14,
                padding: "1rem",
                fontFamily: "monospace",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#38bdf8" }}>
                    terminal: $ ps -ef --forest
                  </span>
                </div>

                <div style={{ fontSize: "14px", lineHeight: 1.6, overflowX: "auto" }}>
                  <div style={{ color: "#94a3b8", fontWeight: 800 }}>UID &nbsp; &nbsp; &nbsp;PID &nbsp;PPID &nbsp;CMD</div>
                  {visibleNodes.map((n) => {
                    const isCur = selectedNode && selectedNode.id === n.id;
                    const indent = n.level === 0 ? "" : "  ".repeat(n.level) + "\\_ ";

                    return (
                      <div
                        key={n.id}
                        onClick={() => setSelectedNodeId(n.id)}
                        style={{
                          background: isCur ? "#1e3a8a" : "transparent",
                          color: isCur ? "#ffffff" : "#f8fafc",
                          padding: "0.15rem 0.3rem",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: isCur ? 900 : 500
                        }}
                      >
                        {n.user.padEnd(8)} {String(n.pid).padStart(4)} {String(n.ppid).padStart(5)} &nbsp;{indent}{n.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PROCESS CREATION (FORK + EXEC) ── */}
      {activeTab === "creation" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              UNIX Process Creation Flow: fork() followed by exec()
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.6 }}>
              UNIX separates process creation into two distinct system calls: <code>fork()</code> to clone address space, and <code>exec()</code> to replace the memory image with a new executable.
            </p>
          </div>

          {/* Stepper buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {FORK_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setForkStep(idx)}
                style={{
                  flex: 1,
                  background: forkStep === idx ? "#000000" : "#ffffff",
                  color: forkStep === idx ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Step {idx + 1}
              </button>
            ))}
          </div>

          {/* Active Step Card */}
          {(() => {
            const cur = FORK_STEPS[forkStep];
            return (
              <div style={{
                background: "#f0fdf4",
                border: "2px solid #000000",
                borderRadius: 16,
                padding: "1.75rem",
                display: "grid",
                gridTemplateColumns: "1.2fr 1fr",
                gap: "1.5rem",
                marginBottom: "2rem"
              }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                    {cur.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
                    {cur.detail}
                  </p>

                  <div style={{
                    background: "#000000",
                    color: "#ffffff",
                    padding: "0.85rem 1.1rem",
                    borderRadius: 10,
                    fontFamily: "monospace",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap"
                  }}>
                    {cur.code}
                  </div>
                </div>

                {/* Visual Boxes: Parent & Child */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", justifyContent: "center" }}>
                  <div style={{
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 12,
                    padding: "1rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#000000", fontSize: "16px" }}>Parent Process (PID 3449)</span>
                      <span style={{ fontSize: "14px", background: "#dbeafe", color: "#000000", padding: "0.2rem 0.5rem", borderRadius: 8, fontWeight: 800 }}>
                        {cur.parentState}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "16px", color: "#000000", fontWeight: 900 }}>
                    {forkStep === 0 ? "⏳ Preparing Fork..." : "↓ Duplicated via fork() ↓"}
                  </div>

                  <div style={{
                    background: forkStep === 0 ? "#f8fafc" : "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 12,
                    padding: "1rem",
                    opacity: forkStep === 0 ? 0.6 : 1
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#000000", fontSize: "16px" }}>Child Process (PID 3450)</span>
                      <span style={{ fontSize: "14px", background: forkStep === 0 ? "#e2e8f0" : "#d1fae5", color: "#000000", padding: "0.2rem 0.5rem", borderRadius: 8, fontWeight: 800 }}>
                        {cur.childState}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 3: ZOMBIES VS ORPHANS ── */}
      {activeTab === "zombie" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 0.35rem 0", color: "#000000" }}>
              Process Termination Edge Cases: Zombies vs. Orphans
            </h2>
            <p style={{ fontSize: "14px", color: "#000000", margin: 0, lineHeight: 1.6 }}>
              A critical exam concept: What happens when a child terminates before its parent, or a parent terminates before its child?
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            {[
              { id: "normal", label: "Normal Reaping (wait() called)" },
              { id: "zombie", label: "Zombie Process 🧟" },
              { id: "orphan", label: "Orphan Process 🐣" }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setZombieState(btn.id)}
                style={{
                  background: zombieState === btn.id ? "#000000" : "#ffffff",
                  color: zombieState === btn.id ? "#ffffff" : "#000000",
                  border: "2px solid #000000",
                  borderRadius: 8,
                  padding: "0.55rem 1.15rem",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div style={{
            background: zombieState === "zombie" ? "#fef2f2" : zombieState === "orphan" ? "#eff6ff" : "#f0fdf4",
            border: "2px solid #000000",
            borderRadius: 16,
            padding: "1.75rem",
            marginBottom: "1.5rem"
          }}>
            {zombieState === "normal" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  ✅ Normal Execution: Proper Reaping with wait()
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: 0 }}>
                  Child terminates and calls exit(). The parent concurrently calls wait(&amp;status). The OS delivers the exit code to the parent and cleans up the child PCB immediately.
                </p>
              </div>
            )}

            {zombieState === "zombie" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  🧟 The Zombie Process (Terminated but Unreaped)
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: "0 0 0.75rem 0" }}>
                  A process that has finished execution (called exit()), but whose <strong>parent has not yet invoked wait()</strong>.
                </p>
                <div style={{ background: "#ffffff", border: "1.5px solid #000000", padding: "0.85rem", borderRadius: 8, fontSize: "14px", color: "#000000" }}>
                  <strong>⚠️ The Danger:</strong> Although the zombie consumes no CPU or memory, its <strong>PID entry in the kernel process table cannot be released</strong>. If a parent continuously spawns processes without reaping, the PID table fills up and no other program can start!
                </div>
              </div>
            )}

            {zombieState === "orphan" && (
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#000000", margin: "0 0 0.5rem 0" }}>
                  🐣 The Orphan Process (Parent Died First)
                </h3>
                <p style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7, margin: "0 0 0.75rem 0" }}>
                  A running child process whose <strong>parent process has already terminated</strong> (crashed or completed).
                </p>
                <div style={{ background: "#ffffff", border: "1.5px solid #000000", padding: "0.85rem", borderRadius: 8, fontSize: "14px", color: "#000000" }}>
                  <strong>🛡️ OS Resolution:</strong> Linux automatically re-parents the orphan to <code>systemd / init</code> (PID 1). Init periodically executes wait() to reap terminating orphans, preventing orphan zombies!
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
