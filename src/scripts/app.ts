// Runs on every page: preloader, custom cursor, dock sheet, copy buttons and the local clock.
// Announces `app:ready` on window (and adds `is-ready` to <html>) once the preloader has cleared.

import { gsap } from 'gsap';
import { calm } from './state';

const root = document.documentElement;
root.classList.add('app-live');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function preloader(): Promise<void> {
  const el = document.querySelector<HTMLElement>('[data-pre]');
  if (!el || root.classList.contains('no-preload')) {
    el?.remove();
    return Promise.resolve();
  }
  const count = el.querySelector<HTMLElement>('[data-pre-count]')!;
  const bar = el.querySelector<HTMLElement>('[data-pre-bar]')!;
  const steps = el.querySelectorAll<HTMLElement>('[data-pre-step]');
  const counter = { v: 0 };
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        try {
          sessionStorage.setItem('os-seen', '1');
        } catch {
          /* private mode: the preloader will show again next visit */
        }
        el.remove();
        resolve();
      },
    });
    tl.to(counter, {
      v: 100,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => (count.textContent = String(Math.round(counter.v)).padStart(3, '0')),
    })
      .to(bar, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to(steps, { opacity: 1, duration: 0.2, stagger: 0.32 }, 0.1)
      .add(() => {}, '+=0.15')
      // The curtain drops: on this site things move down as you rise.
      .to(el, { yPercent: 100, duration: 0.9, ease: 'expo.inOut' });
    // Start once the fonts are in, but never wait more than a second for them.
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1000))]).then(() => tl.play());
  });
}

function cursor() {
  const el = document.querySelector<HTMLElement>('[data-cursor]');
  if (!el || !finePointer || calm()) return;
  root.classList.add('has-cursor');
  const label = el.querySelector<HTMLElement>('[data-cursor-label]')!;
  const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => {
    if (!el.classList.contains('is-live')) {
      gsap.set(el, { x: e.clientX, y: e.clientY });
      el.classList.add('is-live');
    }
    x(e.clientX);
    y(e.clientY);
  });
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.addEventListener('pointerover', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('a, button, summary, [data-cursor-text]');
    const zone = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor-zone]');
    const text = target?.dataset.cursorText ?? (target ? '' : zone?.dataset.cursorZone ?? '');
    el.classList.toggle('is-hover', Boolean(target));
    el.classList.toggle('has-label', Boolean(text));
    if (text) label.textContent = text;
  });
  document.addEventListener('pointerleave', () => el.classList.remove('is-hover', 'has-label'));
}

function dockSheet() {
  const btn = document.querySelector<HTMLButtonElement>('[data-sheet-toggle]');
  const sheet = document.querySelector<HTMLElement>('[data-sheet]');
  if (!btn || !sheet) return;
  const set = (open: boolean) => {
    sheet.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = (open ? btn.dataset.close : btn.dataset.open) ?? '';
  };
  btn.addEventListener('click', () => set(sheet.hidden));
  sheet.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
}

function copyButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    const label = btn.textContent ?? '';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy ?? '');
        btn.textContent = btn.dataset.copied ?? label;
        setTimeout(() => (btn.textContent = label), 1600);
      } catch {
        const target = document.getElementById(btn.getAttribute('aria-describedby') ?? '');
        if (target) window.getSelection()?.selectAllChildren(target);
      }
    });
  });
}

function clock() {
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Damascus' });
  const tick = () => els.forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 15000);
}

// Fonts in (or a second passed): the ascent can paint without anything reflowing in view.
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1000))]).then(() =>
  root.classList.add('fonts-ready'),
);

cursor();
dockSheet();
copyButtons();
clock();
preloader().then(() => {
  root.classList.add('is-ready');
  window.dispatchEvent(new Event('app:ready'));
});
