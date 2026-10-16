// Mouse-wheel navigation: one move per gesture, paced by what the move was.

// A wheel gesture is not one event. A mouse wheel click sends a single large
// delta, but a trackpad swipe sends dozens of small ones and then keeps sending
// momentum for a second after your fingers have left. Left alone that would fly
// through the whole deck -- and it would do it by retargeting the strip
// mid-flight over and over, the stutter advance() (js/navigate.js) guards key
// presses against.
//
// So a move holds the wheel until it has landed -- but **how long depends on
// what actually happened.** Changing slide takes --slide-duration and wants the
// full wait. Consuming a reveal step is a short fade, and waiting a whole
// slide's worth for it makes stepping through a list feel stuck, which is the
// one thing the keyboard never feels like.
//
// The lock is a deadline rather than a flag so that a gesture still in progress
// can push it out. That is what stops a trackpad's momentum tail from spilling
// a second move the instant the first lock expires: releasing needs a real
// pause, not just elapsed time.
var wheelFreeUntil = 0;

// Below this the event is trackpad jitter or the tail of a momentum scroll
// rather than an intent to move.
var WHEEL_MIN = 8;

// How far a slide has to overflow before the wheel scrolls it instead of moving
// the deck. More than a line of text: a slide that is a handful of pixels too
// tall has nothing worth scrolling to, and treating it as scrollable makes the
// wheel feel stuck on a slide that to the eye fits perfectly well.
var WHEEL_SCROLLABLE = 40;

// How long the wheel is held after a reveal step. Short on purpose -- a step is
// a fade, not a journey, and the next one may start before it finishes. This
// only has to be long enough that one wheel click is one step.
var WHEEL_STEP_GAP = 120;

// A gesture is over once the wheel has been quiet this long. Every event that
// arrives while the lock holds pushes the deadline out by this much.
var WHEEL_QUIET = 90;

// Normalized to pixels first: Chrome reports pixels, Firefox reports lines, and
// a threshold in pixels compared against +/-3 lines would never fire there.
function wheelDelta(event) {
  if (event.deltaMode === 1) {
    return event.deltaY * 16;                         // lines
  }
  if (event.deltaMode === 2) {
    return event.deltaY * 100;                        // pages
  }
  return event.deltaY;
}

// A motion token in milliseconds, whether it is written in s or in ms. Read
// from the stylesheet rather than repeated here, so tuning the token tunes the
// wheel with it -- and read per move, not once, so that stays true.
function cssDurationMs(name) {
  var raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name).trim();
  return (parseFloat(raw) || 0) * (/ms$/.test(raw) ? 1 : 1000);
}

function wheelNavigation() {
  // passive: false is required, not decoration -- Chrome makes wheel listeners
  // on the window passive by default, and preventDefault is then ignored.
  window.addEventListener('wheel', function (event) {
    // Ctrl + wheel is the browser's zoom, and a trackpad pinch arrives as the
    // same event. Both belong to the viewer, not the deck: left alone they zoom
    // the page as anywhere else; handled here, preventDefault would cancel the
    // zoom and advance would move the deck instead. Returned before the lock
    // is touched, so a zoom never holds up the next real scroll.
    if (event.ctrlKey) {
      return;
    }

    var slide = slides[currentSlide - 1];

    // A slide with real overflow scrolls itself first, and only hands the
    // gesture on once it has run out of room in that direction. Without this a
    // long table on a short window would have rows no input could reach.
    if (slide.scrollHeight - slide.clientHeight > WHEEL_SCROLLABLE) {
      var atTop = slide.scrollTop <= 0;
      var atEnd = slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 1;
      if (event.deltaY > 0 ? !atEnd : !atTop) {
        return;
      }
    }

    event.preventDefault();

    var delta = wheelDelta(event);
    if (Math.abs(delta) < WHEEL_MIN) {
      return;
    }

    var now = performance.now();
    if (now < wheelFreeUntil) {
      wheelFreeUntil = Math.max(wheelFreeUntil, now + WHEEL_QUIET);
      return;
    }

    // Through advance, like the arrow keys and the footer stepper: scrolling
    // consumes a reveal step before it moves the strip, so the wheel walks a
    // built list exactly the way the keyboard does.
    var fromSlide = currentSlide;
    var fromStep = currentStep;
    advance(delta > 0 ? 1 : -1);

    // Paced by what happened rather than by what was asked for, so a move
    // refused at either end of the deck locks nothing at all.
    if (currentSlide !== fromSlide) {
      wheelFreeUntil = now + cssDurationMs('--slide-duration');
    } else if (currentStep !== fromStep) {
      wheelFreeUntil = now + WHEEL_STEP_GAP;
    }
  }, { passive: false });
}
