// The section name in the header, and the swap that carries one name out as
// the next comes in.

// The label is two spans that swap roles on every change: one carries the old
// name out while the other brings the new one in. Both are on screen together,
// which is the point -- setting textContent on a single element left the label
// empty for the first half of the change.
//
// `direction` is 1 moving forward through the deck and -1 moving back; CSS
// reads it as --exit so the name travels the same way the strip does.
var labelLayers = [document.createElement('span'), document.createElement('span')];
var labelFront = 0;

function buildLabel() {
  labelLayers.forEach(function (layer) {
    sectionLabel.appendChild(layer);
  });
}

function showSectionName(name, direction) {
  sectionLabel.style.setProperty('--exit', direction);

  var leaving = labelLayers[labelFront];
  labelFront = 1 - labelFront;
  var entering = labelLayers[labelFront];

  entering.textContent = name;
  entering.className = 'is-entering';   // parked off-screen, transitions disabled
  void entering.offsetWidth;            // commit that before animating away from it
  entering.className = '';
  entering.removeAttribute('aria-hidden');

  leaving.className = 'is-leaving';
  // The outgoing name is still in the DOM for the length of the transition;
  // hide it from the live region so the change is announced once, not twice.
  leaving.setAttribute('aria-hidden', 'true');
}
