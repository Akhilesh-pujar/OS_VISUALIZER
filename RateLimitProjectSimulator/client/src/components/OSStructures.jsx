import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

/* ══════════════════════════════════════════════════════════════════════════
   UTILITIES & BILLBOARD LABELS
══════════════════════════════════════════════════════════════════════════ */

/** High-res canvas label — always billboarded to face camera in render loop */
function makeLabel(text, {
  fontSize = 30,
  textColor = '#1e293b',
  bgColor = 'rgba(255,255,255,0.94)',
  borderColor = 'rgba(0,0,0,0.12)',
  canvasW = 512,
  canvasH = 80,
  planeW = 3.2,
} = {}) {
  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Background pill
  ctx.fillStyle = bgColor;
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(r, 4); ctx.lineTo(canvasW - r, 4);
  ctx.quadraticCurveTo(canvasW - 4, 4, canvasW - 4, r + 4);
  ctx.lineTo(canvasW - 4, canvasH - r - 4);
  ctx.quadraticCurveTo(canvasW - 4, canvasH - 4, canvasW - r - 4, canvasH - 4);
  ctx.lineTo(r + 4, canvasH - 4);
  ctx.quadraticCurveTo(4, canvasH - 4, 4, canvasH - r - 4);
  ctx.lineTo(4, r + 4);
  ctx.quadraticCurveTo(4, 4, r + 4, 4);
  ctx.closePath();
  ctx.fill();

  // Border
  if (borderColor && borderColor !== 'rgba(0,0,0,0)') {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Text
  ctx.font = `700 ${fontSize}px "Inter","Segoe UI",sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvasW / 2, canvasH / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const aspect = canvasW / canvasH;
  const planeH = planeW / aspect;
  const geo = new THREE.PlaneGeometry(planeW, planeH);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isLabel = true;
  return mesh;
}

function makeBox(w, h, d, color, opacity = 1, shininess = 60) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshPhongMaterial({ color, transparent: opacity < 1, opacity, shininess });
  return new THREE.Mesh(geo, mat);
}

function makeSphere(r, color, opacity = 1) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(r, 24, 24),
    new THREE.MeshPhongMaterial({
      color, transparent: opacity < 1, opacity,
      shininess: 120, emissive: color, emissiveIntensity: 0.35,
    })
  );
}

function hexToRgb(hex) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  return `${r},${g},${b}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE 1: SIMPLE / MONOLITHIC STRUCTURE
   – Stacked layers: Application, Resident OS, MS-DOS Drivers, ROM BIOS
   – 1 System Call: Direct leap from App to Driver/BIOS (1 hop, 0 context switches, 0.4µs)
   – 1M System Calls: Lightning fast swarm, but corrupts memory & triggers crash alarm!
══════════════════════════════════════════════════════════════════════════ */
function buildSimple(simRef) {
  const group = new THREE.Group();
  const LAYER_W = 5.6, LAYER_H = 1.0, LAYER_D = 1.2;

  const layers = [
    { label: 'Application Programs', color: 0x3b82f6, y: 3.3 },
    { label: 'Resident System Program', color: 0x0891b2, y: 1.7 },
    { label: 'MS-DOS Device Drivers', color: 0x7c3aed, y: 0.1 },
    { label: 'ROM BIOS Drivers', color: 0x475569, y: -1.5 },
  ];

  const boxMeshes = [];
  layers.forEach(({ label, color, y }) => {
    const box = makeBox(LAYER_W, LAYER_H, LAYER_D, color, 0.92);
    box.position.y = y;
    box.userData.origColor = color;
    box.userData.origY = y;
    group.add(box);
    boxMeshes.push(box);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(box.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })
    );
    edge.position.y = y;
    group.add(edge);

    const lbl = makeLabel(label, {
      fontSize: 26, textColor: '#ffffff',
      bgColor: 'rgba(0,0,0,0.0)', borderColor: 'rgba(255,255,255,0)',
      canvasW: 480, canvasH: 64, planeW: 4.2,
    });
    lbl.position.set(0, y, LAYER_D / 2 + 0.02);
    group.add(lbl);
  });

  // Cross-layer violation arrows for idle mode
  const arrowDefs = [
    { fromY: 3.3 + 0.3, toY: 0.1 - 0.3, xFrom: -1.2, xTo: 1.0, color: 0xef4444 },
    { fromY: 1.7 + 0.3, toY: 3.3 - 0.3, xFrom: 0.8, xTo: -0.8, color: 0xef4444 },
    { fromY: 0.1 + 0.3, toY: 3.3 - 0.3, xFrom: -0.4, xTo: 0.4, color: 0xef4444 },
    { fromY: -1.5 + 0.3, toY: 1.7 - 0.3, xFrom: 1.4, xTo: -1.4, color: 0xef4444 },
    { fromY: 1.7 - 0.3, toY: -1.5 + 0.3, xFrom: 0.0, xTo: 0.0, color: 0xef4444 },
  ];

  const arrows = arrowDefs.map(({ fromY, toY, xFrom, xTo, color }) => {
    const from = new THREE.Vector3(xFrom, fromY, LAYER_D / 2 + 0.1);
    const to = new THREE.Vector3(xTo, toY, LAYER_D / 2 + 0.1);
    const dir = new THREE.Vector3().subVectors(to, from).normalize();
    const len = from.distanceTo(to);
    const arr = new THREE.ArrowHelper(dir, from, len, color, 0.32, 0.18);
    arr.line.material.transparent = true;
    arr.cone.material.transparent = true;
    group.add(arr);
    return arr;
  });

  // Warning label
  const warnLbl = makeLabel('⚠ No boundaries — any layer can access any other', {
    fontSize: 20, textColor: '#b91c1c',
    bgColor: 'rgba(254,226,226,0.92)', borderColor: '#fca5a5',
    canvasW: 560, canvasH: 56, planeW: 5.0,
  });
  warnLbl.position.set(0, -2.6, 0);
  group.add(warnLbl);

  // Single call token
  const callToken = makeSphere(0.24, 0xf59e0b, 1.0);
  callToken.visible = false;
  group.add(callToken);

  // Single call line trace
  const traceGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 3.3, 0.7),
    new THREE.Vector3(0, -1.5, 0.7),
  ]);
  const traceMat = new THREE.LineDashedMaterial({ color: 0x10b981, dashSize: 0.25, gapSize: 0.15, transparent: true, opacity: 0 });
  const traceLine = new THREE.Line(traceGeo, traceMat);
  traceLine.computeLineDistances();
  group.add(traceLine);

  // Million calls particle swarm (35 particles)
  const swarmCount = 35;
  const swarmSpheres = Array.from({ length: swarmCount }, () => {
    const s = makeSphere(0.12, 0x38bdf8, 0.85);
    s.visible = false;
    group.add(s);
    return {
      mesh: s,
      x: (Math.random() - 0.5) * 4.8,
      y: 3.3 - Math.random() * 4.8,
      speed: 3.5 + Math.random() * 4.5,
    };
  });

  // Crash alert banner in 3D
  const crashBanner = makeLabel('🚨 MEMORY CORRUPTION HAZARD: 1 bad call overwrote BIOS address space!', {
    fontSize: 20, textColor: '#ef4444',
    bgColor: 'rgba(254,242,242,0.98)', borderColor: '#f87171',
    canvasW: 660, canvasH: 60, planeW: 5.8,
  });
  crashBanner.position.set(0, -3.4, 0.8);
  crashBanner.visible = false;
  group.add(crashBanner);

  let t = 0;
  let singleCycle = 0;
  let millionCalls = 0;

  const update = (delta) => {
    t += delta;
    const mode = simRef?.current?.mode || 'idle';
    const paused = simRef?.current?.paused || false;
    const speed = simRef?.current?.speed || 1;
    const effDelta = paused ? 0 : delta * speed;

    if (mode === 'idle') {
      callToken.visible = false;
      traceMat.opacity = 0;
      crashBanner.visible = false;
      swarmSpheres.forEach(p => p.mesh.visible = false);
      arrows.forEach((arr, i) => {
        arr.visible = true;
        const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.8 + i * 1.3));
        arr.line.material.opacity = flicker;
        arr.cone.material.opacity = flicker;
      });
      boxMeshes.forEach((m, i) => {
        m.position.x = Math.sin(t * 1.2 + i * 1.5) * 0.04;
        m.material.color.setHex(m.userData.origColor);
        m.material.emissiveIntensity = 0;
      });
      warnLbl.visible = true;
      return;
    }

    warnLbl.visible = false;
    arrows.forEach(arr => arr.visible = false);

    if (mode === 'single') {
      swarmSpheres.forEach(p => p.mesh.visible = false);
      crashBanner.visible = false;
      callToken.visible = true;
      traceMat.opacity = 0.8;

      singleCycle = (singleCycle + effDelta * 0.45) % 1; // ~2.2s per cycle

      // Phase 1: App invokes read() (0 -> 0.2)
      // Phase 2: Direct jump bypassing protection straight to ROM BIOS (0.2 -> 0.5)
      // Phase 3: Hardware access (0.5 -> 0.7)
      // Phase 4: Direct return to App (0.7 -> 1.0)
      let px = 0, py = 3.3;
      let stepIdx = 0;

      if (singleCycle < 0.2) {
        stepIdx = 0;
        py = 3.3;
        px = Math.sin(t * 6) * 0.2;
        boxMeshes[0].material.emissive.setHex(0x3b82f6);
        boxMeshes[0].material.emissiveIntensity = 0.5;
        boxMeshes[3].material.emissiveIntensity = 0;
      } else if (singleCycle < 0.5) {
        stepIdx = 1;
        const p = (singleCycle - 0.2) / 0.3;
        py = 3.3 + p * (-1.5 - 3.3); // Direct straight jump from 3.3 to -1.5
        px = Math.sin(p * Math.PI) * 0.6;
        boxMeshes[0].material.emissiveIntensity = 0.1;
      } else if (singleCycle < 0.7) {
        stepIdx = 2;
        py = -1.5;
        px = 0;
        boxMeshes[3].material.emissive.setHex(0x10b981);
        boxMeshes[3].material.emissiveIntensity = 0.7;
      } else {
        stepIdx = 3;
        const p = (singleCycle - 0.7) / 0.3;
        py = -1.5 + p * (3.3 - -1.5);
        px = -Math.sin(p * Math.PI) * 0.6;
        boxMeshes[3].material.emissiveIntensity = 0.1;
      }

      callToken.position.set(px, py, LAYER_D / 2 + 0.2);
      callToken.material.emissiveIntensity = 0.6 + Math.sin(t * 12) * 0.3;

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx,
          callCount: 1,
          latency: (singleCycle * 0.4).toFixed(2) + ' µs',
          status: 'Direct Function Call (No mode switch)',
          throughput: '2,200,000 calls/s',
        });
      }
    } else if (mode === 'million') {
      callToken.visible = false;
      traceMat.opacity = 0;

      millionCalls = Math.min(1000000, millionCalls + Math.floor(effDelta * 320000));
      if (millionCalls >= 1000000 && !paused) {
        millionCalls = 1000000;
      }

      swarmSpheres.forEach(p => {
        p.mesh.visible = true;
        p.y -= effDelta * p.speed;
        if (p.y < -2.2) {
          p.y = 3.6;
          p.x = (Math.random() - 0.5) * 4.6;
        }
        p.mesh.position.set(p.x, p.y, LAYER_D / 2 + 0.12);
      });

      // Above 400k calls, show the catastrophic flaw: memory corruption hazard!
      const isCorrupted = millionCalls > 380000;
      crashBanner.visible = isCorrupted;
      if (isCorrupted) {
        const flash = Math.sin(t * 16) > 0;
        boxMeshes[3].material.color.setHex(flash ? 0xef4444 : 0x7f1d1d);
        boxMeshes[3].material.emissive.setHex(0xef4444);
        boxMeshes[3].material.emissiveIntensity = flash ? 0.8 : 0.2;
      } else {
        boxMeshes[3].material.color.setHex(boxMeshes[3].userData.origColor);
        boxMeshes[3].material.emissiveIntensity = 0;
      }

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: isCorrupted ? 3 : 1,
          callCount: millionCalls,
          latency: '0.45 µs',
          status: isCorrupted ? '🚨 CRITICAL: Memory Corruption!' : '⚡ Blazing Fast (No Protection)',
          throughput: '2,200,000 calls/s',
        });
      }
    }
  };

  return { group, update };
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE 2: LAYERED APPROACH
   – Concentric torus rings: Layer 0 (Hardware) -> Layer N (UI)
   – 1 System Call: Strict inward traversal through EVERY ring (Layer N -> 3 -> 2 -> 1 -> 0 and back)
   – 1M System Calls: Massive bottleneck at Layer 2/3 boundary with visible queue accumulation!
