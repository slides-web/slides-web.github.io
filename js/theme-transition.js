// The theme switch's sweep (css/theme-transition.css): runs `swap` -- the
// change of data-theme -- inside a view transition, so the new theme grows in
// from the toggle. A browser without the View Transitions API swaps at once.
//
// Optional, and it only declares: js/theme.js calls it when it is there.
// Delete this file's script tag and the stylesheet's @import in css/main.css,
// and the theme switches at once again.
function themeTransition(swap) {
  if (!document.startViewTransition) {
    swap();
    return;
  }
  // The circle starts at the toggle's center: measured rather than taken from
  // the click, which a key press reports at 0, 0.
  var box = themeToggle.getBoundingClientRect();
  var root = document.documentElement.style;
  root.setProperty('--theme-sweep-x', box.left + box.width / 2 + 'px');
  root.setProperty('--theme-sweep-y', box.top + box.height / 2 + 'px');
  document.startViewTransition(swap);
}
