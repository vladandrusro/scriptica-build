/* ============================================================
   Scriptica — navigarea prezentării de onboarding
   Slide-urile și dezvăluirile progresive sunt controlate separat.
   ============================================================ */

(function () {
  'use strict';

  var slides = [];
  var totalSlides = 0;
  var currentIndex = 0;
  var fragmentSteps = [];
  var touchStartX = null;
  var touchStartY = null;

  var deck;
  var previousButton;
  var nextButton;
  var nextLabel;
  var currentLabel;
  var totalLabel;
  var chapterLabel;
  var progressBar;
  var stepLabel;
  var liveRegion;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    deck = document.querySelector('.ob-deck');
    slides = Array.prototype.slice.call(document.querySelectorAll('.ob-slide'));
    totalSlides = slides.length;
    previousButton = document.querySelector('[data-action="previous"]');
    nextButton = document.querySelector('[data-action="next"]');
    nextLabel = document.querySelector('[data-next-label]');
    currentLabel = document.querySelector('[data-current]');
    totalLabel = document.querySelector('[data-total]');
    chapterLabel = document.querySelector('[data-chapter]');
    progressBar = document.querySelector('[data-progress]');
    stepLabel = document.querySelector('[data-step-label]');
    liveRegion = document.querySelector('[data-live]');

    if (!deck || !totalSlides || !previousButton || !nextButton) return;

    fragmentSteps = slides.map(function () { return 0; });
    currentIndex = indexFromHash();

    bindControls();
    bindKeyboard();
    bindPointerNavigation();
    bindTouchNavigation();
    bindRestartLinks();
    renderSlide(0, true);
  }

  function bindControls() {
    previousButton.addEventListener('click', function (event) {
      event.stopPropagation();
      previous();
    });

    nextButton.addEventListener('click', function (event) {
      event.stopPropagation();
      next();
    });
  }

  function bindKeyboard() {
    document.addEventListener('keydown', function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case 'Enter':
        case ' ':
        case 'Spacebar':
          event.preventDefault();
          next();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'Backspace':
          event.preventDefault();
          previous();
          break;
        case 'Home':
          event.preventDefault();
          goTo(0, -1, true);
          break;
        case 'End':
          event.preventDefault();
          goTo(totalSlides - 1, 1, true);
          break;
      }
    });
  }

  function bindPointerNavigation() {
    deck.addEventListener('click', function (event) {
      var target = event.target;
      var interactive = target && typeof target.closest === 'function' ? target.closest('button, a, input, [role="button"], .ob-controls') : null;
      var ratio;

      if (interactive) return;
      ratio = event.clientX / window.innerWidth;
      if (ratio >= 0.62) next();
      if (ratio <= 0.38) previous();
    });
  }

  function bindTouchNavigation() {
    deck.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    deck.addEventListener('touchend', function (event) {
      var deltaX;
      var deltaY;
      if (touchStartX === null || touchStartY === null || !event.changedTouches || !event.changedTouches.length) return;
      deltaX = event.changedTouches[0].clientX - touchStartX;
      deltaY = event.changedTouches[0].clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;
      if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY)) return;
      if (deltaX < 0) next();
      else previous();
    }, { passive: true });
  }

  function bindRestartLinks() {
    Array.prototype.slice.call(document.querySelectorAll('[data-action="start"]')).forEach(function (element) {
      element.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        resetAllFragments();
        goTo(0, -1, true);
      });
    });
  }

  function next() {
    var max = maxFragment(slides[currentIndex]);
    if (fragmentSteps[currentIndex] < max) {
      fragmentSteps[currentIndex] += 1;
      renderFragments(slides[currentIndex]);
      updateControls();
      announceFragment();
      dispatch('ob:fragmentchange', {
        slide: currentIndex + 1,
        step: fragmentSteps[currentIndex],
        direction: 1,
        element: slides[currentIndex]
      });
      return;
    }

    if (currentIndex < totalSlides - 1) goTo(currentIndex + 1, 1, false);
  }

  function previous() {
    if (fragmentSteps[currentIndex] > 0) {
      fragmentSteps[currentIndex] -= 1;
      renderFragments(slides[currentIndex]);
      updateControls();
      announceFragment();
      dispatch('ob:fragmentchange', {
        slide: currentIndex + 1,
        step: fragmentSteps[currentIndex],
        direction: -1,
        element: slides[currentIndex]
      });
      return;
    }

    if (currentIndex > 0) {
      fragmentSteps[currentIndex - 1] = maxFragment(slides[currentIndex - 1]);
      goTo(currentIndex - 1, -1, false);
    }
  }

  function goTo(index, direction, jump) {
    var oldIndex;
    if (index < 0 || index >= totalSlides || index === currentIndex && !jump) return;

    oldIndex = currentIndex;
    if (index !== currentIndex) {
      slides[oldIndex].classList.add(direction > 0 ? 'is-leaving-forward' : 'is-entering-back');
      currentIndex = index;
      if (direction > 0) fragmentSteps[currentIndex] = 0;
    }

    renderSlide(direction, jump);
  }

  function renderSlide(direction, initial) {
    slides.forEach(function (slide, index) {
      var active = index === currentIndex;
      slide.classList.toggle('is-active', active);
      slide.classList.remove('is-leaving-forward', 'is-entering-back');
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      if ('inert' in slide) slide.inert = !active;
      if (active) {
        slide.scrollTop = 0;
        renderFragments(slide);
      }
    });

    updateControls();
    updateHash();
    announceSlide();
    dispatch('ob:slidechange', {
      slide: currentIndex + 1,
      direction: direction,
      initial: Boolean(initial),
      element: slides[currentIndex]
    });
  }

  function renderFragments(slide) {
    var visibleStep = fragmentSteps[currentIndex];
    Array.prototype.slice.call(slide.querySelectorAll('[data-fragment]')).forEach(function (fragment) {
      var step = parseInt(fragment.getAttribute('data-fragment'), 10) || 0;
      fragment.classList.toggle('is-revealed', step <= visibleStep);
      fragment.setAttribute('aria-hidden', step <= visibleStep ? 'false' : 'true');
    });
  }

  function updateControls() {
    var slide = slides[currentIndex];
    var max = maxFragment(slide);
    var step = fragmentSteps[currentIndex];
    var chapter = slide.getAttribute('data-chapter') || 'Prezentare';
    var progress = ((currentIndex + 1) / totalSlides) * 100;

    previousButton.disabled = currentIndex === 0 && step === 0;
    nextButton.disabled = currentIndex === totalSlides - 1 && step >= max;

    if (step < max) nextLabel.textContent = 'Continuă';
    else if (currentIndex === totalSlides - 1) nextLabel.textContent = 'Final';
    else nextLabel.textContent = 'Slide următor';

    if (currentLabel) currentLabel.textContent = pad(currentIndex + 1);
    if (totalLabel) totalLabel.textContent = pad(totalSlides);
    if (chapterLabel) chapterLabel.textContent = chapter;
    if (stepLabel) stepLabel.textContent = chapter;
    if (progressBar) progressBar.style.width = progress + '%';
  }

  function announceSlide() {
    var heading;
    if (!liveRegion) return;
    heading = slides[currentIndex].querySelector('h1, h2');
    liveRegion.textContent = 'Slide ' + (currentIndex + 1) + ' din ' + totalSlides + '. ' + (heading ? heading.textContent : '');
  }

  function announceFragment() {
    if (!liveRegion) return;
    liveRegion.textContent = 'Detaliul ' + fragmentSteps[currentIndex] + ' din slide-ul ' + (currentIndex + 1) + '.';
  }

  function maxFragment(slide) {
    var max = 0;
    Array.prototype.slice.call(slide.querySelectorAll('[data-fragment]')).forEach(function (fragment) {
      var value = parseInt(fragment.getAttribute('data-fragment'), 10) || 0;
      if (value > max) max = value;
    });
    return max;
  }

  function indexFromHash() {
    var match = window.location.hash.match(/^#slide-(\d+)$/);
    var value = match ? parseInt(match[1], 10) - 1 : 0;
    if (value < 0 || value >= totalSlides) return 0;
    return value;
  }

  function updateHash() {
    var nextHash = '#slide-' + (currentIndex + 1);
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', nextHash);
    } else {
      window.location.hash = nextHash;
    }
  }

  function resetAllFragments() {
    fragmentSteps = slides.map(function () { return 0; });
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function dispatch(name, detail) {
    var event;
    if (typeof window.CustomEvent !== 'function') return;
    event = new CustomEvent(name, { detail: detail });
    document.dispatchEvent(event);
  }
})();
