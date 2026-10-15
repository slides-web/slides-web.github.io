// The three read-outs that say where you are: active dot, stepper, counter.
// All are called by goToSlide and none of them decide anything.

// Highlights the dot for the given slide and clears the others.
function updateDots(slideNumber) {
  rail.querySelectorAll('.dot').forEach(function (dot) {
    var isActive = Number(dot.dataset.slide) === slideNumber;
    dot.classList.toggle('active', isActive);
    if (isActive) {
      dot.setAttribute('aria-current', 'true');
    } else {
      dot.removeAttribute('aria-current');
    }
  });
}

// Grays out whichever end of the stepper has nowhere to go. A step still
// waiting on this slide counts as somewhere to go, so the next arrow stays live
// on the last slide while items remain, and the previous arrow stays live on
// the first slide once a step has been consumed. goToSlide already ignores
// out-of-range targets, so this is affordance, not enforcement.
function updateStepper(slideNumber, step) {
  var steps = stepsBySlide[slideNumber - 1];

  stepButtons.forEach(function (button) {
    var direction = Number(button.dataset.step);
    var hasStep = direction > 0 ? step < steps : step > firstStep(steps);
    var target = slideNumber + direction;
    button.disabled = !hasStep && (target < 1 || target > totalSlides);
  });
}

// Writes the footer counter as zero-padded "NN/NN". Deliberately global across
// the whole deck, not per-section: the rail already says where you are inside
// the section, so the counter answers the question the rail cannot. Hidden on
// the title slide, which opens the talk with nothing but its title.
function updateCounter(slideNumber) {
  var current = String(slideNumber).padStart(2, '0');
  var total = String(totalSlides).padStart(2, '0');
  counter.textContent = current + '/' + total;
  counter.classList.toggle('is-hidden', slideNumber === 1);
}
