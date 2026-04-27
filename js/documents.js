/* ============================================================
   Scriptica — Documents section (Phase 4b)
   Tabs, sub-filters, search, multi-select, bulk actions,
   AI extraction modal, edit modal, reclasifică menu,
   full-screen splitter, upload flow.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  if (!MOCK) return;

  var state = {
    situationId: null,
    tab: 'all',
    subfilters: { bonuri: false, ue: false, 'non-ue': false },
    search: '',
    searchOpen: false,
    selected: new Set(),
    // Holds the row id whose row menu is currently open
    rowMenuOpenFor: null,
    flashIds: []
  };

  var CATEGORY_LABELS = {
    intrare: 'Intrare',
    iesire: 'Ieșire',
    salarizare: 'Salarizare',
    necategorisit: 'Necategorisit'
  };

  var AI_TYPE_OPTIONS = [
    'Factură furnizor', 'Factură emisă', 'Bon fiscal', 'NIR',
    'Aviz / Proces verbal', 'E-mail de transmitere', 'Document HR',
    'Situația stocurilor', 'Balanță de verificare', 'Registru de casă',
    'Registru imobilizări', 'Foaie de parcurs', 'Document multiplu', 'Altul'
  ];

  var SEGMENT_COLORS = ['#47386A', '#38BA31', '#F9A956', '#FF3C80', '#5B4D7A'];

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('docs-section')) return;
    state.situationId = resolveSituationId();
    render();
    bindUploadButton();
    bindOutsideClicks();
  });

  function resolveSituationId() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var s = MOCK.situations.find(function (x) { return x.id === id; });
    return (s || MOCK.situations[0]).id;
  }

  function getDocs() {
    return (MOCK.documents || []).filter(function (d) { return d.situationId === state.situationId; });
  }

  /* ---------- Filtering + derived status ---------- */

  function isAutoVerified(d) {
    return (d.confidenceExtraction >= 90 && d.confidenceCategorization >= 90);
  }

  function isLowConf(d) {
    return (d.confidenceExtraction < 70 || d.confidenceCategorization < 70);
  }

  function effectiveCategory(d) {
    if (isLowConf(d)) return 'necategorisit';
    return d.broadCategory;
  }

  function matchesSearch(d, q) {
    if (!q) return true;
    var bag = [d.filename, d.emitent, d.observatieAI, d.tipDocument].join(' ').toLowerCase();
    bag = bag.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var needle = q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return bag.indexOf(needle) !== -1;
  }

  function matchesSubfilters(d) {
    var on = Object.keys(state.subfilters).filter(function (k) { return state.subfilters[k]; });
    if (!on.length) return true;
    return on.indexOf(d.subFilter) !== -1;
  }

  function currentFilteredDocs() {
    var docs = getDocs();
    return docs.filter(function (d) {
      var eff = effectiveCategory(d);
      if (state.tab !== 'all' && eff !== state.tab) return false;
      if (!matchesSubfilters(d)) return false;
      if (!matchesSearch(d, state.search)) return false;
      return true;
    });
  }

  /* ---------- Render ---------- */

  function render() {
    var sec = document.getElementById('docs-section');
    if (!sec) return;
    sec.innerHTML = sectionHtml();
    bindSectionEvents();
  }

  function sectionHtml() {
    var docs = getDocs();
    var counts = {
      all: docs.length,
      intrare: docs.filter(function (d) { return effectiveCategory(d) === 'intrare'; }).length,
      iesire: docs.filter(function (d) { return effectiveCategory(d) === 'iesire'; }).length,
      salarizare: docs.filter(function (d) { return effectiveCategory(d) === 'salarizare'; }).length,
      necategorisit: docs.filter(function (d) { return effectiveCategory(d) === 'necategorisit'; }).length
    };
    var filtered = currentFilteredDocs();

    var html = '';

    /* Header — title + icon cluster (search + yellow +) */
    html += '<div class="docs-section__header">' +
      '<h2 class="docs-section__title">Documente <span class="pill pill--count">(' + counts.all + ')</span></h2>' +
      '<div class="documents-toolbar__actions">' +
        '<button type="button" class="icon-btn" id="btn-doc-search" aria-label="Caută în documente"' +
          (state.searchOpen ? ' aria-expanded="true"' : '') + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
        '</button>' +
        '<button type="button" class="icon-btn icon-btn--add" id="btn-doc-add" aria-label="' +
          ((typeof getCurrentView === 'function' && getCurrentView() === 'client') ? 'Trimite documente' : 'Adaugă document') + '">' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span>' +
        '</button>' +
      '</div>' +
    '</div>';

    /* Collapsed search pill — visible when toggle is on or there's an active query */
    var searchVisible = state.searchOpen || (state.search && state.search.length > 0);
    html += '<div class="documents-toolbar__search"' + (searchVisible ? '' : ' hidden') + ' id="doc-search-wrap">' +
      '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
      '<input type="search" class="documents-toolbar__search-input" id="doc-search" placeholder="Caută în documente... (nume, emitent, descriere AI)" value="' + esc(state.search) + '">' +
    '</div>';

    /* Tabs */
    html += '<div class="doc-tabs" role="tablist">' +
      tabHtml('all',           'Toate',          counts.all) +
      tabHtml('intrare',       'Intrare',        counts.intrare) +
      tabHtml('iesire',        'Ieșire',         counts.iesire) +
      tabHtml('salarizare',    'Salarizare',     counts.salarizare) +
      tabHtml('necategorisit', 'Necategorisit',  counts.necategorisit, counts.necategorisit > 0) +
    '</div>';

    /* Sub-filters */
    html += '<div class="doc-subfilters">' +
      '<span class="doc-subfilters__label">Filtre suplimentare:</span>' +
      '<label class="checkbox"><input type="checkbox" data-subfilter="bonuri"' + (state.subfilters.bonuri ? ' checked' : '') + '> Bonuri</label>' +
      '<label class="checkbox"><input type="checkbox" data-subfilter="ue"'     + (state.subfilters.ue     ? ' checked' : '') + '> UE</label>' +
      '<label class="checkbox"><input type="checkbox" data-subfilter="non-ue"' + (state.subfilters['non-ue'] ? ' checked' : '') + '> Non-UE</label>' +
    '</div>';

    /* Bulk bar */
    html += bulkBarHtml();

    /* Table */
    html += tableHtml(filtered);

    return html;
  }

  function tabHtml(key, label, count, showBadge) {
    var active = state.tab === key;
    return '<button type="button" class="doc-tab' + (active ? ' is-active' : '') + '" data-tab="' + key + '" role="tab">' +
      esc(label) +
      (key === 'necategorisit' && showBadge ?
        ' <span class="pill pill--critical">' + count + '</span>' :
        ' <span class="pill--count" style="color: inherit; font-weight: 700;">(' + count + ')</span>') +
    '</button>';
  }

  function bulkBarHtml() {
    var n = state.selected.size;
    return '<div class="bulk-bar' + (n > 0 ? ' is-visible' : '') + '" id="bulk-bar">' +
      '<div>' +
        '<span class="bulk-bar__count">' + n + ' documente selectate</span>' +
        '<button type="button" class="bulk-bar__deselect" id="bulk-deselect">Deselectează tot</button>' +
      '</div>' +
      '<div class="bulk-bar__actions">' +
        '<button type="button" class="btn btn--inverted" id="bulk-reclass">' +
          'Reclasifică <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>' +
        '</button>' +
        '<div class="reclass-menu" id="bulk-reclass-menu">' +
          '<div class="reclass-menu__item" data-bulk-move="intrare">Mută în Intrare</div>' +
          '<div class="reclass-menu__item" data-bulk-move="iesire">Mută în Ieșire</div>' +
          '<div class="reclass-menu__item" data-bulk-move="salarizare">Mută în Salarizare</div>' +
          '<div class="reclass-menu__item" data-bulk-move="necategorisit">Mută în Necategorisit</div>' +
        '</div>' +
        '<button type="button" class="btn btn--inverted" id="bulk-download" title="Descarcă">' +
          '<span class="material-symbols-outlined" aria-hidden="true">download</span>' +
        '</button>' +
        '<button type="button" class="btn btn--inverted-danger" id="bulk-delete" title="Șterge">' +
          '<span class="material-symbols-outlined" aria-hidden="true">delete</span>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  function tableHtml(docs) {
    if (!docs.length) {
      return '<div class="docs-table-wrap"><div class="docs-empty">' +
        '<span class="material-symbols-outlined" aria-hidden="true" style="font-size:48px;color:var(--color-border-strong);display:block;margin-bottom:var(--space-2);">search_off</span>' +
        '<p>Niciun document nu corespunde filtrelor curente.</p>' +
      '</div></div>';
    }
    var visibleAllSelected = docs.every(function (d) { return state.selected.has(d.id); });

    var rows = docs.map(docRowHtml).join('');
    return '<div class="docs-table-wrap">' +
      '<table class="docs-table">' +
        '<colgroup>' +
          '<col style="width:44px">' +
          '<col>' +
          '<col>' +
          '<col style="width:140px">' +
          '<col style="width:180px">' +
        '</colgroup>' +
        '<thead><tr>' +
          '<th><input type="checkbox" id="docs-select-all"' + (visibleAllSelected ? ' checked' : '') + '></th>' +
          '<th>Nume Document</th>' +
          '<th>Descriere <span class="docs-table__header-hint">(interpretare AI)</span></th>' +
          '<th>Status Verificare</th>' +
          '<th style="text-align:right;">Acțiuni</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>';
  }

  function docRowHtml(d) {
    var selected = state.selected.has(d.id);
    var flash = state.flashIds.indexOf(d.id) !== -1;
    var srcIcon = sourceIcon(d.source);

    var confStatus = confidenceStatus(d);
    var statusText = confStatus === 'low' ? 'Verificare' :
                     (d.verificat || d.verificatManual) ? 'Verificat' : 'În așteptare';
    var statusCls = confStatus === 'low' ? 'doc-status--low' :
                    (d.verificat || d.verificatManual) ? 'doc-status--verificat' : 'doc-status--pending';
    var statusDotCls = confStatus === 'low' ? 'status-dot--intarziere' :
                       (d.verificat || d.verificatManual) ? 'status-dot--finalizat' : 'status-dot--asteapta_documente';

    var actionsHtml = '<div class="doc-actions" data-doc-id="' + esc(d.id) + '">';
    actionsHtml +=
      '<button type="button" class="doc-actions__icon" title="Partajare" data-act="share">' +
        '<span class="material-symbols-outlined" aria-hidden="true">share</span>' +
      '</button>' +
      '<button type="button" class="doc-actions__icon" title="Descarcă" data-act="download">' +
        '<span class="material-symbols-outlined" aria-hidden="true">download</span>' +
      '</button>' +
      '<button type="button" class="doc-actions__icon" title="Editează detalii" data-act="edit">' +
        '<span class="material-symbols-outlined" aria-hidden="true">edit</span>' +
      '</button>' +
      '<button type="button" class="doc-actions__icon" title="Reclasifică" data-act="reclass">' +
        '<span class="material-symbols-outlined" aria-hidden="true">swap_horiz</span>' +
      '</button>';
    if (d.multiDoc && d.multiDocConfidence === 'ambiguous') {
      actionsHtml +=
        '<button type="button" class="doc-actions__icon doc-actions__icon--split" title="Separă documente" data-act="split">' +
          '<span class="material-symbols-outlined" aria-hidden="true">call_split</span>' +
        '</button>';
    }
    actionsHtml += rowReclassMenuHtml(d.id);
    actionsHtml += '</div>';

    var tipPrefix = d.tipDocument ?
      '<span class="doc-row__tip">' + esc(getDocTipPrefix(d.tipDocument)) + '</span>' : '';

    return '<tr class="doc-row' + (selected ? ' is-selected' : '') + (flash ? ' is-flash' : '') + '" data-doc-id="' + esc(d.id) + '">' +
      '<td class="doc-checkbox"><input type="checkbox" data-select-doc="' + esc(d.id) + '"' + (selected ? ' checked' : '') + '></td>' +
      '<td>' +
        '<div class="doc-name" data-act="open">' +
          '<span class="material-symbols-outlined doc-name__source" aria-hidden="true">' + srcIcon + '</span>' +
          '<span class="doc-name__filename">' + esc(d.filename) + '</span>' +
        '</div>' +
        (d.multiDoc && d.multiDocConfidence === 'ambiguous' ?
          '<div class="doc-type__multi-warn" style="margin-top: var(--space-1);"><span class="material-symbols-outlined" aria-hidden="true" style="font-size:14px;">warning</span>Documente multiple</div>' : '') +
      '</td>' +
      '<td>' +
        '<div class="doc-desc__text">' + tipPrefix + esc(d.observatieAI || '') + '</div>' +
      '</td>' +
      '<td>' +
        '<span class="doc-status ' + statusCls + '">' +
          '<span class="status-dot ' + statusDotCls + '"></span>' +
          statusText +
        '</span>' +
      '</td>' +
      '<td>' + actionsHtml + '</td>' +
    '</tr>';
  }

  function rowReclassMenuHtml(docId) {
    var open = state.rowMenuOpenFor === docId;
    return '<div class="doc-row-menu' + (open ? ' is-open' : '') + '" data-row-menu-for="' + esc(docId) + '">' +
      '<div class="doc-row-menu__item" data-row-move="intrare">Mută în Intrare</div>' +
      '<div class="doc-row-menu__item" data-row-move="iesire">Mută în Ieșire</div>' +
      '<div class="doc-row-menu__item" data-row-move="salarizare">Mută în Salarizare</div>' +
      '<div class="doc-row-menu__item" data-row-move="necategorisit">Mută în Necategorisit</div>' +
      '<div class="doc-row-menu__divider"></div>' +
      '<div class="doc-row-menu__item" data-row-sub="bonuri">Marchează ca Bonuri</div>' +
      '<div class="doc-row-menu__item" data-row-sub="ue">Marchează ca UE</div>' +
      '<div class="doc-row-menu__item" data-row-sub="non-ue">Marchează ca Non-UE</div>' +
    '</div>';
  }

  function sourceIcon(src) {
    if (src === 'email') return 'mail';
    if (src === 'whatsapp') return 'chat';
    return 'upload_file';
  }

  function confidenceStatus(d) {
    var min = Math.min(d.confidenceExtraction, d.confidenceCategorization);
    if (min >= 90) return 'high';
    if (min >= 70) return 'mid';
    return 'low';
  }

  /* ---------- Event binding on re-rendered section ---------- */

  function bindSectionEvents() {
    var sec = document.getElementById('docs-section');
    if (!sec) return;

    /* Tabs */
    sec.querySelectorAll('[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () {
        state.tab = t.getAttribute('data-tab');
        state.selected.clear();
        state.rowMenuOpenFor = null;
        render();
      });
    });

    /* Sub-filters */
    sec.querySelectorAll('[data-subfilter]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        state.subfilters[cb.getAttribute('data-subfilter')] = cb.checked;
        state.selected.clear();
        render();
      });
    });

    /* Search input (inside the collapsed pill) */
    var search = sec.querySelector('#doc-search');
    if (search) {
      search.addEventListener('input', function () {
        state.search = search.value;
        render();
        var again = document.getElementById('doc-search');
        if (again) {
          again.focus();
          var len = again.value.length;
          again.setSelectionRange(len, len);
        }
      });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          state.searchOpen = false;
          state.search = '';
          render();
        }
      });
      if (state.searchOpen) {
        setTimeout(function () { search.focus(); }, 0);
      }
    }

    /* Search toggle (magnifier icon in the header) */
    var searchBtn = sec.querySelector('#btn-doc-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        if (state.searchOpen || state.search) {
          state.searchOpen = false;
          state.search = '';
        } else {
          state.searchOpen = true;
        }
        render();
      });
    }

    /* Add button (yellow circular +) */
    var addBtn = sec.querySelector('#btn-doc-add');
    if (addBtn) addBtn.addEventListener('click', openUploadModal);

    /* Select all */
    var selectAll = sec.querySelector('#docs-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', function () {
        var filtered = currentFilteredDocs();
        if (selectAll.checked) filtered.forEach(function (d) { state.selected.add(d.id); });
        else filtered.forEach(function (d) { state.selected.delete(d.id); });
        render();
      });
    }

    /* Row checkboxes */
    sec.querySelectorAll('[data-select-doc]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = cb.getAttribute('data-select-doc');
        if (cb.checked) state.selected.add(id);
        else state.selected.delete(id);
        render();
      });
    });

    /* Bulk bar */
    var deselect = sec.querySelector('#bulk-deselect');
    if (deselect) deselect.addEventListener('click', function () { state.selected.clear(); render(); });
    var bulkReclass = sec.querySelector('#bulk-reclass');
    var bulkMenu = sec.querySelector('#bulk-reclass-menu');
    if (bulkReclass) bulkReclass.addEventListener('click', function (e) {
      e.stopPropagation();
      bulkMenu.classList.toggle('is-open');
    });
    sec.querySelectorAll('[data-bulk-move]').forEach(function (el) {
      el.addEventListener('click', function () {
        var to = el.getAttribute('data-bulk-move');
        (MOCK.documents || []).forEach(function (d) {
          if (state.selected.has(d.id)) d.broadCategory = to;
        });
        showToast('success', state.selected.size + ' documente reclasificate.');
        state.selected.clear();
        render();
      });
    });
    var dlBtn = sec.querySelector('#bulk-download');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      console.log('[Scriptica] Descarcă documente selectate (nefuncțional).');
      showToast('info', 'Funcție disponibilă în versiunea finală.');
    });
    var delBtn = sec.querySelector('#bulk-delete');
    if (delBtn) delBtn.addEventListener('click', function () {
      var n = state.selected.size;
      if (!n) return;
      var ok = confirm('Șterge ' + n + ' documente selectate? Acțiunea nu poate fi revocată.');
      if (!ok) return;
      MOCK.documents = MOCK.documents.filter(function (d) { return !state.selected.has(d.id); });
      state.selected.clear();
      showToast('success', n + ' documente șterse.');
      render();
    });

    /* Row actions + filename click */
    sec.querySelectorAll('.doc-row').forEach(function (row) {
      var docId = row.getAttribute('data-doc-id');

      row.querySelectorAll('[data-act]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var act = btn.getAttribute('data-act');
          if (act === 'open') {
            var ro = (typeof getCurrentView === 'function' && getCurrentView() === 'client');
            return openAiModal(docId, { readOnly: ro });
          }
          if (act === 'share') { console.log('[Scriptica] Partajare', docId); showToast('info', 'Funcție disponibilă în versiunea finală.'); return; }
          if (act === 'download') { console.log('[Scriptica] Descarcă', docId); showToast('info', 'Funcție disponibilă în versiunea finală.'); return; }
          if (act === 'edit') return openEditModal(docId);
          if (act === 'reclass') {
            state.rowMenuOpenFor = (state.rowMenuOpenFor === docId) ? null : docId;
            render();
            return;
          }
          if (act === 'split') return openSplitterModal(docId);
        });
      });

      // Row menu items
      row.querySelectorAll('[data-row-move]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          var doc = findDoc(docId);
          if (!doc) return;
          doc.broadCategory = el.getAttribute('data-row-move');
          state.rowMenuOpenFor = null;
          showToast('success', 'Document reclasificat.');
          render();
        });
      });
      row.querySelectorAll('[data-row-sub]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          var doc = findDoc(docId);
          if (!doc) return;
          doc.subFilter = el.getAttribute('data-row-sub');
          state.rowMenuOpenFor = null;
          showToast('success', 'Sub-filtru aplicat.');
          render();
        });
      });
    });

    // Clear flash marks after animation runs
    if (state.flashIds.length) {
      setTimeout(function () {
        state.flashIds = [];
      }, 2100);
    }
  }

  function bindOutsideClicks() {
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#bulk-reclass') && !e.target.closest('#bulk-reclass-menu')) {
        var menu = document.getElementById('bulk-reclass-menu');
        if (menu) menu.classList.remove('is-open');
      }
      if (!e.target.closest('.doc-actions') && state.rowMenuOpenFor) {
        state.rowMenuOpenFor = null;
        render();
      }
    });
  }

  function bindUploadButton() { /* handled in bindSectionEvents */ }

  function findDoc(id) {
    return (MOCK.documents || []).find(function (d) { return d.id === id; });
  }

  /* =============================================================
     AI Extraction Modal
     ============================================================= */

  function openAiModal(docId, opts) {
    opts = opts || {};
    var readOnly = !!opts.readOnly;
    var d = findDoc(docId);
    if (!d) return;
    var modal = document.getElementById('modal-ai');
    if (!modal) return;

    modal.querySelector('[data-ai-meta]').textContent =
      (d.filename || '') + ' · ' + sourceLabel(d.source) + ' · ' + formatDate(d.uploadedAt);
    modal.querySelector('[data-ai-status]').outerHTML = statusStripHtml(d);
    modal.querySelector('[data-ai-observation]').innerHTML =
      '<span class="material-symbols-outlined" aria-hidden="true">info</span>' +
      '<span><b>Observație AI:</b> ' + esc(d.observatieAI || '—') + '</span>';
    modal.querySelector('[data-ai-fields]').innerHTML = fieldsHtml(d);

    var svg = renderDocumentPreview(d);
    modal.querySelector('[data-ai-preview-svg]').innerHTML = svg;
    modal.querySelector('[data-ai-preview-filename]').textContent = d.filename || '';

    var previewCard = modal.querySelector('[data-ai-preview-card]');
    if (previewCard) {
      previewCard.onclick = function () { openPreviewFullscreen(d, previewCard); };
      previewCard.onkeydown = function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPreviewFullscreen(d, previewCard);
        }
      };
    }

    var editBtn     = modal.querySelector('[data-ai-edit]');
    var reclassBtn  = modal.querySelector('[data-ai-reclass]');
    var downloadBtn = modal.querySelector('[data-ai-download]');

    if (readOnly) {
      if (editBtn) editBtn.style.display = 'none';
      if (reclassBtn) reclassBtn.style.display = 'none';
    } else {
      if (editBtn) editBtn.style.display = '';
      if (reclassBtn) reclassBtn.style.display = '';
      if (editBtn) editBtn.onclick = function () {
        closeModal(modal);
        openEditModal(d.id);
      };
      if (reclassBtn) reclassBtn.onclick = function () {
        closeModal(modal);
        showToast('info', 'Folosește pictograma ⇄ din rând pentru a reclasifica.');
      };
    }

    if (downloadBtn) downloadBtn.onclick = function () {
      console.log('[Scriptica] Descarcă', d.id);
      showToast('info', 'Funcție disponibilă în versiunea finală.');
    };

    var closeBtn = modal.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.onclick = function () { closeModal(modal); };
    modal.querySelector('[data-ai-close]').onclick = function () { closeModal(modal); };

    openModal(modal);
  }

  function statusStripHtml(d) {
    var min = Math.min(d.confidenceExtraction, d.confidenceCategorization);
    var level, icon, label;
    if (min >= 90) {
      level = 'success'; icon = 'check_circle'; label = 'Document clar și lizibil';
    } else if (min >= 70) {
      level = 'warning'; icon = 'info'; label = 'Verificare recomandată';
    } else {
      level = 'critical'; icon = 'error'; label = 'Încredere scăzută';
    }
    return '<div class="doc-modal__status-strip doc-modal__status-strip--' + level + '" data-ai-status>' +
      '<span class="material-symbols-outlined doc-modal__status-icon" aria-hidden="true">' + icon + '</span>' +
      '<span class="doc-modal__status-label">' + esc(label) + '</span>' +
      '<span class="doc-modal__status-divider">·</span>' +
      '<span class="doc-modal__status-metric">Citire <b>' + d.confidenceExtraction + '%</b></span>' +
      '<span class="doc-modal__status-divider">·</span>' +
      '<span class="doc-modal__status-metric">Categorisire <b>' + d.confidenceCategorization + '%</b></span>' +
    '</div>';
  }

  function fieldsHtml(d) {
    var moneda = d.moneda || 'RON';
    var rows = [
      { icon: 'description',        label: 'Tip document',     value: d.tipDocument },
      { icon: 'business',           label: 'Emitent',          value: d.emitent },
      { icon: 'tag',                label: 'Număr document',   value: d.numarDocument },
      { icon: 'calendar_today',     label: 'Data emiterii',    value: formatDate(d.dataEmiterii) },
      { icon: 'date_range',         label: 'Perioadă fiscală', value: d.perioadaFiscala },
      { icon: 'attach_money',       label: 'Valoare fără TVA', value: d.valoareFaraTVA != null ? formatMoney(d.valoareFaraTVA) + ' ' + moneda : null },
      { icon: 'percent',            label: 'TVA',              value: d.tvaProcent != null ? d.tvaProcent + '% – ' + (d.tvaValoare != null ? formatMoney(d.tvaValoare) + ' ' + moneda : '—') : null },
      { icon: 'receipt_long',       label: 'Valoare totală',   value: d.valoareTotala != null ? formatMoney(d.valoareTotala) + ' ' + moneda : null },
      { icon: 'payments',           label: 'Monedă',           value: d.moneda },
      { icon: 'label',              label: 'Categorie propusă', value: d.categoriePropusa, category: true },
      { icon: sourceIcon(d.source), label: 'Sursă document',   value: sourceLabel(d.source) }
    ];
    return rows.map(function (r) {
      var empty = (r.value == null || r.value === '');
      var valueContent;
      if (r.category) {
        var mismatch = isLowConf(d);
        var statusCls = mismatch ? 'doc-modal__field-status--mismatch' : 'doc-modal__field-status--ok';
        var statusIcon = mismatch ? 'error' : 'check_circle';
        var statusTitle = mismatch ? 'Categorie nepotrivită — verificare recomandată' : 'Categorizare corectă';
        var inner = empty ? '<span class="doc-modal__field-value--empty">—</span>' : esc(r.value);
        valueContent =
          '<span class="doc-modal__field-value doc-modal__field-value--with-status">' +
            '<span>' + inner + '</span>' +
            '<span class="doc-modal__field-status ' + statusCls + '" title="' + esc(statusTitle) + '">' +
              '<span class="material-symbols-outlined" aria-hidden="true">' + statusIcon + '</span>' +
            '</span>' +
          '</span>';
      } else {
        valueContent = empty
          ? '<span class="doc-modal__field-value doc-modal__field-value--empty">—</span>'
          : '<span class="doc-modal__field-value">' + esc(r.value) + '</span>';
      }
      return '<div class="doc-modal__field">' +
        '<span class="doc-modal__field-icon">' +
          '<span class="material-symbols-outlined" aria-hidden="true">' + r.icon + '</span>' +
        '</span>' +
        '<span class="doc-modal__field-label">' + esc(r.label) + '</span>' +
        valueContent +
      '</div>';
    }).join('');
  }

  /* =============================================================
     Document preview (mocked SVG per type + fullscreen overlay)
     ============================================================= */

  var previewFullscreenState = null;

  function openPreviewFullscreen(d, returnFocusEl) {
    var overlay = document.getElementById('doc-preview-fullscreen');
    if (!overlay) return;
    overlay.querySelector('[data-preview-filename]').textContent = d.filename || '';
    overlay.querySelector('[data-preview-pagenum]').textContent = 'Pagina 1 / ' + (d.pagesCount || 1);
    overlay.querySelector('[data-preview-svg]').innerHTML = renderDocumentPreview(d);

    overlay.classList.add('is-open');
    overlay.removeAttribute('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    var closeBtn = overlay.querySelector('[data-preview-close]');
    var backdrop = overlay.querySelector('[data-preview-backdrop]');

    function close() { closePreviewFullscreen(); }
    function keyHandler(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      } else if (e.key === 'Tab') {
        trapFocus(e, overlay.querySelector('.doc-preview-fullscreen__panel'));
      }
    }

    closeBtn.onclick = close;
    backdrop.onclick = close;
    document.addEventListener('keydown', keyHandler, true);

    previewFullscreenState = { overlay: overlay, keyHandler: keyHandler, returnFocusEl: returnFocusEl || null };

    setTimeout(function () { closeBtn.focus(); }, 0);
  }

  function closePreviewFullscreen() {
    var st = previewFullscreenState;
    if (!st) return;
    st.overlay.classList.remove('is-open');
    st.overlay.setAttribute('hidden', '');
    st.overlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', st.keyHandler, true);
    // Only release body scroll if the main modal isn't also open
    var mainModal = document.getElementById('modal-ai');
    if (!mainModal || !mainModal.classList.contains('is-open')) {
      document.body.style.overflow = '';
    }
    if (st.returnFocusEl && typeof st.returnFocusEl.focus === 'function') {
      st.returnFocusEl.focus();
    }
    previewFullscreenState = null;
  }

  function renderDocumentPreview(d) {
    var tpl = d.previewTemplate || 'default';
    switch (tpl) {
      case 'factura':      return renderFacturaPreview(d);
      case 'bon':          return renderBonPreview(d);
      case 'balanta':      return renderBalantaPreview(d);
      case 'jurnal':       return renderJurnalPreview(d);
      case 'stat-salarii': return renderStatSalariiPreview(d);
      case 'declaratie':   return renderDeclaratiePreview(d);
      case 'nir':          return renderNirPreview(d);
      case 'email':        return renderEmailPreview(d);
      default:             return renderDefaultPreview(d);
    }
  }

  function escapeXml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDateShort(iso) {
    if (!iso) return '—';
    var parts = String(iso).split('T')[0].split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function formatMoneyMaybe(v, cur) {
    if (v == null) return '—';
    var s = Number(v).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return cur ? (s + ' ' + cur) : s;
  }

  function renderFacturaPreview(d) {
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<rect x="15" y="15" width="50" height="6" fill="#47386A" opacity="0.85" rx="1"/>' +
      '<text x="15" y="30" font-size="4" fill="#47386A" font-weight="700">' + escapeXml(d.emitent || '') + '</text>' +
      '<rect x="15" y="33" width="80" height="1.5" fill="#47386A" opacity="0.15"/>' +
      '<rect x="15" y="37" width="60" height="1.5" fill="#47386A" opacity="0.15"/>' +
      '<text x="195" y="22" font-size="6" fill="#47386A" font-weight="700" text-anchor="end">FACTURĂ</text>' +
      '<text x="195" y="30" font-size="3.5" fill="#47386A" text-anchor="end">Nr. ' + escapeXml(d.numarDocument || '—') + '</text>' +
      '<text x="195" y="36" font-size="3.5" fill="#47386A" text-anchor="end">' + escapeXml(formatDateShort(d.dataEmiterii)) + '</text>' +
      '<text x="15" y="60" font-size="3.5" fill="#47386A" font-weight="700">CĂTRE:</text>' +
      '<rect x="15" y="64" width="100" height="1.5" fill="#47386A" opacity="0.15"/>' +
      '<rect x="15" y="68" width="85" height="1.5" fill="#47386A" opacity="0.15"/>' +
      '<rect x="15" y="72" width="70" height="1.5" fill="#47386A" opacity="0.15"/>' +
      '<rect x="15" y="95" width="180" height="5" fill="#47386A" opacity="0.85"/>' +
      '<text x="20" y="98.5" font-size="2.8" fill="white" font-weight="700">DESCRIERE</text>' +
      '<text x="130" y="98.5" font-size="2.8" fill="white" font-weight="700">CANT.</text>' +
      '<text x="155" y="98.5" font-size="2.8" fill="white" font-weight="700">PREȚ</text>' +
      '<text x="193" y="98.5" font-size="2.8" fill="white" font-weight="700" text-anchor="end">TOTAL</text>' +
      '<rect x="15" y="102" width="180" height="5" fill="#F5F5FD"/>' +
      '<rect x="15" y="108" width="180" height="0.3" fill="#47386A" opacity="0.1"/>' +
      '<rect x="15" y="113" width="180" height="5" fill="#F5F5FD"/>' +
      '<rect x="15" y="119" width="180" height="0.3" fill="#47386A" opacity="0.1"/>' +
      '<rect x="15" y="124" width="180" height="5" fill="#F5F5FD"/>' +
      '<rect x="120" y="145" width="75" height="32" fill="#F5F5FD" rx="1"/>' +
      '<text x="125" y="152" font-size="3" fill="#47386A">Subtotal:</text>' +
      '<text x="190" y="152" font-size="3" fill="#47386A" text-anchor="end" font-weight="700">' + escapeXml(formatMoneyMaybe(d.valoareFaraTVA, d.moneda)) + '</text>' +
      '<text x="125" y="160" font-size="3" fill="#47386A">TVA ' + (d.tvaProcent || 0) + '%:</text>' +
      '<text x="190" y="160" font-size="3" fill="#47386A" text-anchor="end" font-weight="700">' + escapeXml(formatMoneyMaybe(d.tvaValoare, d.moneda)) + '</text>' +
      '<rect x="125" y="163" width="65" height="0.3" fill="#47386A" opacity="0.3"/>' +
      '<text x="125" y="171" font-size="3.5" fill="#47386A" font-weight="700">TOTAL:</text>' +
      '<text x="190" y="171" font-size="3.5" fill="#FFBF14" text-anchor="end" font-weight="700">' + escapeXml(formatMoneyMaybe(d.valoareTotala, d.moneda)) + '</text>' +
      '<rect x="15" y="245" width="80" height="1" fill="#47386A" opacity="0.15"/>' +
      '<rect x="15" y="250" width="60" height="1" fill="#47386A" opacity="0.15"/>' +
      '<rect x="15" y="270" width="40" height="1" fill="#47386A" opacity="0.3"/>' +
      '<text x="15" y="278" font-size="2.5" fill="#47386A" opacity="0.6">Semnătură și ștampilă</text>' +
    '</svg>';
  }

  function renderBonPreview(d) {
    var barcodeRects = '';
    var widths = [0.8, 0.3, 1.2, 0.5, 0.8, 0.3, 1.5, 0.5, 1, 0.3, 0.8, 1.2, 0.5, 0.8, 0.3, 1, 0.5, 0.8, 1.2, 0.5, 0.8, 0.3, 1.5, 0.5, 0.8, 0.3, 1, 0.8, 0.3, 1.2];
    var bx = 82;
    widths.forEach(function (w) {
      barcodeRects += '<rect x="' + bx + '" y="170" width="' + w + '" height="15"/>';
      bx += w + 0.4;
    });
    var fiveItem = (d.valoareTotala != null) ? (d.valoareTotala - 173.5) : null;
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<rect x="65" y="20" width="80" height="230" fill="#FAFAFA" stroke="#47386A" stroke-width="0.3" stroke-opacity="0.2" rx="2"/>' +
      '<text x="105" y="32" font-size="4.5" fill="#47386A" font-weight="700" text-anchor="middle">' + escapeXml((d.emitent || '').toUpperCase()) + '</text>' +
      '<rect x="80" y="38" width="50" height="0.5" fill="#47386A" opacity="0.3"/>' +
      '<text x="105" y="45" font-size="2.8" fill="#47386A" text-anchor="middle" opacity="0.7">BON FISCAL</text>' +
      '<text x="105" y="51" font-size="2.5" fill="#47386A" text-anchor="middle" opacity="0.5">' + escapeXml(formatDateShort(d.dataEmiterii)) + '</text>' +
      '<line x1="72" y1="58" x2="138" y2="58" stroke="#47386A" stroke-width="0.3" stroke-dasharray="1 1" opacity="0.5"/>' +
      '<g font-size="2.5" fill="#47386A">' +
        '<text x="72" y="68">Articol 1</text><text x="138" y="68" text-anchor="end" font-weight="700">45,20</text>' +
        '<text x="72" y="76">Articol 2</text><text x="138" y="76" text-anchor="end" font-weight="700">28,50</text>' +
        '<text x="72" y="84">Articol 3</text><text x="138" y="84" text-anchor="end" font-weight="700">67,00</text>' +
        '<text x="72" y="92">Articol 4</text><text x="138" y="92" text-anchor="end" font-weight="700">32,80</text>' +
        '<text x="72" y="100">Articol 5</text><text x="138" y="100" text-anchor="end" font-weight="700">' + escapeXml(fiveItem != null ? formatMoneyMaybe(fiveItem, '') : '—') + '</text>' +
      '</g>' +
      '<line x1="72" y1="108" x2="138" y2="108" stroke="#47386A" stroke-width="0.3" stroke-dasharray="1 1" opacity="0.5"/>' +
      '<text x="72" y="118" font-size="2.8" fill="#47386A">TVA ' + (d.tvaProcent || 19) + '%:</text>' +
      '<text x="138" y="118" font-size="2.8" fill="#47386A" text-anchor="end" font-weight="700">' + escapeXml(formatMoneyMaybe(d.tvaValoare, '')) + '</text>' +
      '<rect x="68" y="124" width="74" height="8" fill="#FFBF14" opacity="0.25" rx="1"/>' +
      '<text x="72" y="130" font-size="3.5" fill="#47386A" font-weight="700">TOTAL:</text>' +
      '<text x="138" y="130" font-size="3.5" fill="#47386A" text-anchor="end" font-weight="700">' + escapeXml(formatMoneyMaybe(d.valoareTotala, d.moneda)) + '</text>' +
      '<text x="105" y="150" font-size="2.3" fill="#47386A" text-anchor="middle" opacity="0.6">MULȚUMIM!</text>' +
      '<text x="105" y="156" font-size="2" fill="#47386A" text-anchor="middle" opacity="0.5">Numar bon: ' + escapeXml(d.numarDocument || '—') + '</text>' +
      '<g fill="#47386A" opacity="0.7">' + barcodeRects + '</g>' +
    '</svg>';
  }

  function renderBalantaPreview(d) {
    var rows = '';
    for (var i = 0; i < 14; i++) {
      var y = 55 + i * 12;
      var debit = (((i * 137) % 9973) / 10).toFixed(2);
      var credit = (((i * 241) % 8971) / 10).toFixed(2);
      var sold = (((i * 193) % 7919) / 10).toFixed(2);
      rows +=
        '<rect x="15" y="' + y + '" width="180" height="10" fill="' + (i % 2 === 0 ? '#F5F5FD' : '#FFFFFF') + '" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<text x="20" y="' + (y + 7) + '" font-size="2.5" fill="#47386A">Cont ' + (4000 + i * 10) + '</text>' +
        '<text x="90" y="' + (y + 7) + '" font-size="2.5" fill="#47386A">' + debit + '</text>' +
        '<text x="140" y="' + (y + 7) + '" font-size="2.5" fill="#47386A">' + credit + '</text>' +
        '<text x="190" y="' + (y + 7) + '" font-size="2.5" fill="#47386A" text-anchor="end" font-weight="700">' + sold + '</text>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<text x="105" y="25" font-size="6" fill="#47386A" font-weight="700" text-anchor="middle">BALANȚĂ DE VERIFICARE</text>' +
      '<text x="105" y="33" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">Perioada: ' + escapeXml(d.perioadaFiscala || '—') + '</text>' +
      '<text x="105" y="40" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">' + escapeXml(d.emitent || '—') + '</text>' +
      '<rect x="15" y="48" width="180" height="6" fill="#47386A"/>' +
      '<text x="20" y="52.5" font-size="2.8" fill="white" font-weight="700">CONT</text>' +
      '<text x="90" y="52.5" font-size="2.8" fill="white" font-weight="700">DEBIT</text>' +
      '<text x="140" y="52.5" font-size="2.8" fill="white" font-weight="700">CREDIT</text>' +
      '<text x="190" y="52.5" font-size="2.8" fill="white" font-weight="700" text-anchor="end">SOLD</text>' +
      rows +
      '<rect x="15" y="225" width="180" height="8" fill="#FFBF14" opacity="0.25"/>' +
      '<text x="20" y="231" font-size="3.5" fill="#47386A" font-weight="700">TOTAL</text>' +
      '<text x="190" y="231" font-size="3.5" fill="#47386A" text-anchor="end" font-weight="700">—</text>' +
    '</svg>';
  }

  function renderJurnalPreview(d) {
    var rows = '';
    for (var i = 0; i < 18; i++) {
      var y = 55 + i * 10;
      rows +=
        '<rect x="15" y="' + y + '" width="180" height="8" fill="' + (i % 2 === 0 ? '#F5F5FD' : '#FFFFFF') + '" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<text x="20" y="' + (y + 5.5) + '" font-size="2.4" fill="#47386A">' + (i + 1) + '.</text>' +
        '<rect x="30" y="' + (y + 2.5) + '" width="50" height="1" fill="#47386A" opacity="0.2"/>' +
        '<rect x="90" y="' + (y + 2.5) + '" width="30" height="1" fill="#47386A" opacity="0.2"/>' +
        '<rect x="130" y="' + (y + 2.5) + '" width="30" height="1" fill="#47386A" opacity="0.2"/>' +
        '<rect x="170" y="' + (y + 2.5) + '" width="22" height="1" fill="#47386A" opacity="0.25"/>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<text x="105" y="25" font-size="6" fill="#47386A" font-weight="700" text-anchor="middle">' + escapeXml((d.tipDocument || 'JURNAL').toUpperCase()) + '</text>' +
      '<text x="105" y="33" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">Perioada: ' + escapeXml(d.perioadaFiscala || '—') + '</text>' +
      '<text x="105" y="40" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">' + escapeXml(d.emitent || '—') + '</text>' +
      '<rect x="15" y="48" width="180" height="5" fill="#47386A"/>' +
      '<text x="20" y="51.5" font-size="2.5" fill="white" font-weight="700">NR.</text>' +
      '<text x="30" y="51.5" font-size="2.5" fill="white" font-weight="700">DESCRIERE</text>' +
      '<text x="90" y="51.5" font-size="2.5" fill="white" font-weight="700">DEBIT</text>' +
      '<text x="130" y="51.5" font-size="2.5" fill="white" font-weight="700">CREDIT</text>' +
      '<text x="193" y="51.5" font-size="2.5" fill="white" font-weight="700" text-anchor="end">VAL.</text>' +
      rows +
    '</svg>';
  }

  function renderStatSalariiPreview(d) {
    var rows = '';
    for (var i = 0; i < 8; i++) {
      var y = 65 + i * 18;
      rows +=
        '<rect x="15" y="' + y + '" width="180" height="15" fill="' + (i % 2 === 0 ? '#F5F5FD' : '#FFFFFF') + '" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<circle cx="23" cy="' + (y + 7.5) + '" r="3.5" fill="#47386A" opacity="0.2"/>' +
        '<rect x="30" y="' + (y + 4) + '" width="35" height="1.5" fill="#47386A" opacity="0.4"/>' +
        '<rect x="30" y="' + (y + 8) + '" width="25" height="1" fill="#47386A" opacity="0.2"/>' +
        '<rect x="95" y="' + (y + 5) + '" width="18" height="1.2" fill="#47386A" opacity="0.3"/>' +
        '<rect x="125" y="' + (y + 5) + '" width="18" height="1.2" fill="#47386A" opacity="0.3"/>' +
        '<rect x="170" y="' + (y + 5) + '" width="22" height="1.5" fill="#FFBF14" opacity="0.5"/>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<rect x="15" y="15" width="45" height="6" fill="#47386A" opacity="0.85" rx="1"/>' +
      '<text x="105" y="30" font-size="5.5" fill="#47386A" font-weight="700" text-anchor="middle">STAT DE SALARII</text>' +
      '<text x="105" y="38" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">' + escapeXml(d.emitent || '—') + ' · ' + escapeXml(d.perioadaFiscala || '—') + '</text>' +
      '<rect x="15" y="55" width="180" height="5" fill="#47386A"/>' +
      '<text x="30" y="58.5" font-size="2.6" fill="white" font-weight="700">ANGAJAT</text>' +
      '<text x="100" y="58.5" font-size="2.6" fill="white" font-weight="700">BRUT</text>' +
      '<text x="130" y="58.5" font-size="2.6" fill="white" font-weight="700">REȚINERI</text>' +
      '<text x="193" y="58.5" font-size="2.6" fill="white" font-weight="700" text-anchor="end">NET</text>' +
      rows +
      '<rect x="15" y="215" width="180" height="8" fill="#FFBF14" opacity="0.25"/>' +
      '<text x="20" y="221" font-size="3.5" fill="#47386A" font-weight="700">TOTAL NET</text>' +
      '<text x="190" y="221" font-size="3.5" fill="#47386A" text-anchor="end" font-weight="700">' + escapeXml(formatMoneyMaybe(d.valoareTotala, d.moneda)) + '</text>' +
    '</svg>';
  }

  function renderDeclaratiePreview(d) {
    var sections = '';
    for (var i = 0; i < 6; i++) {
      var y = 70 + i * 30;
      sections +=
        '<rect x="15" y="' + y + '" width="180" height="4" fill="#47386A" opacity="0.85"/>' +
        '<text x="17" y="' + (y + 3) + '" font-size="2.2" fill="white" font-weight="700">SECȚIUNEA ' + String.fromCharCode(65 + i) + '</text>' +
        '<rect x="15" y="' + (y + 7) + '" width="85" height="8" fill="#F5F5FD" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<rect x="110" y="' + (y + 7) + '" width="85" height="8" fill="#F5F5FD" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<rect x="17" y="' + (y + 10) + '" width="40" height="1" fill="#47386A" opacity="0.3"/>' +
        '<rect x="112" y="' + (y + 10) + '" width="50" height="1" fill="#47386A" opacity="0.3"/>' +
        '<rect x="15" y="' + (y + 17) + '" width="180" height="6" fill="white" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<rect x="17" y="' + (y + 20) + '" width="120" height="1" fill="#47386A" opacity="0.2"/>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<rect x="0" y="0" width="210" height="12" fill="#47386A"/>' +
      '<text x="105" y="8" font-size="4" fill="white" font-weight="700" text-anchor="middle">AGENȚIA NAȚIONALĂ DE ADMINISTRARE FISCALĂ</text>' +
      '<text x="105" y="28" font-size="5.5" fill="#47386A" font-weight="700" text-anchor="middle">' + escapeXml((d.tipDocument || 'DECLARAȚIE').toUpperCase()) + '</text>' +
      '<text x="105" y="36" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">' + escapeXml(d.emitent || '—') + ' · Perioada ' + escapeXml(d.perioadaFiscala || '—') + '</text>' +
      '<rect x="15" y="45" width="180" height="15" fill="#F5F5FD" rx="1"/>' +
      '<text x="20" y="51" font-size="2.5" fill="#47386A" font-weight="700">DATE IDENTIFICARE</text>' +
      '<rect x="20" y="54" width="60" height="1" fill="#47386A" opacity="0.3"/>' +
      '<rect x="90" y="54" width="50" height="1" fill="#47386A" opacity="0.3"/>' +
      sections +
    '</svg>';
  }

  function renderNirPreview(d) {
    var rows = '';
    for (var i = 0; i < 8; i++) {
      var y = 75 + i * 14;
      rows +=
        '<rect x="15" y="' + y + '" width="180" height="11" fill="' + (i % 2 === 0 ? '#F5F5FD' : '#FFFFFF') + '" stroke="#47386A" stroke-width="0.2" stroke-opacity="0.15"/>' +
        '<text x="20" y="' + (y + 7) + '" font-size="2.5" fill="#47386A">' + (i + 1) + '.</text>' +
        '<rect x="30" y="' + (y + 3.5) + '" width="55" height="1.2" fill="#47386A" opacity="0.3"/>' +
        '<rect x="30" y="' + (y + 7) + '" width="40" height="1" fill="#47386A" opacity="0.2"/>' +
        '<text x="100" y="' + (y + 7) + '" font-size="2.4" fill="#47386A" text-anchor="middle">buc.</text>' +
        '<rect x="118" y="' + (y + 4.5) + '" width="12" height="1.5" fill="#47386A" opacity="0.3"/>' +
        '<rect x="140" y="' + (y + 4.5) + '" width="18" height="1.5" fill="#47386A" opacity="0.3"/>' +
        '<rect x="170" y="' + (y + 4.5) + '" width="22" height="1.8" fill="#FFBF14" opacity="0.5"/>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<text x="105" y="22" font-size="6" fill="#47386A" font-weight="700" text-anchor="middle">NOTĂ DE INTRARE-RECEPȚIE</text>' +
      '<text x="105" y="30" font-size="3" fill="#47386A" text-anchor="middle" opacity="0.7">Nr. ' + escapeXml(d.numarDocument || '—') + ' · ' + escapeXml(formatDateShort(d.dataEmiterii)) + '</text>' +
      '<rect x="15" y="40" width="85" height="18" fill="#F5F5FD" rx="1"/>' +
      '<text x="18" y="46" font-size="2.5" fill="#47386A" font-weight="700">FURNIZOR</text>' +
      '<text x="18" y="52" font-size="2.8" fill="#47386A">' + escapeXml(d.emitent || '—') + '</text>' +
      '<rect x="110" y="40" width="85" height="18" fill="#F5F5FD" rx="1"/>' +
      '<text x="113" y="46" font-size="2.5" fill="#47386A" font-weight="700">COMISIE DE RECEPȚIE</text>' +
      '<rect x="113" y="49" width="50" height="1" fill="#47386A" opacity="0.3"/>' +
      '<rect x="113" y="53" width="40" height="1" fill="#47386A" opacity="0.3"/>' +
      '<rect x="15" y="65" width="180" height="5" fill="#47386A"/>' +
      '<text x="20" y="68.5" font-size="2.5" fill="white" font-weight="700">NR.</text>' +
      '<text x="40" y="68.5" font-size="2.5" fill="white" font-weight="700">PRODUS</text>' +
      '<text x="100" y="68.5" font-size="2.5" fill="white" font-weight="700" text-anchor="middle">UM</text>' +
      '<text x="124" y="68.5" font-size="2.5" fill="white" font-weight="700">CANT.</text>' +
      '<text x="149" y="68.5" font-size="2.5" fill="white" font-weight="700">PREȚ</text>' +
      '<text x="193" y="68.5" font-size="2.5" fill="white" font-weight="700" text-anchor="end">VALOARE</text>' +
      rows +
    '</svg>';
  }

  function renderEmailPreview(d) {
    var paragraphs = '';
    for (var i = 0; i < 5; i++) {
      var y = 80 + i * 22;
      paragraphs +=
        '<rect x="15" y="' + y + '" width="' + (170 + (i % 2 === 0 ? 0 : -15)) + '" height="1.2" fill="#47386A" opacity="0.25"/>' +
        '<rect x="15" y="' + (y + 5) + '" width="' + (175 + (i % 3 === 0 ? -10 : 0)) + '" height="1.2" fill="#47386A" opacity="0.25"/>' +
        '<rect x="15" y="' + (y + 10) + '" width="' + (140 - i * 5) + '" height="1.2" fill="#47386A" opacity="0.25"/>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<rect x="0" y="0" width="210" height="16" fill="#47386A"/>' +
      '<circle cx="8" cy="8" r="2.5" fill="#FFBF14"/>' +
      '<circle cx="15" cy="8" r="2.5" fill="#38BA31"/>' +
      '<circle cx="22" cy="8" r="2.5" fill="#FF3C80"/>' +
      '<text x="105" y="11" font-size="3.5" fill="white" text-anchor="middle" opacity="0.9">E-MAIL</text>' +
      '<rect x="15" y="22" width="180" height="35" fill="#F5F5FD" rx="1"/>' +
      '<text x="18" y="28" font-size="2.5" fill="#47386A" font-weight="700">De la:</text>' +
      '<text x="32" y="28" font-size="2.5" fill="#47386A">' + escapeXml(d.emitent || '—') + '</text>' +
      '<text x="18" y="34" font-size="2.5" fill="#47386A" font-weight="700">Către:</text>' +
      '<rect x="32" y="32" width="60" height="1" fill="#47386A" opacity="0.3"/>' +
      '<text x="18" y="40" font-size="2.5" fill="#47386A" font-weight="700">Data:</text>' +
      '<text x="32" y="40" font-size="2.5" fill="#47386A">' + escapeXml(formatDateShort(d.dataEmiterii)) + '</text>' +
      '<text x="18" y="46" font-size="2.5" fill="#47386A" font-weight="700">Subiect:</text>' +
      '<text x="36" y="46" font-size="2.5" fill="#47386A">' + escapeXml((d.tipDocument || 'Document')) + '</text>' +
      '<text x="18" y="52" font-size="2.5" fill="#47386A" font-weight="700">Atașament:</text>' +
      '<rect x="40" y="49.5" width="40" height="4" fill="white" stroke="#47386A" stroke-width="0.3" stroke-opacity="0.3" rx="0.5"/>' +
      '<text x="42" y="52.7" font-size="2.2" fill="#47386A">📎 ' + escapeXml((d.filename || 'document').slice(0, 18)) + '</text>' +
      '<text x="15" y="70" font-size="3" fill="#47386A" font-weight="700">Bună ziua,</text>' +
      paragraphs +
      '<text x="15" y="210" font-size="3" fill="#47386A">Cu stimă,</text>' +
      '<rect x="15" y="215" width="40" height="1.5" fill="#47386A" opacity="0.35"/>' +
    '</svg>';
  }

  function renderDefaultPreview(d) {
    var lines = '';
    for (var i = 0; i < 18; i++) {
      var w = 150 + ((i * 37) % 30);
      var op = (10 + ((i * 13) % 7)) / 100;
      lines += '<rect x="15" y="' + (75 + i * 8) + '" width="' + w + '" height="1.5" fill="#47386A" opacity="' + op + '"/>';
    }
    return '<svg viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">' +
      '<rect width="210" height="297" fill="white"/>' +
      '<rect x="15" y="20" width="60" height="6" fill="#47386A" opacity="0.8" rx="1"/>' +
      '<text x="15" y="50" font-size="5" fill="#47386A" font-weight="700">' + escapeXml(d.tipDocument || 'Document') + '</text>' +
      '<text x="15" y="58" font-size="3" fill="#47386A" opacity="0.7">' + escapeXml(d.emitent || '') + '</text>' +
      lines +
      '<rect x="15" y="265" width="50" height="1" fill="#47386A" opacity="0.2"/>' +
    '</svg>';
  }

  /* =============================================================
     Edit Modal
     ============================================================= */

  function openEditModal(docId) {
    var d = findDoc(docId);
    if (!d) return;
    var modal = document.getElementById('modal-edit');
    if (!modal) return;

    modal.querySelector('[data-edit-subtitle]').textContent = d.filename;

    var fields = modal.querySelector('[data-edit-fields]');
    fields.innerHTML =
      row('tipDocument',   'Tip document',        'text',   d.tipDocument) +
      row('emitent',       'Emitent',             'text',   d.emitent) +
      row('numarDocument', 'Număr document',      'text',   d.numarDocument) +
      row('dataEmiterii',  'Data emiterii',       'date',   d.dataEmiterii) +
      row('perioadaFiscala','Perioada fiscală',   'text',   d.perioadaFiscala) +
      '<div class="form-grid-2">' +
        row('valoareFaraTVA', 'Valoare fără TVA', 'number', d.valoareFaraTVA, 'step="0.01"') +
        row('tvaProcent',     'TVA procent',      'number', d.tvaProcent,     'step="0.01"') +
        row('tvaValoare',     'TVA valoare',      'number', d.tvaValoare,     'step="0.01"') +
        row('valoareTotala',  'Valoare totală',   'number', d.valoareTotala,  'step="0.01"') +
        rowSelect('moneda',   'Monedă', ['RON','EUR','USD'], d.moneda) +
      '</div>' +
      rowTextarea('observatieAI', 'Observație AI', d.observatieAI);

    function row(name, label, type, val, extra) {
      return '<div class="form-field">' +
        '<label class="form-label" for="ef-' + name + '">' + esc(label) + '</label>' +
        '<input id="ef-' + name + '" name="' + name + '" class="input" type="' + type + '" value="' + (val == null ? '' : esc(val)) + '"' + (extra || '') + '>' +
      '</div>';
    }
    function rowSelect(name, label, opts, val) {
      return '<div class="form-field">' +
        '<label class="form-label" for="ef-' + name + '">' + esc(label) + '</label>' +
        '<select id="ef-' + name + '" name="' + name + '" class="select">' +
          opts.map(function (o) { return '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
        '</select>' +
      '</div>';
    }
    function rowTextarea(name, label, val) {
      return '<div class="form-field">' +
        '<label class="form-label" for="ef-' + name + '">' + esc(label) + '</label>' +
        '<textarea id="ef-' + name + '" name="' + name + '" class="textarea" rows="3">' + (val == null ? '' : esc(val)) + '</textarea>' +
      '</div>';
    }

    modal.querySelector('[data-modal-close]').onclick = function () { closeModal(modal); };
    modal.querySelector('[data-edit-cancel]').onclick = function () { closeModal(modal); };
    modal.querySelector('[data-edit-save]').onclick = function () {
      d.tipDocument     = modal.querySelector('[name="tipDocument"]').value.trim();
      d.emitent         = modal.querySelector('[name="emitent"]').value.trim();
      d.numarDocument   = modal.querySelector('[name="numarDocument"]').value.trim();
      d.dataEmiterii    = modal.querySelector('[name="dataEmiterii"]').value;
      d.perioadaFiscala = modal.querySelector('[name="perioadaFiscala"]').value.trim();
      d.valoareFaraTVA  = toNumber(modal.querySelector('[name="valoareFaraTVA"]').value);
      d.tvaProcent      = toNumber(modal.querySelector('[name="tvaProcent"]').value);
      d.tvaValoare      = toNumber(modal.querySelector('[name="tvaValoare"]').value);
      d.valoareTotala   = toNumber(modal.querySelector('[name="valoareTotala"]').value);
      d.moneda          = modal.querySelector('[name="moneda"]').value;
      d.observatieAI    = modal.querySelector('[name="observatieAI"]').value.trim();
      closeModal(modal);
      showToast('success', 'Modificările au fost salvate.');
      render();
    };

    openModal(modal);
  }

  /* =============================================================
     Splitter Modal
     ============================================================= */

  var splitterState = null;

  function openSplitterModal(docId) {
    var d = findDoc(docId);
    if (!d) return;
    var modal = document.getElementById('modal-splitter');
    if (!modal) return;

    splitterState = {
      doc: d,
      segments: [{
        fromPage: 1,
        toPage: d.pagesCount,
        tip: d.tipDocument || 'Factură furnizor',
        nume: 'document_1'
      }]
    };
    renderSplitter();
    modal.querySelector('[data-modal-close]').onclick = function () { closeModal(modal); };
    modal.querySelector('[data-split-cancel]').onclick = function () { closeModal(modal); };
    modal.querySelector('[data-split-save]').onclick = saveSplit;

    openModal(modal);
  }

  function renderSplitter() {
    var modal = document.getElementById('modal-splitter');
    var pagesEl = modal.querySelector('[data-split-pages]');
    var segmentsEl = modal.querySelector('[data-split-segments]');
    var errorEl = modal.querySelector('[data-split-error]');
    var saveBtn = modal.querySelector('[data-split-save]');
    var d = splitterState.doc;

    // Page → segment map
    var pageAssignment = {};
    var overlap = new Set();
    splitterState.segments.forEach(function (seg, segIdx) {
      for (var p = seg.fromPage; p <= seg.toPage; p++) {
        if (pageAssignment[p] != null) overlap.add(p);
        pageAssignment[p] = segIdx;
      }
    });
    var unassigned = [];
    for (var p = 1; p <= d.pagesCount; p++) if (pageAssignment[p] == null) unassigned.push(p);

    pagesEl.innerHTML = '<div class="splitter-pages__grid">' +
      Array.from({ length: d.pagesCount }, function (_, i) {
        var pageNum = i + 1;
        var segIdx = pageAssignment[pageNum];
        var color = segIdx != null ? SEGMENT_COLORS[segIdx % SEGMENT_COLORS.length] : 'transparent';
        return '<div class="page-thumb" style="border-color:' + color + ';">' +
          pageNum +
          '<span class="page-thumb__label">Pag. ' + pageNum + '</span>' +
        '</div>';
      }).join('') +
    '</div>';

    segmentsEl.innerHTML =
      '<div class="splitter-segments__title">' +
        '<h3>Segmente</h3>' +
        '<span class="pill pill--count">(' + splitterState.segments.length + ')</span>' +
      '</div>' +
      splitterState.segments.map(function (seg, idx) {
        var color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
        return '<div class="segment-card" style="border-left-color:' + color + ';" data-seg-idx="' + idx + '">' +
          '<div class="segment-card__head">' +
            '<div class="segment-card__name"><span class="segment-card__dot" style="background:' + color + '"></span>Segment ' + (idx + 1) + '</div>' +
            (splitterState.segments.length > 1 ?
              '<button type="button" class="segment-card__remove" data-seg-remove="' + idx + '" aria-label="Elimină">' +
                '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
              '</button>' : '') +
          '</div>' +
          '<div class="segment-fields">' +
            '<div>' +
              '<label class="segment-fields__label">De la pagina</label>' +
              '<input type="number" class="input" data-seg-field="fromPage" value="' + seg.fromPage + '" min="1" max="' + d.pagesCount + '">' +
            '</div>' +
            '<div>' +
              '<label class="segment-fields__label">Până la pagina</label>' +
              '<input type="number" class="input" data-seg-field="toPage" value="' + seg.toPage + '" min="' + seg.fromPage + '" max="' + d.pagesCount + '">' +
            '</div>' +
            '<div class="segment-fields__full">' +
              '<label class="segment-fields__label">Tip document</label>' +
              '<select class="select" data-seg-field="tip">' +
                AI_TYPE_OPTIONS.map(function (o) { return '<option value="' + esc(o) + '"' + (seg.tip === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') +
              '</select>' +
            '</div>' +
            '<div class="segment-fields__full">' +
              '<label class="segment-fields__label">Nume document</label>' +
              '<input type="text" class="input" data-seg-field="nume" value="' + esc(seg.nume) + '" placeholder="document_' + (idx + 1) + '">' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
      '<button type="button" class="btn btn--ghost" data-seg-add>' +
        '<span class="material-symbols-outlined" aria-hidden="true">add</span>Adaugă segment' +
      '</button>';

    var errs = [];
    if (overlap.size > 0) {
      errs.push('Pagina ' + Array.from(overlap).sort(function (a, b) { return a - b; }).join(', ') + ' este atribuită mai multor segmente.');
    }
    if (unassigned.length) {
      errs.push('Paginile ' + unassigned.join(', ') + ' nu sunt atribuite niciunui segment.');
    }
    errorEl.textContent = errs.join(' ');
    saveBtn.disabled = errs.length > 0;

    // Bind segment field inputs
    segmentsEl.querySelectorAll('[data-seg-idx]').forEach(function (card) {
      var idx = parseInt(card.getAttribute('data-seg-idx'), 10);
      card.querySelectorAll('[data-seg-field]').forEach(function (inp) {
        inp.addEventListener('change', function () {
          var field = inp.getAttribute('data-seg-field');
          var val = inp.value;
          if (field === 'fromPage' || field === 'toPage') val = parseInt(val, 10) || 1;
          splitterState.segments[idx][field] = val;
          if (field === 'fromPage' && splitterState.segments[idx].toPage < val) {
            splitterState.segments[idx].toPage = val;
          }
          renderSplitter();
        });
      });
    });
    segmentsEl.querySelectorAll('[data-seg-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-seg-remove'), 10);
        splitterState.segments.splice(idx, 1);
        renderSplitter();
      });
    });
    var addBtn = segmentsEl.querySelector('[data-seg-add]');
    if (addBtn) addBtn.addEventListener('click', function () {
      var last = splitterState.segments[splitterState.segments.length - 1];
      var start = last ? Math.min(d.pagesCount, last.toPage + 1) : 1;
      splitterState.segments.push({
        fromPage: start,
        toPage: Math.min(d.pagesCount, start),
        tip: 'Factură furnizor',
        nume: 'document_' + (splitterState.segments.length + 1)
      });
      renderSplitter();
    });
  }

  function saveSplit() {
    var modal = document.getElementById('modal-splitter');
    var d = splitterState.doc;
    var origIdx = MOCK.documents.indexOf(d);
    var newDocs = splitterState.segments.map(function (seg, i) {
      return Object.assign({}, d, {
        id: d.id + '_s' + (i + 1),
        filename: (seg.nume || 'document_' + (i + 1)) + '.pdf',
        tipDocument: seg.tip,
        categoriePropusa: seg.tip,
        multiDoc: false,
        multiDocConfidence: null,
        pagesCount: (seg.toPage - seg.fromPage + 1),
        observatieAI: 'Separat din ' + d.filename + ' (paginile ' + seg.fromPage + '–' + seg.toPage + ').',
        pageThumbnails: []
      });
    });
    MOCK.documents.splice.apply(MOCK.documents, [origIdx, 1].concat(newDocs));
    state.flashIds = newDocs.map(function (x) { return x.id; });
    closeModal(modal);
    showToast('success', 'Documentul a fost separat în ' + newDocs.length + ' documente.');
    render();
  }

  /* =============================================================
     Upload Modal
     ============================================================= */

  function openUploadModal() {
    var modal = document.getElementById('modal-upload');
    if (!modal) return;
    var zone = modal.querySelector('[data-upload-zone]');
    var fileInput = modal.querySelector('[data-upload-input]');
    var pickBtn = modal.querySelector('[data-upload-pick]');
    var closeBtn = modal.querySelector('[data-modal-close]');
    var cancelBtn = modal.querySelector('[data-upload-cancel]');
    var doneBtn = modal.querySelector('[data-upload-close]');
    var processing = modal.querySelector('[data-upload-processing]');

    processing.style.display = 'none';
    zone.style.display = '';
    doneBtn.disabled = false;

    function handleFiles(list) {
      if (!list || !list.length) return;
      processing.style.display = 'flex';
      zone.style.display = 'none';
      doneBtn.disabled = true;

      setTimeout(function () {
        var newIds = [];
        Array.prototype.forEach.call(list, function (f) {
          var d = mockProcess(f);
          MOCK.documents.push(d);
          newIds.push(d.id);
        });
        state.flashIds = newIds;
        processing.style.display = 'none';
        zone.style.display = '';
        doneBtn.disabled = false;
        showToast('success', newIds.length + ' documente au fost procesate cu succes.');
        render();
        closeModal(modal);
      }, 2000);
    }

    pickBtn.onclick = function () { fileInput.click(); };
    fileInput.onchange = function () { handleFiles(fileInput.files); fileInput.value = ''; };
    zone.ondragover = function (e) { e.preventDefault(); zone.classList.add('is-dragover'); };
    zone.ondragleave = function () { zone.classList.remove('is-dragover'); };
    zone.ondrop = function (e) {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      handleFiles(e.dataTransfer.files);
    };
    closeBtn.onclick = function () { closeModal(modal); };
    cancelBtn.onclick = function () { closeModal(modal); };
    doneBtn.onclick = function () { closeModal(modal); };

    openModal(modal);
  }

  function mockProcess(file) {
    var rnd = Math.random();
    var conf = rnd < 0.75 ? (92 + Math.floor(Math.random() * 8)) :
              rnd < 0.93 ? (72 + Math.floor(Math.random() * 17)) :
                            (50 + Math.floor(Math.random() * 19));
    var conf2 = conf + Math.floor(Math.random() * 6) - 3;
    if (conf2 > 99) conf2 = 99;
    if (conf2 < 40) conf2 = 40;
    var category = rnd < 0.4 ? 'intrare' : (rnd < 0.6 ? 'iesire' : (rnd < 0.7 ? 'salarizare' : 'necategorisit'));
    return {
      id: 'doc_up_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      situationId: state.situationId,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      source: 'upload',
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: category === 'intrare' ? 'Factură furnizor' : (category === 'iesire' ? 'Factură emisă' : (category === 'salarizare' ? 'Document HR' : 'Altul')),
      emitent: 'Detectat automat',
      numarDocument: null,
      dataEmiterii: '2026-04-20',
      perioadaFiscala: '2026-04',
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: 'RON',
      categoriePropusa: category === 'intrare' ? 'Factură furnizor' : (category === 'iesire' ? 'Factură emisă' : (category === 'salarizare' ? 'Document HR' : 'Altul')),
      broadCategory: category,
      subFilter: null,
      confidenceExtraction: conf,
      confidenceCategorization: conf2,
      observatieAI: 'Document încărcat manual. Rezultate AI simulate pentru demo.',
      verificat: conf >= 90 && conf2 >= 90,
      verificatManual: false,
      pageThumbnails: []
    };
  }

  /* ---------- Modal helpers ---------- */

  function openModal(modal) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var keyHandler = function (e) {
      if (e.key === 'Escape') { closeModal(modal); document.removeEventListener('keydown', keyHandler); }
      else if (e.key === 'Tab') trapFocus(e, modal.querySelector('.doc-modal__layout') || modal.querySelector('.modal__dialog'));
    };
    var bdHandler = function (e) { if (e.target === modal) closeModal(modal); };
    modal.__keyHandler = keyHandler;
    modal.__bdHandler = bdHandler;
    document.addEventListener('keydown', keyHandler);
    modal.addEventListener('click', bdHandler);
    setTimeout(function () {
      var focusable = modal.querySelectorAll('button, input, select, textarea, a[href]');
      if (focusable.length) focusable[0].focus();
    }, 0);
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modal.__keyHandler) document.removeEventListener('keydown', modal.__keyHandler);
    if (modal.__bdHandler) modal.removeEventListener('click', modal.__bdHandler);
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

  /* ---------- Utilities ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('T')[0].split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function formatDateTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatMoney(v) {
    if (v == null) return '';
    return Number(v).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function sourceLabel(s) {
    if (s === 'email') return 'E-mail';
    if (s === 'whatsapp') return 'WhatsApp';
    return 'Upload manual';
  }

  function toNumber(v) {
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  function showToast(variant, msg) {
    if (window.SCRIPTICA_TOAST) window.SCRIPTICA_TOAST(variant, msg);
    else console.log('[toast]', variant, msg);
  }

  /* Short uppercase prefix for the Description column's type tag.
     Keeps the full tipDocument value intact (still used by the AI modal). */
  function getDocTipPrefix(tipDocument) {
    if (!tipDocument) return '';
    var MAP = {
      'Factură furnizor':       'FACTURĂ',
      'Factură emisă':          'FACTURĂ',
      'Bon fiscal':             'BON FISCAL',
      'NIR':                    'NIR',
      'Aviz / Proces verbal':   'AVIZ',
      'Document HR':            'HR',
      'E-mail de transmitere':  'E-MAIL',
      'Situația stocurilor':    'STOC',
      'Balanță de verificare':  'BALANȚĂ',
      'Registru de casă':       'REGISTRU',
      'Jurnal TVA':             'JURNAL',
      'Stat salarii':           'STAT',
      'Ștat salarii':           'STAT',
      'Fluturași':              'FLUTURAȘI',
      'Fluturași salariale':    'FLUTURAȘI',
      'Declarație D100':        'DECLARAȚIE',
      'Declarație D394':        'DECLARAȚIE',
      'Declarație D112':        'DECLARAȚIE',
      'Notă contabilă':         'NOTĂ',
      'Registru imobilizări':   'REGISTRU',
      'Registru jurnal':        'REGISTRU',
      'Foaie de parcurs':       'FOAIE',
      'Document multiplu':      'MULTIPLU'
    };
    if (MAP[tipDocument]) return MAP[tipDocument];
    return tipDocument.split(' ')[0].toUpperCase();
  }

  /* Public API */
  window.SCRIPTICA_OPEN_DOC_AI_MODAL = function (docId, opts) {
    openAiModal(docId, opts || {});
  };
  window.SCRIPTICA_DOC_TIP_PREFIX = getDocTipPrefix;
  window.SCRIPTICA_DOCS_REFRESH = function () {
    if (document.getElementById('docs-section')) render();
  };
})();
