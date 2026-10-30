// The ascent engine. The world is pinned to the bottom of the screen with its chapters stacked
// upwards (column-reverse); native scroll drives a translateY so scrolling down climbs the page.
// Lenis smooths the wheel, GSAP's ticker runs the frame, and each chapter reports its own progress.

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
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
state.rtl = root.dir === 'rtl';
state.mobile = window.matchMedia('(max-width: 860px)').matches;

const chatRoot = document.querySelector<HTMLElement>('[data-chat]');
const chat: ChatPlayer | null = chatRoot ? setupChat(chatRoot, document.querySelector('[data-rules]')) : null;

if (isAscent()) startAscent();

function startAscent() {
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
  const logged = new Set<number>([0]);

  /* ---------- measuring ---------- */
  function measure() {
    vh = window.innerHeight;
    H = world.scrollHeight;
    spacer.style.height = `${H}px`;
    bounds = chapters.map((el) => ({ top: el.offsetTop, h: el.offsetHeight, b: H - el.offsetTop - el.offsetHeight }));
    state.max = Math.max(1, H - vh);
    centers = bounds.map((bd) => clamp(bd.b + bd.h / 2 - vh / 2, 0, state.max));
    fitName();
    ScrollTrigger.refresh();
  }

  /* ---------- smooth scroll ---------- */
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const scrollToY = (y: number, immediate = false) =>
    lenis.scrollTo(clamp(y, 0, state.max), { immediate, duration: 1.8, easing: (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2) });

  const targetFor = (i: number) => {
    const bd = bounds[i];
    if (i === 0) return 0;
    return bd.h <= vh ? bd.b + bd.h / 2 - vh / 2 : bd.b;
  };

  /* ---------- titles, fades, splits (after the fonts, so lines break where they will) ---------- */
  let prepared = false;
  let litWords: HTMLElement[] = [];
  function prepare() {
    if (prepared) return;
    prepared = true;
    document.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'sl' });
      gsap.set(split.lines, { yPercent: -112 });
      (el as HTMLElement & { _lines?: Element[] })._lines = split.lines;
      el.classList.add('is-split');
    });
    gsap.set('[data-fade]', { autoAlpha: 0, y: -24 });
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
    if (i === 1) chat?.play();
  }

  /* ---------- per-frame updates ---------- */
  const progressBar = document.querySelector<HTMLElement>('[data-progress]');
  const railMark = document.querySelector<HTMLElement>('[data-rail-mark]');
  const meter = document.querySelector<HTMLElement>('[data-meter]');
  const nowIndex = document.querySelector<HTMLElement>('[data-now-index]');
  const nowName = document.querySelector<HTMLElement>('[data-now-name]');
  const dockLinks = Array.from(document.querySelectorAll<HTMLElement>('.dock-index [data-index]'));
  const log = document.querySelector<HTMLElement>('[data-log]');
  const nums = chapters.map((c) => c.querySelector<HTMLElement>('[data-num]'));
  const bigNum = document.querySelector<HTMLElement>('[data-stretch]');
  const tiles = Array.from(document.querySelectorAll<HTMLElement>('[data-tiles] i'));
  const bars = Array.from(document.querySelectorAll<HTMLElement>('[data-bar]'));
  const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-steps] > li'));
  const logNames = JSON.parse(document.querySelector<HTMLElement>('[data-log-names]')?.dataset.logNames ?? '[]') as string[];
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const toneColor: Record<string, string> = { paper: '#EBEBE6', cobalt: '#1F33D1', ink: '#0D0D10' };

  function appendLog(i: number) {
    if (!log || logged.has(i)) return;
    logged.add(i);
    const p = document.createElement('p');
    const ms = 12 + Math.round(Math.random() * 48);
    p.innerHTML = `<span class="ok">✓</span><span></span><span class="ms">${ms}ms</span>`;
    p.children[1].textContent = logNames[i] ?? chapters[i].id;
    log.append(p);
    gsap.from(p, { opacity: 0, y: -6, duration: 0.5 });
    while (log.children.length > 5) log.firstElementChild?.remove();
  }

  function setActive(i: number) {
    if (i === active) return;
    active = i;
    const tone = chapters[i].dataset.tone as typeof state.tone;
    state.tone = tone;
    root.dataset.tone = tone;
    themeMeta?.setAttribute('content', toneColor[tone]);
    dockLinks.forEach((a, k) => a.classList.toggle('is-active', k === i));
    if (nowIndex) nowIndex.textContent = String(i).padStart(2, '0');
    if (nowName) nowName.textContent = dockLinks[i]?.querySelector('.nm')?.textContent ?? '';
    if (ready) appendLog(i);
  }

  let lastLit = -1;
  function frame() {
    const s = lenis.scroll;
    state.scroll = s;
    state.progress = clamp(s / state.max);
    world.style.transform = `translate3d(0, ${s.toFixed(2)}px, 0)`;

    // Continuous chapter value for the camera.
    let c = 0;
    for (let i = 0; i < centers.length - 1; i++) {
      if (s >= centers[i]) c = i + clamp((s - centers[i]) / Math.max(1, centers[i + 1] - centers[i]));
    }
    state.chapter = c;

    const mid = s + vh / 2;
    bounds.forEach((bd, i) => {
      const p = clamp((s - (bd.b - vh)) / (bd.h + vh));
      state.chapterProgress[i] = p;
      if (ready && p > 0.08) reveal(i);
      if (mid >= bd.b && mid < bd.b + bd.h) setActive(i);
      const num = nums[i];
      if (num && p > 0 && p < 1) num.style.setProperty('font-stretch', `${60 + p * 90}%`);
    });

    const pr = state.chapterProgress;
    if (bigNum && pr[2] > 0 && pr[2] < 1) bigNum.style.setProperty('font-stretch', `${50 + clamp((pr[2] - 0.2) / 0.5) * 100}%`);
    if (tiles.length) {
      const lit = Math.round(clamp((pr[2] - 0.25) / 0.45) * tiles.length);
      tiles.forEach((t, k) => t.classList.toggle('on', k < lit));
    }
    bars.forEach((b, k) => (b.style.transform = `scaleX(${clamp((pr[3] - 0.28 - k * 0.07) / 0.3)})`));
    steps.forEach((li, k) => li.style.setProperty('--fill', String(clamp((pr[4] - 0.22 - k * 0.06) / 0.18))));
    if (litWords.length) {
      const n = Math.round(clamp((pr[6] - 0.2) / 0.45) * litWords.length);
      if (n !== lastLit) {
        lastLit = n;
        litWords.forEach((w, k) => w.classList.toggle('lit', k < n));
      }
    }

    if (progressBar) progressBar.style.transform = `scaleX(${state.progress})`;
    if (railMark) railMark.style.bottom = `${state.progress * 100}%`;
    if (meter) meter.textContent = String(Math.round(state.progress * 100)).padStart(3, '0');
  }

  /* ---------- marquee driven by scroll velocity ---------- */
  const track = document.querySelector<HTMLElement>('[data-marquee-track]');
  let mx = 0;
  let mdir = -1;
  gsap.ticker.add(() => {
    if (!track || state.chapterProgress[7] <= 0) return;
    if (lenis.direction) mdir = lenis.direction > 0 ? -1 : 1;
    const speed = 0.6 + Math.min(18, Math.abs(lenis.velocity) * 0.35);
    mx += speed * mdir;
    const half = track.scrollWidth / 2;
    if (mx <= -half) mx += half;
    if (mx > 0) mx -= half;
    track.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* ---------- magnetic circle ---------- */
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      qx((e.clientX - r.left - r.width / 2) * 0.35);
      qy((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('pointerleave', () => {
      qx(0);
      qy(0);
    });
  });

  /* ---------- fit the outro name to the full width ---------- */
  function fitName() {
    const el = document.querySelector<HTMLElement>('[data-fit]');
    if (!el) return;
    el.style.fontSize = '100px';
    const avail = el.parentElement!.clientWidth - parseFloat(getComputedStyle(el).paddingInlineStart) * 2;
    el.style.fontSize = `${Math.floor((100 * avail) / el.scrollWidth)}px`;
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

  world.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    const r = el.getBoundingClientRect();
    const dock = 64;
    if (r.top >= 60 && r.bottom <= vh - dock - 16) return;
    const y = r.top - world.getBoundingClientRect().top;
    scrollToY(H - y - r.height / 2 - vh / 2, true);
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
  new ResizeObserver(() => measure()).observe(world);

  const onReady = async () => {
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    prepare();
    ready = true;
    reveal(0);
    const canvas = document.querySelector<HTMLCanvasElement>('[data-scene]');
    if (!canvas || calm()) return;
    const load = () =>
      import('./scene')
        .then((m) => m.startScene(canvas))
        .then((ok) => ok && root.classList.add('scene-on'))
        .catch(() => {});
    'requestIdleCallback' in window ? requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 300);
  };
  if (ready) onReady();
  else window.addEventListener('app:ready', onReady, { once: true });
}
