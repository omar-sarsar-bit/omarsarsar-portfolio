// The tower: the 3D centrepiece of the ascent, loaded after first paint.
// Your business as a building drawn like an axonometric plan. It opens as a blueprint with messages
// circling the ground floor; every chapter you climb builds one floor, each floor holding the job it
// automates. On wide screens the tower docks into a slim column beside the chapters, so it never sits
// on top of text; on the last chapter it returns to full size with the beacon lit.

import * as THREE from 'three';
import { state } from './state';
import { flowMessages } from '../i18n/demo-scripts';

const FLOORS = 9;
const FH = 0.9; // floor height
const W = 2.2; // footprint
const TILT = 0.5; // view from above, in radians
const R = (W * Math.SQRT2) / 2; // half-diagonal: the widest the footprint gets while it turns
const Y0 = -0.34; // underside of the ground slab
const YTOP = FLOORS * FH + 1.05; // tip of the beacon
const ORBIT = 2.6; // radius of the message slips around the ground floor

const TONES = {
  paper: { line: '#0D0D10', fill: '#EBEBE6', accent: '#1F33D1' },
  cobalt: { line: '#F3F3EE', fill: '#1F33D1', accent: '#FFB020' },
  ink: { line: '#EBEBE6', fill: '#0D0D10', accent: '#FFB020' },
} as const;
const AMBER = new THREE.Color('#FFB020');
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const back = (t: number) => {
  const c = 1.6;
  const x = clamp(t) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

interface Rect { x: number; y: number; w: number; h: number }

export async function startTower(canvas: HTMLCanvasElement): Promise<boolean> {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -2000, 2000);
  camera.position.z = 100;

  // rig: placed and scaled in screen pixels · spin: turns the building · floors inside spin.
  const rig = new THREE.Group();
  const spin = new THREE.Group();
  rig.rotation.x = TILT;
  rig.add(spin);
  scene.add(rig);

  /* ---------- materials (shared, recoloured with the page tone) ---------- */
  const lineMat = new THREE.LineBasicMaterial({ color: TONES.paper.line, transparent: true });
  const faintMat = new THREE.LineBasicMaterial({ color: TONES.paper.line, transparent: true, opacity: 0.14 });
  const ghostMat = new THREE.LineDashedMaterial({ color: TONES.paper.line, transparent: true, opacity: 0.42, dashSize: 0.07, gapSize: 0.06 });
  const fillMat = new THREE.MeshBasicMaterial({ color: TONES.paper.fill, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const accentMat = new THREE.MeshBasicMaterial({ color: TONES.paper.accent, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const amberMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const slipMats: THREE.MeshBasicMaterial[] = [];
  const allMats: { m: THREE.Material & { opacity: number }; base: number }[] = [lineMat, faintMat, ghostMat, fillMat, accentMat, amberMat].map((m) => ({ m, base: m.opacity }));

  const edges = (geo: THREE.BufferGeometry, mat: THREE.Material = lineMat) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), mat);
  const solid = (geo: THREE.BufferGeometry, fill: THREE.Material = fillMat, line: THREE.Material = lineMat) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, fill), edges(geo, line));
    return g;
  };
  const segs = (pts: number[], mat: THREE.Material = lineMat) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.LineSegments(geo, mat);
  };

  /* ---------- ground floor: slab, site grid ---------- */
  const ground = new THREE.Group();
  spin.add(ground);
  const slab = solid(new THREE.BoxGeometry(W + 0.5, 0.2, W + 0.5));
  slab.position.y = Y0 + 0.1;
  ground.add(slab);
  const gridPts: number[] = [];
  for (let i = -6; i <= 6; i++) {
    const v = i * 0.5;
    gridPts.push(v, Y0, -3, v, Y0, 3, -3, Y0, v, 3, Y0, v);
  }
  const siteMat = faintMat.clone();
  allMats.push({ m: siteMat, base: siteMat.opacity });
  const site = segs(gridPts, siteMat);
  ground.add(site);

  /* ---------- floors ---------- */
  interface Floor {
    built: THREE.Group;
    ghost: THREE.LineSegments;
    plateLine: THREE.LineBasicMaterial;
    contents: THREE.Group;
    b: number;
    y: number;
    update?: (t: number, b: number) => void;
  }
  const floors: Floor[] = [];
  const plateGeo = new THREE.BoxGeometry(W, 0.07, W);
  const ghostGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(W, FH, W));
  const h = W / 2;
  const postPts = [-h, 0, -h, -h, FH, -h, h, 0, -h, h, FH, -h, h, 0, h, h, FH, h, -h, 0, h, -h, FH, h];

  for (let i = 1; i <= FLOORS; i++) {
    const y = (i - 1) * FH;
    const ghost = new THREE.LineSegments(ghostGeo, ghostMat);
    ghost.position.y = y + FH / 2;
    ghost.computeLineDistances();
    spin.add(ghost);

    const built = new THREE.Group();
    const plateLine = lineMat.clone();
    allMats.push({ m: plateLine, base: 1 });
    built.add(new THREE.Mesh(plateGeo, fillMat), new THREE.LineSegments(new THREE.EdgesGeometry(plateGeo), plateLine));
    built.add(segs(postPts));
    const contents = new THREE.Group();
    contents.position.y = 0.035;
    built.add(contents);
    built.visible = false;
    spin.add(built);
    floors.push({ built, ghost, plateLine, contents, b: 0, y });
  }
  // The roof closes the top floor.
  const roof = new THREE.Group();
  roof.add(new THREE.Mesh(plateGeo, fillMat), edges(plateGeo));
  roof.position.y = FH;
  floors[FLOORS - 1].built.add(roof);

  const f = (n: number) => floors[n - 1];

  // 01 · Front desk: three message panels and the agent at the desk.
  {
    const c = f(1).contents;
    const panel = new THREE.BoxGeometry(0.56, 0.34, 0.04);
    [-0.62, 0, 0.62].forEach((x, k) => {
      const p = solid(panel, k === 1 ? accentMat : fillMat);
      p.position.set(x, 0.26 + (k % 2) * 0.08, -0.62);
      c.add(p);
    });
    const desk = solid(new THREE.BoxGeometry(1.2, 0.2, 0.32));
    desk.position.set(0, 0.1, 0.32);
    c.add(desk);
    const agent = solid(new THREE.OctahedronGeometry(0.16), amberMat);
    agent.position.set(0, 0.52, 0.32);
    c.add(agent);
    f(1).update = (t) => {
      agent.rotation.y = t * 1.2;
      agent.position.y = 0.52 + Math.sin(t * 2) * 0.03;
    };
  }

  // 02 · Intake: incoming files sorted into a grid of destinations that light up.
  {
    const c = f(2).contents;
    const cube = new THREE.BoxGeometry(0.17, 0.17, 0.17);
    const cubeEdges = new THREE.EdgesGeometry(cube);
    const cells: THREE.Mesh[] = [];
    for (let k = 0; k < 16; k++) {
      const x = ((k % 4) - 1.5) * 0.34;
      const z = (Math.floor(k / 4) - 1.5) * 0.34;
      const m = new THREE.Mesh(cube, k % 5 === 2 ? amberMat : accentMat);
      m.position.set(x + 0.25, 0.085, z);
      m.scale.setScalar(0.001);
      const e = new THREE.LineSegments(cubeEdges, lineMat);
      e.position.copy(m.position);
      c.add(m, e);
      cells.push(m);
    }
    const tray = solid(new THREE.BoxGeometry(0.42, 0.08, 0.56));
    tray.position.set(-0.78, 0.04, 0);
    c.add(tray);
    [0.12, 0.2, 0.28].forEach((yy) => {
      const sheet = edges(new THREE.BoxGeometry(0.32, 0.01, 0.42));
      sheet.position.set(-0.78, yy, 0);
      c.add(sheet);
    });
    f(2).update = () => {
      const lit = Math.round(clamp((state.chapterPlay[2] - 0.05) / 0.6) * cells.length);
      cells.forEach((m, k) => m.scale.setScalar(Math.max(0.001, m.scale.x + ((k < lit ? 1 : 0) - m.scale.x) * 0.15)));
    };
  }

  // 03 · Assistant: a week on the calendar and the morning brief standing beside it.
  {
    const c = f(3).contents;
    const tile = new THREE.BoxGeometry(0.17, 0.03, 0.17);
    for (let k = 0; k < 21; k++) {
      const x = ((k % 7) - 3) * 0.22;
      const z = (Math.floor(k / 7) - 1) * 0.22 + 0.32;
      const t = solid(tile, k === 9 ? amberMat : k === 3 || k === 16 ? accentMat : fillMat);
      t.position.set(x, 0.015, z);
      c.add(t);
    }
    const brief = new THREE.Group();
    brief.add(solid(new THREE.BoxGeometry(0.62, 0.5, 0.03)));
    const lines: number[] = [];
    [0.12, 0.03, -0.06, -0.15].forEach((yy, k) => lines.push(-0.22, yy, 0.02, 0.22 - k * 0.06, yy, 0.02));
    brief.add(segs(lines));
    brief.position.set(0.35, 0.3, -0.55);
    c.add(brief);
  }

  // 04 · Back office: stock on the shelves, one crate running low.
  {
    const c = f(4).contents;
    const crates: [number, number, number, number, number, boolean][] = [
      [-0.62, -0.45, 0.42, 0.36, 0.42, false],
      [-0.62, -0.45, 0.36, 0.26, 0.36, false],
      [-0.12, -0.5, 0.38, 0.32, 0.38, false],
      [0.4, -0.45, 0.42, 0.42, 0.42, false],
      [0.62, 0.35, 0.3, 0.22, 0.3, true],
      [-0.5, 0.42, 0.36, 0.3, 0.36, false],
    ];
    let stackY = 0;
    crates.forEach(([x, z, w, hh, d, low], k) => {
      const cr = solid(new THREE.BoxGeometry(w, hh, d), low ? amberMat : k === 3 ? accentMat : fillMat);
      if (k === 1) {
        cr.position.set(x, stackY + hh / 2, z);
      } else {
        cr.position.set(x, hh / 2, z);
        stackY = hh;
      }
      c.add(cr);
    });
  }

  // 05 · Reports: bars that grow with the chapter.
  {
    const c = f(5).contents;
    const bars: THREE.Group[] = [];
    const heights = [0.3, 0.46, 0.36, 0.6, 0.5, 0.68];
    heights.forEach((hh, k) => {
      const geo = new THREE.BoxGeometry(0.2, 1, 0.2);
      geo.translate(0, 0.5, 0);
      const b = solid(geo, k === 5 ? amberMat : accentMat);
      b.position.set((k - 2.5) * 0.3, 0, (k % 2 ? 0.1 : -0.1) - 0.15);
      b.scale.y = 0.001;
      b.userData.h = hh;
      c.add(b);
      bars.push(b);
    });
    const sheet = edges(new THREE.BoxGeometry(1.9, 0.01, 0.5));
    sheet.position.set(0, 0.01, 0.6);
    c.add(sheet);
    f(5).update = () => {
      const p = state.chapterPlay[5];
      bars.forEach((b, k) => {
        const target = b.userData.h * ease((p - 0.05 - k * 0.05) / 0.4);
        b.scale.y = Math.max(0.001, b.scale.y + (target - b.scale.y) * 0.12);
      });
    };
  }

  // 06 · Apps: two screens with an interface on them.
  {
    const c = f(6).contents;
    [[-0.45, -0.35, 0.25], [0.5, 0.1, -0.35]].forEach(([x, z, ry], k) => {
      const s = new THREE.Group();
      s.add(solid(new THREE.BoxGeometry(0.92, 0.58, 0.03)));
      const ui: number[] = [-0.42, 0.18, 0.02, 0.42, 0.18, 0.02, -0.1, 0.18, 0.02, -0.1, -0.26, 0.02];
      [0.06, -0.04, -0.14].forEach((yy, l) => ui.push(-0.02, yy, 0.02, 0.32 - l * 0.08, yy, 0.02));
      s.add(segs(ui));
      const btn = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.09), k ? amberMat : accentMat);
      btn.position.set(-0.26, -0.12, 0.02);
      s.add(btn);
      s.position.set(x, 0.34, z);
      s.rotation.y = ry;
      c.add(s);
    });
  }

  // 07 · Work: models on plinths.
  {
    const c = f(7).contents;
    const shapes = [new THREE.OctahedronGeometry(0.16), new THREE.IcosahedronGeometry(0.15, 0), new THREE.BoxGeometry(0.22, 0.22, 0.22)];
    const items: THREE.Group[] = [];
    [-0.62, 0, 0.62].forEach((x, k) => {
      const plinth = solid(new THREE.BoxGeometry(0.34, 0.26, 0.34));
      plinth.position.set(x, 0.13, k === 1 ? -0.3 : 0.2);
      c.add(plinth);
      const m = solid(shapes[k], k === 0 ? amberMat : k === 1 ? accentMat : fillMat);
      m.position.set(x, 0.44, plinth.position.z);
      c.add(m);
      items.push(m);
    });
    f(7).update = (t) => items.forEach((m, k) => (m.rotation.y = t * (0.6 + k * 0.2)));
  }

  // 08 · About: the easing curve a motion designer lives by.
  {
    const c = f(8).contents;
    const frame = new THREE.Group();
    frame.add(segs([-0.7, 0, 0, -0.7, 0.66, 0, -0.7, 0, 0, 0.75, 0, 0], faintMat));
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-0.66, 0.04, 0), new THREE.Vector3(0.02, 0.04, 0), new THREE.Vector3(-0.02, 0.62, 0), new THREE.Vector3(0.7, 0.62, 0));
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.025, 6, false);
    frame.add(new THREE.Mesh(tubeGeo, amberMat));
    frame.add(segs([-0.66, 0.04, 0, 0.02, 0.04, 0, 0.7, 0.62, 0, -0.02, 0.62, 0]));
    [curve.v0, curve.v3].forEach((v) => {
      const k = solid(new THREE.OctahedronGeometry(0.06), amberMat);
      k.position.copy(v);
      frame.add(k);
    });
    frame.position.set(0, 0.05, 0);
    c.add(frame);
    const total = tubeGeo.index!.count;
    f(8).update = () => {
      const p = ease(state.chapterPlay[8] / 0.8);
      tubeGeo.setDrawRange(0, Math.max(3, Math.floor((total * p) / 3) * 3));
    };
  }

  // 09 · Contact: the rooftop beacon, lit once the building is done.
  const beacon = new THREE.Group();
  {
    const c = f(9).contents;
    // An open door on the top floor: the way in.
    const door = new THREE.Group();
    door.add(segs([-0.3, 0, 0, -0.3, 0.68, 0, -0.3, 0.68, 0, 0.3, 0.68, 0, 0.3, 0.68, 0, 0.3, 0, 0]));
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.66), amberMat);
    leaf.geometry.translate(0.28, 0.33, 0);
    leaf.position.set(-0.28, 0, 0.01);
    leaf.rotation.y = -0.9;
    door.add(leaf);
    door.position.set(0, 0, 0.7);
    c.add(door);
    c.add(segs([0, FH, 0, 0, FH + 0.18, 0]));
    const core = solid(new THREE.OctahedronGeometry(0.26), amberMat);
    core.position.y = FH + 0.42;
    c.add(core);
    beacon.position.y = FH + 0.42;
    const tiny = new THREE.OctahedronGeometry(0.06);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const d = new THREE.Mesh(tiny, k % 3 === 0 ? amberMat : accentMat);
      d.position.set(Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62);
      beacon.add(d);
    }
    c.add(beacon);
    f(9).update = (t) => {
      core.rotation.y = t * 0.9;
      beacon.rotation.y = -t * 0.5;
    };
  }

  /* ---------- message slips around the ground floor ---------- */
  const slipGeo = new THREE.PlaneGeometry(1.9, 0.59);
  const slipEdges = new THREE.EdgesGeometry(slipGeo);
  const slipTexture = (msg: (typeof flowMessages)[number]) => {
    const cv = document.createElement('canvas');
    cv.width = 640;
    cv.height = 200;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#F4F4F0';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#1F33D1';
    ctx.font = '600 26px "Martian Mono Variable", monospace';
    ctx.fillText(msg.lang, 28, 52);
    ctx.fillStyle = '#0D0D10';
    if (msg.voice) {
      for (let k = 0; k < 26; k++) {
        const hh = 16 + Math.abs(Math.sin(k * 1.7)) * 70;
        ctx.fillRect(28 + k * 20, 130 - hh / 2, 10, hh);
      }
    } else {
      const rtl = msg.dir === 'rtl';
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textAlign = rtl ? 'right' : 'left';
      ctx.font = rtl ? '500 46px "Readex Pro Variable", sans-serif' : '500 44px "Schibsted Grotesk Variable", sans-serif';
      ctx.fillText(msg.text, rtl ? cv.width - 28 : 28, 142, cv.width - 56);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  };
  const textures = flowMessages.map(slipTexture);
  const makeSlip = (k: number) => {
    const mat = new THREE.MeshBasicMaterial({ map: textures[k % textures.length], transparent: true, side: THREE.DoubleSide });
    slipMats.push(mat);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(slipGeo, mat), new THREE.LineSegments(slipEdges, lineMat));
    return g;
  };
  const slipLayer = new THREE.Group();
  rig.add(slipLayer); // outside `spin`, so slips keep facing the viewer
  const slips = flowMessages.map((_, k) => ({ g: makeSlip(k), a: (k / flowMessages.length) * Math.PI * 2, y: 0.15 + (k % 3) * 0.42, delay: k * 0.06 }));
  slips.forEach((s) => slipLayer.add(s.g));
  const flights: { g: THREE.Group; t0: number; from: THREE.Vector3 }[] = [];
  let spawnCount = 0;
  const deskLocal = new THREE.Vector3(0, FH * 0.5, 0);

  /* ---------- placement ---------- */
  let vw = 1;
  let vh = 1;
  const resize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.left = -vw / 2;
    camera.right = vw / 2;
    camera.top = vh / 2;
    camera.bottom = -vh / 2;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const slotEl = (name: string) => document.querySelector<HTMLElement>(`[data-tower-slot="${name}"]`);
  const heroSlot = slotEl('hero');
  const miniSlot = slotEl('mini');
  const endSlot = slotEl('end');
  const rectOf = (el: HTMLElement | null): Rect | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
  };
  const mix = (a: Rect, b: Rect, k: number): Rect => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k });

  // Size of the drawing in world units, as seen through the tilt.
  const cos = Math.cos(TILT);
  const sin = Math.sin(TILT);
  const tall = (YTOP - Y0) * cos + 2 * R * sin;
  const yMid = ((YTOP + Y0) / 2) * cos;
  const cur = { x: 0, y: 0, s: 1, alpha: 0 };
  let siteW = 1;
  let first = true;

  function target() {
    const hero = rectOf(heroSlot);
    const end = rectOf(endSlot);
    const mini = rectOf(miniSlot);
    // The hero slot sinks below the screen as you climb: follow it while it is visible.
    const wHero = hero ? clamp((vh - hero.y) / hero.h) : 0;
    // The end slot slides in from the top: dock into it as it becomes visible.
    const wEnd = end ? clamp((end.y + end.h) / end.h) : 0;
    let rect: Rect | null = mini;
    let alpha = mini ? 1 : 0;
    let wide = 2 * R * 1.08;
    if (hero && wHero > 0) {
      rect = rect ? mix(rect, hero, ease(wHero)) : hero;
      alpha = Math.max(alpha, ease(wHero));
      wide = wide + (2 * (ORBIT + 0.7) - wide) * ease(wHero);
    }
    if (end && wEnd > 0) {
      rect = rect ? mix(rect, end, ease(wEnd)) : end;
      alpha = Math.max(alpha, ease(wEnd));
    }
    if (!rect) return null;
    const s = Math.min(rect.w / wide, rect.h / tall);
    return { x: rect.x + rect.w / 2 - vw / 2, y: vh / 2 - (rect.y + rect.h / 2) - yMid * s, s, alpha, wHero, wEnd };
  }

  /* ---------- loop ---------- */
  const tones = { line: new THREE.Color(), fill: new THREE.Color(), accent: new THREE.Color() };
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
    tones.line.set(tone.line);
    tones.fill.set(tone.fill);
    tones.accent.set(tone.accent);
    lineMat.color.lerp(tones.line, 0.08);
    faintMat.color.copy(lineMat.color);
    ghostMat.color.copy(lineMat.color);
    fillMat.color.lerp(tones.fill, 0.08);
    accentMat.color.lerp(tones.accent, 0.08);

    const tg = target();
    if (tg) {
      const k = first ? 1 : 0.14;
      first = false;
      cur.x += (tg.x - cur.x) * k;
      cur.y += (tg.y - cur.y) * k;
      cur.s += (tg.s - cur.s) * k;
      cur.alpha += (tg.alpha - cur.alpha) * 0.12;
    } else {
      cur.alpha += (0 - cur.alpha) * 0.12;
    }
    rig.position.set(cur.x, cur.y, 0);
    rig.scale.setScalar(cur.s);
    allMats.forEach(({ m, base }) => (m.opacity = base * cur.alpha));
    siteW += ((tg ? Math.max(tg.wHero, tg.wEnd) : 0) - siteW) * 0.1;
    siteMat.opacity *= siteW;
    slipMats.forEach((m) => (m.opacity = cur.alpha));

    tilt.x += (-state.pointer.y * 0.06 - tilt.x) * 0.05;
    tilt.y += (state.pointer.x * 0.25 - tilt.y) * 0.05;
    rig.rotation.x = TILT + tilt.x;
    spin.rotation.y = Math.PI / 4 + t * 0.12 + tilt.y;

    // Floors build as the chapters are reached and come apart again on the way down.
    const active = Math.round(state.chapter);
    floors.forEach((fl, i) => {
      const n = i + 1;
      const goal = state.chapter >= n - 0.5 ? 1 : 0;
      fl.b += (goal - fl.b) * 0.075;
      const b = fl.b;
      fl.built.visible = b > 0.005;
      fl.built.position.y = fl.y + (1 - ease(b)) * 1.6;
      fl.contents.scale.setScalar(Math.max(0.001, back(clamp((b - 0.35) / 0.65))));
      fl.ghost.visible = b < 0.98;
      if (n === active || (active > FLOORS && n === FLOORS)) fl.plateLine.color.lerp(AMBER, 0.12);
      else fl.plateLine.color.lerp(lineMat.color, 0.12);
      fl.update?.(t, b);
    });

    // Slips circle the ground floor, then rise into the front desk as the climb begins.
    const rise = state.chapter;
    const desk = spin.localToWorld(deskLocal.clone().setY(deskLocal.y + floors[0].built.position.y - floors[0].y));
    rig.worldToLocal(desk);
    slips.forEach((s, k) => {
      const a = s.a + t * 0.18;
      const ox = Math.cos(a) * ORBIT;
      const oz = Math.sin(a) * ORBIT * 0.55;
      const oy = s.y + Math.sin(t * 0.9 + k) * 0.06;
      const p = ease((rise - s.delay) * 1.5);
      s.g.position.set(ox + (desk.x - ox) * p, oy + (desk.y - oy) * p, oz + (desk.z - oz) * p);
      s.g.scale.setScalar(Math.max(0.001, 1 - p));
      s.g.visible = p < 0.995;
    });

    // Clicked messages fly into the front desk.
    while (state.spawns.length) {
      const sp = state.spawns.shift()!;
      const at = new THREE.Vector3((sp.x * vw) / 2, (sp.y * vh) / 2, 0);
      rig.worldToLocal(at);
      at.z = 0.6;
      const g = makeSlip(spawnCount++);
      g.position.copy(at);
      slipLayer.add(g);
      flights.push({ g, t0: t, from: at.clone() });
    }
    for (let i = flights.length - 1; i >= 0; i--) {
      const fl = flights[i];
      const p = (t - fl.t0) / 2.2;
      const k = ease(p);
      fl.g.position.lerpVectors(fl.from, desk, k);
      fl.g.rotation.z = Math.sin(p * 6) * 0.08 * (1 - k);
      fl.g.scale.setScalar(Math.max(0.001, p < 0.15 ? p / 0.15 : 1 - Math.max(0, k - 0.7) * 3.3));
      if (p >= 1) {
        slipLayer.remove(fl.g);
        flights.splice(i, 1);
      }
    }

    if (cur.alpha > 0.004) renderer.render(scene, camera);
    else renderer.clear();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  return true;
}
