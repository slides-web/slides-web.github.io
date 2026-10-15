// Citations: numbers every [data-cite] marker in document order, then builds
// the reference pages.
//
// This file only declares. Bib.build() is called by the host page, and in a
// deck it must be called before anything that scans the slides -- the section
// list, the rail, the contents list, the slide counter -- because the reference
// slides have to exist by then.
//
// Numbers are never stored. They are derived from the order the markers appear
// in the DOM, on every load, which is what makes them behave like LaTeX: insert
// a citation in the middle and everything after it renumbers itself. Re-citing
// a key reuses its number. Reordering pages reorders the bibliography. None of
// it needs the generator re-run -- that is only for a key the generated file
// has never seen, or an edit to the .bib.
//
// Nothing here assumes anything about the host project. Every selector is
// prefixed bib-, the reference pages are copies of the placeholder element the
// host wrote, and everything lives on one global, window.Bib, so dropping this
// folder into another project cannot shadow anything in it.

window.Bib = window.Bib || {};

window.Bib.config = {
  // References per slide. The only number worth tuning: raise it until a slide
  // overflows (the console says when it does), then come back down one.
  perSlide: 8,

  // The same, on a screen matching `narrow` -- a phone, where eight entries
  // run past the bottom of the slide. The width is the breakpoint the host
  // deck already uses for its narrow layout; the height catches a phone held
  // sideways, which is too wide for that breakpoint and far too short for
  // eight. Leave either setting unset and perSlide applies everywhere.
  //
  // Chosen when the page loads, since every reference page has to exist
  // before the host scans its slides. When the window crosses the query
  // later -- the phone turns, or a desktop window is switched to a phone's
  // size -- Bib.watch re-flows the pages and tells the host to scan again.
  perSlideNarrow: 5,
  narrow: '(max-width: 44rem), (max-height: 30rem)',

  heading: 'References',
  headingContinued: 'References (cont.)',

  placeholder: '[data-bib-placeholder]',
  marker: '[data-cite]',

  // How long the pointer must rest on a marker before the reference appears.
  popoverDelay: 120
};


// --- Numbering ---------------------------------------------------------------

// The keys of one marker, in order. Accepts "a b" and "a, b".
window.Bib._keysOf = function (marker) {
  var raw = marker.getAttribute('data-cite');
  if (!raw) {
    return [];
  }

  var keys = raw.trim().split(/[\s,]+/);
  var out = [];
  for (var i = 0; i < keys.length; i++) {
    if (keys[i]) {
      out.push(keys[i]);
    }
  }
  return out;
};

// Walks the markers in document order and hands out numbers. A key with no
// entry gets no number and no place in the bibliography -- LaTeX's [?].
window.Bib._assignNumbers = function (markers) {
  var entries = window.Bib.entries || {};
  var numbers = Object.create(null);   // key -> number
  var ordered = [];                    // keys, in the order they were numbered
  var missing = [];

  for (var i = 0; i < markers.length; i++) {
    var keys = window.Bib._keysOf(markers[i]);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (numbers[key]) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(entries, key)) {
        if (missing.indexOf(key) === -1) {
          missing.push(key);
        }
        continue;
      }
      ordered.push(key);
      numbers[key] = ordered.length;
    }
  }

  return { numbers: numbers, ordered: ordered, missing: missing };
};

// Writes [1] or [1], [2] into each marker.
window.Bib._renderMarkers = function (markers, numbers) {
  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i];
    var keys = window.Bib._keysOf(marker);
    var labels = [];
    var incomplete = false;

    for (var k = 0; k < keys.length; k++) {
      if (numbers[keys[k]]) {
        labels.push('[' + numbers[keys[k]] + ']');
      } else {
        labels.push('[?]');
        incomplete = true;
      }
    }

    marker.textContent = labels.join(', ');
    marker.classList.add('bib-cite');
    if (incomplete) {
      marker.classList.add('bib-missing');
    }
  }
};


// --- Reference slides --------------------------------------------------------

