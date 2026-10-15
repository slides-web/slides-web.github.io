# MathJax equation module

Drop-in LaTeX rendering for a static HTML page. Copy this folder, add five tags,
add one class.

## Files

| File | Role |
| --- | --- |
| `mathjax-setup.js` | Colors, MathJax config, equation injector, systems, reveal |
| `mathjax.css` | The cloak rule |

The equations themselves are the project's, not the module's: they live in
`equations-*.js` files in an `eqn/` folder beside this one, as the figures live
in `fig/`, so this folder is copied from project to project untouched. Here
that is `eqn/equations-system.js` and `eqn/equations-control.js`.

## Install: the stylesheet

Either a `<link>` in `<head>`:

```html
<link rel="stylesheet" href="mathjax/mathjax.css">
```

Or, if the project aggregates its CSS into one file to keep cascade order in one
place, an `@import` there instead of a `<link>`:

```css
@import "../mathjax/mathjax.css";
```

Order does not matter; nothing here competes on specificity.

## Install: the scripts

Two valid arrangements. Pick whichever matches the host project.

In `<head>`, with `defer` on all four:

```html
<script defer src="eqn/equations-system.js"></script>
<script defer src="eqn/equations-control.js"></script>
<script defer src="mathjax/mathjax-setup.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script>
```

Or at the end of `<body>`, with no `defer`, alongside the project's other
scripts, with the MathJax script last of all:

```html
<script src="eqn/equations-system.js"></script>
<script src="eqn/equations-control.js"></script>
<script src="mathjax/mathjax-setup.js"></script>
<!-- … the project's own scripts … -->
<script src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script>
```

One rule matters either way: **`mathjax-setup.js` must come before the MathJax
script**, because the configuration has to exist first. `defer` guarantees that
in `<head>`; document order guarantees it at the end of `<body>`. Never use
`async`, and never mix the two styles within these four tags.

If the project has a designated last-loaded init file, put the three local
files before it and the MathJax script after it, so the page never waits on
the download before it starts.

Equation files may sit in any order, as long as they precede the MathJax script.

## Install: the cloak

Add `class="eq-hidden-until-ready"` to the **smallest element containing all your
equations**. It hides that element until typesetting finishes, so raw LaTeX is
never seen, and the reflow from raw text to typeset equation happens out of sight.

Avoid `<body>` or an outer wrapper that also holds persistent interface — a
header, navigation, a sidebar — since hiding those on load reads as a broken page.
The class works on any number of elements, so a page with equations in two
regions can cloak just those two.

Omitting it entirely is safe; it only costs a brief flash of LaTeX.

## Without the library

The MathJax script comes from a CDN. If it cannot load (no internet, or the
CDN is down), the cloak still comes off: at once when the load fails, or after
`TIMEOUT_MS` (5 s, section 2 of `mathjax-setup.js`) when the request hangs.
Each equation then shows its LaTeX source, and the console says why. If
MathJax arrives later, it typesets as usual.

## Placing equations

```html
<div  data-eq="park"></div>                        <!-- numbered -->
<div  data-eq="pm"   data-eq-mode="plain"></div>   <!-- unnumbered display -->
<span data-eq="zeta" data-eq-mode="inline"></span> <!-- inline -->
```

A numbered equation is labeled automatically from its key, so `data-eq="park"`
is referenced in your text as `(\ref{eq:park})`.

A key with no matching equation renders as `[missing equation: key]` rather than
failing silently.

### A system of equations

A system is placed with the same element as one equation, and the key always
stands for the whole system:

```html
<div data-eq="pq"></div>                           <!-- one number per row -->
```

Each row gets its own number and its own label, `eq:pq1`, `eq:pq2` and so on,
counted over the numbered rows in order. Cite one row as `(\ref{eq:pq1})`, or the
whole system as `(\ref{eq:pq1})–(\ref{eq:pq2})`.

The three modes work as they do for one equation:

| Mode | Typeset as |
| --- | --- |
| numbered (default) | `align`: one number per row |
| `data-eq-mode="plain"` | `align*`: the same layout, no numbers |
| `data-eq-mode="inline"` | `aligned` inside `\( … \)` |

Place any key numbered once only, a system as a whole. A second numbered copy
defines its labels twice, and MathJax shows "Label 'eq:pq1' multiply defined"
in place of the equation. To show it again, use `plain` or `inline`.

## Adding equations

