// Plays a scripted transcript line by line and lights the prompt rule behind each agent reply.
// The full conversation is already in the HTML, so nothing is lost without JavaScript.

import type { DemoLang, DemoScript } from '../i18n/demo-scripts';
import { calm } from './state';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface Labels { user: string; agent: string; routed: string }

export interface ChatPlayer {
  play: (lang?: DemoLang) => void;
}

export function setupChat(root: HTMLElement, rulesRoot?: ParentNode | null): ChatPlayer {
  const scripts = JSON.parse(root.querySelector('[data-scripts]')?.textContent ?? '{}') as Record<DemoLang, DemoScript>;
  const labels = JSON.parse(root.dataset.labels ?? '{}') as Labels;
  const thread = root.querySelector<HTMLElement>('[data-thread]')!;
  const route = root.querySelector<HTMLElement>('[data-route]')!;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-lang]'));
  const rules = Array.from((rulesRoot ?? document).querySelectorAll<HTMLElement>('[data-rule]'));
  let current = (root.dataset.initial as DemoLang) ?? 'en';
  let run = 0;

  const light = (ids: number[] = []) => rules.forEach((r, i) => r.classList.toggle('is-on', ids.includes(i)));
  const stamp = (i: number) => `02:00:${String(14 + i * 3).padStart(2, '0')}`;

  const line = (s: DemoScript, i: number) => {
    const m = s.messages[i];
    const li = document.createElement('li');
    li.className = `line ${m.from}`;
    const who = document.createElement('span');
    who.className = 'who mono';
    const parts = [stamp(i), m.from === 'user' ? labels.user : labels.agent];
    if (m.voice) parts.push(s.voiceLabel);
    if (m.rules) parts.push(m.rules.map((r) => `R${r + 1}`).join(' '));
    parts.forEach((txt, k) => {
      const span = document.createElement('span');
      span.textContent = txt;
      if (k === 0 || (m.rules && k === parts.length - 1)) span.className = 'ltr';
      if (m.rules && k === parts.length - 1) span.classList.add('rules-tag');
      if (m.voice && k === 2) span.className = 'voice';
      who.append(span);
    });
    const p = document.createElement('p');
    p.textContent = m.text;
    li.append(who, p);
    return li;
  };

  async function play(lang: DemoLang = current) {
    const id = ++run;
    const s = scripts[lang];
    current = lang;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.lang === lang)));
    thread.setAttribute('dir', s.dir);
    thread.setAttribute('lang', lang);
    thread.replaceChildren();
    route.style.opacity = '0';
    route.lastChild!.textContent = ` ${s.route}`;
    light();
    for (let i = 0; i < s.messages.length; i++) {
      if (id !== run) return;
      const m = s.messages[i];
      if (!calm()) {
        if (m.from === 'agent') {
          const typing = document.createElement('li');
          typing.className = 'line agent';
          typing.innerHTML = '<span class="who mono"></span><span class="typing"><i></i><i></i><i></i></span>';
          thread.append(typing);
          await wait(850);
          typing.remove();
        } else {
          await wait(650);
        }
        if (id !== run) return;
      }
      const el = line(s, i);
      thread.append(el);
      el.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      if (m.rules) light(m.rules);
    }
    if (!calm()) await wait(400);
    if (id !== run) return;
    route.style.opacity = '1';
    route.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
  }

  tabs.forEach((t) => t.addEventListener('click', () => play(t.dataset.lang as DemoLang)));
  root.querySelector('[data-replay]')?.addEventListener('click', () => play(current));
  return { play };
}
