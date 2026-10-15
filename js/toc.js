// The contents list on the opening slide.

// Built from the same sections array the rail reads, so renaming or
// re-splitting a section updates the contents slide for free. Sections with no
// name are skipped -- that is the opening title/contents pair and the closing
// slide, which have no business listing themselves.
//
// Up to TOC_ONE_COLUMN_MAX entries the list is one column; beyond that it is
// laid out in TOC_COLUMNS columns, filled down then across. Either way the
// grid needs the row count to know where each column breaks (css/toc.css).
var TOC_COLUMNS = 2;
var TOC_ONE_COLUMN_MAX = 5;

function buildToc() {
  if (!toc) {
    return;
  }

  toc.textContent = '';
  var count = 0;

  sections.forEach(function (section) {
    if (!section.name) {
      return;
    }

    var item = document.createElement('li');
    var link = document.createElement('button');
    link.type = 'button';
    link.className = 'toc-item';
    link.dataset.slide = section.first;               // an entry jumps to its section's first slide
    link.textContent = section.name;
    item.appendChild(link);
    toc.appendChild(item);
    count++;
  });

  var columns = count <= TOC_ONE_COLUMN_MAX ? 1 : TOC_COLUMNS;
  toc.style.setProperty('--toc-rows', Math.ceil(count / columns));
}