Add a key to any `equations-*.js` file in `eqn/`. Paste MathType's LaTeX export
between the `String.raw` backticks, with the `\[ … \]` delimiters removed.

To start a new file in `eqn/`, copy these two lines and follow with your own
keys, and give it a `<script>` tag beside the others:

```js
window.MathEquations = window.MathEquations || {};
Object.assign(window.MathEquations, { … });
```

Keys are shared across every equation file. If two files define the same key, the
one that loads later wins, silently. Prefix keys by section if that's a risk.

A system is an array with one `String.raw` per row:

```js
pq: [
  String.raw`{p_v} &= \frac{…}{R_t^2 + X_t^2},`,
  String.raw`{q_v} &= \frac{…}{R_t^2 + X_t^2}`
],
```

- Put `&` before the relation sign to line the rows up.
- Never write `\label`; the injector adds one per row. It also adds the `\\`
  between rows, unless a row already ends in one: MathType's `\\` after every
  line, or a `\\[4pt]` that spaces two rows, is kept as it is.
- A row carrying `\notag` or `\nonumber` is shown without a number, gets no
  label, and is skipped in the count.
- A single equation stays a string. A one-row array is labeled `eq:key1`, not
  `eq:key`.
- Don't name another key after a system plus a number. A key `pq1` and row 1
  of `pq` are both `eq:pq1`, as are row 1 of a system `pq1` and row 11 of `pq`.
  MathJax reports the clash, but only once both are placed numbered.

From a LaTeX paper, take the lines between `\begin{align}` and `\end{align}`,
one per `String.raw`, and delete each `\label`.

## Settings worth knowing

All in section 2 of `mathjax-setup.js`, each with its alternatives in a comment:

| Setting | Does |
| --- | --- |
| `tags` | `'ams'` numbers equation environments, `'all'` numbers everything, `'none'` nothing |
| `displayAlign` | `'left'`, `'center'` or `'right'` |
| `displayIndent` | Indent from the margin; ignored when centered |
| `scale` | Global size multiplier |
| `displayOverflow` | What a too-wide equation does: `'overflow'`, `'scale'`, `'scroll'`, `'truncate'`, `'linebreak'` |
| `linebreaks.inline` | `false` keeps an inline equation on one line; `true` lets MathJax break it after a relation |
| `TIMEOUT_MS` | How long to wait for the library before showing the LaTeX source instead (`5000`) |

Colors live in section 1. Add `\definecolor` lines there and use
`\color{name}` inside any equation.

A color can point at a CSS custom property, so a page with light and dark
themes recolors its equations when the theme changes, with no re-typesetting:

```
\definecolor{colMyBlue}{named}{var(--eq-blue)}
```

The `named` model passes its value to CSS unchanged, so `\color{colMyBlue}`
becomes `color: var(--eq-blue)`. Define `--eq-blue` for each theme in the page's
stylesheet. Without such a property, use a fixed color instead:
`\definecolor{colMyBlue}{RGB}{31,81,154}`.

Equations inherit the CSS `font-size` and `color` of whatever contains them, so
large or dark slides need no MathJax settings at all.

## Things that break silently

- Changing `defer` to `async`, or loading MathJax before `mathjax-setup.js`
- Escaping the backslashes in an `equations-*.js` file, or converting it to JSON
- Replacing `textContent` with `innerHTML` in the injector
- Renaming a key without updating the `\ref` that points at it
- Inserting, removing or reordering the rows of a system: labels follow
  position, so every `\ref` after the change points at a different row
- Storing a system as one string with `\\` between the rows: without `&` it
  renders as one equation with one number, and nothing says so (with `&`,
  MathJax at least shows "Misplaced &")
- Using a color name with no `\definecolor` — the term keeps the text color, no error

## Static pages only

Equations are typeset once, at load. Anything added to the DOM afterwards needs
`MathJax.typesetPromise([element])` or it appears as raw LaTeX. That includes
content built lazily by tooltips, popovers, modals and similar, which is easy to
overlook because it works on first load and fails later.

Hiding inactive slides with `visibility`, `opacity` or a transform is safer than
`display: none`, which removes an element's measurable dimensions.

## Note on load-time execution

`mathjax-setup.js` runs when parsed, but only to assign `window.MathJax`, define
its internal functions, and arm the fallback (a timer and an `error` listener).
It touches no DOM and reads nothing from the page; all of that happens later,
inside `pageReady` or the fallback. The MathJax script self-starts, as
third-party libraries do. If a project requires that only one designated file
executes on load, these two are the exception.
