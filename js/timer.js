/* ============================================================
   Scriptica — Shared timer module (Phase 4c)
   Persists the ACTIVE running timer in localStorage so the pill
   survives navigation and reloads. Completed sessions are pushed
   into SCRIPTICA_MOCK.timeSessions (in-memory).
   ============================================================ */

(function () {
  'use strict';

  var KEY = 'scriptica.activeTimer';
  var intervalId = null;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function write(timer) {
    try { localStorage.setItem(KEY, JSON.stringify(timer)); } catch (e) {}
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function formatElapsed(startedAt) {
    var elapsed = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    var hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    var mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    var ss = String(elapsed % 60).padStart(2, '0');
    return { hh: hh, mm: mm, ss: ss, totalSeconds: elapsed };
  }

  function renderPill() {
    var el = document.getElementById('header-timer');
    if (!el) return;
    var t = read();
    if (!t) {
      el.hidden = true;
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      return;
    }
    el.hidden = false;

    var link = el.querySelector('.timer-pill');
    if (link) link.href = 'situatie-detaliu.html?id=' + encodeURIComponent(t.situationId);

    var taskEl = el.querySelector('.timer-pill__task');
    if (taskEl) {
      taskEl.textContent = t.taskLabels.length === 1 ?
        t.taskLabels[0] :
        t.taskLabels[0] + ' + ' + (t.taskLabels.length - 1);
    }
    var clientEl = el.querySelector('.timer-pill__client');
    if (clientEl) clientEl.textContent = t.clientCompany || '';

    function tick() {
      var e = formatElapsed(t.startedAt);
      var timeEl = el.querySelector('.timer-pill__time');
      if (timeEl) timeEl.textContent = e.hh + ':' + e.mm + ':' + e.ss;
    }
    tick();
    if (!intervalId) intervalId = setInterval(tick, 1000);

    var stopBtn = el.querySelector('.timer-pill__stop');
    if (stopBtn) {
      stopBtn.onclick = function (ev) {
        ev.preventDefault();
        stop();
      };
    }
  }

  function start(data) {
    var timer = {
      situationId: data.situationId,
      clientCompany: data.clientCompany,
      typeLabel: data.typeLabel,
      taskIds: data.taskIds,
      taskLabels: data.taskLabels,
      startedAt: new Date().toISOString()
    };
    write(timer);
    renderPill();
    window.dispatchEvent(new CustomEvent('scriptica:timer-started', { detail: timer }));
  }

  function stop() {
    var t = read();
    if (!t) return null;
    var e = formatElapsed(t.startedAt);
    var total = Math.max(1, e.totalSeconds);
    var per = Math.floor(total / Math.max(1, t.taskIds.length));

    var newSession = {
      id: Date.now(),
      userId: (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.currentUserId) || 1,
      situationId: t.situationId,
      clientCompany: t.clientCompany,
      typeLabel: t.typeLabel,
      taskIds: t.taskIds,
      taskLabels: t.taskLabels,
      startedAt: t.startedAt,
      endedAt: new Date().toISOString(),
      durationSeconds: total,
      perTaskSeconds: per,
      observation: ''
    };
    if (window.SCRIPTICA_MOCK && Array.isArray(window.SCRIPTICA_MOCK.timeSessions)) {
      window.SCRIPTICA_MOCK.timeSessions.unshift(newSession);
    }
    clear();
    renderPill();

    var minutes = Math.max(1, Math.round(total / 60));
    var taskWord = t.taskLabels.length > 1 ? 'task-uri' : 'task';
    if (window.SCRIPTICA_TOAST) {
      window.SCRIPTICA_TOAST('success',
        'Sesiune salvată: ' + minutes + ' minute pentru ' + t.taskLabels.length + ' ' + taskWord + '.');
    }
    window.dispatchEvent(new CustomEvent('scriptica:timer-stopped', { detail: newSession }));
    return newSession;
  }

  window.ScripticaTimer = {
    start: start,
    stop: stop,
    read: read,
    clear: clear,
    renderPill: renderPill,
    formatElapsed: formatElapsed
  };

  document.addEventListener('DOMContentLoaded', renderPill);

  // Cross-tab sync
  window.addEventListener('storage', function (ev) {
    if (ev.key === KEY) renderPill();
  });
})();
