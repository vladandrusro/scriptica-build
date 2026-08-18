/* ============================================================
   Scriptica — Situație Contabilă Detail (Phase 4a)
   Renders a single situation: step banner, task list,
   per-situation chat, composer, and the three modals
   (task completion, cere asistență, anulare).
   Today is pinned to 2026-04-20.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  if (!MOCK) {
    console.error('[Scriptica] Mock data missing.');
    return;
  }

  var TODAY = new Date('2026-04-20T00:00:00');
  var currentUserId = MOCK.currentUserId || 1;
  var currentUser = MOCK.employees.find(function (e) { return e.id === currentUserId; }) || MOCK.currentUser;
  var currentSituation = null;
  var currentWorkspaceKind = 'situatie';
  var currentVertical = null;

  var MOCK_DOC_NAMES = [
    'factura_orange_martie',
    'balanta_martie_2026',
    'jurnal_vanzari_martie',
    'extras_bt_aprilie',
    'contract_canvas_srl'
  ];

  var STATUS_LABELS = {
    analiza:              'Analiză',
    asteapta_documente:   'Așteaptă Documente',
    in_verificare:        'În Verificare',
    finalizat:            'Finalizat',
    inchisa:              'Închisă',
    anulata:              'Anulată',
    intarziere:           'În Întârziere'
  };

  var AVATAR_PALETTE = [
    '#47386A', '#38BA31', '#F9A956', '#FF3C80',
    '#5B4D7A', '#2E8F28', '#D98F3E', '#D93060'
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    if (!document.getElementById('detail-main')) return;
    parseUrl();
    if (!currentSituation) return;
    applyWorkspaceCopy();
    bindAvatarFallback();
    render();
    bindGlobal();
    // Re-render after timer events so the banner indicator flips and task times update
    window.addEventListener('scriptica:timer-started', render);
    window.addEventListener('scriptica:timer-stopped', render);
    // Re-render after an anexă is saved so cards + finalize gating update
    window.addEventListener('scriptica:anexa-saved', render);
  }

  /* Swap avatar <img> → initials <span> if Pravatar fails. Image errors
     don't bubble, so the capture-phase listener catches them globally. */
  function bindAvatarFallback() {
    document.addEventListener('error', function (e) {
      var img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      if (!img.classList || !img.classList.contains('avatar')) return;
      var bg = img.getAttribute('data-avatar-bg') || '#47386A';
      var initialsText = img.getAttribute('data-avatar-initials') || '?';
      var span = document.createElement('span');
      span.className = img.className;
      span.style.background = bg;
      span.style.borderColor = bg;
      if (img.title) span.title = img.title;
      span.textContent = initialsText;
      if (img.parentNode) img.parentNode.replaceChild(span, img);
    }, true);
  }

  /* ---------- URL parsing ---------- */

  function parseUrl() {
    var params = new URLSearchParams(window.location.search);
    var flowId = params.get('flowId');
    if (flowId) {
      var item = (MOCK.flowItems || []).find(function (flowItem) { return flowItem.id === flowId; });
      var vertical = item && typeof window.scripticaEffectiveVertical === 'function'
        ? window.scripticaEffectiveVertical(item.verticalId)
        : (item && typeof window.scripticaVerticalById === 'function' ? window.scripticaVerticalById(item.verticalId) : null);
      if (!item || !vertical || (typeof window.viewInScope === 'function' && !window.viewInScope(vertical.domain))) {
        window.location.replace('acasa.html?view=' + encodeURIComponent(typeof window.getCurrentView === 'function' ? window.getCurrentView() : 'complet'));
        return;
      }
      currentWorkspaceKind = 'flux';
      currentVertical = vertical;
      currentSituation = prepareFlowWorkspace(item, vertical);
      document.body.setAttribute('data-workspace-kind', 'flux');
      document.title = item.name + ' — Scriptica';
      markFlowNavActive(vertical.id);
      return;
    }
    var id = params.get('id');
    var pool = (typeof window.getVisibleSituations === 'function') ? window.getVisibleSituations() : MOCK.situations;
    currentSituation = pool.find(function (s) { return s.id === id; });
    if (!currentSituation) {
      // Deep-link out of scope (e.g. another client's situation in client view) → redirect to dashboard
      if (typeof window.scripticaIsClientView === 'function' && window.scripticaIsClientView() && id) {
        window.location.replace('acasa.html?view=client');
        return;
      }
      currentSituation = pool[0] || MOCK.situations[0];
      if (currentSituation && history && history.replaceState) {
        history.replaceState(null, '', '?id=' + currentSituation.id);
      }
    }
  }

  function flowTemplateById(id) {
    return (((MOCK.superAdmin || {}).flowTemplates) || []).find(function (template) {
      return template.id === id;
    }) || null;
  }

  function defaultFlowTasks(stepName, index) {
    var normalized = String(stepName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/recept|colect|solicit|pregat|evalu/.test(normalized)) {
      return ['Confirmă informațiile de intrare', 'Verifică documentele primite'];
    }
    if (/verific|document|intervent|lucru|analiz/.test(normalized)) {
      return ['Execută verificările pasului', 'Notează observațiile importante'];
    }
    if (/valid|raport|livr|inchid|urmar|ierarh/.test(normalized)) {
      return ['Revizuiește rezultatul', 'Confirmă livrabilul pasului'];
    }
    return index === 0 ? ['Pregătește informațiile necesare'] : ['Finalizează activitatea pasului'];
  }

  function legacyFlowAnexe(templateId, stepIndex) {
    var map = {
      ft_consult_opinie: [
        ['anx_consult_fisa_speta'],
        ['anx_consult_analiza', 'anx_consult_proiect_opinie'],
        ['anx_consult_validare_livrare']
      ],
      ft_consult_retainer: [
        ['anx_consult_fisa_speta'],
        ['anx_consult_analiza'],
        ['anx_consult_validare_livrare']
      ],
      ft_constr_ofertare: [['anx_constr_propunere']],
      ft_constr_contractare: [['anx_constr_contract']],
      ft_constr_executie: [['anx_constr_pv_receptie', 'anx_constr_nota_fundamentare']],
      ft_constr_complet: [['anx_constr_propunere'], ['anx_constr_contract'], ['anx_constr_pv_receptie', 'anx_constr_nota_fundamentare']]
    };
    return map[templateId] && map[templateId][stepIndex] ? map[templateId][stepIndex].slice() : [];
  }

  function normalizedFlowDefinition(item, vertical) {
    var source = flowTemplateById(item.templateId) || { id: item.templateId, name: item.templateName, steps: [] };
    var definition = Object.assign({}, source);
    definition.steps = (source.steps || []).map(function (step, index) {
      var stepId = step.id || (source.id + '_step_' + (index + 1));
      var taskSource = (step.tasks && step.tasks.length) ? step.tasks : defaultFlowTasks(step.name, index);
      return Object.assign({}, step, {
        id: stepId,
        tasks: taskSource.map(function (task, taskIndex) {
          var kind = task && task.kind === 'document_upload' ? 'document_upload' : 'standard';
          return {
            id: (task && task.id) || (stepId + '_task_' + (taskIndex + 1)),
            label: typeof task === 'string' ? task : (task.label || task.name || ''),
            kind: kind,
            required: typeof task === 'string' ? true : task.required !== false,
            documentTypeId: kind === 'document_upload' ? (task.documentTypeId || '') : '',
            allowMultiple: kind === 'document_upload' ? task.allowMultiple !== false : false,
            minimumFiles: kind === 'document_upload' ? Math.max(1, parseInt(task.minimumFiles, 10) || 1) : 1
          };
        }),
        anexeIds: Array.isArray(step.anexeIds) ? step.anexeIds.slice() : legacyFlowAnexe(source.id, index)
      });
    });
    if (!definition.steps.length) {
      var fallbackStepId = source.id + '_step_1';
      definition.steps = [{
        id: fallbackStepId,
        name: 'Lucru',
        offsetDays: 10,
        tasks: defaultFlowTasks('Lucru', 0).map(function (label, taskIndex) {
          return { id: fallbackStepId + '_task_' + (taskIndex + 1), label: label, kind: 'standard', required: true, documentTypeId: '', allowMultiple: false, minimumFiles: 1 };
        }),
        anexeIds: legacyFlowAnexe(source.id, 0)
      }];
    }
    return definition;
  }

  function mergeFlowWorkspaceCollection(collectionName, records, situationId) {
    var collection = MOCK[collectionName] || [];
    (records || []).forEach(function (record) {
      var prepared = Object.assign({}, record, { situationId: situationId });
      var existingIndex = collection.findIndex(function (candidate) {
        return String(candidate.id) === String(prepared.id);
      });
      if (existingIndex >= 0) collection[existingIndex] = Object.assign({}, collection[existingIndex], prepared);
      else collection.push(prepared);
    });
    MOCK[collectionName] = collection;
  }

  function mergeFlowWorkspaceContent(item) {
    mergeFlowWorkspaceCollection('documents', item.documents, item.id);
    mergeFlowWorkspaceCollection('messages', item.messages, item.id);
  }

  function prepareFlowWorkspace(item, vertical) {
    var definition = normalizedFlowDefinition(item, vertical);
    var total = definition.steps.length;
    item.currentStep = Math.max(1, Math.min(parseInt(item.currentStep, 10) || 1, total));
    item.totalSteps = total;
    item.stepsCompleted = Math.max(0, parseInt(item.stepsCompleted, 10) || 0);
    item.clientCompany = item.clientName || item.clientCompany || '—';
    item.clientContact = item.clientContact || 'Contact client';
    item.typeId = item.templateId;
    item.typeName = item.templateName || definition.name;
    item.typeLabel = item.name;
    item.titularId = (item.responsibleIds || [])[0] || currentUserId;
    var titular = MOCK.employees.find(function (employee) { return employee.id === item.titularId; });
    item.titularName = titular ? titular.name : (currentUser.fullName || currentUser.name);
    item.responsibleStepId = item.titularId;
    item.responsibleStepName = item.titularName;
    item.activeHelpers = item.activeHelpers || {};
    item.helperRequests = item.helperRequests || [];
    item.flowDefinition = definition;
    item.flowVerticalId = vertical.id;
    item.flowItemLabel = vertical.itemLabel || 'Flux';
    item.__isFlowWorkspace = true;
    mergeFlowWorkspaceContent(item);

    var previousTasks = item.tasks || {};
    var tasks = {};
    definition.steps.forEach(function (step, stepIndex) {
      var key = 'step' + (stepIndex + 1);
      if (!Array.isArray(item.activeHelpers[key])) item.activeHelpers[key] = [];
      var previous = previousTasks[key] || [];
      var allDone = item.status === 'inchisa' || item.status === 'finalizat' || (stepIndex + 1) < item.currentStep;
      tasks[key] = (step.tasks || []).map(function (task, taskIndex) {
        var old = previous.find(function (candidate) { return String(candidate.id) === String(task.id); }) || previous[taskIndex] || null;
        return Object.assign({
          id: task.id,
          label: task.label,
          kind: task.kind || 'standard',
          required: task.required !== false,
          documentTypeId: task.documentTypeId || '',
          allowMultiple: task.kind === 'document_upload' ? task.allowMultiple !== false : false,
          minimumFiles: task.kind === 'document_upload' ? Math.max(1, parseInt(task.minimumFiles, 10) || 1) : 1,
          completed: allDone,
          assigneeId: allDone ? item.titularId : null,
          completedAt: allDone ? '2026-04-15T10:00:00' : null,
          observation: '',
          needsSeniorAttention: false,
          attachments: []
        }, old || {}, {
          label: task.label,
          kind: task.kind || 'standard',
          required: task.required !== false,
          documentTypeId: task.documentTypeId || '',
          allowMultiple: task.kind === 'document_upload' ? task.allowMultiple !== false : false,
          minimumFiles: task.kind === 'document_upload' ? Math.max(1, parseInt(task.minimumFiles, 10) || 1) : 1
        });
      });
    });
    item.tasks = tasks;
    definition.steps.forEach(function (step, index) {
      item['deadlineStep' + (index + 1)] = addDaysISO(item.startDate, step.offsetDays);
    });
    return item;
  }

  function addDaysISO(iso, days) {
    var date = new Date(String(iso || '') + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + (parseInt(days, 10) || 0));
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function markFlowNavActive(verticalId) {
    var item = document.querySelector('[data-nav="flux-' + verticalId + '"]');
    if (!item) return;
    document.querySelectorAll('.sidebar__nav .nav-item').forEach(function (navItem) {
      navItem.classList.remove('nav-item--active');
      var icon = navItem.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.remove('filled');
    });
    item.classList.add('nav-item--active');
    var activeIcon = item.querySelector('.material-symbols-outlined');
    if (activeIcon) activeIcon.classList.add('filled');
  }

  function applyWorkspaceCopy() {
    if (currentWorkspaceKind !== 'flux') return;
    var noun = String(currentSituation.flowItemLabel || 'flux').toLowerCase();
    var definiteNoun = workspaceDefiniteNoun(currentSituation);
    var cancelTitle = document.getElementById('modal-anulare-title');
    if (cancelTitle) cancelTitle.textContent = 'Anulare ' + noun;
    var cancelBody = document.querySelector('#modal-anulare .modal__body > .modal__subtitle');
    if (cancelBody) cancelBody.textContent = 'Această acțiune va anula permanent ' + definiteNoun + '. Toți utilizatorii implicați vor fi notificați. Anularea nu poate fi revocată.';
    var cancelSubmit = document.querySelector('#modal-anulare [data-modal-submit]');
    if (cancelSubmit) cancelSubmit.textContent = 'Anulează ' + definiteNoun;
    var senior = document.querySelector('#modal-task-complete [name="senior"]');
    if (senior && senior.parentNode) senior.parentNode.lastChild.textContent = ' Necesită atenția unui responsabil senior la validare';
  }

  /* ---------- Rendering ---------- */

  function render() {
    renderTopbar();
    renderCancelledBanner();
    renderHelperRequestBanner();
    renderStepBanner();
    renderTaskPanel();
    renderClientPending();
    renderChat();
    renderComposer();
    renderDebugBar();
  }

  function isClosedStatus(s) {
    return !!s && (s.status === 'anulata' || s.status === 'inchisa' || s.status === 'finalizat');
  }

  function workDefinition(s) {
    if (s && s.flowDefinition) return s.flowDefinition;
    return (MOCK.situationTypes || []).find(function (type) { return type.id === s.typeId; }) || null;
  }

  function workspaceNoun(s) {
    return currentWorkspaceKind === 'flux'
      ? String((s && s.flowItemLabel) || 'flux').toLowerCase()
      : String((typeof window.scripticaEffectiveVertical === 'function'
        ? (window.scripticaEffectiveVertical('vert_contabil') || {}).itemLabel
        : 'Situație') || 'Situație').toLowerCase();
  }

  function workspaceDefiniteNoun(s) {
    var noun = workspaceNoun(s);
    var labels = {
      dosar: 'dosarul',
      proiect: 'proiectul',
      flux: 'fluxul',
      situație: 'situația',
      misiune: 'misiunea',
      cerere: 'cererea',
      lucrare: 'lucrarea',
      element: 'elementul'
    };
    return labels[noun] || noun;
  }

  function persistFlowWorkspace() {
    if (currentWorkspaceKind !== 'flux' || typeof window.scripticaFlowSave !== 'function') return;
    var record = Object.assign({}, currentSituation);
    delete record.flowDefinition;
    delete record.__isFlowWorkspace;
    delete record.flowItemLabel;
    delete record.flowVerticalId;
    window.scripticaFlowSave('flowItem', record);
  }

  function getClientFacingStatus(s) {
    if (!s) return '';
    if (s.status === 'asteapta_documente') return 'Ai documente de trimis';
    if (s.status === 'in_verificare')      return 'În lucru la contabil';
    if (s.status === 'inchisa')             return 'Finalizat';
    if (s.status === 'anulata')             return 'Anulat';
    if (s.status === 'intarziere')          return 'În întârziere';
    return 'În lucru';
  }

  /* Client-only "Ce are nevoie contabilul tău" section.
     Injected just before the docs section when view=client. */
  function renderClientPending() {
    var s = currentSituation;
    var existing = document.getElementById('client-pending-section');
    if (typeof getCurrentView !== 'function' || getCurrentView() !== 'client') {
      if (existing) existing.remove();
      return;
    }
    var pending = s.clientPending || [];
    if (!pending.length) {
      if (existing) existing.remove();
      return;
    }

    var section = existing || document.createElement('section');
    section.id = 'client-pending-section';
    section.className = 'client-pending';
    section.setAttribute('data-client-only', '');

    var itemsHtml = pending.map(function (item) {
      return '<li class="client-pending__item">' +
        '<span class="client-pending__bullet" aria-hidden="true"></span>' +
        '<span class="client-pending__label">' + esc(item.label) + '</span>' +
        '<span class="client-pending__meta">cerut ' + esc(formatDate(item.requested)) + '</span>' +
      '</li>';
    }).join('');

    section.innerHTML =
      '<header class="client-pending__header">' +
        '<h2 class="client-pending__title">Ce are nevoie contabilul tău de la tine</h2>' +
        '<p class="client-pending__attribution">' +
          '<span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>' +
          'Cerințe identificate automat din conversație' +
        '</p>' +
      '</header>' +
      '<ul class="client-pending__list">' + itemsHtml + '</ul>' +
      '<button class="btn btn--primary client-pending__action" type="button" data-action="upload-for-pending">' +
        '<span class="material-symbols-outlined" aria-hidden="true">upload_file</span>' +
        'Trimite documente' +
      '</button>';

    if (!existing) {
      var stepCard = document.querySelector('.step-card');
      var docs = document.getElementById('docs-section');
      if (stepCard && stepCard.parentNode) {
        stepCard.parentNode.insertBefore(section, docs || stepCard.nextSibling);
      }
    }

    var uploadBtn = section.querySelector('[data-action="upload-for-pending"]');
    if (uploadBtn) uploadBtn.onclick = function () {
      if (typeof showToast === 'function') showToast('info', 'Funcție disponibilă în versiunea finală.');
      else console.log('[Scriptica] Upload documents — demo stub.');
    };
  }

  function renderTopbar() {
    var el = document.getElementById('detail-topbar');
    if (!el) return;
    var s = currentSituation;

    var isClient = typeof getCurrentView === 'function' && getCurrentView() === 'client';
    var clientActiveCount = 0;
    if (isClient) {
      var c = (MOCK.clients || []).find(function (x) { return x.id === MOCK.currentClientId; });
      if (c) {
        clientActiveCount = MOCK.situations.filter(function (x) {
          return (c.situationIds || []).indexOf(x.id) !== -1 &&
            x.status !== 'inchisa' && x.status !== 'anulata';
        }).length;
      }
    }
    var hideBack = isClient && clientActiveCount <= 1;

    el.innerHTML =
      (hideBack ? '' :
        '<button type="button" class="detail-topbar__back" id="btn-back" aria-label="Înapoi">' +
          '<span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>' +
        '</button>') +
      '<h1 class="detail-topbar__title">' + esc(s.clientCompany) + ' — ' + esc(s.typeLabel) + '</h1>';

    var backBtn = document.getElementById('btn-back');
    if (!backBtn) return;
    backBtn.addEventListener('click', function () {
      if (currentWorkspaceKind === 'flux') {
        window.location.href = 'flux.html?vertical=' + encodeURIComponent(s.flowVerticalId);
        return;
      }
      if (isClient) {
        window.location.href = 'acasa.html?view=client';
        return;
      }
      // If referrer is an in-app page, go back to it. Otherwise fall back
      // to the situations list.
      var ref = document.referrer || '';
      var sameOrigin = ref && (function () {
        try { return new URL(ref).origin === window.location.origin; }
        catch (e) { return false; }
      })();
      if (sameOrigin && /\/(acasa|situatii|arhiva|situatie-detaliu)(\.html)?(\?|#|\/?$)/.test(ref)) {
        history.back();
      } else {
        window.location.href = 'situatii.html';
      }
    });
  }

  function renderCancelledBanner() {
    var el = document.getElementById('cancelled-banner');
    if (!el) return;
    var s = currentSituation;
    if (s.status !== 'anulata') {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'flex';
    el.innerHTML =
      '<span class="material-symbols-outlined cancelled-banner__icon filled">cancel</span>' +
      '<div>' +
        '<div class="cancelled-banner__title">' + (currentWorkspaceKind === 'flux' ? 'Acest flux a fost anulat.' : 'Această situație a fost anulată.') + '</div>' +
        '<div class="cancelled-banner__reason">Motiv: ' + esc(s.cancellationReason || '—') + '</div>' +
      '</div>';
  }

  function renderHelperRequestBanner() {
    var el = document.getElementById('helper-request-banner');
    if (!el) return;
    var s = currentSituation;
    var pending = (s.helperRequests || []).find(function (r) {
      return r.helperId === currentUserId && r.status === 'pending';
    });
    if (!pending || isClosedStatus(s)) {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    var requester = MOCK.employees.find(function (u) { return u.id === pending.requesterId; });
    el.style.display = 'flex';
    el.innerHTML =
      '<div class="helper-request-banner__main">' +
        '<div class="helper-request-banner__title">' +
          esc((requester && requester.name) || 'Un coleg') + ' ți-a cerut asistență pentru acest pas.' +
        '</div>' +
        (pending.note ? '<div class="helper-request-banner__note">Notă: ' + esc(pending.note) + '</div>' : '') +
      '</div>' +
      '<div class="helper-request-banner__actions">' +
        '<button class="btn btn--primary" type="button" data-accept-helper="' + pending.id + '">Acceptă</button>' +
        '<button class="btn btn--ghost"   type="button" data-decline-helper="' + pending.id + '">Refuză</button>' +
      '</div>';
    el.querySelector('[data-accept-helper]').addEventListener('click', function () {
      acceptHelper(pending);
    });
    el.querySelector('[data-decline-helper]').addEventListener('click', function () {
      declineHelper(pending);
    });
  }

  function renderStepBanner() {
    var el = document.getElementById('step-banner');
    if (!el) return;
    var s = currentSituation;

    el.classList.toggle('is-disabled', isClosedStatus(s));

    // Client-view: show a simplified status + deadline, no step mechanics.
    if (typeof getCurrentView === 'function' && getCurrentView() === 'client') {
      var deadline = s.deadlineStep3 || s.deadlineStep2 || s.deadlineStep1;
      el.innerHTML =
        '<div class="step-banner__client-row">' +
          '<div class="step-banner__client-status">' + esc(getClientFacingStatus(s)) + '</div>' +
          '<div class="step-banner__client-deadline">Scadență: ' + esc(formatDate(deadline)) + '</div>' +
        '</div>';
      return;
    }

    var stepInfo = { name: currentStepName(s), number: s.currentStep };
    var stepKey = 'step' + s.currentStep;

    // Responsible person / team
    var responsiblePeople = currentWorkspaceKind === 'flux'
      ? (s.responsibleIds || []).map(function (id) {
          return MOCK.employees.find(function (employee) { return employee.id === id; });
        }).filter(Boolean)
      : [MOCK.employees.find(function (u) { return u.id === s.responsibleStepId; })].filter(Boolean);
    var avatarsHtml = responsiblePeople.map(function (person, index) {
      return avatarHtml(person, index === 0 ? 'avatar' : 'avatar avatar--sm');
    }).join('');

    // Helpers (active on current step)
    var helpers = ((s.activeHelpers || {})[stepKey] || [])
      .map(function (uid) { return MOCK.employees.find(function (u) { return u.id === uid; }); })
      .filter(Boolean);
    helpers.filter(function (helper) {
      return !responsiblePeople.some(function (person) { return person.id === helper.id; });
    }).forEach(function (h) {
      avatarsHtml += avatarHtml(h, 'avatar avatar--sm');
    });

    var ttEnabled = (MOCK.timeTrackingEnabled !== false);
    var active = window.ScripticaTimer ? window.ScripticaTimer.read() : null;
    var isRunningHere = !!(active && active.situationId === s.id);

    var timerBtnHtml = '';
    if (ttEnabled) {
      if (isRunningHere) {
        timerBtnHtml =
          '<button class="timer-btn is-running" type="button" id="timer-action" title="Cronometru activ — apasă pentru a opri" aria-label="Oprește cronometrul">' +
            '<span class="material-symbols-outlined filled" aria-hidden="true">timer</span>' +
          '</button>';
      } else {
        timerBtnHtml =
          '<button class="timer-btn" type="button" id="timer-action" title="Pornește cronometrarea" aria-label="Pornește cronometrarea">' +
            '<span class="material-symbols-outlined filled" aria-hidden="true">timer</span>' +
          '</button>';
      }
    }

    el.innerHTML =
      '<div class="step-banner__row">' +
        '<div class="step-banner__left">' +
          '<span class="step-banner__pill">Pasul ' + s.currentStep + '/' + totalStepsFor(s) + '</span>' +
          '<span class="step-banner__sep">•</span>' +
          '<span class="step-banner__name">' + esc(stepInfo.name) + '</span>' +
        '</div>' +
        '<div class="step-banner__right">' +
          '<div class="avatars-cluster" aria-label="Echipă pas">' + avatarsHtml + '</div>' +
          timerBtnHtml +
        '</div>' +
      '</div>' +
      '<p class="step-banner__help-text">Pentru a finaliza acest pas, confirmați că toate verificările și acțiunile necesare au fost efectuate.</p>';

    var timerBtn = document.getElementById('timer-action');
    if (timerBtn) {
      timerBtn.addEventListener('click', function () {
        if (isRunningHere) {
          if (window.ScripticaTimer) window.ScripticaTimer.stop();
        } else {
          openTimerPicker();
        }
      });
    }
  }

  function renderTaskPanel() {
    var el = document.getElementById('task-panel');
    if (!el) return;
    var s = currentSituation;
    var stepKey = 'step' + s.currentStep;
    var tasks = (s.tasks && s.tasks[stepKey]) ? s.tasks[stepKey] : [];
    var role = currentUserRole();

    var readonly = isClosedStatus(s) || role === 'viewer';
    el.classList.toggle('is-readonly', readonly);

    var anexeHtml = '<div class="task-panel__anexe" id="anexe-cards"></div>';

    var listHtml = '<div class="task-panel__list">' +
      tasks.map(taskRowHtml).join('') +
    '</div>';

    var canAct = (role === 'responsible') && !readonly;

    var allDone = tasks.filter(function (t) { return t.required !== false; }).every(taskRequirementComplete);

    var stepAnexe = window.SCRIPTICA_ANEXE ? window.SCRIPTICA_ANEXE.getStepAnexe(s) : [];
    var anexeOk = window.SCRIPTICA_ANEXE ? window.SCRIPTICA_ANEXE.allComplete(s) : true;
    var canFinalize = allDone && anexeOk;
    var blockMsg = stepAnexe.length
      ? 'Finalizați toate task-urile și anexele pentru a trece la pasul următor.'
      : 'Finalizați toate task-urile pentru a trece la pasul următor.';

    var actionsHtml =
      '<div class="step-actions">' +
        (canAct ?
          '<button type="button" class="btn btn--critical" id="btn-anulare">' +
            '<span class="material-symbols-outlined" aria-hidden="true">cancel</span>' +
            'Anulează ' + esc(workspaceDefiniteNoun(s)) +
          '</button>' : '<span></span>') +
        (canAct ?
          '<div class="step-actions__center">' +
            '<button type="button" class="btn btn--pending" id="btn-asistenta">' +
              '<span class="material-symbols-outlined" aria-hidden="true">help_outline</span>' +
              'Cere asistență' +
            '</button>' +
          '</div>' : '<div class="step-actions__center"></div>') +
        (canAct ?
          '<button type="button" class="btn btn--primary" id="btn-finalizare"' +
            (canFinalize ? '' : ' disabled title="' + esc(blockMsg) + '"') + '>' +
            'Finalizează pasul' +
            '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' +
          '</button>' : '<span></span>') +
      '</div>';

    el.innerHTML = anexeHtml + listHtml + (readonly ? '' : actionsHtml);

    // Anexă cards for the current step (hidden in client view).
    // The panel's readonly decision (status + viewer role) carries over
    // so the fill modal opens read-only for non-participants too.
    if (window.SCRIPTICA_ANEXE) {
      window.SCRIPTICA_ANEXE.renderCards(document.getElementById('anexe-cards'), s, { readonly: readonly });
    }

    // Bind task checkboxes
    el.querySelectorAll('[data-task-toggle]').forEach(function (cb) {
      cb.addEventListener('change', function (e) {
        onTaskToggle(e, cb);
      });
    });
    el.querySelectorAll('[data-task-upload]').forEach(function (button) {
      button.addEventListener('click', function () { onUploadTask(button); });
    });

    // Bind step actions
    if (canAct) {
      var anulBtn = document.getElementById('btn-anulare');
      if (anulBtn) anulBtn.addEventListener('click', openAnulareModal);
      var asistBtn = document.getElementById('btn-asistenta');
      if (asistBtn) asistBtn.addEventListener('click', openAsistentaModal);
      var finBtn = document.getElementById('btn-finalizare');
      if (finBtn && !finBtn.disabled) finBtn.addEventListener('click', onFinalizeStep);
    }
  }

  function taskRowHtml(t) {
    var assignee = t.assigneeId ? MOCK.employees.find(function (e) { return e.id === t.assigneeId; }) : null;

    var indicators = '';
    var indBits = [];
    if (t.observation && t.observation.length) {
      indBits.push('<span class="task-indicator" title="' + esc(t.observation) + '"><span class="material-symbols-outlined">notes</span></span>');
    }
    if (t.needsSeniorAttention) {
      indBits.push('<span class="task-indicator task-indicator--senior" title="Necesită atenția contabilului senior"><span class="material-symbols-outlined">priority_high</span></span>');
    }
    if (t.attachments && t.attachments.length) {
      indBits.push('<span class="task-indicator task-indicator--attach" title="' + t.attachments.length + ' atașament(e)">' +
        '<span class="material-symbols-outlined">attach_file</span>' +
        '<span class="count">' + t.attachments.length + '</span>' +
      '</span>');
    }
    if (indBits.length) indicators = '<span class="task-indicators">' + indBits.join('') + '</span>';

    var assigneeBlock = '';
    if (t.completed && assignee) {
      assigneeBlock =
        '<span class="task-assignee-cluster">' +
          avatarHtml(assignee, 'avatar avatar--xs') +
          esc(shortName(assignee.name)) +
          '<span class="material-symbols-outlined filled" aria-hidden="true">check_circle</span>' +
        '</span>';
    }

    var timeBlock = '';
    if (MOCK.timeTrackingEnabled !== false && typeof MOCK.getTaskTimeByUser === 'function') {
      var userTimes = MOCK.getTaskTimeByUser(t.id, currentSituation.id);
      if (userTimes.length) {
        timeBlock = '<span class="task-time-cluster">' +
          userTimes.map(function (ut) {
            var user = MOCK.employees.find(function (e) { return e.id === ut.userId; });
            if (!user) return '';
            var label = formatHoursMinutes(ut.seconds);
            return '<span class="task-time" title="' + esc(user.name) + ': ' + esc(label) + '">' +
              avatarHtml(user, 'avatar avatar--pill') +
              '<span class="task-time__label">' + esc(label) + '</span>' +
            '</span>';
          }).join('') +
        '</span>';
      }
    }

    if (isUploadTask(t)) {
      var uploadCount = (t.attachments || []).length;
      var uploadLabel = t.completed ? 'Document încărcat' : (t.allowMultiple === false ? 'Încarcă documentul' : 'Încarcă documentele');
      return '<div class="task-detail-row task-detail-row--upload' + (t.completed ? ' is-complete' : '') + '" data-task-id="' + esc(t.id) + '">' +
        '<button type="button" class="task-detail-row__upload-action" data-task-upload aria-label="' + esc(uploadLabel + ' pentru ' + t.label) + '">' +
          '<span class="material-symbols-outlined" aria-hidden="true">' + (t.completed ? 'check_circle' : 'upload_file') + '</span>' +
        '</button>' +
        '<span class="task-detail-row__label' + (t.completed ? ' is-done' : '') + '">' + esc(t.label) +
          ' <span class="pill pill--neutral">Încărcare document</span>' +
          (t.required === false ? ' <span class="pill pill--neutral">Opțional</span>' : '') +
          '<small class="task-detail-row__upload-copy">' + esc(t.completed ? uploadCount + (uploadCount === 1 ? ' fișier încărcat' : ' fișiere încărcate') + ' · poți actualiza documentele' : uploadLabel) + '</small></span>' +
        timeBlock + indicators + assigneeBlock +
      '</div>';
    }

    return '<label class="task-detail-row" data-task-id="' + esc(t.id) + '">' +
      '<input type="checkbox" data-task-toggle ' + (t.completed ? 'checked' : '') + '>' +
      '<span class="task-detail-row__label' + (t.completed ? ' is-done' : '') + '">' + esc(t.label) +
        (t.required === false ? ' <span class="pill pill--neutral">Opțional</span>' : '') + '</span>' +
      timeBlock +
      indicators +
      assigneeBlock +
    '</label>';
  }

  function isUploadTask(task) {
    return !!task && task.kind === 'document_upload';
  }

  function taskRequirementComplete(task) {
    if (!task || !task.completed) return false;
    if (!isUploadTask(task)) return true;
    return (task.attachments || []).length >= Math.max(1, parseInt(task.minimumFiles, 10) || 1);
  }

  function formatHoursMinutes(seconds) {
    var total = Math.max(0, Math.round(seconds / 60));
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h === 0) return m + 'm';
    return h + 'h ' + m + 'm';
  }

  function renderChat() {
    var listEl = document.getElementById('messaging-list');
    var countEl = document.querySelector('.messaging [data-messaging-count]');
    if (!listEl) return;

    var msgs = MOCK.messages.filter(function (m) { return m.situationId === currentSituation.id; });
    if (countEl) {
      var unread = msgs.filter(function (m) { return !m.read; }).length;
      countEl.textContent = '(' + unread + ')';
    }

    if (!msgs.length) {
      listEl.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined" aria-hidden="true">inbox</span><p>Nu ai mesaje pentru acest ' + esc(workspaceNoun(currentSituation)) + '.</p></div>';
      return;
    }

    listEl.innerHTML = msgs.map(messageCardHtml).join('');
  }

  function renderComposer() {
    var el = document.getElementById('composer');
    if (!el) return;
    el.innerHTML =
      '<textarea class="composer__textarea" id="composer-text" rows="2" placeholder="scrie în chat..."></textarea>' +
      '<div class="composer__row">' +
        '<div class="composer__doc-wrap">' +
          '<button class="composer__doc-btn" type="button" id="composer-doc" aria-label="Referință document" aria-haspopup="listbox" aria-expanded="false">' +
            '<span class="material-symbols-outlined" aria-hidden="true">attach_file</span>' +
          '</button>' +
          '<div class="chat-attach-popover" id="composer-docpicker" role="dialog" aria-label="Atașează document">' +
            '<div class="chat-attach-popover__search">' +
              '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
              '<input type="search" class="chat-attach-popover__search-input" id="composer-attach-search" placeholder="Caută document..." autocomplete="off">' +
            '</div>' +
            '<div class="chat-attach-popover__list" id="composer-attach-list" role="listbox"></div>' +
            '<button type="button" class="chat-attach-popover__upload" id="composer-attach-upload">' +
              '<span class="material-symbols-outlined" aria-hidden="true">upload_file</span>' +
              '<span>Încarcă document nou</span>' +
            '</button>' +
            '<input type="file" id="composer-attach-file" class="sr-only" hidden accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx">' +
          '</div>' +
        '</div>' +
        '<button class="composer__send" type="button" id="composer-send" aria-label="Trimite" disabled>' +
          '<span class="material-symbols-outlined filled" aria-hidden="true">send</span>' +
        '</button>' +
      '</div>';

    var text = document.getElementById('composer-text');
    var send = document.getElementById('composer-send');
    var docBtn = document.getElementById('composer-doc');
    var popover = document.getElementById('composer-docpicker');
    var searchInput = document.getElementById('composer-attach-search');
    var listEl = document.getElementById('composer-attach-list');
    var uploadBtn = document.getElementById('composer-attach-upload');
    var fileInput = document.getElementById('composer-attach-file');

    var focusIdx = -1;   // -1 = no focus in list; equals list length → upload button focused
    var filtered = [];

    function situationDocs() {
      return (MOCK.documents || []).filter(function (d) {
        return d.situationId === currentSituation.id;
      });
    }

    function filterDocs(q) {
      var docs = situationDocs();
      if (!q) return docs;
      var needle = normalizeForSearch(q);
      return docs.filter(function (d) {
        return normalizeForSearch(d.filename).indexOf(needle) !== -1;
      });
    }

    function itemIcon(src) {
      if (src === 'email') return 'mail';
      if (src === 'whatsapp') return 'chat';
      if (src === 'upload') return 'upload_file';
      if (src === 'generat') return 'auto_awesome';
      return 'description';
    }

    function renderList() {
      if (!filtered.length) {
        listEl.innerHTML = '<div class="chat-attach-popover__empty">' +
          (searchInput.value.trim() ? 'Niciun document găsit pentru „' + esc(searchInput.value.trim()) + '".' :
            'Nu există documente pentru acest element de lucru.') +
        '</div>';
        return;
      }
      listEl.innerHTML = filtered.map(function (d, i) {
        var ref = makeDocRef(d.filename);
        var focused = i === focusIdx ? ' chat-attach-popover__item--focused' : '';
        return '<button type="button" class="chat-attach-popover__item' + focused + '" data-doc-idx="' + i + '" role="option">' +
          '<span class="material-symbols-outlined chat-attach-popover__item-icon" aria-hidden="true">' + itemIcon(d.source) + '</span>' +
          '<span class="chat-attach-popover__item-name">@' + esc(ref) + '</span>' +
        '</button>';
      }).join('');
      listEl.querySelectorAll('[data-doc-idx]').forEach(function (btn) {
        btn.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var i = parseInt(btn.getAttribute('data-doc-idx'), 10);
          selectDoc(filtered[i]);
        });
      });
      // Scroll focused into view
      if (focusIdx >= 0) {
        var el = listEl.querySelector('.chat-attach-popover__item--focused');
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      }
    }

    function setUploadFocused(on) {
      uploadBtn.classList.toggle('chat-attach-popover__upload--focused', !!on);
    }

    function open() {
      filtered = filterDocs(searchInput.value);
      focusIdx = -1;
      setUploadFocused(false);
      renderList();
      popover.classList.add('is-open');
      docBtn.setAttribute('aria-expanded', 'true');
      setTimeout(function () { searchInput.focus(); }, 0);
    }

    function close() {
      popover.classList.remove('is-open');
      popover.classList.remove('is-dragover');
      docBtn.setAttribute('aria-expanded', 'false');
    }

    function selectDoc(d) {
      if (!d) return;
      insertAtCursor(text, '@' + makeDocRef(d.filename) + ' ');
      send.disabled = text.value.trim().length === 0;
      close();
      setTimeout(function () { text.focus(); }, 0);
    }

    function moveFocus(delta) {
      // Navigation range: -1 (nothing) ... filtered.length (upload button)
      var max = filtered.length; // last index is upload button
      var next = focusIdx + delta;
      if (next < 0) next = -1;
      if (next > max) next = max;
      focusIdx = next;
      setUploadFocused(focusIdx === max && max >= 0);
      renderList();
    }

    function activateFocused() {
      if (focusIdx === filtered.length) {
        fileInput.click();
      } else if (focusIdx >= 0 && filtered[focusIdx]) {
        selectDoc(filtered[focusIdx]);
      }
    }

    text.addEventListener('input', function () {
      send.disabled = text.value.trim().length === 0;
    });
    send.addEventListener('click', function () {
      sendMessage(text.value);
      text.value = '';
      send.disabled = true;
    });

    docBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (popover.classList.contains('is-open')) close();
      else open();
    });

    searchInput.addEventListener('input', function () {
      filtered = filterDocs(searchInput.value);
      focusIdx = -1;
      setUploadFocused(false);
      renderList();
    });

    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); activateFocused(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); text.focus(); }
    });

    uploadBtn.addEventListener('click', function () {
      fileInput.click();
    });

    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files.length) handleAttachUpload(fileInput.files[0]);
      fileInput.value = '';
    });

    /* Drag-and-drop onto the popover */
    popover.addEventListener('dragover', function (e) {
      e.preventDefault();
      popover.classList.add('is-dragover');
    });
    popover.addEventListener('dragleave', function (e) {
      if (e.target === popover) popover.classList.remove('is-dragover');
    });
    popover.addEventListener('drop', function (e) {
      e.preventDefault();
      popover.classList.remove('is-dragover');
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleAttachUpload(f);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.composer__doc-wrap')) close();
    });

    function handleAttachUpload(file) {
      close();
      showToast('info', 'Documentul „' + file.name + '” este în procesare...');
      setTimeout(function () {
        var verticalId = currentSituation.verticalId || 'vert_contabil';
        var categories = typeof window.scripticaDocumentCategoriesForVertical === 'function'
          ? window.scripticaDocumentCategoriesForVertical(verticalId) : [];
        var template = (MOCK.superAdmin.flowTemplates || []).find(function (item) { return item.id === currentSituation.templateId; });
        var visibleIds = (template && template.documentCategoryIds) || categories.map(function (category) { return category.id; });
        var initialCategory = categories.find(function (category) {
          return !category.system && visibleIds.indexOf(category.id) !== -1 && (category.documentTypes || []).length;
        }) || { id: 'necategorisit', documentTypes: [] };
        var initialType = initialCategory.documentTypes[0] ? initialCategory.documentTypes[0].name : 'Altele';
        var newDoc = {
          id: 'doc_upload_' + Date.now(),
          situationId: currentSituation.id,
          domain: currentSituation.domain || 'contabil',
          filename: file.name,
          uploadedAt: new Date().toISOString(),
          source: 'upload',
          pagesCount: 1,
          multiDoc: false, multiDocConfidence: null,
          tipDocument: initialType,
          emitent: 'În analiză',
          numarDocument: null,
          dataEmiterii: null,
          perioadaFiscala: null,
          valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: 'RON',
          categoriePropusa: initialType,
          broadCategory: initialCategory.id,
          subFilter: null,
          confidenceExtraction: 92,
          confidenceCategorization: 94,
          observatieAI: 'Document încărcat de utilizator, clasificare inițială.',
          verificat: true, verificatManual: false,
          pageThumbnails: []
        };
        MOCK.documents.unshift(newDoc);
        insertAtCursor(text, '@' + makeDocRef(file.name) + ' ');
        send.disabled = text.value.trim().length === 0;
        showToast('success', 'Documentul „' + file.name + '" a fost atașat.');
        if (typeof window.SCRIPTICA_DOCS_REFRESH === 'function') {
          window.SCRIPTICA_DOCS_REFRESH();
        }
        text.focus();
      }, 2000);
    }
  }

  function makeDocRef(filename) {
    return String(filename || '')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  function normalizeForSearch(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /* Bară de dezvoltare — apare doar cu ?debug=1 în URL, ca să nu fie
     vizibilă în demo-urile live. */
  function debugModeEnabled() {
    try { return new URLSearchParams(window.location.search).get('debug') === '1'; } catch (e) { return false; }
  }

  function renderDebugBar() {
    var el = document.getElementById('debug-bar');
    if (!el) return;
    if (currentWorkspaceKind === 'flux' || !debugModeEnabled()) {
      el.hidden = true;
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.style.display = '';
    // Find a situation where the current user has a pending help request
    var helperTarget = MOCK.situations.find(function (s) {
      return s.id !== currentSituation.id && (s.helperRequests || []).some(function (r) {
        return r.helperId === currentUserId && r.status === 'pending';
      });
    });
    // And a demo situation as a responsible
    var responsibleTarget = MOCK.situations.find(function (s) {
      return s.id !== currentSituation.id && s.responsibleStepId === currentUserId &&
        s.status !== 'anulata' && s.status !== 'inchisa';
    });
    var links = [];
    if (responsibleTarget) links.push('<a href="?id=' + responsibleTarget.id + '">Situație unde sunt responsabilă (' + responsibleTarget.id + ')</a>');
    if (helperTarget)      links.push('<a href="?id=' + helperTarget.id + '">Situație cu cerere de asistență activă pentru mine (' + helperTarget.id + ')</a>');
    if (!links.length) { el.style.display = 'none'; return; }
    el.innerHTML = 'DEBUG · Vizualizări demo: ' + links.join(' · ');
  }

  /* ---------- Message rendering ---------- */

  function messageCardHtml(m) {
    if (m.sender === 'system' && m.subtype === 'step_completion')  return systemStepHtml(m);
    if (m.sender === 'system' && m.subtype === 'helper_request')   return systemHelperReqHtml(m);
    if (m.sender === 'system' && m.subtype === 'helper_response')  return systemHelperResHtml(m);
    if (m.sender === 'system' && m.subtype === 'situation_cancelled') return systemCancelledHtml(m);
    return standardMessageHtml(m);
  }

  function systemStepHtml(m) {
    return '<article class="message-card message-card--step-completion">' +
      '<div class="step-completion__header">' +
        '<span class="material-symbols-outlined step-completion__icon filled" aria-hidden="true">check_circle</span>' +
        '<span class="step-completion__title">' + m.stepCompleted + ' ' + esc(m.stepName) + '</span>' +
      '</div>' +
      (m.summary ? '<div class="step-completion__summary">' + esc(m.summary) + '</div>' : '') +
      '<div class="step-completion__meta">' +
        '<span class="step-completion__responsible">Responsabil: ' + esc(m.completedBy) + '</span>' +
        '<span class="step-completion__finalized">Finalizat ' + formatDate(m.date) + '</span>' +
      '</div>' +
    '</article>';
  }

  function systemHelperReqHtml(m) {
    return '<article class="message-card message-card--system-helper-req">' +
      '<div class="message-card__sys-head">' +
        '<span class="material-symbols-outlined" aria-hidden="true">help_outline</span>' +
        esc(m.requesterName) + ' a cerut asistență' +
      '</div>' +
      (m.note ? '<div class="message-card__body">„' + esc(m.note) + '”</div>' : '') +
      '<div class="message-card__contact">Adresat către ' + esc(m.helperName) + ' • ' + formatDate(m.date) + '</div>' +
    '</article>';
  }

  function systemHelperResHtml(m) {
    var iconCls = m.accepted ? 'accepted' : 'declined';
    var iconName = m.accepted ? 'check_circle' : 'cancel';
    var verb = m.accepted ? 'acceptat' : 'refuzat';
    return '<article class="message-card message-card--system-helper-res">' +
      '<div class="message-card__sys-head">' +
        '<span class="material-symbols-outlined filled ' + iconCls + '" aria-hidden="true">' + iconName + '</span>' +
        esc(m.helperName) + ' a ' + verb + ' cererea de asistență.' +
      '</div>' +
      '<div class="message-card__contact">' + formatDate(m.date) + '</div>' +
    '</article>';
  }

  function systemCancelledHtml(m) {
    return '<article class="message-card message-card--system-cancelled">' +
      '<div class="message-card__sys-head">' +
        '<span class="material-symbols-outlined filled" aria-hidden="true">cancel</span>' +
        (currentWorkspaceKind === 'flux' ? 'Fluxul' : 'Situația') + ' a fost anulat' + (currentWorkspaceKind === 'flux' ? '' : 'ă') + ' de ' + esc(m.cancelledBy) +
      '</div>' +
      '<div class="message-card__body">Motiv: ' + esc(m.reason) + '</div>' +
      '<div class="message-card__contact">' + formatDate(m.date) + '</div>' +
    '</article>';
  }

  function standardMessageHtml(m) {
    var chipsHtml = '';
    if (m.chips && m.chips.length) {
      chipsHtml = '<div class="message-card__chips">' +
        m.chips.map(function (c) { return '<span class="pill pill--neutral">' + esc(c.label) + '</span>'; }).join('') +
      '</div>';
    }
    var attachHtml = '';
    if (m.attachments && m.attachments.length) {
      m.attachments.forEach(function (a) {
        attachHtml += '<div class="message-card__attach">A atașat ' + a.count +
          ' <span class="material-symbols-outlined" aria-hidden="true">attach_file</span> ' +
          esc(a.label) + '</div>';
      });
    }
    var aiHtml = '';
    if (m.sender === 'ai') {
      aiHtml = '<div class="message-card__ai-meta">' +
        '<span class="ai-label">Mesaj Automat Scriptica A.I.</span>' +
        '<span class="ai-channels">' +
          '<span class="channel-icon channel-icon--whatsapp" title="Trimis pe WhatsApp">' +
            '<span class="material-symbols-outlined" aria-hidden="true">chat</span>' +
          '</span>' +
          '<span class="channel-icon channel-icon--email" title="Trimis pe Email">' +
            '<span class="material-symbols-outlined" aria-hidden="true">mail</span>' +
          '</span>' +
        '</span>' +
      '</div>';
    }
    var contactHtml = (m.sender === 'client')
      ? '<div class="message-card__contact">Contact: ' + esc(m.clientContact) + '</div>'
      : '';

    var senderLabel;
    if (m.sender === 'ai') senderLabel = m.senderName;
    else if (m.sender === 'client') senderLabel = m.clientCompany;
    else senderLabel = m.senderName || 'Coleg';

    return '<article class="message-card">' +
      '<div class="message-card__header">' +
        '<div class="message-card__sender">' + esc(senderLabel) + '</div>' +
        '<div class="message-card__date">' + formatDate(m.date) + '</div>' +
      '</div>' +
      contactHtml +
      '<div class="message-card__body">' + renderBodyWithDocs(m.body || '') + '</div>' +
      attachHtml +
      chipsHtml +
      aiHtml +
    '</article>';
  }

  function renderBodyWithDocs(body) {
    return esc(body).replace(/@([\w-]+)/g, '<span class="doc-reference">@$1</span>');
  }

  /* ---------- Task toggling ---------- */

  function workspaceVertical() {
    if (currentVertical) return currentVertical;
    if (typeof window.scripticaEffectiveVertical === 'function') {
      return window.scripticaEffectiveVertical(currentSituation.verticalId || 'vert_contabil');
    }
    return ((((MOCK || {}).superAdmin || {}).flowVerticals) || []).find(function (vertical) {
      return vertical.id === (currentSituation.verticalId || 'vert_contabil');
    }) || null;
  }

  function taskDocumentMeta(task) {
    var vertical = workspaceVertical();
    var fallback = null;
    var match = null;
    ((vertical && vertical.documentCategories) || []).forEach(function (category) {
      if (category.system) return;
      (category.documentTypes || []).forEach(function (type) {
        if (!fallback) fallback = { categoryId: category.id, categoryName: category.name, typeId: type.id, typeName: type.name };
        if (task.documentTypeId === type.id) match = { categoryId: category.id, categoryName: category.name, typeId: type.id, typeName: type.name };
      });
    });
    return match || fallback || { categoryId: 'necategorisit', categoryName: 'Necategorisit', typeId: '', typeName: 'Document suport' };
  }

  function registerTaskDocuments(task, attachments) {
    if (!isUploadTask(task)) return;
    var meta = taskDocumentMeta(task);
    var now = new Date().toISOString();
    (attachments || []).forEach(function (attachment, index) {
      if (!attachment.id) attachment.id = 'att_' + Date.now().toString(36) + '_' + index;
      var exists = (MOCK.documents || []).some(function (doc) {
        return doc.sourceTaskId === task.id && doc.attachmentId === attachment.id;
      });
      if (exists) return;
      var record = {
        id: 'doc_task_' + Date.now().toString(36) + '_' + index,
        situationId: currentSituation.id,
        domain: currentSituation.domain || (workspaceVertical() && workspaceVertical().domain) || 'contabil',
        filename: attachment.name,
        uploadedAt: now,
        source: 'upload',
        sourceTaskId: task.id,
        sourceStep: currentSituation.currentStep,
        attachmentId: attachment.id,
        pagesCount: 1,
        multiDoc: false,
        multiDocConfidence: null,
        tipDocument: meta.typeName,
        documentTypeId: meta.typeId,
        emitent: 'Încărcat de utilizator',
        numarDocument: null,
        dataEmiterii: null,
        perioadaFiscala: null,
        valoareFaraTVA: null,
        tvaProcent: null,
        tvaValoare: null,
        valoareTotala: null,
        moneda: 'RON',
        categoriePropusa: meta.typeName,
        broadCategory: meta.categoryId,
        subFilter: null,
        confidenceExtraction: 100,
        confidenceCategorization: 100,
        observatieAI: 'Document solicitat explicit de task-ul „' + task.label + '”.',
        verificat: true,
        verificatManual: true,
        pageThumbnails: []
      };
      MOCK.documents.unshift(record);
      if (currentWorkspaceKind === 'flux') {
        currentSituation.documents = currentSituation.documents || [];
        currentSituation.documents.unshift(record);
      }
    });
  }

  function completeTask(task, result) {
    task.completed = true;
    task.assigneeId = currentUserId;
    task.completedAt = new Date().toISOString();
    task.observation = result.observation;
    task.needsSeniorAttention = result.needsSeniorAttention;
    task.attachments = result.attachments;
    registerTaskDocuments(task, task.attachments);
    persistFlowWorkspace();
    if (typeof window.SCRIPTICA_DOCS_REFRESH === 'function') window.SCRIPTICA_DOCS_REFRESH();
  }

  function onUploadTask(button) {
    var row = button.closest('[data-task-id]');
    var stepKey = 'step' + currentSituation.currentStep;
    var taskId = row && row.getAttribute('data-task-id');
    var task = ((currentSituation.tasks || {})[stepKey] || []).find(function (item) { return String(item.id) === String(taskId); });
    if (!task || isClosedStatus(currentSituation)) return;
    openTaskCompletionModal(task, function (result) {
      if (result) {
        completeTask(task, result);
        showToast('success', (result.attachments.length === 1 ? 'Documentul a fost încărcat' : 'Documentele au fost încărcate') + ' și task-ul a fost finalizat.');
      }
      renderTaskPanel();
    });
  }

  function onTaskToggle(e, cb) {
    var s = currentSituation;
    if (isClosedStatus(s)) { cb.checked = !cb.checked; return; }

    var row = cb.closest('[data-task-id]');
    var taskId = row.getAttribute('data-task-id');
    var stepKey = 'step' + s.currentStep;
    var task = s.tasks[stepKey].find(function (t) { return String(t.id) === taskId; });
    if (!task) return;

    if (cb.checked) {
      // Open task completion modal; revert if cancelled
      openTaskCompletionModal(task, function (result) {
        if (result) {
          completeTask(task, result);
          showToast('success', 'Task finalizat.');
        } else {
          cb.checked = false;
        }
        renderTaskPanel();
      });
    } else {
      var ok = confirm('Revocați finalizarea acestui task?');
      if (!ok) { cb.checked = true; return; }
      task.completed = false;
      task.assigneeId = null;
      task.completedAt = null;
      persistFlowWorkspace();
      renderTaskPanel();
    }
  }

  /* ---------- Task Completion Modal ---------- */

  function openTaskCompletionModal(task, onDone) {
    var modal = document.getElementById('modal-task-complete');
    if (!modal) return;
    var uploadTask = isUploadTask(task);
    var minimumFiles = uploadTask ? Math.max(1, parseInt(task.minimumFiles, 10) || 1) : 0;
    var modalTitle = modal.querySelector('#modal-task-title');
    var titleEl = modal.querySelector('[data-task-title]');
    if (modalTitle) modalTitle.textContent = uploadTask ? 'Încărcare document' : 'Finalizare task';
    if (titleEl) titleEl.textContent = '„' + task.label + '”';

    var obsEl = modal.querySelector('[name="observation"]');
    var seniorEl = modal.querySelector('[name="senior"]');
    var fileInput = modal.querySelector('[name="attachments"]');
    var fileList = modal.querySelector('[data-file-list]');
    var dropzone = modal.querySelector('[data-dropzone]');
    var pickBtn = modal.querySelector('[data-pick-files]');
    var attachmentField = modal.querySelector('[data-attachment-field]');
    var attachmentHelper = modal.querySelector('[data-attachment-helper]');
    var attachmentError = modal.querySelector('[data-attachment-error]');
    var submitBtn = modal.querySelector('[data-modal-submit]');
    var meta = taskDocumentMeta(task);

    if (fileInput) fileInput.multiple = uploadTask ? task.allowMultiple !== false : true;
    if (attachmentHelper) {
      attachmentHelper.textContent = uploadTask
        ? 'Obligatoriu: ' + minimumFiles + (minimumFiles === 1 ? ' fișier' : ' fișiere') + ' · Tip document: ' + meta.typeName + '.'
        : 'Atașează fișiere care susțin finalizarea task-ului.';
    }
    if (submitBtn) submitBtn.textContent = uploadTask ? 'Încarcă și finalizează' : 'Confirmă finalizarea';

    obsEl.value = task.observation || '';
    seniorEl.checked = !!task.needsSeniorAttention;
    var files = (task.attachments || []).slice();
    renderFiles();

    function syncUploadValidation(showError) {
      var missing = uploadTask && files.length < minimumFiles;
      if (submitBtn) submitBtn.disabled = missing;
      if (attachmentField) attachmentField.classList.toggle('has-error', !!(missing && showError));
      if (attachmentError) attachmentError.textContent = missing && showError
        ? 'Încarcă minimum ' + minimumFiles + (minimumFiles === 1 ? ' document.' : ' documente.') : '';
    }

    function renderFiles() {
      fileList.innerHTML = files.map(function (f, i) {
        return '<div class="file-item"><span class="file-item__name">' + esc(f.name) + '</span>' +
          '<span class="file-item__size">' + formatBytes(f.size) + '</span>' +
          '<button type="button" class="file-item__remove" data-remove="' + i + '" aria-label="Elimină">' +
            '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
          '</button></div>';
      }).join('');
      fileList.querySelectorAll('[data-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          files.splice(parseInt(btn.getAttribute('data-remove'), 10), 1);
          renderFiles();
        });
      });
      syncUploadValidation(false);
    }

    function onFiles(list) {
      if (uploadTask && task.allowMultiple === false) files = [];
      Array.prototype.forEach.call(list, function (f) {
        if (uploadTask && task.allowMultiple === false && files.length) return;
        files.push({ id: 'att_' + Date.now().toString(36) + '_' + files.length, name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() });
      });
      renderFiles();
      fileInput.value = '';
    }

    pickBtn.onclick = function () { fileInput.click(); };
    fileInput.onchange = function () { onFiles(fileInput.files); };
    dropzone.ondragover = function (e) { e.preventDefault(); dropzone.classList.add('is-dragover'); };
    dropzone.ondragleave = function () { dropzone.classList.remove('is-dragover'); };
    dropzone.ondrop = function (e) {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      onFiles(e.dataTransfer.files);
    };

    var closeBtn = modal.querySelector('[data-modal-close]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');
    function cleanup() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      modal.removeEventListener('click', onBackdrop);
    }
    function onKey(e) {
      if (e.key === 'Escape') { cleanup(); onDone(null); }
      else if (e.key === 'Tab') trapFocus(e, modal.querySelector('.modal__dialog'));
    }
    function onBackdrop(e) {
      if (e.target === modal) { cleanup(); onDone(null); }
    }

    closeBtn.onclick = function () { cleanup(); onDone(null); };
    cancelBtn.onclick = function () { cleanup(); onDone(null); };
    submitBtn.onclick = function () {
      if (uploadTask && files.length < minimumFiles) {
        syncUploadValidation(true);
        return;
      }
      var result = {
        observation: obsEl.value.trim(),
        needsSeniorAttention: seniorEl.checked,
        attachments: files.slice()
      };
      cleanup();
      onDone(result);
    };
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { (uploadTask ? pickBtn : obsEl).focus(); }, 0);
  }

  /* ---------- Cere Asistență Modal ---------- */

  function openAsistentaModal() {
    var modal = document.getElementById('modal-asistenta');
    if (!modal) return;

    var stepKey = 'step' + currentSituation.currentStep;
    var excludedIds = new Set([currentUserId].concat(currentSituation.activeHelpers[stepKey] || []));
    currentSituation.helperRequests.forEach(function (r) {
      if (r.stepId === currentSituation.currentStep && r.status === 'pending') excludedIds.add(r.helperId);
    });
    var available = MOCK.employees.filter(function (e) { return !excludedIds.has(e.id); });

    var comboInput = modal.querySelector('.combo__input');
    var comboList = modal.querySelector('.combo__list');
    var hidden = modal.querySelector('[name="helperId"]');
    var noteEl = modal.querySelector('[name="note"]');
    var errorEl = modal.querySelector('.form-error');

    comboInput.value = '';
    hidden.value = '';
    noteEl.value = '';
    errorEl.textContent = '';
    modal.querySelector('[data-field="helper"]').classList.remove('has-error');

    var filtered = available.slice();
    var activeIdx = -1;

    function renderComboList() {
      if (!filtered.length) {
        comboList.innerHTML = '<div class="combo__empty">Niciun coleg disponibil.</div>';
        return;
      }
      comboList.innerHTML = filtered.map(function (e, i) {
        return '<div class="combo__option' + (i === activeIdx ? ' is-active' : '') + '" data-id="' + e.id + '" role="option">' +
          '<div class="combo__option-title" style="display:flex; align-items:center; gap: var(--space-2);">' +
            avatarHtml(e, 'avatar avatar--xs') + esc(e.name) +
          '</div>' +
          '<div class="combo__option-meta">' + esc(e.role || '') + '</div>' +
        '</div>';
      }).join('');
      comboList.querySelectorAll('.combo__option').forEach(function (opt) {
        opt.addEventListener('mousedown', function (e) {
          e.preventDefault();
          var id = parseInt(opt.getAttribute('data-id'), 10);
          var pick = MOCK.employees.find(function (x) { return x.id === id; });
          comboInput.value = pick.name;
          hidden.value = id;
          comboList.classList.remove('is-open');
        });
      });
    }

    function openCombo() {
      var q = comboInput.value.toLowerCase().trim();
      filtered = q ? available.filter(function (e) { return e.name.toLowerCase().indexOf(q) !== -1; }) : available.slice();
      renderComboList();
      comboList.classList.add('is-open');
    }

    comboInput.oninput = function () {
      hidden.value = '';
      activeIdx = -1;
      openCombo();
    };
    comboInput.onfocus = openCombo;
    comboInput.onkeydown = function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(filtered.length - 1, activeIdx + 1); renderComboList(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); renderComboList(); }
      else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        var pick = filtered[activeIdx];
        comboInput.value = pick.name;
        hidden.value = pick.id;
        comboList.classList.remove('is-open');
      } else if (e.key === 'Escape') {
        comboList.classList.remove('is-open');
      }
    };

    var docClose = function (e) { if (!e.target.closest('.combo')) comboList.classList.remove('is-open'); };
    document.addEventListener('mousedown', docClose);

    var closeBtn = modal.querySelector('[data-modal-close]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');
    var submitBtn = modal.querySelector('[data-modal-submit]');

    function cleanup() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      modal.removeEventListener('click', onBackdrop);
      document.removeEventListener('mousedown', docClose);
    }
    function onKey(e) {
      if (e.key === 'Escape') cleanup();
      else if (e.key === 'Tab') trapFocus(e, modal.querySelector('.modal__dialog'));
    }
    function onBackdrop(e) {
      if (e.target === modal) cleanup();
    }

    closeBtn.onclick = cleanup;
    cancelBtn.onclick = cleanup;
    submitBtn.onclick = function () {
      if (!hidden.value) {
        errorEl.textContent = 'Alege un coleg din listă.';
        modal.querySelector('[data-field="helper"]').classList.add('has-error');
        return;
      }
      var helper = MOCK.employees.find(function (e) { return e.id === parseInt(hidden.value, 10); });
      var newReq = {
        id: nextRequestId(),
        stepId: currentSituation.currentStep,
        requesterId: currentUserId,
        helperId: helper.id,
        status: 'pending',
        note: noteEl.value.trim(),
        requestedAt: new Date().toISOString(),
        respondedAt: null
      };
      currentSituation.helperRequests.push(newReq);

      // Add a system chat message
      var today = todayISO();
      MOCK.messages.push({
        id: nextMessageId(),
        situationId: currentSituation.id,
        sender: 'system', subtype: 'helper_request',
        date: today,
        requesterName: currentUser.name || currentUser.fullName,
        helperName: helper.name,
        note: newReq.note,
        read: true
      });

      persistFlowWorkspace();
      cleanup();
      showToast('success', 'Cererea de asistență a fost trimisă către ' + helper.name + '.');
      renderChat();
    };
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { comboInput.focus(); }, 0);
  }

  /* ---------- Anulare Modal ---------- */

  function openAnulareModal() {
    var modal = document.getElementById('modal-anulare');
    if (!modal) return;
    var reasonEl = modal.querySelector('[name="reason"]');
    var submitBtn = modal.querySelector('[data-modal-submit]');
    var closeBtn = modal.querySelector('[data-modal-close]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');

    reasonEl.value = '';
    submitBtn.disabled = true;

    reasonEl.oninput = function () {
      submitBtn.disabled = reasonEl.value.trim().length < 10;
    };

    function cleanup() {
      modal.classList.remove('is-open');
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
    submitBtn.onclick = function () {
      var reason = reasonEl.value.trim();
      if (reason.length < 10) return;
      currentSituation.status = 'anulata';
      currentSituation.cancellationReason = reason;
      MOCK.messages.push({
        id: nextMessageId(),
        situationId: currentSituation.id,
        sender: 'system', subtype: 'situation_cancelled',
        date: todayISO(),
        cancelledBy: currentUser.fullName || currentUser.name,
        reason: reason,
        read: true
      });
      persistFlowWorkspace();
      cleanup();
      showToast('info', currentWorkspaceKind === 'flux' ? 'Fluxul a fost anulat.' : 'Situația a fost anulată.');
      render();
    };
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { reasonEl.focus(); }, 0);
  }

  /* ---------- Finalize step ---------- */

  function onFinalizeStep() {
    var s = currentSituation;
    var stepKey = 'step' + s.currentStep;
    var allDone = s.tasks[stepKey].filter(function (t) { return t.required !== false; }).every(taskRequirementComplete);
    if (!allDone) return;
    if (window.SCRIPTICA_ANEXE && !window.SCRIPTICA_ANEXE.allComplete(s)) return;

    var ok = confirm('Finalizați pasul curent și treceți la pasul următor?');
    if (!ok) return;

    var completedStep = s.currentStep;
    var completedStepName = currentStepName(s);

    MOCK.messages.push({
      id: nextMessageId(),
      situationId: s.id,
      sender: 'system', subtype: 'step_completion',
      date: todayISO(),
      stepCompleted: completedStep,
      stepName: completedStepName,
      completedBy: currentUser.fullName || currentUser.name,
      completedAt: new Date().toISOString(),
      summary: 'Pasul ' + completedStep + ' — ' + completedStepName + ' finalizat.',
      read: true
    });

    var total = totalStepsFor(s);
    if (completedStep >= total) {
      s.status = 'inchisa';
      s.totalSteps = total;
      s.stepsCompleted = total;
      showToast('success', currentWorkspaceKind === 'flux' ? 'Fluxul a fost finalizat și închis.' : 'Situația a fost finalizată și închisă.');
    } else {
      s.currentStep = completedStep + 1;
      s.stepsCompleted = completedStep;
      showToast('success', 'Pasul ' + completedStep + ' a fost finalizat.');
    }
    persistFlowWorkspace();
    render();
  }

  /* ---------- Helper accept/decline ---------- */

  function acceptHelper(request) {
    request.status = 'accepted';
    request.respondedAt = new Date().toISOString();
    var stepKey = 'step' + request.stepId;
    if (!currentSituation.activeHelpers[stepKey].includes(request.helperId)) {
      currentSituation.activeHelpers[stepKey].push(request.helperId);
    }
    MOCK.messages.push({
      id: nextMessageId(),
      situationId: currentSituation.id,
      sender: 'system', subtype: 'helper_response',
      date: todayISO(),
      helperName: currentUser.fullName || currentUser.name,
      accepted: true,
      read: true
    });
    persistFlowWorkspace();
    showToast('success', 'Ai acceptat cererea de asistență.');
    render();
  }

  function declineHelper(request) {
    request.status = 'declined';
    request.respondedAt = new Date().toISOString();
    MOCK.messages.push({
      id: nextMessageId(),
      situationId: currentSituation.id,
      sender: 'system', subtype: 'helper_response',
      date: todayISO(),
      helperName: currentUser.fullName || currentUser.name,
      accepted: false,
      read: true
    });
    persistFlowWorkspace();
    showToast('info', 'Ai refuzat cererea de asistență.');
    render();
  }

  /* ---------- Send message (composer) ---------- */

  function sendMessage(text) {
    var trimmed = (text || '').trim();
    if (!trimmed) return;
    MOCK.messages.push({
      id: nextMessageId(),
      situationId: currentSituation.id,
      clientCompany: currentSituation.clientCompany,
      clientContact: currentSituation.clientContact,
      sender: 'internal',
      senderName: currentUser.fullName || currentUser.name,
      date: todayISO(),
      body: trimmed,
      attachments: [],
      chips: [],
      read: true
    });
    renderChat();
  }

  /* ---------- Global bindings ---------- */

  function bindGlobal() {
    // Chat panel toggle already bound in shell.js; no new global bindings here.
  }

  /* ---------- Step name resolution ----------
     Phase 10: prefer the situation type's steps[currentStep-1].name,
     with the legacy standardSteps as fallback. */

  function currentStepName(s) {
    var type = workDefinition(s);
    var typeStep = (type && type.steps) ? type.steps[s.currentStep - 1] : null;
    if (typeStep && typeStep.name) return typeStep.name;
    var std = MOCK.standardSteps['step' + s.currentStep];
    return (std && std.name) || '';
  }

  /* Numărul de pași preferă definiția curentă a tipului (steps.length),
     cu s.totalSteps drept fallback pentru tipuri fără steps — astfel
     editările de pași din admin se reflectă la randare și finalizare. */
  function totalStepsFor(s) {
    var type = workDefinition(s);
    if (type && type.steps && type.steps.length) return type.steps.length;
    return s.totalSteps;
  }

  /* ---------- Role detection ---------- */

  function currentUserRole() {
    var s = currentSituation;
    if (currentWorkspaceKind === 'flux') {
      var view = typeof window.getCurrentView === 'function' ? window.getCurrentView() : 'complet';
      if ((s.responsibleIds || []).indexOf(currentUserId) !== -1 || view === 'complet' || view === 'admin' || view === 'pmb_intern') return 'responsible';
    }
    if (s.responsibleStepId === currentUserId) return 'responsible';
    var stepKey = 'step' + s.currentStep;
    if ((s.activeHelpers[stepKey] || []).indexOf(currentUserId) !== -1) return 'helper';
    return 'viewer';
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

  function todayISO() {
    return '2026-04-20';
  }

  function shortName(full) {
    if (!full) return '';
    var parts = full.split(' ');
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }

  function initials(full) {
    if (!full) return '?';
    var parts = full.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function avatarColor(userId) {
    return AVATAR_PALETTE[userId % AVATAR_PALETTE.length];
  }

  function avatarHtml(user, classes) {
    if (!user) return '';
    var cls = classes || 'avatar';
    var bg = avatarColor(user.id);
    var name = user.name || '';
    var initialsText = initials(name);

    if (user.avatarId) {
      // Pravatar requests at 2x for retina — size based on class
      var size = 80;
      if (cls.indexOf('avatar--md') !== -1) size = 64;
      else if (cls.indexOf('avatar--sm') !== -1) size = 56;
      else if (cls.indexOf('avatar--xs') !== -1) size = 48;
      else if (cls.indexOf('avatar--pill') !== -1) size = 40;
      var url = 'https://i.pravatar.cc/' + size + '?img=' + user.avatarId;
      return '<img class="' + esc(cls) + '" src="' + esc(url) + '"' +
        ' alt="' + esc(name) + '"' +
        ' title="' + esc(name) + '"' +
        ' loading="lazy"' +
        ' data-avatar-bg="' + esc(bg) + '"' +
        ' data-avatar-initials="' + esc(initialsText) + '">';
    }

    return '<span class="' + esc(cls) + '" style="background:' + bg + '; border-color:' + bg + ';" title="' + esc(name) + '">' +
      esc(initialsText) +
    '</span>';
  }

  function formatBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function insertAtCursor(el, text) {
    var start = el.selectionStart || 0;
    var end = el.selectionEnd || 0;
    el.value = el.value.substring(0, start) + text + el.value.substring(end);
    el.focus();
    el.selectionStart = el.selectionEnd = start + text.length;
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

  var _reqSeq = 1000;
  function nextRequestId() { return ++_reqSeq; }
  var _msgSeq = 1000;
  function nextMessageId() { return ++_msgSeq; }

  /* =============================================================
     Timer Picker Modal
     ============================================================= */

  function openTimerPicker() {
    var modal = document.getElementById('modal-timer-picker');
    if (!modal) return;

    var existing = window.ScripticaTimer ? window.ScripticaTimer.read() : null;
    if (existing) {
      var ok = confirm('Ai deja o sesiune activă. Oprește-o înainte de a porni una nouă?');
      if (!ok) return;
      window.ScripticaTimer.stop();
    }

    var s = currentSituation;
    var stepKey = 'step' + s.currentStep;
    var tasks = ((s.tasks || {})[stepKey] || []).filter(function (t) { return !t.completed; });

    var searchEl = modal.querySelector('#tp-search');
    var listEl = modal.querySelector('[data-picker-list]');
    var countEl = modal.querySelector('[data-picker-count]');
    var submitBtn = modal.querySelector('[data-modal-submit]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');
    var closeBtn = modal.querySelector('[data-modal-close]');

    var selected = new Set();
    searchEl.value = '';

    function renderList() {
      var q = searchEl.value.toLowerCase().trim();
      var visible = tasks.filter(function (t) { return !q || t.label.toLowerCase().indexOf(q) !== -1; });
      if (!visible.length) {
        listEl.innerHTML = '<div class="picker-empty">' +
          (tasks.length ? 'Niciun task nu corespunde căutării.' :
            'Toate task-urile din pasul curent sunt finalizate. Nu este nimic de urmărit.') +
        '</div>';
        return;
      }
      listEl.innerHTML = visible.map(function (t) {
        var taskKey = String(t.id);
        var id = 'tp-task-' + taskKey.replace(/[^a-zA-Z0-9_-]/g, '-');
        var checked = selected.has(taskKey) ? ' checked' : '';
        return '<label class="picker-item" for="' + id + '">' +
          '<input type="checkbox" id="' + id + '" data-task="' + esc(taskKey) + '"' + checked + '>' +
          '<span class="picker-item__label">' + esc(t.label) + '</span>' +
        '</label>';
      }).join('');
      listEl.querySelectorAll('[data-task]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var id = cb.getAttribute('data-task');
          if (cb.checked) selected.add(id); else selected.delete(id);
          updateCount();
        });
      });
    }

    function updateCount() {
      countEl.textContent = selected.size + ' acțiuni selectate';
      submitBtn.disabled = selected.size === 0;
    }

    searchEl.oninput = renderList;

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
    submitBtn.onclick = function () {
      if (!selected.size) return;
      var picked = tasks.filter(function (t) { return selected.has(String(t.id)); });
      window.ScripticaTimer.start({
        situationId: s.id,
        clientCompany: s.clientCompany,
        typeLabel: s.typeLabel,
        taskIds: picked.map(function (t) { return t.id; }),
        taskLabels: picked.map(function (t) { return t.label; }),
        detailUrl: currentWorkspaceKind === 'flux'
          ? 'situatie-detaliu.html?flowId=' + encodeURIComponent(s.id)
          : 'situatie-detaliu.html?id=' + encodeURIComponent(s.id)
      });
      cleanup();
      showToast('success', 'Cronometrul a pornit.');
    };
    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    renderList();
    updateCount();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { searchEl.focus(); }, 0);
  }

  function showToast(variant, msg) {
    if (window.SCRIPTICA_TOAST) { window.SCRIPTICA_TOAST(variant, msg); return; }
    // Fallback if dashboard.js toast helper isn't loaded
    var stack = document.getElementById('toast-stack');
    if (!stack) { console.log('[toast]', variant, msg); return; }
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var t = document.createElement('div');
    t.className = 'toast toast--' + variant;
    t.innerHTML = '<span class="material-symbols-outlined filled">' + (icons[variant] || 'info') + '</span>' +
      '<span class="toast__msg">' + esc(msg) + '</span>';
    stack.appendChild(t);
    setTimeout(function () { t.remove(); }, 4000);
  }
})();
