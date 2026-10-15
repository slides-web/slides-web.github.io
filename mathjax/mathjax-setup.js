// =============================================================================
// mathjax-setup.js
//
// WHAT   Configures MathJax and renders equations stored in equations-*.js.
// NEEDS  At least one equations-*.js file, mathjax.css, and the MathJax script.
//        Must load BEFORE the MathJax script (README.md, Install).
// USE    <div data-eq="park"></div>                      numbered
//        <div data-eq="pm" data-eq-mode="plain"></div>   unnumbered
//        <span data-eq="zeta" data-eq-mode="inline"></span>
//        <div data-eq="pq"></div>                        a system (array key):
//                                                        one number per row,
//                                                        eq:pq1, eq:pq2, ...
//        Wrap content in class="eq-hidden-until-ready" to avoid a LaTeX flash.
//        If MathJax never arrives, the cloak comes off anyway (section 7).
//
// Everything below is inside an IIFE, so the only global this file creates is
// window.MathJax, which MathJax itself requires.
// =============================================================================

(function () {
  'use strict';


  // ---------------------------------------------------------------------------
  // 1. COLORS
  //    Edit here when a project needs a different palette.
  //    Inserted as a hidden block at the top of <body>, so the definitions exist
  //    before any equation uses them. An undefined color name raises no error;
  //    the term simply keeps the text color.
  //
  //    Each name points at a CSS custom property rather than a fixed RGB, so
  //    the deck's light and dark themes (css/tokens.css, --eq-red / --eq-blue /
  //    --eq-green) recolor every equation live, with no re-typesetting. The
  //    `named` model hands its value to CSS verbatim, so \color{colMyBlue}
  //    becomes color: var(--eq-blue). Equation sources stay plain LaTeX.
  //
  //    Contrast is the tokens' job: each clears 4.5:1 on the page and on all
  //    three card fills in both themes. The red is --reveal-alert and the blue
  //    --code-mark, so a listing and a term match.
  //
  //    Without the host's tokens (this folder dropped into another project),
  //    use RGB instead: \definecolor{colMyBlue}{RGB}{31,81,154}. A
  //    \definecolor MathJax cannot read fails inside this hidden block, so
  //    nothing on screen says so.
  // ---------------------------------------------------------------------------
  var COLOR_PREAMBLE = String.raw`
    \definecolor{colMyRed}{named}{var(--eq-red)}
    \definecolor{colMyBlue}{named}{var(--eq-blue)}
    \definecolor{colMyGreen}{named}{var(--eq-green)}
  `;


  // ---------------------------------------------------------------------------
  // 2. CONFIGURATION
  //    Must exist before the MathJax script runs, or it is silently ignored.
  // ---------------------------------------------------------------------------

  // How long to wait for the MathJax library before showing the page with the
  // LaTeX source in place of each equation (section 7). A load that fails
  // outright, as offline, does not wait for this.
  var TIMEOUT_MS = 5000;

  window.MathJax = {

    tex: {
      // 'none' = never number | 'ams' = number equation/align only | 'all' = number every display equation
      tags: 'ams'
    },

    output: {
      scale: 1,                     // global size multiplier applied to every equation
      displayAlign: 'center',       // 'left' | 'center' | 'right' -- centered, like every slide
      // displayIndent: '2em',         // indent from the margin
      displayOverflow: 'scroll',     // 'overflow' | 'scale' | 'scroll' | 'truncate' | 'linebreak'
                                    // scale shrinks a too-wide equation to fit instead of
                                    // giving the slide a horizontal scrollbar
      linebreaks: {
        inline: false               // an inline equation never splits across two lines;
      }                             // true lets MathJax break it after a relation sign
    },

    options: {
      enableMenu: false,            // no right-click contextual menu
      enableExplorer: false,        // no click-to-explore panel
      enableExplorerHelp: false,    // no help icon or dialog
      enableSpeech: false,          // no speech generation; also avoids loading the speech engine
      enableBraille: false          // no braille output
    },

    startup: {
      // Runs once, after the DOM is parsed and MathJax is ready.
      pageReady: function () {
        injected = true;                            // the placeholders are MathJax's from here on
        // Caught, not thrown: a throw here would skip the typesetting and
        // leave the page cloaked. Whatever was injected still typesets.
        try {
          insertColorPreamble();                    // step 1: define the colors
          injectEquations();                        // step 2: fill placeholders
        } catch (err) {
          console.error('MathJax setup failed:', err);
        }
        return MathJax.startup.defaultPageReady()   // step 3: typeset everything at once
          .then(revealPage)                         // step 4: uncloak
          .catch(function (err) {
            // Without this catch, any failure leaves the page hidden and silent.
            console.error('MathJax startup failed:', err);
            revealPage();
          });
      }
    }
  };


  // ---------------------------------------------------------------------------
  // 3. COLOR PREAMBLE
  //    display:none is correct here: the block produces no visible output.
  // ---------------------------------------------------------------------------
  function insertColorPreamble() {
    var div = document.createElement('div');
    div.style.display = 'none';
    div.setAttribute('aria-hidden', 'true');
    div.textContent = '\\(' + COLOR_PREAMBLE + '\\)';
    document.body.insertBefore(div, document.body.firstChild);  // first in document order
  }


  // ---------------------------------------------------------------------------
  // 4. EQUATION INJECTOR
  //    Fills every [data-eq] element from window.MathEquations.
  //    Must run BEFORE typesetting, which is why pageReady calls it first.
  //    A key holds one equation, as a string, or a system, as an array with
  //    one string per row (section 5).
  // ---------------------------------------------------------------------------
  function injectEquations() {
    document.querySelectorAll('[data-eq]').forEach(function (el) {

      var key = el.dataset.eq;                              // the name used in equations-*.js
      var tex = window.MathEquations && window.MathEquations[key];

      // A typo names itself instead of rendering nothing.
      if (tex === undefined) {
        el.textContent = '[missing equation: ' + key + ']';
        return;
      }

      var mode = el.dataset.eqMode;                         // from data-eq-mode

      // A system takes its own branch, so a single equation below renders
      // exactly as it always has.
      if (Array.isArray(tex)) {
        el.textContent = systemTex(key, tex, mode);
        return;
      }

      // textContent, never innerHTML: the browser does not parse this as HTML,
      // so raw < and & inside the stored LaTeX are harmless.
      if (mode === 'inline') {
        el.textContent = '\\(' + tex + '\\)';                       // inline, in a sentence
      } else if (mode === 'plain') {
        el.textContent = '\\[' + tex + '\\]';                       // display, unnumbered
      } else {
        el.textContent = '\\begin{equation}\\label{eq:' + key + '}' // display, numbered
                       + tex + '\\end{equation}';                   // label taken from the key
      }
    });
  }


  // ---------------------------------------------------------------------------
  // 5. SYSTEMS
  //    A system arrives already split into rows, so nothing here has to look
  //    inside the LaTeX to find them. The same three modes as one equation:
  //      numbered  align    one number per row, labeled eq:key1, eq:key2, ...
  //      plain     align*   the same layout, no numbers
  //      inline    aligned  inside \( \), no numbers
  //
  //    Only the numbered form is labeled. MathJax registers a \label even
  //    where nothing is numbered, so a labeled plain copy would define every
  //    label a second time.
  //
  //    Labels count the numbered rows in order, so eq:pq2 is the system's
  //    second number. A \notag or \nonumber row gets no label: MathJax would
  //    carry it on to the next row, which would then hold two and fail.
  //    Labels follow position, not content: inserting or reordering rows
  //    re-points every \ref after the change.
  // ---------------------------------------------------------------------------
  function systemTex(key, rows, mode) {
    var numbered = mode !== 'inline' && mode !== 'plain';
    var count = 0;

    var body = rows.map(function (row, i) {
      row = String(row).replace(/\s+$/, '');  // String(): a throw here would leave the page cloaked

      if (numbered && !/\\no(tag|number)(?![a-zA-Z])/.test(row)) {
        row = '\\label{eq:' + key + (++count) + '}' + row;
      }

      // A row that already ends in a break keeps it: MathType ends every line
      // in \\, and a paper may space rows with \\[4pt]. Adding a second would
      // open a blank, numbered row. Any other row but the last gets one. The
      // newline first ends a % comment on the row's last line, which would
      // otherwise swallow the \\.
      var ownBreak = /\\\\\*?(\[[^\]]*\])?\s*(%[^\n]*)?$/.test(row);
      return row + (ownBreak || i === rows.length - 1 ? '\n' : '\n\\\\\n');
    }).join('');

    if (mode === 'inline') {
      return '\\(\\begin{aligned}' + body + '\\end{aligned}\\)';    // inline, in a sentence
    } else if (mode === 'plain') {
      return '\\begin{align*}' + body + '\\end{align*}';            // display, unnumbered
    }
    return '\\begin{align}' + body + '\\end{align}';                // display, one number per row
  }


  // ---------------------------------------------------------------------------
  // 6. REVEAL
  //    Removes the cloak class so the CSS rule in mathjax.css stops applying.
  //    A class, not an id, so several containers can be cloaked independently.
  // ---------------------------------------------------------------------------
  function revealPage() {
    settled = true;
    document.querySelectorAll('.eq-hidden-until-ready').forEach(function (el) {
      el.classList.remove('eq-hidden-until-ready');
    });
  }


  // ---------------------------------------------------------------------------
  // 7. FALLBACK
  //    Without the library there is no pageReady, so nothing would ever take
  //    the cloak off: offline, or with the CDN down, the page would stay blank.
  //    So it is shown anyway, with each equation's LaTeX source in its place:
  //    at once if the library fails to load, or after TIMEOUT_MS if its
  //    request hangs. If MathJax arrives later, pageReady typesets as usual.
  //
  //    The library's tag is recognized by its file name (tex-chtml.js and the
  //    other combined components). A failed load fires `error` on the tag and
  //    does not bubble, so the listener captures.
  // ---------------------------------------------------------------------------
  var LIBRARY = /\/(?:tex|mml)-[\w-]*\.js(?:[?#]|$)/;
  var injected = false;                     // pageReady has taken the placeholders
  var settled = false;                      // the cloak is off, one way or the other

  function showSource(reason) {
    if (settled) {
      return;
    }
    // Never after pageReady has started: MathJax may be typesetting those very
    // text nodes, and replacing them would lose the equations.
    if (!injected) {
      try {
        injectEquations();
      } catch (err) {
        console.error('MathJax fallback:', err);
      }
    }
    revealPage();
    console.warn('MathJax ' + reason + ': equations are shown as LaTeX source.');
  }

  window.addEventListener('error', function (event) {
    var el = event.target;
    if (el && el.tagName === 'SCRIPT' && LIBRARY.test(el.src)) {
      showSource('could not be loaded');
    }
  }, true);

  setTimeout(function () {
    showSource('was not ready after ' + TIMEOUT_MS / 1000 + ' s');
  }, TIMEOUT_MS);

})();