══════════════════════════════════════════════════════════════════════════ */
function buildLayered(simRef) {
  const group = new THREE.Group();

  const ringData = [
    { label: 'Layer N — User Interface', color: 0x3b82f6, r: 4.8, baseOp: 0.30, layerNum: 4 },
    { label: 'Layer 3 — I/O Management', color: 0x0891b2, r: 3.6, baseOp: 0.38, layerNum: 3 },
    { label: 'Layer 2 — Memory Management', color: 0x7c3aed, r: 2.5, baseOp: 0.45, layerNum: 2 },
    { label: 'Layer 1 — Process Scheduling', color: 0x059669, r: 1.5, baseOp: 0.55, layerNum: 1 },
    { label: 'Layer 0 — Hardware', color: 0xd97706, r: 0.65, baseOp: 0.92, layerNum: 0 },
  ];

  const rings = [];
  ringData.forEach(({ label, color, r, baseOp }, i) => {
    const geo = new THREE.TorusGeometry(r, 0.2, 24, 120);
    const mat = new THREE.MeshPhongMaterial({
      color, transparent: true, opacity: baseOp, shininess: 80,
    });
    const torus = new THREE.Mesh(geo, mat);
    torus.rotation.x = Math.PI / 2;
    torus.userData.baseOp = baseOp;
    torus.userData.color = color;
    group.add(torus);
    rings.push({ torus, mat, r, color });

    const lbl = makeLabel(label, {
      fontSize: 22, textColor: '#0f172a',
      bgColor: 'rgba(255,255,255,0.93)', borderColor: `rgba(${hexToRgb(color)},0.4)`,
      canvasW: 480, canvasH: 62, planeW: 3.8,
    });
    lbl.position.set(r + 2.2, 0.05, 0);
    group.add(lbl);
  });

  // Call token
  const callSphere = makeSphere(0.26, 0xf43f5e, 1.0);
  group.add(callSphere);

  const TRAIL = 18;
  const trail = Array.from({ length: TRAIL }, (_, i) => {
    const s = makeSphere(0.14 - i * 0.006, 0xf43f5e, Math.max(0.05, 0.6 - i * 0.03));
    group.add(s);
    return s;
  });
  const history = Array.from({ length: TRAIL }, () => new THREE.Vector3());

  // Congestion queue spheres for 1M calls (40 spheres trapped at Ring 2 & 3)
  const queueCount = 42;
  const queueSpheres = Array.from({ length: queueCount }, (_, i) => {
    const r = i % 2 === 0 ? 3.6 : 2.5; // Rings 3 and 2
    const angle = (i / queueCount) * Math.PI * 2;
    const s = makeSphere(0.13, 0xf59e0b, 0.9);
    s.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
    s.visible = false;
    group.add(s);
    return { mesh: s, r, angle, baseAngle: angle };
  });

  // Congestion banner
  const queueBanner = makeLabel('⚠️ SEVERE BOTTLENECK: 42,000 calls queued at Layer 2/3 boundary!', {
    fontSize: 20, textColor: '#c2410c',
    bgColor: 'rgba(255,247,237,0.98)', borderColor: '#fb923c',
    canvasW: 660, canvasH: 60, planeW: 5.6,
  });
  queueBanner.position.set(0, -3.8, 0);
  queueBanner.visible = false;
  group.add(queueBanner);

  let t = 0;
  let singleCycle = 0;
  let millionCalls = 0;

  const update = (delta) => {
    t += delta;
    const mode = simRef?.current?.mode || 'idle';
    const paused = simRef?.current?.paused || false;
    const speed = simRef?.current?.speed || 1;
    const effDelta = paused ? 0 : delta * speed;

    if (mode === 'idle') {
      queueBanner.visible = false;
      queueSpheres.forEach(q => q.mesh.visible = false);
      callSphere.visible = true;
      trail.forEach(s => s.visible = true);

      const PERIOD = 5.0;
      const phase = (t % PERIOD) / PERIOD;
      const going = phase < 0.5;
      const p = going ? phase * 2 : (phase - 0.5) * 2;
      const sphereR = going ? ringData[0].r * (1 - p) : ringData[0].r * p;
      const angle = t * 1.8;
      const px = Math.cos(angle) * sphereR;
      const pz = Math.sin(angle) * sphereR;

      for (let i = TRAIL - 1; i > 0; i--) history[i].copy(history[i - 1]);
      history[0].set(px, 0, pz);
      trail.forEach((s, i) => s.position.copy(history[i]));
      callSphere.position.set(px, 0, pz);

      rings.forEach(({ torus, mat, r, color }) => {
        const dist = Math.sqrt(px * px + pz * pz);
        const closeness = Math.max(0, 1 - Math.abs(dist - r) / 0.9);
        mat.opacity = torus.userData.baseOp + closeness * 0.45;
        mat.emissive = new THREE.Color(color);
        mat.emissiveIntensity = closeness * 0.7;
      });
      return;
    }

    if (mode === 'single') {
      queueBanner.visible = false;
      queueSpheres.forEach(q => q.mesh.visible = false);
      callSphere.visible = true;
      trail.forEach(s => s.visible = true);

      singleCycle = (singleCycle + effDelta * 0.22) % 1; // ~4.5s cycle for education
      const going = singleCycle < 0.5;
      const p = going ? singleCycle * 2 : (singleCycle - 0.5) * 2;
      const sphereR = going ? ringData[0].r * (1 - p) : ringData[0].r * p;
      const angle = t * 1.5;
      const px = Math.cos(angle) * sphereR;
      const pz = Math.sin(angle) * sphereR;

      for (let i = TRAIL - 1; i > 0; i--) history[i].copy(history[i - 1]);
      history[0].set(px, 0, pz);
      trail.forEach((s, i) => s.position.copy(history[i]));
      callSphere.position.set(px, 0, pz);

      // Determine active layer
      let activeLayerNum = 4;
      rings.forEach(({ torus, mat, r, color }, i) => {
        const dist = Math.sqrt(px * px + pz * pz);
        const closeness = Math.max(0, 1 - Math.abs(dist - r) / 0.8);
        mat.opacity = torus.userData.baseOp + closeness * 0.55;
        mat.emissive = new THREE.Color(color);
        mat.emissiveIntensity = closeness * 0.8;
        if (closeness > 0.4) activeLayerNum = ringData[i].layerNum;
      });

      const currentLat = (going ? (4 - activeLayerNum) * 1.2 : 4.8 - activeLayerNum * 0.6).toFixed(1);

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: going ? (4 - activeLayerNum) : (5 + activeLayerNum),
          callCount: 1,
          latency: `${currentLat} µs (+1.2µs/layer)`,
          status: going ? `⬇ Inward Crossing: Layer ${activeLayerNum}` : `⬆ Upward Return: Layer ${activeLayerNum}`,
          throughput: '210,000 calls/s',
        });
      }
    } else if (mode === 'million') {
      callSphere.visible = false;
      trail.forEach(s => s.visible = false);
      queueBanner.visible = true;

      millionCalls = Math.min(1000000, millionCalls + Math.floor(effDelta * 95000));
      if (millionCalls >= 1000000 && !paused) {
        millionCalls = 1000000;
      }

      // Rotate queue spheres slowly showing traffic jam
      queueSpheres.forEach(q => {
        q.mesh.visible = true;
        q.angle += effDelta * 0.4; // crawling slow
        q.mesh.position.set(Math.cos(q.angle) * q.r, Math.sin(t * 8 + q.angle) * 0.08, Math.sin(q.angle) * q.r);
      });

      // Rings 2 and 3 pulse red/orange to indicate severe serialization overhead
      rings[1].mat.emissive.setHex(0xea580c);
      rings[1].mat.emissiveIntensity = 0.5 + Math.sin(t * 6) * 0.3;
      rings[2].mat.emissive.setHex(0xd97706);
      rings[2].mat.emissiveIntensity = 0.6 + Math.sin(t * 7) * 0.3;

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: 2,
          callCount: millionCalls,
          latency: '24.5 µs (Stacked Queue Overhead)',
          status: '⚠️ SEVERE LATENCY SPIKE (Layer Serialization)',
          throughput: '210,000 calls/s',
        });
      }
    }
  };

  return { group, update };
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE 3: MICROKERNEL
   – Central Microkernel + 5 User-Space Servers
   – 1 System Call: 4 context switches (App -> Kernel -> Server -> Kernel -> App)
   – 1M System Calls: IPC message queue saturation! Heavy overhead, but 0 crashes.
