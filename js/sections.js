// Which slides belong together, and what that group is called.

// Sections are metadata, not structure: consecutive slides carrying the same
// data-section value form one section. Grouping them with wrapper elements
// would make the wrappers the strip's flex children and break its translateY
// math (js/navigate.js).
//
// Each entry is { name, first, last } with 1-based, inclusive slide numbers.
// With no data-section anywhere, every slide lands in one unnamed section, and
// the deck has no rail and no dividers.
var sections = [];

function buildSections() {
  slides.forEach(function (slide, index) {
    var name = slide.dataset.section || '';
    var open = sections[sections.length - 1];
    if (open && open.name === name) {
      open.last = index + 1;
    } else {
      sections.push({ name: name, first: index + 1, last: index + 1 });
    }
  });
}

// A divider slide opens every named section: "Section" over its number, and
// beside them the section's name (css/stage.css). Numbered the way the
// contents list numbers sections -- named ones only, in order -- so the two
// always agree, and generated, so a renamed or re-split section updates its
// divider for free. Set to false for a deck without them; DIVIDER_LABEL is
// the word over the number.
var SECTION_DIVIDERS = true;
var DIVIDER_LABEL = 'Section';

// Runs before findSlides, straight after the citations have built the
// reference pages, so a deck with no citations gets no References divider.
// A divider carries its section's data-section, so it is that section's first
// slide: the contents entry and the rail's dash both land on it.
function buildDividers() {
  if (!SECTION_DIVIDERS) {
    return;
  }

  var number = 0;
  var previous = '';
  strip.querySelectorAll('.slide').forEach(function (slide) {
    var name = slide.dataset.section || '';
    if (name && name !== previous) {
      number++;
      strip.insertBefore(makeDivider(name, number), slide);
    }
    previous = name;
  });
}

function makeDivider(name, number) {
  var slide = document.createElement('section');
  slide.className = 'slide slide-divider';
  slide.dataset.section = name;

  // "Section" over the number, one line apart; the space between them is
  // never drawn, but keeps the label reading "Section 2".
  var word = document.createElement('span');
  word.className = 'divider-word';
  word.textContent = DIVIDER_LABEL;

  var digits = document.createElement('span');
  digits.className = 'divider-number';
  digits.textContent = number;

  var label = document.createElement('p');
  label.className = 'divider-section';
  label.appendChild(word);
  label.appendChild(document.createTextNode(' '));
  label.appendChild(digits);

  var title = document.createElement('h2');
  title.textContent = name;                                // also the dot's name in the rail

  var row = document.createElement('div');
  row.className = 'divider-row';
  row.appendChild(label);
  row.appendChild(title);

  slide.appendChild(row);
  return slide;
}

// The section rule: the line on a section's last slide, shown only while the
// strip carries it across the screen (css/stage.css). A move from `from` to
// `to` crosses the boundaries on slides min..max-1. Going forward, the
// destination's own boundary is still ahead; going back, the origin's is
// behind. A long jump marks every boundary it crosses, so each skipped section
// flashes past as its own line.
//
// The marks accumulate while the strip is in flight and clear together once it
// has landed. The deadline is pushed out on every move, because a move made
// mid-flight retargets the strip over a full --slide-duration again. It is read
// with cssDurationMs (js/wheel.js), so tuning the token retunes this too. A
// reveal step leaves the strip where it is and does nothing here.
var crossingTimer = 0;

function showCrossing(from, to) {
  if (from === to) {
    return;
  }

  var low = Math.min(from, to);
  var high = Math.max(from, to);
  sections.forEach(function (section) {
    if (section.last >= low && section.last < high) {
      slides[section.last - 1].classList.add('is-crossing');
    }
  });

  clearTimeout(crossingTimer);
  crossingTimer = setTimeout(function () {
    strip.querySelectorAll('.slide.is-crossing').forEach(function (slide) {
      slide.classList.remove('is-crossing');
    });
  }, cssDurationMs('--slide-duration'));
}

// Which section holds the given slide. Sections are contiguous and in order,
// so the first one that reaches the slide is the one that contains it.
function sectionIndexOf(slideNumber) {
  for (var i = 0; i < sections.length; i++) {
    if (slideNumber <= sections[i].last) {
      return i;
    }
  }
  return sections.length - 1;
}
