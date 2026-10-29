// Runs in <head> before first paint: marks JS as available and applies the saved or system theme.
// Kept as a string so astro.config.mjs can hash it for the Content Security Policy.
export const THEME_INIT =
  "(function(){var r=document.documentElement;r.classList.add('js');var t;try{t=localStorage.getItem('theme')}catch(e){}" +
  "if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}" +
  "r.setAttribute('data-theme',t)})();";
