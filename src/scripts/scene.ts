// The 3D layer of the ascent, loaded after first paint. Flat fills and ink edges, like a technical
// drawing: message slips at ground level, an amber core, 42 destination cubes, stacked reports,
// interface frames, an easing curve and the autopilot ring. Each object is pinned to an empty
// "anchor" box in the layout, so it travels with the page and never sits on top of body text.

import * as THREE from 'three';
import { state } from './state';
import { flowMessages } from '../i18n/demo-scripts';

// Nominal height in world units of each chapter's object, used to fit it into its anchor.
const NOMINAL = [3.9, 5.4, 4.6, 4.4, 3.6, 3.8, 6.2];
const FOV = 30;
const CUBES = 42;
const DIST = 16;
const TONES = {
  paper: { line: new THREE.Color('#0D0D10'), accent: new THREE.Color('#1F33D1') },
  cobalt: { line: new THREE.Color('#F3F3EE'), accent: new THREE.Color('#FFB020') },
  ink: { line: new THREE.Color('#EBEBE6'), accent: new THREE.Color('#FFB020') },
};
const AMBER = new THREE.Color('#FFB020');
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export async function startScene(canvas: HTMLCanvasElement): Promise<boolean> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return false;
  }
  const mobile = state.mobile;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, DIST);
  camera.lookAt(0, 0, 0);
  const world = new THREE.Group();
  scene.add(world);

  const side = state.rtl ? -1 : 1;
  const anchors = Array.from({ length: 7 }, (_, i) => document.querySelector<HTMLElement>(`[data-anchor="${i}"]`));
  const lineMat = new THREE.LineBasicMaterial({ color: TONES.paper.line.clone(), transparent: true, opacity: 0.9 });
  const faintMat = new THREE.LineBasicMaterial({ color: TONES.paper.line.clone(), transparent: true, opacity: 0.18 });
  const accentMat = new THREE.MeshBasicMaterial({ color: TONES.paper.accent.clone() });
  const amberMat = new THREE.MeshBasicMaterial({ color: AMBER });

  const edges = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial = lineMat) => new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
  const levels: THREE.Group[] = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    world.add(g);
    levels.push(g);
  }

  /* ---------- 00 · message slips ---------- */
  const floorPts: THREE.Vector3[] = [];
  for (let i = -5; i <= 5; i++) {
    floorPts.push(new THREE.Vector3(i * 0.8, -2.6, -5), new THREE.Vector3(i * 0.8, -2.6, 3));
    floorPts.push(new THREE.Vector3(-4, -2.6, i * 0.8 - 1), new THREE.Vector3(4, -2.6, i * 0.8 - 1));
  }
  const floorMat = new THREE.LineBasicMaterial({ color: TONES.paper.line.clone(), transparent: true, opacity: 0.1 });
  levels[0].add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(floorPts), floorMat));

  const cardTexture = (msg: (typeof flowMessages)[number]) => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 200;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#F4F4F0';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#1F33D1';
    ctx.font = '600 26px "Martian Mono Variable", monospace';
    ctx.fillText(msg.lang, 28, 52);
    ctx.fillStyle = '#0D0D10';
    if (msg.voice) {
      for (let i = 0; i < 26; i++) {
        const h = 16 + Math.abs(Math.sin(i * 1.7)) * 70;
        ctx.fillRect(28 + i * 20, 130 - h / 2, 10, h);
      }
    } else {
      const ar = msg.dir === 'rtl';
      ctx.direction = ar ? 'rtl' : 'ltr';
      ctx.textAlign = ar ? 'right' : 'left';
      ctx.font = ar ? '500 46px "Readex Pro Variable", sans-serif' : '500 44px "Schibsted Grotesk Variable", sans-serif';
      ctx.fillText(msg.text, ar ? c.width - 28 : 28, 140, c.width - 56);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  };
  const cardGeo = new THREE.PlaneGeometry(2.6, 0.81);
  const cardEdges = new THREE.EdgesGeometry(cardGeo);
  const textures = flowMessages.map(cardTexture);
  const makeCard = (k: number) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(cardGeo, new THREE.MeshBasicMaterial({ map: textures[k % textures.length], transparent: true })));
    g.add(new THREE.LineSegments(cardEdges, lineMat));
    return g;
  };
  const cards = Array.from({ length: mobile ? 5 : 8 }, (_, k) => {
    const g = makeCard(k);
    const base = new THREE.Vector3((k % 4) * 1.45 - 2.2 + (k > 3 ? 0.6 : 0), -1.3 + Math.floor(k / 4) * 1.5 + (k % 2) * 0.3, -1.5 + (k % 3) * 1.1);
    g.position.copy(base);
    g.rotation.set(-0.12, (k % 2 ? -1 : 1) * 0.22, (k % 3 - 1) * 0.05);
    levels[0].add(g);
    return { g, base, phase: k * 0.9, delay: k * 0.07 };
  });
  const flights: { g: THREE.Group; t0: number; from: THREE.Vector3 }[] = [];
  let spawnCount = 0;
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  /* ---------- 01 · core ---------- */
  const core = new THREE.Group();
  const coreGeo = new THREE.OctahedronGeometry(1.3);
  core.add(new THREE.Mesh(coreGeo, amberMat), edges(coreGeo));
  levels[1].add(core);
  const orbit = new THREE.Group();
  orbit.rotation.x = 1.1;
  for (let i = 0; i < 4; i++) {
    const g = new THREE.OctahedronGeometry(0.2);
    const o = new THREE.Group();
    o.add(new THREE.Mesh(g, accentMat), edges(g));
    const a = (i / 4) * Math.PI * 2;
    o.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0);
    orbit.add(o);
  }
  levels[1].add(orbit);

  /* ---------- 02 · 42 destination cubes (teams, tools, people) ---------- */
  const cubesGroup = new THREE.Group();
  cubesGroup.rotation.set(-0.4, side * -0.5, 0);
  const box = new THREE.BoxGeometry(0.42, 0.42, 0.42);
  const boxEdges = new THREE.EdgesGeometry(box);
  const cubeFill = new THREE.InstancedMesh(box, accentMat, CUBES);
  const cubePos: THREE.Vector3[] = [];
  const edgePositions: number[] = [];
  const be = boxEdges.attributes.position.array as ArrayLike<number>;
  for (let i = 0; i < CUBES; i++) {
    const c = i % 7;
    const r = Math.floor(i / 7);
    const p = new THREE.Vector3((c - 3) * 0.62, (2.5 - r) * 0.62, 0);
    cubePos.push(p);
    for (let k = 0; k < be.length; k += 3) edgePositions.push(be[k] + p.x, be[k + 1] + p.y, be[k + 2] + p.z);
  }
  const cubeEdgeGeo = new THREE.BufferGeometry();
  cubeEdgeGeo.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  cubesGroup.add(new THREE.LineSegments(cubeEdgeGeo, lineMat), cubeFill);
  const cubeScale = new Array(CUBES).fill(0);
  const m4 = new THREE.Matrix4();
  levels[2].add(cubesGroup);

  /* ---------- 03 · stacked reports ---------- */
  const reports = new THREE.Group();
  reports.rotation.set(-1.0, side * -0.35, 0);
  const reportBars: THREE.Mesh[][] = [];
  for (let s = 0; s < 3; s++) {
    const sheet = new THREE.Group();
    sheet.position.set(0, 0, (s - 1) * 1.25);
    const pg = new THREE.PlaneGeometry(4, 2.2);
    sheet.add(edges(pg));
    const bars: THREE.Mesh[] = [];
    for (let b = 0; b < 7; b++) {
      const bg = new THREE.BoxGeometry(0.32, 0.32, 1);
      bg.translate(0, 0, 0.5);
      const m = new THREE.Mesh(bg, s === 1 ? amberMat : accentMat);
      m.position.set(-1.5 + b * 0.5, -0.4 + ((b * 37) % 5) * 0.12, 0);
      m.scale.z = 0.001;
      sheet.add(m);
      bars.push(m);
    }
    reportBars.push(bars);
    reports.add(sheet);
  }
  levels[3].add(reports);

  /* ---------- 04 · interface frames ---------- */
  const frames: THREE.Group[] = [];
  const frameGroup = new THREE.Group();
  frameGroup.rotation.y = side * -0.45;
  for (let f = 0; f < 3; f++) {
    const fr = new THREE.Group();
    const outline = edges(new THREE.PlaneGeometry(3.8, 2.5));
    const bar = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.9, 0.95, 0), new THREE.Vector3(1.9, 0.95, 0)]), lineMat);
    const block = edges(new THREE.PlaneGeometry(1.5, 1.2));
    block.position.set(-0.95, -0.2, 0);
    fr.add(outline, bar, block);
    for (let l = 0; l < 3; l++) {
      const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.2, 0.45 - l * 0.32, 0), new THREE.Vector3(1.6 - l * 0.3, 0.45 - l * 0.32, 0)]), lineMat);
      fr.add(ln);
    }
    if (f === 0) {
      const btn = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), accentMat);
      btn.position.set(0.65, -0.75, 0.01);
      fr.add(btn);
    }
    fr.position.z = -f * 1.1;
    frameGroup.add(fr);
    frames.push(fr);
  }
  levels[4].add(frameGroup);

  /* ---------- 05 · easing curve ---------- */
  const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-2.3, -1.5, 0), new THREE.Vector3(0.1, -1.5, 0), new THREE.Vector3(-0.1, 1.5, 0), new THREE.Vector3(2.3, 1.5, 0));
  const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.06, 8, false);
  const tube = new THREE.Mesh(tubeGeo, amberMat);
  const tubeIndexCount = tubeGeo.index!.count;
  tubeGeo.setDrawRange(0, 0);
  const curveGroup = new THREE.Group();
  curveGroup.add(tube);
  const handle = (a: THREE.Vector3, b: THREE.Vector3) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat);
  curveGroup.add(handle(curve.v0, curve.v1), handle(curve.v3, curve.v2));
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.6, 2, 0), new THREE.Vector3(-2.6, -1.8, 0), new THREE.Vector3(2.6, -1.8, 0)]), faintMat);
  curveGroup.add(axis);
  for (const v of [curve.v0, curve.v3]) {
    const g = new THREE.OctahedronGeometry(0.2);
    const d = new THREE.Group();
    d.add(new THREE.Mesh(g, amberMat), edges(g));
    d.position.copy(v);
    curveGroup.add(d);
  }
  for (const v of [curve.v1, curve.v2]) {
    const k = edges(new THREE.BoxGeometry(0.14, 0.14, 0.14));
    k.position.copy(v);
    curveGroup.add(k);
  }
  levels[5].add(curveGroup);

  /* ---------- 06 · autopilot ring ---------- */
  const ring = new THREE.Group();
  ring.rotation.x = 1.15;
  const smallOct = new THREE.OctahedronGeometry(0.18);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const o = new THREE.Mesh(smallOct, i % 4 === 0 ? amberMat : accentMat);
    o.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
    ring.add(o);
  }
  const inner = new THREE.Group();
  inner.rotation.x = 1.15;
  const tiny = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const tinyEdges = new THREE.EdgesGeometry(tiny);
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2;
    const o = new THREE.LineSegments(tinyEdges, lineMat);
    o.position.set(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0);
    inner.add(o);
  }
  const heart = new THREE.Group();
  const heartGeo = new THREE.OctahedronGeometry(0.7);
  heart.add(new THREE.Mesh(heartGeo, amberMat), edges(heartGeo));
  levels[6].add(ring, inner, heart);

  /* ---------- sizing and anchoring ---------- */
  let halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * DIST;
  let halfW = halfH;
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  const resize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * DIST;
    halfW = halfH * camera.aspect;
  };
  // Place each level on the z=0 plane at the centre of its anchor box, sized to fit it.
  const place = () => {
    const unit = (2 * halfH) / vh;
    levels.forEach((g, i) => {
      const el = anchors[i];
      if (!el) {
        g.visible = false;
        return;
      }
      const r = el.getBoundingClientRect();
      const visible = r.bottom > -vh * 0.6 && r.top < vh * 1.6;
      g.visible = visible || i <= 1;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      g.position.set(((cx / vw) * 2 - 1) * halfW, -((cy / vh) * 2 - 1) * halfH, 0);
      const fit = Math.min(r.height * unit, r.width * unit * (i === 0 ? 0.62 : 0.85)) / NOMINAL[i];
      g.scale.setScalar(i === 6 ? (r.height * unit * 1.9) / NOMINAL[i] : Math.max(0.2, fit));
    });
  };
  resize();
  window.addEventListener('resize', resize);

  /* ---------- loop ---------- */
  const tilt = { x: 0, y: 0 };
  let running = true;
  const t0 = performance.now();
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(tick);
  });

  function tick() {
    if (!running) return;
    const t = (performance.now() - t0) / 1000;
    const tone = TONES[state.tone];
    lineMat.color.lerp(tone.line, 0.06);
    faintMat.color.copy(lineMat.color);
    floorMat.color.copy(lineMat.color);
    accentMat.color.lerp(tone.accent, 0.06);

    place();
    tilt.x += (-state.pointer.y * 0.05 - tilt.x) * 0.05;
    tilt.y += (state.pointer.x * 0.07 - tilt.y) * 0.05;
    levels.forEach((g) => g.rotation.set(tilt.x, tilt.y, 0));
    const corePos = new THREE.Vector3();
    core.getWorldPosition(corePos);
    const coreLocal = levels[0].worldToLocal(corePos.clone());

    // 00: slips bob, then rise into the core as the climb starts.
    const rise = state.chapter;
    cards.forEach(({ g, base, phase, delay }) => {
      const k = ease((rise - delay) * 1.4);
      g.position.lerpVectors(base, coreLocal, k);
      g.position.y += Math.sin(t * 0.8 + phase) * 0.08 * (1 - k);
      g.scale.setScalar(Math.max(0.001, 1 - k * 0.92));
    });

    // Clicked messages fly up to the core.
    while (state.spawns.length) {
      const sp = state.spawns.shift()!;
      raycaster.setFromCamera(new THREE.Vector2(sp.x, sp.y), camera);
      const hit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, hit)) {
        const g = makeCard(spawnCount++);
        levels[0].worldToLocal(hit);
        g.position.copy(hit);
        levels[0].add(g);
        flights.push({ g, t0: t, from: hit.clone() });
      }
    }
    for (let i = flights.length - 1; i >= 0; i--) {
      const f = flights[i];
      const p = (t - f.t0) / 2.4;
      const k = ease(p);
      f.g.position.lerpVectors(f.from, coreLocal, k);
      f.g.rotation.z = Math.sin(p * 6) * 0.1 * (1 - k);
      f.g.scale.setScalar(Math.max(0.001, p < 0.15 ? p / 0.15 : 1 - Math.max(0, k - 0.75) * 4));
      if (p >= 1) {
        levels[0].remove(f.g);
        flights.splice(i, 1);
        core.scale.setScalar(1.25);
      }
    }

    // 01: core turns, orbit carries the four rules.
    core.rotation.y = t * 0.5;
    core.rotation.x = Math.sin(t * 0.4) * 0.3;
    core.scale.lerp(new THREE.Vector3(1, 1, 1), 0.06);
    orbit.rotation.z = t * 0.4;

    // 02: cubes fill one by one with the chapter.
    const lit = Math.round(clamp((state.chapterProgress[2] - 0.25) / 0.45) * CUBES);
    for (let i = 0; i < CUBES; i++) {
      cubeScale[i] += ((i < lit ? 1 : 0) - cubeScale[i]) * 0.15;
      const sc = Math.max(0.0001, cubeScale[i]);
      m4.makeScale(sc, sc, sc).setPosition(cubePos[i]);
      cubeFill.setMatrixAt(i, m4);
    }
    cubeFill.instanceMatrix.needsUpdate = true;
    cubesGroup.rotation.y = side * -0.5 + Math.sin(t * 0.3) * 0.08;

    // 03: bars grow on each sheet.
    const p3 = state.chapterProgress[3];
    reportBars.forEach((bars, s) =>
      bars.forEach((m, b) => {
        const k = ease((p3 - 0.25 - s * 0.08 - b * 0.02) / 0.35);
        m.scale.z = Math.max(0.001, k * (0.4 + ((b * 53 + s * 17) % 10) / 9));
      }),
    );

    // 04: frames separate in depth.
    const p4 = ease((state.chapterProgress[4] - 0.2) / 0.5);
    frames.forEach((fr, f) => {
      fr.position.z = -f * (0.6 + p4 * 1.4);
      fr.position.x = side * f * p4 * 0.6;
      fr.position.y = f * p4 * 0.35;
    });

    // 05: the curve draws itself.
    const p5 = ease((state.chapterProgress[6] - 0.2) / 0.45);
    tubeGeo.setDrawRange(0, Math.floor((tubeIndexCount * p5) / 3) * 3);
    curveGroup.rotation.y = state.pointer.x * 0.25 * side;

    // 06: the ring runs on its own.
    ring.rotation.z = t * 0.25;
    inner.rotation.z = -t * 0.4;
    heart.rotation.y = t * 0.8;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return true;
}
