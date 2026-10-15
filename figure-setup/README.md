# Figure setup

Vector figures on a web page: sized in millimeters, captioned, numbered
automatically, and referable from the text. A direct translation of the LaTeX
commands `\includegraphics`, `\caption`, `\label` and `\ref`. No dependencies.

---

## Install

**The stylesheet** — either a `<link>` in `<head>`:

```html
<link rel="stylesheet" href="figure-setup/figure-style.css">
```

or, if the project aggregates its CSS into one file to keep cascade order in one
place, an `@import` there instead:

```css
@import "../figure-setup/figure-style.css";
```

Order does not matter; nothing here competes on specificity.

**The script** — the one requirement is that it runs **after the figures are in
the DOM**. In `<head>`, with `defer`:

```html
<script src="figure-setup/figure-reference.js" defer></script>
```

or at the end of `<body>`, with no `defer`, alongside the project's other
scripts:

```html
<script src="figure-setup/figure-reference.js"></script>
```

If the project has a designated last-loaded init file, put this one before it.
Figures added to the page after load are not counted.

---

## Markup

```html
<figure class="fig" id="fig-power" style="--fig-w: 88mm">
  <img src="fig/fig-a.svg" alt="Wind turbine power curves">
  <figcaption>Wind turbine power curves.</figcaption>
</figure>
```

Referred to from the text. The element is **empty** — the script fills it in:

```html
... as shown in <a class="fig-ref" href="#fig-power"></a> ...
```

| HTML | LaTeX | Effect |
|---|---|---|
| `class="fig"` + `--fig-w` | `\includegraphics[width=]` | sized by width |
| `class="fig fig-h"` + `--fig-h` | `\includegraphics[height=]` | sized by height |
| `<figcaption>` | `\caption{}` | caption, numbered automatically |
| `class="fig fig-no-caption"` | *omit* `\caption` | no caption, skipped in numbering |
| `id="fig-power"` | `\label{}` | makes the figure referable |
| `<a class="fig-ref" href="#fig-power">` | `\ref{}` | prints the number |
| `class="fig fig-keep-colors"` | — | exact colors in a dark theme, on a light card |

## Settings

| Name | Default | Where | Does |
|---|---|---|---|
| `--fig-scale` | `1.5` | `figure-style.css` §1 | size of everything |
| `--fig-label` | `"Fig. "` | `figure-style.css` §1 | caption prefix, also used by references |
| `--fig-sep` | `": "` | `figure-style.css` §1 | between number and caption text |
| `--fig-w` | *none* | per figure, in the markup | that figure's natural width |
| `--fig-h` | *none* | per figure, in the markup | height, for `fig-h` figures; it gives way when the width it needs does not fit |
| `FIG_REF_CLICKABLE` | `true` | `figure-reference.js` | `false` → references become plain text |
| `--fig-filter` | `none` | the page's dark theme | filter applied to every figure image |
| `--fig-paper`, `--fig-paper-pad`, `--fig-paper-radius` | *none* | the page's dark theme | the light card behind a `fig-keep-colors` figure |

`--fig-scale` is the **only** size number; everything else derives from it.

A `fig-h` figure keeps its height only while the width that height implies
fits. Once its image has loaded, `figure-reference.js` reads the file's
proportions into `--fig-ratio` and adds `fig-has-ratio`, and the figure is
sized by width: the width `--fig-h` asks for, or all the room there is,
whichever is less. On a narrow screen the figure shrinks as a whole instead
of floating in a tall empty box.

### Dark themes

A figure exported dark-on-white or dark-on-transparent disappears on a dark
page. In its dark theme only, the page sets:

```css
--fig-filter: invert(0.9) hue-rotate(180deg);
```

`invert` turns the figure's lightness over and `hue-rotate` swings each color
back to its own hue: dark text turns light gray and every curve becomes a lighter
version of itself. `0.9` rather than `1` keeps text off pure white and lands
white boxes near the dark background. Captions are page text and are never
filtered.

The flip is approximate: very light colors (yellow, pastel fills) come out
dark, and purple drifts toward pink. A figure whose exact colors matter, and
every photograph, takes `fig-keep-colors`. It is left unfiltered on a light
card (`--fig-paper`), drawn as a spread shadow so the figure's size does not
change.

---

## How sizing works

Every size is a *physical* unit times `--fig-scale` —
`calc(88mm * var(--fig-scale))`, `calc(8pt * var(--fig-scale))`. CSS converts
`mm` and `pt` exactly as the browser converts the units inside an SVG file, so
the page is a paper layout, scaled. Set `--fig-scale` by eye; there is nothing
to calculate.

**Always true.** A caption is 8 pt physical, so its *size* matches 8 pt text
inside a figure at any scale. Its *family* is inherited from the page, so the
figure must use that same family for the two to match.

**Only if the page opts in.** The ratio between figure text and body text holds
when the page also sizes its own type in `pt` times `--fig-scale`. A page using
`rem` or `vw` typography will not have it.

## The rule everything rests on

> **`--fig-w` must equal the figure's own natural width**, read from its SVG
> file.

The class does not tell the browser how wide the file is — it already knows
that. It says *draw this at its natural width times the scale*. When the value
matches the file, the figure is scaled by `--fig-scale` **and by nothing else**,
which is what keeps every figure in proportion with every other one.

Sizing one figure individually is what breaks the system. If a figure is the
wrong size, change `--fig-scale` or re-export it at a different width — never
override the width of a single figure. Forgetting `--fig-w` is visible at once:
the figure falls back to the full container width and is obviously too large.

---

## Preparing the figure files

**matplotlib** — `plt.savefig("fig-a.svg", format="svg")`. The file comes out at
exactly the requested `figsize`, so that width in mm is what goes in `--fig-w`.
Leave `svg.fonttype` at its default `"path"`: text becomes outlines and renders
identically anywhere.

**Inkscape** — the page **must** be cropped to the drawing, or the figure
arrives with a large empty margin: `File > Document Properties` (Ctrl+Shift+D)
→ *Resize to content* → `Save As` into the figures folder. Read the resulting
`viewBox` for `--fig-w`; set label text at **8 pt in the same font family the
page uses**.

> *Calibration check:* a caption and the labels inside a hand-drawn figure
> should look identical in size and shape. One glance confirms the setup.

## Invariants

**Must** — `--fig-w` equals the SVG's own natural width; the script runs after
the figures exist; every figure carries the `.fig` class.

**Must not**

- set a width or height on the `<img>` — sizing belongs on the `<figure>`
- size one figure individually to make it look right
- add bare `figure` or `figcaption` selectors here; every selector is scoped to
  `.fig`, which is what stops the file affecting anything else
- move `counter-increment` from the caption to the figure — the caption drives
  it, which is what lets `fig-no-caption` skip a number

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Every figure says *Fig. 1* | `counter-reset: fig-counter` missing from `:root` |
| A figure is enormous | `--fig-w` not set on it |
| `--fig-scale` changes nothing | editing a stylesheet the page does not link |
| A reference shows *Fig. ??* | `href` matches no figure `id` |
| References are blank | script not loaded, or running before the figures |
| Caption does not match a figure's labels | figure text is not 8 pt, or not in the page's font family |
| Figure has a big empty margin | hand-drawn page not cropped to the drawing |
| A figure runs off the side | `max-width: 100%` removed from §2 |
| A figure's colors look wrong in dark mode | the dark filter; give it `fig-keep-colors` |
