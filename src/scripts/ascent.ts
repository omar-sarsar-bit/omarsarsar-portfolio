// The ascent engine. The world is pinned to the bottom of the screen with its chapters stacked
// upwards (column-reverse); native scroll drives a translateY so scrolling down climbs the page.
// Lenis smooths the wheel, GSAP's ticker runs the frame, and each chapter reports its own progress,
// which drives the live interfaces inside it and the tower beside it.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { state, calm, isAscent } from './state';
import { setupChat, type ChatPlayer } from './chat';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const world = document.querySelector<HTMLElement>('[data-world]')!;
const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-ch]'));
const ids = chapters.map((c) => c.id);
const at = (id: string) => ids.indexOf(id);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
state.rtl = root.dir === 'rtl';
state.mobile = window.matchMedia('(max-width: 860px)').matches;
state.chapterProgress = new Array(chapters.length).fill(0);

const chatRoot = document.querySelector<HTMLElement>('[data-chat]');
const chat: ChatPlayer | null = chatRoot ? setupChat(chatRoot, document.querySelector('[data-rules]')) : null;

// The name on the roof always spans the full width, in either layout.
function fitName() {
  const el = document.querySelector<HTMLElement>('[data-fit]');
  if (!el) return;
  el.style.fontSize = '100px';
  const avail = el.parentElement!.clientWidth - parseFloat(getComputedStyle(el).marginInlineStart) * 2;
  el.style.fontSize = `${Math.floor((100 * avail) / el.scrollWidth)}px`;
}

if (isAscent()) startAscent();
else {
  fitName();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitName);
  window.addEventListener('resize', fitName);
}
if (!isAscent() && chatRoot && chat) {
  // Normal page order (reduced motion): play the transcript once it is on screen.
  new IntersectionObserver((entries, io) => {
    if (entries.some((e) => e.isIntersecting)) {
      chat.play();
      io.disconnect();
    }
  }, { threshold: 0.3 }).observe(chatRoot);
}

