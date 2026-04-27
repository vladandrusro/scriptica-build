/* ============================================================
   Scriptica — Situații Contabile (Phase 3)
   Filter + pagination + expand/collapse + inline task ticking.
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var TODAY = new Date('2026-04-20T00:00:00');

  var STATUS_LABELS = {
    analiza:              'Analiză',
    asteapta_documente:   'Așteaptă Documente',
    in_verificare:        'În Verificare',
    finalizat:            'Finalizat',
    inchisa:              'Închisă',
    anulata:              'Anulată',
    intarziere:           'În Întârziere'
  };

  var FREQUENCY_LABELS = {
    lunar:         'Lunar',
    trimestrial:   'Trimestrial',
    semestrial:    'Semestrial',
    anual:         'Anual'
  };

  var state = {
    filters: {
      search: '',
      status: '',
      tip: '',
      frequency: '',
      departmentId: '',
      dateFrom: '',
      dateTo: '',
      responsibleId: ''
    },
    pageSize: 10,
    page: 1,
    expandedId: null,
    showSecondary: false
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK || !document.getElementById('sit-table')) return;
    populateFilterOptions();
    bindFilters();
    bindSecondaryToggle();
    bindTableDelegated();
    render();
  });

  /* ---------- Utilities ---------- */

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function daysDiff(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return 0;
    return Math.ceil((d - TODAY) / 86400000);
  }

  /* ---------- Populate filter options ---------- */

  function populateFilterOptions() {
    var tip = $('#f-tip');
    if (tip) {
      tip.innerHTML = '<option value="">Toate tipurile</option>' +
        MOCK.situationTypes.map(function (t) {
          return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
        }).join('');
    }
    var resp = $('#f-resp');
    if (resp) {
      resp.innerHTML = '<option value="">Toți responsabilii</option>' +
        MOCK.employees.map(function (e) {
          return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
        }).join('');
    }

    var deptField = document.querySelector('[data-field="dept"]');
    if (MOCK.departmentsEnabled && deptField) {
      var dept = $('#f-dept');
      dept.innerHTML = '<option value="">Toate departamentele</option>' +
        MOCK.departments.map(function (d) {
          return '<option value="' + d.id + '">' + esc(d.name) + '</option>';
        }).join('');
    } else if (deptField) {
      deptField.style.display = 'none';
    }
  }

  /* ---------- Filter bindings ---------- */

  function bindFilters() {
    bind('#f-search',  'input',  function (v) { state.filters.search = v; resetPage(); });
    bind('#f-status',  'change', function (v) { state.filters.status = v; resetPage(); });
    bind('#f-tip',     'change', function (v) { state.filters.tip = v; resetPage(); });
    bind('#f-freq',    'change', function (v) { state.filters.frequency = v; resetPage(); });
    bind('#f-dept',    'change', function (v) { state.filters.departmentId = v; resetPage(); });
    bind('#f-datefrom','change', function (v) { state.filters.dateFrom = v; resetPage(); });
    bind('#f-dateto',  'change', function (v) { state.filters.dateTo = v; resetPage(); });
    bind('#f-resp',    'change', function (v) { state.filters.responsibleId = v; resetPage(); });
  }

  function bind(sel, evt, cb) {
    var el = $(sel);
    if (!el) return;
    el.addEventListener(evt, function (e) {
      cb(e.target.value);
      render();
    });
  }

  function resetPage() {
    state.page = 1;
    state.expandedId = null;
  }

  function bindSecondaryToggle() {
    var btn = $('#toggle-secondary');
    var row = $('#filters-secondary');
    if (!btn || !row) return;
    btn.addEventListener('click', function () {
      state.showSecondary = !state.showSecondary;
      row.classList.toggle('is-open', state.showSecondary);
      btn.classList.toggle('is-open', state.showSecondary);
      var label = btn.querySelector('[data-label]');
      if (label) label.textContent = state.showSecondary ? 'Mai puține filtre' : 'Mai multe filtre';
    });
  }

  /* ---------- Filter application ---------- */

  function isClient() {
    return !!(window.scripticaIsClientView && window.scripticaIsClientView());
  }

  function getFiltered() {
    var f = state.filters;
    var q = normalize(f.search);
    var source = (typeof window.getVisibleSituations === 'function') ? window.getVisibleSituations() : MOCK.situations;
    return source.filter(function (s) {
      if (q && normalize(s.clientCompany).indexOf(q) === -1) return false;
      if (f.status && s.status !== f.status) return false;
      if (f.tip && s.typeId !== f.tip) return false;
      if (f.frequency) {
        var t = MOCK.situationTypes.find(function (x) { return x.id === s.typeId; });
        if (!t || t.frequency !== f.frequency) return false;
      }
      if (f.departmentId && String(s.departmentId) !== String(f.departmentId)) return false;
      if (f.dateFrom && s.startDate < f.dateFrom) return false;
      if (f.dateTo && s.startDate > f.dateTo) return false;
      if (f.responsibleId && String(s.responsibleStepId) !== String(f.responsibleId)) return false;
      return true;
    });
  }

  /* ---------- Rendering ---------- */

  function render() {
    renderThead();
    var filtered = getFiltered();
    renderTable(filtered);
    renderPagination(filtered.length);
  }

  function renderThead() {
    var thead = $('#sit-thead');
    if (!thead) return;
    if (isClient()) {
      thead.innerHTML =
        '<tr>' +
          '<th>Raport</th>' +
          '<th style="width:160px;">Perioadă</th>' +
          '<th style="width:110px;">Termen</th>' +
          '<th style="width:200px;">Status</th>' +
          '<th style="width:240px;">Acțiune necesară</th>' +
        '</tr>';
    } else {
      thead.innerHTML =
        '<tr>' +
          '<th style="width:44px;"></th>' +
          '<th style="width:140px;">Cod</th>' +
          '<th>Client</th>' +
          '<th style="width:160px;">Titular</th>' +
          '<th style="width:120px;">Dată Start</th>' +
          '<th style="width:110px;">Termen</th>' +
          '<th style="width:160px;">Responsabil Pas</th>' +
          '<th style="width:180px;">Status</th>' +
          '<th>Denumire Raport</th>' +
          '<th style="width:80px;">Pas</th>' +
        '</tr>';
    }
  }

  function renderTable(filtered) {
    var tbody = $('#sit-tbody');
    var empty = $('#table-empty');
    var wrap = $('#table-wrap');
    if (!tbody || !empty || !wrap) return;

    if (!filtered.length) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
      wrap.style.display = 'none';
      var allVisible = (typeof window.getVisibleSituations === 'function') ? window.getVisibleSituations() : MOCK.situations;
      var emptyMsg = empty.querySelector('p');
      var emptyLink = empty.querySelector('a');
      if (isClient() && allVisible.length === 0) {
        if (emptyMsg) emptyMsg.textContent = 'Nu aveți situații contabile active.';
        if (emptyLink) emptyLink.style.display = 'none';
      } else {
        if (emptyMsg) emptyMsg.textContent = 'Nicio situație nu corespunde filtrelor selectate.';
        if (emptyLink) emptyLink.style.display = '';
      }
      return;
    }
    empty.style.display = 'none';
    wrap.style.display = '';

    var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    var start = (state.page - 1) * state.pageSize;
    var pageItems = filtered.slice(start, start + state.pageSize);

    tbody.innerHTML = pageItems.map(rowHtml).join('');
  }

  function rowHtml(s) {
    if (isClient()) return clientRowHtml(s);
    var isExpanded = state.expandedId === s.id;
    var main =
      '<tr class="sit-row' + (isExpanded ? ' is-expanded' : '') + '" data-id="' + esc(s.id) + '" data-row>' +
        '<td class="sit-cell--chevron" data-chevron>' +
          '<span class="material-symbols-outlined" aria-hidden="true">expand_more</span>' +
        '</td>' +
        '<td class="sit-cell--code">' + esc(s.id) + '</td>' +
        '<td class="sit-cell--client">' + esc(s.clientCompany) + '</td>' +
        '<td class="sit-cell--titular">' + esc(s.titularName) + '</td>' +
        '<td class="sit-cell--date">' + formatDate(s.startDate) + '</td>' +
        '<td class="sit-cell--termen">' + termenHtml(s) + '</td>' +
        '<td class="sit-cell--responsabil">' + esc(s.responsibleStepName) + '</td>' +
        '<td>' + statusHtml(s.status) + '</td>' +
        '<td class="sit-cell--tip">' + esc(s.typeName) + '</td>' +
        '<td>' + progressHtml(s) + '</td>' +
      '</tr>';
    return main + (isExpanded ? expandedHtml(s) : '');
  }

  function clientRowHtml(s) {
    return '<tr class="sit-row sit-row--client" data-id="' + esc(s.id) + '" data-row>' +
      '<td class="sit-cell--raport"><strong>' + esc(s.typeLabel || s.typeName) + '</strong></td>' +
      '<td class="sit-cell--perioada">' + esc(window.formatRomanianMonth(s.startDate)) + '</td>' +
      '<td class="sit-cell--termen">' + termenHtml(s) + '</td>' +
      '<td>' + clientStatusHtml(s.status) + '</td>' +
      '<td class="sit-cell--actiune">' + clientActionHtml(s) + '</td>' +
    '</tr>';
  }

  function clientStatusHtml(status) {
    var label = (typeof window.getClientFriendlyStatus === 'function') ? window.getClientFriendlyStatus(status) : status;
    return '<span class="sit-status sit-status--' + esc(status) + '">' +
      '<span class="status-dot status-dot--' + esc(status) + '"></span>' +
      esc(label) +
    '</span>';
  }

  function clientActionHtml(s) {
    var action = (typeof window.getRequiredClientAction === 'function') ? window.getRequiredClientAction(s) : '—';
    if (action === '—') {
      return '<span class="sit-action sit-action--none">—</span>';
    }
    return '<span class="sit-action sit-action--required">' + esc(action) + '</span>';
  }

  function termenHtml(s) {
    if (s.status === 'inchisa') return '<span class="termen--finalizat">Finalizată</span>';
    if (s.status === 'anulata') return '<span class="termen--anulat">Anulată</span>';
    var iso = s['deadlineStep' + s.currentStep];
    var days = daysDiff(iso);
    if (days < 0)      return '<span class="termen--overdue">' + days + '</span>';
    if (days === 0)    return '<span class="termen--today">0</span>';
    if (days <= 3)     return '<span class="termen--soon">' + days + ' zile</span>';
    return '<span class="termen--ok">' + days + ' zile</span>';
  }

  function statusHtml(status) {
    return '<span class="sit-status sit-status--' + esc(status) + '">' +
      '<span class="status-dot status-dot--' + esc(status) + '"></span>' +
      esc(STATUS_LABELS[status] || status) +
    '</span>';
  }

  function progressHtml(s) {
    var ratio = s.totalSteps ? s.stepsCompleted / s.totalSteps : 0;
    var cls = ratio < 0.25 ? 'is-low' : (ratio < 0.75 ? 'is-mid' : 'is-high');
    return '<span class="pill pill--progress ' + cls + '">' + s.stepsCompleted + '/' + s.totalSteps + '</span>';
  }

  function expandedHtml(s) {
    var stepKey = 'step' + s.currentStep;
    var stepInfo = MOCK.standardSteps[stepKey] || { name: '', number: s.currentStep };
    var tasks = (s.tasks && s.tasks[stepKey]) ? s.tasks[stepKey] : [];
    var tasksHtml = tasks.map(function (t) { return taskRowHtml(s.id, t); }).join('');
    return '<tr class="sit-row-exp"><td colspan="10">' +
      '<div class="exp-panel">' +
        '<div class="exp-header">' +
          '<span class="pill--step-current">Pasul ' + s.currentStep + '/' + s.totalSteps + '</span>' +
          '<span class="exp-sep">•</span>' +
          '<span class="exp-stepname">' + esc(stepInfo.name) + '</span>' +
        '</div>' +
        '<div class="task-list" data-tasks-for="' + esc(s.id) + '">' + tasksHtml + '</div>' +
        '<div class="exp-footer">' +
          '<a class="exp-open-link" href="situatie-detaliu.html?id=' + esc(s.id) + '">Deschide situația →</a>' +
        '</div>' +
      '</div>' +
    '</td></tr>';
  }

  function taskRowHtml(situationId, t) {
    var assignee = t.assigneeId ? MOCK.employees.find(function (e) { return e.id === t.assigneeId; }) : null;
    var assigneeHtml = (t.completed && assignee) ?
      '<span class="task-assignee">' +
        '<span class="material-symbols-outlined filled" aria-hidden="true">check_circle</span>' +
        esc(assignee.name) +
      '</span>' : '';

    var hasObservation = t.completed && t.observation && String(t.observation).trim().length > 0;
    var needsSenior = !!t.needsSeniorAttention;
    var seniorFlagHtml =
      '<span class="task-row__flag">' +
        '<span class="material-symbols-outlined" aria-hidden="true">priority_high</span>' +
        'Atenție senior' +
      '</span>';

    // If there's no observation, put the senior flag on the main line next to the label.
    var mainExtras = (!hasObservation && needsSenior) ? seniorFlagHtml : '';

    var obsLine = '';
    if (hasObservation) {
      obsLine =
        '<div class="task-row__observation">' +
          '<span class="material-symbols-outlined" aria-hidden="true">chat_bubble</span>' +
          '<span class="task-row__observation-text">' + esc(t.observation) + '</span>' +
          (needsSenior ? seniorFlagHtml : '') +
        '</div>';
    }

    return '<div class="task-row" data-task-id="' + t.id + '" data-sit-id="' + esc(situationId) + '">' +
      '<label class="task-row__main">' +
        '<input type="checkbox" ' + (t.completed ? 'checked' : '') + ' data-task-toggle>' +
        '<span class="task-label' + (t.completed ? ' is-done' : '') + '">' + esc(t.label) + '</span>' +
        mainExtras +
        assigneeHtml +
      '</label>' +
      obsLine +
    '</div>';
  }

  /* ---------- Delegated handlers for the table ---------- */

  function bindTableDelegated() {
    var tbody = $('#sit-tbody');
    if (!tbody) return;

    // Row click → in client view: navigate to detail; in firm view: expand/collapse
    tbody.addEventListener('click', function (e) {
      if (e.target.closest('input, a, .task-row, .sit-row-exp')) return;
      var row = e.target.closest('[data-row]');
      if (!row) return;
      var id = row.getAttribute('data-id');
      if (isClient()) {
        window.location.href = 'situatie-detaliu.html?id=' + encodeURIComponent(id) + '&view=client';
        return;
      }
      state.expandedId = (state.expandedId === id) ? null : id;
      render();
    });

    // Task checkbox toggle
    tbody.addEventListener('change', function (e) {
      if (!e.target.matches('[data-task-toggle]')) return;
      var label = e.target.closest('[data-task-id]');
      if (!label) return;
      var sitId = label.getAttribute('data-sit-id');
      var taskId = parseInt(label.getAttribute('data-task-id'), 10);
      var sit = MOCK.situations.find(function (s) { return s.id === sitId; });
      if (!sit) return;
      var stepKey = 'step' + sit.currentStep;
      var tasks = sit.tasks && sit.tasks[stepKey];
      if (!tasks) return;
      var task = tasks.find(function (t) { return t.id === taskId; });
      if (!task) return;
      task.completed = e.target.checked;
      task.assigneeId = task.completed ? MOCK.currentUser.id : null;

      // Re-render just this task list (no full table re-render so cursor/scroll stay put)
      var panel = label.closest('.task-list');
      if (panel) {
        panel.innerHTML = tasks.map(function (t) { return taskRowHtml(sit.id, t); }).join('');
      }
    });
  }

  /* ---------- Pagination ---------- */

  function renderPagination(total) {
    var container = $('#sit-pagination');
    if (!container) return;
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

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

    var prevDisabled = state.page === 1 ? ' disabled' : '';
    var nextDisabled = state.page === totalPages ? ' disabled' : '';

    container.innerHTML =
      '<div class="pagination__left">' +
        '<span class="pagination__info">Număr intrări afișate:</span>' +
        sizeHtml +
      '</div>' +
      '<div class="pagination__right">' +
        '<span class="pagination__info">' + info + '</span>' +
        '<button type="button" class="page-pill page-nav" data-nav="prev" aria-label="Pagina anterioară"' + prevDisabled + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>' +
        '</button>' +
        nums +
        '<button type="button" class="page-pill page-nav" data-nav="next" aria-label="Pagina următoare"' + nextDisabled + '>' +
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
        var dir = btn.getAttribute('data-nav');
        if (dir === 'prev') state.page = Math.max(1, state.page - 1);
        else if (dir === 'next') state.page = Math.min(totalPages, state.page + 1);
        render();
      });
    });
  }

  function pageNumbers(current, total) {
    if (total <= 5) {
      var out = [];
      for (var i = 1; i <= total; i++) out.push(i);
      return out;
    }
    if (current <= 3)              return [1, 2, 3, 4, '...', total];
    if (current >= total - 2)      return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  /* ---------- Reset filters (called from empty-state link) ---------- */

  window.SCRIPTICA_SITUATII_RESET = function () {
    state.filters = {
      search: '', status: '', tip: '', frequency: '', departmentId: '',
      dateFrom: '', dateTo: '', responsibleId: ''
    };
    ['#f-search','#f-status','#f-tip','#f-freq','#f-dept','#f-datefrom','#f-dateto','#f-resp']
      .forEach(function (sel) { var el = $(sel); if (el) el.value = ''; });
    state.page = 1;
    state.expandedId = null;
    render();
    return false;
  };
})();
