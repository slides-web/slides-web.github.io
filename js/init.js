// Startup. This is the only deck file that runs anything as it is parsed, which
// is what makes the rest of js/ order-independent -- so it must be loaded last
// of the deck's own scripts, and nothing that executes on its own should be
// added to the others. The setup folders are the one exception: MathJax and
// figure-reference.js run as they load, but neither touches the deck's state,
// and the citations wait for Bib.build() in the boot block below. The MathJax
// library itself loads after this file, so the deck never waits on the network.

// Delegated, so one listener covers every [data-slide] control in a container
// without needing to know which of them currently exist or are expanded. The
// rail and the contents list both use it, so both route through goToSlide
// instead of reimplementing the move.
function delegateSlideClicks(root) {
  if (!root) {
    return;
  }

  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-slide]');
    if (button && root.contains(button)) {
      goToSlide(Number(button.dataset.slide));
    }
  });
}

// Same-page cross-references -- figure-setup's .fig-ref and MathJax's \ref --
// are #fragment links. Followed natively, the browser scrolls .page to reach
// the target, and overflow: hidden stops the user scrolling it, not the
// browser: the header leaves the screen and the strip stops matching
// currentSlide. So they move the deck instead, through goToSlide like every
// other control. A reference to the slide already on screen does nothing
// rather than rewind that slide's reveal steps.
//
// MathJax 4 moves a \ref's href into data-mjx-href once its accessibility pass
// has run, which leaves an <a> the browser no longer treats as a link -- so
// both attributes are read, or equation references stop working a moment after
// load while figure references carry on. MathJax then follows that attribute
// with a click handler of its own, which writes the #fragment into the URL; the
// listener captures, so it runs first and the event goes no further.
function delegateFragmentLinks(root) {
  if (!root) {
    return;
  }

  root.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"], a[data-mjx-href^="#"]');
    if (!link || !root.contains(link)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    var href = link.getAttribute('href') || link.getAttribute('data-mjx-href');
    var target = document.getElementById(decodeURIComponent(href.slice(1)));
    var slideNumber = Array.prototype.indexOf.call(slides, target && target.closest('.slide')) + 1;
    if (slideNumber < 1 || slideNumber === currentSlide) {
      return;
    }

    // A target that waits for its own step is landed on at that step, so it
    // is showing when the slide arrives rather than still ghosted.
    var host = target.closest('[data-reveal-step]');
    goToSlide(slideNumber, host ? Number(host.dataset.revealStep) : undefined);
  }, true);
}

// The reference list re-flows when the window crosses the narrow breakpoint
// -- a phone turned sideways, or a desktop window switched to a phone's size --
// because a different number of references fits on a page (citation-setup).
// Pages come and go, so everything built from the boot-time scan is built
// again, and the slide on screen is put back. This is the one time the rail
// and the contents are rebuilt; the move is a jump in place, with the strip's
// transition held off, so nothing animates and no section rule crosses.
function rescanDeck() {
  // The slide on screen, or, if it was a reference page that has gone, the
  // nearest page before it that is still there.
  var n = currentSlide;
  while (n > 1 && !slides[n - 1].isConnected) {
    n--;
  }
  var keep = slides[n - 1];
  var step = n === currentSlide ? currentStep : 0;

  findSlides();
  sections.length = 0;
  buildSections();
  buildSteps();

  var target = Array.prototype.indexOf.call(slides, keep) + 1;
  currentSlide = target;
  currentSection = sectionIndexOf(target);
  buildRail(currentSection);
  buildToc();

  strip.style.transition = 'none';
  goToSlide(target, step);
  strip.getBoundingClientRect();                      // commit the jump first
  strip.style.transition = '';
}


// --- Boot ---

// The order here is the only order that matters in the whole deck: citations
// first, because they add and remove reference slides, then the section
// dividers, then findSlides so every scan after it sees the finished deck;
// sections before anything that reads them, steps before the first goToSlide,
// the label layers before the first section name is shown, and goToSlide last
// because it is what puts the opening slide on screen.
Bib.build();                 // for citation-setup
buildDividers();
findSlides();
buildSections();
buildSteps();
buildLabel();
buildRail(sectionIndexOf(currentSlide));
buildToc();
initThemeToggle();           // the theme itself was set by js/theme-boot.js; this wires the button


// --- Event wiring ---

delegateSlideClicks(rail);
delegateSlideClicks(toc);
delegateFragmentLinks(strip);
Bib.watch(rescanDeck);       // for citation-setup: re-flow the references on a breakpoint change

// .page must never scroll. The link handler above covers clicks, but the
// browser still scrolls it for a #fragment already in the URL at load, or for a
// find-in-page match on another slide -- either would push the header off-screen
// and leave the strip out of step with currentSlide, so it goes straight back.
if (page) {
  page.addEventListener('scroll', function () {
    page.scrollTop = 0;
    page.scrollLeft = 0;
  });
}

// The stepper carries a direction rather than a slide number, so it cannot use
// the delegation above -- it is a relative move, and so goes through advance.
if (stepper) {
  stepper.addEventListener('click', function (event) {
    var button = event.target.closest('[data-step]');
    if (button) {
      advance(Number(button.dataset.step));
    }
  });
}

// The wheel is a third relative-move affordance alongside the keys and the
// stepper, and it needs a listener of its own because one gesture is many
// events -- js/wheel.js is that, and it routes through advance like the rest.
wheelNavigation();

// A vertical swipe is the touch equivalent. It needs no throttle of its own --
// one gesture is already one touchend -- so js/swipe.js is much the simpler of
// the two, but it routes through advance just the same.
swipeNavigation();

// Arrow keys advance one reveal step at a time, then one slide; goToSlide stops
// at the first and last. Page Down and Page Up are what a presenter's remote
// sends.
document.addEventListener('keydown', function (event) {
  var isNext = event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown';
  var isPrev = event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp';
  if (!isNext && !isPrev) {
    return;
  }

  event.preventDefault();
  advance(isNext ? 1 : -1);
});


goToSlide(currentSlide);
