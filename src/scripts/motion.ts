// Motion layer: scroll reveals, split-word headings, count-ups, scroll-linked lines and parallax,
// pointer tilt, spotlight, magnetic buttons and the interactive dot canvas.
// Every effect is progressive: the page reads fully without it, and reduced motion turns it off.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ---------- split headings into words ---------- */
function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  const label = el.textContent?.trim() ?? '';
  const words = label.split(/\s+/);
  el.setAttribute('aria-label', label);
  el.replaceChildren(
    ...words.flatMap((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = word;
      inner.style.setProperty('--i', String(i));
      outer.append(inner);
      return i < words.length - 1 ? [outer, document.createTextNode(' ')] : [outer];
    }),
  );
}

/* ---------- reveal on enter ---------- */
function setupReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-split], [data-stagger], [data-draw], [data-countup]');
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const step = Number(group.dataset.stagger) || 90;
    Array.from(group.children).forEach((child, i) => (child as HTMLElement).style.setProperty('--d', `${i * step}ms`));
  });
  if (reduced) {
    targets.forEach((el) => {
      el.classList.add('is-in', 'is-done');
    });
    return;
  }
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(splitWords);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('is-in');
        if (el.hasAttribute('data-countup')) countUp(el);
        setTimeout(() => el.classList.add('is-done'), 1600);
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
}

/* ---------- count up numbers like "43+" or "4 yrs" ---------- */
function countUp(el: HTMLElement) {
  const text = el.textContent ?? '';
  const match = text.match(/^(\D*)(\d+)(.*)$/);
  if (!match || text.includes('/')) return;
  const [, pre, num, post] = match;
  const target = Number(num);
  const t0 = performance.now();
  const dur = 1400;
  const frame = (now: number) => {
    const p = clamp((now - t0) / dur, 0, 1);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = `${pre}${Math.round(target * eased)}${post}`;
    if (p < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ---------- scroll-linked: progress bar, parallax, process line ---------- */
function setupScroll() {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  const parallax = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const lines = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-line]'));
  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(window.scrollY / max, 0, 1) : 0})`;
    if (reduced) return;
    for (const el of parallax) {
      const r = el.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - vh / 2) * Number(el.dataset.parallax);
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    }
    for (const el of lines) {
      const r = el.getBoundingClientRect();
      const p = clamp((vh * 0.78 - r.top) / (r.height + vh * 0.2), 0, 1);
      el.style.setProperty('--p', p.toFixed(3));
      const items = Array.from(el.children) as HTMLElement[];
      items.forEach((item, i) => item.classList.toggle('is-active', p >= (i / Math.max(1, items.length - 1)) * 0.92));
    }
  };
  const request = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
}

/* ---------- pointer: tilt, spotlight, magnetic ---------- */
function setupPointer() {
  if (reduced || !finePointer) return;

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const maxDeg = Number(el.dataset.tilt) || 5;
    el.classList.add('tilt');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${((0.5 - y) * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * maxDeg).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll<HTMLElement>('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = `${(dx * 0.22).toFixed(1)}px ${(dy * 0.3).toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => (el.style.translate = ''));
  });
}

/* ---------- interactive dot canvas ---------- */
function setupDots() {
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-dots]').forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const host = canvas.parentElement!;
    const gap = 26;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let px = -9999;
    let py = -9999;
    let visible = false;
    let raf = 0;
    let color = '160,175,255';
    let base = 0.12;

    const readColor = () => {
      const cs = getComputedStyle(canvas);
      color = canvas.dataset.rgb ?? (cs.getPropertyValue('--dots-rgb').trim() || color);
      base = Number(canvas.dataset.alpha ?? cs.getPropertyValue('--dots-alpha')) || base;
    };
    const resize = () => {
      const r = host.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      readColor();
      draw(performance.now());
    };
    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      const radius = 150;
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const dist = Math.hypot(x - px, y - py);
          const near = Math.max(0, 1 - dist / radius);
          const wave = reduced ? 0 : (Math.sin(x * 0.02 + now * 0.0012) + Math.cos(y * 0.025 + now * 0.0009)) * 0.04;
          const a = clamp(base + wave + near * 0.75, 0.04, 1);
          const s = 1.1 + near * 2.2;
          ctx.fillStyle = `rgba(${color},${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x, y, s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    const loop = (now: number) => {
      draw(now);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    };

    new ResizeObserver(resize).observe(host);
    new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      cancelAnimationFrame(raf);
      if (visible && !reduced) raf = requestAnimationFrame(loop);
    }).observe(host);
    new MutationObserver(() => {
      readColor();
      draw(performance.now());
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (finePointer && !reduced) {
      // The canvas sits behind the content, so listen on the whole section.
      const area = canvas.closest('section') ?? host;
      area.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        px = e.clientX - r.left;
        py = e.clientY - r.top;
      });
      area.addEventListener('pointerleave', () => {
        px = -9999;
        py = -9999;
      });
    }
    canvas.classList.add('is-ready');
  });
}

export function startMotion() {
  setupReveal();
  setupScroll();
  setupPointer();
  setupDots();
}
