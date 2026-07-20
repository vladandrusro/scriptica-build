/* ============================================================
   Scriptica — regia vizuală a prezentării de onboarding
   Folosește doar transform și opacity pentru mișcare fluidă.
   ============================================================ */

(function () {
  'use strict';

  var roleTimer = null;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    prepareDrawPaths(document);
    bindSpotlight();
  });

  document.addEventListener('ob:slidechange', function (event) {
    var slide = event.detail && event.detail.element;
    var scene;
    stopRoleCycle();
    if (!slide) return;
    scene = slide.getAttribute('data-scene');
    animateSlideEntrance(slide);
    animateVisiblePaths(slide);
    if (scene === 'heart') animateHeart(slide);
    if (scene === 'friction') animateFriction(slide);
    if (scene === 'workspace' && slide.querySelector('.ob-role-switch.is-revealed')) startRoleCycle(slide);
  });

  document.addEventListener('ob:fragmentchange', function (event) {
    var detail = event.detail || {};
    var slide = detail.element;
    var selector;
    var fragments;
    if (!slide || detail.direction < 0) return;

    selector = '[data-fragment="' + detail.step + '"]';
    fragments = Array.prototype.slice.call(slide.querySelectorAll(selector));
    fragments.forEach(function (fragment) {
      animateFragment(fragment);
      animateVisiblePaths(fragment);
    });

    if (slide.getAttribute('data-scene') === 'workspace' && detail.step === 2) startRoleCycle(slide);
  });

  function prepareDrawPaths(root) {
    Array.prototype.slice.call(root.querySelectorAll('[data-draw]')).forEach(function (path) {
      var length = safePathLength(path);
      if (!length) return;
      path.style.strokeDasharray = length + ' ' + length;
      path.style.strokeDashoffset = length;
      path.setAttribute('data-path-length', String(length));
    });
  }

  function animateVisiblePaths(root) {
    Array.prototype.slice.call(root.querySelectorAll('[data-draw]')).forEach(function (path, index) {
      var hiddenParent = path.closest && path.closest('.fragment:not(.is-revealed)');
      if (hiddenParent) return;
      drawPath(path, index * 80);
    });
  }

  function drawPath(path, delay) {
    var length = parseFloat(path.getAttribute('data-path-length')) || safePathLength(path);
    if (!length) return;

    path.style.strokeDasharray = length + ' ' + length;
    if (reducedMotion || typeof path.animate !== 'function') {
      path.style.strokeDashoffset = '0';
      return;
    }

    path.getAnimations().forEach(function (animation) { animation.cancel(); });
    path.style.strokeDashoffset = length;
    path.animate([
      { strokeDashoffset: length, opacity: 0.25 },
      { strokeDashoffset: 0, opacity: 1 }
    ], {
      duration: 1100,
      delay: delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards'
    });
  }

  function animateSlideEntrance(slide) {
    var copy = slide.querySelector('.ob-heading, .ob-hero-copy, .ob-final-copy h2');
    if (!copy || reducedMotion || typeof copy.animate !== 'function') return;
    copy.animate([
      { opacity: 0, transform: 'translateY(22px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: 720,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
  }

  function animateHeart(slide) {
    var nodes = Array.prototype.slice.call(slide.querySelectorAll('.ob-heart-node'));
    if (reducedMotion) return;
    nodes.forEach(function (node, index) {
      if (typeof node.animate !== 'function') return;
      node.animate([
        { opacity: 0, transform: 'translateY(20px) scale(0.78)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], {
        duration: 680,
        delay: 180 + index * 90,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'both'
      });
    });
  }

  function animateFriction(slide) {
    var before = Array.prototype.slice.call(slide.querySelectorAll('.ob-friction-panel--before article'));
    var after = Array.prototype.slice.call(slide.querySelectorAll('.ob-friction-panel--after article'));
    if (reducedMotion) return;
    before.forEach(function (item, index) {
      animateFrictionItem(item, index, -28);
    });
    after.forEach(function (item, index) {
      animateFrictionItem(item, index, 28);
    });
  }

  function animateFrictionItem(item, index, offset) {
    if (typeof item.animate !== 'function') return;
    item.animate([
      { opacity: 0, transform: 'translateX(' + offset + 'px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], {
      duration: 620,
      delay: 160 + index * 110,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
  }

  function animateFragment(fragment) {
    var mode = fragment.getAttribute('data-animate') || 'rise';
    var children;
    if (reducedMotion || typeof fragment.animate !== 'function') return;

    if (mode === 'stagger' || mode === 'checklist' || mode === 'timeline' || mode === 'snap' || mode === 'archive' || mode === 'sort') {
      children = directAnimatedChildren(fragment);
      children.forEach(function (child, index) {
        child.animate(keyframesFor(mode), {
          duration: mode === 'timeline' ? 760 : 620,
          delay: index * (mode === 'timeline' ? 150 : 85),
          easing: mode === 'snap' ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both'
        });
      });
      return;
    }

    fragment.animate(keyframesFor(mode), {
      duration: mode === 'spotlight' ? 900 : 620,
      easing: mode === 'pulse' ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
  }

  function directAnimatedChildren(fragment) {
    var selector = ':scope > article, :scope > div, :scope > span';
    var nodes;
    try {
      nodes = Array.prototype.slice.call(fragment.querySelectorAll(selector));
    } catch (error) {
      nodes = Array.prototype.slice.call(fragment.children);
    }
    return nodes.length ? nodes : [fragment];
  }

  function keyframesFor(mode) {
    if (mode === 'pulse') {
      return [
        { opacity: 0, transform: 'scale(0.72)' },
        { opacity: 1, transform: 'scale(1.06)', offset: 0.72 },
        { opacity: 1, transform: 'scale(1)' }
      ];
    }
    if (mode === 'spotlight') {
      return [
        { opacity: 0, transform: 'scale(0.96)', filter: 'brightness(0.65)' },
        { opacity: 1, transform: 'scale(1.025)', filter: 'brightness(1.16)', offset: 0.7 },
        { opacity: 1, transform: 'scale(1)', filter: 'brightness(1)' }
      ];
    }
    if (mode === 'timeline') {
      return [
        { opacity: 0, transform: 'translateY(48px) scale(0.7)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ];
    }
    if (mode === 'snap') {
      return [
        { opacity: 0, transform: 'translateY(-64px) scale(0.78) rotate(-3deg)' },
        { opacity: 1, transform: 'translateY(0) scale(1) rotate(0)' }
      ];
    }
    if (mode === 'sort' || mode === 'archive') {
      return [
        { opacity: 0, transform: 'translateX(-34px) scale(0.92)' },
        { opacity: 1, transform: 'translateX(0) scale(1)' }
      ];
    }
    return [
      { opacity: 0, transform: 'translateY(24px) scale(0.97)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' }
    ];
  }

  function startRoleCycle(slide) {
    var cards = Array.prototype.slice.call(slide.querySelectorAll('.ob-role-switch article'));
    var index = 0;
    stopRoleCycle();
    if (cards.length < 2 || reducedMotion) return;
    roleTimer = window.setInterval(function () {
      if (!slide.classList.contains('is-active')) {
        stopRoleCycle();
        return;
      }
      index = (index + 1) % cards.length;
      cards.forEach(function (card, cardIndex) {
        card.classList.toggle('is-selected', cardIndex === index);
      });
    }, 2200);
  }

  function stopRoleCycle() {
    if (roleTimer === null) return;
    window.clearInterval(roleTimer);
    roleTimer = null;
  }

  function bindSpotlight() {
    var deck = document.querySelector('.ob-deck');
    if (!deck || reducedMotion) return;
    deck.addEventListener('pointermove', function (event) {
      var x = Math.round((event.clientX / window.innerWidth) * 100);
      var y = Math.round((event.clientY / window.innerHeight) * 100);
      deck.style.setProperty('--ob-spot-x', x + '%');
      deck.style.setProperty('--ob-spot-y', y + '%');
    }, { passive: true });
  }

  function safePathLength(path) {
    try {
      return Math.ceil(path.getTotalLength());
    } catch (error) {
      return 0;
    }
  }
})();
