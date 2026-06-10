/* ============================================================
   Scriptica — Completare anexe (Phase 10)
   Cardurile de anexe per pas + modalul full-screen de completare.
   Expune window.SCRIPTICA_ANEXE = { renderCards, allComplete,
   getStepAnexe }.

   Contract răspunsuri — localStorage 'scriptica.anexaResponses':
   map cheie = situationId + '::' + anexaTypeId →
   { values: { [fieldIndexAsString]: value },
     updatedAt: 'YYYY-MM-DD', completedByName: string|null }.
   Today is pinned to 2026-04-20.
   ============================================================ */

(function () {
  'use strict';

  var RESP_KEY = 'scriptica.anexaResponses';
  var TODAY_ISO = '2026-04-20';
  var LAYOUT_TYPES = ['section_title', 'paragraph', 'banner', 'divider'];

  function getMock() {
    return window.SCRIPTICA_MOCK || {};
  }

  /* ---------- Utilitare ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(variant, msg) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, msg);
  }

  /* Completatorul = angajatul curent (MOCK.employees după MOCK.currentUserId,
     fallback MOCK.currentUser) — aceeași rezolvare ca în situatie-detaliu.js,
     ca numele din footerul anexei să coincidă cu cel al task-urilor,
     indiferent de view-ul persistat în localStorage (ex. 'admin'). */
  function currentUserName() {
    var M = getMock();
    var u = (M.employees || []).find(function (e) { return e.id === M.currentUserId; }) || M.currentUser;
    if (!u) return null;
    return u.fullName || u.name || null;
  }

  function isClientView() {
    return typeof window.getCurrentView === 'function' && window.getCurrentView() === 'client';
  }

  /* ---------- Stocare răspunsuri ---------- */

  function readMap() {
    try {
      var raw = localStorage.getItem(RESP_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeMap(map) {
    try { localStorage.setItem(RESP_KEY, JSON.stringify(map)); } catch (e) { /* ignore */ }
  }

  function respKey(situationId, anexaTypeId) {
    return situationId + '::' + anexaTypeId;
  }

  function getResponse(situation, anexaTypeId) {
    var key = respKey(situation.id, anexaTypeId);
    var stored = readMap()[key];
    if (stored) return stored;
    /* Seeded demo states from mock-data (MOCK.anexaResponseSeeds) act as
       the base layer; anything saved in localStorage overrides per key. */
    var seeds = getMock().anexaResponseSeeds || {};
    return seeds[key] || null;
  }

  /* ---------- Anexele pasului curent ---------- */

  function getStepAnexe(situation) {
    var M = getMock();
    if (!situation) return [];
    var type = (M.situationTypes || []).find(function (t) { return t.id === situation.typeId; });
    if (!type || !type.steps) return [];
    var step = type.steps[situation.currentStep - 1];
    if (!step) return [];
    return (step.anexeIds || []).map(function (id) {
      return (M.anexeTypes || []).find(function (a) { return a.id === id; });
    }).filter(Boolean);
  }

  /* ---------- Calcul completare (contract câmpuri obligatorii) ---------- */

  function availableDocs(situation) {
    return (getMock().documents || []).filter(function (d) {
      return d.situationId === situation.id;
    });
  }

  function isRequiredInput(field) {
    if (LAYOUT_TYPES.indexOf(field.type) !== -1) return false;
    if (field.type === 'calculated') return false;
    return field.required === true;
  }

  function hasText(v) {
    return typeof v === 'string' && v.trim() !== '';
  }

  function isFieldComplete(field, value, situation) {
    var t = field.type;
    if (t === 'text_short' || t === 'text_long' || t === 'cui') {
      return hasText(value);
    }
    if (t === 'number' || t === 'percent' || t === 'currency') {
      return value != null && String(value) !== '';
    }
    if (t === 'date' || t === 'month') {
      return hasText(value);
    }
    if (t === 'dropdown' || t === 'radio' || t === 'boolean') {
      return value != null && String(value) !== '';
    }
    if (t === 'checkboxes') {
      return Array.isArray(value) && value.length >= 1;
    }
    if (t === 'client_picker') {
      if (field.multi) return Array.isArray(value) && value.length >= 1;
      return value != null && String(value) !== '';
    }
    if (t === 'document_picker') {
      if (!availableDocs(situation).length) return true;
      if (field.multi) return Array.isArray(value) && value.length >= 1;
      return value != null && String(value) !== '';
    }
    if (t === 'file_upload') {
      return Array.isArray(value) && value.length >= 1;
    }
    if (t === 'table') {
      var minRows = Math.max(1, parseInt(field.minRows, 10) || 1);
      if (!Array.isArray(value) || value.length < minRows) return false;
      var cols = field.columns || [];
      return value.every(function (row) {
        for (var c = 0; c < cols.length; c++) {
          var cell = row ? row[String(c)] : null;
          if (cell == null || String(cell).trim() === '') return false;
        }
        return true;
      });
    }
    return true;
  }

  function completionFromValues(fields, values, situation) {
    var total = 0;
    var done = 0;
    fields.forEach(function (f, idx) {
      if (!isRequiredInput(f)) return;
      total++;
      if (isFieldComplete(f, values[String(idx)], situation)) done++;
    });
    var percent = (total === 0) ? 100 : Math.round(100 * done / total);
    return { total: total, done: done, percent: percent };
  }

  function completionFor(situation, anexa) {
    var fields = (anexa.schema && anexa.schema.fields) || [];
    var resp = getResponse(situation, anexa.id);
    var values = (resp && resp.values) || {};
    var comp = completionFromValues(fields, values, situation);
    comp.completedByName = resp ? (resp.completedByName || null) : null;
    return comp;
  }

  function allComplete(situation) {
    return getStepAnexe(situation).every(function (a) {
      return completionFor(situation, a).percent === 100;
    });
  }

  /* ---------- Carduri ---------- */

  function renderCards(containerEl, situation, opts) {
    if (!containerEl) return;
    /* Pagina poate impune read-only (ex. rol 'viewer' pe panoul de
       task-uri) — se combină cu verificarea de status din modal. */
    var pageReadonly = !!(opts && opts.readonly);
    var anexe = getStepAnexe(situation);
    if (isClientView() || !anexe.length) {
      containerEl.innerHTML = '';
      return;
    }

    var cardsHtml = anexe.map(function (a, i) {
      var comp = completionFor(situation, a);
      var cardCls = '';
      var footCls = 'anexa-card__footer--neutral';
      var footHtml = '0% · Neînceput';
      if (comp.percent >= 100) {
        cardCls = ' anexa-card--done';
        footCls = 'anexa-card__footer--done';
        var by = comp.completedByName || situation.responsibleStepName || '';
        footHtml = '<span class="material-symbols-outlined filled" aria-hidden="true">check_circle</span>' +
          '<span>100% · ' + esc(by) + '</span>';
      } else if (comp.percent > 0) {
        footCls = 'anexa-card__footer--progress';
        footHtml = '<span>' + comp.percent + '% · ' + esc(situation.responsibleStepName || '') + '</span>';
      } else {
        footHtml = '<span>0% · Neînceput</span>';
      }
      return '<div class="anexa-card' + cardCls + '" role="button" tabindex="0"' +
        ' data-anexa-open="' + esc(a.id) + '" aria-label="' +
        (pageReadonly ? 'Vezi anexa ' : 'Completează anexa ') + esc(a.name) + '">' +
        '<div class="anexa-card__body">' +
          '<div class="anexa-card__eyebrow">Anexa ' + (i + 1) + '</div>' +
          '<div class="anexa-card__name">' + esc(a.name) + '</div>' +
        '</div>' +
        '<div class="anexa-card__footer ' + footCls + '">' + footHtml + '</div>' +
      '</div>';
    }).join('');

    containerEl.innerHTML =
      '<div class="anexa-cards">' +
        '<div class="anexa-cards__label">Anexe pas ' + situation.currentStep + '</div>' +
        '<div class="anexa-cards__grid">' + cardsHtml + '</div>' +
      '</div>';

    containerEl.querySelectorAll('[data-anexa-open]').forEach(function (card) {
      var id = card.getAttribute('data-anexa-open');
      function activate() {
        var anexa = anexe.find(function (x) { return x.id === id; });
        if (anexa) openFillModal(situation, anexa, pageReadonly);
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  /* ---------- Randare câmpuri formular ---------- */

  function wrapField(idx, inner) {
    return '<div class="afield" data-afield-wrap="' + idx + '">' + inner + '</div>';
  }

  function labelHtml(field) {
    if (!field.label) return '';
    var req = (field.required === true) ? ' <span class="afield__required">*</span>' : '';
    return '<span class="afield__label">' + esc(field.label) + req + '</span>';
  }

  function helpHtml(field) {
    return field.help ? '<div class="afield__help">' + esc(field.help) + '</div>' : '';
  }

  function optionListHtml(idx, options, selected, multi, dis, emptyLabel) {
    if (multi) {
      var sel = Array.isArray(selected) ? selected : [];
      return '<div class="afield__checks" data-af-checks="' + idx + '">' +
        options.map(function (o) {
          var checked = sel.indexOf(o) !== -1 ? ' checked' : '';
          return '<label><input type="checkbox" data-af-check="' + idx + '" value="' + esc(o) + '"' + checked + dis + '> ' + esc(o) + '</label>';
        }).join('') +
      '</div>';
    }
    return '<select class="afield__input" data-af="' + idx + '"' + dis + '>' +
      '<option value="">' + esc(emptyLabel || '— Alege —') + '</option>' +
      options.map(function (o) {
        var s = (selected === o) ? ' selected' : '';
        return '<option value="' + esc(o) + '"' + s + '>' + esc(o) + '</option>';
      }).join('') +
    '</select>';
  }

  function fieldHtml(field, idx, draft, situation, readonly) {
    var dis = readonly ? ' disabled' : '';
    var v = draft[String(idx)];
    var inner = '';
    var variant, icons, options, files, chips, cols, rows, head, body;

    switch (field.type) {

      case 'section_title':
        return wrapField(idx, '<h3 class="afield__section-title">' + esc(field.text) + '</h3>');

      case 'paragraph':
        return wrapField(idx, '<p class="afield__paragraph">' + esc(field.text) + '</p>');

      case 'banner':
        variant = (field.variant === 'warning' || field.variant === 'critical') ? field.variant : 'info';
        icons = { info: 'info', warning: 'warning', critical: 'error' };
        return wrapField(idx,
          '<div class="afield__banner afield__banner--' + variant + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">' + icons[variant] + '</span>' +
            '<span>' + esc(field.text) + '</span>' +
          '</div>');

      case 'divider':
        return wrapField(idx, '<hr class="afield__divider">');

      case 'text_short':
        inner = '<input class="afield__input" type="text" data-af="' + idx + '"' +
          (field.maxLength ? ' maxlength="' + (parseInt(field.maxLength, 10) || 100) + '"' : '') +
          ' placeholder="' + esc(field.placeholder || '') + '" value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'text_long':
        inner = '<textarea class="afield__input" rows="' + (parseInt(field.rows, 10) || 3) + '" data-af="' + idx + '"' +
          ' placeholder="' + esc(field.placeholder || '') + '"' + dis + '>' + esc(v || '') + '</textarea>';
        break;

      case 'number':
        inner = '<input class="afield__input" type="number" data-af="' + idx + '"' +
          (field.min != null ? ' min="' + esc(field.min) + '"' : '') +
          (field.max != null ? ' max="' + esc(field.max) + '"' : '') +
          ' step="' + ((parseInt(field.decimals, 10) || 0) > 0 ? 'any' : '1') + '"' +
          ' value="' + esc(v != null ? v : '') + '"' + dis + '>';
        break;

      case 'currency':
        inner = '<div class="afield__group">' +
          '<input class="afield__input" type="number" step="0.01" placeholder="0,00" data-af="' + idx + '"' +
            ' value="' + esc(v != null ? v : '') + '"' + dis + '>' +
          '<span class="afield__unit">' + esc(field.currency || 'RON') + '</span>' +
        '</div>';
        break;

      case 'percent':
        inner = '<div class="afield__group">' +
          '<input class="afield__input" type="number" step="0.01" min="0" max="100" placeholder="0,00" data-af="' + idx + '"' +
            ' value="' + esc(v != null ? v : '') + '"' + dis + '>' +
          '<span class="afield__unit">%</span>' +
        '</div>';
        break;

      case 'cui':
        inner = '<input class="afield__input" type="text" placeholder="RO12345678" data-af="' + idx + '"' +
          ' value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'date':
        inner = '<input class="afield__input" type="date" data-af="' + idx + '" value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'month':
        inner = '<input class="afield__input" type="month" data-af="' + idx + '" value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'dropdown':
        inner = optionListHtml(idx, field.options || [], v, false, dis);
        break;

      case 'radio':
        inner = '<div class="afield__radios">' +
          (field.options || []).map(function (o) {
            var checked = (v === o) ? ' checked' : '';
            return '<label><input type="radio" name="af-r-' + idx + '" data-af-radio="' + idx + '"' +
              ' value="' + esc(o) + '"' + checked + dis + '> ' + esc(o) + '</label>';
          }).join('') +
        '</div>';
        break;

      case 'checkboxes':
        inner = optionListHtml(idx, field.options || [], v, true, dis);
        break;

      case 'boolean':
        inner = '<div class="afield__radios">' +
          ['Da', 'Nu'].map(function (o) {
            var checked = (v === o) ? ' checked' : '';
            return '<label><input type="radio" name="af-r-' + idx + '" data-af-radio="' + idx + '"' +
              ' value="' + esc(o) + '"' + checked + dis + '> ' + esc(o) + '</label>';
          }).join('') +
        '</div>';
        break;

      case 'client_picker':
        options = (getMock().clients || []).map(function (c) { return c.companyName; });
        inner = optionListHtml(idx, options, v, !!field.multi, dis, '— Alege client —');
        break;

      case 'document_picker':
        options = availableDocs(situation).map(function (d) { return d.filename; });
        if (!options.length) {
          inner = '<div class="afield__empty-note">Niciun document disponibil</div>';
        } else {
          inner = optionListHtml(idx, options, v, !!field.multi, dis, '— Alege document —');
        }
        break;

      case 'file_upload':
        files = Array.isArray(v) ? v : [];
        chips = files.map(function (name, i) {
          return '<span class="afield__chip"><span class="afield__chip-name">' + esc(name) + '</span>' +
            (readonly ? '' :
              '<button type="button" class="afield__chip-remove" data-af-file-remove="' + idx + '" data-file-i="' + i + '" aria-label="Elimină fișierul">' +
                '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
              '</button>') +
          '</span>';
        }).join('');
        inner = '<div class="afield__upload">' +
          (readonly ? '' :
            '<button type="button" class="btn btn--ghost" data-af-file-pick="' + idx + '">' +
              '<span class="material-symbols-outlined" aria-hidden="true">attach_file</span>' +
              'Selectează fișiere' +
            '</button>' +
            '<input type="file" hidden' + (field.multi ? ' multiple' : '') + ' data-af-file="' + idx + '">') +
          '<span class="afield__upload-meta">' + esc(field.allowedTypes || '') +
            (field.maxSizeMB != null ? ' · max ' + esc(field.maxSizeMB) + ' MB' : '') +
          '</span>' +
        '</div>' +
        (files.length ? '<div class="afield__chips">' + chips + '</div>' :
          (readonly ? '<div class="afield__empty-note">Niciun fișier atașat</div>' : ''));
        break;

      case 'table':
        cols = field.columns || [];
        rows = Array.isArray(v) ? v : [];
        head = '<tr>' +
          cols.map(function (c) { return '<th>' + esc(c.name) + '</th>'; }).join('') +
          (readonly ? '' : '<th class="afield__cell-del"></th>') +
        '</tr>';
        body = rows.map(function (row, r) {
          return '<tr>' +
            cols.map(function (c, ci) {
              var cellVal = (row && row[String(ci)] != null) ? row[String(ci)] : '';
              var inputType = (c.type === 'number' || c.type === 'currency') ? 'number' :
                (c.type === 'date' ? 'date' : 'text');
              var step = (c.type === 'currency') ? ' step="0.01"' : '';
              return '<td><input class="afield__input afield__cell-input" type="' + inputType + '"' + step +
                ' data-af-cell="' + idx + '" data-row="' + r + '" data-col="' + ci + '"' +
                ' value="' + esc(cellVal) + '"' + dis + '></td>';
            }).join('') +
            (readonly ? '' :
              '<td class="afield__cell-del">' +
                '<button type="button" data-af-del-row="' + idx + '" data-row="' + r + '" aria-label="Șterge rândul">' +
                  '<span class="material-symbols-outlined" aria-hidden="true">delete</span>' +
                '</button>' +
              '</td>') +
          '</tr>';
        }).join('');
        inner = '<table class="afield__table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
          (rows.length ? '' : '<div class="afield__empty-note">Niciun rând adăugat.</div>') +
          (readonly ? '' :
            '<button type="button" class="afield__table-add" data-af-add-row="' + idx + '">' +
              '<span class="material-symbols-outlined" aria-hidden="true">add</span>' +
              'Adaugă rând' +
            '</button>');
        break;

      case 'calculated':
        inner = '<div class="afield__calculated">' +
          '<span class="material-symbols-outlined" aria-hidden="true">function</span>' +
          '<span>= ' + esc(field.formula || '') + '</span>' +
        '</div>';
        break;

      default:
        inner = '<p class="afield__paragraph">Tip necunoscut: ' + esc(field.type) + '</p>';
    }

    return wrapField(idx, labelHtml(field) + helpHtml(field) + inner);
  }

  /* ---------- Modal de completare ---------- */

  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll(
      'a[href], button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openFillModal(situation, anexa, forceReadonly) {
    var modal = document.getElementById('modal-anexa-fill');
    if (!modal) return;

    var fields = (anexa.schema && anexa.schema.fields) || [];
    var readonly = !!forceReadonly ||
      situation.status === 'anulata' || situation.status === 'inchisa';
    var stored = getResponse(situation, anexa.id);

    var draft = {};
    try { draft = (stored && stored.values) ? JSON.parse(JSON.stringify(stored.values)) : {}; }
    catch (e) { draft = {}; }

    /* Tabelele pornesc cu max(1, minRows) rânduri goale dacă nu există date. */
    fields.forEach(function (f, idx) {
      if (f.type !== 'table') return;
      var key = String(idx);
      if (!Array.isArray(draft[key]) || !draft[key].length) {
        var minRows = Math.max(1, parseInt(f.minRows, 10) || 1);
        var seed = [];
        for (var r = 0; r < minRows; r++) seed.push({});
        draft[key] = seed;
      }
    });

    var titleEl = modal.querySelector('[data-anexa-title]');
    var subEl = modal.querySelector('[data-anexa-subtitle]');
    var formEl = modal.querySelector('#anexa-form');
    var saveBtn = modal.querySelector('[data-anexa-save]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');
    var closeBtn = modal.querySelector('[data-modal-close]');
    var progressText = modal.querySelector('[data-anexa-progress-text]');
    var progressBar = modal.querySelector('[data-anexa-progress-bar]');

    titleEl.textContent = anexa.name;
    subEl.textContent = situation.typeLabel + ' · ' + situation.clientCompany;
    saveBtn.hidden = readonly;

    function updateProgress() {
      var comp = completionFromValues(fields, draft, situation);
      progressText.textContent = comp.done + ' din ' + comp.total + ' câmpuri obligatorii completate';
      progressBar.style.width = comp.percent + '%';
      progressBar.classList.toggle('is-complete', comp.percent === 100);
      return comp.percent;
    }

    function renderFormBody() {
      formEl.innerHTML = fields.map(function (f, idx) {
        return fieldHtml(f, idx, draft, situation, readonly);
      }).join('');
      updateProgress();
    }

    function handleValueEvent(e) {
      if (readonly) return;
      var el = e.target;
      if (el.hasAttribute('data-af')) {
        draft[el.getAttribute('data-af')] = el.value;
      } else if (el.hasAttribute('data-af-radio')) {
        if (el.checked) draft[el.getAttribute('data-af-radio')] = el.value;
      } else if (el.hasAttribute('data-af-check')) {
        var cIdx = el.getAttribute('data-af-check');
        var wrap = formEl.querySelector('[data-af-checks="' + cIdx + '"]');
        var vals = [];
        if (wrap) {
          wrap.querySelectorAll('input[data-af-check]').forEach(function (cb) {
            if (cb.checked) vals.push(cb.value);
          });
        }
        draft[cIdx] = vals;
      } else if (el.hasAttribute('data-af-cell')) {
        var tIdx = el.getAttribute('data-af-cell');
        var row = parseInt(el.getAttribute('data-row'), 10);
        var col = el.getAttribute('data-col');
        if (!Array.isArray(draft[tIdx])) draft[tIdx] = [];
        if (!draft[tIdx][row]) draft[tIdx][row] = {};
        draft[tIdx][row][col] = el.value;
      } else if (el.hasAttribute('data-af-file')) {
        var fIdx = el.getAttribute('data-af-file');
        var fieldDef = fields[parseInt(fIdx, 10)] || {};
        var names = Array.isArray(draft[fIdx]) ? draft[fIdx].slice() : [];
        Array.prototype.forEach.call(el.files || [], function (f) {
          if (fieldDef.multi === false) names = [f.name];
          else names.push(f.name);
        });
        draft[fIdx] = names;
        el.value = '';
        renderFormBody();
        return;
      } else {
        return;
      }
      updateProgress();
    }

    formEl.oninput = handleValueEvent;
    formEl.onchange = handleValueEvent;
    formEl.onsubmit = function (e) { e.preventDefault(); };
    formEl.onclick = function (e) {
      if (readonly) return;
      var pick = e.target.closest('[data-af-file-pick]');
      if (pick) {
        var inp = formEl.querySelector('input[data-af-file="' + pick.getAttribute('data-af-file-pick') + '"]');
        if (inp) inp.click();
        return;
      }
      var rm = e.target.closest('[data-af-file-remove]');
      if (rm) {
        var fIdx = rm.getAttribute('data-af-file-remove');
        var i = parseInt(rm.getAttribute('data-file-i'), 10);
        if (Array.isArray(draft[fIdx])) draft[fIdx].splice(i, 1);
        renderFormBody();
        return;
      }
      var add = e.target.closest('[data-af-add-row]');
      if (add) {
        var aIdx = add.getAttribute('data-af-add-row');
        if (!Array.isArray(draft[aIdx])) draft[aIdx] = [];
        draft[aIdx].push({});
        renderFormBody();
        return;
      }
      var del = e.target.closest('[data-af-del-row]');
      if (del) {
        var dIdx = del.getAttribute('data-af-del-row');
        var r = parseInt(del.getAttribute('data-row'), 10);
        if (Array.isArray(draft[dIdx])) draft[dIdx].splice(r, 1);
        renderFormBody();
      }
    };

    function cleanup() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      modal.removeEventListener('click', onBackdrop);
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); cleanup(); }
      else if (e.key === 'Tab') trapFocus(e, modal.querySelector('.modal__dialog'));
    }
    function onBackdrop(e) {
      if (e.target === modal) cleanup();
    }

    closeBtn.onclick = cleanup;
    cancelBtn.onclick = cleanup;
    saveBtn.onclick = function () {
      if (readonly) return;
      var pct = updateProgress();
      var map = readMap();
      var key = respKey(situation.id, anexa.id);
      var prev = map[key];
      var completedByName = prev ? (prev.completedByName || null) : null;
      if (pct === 100) {
        if (!completedByName) completedByName = currentUserName();
      } else {
        completedByName = null;
      }
      map[key] = { values: draft, updatedAt: TODAY_ISO, completedByName: completedByName };
      writeMap(map);
      cleanup();
      toast('success', pct === 100 ? 'Anexa este completă.' : 'Progres salvat.');
      try {
        window.dispatchEvent(new CustomEvent('scriptica:anexa-saved', {
          detail: { situationId: situation.id, anexaTypeId: anexa.id, percent: pct }
        }));
      } catch (e) {
        var ev = document.createEvent('Event');
        ev.initEvent('scriptica:anexa-saved', false, false);
        window.dispatchEvent(ev);
      }
    };

    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    renderFormBody();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var first = formEl.querySelector('input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled])');
      (first || closeBtn).focus();
    }, 0);
  }

  /* ---------- API public ---------- */

  window.SCRIPTICA_ANEXE = {
    renderCards: renderCards,
    allComplete: allComplete,
    getStepAnexe: getStepAnexe
  };

})();
