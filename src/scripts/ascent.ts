// The ascent engine. The world is pinned to the bottom of the screen with its chapters stacked
// upwards (column-reverse); native scroll drives a translateY so scrolling down climbs the page.
//
// The climb works like a lift. Between floors the world rides down (you go up) and the arriving
// floor stays dimmed, so nothing is read bottom first; the floor number shows like a lift display.
// The lift stops with the floor's title at the top of the screen, and the floor is then read the
// normal way: if it is taller than the screen, scrolling on moves its content up, title to last line.
// Lenis smooths the wheel and GSAP's ticker runs the frame.

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
const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const lift = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
state.rtl = root.dir === 'rtl';
state.mobile = window.matchMedia('(max-width: 860px)').matches;
state.chapterPlay = new Array(chapters.length).fill(0);

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

/** One stretch of the scroll: a ride between floors, or reading one floor. */
interface Segment {
  type: 'ride' | 'read';
  /** Floor read, or floor the ride arrives at (-1: the roof). */
  to: number;
  from: number;
  s0: number;
  s1: number;
  T0: number;
  T1: number;
}

function startAscent() {
  root.classList.add('ascent-live');
  const spacer = document.createElement('div');
  spacer.className = 'ascent-spacer';
  spacer.setAttribute('aria-hidden', 'true');
  world.after(spacer);

  let vh = window.innerHeight;
  let bounds: { h: number; b: number }[] = [];
  let segs: Segment[] = [];
  let ready = root.classList.contains('is-ready');
  let active = -1;
  let T = 0;
  const revealed = new Set<number>();

  /* ---------- measuring: lay the climb out as rides and reads ---------- */
  // Offset that puts a floor's title at the top of the screen, and its last line at the bottom.
  const readStart = (i: number) => {
    const { b, h } = bounds[i];
    return h >= vh ? b + h - vh : b + (h - vh) / 2;
  };
  const readEnd = (i: number) => {
    const { b, h } = bounds[i];
    return h >= vh ? b : b + (h - vh) / 2;
  };

  function measure() {
    const keep = locate(lenis ? lenis.scroll : 0);
    vh = window.innerHeight;
    // The world box is one screen tall; its content stacks upwards from the bottom edge.
    const box = world.clientHeight;
    const parts = Array.from(world.children) as HTMLElement[];
    const H = parts.reduce((sum, el) => sum + el.offsetHeight, 0);
    bounds = chapters.map((el) => ({ h: el.offsetHeight, b: box - el.offsetTop - el.offsetHeight }));
    const Tmax = Math.max(0, H - vh);
    const lim = (v: number) => clamp(v, 0, Tmax);

    segs = [];
    let s = 0;
    const push = (type: Segment['type'], from: number, to: number, T0: number, T1: number) => {
      const d = Math.abs(T1 - T0);
      const len = type === 'read' ? d : clamp(d * 0.35, vh * 0.5, vh * 0.85);
      if (type === 'read' && len < 1) return;
      segs.push({ type, from, to, s0: s, s1: s + len, T0, T1 });
      s += len;
    };
    push('read', 0, 0, lim(readStart(0)), lim(readEnd(0)));
    for (let i = 1; i < chapters.length; i++) {
      push('ride', i - 1, i, lim(readEnd(i - 1)), lim(readStart(i)));
      push('read', i, i, lim(readStart(i)), lim(readEnd(i)));
    }
    push('ride', chapters.length - 1, -1, lim(readEnd(chapters.length - 1)), Tmax);
    if (!segs.length) segs.push({ type: 'read', from: 0, to: 0, s0: 0, s1: 1, T0: 0, T1: 0 });

    state.max = Math.max(1, s);
    spacer.style.height = `${state.max + vh}px`;
    fitName();
    fitNumber();
    ScrollTrigger.refresh();
    // Stay on the same stretch of the climb when the layout changes.
    if (keep && lenis && segs[keep.k]) lenis.scrollTo(segs[keep.k].s0 + keep.u * (segs[keep.k].s1 - segs[keep.k].s0), { immediate: true });
  }

  function locate(s: number) {
    if (!segs.length) return null;
    let k = segs.findIndex((g) => s < g.s1);
    if (k < 0) k = segs.length - 1;
    const g = segs[k];
    return { k, g, u: clamp((s - g.s0) / Math.max(1, g.s1 - g.s0)) };
  }

  /* ---------- smooth scroll ---------- */
  let lenis: Lenis | null = null;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('demo:open', () => lenis!.stop());
  window.addEventListener('demo:close', () => lenis!.start());

  const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
  const scrollToY = (y: number, immediate = false, duration = 1.8) =>
    lenis!.scrollTo(clamp(y, 0, state.max), { immediate, duration, easing: ease });

  // Where a floor is read from: the lift has stopped and its title is at the top.
  const targetFor = (i: number) => {
    if (i === 0) return 0;
    const g = segs.find((x) => x.type === 'read' && x.to === i) ?? segs.find((x) => x.type === 'ride' && x.to === i);
    return g ? (g.type === 'read' ? g.s0 : g.s1) : 0;
  };

  // A ride never rests half way: when the wheel (or a finger) stops inside one, the lift finishes
  // the trip, forwards or back, whichever end is nearer.
  let settleTimer = 0;
  let settling = false;
  let touching = false;
  const settleSoon = () => {
    clearTimeout(settleTimer);
    if (settling || touching) return;
    settleTimer = window.setTimeout(() => {
      const here = locate(lenis!.scroll);
      if (!here || here.g.type !== 'ride' || here.u < 0.02 || here.u > 0.98) return;
      settling = true;
      // Carry on the way the reader was going; only a small nudge falls back.
      const forward = lenis!.direction >= 0 ? here.u > 0.12 : here.u > 0.88;
      const dest = forward ? here.g.s1 : here.g.s0;
      lenis!.scrollTo(dest, { duration: 0.9, easing: ease, onComplete: () => (settling = false) });
      window.setTimeout(() => (settling = false), 1200);
    }, 170);
  };
  lenis.on('scroll', settleSoon);
  window.addEventListener('touchstart', () => { touching = true; clearTimeout(settleTimer); }, { passive: true });
  window.addEventListener('touchend', () => { touching = false; settleSoon(); }, { passive: true });
  window.addEventListener('touchcancel', () => { touching = false; settleSoon(); }, { passive: true });

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

  // A floor comes alive as the lift stops: title lines rise, text fades in top to bottom,
  // and its live interface starts playing.
  const playStart: number[] = new Array(chapters.length).fill(0);
  const playLength = (i: number) => (ids[i] === 'about' ? 5200 : 2600);
  function arrive(i: number) {
    if (!ready || !prepared) return;
    if (!playStart[i]) playStart[i] = performance.now();
    if (revealed.has(i)) return;
    revealed.add(i);
    const ch = chapters[i];
    ch.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => {
      const lines = (el as HTMLElement & { _lines?: Element[] })._lines ?? [];
      gsap.to(lines, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.08 });
    });
    const fades = ch.querySelectorAll('[data-fade]');
    if (fades.length) gsap.to(fades, { autoAlpha: 1, y: 0, duration: 1, ease: 'expo.out', delay: 0.2, stagger: 0.08 });
    if (ids[i] === 'frontdesk') chat?.play();
  }

  /* ---------- live interfaces ---------- */
  const q = <T extends HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));
  const progressBar = document.querySelector<HTMLElement>('[data-progress]');
  const nowIndex = document.querySelector<HTMLElement>('[data-now-index]');
  const nowName = document.querySelector<HTMLElement>('[data-now-name]');
  const floorNum = document.querySelector<HTMLElement>('[data-floor]');
  const floorName = document.querySelector<HTMLElement>('[data-floor-name]');
  const liftEl = document.querySelector<HTMLElement>('[data-lift]');
  const liftNum = document.querySelector<HTMLElement>('[data-lift-n]');
  const liftName = document.querySelector<HTMLElement>('[data-lift-name]');
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

  // Dimmed floors while the lift moves, so no floor is read from its last line.
  const DIM = 0.08;
  const vis = new Array(chapters.length).fill(-1);
  const setVis = (i: number, v: number) => {
    const r = Math.round(v * 100) / 100;
    if (vis[i] === r) return;
    vis[i] = r;
    chapters[i].style.setProperty('--vis', String(r));
  };

  let lastLit = -1;
  let liftShown = -1;
  let liftDown = false;
  function frame() {
    const s = lenis!.scroll;
    const here = locate(s);
    if (!here) return;
    const { g, u } = here;
    const k = g.type === 'ride' ? lift(u) : u;
    T = g.T0 + (g.T1 - g.T0) * k;
    state.scroll = T;
    state.progress = clamp(s / state.max);
    world.style.transform = `translate3d(0, ${T.toFixed(2)}px, 0)`;

    // Which floor we are on, and how lit each floor is.
    const last = chapters.length - 1;
    let liftOpacity = 0;
    if (g.type === 'read') {
      state.chapter = g.to;
      setActive(g.to);
      arrive(g.to);
      chapters.forEach((_, i) => setVis(i, i === g.to ? 1 : DIM));
    } else if (g.to === -1) {
      // The last ride, onto the roof: the top floor stays lit under the name.
      state.chapter = last;
      setActive(last);
      arrive(last);
      chapters.forEach((_, i) => setVis(i, i === last ? 1 : DIM));
    } else {
      state.chapter = g.from + k;
      setActive(k < 0.5 ? g.from : g.to);
      chapters.forEach((_, i) => {
        if (i === g.from) setVis(i, DIM + (1 - DIM) * (1 - smooth(u / 0.28)));
        else if (i === g.to) setVis(i, DIM + (1 - DIM) * smooth((u - 0.74) / 0.24));
        else setVis(i, DIM);
      });
      if (u > 0.8) arrive(g.to);
      liftOpacity = smooth((u - 0.1) / 0.2) * (1 - smooth((u - 0.66) / 0.16));
      // The display names where the lift is going: up to the next floor, or back down.
      const down = lenis!.direction < 0;
      const dest = down ? g.from : g.to;
      if ((liftShown !== dest || liftDown !== down) && liftEl && liftNum && liftName) {
        liftShown = dest;
        liftDown = down;
        liftEl.dataset.dir = down ? 'down' : 'up';
        liftNum.textContent = String(dest).padStart(2, '0');
        liftName.textContent = chapterNames[dest] ?? '';
      }
    }
    liftEl?.style.setProperty('opacity', liftOpacity.toFixed(3));

    // How far each floor's live interface has played: by time since arrival, or by reading.
    const now = performance.now();
    chapters.forEach((_, i) => {
      let play = playStart[i] ? clamp((now - playStart[i]) / playLength(i)) : 0;
      if (g.type === 'read' && g.to === i) play = Math.max(play, u);
      state.chapterPlay[i] = Math.max(state.chapterPlay[i], play);
    });

    const pl = state.chapterPlay;
    if (bigNum) bigNum.style.setProperty('font-stretch', `${62 + pl[iFront] * 50}%`);
    boardRows.forEach((row, n) => {
      row.classList.toggle('is-checked', pl[iIntake] > 0.08 + n * 0.12);
      row.classList.toggle('is-routed', pl[iIntake] > 0.16 + n * 0.12);
    });
    briefItems.forEach((it, n) => it.classList.toggle('is-in', pl[iAssist] > 0.06 + n * 0.13));
    const pb = clamp((pl[iBack] - 0.08) / 0.6);
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
    if (invMatched) invMatched.textContent = String(Math.round(matchedTotal * clamp(pl[iBack] / 0.8)));
    bars.forEach((b, n) => (b.style.transform = `scaleX(${clamp((pl[iReports] - 0.05 - n * 0.12) / 0.4)})`));
    steps.forEach((li, n) => li.style.setProperty('--fill', String(clamp((pl[iApps] - n * 0.15) / 0.3))));
    if (litWords.length) {
      const n = Math.round(pl[iAbout] * litWords.length);
      if (n !== lastLit) {
        lastLit = n;
        litWords.forEach((w, j) => w.classList.toggle('lit', j < n));
      }
    }

    if (progressBar) progressBar.style.transform = `scaleX(${state.progress})`;
  }

  /* ---------- marquee driven by scroll velocity ---------- */
  const track = document.querySelector<HTMLElement>('[data-marquee-track]');
  let mx = 0;
  let mdir = -1;
  gsap.ticker.add(() => {
    if (!track || active !== iContact) return;
    if (lenis!.direction) mdir = lenis!.direction > 0 ? -1 : 1;
    const speed = 0.6 + Math.min(18, Math.abs(lenis!.velocity) * 0.35);
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

  // Keyboard users: bring the focused element into view, inside the reading of its own floor.
  world.addEventListener('focusin', (e) => {
    const el = e.target as HTMLElement;
    const r = el.getBoundingClientRect();
    const ch = el.closest<HTMLElement>('[data-ch]');
    const i = ch ? chapters.indexOf(ch) : -1;
    const settled = locate(lenis!.scroll);
    const onFloor = settled && settled.g.type === 'read' && settled.g.to === i;
    if (onFloor && r.top >= 70 && r.bottom <= vh - 64 - 16) return;
    if (i < 0) {
      scrollToY(state.max, true);
      return;
    }
    const read = segs.find((x) => x.type === 'read' && x.to === i);
    if (!read) {
      scrollToY(targetFor(i), true);
      return;
    }
    // Where the element sits below its floor's top, then the offset that centres it.
    const fromTop = r.top - ch!.getBoundingClientRect().top;
    const want = clamp(readStart(i) + vh / 2 - fromTop - r.height / 2, Math.min(read.T0, read.T1), Math.max(read.T0, read.T1));
    scrollToY(read.s0 + (read.T0 - want), true);
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
    const here = locate(lenis!.scroll);
    arrive(here && here.g.type === 'read' ? here.g.to : 0);
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