══════════════════════════════════════════════════════════════════════════ */
function buildMicrokernel(simRef) {
  const group = new THREE.Group();

  const kernelMat = new THREE.MeshPhongMaterial({
    color: 0xd97706, shininess: 120, emissive: 0xd97706, emissiveIntensity: 0.2,
  });
  const kernel = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.55, 40), kernelMat);
  group.add(kernel);

  const kLbl = makeLabel('Microkernel (IPC · Mem · Sched)', {
    fontSize: 22, textColor: '#ffffff',
    bgColor: 'rgba(217,119,6,0.92)', borderColor: 'rgba(255,200,50,0.5)',
    canvasW: 480, canvasH: 62, planeW: 3.6,
  });
  kLbl.position.set(0, 0.75, 0);
  group.add(kLbl);

  const services = [
    { label: 'File System', color: 0x3b82f6, angle: 0 },
    { label: 'Device Drivers', color: 0x0891b2, angle: 72 },
    { label: 'Network Stack', color: 0x7c3aed, angle: 144 },
    { label: 'Security Module', color: 0x059669, angle: 216 },
    { label: 'Process Server', color: 0xdb2777, angle: 288 },
  ];
  const R = 4.2;
  const serviceMeshes = [];
  const servicePos = [];
  const serviceOrigColors = [];

  services.forEach(({ label, color, angle }) => {
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * R, z = Math.sin(rad) * R;
    servicePos.push(new THREE.Vector3(x, 0, z));
    serviceOrigColors.push(color);

    const mat = new THREE.MeshPhongMaterial({ color, shininess: 60 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 0.65), mat);
    box.position.set(x, 0, z);
    box.lookAt(0, 0, 0);
    box.userData.mat = mat;
    group.add(box);
    serviceMeshes.push(box);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(box.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 })
    );
    edge.position.copy(box.position);
    edge.rotation.copy(box.rotation);
    group.add(edge);

    const lbl = makeLabel(label, {
      fontSize: 22, textColor: '#0f172a',
      bgColor: 'rgba(255,255,255,0.93)', borderColor: `rgba(${hexToRgb(color)},0.45)`,
      canvasW: 340, canvasH: 60, planeW: 2.6,
    });
    lbl.position.set(x, 0.75, z);
    group.add(lbl);

    const spoke = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x * 0.88, 0, z * 0.88)]),
      new THREE.LineDashedMaterial({ color, transparent: true, opacity: 0.4, dashSize: 0.18, gapSize: 0.12 })
    );
    spoke.computeLineDistances();
    group.add(spoke);
  });

  // User space boundary ring
  const urGeo = new THREE.TorusGeometry(R + 0.9, 0.05, 8, 80);
  const urMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.35 });
  const urMesh = new THREE.Mesh(urGeo, urMat);
  urMesh.rotation.x = Math.PI / 2;
  group.add(urMesh);

  const uLbl = makeLabel('User Space (Isolated Servers)', {
    fontSize: 18, textColor: '#475569',
    bgColor: 'rgba(241,245,249,0.9)', borderColor: '#cbd5e1',
    canvasW: 360, canvasH: 50, planeW: 2.8,
  });
  uLbl.position.set(0, 0.1, R + 1.4);
  group.add(uLbl);

  // Idle packets (8 packets)
  const idlePackets = Array.from({ length: 8 }, (_, i) => {
    const s = makeSphere(0.16, 0xfbbf24, 0.95);
    group.add(s);
    return {
      sphere: s, progress: i / 8, svcIdx: i % services.length,
      toKernel: i % 2 === 0, speed: 0.5 + Math.random() * 0.3,
    };
  });

  // Single Call Token & Step Banner
  const singleToken = makeSphere(0.24, 0xf59e0b, 1.0);
  singleToken.visible = false;
  group.add(singleToken);

  // Million Calls Packets Swarm (45 yellow/amber packets crowding the kernel)
  const swarmPackets = Array.from({ length: 48 }, (_, i) => {
    const s = makeSphere(0.12, i % 2 === 0 ? 0xfbbf24 : 0xf97316, 0.9);
    s.visible = false;
    group.add(s);
    return {
      sphere: s,
      svcIdx: i % services.length,
      progress: Math.random(),
      speed: 1.2 + Math.random() * 1.5,
      toKernel: Math.random() > 0.5,
    };
  });

  // Saturation alert banner
  const ipcAlert = makeLabel('⚡ IPC QUEUE CONGESTION: 4,000,000 Context Switches (Kernel is crash-proof)', {
    fontSize: 20, textColor: '#b45309',
    bgColor: 'rgba(254,243,199,0.98)', borderColor: '#fde68a',
    canvasW: 680, canvasH: 60, planeW: 5.8,
  });
  ipcAlert.position.set(0, -3.4, 0);
  ipcAlert.visible = false;
  group.add(ipcAlert);

  let t = 0;
  let singleCycle = 0;
  let millionCalls = 0;

  const update = (delta) => {
    t += delta;
    const mode = simRef?.current?.mode || 'idle';
    const paused = simRef?.current?.paused || false;
    const speed = simRef?.current?.speed || 1;
    const effDelta = paused ? 0 : delta * speed;

    if (mode === 'idle') {
      singleToken.visible = false;
      ipcAlert.visible = false;
      swarmPackets.forEach(p => p.sphere.visible = false);
      idlePackets.forEach(p => p.sphere.visible = true);

      kernelMat.emissive.setHex(0xd97706);
      kernelMat.emissiveIntensity = 0.2 + Math.sin(t * 4) * 0.15;

      idlePackets.forEach((pkt, pi) => {
        pkt.progress += effDelta * pkt.speed;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
          pkt.toKernel = !pkt.toKernel;
          if (pi % 3 === 0) pkt.svcIdx = (pkt.svcIdx + 1) % services.length;
        }
        const sp = servicePos[pkt.svcIdx];
        const kp = new THREE.Vector3(0, 0, 0);
        const from = pkt.toKernel ? sp : kp;
        const to = pkt.toKernel ? kp : sp;
        pkt.sphere.position.lerpVectors(from, to, pkt.progress);
      });

      // Crash cycle on service index 2 (Network Stack) to demonstrate isolation
      const cycle = t % 8;
      const crashed = cycle > 5.5 && cycle < 6.8;
      const svcMat = serviceMeshes[2].userData.mat;
      if (crashed) {
        svcMat.color.setHex(0xef4444);
        svcMat.emissive.setHex(0xef4444);
        svcMat.emissiveIntensity = 0.5 + Math.sin(t * 15) * 0.4;
      } else {
        svcMat.color.setHex(serviceOrigColors[2]);
        svcMat.emissiveIntensity = 0;
      }
      return;
    }

    idlePackets.forEach(p => p.sphere.visible = false);

    if (mode === 'single') {
      ipcAlert.visible = false;
      swarmPackets.forEach(p => p.sphere.visible = false);
      singleToken.visible = true;

      singleCycle = (singleCycle + effDelta * 0.28) % 1; // ~3.5s cycle
      // 4 Hops:
      // Hop 1: App (User space) -> Microkernel (IPC Send, Switch #1) [0 -> 0.25]
      // Hop 2: Microkernel -> File System Server (IPC Dispatch, Switch #2) [0.25 -> 0.5]
      // Hop 3: File System -> Microkernel (IPC Reply, Switch #3) [0.5 -> 0.75]
      // Hop 4: Microkernel -> App (IPC Deliver, Switch #4) [0.75 -> 1.0]
      const appPos = new THREE.Vector3(R * 0.8, 0, R * 0.6);
      const fsPos = servicePos[0]; // File System
      const kernPos = new THREE.Vector3(0, 0, 0);

      let stepIdx = 0;
      let latency = '1.5 µs';
      let statusDesc = '';

      if (singleCycle < 0.25) {
        stepIdx = 0;
        const p = singleCycle / 0.25;
        singleToken.position.lerpVectors(appPos, kernPos, p);
        kernelMat.emissiveIntensity = p * 0.6;
        latency = (p * 1.5).toFixed(1) + ' µs';
        statusDesc = 'Hop 1: App ➔ Kernel (Context Switch 1)';
      } else if (singleCycle < 0.5) {
        stepIdx = 1;
        const p = (singleCycle - 0.25) / 0.25;
        singleToken.position.lerpVectors(kernPos, fsPos, p);
        serviceMeshes[0].userData.mat.emissive.setHex(0x3b82f6);
        serviceMeshes[0].userData.mat.emissiveIntensity = p * 0.7;
        latency = (1.5 + p * 1.6).toFixed(1) + ' µs';
        statusDesc = 'Hop 2: Kernel ➔ File Server (Context Switch 2)';
      } else if (singleCycle < 0.75) {
        stepIdx = 2;
        const p = (singleCycle - 0.5) / 0.25;
        singleToken.position.lerpVectors(fsPos, kernPos, p);
        serviceMeshes[0].userData.mat.emissiveIntensity = (1 - p) * 0.7;
        kernelMat.emissiveIntensity = p * 0.7;
        latency = (3.1 + p * 1.5).toFixed(1) + ' µs';
        statusDesc = 'Hop 3: File Server ➔ Kernel (Context Switch 3)';
      } else {
        stepIdx = 3;
        const p = (singleCycle - 0.75) / 0.25;
        singleToken.position.lerpVectors(kernPos, appPos, p);
        kernelMat.emissiveIntensity = (1 - p) * 0.4;
        latency = (4.6 + p * 1.6).toFixed(1) + ' µs';
        statusDesc = 'Hop 4: Kernel ➔ App (Context Switch 4)';
      }

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx,
          callCount: 1,
          latency: `${latency} (4 Context Switches)`,
          status: statusDesc,
          throughput: '160,000 calls/s',
        });
      }
    } else if (mode === 'million') {
      singleToken.visible = false;
      ipcAlert.visible = true;

      millionCalls = Math.min(1000000, millionCalls + Math.floor(effDelta * 80000));
      if (millionCalls >= 1000000 && !paused) {
        millionCalls = 1000000;
      }

      // Kernel cylinder pulses high-heat amber
      kernelMat.emissive.setHex(0xea580c);
      kernelMat.emissiveIntensity = 0.7 + Math.sin(t * 8) * 0.3;

      swarmPackets.forEach(pkt => {
        pkt.sphere.visible = true;
        pkt.progress += effDelta * pkt.speed;
        if (pkt.progress >= 1) {
          pkt.progress = 0;
          pkt.toKernel = !pkt.toKernel;
        }
        const sp = servicePos[pkt.svcIdx];
        const kp = new THREE.Vector3(0, 0, 0);
        const from = pkt.toKernel ? sp : kp;
        const to = pkt.toKernel ? kp : sp;
        pkt.sphere.position.lerpVectors(from, to, pkt.progress);
      });

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: 1,
          callCount: millionCalls,
          latency: '6.25 µs (High IPC Dispatcher Delay)',
          status: '⚡ IPC QUEUE SATURATION (4M Context Switches)',
          throughput: '160,000 calls/s',
        });
      }
    }
  };

  return { group, update };
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE 4: MODULES (MODERN LINUX / SOLARIS)
   – Core Kernel + Dynamic Loadable Modules
   – 1 System Call: Direct C function pointer call (1 mode switch, 0.8µs)
   – 1M System Calls: Concurrent parallel execution across all modules! 1.28M calls/sec