// How many references go on each page at this window size, and which setting
// said so -- the overflow warning names the one to lower.
window.Bib._perSlide = function () {
  var config = window.Bib.config;
  var narrow = config.narrow &&
    typeof config.perSlideNarrow === 'number' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(config.narrow).matches;

  return narrow ?
    { count: config.perSlideNarrow, setting: 'perSlideNarrow' } :
    { count: config.perSlide, setting: 'perSlide' };
};

window.Bib._fillSlide = function (container, keys, numbers, isFirst) {
  var config = window.Bib.config;
  var entries = window.Bib.entries || {};

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // The one piece of markup the package decides on its own. In a deck whose
  // slides are titled by their heading, this is what names the reference
  // slides.
  var title = document.createElement('h2');
  title.textContent = isFirst ? config.heading : config.headingContinued;
  container.appendChild(title);

  var list = document.createElement('ol');
  list.className = 'bib-list';

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    var item = document.createElement('li');
    item.className = 'bib-item';

    var number = document.createElement('span');
    number.className = 'bib-num';
    number.textContent = '[' + numbers[key] + ']';

    var text = document.createElement('span');
    text.className = 'bib-text';
    text.innerHTML = entries[key].html;

    item.appendChild(number);
    item.appendChild(text);
    list.appendChild(item);
  }

  container.appendChild(list);
  return container;
};

// Fills the placeholder with the first page and adds a sibling for each
// further page. Extra pages are empty copies of the placeholder -- same tag,
// same classes, same attributes -- so the package never has to know what makes
// an element a slide in the host project. Write the placeholder the way the
// rest of the deck is written and the generated pages match it.
//
// The template is taken now, before the host has marked the placeholder up
// as a slide of its own, and kept with the list, so the pages can be laid out
// again later (Bib.watch).
window.Bib._buildSlides = function (ordered, numbers, placeholder) {
  var template = placeholder.cloneNode(false);   // attributes only
  template.removeAttribute('data-bib-placeholder');
  template.removeAttribute('id');                // an id must not be duplicated

  // The placeholder is about to become a real reference page, so it stops
  // advertising itself as an empty one.
  placeholder.removeAttribute('data-bib-placeholder');

  window.Bib._layout = {
    ordered: ordered,
    numbers: numbers,
    first: placeholder,
    template: template
  };
  return window.Bib._paginate();
};

// Splits the list over pages at the count in force now. The first page is
// always the placeholder itself; each further one is a fresh copy of the
// template, inserted after the page before. Pages left from an earlier
// layout are removed first, so the same call also re-flows the list.
window.Bib._paginate = function () {
  var layout = window.Bib._layout;
  var old = window.Bib._pages || [];
  for (var i = 1; i < old.length; i++) {
    if (old[i].parentNode) {
      old[i].parentNode.removeChild(old[i]);
    }
  }

  // Kept, so the overflow check reports the count the pages were built with
  // even if the window has changed since.
  window.Bib._inForce = window.Bib._perSlide();
  var perSlide = window.Bib._inForce.count;
  var parent = layout.first.parentNode;
  var anchor = layout.first;
  var built = [];

  for (var start = 0, page = 0; start < layout.ordered.length; start += perSlide, page += 1) {
    var container = layout.first;
    if (page > 0) {
      container = layout.template.cloneNode(false);
      parent.insertBefore(container, anchor.nextSibling);
    }

    window.Bib._fillSlide(
      container, layout.ordered.slice(start, start + perSlide), layout.numbers, page === 0
    );

    built.push(container);
    anchor = container;
  }

  window.Bib._pages = built;
  return built;
};

