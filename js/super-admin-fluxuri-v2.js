/* ============================================================
   Scriptica — Constructor Fluxuri
   Fiecare șablon își definește propria succesiune de pași.
   Ciornele locale sunt publicate în registrul central prin
   scripticaFlowSave, de unde sunt citite de Tipuri de clienți.
   ============================================================ */
(function () {
  'use strict';

  var root;
  var model;
  var dialogSeq = 0;
  var uidSeq = 0;
  var STORAGE_KEY = 'scriptica.prototype.fluxuriV2';
  var MODEL_VERSION = 5;
  var FREQUENCIES = ['punctual', 'lunar', 'trimestrial', 'semestrial', 'anual'];
  var COLORS = ['mov', 'albastru', 'verde', 'auriu', 'portocaliu', 'roz'];
  var state = {
    clientTypeId: '',
    verticalId: '',
    expandedVerticalId: '',
    templateId: '',
    stepIndex: 0,
    q: '',
    libraryScroll: 0,
    editorScroll: 0,
    sequenceScroll: 0
  };

  function MOCK() { return window.SCRIPTICA_MOCK || null; }
  function SA() { return (MOCK() && MOCK().superAdmin) || null; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function slugify(value) {
    return normalize(value).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'nou';
  }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function toast(variant, message) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, message);
  }
  function vaClass(v) {
    return typeof window.scripticaVerticalAccentClass === 'function'
      ? window.scripticaVerticalAccentClass(v) : 'va-mov';
  }
  function uniqueId(prefix, name, list) {
    var base = prefix + '_' + slugify(name), id = base, i = 2;
    while ((list || []).some(function (item) { return item.id === id; })) {
      id = base + '_' + i;
      i++;
    }
    return id;
  }
  function nextStepId(templateId) {
    uidSeq++;
    return templateId + '_step_' + Date.now().toString(36) + '_' + uidSeq;
  }

  function verticals() { return (model && model.verticals) || []; }
  function templates() { return (model && model.templates) || []; }
  function verticalById(id) {
    return verticals().find(function (v) { return v.id === id; }) || null;
  }
  function templateById(id) {
    return templates().find(function (t) { return t.id === id; }) || null;
  }
  function templatesForVertical(id) {
    return templates().filter(function (t) { return t.verticalId === id; });
  }
  function clientTypes() { return (SA() && SA().clientTypes) || []; }
  function clients() { return (SA() && SA().clients) || []; }
  function clientTypeById(id) {
    return clientTypes().find(function (ct) { return ct.id === id; }) || null;
  }
  function contextType() { return clientTypeById(state.clientTypeId); }
  function libraryVerticals() {
    var ct = contextType();
    if (!ct) return verticals();
    return (ct.verticalIds || []).map(verticalById).filter(Boolean);
  }
  function libraryTemplates() {
    var ids = libraryVerticals().map(function (vertical) { return vertical.id; });
    return templates().filter(function (template) { return ids.indexOf(template.verticalId) !== -1; });
  }
  function attachVerticalToContext(verticalId) {
    var ct = contextType();
    if (!ct || (ct.verticalIds || []).indexOf(verticalId) !== -1 || typeof window.scripticaFlowSave !== 'function') return;
    var updated = clone(ct);
    updated.verticalIds = (updated.verticalIds || []).concat([verticalId]);
    updated.needsReview = Object.assign({}, updated.needsReview || {}, { archive: true, dashboard: true });
    window.scripticaFlowSave('clientType', updated);
  }
  function attachTemplateToContext(templateId) {
    var ct = contextType();
    if (!ct || (ct.defaultTemplateIds || []).indexOf(templateId) !== -1 || typeof window.scripticaFlowSave !== 'function') return;
    var updated = clone(ct);
    updated.defaultTemplateIds = (updated.defaultTemplateIds || []).concat([templateId]);
    window.scripticaFlowSave('clientType', updated);
  }
  function usedByTypes(templateId) {
    return clientTypes().filter(function (ct) {
      return (ct.defaultTemplateIds || []).indexOf(templateId) !== -1;
    });
  }
  function affectedClientsForTemplate(templateId) {
    var typeIds = usedByTypes(templateId).map(function (ct) { return ct.id; });
    return clients().filter(function (client) { return typeIds.indexOf(client.clientTypeId) !== -1; });
  }
  function affectedClientsForVertical(verticalId) {
    var typeIds = clientTypes().filter(function (ct) {
      return (ct.verticalIds || []).indexOf(verticalId) !== -1;
    }).map(function (ct) { return ct.id; });
    return clients().filter(function (client) { return typeIds.indexOf(client.clientTypeId) !== -1; });
  }
  function canonicalTemplateById(id) {
    return ((SA() && SA().flowTemplates) || []).find(function (template) { return template.id === id; }) || null;
  }
  function canonicalVerticalById(id) {
    return ((SA() && SA().flowVerticals) || []).find(function (vertical) { return vertical.id === id; }) || null;
  }
  function anexeTypes() { return (MOCK() && MOCK().anexeTypes) || []; }
  function anexaById(id) {
    return anexeTypes().find(function (a) { return a.id === id; }) || null;
  }
  function anexeForVertical(vertical) {
    if (!vertical) return [];
    return anexeTypes().filter(function (a) {
      var categories = a.categories || [];
      if ((a.status || 'activ') !== 'activ') return false;
      if (vertical.domain === 'audit') return categories.indexOf('audit') !== -1;
      if (vertical.domain === 'constructii') return categories.indexOf('constructii') !== -1;
      if (vertical.domain === 'contabil') return !categories.length || categories.indexOf('contabil') !== -1;
      return categories.indexOf(vertical.domain) !== -1;
    });
  }

  function requiredFieldCount(anexa) {
    return (((anexa && anexa.schema && anexa.schema.fields) || []).filter(function (field) {
      return field.required === true && field.type !== 'calculated';
    })).length;
  }

  function taskLabel(task) {
    return typeof task === 'string' ? task : (task && (task.label || task.name)) || '';
  }

  function normalizeTasks(tasks, stepId) {
    return (tasks || []).map(function (task, index) {
      return {
        id: (task && task.id) || (stepId + '_task_' + (index + 1)),
        label: taskLabel(task),
        required: typeof task === 'string' ? true : task.required !== false
      };
    });
  }

  function defaultTasks(name, index) {
    var n = normalize(name);
    if (/recept|colect|solic|pregat|evalu/.test(n)) {
      return ['Confirmă informațiile de intrare', 'Verifică documentele primite'];
    }
    if (/verific|document|intervent|lucru|analiz/.test(n)) {
      return ['Execută verificările pasului', 'Notează observațiile importante'];
    }
    if (/valid|raport|livr|inchid|urmar|ierarh/.test(n)) {
      return ['Revizuiește rezultatul', 'Confirmă livrabilul pasului'];
    }
    return index === 0 ? ['Pregătește informațiile necesare'] : ['Finalizează activitatea pasului'];
  }

  function enrichTemplate(template, vertical) {
    var availableAnexe = anexeForVertical(vertical);
    var copy = clone(template);
    var allCategoryIds = ((vertical && vertical.documentCategories) || []).map(function (category) { return category.id; });
    var systemIds = ((vertical && vertical.documentCategories) || []).filter(function (category) { return category.system; })
      .map(function (category) { return category.id; });
    copy.documentCategoryIds = (copy.documentCategoryIds || allCategoryIds).filter(function (id) {
      return allCategoryIds.indexOf(id) !== -1;
    });
    if (!copy.documentCategoryIds.some(function (id) { return systemIds.indexOf(id) === -1; })) {
      copy.documentCategoryIds = allCategoryIds.slice();
    }
    systemIds.forEach(function (id) {
      if (copy.documentCategoryIds.indexOf(id) === -1) copy.documentCategoryIds.push(id);
    });
    copy.steps = (copy.steps || []).map(function (step, index) {
      var stepId = step.id || (copy.id + '_step_' + (index + 1));
      var sourceTasks = (step.tasks && step.tasks.length) ? step.tasks : defaultTasks(step.name, index);
      return {
        id: stepId,
        name: step.name || ('Pasul ' + (index + 1)),
        description: step.description || '',
        offsetDays: step.offsetDays || ((index + 1) * 10),
        tasks: normalizeTasks(sourceTasks, stepId),
        anexeIds: (step.anexeIds || (index === copy.steps.length - 1 && availableAnexe[0] ? [availableAnexe[0].id] : [])).slice(),
        requireApproval: !!step.requireApproval
      };
    });
    if (!copy.steps.length) copy.steps = [newStep(copy.id, 1, 10)];
    return copy;
  }

  function enrichVertical(vertical) {
    var copy = clone(vertical);
    copy.documentVocabularyVersion = 1;
    copy.documentCategories = (copy.documentCategories || []).map(function (category) {
      return {
        id: category.id || uniqueId('cat', category.name || 'categorie', []),
        name: category.name || 'Categorie',
        system: !!category.system,
        documentTypes: clone(category.documentTypes || [])
      };
    });
    if (!copy.documentCategories.some(function (category) { return category.system || category.id === 'necategorisit'; })) {
      copy.documentCategories.push({ id: 'necategorisit', name: 'Necategorisit', system: true, documentTypes: [] });
    }
    copy.documentCategories.forEach(function (category) {
      if (category.id === 'necategorisit') { category.system = true; category.name = 'Necategorisit'; category.documentTypes = []; }
    });
    copy.documentFilters = clone(copy.documentFilters || []);
    delete copy.lifecycle;
    return copy;
  }

  function seedModel() {
    var source = SA();
    var seededVerticals = ((source && source.flowVerticals) || []).map(enrichVertical);
    var draftTemplateIds = [];
    var seededTemplates = ((source && source.flowTemplates) || []).map(function (template) {
      var vertical = seededVerticals.find(function (v) { return v.id === template.verticalId; }) || null;
      var enriched = enrichTemplate(template, vertical);
      /* Șabloanele vechi nu aveau task-uri/anexe la nivel de pas. Valorile
         completate de constructor sunt ciorne până la o publicare explicită. */
      if (!sameRecord(enriched, template)) draftTemplateIds.push(template.id);
      return enriched;
    });
    var auditVertical = seededVerticals.find(function (vertical) { return vertical.id === 'vert_audit'; }) || null;
    var demoTemplate = enrichTemplate({
      id: 'ft_audit_extins_v2',
      verticalId: 'vert_audit',
      name: 'Misiune de audit extinsă (9 etape)',
      frequency: 'anual',
      status: 'activ',
      description: 'Scenariu demonstrativ pentru o misiune complexă, cu nouă etape distincte și controale individuale de avansare.',
      documentCategoryIds: ['planificare_audit', 'documente_lucru', 'rapoarte_audit', 'necategorisit'],
      steps: [
        { name: 'Inițierea misiunii', offsetDays: 7, tasks: [
          { label: 'Emite ordinul de serviciu', required: true },
          { label: 'Informează echipa desemnată', required: false }
        ], anexeIds: ['anx_audit_ordin_serviciu'] },
        { name: 'Colectarea informațiilor', offsetDays: 20, tasks: [
          { label: 'Solicită documentele inițiale', required: true },
          { label: 'Centralizează răspunsurile instituției', required: true }
        ], anexeIds: ['anx_audit_chestionar_cunostinta'] },
        { name: 'Analiza riscurilor', offsetDays: 35, tasks: [
          { label: 'Identifică riscurile semnificative', required: true },
          { label: 'Validează punctajele cu șeful misiunii', required: true }
        ], anexeIds: ['anx_audit_punctaj_riscuri'] },
        { name: 'Elaborarea programului', offsetDays: 50, tasks: [
          { label: 'Definește obiectivele și testele', required: true },
          { label: 'Distribuie responsabilitățile', required: false }
        ], anexeIds: ['anx_audit_program_misiune'] },
        { name: 'Intervenția la fața locului', offsetDays: 80, tasks: [
          { label: 'Execută testele planificate', required: true },
          { label: 'Înregistrează probele de audit', required: true }
        ], anexeIds: ['anx_audit_test'] },
        { name: 'Formularea constatărilor', offsetDays: 105, tasks: [
          { label: 'Documentează fiecare constatare', required: true },
          { label: 'Atașează probele relevante', required: true }
        ], anexeIds: ['anx_audit_fiap'] },
        { name: 'Concilierea constatărilor', offsetDays: 125, tasks: [
          { label: 'Transmite proiectul pentru conciliere', required: true },
          { label: 'Înregistrează punctul de vedere', required: false }
        ], anexeIds: ['anx_audit_fcri'] },
        { name: 'Raportarea rezultatelor', offsetDays: 150, tasks: [
          { label: 'Finalizează raportul de audit', required: true },
          { label: 'Obține aprobarea internă', required: true }
        ], anexeIds: [], requireApproval: true },
        { name: 'Urmărirea recomandărilor', offsetDays: 210, tasks: [
          { label: 'Solicită stadiul recomandărilor', required: true },
          { label: 'Actualizează registrul de urmărire', required: true }
        ], anexeIds: ['anx_audit_urmarire_recomandari'] }
      ]
    }, auditVertical);
    var demoIsPublished = seededTemplates.some(function (template) { return template.id === demoTemplate.id; });
    if (!demoIsPublished) {
      seededTemplates.push(demoTemplate);
      draftTemplateIds.push(demoTemplate.id);
    }
    return {
      version: MODEL_VERSION,
      verticals: seededVerticals,
      templates: seededTemplates,
      draftTemplateIds: draftTemplateIds,
      draftVerticalIds: []
    };
  }

  function sameRecord(a, b) {
    if (!a || !b) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function listWithDrafts(canonical, stored, draftIds, enrich) {
    var storedById = {};
    (stored || []).forEach(function (record) { storedById[record.id] = record; });
    var merged = (canonical || []).map(function (record) {
      var candidate = draftIds.indexOf(record.id) !== -1 && storedById[record.id]
        ? storedById[record.id] : record;
      return enrich ? enrich(candidate) : clone(candidate);
    });
    (stored || []).forEach(function (record) {
      var exists = (canonical || []).some(function (item) { return item.id === record.id; });
      if (!exists && draftIds.indexOf(record.id) !== -1) merged.push(enrich ? enrich(record) : clone(record));
    });
    return merged;
  }

  function loadModel() {
    var seeded = seedModel();
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var stored = raw ? JSON.parse(raw) : null;
      if (stored && Array.isArray(stored.verticals) && Array.isArray(stored.templates)) {
        var canonicalVerticals = ((SA() && SA().flowVerticals) || []).map(enrichVertical);
        var canonicalTemplates = clone((SA() && SA().flowTemplates) || []);
        var draftTemplateIds = Array.isArray(stored.draftTemplateIds) ? stored.draftTemplateIds.slice() : [];
        var draftVerticalIds = Array.isArray(stored.draftVerticalIds) ? stored.draftVerticalIds.slice() : [];

        /* Migrare din explorarea V2: orice record care nu a ajuns în registrul
           central rămâne ciornă, nu este pierdut și nu suprascrie în tăcere
           configurația canonică. */
        if (stored.version !== MODEL_VERSION || !Array.isArray(stored.draftTemplateIds)) {
          stored.templates.forEach(function (template) {
            var canonical = canonicalTemplates.find(function (item) { return item.id === template.id; }) || null;
            if (!canonical || !sameRecord(template, canonical)) draftTemplateIds.push(template.id);
          });
          stored.verticals.forEach(function (vertical) {
            var canonical = canonicalVerticals.find(function (item) { return item.id === vertical.id; }) || null;
            if (!canonical || !sameRecord(vertical, canonical)) draftVerticalIds.push(vertical.id);
          });
        }
        seeded.draftTemplateIds.forEach(function (id) {
          var hasStored = stored.templates.some(function (template) { return template.id === id; });
          if (!hasStored || !canonicalTemplateById(id)) draftTemplateIds.push(id);
        });
        draftTemplateIds = draftTemplateIds.filter(function (id, index, list) { return list.indexOf(id) === index; });
        draftVerticalIds = draftVerticalIds.filter(function (id, index, list) { return list.indexOf(id) === index; });

        var mergedVerticals = listWithDrafts(canonicalVerticals, stored.verticals, draftVerticalIds, function (vertical) {
          var candidate = clone(vertical);
          var canonical = canonicalVerticals.find(function (item) { return item.id === candidate.id; }) || null;
          var hasWorkingCategories = (candidate.documentCategories || []).some(function (category) { return !category.system; });
          if ((candidate.documentVocabularyVersion !== 1 || !hasWorkingCategories) && canonical) {
            candidate.documentCategories = clone(canonical.documentCategories || []);
            candidate.documentFilters = clone(canonical.documentFilters || []);
            if (canonical.defaultDocumentCategoryIds) candidate.defaultDocumentCategoryIds = canonical.defaultDocumentCategoryIds.slice();
          } else if ((!candidate.documentCategories || !candidate.documentCategories.length) && canonical) {
            candidate.documentCategories = clone(canonical.documentCategories || []);
          }
          if (!candidate.documentFilters && canonical) candidate.documentFilters = clone(canonical.documentFilters || []);
          if (!candidate.defaultDocumentCategoryIds && canonical && canonical.defaultDocumentCategoryIds) {
            candidate.defaultDocumentCategoryIds = canonical.defaultDocumentCategoryIds.slice();
          }
          return enrichVertical(candidate);
        });
        var mergedTemplates = listWithDrafts(canonicalTemplates, stored.templates, draftTemplateIds, function (template) {
          var vertical = mergedVerticals.find(function (item) { return item.id === template.verticalId; }) || null;
          return enrichTemplate(template, vertical);
        });
        seeded.templates.forEach(function (template) {
          if (!mergedTemplates.some(function (item) { return item.id === template.id; })) mergedTemplates.push(template);
        });
        return {
          version: MODEL_VERSION,
          verticals: mergedVerticals,
          templates: mergedTemplates,
          draftTemplateIds: draftTemplateIds,
          draftVerticalIds: draftVerticalIds
        };
      }
    } catch (e) { /* Prototipul rămâne funcțional fără persistență. */ }
    return seeded;
  }

  function persistModel() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); }
    catch (e) { /* Salvarea vizuală rămâne convingătoare și fără storage. */ }
  }

  function addDraftId(key, id) {
    model[key] = model[key] || [];
    if (model[key].indexOf(id) === -1) model[key].push(id);
  }

  function removeDraftId(key, id) {
    model[key] = (model[key] || []).filter(function (item) { return item !== id; });
  }

  function initialSelection() {
    var params = new URLSearchParams(window.location.search);
    var requestedType = clientTypeById(params.get('ct'));
    var requestedTemplate = templateById(params.get('template'));
    var requestedVertical = verticalById(params.get('vertical'));
    state.clientTypeId = requestedType ? requestedType.id : '';
    var allowedVerticalIds = libraryVerticals().map(function (vertical) { return vertical.id; });
    if (requestedTemplate && allowedVerticalIds.indexOf(requestedTemplate.verticalId) !== -1) {
      state.templateId = requestedTemplate.id;
      state.verticalId = requestedTemplate.verticalId;
    } else {
      state.verticalId = requestedVertical && allowedVerticalIds.indexOf(requestedVertical.id) !== -1
        ? requestedVertical.id : (libraryVerticals()[0] ? libraryVerticals()[0].id : '');
      state.templateId = templatesForVertical(state.verticalId)[0] ? templatesForVertical(state.verticalId)[0].id : '';
    }
    state.expandedVerticalId = state.verticalId;
  }

  function rememberSelection() {
    try {
      var url = new URL(window.location.href);
      if (state.verticalId) url.searchParams.set('vertical', state.verticalId);
      if (state.templateId) url.searchParams.set('template', state.templateId);
      else url.searchParams.delete('template');
      if (state.clientTypeId) url.searchParams.set('ct', state.clientTypeId);
      else url.searchParams.delete('ct');
      url.searchParams.set('view', 'superadmin');
      window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
    } catch (e) { /* Deep link-ul nu este esențial. */ }
  }

  function selectedVertical() {
    var vertical = verticalById(state.verticalId);
    if (vertical && libraryVerticals().some(function (item) { return item.id === vertical.id; })) return vertical;
    vertical = libraryVerticals()[0] || null;
    state.verticalId = vertical ? vertical.id : '';
    return vertical;
  }

  function selectedTemplate() {
    var template = templateById(state.templateId);
    if (template && template.verticalId === state.verticalId) return template;
    template = templatesForVertical(state.verticalId)[0] || null;
    state.templateId = template ? template.id : '';
    state.stepIndex = 0;
    return template;
  }

  function selectedStep(template) {
    if (!template || !template.steps.length) return null;
    if (state.stepIndex < 0) state.stepIndex = 0;
    if (state.stepIndex >= template.steps.length) state.stepIndex = template.steps.length - 1;
    return template.steps[state.stepIndex];
  }

  function markDirty(template) {
    if (!template) return;
    addDraftId('draftTemplateIds', template.id);
    persistModel();
  }

  function isDirty(template) {
    return !!(template && (model.draftTemplateIds || []).indexOf(template.id) !== -1);
  }

  function newStep(templateId, number, offsetDays) {
    var stepId = nextStepId(templateId);
    return {
      id: stepId,
      name: 'Pas nou',
      description: '',
      offsetDays: offsetDays || Math.max(1, number * 10),
      tasks: [{ id: stepId + '_task_1', label: 'Descrie activitatea obligatorie', required: true }],
      anexeIds: [],
      requireApproval: false
    };
  }

  function deadlineError(template, index) {
    var step = template.steps[index];
    var days = parseInt(step.offsetDays, 10);
    if (!days || days < 1) return 'Termenul trebuie să fie de minimum o zi.';
    if (index > 0) {
      var previous = parseInt(template.steps[index - 1].offsetDays, 10) || 0;
      if (days <= previous) return 'Termenul trebuie să fie după ziua ' + previous + ', termenul pasului anterior.';
    }
    if (index < template.steps.length - 1) {
      var next = parseInt(template.steps[index + 1].offsetDays, 10) || 0;
      if (next && days >= next) return 'Termenul trebuie să fie înainte de ziua ' + next + ', termenul pasului următor.';
    }
    return '';
  }

  function templateErrors(template) {
    var errors = [];
    var vertical = template && verticalById(template.verticalId);
    var systemIds = ((vertical && vertical.documentCategories) || []).filter(function (category) { return category.system; })
      .map(function (category) { return category.id; });
    var selectedNonSystem = (template && template.documentCategoryIds || []).filter(function (id) { return systemIds.indexOf(id) === -1; });
    if (!template || !String(template.name || '').trim()) errors.push('Fluxul trebuie să aibă o denumire.');
    if (!template || !template.steps || !template.steps.length) errors.push('Fluxul trebuie să aibă cel puțin un pas.');
    if (vertical && !selectedNonSystem.length) errors.push('Fluxul trebuie să folosească cel puțin o categorie de documente din verticală.');
    (template && template.steps || []).forEach(function (step, index) {
      if (!String(step.name || '').trim()) errors.push('Pasul ' + (index + 1) + ' trebuie să aibă o denumire.');
      (step.tasks || []).forEach(function (task, taskIndex) {
        if (!String(taskLabel(task)).trim()) errors.push('Task-ul ' + (taskIndex + 1) + ' din pasul ' + (index + 1) + ' trebuie descris.');
      });
      var error = deadlineError(template, index);
      if (error) errors.push('Pasul ' + (index + 1) + ': ' + error);
    });
    return errors;
  }

  function summaryMetric(icon, number, label) {
    return '<div class="fxv2-summary__metric"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' +
      '<b>' + number + '</b><span>' + esc(label) + '</span></div>';
  }

  function setupPathHtml(ct, template) {
    var context = ct ? '&ct=' + encodeURIComponent(ct.id) : '';
    var flowActive = !!template;
    return '<nav class="sa-setup" aria-label="Pașii configurării Super Admin">' +
      '<a class="sa-setup__step" href="super-admin-tipuri-clienti-v2.html?view=superadmin' + context + '"><span>1</span><div><small>Definește organizația</small><b>Tip de client</b></div></a>' +
      '<span class="material-symbols-outlined sa-setup__arrow" aria-hidden="true">arrow_forward</span>' +
      '<a class="sa-setup__step' + (flowActive ? '' : ' is-active') + '" href="#fxv2-root"' + (flowActive ? '' : ' aria-current="step"') + '><span>2</span><div><small>Structurează activitatea</small><b>Verticale</b></div></a>' +
      '<span class="material-symbols-outlined sa-setup__arrow" aria-hidden="true">arrow_forward</span>' +
      '<a class="sa-setup__step' + (flowActive ? ' is-active' : '') + '" href="#fxv2-root"' + (flowActive ? ' aria-current="step"' : '') + '><span>3</span><div><small>Definește execuția</small><b>Fluxuri</b></div></a>' +
      '<span class="material-symbols-outlined sa-setup__arrow" aria-hidden="true">arrow_forward</span>' +
      '<a class="sa-setup__step" href="super-admin-clienti.html?view=superadmin' + context + '"><span>4</span><div><small>Activează configurația</small><b>Client</b></div></a>' +
    '</nav>';
  }

  function renderPage() {
    var previousLibrary = root.querySelector('.fxv2-library__scroll');
    var previousEditor = root.querySelector('.fxv2-editor');
    var previousSequence = root.querySelector('.fxv2-sequence-scroll');
    if (previousLibrary) state.libraryScroll = previousLibrary.scrollTop;
    if (previousEditor) state.editorScroll = previousEditor.scrollTop;
    if (previousSequence) state.sequenceScroll = previousSequence.scrollLeft;
    var ct = contextType();
    var vertical = selectedVertical();
    var template = selectedTemplate();
    var visibleTemplates = libraryTemplates();
    var totalSteps = visibleTemplates.reduce(function (sum, item) { return sum + (item.steps || []).length; }, 0);
    var readyForClient = !!(ct && (ct.verticalIds || []).length && (ct.defaultTemplateIds || []).length);
    root.innerHTML =
      '<header class="page-header fxv2-page-header">' +
        '<div class="fxv2-heading"><div class="fxv2-heading__line">' +
          '<h1 class="page-header__title">Verticale și fluxuri</h1><span class="pill pill--neutral">Pașii 2–3 din 4</span></div>' +
          '<p class="fxv2-intro">' + (ct
            ? 'Configurezi tipul „<b>' + esc(ct.name) + '</b>”. Creează domeniile sale de lucru, apoi construiește fluxurile din fiecare verticală.'
            : 'Registrul global rămâne vizibil pentru administrare. Pentru o configurare nouă, pornește prin alegerea unui tip de client.') + '</p>' +
        '</div>' +
        '<div class="fxv2-page-actions">' +
          (ct ? '<a class="btn btn--ghost" href="super-admin-tipuri-clienti-v2.html?view=superadmin&ct=' + encodeURIComponent(ct.id) + '">Înapoi la tip</a>' : '') +
          (ct ? '<button class="btn btn--secondary" type="button" data-new-vertical>Verticală nouă<span class="material-symbols-outlined" aria-hidden="true">add</span></button>'
            : '<a class="btn btn--secondary" href="super-admin-tipuri-clienti-v2.html?view=superadmin">Alege tipul de client<span class="material-symbols-outlined" aria-hidden="true">arrow_back</span></a>') +
          (ct && vertical ? '<button class="btn ' + (readyForClient ? 'btn--secondary' : 'btn--primary') + '" type="button" data-new-template>Flux nou<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' : '') +
          (ct && readyForClient ? '<a class="btn btn--primary" href="super-admin-clienti.html?view=superadmin&ct=' + encodeURIComponent(ct.id) + '&new=client">Continuă la client<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>' : '') +
        '</div>' +
      '</header>' +
      setupPathHtml(ct, template) +
      '<div class="fxv2-summary" aria-label="Rezumat registru de fluxuri">' +
        summaryMetric('account_tree', libraryVerticals().length, ct ? 'verticale în acest tip' : 'verticale') +
        summaryMetric('schema', visibleTemplates.length, ct ? 'fluxuri în verticale' : 'fluxuri definite') +
        summaryMetric('conversion_path', totalSteps, 'pași configurabili') +
        '<span class="fxv2-summary__explain"><span class="material-symbols-outlined" aria-hidden="true">info</span>' +
          (ct ? 'O verticală nouă este asociată automat acestui tip; un flux publicat devine parte din configurația de înrolare.' : 'Verticala definește categoriile; fiecare flux definește pașii și vizibilitatea lor.') + '</span>' +
      '</div>' +
      '<div class="fxv2-workspace">' + libraryHtml(vertical, template) + editorHtml(vertical, template) + '</div>';
    rememberSelection();
    window.requestAnimationFrame(function () {
      var library = root.querySelector('.fxv2-library__scroll');
      var editor = root.querySelector('.fxv2-editor');
      var sequence = root.querySelector('.fxv2-sequence-scroll');
      if (library) library.scrollTop = state.libraryScroll;
      if (editor) editor.scrollTop = state.editorScroll;
      if (sequence) sequence.scrollLeft = state.sequenceScroll;
    });
  }

  function libraryHtml(vertical, template) {
    var ct = contextType();
    return '<aside class="fxv2-library" aria-label="Biblioteca de fluxuri">' +
      '<div class="fxv2-library__scroll">' +
        '<div class="fxv2-library__section">' +
          '<div class="fxv2-library__heading"><div><h2>' + (ct ? esc(ct.name) : 'Registrul platformei') + '</h2><small>Alege verticala, apoi fluxul.</small></div><span>' + libraryTemplates().length + '</span></div>' +
        '<div class="filter-input-search fxv2-search"><span class="material-symbols-outlined" aria-hidden="true">search</span>' +
          '<label class="sr-only" for="fxv2-search">Caută un flux</label>' +
          '<input id="fxv2-search" class="input" type="search" placeholder="Caută un flux..." autocomplete="off" value="' + esc(state.q) + '"></div>' +
          '<div class="fxv2-vertical-list" data-vertical-list>' + verticalAccordionHtml(template) + '</div>' +
        '</div>' +
      '</div>' +
      '<footer class="fxv2-library__foot">' +
        (vertical ? '<button class="btn btn--ghost" type="button" data-edit-vertical="' + esc(vertical.id) + '"><span class="material-symbols-outlined" aria-hidden="true">' + (vertical.builtin ? 'category' : 'edit') + '</span>' +
          (vertical.builtin ? 'Categorii documente' : 'Configurează verticala') + '</button>' : '') +
        (vertical ? '<a class="btn btn--ghost" href="super-admin-tabel.html?vertical=' + encodeURIComponent(vertical.id) + '&view=superadmin"><span class="material-symbols-outlined" aria-hidden="true">view_column</span>Coloanele tabelului</a>' : '') +
      '</footer>' +
    '</aside>';
  }

  function verticalAccordionHtml(selected) {
    var q = normalize(state.q);
    var groups = libraryVerticals().filter(function (vertical) {
      return !q || visibleTemplates(vertical).length > 0;
    });
    if (!groups.length) {
      return '<div class="fxv2-library-empty"><span class="material-symbols-outlined" aria-hidden="true">' + (state.q ? 'search_off' : 'account_tree') + '</span>' +
        '<b>' + (state.q ? 'Niciun flux găsit' : 'Nicio verticală configurată') + '</b><span>' +
        (state.q ? 'Încearcă alt termen sau caută după frecvență.' : 'Creează prima verticală pentru acest tip de client.') + '</span>' +
        (state.q ? '<button type="button" data-clear-search>Șterge căutarea</button>' :
          (contextType() ? '<button type="button" data-new-vertical>Creează verticala</button>' : '<a href="super-admin-tipuri-clienti-v2.html?view=superadmin">Alege tipul de client</a>')) + '</div>';
    }
    return groups.map(function (item) {
      var list = visibleTemplates(item);
      var expanded = !!q || item.id === state.expandedVerticalId;
      var regionId = 'fxv2-flows-' + item.id;
      return '<div class="fxv2-vertical-group ' + vaClass(item) + (item.id === state.verticalId ? ' is-active' : '') + '">' +
        '<button class="fxv2-vertical' + (item.id === state.verticalId ? ' is-selected' : '') + '" type="button" data-select-vertical="' + esc(item.id) + '" aria-expanded="' + (expanded ? 'true' : 'false') + '" aria-controls="' + regionId + '">' +
          '<span class="fxv2-vertical__icon"><span class="material-symbols-outlined" aria-hidden="true">' + esc(item.icon || 'account_tree') + '</span></span>' +
          '<span class="fxv2-vertical__copy"><b>' + esc(item.name) + '</b><small>' + templatesForVertical(item.id).length + ' ' + plural(templatesForVertical(item.id).length, 'flux', 'fluxuri') + '</small></span>' +
          '<span class="material-symbols-outlined fxv2-vertical__arrow" aria-hidden="true">expand_more</span>' +
        '</button>' +
        '<div class="fxv2-template-list' + (expanded ? ' is-expanded' : '') + '" id="' + regionId + '" role="region" aria-label="Fluxuri — ' + esc(item.name) + '">' +
          templateListHtml(item, selected, list) +
        '</div>' +
      '</div>';
    }).join('');
  }

  function visibleTemplates(vertical) {
    var q = normalize(state.q);
    return templatesForVertical(vertical ? vertical.id : '').filter(function (template) {
      return !q || normalize([template.name, template.description, template.frequency].join(' ')).indexOf(q) !== -1;
    });
  }

  function templateListHtml(vertical, selected, suppliedList) {
    var list = suppliedList || visibleTemplates(vertical);
    if (!list.length) {
      return '<div class="fxv2-library-empty"><span class="material-symbols-outlined" aria-hidden="true">schema</span>' +
        '<b>Verticală fără fluxuri</b><span>Creează primul traseu de lucru pentru această verticală.</span>' +
        '<button type="button" data-new-template>Creează flux</button></div>';
    }
    return list.map(function (template) {
      var last = template.steps && template.steps.length ? template.steps[template.steps.length - 1].offsetDays : 0;
      return '<button class="fxv2-template' + (selected && template.id === selected.id ? ' is-selected' : '') + '" type="button" data-select-template="' + esc(template.id) + '">' +
        '<span class="fxv2-template__copy"><b>' + esc(template.name) + '</b>' +
          '<small>' + (template.steps || []).length + ' ' + plural((template.steps || []).length, 'pas', 'pași') + ' · până în ziua ' + last + '</small></span>' +
        '<span class="fxv2-template__side"><span class="pill pill--neutral">' + esc(template.frequency || '—') + '</span>' +
          (isDirty(template) ? '<i title="Ciornă salvată local" aria-label="Ciornă salvată local"></i>' : '') + '</span>' +
      '</button>';
    }).join('');
  }

  function publicationState(template) {
    var usedBy = usedByTypes(template.id);
    var affectedClients = affectedClientsForTemplate(template.id);
    var dirty = isDirty(template);
    var pending = dirty && affectedClients.length > 0;
    var copy;
    if (pending) {
      copy = affectedClients.length + ' ' + plural(affectedClients.length, 'client folosește', 'clienți folosesc') +
        ' deja acest flux. Ciorna este păstrată, dar publicarea rămâne în așteptare până se decide cum sunt tratate configurațiile existente.';
    } else if (usedBy.length) {
      copy = usedBy.length + ' ' + plural(usedBy.length, 'tip de client include', 'tipuri de clienți includ') +
        ' acest flux. Publicarea actualizează registrul central folosit de Tipuri de clienți și înrolare.';
    } else if (contextType()) {
      copy = 'După publicare, fluxul va fi inclus automat în tipul „' + contextType().name + '” și va deveni disponibil la înrolare.';
    } else {
      copy = 'Fluxul nu este inclus încă într-un tip de client. După publicare devine disponibil în pachetele de înrolare.';
    }
    return { usedBy: usedBy, affectedClients: affectedClients, dirty: dirty, pending: pending, copy: copy };
  }

  function editorHtml(vertical, template) {
    if (!vertical) {
      return '<section class="fxv2-editor fxv2-editor--empty"><span class="material-symbols-outlined" aria-hidden="true">account_tree</span><h2>Creează prima verticală</h2><p>Verticala va grupa fluxurile aceluiași domeniu și va aparține tipului de client selectat.</p>' +
        (contextType() ? '<button class="btn btn--primary" type="button" data-new-vertical>Verticală nouă<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' :
          '<a class="btn btn--primary" href="super-admin-tipuri-clienti-v2.html?view=superadmin">Alege tipul de client</a>') + '</section>';
    }
    if (!template) {
      return '<section class="fxv2-editor fxv2-editor--empty ' + vaClass(vertical) + '"><span class="material-symbols-outlined" aria-hidden="true">schema</span>' +
        '<h2>Începe cu primul flux din „' + esc(vertical.name) + '”</h2>' +
        '<p>Fiecare flux își va avea propria structură de pași și termene.</p>' +
        '<button class="btn btn--primary" type="button" data-new-template>Flux nou<span class="material-symbols-outlined" aria-hidden="true">add</span></button></section>';
    }
    var publication = publicationState(template);
    var errors = templateErrors(template);
    return '<section class="fxv2-editor ' + vaClass(vertical) + '" aria-label="Editor flux">' +
      '<header class="fxv2-editor__head">' +
        '<div class="fxv2-editor__identity"><span class="fxv2-editor__icon"><span class="material-symbols-outlined" aria-hidden="true">' + esc(vertical.icon || 'account_tree') + '</span></span>' +
          '<div><span class="fxv2-eyebrow">' + esc(vertical.name) + ' · Șablon de flux</span>' +
            '<div class="fxv2-editor__title-line"><h2 data-template-title>' + esc(template.name) + '</h2>' +
              '<span class="pill pill--neutral">' + esc(template.frequency || '—') + '</span>' +
              '<span class="pill ' + (errors.length ? 'pill--pending' : 'pill--success') + '" data-validation-pill>' + (errors.length ? 'De corectat' : 'Structură validă') + '</span></div>' +
            '<p>' + esc(template.description || 'Flux fără descriere.') + '</p></div></div>' +
        '<div class="fxv2-editor__actions">' +
          '<button class="btn btn--ghost" type="button" data-template-settings><span class="material-symbols-outlined" aria-hidden="true">tune</span>Setări</button>' +
          '<button class="btn btn--secondary" type="button" data-preview-template><span class="material-symbols-outlined" aria-hidden="true">visibility</span>Previzualizează</button>' +
          '<button class="btn btn--primary" type="button" data-save-template' + (!publication.dirty || errors.length ? ' disabled' : '') + '>' +
            '<span class="material-symbols-outlined" aria-hidden="true">' + (publication.pending ? 'pending_actions' : 'publish') + '</span><span data-save-label>' +
              (publication.pending ? 'Publicare în așteptare' : (publication.dirty ? 'Publică modificările' : 'Publicat')) + '</span></button>' +
        '</div>' +
      '</header>' +
      '<div class="fxv2-impact' + (publication.pending ? ' is-pending' : '') + '"><span class="material-symbols-outlined" aria-hidden="true">' + (publication.pending ? 'pending_actions' : 'info') + '</span><div><b data-impact-title>' +
        (publication.pending ? 'Politica de actualizare nu este decisă.' : (publication.dirty ? 'Ciorna este pregătită pentru publicare.' : 'Configurație publicată în registrul central.')) +
        '</b><span data-impact-copy>' + esc(publication.copy) + '</span></div>' +
        (publication.dirty ? '<span class="fxv2-draft" data-draft-state><span></span>Ciornă salvată</span>' : '<span class="fxv2-saved" data-draft-state><span class="material-symbols-outlined" aria-hidden="true">cloud_done</span>Publicat</span>') +
      '</div>' +
      '<div class="fxv2-builder-label"><div><span class="fxv2-eyebrow">Traseul fluxului</span><h3>Selectează un pas pentru a-l configura</h3></div>' +
        '<div class="fxv2-builder-label__tools"><span>' + template.steps.length + ' ' + plural(template.steps.length, 'pas', 'pași') + ' · termen final în ziua ' + template.steps[template.steps.length - 1].offsetDays + '</span>' +
          '<div class="fxv2-sequence-nav" aria-label="Navigare în traseu">' +
            '<button type="button" data-scroll-sequence="-1" aria-label="Vezi pașii anteriori"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span></button>' +
            '<button type="button" data-scroll-sequence="1" aria-label="Vezi pașii următori"><span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>' +
          '</div></div></div>' +
      sequenceHtml(template) + stepInspectorHtml(template, selectedStep(template), state.stepIndex) +
    '</section>';
  }

  function sequenceHtml(template) {
    var html = '<div class="fxv2-sequence" role="list" aria-label="Pașii fluxului"><div class="fxv2-terminal"><span class="material-symbols-outlined" aria-hidden="true">play_arrow</span><b>Pornire</b></div>';
    template.steps.forEach(function (step, index) {
      html += insertButtonHtml(index) +
        '<button class="fxv2-step-node' + (index === state.stepIndex ? ' is-selected' : '') + '" type="button" role="listitem" data-select-step="' + index + '"' + (index === state.stepIndex ? ' aria-current="step"' : '') + '>' +
          '<span class="fxv2-step-node__top"><i>' + (index + 1) + '</i><small>Ziua ' + esc(step.offsetDays) + '</small></span>' +
          '<b data-sequence-name="' + index + '">' + esc(step.name || 'Pas fără nume') + '</b>' +
          '<span class="fxv2-step-node__meta"><span class="material-symbols-outlined" aria-hidden="true">checklist</span>' + (step.tasks || []).length +
            '<span class="material-symbols-outlined" aria-hidden="true">description</span>' + (step.anexeIds || []).length + '</span>' +
        '</button>';
    });
    html += insertButtonHtml(template.steps.length) + '<div class="fxv2-terminal is-end"><span class="material-symbols-outlined" aria-hidden="true">flag</span><b>Închidere</b></div></div>';
    return '<div class="fxv2-sequence-scroll">' + html + '</div>';
  }

  function insertButtonHtml(index) {
    return '<button class="fxv2-insert" type="button" data-add-step="' + index + '" aria-label="Adaugă un pas aici" title="Adaugă un pas aici">' +
      '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>';
  }

  function toggleHtml(label, help, key, on) {
    return '<div class="fxv2-rule"><div><b>' + esc(label) + '</b><span>' + esc(help) + '</span></div>' +
      '<button class="fxv2-toggle' + (on ? ' is-on' : '') + '" type="button" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-toggle-rule="' + key + '" aria-label="' + esc(label) + '"><span></span></button></div>';
  }

  function automaticRuleHtml(icon, label, help, value) {
    return '<div class="fxv2-rule fxv2-rule--automatic"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span><div><b>' + esc(label) + '</b><span>' + esc(help) + '</span></div>' +
      '<strong>' + esc(value) + '</strong></div>';
  }

  function stepInspectorHtml(template, step, index) {
    if (!step) return '';
    var vertical = verticalById(template.verticalId);
    var available = anexeForVertical(vertical).filter(function (anexa) { return (step.anexeIds || []).indexOf(anexa.id) === -1; });
    var dayError = deadlineError(template, index);
    var requiredTasks = (step.tasks || []).filter(function (task) { return task.required !== false; }).length;
    var blockingAnexe = 0;
    var requiredFields = 0;
    var tasks = (step.tasks || []).map(function (task, taskIndex) {
      return '<div class="fxv2-task"><span class="material-symbols-outlined" aria-hidden="true">check_box_outline_blank</span>' +
        '<input class="input" type="text" value="' + esc(taskLabel(task)) + '" data-task-input="' + taskIndex + '" aria-label="Task ' + (taskIndex + 1) + '">' +
        '<label class="fxv2-task__required"><input type="checkbox" data-task-required="' + taskIndex + '"' + (task.required !== false ? ' checked' : '') + '><span>Obligatoriu</span></label>' +
        '<button type="button" data-remove-task="' + taskIndex + '" aria-label="Șterge task-ul" title="Șterge task-ul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button></div>';
    }).join('');
    var anexe = (step.anexeIds || []).map(function (id) {
      var anexa = anexaById(id);
      var count = requiredFieldCount(anexa);
      if (count) { blockingAnexe++; requiredFields += count; }
      return '<div class="fxv2-anexa-chip"><span class="material-symbols-outlined" aria-hidden="true">description</span><div><b>' + esc(anexa ? anexa.name : id) + '</b>' +
        (count ? '<small class="is-required"><span class="material-symbols-outlined" aria-hidden="true">lock</span>' + count + ' ' + plural(count, 'câmp obligatoriu', 'câmpuri obligatorii') + '</small>' : '<small>Fără câmpuri obligatorii</small>') + '</div>' +
        '<button type="button" data-remove-anexa="' + esc(id) + '" aria-label="Elimină anexa"><span class="material-symbols-outlined" aria-hidden="true">close</span></button></div>';
    }).join('');
    var options = available.map(function (anexa) { return '<option value="' + esc(anexa.id) + '">' + esc(anexa.name) + '</option>'; }).join('');
    return '<div class="fxv2-inspector">' +
      '<header class="fxv2-inspector__head"><div><span class="fxv2-eyebrow">Configurare pas</span><h3>Pasul ' + (index + 1) + ' din ' + template.steps.length + '</h3></div>' +
        '<div class="fxv2-step-actions">' +
          '<button type="button" data-move-step="-1"' + (index === 0 ? ' disabled' : '') + ' title="Mută mai devreme" aria-label="Mută pasul mai devreme"><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span></button>' +
          '<button type="button" data-move-step="1"' + (index === template.steps.length - 1 ? ' disabled' : '') + ' title="Mută mai târziu" aria-label="Mută pasul mai târziu"><span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>' +
          '<button type="button" data-duplicate-step title="Duplică pasul" aria-label="Duplică pasul"><span class="material-symbols-outlined" aria-hidden="true">content_copy</span></button>' +
          '<button class="is-danger" type="button" data-delete-step title="Șterge pasul" aria-label="Șterge pasul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>' +
        '</div></header>' +
      '<div class="fxv2-inspector__grid">' +
        '<section class="fxv2-config-card"><div class="fxv2-config-card__title"><span class="material-symbols-outlined" aria-hidden="true">edit_note</span><div><h4>Identitatea pasului</h4><p>Ce vede echipa în traseul de lucru.</p></div></div>' +
          '<div class="form-field"><label class="form-label" for="fxv2-step-name">Denumire pas</label><input id="fxv2-step-name" class="input" type="text" data-step-name value="' + esc(step.name) + '"></div>' +
          '<div class="form-field"><label class="form-label" for="fxv2-step-desc">Instrucțiune scurtă</label><textarea id="fxv2-step-desc" class="input" rows="2" data-step-description placeholder="Ce trebuie obținut în acest pas?">' + esc(step.description || '') + '</textarea></div>' +
          '<div class="form-field' + (dayError ? ' has-error' : '') + '" data-deadline-field><label class="form-label" for="fxv2-step-days">Termenul pasului</label>' +
            '<div class="fxv2-deadline"><span>Până în ziua</span><input id="fxv2-step-days" class="input" type="number" min="1" data-step-days value="' + esc(step.offsetDays) + '"><span>de la pornirea fluxului</span></div>' +
            '<span class="form-helper">Termenele sunt cumulative și trebuie să crească de la un pas la următorul.</span><span class="form-error" role="alert" data-deadline-error>' + esc(dayError) + '</span></div>' +
        '</section>' +
        '<section class="fxv2-config-card"><div class="fxv2-config-card__title"><span class="material-symbols-outlined" aria-hidden="true">task_alt</span><div><h4>Cerințe pentru avansare</h4><p>Ce blochează butonul „Finalizează pasul”.</p></div></div>' +
          '<div class="fxv2-rules">' +
            automaticRuleHtml('checklist', 'Task-uri obligatorii', 'Se configurează individual în lista de task-uri.', requiredTasks + ' din ' + (step.tasks || []).length) +
            automaticRuleHtml('description', 'Câmpuri obligatorii din anexe', blockingAnexe ? 'Pasul este blocat până la completarea lor.' : 'Nicio anexă nu blochează acum pasul.', requiredFields ? requiredFields + ' câmpuri' : 'Niciunul') +
            toggleHtml('Aprobare internă', 'Pasul se închide numai după validarea unui responsabil.', 'requireApproval', step.requireApproval) +
          '</div>' +
        '</section>' +
      '</div>' +
      '<div class="fxv2-inspector__grid fxv2-inspector__grid--content">' +
        '<section class="fxv2-config-card"><div class="fxv2-config-card__title"><span class="material-symbols-outlined" aria-hidden="true">checklist</span><div><h4>Task-uri implicite</h4><p>Obligativitatea se decide pentru fiecare task, nu pentru tot pasul.</p></div><span class="fxv2-count">' + (step.tasks || []).length + '</span></div>' +
          '<div class="fxv2-task-list">' + (tasks || '<div class="fxv2-mini-empty">Niciun task definit.</div>') + '</div>' +
          '<button class="btn btn--ghost" type="button" data-add-task><span class="material-symbols-outlined" aria-hidden="true">add</span>Adaugă task</button>' +
        '</section>' +
        '<section class="fxv2-config-card"><div class="fxv2-config-card__title"><span class="material-symbols-outlined" aria-hidden="true">description</span><div><h4>Anexe implicite</h4><p>Câmpurile obligatorii din anexă blochează automat avansarea.</p></div><span class="fxv2-count">' + (step.anexeIds || []).length + '</span></div>' +
          '<div class="fxv2-anexe">' + (anexe || '<div class="fxv2-mini-empty">Nicio anexă atașată.</div>') + '</div>' +
          '<div class="fxv2-anexa-picker"><select class="select" data-anexa-picker' + (available.length ? '' : ' disabled') + '><option value="">' + (available.length ? 'Selectează o anexă...' : 'Nicio anexă disponibilă') + '</option>' + options + '</select>' +
            '<button class="btn btn--secondary" type="button" data-add-anexa' + (available.length ? '' : ' disabled') + '>Atașează</button></div>' +
        '</section>' +
      '</div>' +
    '</div>';
  }

  function handleClick(event) {
    var el;
    if ((el = event.target.closest('[data-select-vertical]'))) {
      var nextVerticalId = el.getAttribute('data-select-vertical');
      var isExpanded = el.getAttribute('aria-expanded') === 'true';
      if (nextVerticalId !== state.verticalId) {
        state.verticalId = nextVerticalId;
        state.templateId = templatesForVertical(state.verticalId)[0] ? templatesForVertical(state.verticalId)[0].id : '';
        state.expandedVerticalId = nextVerticalId;
        state.stepIndex = 0;
        state.editorScroll = 0;
        state.sequenceScroll = 0;
      } else {
        state.expandedVerticalId = isExpanded ? '' : nextVerticalId;
      }
      state.q = '';
      renderPage();
    } else if ((el = event.target.closest('[data-select-template]'))) {
      state.templateId = el.getAttribute('data-select-template');
      state.stepIndex = 0;
      state.editorScroll = 0;
      state.sequenceScroll = 0;
      renderPage();
    } else if ((el = event.target.closest('[data-select-step]'))) {
      state.stepIndex = parseInt(el.getAttribute('data-select-step'), 10) || 0;
      renderPage();
    } else if ((el = event.target.closest('[data-scroll-sequence]'))) {
      scrollSequence(parseInt(el.getAttribute('data-scroll-sequence'), 10));
    } else if ((el = event.target.closest('[data-add-step]'))) {
      addStepAt(parseInt(el.getAttribute('data-add-step'), 10));
    } else if ((el = event.target.closest('[data-move-step]'))) {
      moveStep(parseInt(el.getAttribute('data-move-step'), 10));
    } else if (event.target.closest('[data-duplicate-step]')) {
      duplicateStep();
    } else if (event.target.closest('[data-delete-step]')) {
      confirmDeleteStep();
    } else if (event.target.closest('[data-add-task]')) {
      addTask();
    } else if ((el = event.target.closest('[data-remove-task]'))) {
      removeTask(parseInt(el.getAttribute('data-remove-task'), 10));
    } else if ((el = event.target.closest('[data-task-required]'))) {
      setTaskRequired(parseInt(el.getAttribute('data-task-required'), 10), el.checked);
    } else if ((el = event.target.closest('[data-toggle-rule]'))) {
      toggleRule(el.getAttribute('data-toggle-rule'));
    } else if (event.target.closest('[data-add-anexa]')) {
      addAnexa();
    } else if ((el = event.target.closest('[data-remove-anexa]'))) {
      removeAnexa(el.getAttribute('data-remove-anexa'));
    } else if (event.target.closest('[data-save-template]')) {
      confirmPublish();
    } else if (event.target.closest('[data-preview-template]')) {
      openPreview();
    } else if (event.target.closest('[data-template-settings]')) {
      openTemplateSettings(selectedTemplate());
    } else if (event.target.closest('[data-new-template]')) {
      openNewTemplate();
    } else if (event.target.closest('[data-new-vertical]')) {
      openVerticalEditor(null);
    } else if ((el = event.target.closest('[data-edit-vertical]'))) {
      openVerticalEditor(verticalById(el.getAttribute('data-edit-vertical')));
    } else if (event.target.closest('[data-delete-template]')) {
      confirmDeleteTemplate();
    } else if (event.target.closest('[data-clear-search]')) {
      state.q = '';
      renderPage();
    }
  }

  function handleInput(event) {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (event.target.id === 'fxv2-search') {
      state.q = event.target.value;
      var list = root.querySelector('[data-vertical-list]');
      if (list) list.innerHTML = verticalAccordionHtml(template);
      return;
    }
    if (!template || !step) return;
    if (event.target.hasAttribute('data-step-name')) {
      step.name = event.target.value;
      markDirty(template);
      refreshEditingSignals(template);
    } else if (event.target.hasAttribute('data-step-description')) {
      step.description = event.target.value;
      markDirty(template);
      refreshEditingSignals(template);
    } else if (event.target.hasAttribute('data-step-days')) {
      step.offsetDays = parseInt(event.target.value, 10) || '';
      markDirty(template);
      refreshEditingSignals(template);
    } else if (event.target.hasAttribute('data-task-input')) {
      step.tasks[parseInt(event.target.getAttribute('data-task-input'), 10)].label = event.target.value;
      markDirty(template);
      refreshEditingSignals(template);
    }
  }

  function scrollSequence(direction) {
    var sequence = root.querySelector('.fxv2-sequence-scroll');
    if (!sequence || !direction) return;
    sequence.scrollBy({ left: direction * Math.max(sequence.clientWidth * 0.7, 240), behavior: 'smooth' });
    window.setTimeout(function () { state.sequenceScroll = sequence.scrollLeft; }, 250);
  }

  function refreshEditingSignals(template) {
    var step = selectedStep(template);
    var errors = templateErrors(template);
    var publication = publicationState(template);
    var save = root.querySelector('[data-save-template]');
    if (save) save.disabled = !isDirty(template) || !!errors.length;
    var saveLabel = root.querySelector('[data-save-label]');
    if (saveLabel) saveLabel.textContent = publication.pending ? 'Publicare în așteptare' : (publication.dirty ? 'Publică modificările' : 'Publicat');
    var saveIcon = save ? save.querySelector('.material-symbols-outlined') : null;
    if (saveIcon) saveIcon.textContent = publication.pending ? 'pending_actions' : 'publish';
    var pill = root.querySelector('[data-validation-pill]');
    if (pill) {
      pill.classList.toggle('pill--pending', !!errors.length);
      pill.classList.toggle('pill--success', !errors.length);
      pill.textContent = errors.length ? 'De corectat' : 'Structură validă';
    }
    var draft = root.querySelector('[data-draft-state]');
    if (draft && publication.dirty && !draft.classList.contains('fxv2-draft')) {
      draft.className = 'fxv2-draft';
      draft.innerHTML = '<span></span>Ciornă salvată';
    }
    var impact = root.querySelector('.fxv2-impact');
    if (impact) {
      impact.classList.toggle('is-pending', publication.pending);
      var impactIcon = impact.querySelector(':scope > .material-symbols-outlined');
      if (impactIcon) impactIcon.textContent = publication.pending ? 'pending_actions' : 'info';
      var impactTitle = impact.querySelector('[data-impact-title]');
      if (impactTitle) impactTitle.textContent = publication.pending ? 'Politica de actualizare nu este decisă.' : 'Ciorna este pregătită pentru publicare.';
      var impactCopy = impact.querySelector('[data-impact-copy]');
      if (impactCopy) impactCopy.textContent = publication.copy;
    }
    var sequenceName = root.querySelector('[data-sequence-name="' + state.stepIndex + '"]');
    if (sequenceName) sequenceName.textContent = step.name || 'Pas fără nume';
    var currentNode = root.querySelector('.fxv2-step-node.is-selected small');
    if (currentNode) currentNode.textContent = 'Ziua ' + (step.offsetDays || '—');
    var field = root.querySelector('[data-deadline-field]');
    var error = deadlineError(template, state.stepIndex);
    if (field) field.classList.toggle('has-error', !!error);
    var errorEl = root.querySelector('[data-deadline-error]');
    if (errorEl) errorEl.textContent = error;
  }

  function addStepAt(index) {
    var template = selectedTemplate();
    if (!template) return;
    var previous = index > 0 ? parseInt(template.steps[index - 1].offsetDays, 10) || 0 : 0;
    var next = index < template.steps.length ? parseInt(template.steps[index].offsetDays, 10) || 0 : previous + 10;
    var days;
    if (next - previous > 1) days = previous + Math.floor((next - previous) / 2);
    else {
      days = previous + 5;
      template.steps.slice(index).forEach(function (step, offset) { step.offsetDays = days + ((offset + 1) * 5); });
    }
    template.steps.splice(index, 0, newStep(template.id, index + 1, days));
    state.stepIndex = index;
    markDirty(template);
    renderPage();
  }

  function moveStep(direction) {
    var template = selectedTemplate();
    if (!template) return;
    var target = state.stepIndex + direction;
    if (target < 0 || target >= template.steps.length) return;
    var slots = template.steps.map(function (step) { return step.offsetDays; });
    var moved = template.steps.splice(state.stepIndex, 1)[0];
    template.steps.splice(target, 0, moved);
    template.steps.forEach(function (step, index) { step.offsetDays = slots[index]; });
    state.stepIndex = target;
    markDirty(template);
    renderPage();
  }

  function duplicateStep() {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!template || !step) return;
    var copy = clone(step);
    copy.id = nextStepId(template.id);
    copy.name = step.name + ' — copie';
    copy.offsetDays = (parseInt(step.offsetDays, 10) || 0) + 5;
    copy.tasks = normalizeTasks(copy.tasks, copy.id);
    copy.tasks.forEach(function (task, index) { task.id = copy.id + '_task_' + (index + 1); });
    var insertAt = state.stepIndex + 1;
    template.steps.slice(insertAt).forEach(function (later, offset) {
      if ((parseInt(later.offsetDays, 10) || 0) <= copy.offsetDays + offset) later.offsetDays = copy.offsetDays + ((offset + 1) * 5);
    });
    template.steps.splice(insertAt, 0, copy);
    state.stepIndex = insertAt;
    markDirty(template);
    renderPage();
    toast('success', 'Pasul a fost duplicat în ciornă.');
  }

  function confirmDeleteStep() {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!template || !step) return;
    if (template.steps.length <= 1) {
      openDialog({
        title: 'Fluxul are nevoie de un pas',
        bodyHtml: '<div class="fxv2-dialog-note"><span class="material-symbols-outlined" aria-hidden="true">block</span><span>Un flux poate fi foarte simplu, dar trebuie să păstreze cel puțin un pas de lucru.</span></div>',
        footerHtml: '<span class="modal__footer-helper"></span><button class="btn btn--primary" type="button" data-dialog-close>Am înțeles</button>'
      });
      return;
    }
    openDialog({
      title: 'Ștergi pasul „' + step.name + '”?',
      critical: true,
      submitLabel: 'Șterge pasul',
      bodyHtml: '<div class="fxv2-dialog-note fxv2-dialog-note--critical"><span class="material-symbols-outlined" aria-hidden="true">delete_forever</span><span>Se elimină din ciornă și task-urile, anexele și regulile acestui pas. Modificarea devine activă numai după publicare.</span></div>',
      onSubmit: function (dialog, close) {
        template.steps.splice(state.stepIndex, 1);
        state.stepIndex = Math.min(state.stepIndex, template.steps.length - 1);
        markDirty(template);
        close();
        renderPage();
      }
    });
  }

  function addTask() {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!step) return;
    step.tasks.push({ id: step.id + '_task_' + (step.tasks.length + 1) + '_' + Date.now().toString(36), label: 'Task nou', required: true });
    markDirty(template);
    renderPage();
  }

  function removeTask(index) {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!step || index < 0 || index >= step.tasks.length) return;
    step.tasks.splice(index, 1);
    markDirty(template);
    renderPage();
  }

  function setTaskRequired(index, required) {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!step || !step.tasks[index]) return;
    step.tasks[index].required = !!required;
    markDirty(template);
    renderPage();
  }

  function toggleRule(key) {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!step || key !== 'requireApproval') return;
    step[key] = !step[key];
    markDirty(template);
    renderPage();
  }

  function addAnexa() {
    var template = selectedTemplate();
    var step = selectedStep(template);
    var picker = root.querySelector('[data-anexa-picker]');
    if (!step || !picker || !picker.value) return;
    if (step.anexeIds.indexOf(picker.value) === -1) step.anexeIds.push(picker.value);
    markDirty(template);
    renderPage();
  }

  function removeAnexa(id) {
    var template = selectedTemplate();
    var step = selectedStep(template);
    if (!step) return;
    step.anexeIds = step.anexeIds.filter(function (item) { return item !== id; });
    markDirty(template);
    renderPage();
  }

  function confirmPublish() {
    var template = selectedTemplate();
    var errors = templateErrors(template);
    if (!template || errors.length) {
      toast('error', errors[0] || 'Fluxul nu poate fi publicat încă.');
      return;
    }
    var usedBy = usedByTypes(template.id);
    var ct = contextType();
    var contextClients = ct ? clients().filter(function (client) { return client.clientTypeId === ct.id; }) : [];
    var willAttachToContext = !!(ct && (ct.defaultTemplateIds || []).indexOf(template.id) === -1);
    if (willAttachToContext && contextClients.length) {
      persistModel();
      openDialog({
        title: 'Includerea fluxului este în așteptare',
        subtitle: ct.name,
        bodyHtml: '<div class="fxv2-dialog-note fxv2-dialog-note--critical"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><span><b>' +
          contextClients.length + ' ' + plural(contextClients.length, 'client folosește', 'clienți folosesc') + ' deja acest tip.</b> Ciorna rămâne salvată, dar nu este inclusă până când politica de actualizare a clienților existenți este decisă.</span></div>',
        footerHtml: '<span class="modal__footer-helper">Nicio configurație de client nu a fost modificată.</span><button class="btn btn--primary" type="button" data-dialog-close>Am înțeles</button>'
      });
      return;
    }
    var publishedTypeCount = usedBy.length + (willAttachToContext ? 1 : 0);
    var affectedClients = affectedClientsForTemplate(template.id);
    if (affectedClients.length) {
      persistModel();
      openDialog({
        title: 'Publicarea este în așteptare',
        subtitle: template.name,
        bodyHtml: '<div class="fxv2-publish-summary"><div><b>' + affectedClients.length + '</b><span>' + plural(affectedClients.length, 'client existent', 'clienți existenți') + '</span></div>' +
          '<div><b>' + usedBy.length + '</b><span>' + plural(usedBy.length, 'tip de client', 'tipuri de clienți') + '</span></div><div><b>Ciornă</b><span>salvată local</span></div></div>' +
          '<div class="fxv2-dialog-note"><span class="material-symbols-outlined" aria-hidden="true">pending_actions</span><span><b>Structura nu a fost trimisă în registrul central.</b> Ciorna rămâne disponibilă pentru editare și previzualizare până se decide dacă o versiune publicată actualizează sau nu clienții existenți.</span></div>',
        footerHtml: '<span class="modal__footer-helper">Nicio configurație de client nu a fost modificată.</span><button class="btn btn--primary" type="button" data-dialog-close>Am înțeles</button>'
      });
      return;
    }
    openDialog({
      title: 'Publici noua structură?',
      subtitle: template.name,
      submitLabel: 'Publică modificările',
      bodyHtml: '<div class="fxv2-publish-summary"><div><b>' + template.steps.length + '</b><span>' + plural(template.steps.length, 'pas', 'pași') + '</span></div>' +
        '<div><b>Ziua ' + template.steps[template.steps.length - 1].offsetDays + '</b><span>termen final</span></div><div><b>' + publishedTypeCount + '</b><span>' + plural(publishedTypeCount, 'tip de client', 'tipuri de clienți') + '</span></div></div>' +
        '<div class="fxv2-dialog-note"><span class="material-symbols-outlined" aria-hidden="true">verified</span><span>' +
          (willAttachToContext ? 'Fluxul va fi publicat și inclus automat în tipul „' + esc(ct.name) + '”.' : 'Fluxul va fi salvat în registrul central și va deveni disponibil imediat la înrolare.') + '</span></div>',
      onSubmit: function (dialog, close) {
        if (typeof window.scripticaFlowSave !== 'function') {
          toast('error', 'Registrul central nu este disponibil. Reîncarcă pagina și încearcă din nou.');
          return;
        }
        window.scripticaFlowSave('template', clone(template));
        attachTemplateToContext(template.id);
        removeDraftId('draftTemplateIds', template.id);
        persistModel();
        close();
        renderPage();
        toast('success', 'Fluxul „' + template.name + '” a fost publicat' + (willAttachToContext ? ' și inclus în „' + ct.name + '”.' : ' în registrul central.'));
      }
    });
  }

  function openPreview() {
    var template = selectedTemplate();
    if (!template) return;
    var current = Math.min(state.stepIndex, template.steps.length - 1);
    var timeline = template.steps.map(function (step, index) {
      var cls = index < current ? ' is-done' : (index === current ? ' is-current' : '');
      return '<div class="fxv2-preview-step' + cls + '"><span>' + (index < current ? '<span class="material-symbols-outlined" aria-hidden="true">check</span>' : (index + 1)) + '</span>' +
        '<div><b>' + esc(step.name) + '</b><small>Termen: ziua ' + esc(step.offsetDays) + ' · ' + (step.tasks || []).length + ' task-uri · ' + (step.anexeIds || []).length + ' anexe</small></div></div>';
    }).join('');
    var step = template.steps[current];
    var previewTasks = (step.tasks || []).map(function (task, index) {
      var required = task.required !== false;
      return '<div class="fxv2-preview-requirement" data-preview-task="' + index + '" data-blocking="' + (required ? 'true' : 'false') + '">' +
        '<label><input type="checkbox"><span class="material-symbols-outlined" aria-hidden="true">check_box_outline_blank</span><b>' + esc(taskLabel(task)) + '</b></label>' +
        '<span class="pill ' + (required ? 'pill--critical' : 'pill--neutral') + '">' + (required ? 'Obligatoriu' : 'Opțional') + '</span>' +
        (required ? '<span class="fxv2-block-tooltip" role="tooltip"><span class="material-symbols-outlined" aria-hidden="true">priority_high</span>Bifează task-ul obligatoriu înainte de a continua.</span>' : '') +
      '</div>';
    }).join('');
    var previewAnexe = (step.anexeIds || []).map(function (id) {
      var anexa = anexaById(id);
      var count = requiredFieldCount(anexa);
      return '<div class="fxv2-preview-anexa" data-preview-anexa="' + esc(id) + '" data-blocking="' + (count ? 'true' : 'false') + '">' +
        '<span class="material-symbols-outlined" aria-hidden="true">description</span><div><b>' + esc(anexa ? anexa.name : id) + '</b><small data-preview-anexa-status>' +
          (count ? count + ' ' + plural(count, 'câmp obligatoriu necompletat', 'câmpuri obligatorii necompletate') : 'Fără câmpuri obligatorii') + '</small></div>' +
        (count ? '<button class="btn btn--ghost" type="button" data-preview-complete>Simulează completarea</button>' : '<span class="pill pill--success">Completă</span>') +
        (count ? '<span class="fxv2-block-tooltip" role="tooltip"><span class="material-symbols-outlined" aria-hidden="true">priority_high</span>Completează toate câmpurile obligatorii din anexă.</span>' : '') +
      '</div>';
    }).join('');
    var dialog = openDialog({
      title: 'Previzualizare — ' + template.name,
      subtitle: 'Testează aici feedback-ul primit când cerințele obligatorii nu sunt îndeplinite.',
      wide: true,
      bodyHtml: '<div class="fxv2-preview"><div class="fxv2-preview__timeline">' + timeline + '</div>' +
        '<div class="fxv2-preview__workspace"><span class="pill pill--progress">Pasul ' + (current + 1) + ' din ' + template.steps.length + '</span><h3>' + esc(step.name) + '</h3>' +
          '<p>' + esc(step.description || 'Echipa lucrează task-urile și anexele configurate pentru acest pas.') + '</p>' +
          '<div class="fxv2-preview__stats"><span><span class="material-symbols-outlined" aria-hidden="true">checklist</span>' + step.tasks.length + ' task-uri</span>' +
            '<span><span class="material-symbols-outlined" aria-hidden="true">description</span>' + step.anexeIds.length + ' anexe</span>' +
            '<span><span class="material-symbols-outlined" aria-hidden="true">event</span>Ziua ' + step.offsetDays + '</span></div>' +
          '<section class="fxv2-preview__requirements"><div class="fxv2-preview__section-title"><h4>Task-uri</h4><span>Doar cele obligatorii blochează pasul.</span></div>' +
            (previewTasks || '<div class="fxv2-mini-empty">Niciun task în acest pas.</div>') + '</section>' +
          '<section class="fxv2-preview__requirements"><div class="fxv2-preview__section-title"><h4>Anexe</h4><span>Blocarea vine automat din câmpurile anexei.</span></div>' +
            (previewAnexe || '<div class="fxv2-mini-empty">Nicio anexă în acest pas.</div>') + '</section>' +
          '<div class="fxv2-preview-alert" role="alert" aria-live="polite" data-preview-alert hidden></div>' +
          '<button class="btn btn--primary" type="button" data-preview-finalize>Finalizează pasul<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button></div></div>',
      footerHtml: '<span class="modal__footer-helper">Previzualizarea nu modifică fluxul.</span><button class="btn btn--primary" type="button" data-dialog-close>Închide</button>'
    });
    dialog.addEventListener('change', function (event) {
      var taskRow = event.target.closest('[data-preview-task]');
      if (!taskRow) return;
      taskRow.classList.remove('is-blocked');
      var icon = taskRow.querySelector('label .material-symbols-outlined');
      if (icon) icon.textContent = event.target.checked ? 'check_box' : 'check_box_outline_blank';
    });
    dialog.addEventListener('click', function (event) {
      var completeButton = event.target.closest('[data-preview-complete]');
      if (completeButton) {
        var anexaCard = completeButton.closest('[data-preview-anexa]');
        anexaCard.classList.add('is-complete');
        anexaCard.classList.remove('is-blocked');
        var anexaStatus = anexaCard.querySelector('[data-preview-anexa-status]');
        if (anexaStatus) anexaStatus.textContent = 'Toate câmpurile obligatorii sunt completate';
        completeButton.outerHTML = '<span class="pill pill--success"><span class="material-symbols-outlined" aria-hidden="true">check</span>Completă</span>';
        return;
      }
      if (!event.target.closest('[data-preview-finalize]')) return;
      var blocked = [];
      dialog.querySelectorAll('[data-preview-task][data-blocking="true"]').forEach(function (row) {
        var checkbox = row.querySelector('input[type="checkbox"]');
        row.classList.remove('is-blocked', 'is-primary-blocker');
        if (!checkbox.checked) blocked.push(row);
      });
      dialog.querySelectorAll('[data-preview-anexa][data-blocking="true"]').forEach(function (card) {
        card.classList.remove('is-blocked', 'is-primary-blocker');
        if (!card.classList.contains('is-complete')) blocked.push(card);
      });
      var alert = dialog.querySelector('[data-preview-alert]');
      if (blocked.length) {
        blocked.forEach(function (item) {
          void item.offsetWidth;
          item.classList.add('is-blocked');
        });
        blocked[0].classList.add('is-primary-blocker');
        alert.hidden = false;
        alert.className = 'fxv2-preview-alert is-critical';
        alert.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">error</span><span><b>Pasul nu poate fi finalizat.</b> Completează elementele obligatorii evidențiate.</span>';
        blocked[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast('error', 'Pasul este blocat de cerințe obligatorii necompletate.');
      } else {
        alert.hidden = false;
        alert.className = 'fxv2-preview-alert is-success';
        alert.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span><b>Pasul poate fi finalizat.</b> Toate cerințele obligatorii sunt îndeplinite.</span>';
        toast('success', 'Toate cerințele obligatorii sunt îndeplinite.');
      }
    });
  }

  function fieldHtml(label, control, help, name) {
    return '<div class="form-field"' + (name ? ' data-field="' + esc(name) + '"' : '') + '><label class="form-label">' + esc(label) + '</label>' + control +
      (help ? '<span class="form-helper">' + esc(help) + '</span>' : '') + '<span class="form-error" role="alert"></span></div>';
  }

  function setFieldError(scope, name, message) {
    var field = scope.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle('has-error', !!message);
    var error = field.querySelector('.form-error');
    if (error) error.textContent = message || '';
  }

  function fval(scope, name) {
    var field = scope.querySelector('[data-f="' + name + '"]');
    return field ? field.value.trim() : '';
  }

  function frequencyOptions(selected) {
    return FREQUENCIES.map(function (frequency) {
      return '<option value="' + frequency + '"' + (frequency === selected ? ' selected' : '') + '>' + frequency + '</option>';
    }).join('');
  }

  function templateCategoryOptionsHtml(template) {
    var vertical = verticalById(template.verticalId);
    var selected = template.documentCategoryIds || [];
    return ((vertical && vertical.documentCategories) || []).map(function (category) {
      var typeCount = (category.documentTypes || []).length;
      var checked = category.system || selected.indexOf(category.id) !== -1;
      return '<label class="fxv2-category-choice' + (category.system ? ' is-system' : '') + '">' +
        '<input type="checkbox" data-template-category="' + esc(category.id) + '"' + (checked ? ' checked' : '') + (category.system ? ' disabled' : '') + '>' +
        '<span class="fxv2-category-choice__check"><span class="material-symbols-outlined" aria-hidden="true">check</span></span>' +
        '<span><b>' + esc(category.name) + '</b><small>' + typeCount + ' ' + plural(typeCount, 'tip de document', 'tipuri de documente') +
          (category.system ? ' · categorie permanentă' : '') + '</small></span></label>';
    }).join('');
  }

  function openTemplateSettings(template) {
    if (!template) return;
    var initial = JSON.stringify({ name: template.name, frequency: template.frequency, status: template.status, description: template.description, documentCategoryIds: template.documentCategoryIds || [] });
    function current(dialog) {
      return JSON.stringify({ name: fval(dialog, 'name'), frequency: fval(dialog, 'frequency'), status: fval(dialog, 'status'), description: fval(dialog, 'description'), documentCategoryIds: selectedCategoryIds(dialog, template.verticalId) });
    }
    openDialog({
      title: 'Setările fluxului',
      subtitle: template.name,
      wide: true,
      bodyHtml: fieldHtml('Denumire flux', '<input class="input" type="text" data-f="name" value="' + esc(template.name) + '">', null, 'name') +
        '<div class="fxv2-dialog-grid">' +
          fieldHtml('Frecvență', '<select class="select" data-f="frequency">' + frequencyOptions(template.frequency) + '</select>') +
          fieldHtml('Status', '<select class="select" data-f="status"><option value="activ"' + ((template.status || 'activ') === 'activ' ? ' selected' : '') + '>activ</option><option value="inactiv"' + (template.status === 'inactiv' ? ' selected' : '') + '>inactiv</option></select>') +
        '</div>' +
        fieldHtml('Descriere', '<textarea class="input" rows="3" data-f="description">' + esc(template.description || '') + '</textarea>') +
        '<section class="fxv2-category-settings" data-field="categories"><div class="fxv2-category-settings__head"><div><h3>Categorii vizibile în acest flux</h3>' +
          '<p>Fluxul moștenește vocabularul verticalei. Poți ascunde categoriile nerelevante, fără să le redenumești.</p></div>' +
          '<button class="btn btn--ghost" type="button" data-open-vertical-categories><span class="material-symbols-outlined" aria-hidden="true">category</span>Editează vocabularul verticalei</button></div>' +
          '<div class="fxv2-category-choices">' + templateCategoryOptionsHtml(template) + '</div><span class="form-error" role="alert"></span></section>' +
        '<div class="fxv2-settings-danger"><div><b>Zonă sensibilă</b><span>Ștergerea este blocată cât timp fluxul este inclus într-un tip de client.</span></div><button class="btn btn--critical" type="button" data-delete-template>Șterge fluxul</button></div>',
      submitLabel: 'Aplică în ciornă',
      isDirty: function (dialog) { return current(dialog) !== initial; },
      onSubmit: function (dialog, close) {
        var name = fval(dialog, 'name');
        var selectedCategories = selectedCategoryIds(dialog, template.verticalId);
        var vertical = verticalById(template.verticalId);
        var nonSystem = selectedCategories.filter(function (id) {
          var category = (vertical.documentCategories || []).find(function (item) { return item.id === id; });
          return category && !category.system;
        });
        setFieldError(dialog, 'name', name ? '' : 'Denumirea fluxului este obligatorie.');
        setFieldError(dialog, 'categories', nonSystem.length ? '' : 'Păstrează cel puțin o categorie de lucru în flux.');
        if (!name || !nonSystem.length) return;
        template.name = name;
        template.frequency = fval(dialog, 'frequency');
        template.status = fval(dialog, 'status');
        template.description = fval(dialog, 'description');
        template.documentCategoryIds = selectedCategories;
        markDirty(template);
        close();
        renderPage();
      }
    });
  }

  function selectedCategoryIds(scope, verticalId) {
    var selected = [];
    scope.querySelectorAll('[data-template-category]').forEach(function (input) {
      if (input.checked || input.disabled) selected.push(input.getAttribute('data-template-category'));
    });
    var vertical = verticalById(verticalId);
    ((vertical && vertical.documentCategories) || []).forEach(function (category) {
      if (category.system && selected.indexOf(category.id) === -1) selected.push(category.id);
    });
    return selected;
  }

  function openNewTemplate() {
    var current = selectedTemplate();
    var vertical = selectedVertical();
    var verticalOptions = libraryVerticals().map(function (item) {
      return '<option value="' + esc(item.id) + '"' + (vertical && item.id === vertical.id ? ' selected' : '') + '>' + esc(item.name) + '</option>';
    }).join('');
    if (!verticalOptions) {
      toast('error', 'Creează mai întâi o verticală pentru acest tip de client.');
      return;
    }
    openDialog({
      title: 'Flux nou',
      subtitle: contextType()
        ? 'Fluxul va aparține unei verticale din tipul „' + contextType().name + '”.'
        : 'Alege domeniul și punctul de pornire; pașii se editează apoi direct în constructor.',
      bodyHtml: fieldHtml('Denumire flux', '<input class="input" type="text" data-f="name" placeholder="ex. Închidere anuală">', null, 'name') +
        '<div class="fxv2-dialog-grid">' +
          fieldHtml('Verticală', '<select class="select" data-f="vertical">' + verticalOptions + '</select>') +
          fieldHtml('Frecvență', '<select class="select" data-f="frequency">' + frequencyOptions('lunar') + '</select>') +
        '</div>' +
        fieldHtml('Structură inițială', '<select class="select" data-f="start"><option value="blank">Pornește cu un pas gol</option>' +
          (current ? '<option value="copy">Copiază structura „' + esc(current.name) + '”</option>' : '') + '</select>', 'Copierea include pașii, termenele, task-urile și anexele implicite.') +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description" placeholder="Ce rezultat produce acest flux?"></textarea>'),
      submitLabel: 'Creează ciorna',
      onSubmit: function (dialog, close) {
        var name = fval(dialog, 'name');
        var verticalId = fval(dialog, 'vertical');
        setFieldError(dialog, 'name', name ? '' : 'Denumirea fluxului este obligatorie.');
        if (!name || !verticalById(verticalId)) return;
        var id = uniqueId('ft', name, templates());
        var shouldCopy = fval(dialog, 'start') === 'copy' && current;
        var targetVertical = verticalById(verticalId);
        var steps = shouldCopy ? clone(current.steps) : [newStep(id, 1, 10)];
        var allowedAnexe = anexeForVertical(targetVertical).map(function (anexa) { return anexa.id; });
        var categoryIds = shouldCopy && current.verticalId === verticalId
          ? (current.documentCategoryIds || []).slice()
          : (targetVertical.documentCategories || []).map(function (category) { return category.id; });
        steps.forEach(function (step, index) {
          step.id = id + '_step_' + (index + 1);
          step.tasks = normalizeTasks(step.tasks, step.id);
          step.tasks.forEach(function (task, taskIndex) { task.id = step.id + '_task_' + (taskIndex + 1); });
          step.anexeIds = (step.anexeIds || []).filter(function (anexaId) { return allowedAnexe.indexOf(anexaId) !== -1; });
        });
        model.templates.push({
          id: id, verticalId: verticalId, name: name, frequency: fval(dialog, 'frequency'), status: 'activ',
          description: fval(dialog, 'description'), documentCategoryIds: categoryIds, steps: steps
        });
        state.verticalId = verticalId;
        state.expandedVerticalId = verticalId;
        state.templateId = id;
        state.stepIndex = 0;
        state.q = '';
        markDirty(templateById(id));
        close();
        renderPage();
        toast('success', 'Ciorna fluxului „' + name + '” a fost creată.');
      }
    });
  }

  function colorOptions(selected) {
    return COLORS.map(function (color) { return '<option value="' + color + '"' + (color === selected ? ' selected' : '') + '>' + color + '</option>'; }).join('');
  }

  function iconOptions(selected) {
    var icons = ['account_tree', 'fact_check', 'balance', 'verified_user', 'construction'];
    return icons.map(function (icon) {
      return '<option value="' + icon + '"' + (icon === selected ? ' selected' : '') + '>' + icon + '</option>';
    }).join('');
  }

  function allTaxonomyTypes(categories) {
    var out = [];
    (categories || []).forEach(function (category) {
      (category.documentTypes || []).forEach(function (type) { out.push(type); });
    });
    return out;
  }

  function documentTypeInUse(type) {
    var found = ((MOCK() && MOCK().documents) || []).some(function (doc) { return doc.tipDocument === type.name; });
    function treeUses(nodes) {
      return (nodes || []).some(function (node) {
        return (node.docTypeIds || []).indexOf(type.id) !== -1 || treeUses(node.children || []);
      });
    }
    return found || clientTypes().some(function (clientType) { return treeUses(clientType.archiveTree || []); });
  }

  function verticalCategoriesHtml(categories) {
    return (categories || []).map(function (category, categoryIndex) {
      var types = (category.documentTypes || []).map(function (type, typeIndex) {
        return '<div class="fxv2-type-row"><span class="material-symbols-outlined" aria-hidden="true">description</span>' +
          '<input class="input" type="text" data-category-index="' + categoryIndex + '" data-type-index="' + typeIndex + '" data-original-name="' + esc(type.name) + '" value="' + esc(type.name) + '" aria-label="Denumire tip de document">' +
          '<button type="button" data-remove-document-type="' + categoryIndex + ':' + typeIndex + '" aria-label="Elimină tipul ' + esc(type.name) + '"><span class="material-symbols-outlined" aria-hidden="true">close</span></button></div>';
      }).join('');
      return '<article class="fxv2-taxonomy-card' + (category.system ? ' is-system' : '') + '" data-taxonomy-category="' + categoryIndex + '">' +
        '<header><span class="fxv2-taxonomy-card__icon"><span class="material-symbols-outlined" aria-hidden="true">' + (category.system ? 'lock' : 'folder') + '</span></span>' +
          '<div><label class="sr-only" for="fxv2-category-' + categoryIndex + '">Denumire categorie</label><input id="fxv2-category-' + categoryIndex + '" class="input" type="text" data-category-name="' + categoryIndex + '" value="' + esc(category.name) + '"' + (category.system ? ' disabled' : '') + '>' +
          '<small>' + (category.system ? 'Categorie permanentă pentru documentele nerecunoscute' : 'Categoria implicită pentru tipurile de mai jos') + '</small></div>' +
          (!category.system ? '<button type="button" data-remove-document-category="' + categoryIndex + '" aria-label="Șterge categoria ' + esc(category.name) + '"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>' : '') + '</header>' +
        '<div class="fxv2-type-list">' + (types || '<p class="fxv2-type-empty">Niciun tip de document în această categorie.</p>') + '</div>' +
        (!category.system ? '<div class="fxv2-type-add"><input class="input" type="text" data-new-type-name="' + categoryIndex + '" placeholder="ex. Contract de servicii"><button class="btn btn--secondary" type="button" data-add-document-type="' + categoryIndex + '"><span class="material-symbols-outlined" aria-hidden="true">add</span>Adaugă tip</button></div>' : '') +
      '</article>';
    }).join('');
  }

  function syncTaxonomyInputs(dialog, categories) {
    dialog.querySelectorAll('[data-category-name]').forEach(function (input) {
      var category = categories[parseInt(input.getAttribute('data-category-name'), 10)];
      if (category && !category.system) category.name = input.value.trim();
    });
    dialog.querySelectorAll('[data-type-index]').forEach(function (input) {
      var category = categories[parseInt(input.getAttribute('data-category-index'), 10)];
      var type = category && category.documentTypes[parseInt(input.getAttribute('data-type-index'), 10)];
      if (type) type.name = input.value.trim();
    });
  }

  function taxonomyError(categories, originalCategories) {
    var categoryNames = {};
    var typeNames = {};
    var message = '';
    (categories || []).some(function (category) {
      var categoryName = normalize(category.name);
      if (!categoryName) { message = 'Fiecare categorie trebuie să aibă o denumire.'; return true; }
      if (categoryNames[categoryName]) { message = 'Denumirile categoriilor trebuie să fie unice în verticală.'; return true; }
      categoryNames[categoryName] = true;
      return (category.documentTypes || []).some(function (type) {
        var typeName = normalize(type.name);
        if (!typeName) { message = 'Fiecare tip de document trebuie să aibă o denumire.'; return true; }
        if (typeNames[typeName]) { message = 'Un tip de document poate aparține unei singure categorii.'; return true; }
        typeNames[typeName] = true;
        var original = allTaxonomyTypes(originalCategories).find(function (item) { return item.id === type.id; });
        if (original && original.name !== type.name && documentTypeInUse(original)) {
          message = 'Tipul „' + original.name + '” este deja folosit în documente sau în arhivă și nu poate fi redenumit aici.';
          return true;
        }
        return false;
      });
    });
    return message;
  }

  function syncTemplateCategories(vertical, originalCategories) {
    var validIds = (vertical.documentCategories || []).map(function (category) { return category.id; });
    var originalIds = (originalCategories || []).map(function (category) { return category.id; });
    var addedIds = validIds.filter(function (id) { return originalIds.indexOf(id) === -1; });
    var systemIds = (vertical.documentCategories || []).filter(function (category) { return category.system; }).map(function (category) { return category.id; });
    templatesForVertical(vertical.id).forEach(function (template) {
      var before = JSON.stringify(template.documentCategoryIds || []);
      template.documentCategoryIds = (template.documentCategoryIds || validIds).filter(function (id) { return validIds.indexOf(id) !== -1; });
      addedIds.forEach(function (id) { if (template.documentCategoryIds.indexOf(id) === -1) template.documentCategoryIds.push(id); });
      systemIds.forEach(function (id) { if (template.documentCategoryIds.indexOf(id) === -1) template.documentCategoryIds.push(id); });
      if (before !== JSON.stringify(template.documentCategoryIds)) addDraftId('draftTemplateIds', template.id);
    });
  }

  function openVerticalEditor(vertical) {
    var isNew = !vertical;
    var ct = contextType();
    if (isNew && !ct) {
      toast('error', 'Alege mai întâi tipul de client pentru care creezi verticala.');
      return;
    }
    var originalCategories = clone((vertical && vertical.documentCategories) || []);
    var workingCategories = clone(originalCategories);
    if (isNew) workingCategories = [
      { id: 'documente', name: 'Documente', system: false, documentTypes: [] },
      { id: 'necategorisit', name: 'Necategorisit', system: true, documentTypes: [] }
    ];
    var dialog = openDialog({
      title: isNew ? 'Verticală nouă pentru „' + ct.name + '”' : (vertical.builtin ? 'Categorii de documente — ' + vertical.name : 'Configurează verticala'),
      subtitle: isNew
        ? 'Pasul 2 din 4: definește un domeniu de lucru al acestui tip de client.'
        : 'Verticala grupează fluxuri și definește vocabularul folosit de clasificarea A.I. Pașii aparțin exclusiv fluxurilor.',
      wide: true,
      bodyHtml: '<div class="fxv2-dialog-note"><span class="material-symbols-outlined" aria-hidden="true">layers</span><span>Fiecare tip de document are o singură categorie implicită. Fluxurile moștenesc acest vocabular și pot doar să ascundă ce nu folosesc.</span></div>' +
        (vertical && vertical.builtin ? '<div class="fxv2-dialog-note"><span class="material-symbols-outlined" aria-hidden="true">lock</span><span>Identitatea acestei verticale este predefinită. Poți configura în continuare categoriile și tipurile sale de documente.</span></div>' : '') +
        fieldHtml('Denumire verticală', '<input class="input" type="text" data-f="name" value="' + esc(vertical ? vertical.name : '') + '" placeholder="ex. Consultanță juridică"' + (vertical && vertical.builtin ? ' disabled' : '') + '>', null, 'name') +
        '<div class="fxv2-dialog-grid">' +
          fieldHtml('Element de lucru', '<input class="input" type="text" data-f="itemLabel" value="' + esc(vertical ? vertical.itemLabel || '' : '') + '" placeholder="ex. Dosar"' + (vertical && vertical.builtin ? ' disabled' : '') + '>') +
          fieldHtml('Plural', '<input class="input" type="text" data-f="itemLabelPlural" value="' + esc(vertical ? vertical.itemLabelPlural || '' : '') + '" placeholder="ex. Dosare"' + (vertical && vertical.builtin ? ' disabled' : '') + '>') +
        '</div>' +
        '<div class="fxv2-dialog-grid">' +
          fieldHtml('Culoare', '<select class="select" data-f="color"' + (vertical && vertical.builtin ? ' disabled' : '') + '>' + colorOptions(vertical ? vertical.color || 'mov' : 'mov') + '</select>') +
          fieldHtml('Pictogramă', '<select class="select" data-f="icon"' + (vertical && vertical.builtin ? ' disabled' : '') + '>' + iconOptions(vertical ? vertical.icon || 'account_tree' : 'account_tree') + '</select>') +
        '</div>' +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description"' + (vertical && vertical.builtin ? ' disabled' : '') + '>' + esc(vertical ? vertical.description || '' : '') + '</textarea>') +
        '<section class="fxv2-taxonomy" data-field="taxonomy"><div class="fxv2-taxonomy__head"><div><h3>Categorii și tipuri de documente</h3><p>Tipurile de documente sunt valorile pe care le poate atribui clasificarea A.I.</p></div>' +
          '<button class="btn btn--secondary" type="button" data-add-document-category><span class="material-symbols-outlined" aria-hidden="true">create_new_folder</span>Categorie nouă</button></div>' +
          '<div class="fxv2-taxonomy__list" data-taxonomy-list>' + verticalCategoriesHtml(workingCategories) + '</div><span class="form-error" role="alert"></span></section>',
      submitLabel: isNew ? 'Creează verticala' : 'Aplică modificările',
      onSubmit: function (dialog, close) {
        syncTaxonomyInputs(dialog, workingCategories);
        var name = fval(dialog, 'name');
        var taxonomyMessage = taxonomyError(workingCategories, originalCategories);
        setFieldError(dialog, 'name', name ? '' : 'Denumirea verticalei este obligatorie.');
        setFieldError(dialog, 'taxonomy', taxonomyMessage);
        if (!name || taxonomyMessage) return;
        var itemLabel = fval(dialog, 'itemLabel') || 'Element';
        var savedVertical;
        var affectedClients = [];
        if (isNew) {
          var id = uniqueId('vert', name, verticals());
          savedVertical = {
            id: id, domain: slugify(name), builtin: false, status: 'activ', name: name,
            icon: fval(dialog, 'icon') || 'account_tree', color: fval(dialog, 'color') || 'mov',
            itemLabel: itemLabel, itemLabelPlural: fval(dialog, 'itemLabelPlural') || itemLabel,
            description: fval(dialog, 'description'), documentCategories: clone(workingCategories), documentFilters: [], documentVocabularyVersion: 1
          };
          model.verticals.push(savedVertical);
          state.verticalId = id;
          state.expandedVerticalId = id;
          state.templateId = '';
          state.stepIndex = 0;
        } else {
          vertical.name = name;
          vertical.itemLabel = itemLabel;
          vertical.itemLabelPlural = fval(dialog, 'itemLabelPlural') || itemLabel;
          vertical.color = fval(dialog, 'color') || vertical.color;
          vertical.icon = fval(dialog, 'icon') || vertical.icon;
          vertical.description = fval(dialog, 'description');
          vertical.documentCategories = clone(workingCategories);
          savedVertical = vertical;
          affectedClients = affectedClientsForVertical(vertical.id);
        }
        syncTemplateCategories(savedVertical, originalCategories);
        if (!affectedClients.length && typeof window.scripticaFlowSave === 'function') {
          window.scripticaFlowSave('vertical', clone(savedVertical));
          if (isNew) attachVerticalToContext(savedVertical.id);
          removeDraftId('draftVerticalIds', savedVertical.id);
        } else {
          addDraftId('draftVerticalIds', savedVertical.id);
        }
        persistModel();
        close();
        renderPage();
        toast(affectedClients.length ? 'info' : 'success', affectedClients.length
          ? 'Modificările verticalei au rămas în ciornă; clienții existenți nu au fost modificați.'
          : (isNew ? 'Verticala „' + savedVertical.name + '” a fost adăugată în „' + ct.name + '”. Definește acum primul ei flux.' : 'Verticala a fost actualizată în registrul central.'));
      }
    });
    dialog.addEventListener('click', function (event) {
      var addCategory = event.target.closest('[data-add-document-category]');
      var addType = event.target.closest('[data-add-document-type]');
      var removeType = event.target.closest('[data-remove-document-type]');
      var removeCategory = event.target.closest('[data-remove-document-category]');
      if (!addCategory && !addType && !removeType && !removeCategory) return;
      syncTaxonomyInputs(dialog, workingCategories);
      if (addCategory) {
        var categoryId = uniqueId('cat', 'categorie_noua', workingCategories);
        workingCategories.splice(Math.max(workingCategories.length - 1, 0), 0, { id: categoryId, name: 'Categorie nouă', system: false, documentTypes: [] });
      } else if (addType) {
        var categoryIndex = parseInt(addType.getAttribute('data-add-document-type'), 10);
        var input = dialog.querySelector('[data-new-type-name="' + categoryIndex + '"]');
        var typeName = input ? input.value.trim() : '';
        if (!typeName) { toast('error', 'Scrie denumirea tipului de document.'); return; }
        if (allTaxonomyTypes(workingCategories).some(function (type) { return normalize(type.name) === normalize(typeName); })) {
          toast('error', 'Acest tip de document există deja într-o categorie.'); return;
        }
        workingCategories[categoryIndex].documentTypes.push({ id: 'dt_' + slugify(typeName) + '_' + Date.now().toString(36) + '_' + (++uidSeq), name: typeName });
      } else if (removeType) {
        var parts = removeType.getAttribute('data-remove-document-type').split(':');
        var type = workingCategories[parseInt(parts[0], 10)].documentTypes[parseInt(parts[1], 10)];
        if (documentTypeInUse(type)) { toast('error', 'Tipul „' + type.name + '” este deja folosit și nu poate fi eliminat.'); return; }
        workingCategories[parseInt(parts[0], 10)].documentTypes.splice(parseInt(parts[1], 10), 1);
      } else if (removeCategory) {
        var removeIndex = parseInt(removeCategory.getAttribute('data-remove-document-category'), 10);
        if (workingCategories[removeIndex].documentTypes.length) { toast('error', 'Elimină mai întâi tipurile de documente din această categorie.'); return; }
        if (vertical && templatesForVertical(vertical.id).some(function (template) {
          return (template.documentCategoryIds || []).indexOf(workingCategories[removeIndex].id) !== -1;
        })) { toast('error', 'Categoria este folosită de cel puțin un flux. Ascunde-o în flux înainte de a o elimina.'); return; }
        workingCategories.splice(removeIndex, 1);
      }
      var list = dialog.querySelector('[data-taxonomy-list]');
      if (list) list.innerHTML = verticalCategoriesHtml(workingCategories);
    });
  }

  function confirmDeleteTemplate() {
    var template = selectedTemplate();
    if (!template) return;
    var usedBy = usedByTypes(template.id);
    if (usedBy.length) {
      openDialog({
        title: 'Fluxul nu poate fi șters',
        subtitle: template.name,
        bodyHtml: '<div class="fxv2-dialog-note fxv2-dialog-note--critical"><span class="material-symbols-outlined" aria-hidden="true">block</span><span><b>' + usedBy.length + ' ' + plural(usedBy.length, 'tip de client include', 'tipuri de clienți includ') + ' acest flux.</b> Scoate-l mai întâi din pachetele respective, apoi revino aici.</span></div>',
        footerHtml: '<span class="modal__footer-helper"></span><a class="btn btn--ghost" href="super-admin-tipuri-clienti-v2.html?view=superadmin">Deschide Tipuri de clienți</a><button class="btn btn--primary" type="button" data-dialog-close>Închide</button>'
      });
      return;
    }
    openDialog({
      title: 'Ștergi definitiv fluxul?', subtitle: template.name, critical: true, submitLabel: 'Șterge definitiv',
      bodyHtml: '<div class="fxv2-dialog-note fxv2-dialog-note--critical"><span class="material-symbols-outlined" aria-hidden="true">delete_forever</span><span>Se elimină toți pașii și configurațiile lor. Acțiunea nu poate fi anulată.</span></div>',
      onSubmit: function (dialog, close) {
        if (canonicalTemplateById(template.id) && typeof window.scripticaFlowDelete === 'function') {
          window.scripticaFlowDelete('template', template.id);
        }
        model.templates = model.templates.filter(function (item) { return item.id !== template.id; });
        removeDraftId('draftTemplateIds', template.id);
        state.templateId = templatesForVertical(state.verticalId)[0] ? templatesForVertical(state.verticalId)[0].id : '';
        state.stepIndex = 0;
        persistModel();
        close();
        renderPage();
        toast('success', 'Fluxul a fost șters.');
      }
    });
  }

  function openDialog(options) {
    var overlay = document.createElement('div');
    var titleId = 'fxv2-dialog-title-' + (++dialogSeq);
    var previousFocus = document.activeElement;
    var footer = options.footerHtml || '<span class="modal__footer-helper"></span><button class="btn btn--ghost" type="button" data-dialog-cancel>Anulează</button>' +
      '<button class="btn ' + (options.critical ? 'btn--critical' : 'btn--primary') + '" type="button" data-dialog-submit>' + esc(options.submitLabel || 'Salvează') + '</button>';
    overlay.className = 'modal is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.innerHTML = '<div class="modal__dialog' + (options.wide ? ' modal__dialog--wide' : '') + '" role="document">' +
      '<button class="modal__close" type="button" data-dialog-close aria-label="Închide fereastra"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
      '<header class="modal__header"><h2 class="modal__title" id="' + titleId + '">' + esc(options.title) + '</h2>' +
        (options.subtitle ? '<p class="modal__subtitle">' + esc(options.subtitle) + '</p>' : '') + '</header>' +
      '<form class="modal__body" novalidate>' + options.bodyHtml + '</form><footer class="modal__footer">' + footer + '</footer></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    var dialog = overlay.querySelector('.modal__dialog');

    function close() {
      overlay.remove();
      if (!document.querySelector('.modal.is-open')) document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }
    function guardedClose() {
      if (options.isDirty && options.isDirty(overlay)) {
        openDialog({
          title: 'Renunți la modificările nesalvate?', critical: true, submitLabel: 'Renunță la modificări',
          bodyHtml: '<div class="fxv2-dialog-note fxv2-dialog-note--critical"><span class="material-symbols-outlined" aria-hidden="true">warning</span><span>Modificările din această fereastră se vor pierde.</span></div>',
          onSubmit: function (confirmDialog, closeConfirm) { closeConfirm(); close(); }
        });
        return;
      }
      close();
    }
    function onKey(event) {
      if (!document.body.contains(overlay)) return;
      var dialogs = document.querySelectorAll('.modal.is-open');
      if (dialogs[dialogs.length - 1] !== overlay) return;
      if (event.key === 'Escape') { event.preventDefault(); guardedClose(); }
      else if (event.key === 'Tab') trapFocus(event, dialog);
    }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay || event.target.closest('[data-dialog-close], [data-dialog-cancel]')) guardedClose();
      else if (event.target.closest('[data-open-vertical-categories]')) { close(); openVerticalEditor(selectedVertical()); }
      else if (event.target.closest('[data-delete-template]')) { close(); confirmDeleteTemplate(); }
    });
    var form = overlay.querySelector('form');
    if (form) form.addEventListener('submit', function (event) { event.preventDefault(); });
    var submit = overlay.querySelector('[data-dialog-submit]');
    if (submit) submit.addEventListener('click', function (event) {
      event.preventDefault();
      if (options.onSubmit) options.onSubmit(overlay, close);
      else close();
    });
    setTimeout(function () {
      var first = dialog.querySelector('.modal__body input:not([disabled]), .modal__body select:not([disabled]), .modal__body textarea:not([disabled]), .modal__body button:not([disabled])') || dialog.querySelector('[data-dialog-submit], [data-dialog-close]');
      if (first) first.focus();
    }, 0);
    return overlay;
  }

  function trapFocus(event, container) {
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function init() {
    root = document.getElementById('fxv2-root');
    if (!root || !SA()) return;
    var params = new URLSearchParams(window.location.search);
    var openNewVertical = params.get('new') === 'vertical';
    model = loadModel();
    persistModel();
    initialSelection();
    root.addEventListener('click', handleClick);
    root.addEventListener('input', handleInput);
    renderPage();
    if (openNewVertical && contextType()) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.delete('new');
        window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
      } catch (e) { /* Relansarea modalului la refresh nu blochează prototipul. */ }
      window.setTimeout(function () { openVerticalEditor(null); }, 0);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
