// Moving the deck. Everything that changes what is on screen goes through here.

// Slides the strip so the requested slide fills the content area, then syncs
// the UI. Single entry point: dots, section dashes, arrow keys and the initial
// render all route through here rather than reimplementing any of it.
//
// `step` is optional and says how far into the slide's reveal to land; omit it
// and the slide opens the way arriving there should open it.
function goToSlide(slideNumber, step) {
  if (slideNumber < 1 || slideNumber > totalSlides) {
    return;                                           // out of range: no wrap-around
  }

  // Arriving forward opens the slide; arriving backward shows it as you left
  // it, fully revealed. This has to read currentSlide before it is reassigned.
  var steps = stepsBySlide[slideNumber - 1];
  if (step === undefined) {
    step = slideNumber < currentSlide ? steps : firstStep(steps);
  }
  currentStep = Math.min(Math.max(step, 0), steps);

  // The section rule on every boundary this move crosses. It reads
  // currentSlide as the origin, so it too comes before the reassignment.
  showCrossing(currentSlide, slideNumber);

  currentSlide = slideNumber;
  // 100% is the strip's own height, which equals exactly one slide.
  strip.style.transform = 'translateY(-' + (slideNumber - 1) * 100 + '%)';

  // Slides are moved, never hidden, so anything focusable on an off-screen
  // slide -- the contents links -- stays tabbable without this. Same reason the
  // rail marks its collapsed half inert.
  slides.forEach(function (slide, index) {
    slide.inert = index + 1 !== slideNumber;
  });

  var sectionIndex = sectionIndexOf(slideNumber);
  if (sectionIndex !== currentSection) {
    var direction = sectionIndex > currentSection ? 1 : -1;
    currentSection = sectionIndex;
    applySection(sectionIndex);
    showSectionName(sections[sectionIndex].name, direction);
  }

  applySteps(slideNumber, currentStep);
  updateDots(slideNumber);
  updateStepper(slideNumber, currentStep);
  updateCounter(slideNumber);
}

// How close to its target the strip must be, as a fraction of one slide, before
// a relative move may start another. With --slide-ease that is about 70% of
// --slide-duration: the fast part of the travel is held, the long settle is not.
var STRIP_LANDED = 0.05;

// Whether the strip is still visibly traveling. Measured rather than timed:
// getComputedStyle reports a running transition's live value, so this compares
// where the strip is on screen with where goToSlide sent it. No timer, and no
// copy of --slide-duration to keep in step. The height comes from
// getBoundingClientRect because it is fractional; a rounded one would drift
// by a pixel per slide on late slides. With transitions off, as in the
// screenshot recipe, the strip is always landed.
function stripInFlight() {
  var height = strip.getBoundingClientRect().height;
  if (!height) {
    return false;
  }
  var live = new DOMMatrixReadOnly(getComputedStyle(strip).transform).m42;
  return Math.abs(live + (currentSlide - 1) * height) > height * STRIP_LANDED;
}

// Relative moves -- the arrow keys, the footer stepper, the wheel and the swipe
// -- consume a reveal step first, and move the strip only once the slide has no
// step left in that direction. Absolute moves (dots, dashes, contents entries)
// call goToSlide with no step and take its arrival default instead.
//
// A relative move made while the strip is still traveling does nothing. A
// retargeted transition restarts from wherever the strip is, over the whole
// duration and from --slide-ease's near-stationary start, so every press made
// mid-flight used to stall the strip and lurch it on. Absolute moves are not
// held: a click is deliberate, and may redirect a moving strip.
//
// Stepping calls goToSlide for the slide it is already on, which is deliberate
// and free of side effects: the transform is re-assigned the same string so no
// transition restarts, the inert loop is idempotent, and the section guard
// skips the label swap. One entry point stays one entry point.
function advance(direction) {
  if (stripInFlight()) {
    return;
  }

  var steps = stepsBySlide[currentSlide - 1];
  var next = currentStep + direction;

  if (next >= firstStep(steps) && next <= steps) {
    goToSlide(currentSlide, next);
  } else {
    goToSlide(currentSlide + direction);
  }
}
