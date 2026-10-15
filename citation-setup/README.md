# Citations

Numbered citations, `[1]`-style, with a reference list generated at the end of
the page.

Write `<span data-cite="key"></span>` and it renders as `[1]`. Numbers come from
the order the citations appear in the document, so inserting one in the middle
renumbers everything after it by itself. The reference list is built from
`bib/refs.bib` and split across as many pages as it needs. Hovering a citation
shows the full reference.

Nothing is fetched at runtime, so the page still works opened straight from
disk.

## Files

`citation-setup/` is added whole and holds only code. The references are the
project's own: they live in a `bib/` folder beside it, as the figures live in
`fig/`, so the package folder is copied from project to project untouched.
Three files around it are edited, by one or two lines each.

```
your-project/
├── index.html                  two edits — the <script> tags, and the placeholder
├── css/
│   ├── ...
│   └── main.css                one edit — the @import line
├── js/
│   ├── ...
│   └── init.js                 one edit — the Bib.build() call
├── bib/                        the project's references
│   ├── refs.bib                the presentation's references
│   └── refs.generated.js       generated — never edit by hand
└── citation-setup/             added whole — copy this folder in as it is
    ├── build_refs.py           reads bib/refs.bib, writes bib/refs.generated.js
    ├── citations.js            numbers the citations, builds the list
    ├── citations.css           styling for all of the above
    └── README.md               this file
```

`build_refs.py` needs Python 3 and nothing else — there are no packages to
install.

## Installing it

1. Copy the `citation-setup/` folder into the project root, beside
   `index.html`.

2. Put the presentation's references in `bib/refs.bib`, a `bib/` folder beside
   `index.html`. `@article`, `@inproceedings`, `@book` and `@string`
   abbreviations are all understood.

3. In `index.html`, add the two scripts **at the end of `<body>`**:

   ```html
     <script src="bib/refs.generated.js"></script>              <!-- add -->
     <script src="citation-setup/citations.js"></script>        <!-- add -->
     <script src="js/init.js"></script>                         <!-- already there -->
   </body>
   ```

   The order of the first two does not matter. Both must come before whatever
   calls `Bib.build()` — that is step 5.

4. In `css/main.css`, add the stylesheet **after `content.css`**, so it can win
   at equal specificity against the page's own rules:

   ```css
   @import "../citation-setup/citations.css";   /* add */
   ```

5. In `js/init.js`, call `Bib.build()` **before anything that scans the
   slides** — the section list, the rail, the contents list, the slide counter.
   In a deck that means the first line of the boot block:

   ```js
   // --- Boot ---                 already there

   Bib.build();                 // add
   findSlides();                // already there
   buildSections();             // already there
   ```

   Optionally, once the deck is built, let the reference pages re-flow when
   the window crosses `narrow` (a phone turned sideways), passing a function
   that scans the slides again:

   ```js
   Bib.watch(rescanDeck);       // optional
   ```

6. In `index.html`, add an empty element where the references belong — usually
   at the end, or just before a closing slide:

   ```html
   <section class="slide" data-section="References" data-bib-placeholder></section>
   ```

   **Write this element the way the rest of the page is written.** Every further
   page of references is an empty copy of it — same tag, same classes, same
   attributes — so whatever makes an element a slide in your project is
   inherited without the package needing to know about it. The only thing the
   package adds on its own is an `<h2>` heading.

7. Run the generator, from the project root:

   ```
   python citation-setup/build_refs.py
   ```

   It works from the project root even though the script sits in a subfolder,
   because the paths it uses are fixed relative to the script itself, not to
   the directory you run it from. It prints the files it read and wrote.

Reload. The citations show their numbers and the reference pages appear in place
of the empty element.

## Citing

**One reference**

```html
<p>The method was introduced by Smith <span data-cite="smith2023"></span>.</p>
```

> The method was introduced by Smith [1].

**Several references in one place.** Separate the keys with spaces or commas:

```html
<p>Several groups report this <span data-cite="smith2023 lee2020 muller2021"></span>.</p>
```

> Several groups report this [1], [2], [3].

**The same reference again.** Cite the key anywhere else and it keeps its
number:

```html
<p>As already noted <span data-cite="smith2023"></span>, the effect is small.</p>
```

> As already noted [1], the effect is small.

## Adding a new reference

1. Add the entry to `bib/refs.bib`. If it uses a journal abbreviation, copy its
   `@string` line across too.
2. Cite it with `<span data-cite="yourkey"></span>`.
3. Run `python citation-setup/build_refs.py`.

**The generator only has to run when you cite a key for the first time, or when
you change an entry in the `.bib`.** Moving content around, editing text,
deleting a citation, or citing a key already used elsewhere all take effect on
reload with nothing to run.

Entries nobody cites are ignored, so the `.bib` may hold more than the
presentation uses.

## Configuration

In `citations.js`, at the top:

| Setting | Default | What it does |
| --- | --- | --- |
| `perSlide` | `8` | References per page |
| `perSlideNarrow` | `5` | References per page on a screen matching `narrow` |
| `narrow` | `'(max-width: 44rem), (max-height: 30rem)'` | Media query for a narrow screen: a phone, upright or sideways. Leave it or `perSlideNarrow` unset and `perSlide` applies everywhere |
| `heading` | `'References'` | Heading on the first reference page |
| `headingContinued` | `'References (cont.)'` | Heading on the rest |
| `placeholder` | `'[data-bib-placeholder]'` | Selector for the empty element |
| `marker` | `'[data-cite]'` | Selector for the citations |
| `popoverDelay` | `120` | Milliseconds before the reference appears |

In `citations.css`, at the top: `--bib-size`, `--bib-line`, `--bib-row-gap`,
`--bib-col-gap`, `--bib-num-width`, and `--bib-col-min` — the narrowest a column
may be before the list drops from two columns to one. The hover panel uses
`--bib-popover-width` and `--bib-popover-size`.

In `build_refs.py`, at the top: `MAX_AUTHORS` (default `3`) is how many authors
are listed before the rest become "et al.".

## What the messages mean

**`[?]` on the page** — that key has no entry. Either it is misspelled, or it is
not in the `.bib`, or the generator has not run since you added it. The console
names the key. Everything else stays correctly numbered, and the missing key is
left out of the list. The generator writes nothing at all while a cited key is
missing, so the page keeps working with the previous file.

**`Bib: reference slide 2 of 3 overflows by about 40px`** — that page holds more
references than fit at the current window size. Lower the setting the message
names — `perSlide`, or `perSlideNarrow` on a phone. It stays readable either
way, but it will look full.

The count is chosen when the page loads, because every reference page has to
exist before the deck scans its slides. If the host calls `Bib.watch` (step 5
of the install), the pages re-flow whenever the window crosses `narrow`
later, as when a phone is turned. Without it, the page keeps the count it
loaded with until you reload.

**`error: 'key' uses the abbreviation 'TIE', which has no @string
definition`** — an entry was copied in without its `@string` line. Copy that
line across too. Only cited entries are checked.

**`warning: 'key' could not convert every LaTeX command`** — the entry contains
a command the generator does not know. The warning shows how the reference will
read. Either simplify that field in the `.bib`, or add the command to
`COMMAND_CHARS` in `build_refs.py`.

## Notes

- The hover panel needs a mouse. The reference list is how it is read otherwise.
- `bib/refs.generated.js` is overwritten on every run. Change the `.bib`, not that
  file.
- `bib/refs.bib` must be saved as UTF-8. The generator says so plainly if it is not.
