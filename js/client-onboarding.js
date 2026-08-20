/* ============================================================
   Scriptica — Onboarding client extern
   Administrare → Utilizatori externi, fără efect în alte pagini.

   Profilul bogat este păstrat separat în localStorage:
   scriptica.externalClients = { id → înregistrare completă }.
   Nu modifică SCRIPTICA_MOCK și nu propagă date în celelalte ecrane;
   acest lucru păstrează intervenția strict în suprafața cerută.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var STORAGE_KEY = 'scriptica.externalClients';
  var TODAY_ISO = '2026-04-20';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^\+?[0-9\s().-]{7,}$/;

  var PERSON_TYPE_LABELS = {
    pj: 'Persoană juridică',
    pfa: 'PFA',
    pf: 'Persoană fizică',
    institutie: 'Instituție publică'
  };

  var SOURCE_META = {
    scriptica: { icon: 'forum', label: 'Scriptica' },
    email: { icon: 'mail', label: 'E-mail' },
    whatsapp: { icon: 'chat', label: 'WhatsApp' }
  };

  var PERMISSION_LABELS = {
    view: 'Vede fluxurile',
    chat: 'Scrie în conversații',
    upload: 'Trimite documente',
    anexe: 'Completează anexe'
  };

  var clients = [];
  var serviceCatalog = [];
  var draft = null;
  var editingId = null;
  var currentStep = 1;
  var idSeq = 0;
  var lastTrigger = null;

  var modal;
  var form;
  var tbody;
  var searchInput;

  function externalParty() {
    return typeof window.scripticaEffectiveExternalParty === 'function'
      ? window.scripticaEffectiveExternalParty()
      : { singular: 'Client', plural: 'Clienți' };
  }

  function beneficiarySchema() {
    return typeof window.scripticaEffectiveBeneficiaryProfileSchema === 'function'
      ? window.scripticaEffectiveBeneficiaryProfileSchema()
      : { version: 1, fields: [] };
  }

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (!MOCK || !document.getElementById('panel-utilizatori-externi')) return;
    if (typeof window.getCurrentView === 'function' && window.getCurrentView() === 'superadmin') return;

    modal = document.getElementById('modal-client-onboarding');
    form = document.getElementById('co-form');
    tbody = document.getElementById('ue-tbody');
    searchInput = document.getElementById('ue-search');
    if (!modal || !form || !tbody || !searchInput) return;

    applyTerminology();
    serviceCatalog = buildServiceCatalog();
    buildClients();
    bindPage();
    bindModal();
    renderClients();

    /* administrare.js randează primul la schimbarea tabului; refacem după el. */
    window.addEventListener('hashchange', function () {
      if (window.location.hash === '#utilizatori-externi') {
        setTimeout(renderClients, 0);
      }
    });
  }

  function applyTerminology() {
    var party = externalParty();
    var add = document.getElementById('ue-add');
    var panel = document.getElementById('panel-utilizatori-externi');
    var title = document.getElementById('co-step-1-title');
    var typeLabel = document.querySelector('label[for="co-person-type"]');
    var modalSubtitle = modal.querySelector('.modal__subtitle');
    var activate = document.getElementById('co-activate');
    if (add) add.innerHTML = party.singular + ' nou<span class="material-symbols-outlined" aria-hidden="true">person_add</span>';
    if (panel) {
      var helper = panel.querySelector('.admin-helper');
      var firstHeader = panel.querySelector('thead th');
      var empty = panel.querySelector('#ue-empty p');
      if (helper) helper.textContent = 'Configurează identitatea pentru ' + party.singular.toLowerCase() + ', persoanele de contact, accesul în Scriptica și sursele autorizate pentru documente.';
      if (firstHeader) firstHeader.textContent = party.singular;
      if (empty) empty.textContent = 'Nu există ' + party.plural.toLowerCase() + ' care să corespundă căutării.';
    }
    if (title) title.textContent = 'Identitatea pentru ' + party.singular.toLowerCase();
    if (typeLabel) typeLabel.textContent = 'Tip ' + party.singular.toLowerCase() + '*';
    if (modalSubtitle) modalSubtitle.textContent = 'Creează profilul folosit pentru fluxuri, conversații, documente și accesul părții externe.';
    if (activate) activate.innerHTML = 'Activează ' + party.singular.toLowerCase() + '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span>';
  }

  /* ============================================================
     Date și persistență locală
     ============================================================ */

  function readMap() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var map = raw ? JSON.parse(raw) : {};
      return map && typeof map === 'object' ? map : {};
    } catch (e) {
      return {};
    }
  }

  function writeRecord(record) {
    var map = readMap();
    map[String(record.id)] = record;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (e) {
      toast('error', 'Profilul nu a putut fi salvat în acest browser.');
    }
  }

  function buildClients() {
    var overrides = readMap();
    var seen = {};
    clients = (MOCK.clients || []).map(function (client) {
      var key = String(client.id);
      seen[key] = true;
      return overrides[key] ? normalizeRecord(overrides[key]) : normalizeSeedClient(client);
    });

    Object.keys(overrides).forEach(function (key) {
      if (!seen[key] && overrides[key] && !overrides[key].deleted) {
        clients.push(normalizeRecord(overrides[key]));
      }
    });
  }

  function normalizeSeedClient(client) {
    var linkedSituations = (MOCK.situations || []).filter(function (item) {
      return String(item.clientId) === String(client.id);
    });
    var serviceIds = [];
    linkedSituations.forEach(function (item) {
      var serviceId = 'sit:' + item.typeId;
      if (serviceIds.indexOf(serviceId) === -1) serviceIds.push(serviceId);
    });
    var firstSituation = linkedSituations[0] || null;
    var contactId = 'ct_seed_' + client.id;
    var emailId = 'em_seed_' + client.id;
    var phoneId = 'ph_seed_' + client.id;

    return normalizeRecord({
      id: client.id,
      companyName: client.companyName,
      legalName: client.companyName,
      displayName: client.companyName,
      identifier: client.cui || '',
      cui: client.cui || '',
      personType: client.personType || 'pj',
      country: 'România',
      address: '',
      startDate: firstSituation ? firstSituation.startDate : TODAY_ISO,
      status: client.status || 'activ',
      avatarId: client.avatarId,
      responsibleId: firstSituation ? firstSituation.titularId : (MOCK.currentUser ? MOCK.currentUser.id : ''),
      serviceIds: serviceIds,
      documentSources: ['scriptica', 'email', 'whatsapp'],
      notificationChannels: ['scriptica', 'email', 'whatsapp'],
      profileValues: {
        cpf_default_code: 'BEN-' + String(client.id).padStart(3, '0'),
        cpf_default_category: Number(client.id) % 3 === 0 ? 'Prioritar' : 'Standard'
      },
      contacts: [{
        id: contactId,
        name: client.contactName || '',
        role: 'Contact principal',
        primary: true,
        portalAccess: true,
        loginEmail: client.email || '',
        permissions: { view: true, chat: true, upload: true, anexe: true },
        emails: client.email ? [{
          id: emailId,
          label: 'Serviciu',
          value: client.email,
          acceptsDocuments: true,
          notifications: true,
          login: true
        }] : [],
        phones: client.phone ? [{
          id: phoneId,
          label: 'Serviciu',
          value: client.phone,
          whatsapp: true,
          acceptsDocuments: true,
          notifications: true
        }] : []
      }]
    });
  }

  function normalizeRecord(record) {
    var out = clone(record || {});
    out.id = out.id || uid('cli');
    out.legalName = out.legalName || out.companyName || '';
    out.displayName = out.displayName || out.companyName || out.legalName;
    out.companyName = out.displayName || out.legalName;
    out.identifier = out.identifier || out.cui || '';
    out.personType = out.personType || 'pj';
    out.country = out.country || 'România';
    out.address = out.address || '';
    out.startDate = out.startDate || TODAY_ISO;
    out.status = out.status || 'in_configurare';
    out.contacts = Array.isArray(out.contacts) ? out.contacts : [];
    out.serviceIds = Array.isArray(out.serviceIds) ? out.serviceIds : [];
    out.documentSources = Array.isArray(out.documentSources) ? out.documentSources : ['scriptica', 'email', 'whatsapp'];
    out.notificationChannels = Array.isArray(out.notificationChannels) ? out.notificationChannels : ['scriptica', 'email', 'whatsapp'];
    out.responsibleId = out.responsibleId == null ? '' : out.responsibleId;
    out.profileValues = out.profileValues && typeof out.profileValues === 'object' ? out.profileValues : {};

    out.contacts = out.contacts.map(function (contact, index) {
      var c = clone(contact || {});
      c.id = c.id || uid('ct');
      c.name = c.name || '';
      c.role = c.role || '';
      c.primary = !!c.primary || (index === 0 && !out.contacts.some(function (item) { return item.primary; }));
      c.portalAccess = !!c.portalAccess;
      c.loginEmail = c.loginEmail || '';
      c.permissions = c.permissions || { view: true, chat: true, upload: true, anexe: true };
      c.emails = Array.isArray(c.emails) ? c.emails.map(normalizeEmail) : [];
      c.phones = Array.isArray(c.phones) ? c.phones.map(normalizePhone) : [];
      return c;
    });

    if (out.contacts.length && !out.contacts.some(function (contact) { return contact.primary; })) {
      out.contacts[0].primary = true;
    }
    return out;
  }

  function normalizeEmail(item) {
    var email = clone(item || {});
    email.id = email.id || uid('em');
    email.label = email.label || 'Serviciu';
    email.value = email.value || '';
    email.acceptsDocuments = email.acceptsDocuments !== false;
    email.notifications = email.notifications !== false;
    email.login = !!email.login;
    return email;
  }

  function normalizePhone(item) {
    var phone = clone(item || {});
    phone.id = phone.id || uid('ph');
    phone.label = phone.label || 'Serviciu';
    phone.value = phone.value || '';
    phone.whatsapp = phone.whatsapp !== false;
    phone.acceptsDocuments = phone.acceptsDocuments !== false;
    phone.notifications = phone.notifications !== false;
    return phone;
  }

  function newContact() {
    return {
      id: uid('ct'),
      name: '',
      role: '',
      primary: false,
      portalAccess: true,
      loginEmail: '',
      permissions: { view: true, chat: true, upload: true, anexe: true },
      emails: [normalizeEmail({ login: true })],
      phones: [normalizePhone({ whatsapp: true })]
    };
  }

  function newDraft() {
    var contact = newContact();
    contact.primary = true;
    return normalizeRecord({
      id: uid('cli'),
      companyName: '',
      legalName: '',
      displayName: '',
      identifier: '',
      personType: 'pj',
      country: 'România',
      address: '',
      startDate: TODAY_ISO,
      status: 'activ',
      responsibleId: MOCK.currentUser ? MOCK.currentUser.id : '',
      serviceIds: [],
      documentSources: ['scriptica', 'email', 'whatsapp'],
      notificationChannels: ['scriptica', 'email', 'whatsapp'],
      contacts: [contact],
      profileValues: {},
      createdAt: TODAY_ISO
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function uid(prefix) {
    idSeq += 1;
    return prefix + '_' + Date.now().toString(36) + '_' + idSeq;
  }

  /* ============================================================
     Catalogul de servicii: standard + fluxurile generice configurate
     ============================================================ */

  function buildServiceCatalog() {
    var out = [];
    (MOCK.situationTypes || []).forEach(function (type) {
      if ((type.status || 'activ') !== 'activ') return;
      out.push({
        id: 'sit:' + type.id,
        name: type.name,
        group: type.domain === 'audit' ? 'Audit' : 'Contabilitate',
        icon: type.domain === 'audit' ? 'verified_user' : 'fact_check'
      });
    });

    if (typeof window.scripticaFlowVerticals === 'function' &&
        typeof window.scripticaTemplatesForVertical === 'function') {
      window.scripticaFlowVerticals().forEach(function (vertical) {
        if (vertical.builtin || (vertical.status || 'activ') !== 'activ') return;
        window.scripticaTemplatesForVertical(vertical.id).forEach(function (template) {
          if ((template.status || 'activ') !== 'activ') return;
          out.push({
            id: 'flow:' + template.id,
            name: template.name,
            group: vertical.name,
            icon: vertical.icon || 'account_tree'
          });
        });
      });
    }
    return out;
  }

  function serviceById(id) {
    return serviceCatalog.find(function (item) { return item.id === id; }) || null;
  }

  /* ============================================================
     Lista de clienți
     ============================================================ */

  function bindPage() {
    var addButton = document.getElementById('ue-add');
    if (addButton) {
      addButton.addEventListener('click', function () {
        lastTrigger = addButton;
        openOnboarding(null);
      });
    }

    searchInput.addEventListener('input', renderClients);

    tbody.addEventListener('click', function (event) {
      var button = event.target.closest('[data-co-edit]');
      if (!button) return;
      var id = button.getAttribute('data-co-edit');
      var client = clients.find(function (item) { return String(item.id) === id; });
      if (!client) return;
      lastTrigger = button;
      openOnboarding(client);
    });
  }

  function renderClients() {
    if (!tbody) return;
    buildClients();
    var query = normalizeText(searchInput.value);
    var list = clients.filter(function (client) {
      if (!query) return true;
      var haystack = [
        client.companyName,
        client.legalName,
        client.identifier,
        PERSON_TYPE_LABELS[client.personType]
      ];
      (client.contacts || []).forEach(function (contact) {
        haystack.push(contact.name, contact.role);
        (contact.emails || []).forEach(function (item) { haystack.push(item.value); });
        (contact.phones || []).forEach(function (item) { haystack.push(item.value); });
      });
      Object.keys(client.profileValues || {}).forEach(function (key) {
        var value = client.profileValues[key];
        haystack.push(typeof value === 'object' ? JSON.stringify(value) : value);
      });
      return normalizeText(haystack.join(' ')).indexOf(query) !== -1;
    });

    renderClientTableHeader();
    tbody.innerHTML = list.map(clientRowHtml).join('');
    toggleExternalEmpty(list.length);
  }

  function profileTableFields() {
    var schema = beneficiarySchema();
    return (schema.fields || []).filter(function (field) {
      return field.type !== 'section_title' && !!field.showInTable;
    });
  }

  function renderClientTableHeader() {
    var head = document.getElementById('ue-thead');
    if (!head) return;
    var dynamic = profileTableFields().map(function (field) {
      return '<th>' + esc(field.label || 'Profil') + (field.sensitive ? '<span class="material-symbols-outlined co-sensitive-head" aria-label="Date sensibile" title="Date sensibile">lock</span>' : '') + '</th>';
    }).join('');
    head.innerHTML = '<tr><th style="min-width:220px;">' + esc(externalParty().singular) + '</th>' +
      '<th style="width:180px;">Contact principal</th><th style="width:140px;">Identificator</th>' + dynamic +
      '<th>Surse documente</th><th style="width:160px;">Fluxuri</th><th style="width:110px;">Status</th><th style="width:80px;">Acțiuni</th></tr>';
  }

  function clientRowHtml(client) {
    var primary = primaryContact(client);
    var extraContacts = Math.max(0, (client.contacts || []).length - 1);
    var sourceChips = (client.documentSources || []).map(function (source) {
      var meta = SOURCE_META[source];
      if (!meta) return '';
      var count = endpointCount(client, source);
      var suffix = count ? ' ' + count : '';
      return '<span class="co-channel-chip"><span class="material-symbols-outlined" aria-hidden="true">' +
        meta.icon + '</span>' + esc(meta.label) + suffix + '</span>';
    }).join('');

    var serviceLabels = (client.serviceIds || []).map(function (id) {
      var service = serviceById(id);
      return service ? service.name : '';
    }).filter(Boolean);
    var serviceText = serviceLabels.length === 1
      ? serviceLabels[0]
      : (serviceLabels.length ? serviceLabels.length + ' fluxuri' : 'Neselectate');

    var avatarHtml = typeof window.renderAvatar === 'function'
      ? window.renderAvatar({
          fullName: primary ? primary.name : client.companyName,
          name: primary ? primary.name : client.companyName,
          avatarId: client.avatarId
        }, 32)
      : esc((client.companyName || '?').charAt(0));
    var profileCells = profileTableFields().map(function (field) {
      var value = (client.profileValues || {})[field.id];
      var formatted = window.SCRIPTICA_BENEFICIARY_PROFILE
        ? window.SCRIPTICA_BENEFICIARY_PROFILE.formatValue(field, value) : (value || '—');
      return '<td>' + esc(formatted) + '</td>';
    }).join('');

    return '<tr>' +
      '<td><div class="co-client-main">' +
        '<span class="co-client-main__avatar">' + avatarHtml + '</span>' +
        '<span class="co-client-main__text"><span class="co-client-main__name">' + esc(client.companyName) + '</span>' +
          '<span class="co-client-main__type">' + esc(PERSON_TYPE_LABELS[client.personType] || client.personType) + '</span></span>' +
      '</div></td>' +
      '<td>' + (primary ? esc(primary.name || '—') : '—') +
        (extraContacts ? '<div class="co-table-subline">+' + extraContacts + ' contacte</div>' : '') + '</td>' +
      '<td>' + esc(client.identifier || '—') + '</td>' +
      profileCells +
      '<td><div class="co-table-chips">' + (sourceChips || '<span class="admin-table__muted">Nicio sursă</span>') + '</div></td>' +
      '<td>' + esc(serviceText) + '</td>' +
      '<td>' + onboardingStatusHtml(client.status) + '</td>' +
      '<td><span class="admin-actions">' +
        '<button type="button" class="admin-action-btn" data-co-edit="' + esc(client.id) + '" aria-label="Gestionează clientul ' +
          esc(client.companyName) + '" title="Gestionează clientul">' +
          '<span class="material-symbols-outlined" aria-hidden="true">edit</span>' +
        '</button>' +
      '</span></td>' +
    '</tr>';
  }

  function primaryContact(client) {
    return (client.contacts || []).find(function (contact) { return contact.primary; }) ||
      (client.contacts || [])[0] || null;
  }

  function endpointCount(client, source) {
    if (source === 'scriptica') {
      return (client.contacts || []).filter(function (contact) { return contact.portalAccess; }).length;
    }
    var count = 0;
    (client.contacts || []).forEach(function (contact) {
      if (source === 'email') {
        count += (contact.emails || []).filter(function (item) {
          return item.value && item.acceptsDocuments;
        }).length;
      } else if (source === 'whatsapp') {
        count += (contact.phones || []).filter(function (item) {
          return item.value && item.whatsapp && item.acceptsDocuments;
        }).length;
      }
    });
    return count;
  }

  function onboardingStatusHtml(status) {
    var normalized = status === 'inactiv' ? 'inactiv' : (status === 'in_configurare' ? 'in_configurare' : 'activ');
    var label = normalized === 'activ' ? 'Activ' : (normalized === 'inactiv' ? 'Inactiv' : 'În configurare');
    return '<span class="status-pill status-pill--' + normalized + '">' +
      '<span class="status-pill__dot" aria-hidden="true"></span>' + label +
    '</span>';
  }

  function toggleExternalEmpty(count) {
    var wrap = document.getElementById('ue-table-wrap');
    var empty = document.getElementById('ue-empty');
    if (!wrap || !empty) return;
    wrap.style.display = count ? '' : 'none';
    empty.style.display = count ? 'none' : 'flex';
  }

  /* ============================================================
     Deschidere, navigare și închidere modal
     ============================================================ */

  function bindModal() {
    modal.querySelectorAll('[data-co-close]').forEach(function (button) {
      button.addEventListener('click', closeOnboarding);
    });
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeOnboarding();
    });
    form.addEventListener('submit', function (event) { event.preventDefault(); });

    document.getElementById('co-next').addEventListener('click', nextStep);
    document.getElementById('co-back').addEventListener('click', previousStep);
    document.getElementById('co-save-draft').addEventListener('click', saveDraft);
    document.getElementById('co-activate').addEventListener('click', activateClient);
    document.getElementById('co-add-contact').addEventListener('click', function () {
      syncIdentity();
      draft.contacts.push(newContact());
      renderContacts();
    });

    bindIdentityFields();
    bindContactEditor();
    bindAccessEditor();
    bindCollaborationFields();
  }

  function openOnboarding(client) {
    editingId = client ? client.id : null;
    draft = client ? normalizeRecord(client) : newDraft();
    currentStep = 1;

    document.getElementById('co-title').textContent = client
      ? 'Gestionează ' + externalParty().singular.toLowerCase()
      : externalParty().singular + ' nou';
    populateIdentity();
    renderProfileFields();
    renderContacts();
    renderAccess();
    renderServices();
    populateCollaboration();
    document.getElementById('co-confirm').checked = false;
    clearAllErrors();
    showStep(1);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('co-person-type').focus(); }, 0);
  }

  function renderProfileFields() {
    var host = document.getElementById('co-profile-fields');
    var wrap = document.getElementById('co-profile-schema');
    if (!host || !wrap || !draft || !window.SCRIPTICA_BENEFICIARY_PROFILE) return;
    var schema = beneficiarySchema();
    var scope = editingId != null ? 'profile' : 'onboarding';
    window.SCRIPTICA_BENEFICIARY_PROFILE.renderInto(host, schema, draft.profileValues, {
      scope: scope,
      idPrefix: 'co_profile',
      onChange: function () {}
    });
    wrap.hidden = !window.SCRIPTICA_BENEFICIARY_PROFILE.visibleFields(schema, scope).some(function (field) { return field.type !== 'section_title'; });
  }

  function closeOnboarding() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    draft = null;
    editingId = null;
    if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
  }

  function nextStep() {
    syncCurrentStep();
    if (!validateStep(currentStep, true)) return;
    if (currentStep < 5) showStep(currentStep + 1);
  }

  function previousStep() {
    syncCurrentStep();
    if (currentStep > 1) showStep(currentStep - 1);
  }

  function showStep(step) {
    currentStep = step;
    clearSummary();
    modal.querySelectorAll('[data-co-step]').forEach(function (section) {
      section.hidden = parseInt(section.getAttribute('data-co-step'), 10) !== step;
    });
    modal.querySelectorAll('[data-co-progress]').forEach(function (item) {
      var number = parseInt(item.getAttribute('data-co-progress'), 10);
      item.classList.toggle('is-current', number === step);
      item.classList.toggle('is-complete', number < step);
    });

    if (step === 2) renderContacts();
    if (step === 3) renderAccess();
    if (step === 4) {
      renderServices();
      populateCollaboration();
    }
    if (step === 5) renderReview();

    document.getElementById('co-back').hidden = step === 1;
    document.getElementById('co-next').hidden = step === 5;
    document.getElementById('co-activate').hidden = step !== 5;
    document.getElementById('co-footer-helper').textContent = 'Pasul ' + step + ' din 5 · * Câmpuri obligatorii';
    form.scrollTop = 0;
  }

  function syncCurrentStep() {
    if (!draft) return;
    if (currentStep === 1) syncIdentity();
    if (currentStep === 4) syncCollaboration();
  }

  /* ============================================================
     Pasul 1 — Identitate
     ============================================================ */

  function bindIdentityFields() {
    [
      'co-person-type', 'co-identifier', 'co-legal-name', 'co-display-name',
      'co-country', 'co-start-date', 'co-address'
    ].forEach(function (id) {
      var field = document.getElementById(id);
      field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', function () {
        syncIdentity();
      });
    });
  }

  function populateIdentity() {
    document.getElementById('co-person-type').value = draft.personType || '';
    document.getElementById('co-identifier').value = draft.identifier || '';
    document.getElementById('co-legal-name').value = draft.legalName || '';
    document.getElementById('co-display-name').value = draft.displayName || '';
    document.getElementById('co-country').value = draft.country || 'România';
    document.getElementById('co-start-date').value = draft.startDate || TODAY_ISO;
    document.getElementById('co-address').value = draft.address || '';
  }

  function syncIdentity() {
    if (!draft) return;
    draft.personType = document.getElementById('co-person-type').value;
    draft.identifier = document.getElementById('co-identifier').value.trim();
    draft.cui = draft.identifier;
    draft.legalName = document.getElementById('co-legal-name').value.trim();
    draft.displayName = document.getElementById('co-display-name').value.trim();
    draft.companyName = draft.displayName || draft.legalName;
    draft.country = document.getElementById('co-country').value;
    draft.startDate = document.getElementById('co-start-date').value;
    draft.address = document.getElementById('co-address').value.trim();
  }

  /* ============================================================
     Pasul 2 — Contacte și canale
     ============================================================ */

  function bindContactEditor() {
    var list = document.getElementById('co-contact-list');

    list.addEventListener('input', function (event) {
      var target = event.target;
      var contact = contactFromTarget(target);
      if (!contact) return;

      var field = target.getAttribute('data-contact-field');
      if (field) {
        contact[field] = target.value;
        return;
      }

      var endpoint = endpointFromTarget(contact, target);
      if (!endpoint) return;
      var endpointField = target.getAttribute('data-endpoint-field');
      if (endpointField) endpoint[endpointField] = target.value;
    });

    list.addEventListener('change', function (event) {
      var target = event.target;
      var contact = contactFromTarget(target);
      if (!contact) return;

      if (target.matches('[data-contact-primary]')) {
        draft.contacts.forEach(function (item) { item.primary = item.id === contact.id; });
        renderContacts();
        return;
      }

      var endpoint = endpointFromTarget(contact, target);
      if (!endpoint) return;
      var checkboxField = target.getAttribute('data-endpoint-check');
      if (checkboxField) endpoint[checkboxField] = target.checked;
    });

    list.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      var contact = contactFromTarget(button);
      if (!contact) return;

      if (button.hasAttribute('data-contact-remove')) {
        draft.contacts = draft.contacts.filter(function (item) { return item.id !== contact.id; });
        if (draft.contacts.length && !draft.contacts.some(function (item) { return item.primary; })) {
          draft.contacts[0].primary = true;
        }
        renderContacts();
        return;
      }

      if (button.hasAttribute('data-email-add')) {
        contact.emails.push(normalizeEmail({ login: contact.emails.length === 0 }));
        renderContacts();
        return;
      }

      if (button.hasAttribute('data-phone-add')) {
        contact.phones.push(normalizePhone({ whatsapp: true }));
        renderContacts();
        return;
      }

      var endpoint = endpointFromTarget(contact, button);
      if (!endpoint) return;
      if (button.hasAttribute('data-email-remove')) {
        contact.emails = contact.emails.filter(function (item) { return item.id !== endpoint.id; });
      } else if (button.hasAttribute('data-phone-remove')) {
        contact.phones = contact.phones.filter(function (item) { return item.id !== endpoint.id; });
      }
      renderContacts();
    });
  }

  function renderContacts() {
    var list = document.getElementById('co-contact-list');
    list.innerHTML = (draft.contacts || []).map(function (contact, index) {
      return '<article class="co-contact-card" data-contact-id="' + esc(contact.id) + '">' +
        '<header class="co-contact-card__head">' +
          '<div class="co-contact-card__title"><span class="material-symbols-outlined" aria-hidden="true">person</span>' +
            '<span>' + esc(contact.name || ('Contact ' + (index + 1))) + '</span></div>' +
          '<div class="co-contact-card__actions">' +
            '<label class="co-primary-choice"><input type="radio" name="co-primary-contact" data-contact-primary' +
              (contact.primary ? ' checked' : '') + '> Contact principal</label>' +
            ((draft.contacts || []).length > 1
              ? '<button type="button" class="admin-action-btn admin-action-btn--delete" data-contact-remove aria-label="Elimină contactul" title="Elimină contactul">' +
                  '<span class="material-symbols-outlined" aria-hidden="true">delete</span></button>'
              : '') +
          '</div>' +
        '</header>' +
        '<div class="co-contact-fields">' +
          '<div class="form-field"><label class="form-label">Nume complet*</label>' +
            '<input type="text" class="input" data-contact-field="name" value="' + esc(contact.name) + '" autocomplete="name">' +
            '<span class="form-error" role="alert"></span></div>' +
          '<div class="form-field"><label class="form-label">Rol / departament</label>' +
            '<input type="text" class="input" data-contact-field="role" value="' + esc(contact.role) + '" placeholder="ex. Administrator, Salarizare"></div>' +
        '</div>' +
        endpointSectionHtml(contact, 'email') +
        endpointSectionHtml(contact, 'phone') +
      '</article>';
    }).join('');
  }

  function endpointSectionHtml(contact, kind) {
    var isEmail = kind === 'email';
    var list = isEmail ? contact.emails : contact.phones;
    var icon = isEmail ? 'mail' : 'call';
    var title = isEmail ? 'Adrese de e-mail' : 'Numere de telefon / WhatsApp';
    var addAttribute = isEmail ? 'data-email-add' : 'data-phone-add';
    var addLabel = isEmail ? 'Adaugă e-mail' : 'Adaugă număr';
    var empty = isEmail ? 'Nicio adresă adăugată.' : 'Niciun număr adăugat.';

    return '<section class="co-endpoint-section">' +
      '<header class="co-endpoint-section__head">' +
        '<div class="co-endpoint-section__title"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' + title + '</div>' +
        '<button type="button" class="co-mini-add" ' + addAttribute + '><span class="material-symbols-outlined" aria-hidden="true">add</span>' + addLabel + '</button>' +
      '</header>' +
      '<div class="co-endpoint-list">' +
        (list.length ? list.map(function (item) { return endpointRowHtml(item, kind); }).join('') :
          '<div class="co-access-disabled">' + empty + '</div>') +
      '</div>' +
    '</section>';
  }

  function endpointRowHtml(item, kind) {
    var isEmail = kind === 'email';
    var valueType = isEmail ? 'email' : 'tel';
    var placeholder = isEmail ? 'nume@companie.ro' : '+40 7xx xxx xxx';
    var removeAttribute = isEmail ? 'data-email-remove' : 'data-phone-remove';
    var options = ['Serviciu', 'Personal', 'Facturi', 'Salarizare', 'Altele'].map(function (label) {
      return '<option value="' + label + '"' + (item.label === label ? ' selected' : '') + '>' + label + '</option>';
    }).join('');

    return '<div class="co-endpoint-row" data-endpoint-id="' + esc(item.id) + '" data-endpoint-kind="' + kind + '">' +
      '<select class="select" data-endpoint-field="label" aria-label="Etichetă canal">' + options + '</select>' +
      '<input type="' + valueType + '" class="input" data-endpoint-field="value" value="' + esc(item.value) + '" placeholder="' + placeholder + '">' +
      '<button type="button" class="co-endpoint-remove" ' + removeAttribute + ' aria-label="Elimină canalul" title="Elimină canalul">' +
        '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
      '<div class="co-endpoint-row__controls">' +
        (isEmail ? '' :
          checkboxHtml('WhatsApp', 'whatsapp', item.whatsapp)) +
        checkboxHtml('Primește documente', 'acceptsDocuments', item.acceptsDocuments) +
        checkboxHtml('Primește notificări', 'notifications', item.notifications) +
        (isEmail ? checkboxHtml('Poate fi login', 'login', item.login) : '') +
      '</div>' +
      '<span class="co-inline-error" role="alert" hidden></span>' +
    '</div>';
  }

  function checkboxHtml(label, field, checked) {
    return '<label class="checkbox"><input type="checkbox" data-endpoint-check="' + field + '"' +
      (checked ? ' checked' : '') + '> ' + label + '</label>';
  }

  function contactFromTarget(target) {
    var card = target.closest('[data-contact-id]');
    if (!card || !draft) return null;
    var id = card.getAttribute('data-contact-id');
    return draft.contacts.find(function (contact) { return contact.id === id; }) || null;
  }

  function endpointFromTarget(contact, target) {
    var row = target.closest('[data-endpoint-id]');
    if (!row) return null;
    var id = row.getAttribute('data-endpoint-id');
    var list = row.getAttribute('data-endpoint-kind') === 'email' ? contact.emails : contact.phones;
    return list.find(function (item) { return item.id === id; }) || null;
  }

  /* ============================================================
     Pasul 3 — Acces și permisiuni
     ============================================================ */

  function bindAccessEditor() {
    var list = document.getElementById('co-access-list');
    list.addEventListener('change', function (event) {
      var target = event.target;
      var contact = contactFromTarget(target);
      if (!contact) return;

      if (target.hasAttribute('data-portal-toggle')) {
        contact.portalAccess = target.checked;
        if (contact.portalAccess && !contact.loginEmail) {
          var first = contact.emails.find(function (item) { return item.value; });
          contact.loginEmail = first ? first.value : '';
        }
        renderAccess();
        return;
      }

      if (target.hasAttribute('data-login-email')) {
        contact.loginEmail = target.value;
        return;
      }

      var permission = target.getAttribute('data-permission');
      if (permission) contact.permissions[permission] = target.checked;
    });
  }

  function renderAccess() {
    var list = document.getElementById('co-access-list');
    list.innerHTML = (draft.contacts || []).map(function (contact) {
      var emailOptions = (contact.emails || []).filter(function (item) { return item.value; }).map(function (item) {
        return '<option value="' + esc(item.value) + '"' + (contact.loginEmail === item.value ? ' selected' : '') + '>' +
          esc(item.value) + ' · ' + esc(item.label) + '</option>';
      }).join('');

      var body = contact.portalAccess
        ? '<div class="co-access-card__body">' +
            '<div class="form-field"><label class="form-label">E-mail pentru autentificare*</label>' +
              '<select class="select" data-login-email><option value="">Selectează adresa...</option>' + emailOptions + '</select>' +
              (!emailOptions ? '<span class="form-helper">Adaugă mai întâi o adresă de e-mail în pasul „Contacte”.</span>' : '') +
            '</div>' +
            '<div><span class="form-label">Permisiuni</span><div class="co-access-permissions">' +
              Object.keys(PERMISSION_LABELS).map(function (key) {
                return '<label class="checkbox"><input type="checkbox" data-permission="' + key + '"' +
                  (contact.permissions[key] ? ' checked' : '') + '> ' + PERMISSION_LABELS[key] + '</label>';
              }).join('') +
            '</div></div>' +
          '</div>'
        : '<div class="co-access-disabled">Contactul rămâne autorizat pentru canalele configurate, dar nu va primi cont în Scriptica.</div>';

      return '<article class="co-access-card" data-contact-id="' + esc(contact.id) + '">' +
        '<header class="co-access-card__head">' +
          '<div class="co-access-card__title"><span class="material-symbols-outlined" aria-hidden="true">person</span>' +
            '<span>' + esc(contact.name || 'Contact fără nume') + '</span></div>' +
          '<label class="checkbox co-access-card__toggle"><input type="checkbox" data-portal-toggle' +
            (contact.portalAccess ? ' checked' : '') + '> Invită în Scriptica</label>' +
        '</header>' +
        body +
        '<span class="co-inline-error" role="alert" hidden></span>' +
      '</article>';
    }).join('');
  }

  /* ============================================================
     Pasul 4 — Servicii, surse și notificări
     ============================================================ */

  function bindCollaborationFields() {
    document.getElementById('co-service-list').addEventListener('change', syncCollaboration);
    document.getElementById('co-source-list').addEventListener('change', syncCollaboration);
    modal.querySelectorAll('input[name="co-notification"]').forEach(function (input) {
      input.addEventListener('change', syncCollaboration);
    });
    document.getElementById('co-responsible').addEventListener('change', syncCollaboration);
    document.getElementById('co-status').addEventListener('change', syncCollaboration);
  }

  function renderServices() {
    var list = document.getElementById('co-service-list');
    list.innerHTML = serviceCatalog.map(function (service) {
      return '<label class="co-choice-card">' +
        '<input type="checkbox" name="co-service" value="' + esc(service.id) + '"' +
          (draft.serviceIds.indexOf(service.id) !== -1 ? ' checked' : '') + '>' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + esc(service.icon) + '</span>' +
        '<div><b>' + esc(service.name) + '</b><small>' + esc(service.group) + '</small></div>' +
      '</label>';
    }).join('');
  }

  function populateCollaboration() {
    var responsible = document.getElementById('co-responsible');
    responsible.innerHTML = '<option value="">Selectează responsabilul...</option>' +
      (MOCK.employees || []).filter(function (employee) {
        return (employee.status || 'activ') === 'activ';
      }).map(function (employee) {
        return '<option value="' + esc(employee.id) + '"' +
          (String(draft.responsibleId) === String(employee.id) ? ' selected' : '') + '>' +
          esc(employee.name) + ' · ' + esc(employee.role || 'Utilizator') + '</option>';
      }).join('');

    document.getElementById('co-status').value = draft.status === 'inactiv' ? 'inactiv' : 'activ';
    modal.querySelectorAll('input[name="co-source"]').forEach(function (input) {
      input.checked = draft.documentSources.indexOf(input.value) !== -1;
    });
    modal.querySelectorAll('input[name="co-notification"]').forEach(function (input) {
      input.checked = draft.notificationChannels.indexOf(input.value) !== -1;
    });
  }

  function syncCollaboration() {
    if (!draft) return;
    draft.responsibleId = document.getElementById('co-responsible').value;
    draft.status = document.getElementById('co-status').value;
    draft.serviceIds = checkedValues('co-service');
    draft.documentSources = checkedValues('co-source');
    draft.notificationChannels = checkedValues('co-notification');
  }

  function checkedValues(name) {
    return Array.prototype.slice.call(modal.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (input) { return input.value; });
  }

  /* ============================================================
     Pasul 5 — Rezumat
     ============================================================ */

  function renderReview() {
    syncIdentity();
    syncCollaboration();
    var primary = primaryContact(draft);
    var portalContacts = draft.contacts.filter(function (contact) { return contact.portalAccess; });
    var emailCount = endpointCount(draft, 'email');
    var whatsappCount = endpointCount(draft, 'whatsapp');
    var responsible = (MOCK.employees || []).find(function (employee) {
      return String(employee.id) === String(draft.responsibleId);
    });
    var serviceNames = draft.serviceIds.map(function (id) {
      var service = serviceById(id);
      return service ? service.name : id;
    });

    var sourceChips = draft.documentSources.map(function (source) {
      var meta = SOURCE_META[source];
      return meta ? '<span class="co-channel-chip"><span class="material-symbols-outlined" aria-hidden="true">' +
        meta.icon + '</span>' + esc(meta.label) + '</span>' : '';
    }).join('');

    document.getElementById('co-review').innerHTML =
      reviewCardHtml('domain', externalParty().singular, [
        ['Denumire', draft.companyName || '—'],
        ['Tip', PERSON_TYPE_LABELS[draft.personType] || '—'],
        ['Identificator', draft.identifier || '—'],
        ['Colaborare din', formatDate(draft.startDate)]
      ]) +
      reviewCardHtml('contacts', 'Contacte', [
        ['Contact principal', primary ? primary.name : '—'],
        ['Persoane de contact', String(draft.contacts.length)],
        ['Adrese pentru documente', String(emailCount)],
        ['Numere WhatsApp pentru documente', String(whatsappCount)]
      ]) +
      reviewCardHtml('manage_accounts', 'Acces Scriptica', [
        ['Conturi de invitat', String(portalContacts.length)],
        ['Încărcare documente', String(portalContacts.filter(function (contact) { return contact.permissions.upload; }).length)],
        ['Completare anexe', String(portalContacts.filter(function (contact) { return contact.permissions.anexe; }).length)]
      ]) +
      reviewCardHtml('badge', 'Responsabilitate', [
        ['Responsabil intern', responsible ? responsible.name : '—'],
        ['Status', draft.status === 'inactiv' ? 'Inactiv' : 'Activ'],
        ['Notificări', draft.notificationChannels.map(sourceLabel).join(', ') || '—']
      ]) +
      '<article class="co-review-card co-review-card--full">' +
        '<div class="co-review-card__title"><span class="material-symbols-outlined" aria-hidden="true">account_tree</span>Fluxuri active</div>' +
        '<div class="co-review-chips">' +
          (serviceNames.length ? serviceNames.map(function (name) {
            return '<span class="pill pill--neutral">' + esc(name) + '</span>';
          }).join('') : '<span class="admin-table__muted">Niciun flux selectat</span>') +
        '</div>' +
      '</article>' +
      '<article class="co-review-card co-review-card--full">' +
        '<div class="co-review-card__title"><span class="material-symbols-outlined" aria-hidden="true">move_to_inbox</span>Intrarea documentelor</div>' +
        '<div class="co-review-chips">' + sourceChips + '</div>' +
        '<p class="co-table-subline">Scriptica păstrează clientul, fluxul, persoana și canalul ca proveniență. Intrările ambigue merg în „De clasificat”.</p>' +
      '</article>';
  }

  function reviewCardHtml(icon, title, rows) {
    return '<article class="co-review-card">' +
      '<div class="co-review-card__title"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' + esc(title) + '</div>' +
      '<ul class="co-review-list">' +
        rows.map(function (row) { return '<li><span>' + esc(row[0]) + '</span><b>' + esc(row[1]) + '</b></li>'; }).join('') +
      '</ul>' +
    '</article>';
  }

  /* ============================================================
     Validare
     ============================================================ */

  function validateStep(step, showMessage) {
    clearStepErrors(step);
    var errors = [];
    var valid = true;

    if (step === 1) {
      syncIdentity();
      if (!draft.personType) {
        setFieldError('personType', 'Selectează tipul pentru ' + externalParty().singular.toLowerCase() + '.');
        errors.push('tipul pentru ' + externalParty().singular.toLowerCase());
      }
      if (!draft.identifier) {
        setFieldError('identifier', 'Introdu CUI-ul, CNP-ul sau identificatorul relevant.');
        errors.push('identificatorul');
      } else {
        var duplicate = clients.some(function (client) {
          return String(client.id) !== String(editingId) &&
            normalizeText(client.identifier) === normalizeText(draft.identifier);
        });
        if (duplicate) {
          setFieldError('identifier', 'Există deja o înregistrare pentru ' + externalParty().singular.toLowerCase() + ' cu acest identificator.');
          errors.push('identificator unic');
        }
      }
      if (!draft.legalName) {
        setFieldError('legalName', 'Introdu denumirea legală.');
        errors.push('denumirea legală');
      }
      if (!draft.country) {
        setFieldError('country', 'Selectează țara.');
        errors.push('țara');
      }
      if (!draft.startDate) {
        setFieldError('startDate', 'Alege data începerii colaborării.');
        errors.push('data colaborării');
      }
      if (window.SCRIPTICA_BENEFICIARY_PROFILE) {
        var profileValid = window.SCRIPTICA_BENEFICIARY_PROFILE.validate(
          document.getElementById('co-profile-fields'), beneficiarySchema(), draft.profileValues,
          { scope: editingId != null ? 'profile' : 'onboarding' }
        );
        if (!profileValid) errors.push('câmpurile obligatorii din profil');
      }
      valid = errors.length === 0;
    }

    if (step === 2) {
      valid = validateContacts(errors);
    }

    if (step === 3) {
      valid = validateAccess(errors);
    }

    if (step === 4) {
      syncCollaboration();
      valid = validateCollaboration(errors);
    }

    if (step === 5) {
      if (!document.getElementById('co-confirm').checked) {
        setFieldError('confirmation', 'Confirmă verificarea profilului înainte de activare.');
        errors.push('confirmarea finală');
      }
      valid = errors.length === 0;
    }

    if (!valid && showMessage) {
      setSummary('Verifică ' + errors.join(', ') + '.');
    }
    return valid;
  }

  function validateContacts(errors) {
    if (!draft.contacts.length) {
      errors.push('cel puțin o persoană de contact');
      return false;
    }

    var valid = true;
    var endpoints = [];
    var hasPrimary = false;
    var hasAnyEndpoint = false;

    draft.contacts.forEach(function (contact) {
      var card = modal.querySelector('[data-co-step="2"] [data-contact-id="' + cssEscape(contact.id) + '"]');
      if (contact.primary) hasPrimary = true;
      if (!contact.name.trim()) {
        valid = false;
        if (card) {
          card.classList.add('has-error');
          var nameField = card.querySelector('[data-contact-field="name"]');
          if (nameField) nameField.closest('.form-field').classList.add('has-error');
          var nameError = nameField ? nameField.closest('.form-field').querySelector('.form-error') : null;
          if (nameError) nameError.textContent = 'Introdu numele contactului.';
        }
      }

      contact.emails.forEach(function (email) {
        var value = email.value.trim().toLowerCase();
        if (value) hasAnyEndpoint = true;
        var message = !value ? 'Completează adresa sau elimină rândul.' :
          (!EMAIL_RE.test(value) ? 'Introdu o adresă de e-mail validă.' :
            (endpoints.indexOf('email:' + value) !== -1 ? 'Adresa este adăugată de două ori.' : ''));
        if (value) endpoints.push('email:' + value);
        if (message) {
          valid = false;
          markEndpointError(contact.id, email.id, message);
        }
      });

      contact.phones.forEach(function (phone) {
        var value = phone.value.trim();
        var normalized = normalizePhoneValue(value);
        if (value) hasAnyEndpoint = true;
        var message = !value ? 'Completează numărul sau elimină rândul.' :
          (!PHONE_RE.test(value) ? 'Introdu un număr de telefon valid.' :
            (endpoints.indexOf('phone:' + normalized) !== -1 ? 'Numărul este adăugat de două ori.' : ''));
        if (value) endpoints.push('phone:' + normalized);
        if (message) {
          valid = false;
          markEndpointError(contact.id, phone.id, message);
        }
      });
    });

    if (!hasPrimary) {
      valid = false;
      errors.push('contactul principal');
    }
    if (!hasAnyEndpoint) {
      valid = false;
      errors.push('cel puțin un e-mail sau număr de telefon');
    }
    if (!valid && errors.length === 0) errors.push('datele contactelor și canalelor');
    return valid;
  }

  function validateAccess(errors) {
    var valid = true;
    draft.contacts.forEach(function (contact) {
      var card = modal.querySelector('[data-co-step="3"] [data-contact-id="' + cssEscape(contact.id) + '"]');
      if (!contact.portalAccess) return;
      var emailExists = contact.emails.some(function (item) {
        return item.value && item.value === contact.loginEmail && EMAIL_RE.test(item.value);
      });
      var permissionCount = Object.keys(contact.permissions).filter(function (key) {
        return contact.permissions[key];
      }).length;
      var message = !emailExists ? 'Selectează o adresă validă pentru autentificare.' :
        (!permissionCount ? 'Alege cel puțin o permisiune.' : '');
      if (message) {
        valid = false;
        if (card) {
          card.classList.add('has-error');
          var error = card.querySelector('.co-inline-error');
          if (error) { error.textContent = message; error.hidden = false; }
        }
      }
    });
    if (!valid) errors.push('accesul și permisiunile contactelor');
    return valid;
  }

  function validateCollaboration(errors) {
    var valid = true;
    if (!draft.responsibleId) {
      setFieldError('responsible', 'Selectează responsabilul intern.');
      errors.push('responsabilul intern');
      valid = false;
    }
    if (!draft.serviceIds.length) {
      setFieldError('services', 'Selectează cel puțin un flux sau serviciu.');
      errors.push('cel puțin un flux');
      valid = false;
    }
    if (!draft.documentSources.length) {
      setFieldError('sources', 'Selectează cel puțin o sursă pentru documente.');
      errors.push('sursele pentru documente');
      valid = false;
    }
    if (!draft.notificationChannels.length) {
      setFieldError('notifications', 'Selectează cel puțin un canal pentru notificări.');
      errors.push('canalele de notificare');
      valid = false;
    }

    var hasPortal = draft.contacts.some(function (contact) {
      return contact.portalAccess && contact.permissions.chat && contact.permissions.upload;
    });
    var hasEmailDocs = draft.contacts.some(function (contact) {
      return contact.emails.some(function (item) { return item.value && item.acceptsDocuments; });
    });
    var hasWhatsappDocs = draft.contacts.some(function (contact) {
      return contact.phones.some(function (item) {
        return item.value && item.whatsapp && item.acceptsDocuments;
      });
    });
    var hasEmailNotifications = draft.contacts.some(function (contact) {
      return contact.emails.some(function (item) { return item.value && item.notifications; });
    });
    var hasWhatsappNotifications = draft.contacts.some(function (contact) {
      return contact.phones.some(function (item) {
        return item.value && item.whatsapp && item.notifications;
      });
    });

    var sourceError = '';
    if (draft.documentSources.indexOf('scriptica') !== -1 && !hasPortal) {
      sourceError = 'Pentru documente prin Scriptica, invită cel puțin un contact cu acces la chat și încărcare.';
    } else if (draft.documentSources.indexOf('email') !== -1 && !hasEmailDocs) {
      sourceError = 'Pentru documente prin e-mail, autorizează cel puțin o adresă să trimită documente.';
    } else if (draft.documentSources.indexOf('whatsapp') !== -1 && !hasWhatsappDocs) {
      sourceError = 'Pentru documente prin WhatsApp, autorizează cel puțin un număr WhatsApp.';
    }
    if (sourceError) {
      setFieldError('sources', sourceError);
      errors.push('coerența surselor de documente');
      valid = false;
    }

    var notificationError = '';
    if (draft.notificationChannels.indexOf('scriptica') !== -1 &&
        !draft.contacts.some(function (contact) { return contact.portalAccess; })) {
      notificationError = 'Notificările în Scriptica necesită cel puțin un contact invitat.';
    } else if (draft.notificationChannels.indexOf('email') !== -1 && !hasEmailNotifications) {
      notificationError = 'Autorizează cel puțin o adresă să primească notificări.';
    } else if (draft.notificationChannels.indexOf('whatsapp') !== -1 && !hasWhatsappNotifications) {
      notificationError = 'Autorizează cel puțin un număr WhatsApp să primească notificări.';
    }
    if (notificationError) {
      setFieldError('notifications', notificationError);
      errors.push('coerența canalelor de notificare');
      valid = false;
    }
    return valid;
  }

  function markEndpointError(contactId, endpointId, message) {
    var row = modal.querySelector('[data-co-step="2"] [data-contact-id="' + cssEscape(contactId) +
      '"] [data-endpoint-id="' + cssEscape(endpointId) + '"]');
    if (!row) return;
    row.classList.add('has-error');
    var error = row.querySelector('.co-inline-error');
    if (error) { error.textContent = message; error.hidden = false; }
  }

  function setFieldError(name, message) {
    var field = modal.querySelector('[data-co-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle('has-error', !!message);
    var error = field.querySelector('.form-error');
    if (error) error.textContent = message || '';
  }

  function clearStepErrors(step) {
    var section = modal.querySelector('[data-co-step="' + step + '"]');
    if (!section) return;
    section.querySelectorAll('.has-error').forEach(function (item) { item.classList.remove('has-error'); });
    section.querySelectorAll('.form-error, .co-inline-error').forEach(function (item) {
      item.textContent = '';
      if (item.classList.contains('co-inline-error')) item.hidden = true;
    });
    clearSummary();
  }

  function clearAllErrors() {
    modal.querySelectorAll('.has-error').forEach(function (item) { item.classList.remove('has-error'); });
    modal.querySelectorAll('.form-error, .co-inline-error').forEach(function (item) {
      item.textContent = '';
      if (item.classList.contains('co-inline-error')) item.hidden = true;
    });
    clearSummary();
  }

  function setSummary(message) {
    var summary = document.getElementById('co-error-summary');
    summary.textContent = message;
    summary.hidden = false;
  }

  function clearSummary() {
    var summary = document.getElementById('co-error-summary');
    summary.textContent = '';
    summary.hidden = true;
  }

  /* ============================================================
     Salvare ciornă și activare
     ============================================================ */

  function saveDraft() {
    syncIdentity();
    syncCollaboration();
    if (!draft.legalName && !draft.displayName) {
      showStep(1);
      setFieldError('legalName', 'Introdu o denumire înainte de a salva ciorna.');
      setSummary('Ciorna are nevoie de o denumire.');
      return;
    }
    draft.companyName = draft.displayName || draft.legalName;
    draft.status = 'in_configurare';
    draft.updatedAt = TODAY_ISO;
    writeRecord(draft);
    closeOnboarding();
    renderClients();
    toast('success', 'Ciorna pentru ' + externalParty().singular.toLowerCase() + ' a fost salvată.');
  }

  function activateClient() {
    syncIdentity();
    syncCollaboration();

    for (var step = 1; step <= 4; step++) {
      if (!validateStep(step, false)) {
        showStep(step);
        validateStep(step, true);
        return;
      }
    }
    if (!validateStep(5, true)) return;

    var wasEditing = editingId != null;
    draft.companyName = draft.displayName || draft.legalName;
    draft.status = document.getElementById('co-status').value;
    draft.updatedAt = TODAY_ISO;
    if (!draft.createdAt) draft.createdAt = TODAY_ISO;
    writeRecord(draft);

    var invited = draft.contacts.filter(function (contact) { return contact.portalAccess; }).length;
    closeOnboarding();
    renderClients();
    toast('success', wasEditing
      ? 'Profilul pentru ' + externalParty().singular.toLowerCase() + ' a fost actualizat.'
      : externalParty().singular + ' a fost activat. ' + invited + (invited === 1 ? ' invitație este pregătită.' : ' invitații sunt pregătite.'));
  }

  /* ============================================================
     Utilitare
     ============================================================ */

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function normalizePhoneValue(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var parts = String(iso).split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : iso;
  }

  function sourceLabel(value) {
    return SOURCE_META[value] ? SOURCE_META[value].label : value;
  }

  function cssEscape(value) {
    return String(value).replace(/"/g, '\\"');
  }

  function toast(variant, message) {
    if (window.SCRIPTICA_TOAST) window.SCRIPTICA_TOAST(variant, message);
  }
})();
