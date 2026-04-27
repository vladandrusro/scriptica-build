/* ============================================================
   Scriptica — Time Tracking page (Phase 4c)
   Month navigator, total card, daily bar chart, filters,
   sessions table with pagination, edit-session modal.
   Today is hardcoded to 2026-04-20 per prototype spec.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  if (!MOCK || !document.getElementById('tt-main')) return;

  var TODAY = new Date(2026, 3, 20); // month is 0-indexed → April

  var MONTH_NAMES = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie',
                     'Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

  var state = {
    year: TODAY.getFullYear(),
    month: TODAY.getMonth(),
    filters: { client: '', situationLabel: '', task: '', period: 'month' },
    pageSize: 10,
    page: 1,
    editingId: null
  };

  document.addEventListener('DOMContentLoaded', function () {
    populateStaticFilterOptions();
    bindHeaderNav();
    bindFilters();
    render();
    window.addEventListener('scriptica:timer-stopped', render);
    window.addEventListener('scriptica:timer-started', render);
  });

  /* ---------- Month navigation ---------- */

  function bindHeaderNav() {
    document.getElementById('tt-prev').addEventListener('click', function () {
      var m = state.month - 1;
      var y = state.year;
      if (m < 0) { m = 11; y--; }
      state.year = y; state.month = m;
      state.filters.period = 'month';
      document.getElementById('tt-f-period').value = 'month';
      state.page = 1;
      render();
    });
    document.getElementById('tt-next').addEventListener('click', function () {
      var m = state.month + 1;
      var y = state.year;
      if (m > 11) { m = 0; y++; }
      // Don't allow months past TODAY's month
      if (y > TODAY.getFullYear() || (y === TODAY.getFullYear() && m > TODAY.getMonth())) return;
      state.year = y; state.month = m;
      state.filters.period = 'month';
      document.getElementById('tt-f-period').value = 'month';
      state.page = 1;
      render();
    });
  }

  /* ---------- Filters ---------- */

  function populateStaticFilterOptions() {
    var sessions = mySessions();

    var clients = unique(sessions.map(function (s) { return s.clientCompany; }));
    var situations = unique(sessions.map(function (s) { return s.typeLabel; }));
    var tasks = unique(
      sessions.reduce(function (arr, s) { return arr.concat(s.taskLabels || []); }, [])
    );

    fillSelect('#tt-f-client',    [{ v: '', t: 'Toți clienții' }].concat(clients.map(function (c) { return { v: c, t: c }; })));
    fillSelect('#tt-f-situation', [{ v: '', t: 'Toate situațiile' }].concat(situations.map(function (s) { return { v: s, t: s }; })));
    fillSelect('#tt-f-task',      [{ v: '', t: 'Toate task-urile' }].concat(tasks.map(function (t) { return { v: t, t: t }; })));
  }

  function fillSelect(sel, opts) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.innerHTML = opts.map(function (o) { return '<option value="' + esc(o.v) + '">' + esc(o.t) + '</option>'; }).join('');
  }

  function bindFilters() {
    bind('#tt-f-client',    function (v) { state.filters.client = v; });
    bind('#tt-f-situation', function (v) { state.filters.situationLabel = v; });
    bind('#tt-f-task',      function (v) { state.filters.task = v; });
    bind('#tt-f-period',    function (v) { state.filters.period = v; });
  }

  function bind(sel, cb) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.addEventListener('change', function () {
      cb(el.value);
      state.page = 1;
      render();
    });
  }

  /* ---------- Data selection ---------- */

  function mySessions() {
    return (MOCK.timeSessions || []).filter(function (s) { return s.userId === (MOCK.currentUserId || 1); });
  }

  function periodRange() {
    // Returns {start, end} Date objects covering the period (inclusive start, exclusive end)
    var p = state.filters.period;
    if (p === 'today') {
      var s = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
      var e = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + 1);
      return { start: s, end: e };
    }
    if (p === 'week') {
      // Week starts Monday
      var d = new Date(TODAY);
      var day = d.getDay() || 7; // 1..7, Sunday=7
      var s2 = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (day - 1));
      var e2 = new Date(s2.getFullYear(), s2.getMonth(), s2.getDate() + 7);
      return { start: s2, end: e2 };
    }
    if (p === 'prevmonth') {
      var y = state.year;
      var m = state.month - 1;
      if (m < 0) { m = 11; y--; }
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
    }
    // month (default) — uses the current state year/month
    return {
      start: new Date(state.year, state.month, 1),
      end: new Date(state.year, state.month + 1, 1)
    };
  }

  function sessionsInPeriod() {
    var r = periodRange();
    return mySessions().filter(function (s) {
      var d = new Date(s.startedAt);
      return d >= r.start && d < r.end;
    });
  }

  function filteredSessions() {
    var f = state.filters;
    return sessionsInPeriod().filter(function (s) {
      if (f.client && s.clientCompany !== f.client) return false;
      if (f.situationLabel && s.typeLabel !== f.situationLabel) return false;
      if (f.task && (s.taskLabels || []).indexOf(f.task) === -1) return false;
      return true;
    });
  }

  /* ---------- Render ---------- */

  function render() {
    renderMonthLabel();
    renderTotal();
    renderChart();
    renderSessionsTable();
  }

  function renderMonthLabel() {
    document.getElementById('tt-month-label').textContent =
      MONTH_NAMES[state.month] + ' ' + state.year;
    // Next button disabled if already on today's month
    var next = document.getElementById('tt-next');
    var atLatest = (state.year === TODAY.getFullYear() && state.month === TODAY.getMonth());
    next.disabled = atLatest;
    next.style.opacity = atLatest ? '0.45' : '';
    next.style.cursor = atLatest ? 'not-allowed' : '';
  }

  function renderTotal() {
    var sessions = filteredSessions();
    var totalSec = sessions.reduce(function (sum, s) { return sum + (s.durationSeconds || 0); }, 0);
    var days = new Set(sessions.map(function (s) { return s.startedAt.split('T')[0]; })).size;
    document.getElementById('tt-total-value').textContent = formatDuration(totalSec);
    document.getElementById('tt-total-days').textContent = 'pe ' + days + ' zile lucrate';
  }

  function renderChart() {
    var wrap = document.getElementById('tt-chart');
    if (!wrap) return;

    // Always draw the chart against the currently selected MONTH (not period filter)
    var daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
    var monthSessions = mySessions().filter(function (s) {
      if (state.filters.client && s.clientCompany !== state.filters.client) return false;
      if (state.filters.situationLabel && s.typeLabel !== state.filters.situationLabel) return false;
      if (state.filters.task && (s.taskLabels || []).indexOf(state.filters.task) === -1) return false;
      var d = new Date(s.startedAt);
      return d.getFullYear() === state.year && d.getMonth() === state.month;
    });

    var byDay = {};
    monthSessions.forEach(function (s) {
      var d = new Date(s.startedAt);
      var key = d.getDate();
      byDay[key] = (byDay[key] || 0) + s.durationSeconds;
    });

    var max = 0;
    for (var i = 1; i <= daysInMonth; i++) if ((byDay[i] || 0) > max) max = byDay[i];
    // Round max up to nearest hour for gridlines
    var maxHours = Math.max(1, Math.ceil(max / 3600));

    var gridHours = computeGrid(maxHours);

    var bars = '';
    var xLabels = '';
    for (var day = 1; day <= daysInMonth; day++) {
      var secs = byDay[day] || 0;
      var pct = max > 0 ? (secs / (gridHours * 3600)) * 100 : 0;
      var date = new Date(state.year, state.month, day);
      var dow = date.getDay(); // 0 Sunday, 6 Saturday
      var isWeekend = (dow === 0 || dow === 6);
      var isToday = (date.getFullYear() === TODAY.getFullYear() &&
                     date.getMonth() === TODAY.getMonth() &&
                     date.getDate() === TODAY.getDate());

      var classes = 'tt-chart__bar';
      if (!secs) classes += ' tt-chart__bar--empty';
      if (isWeekend) classes += ' tt-chart__bar--weekend';
      if (isToday) classes += ' tt-chart__bar--today';

      var h = Math.floor(secs / 3600);
      var m = Math.floor((secs % 3600) / 60);
      var tooltip = day + '.' + pad(state.month + 1) + '.' + state.year + ': ' + h + 'h ' + m + 'm';

      var fillHeight = secs > 0 ? Math.max(2, pct) : 0;
      bars += '<div class="' + classes + '" title="' + esc(tooltip) + '">' +
        '<div class="tt-chart__bar-fill" style="height:' + fillHeight + '%;"></div>' +
      '</div>';

      var showLabel = (day === 1 || day % 5 === 0 || day === daysInMonth);
      xLabels += '<div class="tt-chart__x-label' + (showLabel ? '' : ' tt-chart__x-label-blank') + '">' +
        (showLabel ? day : '.') +
      '</div>';
    }

    var yAxisLabels = '';
    var gridLines = '';
    for (var g = gridHours; g >= 0; g--) {
      yAxisLabels += '<span>' + g + 'h</span>';
      var topPct = ((gridHours - g) / gridHours) * 100;
      gridLines += '<div class="tt-chart__gridline" style="top:' + topPct + '%;"></div>';
    }

    wrap.innerHTML =
      '<div class="tt-chart">' +
        '<div class="tt-chart__y-axis">' + yAxisLabels + '</div>' +
        '<div>' +
          '<div class="tt-chart__canvas">' +
            '<div class="tt-chart__gridlines">' + gridLines + '</div>' +
            '<div class="tt-chart__bars">' + bars + '</div>' +
          '</div>' +
          '<div class="tt-chart__x-labels">' + xLabels + '</div>' +
        '</div>' +
      '</div>';
  }

  function computeGrid(maxHours) {
    // Pick a nice ceiling that produces 4–5 gridlines
    if (maxHours <= 2) return 2;
    if (maxHours <= 4) return 4;
    if (maxHours <= 6) return 6;
    if (maxHours <= 8) return 8;
    return Math.ceil(maxHours / 2) * 2;
  }

  /* ---------- Sessions table ---------- */

  function renderSessionsTable() {
    var wrap = document.getElementById('sessions-table-wrap');
    var filtered = filteredSessions().slice().sort(function (a, b) {
      return new Date(b.startedAt) - new Date(a.startedAt);
    });

    if (!filtered.length) {
      wrap.innerHTML =
        '<div class="sessions-table-wrap"><div class="sessions-empty">' +
          '<span class="material-symbols-outlined" aria-hidden="true">schedule</span>' +
          '<p>Nicio sesiune înregistrată pentru filtrele selectate.</p>' +
          '<a href="#" id="tt-reset">Resetează filtrele</a>' +
        '</div></div>';
      document.getElementById('sessions-pagination').innerHTML = '';
      var resetBtn = document.getElementById('tt-reset');
      if (resetBtn) resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        state.filters = { client: '', situationLabel: '', task: '', period: 'month' };
        document.getElementById('tt-f-client').value = '';
        document.getElementById('tt-f-situation').value = '';
        document.getElementById('tt-f-task').value = '';
        document.getElementById('tt-f-period').value = 'month';
        state.page = 1;
        render();
      });
      return;
    }

    var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageItems = filtered.slice(start, start + state.pageSize);

    wrap.innerHTML =
      '<div class="sessions-table-wrap">' +
        '<table class="sessions-table"><thead><tr>' +
          '<th style="width:160px;">Data</th>' +
          '<th>Client</th>' +
          '<th>Situație</th>' +
          '<th>Acțiuni</th>' +
          '<th style="width:100px;">Durată</th>' +
          '<th>Observație</th>' +
        '</tr></thead><tbody>' +
          pageItems.map(sessionRowHtml).join('') +
        '</tbody></table>' +
      '</div>';

    wrap.querySelectorAll('[data-session-id]').forEach(function (row) {
      row.addEventListener('click', function () {
        openSessionEditModal(parseInt(row.getAttribute('data-session-id'), 10));
      });
    });

    renderPagination(filtered.length, totalPages);
  }

  function sessionRowHtml(s) {
    var date = new Date(s.startedAt);
    var dateStr = pad(date.getDate()) + '.' + pad(date.getMonth() + 1) + '.' + date.getFullYear() +
      ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    var labels = s.taskLabels || [];
    var tasksText;
    if (labels.length <= 2) tasksText = labels.join(', ');
    else tasksText = labels.slice(0, 2).join(', ') + ', +' + (labels.length - 2) + ' more';
    return '<tr class="sessions-row" data-session-id="' + s.id + '" title="' + esc(labels.join(', ')) + '">' +
      '<td class="sessions-cell--date">' + esc(dateStr) + '</td>' +
      '<td>' + esc(s.clientCompany) + '</td>' +
      '<td>' + esc(s.typeLabel) + '</td>' +
      '<td>' + esc(tasksText) + '</td>' +
      '<td class="sessions-cell--dur">' + formatDuration(s.durationSeconds) + '</td>' +
      '<td class="sessions-cell--obs" title="' + esc(s.observation || '') + '">' + esc(s.observation || '') + '</td>' +
    '</tr>';
  }

  function renderPagination(total, totalPages) {
    var container = document.getElementById('sessions-pagination');
    if (!container) return;

    var sizeHtml = [5, 10, 20].map(function (n) {
      return '<button type="button" class="size-pill' + (state.pageSize === n ? ' is-active' : '') +
        '" data-size="' + n + '">' + n + '</button>';
    }).join('');

    var info = 'Pagina ' + state.page + ' din ' + totalPages + ' (' + total + ' elemente)';

    var nums = pageNumbers(state.page, totalPages).map(function (n) {
      if (n === '...') return '<span class="page-ellipsis">…</span>';
      return '<button type="button" class="page-pill' + (state.page === n ? ' is-active' : '') +
        '" data-page="' + n + '">' + n + '</button>';
    }).join('');

    container.innerHTML =
      '<div class="pagination__left">' +
        '<span class="pagination__info">Număr intrări afișate:</span>' +
        sizeHtml +
      '</div>' +
      '<div class="pagination__right">' +
        '<span class="pagination__info">' + info + '</span>' +
        '<button type="button" class="page-pill page-nav" data-nav="prev"' + (state.page === 1 ? ' disabled' : '') + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>' +
        '</button>' +
        nums +
        '<button type="button" class="page-pill page-nav" data-nav="next"' + (state.page === totalPages ? ' disabled' : '') + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>' +
        '</button>' +
      '</div>';

    container.querySelectorAll('[data-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.pageSize = parseInt(btn.getAttribute('data-size'), 10);
        state.page = 1;
        render();
      });
    });
    container.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.page = parseInt(btn.getAttribute('data-page'), 10);
        render();
      });
    });
    container.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('data-nav') === 'prev') state.page = Math.max(1, state.page - 1);
        else state.page = Math.min(totalPages, state.page + 1);
        render();
      });
    });
  }

  function pageNumbers(cur, tot) {
    if (tot <= 5) {
      var out = [];
      for (var i = 1; i <= tot; i++) out.push(i);
      return out;
    }
    if (cur <= 3) return [1, 2, 3, 4, '...', tot];
    if (cur >= tot - 2) return [1, '...', tot - 3, tot - 2, tot - 1, tot];
    return [1, '...', cur - 1, cur, cur + 1, '...', tot];
  }

  /* ---------- Edit session modal ---------- */

  function openSessionEditModal(id) {
    var modal = document.getElementById('modal-session-edit');
    if (!modal) return;
    var session = MOCK.timeSessions.find(function (s) { return s.id === id; });
    if (!session) return;

    state.editingId = id;

    var startDate = new Date(session.startedAt);
    var subtitle = pad(startDate.getDate()) + '.' + pad(startDate.getMonth() + 1) + '.' + startDate.getFullYear() +
      ' · durată originală ' + formatDuration(session.durationSeconds);
    modal.querySelector('[data-session-subtitle]').textContent = subtitle;

    var totalMinutes = Math.max(1, Math.round(session.durationSeconds / 60));
    var hoursInput = modal.querySelector('[name="hours"]');
    var minutesInput = modal.querySelector('[name="minutes"]');
    hoursInput.value = Math.floor(totalMinutes / 60);
    minutesInput.value = totalMinutes % 60;

    // Steppers
    modal.querySelectorAll('[data-time-step]').forEach(function (btn) {
      btn.onclick = function () {
        var type = btn.getAttribute('data-time-step');
        if (type === 'hours-up')   hoursInput.value = Math.min(24, parseInt(hoursInput.value || '0', 10) + 1);
        if (type === 'hours-down') hoursInput.value = Math.max(0,  parseInt(hoursInput.value || '0', 10) - 1);
        if (type === 'minutes-up') {
          var m = Math.min(59, parseInt(minutesInput.value || '0', 10) + 5);
          minutesInput.value = m;
        }
        if (type === 'minutes-down') {
          var m2 = parseInt(minutesInput.value || '0', 10) - 5;
          if (m2 < 0) m2 = 0;
          minutesInput.value = m2;
        }
      };
    });

    // Task list — built from the situation's current-step tasks (fall back to session's own labels)
    var sit = (MOCK.situations || []).find(function (x) { return x.id === session.situationId; });
    var stepKey = sit ? 'step' + sit.currentStep : null;
    var availableTasks = (sit && sit.tasks && sit.tasks[stepKey]) ? sit.tasks[stepKey] : [];
    // Also include any tasks associated with the session but not in the available list (e.g., already completed)
    (session.taskIds || []).forEach(function (tid) {
      if (!availableTasks.find(function (t) { return t.id === tid; })) {
        availableTasks.push({
          id: tid,
          label: session.taskLabels[session.taskIds.indexOf(tid)] || ('Task #' + tid),
          completed: true
        });
      }
    });

    var listEl = modal.querySelector('#session-tasks-list');
    listEl.innerHTML = availableTasks.map(function (t) {
      var checked = (session.taskIds || []).indexOf(t.id) !== -1 ? ' checked' : '';
      return '<label class="picker-item">' +
        '<input type="checkbox" data-task-edit="' + t.id + '"' + checked + '>' +
        '<span class="picker-item__label">' + esc(t.label) + '</span>' +
      '</label>';
    }).join('');

    modal.querySelector('#session-obs').value = session.observation || '';

    var closeBtn = modal.querySelector('[data-modal-close]');
    var cancelBtn = modal.querySelector('[data-session-cancel]');
    var saveBtn = modal.querySelector('[data-session-save]');
    var delBtn = modal.querySelector('[data-session-delete]');

    function cleanup() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      modal.removeEventListener('click', onBackdrop);
    }
    function onKey(e) {
      if (e.key === 'Escape') cleanup();
      else if (e.key === 'Tab') trapFocus(e, modal.querySelector('.modal__dialog'));
    }
    function onBackdrop(e) { if (e.target === modal) cleanup(); }

    closeBtn.onclick = cleanup;
    cancelBtn.onclick = cleanup;
    saveBtn.onclick = function () {
      var h = Math.max(0, Math.min(24, parseInt(hoursInput.value || '0', 10)));
      var m = Math.max(0, Math.min(59, parseInt(minutesInput.value || '0', 10)));
      var total = h * 3600 + m * 60;
      if (total < 60) { showToast('error', 'Durata minimă este de 1 minut.'); return; }

      var newTaskIds = [];
      var newTaskLabels = [];
      listEl.querySelectorAll('[data-task-edit]').forEach(function (cb) {
        if (cb.checked) {
          var tid = parseInt(cb.getAttribute('data-task-edit'), 10);
          newTaskIds.push(tid);
          var label = availableTasks.find(function (t) { return t.id === tid; });
          newTaskLabels.push(label ? label.label : 'Task #' + tid);
        }
      });
      if (!newTaskIds.length) { showToast('error', 'Selectează cel puțin un task.'); return; }

      session.durationSeconds = total;
      session.perTaskSeconds = Math.floor(total / newTaskIds.length);
      session.taskIds = newTaskIds;
      session.taskLabels = newTaskLabels;
      session.observation = modal.querySelector('#session-obs').value.trim();
      // Update endedAt to maintain startedAt + duration relationship
      session.endedAt = new Date(new Date(session.startedAt).getTime() + total * 1000).toISOString();

      cleanup();
      showToast('success', 'Sesiune actualizată.');
      render();
    };
    delBtn.onclick = function () {
      var ok = confirm('Șterge această sesiune? Acțiunea nu poate fi revocată.');
      if (!ok) return;
      var idx = MOCK.timeSessions.indexOf(session);
      if (idx >= 0) MOCK.timeSessions.splice(idx, 1);
      cleanup();
      showToast('info', 'Sesiune ștearsă.');
      render();
    };

    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { hoursInput.focus(); }, 0);
  }

  /* ---------- Utilities ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function unique(arr) {
    var seen = {};
    var out = [];
    arr.forEach(function (x) { if (x && !seen[x]) { seen[x] = true; out.push(x); } });
    return out.sort();
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function formatDuration(seconds) {
    var total = Math.max(0, Math.round(seconds / 60));
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h === 0) return m + 'm';
    return h + 'h ' + m + 'm';
  }

  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function showToast(variant, msg) {
    if (window.SCRIPTICA_TOAST) window.SCRIPTICA_TOAST(variant, msg);
    else console.log('[toast]', variant, msg);
  }
})();
