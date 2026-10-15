# Slides on the Web

A slide deck that runs in the browser, in plain HTML, CSS and JavaScript, with
LaTeX equations, numbered figures and BibTeX citations. `index.html` is a
**gallery**: one slide per layout, content element and animation, ready to
copy into your own talk.

**See it live: <https://slides-web.github.io>**

## Getting started

1. **Get the files:** on GitHub, press the green **Code** button, then
   **Download ZIP**, and unzip it (or clone the repository).
2. **Find a slide** that shows what you need. The gray line under its title
   (the tag) names the classes and attributes it uses, each explained below;
   the [Quick reference](#quick-reference) lists them all.
3. **Copy** that slide's whole `<section class="slide">…</section>` from
   `index.html` (the comment above it names the section of this README that
   covers it), paste it into your deck, delete its tag line
   (`<p class="tag">…</p>`), set its `data-section`, and replace the text.

For a new talk, copy the whole folder, delete the gallery slides you don't
want, and keep the title, contents, References and closing slides; the tab
shows the `<title>` in `index.html` and `fig/favicon.svg`. Your figures go in
`fig/`, equations in `eqn/` and references in `bib/`, while the setup folders
(`mathjax/`, `figure-setup/`, `citation-setup/`) stay as they are, each with
a README of its settings. Colors, spacing and motion are tokens in
`css/tokens.css`.

## Quick reference

| [Slides and sections](#slides-and-sections) | Gives |
|---|---|
| `<section class="slide">` | one slide |
| `data-section="…"` | the section it belongs to; none on the title, contents and closing slides |
| `<h2>` | the slide title, also its name in the rail |
| `<ol class="toc"></ol>` | the contents list, filled in for you |
| `<div class="title-page">` | the title slide: an `h1` with its accent line in a `<span>`, then a `.title-foot` holding the subtitle and a `.title-byline` |
| `<p class="closing-links">` | the closing slide's links: each an `<a>` holding an icon `<img>` and a name |

| [Layouts](#layouts) | Gives |
|---|---|
| `columns` | blocks side by side, stacking on a narrow screen |
| `rows` | blocks stacked |
| `grid` | two to a row |
| `block-wide` | a whole row of a `grid` or `columns` |
| `split` | a block beside a figure, or a listing beside a table |
| `process` | numbered steps joined by arrows (`<ol>` of `<li class="block">`) |
| `results` | big numbers with a short label (`<ul>`, the number in `<b>`) |

| [Content](#content) | Gives |
|---|---|
| `block` | a card |
| `block-highlight-a`, `block-highlight-b` | the same card, another fill |
| `block-titled`, `block-alert`, `block-example` | a card whose `h3` is a blue, red or green title bar |
| `bullets` | a list with markers; on an `<ol>`, numbered |
| `<li class="pro">`, `<li class="con">` | a check in a green disc, or a cross in a red one, in place of the marker |
| `lines` | a list with no markers, centered |
| `table` | a grouped table: a `<tbody>` per group, `table-group` for its name |
| `<div class="table-data">` | around a `table` of results: centered columns, scrolls sideways on a phone |
| `<tr class="table-highlight">` | a shaded row, LaTeX's `\rowcolor` |
| `<sup class="fn"></sup>`, `<p class="footnote">` | a footnote marker and its note, numbered for you |
| `<mark>` | a marker band behind a phrase |
| `<pre class="code">` | a code listing; `data-file`, `<b>`, `<i>` |
| `<code>` | a short name in the code font |

| [Steps and animations](#steps-and-animations) | Gives |
|---|---|
| `data-reveal="each"` | every child a step |
| `data-reveal` | one step, in document order |
| `data-reveal="2"` | joins step 2 |
| `data-reveal-alert` | the newest step in the highlight color |
| `data-reveal-focus` | only the newest step at full strength |
| `data-reveal-motion` | hidden, then fades and glides in |
| `data-reveal-rise` | the line inside rises into place (one wrapper per line) |
| `<mark data-reveal>` | the marker band sweeps in |

| [Figures](#figures) | Gives |
|---|---|
| `class="fig"` + `style="--fig-w: 88mm"` | a figure, sized by width: `\includegraphics[width=]` |
| `class="fig fig-h"` + `style="--fig-h: 60mm"` | sized by height instead: `\includegraphics[height=]` |
| `<figcaption>` | a caption, numbered for you: `\caption{}` |
| `fig-no-caption` | no caption, and no number |
| `fig-keep-colors` | exact colors in the dark theme, on a light card |
| `id="fig-…"` | what a reference points at: `\label{}` |
| `<a class="fig-ref" href="#fig-…"></a>` | "Fig. N", as a link: `\ref{}` |

| [Equations](#equations) | Gives |
|---|---|
| `data-eq="key"` | numbered, and labeled `eq:key` |
| `data-eq-mode="plain"` | on a line of its own, unnumbered |
| `data-eq-mode="inline"` | inside a sentence |
| `(\ref{eq:key})` | the equation's number, as a link |
| `\( … \)` | a symbol typed in place |
| `\color{colMyBlue}{…}` | one term in color |

| [Citations](#citations) | Gives |
|---|---|
| `<span data-cite="key"></span>` | a citation; several keys go in one, separated by spaces |
| `data-bib-placeholder` | where the reference list goes |
| `bib/refs.bib` | the references, in UTF-8 |
| `python citation-setup/build_refs.py` | run after citing a new key or editing the `.bib` |

## Slides and sections

A slide is one `<section class="slide">` inside `<div class="slides">`:

```html
<section class="slide" data-section="Results">
  <h2>Slide title</h2>
  <p>Slide content</p>
</section>
```

- **Sections come from `data-section`.** Consecutive slides with the same
  value form one section, named in the header, the rail and the contents
  list. Never wrap slides in an element to group them: that breaks the slide
  movement.
- **Slides carry no number**, so you can insert one anywhere.
- **A slide without `data-section`** belongs to no section, as the title,
  contents and closing slides do. Don't leave one in the middle of the deck:
  it splits its neighbors into two sections.
- A slide too tall for the window aligns to the top and scrolls.
- **The contents list**, `<ol class="toc"></ol>`, is filled in from the
  sections, each entry a link to the section's divider.
- **A divider slide** opens every section, generated for you and numbered as
  the contents list numbers it. `SECTION_DIVIDERS = false` in `js/sections.js`
  turns them off, and `DIVIDER_LABEL` there changes the word "Section".

## Layouts

Every layout is at most 64rem wide (`--bed-max`), centered, and adapts to a
narrow screen by itself.

### columns

Blocks side by side, each an equal share of the row and at least 18rem wide,
so they stack as the screen narrows. Two, three or four blocks all work; a
`block-wide` spans the whole row, as on "Arriving in motion".

```html
<div class="columns">
  <div class="block">…</div>
  <div class="block">…</div>
</div>
```

### rows

The same blocks stacked, with a tighter gap: change `columns` to `rows`.
Three blocks with a line of text each fit a laptop screen; on a 720px-tall
window a fourth makes the slide scroll. Beside a taller card in `columns`, a
`rows` stack is centered next to it, as on "Rising into place".

### grid and block-wide

A two-column bed, never more. A `block-wide` spans the row, so a wide block
above two half-width ones is one grid, as on "A grid". On a phone everything
stacks.

### split

A block beside a figure: the figure keeps its own size and the block takes the
width left, and with less than 16rem left the figure moves below. Use it
rather than `columns` for figures, which equal columns would shrink unevenly.
For two cards beside a figure, put a `rows` in the block's place, as on
"Referring to a figure"; a listing beside a table, or two listings, work too.

```html
<div class="split">
  <div class="block">…</div>
  <figure class="fig" id="fig-Network" style="--fig-w: 88mm">…</figure>
</div>
```

### process

Numbered cards joined by arrows, for the three or four steps of a method. The
numbers and the arrows are drawn for you; on a phone the cards stack and the
arrows point down. With `data-reveal="each"`, each card arrives with its arrow.

```html
<ol class="process" data-reveal="each">
  <li class="block"><h3>Store</h3><p>…</p></li>
  <li class="block"><h3>Place</h3><p>…</p></li>
  <li class="block"><h3>Refer</h3><p>…</p></li>
</ol>
```

### results

Big numbers, each with a short label, for a results or conclusions slide:
`<ul class="results">` whose items open with their number in `<b>`,
`<li><b>0.099</b> lowest damping ratio</li>`. Three or four sit in a row.

## Content

### Blocks

`block` is a card with left-aligned text: give it an `h3` title and any
content (paragraphs, lists, equations, code). `block-highlight-a` (blue) and
`block-highlight-b` (yellow) are the same card with another fill, a pair of
peers for setting two cases apart, as on "Referring to a figure".

### Titled blocks

Beamer's `block`, `alertblock` and `exampleblock`: the block's `h3` becomes a
blue, red or green bar across its top. They sit in any layout, and equations
work inside them.

```html
<div class="block block-titled"><h3>Definition</h3><p>…</p></div>
<div class="block block-alert"><h3>Theorem</h3><p>…</p></div>
<div class="block block-example"><h3>Example</h3><p>…</p></div>
```

### Lists

`<ul class="bullets">` has round markers in the accent color, left-aligned and
centered as a group; an `<ol class="bullets">` is numbered, as Beamer's
`enumerate`; `<ul class="lines">` has no markers and centers every line, for
short statements. All three work with every step and animation. An item of a
numbered list that is one display equation,
`<li><div data-eq="…" data-eq-mode="plain"></div></li>`, gets its number
centered on the equation, as on "AC current dynamics".

**To compare two methods**, mark the items of a `bullets` list:
`<li class="pro">` takes a check in a green disc, and `<li class="con">` a
cross in a red one. Put one list per method in a `block`, and the blocks in
`columns`, as on "Two methods compared".

### Tables

`table` is a grouped reference table, such as a nomenclature or a list of
parameters. Each `<tbody>` is one group, named by its `table-group` row.

```html
<table class="table">
  <tbody>
    <tr class="table-group"><th colspan="2" scope="rowgroup">DC link</th></tr>
    <tr><th scope="row">\(C_{dc}\)</th><td>DC-link capacitance</td></tr>
    <tr><th scope="row">\(v_{dc}\)</th><td>DC-link voltage</td></tr>
  </tbody>
  <tbody>…the next group…</tbody>
</table>
```

- **Terms** are the `<th scope="row">` cells, right-aligned to meet their
  meanings in the middle. Type symbols as `\( … \)` and units as plain text.
- **More than two columns:** put the headings in a `table-group` row of
  `<th scope="col">` cells in the first `<tbody>`.
- A short table can stand on the slide by itself. A long one (more than about
  15 rows) goes in two tables in a `columns` bed, as on "Nomenclature".

**A table of results**, many columns of numbers like LaTeX's `{cccc}`: wrap
the `table` in `<div class="table-data">`, as on "Participation Factors",
with the column headings in a `table-group` row and a `<th scope="row">`
opening each row. Every column is centered, and on a narrow screen the table
scrolls sideways instead of squeezing. `<tr class="table-highlight">` shades a
row, in any `table`.

### Footnotes

Put an empty `<sup class="fn"></sup>` where the marker goes, and each note in
a `<p class="footnote">` at the very end of the slide:

```html
<li>Grid-forming converters set their own voltage<sup class="fn"></sup>.</li>
…
<p class="footnote">Unlike grid-following ones, which track the grid's.</p>
```

Markers and notes are numbered for you, starting again on every slide, and
the notes sit just above the footer. Notes without markers stay unnumbered: a
source line, say. A note can carry a citation, and `data-reveal` to arrive
with its item.

### Highlighter

`<mark>` draws a marker band behind a phrase, in the accent color:
`<p>… <mark>this part</mark> …</p>`. With `data-reveal` the band sweeps in on
its step; see [Highlighter](#highlighter-mark-data-reveal).

### Code listings

`<pre class="code">` shows source code in a light well, and a line too long
for the slide wraps; "Code, marks and footnotes" shows two side by side.
`data-file="path"` prints the file name above the listing, `<b>…</b>` marks
the part the slide is about, in blue, and `<i>…</i>` a comment, in gray.
Inline `<code>` shows a short name in the code font, and never breaks across
lines.

### Title and closing slides

Both are slides with no `data-section`. The title slide sets its title on two
lines, the `<span>` on the second, in the accent. Under a rule come the
subtitle and the byline, its first line (the author) in bold.

```html
<div class="title-page">
  <h1>Slides <span>on the Web</span></h1>
  <div class="title-foot">
    <p class="subtitle">Ready-made slides to copy and edit.</p>
    <div class="title-byline">
      <p>Your Name</p>
      <p>Research Institute of Electrical Engineering</p>
    </div>
  </div>
</div>
```

The size suits two short lines: give a longer title a smaller one,
`<div class="title-page" style="--title-size: 4.5rem">`.

The closing slide uses the same layout with a link in place of the byline: an
icon from `fig/` and a name, opening in a new tab. Further links stack under
it. An icon drawn in black takes `class="icon-mono"`, so it turns light in the
dark theme; a colored one keeps its colors.

```html
<p class="closing-links">
  <a href="…" target="_blank" rel="noopener"><img class="icon-mono" src="fig/github.svg" alt="">GitHub</a>
</p>
```

## Steps and animations

### Steps

An element carrying `data-reveal` waits for its own key press instead of
arriving with the slide, like Beamer's overlays; until then it shows faintly.
`data-reveal="each"` makes every direct child a step (the list form), a bare
`data-reveal` makes the element one step, numbered in document order, and
`data-reveal="2"` puts it in step 2, so several can arrive together.

- **Step 1 is what a slide shows on arrival**, so four items take three
  presses. Coming back from the next slide, a slide shows complete.
- **To make everything wait on arrival**, give something ahead of it a bare
  `data-reveal`, which claims step 1 (as the wide block on "A grid" does), or
  number from 2 (as "Rising into place" and "Marking a phrase" do).
- `data-reveal="each"` works on `bullets`, `lines`, `columns`, `rows`, `grid`
  and `process`.

The variants below go **on the element with `data-reveal="each"`, or on any
element around the steps**: one list, a whole `<section class="slide">`, or
the `.slides` strip for the whole deck. Rise is the exception: it must be the
direct parent.

### Alert: `data-reveal-alert`

The step that has just arrived takes the highlight color
(`--reveal-alert-highlight`, the accent) until the next one arrives.
Equations take it too: on "AC current dynamics" each item of a numbered list
is one equation, as in Beamer's `alert@+` overlay.

```html
<ul class="bullets" data-reveal="each" data-reveal-alert>…</ul>
```

### Focus: `data-reveal-focus`

Only the step that has just arrived is at full strength; the ones before it
dim to 40% (`--reveal-focus-dim`).

```html
<ul class="bullets" data-reveal="each" data-reveal-focus>…</ul>
```

### Motion: `data-reveal-motion`

Waiting items are hidden rather than faint, and fade and glide in on their
step; items sharing a step arrive one after another. Nothing on the slide says
more is coming, so use it where the surprise is the point.

```html
<div class="columns" data-reveal-motion>
  <div class="block block-wide" data-reveal>…</div>   <!-- arrives with the slide -->
  <div class="block" data-reveal="2">…</div>          <!-- these two, one after -->
  <div class="block" data-reveal="2">…</div>          <!-- the other, on a press -->
</div>
```

### Rise: `data-reveal-rise`

A line rises into place through an invisible edge, sharpening from a blur.
The element carrying the attribute is the edge, so **every line needs a
wrapper of its own**:

```html
<div data-reveal-rise><p data-reveal="2">First line.</p></div>
<div data-reveal-rise><p data-reveal="3">Second line.</p></div>
```

It is made for text: on a card the edge would cut the card's shadow. Never
put it on a `.slide` or on `.slides`.

### Highlighter: `mark data-reveal`

The phrase shows from the start, and its band sweeps in on its step.

```html
<p>Every slide is centered, <mark data-reveal="2">title included</mark>.</p>
```

Don't use it inside `data-reveal-motion` or `data-reveal-rise`: they hide the
whole element, phrase included, until its step.

## Figures

Vector figures sized in millimeters, captioned, numbered and referable:
LaTeX's `\includegraphics`, `\caption`, `\label` and `\ref`, matched in the
[Quick reference](#quick-reference). Details are in
[`figure-setup/README.md`](figure-setup/README.md).

```html
<figure class="fig" id="fig-Network" style="--fig-w: 88mm">
  <img src="fig/fig-Network.svg" alt="Network diagram">
  <figcaption>IEEE 39-bus test system.</figcaption>
</figure>

… as shown in <a class="fig-ref" href="#fig-Network"></a> …
```

- **`--fig-w` must be the width the SVG file itself declares.** Every figure
  is drawn at that width times `--fig-scale`, so all of them stay in
  proportion. To resize one, change `--fig-scale` or re-export the file.
  Size the `<figure>`, never the `<img>` inside it.
- **`fig-h`** sizes a figure by height instead:
  `class="fig fig-h" style="--fig-h: 60mm"`. Where the width that height
  needs does not fit (a phone), it takes the width there is.
- Captions are numbered in the order the figures appear. The empty reference
  is filled in with "Fig. 3" and links to the figure's slide.
- **A figure with no caption** takes `fig-no-caption`, or has no
  `<figcaption>`: it gets no number, and the figures after it keep theirs.
- In the dark theme figures are inverted, so dark lines turn light. One whose
  exact colors matter, or a photograph, takes `fig-keep-colors` and sits on a
  light card instead.

## Equations

LaTeX typeset by MathJax, numbered and referable as in a paper. Details are in
[`mathjax/README.md`](mathjax/README.md).

1. **Store** the LaTeX under a key in an `eqn/equations-*.js` file. Paste
   MathType's export as it is, minus its `\[ … \]`; `String.raw` keeps every
   backslash. A new file needs its own `<script>` line in `index.html`, next
   to the other equation files and above `mathjax-setup.js`.

   ```js
   window.MathEquations = window.MathEquations || {};

   Object.assign(window.MathEquations, {
     zeta: String.raw`\zeta = \frac{{{D_{tr}}}}{{2{K_{tr}}{\omega _{Br}}}}`
   });
   ```

2. **Place** an empty element carrying the key where the equation belongs:

   ```html
   <div  data-eq="park"></div>                         <!-- numbered, labeled eq:park -->
   <div  data-eq="bhaskara" data-eq-mode="plain"></div> <!-- on its own line, no number -->
   <span data-eq="zeta" data-eq-mode="inline"></span>   <!-- inside a sentence -->
   ```

3. **Refer** to it from any sentence: `(\ref{eq:park})` prints "(1)" as a link.

- **Place each key numbered only once.** To show an equation again, use
  `plain` or `inline`.
- **A single symbol** needs no key: type `\(\theta_s\)` straight into the
  text. To show a backslash sequence literally, put it inside `<code>`.
- **A system of equations** is a key holding an array, one `String.raw` per
  row, with `&` before the sign that lines the rows up. Each row is numbered
  and labeled `eq:pq1`, `eq:pq2`, …. Never write `\label` or `\\` yourself.

  ```js
  pq: [
    String.raw`{p_v} &= \frac{…}{R_t^2 + X_t^2},`,
    String.raw`{q_v} &= \frac{…}{R_t^2 + X_t^2}`
  ],
  ```

- **Color** a term with `\color{colMyBlue}{…}`. `colMyRed`, `colMyBlue` and
  `colMyGreen` follow the light and dark themes. Add your own in section 1 of
  `mathjax/mathjax-setup.js`, pointing at a theme color,
  `\definecolor{colMyBlue}{named}{var(--eq-blue)}`, or at a fixed
  `{RGB}{31,81,154}`.
- **A numbered equation's line is at most 50rem wide** (`--eq-max`), so its
  number stays near it. A display equation too wide for its box scrolls
  sideways (`displayOverflow: 'scroll'`; `'scale'` shrinks it instead), so a
  long one belongs on a full-width row: "Color and systems" uses `rows`.
- **MathJax comes from the internet.** Offline, the slides still work, with
  each equation's LaTeX source in its place (after at most 5 s).

## Citations

Numbered citations, `[1]`-style, with the reference list generated at the end
of the deck from `bib/refs.bib`. Nothing is fetched while presenting. Details
are in [`citation-setup/README.md`](citation-setup/README.md).

```html
<p>Operating a grid on 100% renewables is studied in <span data-cite="Kroposki:17"></span>.</p>
<p>Several at once <span data-cite="Avila:27 Rokrok:22"></span>.</p>
```

- Numbers follow the order in which keys are first cited, as in LaTeX, and a
  key cited again keeps its number. Hovering a number shows the reference.
- Citations work in sentences, lists, blocks, tables and footnotes.

**To add a reference**, add the entry to `bib/refs.bib`, saved as UTF-8 (with
its `@string` line if it uses one), cite it, and run
`python citation-setup/build_refs.py` from the project folder. Run it again
whenever you cite a key for the first time or change an entry, not when you
move or delete a citation or cite a key already used. Entries nobody cites
are ignored.

**The list** replaces the empty slide
`<section class="slide" data-section="References" data-bib-placeholder></section>`
with as many pages as it needs: eight references to a page, five on a phone
(`perSlide`, `perSlideNarrow`). Keep it before the closing slide.

- **`[?]` on a slide** means the key is not in the `.bib`, is misspelled, or
  the generator has not run since you added it. The browser console names it.
- **The generator writes nothing while any cited key is missing**, so the deck
  keeps its previous list until you fix it.
