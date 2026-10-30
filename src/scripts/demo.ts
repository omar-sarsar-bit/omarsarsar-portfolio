// Live demos in the work index: a dialog that plays the system's conversation on sample data,
// then shows what it produced. Page scrolling pauses while it is open.

import { playThread, type Labels } from './chat';
import type { WorkDemo } from '../i18n/demo-scripts';

interface Data {
  labels: Labels;
  want: string;
  wa: string;
  projects: Record<string, { name: string; sector: string; tags: string }>;
  demos: Record<string, WorkDemo>;
}

const dialog = document.querySelector<HTMLDialogElement>('[data-demo-dialog]');
if (dialog) setup(dialog);

function setup(dlg: HTMLDialogElement) {
  const data = JSON.parse(dlg.querySelector('[data-demo-data]')?.textContent ?? '{}') as Data;
  const pageLang = document.documentElement.lang;
  const $ = <T extends HTMLElement>(sel: string) => dlg.querySelector<T>(sel)!;
  const name = $('[data-demo-name]');
  const sector = $('[data-demo-sector]');
  const points = $('[data-demo-points]');
  const thread = $('[data-demo-thread]');
  const out = $('[data-demo-out]');
  const outTitle = $('[data-demo-out-title]');
  const outRows = $('[data-demo-out-rows]');
  const want = $<HTMLAnchorElement>('[data-demo-want]');
  const body = $('.demo-body');
  // Keep the newest line in view, unless the visitor has scrolled up to reread.
  let follow = true;
  body.addEventListener('scroll', () => (follow = body.scrollHeight - body.scrollTop - body.clientHeight < 80), { passive: true });
  const toEnd = () => follow && body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  let current = '';
  let run = 0;
  let opener: HTMLElement | null = null;

  async function play() {
    const id = ++run;
    const demo = data.demos[current];
    out.hidden = true;
    follow = true;
    const done = await playThread(thread, demo, data.labels, pageLang, () => id === run && dlg.open, undefined, toEnd);
    if (!done) return;
    outTitle.textContent = demo.outcome.title;
    outRows.replaceChildren(
      ...demo.outcome.rows.map(([k, v]) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = k;
        dd.textContent = v;
        row.append(dt, dd);
        return row;
      }),
    );
    out.hidden = false;
    out.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.16,1,.3,1)' });
    requestAnimationFrame(toEnd);
  }

  function open(key: string, from: HTMLElement) {
    const demo = data.demos[key];
    const project = data.projects[key];
    if (!demo || !project) return;
    current = key;
    opener = from;
    name.textContent = project.name;
    sector.textContent = `${project.sector} · ${project.tags}`;
    points.replaceChildren(
      ...demo.points.map((p, i) => {
        const li = document.createElement('li');
        li.innerHTML = '<span class="mono ltr n"></span><span></span>';
        li.children[0].textContent = String(i + 1).padStart(2, '0');
        li.children[1].textContent = p;
        return li;
      }),
    );
    want.href = `${data.wa}${encodeURIComponent(data.want + project.name)}`;
    thread.replaceChildren();
    out.hidden = true;
    dlg.showModal();
    window.dispatchEvent(new CustomEvent('demo:open'));
    body.scrollTo(0, 0);
    play();
  }

  document.querySelectorAll<HTMLElement>('[data-demo]').forEach((btn) =>
    btn.addEventListener('click', () => open(btn.dataset.demo ?? '', btn)),
  );
  $('[data-demo-close]').addEventListener('click', () => dlg.close());
  $('[data-demo-replay]').addEventListener('click', () => play());
  // A click on the backdrop (outside the panel) closes the dialog.
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
  dlg.addEventListener('close', () => {
    run++;
    window.dispatchEvent(new CustomEvent('demo:close'));
    opener?.focus({ preventScroll: true });
  });
}
