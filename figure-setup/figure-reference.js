/* ============================================================
   figure-reference.js -- writes figure numbers into the text
   ============================================================
   Full documentation: README.md in this folder.

   Run it after the figures are in the DOM: with defer in <head>,
     <script src="figure-setup/figure-reference.js" defer></script>
   or without it at the end of <body>.
   ============================================================ */


/* Wrapped in a function that runs immediately, an IIFE, so
   nothing here becomes a global name and it cannot clash with
   another script on the page. */
(function () {

  /* false turns every reference into plain text */
  const FIG_REF_CLICKABLE = true;

  /* The label comes from --fig-label so captions and
     references always agree. */
  const label = getComputedStyle(document.documentElement)
    .getPropertyValue("--fig-label")
    .trim()
    .replace(/^"|"$/g, "");

  /* A CSS counter cannot be read from JavaScript, so count the
     figures the same way figure-style.css does: one per caption
     that is drawn. A caption with no box -- fig-no-caption, or
     inside anything set to display: none -- is skipped by the
     counter, and so here, which keeps these numbers matched to
     the ones on screen. */
  const numbers = new Map();
  let n = 0;

  document.querySelectorAll(".fig figcaption").forEach((caption) => {
    if (!caption.getClientRects().length) return;
    n += 1;
    const figure = caption.closest(".fig");
    if (figure && figure.id) numbers.set(figure.id, n);
  });

  /* Fill each reference; an unknown target prints ?? */
  document.querySelectorAll("a.fig-ref").forEach((ref) => {
    const id = ref.getAttribute("href").slice(1);
    const num = numbers.get(id);
    ref.textContent = label + (num !== undefined ? num : "??");
    if (!FIG_REF_CLICKABLE) ref.removeAttribute("href");
  });

  /* A fig-h figure is sized by width once its proportions are
     known, so its height gives way when the width runs out
     (figure-style.css, section 3). The ratio is read from the
     file itself, when it has loaded. */
  document.querySelectorAll(".fig.fig-h").forEach((figure) => {
    const img = figure.querySelector("img");
    if (!img) return;
    const apply = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      figure.style.setProperty("--fig-ratio", img.naturalWidth / img.naturalHeight);
      figure.classList.add("fig-has-ratio");
    };
    if (img.complete) apply();
    else img.addEventListener("load", apply, { once: true });
  });

})();
