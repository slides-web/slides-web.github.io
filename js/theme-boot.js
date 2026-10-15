// The theme, set before the first paint so a dark page never flashes light:
// the viewer's saved choice, else the system setting. With no JavaScript the
// attribute is never set and the page stays light.
//
// Loaded from index.html's <head>, ahead of the stylesheet, not with the rest
// of js/ at the end of <body>. It is the one file here besides init.js that
// runs as it is parsed, because it cannot wait for init.js, which runs at the
// end of <body>, after the page may already have been painted. js/theme.js
// wires the header toggle, and uses THEME_KEY and storedTheme() from here, so
// the storage key is written once.

var THEME_KEY = 'deck-theme';

// The viewer's own choice, or null while they have not made one. Storage can
// be blocked outright (some private windows), and the deck then simply keeps
// following the system.
function storedTheme() {
  try {
    var theme = localStorage.getItem(THEME_KEY);
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch (error) {
    return null;
  }
}

document.documentElement.setAttribute('data-theme', storedTheme() ||
  (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
