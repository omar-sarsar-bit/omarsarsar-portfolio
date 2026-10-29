// Drives the hero simulation: a message arrives, travels to the agent, gets routed to a program
// tile and lands in the daily report. Runs only while visible; reduced motion keeps the resting state.

import type { FlowMessage } from '../i18n/demo-scripts';

interface FlowConfig {
  rtl: boolean;
  W: number;
  outStart: [number, number];
  labelled: [number, number][];
  labelledIdx: number[];
  messages: FlowMessage[];
  tiles: string[];
  voice: string;
  steps: string[];
  start: number;
  counts: Record<string, number>;
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function travel(path: SVGPathElement, dot: SVGCircleElement, ms: number): Promise<void> {
  const len = path.getTotalLength();
  path.classList.add('is-active');
  dot.style.opacity = '1';
  return new Promise((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const pt = path.getPointAtLength(ease(p) * len);
      dot.setAttribute('cx', String(pt.x));
      dot.setAttribute('cy', String(pt.y));
      if (p < 1) requestAnimationFrame(frame);
      else {
        dot.style.opacity = '0';
        path.classList.remove('is-active');
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}

function waveMarkup(): string {
  const heights = [5, 11, 8, 14, 6, 12, 9, 4, 10];
  return `<span class="wave">${heights.map((h) => `<i style="height:${h / 14}em"></i>`).join('')}</span>`;
}

export function startFlow(root: HTMLElement) {
  const cfg = JSON.parse(root.dataset.flow ?? '{}') as FlowConfig;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const q = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const slots = [0, 1, 2].map((i) => q<HTMLElement>(`[data-slot="${i}"]`));
  const agent = q<HTMLElement>('[data-agent]');
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-step]'));
  const wires = {
    in: q<SVGPathElement>('[data-wire="in"]'),
    out: q<SVGPathElement>('[data-wire="out"]'),
    report: q<SVGPathElement>('[data-wire="report"]'),
  };
  const dots = {
    in: q<SVGCircleElement>('[data-packet="in"]'),
    out: q<SVGCircleElement>('[data-packet="out"]'),
    report: q<SVGCircleElement>('[data-packet="report"]'),
  };
  const readout = q<HTMLElement>('[data-readout]');
  const routedEl = q<HTMLElement>('[data-count="routed"]');
  const langsEl = q<HTMLElement>('[data-count="langs"]');
  const tiles = Array.from(root.querySelectorAll<HTMLElement>('[data-tile]'));
  const counts = { ...cfg.counts };
  const msgs = cfg.messages;
  let index = cfg.start;
  let routed = cfg.start;
  let visible = false;
  let running = false;

  const fill = (el: HTMLElement, m: FlowMessage) => {
    el.querySelector('.code')!.textContent = m.lang;
    const txt = el.querySelector<HTMLElement>('.txt')!;
    txt.setAttribute('dir', m.voice ? 'ltr' : m.dir);
    if (m.voice) {
      txt.innerHTML = waveMarkup();
      txt.setAttribute('aria-label', cfg.voice);
    } else {
      txt.textContent = m.text;
      txt.removeAttribute('aria-label');
    }
  };

  const updateBars = () => {
    const max = Math.max(3, ...Object.values(counts)) + 1;
    for (const [code, n] of Object.entries(counts)) {
      const bar = root.querySelector<HTMLElement>(`[data-bar="${code}"]`);
      if (!bar) continue;
      bar.dataset.n = String(n);
      bar.style.height = n ? `${14 + (n / max) * 86}%` : '6%';
    }
    langsEl.textContent = String(Object.values(counts).filter(Boolean).length);
  };

  const setStep = (i: number) => steps.forEach((s, j) => s.classList.toggle('on', i === j));

  async function cycle() {
    const m = msgs[index % msgs.length];
    const prev = [msgs[(index - 2 + msgs.length * 2) % msgs.length], msgs[(index - 1 + msgs.length) % msgs.length]];

    // Shift the queue up and bring the new message in at the bottom.
    fill(slots[0], prev[0]);
    fill(slots[1], prev[1]);
    fill(slots[2], m);
    slots.forEach((s, i) => {
      s.classList.toggle('is-new', i === 2);
      s.animate(
        i === 2
          ? [{ opacity: 0, transform: 'translateY(40%)' }, { opacity: 1, transform: 'none' }]
          : [{ transform: 'translateY(127%)' }, { transform: 'none' }],
        { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)' },
      );
    });
    await wait(500);

    await travel(wires.in, dots.in, 520);
    agent.classList.add('is-busy');
    for (let i = 0; i < cfg.steps.length; i++) {
      setStep(i);
      await wait(260);
    }

    const [tx, ty] = cfg.labelled[m.tile];
    const [sx, sy] = cfg.outStart;
    const mx = (sx + tx) / 2;
    wires.out.setAttribute('d', `M${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`);
    await travel(wires.out, dots.out, 640);
    agent.classList.remove('is-busy');

    const tile = tiles[cfg.labelledIdx[m.tile]];
    tile.classList.add('hit', 'lit');
    readout.textContent = cfg.tiles[m.tile];
    readout.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    setTimeout(() => tile.classList.remove('hit'), 500);

    await travel(wires.report, dots.report, 420);
    routed += 1;
    counts[m.lang] = (counts[m.lang] ?? 0) + 1;
    routedEl.textContent = String(routed);
    updateBars();

    index += 1;
    await wait(900);
  }

  async function loop() {
    if (running) return;
    running = true;
    while (visible && !document.hidden) await cycle();
    running = false;
  }

  updateBars();
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) loop();
  });
  io.observe(root);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) loop();
  });
}
