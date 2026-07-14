/* ============================================================
   Scriptica — Misiuni Audit (Brief #3)
   Lista de misiuni de audit (domain:'audit') + modalul de creare.
   Reutilizează componentele vizuale ale tabelului Situații (clase
   .sit-*, .status-dot, .pill--progress, paginare, filtre) și
   patternul modalului „Situație Nouă". Controller separat ca
   situatii.js să rămână neatins (zero regresie contabil).
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var TODAY = new Date('2026-04-20T00:00:00');

  /* Statusuri: setul existent + cele două de audit. */
  var STATUS_LABELS = {
    analiza:              'Analiză',
    asteapta_documente:   'Așteaptă Documente',
    in_verificare:        'În Verificare',
    spre_aprobare:        'Spre Aprobare',
    aprobata:             'Aprobată',
    finalizat:            'Finalizat',
    inchisa:              'Închisă',
    anulata:              'Anulată',
    intarziere:           'În Întârziere'
  };

  var state = {
    filters: { search: '', status: '', tip: '', dateFrom: '', dateTo: '', responsibleId: '' },
    pageSize: 10,
    page: 1,
    expandedId: null,
    showSecondary: false,
    tab: 'toate'
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK || document.body.getAttribute('data-page') !== 'misiuni-audit') return;
    /* Gating pe arie de acces: pagina e de audit; ascunsă pentru personas
       fără „audit" în scope (ex. contabilitate). */
    if (typeof window.viewInScope === 'function' && !window.viewInScope('audit')) {
      var main = document.getElementById('main') || document.querySelector('.main');
      if (main) main.innerHTML =
        '<div class="scope-block">' +
          '<span class="material-symbols-outlined" aria-hidden="true">lock</span>' +
          '<h1 class="scope-block__title">Misiuni Audit</h1>' +
          '<p class="scope-block__text">Această secțiune este disponibilă doar personelor cu acces la aria de audit.</p>' +
          '<a class="btn btn--primary" href="acasa.html">Înapoi la Acasă</a>' +
        '</div>';
      return;
    }
    setupTabs();
    populateFilterOptions();
    bindFilters();
    bindSecondaryToggle();
    bindTableDelegated();
    initModal();
    applyTab();
  });

  /* ---------- Persona „autoritate decidentă" (read-only) ---------- */
  function isAuthority() {
    return typeof window.getCurrentView === 'function' && window.getCurrentView() === 'autoritate';
  }
  function authority() { return (MOCK.auditAuthorities || [])[0] || null; }
  function planLabel(m) {
    if (!m.planAnualId) return '';
    var pl = (MOCK.auditPlansAnnual || []).find(function (p) { return p.id === m.planAnualId; });
    return pl ? (' · Plan anual ' + pl.year) : '';
  }
  function statusOverrides() {
    try { return JSON.parse(localStorage.getItem('scriptica.auditMissionStatus') || '{}') || {}; }
    catch (e) { return {}; }
  }

  /* Tab-uri la nivel de pagină (toate vederile): Toate · Spre Aprobare · Rapoarte.
     Reutilizează stilul .doc-tabs. */
  function setupTabs() {
    var filters = document.querySelector('.filters');
    if (!filters || document.querySelector('.am-tabs')) return;
    var tabs = document.createElement('div');
    tabs.className = 'doc-tabs am-tabs';
    tabs.innerHTML =
      '<button type="button" class="doc-tab is-active" data-tab="toate">Toate</button>' +
      '<button type="button" class="doc-tab" data-tab="spre">Spre Aprobare</button>' +
      '<button type="button" class="doc-tab" data-tab="rapoarte">Rapoarte</button>';
    filters.parentNode.insertBefore(tabs, filters);
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tab]');
      if (!btn) return;
      state.tab = btn.getAttribute('data-tab');
      tabs.querySelectorAll('.doc-tab').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      resetPage();
      applyTab();
    });
  }

  /* Comută între lista standard (Toate/Spre Aprobare) și vederea Rapoarte. */
  function applyTab() {
    var isRap = state.tab === 'rapoarte';
    var filters = document.querySelector('.filters');
    var tableWrap = $('#table-wrap');
    var tableEmpty = $('#table-empty');
    var pagination = $('#sit-pagination');
    var rapRoot = $('#rap-root');
    var addBtn = $('#open-new-mission');

    if (filters) filters.style.display = isRap ? 'none' : '';
    if (pagination) pagination.style.display = isRap ? 'none' : '';
    if (rapRoot) rapRoot.hidden = !isRap;
    /* „Adaugă" doar pe tab-ul Toate și doar pentru utilizatorii non-autoritate. */
    if (addBtn) addBtn.style.display = (!isRap && state.tab === 'toate' && !isAuthority()) ? '' : 'none';

    if (isRap) {
      if (tableWrap) tableWrap.style.display = 'none';
      if (tableEmpty) tableEmpty.style.display = 'none';
      if (rapRoot && window.SCRIPTICA_RAPOARTE) window.SCRIPTICA_RAPOARTE.render(rapRoot);
    } else {
      render();
    }
  }

  /* ---------- Utilities ---------- */

  function $(sel) { return document.querySelector(sel); }

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

  function formatDateFull(iso) {
    if (!iso) return '—';
    var months = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return parseInt(p[2], 10) + ' ' + months[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }

  function todayISO() { return '2026-04-20'; }

  function addDaysISO(iso, n) {
    var dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return iso;
    dt.setDate(dt.getDate() + (parseInt(n, 10) || 0));
    var y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), d = String(dt.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function daysDiff(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return 0;
    return Math.ceil((d - TODAY) / 86400000);
  }

  function missions() {
    /* Autoritatea decidentă = utilizator intern de senioritate maximă →
       vede TOATE misiunile de audit (vizibilitate completă), nu doar ale unei entități. */
    var ov = statusOverrides();
    return (MOCK.auditMissions || []).map(function (m) {
      return ov[m.id] ? Object.assign({}, m, { status: ov[m.id] }) : m;
    });
  }

  function employeeById(id) {
    return (MOCK.employees || []).find(function (e) { return e.id === id; }) || null;
  }

  function auditTypes() {
    return (MOCK.situationTypes || []).filter(function (t) { return (t.domain || 'contabil') === 'audit'; });
  }

  /* ---------- Populate filter options ---------- */

  function populateFilterOptions() {
    var tip = $('#f-tip');
    if (tip) {
      tip.innerHTML = '<option value="">Toate șabloanele</option>' +
        auditTypes().map(function (t) {
          return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
        }).join('');
    }
    var resp = $('#f-resp');
    if (resp) {
      resp.innerHTML = '<option value="">Toți responsabilii</option>' +
        (MOCK.employees || []).map(function (e) {
          return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
        }).join('');
    }
  }

  /* ---------- Filter bindings ---------- */

  function bindFilters() {
    bind('#f-search',  'input',  function (v) { state.filters.search = v; resetPage(); });
    bind('#f-status',  'change', function (v) { state.filters.status = v; resetPage(); });
    bind('#f-tip',     'change', function (v) { state.filters.tip = v; resetPage(); });
    bind('#f-datefrom','change', function (v) { state.filters.dateFrom = v; resetPage(); });
    bind('#f-dateto',  'change', function (v) { state.filters.dateTo = v; resetPage(); });
    bind('#f-resp',    'change', function (v) { state.filters.responsibleId = v; resetPage(); });
  }

  function bind(sel, evt, cb) {
    var el = $(sel);
    if (!el) return;
    el.addEventListener(evt, function (e) { cb(e.target.value); render(); });
  }

  function resetPage() { state.page = 1; state.expandedId = null; }

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

  function termenIso(m) { return m['deadlineStep' + m.currentStep]; }

  function getFiltered() {
    var f = state.filters;
    var q = normalize(f.search);
    return missions().filter(function (m) {
      if (state.tab === 'spre' && m.status !== 'spre_aprobare') return false;
      if (q && normalize(m.name).indexOf(q) === -1 && normalize(m.entityName).indexOf(q) === -1) return false;
      if (f.status && m.status !== f.status) return false;
      if (f.tip && m.typeId !== f.tip) return false;
      var iso = termenIso(m);
      if (f.dateFrom && iso && iso < f.dateFrom) return false;
      if (f.dateTo && iso && iso > f.dateTo) return false;
      if (f.responsibleId && (m.responsibleIds || []).indexOf(parseInt(f.responsibleId, 10)) === -1) return false;
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

  /* Verticala de audit din registrul de fluxuri — sursa „expresiei în
     tabel" (listView) configurate în Super Admin → Fluxuri. */
  function auditVertical() {
    return (typeof window.scripticaVerticalById === 'function')
      ? window.scripticaVerticalById('vert_audit') : null;
  }
  function listEngine() {
    var v = auditVertical();
    return (v && window.SCRIPTICA_LISTVIEW) ? { LV: window.SCRIPTICA_LISTVIEW, v: v } : null;
  }

  function renderThead() {
    var thead = $('#sit-thead');
    if (!thead) return;
    var eng = listEngine();
    thead.innerHTML = eng
      ? eng.LV.headerHtml(eng.v, { chevron: true })
      : '<tr>' +
        '<th style="width:44px;"></th>' +
        '<th>Misiune</th>' +
        '<th style="width:240px;">Șablon</th>' +
        '<th style="width:110px;">Termen</th>' +
        '<th style="width:160px;">Responsabili</th>' +
        '<th style="width:180px;">Status</th>' +
      '</tr>';
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
      return;
    }
    empty.style.display = 'none';
    wrap.style.display = '';

    var totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    tbody.innerHTML = filtered.slice(start, start + state.pageSize).map(rowHtml).join('');
  }

  function rowHtml(m) {
    var isExpanded = state.expandedId === m.id;
    var eng = listEngine();
    var cells = eng
      ? eng.LV.cellsHtml(eng.v, eng.LV.normalizeMission(m))
      : '<td class="sit-cell--client">' +
          '<div class="am-mission__name">' + esc(m.name) + '</div>' +
          '<div class="am-mission__entity">' + esc(m.entityName) + esc(planLabel(m)) + '</div>' +
        '</td>' +
        '<td class="sit-cell--tip">' + esc(m.typeName) + '</td>' +
        '<td class="sit-cell--termen">' + termenHtml(m) + '</td>' +
        '<td>' + respClusterHtml(m) + '</td>' +
        '<td>' + statusHtml(m.status) + '</td>';
    var main =
      '<tr class="sit-row' + (isExpanded ? ' is-expanded' : '') + '" data-id="' + esc(m.id) + '" data-row>' +
        '<td class="sit-cell--chevron" data-chevron>' +
          '<span class="material-symbols-outlined" aria-hidden="true">expand_more</span>' +
        '</td>' +
        cells +
      '</tr>';
    return main + (isExpanded ? expandedHtml(m) : '');
  }

  function respClusterHtml(m) {
    var ids = m.responsibleIds || [];
    var MAX = 3;
    var shown = ids.slice(0, MAX);
    var rest = ids.length - shown.length;
    var avatars = shown.map(function (id) {
      var e = employeeById(id);
      if (!e) return '';
      return '<span class="avatar avatar--sm" title="' + esc(e.name) + '">' +
        (typeof window.renderAvatar === 'function' ? window.renderAvatar(e, 28) : esc(e.name.charAt(0))) +
      '</span>';
    }).join('');
    var more = rest > 0 ? '<span class="am-resp__more">+' + rest + '</span>' : '';
    return '<span class="am-resp"><span class="avatars-cluster" aria-label="Echipă misiune">' + avatars + more + '</span></span>';
  }

  function termenHtml(m) {
    if (m.status === 'inchisa' || m.status === 'aprobata') return '<span class="termen--finalizat">Finalizată</span>';
    if (m.status === 'anulata') return '<span class="termen--anulat">Anulată</span>';
    var days = daysDiff(termenIso(m));
    if (days < 0)   return '<span class="termen--overdue">' + days + '</span>';
    if (days === 0) return '<span class="termen--today">0</span>';
    if (days <= 3)  return '<span class="termen--soon">' + days + ' zile</span>';
    return '<span class="termen--ok">' + days + ' zile</span>';
  }

  function statusHtml(status) {
    return '<span class="sit-status sit-status--' + esc(status) + '">' +
      '<span class="status-dot status-dot--' + esc(status) + '"></span>' +
      esc(STATUS_LABELS[status] || status) +
    '</span>';
  }

  function expandedHtml(m) {
    var type = (MOCK.situationTypes || []).find(function (t) { return t.id === m.typeId; });
    var steps = (type && type.steps) ? type.steps : [];
    var total = m.totalSteps || steps.length;
    var stepsHtml = steps.map(function (st, idx) {
      var n = idx + 1;
      var stateCls = (n === m.currentStep) ? 'is-current' : (n < m.currentStep ? 'is-done' : 'is-upcoming');
      var trail = (stateCls === 'is-done')
        ? '<span class="material-symbols-outlined am-step__check" aria-hidden="true">check_circle</span>'
        : (stateCls === 'is-current' ? '<span class="am-step__now">Etapă curentă</span>' : '');
      return '<div class="am-step ' + stateCls + '" role="listitem">' +
        '<span class="am-step__badge">Etapa ' + n + '/' + total + '</span>' +
        '<span class="am-step__name">' + esc(st.name) + '</span>' +
        trail +
      '</div>';
    }).join('');
    var eng = listEngine();
    var span = eng ? eng.LV.colCount(eng.v, true) : 6;
    return '<tr class="sit-row-exp"><td colspan="' + span + '">' +
      '<div class="exp-panel">' +
        '<div class="am-steps" role="list" aria-label="Etapele misiunii">' + stepsHtml + '</div>' +
        '<div class="exp-footer">' +
          '<a class="exp-open-link" href="misiune-audit-workspace.html?id=' + esc(m.id) + '">Deschide misiunea →</a>' +
        '</div>' +
      '</div>' +
    '</td></tr>';
  }

  /* ---------- Delegated handlers ---------- */

  function bindTableDelegated() {
    var tbody = $('#sit-tbody');
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
      if (e.target.closest('a, .sit-row-exp')) return;
      var row = e.target.closest('[data-row]');
      if (!row) return;
      var id = row.getAttribute('data-id');
      /* Autoritatea: „Vizualizează" → workspace în mod read-only. */
      if (isAuthority()) {
        window.location.href = 'misiune-audit-workspace.html?id=' + encodeURIComponent(id) + '&view=autoritate';
        return;
      }
      state.expandedId = (state.expandedId === id) ? null : id;
      render();
    });
  }

  /* ---------- Pagination (reia patternul din situatii.js) ---------- */

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
        '<span class="pagination__info">Număr intrări afișate:</span>' + sizeHtml +
      '</div>' +
      '<div class="pagination__right">' +
        '<span class="pagination__info">' + info + '</span>' +
        '<button type="button" class="page-pill page-nav" data-nav="prev" aria-label="Pagina anterioară"' + prevDisabled + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>' +
        '</button>' + nums +
        '<button type="button" class="page-pill page-nav" data-nav="next" aria-label="Pagina următoare"' + nextDisabled + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>' +
        '</button>' +
      '</div>';

    container.querySelectorAll('[data-size]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.pageSize = parseInt(btn.getAttribute('data-size'), 10); state.page = 1; render(); });
    });
    container.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () { state.page = parseInt(btn.getAttribute('data-page'), 10); render(); });
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
    if (total <= 5) { var out = []; for (var i = 1; i <= total; i++) out.push(i); return out; }
    if (current <= 3)         return [1, 2, 3, 4, '...', total];
    if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  /* ---------- Reset filters ---------- */

  window.SCRIPTICA_MISIUNI_RESET = function () {
    state.filters = { search: '', status: '', tip: '', dateFrom: '', dateTo: '', responsibleId: '' };
    ['#f-search', '#f-status', '#f-tip', '#f-datefrom', '#f-dateto', '#f-resp']
      .forEach(function (sel) { var el = $(sel); if (el) el.value = ''; });
    state.page = 1;
    state.expandedId = null;
    render();
    return false;
  };

  /* ============================================================
     MODAL — Misiune de Audit Nouă
     Reia patternul „Situație Nouă" (combobox, recomputeDeadlines)
     + multi-select de responsabili (pattern chip-uri din anexe).
     ============================================================ */

  function initModal() {
    var openBtn = $('#open-new-mission');
    var modal = $('#modal-new-mission');
    if (!openBtn || !modal) return;

    var dialog = modal.querySelector('.modal__dialog');
    var typeSelect = modal.querySelector('#mm-tip');
    var dateInput = modal.querySelector('#mm-date');
    var comboInput = modal.querySelector('.combo__input');
    var comboList = modal.querySelector('.combo__list');
    var comboHidden = modal.querySelector('[name="entityId"]');
    var deadlinesList = modal.querySelector('[data-deadlines-list]');
    var respSelect = modal.querySelector('[data-resp-select]');
    var respChips = modal.querySelector('[data-resp-chips]');
    var respAddBtn = modal.querySelector('[data-resp-add]');
    var lastTrigger = null;
    var selectedResp = [];

    /* Populate type select (audit types active w/ steps) */
    typeSelect.innerHTML = '<option value="">Selectează tipul...</option>' +
      auditTypes().filter(function (t) { return (t.status || 'activ') === 'activ' && t.steps && t.steps.length; })
        .map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>'; }).join('');

    /* ----- Multi-select responsabili ----- */
    function refreshRespSelect() {
      var avail = (MOCK.employees || []).filter(function (e) { return selectedResp.indexOf(e.id) === -1; });
      respSelect.innerHTML = avail.length
        ? '<option value="">Selectează responsabil...</option>' + avail.map(function (e) {
            return '<option value="' + e.id + '">' + esc(e.name) + '</option>';
          }).join('')
        : '<option value="">Toți responsabilii adăugați</option>';
      respSelect.disabled = !avail.length;
      respAddBtn.disabled = !avail.length;
    }

    function renderRespChips() {
      respChips.innerHTML = selectedResp.map(function (id) {
        var e = employeeById(id);
        return '<span class="pill admin-anexa-chip">' + esc(e ? e.name : id) +
          '<button type="button" class="admin-anexa-chip__remove" data-resp-remove="' + id + '" aria-label="Elimină responsabilul" title="Elimină responsabilul">' +
            '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
          '</button>' +
        '</span>';
      }).join('');
    }

    respAddBtn.addEventListener('click', function () {
      var val = parseInt(respSelect.value, 10);
      if (!val) return;
      if (selectedResp.indexOf(val) === -1) selectedResp.push(val);
      refreshRespSelect();
      renderRespChips();
    });

    respChips.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-resp-remove]');
      if (!btn) return;
      var id = parseInt(btn.getAttribute('data-resp-remove'), 10);
      selectedResp = selectedResp.filter(function (x) { return x !== id; });
      refreshRespSelect();
      renderRespChips();
    });

    /* ----- Open / close ----- */
    openBtn.addEventListener('click', function () { lastTrigger = openBtn; openModal(); });
    modal.querySelector('[data-modal-close]').addEventListener('click', closeModal);
    modal.querySelector('[data-modal-cancel]').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
      else if (e.key === 'Tab') trapFocus(e, dialog);
    });

    function openModal() {
      resetForm();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { typeSelect.focus(); }, 0);
      recomputeDeadlines();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    }

    /* ----- Entity combobox (reia patternul Client) ----- */
    var activeIdx = -1;
    var entities = (MOCK.auditEntities || []);
    var filtered = entities.slice();

    function renderComboList(items) {
      if (!items.length) { comboList.innerHTML = '<div class="combo__empty">Nicio entitate găsită.</div>'; return; }
      comboList.innerHTML = items.map(function (c, i) {
        return '<div class="combo__option' + (i === activeIdx ? ' is-active' : '') + '" data-id="' + c.id + '" role="option">' +
          '<div class="combo__option-title">' + esc(c.name) + '</div>' +
          '<div class="combo__option-meta">' + esc(c.contactName || '') + '</div>' +
        '</div>';
      }).join('');
      comboList.querySelectorAll('.combo__option').forEach(function (opt) {
        opt.addEventListener('mousedown', function (e) { e.preventDefault(); selectEntity(parseInt(opt.getAttribute('data-id'), 10)); });
      });
    }
    function selectEntity(id) {
      var c = entities.find(function (x) { return x.id === id; });
      if (!c) return;
      comboInput.value = c.name; comboHidden.value = c.id; closeCombo();
    }
    function openCombo() { activeIdx = -1; filtered = filterEntities(comboInput.value); renderComboList(filtered); comboList.classList.add('is-open'); }
    function closeCombo() { comboList.classList.remove('is-open'); }
    function filterEntities(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) return entities.slice();
      return entities.filter(function (c) { return c.name.toLowerCase().indexOf(q) !== -1; });
    }
    comboInput.addEventListener('focus', openCombo);
    comboInput.addEventListener('input', function () {
      comboHidden.value = ''; activeIdx = -1; filtered = filterEntities(comboInput.value);
      renderComboList(filtered); comboList.classList.add('is-open');
    });
    comboInput.addEventListener('keydown', function (e) {
      if (!comboList.classList.contains('is-open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) openCombo();
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(filtered.length - 1, activeIdx + 1); renderComboList(filtered); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); renderComboList(filtered); }
      else if (e.key === 'Enter') { if (activeIdx >= 0 && filtered[activeIdx]) { e.preventDefault(); selectEntity(filtered[activeIdx].id); } }
      else if (e.key === 'Escape') closeCombo();
    });
    document.addEventListener('mousedown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (!e.target.closest('.combo')) closeCombo();
    });

    /* ----- Live deadlines (reia recomputeDeadlines) ----- */
    typeSelect.addEventListener('change', recomputeDeadlines);
    dateInput.addEventListener('change', recomputeDeadlines);
    dateInput.addEventListener('input', recomputeDeadlines);

    function deadlineRowHtml(stepLabel, dateLabel) {
      return '<div class="deadlines__row"><span class="deadlines__step">' + stepLabel + '</span>' +
        '<span class="deadlines__date">' + dateLabel + '</span></div>';
    }
    function recomputeDeadlines() {
      if (!deadlinesList) return;
      var t = (MOCK.situationTypes || []).find(function (x) { return x.id === typeSelect.value; });
      var start = dateInput.value;
      if (!t || !t.steps || !t.steps.length || !start) {
        var ph = '';
        for (var i = 1; i <= 4; i++) ph += deadlineRowHtml('Etapa ' + i, '—');
        deadlinesList.innerHTML = ph;
        return;
      }
      deadlinesList.innerHTML = t.steps.map(function (step, idx) {
        return deadlineRowHtml('Etapa ' + (idx + 1) + ' — ' + esc(step.name), esc(formatDateFull(addDaysISO(start, step.offsetDays))));
      }).join('');
    }

    /* ----- Submit ----- */
    modal.querySelector('[data-modal-submit]').addEventListener('click', function (e) {
      e.preventDefault();
      if (!validate()) return;
      closeModal();
      toast('success', 'Misiunea de audit a fost creată cu succes.');
    });

    function validate() {
      var ok = true;
      setError('tip', !typeSelect.value, 'Selectează șablonul misiunii.');
      if (!typeSelect.value) ok = false;

      var validEntity = comboHidden.value && entities.some(function (c) {
        return c.id === parseInt(comboHidden.value, 10) && c.name === comboInput.value;
      });
      setError('entity', !validEntity, 'Selectează o entitate din listă.');
      if (!validEntity) ok = false;

      setError('responsabili', selectedResp.length === 0, 'Adaugă cel puțin un responsabil.');
      if (selectedResp.length === 0) ok = false;

      var invalidDate = !dateInput.value || dateInput.value < todayISO();
      setError('dataInceput', invalidDate, 'Alege o dată validă (azi sau ulterioară).');
      if (invalidDate) ok = false;

      var pf = modal.querySelector('[name="perioadaFrom"]').value;
      var pt = modal.querySelector('[name="perioadaTo"]').value;
      var periodErr = (!pf || !pt) ? 'Specifică perioada auditată (de la – până la).' :
        (pf > pt ? 'Perioada auditată este inversată (început după sfârșit).' : '');
      setError('perioada', !!periodErr, periodErr);
      if (periodErr) ok = false;

      var anyNotif = modal.querySelectorAll('input[name="notif"]:checked').length > 0;
      setError('notif', !anyNotif, 'Alege cel puțin o notificare automată.');
      if (!anyNotif) ok = false;

      return ok;
    }

    function setError(name, hasError, msg) {
      var field = modal.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      field.classList.toggle('has-error', hasError);
      var errorEl = field.querySelector('.form-error');
      if (errorEl && msg) errorEl.textContent = msg;
    }

    function resetForm() {
      typeSelect.value = '';
      comboInput.value = ''; comboHidden.value = '';
      selectedResp = []; refreshRespSelect(); renderRespChips();
      dateInput.value = todayISO(); dateInput.min = todayISO();
      modal.querySelector('[name="perioadaFrom"]').value = '';
      modal.querySelector('[name="perioadaTo"]').value = '';
      modal.querySelectorAll('input[name="notif"]').forEach(function (cb) { cb.checked = true; });
      modal.querySelectorAll('.form-field').forEach(function (f) { f.classList.remove('has-error'); });
      closeCombo();
    }

    /* „Demarează misiunea" din planul anual (#7) — deschide modalul
       pre-completat din intrarea de plan referită prin ?demareaza=. */
    var demId = new URLSearchParams(window.location.search).get('demareaza');
    if (demId) {
      var entry = null;
      (MOCK.auditPlansAnnual || []).forEach(function (pl) {
        (pl.entries || []).forEach(function (en) { if (en.id === demId) entry = en; });
      });
      if (entry) {
        openModal();
        typeSelect.value = 'misiune_audit_regularitate';
        recomputeDeadlines();
        var ent = (MOCK.auditEntities || []).find(function (x) { return x.id === entry.entityId; });
        if (ent) { comboInput.value = ent.name; comboHidden.value = String(ent.id); }
        selectedResp = (entry.responsibleIds || []).slice();
        refreshRespSelect(); renderRespChips();
        if (entry.perioadaAuditata) {
          modal.querySelector('[name="perioadaFrom"]').value = entry.perioadaAuditata.from || '';
          modal.querySelector('[name="perioadaTo"]').value = entry.perioadaAuditata.to || '';
        }
      }
    }
  }

  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function toast(variant, message) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, message);
  }

})();
