import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const FONT = "'Times New Roman', Times, serif";

/**
 * 3D Real-World Classroom Synchronization Visualizer
 *
 * Real-world analogy:
 * - Classroom = Critical Section (CS)
 * - Door & Key = Entry / Exit Protocol (Peterson's algorithm or Mutex)
 * - Whiteboard = Shared Memory Data
 * - Teacher 1 (Prof. Turing / P0) & Teacher 2 (Prof. Lovelace / P1) = Concurrent Processes
 * - Hallway = Remainder Section / Waiting Queue
 */
export default function Classroom3DSync() {
  const mountRef = useRef(null);

  // Synchronization State
  const [turn, setTurn] = useState(0); // 0 = P0, 1 = P1
  const [flags, setFlags] = useState([false, false]); // [Teacher 0 wants in, Teacher 1 wants in]
  const [roomOccupant, setRoomOccupant] = useState(null); // null, 0, 1, or 'COLLISION'
  const [doorLocked, setDoorLocked] = useState(false);
  const [boardText, setBoardText] = useState("Math: Euler's Identity: e^(iπ) + 1 = 0");
  const [simLog, setSimLog] = useState([
    "Classroom 101 initialized. Door is unlocked. Both professors are in the hallway."
  ]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // References for 3D objects
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const teacher0Ref = useRef(null);
  const teacher1Ref = useRef(null);
  const doorMeshRef = useRef(null);
  const lockLightRef = useRef(null);
  const boardCanvasRef = useRef(null);
  const boardTextureRef = useRef(null);
  const animFrameRef = useRef(null);

  const addLog = (msg) => setSimLog((prev) => [msg, ...prev.slice(0, 8)]);

  // 3D Scene Initialization
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = 480;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    // Camera (Isometric angle overlooking classroom and hallway)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Warm classroom ceiling lamp
    const roomLight = new THREE.PointLight(0xfffbeb, 1.2, 15);
    roomLight.position.set(0, 5, -2);
    scene.add(roomLight);

    // Lock indicator light over door
    const lockLight = new THREE.PointLight(0x22c55e, 2, 6);
    lockLight.position.set(0, 3.2, 3);
    scene.add(lockLight);
    lockLightRef.current = lockLight;

    // ── Floor & Architecture ──
    // Classroom Floor (Dark polished wood)
    const roomFloorGeo = new THREE.PlaneGeometry(12, 10);
    const roomFloorMat = new THREE.MeshStandardMaterial({ color: 0xecd9c6, roughness: 0.6 });
    const roomFloor = new THREE.Mesh(roomFloorGeo, roomFloorMat);
    roomFloor.rotation.x = -Math.PI / 2;
    roomFloor.position.set(0, 0, -2);
    roomFloor.receiveShadow = true;
    scene.add(roomFloor);

    // Hallway Floor (Clean grey tile)
    const hallFloorGeo = new THREE.PlaneGeometry(14, 6);
    const hallFloorMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.5 });
    const hallFloor = new THREE.Mesh(hallFloorGeo, hallFloorMat);
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.set(0, -0.01, 6);
    hallFloor.receiveShadow = true;
    scene.add(hallFloor);

    // Dividing Wall with Door opening
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    // Left Wall Section
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4, 0.4), wallMat);
    leftWall.position.set(-3.6, 2, 3);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right Wall Section
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4, 0.4), wallMat);
    rightWall.position.set(3.6, 2, 3);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Lintel above door
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.4), wallMat);
    lintel.position.set(0, 3.4, 3);
    scene.add(lintel);

    // Door Mesh
    const doorGeo = new THREE.BoxGeometry(2.2, 2.8, 0.15);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.5 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.4, 3);
    scene.add(door);
    doorMeshRef.current = door;

    // Room Back Wall with Blackboard
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 0.4), wallMat);
    backWall.position.set(0, 2, -7);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Dynamic Canvas Blackboard
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    boardCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.fillText("CLASSROOM 101 - WHITEBOARD", 256, 40);
    ctx.font = '20px "Times New Roman"';
    ctx.fillText("Math: Euler's Identity: e^(iπ) + 1 = 0", 256, 120);

    const boardTexture = new THREE.CanvasTexture(canvas);
    boardTextureRef.current = boardTexture;

    const boardGeo = new THREE.PlaneGeometry(6, 2.4);
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTexture });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 2.2, -6.75);
    scene.add(board);

    // Teacher Podium & Desks
    const podiumMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const podium = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1), podiumMat);
    podium.position.set(0, 0.55, -4.5);
    podium.castShadow = true;
    scene.add(podium);

    // Student Desks in Classroom
    const deskMat = new THREE.MeshStandardMaterial({ color: 0xa16207 });
    for (let x = -3; x <= 3; x += 3) {
      for (let z = -2; z <= 0; z += 2) {
        const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.9), deskMat);
        desk.position.set(x, 0.4, z);
        desk.castShadow = true;
        scene.add(desk);
      }
    }

    // ── 3D Teacher Avatars ──
    // Teacher 0: Prof. Turing (P0, Blue Suit)
    const t0Group = new THREE.Group();
    const t0BodyMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const t0Body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), t0BodyMat);
    t0Body.position.y = 0.9;
    t0Body.castShadow = true;
    t0Group.add(t0Body);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8 });
    const t0Head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), headMat);
    t0Head.position.y = 1.7;
    t0Head.castShadow = true;
    t0Group.add(t0Head);
    t0Group.position.set(-3.5, 0, 6); // Waiting in hallway
    scene.add(t0Group);
    teacher0Ref.current = t0Group;

    // Teacher 1: Prof. Lovelace (P1, Green/Teal Suit)
    const t1Group = new THREE.Group();
    const t1BodyMat = new THREE.MeshStandardMaterial({ color: 0x059669 });
    const t1Body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16), t1BodyMat);
    t1Body.position.y = 0.9;
    t1Body.castShadow = true;
    t1Group.add(t1Body);
    const t1Head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), headMat);
    t1Head.position.y = 1.7;
    t1Head.castShadow = true;
    t1Group.add(t1Head);
    t1Group.position.set(3.5, 0, 6); // Waiting in hallway
    scene.add(t1Group);
    teacher1Ref.current = t1Group;

    // Animation Loop
    let t = 0;
    const animate = () => {
      t += 0.02;

      // Gentle floating indicator over active teacher
      if (teacher0Ref.current) {
        teacher0Ref.current.rotation.y = Math.sin(t * 1.5) * 0.1;
      }
      if (teacher1Ref.current) {
        teacher1Ref.current.rotation.y = Math.cos(t * 1.5) * 0.1;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      rendererRef.current.setSize(w, height);
      cameraRef.current.aspect = w / height;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Blackboard Canvas Texture
  const updateBoard = (text) => {
    setBoardText(text);
    if (!boardCanvasRef.current || !boardTextureRef.current) return;
    const ctx = boardCanvasRef.current.getContext('2d');
    ctx.fillStyle = '#1e3a1e';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.fillText("CLASSROOM 101 - WHITEBOARD", 256, 40);
    ctx.font = '20px "Times New Roman"';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(text, 256, 130);
    boardTextureRef.current.needsUpdate = true;
  };

  // 3D Avatar Smooth Lerp Motion
  const moveAvatar = (avatarRef, targetPos, targetRotY = 0, onComplete) => {
    if (!avatarRef.current) return;
    const startX = avatarRef.current.position.x;
    const startZ = avatarRef.current.position.z;
    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease in-out
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      avatarRef.current.position.x = startX + (targetPos.x - startX) * ease;
      avatarRef.current.position.z = startZ + (targetPos.z - startZ) * ease;
      avatarRef.current.rotation.y = targetRotY;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (onComplete) {
        onComplete();
      }
    };
    requestAnimationFrame(step);
  };

  // Animate Door Opening / Closing
  const setDoorOpen = (isOpen) => {
    if (!doorMeshRef.current || !lockLightRef.current) return;
    const targetY = isOpen ? 0.3 : 1.4;
    doorMeshRef.current.position.y = targetY; // Slides up when open
    lockLightRef.current.color.setHex(isOpen ? 0xef4444 : 0x22c55e); // Red when occupied, Green when free
    setDoorLocked(isOpen);
  };

  // ── Actions: Teacher 0 (Prof. Turing) Enters Classroom ──
  const turingEnter = () => {
    if (roomOccupant !== null) {
      addLog("⚠️ Door is locked! Another professor is currently teaching in Classroom 101!");
      return;
    }
    setFlags([true, flags[1]]);
    setTurn(1); // Polite courtesy to P1
    addLog("Prof. Turing (P0): Expressed desire to teach (flag[0] = true). Sets turn = 1.");

    // Check if Teacher 1 is already inside
    if (flags[1] && turn === 1) {
      addLog("⏳ Prof. Turing (P0) is waiting in the hallway because Prof. Lovelace has priority!");
      return;
    }

    // Walks through door to podium
    setDoorOpen(true);
    moveAvatar(teacher0Ref, { x: 0, z: 3 }, 0, () => {
      moveAvatar(teacher0Ref, { x: 0, z: -3.5 }, 0, () => {
        setRoomOccupant(0);
        updateBoard("Prof. Turing: Teaching Halting Problem & Automata");
        addLog("🟢 Prof. Turing entered Classroom 101! Teaching at the whiteboard.");
      });
    });
  };

  const turingExit = () => {
    if (roomOccupant !== 0) return;
    addLog("Prof. Turing: Finished lecture. Erases board and leaves classroom.");
    updateBoard("Board Cleaned. Room 101 is now vacant.");
    moveAvatar(teacher0Ref, { x: 0, z: 3 }, Math.PI, () => {
      moveAvatar(teacher0Ref, { x: -3.5, z: 6 }, 0, () => {
        setRoomOccupant(null);
        setFlags([false, flags[1]]);
        setDoorOpen(false);
        addLog("🔓 Door unlocked! Classroom 101 is available for next professor.");
      });
    });
  };

  // ── Actions: Teacher 1 (Prof. Lovelace) Enters Classroom ──
  const lovelaceEnter = () => {
    if (roomOccupant !== null) {
      addLog("⚠️ Door is locked! Another professor is currently teaching in Classroom 101!");
      return;
    }
    setFlags([flags[0], true]);
    setTurn(0); // Polite courtesy to P0
    addLog("Prof. Lovelace (P1): Expressed desire to teach (flag[1] = true). Sets turn = 0.");

    if (flags[0] && turn === 0) {
      addLog("⏳ Prof. Lovelace (P1) is waiting in the hallway because Prof. Turing has priority!");
      return;
    }

    setDoorOpen(true);
    moveAvatar(teacher1Ref, { x: 0, z: 3 }, 0, () => {
      moveAvatar(teacher1Ref, { x: 0, z: -3.5 }, 0, () => {
        setRoomOccupant(1);
        updateBoard("Prof. Lovelace: Teaching Analytical Engine Algorithms");
        addLog("🟢 Prof. Lovelace entered Classroom 101! Teaching at the whiteboard.");
      });
    });
  };

  const lovelaceExit = () => {
    if (roomOccupant !== 1) return;
    addLog("Prof. Lovelace: Finished lecture. Erases board and leaves classroom.");
    updateBoard("Board Cleaned. Room 101 is now vacant.");
    moveAvatar(teacher1Ref, { x: 0, z: 3 }, Math.PI, () => {
      moveAvatar(teacher1Ref, { x: 3.5, z: 6 }, 0, () => {
        setRoomOccupant(null);
        setFlags([flags[0], false]);
        setDoorOpen(false);
        addLog("🔓 Door unlocked! Classroom 101 is available for next professor.");
      });
    });
  };

  // ── Race Condition Collision Hazard Test ──
  const triggerRaceHazard = () => {
    addLog("🚨 SIMULATING RACE HAZARD: Bypassing locks! Both professors enter simultaneously!");
    setDoorOpen(true);
    moveAvatar(teacher0Ref, { x: -1.2, z: -3.5 }, 0);
    moveAvatar(teacher1Ref, { x: 1.2, z: -3.5 }, 0, () => {
      setRoomOccupant('COLLISION');
      updateBoard("FATAL ERROR: OVERWRITING WHITEBOARD CONCURRENTLY!");
      addLog("💥 COLLISION! Both professors writing on same whiteboard! Data corruption!");
    });
  };

  // Reset 3D positions
  const resetClassroom = () => {
    if (teacher0Ref.current) teacher0Ref.current.position.set(-3.5, 0, 6);
    if (teacher1Ref.current) teacher1Ref.current.position.set(3.5, 0, 6);
    setDoorOpen(false);
    setRoomOccupant(null);
    setFlags([false, false]);
    setTurn(0);
    updateBoard("Math: Euler's Identity: e^(iπ) + 1 = 0");
    setSimLog(["Classroom reset. Both professors in hallway."]);
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '2px solid #000000',
      borderRadius: 12,
      padding: '1.25rem',
      fontFamily: FONT,
      color: '#000000',
      boxShadow: '4px 4px 0px #000000',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      {/* Visualizer Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 0.2rem 0' }}>
            🏛️ 3D Classroom Synchronization Visualizer (Classroom = Critical Section)
          </h3>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            Real-world analogy: Only <strong>one teacher</strong> can teach inside Classroom 101 at a time. The door lock guarantees Mutual Exclusion!
          </div>
        </div>

        {/* Live Lock Status Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: doorLocked ? '#fef2f2' : '#f0fdf4',
          border: `1.5px solid ${doorLocked ? '#dc2626' : '#16a34a'}`,
          borderRadius: 8, padding: '0.35rem 0.85rem',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: doorLocked ? '#dc2626' : '#16a34a' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: doorLocked ? '#991b1b' : '#166534' }}>
            {doorLocked ? 'CLASSROOM OCCUPIED (LOCKED)' : 'CLASSROOM AVAILABLE (UNLOCKED)'}
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: 480,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1.5px solid #000000',
          position: 'relative',
        }}
      />

      {/* Interactive Controls Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
      }}>
        {/* Prof. Turing Controls (P0, Blue) */}
        <div style={{
          background: '#eff6ff', border: '1.5px solid #2563eb',
          borderRadius: 8, padding: '0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1d4ed8' }}>
              🔷 Prof. Turing (Process P0)
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#ffffff', padding: '2px 6px', borderRadius: 4, border: '1px solid #93c5fd' }}>
              flag[0] = {flags[0] ? 'TRUE' : 'FALSE'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={turingEnter}
              disabled={roomOccupant === 0}
              style={{
                flex: 1, background: '#2563eb', color: '#ffffff',
                border: '1.5px solid #000000', borderRadius: 6,
                padding: '0.45rem', fontSize: '12px', fontWeight: 700,
                cursor: roomOccupant === 0 ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
              }}
            >
              Request &amp; Enter Classroom 🚪
            </button>
            <button
              onClick={turingExit}
              disabled={roomOccupant !== 0}
              style={{
                background: '#ffffff', color: '#000000',
                border: '1.5px solid #000000', borderRadius: 6,
                padding: '0.45rem 0.85rem', fontSize: '12px', fontWeight: 700,
                cursor: roomOccupant !== 0 ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
              }}
            >
              Exit Classroom 🔓
            </button>
          </div>
        </div>

        {/* Prof. Lovelace Controls (P1, Green) */}
        <div style={{
          background: '#f0fdf4', border: '1.5px solid #059669',
          borderRadius: 8, padding: '0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#047857' }}>
              🟢 Prof. Lovelace (Process P1)
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#ffffff', padding: '2px 6px', borderRadius: 4, border: '1px solid #86efac' }}>
              flag[1] = {flags[1] ? 'TRUE' : 'FALSE'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={lovelaceEnter}
              disabled={roomOccupant === 1}
              style={{
                flex: 1, background: '#059669', color: '#ffffff',
                border: '1.5px solid #000000', borderRadius: 6,
                padding: '0.45rem', fontSize: '12px', fontWeight: 700,
                cursor: roomOccupant === 1 ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
              }}
            >
              Request &amp; Enter Classroom 🚪
            </button>
            <button
              onClick={lovelaceExit}
              disabled={roomOccupant !== 1}
              style={{
                background: '#ffffff', color: '#000000',
                border: '1.5px solid #000000', borderRadius: 6,
                padding: '0.45rem 0.85rem', fontSize: '12px', fontWeight: 700,
                cursor: roomOccupant !== 1 ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
              }}
            >
              Exit Classroom 🔓
            </button>
          </div>
        </div>
      </div>

      {/* Global Hazard & Reset Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: 8, padding: '0.6rem 0.85rem', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={triggerRaceHazard}
            style={{
              background: '#dc2626', color: '#ffffff',
              border: '1.5px solid #000000', borderRadius: 6,
              padding: '0.4rem 0.85rem', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ⚠️ Force Simultaneous Access (Race Hazard)
          </button>
          <button
            onClick={resetClassroom}
            style={{
              background: '#ffffff', color: '#000000',
              border: '1.5px solid #000000', borderRadius: 6,
              padding: '0.4rem 0.85rem', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ↺ Reset Classroom
          </button>
        </div>

        {/* Real-time shared variable status */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', fontWeight: 700 }}>
          <span>Turn Key: <strong>Prof. P{turn}</strong></span>
          <span>Occupant: <strong>{roomOccupant === null ? 'VACANT' : roomOccupant === 'COLLISION' ? '💥 TWO TEACHERS COLLISION!' : `Prof. P${roomOccupant}`}</strong></span>
        </div>
      </div>

      {/* Event Trace Log */}
      <div style={{
        background: '#0f172a', color: '#f8fafc',
        borderRadius: 8, padding: '0.6rem 0.85rem',
        fontSize: '11px', fontFamily: 'monospace',
        maxHeight: '90px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '3px',
      }}>
        {simLog.map((log, i) => (
          <div key={i} style={{ color: i === 0 ? '#38bdf8' : '#94a3b8' }}>
            › {log}
          </div>
        ))}
      </div>
    </div>
  );
}
