// Plays scripted transcripts line by line and lights the prompt rule behind each agent reply.
// The first conversation is already in the HTML, so nothing is lost without JavaScript.
// `playThread` is shared by the front-desk transcript and the live demos in the work index.

import type { DemoMessage } from '../i18n/demo-scripts';
import { calm } from './state';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const stamp = (i: number) => `02:00:${String(14 + i * 3).padStart(2, '0')}`;

export interface Labels { user: string; agent: string }
interface Thread { lang: string; dir: string; voiceLabel: string; messages: DemoMessage[] }

function line(s: Thread, i: number, labels: Labels, pageLang: string) {
  const m = s.messages[i];
  const li = document.createElement('li');
  li.className = `line ${m.from}`;
  const who = document.createElement('span');
  who.className = 'who mono';
  who.lang = pageLang;
  const add = (txt: string, cls = '') => {
    const span = document.createElement('span');
    span.textContent = txt;
    if (cls) span.className = cls;
    who.append(span);
  };
  add(stamp(i), 'ltr');
  add(m.from === 'user' ? labels.user : labels.agent, 'role');
  if (m.voice) add(s.voiceLabel, 'voice');
  if (m.rules) add(m.rules.map((r) => `R${r + 1}`).join(' '), 'rules-tag ltr');
  const p = document.createElement('p');
  p.textContent = m.text;
  li.append(who, p);
  return li;
}

/** Replays a conversation into `thread`. Returns false if a newer run took over. */
export async function playThread(
  thread: HTMLElement,
  s: Thread,
  labels: Labels,
  pageLang: string,
  isCurrent: () => boolean,
  onRules?: (ids: number[]) => void,
  onLine?: () => void,
): Promise<boolean> {
  thread.setAttribute('dir', s.dir);
  thread.setAttribute('lang', s.lang);
  thread.replaceChildren();
  onRules?.([]);
  for (let i = 0; i < s.messages.length; i++) {
    if (!isCurrent()) return false;
    const m = s.messages[i];
    if (!calm()) {
      if (m.from === 'agent') {
        const typing = document.createElement('li');
        typing.className = 'line agent';
        typing.innerHTML = '<span class="who mono"></span><span class="typing"><i></i><i></i><i></i></span>';
        thread.append(typing);
        onLine?.();
        await wait(850);
        typing.remove();
      } else {
        await wait(650);
      }
      if (!isCurrent()) return false;
    }
    const el = line(s, i, labels, pageLang);
    thread.append(el);
    el.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
    if (m.rules) onRules?.(m.rules);
    onLine?.();
  }
  if (!calm()) await wait(400);
  return isCurrent();
}

export interface ChatPlayer {
  play: (key?: string) => void;
}

export function setupChat(root: HTMLElement, rulesRoot?: ParentNode | null): ChatPlayer {
  const scripts = JSON.parse(root.querySelector('[data-scripts]')?.textContent ?? '{}') as Record<string, Thread & { route: string }>;
  const labels = JSON.parse(root.dataset.labels ?? '{}') as Labels;
  const pageLang = root.dataset.pageLang ?? document.documentElement.lang;
  const thread = root.querySelector<HTMLElement>('[data-thread]')!;
  const route = root.querySelector<HTMLElement>('[data-route]')!;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-key]'));
  const rules = Array.from((rulesRoot ?? document).querySelectorAll<HTMLElement>('[data-rule]'));
  let current = root.dataset.initial ?? Object.keys(scripts)[0];
  let run = 0;

  const light = (ids: number[] = []) => rules.forEach((r, i) => r.classList.toggle('is-on', ids.includes(i)));

  async function play(key: string = current) {
    const id = ++run;
    // Lock the height the full conversation needs, so replaying it never pushes the page around.
    thread.style.minHeight = `${Math.max(thread.offsetHeight, parseFloat(thread.style.minHeight) || 0)}px`;
    const s = scripts[key];
    current = key;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.key === key)));
    route.style.opacity = '0';
    route.setAttribute('dir', s.dir);
    route.setAttribute('lang', s.lang);
    route.lastElementChild!.textContent = s.route;
    const done = await playThread(thread, s, labels, pageLang, () => id === run, light);
    if (!done) return;
    route.style.opacity = '1';
    route.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400 });
  }

  tabs.forEach((t) => t.addEventListener('click', () => play(t.dataset.key)));
  root.querySelector('[data-replay]')?.addEventListener('click', () => play(current));
  return { play };
}
