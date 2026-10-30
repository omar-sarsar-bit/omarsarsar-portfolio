# Omar Sarsar · Portfolio

Bilingual (English / العربية) portfolio for Omar Sarsar, AI Automation & Product Builder.

**Concept: The Ascent.** The home page opens at the bottom and scrolling down climbs up. The story follows a single request through the system: received, understood, routed, reported, shown, then the work, the person behind it, and finally everything running on autopilot. "With Omar, you don't go down. You go up." The navigation lives in a dock at the bottom of the screen.

- **Stack:** [Astro](https://astro.build) 7, TypeScript (strict), GSAP (ScrollTrigger, SplitText), Lenis smooth scroll, Three.js (lazy-loaded), plain CSS with design tokens.
- **Type:** Anybody (variable width, animated with the scroll), Schibsted Grotesk, Martian Mono, Readex Pro for Arabic. All self-hosted.
- **Languages:** English at `/`, Arabic (right-to-left) at `/ar/`. Every page has a language twin linked with `hreflang`.
- **No third-party scripts.** Strict Content Security Policy generated at build time, security headers in `vercel.json`.
- **Accessible by design:** the document order stays logical (only the visual order is reversed), keyboard focus moves the view, and visitors who prefer reduced motion get a normal, static page.

### How the ascent works

`src/scripts/ascent.ts` pins the page content to the bottom of the screen with its chapters stacked upwards (`column-reverse`). A spacer gives the document its height, so native scrolling, the scrollbar and the keyboard all keep working, and each frame the content is translated by the scroll position. Lenis smooths the wheel and GSAP's ticker drives the frame. `src/scripts/scene.ts` pins each 3D object to an empty `data-anchor` box in the layout, so it travels with the page and never covers body text.

## Edit the content

| What | Where |
| --- | --- |
| Email, WhatsApp, LinkedIn, IconScout links | `src/config/site.ts` |
| English text | `src/i18n/en.ts` |
| Arabic text | `src/i18n/ar.ts` (must have the same shape as English; the build fails if a field is missing) |
| Demo conversations and the message slips in 3D | `src/i18n/demo-scripts.ts` |
| Colours, type, buttons, grid | `src/styles/global.css` |
| Home chapters | `src/components/HomePage.astro` |
| Project index (client work, agency work, concept builds) | `work.projects` in `src/i18n/en.ts` and `ar.ts`; drawings in `src/components/WorkPreview.astro` |
| Case study | `src/components/CaseStudyPage.astro` |
| Social preview images | `public/og/en.png`, `public/og/ar.png` |

Concept builds are labelled as such on the site. When one becomes real client work, change its `kind` and `link` in the project list.

## Run locally

Requires Node.js 22.23 or newer (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open http://localhost:4321.

```bash
npm run build
npm run preview
```

`npm run build` type-checks the project first (`astro check`), then writes the static site to `dist/`.

## Deploy on Vercel

1. Push this repository to GitHub.
2. On [vercel.com](https://vercel.com), sign in with GitHub, choose **Add New → Project**, and import the repository.
3. Keep the detected settings (Framework: Astro, Build command: `npm run build`, Output: `dist`) and press **Deploy**.
4. Name the project `omarsarsar` to get `omarsarsar.vercel.app`.

### Add your own domain later

1. Buy the domain (for example `omarsarsar.com` from Cloudflare Registrar).
2. In Vercel: **Project → Settings → Domains → Add**, then follow the DNS records Vercel shows.
3. Replace `https://omarsarsar.vercel.app` with the new address in `astro.config.mjs` (`SITE_URL`), `src/config/site.ts` (`url`) and `public/robots.txt`, then redeploy.

---

## بالعربي باختصار

- **تعديل النصوص:** الإنجليزي في `src/i18n/en.ts`، والعربي في `src/i18n/ar.ts`.
- **بيانات التواصل:** في `src/config/site.ts`. ضع رابط لينكد إن هناك ليظهر زره تلقائياً.
- **التشغيل محلياً:** `npm install` ثم `npm run dev`.
- **النشر:** ارفع المشروع على GitHub، ثم استورده في Vercel واضغط Deploy.
- **عند شراء دومين:** أضفه في Vercel، وغيّر الرابط في `astro.config.mjs` و`src/config/site.ts` و`public/robots.txt`.
