// Every element the deck talks to, and the state saying where it currently is.
//
// LOAD ORDER: this file first, init.js last, everything between in any order.
// These files are plain scripts, not modules -- ES modules are blocked on
// file:// and would cost `start index.html` -- so they share one global scope.
// That makes order matter only for code that runs as the file is parsed, and
// all of that lives in init.js: every other file declares and nothing more.
// The one exception, js/theme-boot.js, is loaded from <head>, before any of
// these.

var page = document.querySelector('.page');           // the frame that clips the strip
var strip = document.querySelector('.slides');        // the stacked strip that gets moved
var rail = document.querySelector('.dots');
var counter = document.querySelector('.slide-counter');
var sectionLabel = document.querySelector('.section-label');
var toc = document.querySelector('.toc');             // contents list on the opening slide
var stepper = document.querySelector('.stepper');
var themeToggle = document.querySelector('.theme-toggle');
var stepButtons = stepper ? stepper.querySelectorAll('[data-step]') : [];

// The slides are the one lookup that cannot happen here. Bib.build() adds
// reference pages and can remove the placeholder, and querySelectorAll is a
// snapshot rather than a live view -- a list taken as this file is parsed would
// miss the pages added and keep the one removed. init.js calls findSlides()
// straight after Bib.build(), before anything scans the slides.
var slides = [];
var totalSlides = 0;
var currentSlide = 1;                                 // 1-based number of the visible slide
var currentSection = -1;                              // index into sections; -1 forces the first sync

function findSlides() {
  slides = document.querySelectorAll('.slide');
  totalSlides = slides.length;
}
