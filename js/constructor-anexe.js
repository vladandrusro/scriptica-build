/* ============================================================
   Scriptica — Constructor de Anexe (Phase 10)
   Drag-and-drop form builder pentru anexe — șabloane de sine
   stătătoare (atașarea la pași se face în editorul de tipuri de
   situații). 21 tipuri de module, panou de proprietăți, mod
   previzualizare, JSON peek, persistență în localStorage
   ('scriptica.anexe'). Today is pinned to 2026-04-20.
   ============================================================ */

/* View bootstrap — at script evaluation time, so shell.js renders
   the admin context (user menu + nav item Administrare). */
try { localStorage.setItem('scriptica.view', 'admin'); } catch (e) { /* ignore */ }

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;

  var ANEXE_KEY = 'scriptica.anexe';
  var TODAY_ISO = '2026-04-20';

  /* ============================================================
     FIELD TYPE DEFINITIONS — data contract with mock-data.js
     ============================================================ */
  var FIELD_TYPES = {
    section_title: { label: 'Titlu secțiune', icon: 'title', defaults: { text: 'Secțiune nouă' } },
    paragraph: { label: 'Paragraf instrucțiuni', icon: 'notes', defaults: { text: 'Scrie aici instrucțiunile pentru utilizator.' } },
    banner: { label: 'Banner informativ', icon: 'info', defaults: { variant: 'info', text: 'Atenție la corelarea sumelor.' } },
    divider: { label: 'Separator', icon: 'horizontal_rule', defaults: {} },
    text_short: { label: 'Text scurt', icon: 'short_text', defaults: { label: 'Text scurt', placeholder: '', required: false, help: '', maxLength: 100 } },
    text_long: { label: 'Text lung', icon: 'subject', defaults: { label: 'Observații', placeholder: '', required: false, help: '', rows: 3 } },
    number: { label: 'Număr', icon: 'numbers', defaults: { label: 'Cantitate', required: false, help: '', min: null, max: null, decimals: 0 } },
    currency: { label: 'Sumă monetară', icon: 'payments', defaults: { label: 'Sumă', required: false, currency: 'RON', help: '' } },
    percent: { label: 'Procent', icon: 'percent', defaults: { label: 'Cotă TVA', required: false, help: '' } },
    cui: { label: 'Cod fiscal / CUI', icon: 'badge', defaults: { label: 'CUI', required: false, help: 'Cod fiscal românesc, ex: RO12345678' } },
    date: { label: 'Dată', icon: 'calendar_today', defaults: { label: 'Data', required: false, help: '' } },
    month: { label: 'Lună fiscală', icon: 'date_range', defaults: { label: 'Perioada fiscală', required: false, help: '' } },
    dropdown: { label: 'Dropdown', icon: 'arrow_drop_down_circle', defaults: { label: 'Alege o opțiune', required: false, help: '', options: ['Opțiunea 1', 'Opțiunea 2', 'Opțiunea 3'] } },
    radio: { label: 'Radio (alege una)', icon: 'radio_button_checked', defaults: { label: 'Întrebare', required: false, help: '', options: ['Da', 'Nu', 'Nu se aplică'] } },
    checkboxes: { label: 'Bife multiple', icon: 'check_box', defaults: { label: 'Selectează toate aplicabile', required: false, help: '', options: ['Factură', 'Bon fiscal', 'Aviz', 'NIR'] } },
    boolean: { label: 'Confirmare Da/Nu', icon: 'toggle_on', defaults: { label: 'Confirmi că ai verificat?', required: true, help: '' } },
    client_picker: { label: 'Selector client', icon: 'business', defaults: { label: 'Client', required: true, help: 'Alege din portofoliul firmei.', multi: false, source: 'all_clients', filterActive: true, filterAssigned: false } },
    document_picker: { label: 'Selector document', icon: 'description', defaults: { label: 'Document justificativ', required: false, help: 'Documente din pasul curent.', multi: true, source: 'current_situation', filterCategory: 'all' } },
    file_upload: { label: 'Încărcare fișiere', icon: 'attach_file', defaults: { label: 'Atașează fișiere', required: false, help: '', multi: true, maxSizeMB: 10, allowedTypes: 'PDF, JPG, PNG, XLSX' } },
    table: { label: 'Tabel editabil', icon: 'table_chart', defaults: { label: 'Defalcare pe salariați', required: false, help: 'Adaugă câte un rând pentru fiecare salariat.', columns: [
      { name: 'Nume', type: 'text' },
      { name: 'CNP', type: 'text' },
      { name: 'Salariu brut', type: 'currency' }
    ], minRows: 1 } },
    calculated: { label: 'Câmp calculat', icon: 'function', defaults: { label: 'Total', formula: 'subtotal + tva', help: 'Se calculează automat.' } }
  };

  /* ============================================================
     STATE
     ============================================================ */
  var fields = [];
  var selectedId = null;
  var mode = 'design';

  var anexaId = null;
  var anexaName = 'Anexă nouă';
  var anexaStatus = 'activ';
  var notFound = false;

  /* Ultima versiune salvată (pentru Resetează) */
  var originalFields = [];
  var originalName = 'Anexă nouă';

  var dragState = {
    active: false,
    source: null,        /* 'toolbox' | 'reorder' */
    draggedType: null,
    draggedId: null,
    insertIndex: 0
  };

  /* DOM refs */
  var canvasEl = null;
  var nameInput = null;
  var settingsEmptyEl = null;
  var settingsContentEl = null;

  /* ============================================================
     UTILS
     ============================================================ */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function uid() {
    return 'f_' + Math.random().toString(36).slice(2, 9);
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function findField(id) {
    if (!id) return null;
    return fields.find(function (f) { return f.id === id; }) || null;
  }

  function withUids(list) {
    list.forEach(function (f) { f.id = uid(); });
    return list;
  }

  function stripUids(list) {
    return list.map(function (f) {
      var copy = deepCopy(f);
      delete copy.id;
      return copy;
    });
  }

  function toast(variant, message) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, message);
  }

  /* ============================================================
     LOCALSTORAGE STORE — contract 'scriptica.anexe'
     ============================================================ */
  function readStore() {
    try {
      var raw = localStorage.getItem(ANEXE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(map) {
    try { localStorage.setItem(ANEXE_KEY, JSON.stringify(map)); } catch (e) { /* ignore */ }
  }

  /* ============================================================
     URL LOAD — ?id=anx_X (editare) sau ?new=1&name=... (nouă).
     MOCK.anexeTypes are deja override-urile din localStorage
     aplicate central (mock-data.js · applyAdminOverrides).
     ============================================================ */
  function loadFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');

    if (id) {
      var list = (MOCK && MOCK.anexeTypes) ? MOCK.anexeTypes : [];
      var found = list.find(function (a) { return a.id === id; });
      if (!found) {
        notFound = true;
        return;
      }
      anexaId = found.id;
      anexaName = found.name || 'Anexă nouă';
      anexaStatus = found.status || 'activ';
      originalFields = deepCopy((found.schema && found.schema.fields) || []);
      originalName = anexaName;
      fields = withUids(deepCopy(originalFields));
      return;
    }

    /* ?new=1&name=... */
    var name = (params.get('name') || '').trim();
    anexaName = name || 'Anexă nouă';
    anexaStatus = 'activ';
    anexaId = null;
    originalFields = [];
    originalName = anexaName;
    fields = [];
  }

  /* ============================================================
     FIELD OPERATIONS
     ============================================================ */
  function addField(type, atIndex) {
    if (notFound || mode === 'fill') return;
    var def = FIELD_TYPES[type];
    if (!def) return;
    var newField = deepCopy(def.defaults);
    newField.id = uid();
    newField.type = type;
    if (atIndex === null || atIndex === undefined || atIndex < 0 || atIndex >= fields.length) {
      fields.push(newField);
    } else {
      fields.splice(atIndex, 0, newField);
    }
    selectedId = newField.id;
    render();
  }

  function removeField(id) {
    fields = fields.filter(function (f) { return f.id !== id; });
    if (selectedId === id) selectedId = null;
    render();
  }

  function duplicateField(id) {
    var idx = fields.findIndex(function (f) { return f.id === id; });
    if (idx === -1) return;
    var copy = deepCopy(fields[idx]);
    copy.id = uid();
    fields.splice(idx + 1, 0, copy);
    selectedId = copy.id;
    render();
  }

  function moveField(id, direction) {
    var idx = fields.findIndex(function (f) { return f.id === id; });
    if (idx === -1) return;
    var newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= fields.length) return;
    var tmp = fields[idx];
    fields[idx] = fields[newIdx];
    fields[newIdx] = tmp;
    render();
  }

  function reorderField(id, targetIndex) {
    var currentIndex = fields.findIndex(function (f) { return f.id === id; });
    if (currentIndex === -1) return;
    var moved = fields.splice(currentIndex, 1)[0];
    var adjustedTarget = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
    fields.splice(adjustedTarget, 0, moved);
    selectedId = id;
    render();
  }

  /* ============================================================
     RENDER — canvas
     ============================================================ */
  function render() {
    renderCanvasOnly();
    renderSettings();
  }

  function renderCanvasOnly() {
    if (!canvasEl) return;
    if (notFound) {
      canvasEl.innerHTML =
        '<div class="builder__error">' +
          '<span class="material-symbols-outlined" aria-hidden="true">search_off</span>' +
          '<p>Anexa nu a fost găsită.</p>' +
          '<a href="administrare.html#tipuri-anexe">Înapoi la Tipuri de Anexe</a>' +
        '</div>';
      return;
    }
    canvasEl.innerHTML = '';
    if (!fields.length) {
      canvasEl.innerHTML =
        '<div class="builder__empty">' +
          '<span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span>' +
          '<p class="builder__empty-strong">Trage componente din panoul din stânga</p>' +
          '<p>sau apasă pe o componentă pentru a o adăuga.</p>' +
        '</div>';
      return;
    }
    fields.forEach(function (f, idx) {
      canvasEl.appendChild(renderField(f, idx));
    });
  }

  function renderField(field, idx) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bfield' + (selectedId === field.id ? ' bfield--selected' : '');
    wrapper.setAttribute('data-id', field.id);
    wrapper.setAttribute('data-idx', String(idx));

    wrapper.addEventListener('click', function (e) {
      if (mode === 'fill') return;
      e.stopPropagation();
      if (selectedId !== field.id) {
        selectedId = field.id;
        render();
      }
    });

    /* Mâner de tragere — în afara marginii stângi */
    var handle = document.createElement('div');
    handle.className = 'bfield__handle';
    handle.title = 'Trage pentru a reordona';
    handle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span>';
    handle.addEventListener('click', function (e) { e.stopPropagation(); });
    wrapper.appendChild(handle);

    /* Bara de acțiuni — vizibilă pe câmpul selectat */
    var actions = document.createElement('div');
    actions.className = 'bfield__actions';
    actions.innerHTML =
      '<button type="button" data-action="up" title="Mută sus"><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button>' +
      '<button type="button" data-action="down" title="Mută jos"><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button>' +
      '<button type="button" data-action="copy" title="Duplică"><span class="material-symbols-outlined" aria-hidden="true">content_copy</span></button>' +
      '<button type="button" data-action="delete" title="Șterge"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>';
    actions.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      e.stopPropagation();
      var action = btn.getAttribute('data-action');
      if (action === 'up') moveField(field.id, -1);
      else if (action === 'down') moveField(field.id, 1);
      else if (action === 'copy') duplicateField(field.id);
      else if (action === 'delete') removeField(field.id);
    });
    wrapper.appendChild(actions);

    wrapper.appendChild(renderFieldPreview(field));

    attachReorderHandlers(wrapper);

    return wrapper;
  }

  /* ============================================================
     RENDER — field previews (toate cele 21 de tipuri)
     ============================================================ */
  function renderFieldPreview(field) {
    var container = document.createElement('div');
    container.className = 'bfield__preview';

    var helpHtml = field.help ? '<div class="bfield__help">' + esc(field.help) + '</div>' : '';
    var reqMark = field.required ? ' <span class="bfield__required">*</span>' : '';
    var labelHtml = field.label ? '<div class="bfield__label">' + esc(field.label) + reqMark + '</div>' : '';

    var options = field.options || [];
    var variant, bannerIcons, cpSource, cpFilters, dpSource, dpCategory, cols, headHtml, rowHtml;

    switch (field.type) {
      case 'section_title':
        container.innerHTML = '<h3 class="bfield__section-title">' + esc(field.text) + '</h3>';
        break;

      case 'paragraph':
        container.innerHTML = '<p class="bfield__paragraph">' + esc(field.text) + '</p>';
        break;

      case 'banner':
        variant = (field.variant === 'warning' || field.variant === 'critical') ? field.variant : 'info';
        bannerIcons = { info: 'info', warning: 'warning', critical: 'error' };
        container.innerHTML =
          '<div class="bfield__banner bfield__banner--' + variant + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">' + bannerIcons[variant] + '</span>' +
            '<span>' + esc(field.text) + '</span>' +
          '</div>';
        break;

      case 'divider':
        container.innerHTML = '<hr class="bfield__divider">';
        break;

      case 'text_short':
        container.innerHTML = labelHtml + helpHtml +
          '<input class="bfield__input" type="text" placeholder="' + esc(field.placeholder || '') + '">';
        break;

      case 'text_long':
        container.innerHTML = labelHtml + helpHtml +
          '<textarea class="bfield__input" rows="' + (parseInt(field.rows, 10) || 3) + '" placeholder="' + esc(field.placeholder || '') + '"></textarea>';
        break;

      case 'number':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="number">';
        break;

      case 'currency':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__group">' +
            '<input class="bfield__input" type="number" step="0.01" placeholder="0,00">' +
            '<span class="bfield__unit">' + esc(field.currency || 'RON') + '</span>' +
          '</div>';
        break;

      case 'percent':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__group">' +
            '<input class="bfield__input" type="number" step="0.01" min="0" max="100" placeholder="0,00">' +
            '<span class="bfield__unit">%</span>' +
          '</div>';
        break;

      case 'cui':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="text" placeholder="RO12345678">';
        break;

      case 'date':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="date">';
        break;

      case 'month':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="month">';
        break;

      case 'dropdown':
        container.innerHTML = labelHtml + helpHtml +
          '<select class="bfield__input">' +
            '<option value="">— Alege —</option>' +
            options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') +
          '</select>';
        break;

      case 'radio':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__radios">' +
            options.map(function (o) {
              return '<label><input type="radio" name="' + esc(field.id) + '"> ' + esc(o) + '</label>';
            }).join('') +
          '</div>';
        break;

      case 'checkboxes':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__checks">' +
            options.map(function (o) {
              return '<label><input type="checkbox"> ' + esc(o) + '</label>';
            }).join('') +
          '</div>';
        break;

      case 'boolean':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__radios">' +
            '<label><input type="radio" name="' + esc(field.id) + '"> Da</label>' +
            '<label><input type="radio" name="' + esc(field.id) + '"> Nu</label>' +
          '</div>';
        break;

      case 'client_picker':
        cpSource = ({
          all_clients: 'Toți clienții firmei',
          my_clients: 'Clienții mei',
          department_clients: 'Clienții departamentului'
        })[field.source] || 'Toți clienții firmei';
        cpFilters = [];
        if (field.filterActive) cpFilters.push('activi');
        if (field.filterAssigned) cpFilters.push('cu situație activă');
        container.innerHTML = labelHtml + helpHtml +
          '<select class="bfield__input"' + (field.multi ? ' multiple size="3"' : '') + '>' +
            '<option value="">— Alege client din portofoliu —</option>' +
            '<option>Canvas S.R.L.</option>' +
            '<option>Ionuț Profan PFA</option>' +
            '<option>Simbio Cost Control</option>' +
          '</select>' +
          '<div class="bfield__source">' +
            '<span class="material-symbols-outlined" aria-hidden="true">database</span>' +
            'Sursă: ' + esc(cpSource) + (cpFilters.length ? ' · filtre: ' + esc(cpFilters.join(', ')) : '') +
          '</div>';
        break;

      case 'document_picker':
        dpSource = ({
          current_situation: 'Toți pașii situației',
          current_step: 'Pasul curent',
          previous_steps: 'Pașii anteriori'
        })[field.source] || 'Situația curentă';
        dpCategory = ({
          all: 'toate',
          intrare: 'Intrare',
          iesire: 'Ieșire',
          salarizare: 'Salarizare',
          necategorisit: 'Necategorisit'
        })[field.filterCategory] || 'toate';
        container.innerHTML = labelHtml + helpHtml +
          '<select class="bfield__input"' + (field.multi ? ' multiple size="3"' : '') + '>' +
            '<option>factura_orange_martie_2026.pdf</option>' +
            '<option>bonuri_curatenie_intrare.png</option>' +
            '<option>extras_bcr_martie.pdf</option>' +
          '</select>' +
          '<div class="bfield__source">' +
            '<span class="material-symbols-outlined" aria-hidden="true">database</span>' +
            'Sursă: ' + esc(dpSource) + ' · categorie: ' + esc(dpCategory) +
          '</div>';
        break;

      case 'file_upload':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__upload">' +
            '<span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span>' +
            '<div>Trage fișierele aici sau apasă pentru a alege</div>' +
            '<div class="bfield__upload-meta">' + esc(field.allowedTypes || '') + ' · max ' + esc(field.maxSizeMB == null ? '—' : field.maxSizeMB) + ' MB</div>' +
          '</div>';
        break;

      case 'table':
        cols = field.columns || [];
        headHtml = cols.map(function (c) { return '<th>' + esc(c.name) + '</th>'; }).join('');
        rowHtml = '<tr>' +
          cols.map(function () { return '<td><input class="bfield__input bfield__cell-input" type="text"></td>'; }).join('') +
          '<td class="bfield__cell-del"><span class="material-symbols-outlined" aria-hidden="true">delete</span></td></tr>';
        container.innerHTML = labelHtml + helpHtml +
          '<table class="bfield__table">' +
            '<thead><tr>' + headHtml + '<th class="bfield__cell-del"></th></tr></thead>' +
            '<tbody>' + rowHtml + rowHtml + '</tbody>' +
          '</table>' +
          '<div class="bfield__table-footer">+ Adaugă rând</div>';
        break;

      case 'calculated':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__calculated">' +
            '<span class="material-symbols-outlined" aria-hidden="true">function</span>' +
            '<span>= ' + esc(field.formula || '') + '</span>' +
          '</div>';
        break;

      default:
        container.innerHTML = '<p class="bfield__paragraph">Tip necunoscut: ' + esc(field.type) + '</p>';
    }

    return container;
  }

  /* ============================================================
     RENDER — settings panel
     ============================================================ */
  function renderSettings() {
    if (!settingsEmptyEl || !settingsContentEl) return;
    var field = findField(selectedId);
    if (!field || mode === 'fill') {
      settingsEmptyEl.hidden = false;
      settingsContentEl.hidden = true;
      settingsContentEl.innerHTML = '';
      return;
    }

    var def = FIELD_TYPES[field.type] || { label: field.type };
    var html =
      '<div class="builder__settings-header">' +
        '<div class="builder__settings-type">' + esc(def.label) + '</div>' +
        '<h3 class="builder__settings-title">' + esc(field.label || field.text || 'Fără etichetă') + '</h3>' +
      '</div>';

    /* === Tipuri de layout === */
    if (field.type === 'section_title' || field.type === 'paragraph') {
      html += group('Conținut', textRow('text', 'Text afișat', field.text, 'textarea'));
    } else if (field.type === 'banner') {
      html += group('Conținut',
        selectRow('variant', 'Stil', field.variant, [
          { v: 'info', l: 'Informativ' },
          { v: 'warning', l: 'Avertisment' },
          { v: 'critical', l: 'Critic' }
        ]) +
        textRow('text', 'Text', field.text, 'textarea')
      );
    } else if (field.type === 'divider') {
      html += '<div class="builder__settings-note">Separatorul nu are proprietăți de configurat.</div>';
    } else {
      /* === Câmpuri de input — etichetă comună === */
      html += group('Etichetă',
        textRow('label', 'Etichetă (vizibilă utilizatorului)', field.label || '') +
        textRow('help', 'Text de ajutor (sub etichetă)', field.help || '', 'textarea')
      );

      /* Configurare per-tip */
      if (field.type === 'text_short') {
        html += group('Configurare',
          textRow('placeholder', 'Placeholder', field.placeholder || '') +
          numberRow('maxLength', 'Lungime maximă', field.maxLength)
        );
      }
      if (field.type === 'text_long') {
        html += group('Configurare',
          textRow('placeholder', 'Placeholder', field.placeholder || '') +
          numberRow('rows', 'Înălțime (rânduri)', field.rows)
        );
      }
      if (field.type === 'number') {
        html += group('Configurare',
          numberRow('min', 'Valoare minimă', field.min) +
          numberRow('max', 'Valoare maximă', field.max) +
          numberRow('decimals', 'Număr de zecimale', field.decimals)
        );
      }
      if (field.type === 'currency') {
        html += group('Configurare',
          selectRow('currency', 'Monedă', field.currency, [
            { v: 'RON', l: 'RON' }, { v: 'EUR', l: 'EUR' }, { v: 'USD', l: 'USD' }
          ])
        );
      }

      /* Opțiuni inline (dropdown / radio / checkboxes) */
      if (field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkboxes') {
        html += group('Opțiuni', renderOptionsEditor(field));
      }

      /* Selector client — sursă de date + filtre */
      if (field.type === 'client_picker') {
        html += group('Sursă de date',
          sourceNote('Lista vine din baza de date Scriptica.') +
          selectRow('source', 'Listă afișată', field.source, [
            { v: 'all_clients', l: 'Toți clienții firmei' },
            { v: 'my_clients', l: 'Doar clienții mei (asignați)' },
            { v: 'department_clients', l: 'Clienții departamentului meu' }
          ])
        );
        html += group('Filtre',
          checkboxRow('filterActive', 'Doar clienți activi (exclude arhivați)', field.filterActive) +
          checkboxRow('filterAssigned', 'Doar clienți cu situație activă în pasul curent', field.filterAssigned)
        );
        html += group('Configurare', checkboxRow('multi', 'Permite selecție multiplă', field.multi));
      } else if (field.type === 'document_picker') {
        html += group('Sursă de date',
          sourceNote('Documentele se preiau din situația contabilă curentă.') +
          selectRow('source', 'Documente disponibile', field.source, [
            { v: 'current_situation', l: 'Din situația curentă (toți pașii)' },
            { v: 'current_step', l: 'Doar din pasul curent' },
            { v: 'previous_steps', l: 'Doar din pașii anteriori' }
          ])
        );
        html += group('Filtru categorie',
          selectRow('filterCategory', 'Afișează doar categoria', field.filterCategory, [
            { v: 'all', l: 'Toate categoriile' },
            { v: 'intrare', l: 'Doar Intrare' },
            { v: 'iesire', l: 'Doar Ieșire' },
            { v: 'salarizare', l: 'Doar Salarizare' },
            { v: 'necategorisit', l: 'Doar Necategorisit' }
          ])
        );
        html += group('Configurare', checkboxRow('multi', 'Permite selecție multiplă', field.multi));
      } else if (field.type === 'file_upload') {
        html += group('Configurare', checkboxRow('multi', 'Permite selecție multiplă', field.multi));
        html += group('Restricții fișiere',
          textRow('allowedTypes', 'Tipuri permise', field.allowedTypes) +
          numberRow('maxSizeMB', 'Dimensiune max (MB)', field.maxSizeMB)
        );
      }

      /* Coloane tabel */
      if (field.type === 'table') {
        html += group('Coloane', renderColumnsEditor(field));
        html += group('Configurare', numberRow('minRows', 'Număr minim de rânduri', field.minRows));
      }

      /* Formulă câmp calculat */
      if (field.type === 'calculated') {
        html += group('Formulă',
          textRow('formula', 'Expresie de calcul', field.formula, 'textarea') +
          '<div class="builder__formula-help">Folosește numele câmpurilor: <code>subtotal + tva</code>, <code>pret * cantitate</code></div>'
        );
      }

      /* Validare — comună */
      if (['section_title', 'paragraph', 'banner', 'divider', 'calculated'].indexOf(field.type) === -1) {
        html += group('Validare', checkboxRow('required', 'Câmp obligatoriu', field.required));
      }
    }

    /* Footer */
    html +=
      '<div class="builder__settings-footer">' +
        '<button type="button" class="btn btn--ghost" data-settings-duplicate>' +
          '<span class="material-symbols-outlined" aria-hidden="true">content_copy</span> Duplică' +
        '</button>' +
        '<button type="button" class="btn btn--ghost builder__settings-delete" data-settings-delete>' +
          '<span class="material-symbols-outlined" aria-hidden="true">delete</span> Șterge' +
        '</button>' +
      '</div>';

    settingsEmptyEl.hidden = true;
    settingsContentEl.hidden = false;
    settingsContentEl.innerHTML = html;
    attachSettingsHandlers();
  }

  /* --- Generatoare de rânduri pentru settings --- */
  function group(title, inner) {
    return '<div class="builder__sgroup"><div class="builder__sgroup-title">' + esc(title) + '</div>' + inner + '</div>';
  }

  function textRow(key, label, value, kind) {
    if (kind === 'textarea') {
      return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
        '<textarea data-key="' + esc(key) + '">' + esc(value || '') + '</textarea></div>';
    }
    return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
      '<input data-key="' + esc(key) + '" type="text" value="' + esc(value || '') + '"></div>';
  }

  function numberRow(key, label, value) {
    var v = (value === null || value === undefined) ? '' : value;
    return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
      '<input data-key="' + esc(key) + '" type="number" value="' + esc(v) + '"></div>';
  }

  function selectRow(key, label, value, options) {
    return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
      '<select data-key="' + esc(key) + '">' +
      options.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.l) + '</option>';
      }).join('') +
      '</select></div>';
  }

  function checkboxRow(key, label, value) {
    return '<div class="builder__srow builder__srow--inline"><label>' +
      '<input data-key="' + esc(key) + '" type="checkbox"' + (value ? ' checked' : '') + '> ' +
      esc(label) + '</label></div>';
  }

  function sourceNote(text) {
    return '<div class="builder__source-note">' +
      '<span class="material-symbols-outlined" aria-hidden="true">database</span>' +
      '<span>' + esc(text) + '</span></div>';
  }

  function renderOptionsEditor(field) {
    var options = field.options || [];
    return '<div class="builder__options">' +
      options.map(function (opt, i) {
        return '<div class="builder__option-row">' +
          '<span class="builder__option-grip"><span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span></span>' +
          '<input type="text" value="' + esc(opt) + '" data-opt-idx="' + i + '">' +
          '<button type="button" data-opt-remove="' + i + '" title="Șterge opțiunea"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '</div>';
      }).join('') +
      '<button type="button" class="builder__add-btn" data-add-option>' +
        '<span class="material-symbols-outlined" aria-hidden="true">add</span> Adaugă opțiune' +
      '</button>' +
    '</div>';
  }

  function renderColumnsEditor(field) {
    var columns = field.columns || [];
    return '<div class="builder__columns">' +
      columns.map(function (col, i) {
        return '<div class="builder__column">' +
          '<div class="builder__column-head">' +
            '<span>Coloana ' + (i + 1) + '</span>' +
            '<button type="button" data-col-remove="' + i + '" title="Șterge coloana"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
          '</div>' +
          '<div class="builder__column-fields">' +
            '<input type="text" value="' + esc(col.name) + '" data-col-idx="' + i + '" data-col-key="name" placeholder="Nume coloană">' +
            '<select data-col-idx="' + i + '" data-col-key="type">' +
              '<option value="text"' + (col.type === 'text' ? ' selected' : '') + '>Text</option>' +
              '<option value="number"' + (col.type === 'number' ? ' selected' : '') + '>Număr</option>' +
              '<option value="currency"' + (col.type === 'currency' ? ' selected' : '') + '>Sumă</option>' +
              '<option value="date"' + (col.type === 'date' ? ' selected' : '') + '>Dată</option>' +
            '</select>' +
          '</div>' +
        '</div>';
      }).join('') +
      '<button type="button" class="builder__add-btn" data-add-column>' +
        '<span class="material-symbols-outlined" aria-hidden="true">add</span> Adaugă coloană' +
      '</button>' +
    '</div>';
  }

  /* --- Handlere pentru settings (re-randează DOAR canvas-ul la tastare,
         ca input-ul să nu piardă focusul) --- */
  function onSettingInput(e) {
    var el = e.target;
    var key = el.getAttribute('data-key');
    var f = findField(selectedId);
    if (!f || !key) return;
    var val;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'number') val = el.value === '' ? null : Number(el.value);
    else val = el.value;
    f[key] = val;
    renderCanvasOnly();
  }

  function onOptionInput(e) {
    var idx = parseInt(e.target.getAttribute('data-opt-idx'), 10);
    var f = findField(selectedId);
    if (f && f.options && idx >= 0 && idx < f.options.length) {
      f.options[idx] = e.target.value;
      renderCanvasOnly();
    }
  }

  function onColumnInput(e) {
    var idx = parseInt(e.target.getAttribute('data-col-idx'), 10);
    var key = e.target.getAttribute('data-col-key');
    var f = findField(selectedId);
    if (f && f.columns && f.columns[idx] && key) {
      f.columns[idx][key] = e.target.value;
      renderCanvasOnly();
    }
  }

  function addOption() {
    var f = findField(selectedId);
    if (f && f.options) { f.options.push('Opțiune nouă'); render(); }
  }

  function removeOption(idx) {
    var f = findField(selectedId);
    if (f && f.options && f.options.length > 1) { f.options.splice(idx, 1); render(); }
  }

  function addColumn() {
    var f = findField(selectedId);
    if (f && f.columns) { f.columns.push({ name: 'Coloană nouă', type: 'text' }); render(); }
  }

  function removeColumn(idx) {
    var f = findField(selectedId);
    if (f && f.columns && f.columns.length > 1) { f.columns.splice(idx, 1); render(); }
  }

  function attachSettingsHandlers() {
    settingsContentEl.querySelectorAll('[data-key]').forEach(function (el) {
      el.addEventListener('input', onSettingInput);
      if (el.tagName === 'SELECT') el.addEventListener('change', onSettingInput);
    });
    settingsContentEl.querySelectorAll('[data-opt-idx]').forEach(function (el) {
      el.addEventListener('input', onOptionInput);
    });
    settingsContentEl.querySelectorAll('[data-opt-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeOption(parseInt(btn.getAttribute('data-opt-remove'), 10));
      });
    });
    settingsContentEl.querySelectorAll('[data-add-option]').forEach(function (btn) {
      btn.addEventListener('click', addOption);
    });
    settingsContentEl.querySelectorAll('[data-col-idx]').forEach(function (el) {
      el.addEventListener('input', onColumnInput);
      if (el.tagName === 'SELECT') el.addEventListener('change', onColumnInput);
    });
    settingsContentEl.querySelectorAll('[data-col-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeColumn(parseInt(btn.getAttribute('data-col-remove'), 10));
      });
    });
    settingsContentEl.querySelectorAll('[data-add-column]').forEach(function (btn) {
      btn.addEventListener('click', addColumn);
    });
    settingsContentEl.querySelectorAll('[data-settings-duplicate]').forEach(function (btn) {
      btn.addEventListener('click', function () { duplicateField(selectedId); });
    });
    settingsContentEl.querySelectorAll('[data-settings-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { removeField(selectedId); });
    });
  }

  /* ============================================================
     DRAG & DROP — toolbox → canvas + reordonare cu indicator
     ============================================================ */
  function initToolbox() {
    document.querySelectorAll('.builder__tool').forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        dragState.active = true;
        dragState.source = 'toolbox';
        dragState.draggedType = item.getAttribute('data-type');
        dragState.draggedId = null;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', item.getAttribute('data-type'));
        canvasEl.classList.add('builder__canvas--drag-active');
      });
      item.addEventListener('dragend', cleanupDrag);
      /* Click pe componentă = adaugă la final */
      item.addEventListener('click', function () {
        addField(item.getAttribute('data-type'));
      });
    });
  }

  function attachReorderHandlers(fieldEl) {
    var handle = fieldEl.querySelector('.bfield__handle');
    if (!handle) return;

    fieldEl.setAttribute('draggable', 'true');

    /* Drag-ul pornește DOAR din mâner */
    var allowDrag = false;
    handle.addEventListener('mousedown', function () { allowDrag = true; });
    fieldEl.addEventListener('mouseup', function () { allowDrag = false; });

    fieldEl.addEventListener('dragstart', function (e) {
      if (!allowDrag || mode === 'fill') {
        e.preventDefault();
        return;
      }
      dragState.active = true;
      dragState.source = 'reorder';
      dragState.draggedId = fieldEl.getAttribute('data-id');
      dragState.draggedType = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', fieldEl.getAttribute('data-id'));
      fieldEl.classList.add('bfield--dragging');
      canvasEl.classList.add('builder__canvas--drag-active');
    });

    fieldEl.addEventListener('dragend', function () {
      /* Orice tentativă nouă de drag cere un mousedown proaspăt pe mâner,
         inclusiv după drop no-op sau drag anulat cu Escape. */
      allowDrag = false;
      fieldEl.classList.remove('bfield--dragging');
      cleanupDrag();
    });
  }

  function initCanvasDnd() {
    canvasEl.addEventListener('dragover', function (e) {
      if (!dragState.active) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = dragState.source === 'reorder' ? 'move' : 'copy';

      var fieldEls = Array.prototype.slice.call(canvasEl.querySelectorAll('.bfield'));
      var mouseY = e.clientY;
      var insertIndex = fieldEls.length;

      for (var i = 0; i < fieldEls.length; i++) {
        var rect = fieldEls[i].getBoundingClientRect();
        var midpoint = rect.top + rect.height / 2;
        if (mouseY < midpoint) {
          insertIndex = i;
          break;
        }
      }

      /* No-op: reordonare pe propria poziție — ascunde indicatorul */
      if (dragState.source === 'reorder') {
        var draggedIdx = fields.findIndex(function (f) { return f.id === dragState.draggedId; });
        if (insertIndex === draggedIdx || insertIndex === draggedIdx + 1) {
          removeDropIndicator();
          dragState.insertIndex = -1;
          return;
        }
      }

      dragState.insertIndex = insertIndex;
      showDropIndicator(insertIndex);
    });

    canvasEl.addEventListener('dragleave', function (e) {
      if (e.target === canvasEl && !canvasEl.contains(e.relatedTarget)) {
        removeDropIndicator();
      }
    });

    canvasEl.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!dragState.active || dragState.insertIndex < 0) {
        cleanupDrag();
        return;
      }
      if (dragState.source === 'toolbox') {
        addField(dragState.draggedType, dragState.insertIndex);
      } else if (dragState.source === 'reorder') {
        reorderField(dragState.draggedId, dragState.insertIndex);
      }
      cleanupDrag();
    });
  }

  function cleanupDrag() {
    dragState = { active: false, source: null, draggedType: null, draggedId: null, insertIndex: 0 };
    removeDropIndicator();
    canvasEl.classList.remove('builder__canvas--drag-active');
    canvasEl.querySelectorAll('.bfield--dragging').forEach(function (el) {
      el.classList.remove('bfield--dragging');
    });
  }

  function showDropIndicator(idx) {
    removeDropIndicator();
    var indicator = document.createElement('div');
    indicator.className = 'builder__drop-indicator';
    indicator.id = 'drop-indicator';
    var fieldEls = canvasEl.querySelectorAll('.bfield');
    if (idx >= fieldEls.length) {
      canvasEl.appendChild(indicator);
    } else {
      canvasEl.insertBefore(indicator, fieldEls[idx]);
    }
  }

  function removeDropIndicator() {
    var existing = document.getElementById('drop-indicator');
    if (existing) existing.remove();
  }

  /* ============================================================
     MODE TOGGLE — Construiește / Previzualizează
     ============================================================ */
  function initModeToggle() {
    var btns = document.querySelectorAll('.builder__mode-btn');
    var workspace = document.getElementById('builder-workspace');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.getAttribute('data-mode');
        if (m === mode) return;
        mode = m;
        btns.forEach(function (b) {
          var active = (b === btn);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        var isFill = (mode === 'fill');
        if (workspace) workspace.classList.toggle('builder__workspace--fill', isFill);
        canvasEl.classList.toggle('builder__canvas--fill', isFill);
        if (isFill) selectedId = null;
        render();
      });
    });
  }

  /* ============================================================
     MODALS — JSON peek + confirmare resetare
     ============================================================ */
  function openModal(modal) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var target = modal.querySelector('.modal__footer .btn--critical, .modal__footer .btn--primary') ||
        modal.querySelector('.modal__footer .btn') ||
        modal.querySelector('[data-modal-close]');
      if (target) target.focus();
    }, 0);
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initModals() {
    document.querySelectorAll('.modal').forEach(function (modal) {
      modal.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) {
        btn.addEventListener('click', function () { closeModal(modal); });
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal(modal);
      });
    });
    document.addEventListener('keydown', function (e) {
      var open = document.querySelector('.modal.is-open');
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal(open);
      } else if (e.key === 'Tab') {
        trapFocus(e, open.querySelector('.modal__dialog'));
      }
    });
  }

  /* Focusul rămâne în dialog cât timp modalul este deschis
     (pattern din dashboard.js / administrare.js). */
  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function showJson() {
    var modal = document.getElementById('modal-json');
    var pre = document.getElementById('json-output');
    if (!modal || !pre) return;
    var schema = {
      name: (nameInput.value || '').trim() || 'Anexă nouă',
      fields: stripUids(fields)
    };
    pre.textContent = JSON.stringify(schema, null, 2);
    openModal(modal);
  }

  /* ============================================================
     SAVE / RESET
     ============================================================ */
  function saveAnexa() {
    if (notFound) return;
    var name = (nameInput.value || '').trim() || 'Anexă nouă';

    /* Id nou generat O SINGURĂ DATĂ; salvările ulterioare actualizează */
    if (!anexaId) {
      anexaId = 'anx_' + Date.now();
      try {
        history.replaceState(null, '', 'constructor-anexe.html?id=' + encodeURIComponent(anexaId));
      } catch (e) { /* ignore */ }
    }

    /* Înregistrare completă, fără chei moștenite (situationTypeId/step) —
       construită de la zero, deci orice cheie legacy este eliminată. */
    var record = {
      id: anexaId,
      name: name,
      status: anexaStatus || 'activ',
      updatedAt: TODAY_ISO,
      schema: { fields: stripUids(fields) }
    };

    /* 1) Persistă în harta 'scriptica.anexe' (supraviețuiește navigării). */
    var map = readStore();
    map[anexaId] = record;
    writeStore(map);

    /* 2) Actualizează MOCK.anexeTypes în memorie (sursa de citire centrală). */
    var list = (MOCK && MOCK.anexeTypes) ? MOCK.anexeTypes : [];
    var idx = list.findIndex(function (a) { return a.id === anexaId; });
    if (idx === -1) list.push(record);
    else list[idx] = record;

    originalFields = stripUids(fields);
    originalName = name;
    nameInput.value = name;
    toast('success', 'Anexa a fost salvată.');
  }

  function resetAnexa() {
    fields = withUids(deepCopy(originalFields));
    nameInput.value = originalName;
    selectedId = null;
    render();
    toast('info', 'Anexa a fost resetată.');
  }

  function initTopbarActions() {
    var saveBtn = document.getElementById('builder-save');
    var resetBtn = document.getElementById('builder-reset');
    var resetModal = document.getElementById('modal-reset');
    var confirmBtn = document.getElementById('builder-reset-confirm');
    var jsonBtn = document.getElementById('builder-json-btn');

    if (notFound) {
      if (saveBtn) saveBtn.disabled = true;
      if (resetBtn) resetBtn.disabled = true;
      if (jsonBtn) jsonBtn.disabled = true;
      if (nameInput) nameInput.disabled = true;
      document.querySelectorAll('.builder__mode-btn').forEach(function (b) { b.disabled = true; });
      return;
    }

    if (saveBtn) saveBtn.addEventListener('click', saveAnexa);
    if (resetBtn && resetModal) {
      resetBtn.addEventListener('click', function () { openModal(resetModal); });
    }
    if (confirmBtn && resetModal) {
      confirmBtn.addEventListener('click', function () {
        closeModal(resetModal);
        resetAnexa();
      });
    }
    if (jsonBtn) jsonBtn.addEventListener('click', showJson);
  }

  /* ============================================================
     NAV — marchează Administrare ca activ (injectat de shell.js)
     ============================================================ */
  function markAdminNavActive() {
    var item = document.querySelector('[data-nav="administrare"]');
    if (!item) return;
    item.classList.add('nav-item--active');
    var icon = item.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.add('filled');
  }

  /* ============================================================
     INIT
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    canvasEl = document.getElementById('builder-canvas');
    nameInput = document.getElementById('builder-name');
    settingsEmptyEl = document.getElementById('settings-empty');
    settingsContentEl = document.getElementById('settings-content');
    if (!canvasEl || !nameInput) return;

    loadFromUrl();
    nameInput.value = notFound ? '' : anexaName;
    markAdminNavActive();

    initToolbox();
    initCanvasDnd();
    initModeToggle();
    initTopbarActions();
    initModals();

    /* Click în afara câmpurilor = deselectare */
    var canvasPanel = document.getElementById('builder-canvas-panel');
    if (canvasPanel) {
      canvasPanel.addEventListener('click', function () {
        if (mode === 'fill' || selectedId === null) return;
        selectedId = null;
        render();
      });
    }

    render();
  });

})();
