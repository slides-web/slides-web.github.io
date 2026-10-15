// The light/dark toggle in the header.
//
// The theme is already on the page before this file runs: js/theme-boot.js,
// loaded in index.html's <head>, set data-theme before the first paint, from
// the viewer's saved choice or else the system setting. THEME_KEY and
// storedTheme() are declared there, so the storage key is written once.
// Everything the theme changes is a token in css/tokens.css; nothing here
// touches a color.

// One place sets the attribute and keeps the button's state in step with it.
// The name stays "Dark theme" and aria-pressed carries the state, which is
// how a toggle button is announced; the tooltip names the action instead.
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) {
    var dark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  }
}

function initThemeToggle() {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      var swap = function () {
        applyTheme(next);
      };
      // With the optional sweep (js/theme-transition.js) the new theme grows in
      // from this button; without that file the switch is instant.
      if (typeof themeTransition === 'function') {
        themeTransition(swap);
      } else {
        swap();
      }
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        // Not remembered, but still switched for this visit.
      }
    });
  }

  // Until the viewer chooses, the deck follows the system -- including a
  // change made while it is open, such as a laptop turning dark at sunset.
  if (window.matchMedia) {
    var query = window.matchMedia('(prefers-color-scheme: dark)');
    var follow = function (event) {
      if (!storedTheme()) {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };
    if (query.addEventListener) {
      query.addEventListener('change', follow);
    } else if (query.addListener) {
      query.addListener(follow);                      // Safari before 14
    }
  }
}
