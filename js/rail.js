// The dot rail down the right edge: dots for this section, dashes for the rest.

// Built once, then never rebuilt. Every *named* section contributes both of its
// representations up front -- a dash and a run of dots -- and changing section
// only toggles a class. That is what makes the rail animate: a node created at
// the moment of the change would have no previous state to transition from.
//
// Indexed by section, not packed: an unnamed section holds a null rather than
// being skipped, so railGroups[i] always describes sections[i].
var railGroups = [];                                  // [{ group, tick, dots } | null]

// What a dot stands for. The slide's own heading is the only thing that
// identifies it -- the rail has no room for text, and the footer counter gives
// a number but not a subject. Falls back to the number for an untitled slide.
function slideTitle(slideNumber) {
  var heading = slides[slideNumber - 1].querySelector('h1, h2');
  return heading ? heading.textContent.trim() : 'Slide ' + slideNumber;
}

function buildRail(initialSection) {
  rail.textContent = '';
  railGroups.length = 0;

  sections.forEach(function (section, index) {
    // The rail speaks for named sections only. The opening title/contents pair
    // carries no data-section, so it gets neither a dash nor dots -- and
    // applySection takes the whole rail away while one of them is on screen.
    if (!section.name) {
      railGroups[index] = null;
      return;
    }

    var group = document.createElement('div');
    group.className = 'rail-group';

    var tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'section-tick';
    tick.dataset.slide = section.first;               // a dash jumps to its section's first slide
    // The dash shows no text, so the section name lives here instead: a hover
    // tooltip for pointer users, an accessible name for everyone else. Unnamed
    // sections never reach this point, so there is no empty name to guard.
    tick.title = section.name;
    tick.setAttribute('aria-label', 'Go to section: ' + section.name);
    group.appendChild(tick);

    var dots = document.createElement('div');
    dots.className = 'rail-dots';
    var inner = document.createElement('div');
    inner.className = 'rail-dots-inner';

    for (var n = section.first; n <= section.last; n++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'dot';
      dot.dataset.slide = n;
      // Same pairing the dash uses one level up: a hover tooltip for pointer
      // users, an accessible name for everyone else. The dash names its
      // section, the dot names its slide.
      var title = slideTitle(n);
      dot.title = title;
      dot.setAttribute('aria-label', 'Go to slide ' + n + ': ' + title);
      inner.appendChild(dot);
    }

    dots.appendChild(inner);
    group.appendChild(dots);
    rail.appendChild(group);
    railGroups[index] = { group: group, tick: tick, dots: dots };
  });

  // Apply the opening state as the nodes are created rather than animating into
  // it, so the rail does not visibly unfold on page load.
  applySection(initialSection);
}

// Expands one section's dots and collapses every other section to its dash --
// and hides the rail outright on an unnamed section, which has no dash and no
// dots of its own and so would leave the rail standing there saying nothing.
// inert as well as faded: an element at opacity 0 is still focusable and still
// in the accessibility tree.
function applySection(sectionIndex) {
  var unnamed = !sections[sectionIndex].name;
  rail.classList.toggle('is-hidden', unnamed);
  rail.inert = unnamed;

  railGroups.forEach(function (entry, index) {
    if (!entry) {
      return;                                         // an unnamed section has no rail of its own
    }

    var isCurrent = index === sectionIndex;
    entry.group.classList.toggle('is-current', isCurrent);
    // Whichever half is collapsed is inert: a zero-height element is still
    // focusable and still in the accessibility tree otherwise.
    entry.dots.inert = !isCurrent;
    entry.tick.inert = isCurrent;
  });
}
