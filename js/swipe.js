// Touch navigation: a vertical swipe moves the deck.

// Vertical only, deliberately. The strip travels vertically, so that is the
// direction the gesture should mean; a horizontal drag here is far more likely
// a mis-grab than an intent to navigate, and is ignored rather than guessed at.
//
// Unlike the wheel this needs no lock and no throttle. A swipe produces exactly
// one touchend, so one gesture is already one move -- the whole problem
// js/wheel.js exists to solve does not arise here.
//
// Nothing is prevented during the drag either, which is what keeps the listeners
// passive: a slide whose content overflows scrolls natively under the finger,
// and all this has to do afterwards is notice that it did.

// Travel before a drag counts as a swipe. Below this it is a tap, or the hand
// shifting on the glass.
var SWIPE_MIN = 50;

var swipeStartX = 0;
var swipeStartY = 0;
var swipeStartScroll = 0;
var swipeTracking = false;

function swipeNavigation() {
  document.addEventListener('touchstart', function (event) {
    // One finger only: a second means a pinch or a two-finger scroll, neither
    // of which is a request to change slide.
    swipeTracking = event.touches.length === 1;
    if (!swipeTracking) {
      return;
    }

    swipeStartX = event.touches[0].clientX;
    swipeStartY = event.touches[0].clientY;
    swipeStartScroll = slides[currentSlide - 1].scrollTop;
  }, { passive: true });

  document.addEventListener('touchend', function (event) {
    if (!swipeTracking) {
      return;
    }
    swipeTracking = false;

    var touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    // If the slide scrolled under the finger, the gesture belonged to its
    // content, not to the deck. This is the touch equivalent of the wheel's
    // overflow guard, and simpler: the browser has already done the scrolling,
    // so there is nothing to predict -- only to observe. With the wheel's
    // threshold (WHEEL_SCROLLABLE, js/wheel.js): a slide a few pixels too tall
    // for a phone has nothing worth scrolling to, and would swallow the swipe.
    var slide = slides[currentSlide - 1];
    if (slide.scrollTop !== swipeStartScroll &&
        slide.scrollHeight - slide.clientHeight > WHEEL_SCROLLABLE) {
      return;
    }

    var dy = swipeStartY - touch.clientY;
    var dx = Math.abs(touch.clientX - swipeStartX);
    if (Math.abs(dy) < SWIPE_MIN || dx > Math.abs(dy)) {
      return;
    }

    // Swiping up carries the deck forward, the way the strip itself travels and
    // the way scrolling down does. Through advance, so a swipe consumes a
    // reveal step before it moves the strip -- the same as every other
    // relative-move affordance in the deck.
    advance(dy > 0 ? 1 : -1);
  }, { passive: true });
}