// Re-flows the reference pages whenever the window crosses `narrow` and the
// count per page changes, then calls onChange so the host can scan its slides
// again: pages have come or gone, so anything built from the first scan -- a
// deck's sections, rail, contents and counter -- is out of date. Call it once,
// after Bib.build(). Does nothing without the narrow settings.
window.Bib.watch = function (onChange) {
  var config = window.Bib.config;
  if (!window.Bib._layout || !config.narrow ||
      typeof config.perSlideNarrow !== 'number' ||
      typeof window.matchMedia !== 'function') {
    return;
  }

  function changed() {
    if (window.Bib._perSlide().count === window.Bib._inForce.count) {
      return;
    }
    window.Bib._hidePopover();
    window.Bib._checkOverflow(window.Bib._paginate());
    if (typeof onChange === 'function') {
      onChange();
    }
  }

  var query = window.matchMedia(config.narrow);
  if (query.addEventListener) {
    query.addEventListener('change', changed);
  } else if (query.addListener) {
    query.addListener(changed);                  // older Safari
  }
};


// --- Hover popover -----------------------------------------------------------
//
// One shared panel, moved to whichever marker the pointer is on. It uses the
// native popover API so the panel sits in the top layer and is not clipped by
// .page's overflow: hidden. Hover only, by design: the markers are plain text
// with no color, no cursor change and no tab stop, so keyboard and touch never
// reach it -- the full list is on the reference slides, which is where anyone
// not holding a mouse will read it.

window.Bib._popover = null;
window.Bib._popoverTimer = null;

window.Bib._popoverSupported = function () {
  if (typeof HTMLElement === 'undefined') {
    return false;
  }
  // The reflected attribute is the documented way to detect the API; the two
  // methods are what actually gets called, so check those too.
  return Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover') &&
    typeof HTMLElement.prototype.showPopover === 'function' &&
    typeof HTMLElement.prototype.hidePopover === 'function';
};

window.Bib._ensurePopover = function () {
  if (window.Bib._popover) {
    return window.Bib._popover;
  }

  var panel = document.createElement('div');
  panel.className = 'bib-popover';
  panel.setAttribute('popover', 'manual');
  document.body.appendChild(panel);
  window.Bib._popover = panel;
  return panel;
};

window.Bib._hidePopover = function () {
  if (window.Bib._popoverTimer) {
    window.clearTimeout(window.Bib._popoverTimer);
    window.Bib._popoverTimer = null;
  }

  var panel = window.Bib._popover;
  if (!panel) {
    return;
  }

  try {
    panel.hidePopover();
  } catch (error) {
    // Already hidden. Nothing to do.
  }
};

window.Bib._placePopover = function (panel, marker) {
  var gap = 8;
  var edge = 12;
  var anchor = marker.getBoundingClientRect();
  var panelBox = panel.getBoundingClientRect();

  var left = anchor.left + (anchor.width / 2) - (panelBox.width / 2);
  var rightLimit = window.innerWidth - panelBox.width - edge;
  if (left > rightLimit) {
    left = rightLimit;
  }
  if (left < edge) {
    left = edge;
  }

  // Above the citation, unless there is no room up there.
  var top = anchor.top - panelBox.height - gap;
  if (top < edge) {
    top = anchor.bottom + gap;
  }

  panel.style.left = Math.round(left) + 'px';
  panel.style.top = Math.round(top) + 'px';
};

window.Bib._showPopover = function (marker, numbers) {
  var entries = window.Bib.entries || {};
  var keys = window.Bib._keysOf(marker);
  var panel = window.Bib._ensurePopover();

  while (panel.firstChild) {
    panel.removeChild(panel.firstChild);
  }

  var shown = 0;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!numbers[key]) {
      continue;
    }

    var line = document.createElement('p');
    line.className = 'bib-popover-item';

    var number = document.createElement('span');
    number.className = 'bib-num';
    number.textContent = '[' + numbers[key] + ']';

    var text = document.createElement('span');
    text.className = 'bib-text';
    text.innerHTML = entries[key].html;

    line.appendChild(number);
    line.appendChild(document.createTextNode(' '));
    line.appendChild(text);
    panel.appendChild(line);
    shown += 1;
  }

  if (!shown) {
    return;
  }

  // Measured before it is seen, so it never appears in the wrong place first.
  panel.style.visibility = 'hidden';
  panel.style.left = '0px';
  panel.style.top = '0px';
  try {
    panel.showPopover();
  } catch (error) {
    panel.style.visibility = '';
    return;
  }
  window.Bib._placePopover(panel, marker);
  panel.style.visibility = '';
};

