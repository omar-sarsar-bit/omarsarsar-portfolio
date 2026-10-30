// Runs in <head> before first paint. Marks JS as available, turns on the reversed "ascent" layout
// for pages that ask for it (unless the visitor prefers reduced motion), and skips the preloader
// after the first visit in a session. A failsafe drops the preloader and the reversed layout if the
// page scripts have not started after a few seconds, so the page always stays readable.
// Kept as a string so astro.config.mjs can hash it for the CSP.
export const BOOT =
  "(function(){var r=document.documentElement;r.classList.add('js');" +
  "var calm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;" +
  "if(calm){r.classList.add('calm')}" +
  "else if(r.hasAttribute('data-ascent')){r.classList.add('ascent')}" +
  "try{if(calm||sessionStorage.getItem('os-seen')){r.classList.add('no-preload')}}catch(e){r.classList.add('no-preload')}" +
  "setTimeout(function(){if(!r.classList.contains('app-live')){r.classList.add('no-preload')}" +
  "if(r.classList.contains('ascent')&&!r.classList.contains('ascent-live')){r.classList.remove('ascent')}},6000);" +
  "})();";
