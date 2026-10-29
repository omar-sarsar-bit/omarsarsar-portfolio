import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { createHash } from 'node:crypto';
import { THEME_INIT } from './src/scripts/theme-init.mjs';

const themeHash = `sha256-${createHash('sha256').update(THEME_INIT).digest('base64')}`;

export const SITE_URL = 'https://omarsarsar.vercel.app';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  markdown: { syntaxHighlight: false },
  // Inline the CSS so the first paint does not wait on a stylesheet request.
  build: { inlineStylesheets: 'always' },
  // Keep every asset as a file so fonts load under the strict font-src 'self' policy.
  vite: { build: { assetsInlineLimit: 0 } },
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      i18n: { defaultLocale: 'en', locales: { en: 'en', ar: 'ar' } },
    }),
  ],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      scriptDirective: { hashes: [themeHash] },
      // Components position elements with inline style attributes, which hashes cannot cover.
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
    },
  },
});
