// Beamer-style overlays: content that waits for its own key press.

// Beamer's \item<+-> in markup: an element carrying data-reveal waits for its
// own key press instead of arriving with the slide. A step is a second
// coordinate *inside* a slide -- it never moves the strip, and neither the
// counter nor the rail reacts to it, the same way \insertframenumber counts
// frames rather than overlay pages. See CLAUDE.md.
//
// data-reveal has three readings:
//   data-reveal="each"   every direct child of this element is its own step
//   data-reveal          this element is one step, numbered in document order
//   data-reveal="2"      this element joins step 2, so several can share one
//
// The resolved number is stamped on as data-reveal-step, which is what the CSS
// and applySteps read. An "each" container never gets one itself, so the list
// box never dims as a whole -- only its items do.
var stepsBySlide = [];                                // steps on slide i + 1
var currentStep = 0;                                  // highest revealed step

// The state a slide is in on arrival: its first step already showing, the rest
// still ghosted. Beamer's \beamerpauses starts at 1 for the same reason -- a
// slide that lands looking empty reads as a mistake. No steps at all sits at 0.
function firstStep(steps) {
  return steps > 0 ? 1 : 0;
}

function buildSteps() {
  slides.forEach(function (slide, index) {
    var count = 0;
    var sharing = {};                                 // elements claimed so far, per step

    function claim(el, number) {
      el.dataset.revealStep = number;
      // Its place among the elements sharing this step, from 0. Only the
      // [data-reveal-motion] and [data-reveal-rise] variants read it, as a
      // stagger (css/reveal.css).
      var order = sharing[number] || 0;
      sharing[number] = order + 1;
      el.style.setProperty('--reveal-order', order);
      count = Math.max(count, number);                // an explicit number may run ahead
    }

    // Document order is reveal order, which is what lets the auto-numbered form
    // read top to bottom the way a run of \pause does.
    slide.querySelectorAll('[data-reveal]').forEach(function (el) {
      var spec = el.dataset.reveal;
      if (spec === 'each') {
        Array.prototype.forEach.call(el.children, function (child) {
          claim(child, count + 1);
        });
      } else if (spec) {
        claim(el, Number(spec));
      } else {
        claim(el, count + 1);
      }
    });

    stepsBySlide[index] = count;
    // Put every slide into its arrival state up front, not just the one on
    // screen: a slide flies past on a long jump, and its steps should be
    // laddered while it does rather than sitting at the CSS fallback.
    applySteps(index + 1, firstStep(count));
  });
}

// Reveals every step up to and including `step` and ghosts the rest. --away is
// how many presses an item is still waiting on; the CSS turns that into the
// opacity ladder, so an item that is nearly due is already part of the way in.
// It is floored at 1 because the ladder divides by it -- a revealed item takes
// its opacity from .is-revealed instead, which outweighs the ladder rule.
//
// The sign of `away` is the whole state machine: positive is still waiting,
// zero is the step that has just arrived, negative is one revealed earlier.
// .is-current marks the zero case and is set unconditionally, on every reveal
// in the deck -- CSS decides whether it means anything, and only does so inside
// a [data-reveal-alert] subtree. That is Beamer's \item<+-| alert@+>, and it is
// why turning the variant on costs no JavaScript at all.
function applySteps(slideNumber, step) {
  slides[slideNumber - 1].querySelectorAll('[data-reveal-step]').forEach(function (el) {
    var away = Number(el.dataset.revealStep) - step;
    el.classList.toggle('is-revealed', away <= 0);
    el.classList.toggle('is-current', away === 0);
    el.style.setProperty('--away', Math.max(away, 1));
  });
}