══════════════════════════════════════════════════════════════════════════ */
function buildModules(simRef) {
  const group = new THREE.Group();

  const coreMat = new THREE.MeshPhongMaterial({
    color: 0x059669, shininess: 100, emissive: 0x059669, emissiveIntensity: 0.2,
  });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.55, 36), coreMat);
  group.add(core);

  const cLbl = makeLabel('Core Kernel (VFS & Loader)', {
    fontSize: 22, textColor: '#fff',
    bgColor: 'rgba(5,150,105,0.92)', borderColor: 'rgba(52,211,153,0.5)',
    canvasW: 420, canvasH: 64, planeW: 3.2,
  });
  cLbl.position.set(0, 0.72, 0);
  group.add(cLbl);

  const modDefs = [
    { label: 'CPU Scheduling', color: 0x3b82f6, angle: 0 },
    { label: 'Ext4 File System', color: 0x0891b2, angle: 60 },
    { label: 'NVMe Driver', color: 0x7c3aed, angle: 120 },
    { label: 'ELF Exec Formats', color: 0x059669, angle: 180 },
    { label: 'TCP/IP STREAMS', color: 0xdb2777, angle: 240 },
    { label: 'SysCall Dispatcher', color: 0xea580c, angle: 300 },
  ];
  const R = 4.0;
  const modMeshes = [];
  const modPos = [];

  modDefs.forEach(({ label, color, angle }) => {
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * R, z = Math.sin(rad) * R;
    modPos.push(new THREE.Vector3(x, 0, z));

    const mat = new THREE.MeshPhongMaterial({ color, shininess: 60 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.55), mat);
    box.position.set(x, 0, z);
    box.lookAt(0, 0, 0);
    box.userData.mat = mat;
    group.add(box);
    modMeshes.push(box);

    const lbl = makeLabel(label, {
      fontSize: 22, textColor: '#0f172a',
      bgColor: 'rgba(255,255,255,0.93)', borderColor: `rgba(${hexToRgb(color)},0.4)`,
      canvasW: 320, canvasH: 58, planeW: 2.5,
    });
    lbl.position.set(x, 0.7, z);
    group.add(lbl);

    const spoke = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x * 0.86, 0, z * 0.86)]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45 })
    );
    group.add(spoke);
  });

  // Single Call Token & direct link beam
  const singleToken = makeSphere(0.24, 0x10b981, 1.0);
  singleToken.visible = false;
  group.add(singleToken);

  const directBeamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), modPos[1]]);
  const directBeamMat = new THREE.LineBasicMaterial({ color: 0x34d399, linewidth: 2, transparent: true, opacity: 0 });
  const directBeam = new THREE.Line(directBeamGeo, directBeamMat);
  group.add(directBeam);

  // Parallel multi-stream particles for 1M calls (48 particles across all 6 modules)
  const streamParticles = Array.from({ length: 48 }, (_, i) => {
    const mIdx = i % 6;
    const s = makeSphere(0.12, modDefs[mIdx].color, 0.95);
    s.visible = false;
    group.add(s);
    return {
      sphere: s,
      modIdx: mIdx,
      progress: Math.random(),
      speed: 1.8 + Math.random() * 1.5,
      toMod: Math.random() > 0.5,
    };
  });

  // Success scalability banner
  const successBanner = makeLabel('✅ IDEAL SCALING: 1.28M calls/sec — Direct function pointers, zero IPC bottleneck!', {
    fontSize: 20, textColor: '#15803d',
    bgColor: 'rgba(240,253,244,0.98)', borderColor: '#86efac',
    canvasW: 680, canvasH: 60, planeW: 5.8,
  });
  successBanner.position.set(0, -3.4, 0);
  successBanner.visible = false;
  group.add(successBanner);

  let t = 0;
  let singleCycle = 0;
  let millionCalls = 0;

  const update = (delta) => {
    t += delta;
    const mode = simRef?.current?.mode || 'idle';
    const paused = simRef?.current?.paused || false;
    const speed = simRef?.current?.speed || 1;
    const effDelta = paused ? 0 : delta * speed;

    if (mode === 'idle') {
      singleToken.visible = false;
      directBeamMat.opacity = 0;
      successBanner.visible = false;
      streamParticles.forEach(p => p.sphere.visible = false);

      coreMat.emissiveIntensity = 0.2 + Math.sin(t * 3) * 0.1;
      modMeshes.forEach((m, i) => {
        m.position.y = Math.sin(t * 1.4 + i * 1.1) * 0.07;
        m.userData.mat.emissiveIntensity = 0;
      });
      return;
    }

    if (mode === 'single') {
      successBanner.visible = false;
      streamParticles.forEach(p => p.sphere.visible = false);
      singleToken.visible = true;

      singleCycle = (singleCycle + effDelta * 0.45) % 1; // ~2.2s cycle
      // Direct call: App trap -> Core Kernel -> Direct Ext4 pointer -> Return
      const appPos = new THREE.Vector3(0, 0, 3.2);
      const corePos = new THREE.Vector3(0, 0, 0);
      const fsPos = modPos[1]; // Ext4 File System

      let stepIdx = 0;
      let latency = '0.3 µs';
      let statusDesc = '';

      if (singleCycle < 0.3) {
        stepIdx = 0;
        const p = singleCycle / 0.3;
        singleToken.position.lerpVectors(appPos, corePos, p);
        coreMat.emissiveIntensity = p * 0.6;
        directBeamMat.opacity = 0;
        statusDesc = 'Step 1: Trap into Core Kernel (Mode switch)';
      } else if (singleCycle < 0.7) {
        stepIdx = 1;
        const p = (singleCycle - 0.3) / 0.4;
        singleToken.position.lerpVectors(corePos, fsPos, p);
        directBeamMat.opacity = 0.9;
        modMeshes[1].userData.mat.emissive.setHex(0x0891b2);
        modMeshes[1].userData.mat.emissiveIntensity = 0.7;
        latency = '0.6 µs';
        statusDesc = 'Step 2: Direct C pointer call into Ext4 module';
      } else {
        stepIdx = 2;
        const p = (singleCycle - 0.7) / 0.3;
        singleToken.position.lerpVectors(fsPos, appPos, p);
        directBeamMat.opacity = (1 - p) * 0.8;
        latency = '0.8 µs';
        statusDesc = 'Step 3: Direct DMA return to User Space (Done)';
      }

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx,
          callCount: 1,
          latency: `${latency} (1 Mode Switch)`,
          status: statusDesc,
          throughput: '1,280,000 calls/s',
        });
      }
    } else if (mode === 'million') {
      singleToken.visible = false;
      directBeamMat.opacity = 0;
      successBanner.visible = true;

      millionCalls = Math.min(1000000, millionCalls + Math.floor(effDelta * 380000));
      if (millionCalls >= 1000000 && !paused) {
        millionCalls = 1000000;
      }

      coreMat.emissiveIntensity = 0.8 + Math.sin(t * 8) * 0.2;
      modMeshes.forEach(m => {
        m.userData.mat.emissive.setHex(0x10b981);
        m.userData.mat.emissiveIntensity = 0.35 + Math.sin(t * 6) * 0.2;
      });

      streamParticles.forEach(p => {
        p.sphere.visible = true;
        p.progress += effDelta * p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.toMod = !p.toMod;
        }
        const mp = modPos[p.modIdx];
        const cp = new THREE.Vector3(0, 0, 0);
        const from = p.toMod ? cp : mp;
        const to = p.toMod ? mp : cp;
        p.sphere.position.lerpVectors(from, to, p.progress);
      });

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: 1,
          callCount: millionCalls,
          latency: '0.78 µs (Zero Queue Delay)',
          status: '⚡ CONCURRENT MULTI-MODULE DISPATCH (Optimal)',
          throughput: '1,280,000 calls/s',
        });
      }
    }
  };

  return { group, update };
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE 5: VIRTUAL MACHINES
   – Hardware + Hypervisor base + 3 VM stacks
   – 1 System Call: Privileged instruction traps down as VM-Exit into Hypervisor
   – 1M System Calls: VM-Exit storm! Contention between VMs saturates hypervisor.
