/* ============================================================
   Scriptica — prezentarea practică pentru consultanță finanțări
   Navigare, încărcare progresivă a ecranelor reale și scenarii vizuale.
   ============================================================ */
(function () {
  'use strict';

  var deck = document.querySelector('[data-deck]');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.case-slide'));
  var total = slides.length;
  var current = slideFromHash();
  var progressBar = document.querySelector('[data-progress-bar]');
  var progressCount = document.querySelector('[data-progress-count]');
  var progressLabel = document.querySelector('[data-progress-label]');
  var chapter = document.querySelector('[data-chapter]');
  var nextLabel = document.querySelector('[data-next-label]');
  var prevButton = document.querySelector('[data-action="previous"]');
  var nextButton = document.querySelector('[data-action="next"]');
  var live = document.querySelector('[data-live]');
  var readyTimer = null;

  function slideFromHash() {
    var match = String(window.location.hash || '').match(/slide-(\d+)/);
    var index = match ? parseInt(match[1], 10) - 1 : 0;
    return Math.max(0, Math.min(slides.length - 1, isNaN(index) ? 0 : index));
  }

  function setHash(index) {
    var hash = '#slide-' + (index + 1);
    if (window.location.hash === hash) return;
    try { window.history.replaceState(null, '', hash); }
    catch (e) { window.location.hash = hash; }
  }

  function resizeStage() {
    var baseWidth = 1600;
    var baseHeight = 900;
    var scale = Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight);
    document.documentElement.style.setProperty('--case-scale', String(scale));
  }

  function loadFrame(frame) {
    if (!frame || frame.getAttribute('src')) return;
    frame.addEventListener('load', function () { prepareScenario(frame); });
    frame.setAttribute('src', frame.getAttribute('data-app-src'));
  }

  function loadNearby(index) {
    [index, index + 1].forEach(function (position) {
      if (!slides[position]) return;
      loadFrame(slides[position].querySelector('iframe[data-app-src]'));
    });
  }

  function retryInFrame(frame, test, attempts) {
    var remaining = attempts || 30;
    function run() {
      var doc;
      try { doc = frame.contentDocument; } catch (e) { doc = null; }
      if (doc && test(doc)) return;
      remaining--;
      if (remaining > 0) window.setTimeout(run, 120);
    }
    run();
  }

  function pulseTarget(doc, selector) {
    var target = doc.querySelector(selector);
    var style;
    if (!target) return false;
    style = doc.getElementById('case-demo-pulse-style');
    if (!style) {
      style = doc.createElement('style');
      style.id = 'case-demo-pulse-style';
      style.textContent =
        '.case-demo-pulse{outline:2px solid transparent;outline-offset:0;animation:case-demo-pulse 2600ms ease-in-out infinite;}' +
        '@keyframes case-demo-pulse{0%,100%{outline-color:transparent;outline-offset:0;}38%{outline-color:var(--color-important);outline-offset:var(--space-1);}72%{outline-color:transparent;outline-offset:var(--space-2);}}' +
        '@media (prefers-reduced-motion:reduce){.case-demo-pulse{animation:none;outline-color:var(--color-important);outline-offset:var(--space-1);}}';
      doc.head.appendChild(style);
    }
    target.classList.add('case-demo-pulse');
    return true;
  }

  function prepareFlowSequence(frame) {
    retryInFrame(frame, function (doc) {
      if (!pulseTarget(doc, '.fxv2-sequence-scroll')) return false;
      frame.setAttribute('data-scenario-ready', 'true');
      return true;
    });
  }

  function prepareClientTypeCreation(frame) {
    retryInFrame(frame, function (doc) {
      var trigger = doc.querySelector('[data-new-type]');
      if (!trigger) return false;
      pulseTarget(doc, '[data-new-type]');
      window.setTimeout(function () {
        trigger.click();
        window.setTimeout(function () {
          var dialog = doc.querySelector('.modal.is-open .modal__dialog');
          var name;
          var description;
          var singular;
          var plural;
          var vertical;
          if (!dialog) return;
          name = dialog.querySelector('[data-f="name"]');
          description = dialog.querySelector('[data-f="description"]');
          singular = dialog.querySelector('[data-f="clientLabel"]');
          plural = dialog.querySelector('[data-f="clientLabelPlural"]');
          vertical = dialog.querySelector('[data-package-vertical][value="vert_finantari"]');
          if (name) { name.value = 'Consultanță pentru finanțări nerambursabile'; dispatch(name, 'input'); }
          if (description) { description.value = 'Firme care pregătesc și urmăresc proiecte de finanțare pentru companii solicitante.'; dispatch(description, 'input'); }
          if (singular) { singular.value = 'Solicitant'; dispatch(singular, 'input'); }
          if (plural) { plural.value = 'Solicitanți'; dispatch(plural, 'input'); }
          if (vertical) { vertical.checked = true; dispatch(vertical, 'change'); }
          dialog.scrollTop = 0;
          pulseTarget(doc, '.modal.is-open .modal__dialog');
        }, 240);
      }, 700);
      frame.setAttribute('data-scenario-ready', 'true');
      return true;
    });
  }

  function prepareFlowStep(frame, scrollTop, mode) {
    retryInFrame(frame, function (doc) {
      var trigger = doc.querySelector('[data-select-step="1"]');
      if (!trigger) return false;
      trigger.click();
      window.setTimeout(function () {
        var editor = doc.querySelector('.fxv2-editor');
        if (editor && typeof scrollTop === 'number') editor.scrollTop = scrollTop;
        if (mode === 'basics') pulseTarget(doc, '.fxv2-inspector__grid .fxv2-config-card:first-child');
        if (mode === 'flow-step-tasks') pulseTarget(doc, '.fxv2-inspector__grid--content .fxv2-config-card:first-child');
        if (mode === 'flow-step-anexe') pulseTarget(doc, '.fxv2-inspector__grid--content .fxv2-config-card:last-child');
        if (mode === 'preview') {
          var preview = doc.querySelector('[data-preview-template]');
          if (preview) {
            preview.click();
            window.setTimeout(function () {
              var finalize = doc.querySelector('[data-preview-finalize]');
              if (finalize) finalize.click();
            }, 160);
          }
        }
      }, 260);
      frame.setAttribute('data-scenario-ready', 'true');
      return true;
    });
  }

  function prepareAnnexField(frame) {
    retryInFrame(frame, function (doc) {
      var field = doc.querySelector('.bfield[data-idx="4"]');
      if (!field) return false;
      field.click();
      window.setTimeout(function () {
        var selected = doc.querySelector('.bfield[data-idx="4"]');
        var canvas = doc.getElementById('builder-canvas-panel');
        var settings = doc.getElementById('builder-settings');
        if (selected && canvas) canvas.scrollTop = Math.max(0, selected.offsetTop - 80);
        if (settings) settings.scrollTop = settings.scrollHeight;
      }, 180);
      frame.setAttribute('data-scenario-ready', 'true');
      return true;
    });
  }

  function prepareScenario(frame) {
    var scenario = frame.getAttribute('data-scenario');
    if (!scenario || frame.getAttribute('data-scenario-ready') === 'true') return;
    if (scenario === 'vertical-edit') {
      retryInFrame(frame, function (doc) {
        var trigger = doc.querySelector('[data-edit-vertical="vert_finantari"]');
        if (!trigger) return false;
        trigger.click();
        window.setTimeout(function () { pulseTarget(doc, '.modal.is-open .modal__dialog'); }, 260);
        frame.setAttribute('data-scenario-ready', 'true');
        return true;
      });
    } else if (scenario === 'flow-sequence') {
      prepareFlowSequence(frame);
    } else if (scenario === 'flow-step-basics') {
      prepareFlowStep(frame, 420, 'basics');
    } else if (scenario === 'flow-step-tasks') {
      prepareFlowStep(frame, 840, scenario);
    } else if (scenario === 'flow-step-anexe') {
      prepareFlowStep(frame, 760, scenario);
    } else if (scenario === 'flow-preview-blocked') {
      prepareFlowStep(frame, null, 'preview');
    } else if (scenario === 'anexa-required-field') {
      prepareAnnexField(frame);
    } else if (scenario === 'client-type-new') {
      prepareClientTypeCreation(frame);
    } else if (scenario === 'archive-editor') {
      retryInFrame(frame, function (doc) {
        var trigger = doc.querySelector('[data-edit-archive="ct_finantari"]');
        if (!trigger) return false;
        trigger.click();
        frame.setAttribute('data-scenario-ready', 'true');
        return true;
      });
    } else if (scenario === 'enrollment-modal') {
      retryInFrame(frame, function (doc) {
        var trigger = doc.getElementById('sa-new-client');
        if (!trigger) return false;
        trigger.click();
        window.setTimeout(function () { fillEnrollment(frame); }, 80);
        frame.setAttribute('data-scenario-ready', 'true');
        return true;
      });
    }
  }

  function dispatch(el, name) {
    if (!el) return;
    var event;
    try { event = new el.ownerDocument.defaultView.Event(name, { bubbles: true }); }
    catch (e) { event = el.ownerDocument.createEvent('Event'); event.initEvent(name, true, true); }
    el.dispatchEvent(event);
  }

  function fillEnrollment(frame) {
    retryInFrame(frame, function (doc) {
      var name = doc.querySelector('[data-f="name"]');
      var type = doc.querySelector('[data-f="ctype"]');
      var tier = doc.querySelector('[data-f="tier"]');
      if (!name || !type || !tier) return false;
      name.value = 'Nord Grant Consulting S.R.L.';
      type.value = 'ct_finantari';
      tier.value = 'plus';
      dispatch(name, 'input');
      dispatch(type, 'change');
      dispatch(tier, 'change');
      return true;
    }, 20);
  }

  function activate(index, announce) {
    current = Math.max(0, Math.min(total - 1, index));
    window.clearTimeout(readyTimer);
    slides.forEach(function (slide, position) {
      var active = position === current;
      slide.classList.toggle('is-active', active);
      slide.classList.remove('is-ready');
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    if (deck) deck.classList.toggle('is-app-slide', current >= 4 && current <= 19);
    if (deck) deck.classList.toggle('is-step-detail-slide', current >= 6 && current <= 11);
    if (deck) deck.classList.toggle('is-client-type-slide', current === 13);
    loadNearby(current);
    readyTimer = window.setTimeout(function () { slides[current].classList.add('is-ready'); }, 80);
    updateControls();
    setHash(current);
    if (announce && live) live.textContent = 'Slide ' + (current + 1) + ' din ' + total + ': ' + slides[current].getAttribute('data-chapter');
  }

  function updateControls() {
    var label = slides[current].getAttribute('data-chapter') || '';
    var progress = ((current + 1) / total) * 100;
    if (progressBar) progressBar.style.width = progress + '%';
    if (progressCount) progressCount.textContent = (current + 1) + ' / ' + total;
    if (progressLabel) progressLabel.textContent = label;
    if (chapter) chapter.textContent = label;
    if (prevButton) prevButton.disabled = current === 0;
    if (nextButton) nextButton.disabled = current === total - 1;
    if (nextLabel) nextLabel.textContent = current === total - 1 ? 'Final' : 'Continuă';
  }

  function next() { if (current < total - 1) activate(current + 1, true); }
  function previous() { if (current > 0) activate(current - 1, true); }

  document.addEventListener('click', function (event) {
    var action = event.target.closest('[data-action]');
    if (!action) return;
    var name = action.getAttribute('data-action');
    if (name === 'next') next();
    else if (name === 'previous') previous();
    else if (name === 'start') activate(0, true);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault(); next();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault(); previous();
    } else if (event.key === 'Home') {
      event.preventDefault(); activate(0, true);
    } else if (event.key === 'End') {
      event.preventDefault(); activate(total - 1, true);
    }
  });

  window.addEventListener('hashchange', function () {
    var target = slideFromHash();
    if (target !== current) activate(target, false);
  });
  window.addEventListener('resize', resizeStage);

  resizeStage();
  activate(current, false);
})();
