/* ============================================================
   Scriptica — Phase 8: Presentation deck behaviour
   3-slide deck, opacity cross-fade, two-press redirect on Slide 3.
   No global namespace pollution.
   ============================================================ */

(function () {
  'use strict';

  var TOTAL_SLIDES = 3;
  var REDIRECT_TARGET = 'index.html';

  var currentSlide = 1;
  var redirectArmed = false;

  var slides = [];
  var prevArrow, nextArrow, indicator, hint;

  document.addEventListener('DOMContentLoaded', function () {
    slides = Array.prototype.slice.call(document.querySelectorAll('.prez-slide'));
    prevArrow = document.querySelector('[data-prez-prev]');
    nextArrow = document.querySelector('[data-prez-next]');
    indicator = document.querySelector('[data-prez-indicator]');
    hint = document.querySelector('[data-prez-hint]');

    if (!slides.length || !prevArrow || !nextArrow || !indicator) return;

    bindFallbacks();
    bindControls();
    bindKeyboard();
    bindViewportClicks();
    render();
  });

  function bindFallbacks() {
    slides.forEach(function (slide) {
      var wrapper = slide.querySelector('.prez-image-wrapper');
      var img = slide.querySelector('.prez-image');
      if (!wrapper || !img) return;
      img.addEventListener('error', function () {
        wrapper.classList.add('has-fallback');
      });
      if (img.complete && img.naturalWidth === 0) {
        wrapper.classList.add('has-fallback');
      }
    });
  }

  function bindControls() {
    prevArrow.addEventListener('click', function (e) {
      e.stopPropagation();
      backAction();
    });
    nextArrow.addEventListener('click', function (e) {
      e.stopPropagation();
      forwardAction();
    });
  }

  function bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          forwardAction();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          backAction();
          break;
        case 'Home':
          e.preventDefault();
          goToSlide(1);
          break;
        case 'End':
          e.preventDefault();
          goToSlide(TOTAL_SLIDES);
          break;
        case 'Escape':
          if (redirectArmed) {
            e.preventDefault();
            disarmRedirect();
          }
          break;
      }
    });
  }

  function bindViewportClicks() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && typeof t.closest === 'function' && t.closest('.prez-nav')) return;
      if (e.clientX > window.innerWidth / 2) forwardAction();
      else backAction();
    });
  }

  function forwardAction() {
    if (currentSlide < TOTAL_SLIDES) {
      goToSlide(currentSlide + 1);
      return;
    }
    if (currentSlide === TOTAL_SLIDES) {
      if (!redirectArmed) {
        armRedirect();
      } else {
        window.location.href = REDIRECT_TARGET;
      }
    }
  }

  function backAction() {
    if (redirectArmed) {
      disarmRedirect();
      goToSlide(currentSlide - 1);
      return;
    }
    if (currentSlide > 1) goToSlide(currentSlide - 1);
  }

  function goToSlide(n) {
    if (n < 1 || n > TOTAL_SLIDES) return;
    if (currentSlide === TOTAL_SLIDES && n !== TOTAL_SLIDES) disarmRedirect();
    currentSlide = n;
    render();
  }

  function armRedirect() {
    redirectArmed = true;
    if (hint) hint.classList.add('prez-hint--visible');
  }

  function disarmRedirect() {
    redirectArmed = false;
    if (hint) hint.classList.remove('prez-hint--visible');
  }

  function render() {
    slides.forEach(function (el, i) {
      el.classList.toggle('is-active', i + 1 === currentSlide);
    });
    indicator.textContent = currentSlide + ' / ' + TOTAL_SLIDES;
    prevArrow.classList.toggle('prez-nav-arrow--disabled', currentSlide === 1);
    prevArrow.setAttribute('aria-disabled', currentSlide === 1 ? 'true' : 'false');
  }
})();