══════════════════════════════════════════════════════════════════════════ */
function buildVM(simRef) {
  const group = new THREE.Group();

  // Hardware
  const hw = makeBox(9, 0.6, 2.2, 0x475569, 0.92);
  hw.position.y = -4.5;
  group.add(hw);
  const hwLbl = makeLabel('Physical Hardware (CPU · RAM · I/O)', {
    fontSize: 22, textColor: '#fff',
    bgColor: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)',
    canvasW: 560, canvasH: 60, planeW: 4.8,
  });
  hwLbl.position.set(0, -4.5, 1.2);
  group.add(hwLbl);

  // Hypervisor
  const hypMat = new THREE.MeshPhongMaterial({ color: 0xd97706, shininess: 80, emissive: 0xd97706, emissiveIntensity: 0.18 });
  const hyp = new THREE.Mesh(new THREE.BoxGeometry(9, 0.58, 2.2), hypMat);
  hyp.position.y = -3.65;
  group.add(hyp);
  const hypLbl = makeLabel('Hypervisor (Virtual Machine Monitor)', {
    fontSize: 22, textColor: '#fff',
    bgColor: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)',
    canvasW: 460, canvasH: 58, planeW: 3.6,
  });
  hypLbl.position.set(0, -3.65, 1.2);
  group.add(hypLbl);

  const vmDefs = [
    { label: 'VM 1 — Windows', color: 0x3b82f6, x: -3.0 },
    { label: 'VM 2 — Linux', color: 0x059669, x: 0.0 },
    { label: 'VM 3 — macOS', color: 0x7c3aed, x: 3.0 },
  ];

  const vmData = [];
  vmDefs.forEach(({ label, color, x }) => {
    const vmBodyMat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.15 });
    const vmBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.4, 1.8), vmBodyMat);
    vmBody.position.set(x, -1.3, 0);
    group.add(vmBody);

    const vmEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(vmBody.geometry),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 })
    );
    vmEdge.position.set(x, -1.3, 0);
    group.add(vmEdge);

    const gosMat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.7 });
    const gos = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.48, 1.4), gosMat);
    gos.position.set(x, -2.6, 0);
    group.add(gos);

    const appMat = new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 });
    const app = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.44, 1.0), appMat);
    app.position.set(x, -1.35, 0);
    group.add(app);

    const vmTitleLbl = makeLabel(label, {
      fontSize: 20, textColor: '#0f172a',
      bgColor: 'rgba(255,255,255,0.93)', borderColor: `rgba(${hexToRgb(color)},0.4)`,
      canvasW: 320, canvasH: 56, planeW: 2.4,
    });
    vmTitleLbl.position.set(x, 0.45, 0.9);
    group.add(vmTitleLbl);

    // CPU bar
    const cpuBarMesh = makeBox(0.1, 0.12, 0.1, color, 0.9);
    cpuBarMesh.position.set(x - 0.7, -0.12, 0.97);
    group.add(cpuBarMesh);

    vmData.push({ cpuBarMesh, vmBodyMat, vmEdge, gosMat, color, x });
  });

  // Single Call Token
  const singleToken = makeSphere(0.24, 0xf59e0b, 1.0);
  singleToken.visible = false;
  group.add(singleToken);

  // Storm particles for 1M calls (36 particles)
  const stormParticles = Array.from({ length: 36 }, (_, i) => {
    const vmIdx = i % 3;
    const s = makeSphere(0.12, vmDefs[vmIdx].color, 0.9);
    s.visible = false;
    group.add(s);
    return {
      sphere: s,
      vmIdx,
      x: vmDefs[vmIdx].x + (Math.random() - 0.5) * 1.4,
      y: -1.2,
      speed: 2.2 + Math.random() * 2.0,
      goingDown: true,
    };
  });

  // Contention warning banner
  const stormBanner = makeLabel('🌪️ VM-EXIT CONTENTION STORM: Hypervisor saturated handling 1M traps!', {
    fontSize: 20, textColor: '#c2410c',
    bgColor: 'rgba(255,247,237,0.98)', borderColor: '#fb923c',
    canvasW: 680, canvasH: 60, planeW: 5.8,
  });
  stormBanner.position.set(0, -5.3, 0);
  stormBanner.visible = false;
  group.add(stormBanner);

  let t = 0;
  let singleCycle = 0;
  let millionCalls = 0;

  const update = (delta) => {
    t += delta;
    const mode = simRef?.current?.mode || 'idle';
    const paused = simRef?.current?.paused || false;
    const speed = simRef?.current?.speed || 1;
    const effDelta = paused ? 0 : delta * speed;

    if (mode === 'idle') {
      singleToken.visible = false;
      stormBanner.visible = false;
      stormParticles.forEach(p => p.sphere.visible = false);

      hypMat.emissiveIntensity = 0.15 + Math.sin(t * 2) * 0.08;
      vmData.forEach(({ cpuBarMesh, x }, i) => {
        const cpuU = 0.28 + 0.55 * Math.abs(Math.sin(t * (0.65 + i * 0.28) + i * 2.1));
        cpuBarMesh.scale.x = cpuU;
        cpuBarMesh.position.x = x - 0.75 + (cpuU * 1.5) / 2;
      });
      return;
    }

    if (mode === 'single') {
      stormBanner.visible = false;
      stormParticles.forEach(p => p.sphere.visible = false);
      singleToken.visible = true;

      singleCycle = (singleCycle + effDelta * 0.25) % 1; // ~4.0s cycle
      // Step 1: App in VM 1 executes privileged call (-1.35)
      // Step 2: Trap into Guest OS (-2.6)
      // Step 3: VM-Exit trap into Hypervisor (-3.65)
      // Step 4: Hardware DMA execution (-4.5)
      // Step 5: VM-Entry return to VM 1
      const x = vmDefs[0].x; // VM 1
      let y = -1.35;
      let stepIdx = 0;
      let latency = '2.0 µs';
      let statusDesc = '';

      if (singleCycle < 0.2) {
        stepIdx = 0;
        y = -1.35;
        statusDesc = 'Step 1: App invokes privileged I/O instruction in VM 1';
      } else if (singleCycle < 0.4) {
        stepIdx = 1;
        const p = (singleCycle - 0.2) / 0.2;
        y = -1.35 + p * (-2.6 - -1.35);
        latency = '3.5 µs';
        statusDesc = 'Step 2: Traps into Guest OS Kernel';
      } else if (singleCycle < 0.65) {
        stepIdx = 2;
        const p = (singleCycle - 0.4) / 0.25;
        y = -2.6 + p * (-3.65 - -2.6);
        hypMat.emissive.setHex(0xea580c);
        hypMat.emissiveIntensity = 0.8;
        latency = '5.8 µs (VM-Exit trap)';
        statusDesc = 'Step 3: ⚡ VM-EXIT TRAP! Control ceded to Hypervisor';
      } else if (singleCycle < 0.8) {
        stepIdx = 3;
        const p = (singleCycle - 0.65) / 0.15;
        y = -3.65 + p * (-4.5 - -3.65);
        latency = '7.5 µs';
        statusDesc = 'Step 4: Physical Hardware DMA Transfer';
      } else {
        stepIdx = 4;
        const p = (singleCycle - 0.8) / 0.2;
        y = -4.5 + p * (-1.35 - -4.5);
        latency = '7.5 µs (Complete)';
        statusDesc = 'Step 5: VM-ENTRY resumes VM 1 execution';
      }

      singleToken.position.set(x, y, 0.95);

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx,
          callCount: 1,
          latency: latency,
          status: statusDesc,
          throughput: '135,000 calls/s',
        });
      }
    } else if (mode === 'million') {
      singleToken.visible = false;
      stormBanner.visible = true;

      millionCalls = Math.min(1000000, millionCalls + Math.floor(effDelta * 68000));
      if (millionCalls >= 1000000 && !paused) {
        millionCalls = 1000000;
      }

      // Max out CPU bars to 100%
      vmData.forEach(({ cpuBarMesh, x }) => {
        cpuBarMesh.scale.x = 1.0;
        cpuBarMesh.position.x = x;
      });

      // Hypervisor flashes amber under VM-Exit load
      hypMat.emissive.setHex(0xea580c);
      hypMat.emissiveIntensity = 0.7 + Math.sin(t * 10) * 0.3;

      stormParticles.forEach(p => {
        p.sphere.visible = true;
        p.y -= effDelta * p.speed;
        if (p.y < -4.6) {
          p.y = -1.1;
          p.x = vmDefs[p.vmIdx].x + (Math.random() - 0.5) * 1.4;
        }
        p.sphere.position.set(p.x, p.y, 0.9);
      });

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: 2,
          callCount: millionCalls,
          latency: '7.40 µs (High Trap & Emulate Cost)',
          status: '🌪️ VM-EXIT CONTENTION (Hypervisor Saturated)',
          throughput: '135,000 calls/s',
        });
      }
    }
  };

  return { group, update };
}

