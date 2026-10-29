// Plays the scripted conversation in the "How the agent thinks" section and highlights
// the prompt rule behind each agent reply. The full conversation is in the HTML for no-JS visitors.

import type { DemoLang, DemoScript } from '../i18n/demo-scripts';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function startDemo(root: HTMLElement) {
  const scripts = JSON.parse(root.querySelector('[data-scripts]')?.textContent ?? '{}') as Record<DemoLang, DemoScript>;
  const thread = root.querySelector<HTMLElement>('[data-thread]')!;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-lang]'));
  const replay = root.querySelector<HTMLButtonElement>('[data-replay]')!;
  const rules = Array.from(document.querySelectorAll<HTMLElement>('[data-rules] [data-rule]'));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = (root.dataset.initial as DemoLang) ?? 'en';
  let run = 0;

  const highlight = (ids: number[] = []) => rules.forEach((r, i) => r.classList.toggle('is-on', ids.includes(i)));

  const bubble = (from: 'user' | 'agent', text: string, voiceLabel?: string) => {
    const el = document.createElement('div');
    el.className = `msg ${from}`;
    if (voiceLabel) {
      const v = document.createElement('span');
      v.className = 'voice mono';
      v.textContent = voiceLabel;
      el.append(v);
    }
    const p = document.createElement('p');
    p.textContent = text;
    el.append(p);
    return el;
  };

  async function play(lang: DemoLang) {
    const id = ++run;
    const s = scripts[lang];
    current = lang;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.lang === lang)));
    thread.setAttribute('dir', s.dir);
    thread.setAttribute('lang', lang);
    thread.classList.add('is-playing');
    thread.replaceChildren();
    highlight();

    for (const m of s.messages) {
      if (id !== run) return;
      if (m.from === 'agent' && !reduced) {
        const typing = document.createElement('div');
        typing.className = 'typing';
        typing.innerHTML = '<i></i><i></i><i></i>';
        thread.append(typing);
        await wait(900);
        typing.remove();
        if (id !== run) return;
      } else if (!reduced) {
        await wait(700);
        if (id !== run) return;
      }
      thread.append(bubble(m.from, m.text, m.voice ? s.voiceLabel : undefined));
      if (m.rules) highlight(m.rules);
    }
    if (!reduced) await wait(500);
    if (id !== run) return;
    const route = document.createElement('p');
    route.className = 'route';
    route.textContent = s.route;
    thread.append(route);
  }

  tabs.forEach((t) => t.addEventListener('click', () => play(t.dataset.lang as DemoLang)));
  replay.addEventListener('click', () => play(current));

  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        play(current);
      }
    },
    { threshold: 0.35 },
  );
  io.observe(root);
}
