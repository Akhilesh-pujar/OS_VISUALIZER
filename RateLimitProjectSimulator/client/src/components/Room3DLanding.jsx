import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const FONT = "'Times New Roman', Times, serif";

export default function Room3DLanding({ onOpenArchitecture }) {
  const mountRef = useRef(null);
  const navigate = useNavigate();

  // States: 'room_idle' | 'walking_in' | 'seated_booted'
  const [sceneState, setSceneState] = useState('room_idle');
  const [bootProgress, setBootProgress] = useState(0);
  const [showChapterOverlay, setShowChapterOverlay] = useState(false);

  // References
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const personGroupRef = useRef(null);
  const chairGroupRef = useRef(null);
  const gpuFansRef = useRef([]);
  const coolerFanRef = useRef(null);
  const monitorScreenCanvasRef = useRef(null);
  const monitorTextureRef = useRef(null);
  const animFrameRef = useRef(null);

  // Camera targets
  const targetCamPos = useRef(new THREE.Vector3(0, 5.2, 9.2));

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // ── 1. Scene & Warm Bright Atmosphere ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Clean bright daylight room
    sceneRef.current = scene;

    // ── 2. Camera ──
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5.2, 9.2);
    camera.lookAt(0, 2.3, 0);
    cameraRef.current = camera;

    // ── 3. High-Fidelity Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── 4. Bright, Natural Room Lighting ──
    // Bright ambient daylight filling the entire room
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    // Sunlight coming from top-right window
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sunLight.position.set(7, 12, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 30;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm ceiling recessed room light
    const ceilingLight = new THREE.PointLight(0xfff7ed, 1.4, 20);
    ceilingLight.position.set(0, 8, 2);
    scene.add(ceilingLight);

    // Desk task light / warm fill
    const deskFillLight = new THREE.PointLight(0xffffff, 1.0, 8);
    deskFillLight.position.set(-1.5, 4.5, 1);
    scene.add(deskFillLight);

    // Cool RGB accent inside GPU tower
    const gpuLight = new THREE.PointLight(0x06b6d4, 2.5, 3.5);
    gpuLight.position.set(2.4, 2.8, 0);
    scene.add(gpuLight);

    // ── 5. Real Room Architecture: Wood Floor & Modern Walls ──
    // Real Oak Hardwood Parquet Floor
    const floorGeo = new THREE.PlaneGeometry(24, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xc49a6c, // Warm natural oak wood
      roughness: 0.45,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back Wall (Modern Warm Grey / Off-White)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 0.4), wallMat);
    backWall.position.set(0, 6, -4.5);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Accent Wall
    const leftWallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 20), leftWallMat);
    leftWall.position.set(-10, 6, 4);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Baseboard Moulding (Clean White)
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const baseboard = new THREE.Mesh(new THREE.BoxGeometry(24, 0.25, 0.08), baseboardMat);
    baseboard.position.set(0, 0.125, -4.26);
    scene.add(baseboard);

    // Framed Computer Architecture Poster on the Back Wall
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const posterFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 0.08), frameMat);
    posterFrame.position.set(-2.5, 5.2, -4.26);
    scene.add(posterFrame);

    // Canvas texture for Poster Artwork
    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 512;
    posterCanvas.height = 320;
    const pctx = posterCanvas.getContext('2d');
    pctx.fillStyle = '#0f172a';
    pctx.fillRect(0, 0, 512, 320);
    pctx.fillStyle = '#38bdf8';
    pctx.font = 'bold 28px "Times New Roman"';
    pctx.textAlign = 'center';
    pctx.fillText('OPERATING SYSTEMS', 256, 70);
    pctx.font = '20px "Times New Roman"';
    pctx.fillStyle = '#f8fafc';
    pctx.fillText('System Architecture & Concurrency Blueprint', 256, 120);
    pctx.strokeStyle = '#38bdf8';
    pctx.lineWidth = 2;
    pctx.strokeRect(40, 160, 432, 110);
    pctx.font = '16px "Times New Roman"';
    pctx.fillStyle = '#94a3b8';
    pctx.fillText('Kernel Space (Ring 0)  |  Hardware Abstraction Layer (HAL)', 256, 200);
    pctx.fillText('Process Schedulers • SMT Threads • Atomic Memory Bus Locks', 256, 235);
    const posterTex = new THREE.CanvasTexture(posterCanvas);
    const posterPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.4), new THREE.MeshBasicMaterial({ map: posterTex }));
    posterPlane.position.set(0, 0, 0.045);
    posterFrame.add(posterPlane);

    // Modern Wall Shelf with Books & Potted Succulent
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.5 });
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.6), shelfMat);
    shelf.position.set(2.8, 5.4, -4.15);
    scene.add(shelf);

    // Books on Shelf
    const bookColors = [0x2563eb, 0xdc2626, 0x16a34a, 0x7c3aed];
    for (let b = 0; b < 4; b++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.65 + (b % 2) * 0.1, 0.45),
        new THREE.MeshStandardMaterial({ color: bookColors[b] })
      );
      book.position.set(1.8 + b * 0.22, 5.8, -4.15);
      scene.add(book);
    }

    // ── 6. Realistic Executive / Gamer Desk ──
    const deskGroup = new THREE.Group();
    // Warm Walnut Wood Desktop with Rounded Edge Look
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0x6e4726, // Natural rich walnut wood
      roughness: 0.4,
      metalness: 0.05,
    });
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.14, 2.8), deskTopMat);
    deskTop.position.set(0, 2.2, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Matte Black Steel Desk Legs
    const steelLegMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 2.4), steelLegMat);
    leftLeg.position.set(-2.9, 1.1, 0);
    leftLeg.castShadow = true;
    deskGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 2.4), steelLegMat);
    rightLeg.position.set(2.9, 1.1, 0);
    rightLeg.castShadow = true;
    deskGroup.add(rightLeg);

    // Large Desk Mat (Dark Fabric with stitched edges)
    const matMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const deskMat = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 1.3), matMat);
    deskMat.position.set(0, 2.28, 0.25);
    deskGroup.add(deskMat);

    // Potted Green Desk Plant on the left
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    pot.position.set(-2.4, 2.42, 0.6);
    deskGroup.add(pot);
    const plant = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 }));
    plant.position.set(-2.4, 2.7, 0.6);
    deskGroup.add(plant);

    scene.add(deskGroup);

    // ── 7. Dual Curved Ultrawide Monitors ──
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    monitorScreenCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 38px "Times New Roman"';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM READY — CLICK DESK TO ENTER', 512, 210);
    ctx.font = '24px "Times New Roman"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Operating Systems Kernel Diagnostics & Concurrency Rig', 512, 280);
    ctx.fillStyle = '#22c55e';
    ctx.font = '20px monospace';
    ctx.fillText('● GPU Active  |  ● Multicore Ready  |  ● Memory Interconnect Online', 512, 340);

    const monitorTex = new THREE.CanvasTexture(canvas);
    monitorTextureRef.current = monitorTex;

    // Monitor Stand
    const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const standArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 16), standMat);
    standArm.position.set(0, 2.8, -0.4);
    standArm.castShadow = true;
    scene.add(standArm);
    const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), standMat);
    standBase.position.set(0, 2.29, -0.4);
    scene.add(standBase);

    // Bezel & Screen
    const monitorFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const screenMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.7, 0.08), monitorFrameMat);
    screenMesh.position.set(0, 3.4, -0.3);
    screenMesh.castShadow = true;

    const mainScreenPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.6), new THREE.MeshBasicMaterial({ map: monitorTex }));
    mainScreenPlane.position.set(0, 0, 0.045);
    screenMesh.add(mainScreenPlane);
    scene.add(screenMesh);

    // Mechanical Keyboard (Light Grey frame with dark keycaps)
    const kb = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.04, 0.45), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }));
    kb.position.set(0, 2.31, 0.35);
    kb.castShadow = true;
    scene.add(kb);

    // Mouse
    const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.28), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }));
    mouse.position.set(0.95, 2.31, 0.35);
    scene.add(mouse);

    // ── 8. High-End Custom PC Tower (White & Glass Aesthetic) ──
    const pcTower = new THREE.Group();
    // Modern White Powder-Coated Metal Case
    const caseMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.3 });
    const pcCase = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.7, 1.7), caseMat);
    pcCase.position.set(0, 0.85, 0);
    pcCase.castShadow = true;
    pcTower.add(pcCase);

    // Transparent Glass Side Panel
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
    });
    const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.55, 1.55), glassMat);
    glassPanel.position.set(-0.48, 0.85, 0);
    pcTower.add(glassPanel);

    // Dark Interior Motherboard
    const mobo = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.45, 1.45), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 }));
    mobo.position.set(0.02, 0.85, 0);
    pcTower.add(mobo);

    // Glowing High-End GPU
    const gpu = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.95), new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 }));
    gpu.position.set(-0.15, 0.75, 0);
    pcTower.add(gpu);

    // GPU Spinning Fans
    const fanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const fan1 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), fanMat);
    fan1.rotation.z = Math.PI / 2;
    fan1.position.set(-0.35, 0.75, -0.22);
    pcTower.add(fan1);
    const fan2 = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), fanMat);
    fan2.rotation.z = Math.PI / 2;
    fan2.position.set(-0.35, 0.75, 0.22);
    pcTower.add(fan2);
    gpuFansRef.current = [fan1, fan2];

    // CPU Liquid Cooler Pump with Purple LED Ring
    const cooler = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16), new THREE.MeshBasicMaterial({ color: 0xa855f7 }));
    cooler.rotation.z = Math.PI / 2;
    cooler.position.set(-0.15, 1.2, -0.15);
    pcTower.add(cooler);
    coolerFanRef.current = cooler;

    // Dual RGB RAM Sticks
    const ram = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.25), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
    ram.position.set(-0.15, 1.2, 0.2);
    pcTower.add(ram);

    pcTower.position.set(2.4, 2.27, 0);
    scene.add(pcTower);

    // ── 9. Ergonomic Office Chair ──
    const chair = new THREE.Group();
    const chairLeatherMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.15, 1.25), chairLeatherMat);
    seat.position.y = 1.4;
    seat.castShadow = true;
    chair.add(seat);
    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.45, 0.15), chairLeatherMat);
    back.position.set(0, 2.1, 0.55);
    back.castShadow = true;
    chair.add(back);
    // Chrome Base
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 16), chromeMat);
    stem.position.y = 0.9;
    chair.add(stem);

    chair.position.set(0, 0, 1.7);
    scene.add(chair);
    chairGroupRef.current = chair;

    // ── 10. The 3D Person / Avatar ──
    const person = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.4 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 }); // Clean bright royal blue hoodie
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 1.15, 16), hoodieMat);
    torso.position.y = 1.9;
    torso.castShadow = true;
    person.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 16), skinMat);
    head.position.y = 2.65;
    head.castShadow = true;
    person.add(head);

    // White Headphones
    const phoneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const phoneBand = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 20), phoneMat);
    phoneBand.position.set(0, 2.67, 0);
    phoneBand.rotation.x = Math.PI / 2;
    person.add(phoneBand);

    // Legs
    const leftLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.22), jeansMat);
    leftLegMesh.position.set(-0.2, 0.92, 0);
    leftLegMesh.castShadow = true;
    person.add(leftLegMesh);

    const rightLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.85, 0.22), jeansMat);
    rightLegMesh.position.set(0.2, 0.92, 0);
    rightLegMesh.castShadow = true;
    person.add(rightLegMesh);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), hoodieMat);
    leftArm.position.set(-0.48, 1.85, 0.2);
    leftArm.rotation.x = Math.PI / 5;
    person.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), hoodieMat);
    rightArm.position.set(0.48, 1.85, 0.2);
    rightArm.rotation.x = Math.PI / 5;
    person.add(rightArm);

    // Initial Standing Position in bright room
    person.position.set(-4.2, 0, 3.2);
    person.rotation.y = Math.PI / 4;
    scene.add(person);
    personGroupRef.current = person;

    // ── Click Detection on Desk / Computer ──
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onPointerDown = (event) => {
      mouseCoord.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseCoord.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouseCoord, camera);

      const intersects = raycaster.intersectObjects([deskTop, pcCase, screenMesh, seat], true);
      if (intersects.length > 0 && sceneState === 'room_idle') {
        handleTriggerSitting();
      }
    };
    window.addEventListener('pointerdown', onPointerDown);

    // ── Render & Animation Loop ──
    let clockTime = 0;
    const animate = () => {
      clockTime += 0.03;

      // Spin GPU fans
      if (gpuFansRef.current[0]) gpuFansRef.current[0].rotation.x += 0.35;
      if (gpuFansRef.current[1]) gpuFansRef.current[1].rotation.x += 0.35;
      if (coolerFanRef.current) coolerFanRef.current.rotation.x += 0.15;

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos.current, 0.04);

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // ── Smooth Sitting & Boot Sequence ──
  const handleTriggerSitting = () => {
    if (sceneState !== 'room_idle') return;
    setSceneState('walking_in');

    const person = personGroupRef.current;
    if (!person) return;

    const startX = person.position.x;
    const startZ = person.position.z;
    const targetX = 0;
    const targetZ = 1.7;
    const duration = 1600;
    const startTime = performance.now();

    const stepWalk = (now) => {
      const elapsed = now - startTime;
      const p = Math.min(elapsed / duration, 1);
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;

      person.position.x = startX + (targetX - startX) * ease;
      person.position.z = startZ + (targetZ - startZ) * ease;
      person.rotation.y = THREE.MathUtils.lerp(Math.PI / 4, 0, ease);
      person.position.y = Math.sin(p * Math.PI * 6) * 0.06;

      if (p < 1) {
        requestAnimationFrame(stepWalk);
      } else {
        // Sits in chair
        person.position.y = -0.3;
        person.rotation.y = 0;
        setSceneState('seated_booted');

        // Monitor powers on
        bootUpMonitors();

        // Smooth camera zoom
        targetCamPos.current.set(0, 3.4, 4.0);
      }
    };
    requestAnimationFrame(stepWalk);
  };

  const bootUpMonitors = () => {
    const canvas = monitorScreenCanvasRef.current;
    const tex = monitorTextureRef.current;
    if (!canvas || !tex) return;

    const ctx = canvas.getContext('2d');
    let bootStep = 0;
    const bootLines = [
      '>> BIOS POST: Intel/AMD 64-bit Architecture Verified.',
      '>> INITIALIZING RING 0 KERNEL & VIRTUAL MEMORY MMU...',
      '>> LOADING SCHEDULER: APIC Timer Preemption Quantum = 10ms',
      '>> INITIALIZING SMP THREAD POOLS: Hardware Concurrency Active',
      '>> SYNCHRONIZATION BUS: Hardware LOCK# & Atomic CAS Initialized',
      '>> SUCCESS: OPERATING SYSTEM VISUAL EXPLORER IS LIVE!'
    ];

    const timer = setInterval(() => {
      bootStep++;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1024, 512);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('OPERATING SYSTEM DIAGNOSTICS & HARDWARE BOOT', 60, 60);

      ctx.fillStyle = '#4ade80';
      ctx.font = '20px monospace';
      for (let i = 0; i < Math.min(bootStep, bootLines.length); i++) {
        ctx.fillText(bootLines[i], 60, 120 + i * 45);
      }

      setBootProgress(Math.min((bootStep / bootLines.length) * 100, 100));
      tex.needsUpdate = true;

      if (bootStep >= bootLines.length) {
        clearInterval(timer);
        setTimeout(() => {
          setShowChapterOverlay(true);
        }, 500);
      }
    }, 380);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: FONT }}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: '100%', height: '100%', cursor: sceneState === 'room_idle' ? 'pointer' : 'default' }} />

      {/* Floating Prompt on Initial Visit */}
      {sceneState === 'room_idle' && (
        <div
          onClick={handleTriggerSitting}
          style={{
            position: 'absolute',
            bottom: '4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ffffff',
            border: '2.5px solid #000000',
            borderRadius: 100,
            padding: '0.85rem 2.2rem',
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            boxShadow: '6px 6px 0px #000000',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: '1.5rem' }}>🖥️</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em' }}>
              Click to Enter Room &amp; Sit at Workstation
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Watch the person sit down and boot up the Operating System
            </div>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700 }}>→</span>
        </div>
      )}

      {/* Booting Progress Indicator */}
      {sceneState === 'seated_booted' && !showChapterOverlay && (
        <div style={{
          position: 'absolute',
          bottom: '3rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 12,
          padding: '0.75rem 1.75rem',
          color: '#000000',
          textAlign: 'center',
          boxShadow: '4px 4px 0px #000000',
          zIndex: 10,
        }}>
          <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '0.35rem' }}>
            ⚡ System Booting OS Kernel... ({Math.round(bootProgress)}%)
          </div>
          <div style={{ width: 260, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', border: '1px solid #000000' }}>
            <div style={{ width: `${bootProgress}%`, height: '100%', background: '#000000', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Top Navigation Ribbon */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        left: '2rem',
        right: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
      }}>
        <div style={{
          background: '#ffffff',
          border: '2px solid #000000',
          borderRadius: 8,
          padding: '0.45rem 1rem',
          color: '#000000',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          boxShadow: '3px 3px 0px #000000',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontSize: '13px', fontWeight: 700 }}>Computer Workstation &amp; High-End GPU Rig</span>
        </div>

        <button
          onClick={onOpenArchitecture}
          style={{
            background: '#ffffff',
            border: '2px solid #000000',
            borderRadius: 8,
            padding: '0.55rem 1.3rem',
            color: '#000000',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '3px 3px 0px #000000',
            fontFamily: FONT,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
        >
          Direct OS Architecture Map →
        </button>
      </div>

      {/* Post-Boot Overlay */}
      {showChapterOverlay && (
        <div style={{
          position: 'absolute',
          bottom: '2.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ffffff',
          border: '2.5px solid #000000',
          borderRadius: 14,
          padding: '1.25rem 1.75rem',
          boxShadow: '6px 6px 0px #000000',
          width: '90%',
          maxWidth: 960,
          zIndex: 30,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
                System Boot Complete
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 700, margin: '2px 0 0 0', color: '#000000' }}>
                🖥️ High-End CPU &amp; Kernel Mapped — Select a Module to Launch:
              </h2>
            </div>
            <button
              onClick={onOpenArchitecture}
              style={{
                background: '#000000', color: '#ffffff', border: '1.5px solid #000000',
                borderRadius: 6, padding: '0.35rem 0.85rem', fontSize: '12px',
                fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              Full Architecture Board 🗺️
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem' }}>
            {[
              { route: 'os-structures', num: 'Ch. 2', title: 'OS Structures', icon: '🖥️', desc: 'Kernel Models & VM' },
              { route: 'process-concepts', num: 'Ch. 3', title: 'Processes', icon: '⚙️', desc: 'PCB, States & IPC' },
              { route: 'threads-concepts', num: 'Ch. 4', title: 'Threads', icon: '🧵', desc: 'Pthreads & TLS' },
              { route: 'cpu-scheduling', num: 'Ch. 5', title: 'CPU Scheduling', icon: '⏱️', desc: 'Gantt & MLFQ' },
              { route: 'synchronization', num: 'Ch. 6', title: 'Synchronization', icon: '🔒', desc: '3D Classroom & Semaphores' },
            ].map((mod) => (
              <button
                key={mod.route}
                onClick={() => navigate(`/${mod.route}`)}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #000000',
                  borderRadius: 8,
                  padding: '0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '2px 2px 0px #000000',
                  fontFamily: FONT,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#000000';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#000000';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{mod.icon}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, border: '1px solid currentColor', padding: '1px 4px', borderRadius: 4 }}>
                    {mod.num}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>{mod.title}</div>
                <div style={{ fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{mod.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
