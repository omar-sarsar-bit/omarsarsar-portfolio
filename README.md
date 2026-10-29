# Omar Sarsar · Portfolio

Bilingual (English / العربية) portfolio for Omar Sarsar, AI Automation & Product Builder.

- **Stack:** [Astro](https://astro.build) 7, TypeScript (strict), plain CSS with design tokens, self-hosted variable fonts.
- **Languages:** English at `/`, Arabic (right-to-left) at `/ar/`. Every page has a language twin linked with `hreflang`.
- **No third-party scripts.** Strict Content Security Policy generated at build time, security headers in `vercel.json`.
- **Motion:** scroll reveals, split-word headings, scroll-linked process line, interactive dot canvas, pointer tilt and spotlight, magnetic buttons, a live workflow simulation and a scripted agent demo. All of it switches off for visitors who prefer reduced motion.

## Edit the content

| What | Where |
| --- | --- |
| Email, WhatsApp, LinkedIn, IconScout links | `src/config/site.ts` |
| English text | `src/i18n/en.ts` |
| Arabic text | `src/i18n/ar.ts` (must have the same shape as English; the build fails if a field is missing) |
| Demo conversations and hero messages | `src/i18n/demo-scripts.ts` |
| Colors, type scale, spacing | `src/styles/global.css` |
| Social preview images | `public/og/en.png`, `public/og/ar.png` |

The LinkedIn button appears automatically once `linkedin` in `src/config/site.ts` has your profile URL.

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
