import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const FONT = "'Times New Roman', Times, serif";

export default function DiningPhilosophers3D() {
  const mountRef = useRef(null);
  const N = 5;

  // States: 'thinking' | 'hungry' | 'eating'
  const [philStates, setPhilStates] = useState(Array(N).fill('thinking'));
  const [forkAvailable, setForkAvailable] = useState(Array(N).fill(true));
  const [deadlockTriggered, setDeadlockTriggered] = useState(false);
  const [log, setLog] = useState([
    '3D Dining Philosophers Table initialized. 5 philosophers, 5 forks ready.'
  ]);

  const addLog = (msg) => setLog((prev) => [msg, ...prev.slice(0, 7)]);

  // Three.js References
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const philMeshesRef = useRef([]);
  const forkMeshesRef = useRef([]);
  const tableLightRef = useRef(null);
  const animFrameRef = useRef(null);

  // Initialize 3D Scene
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = 480;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 11, 13);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(8, 15, 8);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const tableLight = new THREE.PointLight(0xfffbeb, 1.5, 12);
    tableLight.position.set(0, 4, 0);
    scene.add(tableLight);
    tableLightRef.current = tableLight;

    // Floor (Checkered Dining Hall)
    const floorGeo = new THREE.PlaneGeometry(18, 18);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Round Dining Table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.4 });
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.35, 32), tableMat);
    tableTop.position.y = 1.6;
    tableTop.receiveShadow = true;
    tableTop.castShadow = true;
    scene.add(tableTop);

    // Tablecloth Center Ring
    const clothMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.05, 32), clothMat);
    cloth.position.y = 1.8;
    scene.add(cloth);

    // Center Rice / Noodle Bowl
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.5, 24), bowlMat);
    bowl.position.y = 2.05;
    bowl.castShadow = true;
    scene.add(bowl);

    // Food inside bowl
    const foodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const food = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), foodMat);
    food.scale.set(1, 0.4, 1);
    food.position.y = 2.2;
    scene.add(food);

    // Central Pillar Table Leg
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 1.6, 16), tableMat);
    leg.position.y = 0.8;
    scene.add(leg);

    // Colors for the 5 Philosophers
    const PHIL_COLORS = [0x2563eb, 0xdc2626, 0x16a34a, 0x9333ea, 0xd97706];

    // Create 5 Philosophers & 5 Plates & 5 Forks
    const phils = [];
    const forksArr = [];

    for (let i = 0; i < N; i++) {
      const angle = (i / N) * 2 * Math.PI - Math.PI / 2;

      // ── 1. Philosopher Group ──
      const philGroup = new THREE.Group();

      // Chair
      const chairMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.2), chairMat);
      seat.position.y = 0.9;
      philGroup.add(seat);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.15), chairMat);
      backrest.position.set(0, 1.5, 0.55);
      philGroup.add(backrest);

      // Philosopher Body (Robed Cylinder)
      const robeMat = new THREE.MeshStandardMaterial({ color: PHIL_COLORS[i], roughness: 0.5 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.3, 16), robeMat);
      body.position.y = 1.5;
      body.castShadow = true;
      philGroup.add(body);

      // Head
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.3 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), headMat);
      head.position.y = 2.4;
      head.castShadow = true;
      philGroup.add(head);

      // Position Chair & Philosopher around table
      const dist = 5.2;
      philGroup.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      philGroup.lookAt(0, 1.5, 0); // Always face center table
      scene.add(philGroup);
      phils.push(philGroup);

      // ── 2. Plate on Table ──
      const plateDist = 2.8;
      const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.4, 0.05, 20), plateMat);
      plate.position.set(Math.cos(angle) * plateDist, 1.82, Math.sin(angle) * plateDist);
      scene.add(plate);

      // ── 3. Fork / Chopstick (between plate i and plate (i+1)%N) ──
      const forkAngle = ((i + 0.5) / N) * 2 * Math.PI - Math.PI / 2;
      const forkDist = 2.8;
      const forkMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), forkMat);
      fork.rotation.z = Math.PI / 2;
      fork.rotation.y = -forkAngle;
      fork.position.set(Math.cos(forkAngle) * forkDist, 1.85, Math.sin(forkAngle) * forkDist);
      fork.castShadow = true;
      scene.add(fork);
      forksArr.push(fork);
    }

    philMeshesRef.current = phils;
    forkMeshesRef.current = forksArr;

    // Animation Render Loop
    let time = 0;
    const animate = () => {
      time += 0.02;

      // Gentle floating animation for forks and philosophers
      for (let i = 0; i < N; i++) {
        if (philMeshesRef.current[i]) {
          // Bobbing slightly
          philMeshesRef.current[i].position.y = Math.sin(time + i) * 0.03;
        }
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

  // Update 3D Visual Positions of Forks & Avatars
  const updateVisualForks = (availArr) => {
    for (let i = 0; i < N; i++) {
      const fork = forkMeshesRef.current[i];
      if (fork) {
        if (!availArr[i]) {
          // Fork lifted up in air by eating/holding philosopher
          fork.position.y = 2.4;
        } else {
          // Resting on table
          fork.position.y = 1.85;
        }
      }
    }
  };

  // ── Actions ──
  const pickUpForks = (i) => {
    if (deadlockTriggered) return;
    const left = i;
    const right = (i + 1) % N;

    if (forkAvailable[left] && forkAvailable[right]) {
      const nextForks = [...forkAvailable];
      nextForks[left] = false;
      nextForks[right] = false;
      setForkAvailable(nextForks);
      updateVisualForks(nextForks);

      const nextStates = [...philStates];
      nextStates[i] = 'eating';
      setPhilStates(nextStates);
      addLog(`🍝 Philosopher P${i} acquired Fork ${left} & Fork ${right} → EATING!`);
    } else {
      const nextStates = [...philStates];
      nextStates[i] = 'hungry';
      setPhilStates(nextStates);
      addLog(`⏳ Philosopher P${i} wants to eat but forks are currently in use! BLOCKED.`);
    }
  };

  const putDownForks = (i) => {
    if (deadlockTriggered || philStates[i] !== 'eating') return;
    const left = i;
    const right = (i + 1) % N;

    const nextForks = [...forkAvailable];
    nextForks[left] = true;
    nextForks[right] = true;
    setForkAvailable(nextForks);
    updateVisualForks(nextForks);

    const nextStates = [...philStates];
    nextStates[i] = 'thinking';
    setPhilStates(nextStates);
    addLog(`💭 Philosopher P${i} finished eating. Released Fork ${left} & ${right} → THINKING.`);
  };

  // Simulate Deadlock: All 5 simultaneously grab left fork
  const triggerDeadlock = () => {
    setDeadlockTriggered(true);
    setForkAvailable(Array(N).fill(false));
    updateVisualForks(Array(N).fill(false));
    setPhilStates(Array(N).fill('hungry'));

    if (tableLightRef.current) {
      tableLightRef.current.color.setHex(0xdc2626); // Strobe red light
    }

    addLog('🚨 DEADLOCK OCCURRED! All 5 philosophers grabbed their left fork simultaneously!');
    addLog('Each philosopher now waits indefinitely for their right fork. System is frozen!');
  };

  // Reset Table
  const resetTable = () => {
    setDeadlockTriggered(false);
    setForkAvailable(Array(N).fill(true));
    updateVisualForks(Array(N).fill(true));
    setPhilStates(Array(N).fill('thinking'));

    if (tableLightRef.current) {
      tableLightRef.current.color.setHex(0xfffbeb);
    }

    addLog('Table reset. All 5 forks returned to table.');
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
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 0.2rem 0' }}>
            🍽️ 3D Dining Philosophers Interactive Round Table
          </h3>
          <div style={{ fontSize: '13px', color: '#475569' }}>
            5 Philosophers around a round table with 5 forks. Each needs <strong>2 adjacent forks</strong> to eat!
          </div>
        </div>

        {deadlockTriggered ? (
          <span style={{ background: '#fee2e2', border: '1.5px solid #dc2626', color: '#991b1b', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '12px' }}>
            🚨 DEADLOCK STATE (CIRCULAR WAIT)
          </span>
        ) : (
          <span style={{ background: '#dcfce7', border: '1.5px solid #16a34a', color: '#166534', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: 8, fontSize: '12px' }}>
            ✓ RUNNING NORMALLY
          </span>
        )}
      </div>

      {/* 3D Canvas */}
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

      {/* Controls per Philosopher */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.65rem',
      }}>
        {Array.from({ length: N }).map((_, i) => {
          const st = philStates[i];
          const isEating = st === 'eating';
          return (
            <div
              key={i}
              style={{
                background: isEating ? '#f0fdf4' : st === 'hungry' ? '#fefce8' : '#f8fafc',
                border: `1.5px solid ${isEating ? '#16a34a' : st === 'hungry' ? '#ca8a04' : '#000000'}`,
                borderRadius: 8,
                padding: '0.65rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px' }}>Philosopher P{i}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: isEating ? '#16a34a' : st === 'hungry' ? '#ca8a04' : '#64748b',
                  color: '#ffffff',
                }}>
                  {st.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => pickUpForks(i)}
                  disabled={isEating || deadlockTriggered}
                  style={{
                    flex: 1, background: '#000000', color: '#ffffff',
                    border: '1px solid #000000', borderRadius: 4,
                    padding: '0.35rem', fontSize: '11px', fontWeight: 700,
                    cursor: isEating || deadlockTriggered ? 'not-allowed' : 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  Eat 🍝
                </button>
                <button
                  onClick={() => putDownForks(i)}
                  disabled={!isEating || deadlockTriggered}
                  style={{
                    flex: 1, background: '#ffffff', color: '#000000',
                    border: '1px solid #000000', borderRadius: 4,
                    padding: '0.35rem', fontSize: '11px', fontWeight: 700,
                    cursor: !isEating || deadlockTriggered ? 'not-allowed' : 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  Think 💭
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deadlock Simulator & Reset */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: 8, padding: '0.65rem 0.85rem', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={triggerDeadlock}
            disabled={deadlockTriggered}
            style={{
              background: '#dc2626', color: '#ffffff',
              border: '1.5px solid #000000', borderRadius: 6,
              padding: '0.45rem 1rem', fontSize: '12px', fontWeight: 700,
              cursor: deadlockTriggered ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
            }}
          >
            🚨 Trigger Deadlock (All Grab Left Fork)
          </button>
          <button
            onClick={resetTable}
            style={{
              background: '#ffffff', color: '#000000',
              border: '1.5px solid #000000', borderRadius: 6,
              padding: '0.45rem 1rem', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            ↺ Reset Table
          </button>
        </div>

        <div style={{ fontSize: '12px', color: '#475569' }}>
          Forks on Table: <strong>{forkAvailable.filter(Boolean).length} / 5</strong>
        </div>
      </div>

      {/* Log */}
      <div style={{
        background: '#0f172a', color: '#f8fafc',
        borderRadius: 8, padding: '0.6rem 0.85rem',
        fontSize: '11px', fontFamily: 'monospace',
        maxHeight: '85px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '3px',
      }}>
        {log.map((entry, idx) => (
          <div key={idx} style={{ color: idx === 0 ? '#38bdf8' : '#94a3b8' }}>
            › {entry}
          </div>
        ))}
      </div>
    </div>
  );
}
