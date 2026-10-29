// Motion for normal-scroll pages (case study, 404): smooth scroll, line reveals,
// page tone switching per section, the pinned horizontal layers and the 43-square scrub.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { calm } from './state';
import { setupChat } from './chat';

gsap.registerPlugin(ScrollTrigger, SplitText);
const root = document.documentElement;
const chatRoot = document.querySelector<HTMLElement>('[data-chat]');
const chat = chatRoot ? setupChat(chatRoot, document.querySelector('[data-rules]')) : null;

if (!calm()) {
  root.classList.add('toned');
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Three layers, pinned and moved sideways. Created first so later triggers account for the pin spacing.
  const pin = document.querySelector<HTMLElement>('[data-pin]');
  const track = pin?.querySelector<HTMLElement>('[data-track]');
  if (pin && track) {
    const rtl = root.dir === 'rtl';
    gsap.to(track, {
      x: () => (rtl ? 1 : -1) * (track.scrollWidth - window.innerWidth),
      ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${track.scrollWidth - window.innerWidth}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
    gsap.utils.toArray<HTMLElement>('.layer-num').forEach((num) => {
      gsap.fromTo(num, { fontStretch: '50%' }, { fontStretch: '150%', ease: 'none', scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${track.scrollWidth - window.innerWidth}`, scrub: true } });
    });
  }

  const toneColor: Record<string, string> = { paper: '#EBEBE6', cobalt: '#1F33D1', ink: '#0D0D10' };
  const setTone = (tone: string) => {
    root.dataset.tone = tone;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', toneColor[tone] ?? toneColor.paper);
  };
  document.querySelectorAll<HTMLElement>('[data-section]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onEnter: () => setTone(sec.dataset.tone ?? 'paper'),
      onEnterBack: () => setTone(sec.dataset.tone ?? 'paper'),
    });
  });

  // Line reveals, rising from below on a normal page. Split once the fonts are in.
  const splitTitles = () => document.querySelectorAll<HTMLElement>('[data-title]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 112,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    splitTitles();
    ScrollTrigger.refresh();
  });
  gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 24, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  // 43 squares light up with the scroll.
  const squares = gsap.utils.toArray<HTMLElement>('[data-squares] i');
  if (squares.length) {
    ScrollTrigger.create({
      trigger: '[data-squares]',
      start: 'top 80%',
      end: 'bottom 35%',
      scrub: true,
      onUpdate: (self) => {
        const n = Math.round(self.progress * squares.length);
        squares.forEach((sq, i) => sq.classList.toggle('on', i < n));
      },
    });
  }

  // Play the transcript when it comes into view.
  if (chatRoot && chat) {
    ScrollTrigger.create({ trigger: chatRoot, start: 'top 70%', once: true, onEnter: () => chat.play() });
  }

  // Magnetic circle.
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

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
