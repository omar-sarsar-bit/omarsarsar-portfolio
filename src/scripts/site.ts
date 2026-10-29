// Site-wide behaviour: theme toggle, mobile menu, header state and copy buttons, plus the motion layer.
import { startMotion } from './motion';

const root = document.documentElement;

function setupTheme() {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;
  const sync = () => {
    const light = root.getAttribute('data-theme') === 'light';
    btn.setAttribute('aria-label', (light ? btn.dataset.labelDark : btn.dataset.labelLight) ?? '');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#F6F7FC' : '#0A0D1C');
  };
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable: the choice lasts for this page view */
    }
    sync();
  });
  sync();
}

function setupMenu() {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!btn || !nav) return;
  const set = (open: boolean) => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', (open ? btn.dataset.labelClose : btn.dataset.labelOpen) ?? '');
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) set(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
  });
}

function setupHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

function setupCopy() {
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

setupTheme();
setupMenu();
setupHeader();
setupCopy();
startMotion();