/* ══════════════════════════════════════════════════════════════════════════
   SCENE 6: VMWARE VSPHERE / ESXi
   – Bare-Metal Type 1 Hypervisor + Hardware Assist
   – 1 System Call: VT-x hardware assist executes directly with bare-metal path (1.2µs)
   – 1M System Calls: DRS load balances across host cluster with vMotion live migration!
══════════════════════════════════════════════════════════════════════════ */
function buildVMware(simRef) {
  const group = new THREE.Group();

  const layerDefs = [
    { label: 'Guest Application', color: 0x3b82f6, y: 3.8, w: 6.2, h: 0.75 },
    { label: 'Guest OS Kernel', color: 0x0891b2, y: 2.7, w: 5.8, h: 0.7 },
    { label: 'VMware VM Container', color: 0x7c3aed, y: 1.5, w: 7.2, h: 0.75 },
    { label: 'VMware ESXi Hypervisor', color: 0xd97706, y: 0.3, w: 7.4, h: 0.78 },
    { label: 'Physical Hardware (x86-64)', color: 0x475569, y: -0.9, w: 7.4, h: 0.72 },
  ];

  const layerMats = [];
  layerDefs.forEach(({ label, color, y, w, h }) => {
    const mat = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 70 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.65), mat);
    box.position.y = y;
    group.add(box);
    layerMats.push({ mat, color });

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(box.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    );
    edge.position.y = y;
    group.add(edge);

    const lbl = makeLabel(label, {
      fontSize: 22, textColor: '#fff',
      bgColor: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)',
      canvasW: 480, canvasH: 62, planeW: 3.8,
    });
    lbl.position.set(0, y, 0.42);
    group.add(lbl);
  });

  // vMotion banner & dashed line
  const vmPts = [new THREE.Vector3(-3.5, 1.5, 0.5), new THREE.Vector3(3.5, 1.5, 0.5)];
  const vmMat = new THREE.LineDashedMaterial({ color: 0xd97706, transparent: true, opacity: 0, dashSize: 0.28, gapSize: 0.18 });
  const vmLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vmPts), vmMat);
  vmLine.computeLineDistances();
  group.add(vmLine);

  const vmLbl = makeLabel('⚡ DRS / vMotion: Active Load Balancing & Migration', {
    fontSize: 20, textColor: '#92400e',
    bgColor: 'rgba(255,251,235,0.95)', borderColor: '#fde68a',
    canvasW: 560, canvasH: 60, planeW: 4.8,
  });
  vmLbl.position.set(0, 2.3, 0.5);
  vmLbl.visible = false;
  group.add(vmLbl);

  // Single Call Token
  const singleToken = makeSphere(0.24, 0x10b981, 1.0);
  singleToken.visible = false;
  group.add(singleToken);

  // High-volume workload spheres for 1M calls (32 particles)
  const colors = [0x3b82f6, 0x059669, 0xdb2777, 0xea580c];
  const streamParticles = Array.from({ length: 32 }, (_, i) => {
    const s = makeSphere(0.18, colors[i % colors.length], 0.92);
    s.visible = false;
    group.add(s);
    return {
      sphere: s,
      progress: Math.random(),
      xOff: -2.8 + (i % 5) * 1.4,
      speed: 1.8 + Math.random() * 1.2,
      goingDown: true,
    };
  });

  let t = 0;
  let singleCycle = 0;
  let millionCalls = 0;

  const update = (delta) => {
    t += delta;
    const mode = simRef?.current?.mode || 'idle';
    const paused = simRef?.current?.paused || false;
    const speed = simRef?.current?.speed || 1;
    const effDelta = paused ? 0 : delta * speed;

    if (mode === 'idle') {
      singleToken.visible = false;
      streamParticles.forEach(p => p.sphere.visible = false);
      const cyc = (t % 8) / 8;
      const vActive = cyc > 0.62 && cyc < 0.88;
      vmLbl.visible = vActive;
      vmMat.opacity = vActive ? 0.7 + 0.3 * Math.sin(t * 12) : 0;
      return;
    }

    if (mode === 'single') {
      vmLbl.visible = false;
      vmMat.opacity = 0;
      streamParticles.forEach(p => p.sphere.visible = false);
      singleToken.visible = true;

      singleCycle = (singleCycle + effDelta * 0.35) % 1; // ~2.8s cycle
      // Direct Hardware Assist Path: App (3.8) -> VT-x direct execution -> Hardware (-0.9) -> Return
      let y = 3.8;
      let stepIdx = 0;
      let latency = '0.5 µs';
      let statusDesc = '';

      if (singleCycle < 0.3) {
        stepIdx = 0;
        y = 3.8 - (singleCycle / 0.3) * (3.8 - 2.7);
        statusDesc = 'Step 1: Guest OS traps instruction with VT-x hardware assist';
      } else if (singleCycle < 0.7) {
        stepIdx = 1;
        const p = (singleCycle - 0.3) / 0.4;
        y = 2.7 - p * (2.7 - -0.9);
        layerMats[3].mat.emissive.setHex(0xd97706);
        layerMats[3].mat.emissiveIntensity = 0.5;
        latency = '1.0 µs';
        statusDesc = 'Step 2: Bare-metal ESXi hypervisor schedules direct I/O path';
      } else {
        stepIdx = 2;
        const p = (singleCycle - 0.7) / 0.3;
        y = -0.9 + p * (3.8 - -0.9);
        latency = '1.2 µs (Fast)';
        statusDesc = 'Step 3: Direct hardware completion returns to Guest vCPU';
      }

      singleToken.position.set(0, y, 0.48);

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx,
          callCount: 1,
          latency: latency,
          status: statusDesc,
          throughput: '890,000 calls/s',
        });
      }
    } else if (mode === 'million') {
      singleToken.visible = false;
      vmLbl.visible = true;
      vmMat.opacity = 0.8 + 0.2 * Math.sin(t * 8);

      millionCalls = Math.min(1000000, millionCalls + Math.floor(effDelta * 260000));
      if (millionCalls >= 1000000 && !paused) {
        millionCalls = 1000000;
      }

      streamParticles.forEach(p => {
        p.sphere.visible = true;
        p.progress += effDelta * p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
        }
        const y = 3.8 - p.progress * (3.8 - -0.9);
        p.sphere.position.set(p.xOff, y, 0.48);
      });

      if (simRef.current.onTelemetry) {
        simRef.current.onTelemetry({
          stepIdx: 1,
          callCount: millionCalls,
          latency: '1.12 µs (Stable Enterprise Throughput)',
          status: '⚖️ DRS DYNAMIC BALANCING (Optimal Cluster SLA)',
          throughput: '890,000 calls/s',
        });
      }
    }
  };

  return { group, update };
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION METADATA & EDUCATIONAL TELEMETRY DATA
══════════════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  {
    id: 'simple', label: 'Simple Structure', icon: '📦', color: '#3b82f6', build: buildSimple,
    simData: {
      single: {
        title: 'Single System Call (INT 21h)',
        hops: '1 Hop (Bypasses resident OS)',
        latency: '0.4 µs',
        switches: '0 Context Switches',
        overhead: 'Near Zero (No isolation)',
        steps: [
          'App issues read() interrupt INT 21h',
          'Direct jump into Device Driver (No kernel barrier)',
          'Raw hardware access via ROM BIOS drivers',
          'Data returned directly to Application buffer',
        ],
        verdict: 'Extremely fast because there are no privilege boundaries or mode switches.',
      },
      million: {
        title: '1,000,000 System Calls (Load Test)',
        throughput: '2,200,000 calls/sec',
        latency: '0.45 µs',
        risk: '🚨 CRITICAL RISK: Memory Corruption / Kernel Crash',
        bottleneck: 'None (Pure hardware CPU limit)',
        verdict: 'Handles 1M calls with raw speed, BUT a single pointer bug in any 1 call corrupts the entire OS (Zero fault isolation).',
      },
    },
    info: {
      title: 'Simple / Monolithic Structure', accent: '#3b82f6',
      what: 'Systems that grew without deliberate architecture (e.g. MS-DOS). No module boundaries or dual-mode protection — any application can directly write to driver or BIOS memory.',
      pros: ['Very fast raw execution (no mode switches or ring traversal)', 'Simple to implement initially'],
      cons: ['No memory protection — any user program can overwrite kernel code', 'No dual mode (User vs Kernel)', 'Difficult to debug and maintain as system grows'],
      examples: 'MS-DOS, Original UNIX (early versions)',
      animNote: 'Switch between 1 System Call and 1M System Calls to see why speed without boundaries led to frequent system crashes.',
    },
  },
  {
    id: 'layered', label: 'Layered Approach', icon: '🔵', color: '#0891b2', build: buildLayered,
    simData: {
      single: {
        title: 'Single System Call (Traversing Rings)',
        hops: '8 Transitions (Layer N ➔ 3 ➔ 2 ➔ 1 ➔ 0 ➔ Return)',
        latency: '4.8 µs',
        switches: '8 Ring Boundary Checks',
        overhead: 'High (+1.2 µs added per layer traversed)',
        steps: [
          'App at Layer N calls read()',
          'Layer 3 (I/O Management) validates file handle',
          'Layer 2 (Memory) translates virtual to physical address',
          'Layer 1 (Scheduler) puts process in waiting state',
          'Layer 0 (Hardware) executes device driver DMA',
          'Returns upward through 1 ➔ 2 ➔ 3 ➔ N',
        ],
        verdict: 'Strict abstraction guarantees safety, but incurs stacked boundary validation overhead.',
      },
      million: {
        title: '1,000,000 System Calls (Load Test)',
        throughput: '210,000 calls/sec',
        latency: '24.5 µs (Severe Congestion)',
        risk: '🐢 SEVERE BOTTLENECK: Serialization queue buildup',
        bottleneck: 'Layer 2 & 3 boundary serialization gates',
        verdict: 'Under 1M calls, intermediate layers become choked bottlenecks. This is why pure layered designs were largely abandoned for modern kernels.',
      },
    },
    info: {
      title: 'Layered Approach', accent: '#0891b2',
      what: 'OS is partitioned into N hierarchical layers. Layer 0 is Hardware; Layer N is User Interface. Each layer ONLY invokes services of the layer directly beneath it.',
      pros: ['Simplicity of construction and debugging — debug layer by layer', 'Clean modular abstraction — each layer hides its implementation', 'Verification is straightforward'],
      cons: ['Defining appropriate layer boundaries is difficult', 'Performance penalty: every call must cross intermediate layers', 'Slow single call latency'],
      examples: 'THE Multiprogramming System (Dijkstra), MULTICS',
      animNote: 'Watch the single call spiral inward through every layer. Under 1M calls, observe the massive congestion queue at Layer 2/3.',
    },
  },
  {
    id: 'microkernel', label: 'Microkernel', icon: '⚙️', color: '#d97706', build: buildMicrokernel,
    simData: {
      single: {
        title: 'Single System Call (User Space IPC)',
        hops: '4 Hops (App ➔ Kernel ➔ File Server ➔ Kernel ➔ App)',
        latency: '6.2 µs',
        switches: '4 Context Switches (User ➔ Kernel ➔ User ➔ Kernel ➔ User)',
        overhead: 'Very High (4 Mode Switches + IPC Message Copying)',
        steps: [
          'App sends IPC msg_send() to Microkernel (User ➔ Kernel)',
          'Microkernel routes message to File System server (Kernel ➔ User)',
          'File Server processes request in user space',
          'File Server replies via IPC to Microkernel (User ➔ Kernel)',
          'Microkernel returns buffer to App space (Kernel ➔ User)',
        ],
        verdict: 'Servers run safely in user space, but 4 context switches per call create significant overhead.',
      },
      million: {
        title: '1,000,000 System Calls (Load Test)',
        throughput: '160,000 calls/sec',
        latency: '6.25 µs',
        risk: '⚡ IPC BUS SATURATION: 4,000,000 Context Switches',
        bottleneck: 'Central IPC message queue dispatcher in Microkernel',
        verdict: 'Throughput is limited by context switching, BUT even under extreme stress, no server crash can ever bring down the kernel (100% crash-proof).',
      },
    },
    info: {
      title: 'Microkernel Structure', accent: '#d97706',
      what: 'Stripped-down core kernel containing only IPC, memory management, and low-level scheduling. File systems, networking, and device drivers run as isolated user-space daemons.',
      pros: ['Exceptional reliability: a crash in file system or network does NOT crash the OS', 'Easy to extend and port to new architectures', 'Enhanced security with least-privilege enforcement'],
      cons: ['Performance penalty from frequent IPC context switches', 'Message copy overhead between user address spaces'],
      examples: 'Mach, QNX (automotive/avionics), MINIX 3, seL4, Apple macOS XNU (hybrid)',
      animNote: 'Watch the 4 distinct context switch hops for 1 call. Under 1M calls, notice how the microkernel buffers messages safely without crashing.',
    },
  },
  {
    id: 'modules', label: 'Modules (LKM)', icon: '🧩', color: '#059669', build: buildModules,
    simData: {
      single: {
        title: 'Single System Call (Direct Function Pointer)',
        hops: '2 Hops (App ➔ Core Kernel ➔ Module)',
        latency: '0.8 µs',
        switches: '1 Context Switch (User ➔ Kernel Mode)',
        overhead: 'Minimal (Direct C function call in kernel space)',
        steps: [
          'App issues sys_read() trap into Core Kernel',
          'VFS resolves dynamic symbol table in kernel memory',
          'Direct C function pointer call into Ext4 File System module',
          'Module transfers data via DMA and returns directly to user buffer',
        ],
        verdict: 'Best of both worlds: modular dynamic loading with direct monolithic call speed.',
      },
      million: {
        title: '1,000,000 System Calls (Load Test)',
        throughput: '1,280,000 calls/sec',
        latency: '0.78 µs',
        risk: '✅ OPTIMAL: Zero IPC bottleneck, full multi-core scalability',
        bottleneck: 'Physical NVMe / PCIe hardware bandwidth',
        verdict: 'Handles 1M calls smoothly in parallel across independent modules. This is why modern Linux, Solaris, and Windows use dynamic modules.',
      },
    },
    info: {
      title: 'Loadable Kernel Modules (LKM)', accent: '#059669',
      what: 'Modern object-oriented kernel architecture. The core kernel provides essential services, while modules (file systems, drivers, protocols) dynamically load and link on demand.',
      pros: ['Dynamic: load and unload modules without rebooting', 'High performance: calls between modules are direct function calls (no IPC)', 'Flexible: any module can call any other'],
      cons: ['Module interface design is complex', 'A buggy kernel module can still crash the kernel (runs in ring 0)'],
      examples: 'Linux LKM (`insmod`/`rmmod`), Solaris, macOS KEXTs, Windows WDM Drivers',
      animNote: 'Observe how 1 call reaches the module directly with 0.8µs latency. Under 1M calls, all modules process requests concurrently with zero bottleneck.',
    },
  },
  {
    id: 'vm', label: 'Virtual Machines', icon: '🖥️', color: '#7c3aed', build: buildVM,
    simData: {
      single: {
        title: 'Single System Call (VM-Exit Trap)',
        hops: '4 Hops (App ➔ Guest OS ➔ Hypervisor ➔ Hardware)',
        latency: '7.5 µs',
        switches: '3 Switches (VM-Exit trap + Host OS context switch)',
        overhead: 'High (Trap and emulate privileged instructions)',
        steps: [
          'App executes I/O instruction inside Guest OS',
          'Privileged instruction triggers a hardware VM-Exit trap',
          'Hypervisor intercepts trap, translates guest physical address',
          'Hypervisor executes real hardware DMA via Host OS drivers',
          'VM-Entry resumes Guest OS execution',
        ],
        verdict: 'Provides complete multi-OS isolation, but sensitive instructions incur expensive VM-Exit traps.',
      },
      million: {
        title: '1,000,000 System Calls (Load Test)',
        throughput: '135,000 calls/sec',
        latency: '7.40 µs',
        risk: '🌪️ VM-EXIT STORM: Hypervisor CPU saturation & VM contention',
        bottleneck: 'Hypervisor vCPU time-slicing & trap dispatching',
        verdict: 'Under 1M calls, competing VMs cause noisy-neighbor slowdown as the hypervisor spends CPU cycles context-switching between virtual machines.',
      },
    },
    info: {
      title: 'Virtual Machines (VMs)', accent: '#7c3aed',
      what: 'Hypervisor (VMM) abstracts physical hardware into multiple isolated virtual machines. Each guest OS believes it owns the complete physical computer.',
      pros: ['Complete fault and security isolation: one VM crash cannot harm others', 'Run completely different operating systems simultaneously (Windows, Linux)', 'Instant snapshotting, cloning, and state backup'],
      cons: ['Performance overhead from virtualization and VM-Exit traps', 'Physical RAM and CPU are partitioned across guest VMs'],
      examples: 'VirtualBox, QEMU, KVM, Microsoft Hyper-V',
      animNote: 'Watch the VM-Exit trap descend into the hypervisor on a single call. Under 1M calls, observe CPU saturation and resource contention across all 3 VMs.',
    },
  },
  {
    id: 'vmware', label: 'VMware ESXi', icon: '🌐', color: '#db2777', build: buildVMware,
    simData: {
      single: {
        title: 'Single System Call (Hardware Assisted VT-x)',
        hops: '2 Hops (Direct CPU execution with VT-x hardware assist)',
        latency: '1.2 µs',
        switches: '1 Switch (Direct hardware virtualization)',
        overhead: 'Low (Bare-metal Type 1 hypervisor bypasses host OS)',
        steps: [
          'Guest App invokes call inside VMware container',
          'Intel VT-x / AMD-V silicon executes call directly on physical CPU',
          'ESXi bare-metal hypervisor handles I/O via direct pass-through',
          'Hardware completes and returns immediately to vCPU',
        ],
        verdict: 'Bare-metal Type 1 design eliminates the host OS layer, providing near-native execution speed.',
      },
      million: {
        title: '1,000,000 System Calls (Load Test)',
        throughput: '890,000 calls/sec',
        latency: '1.12 µs (Consistent Enterprise SLA)',
        risk: '⚖️ OPTIMAL: VMware DRS balances load across cluster',
        bottleneck: 'Physical network and storage fabric bandwidth',
        verdict: 'Enterprise-grade scheduler distributes 1M calls across CPU cores; live vMotion migrates heavy workloads with zero downtime.',
      },
    },
    info: {
      title: 'VMware ESXi / vSphere', accent: '#db2777',
      what: 'Type 1 enterprise bare-metal hypervisor. ESXi runs directly on server hardware with no intermediate host operating system, utilizing hardware virtualization (VT-x/AMD-V).',
      pros: ['Zero host OS overhead — the hypervisor is the operating system', 'Hardware-assisted direct execution on CPU silicon', 'vMotion: live migration of running VMs across servers with zero downtime', 'DRS (Distributed Resource Scheduler) auto-balances cluster loads'],
      cons: ['High enterprise licensing cost', 'Dedicated certified hardware compatibility required'],
      examples: 'VMware ESXi, VMware vSphere, vCenter, Cloud Foundation',
      animNote: 'See how VMware ESXi handles 1M calls with hardware acceleration while vMotion dynamically balances the workload across host resources.',
    },
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function OSStructures({ onBack }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animRef = useRef(null);
  const groupRef = useRef(null);
  const updateRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  // Drag state
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotRef = useRef({ x: 0.28, y: -0.3 });

  // Simulation controls state
  const [activeSection, setActiveSection] = useState('simple');
  const [simMode, setSimMode] = useState('idle'); // 'idle' | 'single' | 'million'
  const [simPaused, setSimPaused] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1);
  const [telemetry, setTelemetry] = useState({
    stepIdx: 0,
    callCount: 0,
    latency: '0.0 µs',
    status: 'Ready',
    throughput: '0 calls/s',
  });

  const simRef = useRef({
    mode: 'idle',
    paused: false,
    speed: 1,
    onTelemetry: (t) => {
      // Throttle telemetry update to avoid excessive re-renders
      setTelemetry(t);
    },
  });

  // Keep simRef in sync with React state
  useEffect(() => {
    simRef.current.mode = simMode;
    simRef.current.paused = simPaused;
    simRef.current.speed = simSpeed;
  }, [simMode, simPaused, simSpeed]);

  /* ── Init Three.js ────────────────────────────────────────────────── */
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5fb);
    scene.fog = new THREE.FogExp2(0xeef2ff, 0.022);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
    camera.position.set(0, 2, 14);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 1.25);
    sun.position.set(8, 14, 10); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdbeafe, 0.55);
    fill.position.set(-8, -4, -6); scene.add(fill);
    const accent = new THREE.PointLight(0x818cf8, 1.1, 35);
    accent.position.set(0, 6, 6); scene.add(accent);

    // Floor grid
    const grid = new THREE.GridHelper(50, 50, 0xdbeafe, 0xe8edff);
    grid.position.y = -7.5;
    scene.add(grid);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw / nh; camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    /* Drag controls */
    const onDown = (e) => { isDragging.current = true; prevMouse.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => { isDragging.current = false; };
    const onMove = (e) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      rotRef.current.y += dx * 0.012;
      rotRef.current.x = Math.max(-0.85, Math.min(0.85, rotRef.current.x + dy * 0.007));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    renderer.domElement.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);

    /* Render loop */
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      if (groupRef.current) {
        groupRef.current.rotation.x = rotRef.current.x;
        groupRef.current.rotation.y = rotRef.current.y;

        groupRef.current.traverse((child) => {
          if (child.userData.isLabel) {
            child.quaternion.copy(camera.quaternion);
          }
        });

        if (updateRef.current) updateRef.current(delta);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  /* ── Swap scene ───────────────────────────────────────────────────── */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (groupRef.current) { scene.remove(groupRef.current); groupRef.current = null; updateRef.current = null; }
    const sec = SECTIONS.find((s) => s.id === activeSection);
    if (!sec) return;
    const { group, update } = sec.build(simRef);
    rotRef.current = { x: 0.28, y: -0.3 };
    scene.add(group);
    groupRef.current = group;
    updateRef.current = update;
  }, [activeSection]);

  const sec = SECTIONS.find((s) => s.id === activeSection);
  const info = sec?.info;
  const simInfo = sec?.simData;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#f8faff 0%,#eef2ff 60%,#faf5ff 100%)',
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 1.75rem',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid #e0e7ff',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 14px rgba(99,102,241,0.07)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '10px',
            padding: '0.38rem 1rem', color: '#475569', cursor: 'pointer',
            fontSize: '0.84rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.color = '#4338ca'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
        >← Back
        </button>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
            OS Structures &amp; Virtual Machines — 3D Architecture &amp; System Call Simulator
          </h1>
          <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0 }}>
            Interactive educational comparison: 1 Call vs 1 Million Calls throughput, bottlenecks &amp; latency
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            background: `${sec?.color}18`, border: `1.5px solid ${sec?.color}45`,
            borderRadius: '100px', padding: '0.28rem 0.85rem',
            fontSize: '0.76rem', fontWeight: 700, color: sec?.color,
          }}>
            {sec?.icon} {sec?.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.42rem', flexWrap: 'wrap',
        padding: '0.65rem 1.5rem',
        background: 'rgba(255,255,255,0.75)',
        borderBottom: '1.5px solid #e0e7ff',
        backdropFilter: 'blur(10px)',
      }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{
              background: activeSection === s.id ? s.color : 'white',
              border: `1.5px solid ${activeSection === s.id ? s.color : '#e2e8f0'}`,
              borderRadius: '100px', padding: '0.36rem 0.95rem', cursor: 'pointer',
              color: activeSection === s.id ? 'white' : '#64748b',
              fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              boxShadow: activeSection === s.id ? `0 4px 14px ${s.color}40` : 'none',
            }}
          >{s.icon} {s.label}</button>
        ))}
      </div>

      {/* System Call Simulation Control Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap',
        padding: '0.6rem 1.5rem',
        background: 'linear-gradient(90deg, #ffffff 0%, #f8faff 100%)',
        borderBottom: '1.5px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Simulate Mode:
          </span>
        </div>

        {/* Mode selector buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '10px' }}>
          <button
            onClick={() => setSimMode('idle')}
            style={{
              background: simMode === 'idle' ? 'white' : 'transparent',
              border: 'none', borderRadius: '8px', padding: '0.32rem 0.8rem',
              color: simMode === 'idle' ? '#0f172a' : '#64748b',
              fontWeight: simMode === 'idle' ? 700 : 500, fontSize: '0.78rem',
              cursor: 'pointer', boxShadow: simMode === 'idle' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            👁️ Architecture Overview
          </button>

          <button
            onClick={() => setSimMode('single')}
            style={{
              background: simMode === 'single' ? '#3b82f6' : 'transparent',
              border: 'none', borderRadius: '8px', padding: '0.32rem 0.85rem',
              color: simMode === 'single' ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              boxShadow: simMode === 'single' ? '0 2px 8px rgba(59,130,246,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            ⚡ Simulate 1 System Call
          </button>

          <button
            onClick={() => setSimMode('million')}
            style={{
              background: simMode === 'million' ? '#ea580c' : 'transparent',
              border: 'none', borderRadius: '8px', padding: '0.32rem 0.85rem',
              color: simMode === 'million' ? 'white' : '#475569',
              fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
              boxShadow: simMode === 'million' ? '0 2px 8px rgba(234,88,12,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            🔥 Simulate 1,000,000 Calls
          </button>
        </div>

        {/* Play/Pause & Speed */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            onClick={() => setSimPaused(p => !p)}
            style={{
              background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '8px',
              padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#334155',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            {simPaused ? '▶ Resume' : '⏸ Pause'}
          </button>

          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '0.15rem' }}>
            {[0.5, 1, 2].map(sp => (
              <button
                key={sp}
                onClick={() => setSimSpeed(sp)}
                style={{
                  background: simSpeed === sp ? 'white' : 'transparent',
                  border: 'none', borderRadius: '6px', padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem', fontWeight: simSpeed === sp ? 700 : 500,
                  color: simSpeed === sp ? '#0f172a' : '#64748b', cursor: 'pointer',
                }}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas + Info Panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 390px', minHeight: 0 }}>
        {/* 3D Canvas with Interactive Telemetry HUD */}
        <div ref={mountRef} style={{ position: 'relative', height: 'calc(100vh - 188px)', cursor: 'grab' }}>
          {/* On-Canvas Telemetry HUD */}
          {simMode !== 'idle' && (
            <div style={{
              position: 'absolute', top: '1rem', left: '1rem', zIndex: 10,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
              border: '1.5px solid #e0e7ff', borderRadius: '14px',
              padding: '0.85rem 1.15rem', maxWidth: '380px',
              boxShadow: '0 8px 24px rgba(99,102,241,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: simMode === 'single' ? '#2563eb' : '#ea580c',
                  background: simMode === 'single' ? '#eff6ff' : '#fff7ed',
                  padding: '0.2rem 0.55rem', borderRadius: '6px', border: `1px solid ${simMode === 'single' ? '#bfdbfe' : '#fed7aa'}`,
                }}>
                  {simMode === 'single' ? '⚡ 1 System Call Flow' : '🔥 1 Million Calls Load Test'}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                  {telemetry.throughput}
                </span>
              </div>

              {simMode === 'single' ? (
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.2rem' }}>
                    {telemetry.status}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.45rem', fontSize: '0.75rem', color: '#475569' }}>
                    <div><strong>Latency:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{telemetry.latency}</span></div>
                    <div><strong>Hops:</strong> <span style={{ color: '#2563eb', fontWeight: 700 }}>{simInfo?.single.hops}</span></div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    {simInfo?.single.verdict}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Total Processed:</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ea580c', fontFamily: 'monospace' }}>
                      {telemetry.callCount.toLocaleString()} / 1,000,000
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                    <div style={{
                      width: `${(telemetry.callCount / 1000000) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f97316, #ef4444)',
                      transition: 'width 0.1s linear',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.2rem' }}>
                    {telemetry.status}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.45 }}>
                    <strong>Bottleneck:</strong> {simInfo?.million.bottleneck}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)',
            border: '1.5px solid #e0e7ff', borderRadius: '100px',
            padding: '0.3rem 1rem', fontSize: '0.7rem', color: '#64748b', pointerEvents: 'none',
          }}>
            🖱 Click &amp; drag to rotate the 3D model
          </div>
        </div>

        {/* Info & Simulation Analysis Panel */}
        <div style={{
          overflowY: 'auto', padding: '1.5rem',
          borderLeft: '1.5px solid #e0e7ff',
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(14px)',
        }}>
          {info && (
            <>
              <div style={{ width: 44, height: 5, background: `linear-gradient(90deg,${info.accent},${info.accent}30)`, borderRadius: '3px', marginBottom: '0.85rem' }} />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: info.accent, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{info.title}</h2>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.7, marginBottom: '1rem', background: `${info.accent}0c`, padding: '0.7rem 0.9rem', borderRadius: '10px', border: `1.5px solid ${info.accent}1a` }}>
                {info.what}
              </p>

              {/* Dedicated System Call Performance Breakdown */}
              <div style={{
                background: '#ffffff', border: '1.5px solid #e0e7ff', borderRadius: '12px',
                padding: '0.9rem', marginBottom: '1.1rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🔬 System Call Performance
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700 }}>
                    1 Call vs 1M Calls
                  </span>
                </div>

                {/* 1 Call Box */}
                <div style={{
                  background: '#f8faff', border: '1px solid #dbeafe', borderRadius: '8px',
                  padding: '0.65rem', marginBottom: '0.6rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8' }}>
                      ⚡ 1 System Call Latency:
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#059669' }}>
                      {simInfo?.single.latency}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', marginBottom: '0.35rem' }}>
                    <strong>Overhead:</strong> {simInfo?.single.overhead}
                  </div>
                  <div style={{ fontSize: '0.71rem', color: '#64748b', lineHeight: 1.5 }}>
                    <strong>Step-by-step path:</strong>
                    <ol style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                      {simInfo?.single.steps.map((st, idx) => (
                        <li key={idx} style={{ marginBottom: '0.15rem' }}>{st}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* 1M Calls Box */}
                <div style={{
                  background: '#fffaf5', border: '1px solid #ffedd5', borderRadius: '8px',
                  padding: '0.65rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c2410c' }}>
                      🔥 1 Million Calls Throughput:
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ea580c' }}>
                      {simInfo?.million.throughput}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#7c2d12', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {simInfo?.million.risk}
                  </div>
                  <p style={{ fontSize: '0.71rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    {simInfo?.million.verdict}
                  </p>
                </div>
              </div>

              {info.pros.length > 0 && (
                <div style={{ marginBottom: '0.9rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>✅ Advantages</p>
                  {info.pros.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.45rem', fontSize: '0.81rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.3rem' }}>
                      <span style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }}>▸</span>{p}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>❌ Disadvantages</p>
                {info.cons.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.45rem', fontSize: '0.81rem', color: '#374151', lineHeight: 1.6, marginBottom: '0.3rem' }}>
                    <span style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }}>▸</span>{c}
                  </div>
                ))}
              </div>

              <div style={{ background: `${info.accent}0e`, border: `1.5px solid ${info.accent}22`, borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.79rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                <span style={{ color: info.accent, fontWeight: 700 }}>📌 Examples: </span>{info.examples}
              </div>

              <div>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Other Topics</p>
                {SECTIONS.filter(s => s.id !== activeSection).map(s => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.55rem',
                      width: '100%', textAlign: 'left', background: 'transparent',
                      border: 'none', borderRadius: '8px', padding: '0.42rem 0.65rem',
                      cursor: 'pointer', color: '#64748b', fontSize: '0.81rem', fontWeight: 500,
                      transition: 'all 0.18s', marginBottom: '0.1rem',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${s.color}12`; e.currentTarget.style.color = s.color; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
                  >{s.icon} {s.label}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
