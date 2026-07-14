/* ============================================================
   Scriptica — Motorul generic de fluxuri
   Servește verticalele custom definite de Super Admin în registrul
   de fluxuri (flowVerticals/flowTemplates), fără pagini dedicate:
     flux.html?vertical=<id>   → lista de elemente ale verticalei
     flux-detaliu.html?id=<id> → workspace-ul unui element (etape)
   Verticalele builtin (contabil/audit) NU trec pe aici — au paginile
   lor dedicate; motorul redă doar forma standard a ciclului de viață.
   Datele: MOCK.flowItems (seed) + localStorage prin scripticaFlowSave.
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var TODAY = new Date('2026-04-20T00:00:00');

  var STATUS_LABELS = {
    analiza:            'Analiză',
    asteapta_documente: 'Așteaptă Documente',
    in_verificare:      'În Lucru',
    spre_aprobare:      'Spre Aprobare',
    finalizat:          'Finalizat',
    inchisa:            'Închisă',
    anulata:            'Anulată',
    intarziere:         'În Întârziere'
  };

  var state = {
    filters: { search: '', status: '', tip: '' },
    expandedId: null
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK) return;
    var page = document.body.getAttribute('data-page');
    var root = document.getElementById('fx-root');
    if (!root) return;
    if (page === 'flux') renderListPage(root);
    else if (page === 'flux-detaliu') renderDetailPage(root);
  });

  /* ---------- utilities ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function qs(name) { return new URLSearchParams(window.location.search).get(name); }
  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function todayISO() { return '2026-04-20'; }
  function addDaysISO(iso, n) {
    var dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return iso;
    dt.setDate(dt.getDate() + (parseInt(n, 10) || 0));
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function daysDiff(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return 0;
    return Math.ceil((d - TODAY) / 86400000);
  }
  function formatDateFull(iso) {
    if (!iso) return '—';
    var months = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return parseInt(p[2], 10) + ' ' + months[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function toast(variant, message) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, message);
  }
  function employeeById(id) {
    return (MOCK.employees || []).find(function (e) { return e.id === id; }) || null;
  }
  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function templateById(id) {
    return (MOCK.superAdmin.flowTemplates || []).find(function (t) { return t.id === id; }) || null;
  }
  function templateSteps(item) {
    var t = templateById(item.templateId);
    return (t && t.steps) || [];
  }
  function stepDeadline(item, idx) {
    var steps = templateSteps(item);
    return steps[idx] ? addDaysISO(item.startDate, steps[idx].offsetDays) : null;
  }
  function currentDeadline(item) { return stepDeadline(item, (item.currentStep || 1) - 1); }

  /* ---------- guards ---------- */

  function scopeBlock(root, title) {
    root.innerHTML =
      '<div class="scope-block">' +
        '<span class="material-symbols-outlined" aria-hidden="true">lock</span>' +
        '<h1 class="scope-block__title">' + esc(title) + '</h1>' +
        '<p class="scope-block__text">Această secțiune nu este disponibilă pentru persona curentă.</p>' +
        '<a class="btn btn--primary" href="acasa.html">Înapoi la Acasă</a>' +
      '</div>';
  }
  function notFound(root, msg) {
    root.innerHTML =
      '<div class="scope-block">' +
        '<span class="material-symbols-outlined" aria-hidden="true">search_off</span>' +
        '<h1 class="scope-block__title">Negăsit</h1>' +
        '<p class="scope-block__text">' + esc(msg) + '</p>' +
        '<a class="btn btn--primary" href="acasa.html">Înapoi la Acasă</a>' +
      '</div>';
  }

  /* ---------- status & termen (reiau patternul din misiuni-audit) ---------- */

  function statusHtml(status) {
    return '<span class="sit-status sit-status--' + esc(status) + '">' +
      '<span class="status-dot status-dot--' + esc(status) + '"></span>' +
      esc(STATUS_LABELS[status] || status) +
    '</span>';
  }
  function termenHtml(item) {
    if (item.status === 'finalizat' || item.status === 'inchisa') return '<span class="termen--finalizat">Finalizat</span>';
    if (item.status === 'anulata') return '<span class="termen--anulat">Anulat</span>';
    var iso = currentDeadline(item);
    if (!iso) return '—';
    var days = daysDiff(iso);
    if (days < 0)   return '<span class="termen--overdue">' + days + '</span>';
    if (days === 0) return '<span class="termen--today">0</span>';
    if (days <= 3)  return '<span class="termen--soon">' + days + ' zile</span>';
    return '<span class="termen--ok">' + days + ' zile</span>';
  }
  function respClusterHtml(item) {
    var ids = item.responsibleIds || [];
    var shown = ids.slice(0, 3);
    var rest = ids.length - shown.length;
    var avatars = shown.map(function (id) {
      var e = employeeById(id);
      if (!e) return '';
      return '<span class="avatar avatar--sm" title="' + esc(e.name) + '">' +
        (typeof window.renderAvatar === 'function' ? window.renderAvatar(e, 28) : esc(e.name.charAt(0))) +
      '</span>';
    }).join('');
    var more = rest > 0 ? '<span class="am-resp__more">+' + rest + '</span>' : '';
    return '<span class="am-resp"><span class="avatars-cluster" aria-label="Echipă">' + avatars + more + '</span></span>';
  }

  /* ============================================================
     LISTA — flux.html?vertical=<id>
     ============================================================ */

  function renderListPage(root) {
    var v = window.scripticaVerticalById && window.scripticaVerticalById(qs('vertical'));
    if (!v) { notFound(root, 'Verticala cerută nu există în registrul de fluxuri.'); return; }
    if (v.builtin && v.pages && v.pages.list) { window.location.replace(v.pages.list); return; }
    if (typeof window.viewInScope === 'function' && !window.viewInScope(v.domain)) { scopeBlock(root, v.name); return; }

    document.title = v.name + ' — Scriptica';
    markNavActive(v.id);

    root.innerHTML =
      '<header class="page-header">' +
        '<h1 class="page-header__title">' + esc(v.name) + '</h1>' +
        '<button id="fx-new" class="btn btn--primary" type="button">Adaugă<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
      '</header>' +
      '<p class="fx-subtitle">' + esc(v.description || '') + '</p>' +
      '<section class="filters" aria-label="Filtre">' +
        '<div class="filters__primary">' +
          '<div class="filter-input-search">' +
            '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
            '<label for="fx-search" class="sr-only">Caută</label>' +
            '<input id="fx-search" class="input" type="search" placeholder="Caută ' + esc((v.itemLabel || 'element').toLowerCase()) + ' sau client..." autocomplete="off">' +
          '</div>' +
          '<label for="fx-status" class="sr-only">Status</label>' +
          '<select id="fx-status" class="select" style="width:180px;">' +
            '<option value="">Toate statusurile</option>' +
            Object.keys(STATUS_LABELS).map(function (k) { return '<option value="' + k + '">' + STATUS_LABELS[k] + '</option>'; }).join('') +
          '</select>' +
          '<label for="fx-tip" class="sr-only">Șablon</label>' +
          '<select id="fx-tip" class="select" style="width:240px;">' +
            '<option value="">Toate șabloanele</option>' +
            window.scripticaTemplatesForVertical(v.id).map(function (t) {
              return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
            }).join('') +
          '</select>' +
          '<div class="filters__spacer"></div>' +
        '</div>' +
      '</section>' +
      '<div id="fx-table-wrap" class="table-wrap">' +
        '<table class="sit-table">' +
          /* antetul vine din „expresia în tabel" a verticalei (listView) */
          '<thead>' + (window.SCRIPTICA_LISTVIEW
            ? window.SCRIPTICA_LISTVIEW.headerHtml(v, { chevron: true })
            : '<tr><th style="width:44px;"></th><th>' + esc(v.itemLabel || 'Element') + '</th>' +
              '<th style="width:240px;">Șablon</th><th style="width:110px;">Termen</th>' +
              '<th style="width:160px;">Responsabili</th><th style="width:180px;">Status</th></tr>') +
          '</thead>' +
          '<tbody id="fx-tbody"></tbody>' +
        '</table>' +
      '</div>' +
      '<div id="fx-empty" class="table-empty table-wrap" role="status" style="display:none"></div>';

    bindList(root, v);
    renderRows(root, v);
  }

  function itemsFor(v) {
    return window.scripticaFlowItemsForVertical(v.id);
  }
  function getFiltered(v) {
    var f = state.filters, q = normalize(f.search);
    return itemsFor(v).filter(function (it) {
      if (q && normalize(it.name).indexOf(q) === -1 && normalize(it.clientName || '').indexOf(q) === -1) return false;
      if (f.status && it.status !== f.status) return false;
      if (f.tip && it.templateId !== f.tip) return false;
      return true;
    });
  }

  function renderRows(root, v) {
    var tbody = root.querySelector('#fx-tbody');
    var empty = root.querySelector('#fx-empty');
    var wrap = root.querySelector('#fx-table-wrap');
    var filtered = getFiltered(v);
    if (!filtered.length) {
      tbody.innerHTML = '';
      /* zero-state real la prima utilizare vs. „niciun rezultat" la filtrare */
      var f = state.filters;
      var hasFilters = !!(f.search || f.status || f.tip);
      var noneAtAll = itemsFor(v).length === 0;
      empty.innerHTML = (noneAtAll && !hasFilters)
        ? '<span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span>' +
          '<p>' + esc('Niciun ' + (v.itemLabel || 'element').toLowerCase() + ' încă în această verticală.') + '</p>' +
          '<button type="button" class="btn btn--primary" data-fx-empty-new>' + esc('Creează primul ' + (v.itemLabel || 'element').toLowerCase()) +
            '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>'
        : '<span class="material-symbols-outlined" aria-hidden="true">search_off</span>' +
          '<p>Niciun element nu corespunde filtrelor selectate.</p>';
      empty.style.display = 'flex';
      wrap.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    wrap.style.display = '';
    tbody.innerHTML = filtered.map(function (it) { return rowHtml(v, it); }).join('');
  }

  function rowHtml(v, it) {
    var isExpanded = state.expandedId === it.id;
    var cells = window.SCRIPTICA_LISTVIEW
      ? window.SCRIPTICA_LISTVIEW.cellsHtml(v, window.SCRIPTICA_LISTVIEW.normalizeFlowItem(it))
      : '<td class="sit-cell--client">' +
          '<div class="lv-name">' + esc(it.name) + '</div>' +
          '<div class="lv-sub">' + esc(it.clientName || '') + '</div>' +
        '</td>' +
        '<td class="sit-cell--tip">' + esc(it.templateName || '') + '</td>' +
        '<td class="sit-cell--termen">' + termenHtml(it) + '</td>' +
        '<td>' + respClusterHtml(it) + '</td>' +
        '<td>' + statusHtml(it.status) + '</td>';
    var main =
      '<tr class="sit-row' + (isExpanded ? ' is-expanded' : '') + '" data-id="' + esc(it.id) + '" data-row>' +
        '<td class="sit-cell--chevron" data-chevron>' +
          '<span class="material-symbols-outlined" aria-hidden="true">expand_more</span>' +
        '</td>' +
        cells +
      '</tr>';
    return main + (isExpanded ? expandedHtml(v, it) : '');
  }

  function expandedHtml(v, it) {
    var steps = templateSteps(it);
    var total = it.totalSteps || steps.length;
    var stepsHtml = steps.map(function (st, idx) {
      var n = idx + 1;
      var stateCls = (n === it.currentStep && it.status !== 'finalizat') ? 'is-current' : (n <= (it.stepsCompleted || 0) ? 'is-done' : 'is-upcoming');
      var trail = (stateCls === 'is-done')
        ? '<span class="material-symbols-outlined am-step__check" aria-hidden="true">check_circle</span>'
        : (stateCls === 'is-current' ? '<span class="am-step__now">Etapă curentă</span>' : '');
      return '<div class="am-step ' + stateCls + '" role="listitem">' +
        '<span class="am-step__badge">Etapa ' + n + '/' + total + '</span>' +
        '<span class="am-step__name">' + esc(st.name) + '</span>' +
        trail +
      '</div>';
    }).join('');
    var span = window.SCRIPTICA_LISTVIEW ? window.SCRIPTICA_LISTVIEW.colCount(v, true) : 6;
    return '<tr class="sit-row-exp"><td colspan="' + span + '">' +
      '<div class="exp-panel">' +
        '<div class="am-steps" role="list" aria-label="Etape">' + stepsHtml + '</div>' +
        '<div class="exp-footer">' +
          '<a class="exp-open-link" href="flux-detaliu.html?id=' + esc(it.id) + '">Deschide ' + esc((v.itemLabel || 'elementul').toLowerCase()) + ' →</a>' +
        '</div>' +
      '</div>' +
    '</td></tr>';
  }

  function bindList(root, v) {
    root.querySelector('#fx-search').addEventListener('input', function (e) {
      state.filters.search = e.target.value; state.expandedId = null; renderRows(root, v);
    });
    root.querySelector('#fx-status').addEventListener('change', function (e) {
      state.filters.status = e.target.value; state.expandedId = null; renderRows(root, v);
    });
    root.querySelector('#fx-tip').addEventListener('change', function (e) {
      state.filters.tip = e.target.value; state.expandedId = null; renderRows(root, v);
    });
    root.querySelector('#fx-tbody').addEventListener('click', function (e) {
      if (e.target.closest('a, .sit-row-exp')) return;
      var row = e.target.closest('[data-row]');
      if (!row) return;
      var id = row.getAttribute('data-id');
      state.expandedId = (state.expandedId === id) ? null : id;
      renderRows(root, v);
    });
    root.querySelector('#fx-new').addEventListener('click', function () { openNewItemModal(root, v); });
    root.querySelector('#fx-empty').addEventListener('click', function (e) {
      if (e.target.closest('[data-fx-empty-new]')) openNewItemModal(root, v);
    });
  }

  /* ---------- modal element nou (construit din JS) ---------- */

  function openNewItemModal(root, v) {
    var tpls = window.scripticaTemplatesForVertical(v.id)
      .filter(function (t) { return (t.status || 'activ') === 'activ' && t.steps && t.steps.length; });
    var overlay = document.createElement('div');
    overlay.className = 'modal is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="modal__dialog" role="document">' +
        '<button type="button" class="modal__close" data-modal-close aria-label="Închide fereastra">' +
          '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '<header class="modal__header">' +
          '<h2 class="modal__title">' + esc(v.itemLabel || 'Element') + ' nou — ' + esc(v.name) + '</h2>' +
          '<p class="modal__subtitle">Completează detaliile; termenele se calculează automat din șablon.</p>' +
        '</header>' +
        '<form class="modal__body" novalidate>' +
          '<div class="form-field" data-field="tip">' +
            '<label class="form-label" for="fxm-tip">Șablon de flux</label>' +
            '<select id="fxm-tip" class="select">' +
              '<option value="">Selectează șablonul...</option>' +
              tpls.map(function (t) { return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>'; }).join('') +
            '</select>' +
            '<span class="form-helper">Șabloanele de flux sunt gestionate de administratorul platformei.</span>' +
            '<span class="form-error" role="alert"></span>' +
          '</div>' +
          '<div class="form-field" data-field="nume">' +
            '<label class="form-label" for="fxm-name">Denumire</label>' +
            '<input id="fxm-name" type="text" class="input" placeholder="ex. Opinie fiscală — speță TVA">' +
            '<span class="form-error" role="alert"></span>' +
          '</div>' +
          '<div class="form-field" data-field="client">' +
            '<label class="form-label" for="fxm-client">Client / beneficiar</label>' +
            '<input id="fxm-client" type="text" class="input" placeholder="ex. Electro Distrib S.R.L.">' +
            '<span class="form-error" role="alert"></span>' +
          '</div>' +
          '<div class="form-field" data-field="resp">' +
            '<label class="form-label" for="fxm-resp">Responsabil</label>' +
            '<select id="fxm-resp" class="select">' +
              '<option value="">Selectează responsabilul...</option>' +
              (MOCK.employees || []).map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + '</option>'; }).join('') +
            '</select>' +
            '<span class="form-error" role="alert"></span>' +
          '</div>' +
          '<div class="form-field" data-field="data">' +
            '<label class="form-label" for="fxm-date">Data început</label>' +
            '<input id="fxm-date" type="date" class="input" value="' + todayISO() + '" min="' + todayISO() + '">' +
            '<span class="form-error" role="alert"></span>' +
          '</div>' +
          '<div class="form-field">' +
            '<span class="form-label">Termene estimate</span>' +
            '<div class="deadlines" style="margin-top: var(--space-2);" data-fx-deadlines></div>' +
          '</div>' +
        '</form>' +
        '<footer class="modal__footer">' +
          '<button type="button" class="btn btn--ghost" data-modal-cancel>Anulează</button>' +
          '<button type="button" class="btn btn--primary" data-modal-submit>Creează</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    var lastTrigger = document.activeElement;
    var dialog = overlay.querySelector('.modal__dialog');

    function close() {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') trapFocus(e, dialog);
    }
    document.addEventListener('keydown', onKey);
    setTimeout(function () {
      var first = overlay.querySelector('#fxm-tip');
      if (first) first.focus();
    }, 0);
    overlay.querySelector('[data-modal-close]').addEventListener('click', close);
    overlay.querySelector('[data-modal-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    var tipSel = overlay.querySelector('#fxm-tip');
    var dateInp = overlay.querySelector('#fxm-date');
    var dl = overlay.querySelector('[data-fx-deadlines]');
    function recompute() {
      var t = tpls.find(function (x) { return x.id === tipSel.value; });
      if (!t || !dateInp.value) {
        dl.innerHTML = (v.lifecycle || []).map(function (nm, i) {
          return '<div class="deadlines__row"><span class="deadlines__step">Etapa ' + (i + 1) + ' — ' + esc(nm) + '</span><span class="deadlines__date">—</span></div>';
        }).join('');
        return;
      }
      dl.innerHTML = t.steps.map(function (st, i) {
        return '<div class="deadlines__row"><span class="deadlines__step">Etapa ' + (i + 1) + ' — ' + esc(st.name) + '</span>' +
          '<span class="deadlines__date">' + esc(formatDateFull(addDaysISO(dateInp.value, st.offsetDays))) + '</span></div>';
      }).join('');
    }
    tipSel.addEventListener('change', recompute);
    dateInp.addEventListener('change', recompute);
    dateInp.addEventListener('input', recompute);
    recompute();

    /* validare inline, într-o singură trecere — patternul setError */
    function setError(name, msg) {
      var f = overlay.querySelector('[data-field="' + name + '"]');
      if (!f) return;
      f.classList.toggle('has-error', !!msg);
      var el = f.querySelector('.form-error');
      if (el) el.textContent = msg || '';
    }
    overlay.querySelector('[data-modal-submit]').addEventListener('click', function (e) {
      e.preventDefault();
      var t = tpls.find(function (x) { return x.id === tipSel.value; });
      var name = overlay.querySelector('#fxm-name').value.trim();
      var client = overlay.querySelector('#fxm-client').value.trim();
      var resp = parseInt(overlay.querySelector('#fxm-resp').value, 10);
      var dateBad = !dateInp.value || dateInp.value < todayISO();
      setError('tip', t ? '' : 'Selectează șablonul de flux.');
      setError('nume', name ? '' : 'Denumirea este obligatorie.');
      setError('client', client ? '' : 'Clientul / beneficiarul este obligatoriu.');
      setError('resp', resp ? '' : 'Selectează responsabilul.');
      setError('data', dateBad ? 'Alege o dată validă (azi sau ulterioară).' : '');
      if (!t || !name || !client || !resp || dateBad) return;
      var rec = {
        id: 'fi_' + Date.now(),
        verticalId: v.id, domain: v.domain,
        name: name, clientName: client,
        templateId: t.id, templateName: t.name,
        startDate: dateInp.value,
        currentStep: 1, stepsCompleted: 0,
        status: 'analiza', responsibleIds: [resp]
      };
      window.scripticaFlowSave('flowItem', rec);
      close();
      toast('success', (v.itemLabel || 'Elementul') + ' „' + name + '" a fost creat.');
      renderRows(root, v);
    });
  }

  /* ============================================================
     DETALIU — flux-detaliu.html?id=<id>
     ============================================================ */

  function renderDetailPage(root) {
    var item = (MOCK.flowItems || []).find(function (i) { return i.id === qs('id'); });
    if (!item) { notFound(root, 'Elementul cerut nu există.'); return; }
    var v = window.scripticaVerticalById(item.verticalId);
    if (!v) { notFound(root, 'Verticala elementului nu mai există în registru.'); return; }
    if (typeof window.viewInScope === 'function' && !window.viewInScope(v.domain)) { scopeBlock(root, v.name); return; }

    document.title = item.name + ' — Scriptica';
    markNavActive(v.id);

    var steps = templateSteps(item);
    var total = steps.length;
    var done = item.stepsCompleted || 0;
    var isFinal = item.status === 'finalizat' || done >= total;

    var resp = (item.responsibleIds || []).map(function (id) {
      var e = employeeById(id);
      return e ? e.name : null;
    }).filter(Boolean).join(', ');

    var stepsHtml = steps.map(function (st, idx) {
      var n = idx + 1;
      var cls = n <= done ? 'is-done' : (n === item.currentStep && !isFinal ? 'is-current' : 'is-upcoming');
      var deadline = stepDeadline(item, idx);
      var days = daysDiff(deadline);
      var deadlineNote = (cls === 'is-done')
        ? '<span class="fx-step__meta fx-step__meta--done">Finalizată</span>'
        : '<span class="fx-step__meta' + (days < 0 && cls === 'is-current' ? ' fx-step__meta--late' : '') + '">Termen: ' + esc(formatDateFull(deadline)) +
          (cls === 'is-current' ? ' · ' + (days < 0 ? Math.abs(days) + ' zile întârziere' : days + ' zile rămase') : '') + '</span>';
      var action = (cls === 'is-current')
        ? '<button class="btn btn--primary" type="button" data-fx-advance>' +
            (n === total ? 'Finalizează ' + esc((v.itemLabel || 'elementul').toLowerCase()) : 'Finalizează etapa') +
          '</button>'
        : '';
      var icon = cls === 'is-done' ? 'check_circle' : (cls === 'is-current' ? 'radio_button_checked' : 'radio_button_unchecked');
      return '<div class="fx-step ' + cls + '">' +
        '<div class="fx-step__rail"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' +
          (n < total ? '<span class="fx-step__line"></span>' : '') + '</div>' +
        '<div class="fx-step__body">' +
          '<div class="fx-step__title">Etapa ' + n + '/' + total + ' — ' + esc(st.name) + '</div>' +
          deadlineNote +
          action +
        '</div>' +
      '</div>';
    }).join('');

    root.innerHTML =
      '<div class="sa-crumb fx-crumb"><a href="flux.html?vertical=' + esc(v.id) + '">' + esc(v.name) + '</a> › ' + esc(item.name) + '</div>' +
      '<div class="fx-head">' +
        '<div class="fx-head__ico"><span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span></div>' +
        '<div class="fx-head__main">' +
          '<h1 class="fx-head__title">' + esc(item.name) + '</h1>' +
          '<div class="fx-head__meta">' +
            '<span><b>Client:</b> ' + esc(item.clientName || '—') + '</span>' +
            '<span><b>Șablon:</b> ' + esc(item.templateName || '—') + '</span>' +
            '<span><b>Început:</b> ' + esc(formatDateFull(item.startDate)) + '</span>' +
            '<span><b>Responsabili:</b> ' + esc(resp || '—') + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="fx-head__status">' + statusHtml(item.status) + '</div>' +
      '</div>' +
      '<div class="fx-cols">' +
        '<div class="fx-card">' +
          '<div class="fx-card__title">Etapele fluxului</div>' +
          '<div class="fx-steps">' + stepsHtml + '</div>' +
        '</div>' +
        '<div class="fx-card">' +
          '<div class="fx-card__title">Despre verticală</div>' +
          '<p class="fx-about">' + esc(v.description || '') + '</p>' +
          '<div class="fx-about__note"><span class="material-symbols-outlined" aria-hidden="true">info</span>' +
            'Structura acestui flux este gestionată de administratorul platformei pentru profilul firmei tale.</div>' +
          '<div class="fx-about__note"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>' +
            'Orice verticală nouă definită în registru primește automat această formă standard: etape, termene și status. ' +
            'Modulele avansate — documente, mesagerie, anexe — se activează per verticală, ca la Situații Contabile și Misiuni de Audit.</div>' +
        '</div>' +
      '</div>';

    var adv = root.querySelector('[data-fx-advance]');
    if (adv) adv.addEventListener('click', function () {
      var upd = Object.assign({}, item);
      upd.stepsCompleted = Math.min(total, (upd.stepsCompleted || 0) + 1);
      if (upd.stepsCompleted >= total) {
        upd.currentStep = total;
        upd.status = 'finalizat';
      } else {
        upd.currentStep = upd.stepsCompleted + 1;
        upd.status = 'in_verificare';
      }
      window.scripticaFlowSave('flowItem', upd);
      toast('success', upd.status === 'finalizat'
        ? (v.itemLabel || 'Elementul') + ' a fost finalizat.'
        : 'Etapa a fost finalizată — urmează „' + steps[upd.currentStep - 1].name + '".');
      renderDetailPage(root);
    });
  }

  /* Item-ul de nav injectat pentru verticala curentă (flux.html?vertical=X)
     nu se potrivește pe filename — îl marcăm manual ca activ. */
  function markNavActive(verticalId) {
    var nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(function (it) {
      var href = it.getAttribute('href') || '';
      var isThis = href.indexOf('flux.html') !== -1 && href.indexOf('vertical=' + verticalId) !== -1;
      it.classList.toggle('nav-item--active', isThis);
      var icon = it.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.toggle('filled', isThis);
    });
  }

})();
