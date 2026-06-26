/* ============================================================
   Scriptica — Administrare (Phase 9 + Phase 10)
   Tab-uri: utilizatori interni/externi, tipuri de situații
   (step builder: pași + task-uri + anexe atașate), tipuri de
   anexe (șabloane independente), taguri.
   Persistență admin: hărțile localStorage 'scriptica.anexe' și
   'scriptica.situationTypes' (id → înregistrare completă;
   { id, deleted: true } = tombstone). Citirea se face exclusiv
   din window.SCRIPTICA_MOCK, combinat central în mock-data.js.
   "Azi" este fixat la 2026-04-20 pentru date stabile de prototip.
   ============================================================ */

/* View bootstrap — rulează la evaluarea scriptului, înainte de
   DOMContentLoaded, ca shell.js să randeze contextul de admin. */
try { localStorage.setItem('scriptica.view', 'admin'); } catch (e) { /* ignore */ }

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var TODAY_ISO = '2026-04-20';
  var ANEXE_KEY = 'scriptica.anexe';
  var TYPES_KEY = 'scriptica.situationTypes';
  var DEFAULT_TAB = 'utilizatori-interni';
  var ENABLED_TABS = ['utilizatori-interni', 'utilizatori-externi', 'tipuri-situatii', 'tipuri-audit', 'tipuri-anexe', 'taguri'];
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var FREQUENCY_LABELS = {
    lunar:        'Lunar',
    trimestrial:  'Trimestrial',
    semestrial:   'Semestrial',
    anual:        'Anual',
    /* Periodicități suplimentare pentru misiunile de audit. */
    treime:       'Pe treimi',
    la_cerere:    'La cerere (neperiodică)'
  };

  /* Etichete condiționate pe domeniu pentru modalul de tip (reutilizat). */
  var DOMAIN_LABELS = {
    contabil: {
      modalTitle: 'Tip de situație contabilă',
      freqLabel: 'Frecvență*',
      freqPlaceholder: 'Selectează frecvența...',
      freqError: 'Selectează frecvența.',
      saveToast: 'Tipul de situație a fost salvat.'
    },
    audit: {
      modalTitle: 'Tip de misiune de audit',
      freqLabel: 'Periodicitate planificare*',
      freqPlaceholder: 'Selectează periodicitatea...',
      freqError: 'Selectează periodicitatea.',
      saveToast: 'Tipul de misiune de audit a fost salvat.'
    }
  };

  /* Opțiunile dropdown-ului de frecvență/periodicitate din modal, per domeniu. */
  var FREQUENCY_OPTIONS = {
    contabil: [['lunar', 'Lunar'], ['trimestrial', 'Trimestrial'], ['semestrial', 'Semestrial'], ['anual', 'Anual']],
    audit: [['anual', 'Anual'], ['semestrial', 'Semestrial'], ['trimestrial', 'Trimestrial'], ['treime', 'Pe treimi'], ['lunar', 'Lunar'], ['la_cerere', 'La cerere (neperiodică)']]
  };

  var PERSON_TYPE_LABELS = {
    pj:  'Persoană juridică',
    pfa: 'PFA'
  };

  var STATUS_LABELS = {
    activ:   'Activ',
    inactiv: 'Inactiv'
  };

  /* Copii de lucru în memorie */
  var users = [];
  var tags = [];

  /* Stare filtre */
  var filters = {
    userSearch: '', userTip: '',
    clientSearch: '',
    typeSearch: '', typeStatus: '', typeFreq: '',
    auditSearch: '', auditStatus: '', auditFreq: '',
    anexaSearch: '', anexaStatus: '',
    tagSearch: ''
  };

  /* Controllere de modal (create în init) */
  var userModal, typeModal, anexaModal, tagModal, confirmModal;
  var editingUserId = null;
  var editingTypeId = null;
  var editingTypeDomain = 'contabil';
  var editingTagId = null;
  var confirmAction = null;

  /* Pașii în curs de editare în modalul de tip (step builder) */
  var draftSteps = [];
  /* Formulele automate în curs de editare (legate la nivel de tip) */
  var draftFormulas = [];
  var editingFormulaIdx = -1;
  var formulaModal = null;

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK || !document.getElementById('admin-tabs')) {
      if (!MOCK) console.error('[Scriptica] Mock data missing.');
      return;
    }
    buildUsers();
    buildTags();
    bindTabs();
    bindFilters();
    bindTableActions();
    initUserModal();
    initTypeModal();
    initAnexaModal();
    initTagModal();
    initConfirmModal();
    bindGlobalModalKeys();
    activateFromHash();
    window.addEventListener('hashchange', activateFromHash);
    /* Întoarcerea din constructor (inclusiv bfcache) re-citește anexele. */
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) renderActive(slugFromHash());
    });
  });

  /* ---------- Utilitare ---------- */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function formatDateFull(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function toast(variant, message) {
    if (window.SCRIPTICA_TOAST) window.SCRIPTICA_TOAST(variant, message);
  }

  function statusPillHtml(status) {
    var st = status === 'inactiv' ? 'inactiv' : 'activ';
    return '<span class="status-pill status-pill--' + st + '">' +
      '<span class="status-pill__dot" aria-hidden="true"></span>' +
      STATUS_LABELS[st] +
    '</span>';
  }

  function actionBtnHtml(action, id, icon, label, isDelete) {
    return '<button type="button" class="admin-action-btn' + (isDelete ? ' admin-action-btn--delete' : '') +
      '" data-action="' + action + '" data-id="' + esc(id) + '" aria-label="' + esc(label) + '" title="' + esc(label) + '">' +
      '<span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' +
    '</button>';
  }

  function toggleEmpty(prefix, count) {
    var wrap = $(prefix + '-table-wrap');
    var empty = $(prefix + '-empty');
    if (!wrap || !empty) return;
    wrap.style.display = count ? '' : 'none';
    empty.style.display = count ? 'none' : 'flex';
  }

  /* Harta id → înregistrare din localStorage ('scriptica.anexe' /
     'scriptica.situationTypes'). Citirea datelor se face DOAR din
     window.SCRIPTICA_MOCK (deja combinat la încărcare în mock-data.js);
     aici doar persistăm modificările. */
  function readMap(key) {
    try {
      var raw = localStorage.getItem(key);
      var map = raw ? JSON.parse(raw) : {};
      return (map && typeof map === 'object') ? map : {};
    } catch (e) {
      return {};
    }
  }

  function writeMapEntry(key, id, record) {
    var map = readMap(key);
    map[id] = record;
    try { localStorage.setItem(key, JSON.stringify(map)); } catch (e) { /* ignore */ }
  }

  /* ---------- Tab strip ---------- */

  function slugFromHash() {
    var h = (window.location.hash || '').replace(/^#/, '');
    return ENABLED_TABS.indexOf(h) !== -1 ? h : DEFAULT_TAB;
  }

  function activateFromHash() {
    activateTab(slugFromHash());
  }

  function activateTab(slug) {
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
      var active = btn.getAttribute('data-tab') === slug;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.admin-panel').forEach(function (panel) {
      panel.classList.toggle('is-active', panel.id === 'panel-' + slug);
    });
    renderActive(slug);
  }

  function renderActive(slug) {
    if (slug === 'utilizatori-interni')       renderUsers();
    else if (slug === 'utilizatori-externi')  renderClients();
    else if (slug === 'tipuri-situatii')      renderTypes('contabil');
    else if (slug === 'tipuri-audit')         renderTypes('audit');
    else if (slug === 'tipuri-anexe')         renderAnexe();
    else if (slug === 'taguri')               renderTags();
  }

  function bindTabs() {
    document.querySelectorAll('.admin-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('admin-tab--disabled')) return;
        var slug = btn.getAttribute('data-tab');
        if (window.location.hash === '#' + slug) return;
        window.location.hash = slug;
      });
    });
  }

  /* ---------- Date de lucru ---------- */

  function buildUsers() {
    users = [];
    (MOCK.admins || []).forEach(function (a) {
      users.push({
        id: a.id, name: a.fullName || a.name, email: a.email || '', username: a.username || '',
        role: '', tip: 'Administrator', status: a.status || 'activ', avatarId: a.avatarId,
        validFrom: '', validTo: ''
      });
    });
    (MOCK.employees || []).forEach(function (e) {
      users.push({
        id: e.id, name: e.fullName || e.name, email: e.email || '', username: e.username || '',
        role: e.role || 'Contabil', tip: 'Angajat', status: e.status || 'activ', avatarId: e.avatarId,
        validFrom: '', validTo: ''
      });
    });
  }

  function buildTags() {
    tags = (MOCK.adminTags || []).map(function (t) {
      return { id: t.id, name: t.name, usageCount: t.usageCount || 0 };
    });
  }

  /* ---------- Filtre ---------- */

  function bindFilters() {
    bindInput('ui-search', 'input',  function (v) { filters.userSearch = v; renderUsers(); });
    bindInput('ui-tip',    'change', function (v) { filters.userTip = v; renderUsers(); });
    bindInput('ue-search', 'input',  function (v) { filters.clientSearch = v; renderClients(); });
    bindInput('ts-search', 'input',  function (v) { filters.typeSearch = v; renderTypes('contabil'); });
    bindInput('ts-status', 'change', function (v) { filters.typeStatus = v; renderTypes('contabil'); });
    bindInput('ts-freq',   'change', function (v) { filters.typeFreq = v; renderTypes('contabil'); });
    bindInput('tma-search', 'input',  function (v) { filters.auditSearch = v; renderTypes('audit'); });
    bindInput('tma-status', 'change', function (v) { filters.auditStatus = v; renderTypes('audit'); });
    bindInput('tma-freq',   'change', function (v) { filters.auditFreq = v; renderTypes('audit'); });
    bindInput('ta-search', 'input',  function (v) { filters.anexaSearch = v; renderAnexe(); });
    bindInput('ta-status', 'change', function (v) { filters.anexaStatus = v; renderAnexe(); });
    bindInput('tg-search', 'input',  function (v) { filters.tagSearch = v; renderTags(); });
  }

  function bindInput(id, evt, cb) {
    var el = $(id);
    if (!el) return;
    el.addEventListener(evt, function (e) { cb(e.target.value); });
  }

  /* ---------- Acțiuni delegate pe tabele ---------- */

  function bindTableActions() {
    bindAction('ui-tbody', function (action, id) {
      var user = users.find(function (u) { return String(u.id) === id; });
      if (!user) return;
      if (action === 'edit') openUserModal(user);
      else if (action === 'delete') confirmDeleteUser(user);
    });

    bindAction('ts-tbody', function (action, id) {
      var type = MOCK.situationTypes.find(function (t) { return t.id === id; });
      if (!type) return;
      if (action === 'edit') openTypeModal(type);
      else if (action === 'delete') confirmDeleteType(type);
    });

    bindAction('tma-tbody', function (action, id) {
      var type = MOCK.situationTypes.find(function (t) { return t.id === id; });
      if (!type) return;
      if (action === 'edit') openTypeModal(type);
      else if (action === 'delete') confirmDeleteType(type);
    });

    bindAction('ta-tbody', function (action, id) {
      if (action === 'edit') {
        window.location.href = 'constructor-anexe.html?id=' + encodeURIComponent(id);
        return;
      }
      var anexa = (MOCK.anexeTypes || []).find(function (a) { return a.id === id; });
      if (!anexa) return;
      if (action === 'duplicate') duplicateAnexa(anexa);
      else if (action === 'delete') confirmDeleteAnexa(anexa);
    });

    bindAction('tg-tbody', function (action, id) {
      var tag = tags.find(function (t) { return String(t.id) === id; });
      if (!tag) return;
      if (action === 'edit') openTagModal(tag);
      else if (action === 'delete') confirmDeleteTag(tag);
    });
  }

  function bindAction(tbodyId, handler) {
    var tbody = $(tbodyId);
    if (!tbody) return;
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      handler(btn.getAttribute('data-action'), btn.getAttribute('data-id'));
    });
  }

  /* =============================================================
     TAB 1 — Utilizatori interni
     ============================================================= */

  function renderUsers() {
    var tbody = $('ui-tbody');
    if (!tbody) return;
    var q = normalize(filters.userSearch);
    var list = users.filter(function (u) {
      if (q && normalize(u.name).indexOf(q) === -1 && normalize(u.email).indexOf(q) === -1) return false;
      if (filters.userTip && u.tip !== filters.userTip) return false;
      return true;
    });
    toggleEmpty('ui', list.length);
    tbody.innerHTML = list.map(function (u) {
      return '<tr>' +
        '<td><div class="admin-user-cell">' +
          '<span class="admin-user-cell__avatar">' + window.renderAvatar(u, 32) + '</span>' +
          '<span class="admin-user-cell__name">' + esc(u.name) + '</span>' +
        '</div></td>' +
        '<td>' + esc(u.email) + '</td>' +
        '<td>' + (u.tip === 'Angajat' ? esc(u.role) : '<span class="admin-table__muted">—</span>') + '</td>' +
        '<td>' + esc(u.tip) + '</td>' +
        '<td>' + statusPillHtml(u.status) + '</td>' +
        '<td><div class="admin-actions">' +
          actionBtnHtml('edit', u.id, 'edit', 'Editează utilizatorul', false) +
          actionBtnHtml('delete', u.id, 'delete', 'Dezactivează utilizatorul', true) +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function initUserModal() {
    userModal = createModal('modal-user');
    var addBtn = $('ui-add');
    if (addBtn) addBtn.addEventListener('click', function () { openUserModal(null); });
    var tipSelect = $('mu-tip');
    if (tipSelect) tipSelect.addEventListener('change', syncRolField);
    var saveBtn = $('mu-save');
    if (saveBtn) saveBtn.addEventListener('click', saveUser);
  }

  function syncRolField() {
    var field = $('mu-rol-field');
    if (field) field.hidden = $('mu-tip').value !== 'Angajat';
  }

  function openUserModal(user) {
    editingUserId = user ? user.id : null;
    clearErrors(userModal.el);
    var nume = '';
    var prenume = '';
    if (user) {
      /* Numele complet e stocat "Prenume Nume" — despărțire pe ultimul spațiu. */
      var full = String(user.name || '').trim();
      var idx = full.lastIndexOf(' ');
      if (idx === -1) { nume = full; }
      else { prenume = full.slice(0, idx); nume = full.slice(idx + 1); }
    }
    $('mu-nume').value = nume;
    $('mu-prenume').value = prenume;
    $('mu-email').value = user ? user.email : '';
    $('mu-username').value = user ? user.username : '';
    $('mu-tip').value = user ? user.tip : 'Angajat';
    $('mu-rol').value = (user && user.tip === 'Angajat' && user.role) ? user.role : 'Contabil';
    $('mu-status').value = user ? (user.status || 'activ') : 'activ';
    $('mu-valid-from').value = user ? (user.validFrom || '') : '';
    $('mu-valid-to').value = user ? (user.validTo || '') : '';
    syncRolField();
    userModal.open();
  }

  function saveUser() {
    var modal = userModal.el;
    var nume = $('mu-nume').value.trim();
    var prenume = $('mu-prenume').value.trim();
    var email = $('mu-email').value.trim();
    var username = $('mu-username').value.trim();
    var tip = $('mu-tip').value;
    var validFrom = $('mu-valid-from').value;
    var validTo = $('mu-valid-to').value;

    var ok = true;
    setErr(modal, 'nume', !nume, 'Introdu numele.');
    if (!nume) ok = false;
    setErr(modal, 'prenume', !prenume, 'Introdu prenumele.');
    if (!prenume) ok = false;
    var emailMsg = !email ? 'Introdu adresa de email.' : (!EMAIL_RE.test(email) ? 'Introdu o adresă de email validă.' : '');
    setErr(modal, 'email', !!emailMsg, emailMsg);
    if (emailMsg) ok = false;
    setErr(modal, 'username', !username, 'Introdu username-ul.');
    if (!username) ok = false;
    setErr(modal, 'tip', !tip, 'Selectează tipul utilizatorului.');
    if (!tip) ok = false;
    var rangeBad = !!(validFrom && validTo && validTo < validFrom);
    setErr(modal, 'validTo', rangeBad, 'Data „Până la” trebuie să fie după „Valabil de la”.');
    if (rangeBad) ok = false;
    if (!ok) return;

    var data = {
      name: (prenume + ' ' + nume).trim(),
      email: email,
      username: username,
      tip: tip,
      role: tip === 'Angajat' ? $('mu-rol').value : '',
      status: $('mu-status').value,
      validFrom: validFrom,
      validTo: validTo
    };

    if (editingUserId != null) {
      var existing = users.find(function (u) { return u.id === editingUserId; });
      if (existing) {
        Object.keys(data).forEach(function (k) { existing[k] = data[k]; });
      }
    } else {
      data.id = Date.now();
      data.avatarId = null;
      users.push(data);
    }

    userModal.close();
    renderUsers();
    toast('success', 'Utilizatorul a fost salvat.');
  }

  function confirmDeleteUser(user) {
    openConfirm({
      title: 'Dezactivare utilizator',
      body: user.name + ' va pierde accesul la platformă și nu se va mai putea autentifica. Situațiile în lucru rămân asignate echipei.',
      confirmLabel: 'Dezactivează',
      onConfirm: function () {
        user.status = 'inactiv';
        renderUsers();
        toast('success', 'Utilizatorul a fost dezactivat.');
      }
    });
  }

  /* =============================================================
     TAB 2 — Utilizatori externi (read-only)
     ============================================================= */

  function renderClients() {
    var tbody = $('ue-tbody');
    if (!tbody) return;
    var q = normalize(filters.clientSearch);
    var list = (MOCK.clients || []).filter(function (c) {
      if (!q) return true;
      return [c.companyName, c.contactName, c.cui, c.email, c.phone].some(function (v) {
        return normalize(v).indexOf(q) !== -1;
      });
    });
    toggleEmpty('ue', list.length);
    tbody.innerHTML = list.map(function (c) {
      return '<tr>' +
        '<td><div class="admin-user-cell">' +
          '<span class="admin-user-cell__avatar">' + window.renderAvatar(c, 32) + '</span>' +
          '<span class="admin-user-cell__name">' + esc(c.companyName) + '</span>' +
        '</div></td>' +
        '<td>' + esc(c.contactName) + '</td>' +
        '<td>' + esc(c.cui) + '</td>' +
        '<td>' + esc(c.phone) + '</td>' +
        '<td>' + esc(c.email) + '</td>' +
        '<td>' + esc(PERSON_TYPE_LABELS[c.personType] || c.personType) + '</td>' +
        '<td>' + statusPillHtml(c.status) + '</td>' +
      '</tr>';
    }).join('');
  }

  /* =============================================================
     TAB 3 — Tipuri de Situații Contabile
     ============================================================= */

  /* Regula numeralului „de” pentru zile — aceeași logică r%100 ca
     usageLabel: 1 → „zi”, 2–19 (și compușii terminați în 01–19) →
     „zile”, restul → „de zile”. */
  function daysUnit(n) {
    n = Number(n) || 0;
    if (n === 1) return 'zi';
    var r = n % 100;
    if (n === 0 || (r >= 1 && r <= 19)) return 'zile';
    return 'de zile';
  }

  /* Reutilizat pentru ambele tab-uri de tipuri. domain ∈ 'contabil' | 'audit';
     tipurile fără `domain` sunt tratate ca 'contabil' (zero migrare). */
  function renderTypes(domain) {
    domain = domain || 'contabil';
    var cfg = domain === 'audit'
      ? { prefix: 'tma', search: filters.auditSearch, status: filters.auditStatus, freq: filters.auditFreq }
      : { prefix: 'ts',  search: filters.typeSearch,  status: filters.typeStatus,  freq: filters.typeFreq };
    var tbody = $(cfg.prefix + '-tbody');
    if (!tbody) return;
    var q = normalize(cfg.search);
    var list = MOCK.situationTypes.filter(function (t) {
      if ((t.domain || 'contabil') !== domain) return false;
      if (q && normalize(t.name).indexOf(q) === -1) return false;
      if (cfg.status && (t.status || 'activ') !== cfg.status) return false;
      if (cfg.freq && t.frequency !== cfg.freq) return false;
      return true;
    });
    toggleEmpty(cfg.prefix, list.length);
    tbody.innerHTML = list.map(function (t) {
      var steps = t.steps || [];
      var stepsCell;
      if (steps.length) {
        var offs = steps.map(function (st) { return st.offsetDays; }).join('/');
        stepsCell = steps.length + (steps.length === 1 ? ' pas' : ' pași') + ' · ' +
          offs + ' ' + daysUnit(steps[steps.length - 1].offsetDays);
      } else {
        /* Înregistrare pre-Phase-10 din localStorage (doar offsets, fără
           steps) — fără migrare, se afișează „—”. Pentru un demo curat,
           golește harta 'scriptica.situationTypes' din localStorage. */
        stepsCell = '—';
      }
      return '<tr>' +
        '<td class="admin-table__name">' + esc(t.name) + '</td>' +
        '<td class="admin-table__desc" title="' + esc(t.description || '') + '">' + (t.description ? esc(t.description) : '<span class="admin-table__muted">—</span>') + '</td>' +
        '<td>' + esc(FREQUENCY_LABELS[t.frequency] || t.frequency) + '</td>' +
        '<td class="admin-table__muted">' + esc(stepsCell) + '</td>' +
        '<td>' + statusPillHtml(t.status) + '</td>' +
        '<td><div class="admin-actions">' +
          actionBtnHtml('edit', t.id, 'edit', 'Editează tipul', false) +
          actionBtnHtml('delete', t.id, 'delete', 'Șterge tipul', true) +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  /* ---------- Step builder (modalul de tip) ---------- */

  function emptyStep() {
    return { name: '', offsetDays: '', tasks: [], anexeIds: [] };
  }

  function initTypeModal() {
    typeModal = createModal('modal-type');
    var addBtn = $('ts-add');
    if (addBtn) addBtn.addEventListener('click', function () { openTypeModal(null, 'contabil'); });
    var addAuditBtn = $('tma-add');
    if (addAuditBtn) addAuditBtn.addEventListener('click', function () { openTypeModal(null, 'audit'); });
    var saveBtn = $('mt-save');
    if (saveBtn) saveBtn.addEventListener('click', saveType);

    var addStepBtn = $('mt-add-step');
    if (addStepBtn) {
      addStepBtn.addEventListener('click', function () {
        draftSteps.push(emptyStep());
        renderSteps();
        focusLast('[data-step-name]');
      });
    }

    /* Formule automate (sub-modal) */
    formulaModal = createModal('modal-formula');
    var addFormulaBtn = $('mt-add-formula');
    if (addFormulaBtn) addFormulaBtn.addEventListener('click', function () { openFormulaModal(-1); });
    var saveFormulaBtn = $('mf-save');
    if (saveFormulaBtn) saveFormulaBtn.addEventListener('click', saveFormula);
    var refsWrap = $('mf-refs');
    if (refsWrap) refsWrap.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-ref-token]');
      if (!chip) return;
      var inp = $('mf-expr');
      var tok = chip.getAttribute('data-ref-token');
      inp.value = (inp.value && !/\s$/.test(inp.value) && !/[(\s]$/.test(inp.value)) ? inp.value + ' ' + tok : inp.value + tok;
      inp.focus();
    });
    var formulasWrap = $('mt-formulas');
    if (formulasWrap) formulasWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button'); if (!btn) return;
      var fi = parseInt(btn.getAttribute('data-formula-idx'), 10);
      if (isNaN(fi)) return;
      if (btn.hasAttribute('data-edit-formula')) openFormulaModal(fi);
      else if (btn.hasAttribute('data-remove-formula')) { draftFormulas.splice(fi, 1); renderFormulas(); }
    });

    var stepsWrap = $('mt-steps');
    if (!stepsWrap) return;

    /* Inputurile scriu direct în draftSteps — re-randare doar la
       modificări structurale (adăugare/ștergere pas, task, anexă). */
    stepsWrap.addEventListener('input', function (e) {
      var el = e.target;
      var i = parseInt(el.getAttribute('data-idx'), 10);
      if (isNaN(i) || !draftSteps[i]) return;
      if (el.hasAttribute('data-step-name')) {
        draftSteps[i].name = el.value;
      } else if (el.hasAttribute('data-step-days')) {
        draftSteps[i].offsetDays = el.value;
      } else if (el.hasAttribute('data-task-input')) {
        var j = parseInt(el.getAttribute('data-task'), 10);
        if (!isNaN(j) && j >= 0 && j < draftSteps[i].tasks.length) draftSteps[i].tasks[j] = el.value;
      }
    });

    stepsWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var i = parseInt(btn.getAttribute('data-idx'), 10);
      if (isNaN(i) || !draftSteps[i]) return;

      if (btn.hasAttribute('data-remove-step')) {
        if (draftSteps.length <= 1) return;
        draftSteps.splice(i, 1);
        renderSteps();
      } else if (btn.hasAttribute('data-add-task')) {
        draftSteps[i].tasks.push('');
        renderSteps();
        var inputs = stepsWrap.querySelectorAll('[data-task-input][data-idx="' + i + '"]');
        if (inputs.length) inputs[inputs.length - 1].focus();
      } else if (btn.hasAttribute('data-remove-task')) {
        var j = parseInt(btn.getAttribute('data-task'), 10);
        if (!isNaN(j) && j >= 0 && j < draftSteps[i].tasks.length) {
          draftSteps[i].tasks.splice(j, 1);
          renderSteps();
        }
      } else if (btn.hasAttribute('data-attach-anexa')) {
        var card = btn.closest('.admin-step-card');
        var sel = card ? card.querySelector('[data-anexa-select]') : null;
        var val = sel ? sel.value : '';
        if (!val) return;
        if (draftSteps[i].anexeIds.indexOf(val) === -1) draftSteps[i].anexeIds.push(val);
        renderSteps();
      } else if (btn.hasAttribute('data-remove-anexa')) {
        var aid = btn.getAttribute('data-anexa');
        var pos = draftSteps[i].anexeIds.indexOf(aid);
        if (pos !== -1) {
          draftSteps[i].anexeIds.splice(pos, 1);
          renderSteps();
        }
      }
    });
  }

  function focusLast(selector) {
    var stepsWrap = $('mt-steps');
    if (!stepsWrap) return;
    var all = stepsWrap.querySelectorAll(selector);
    if (all.length) all[all.length - 1].focus();
  }

  function anexaById(id) {
    return (MOCK.anexeTypes || []).find(function (a) { return a.id === id; });
  }

  /* ============================================================
     FORMULE AUTOMATE — builder la nivel de tip (Part B)
     Filtru categorii pe picker + secțiunea de formule + validare/ciclu.
     ============================================================ */

  /* Anexa e potrivită domeniului curent? Fără categorii = disponibilă peste tot. */
  function anexaInDomain(anexa, domain) {
    var cats = anexa.categories;
    if (!cats || !cats.length) return true;
    if (domain === 'audit') return cats.indexOf('audit') !== -1;
    return cats.some(function (c) { return c !== 'audit'; });
  }

  /* Câmpurile numerice (cu ref) ale anexelor atașate pașilor — referențiabile. */
  function attachedNumericRefs() {
    var ids = {};
    draftSteps.forEach(function (st) { (st.anexeIds || []).forEach(function (id) { ids[id] = true; }); });
    var out = [];
    Object.keys(ids).forEach(function (aid) {
      var anexa = anexaById(aid); if (!anexa) return;
      ((anexa.schema && anexa.schema.fields) || []).forEach(function (f) {
        if (!f.ref) return;
        if (['number', 'currency', 'percent'].indexOf(f.type) === -1) return;
        out.push({ token: aid + '.' + f.ref, anexaId: aid, anexaName: anexa.name, ref: f.ref, label: f.label || f.ref, type: f.type });
      });
    });
    return out;
  }
  function refByToken(token) {
    return attachedNumericRefs().find(function (r) { return r.token === token; }) || null;
  }

  /* Tokenizer minimal (doar pentru extragerea ref-urilor + detecția ciclurilor). */
  function fxTokens(expr) {
    var s = String(expr == null ? '' : expr), out = [], i = 0;
    while (i < s.length) {
      var ch = s.charAt(i);
      if (ch === ' ' || ch === '\t') { i++; continue; }
      if ('+-*/()'.indexOf(ch) !== -1) { out.push({ t: 'op', v: ch }); i++; continue; }
      if ((ch >= '0' && ch <= '9') || ch === '.') { var n = ''; while (i < s.length && ((s.charAt(i) >= '0' && s.charAt(i) <= '9') || s.charAt(i) === '.')) { n += s.charAt(i); i++; } out.push({ t: 'num', v: n }); continue; }
      if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') { var id = ''; while (i < s.length) { var c = s.charAt(i); if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '_' || c === '.') { id += c; i++; } else break; } out.push({ t: 'ref', v: id }); continue; }
      return { error: 'Caracter neacceptat: ' + ch };
    }
    return { tokens: out };
  }
  function exprRefs(expr) {
    var tk = fxTokens(expr);
    if (tk.error) return [];
    return tk.tokens.filter(function (t) { return t.t === 'ref'; }).map(function (t) { return t.v; });
  }
  /* Detecție cicluri pe lista de formule. Returnează string-ul ciclului sau null. */
  function detectFormulaCycle(formulas) {
    var deps = {};
    formulas.forEach(function (f) { deps[f.resultRef] = (deps[f.resultRef] || []).concat(exprRefs(f.expr)); });
    var color = {}, cyclePath = null;
    function dfs(node, stack) {
      color[node] = 1; stack.push(node);
      var nbrs = deps[node] || [];
      for (var i = 0; i < nbrs.length; i++) {
        var n = nbrs[i];
        if (!(n in deps)) continue;
        if (color[n] === 1) { cyclePath = stack.slice(stack.indexOf(n)).concat(n); return true; }
        if (color[n] !== 2 && dfs(n, stack)) return true;
      }
      stack.pop(); color[node] = 2; return false;
    }
    var keys = Object.keys(deps);
    for (var i = 0; i < keys.length; i++) { if (color[keys[i]] !== 2) { if (dfs(keys[i], [])) return cyclePath.join(' → '); } }
    return null;
  }

  function renderFormulas() {
    var wrap = $('mt-formulas');
    var section = $('mt-formule-field');
    if (!wrap || !section) return;
    var refs = attachedNumericRefs();
    /* Secțiunea apare doar dacă există câmpuri numerice referențiabile. */
    section.hidden = (refs.length === 0);
    if (refs.length === 0) { wrap.innerHTML = ''; return; }
    if (!draftFormulas.length) {
      wrap.innerHTML = '<div class="admin-formulas__empty">Nicio formulă definită. Adaugă una pentru a calcula automat un câmp numeric din altele.</div>';
      return;
    }
    wrap.innerHTML = draftFormulas.map(function (f, i) {
      var resName = refByToken(f.resultRef);
      var invalid = !resName || exprRefs(f.expr).some(function (r) { return !refByToken(r); });
      var resLabel = resName ? (resName.anexaName + ' · ' + resName.label) : f.resultRef;
      return '<div class="admin-formula-row' + (invalid ? ' is-invalid' : '') + '">' +
        '<div class="admin-formula-row__main">' +
          '<div class="admin-formula-row__result"><span class="material-symbols-outlined" aria-hidden="true">function</span>' + esc(resLabel) + '</div>' +
          '<div class="admin-formula-row__expr"><code>' + esc(f.expr) + '</code></div>' +
          (invalid ? '<div class="admin-formula-row__warn">Referință inexistentă — verifică anexele atașate.</div>' : '') +
        '</div>' +
        '<div class="admin-formula-row__actions">' +
          '<button type="button" class="admin-action-btn" data-edit-formula data-formula-idx="' + i + '" aria-label="Editează formula" title="Editează"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>' +
          '<button type="button" class="admin-action-btn admin-action-btn--delete" data-remove-formula data-formula-idx="' + i + '" aria-label="Șterge formula" title="Șterge"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function openFormulaModal(idx) {
    editingFormulaIdx = idx;
    var refs = attachedNumericRefs();
    var existing = (idx >= 0) ? draftFormulas[idx] : null;
    clearErrors(formulaModal.el);
    $('mf-title').textContent = existing ? 'Editează formula' : 'Formulă automată';
    var resSel = $('mf-result');
    resSel.innerHTML = '<option value="">Selectează câmpul-rezultat...</option>' +
      refs.map(function (r) {
        return '<option value="' + esc(r.token) + '"' + (existing && existing.resultRef === r.token ? ' selected' : '') + '>' +
          esc(r.anexaName + ' · ' + r.label + ' (' + r.ref + ')') + '</option>';
      }).join('');
    $('mf-expr').value = existing ? existing.expr : '';
    $('mf-refs').innerHTML = refs.map(function (r) {
      return '<button type="button" class="admin-formula-ref" data-ref-token="' + esc(r.token) + '" title="' + esc(r.anexaName + ' · ' + r.label) + '">' +
        '<code>' + esc(r.token) + '</code><span>' + esc(r.label) + '</span></button>';
    }).join('');
    formulaModal.open();
  }

  function saveFormula() {
    var modal = formulaModal.el;
    var resultRef = $('mf-result').value;
    var expr = $('mf-expr').value.trim();
    clearErrors(modal);
    var ok = true;
    setErr(modal, 'mf-result', !resultRef, 'Alege câmpul-rezultat.');
    if (!resultRef) ok = false;
    setErr(modal, 'mf-expr', !expr, 'Introdu expresia de calcul.');
    if (!expr) ok = false;
    if (!ok) return;

    /* Toate ref-urile din expresie există și sunt numerice. */
    var tk = fxTokens(expr);
    if (tk.error) { setErr(modal, 'mf-expr', true, tk.error); return; }
    var refsInExpr = exprRefs(expr);
    if (!refsInExpr.length) { setErr(modal, 'mf-expr', true, 'Expresia trebuie să folosească cel puțin un câmp.'); return; }
    var unknown = refsInExpr.filter(function (r) { return !refByToken(r); });
    if (unknown.length) { setErr(modal, 'mf-expr', true, 'Referință necunoscută: ' + unknown[0]); return; }
    if (refsInExpr.indexOf(resultRef) !== -1) { setErr(modal, 'mf-expr', true, 'Câmpul-rezultat nu se poate referi pe sine.'); return; }

    var resultType = (refByToken(resultRef) || {}).type === 'number' ? 'decimal' : 'decimal';
    var entry = { resultRef: resultRef, expr: expr, resultType: resultType, allowManualOverride: true };

    /* Verifică ciclurile pe setul rezultat. */
    var candidate = draftFormulas.slice();
    if (editingFormulaIdx >= 0) candidate[editingFormulaIdx] = entry; else candidate.push(entry);
    var cycle = detectFormulaCycle(candidate);
    if (cycle) { setErr(modal, 'mf-expr', true, 'Formula creează un ciclu: ' + cycle); return; }
    /* Un singur rezultat per câmp. */
    var dup = candidate.filter(function (f, k) { return f.resultRef === resultRef && k !== (editingFormulaIdx >= 0 ? editingFormulaIdx : candidate.length - 1); });
    if (dup.length) { setErr(modal, 'mf-result', true, 'Există deja o formulă pentru acest câmp-rezultat.'); return; }

    draftFormulas = candidate;
    formulaModal.close();
    renderFormulas();
    toast('success', 'Formula a fost salvată.');
  }

  function renderSteps() {
    var wrap = $('mt-steps');
    if (!wrap) return;
    /* Selecțiile de anexă încă neatașate supraviețuiesc re-randărilor
       structurale (adăugare task/pas etc.) — altfel s-ar pierde silențios. */
    var pendingSel = {};
    wrap.querySelectorAll('[data-anexa-select]').forEach(function (sel) {
      if (sel.value) pendingSel[sel.getAttribute('data-idx')] = sel.value;
    });
    wrap.innerHTML = draftSteps.map(function (st, i) { return stepCardHtml(st, i); }).join('');
    wrap.querySelectorAll('[data-anexa-select]').forEach(function (sel) {
      var want = pendingSel[sel.getAttribute('data-idx')];
      if (!want) return;
      for (var k = 0; k < sel.options.length; k++) {
        if (sel.options[k].value === want) { sel.value = want; break; }
      }
    });
    /* Anexele atașate s-au putut schimba → re-randează secțiunea de formule. */
    renderFormulas();
  }

  function stepCardHtml(st, i) {
    var canRemove = draftSteps.length > 1;

    var tasksHtml = st.tasks.map(function (t, j) {
      return '<div class="admin-task-row">' +
        '<input type="text" class="input" value="' + esc(t) + '" placeholder="Descrie task-ul..."' +
          ' data-task-input data-idx="' + i + '" data-task="' + j + '" aria-label="Task ' + (j + 1) + '" autocomplete="off">' +
        '<button type="button" class="admin-action-btn admin-action-btn--delete" data-remove-task data-idx="' + i + '" data-task="' + j + '"' +
          ' aria-label="Șterge task-ul" title="Șterge task-ul">' +
          '<span class="material-symbols-outlined" aria-hidden="true">delete</span>' +
        '</button>' +
      '</div>';
    }).join('');

    var chipsHtml = st.anexeIds.map(function (id) {
      var anexa = anexaById(id);
      var label = anexa ? anexa.name : id;
      return '<span class="pill admin-anexa-chip">' + esc(label) +
        '<button type="button" class="admin-anexa-chip__remove" data-remove-anexa data-idx="' + i + '" data-anexa="' + esc(id) + '"' +
          ' aria-label="Elimină anexa" title="Elimină anexa">' +
          '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
        '</button>' +
      '</span>';
    }).join('');

    var available = (MOCK.anexeTypes || []).filter(function (a) {
      return (a.status || 'activ') === 'activ' && st.anexeIds.indexOf(a.id) === -1 && anexaInDomain(a, editingTypeDomain);
    });
    var selectHtml = '<select class="select" data-anexa-select data-idx="' + i + '" aria-label="Alege anexa"' +
      (available.length ? '' : ' disabled') + '>' +
      (available.length
        ? '<option value="">Selectează anexa...</option>' + available.map(function (a) {
            return '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>';
          }).join('')
        : '<option value="">Nicio anexă disponibilă</option>') +
    '</select>';

    return '<div class="admin-step-card">' +
      '<div class="admin-step-card__head">' +
        '<span class="admin-step-card__num">Pas ' + (i + 1) + '</span>' +
        (canRemove
          ? '<button type="button" class="admin-action-btn admin-action-btn--delete" data-remove-step data-idx="' + i + '"' +
              ' aria-label="Șterge pasul" title="Șterge pasul">' +
              '<span class="material-symbols-outlined" aria-hidden="true">delete</span>' +
            '</button>'
          : '') +
      '</div>' +
      '<div class="admin-step-card__row">' +
        '<div class="form-field" data-field="step-name-' + i + '">' +
          '<label class="form-label" for="mt-step-name-' + i + '">Nume pas*</label>' +
          '<input id="mt-step-name-' + i + '" type="text" class="input" value="' + esc(st.name) + '"' +
            ' placeholder="ex. Recepție documente" data-step-name data-idx="' + i + '" autocomplete="off">' +
          '<span class="form-error" role="alert"></span>' +
        '</div>' +
        '<div class="form-field" data-field="step-days-' + i + '">' +
          '<label class="form-label" for="mt-step-days-' + i + '">Termen (zile de la început)*</label>' +
          '<input id="mt-step-days-' + i + '" type="number" class="input" min="1" step="1" value="' + esc(st.offsetDays) + '"' +
            ' data-step-days data-idx="' + i + '">' +
          '<span class="form-error" role="alert"></span>' +
        '</div>' +
      '</div>' +
      '<div class="admin-step-card__sub">' +
        '<span class="form-label">Task-uri</span>' +
        (tasksHtml ? '<div class="admin-task-list">' + tasksHtml + '</div>' : '') +
        '<button type="button" class="admin-add-btn" data-add-task data-idx="' + i + '">' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span> Adaugă task' +
        '</button>' +
      '</div>' +
      '<div class="admin-step-card__sub">' +
        '<span class="form-label">Anexe</span>' +
        (chipsHtml ? '<div class="admin-anexa-chips">' + chipsHtml + '</div>' : '') +
        '<div class="admin-anexa-picker">' + selectHtml +
          '<button type="button" class="btn btn--secondary" data-attach-anexa data-idx="' + i + '"' +
            (available.length ? '' : ' disabled') + '>Atașează</button>' +
        '</div>' +
        '<span class="admin-step-card__hint">Anexele se creează în tab-ul Tipuri de Anexe.</span>' +
      '</div>' +
    '</div>';
  }

  /* Opțiunile dropdown-ului de periodicitate, populate per domeniu. */
  function populateFreqOptions(domain) {
    var sel = $('mt-frecventa');
    if (!sel) return;
    var dl = DOMAIN_LABELS[domain] || DOMAIN_LABELS.contabil;
    var opts = FREQUENCY_OPTIONS[domain] || FREQUENCY_OPTIONS.contabil;
    sel.innerHTML = '<option value="">' + esc(dl.freqPlaceholder) + '</option>' +
      opts.map(function (o) {
        return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>';
      }).join('');
  }

  function openTypeModal(type, domain) {
    editingTypeId = type ? type.id : null;
    editingTypeDomain = type ? (type.domain || 'contabil') : (domain || 'contabil');
    var dl = DOMAIN_LABELS[editingTypeDomain] || DOMAIN_LABELS.contabil;
    clearErrors(typeModal.el);

    /* Același modal, etichete condiționate pe domeniu (titlu + câmp periodicitate). */
    var titleEl = $('mt-title');
    if (titleEl) titleEl.textContent = dl.modalTitle;
    var freqLabelEl = $('mt-frecventa-label');
    if (freqLabelEl) freqLabelEl.textContent = dl.freqLabel;
    populateFreqOptions(editingTypeDomain);

    $('mt-nume').value = type ? type.name : '';
    $('mt-descriere').value = type ? (type.description || '') : '';
    /* Tip nou de audit → „Anual" implicit; tip contabil nou rămâne gol (placeholder). */
    $('mt-frecventa').value = type ? type.frequency : (editingTypeDomain === 'audit' ? 'anual' : '');
    $('mt-status').value = type ? (type.status || 'activ') : 'activ';

    if (type && type.steps && type.steps.length) {
      var pruned = 0;
      draftSteps = type.steps.map(function (st) {
        return {
          name: st.name || '',
          offsetDays: (st.offsetDays === undefined || st.offsetDays === null) ? '' : st.offsetDays,
          tasks: (st.tasks || []).slice(),
          /* Anexele șterse între timp nu se mai afișează și nu se re-salvează. */
          anexeIds: (st.anexeIds || []).filter(function (id) {
            if (anexaById(id)) return true;
            pruned++;
            return false;
          })
        };
      });
      /* Curățarea e invizibilă altfel — semnalăm eliminarea înainte de salvare. */
      if (pruned > 0) {
        toast('info', pruned === 1
          ? 'O anexă ștearsă a fost eliminată din pașii acestui tip.'
          : 'Anexele șterse au fost eliminate din pașii acestui tip.');
      }
    } else {
      draftSteps = [emptyStep()];
    }
    draftFormulas = (type && Array.isArray(type.formulas)) ? JSON.parse(JSON.stringify(type.formulas)) : [];
    renderSteps();
    typeModal.open();
  }

  function saveType() {
    var modal = typeModal.el;
    var nume = $('mt-nume').value.trim();
    var freq = $('mt-frecventa').value;

    var dl = DOMAIN_LABELS[editingTypeDomain] || DOMAIN_LABELS.contabil;
    var ok = true;
    setErr(modal, 'nume', !nume, 'Introdu numele tipului.');
    if (!nume) ok = false;
    setErr(modal, 'frecventa', !freq, dl.freqError);
    if (!freq) ok = false;

    if (!draftSteps.length) {
      /* UI-ul impune minim un pas; gardă defensivă. */
      draftSteps = [emptyStep()];
      renderSteps();
      ok = false;
    }

    var prevDays = 0;
    draftSteps.forEach(function (st, i) {
      var stepName = String(st.name || '').trim();
      setErr(modal, 'step-name-' + i, !stepName, 'Introdu numele pasului.');
      if (!stepName) ok = false;

      /* Number() + Number.isInteger resping intrările zecimale („10.5")
         pe care parseInt le-ar trunchia silențios la salvare. */
      var rawDays = String(st.offsetDays == null ? '' : st.offsetDays).trim();
      var days = Number(rawDays);
      var daysErr = '';
      if (rawDays === '' || !isFinite(days) || days <= 0) daysErr = 'Introdu un număr de zile mai mare decât 0.';
      else if (!Number.isInteger(days)) daysErr = 'Introdu un număr întreg de zile.';
      else if (i > 0 && prevDays > 0 && days <= prevDays) daysErr = 'Termenul trebuie să fie mai mare decât cel al pasului anterior.';
      setErr(modal, 'step-days-' + i, !!daysErr, daysErr);
      if (daysErr) ok = false;
      if (Number.isInteger(days) && days > 0) prevDays = days;
    });

    if (!ok) {
      var firstErr = modal.querySelector('.form-field.has-error');
      if (firstErr) firstErr.scrollIntoView({ block: 'nearest' });
      return;
    }

    var record = {
      id: editingTypeId || uniqueTypeId(nume),
      name: nume,
      domain: editingTypeDomain,
      description: $('mt-descriere').value.trim(),
      frequency: freq,
      status: $('mt-status').value,
      steps: draftSteps.map(function (st) {
        return {
          name: String(st.name).trim(),
          offsetDays: parseInt(st.offsetDays, 10),
          tasks: st.tasks.map(function (t) { return String(t).trim(); }).filter(function (t) { return !!t; }),
          anexeIds: st.anexeIds.slice()
        };
      })
    };

    /* Formulele automate — păstrate doar cele valide (ref-uri încă atașate). */
    var validFormulas = draftFormulas.filter(function (f) {
      if (!refByToken(f.resultRef)) return false;
      return exprRefs(f.expr).every(function (r) { return !!refByToken(r); });
    });
    if (validFormulas.length) record.formulas = validFormulas;

    var idx = MOCK.situationTypes.findIndex(function (t) { return t.id === record.id; });
    if (idx !== -1) MOCK.situationTypes[idx] = record;
    else MOCK.situationTypes.push(record);
    writeMapEntry(TYPES_KEY, record.id, record);

    typeModal.close();
    renderTypes(editingTypeDomain);
    toast('success', dl.saveToast);
  }

  function uniqueTypeId(name) {
    var base = normalize(name).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'tip_situatie';
    var id = base;
    var i = 2;
    while (MOCK.situationTypes.some(function (t) { return t.id === id; })) {
      id = base + '_' + i;
      i++;
    }
    return id;
  }

  function confirmDeleteType(type) {
    var used = (MOCK.situations || []).some(function (s) { return s.typeId === type.id; });
    if (used) {
      toast('error', 'Tipul este folosit de situații existente și nu poate fi șters.');
      return;
    }
    openConfirm({
      title: 'Ștergere tip de situație',
      body: '„' + type.name + '” va fi eliminat din lista de tipuri disponibile la crearea unei situații noi.',
      confirmLabel: 'Șterge',
      onConfirm: function () {
        var idx = MOCK.situationTypes.indexOf(type);
        if (idx !== -1) MOCK.situationTypes.splice(idx, 1);
        writeMapEntry(TYPES_KEY, type.id, { id: type.id, deleted: true });
        renderTypes(type.domain || 'contabil');
        toast('success', 'Tipul de situație a fost șters.');
      }
    });
  }

  /* =============================================================
     TAB 5 — Tipuri de anexe (șabloane independente; persistate
     în harta localStorage 'scriptica.anexe', citite din MOCK)
     ============================================================= */

  /* Numele tipurilor de situații care au anexa atașată pe vreun pas. */
  function anexaUsedBy(anexaId) {
    var names = [];
    (MOCK.situationTypes || []).forEach(function (t) {
      var used = (t.steps || []).some(function (st) {
        return (st.anexeIds || []).indexOf(anexaId) !== -1;
      });
      if (used) names.push(t.name);
    });
    return names;
  }

  function renderAnexe() {
    var tbody = $('ta-tbody');
    if (!tbody) return;
    var all = MOCK.anexeTypes || [];
    var q = normalize(filters.anexaSearch);
    var list = all.filter(function (a) {
      if (q && normalize(a.name).indexOf(q) === -1) return false;
      if (filters.anexaStatus && (a.status || 'activ') !== filters.anexaStatus) return false;
      return true;
    });

    var emptyMsg = $('ta-empty-msg');
    if (emptyMsg) {
      emptyMsg.textContent = all.length
        ? 'Nicio anexă nu corespunde filtrelor selectate.'
        : 'Nicio anexă definită. Apasă „Adaugă” pentru a crea prima anexă.';
    }

    toggleEmpty('ta', list.length);
    tbody.innerHTML = list.map(function (a) {
      var fieldsCount = (a.schema && a.schema.fields) ? a.schema.fields.length : 0;
      var usedIn = anexaUsedBy(a.id);
      return '<tr>' +
        '<td class="admin-table__name">' + esc(a.name) + '</td>' +
        '<td class="admin-table__muted">' + fieldsCount + '</td>' +
        '<td>' + (usedIn.length ? esc(usedIn.join(', ')) : '<span class="admin-table__muted">—</span>') + '</td>' +
        '<td>' + formatDateFull(a.updatedAt) + '</td>' +
        '<td>' + statusPillHtml(a.status) + '</td>' +
        '<td><div class="admin-actions">' +
          actionBtnHtml('edit', a.id, 'edit', 'Editează în constructor', false) +
          actionBtnHtml('duplicate', a.id, 'content_copy', 'Duplică anexa', false) +
          actionBtnHtml('delete', a.id, 'delete', 'Șterge anexa', true) +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function duplicateAnexa(anexa) {
    var clone = JSON.parse(JSON.stringify(anexa));
    clone.id = 'anx_' + Date.now();
    clone.name = anexa.name + ' (copie)';
    clone.updatedAt = TODAY_ISO;
    delete clone.deleted;
    /* Proprietăți din modelul vechi, dacă au rămas în localStorage. */
    delete clone.situationTypeId;
    delete clone.step;
    MOCK.anexeTypes.push(clone);
    writeMapEntry(ANEXE_KEY, clone.id, clone);
    renderAnexe();
    toast('success', 'Anexa a fost duplicată.');
  }

  function confirmDeleteAnexa(anexa) {
    if (anexaUsedBy(anexa.id).length) {
      toast('error', 'Anexa este folosită de tipuri de situații și nu poate fi ștearsă.');
      return;
    }
    openConfirm({
      title: 'Ștergere anexă',
      body: '„' + anexa.name + '” nu va mai putea fi atașată pașilor tipurilor de situații. Formularele deja completate rămân în arhivă.',
      confirmLabel: 'Șterge',
      onConfirm: function () {
        var idx = MOCK.anexeTypes.indexOf(anexa);
        if (idx !== -1) MOCK.anexeTypes.splice(idx, 1);
        writeMapEntry(ANEXE_KEY, anexa.id, { id: anexa.id, deleted: true });
        renderAnexe();
        toast('success', 'Anexa a fost ștearsă.');
      }
    });
  }

  function initAnexaModal() {
    anexaModal = createModal('modal-anexa');
    var addBtn = $('ta-add');
    if (addBtn) addBtn.addEventListener('click', openAnexaModal);
    var saveBtn = $('ma-save');
    if (saveBtn) saveBtn.addEventListener('click', saveAnexa);
  }

  function openAnexaModal() {
    clearErrors(anexaModal.el);
    $('ma-nume').value = '';
    anexaModal.open();
  }

  function saveAnexa() {
    var modal = anexaModal.el;
    var nume = $('ma-nume').value.trim();
    setErr(modal, 'nume', !nume, 'Introdu numele anexei.');
    if (!nume) return;
    window.location.href = 'constructor-anexe.html?new=1&name=' + encodeURIComponent(nume);
  }

  /* =============================================================
     TAB 6 — Taguri
     ============================================================= */

  /* Regula numeralului „de”: de la 20 în sus se folosește „de”,
     cu excepția compușilor terminați în 01–19 (ex. 101 situații). */
  function usageLabel(n) {
    n = n || 0;
    if (n === 1) return '1 situație';
    var r = n % 100;
    if (n === 0 || (r >= 1 && r <= 19)) return n + ' situații';
    return n + ' de situații';
  }

  function renderTags() {
    var tbody = $('tg-tbody');
    if (!tbody) return;
    var q = normalize(filters.tagSearch);
    var list = tags.filter(function (t) {
      return !q || normalize(t.name).indexOf(q) !== -1;
    });
    toggleEmpty('tg', list.length);
    tbody.innerHTML = list.map(function (t) {
      return '<tr>' +
        '<td><span class="pill pill--neutral">' + esc(t.name) + '</span></td>' +
        '<td class="admin-table__muted">' + usageLabel(t.usageCount) + '</td>' +
        '<td><div class="admin-actions">' +
          actionBtnHtml('edit', t.id, 'edit', 'Editează tagul', false) +
          actionBtnHtml('delete', t.id, 'delete', 'Șterge tagul', true) +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function initTagModal() {
    tagModal = createModal('modal-tag');
    var addBtn = $('tg-add');
    if (addBtn) addBtn.addEventListener('click', function () { openTagModal(null); });
    var saveBtn = $('mtag-save');
    if (saveBtn) saveBtn.addEventListener('click', saveTag);
  }

  function openTagModal(tag) {
    editingTagId = tag ? tag.id : null;
    clearErrors(tagModal.el);
    $('mtag-title').textContent = tag ? 'Editare tag' : 'Tag nou';
    $('mtag-nume').value = tag ? tag.name : '';
    tagModal.open();
  }

  function saveTag() {
    var modal = tagModal.el;
    var nume = $('mtag-nume').value.trim();
    setErr(modal, 'nume', !nume, 'Introdu denumirea tagului.');
    if (!nume) return;

    if (editingTagId != null) {
      var tag = tags.find(function (t) { return t.id === editingTagId; });
      if (tag) tag.name = nume;
    } else {
      var nextId = tags.reduce(function (m, t) { return Math.max(m, t.id); }, 0) + 1;
      tags.push({ id: nextId, name: nume, usageCount: 0 });
    }

    tagModal.close();
    renderTags();
    toast('success', 'Tagul a fost salvat.');
  }

  function confirmDeleteTag(tag) {
    openConfirm({
      title: 'Ștergere tag',
      body: 'Tagul „' + tag.name + '” va fi eliminat de pe toate situațiile pe care este aplicat.',
      confirmLabel: 'Șterge',
      onConfirm: function () {
        var idx = tags.indexOf(tag);
        if (idx !== -1) tags.splice(idx, 1);
        renderTags();
        toast('success', 'Tagul a fost șters.');
      }
    });
  }

  /* =============================================================
     Infrastructură modal (pattern din dashboard.js)
     ============================================================= */

  function createModal(id) {
    var modal = $(id);
    if (!modal) return null;

    function open() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () {
        var first = modal.querySelector('.modal__body input, .modal__body select, .modal__body textarea');
        if (first) { first.focus(); return; }
        var btn = modal.querySelector('.modal__footer .btn--critical, .modal__footer .btn--primary');
        if (btn) btn.focus();
      }, 0);
    }

    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    modal.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });
    /* Enter într-un input nu trimite formularul (ar reîncărca pagina). */
    modal.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); });
    });

    return { el: modal, open: open, close: close };
  }

  function bindGlobalModalKeys() {
    document.addEventListener('keydown', function (e) {
      var open = document.querySelector('.modal.is-open');
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        open.classList.remove('is-open');
        open.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      } else if (e.key === 'Tab') {
        trapFocus(e, open.querySelector('.modal__dialog'));
      }
    });
  }

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

  function setErr(modal, name, hasError, msg) {
    var field = modal.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle('has-error', hasError);
    var errorEl = field.querySelector('.form-error');
    if (errorEl && hasError && msg) errorEl.textContent = msg;
  }

  function clearErrors(modal) {
    modal.querySelectorAll('.form-field.has-error').forEach(function (f) {
      f.classList.remove('has-error');
    });
  }

  /* ---------- Modal de confirmare generic ---------- */

  function initConfirmModal() {
    confirmModal = createModal('modal-confirm');
    var btn = $('mc-confirm');
    if (btn) {
      btn.addEventListener('click', function () {
        var cb = confirmAction;
        confirmAction = null;
        confirmModal.close();
        if (cb) cb();
      });
    }
  }

  function openConfirm(opts) {
    $('mc-title').textContent = opts.title;
    $('mc-body').textContent = opts.body;
    $('mc-confirm').textContent = opts.confirmLabel || 'Confirmă';
    confirmAction = opts.onConfirm || null;
    confirmModal.open();
  }

})();