window.Bib._wirePopover = function (markers, numbers) {
  if (!window.Bib._popoverSupported()) {
    return;
  }

  var delay = window.Bib.config.popoverDelay;

  function enter(event) {
    var marker = event.currentTarget;
    window.Bib._hidePopover();
    window.Bib._popoverTimer = window.setTimeout(function () {
      window.Bib._showPopover(marker, numbers);
    }, delay);
  }

  for (var i = 0; i < markers.length; i++) {
    markers[i].addEventListener('mouseenter', enter);
    markers[i].addEventListener('mouseleave', window.Bib._hidePopover);
  }

  // The panel is fixed to the viewport, so anything that moves the deck under
  // it has to take it down -- otherwise it is left floating over a slide the
  // citation is no longer on.
  document.addEventListener('keydown', window.Bib._hidePopover);
  window.addEventListener('wheel', window.Bib._hidePopover, { passive: true });
  window.addEventListener('resize', window.Bib._hidePopover);
  document.addEventListener('scroll', window.Bib._hidePopover, true);
};


// --- Overflow check ----------------------------------------------------------

// Reports a reference slide whose list runs past the bottom of the stage. The
// slide stays readable either way -- justify-content: safe center top-aligns it
// and the wheel scrolls it -- but a full slide is a thing to find out about at
// your desk, not mid-talk. Deferred until the webfonts have settled, since
// until then every line is the wrong height.
window.Bib._checkOverflow = function (slides) {
  function measure() {
    var inForce = window.Bib._inForce || window.Bib._perSlide();
    for (var i = 0; i < slides.length; i++) {
      var slide = slides[i];
      if (slide.scrollHeight - slide.clientHeight > 2) {
        window.console.warn(
          'Bib: reference slide ' + (i + 1) + ' of ' + slides.length +
          ' overflows by about ' + (slide.scrollHeight - slide.clientHeight) +
          'px at this window size. Lower Bib.config.' + inForce.setting +
          ' (now ' + inForce.count + ') in citation-setup/citations.js.'
        );
      }
    }
  }

  function schedule() {
    // A check that exists to report a problem must not be able to cause one.
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(measure);
    } else {
      window.setTimeout(measure, 0);
    }
  }

  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(schedule);
  } else {
    window.addEventListener('load', schedule);
  }
};


// --- Build -------------------------------------------------------------------

window.Bib.build = function () {
  if (window.Bib._built) {
    return;
  }
  window.Bib._built = true;

  var config = window.Bib.config;
  var placeholder = document.querySelector(config.placeholder);
  var markers = document.querySelectorAll(config.marker);

  // No citations: take the placeholder out rather than leave an empty
  // References slide, a dash on the rail and a line in the contents.
  if (!markers.length) {
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.removeChild(placeholder);
    }
    return;
  }

  if (!window.Bib.entries) {
    window.console.error(
      'Bib: refs.generated.js is missing or was not loaded before ' +
      'citations.js. Run: python citation-setup/build_refs.py'
    );
  }

  var assigned = window.Bib._assignNumbers(markers);

  window.Bib._renderMarkers(markers, assigned.numbers);
  window.Bib._wirePopover(markers, assigned.numbers);

  if (assigned.missing.length) {
    window.console.error(
      'Bib: no entry for ' + assigned.missing.join(', ') +
      '. Shown as [?] and left out of the reference list. Check the spelling ' +
      'against the .bib, then run: python citation-setup/build_refs.py'
    );
  }

  if (!placeholder) {
    window.console.error(
      'Bib: no ' + config.placeholder + ' in the page, so the reference ' +
      'list was not built. Add an empty element carrying ' +
      'data-bib-placeholder where the references belong.'
    );
    return;
  }

  if (!assigned.ordered.length) {
    placeholder.parentNode.removeChild(placeholder);
    return;
  }

  window.Bib._checkOverflow(
    window.Bib._buildSlides(assigned.ordered, assigned.numbers, placeholder)
  );
};