function startAscent() {
  root.classList.add('ascent-live');
  const spacer = document.createElement('div');
  spacer.className = 'ascent-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  world.after(spacer);

  let H = 0;
  let vh = window.innerHeight;
  let bounds: { top: number; h: number; b: number }[] = [];
  let centers: number[] = [];
  let ready = root.classList.contains('is-ready');
  let active = -1;
  const revealed = new Set<number>();

  /* ---------- measuring ---------- */
  function measure() {
    vh = window.innerHeight;
    // The world box is one screen tall; its content stacks upwards from the bottom edge.
    const box = world.clientHeight;
    const parts = Array.from(world.children) as HTMLElement[];
    H = parts.reduce((sum, el) => sum + el.offsetHeight, 0);
    spacer.style.height = `${H}px`;
    bounds = chapters.map((el) => ({ top: el.offsetTop, h: el.offsetHeight, b: box - el.offsetTop - el.offsetHeight }));
    state.max = Math.max(1, H - vh);
    centers = bounds.map((bd) => clamp(bd.b + bd.h / 2 - vh / 2, 0, state.max));
    fitName();
    fitNumber();
    ScrollTrigger.refresh();
  }

  /* ---------- smooth scroll ---------- */
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('demo:open', () => lenis.stop());
  window.addEventListener('demo:close', () => lenis.start());

  const scrollToY = (y: number, immediate = false) =>
    lenis.scrollTo(clamp(y, 0, state.max), { immediate, duration: 1.8, easing: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2) });

  // Scroll position that frames a chapter: centred if it fits, otherwise its top at the top.
  const targetFor = (i: number) => {
    const bd = bounds[i];
    if (i === 0) return 0;
    return bd.h <= vh ? bd.b + bd.h / 2 - vh / 2 : bd.b + bd.h - vh;
  };

  /* ---------- titles, fades, splits (after the fonts, so lines break where they will) ---------- */
  let prepared = false;
  let litWords: HTMLElement[] = [];
  function prepare() {
    if (prepared) return;
    prepared = true;
    document.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'sl' });
      gsap.set(split.lines, { yPercent: 115 });
      (el as HTMLElement & { _lines?: Element[] })._lines = split.lines;
      el.classList.add('is-split');
    });
    gsap.set('[data-fade]', { autoAlpha: 0, y: 24 });
    document.querySelectorAll('[data-fade]').forEach((el) => el.classList.add('is-prepped'));
    const litEl = document.querySelector<HTMLElement>('[data-lit]');
    if (litEl) litWords = SplitText.create(litEl, { type: 'words', wordsClass: 'w', aria: 'none' }).words as HTMLElement[];
    measure();
  }

  function reveal(i: number) {
    if (!prepared || revealed.has(i)) return;
    revealed.add(i);
    const ch = chapters[i];
    ch.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => {
      const lines = (el as HTMLElement & { _lines?: Element[] })._lines ?? [];
      gsap.to(lines, { yPercent: 0, duration: 1.25, ease: 'expo.out', stagger: 0.09 });
    });
    const fades = ch.querySelectorAll('[data-fade]');
    if (fades.length) gsap.to(fades, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: 0.25, stagger: 0.1 });
    if (ids[i] === 'frontdesk') chat?.play();
  }

  /* ---------- live interfaces ---------- */
  const q = <T extends HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));
  const progressBar = document.querySelector<HTMLElement>('[data-progress]');
  const nowIndex = document.querySelector<HTMLElement>('[data-now-index]');
  const nowName = document.querySelector<HTMLElement>('[data-now-name]');
  const floorNum = document.querySelector<HTMLElement>('[data-floor]');
  const floorName = document.querySelector<HTMLElement>('[data-floor-name]');
  const dockLinks = q<HTMLElement>('.dock-index [data-index]');
  const chapterNames = dockLinks.map((a) => a.querySelector('.nm')?.textContent ?? '');
  const bigNum = document.querySelector<HTMLElement>('[data-stretch]');
  const boardRows = q<HTMLElement>('[data-brow]');
  const briefItems = q<HTMLElement>('[data-bitem]');
  const invRows = q<HTMLElement>('[data-invrow]');
  const invAlert = document.querySelector<HTMLElement>('[data-alert]');
  const invMatched = document.querySelector<HTMLElement>('[data-matched]');
  const matchedTotal = Number(invMatched?.textContent ?? 0);
  const bars = q<HTMLElement>('[data-bar]');
  const steps = q<HTMLElement>('[data-steps] > li');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const toneColor: Record<string, string> = { paper: '#EBEBE6', cobalt: '#1F33D1', ink: '#0D0D10' };
  const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
  const iFront = at('frontdesk');
  const iIntake = at('intake');
  const iAssist = at('assistant');
  const iBack = at('backoffice');
  const iReports = at('reports');
  const iApps = at('apps');
  const iAbout = at('about');
  const iContact = at('contact');

  function setActive(i: number) {
    if (i === active) return;
    active = i;
    const tone = chapters[i].dataset.tone as typeof state.tone;
    state.tone = tone;
    root.dataset.tone = tone;
    themeMeta?.setAttribute('content', toneColor[tone]);
    dockLinks.forEach((a, k) => a.classList.toggle('is-active', k === i));
    const num = String(i).padStart(2, '0');
    if (nowIndex) nowIndex.textContent = num;
    if (nowName) nowName.textContent = chapterNames[i] ?? '';
    if (floorNum) floorNum.textContent = num;
    if (floorName) floorName.textContent = chapterNames[i] ?? '';
  }

  let lastLit = -1;
  function frame() {
    const s = lenis.scroll;
    state.scroll = s;
    state.progress = clamp(s / state.max);
    world.style.transform = `translate3d(0, ${s.toFixed(2)}px, 0)`;

    // Continuous chapter value for the tower.
    let c = 0;
    for (let i = 0; i < centers.length - 1; i++) {
      if (s >= centers[i]) c = i + clamp((s - centers[i]) / Math.max(1, centers[i + 1] - centers[i]));
    }
    state.chapter = c;

    const mid = s + vh / 2;
    bounds.forEach((bd, i) => {
      const p = clamp((s - (bd.b - vh)) / (bd.h + vh));
      state.chapterProgress[i] = p;
      if (ready && p > 0.26) reveal(i);
      if (mid >= bd.b && mid < bd.b + bd.h) setActive(i);
    });
    if (s >= state.max - 2) setActive(chapters.length - 1);

    const pr = state.chapterProgress;
    if (bigNum && pr[iFront] > 0 && pr[iFront] < 1) bigNum.style.setProperty('font-stretch', `${62 + clamp((pr[iFront] - 0.15) / 0.45) * 50}%`);
    boardRows.forEach((row, k) => {
      row.classList.toggle('is-checked', pr[iIntake] > 0.3 + k * 0.045);
      row.classList.toggle('is-routed', pr[iIntake] > 0.36 + k * 0.045);
    });
    briefItems.forEach((it, k) => it.classList.toggle('is-in', pr[iAssist] > 0.3 + k * 0.05));
    const pb = clamp((pr[iBack] - 0.28) / 0.3);
    invRows.forEach((row) => {
      const from = Number(row.dataset.from);
      const stock = Number(row.dataset.stock);
      const min = Number(row.dataset.min);
      const max = Number(row.dataset.max);
      const v = from + (stock - from) * pb;
      const num = row.querySelector<HTMLElement>('[data-num]');
      if (num) num.textContent = fmt(v);
      row.querySelector<HTMLElement>('[data-fill]')?.style.setProperty('--v', (v / max).toFixed(3));
      row.classList.toggle('is-low', v < min);
    });
    invAlert?.classList.toggle('is-on', pb >= 1);
    if (invMatched) invMatched.textContent = String(Math.round(matchedTotal * clamp((pr[iBack] - 0.3) / 0.35)));
    bars.forEach((b, k) => (b.style.transform = `scaleX(${clamp((pr[iReports] - 0.28 - k * 0.07) / 0.3)})`));
    steps.forEach((li, k) => li.style.setProperty('--fill', String(clamp((pr[iApps] - 0.22 - k * 0.06) / 0.18))));
    if (litWords.length) {
      const n = Math.round(clamp((pr[iAbout] - 0.22) / 0.42) * litWords.length);
      if (n !== lastLit) {
        lastLit = n;
        litWords.forEach((w, k) => w.classList.toggle('lit', k < n));
      }
    }

    if (progressBar) progressBar.style.transform = `scaleX(${state.progress})`;
  }

  /* ---------- marquee driven by scroll velocity ---------- */
  const track = document.querySelector<HTMLElement>('[data-marquee-track]');
  let mx = 0;
  let mdir = -1;
  gsap.ticker.add(() => {
    if (!track || state.chapterProgress[iContact] <= 0) return;
    if (lenis.direction) mdir = lenis.direction > 0 ? -1 : 1;
    const speed = 0.6 + Math.min(18, Math.abs(lenis.velocity) * 0.35);
    mx += speed * mdir;
    const half = track.scrollWidth / 2;
    if (mx <= -half) mx += half;
    if (mx > 0) mx -= half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* ---------- fitting display type to its box ---------- */
  // 24/7 is sized at its widest stretch so it can never overflow its column while it widens.
  function fitNumber() {
    if (!bigNum) return;
    const box = bigNum.parentElement!;
    const keep = bigNum.style.getPropertyValue('font-stretch');
    bigNum.style.setProperty('font-stretch', '112%');
    bigNum.style.fontSize = '100px';
    const size = Math.min((100 * box.clientWidth) / bigNum.scrollWidth, vh * 0.32);
    bigNum.style.fontSize = `${Math.floor(size)}px`;
    bigNum.style.setProperty('font-stretch', keep);
  }

  /* ---------- navigation, focus, clicks ---------- */
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-goto]');
    if (!a) return;
    const i = ids.indexOf(a.dataset.goto ?? '');
    if (i < 0) return;
    e.preventDefault();
    scrollToY(targetFor(i));
    history.replaceState(null, '', i === 0 ? location.pathname : `#${ids[i]}`);
  });

  // Keyboard users: bring the focused element into view inside the transformed world.
  world.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    const r = el.getBoundingClientRect();
    if (r.top >= 70 && r.bottom <= vh - 64 - 16) return;
    // Distance from the bottom of the world to the element, then centre it on screen.
    const fromBottom = world.getBoundingClientRect().bottom - r.bottom;
    scrollToY(fromBottom + r.height / 2 - vh / 2, true);
  });

  const start = document.getElementById('start');
  start?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    state.spawns.push({ x: (e.clientX / window.innerWidth) * 2 - 1, y: -(e.clientY / window.innerHeight) * 2 + 1 });
  });
  window.addEventListener('pointermove', (e) => {
    state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  /* ---------- boot ---------- */
  measure();
  frame();
  gsap.ticker.add(frame);
  const hashIndex = ids.indexOf(location.hash.slice(1));
  if (hashIndex > 0) scrollToY(targetFor(hashIndex), true);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      state.mobile = window.matchMedia('(max-width: 860px)').matches;
      measure();
    }, 120);
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(prepare);
  const ro = new ResizeObserver(() => measure());
  Array.from(world.children).forEach((el) => ro.observe(el));

  const onReady = async () => {
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    prepare();
    ready = true;
    reveal(0);
    const canvas = document.querySelector<HTMLCanvasElement>('[data-scene]');
    if (!canvas || calm()) return;
    const load = () =>
      import('./tower')
        .then((m) => m.startTower(canvas))
        .then((ok) => ok && root.classList.add('scene-on'))
        .catch(() => {});
    'requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 300);
  };
  if (ready) onReady();
  else window.addEventListener('app:ready', onReady, { once: true });
}
