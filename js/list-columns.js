/* ============================================================
   Scriptica — Motorul configurabil de coloane (Feedback #2)
   Ordine efectivă: override cont → implicit verticală → listView legacy →
   catalogul fix. Sursele pot veni din sistem, profilul beneficiarului sau
   câmpurile anexelor. Răspunsurile anexelor rămân indexate după poziție.
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */
(function () {
  'use strict';

  var TODAY = new Date('2026-04-20T00:00:00');
  var SCALAR_ANNEX_TYPES = ['text_short', 'text_long', 'number', 'currency', 'date', 'month', 'dropdown', 'radio', 'boolean', 'calculated', 'email', 'phone', 'cui', 'address', 'checkboxes', 'client_picker'];
  var FILE_ANNEX_TYPES = ['file_upload', 'document_picker'];
  var TYPE_LABELS = {
    text_short: 'Text scurt', text_long: 'Text lung', number: 'Număr', currency: 'Valută',
    date: 'Dată', month: 'Lună', dropdown: 'Listă de opțiuni', radio: 'Alegere unică', boolean: 'Da / Nu',
    calculated: 'Valoare calculată', email: 'E-mail', phone: 'Telefon', cui: 'CUI / identificator',
    address: 'Adresă', checkboxes: 'Alegere multiplă', client_picker: 'Beneficiar din portofoliu', file_upload: 'Fișier', document_picker: 'Documente',
    table: 'Tabel complex', repeater_block: 'Bloc repetabil'
  };

  function MOCK() { return window.SCRIPTICA_MOCK || {}; }
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function fmtDate(iso) {
    if (!iso) return '—';
    var parts = String(iso).split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : String(iso);
  }
  function daysDiff(iso) {
    var date = new Date(iso + 'T00:00:00');
    if (isNaN(date)) return null;
    return Math.ceil((date - TODAY) / 86400000);
  }
  function selectedTenant(client) {
    if (client !== undefined) return client;
    return typeof window.scripticaTenantAccount === 'function' ? window.scripticaTenantAccount() : null;
  }
  function externalPartyLabel(vertical, client) {
    var tenant = selectedTenant(client);
    var verticalId = vertical && vertical.id;
    if (tenant && typeof window.scripticaEffectiveExternalParty === 'function') {
      return window.scripticaEffectiveExternalParty(tenant, verticalId).singular;
    }
    if (typeof window.getCurrentView !== 'function' || window.getCurrentView() !== 'superadmin') {
      if (typeof window.scripticaEffectiveExternalParty === 'function') return window.scripticaEffectiveExternalParty(undefined, verticalId).singular;
    }
    if (vertical && vertical.externalParty && vertical.externalParty.singular) return vertical.externalParty.singular;
    return vertical.domain === 'audit' ? 'Entitate' : 'Client';
  }

  var STATUS_LABELS = {
    analiza: 'Analiză', asteapta_documente: 'Așteaptă Documente', in_verificare: 'În Verificare',
    spre_aprobare: 'Spre Aprobare', aprobata: 'Aprobată', finalizat: 'Finalizat',
    inchisa: 'Închisă', anulata: 'Anulată', intarziere: 'În Întârziere'
  };

  function termenCell(normalized) {
    if (normalized.termenState === 'finalizat') return '<span class="termen--finalizat">Finalizată</span>';
    if (normalized.termenState === 'anulat') return '<span class="termen--anulat">Anulată</span>';
    if (!normalized.deadlineIso) return '—';
    var days = daysDiff(normalized.deadlineIso);
    if (days == null) return '—';
    if (days < 0) return '<span class="termen--overdue">' + Math.abs(days) + (Math.abs(days) === 1 ? ' zi întârziere' : ' zile întârziere') + '</span>';
    if (days === 0) return '<span class="termen--today">azi</span>';
    if (days <= 3) return '<span class="termen--soon">' + days + (days === 1 ? ' zi' : ' zile') + '</span>';
    return '<span class="termen--ok">' + days + ' zile</span>';
  }
  function statusCell(normalized) {
    return '<span class="sit-status sit-status--' + esc(normalized.status) + '"><span class="status-dot status-dot--' + esc(normalized.status) + '"></span>' +
      esc(STATUS_LABELS[normalized.status] || normalized.status) + '</span>';
  }
  function progressCell(normalized) {
    if (!normalized.totalSteps) return '—';
    var ratio = (normalized.stepsCompleted || 0) / normalized.totalSteps;
    var css = ratio < 0.25 ? 'is-low' : (ratio < 0.75 ? 'is-mid' : 'is-high');
    return '<span class="pill pill--progress ' + css + '">' + (normalized.stepsCompleted || 0) + '/' + normalized.totalSteps + '</span>';
  }
  function avatarsCell(normalized) {
    var ids = normalized.responsibleIds || [];
    if (!ids.length) return '—';
    var shown = ids.slice(0, 3);
    var html = shown.map(function (id) {
      var employee = (MOCK().employees || []).find(function (item) { return item.id === id; });
      if (!employee) return '';
      return '<span class="lv-avatar" title="' + esc(employee.name) + '">' +
        (typeof window.renderAvatar === 'function' ? window.renderAvatar(employee, 28) : esc(employee.name.charAt(0))) + '</span>';
    }).join('');
    return '<span class="lv-avatars">' + html + (ids.length > shown.length ? '<span class="lv-avatars__more">+' + (ids.length - shown.length) + '</span>' : '') + '</span>';
  }
  function elementCell(normalized) {
    return '<div class="lv-name">' + esc(normalized.name || '—') + '</div>' + (normalized.party ? '<div class="lv-sub">' + esc(normalized.party) + '</div>' : '');
  }

  /* Catalogul sistem păstrează id-urile vechi pentru compatibilitate. */
  var SYSTEM_CATALOG = [
    { id: 'element', icon: 'badge', width: null, domains: null, fieldType: 'text_short',
      label: function (v) { return v.itemLabel || 'Element'; }, desc: 'Denumirea activității și partea externă.', render: elementCell },
    { id: 'cod', icon: 'tag', width: 140, domains: ['contabil'], fieldType: 'text_short',
      label: function () { return 'Cod'; }, desc: 'Codul intern al activității.', render: function (n) { return '<span class="sit-cell--code">' + esc(n.code || '—') + '</span>'; } },
    { id: 'partener', icon: 'apartment', width: null, domains: null, fieldType: 'text_short',
      label: function (v, c) { return externalPartyLabel(v, c); }, desc: 'Partea externă a activității.', render: function (n) { return esc(n.party || '—'); } },
    { id: 'tip', icon: 'category', width: 220, domains: null, fieldType: 'text_short',
      label: function (v) { return v.domain === 'contabil' ? 'Denumire Raport' : 'Șablon'; }, desc: 'Șablonul din care este creată activitatea.', render: function (n) { return esc(n.typeName || '—'); } },
    { id: 'termen', icon: 'schedule', width: 110, domains: null, fieldType: 'deadline',
      label: function () { return 'Termen'; }, desc: 'Timpul rămas până la termenul curent.', render: termenCell },
    { id: 'termen_data', icon: 'event', width: 130, domains: null, fieldType: 'date',
      label: function () { return 'Data termen'; }, desc: 'Data calendaristică a termenului curent.', render: function (n) { return fmtDate(n.deadlineIso); } },
    { id: 'status', icon: 'flag', width: 180, domains: null, fieldType: 'status',
      label: function () { return 'Status'; }, desc: 'Statusul curent, cu indicator semantic.', render: statusCell },
    { id: 'titular', icon: 'person', width: 160, domains: ['contabil'], fieldType: 'person',
      label: function () { return 'Titular'; }, desc: 'Responsabilul general al activității.', render: function (n) { return esc(n.titularName || '—'); } },
    { id: 'responsabil_pas', icon: 'person_pin_circle', width: 160, domains: ['contabil'], fieldType: 'person',
      label: function () { return 'Responsabil Pas'; }, desc: 'Responsabilul etapei curente.', render: function (n) { return esc(n.respStepName || '—'); } },
    { id: 'responsabili', icon: 'group', width: 160, domains: ['audit', 'custom'], fieldType: 'team',
      label: function () { return 'Responsabili'; }, desc: 'Echipa responsabilă.', render: avatarsCell },
    { id: 'data_start', icon: 'today', width: 120, domains: null, fieldType: 'date',
      label: function () { return 'Dată Start'; }, desc: 'Data de început a activității.', render: function (n) { return fmtDate(n.startDate); } },
    { id: 'progres', icon: 'clock_loader_40', width: 90, domains: null, fieldType: 'progress',
      label: function () { return 'Pas'; }, desc: 'Progresul pe etape.', render: progressCell },
    { id: 'etapa', icon: 'footprint', width: 200, domains: null, fieldType: 'text_short',
      label: function () { return 'Etapa curentă'; }, desc: 'Numele etapei curente.', render: function (n) { return esc(n.currentStepName || '—'); } },
    { id: 'perioada', icon: 'date_range', width: 160, domains: ['contabil', 'audit'], fieldType: 'text_short',
      label: function (v) { return v.domain === 'audit' ? 'Perioadă auditată' : 'Perioadă'; }, desc: 'Perioada acoperită de activitate.', render: function (n) { return esc(n.perioada || '—'); } },
    { id: 'plan_anual', icon: 'event_note', width: 120, domains: ['audit'], fieldType: 'text_short',
      label: function () { return 'Plan anual'; }, desc: 'Planul anual din care provine misiunea.', render: function (n) { return esc(n.planLabel || '—'); } }
  ];
  var DEFAULTS = {
    contabil: ['cod', 'partener', 'titular', 'data_start', 'termen', 'responsabil_pas', 'status', 'tip', 'progres'],
    audit: ['element', 'tip', 'termen', 'responsabili', 'status'],
    custom: ['element', 'tip', 'termen', 'responsabili', 'status']
  };

  function domainKey(vertical) { return vertical && (vertical.domain === 'contabil' || vertical.domain === 'audit') ? vertical.domain : 'custom'; }
  function colById(id) { return SYSTEM_CATALOG.find(function (column) { return column.id === id; }) || null; }
  function availableFor(vertical) {
    var key = domainKey(vertical);
    return SYSTEM_CATALOG.filter(function (column) { return !column.domains || column.domains.indexOf(key) !== -1; });
  }
  function defaultsFor(vertical) { return DEFAULTS[domainKey(vertical)].slice(); }
  function systemSource(column, vertical, client) {
    return {
      sourceKey: 'system:' + column.id, group: 'system', groupLabel: 'Sistem', icon: column.icon,
      label: column.label(vertical, client), desc: column.desc, fieldType: column.fieldType,
      typeLabel: TYPE_LABELS[column.fieldType] || ({ status: 'Status', deadline: 'Termen', person: 'Persoană', team: 'Echipă', progress: 'Progres' }[column.fieldType] || 'Câmp sistem'),
      width: column.width, supported: true, sourcePath: 'Sistem → ' + column.label(vertical, client), systemColumn: column
    };
  }

  function profileSources(vertical, client) {
    if (!client || typeof window.scripticaEffectiveBeneficiaryProfileSchema !== 'function') return [];
    var schema = window.scripticaEffectiveBeneficiaryProfileSchema(client);
    return (schema.fields || []).filter(function (field) { return field.type !== 'section_title'; }).map(function (field) {
      return {
        sourceKey: 'profile:' + field.id, group: 'profile', groupLabel: 'Profil beneficiar',
        icon: ((window.SCRIPTICA_BENEFICIARY_PROFILE || {}).typeMeta || {})[field.type] ? window.SCRIPTICA_BENEFICIARY_PROFILE.typeMeta[field.type].icon : 'badge',
        label: field.label || 'Câmp beneficiar', desc: field.help || 'Câmp definit în profilul beneficiarului.',
        fieldType: field.type, typeLabel: TYPE_LABELS[field.type] || (((window.SCRIPTICA_BENEFICIARY_PROFILE || {}).typeMeta || {})[field.type] || {}).label || field.type,
        supported: field.type !== 'section_title', sensitive: !!field.sensitive, profileField: field,
        sourcePath: 'Profil beneficiar → ' + (field.label || 'Câmp')
      };
    });
  }
  function anexaById(id) { return (MOCK().anexeTypes || []).find(function (item) { return item.id === id; }) || null; }
  function operationalTemplate(template, vertical) {
    var directHasAnexe = (template.steps || []).some(function (step) { return (step.anexeIds || []).length; });
    if (directHasAnexe) return template;
    return (MOCK().situationTypes || []).find(function (type) {
      var domain = type.domain || 'contabil';
      return domain === vertical.domain && type.name === template.name;
    }) || template;
  }
  function annexSources(vertical) {
    var templates = (((MOCK().superAdmin || {}).flowTemplates) || []).filter(function (template) { return template.verticalId === vertical.id; });
    var result = [];
    templates.forEach(function (template) {
      var sourceTemplate = operationalTemplate(template, vertical);
      (sourceTemplate.steps || []).forEach(function (step, stepIndex) {
        (step.anexeIds || []).forEach(function (anexaId) {
          var anexa = anexaById(anexaId);
          if (!anexa) return;
          ((((anexa || {}).schema || {}).fields) || []).forEach(function (field, fieldIndex) {
            if (['section_title', 'paragraph', 'banner', 'divider'].indexOf(field.type) !== -1) return;
            var supported = SCALAR_ANNEX_TYPES.indexOf(field.type) !== -1 || FILE_ANNEX_TYPES.indexOf(field.type) !== -1;
            var stepKey = step.id || ('step_' + stepIndex);
            result.push({
              sourceKey: 'annex:' + template.id + ':' + stepKey + ':' + anexa.id + ':' + field.id,
              group: 'annex', groupLabel: 'Anexe și formulare', icon: FILE_ANNEX_TYPES.indexOf(field.type) !== -1 ? 'attach_file' : 'description',
              label: field.label || field.text || 'Câmp anexă', desc: supported ? (field.help || 'Tipul este moștenit din anexă.') : 'Acest tip complex nu are o agregare sigură pentru tabel.',
              fieldType: field.type, typeLabel: TYPE_LABELS[field.type] || field.type, supported: supported,
              sourcePath: template.name + ' → ' + (step.name || ('Etapa ' + (stepIndex + 1))) + ' → ' + anexa.name + ' → ' + (field.label || 'Câmp'),
              templateId: template.id, stepKey: stepKey, annexId: anexa.id, annexFieldId: field.id,
              fieldIndex: fieldIndex, annexField: field
            });
          });
        });
      });
    });
    return result;
  }
  function sourceGroupsFor(vertical, client) {
    var account = selectedTenant(client);
    return [
      { id: 'system', label: 'Sistem', sources: availableFor(vertical).map(function (column) { return systemSource(column, vertical, account); }) },
      { id: 'profile', label: 'Profil beneficiar', sources: profileSources(vertical, account), hidden: !account },
      { id: 'annex', label: 'Anexe și formulare', sources: annexSources(vertical) }
    ].filter(function (group) { return !group.hidden && group.sources.length; });
  }
  function sourceByKey(vertical, sourceKey, client) {
    var found = null;
    sourceGroupsFor(vertical, client).some(function (group) {
      found = group.sources.find(function (source) { return source.sourceKey === sourceKey; }) || null;
      return !!found;
    });
    return found;
  }
  function unavailableSource(sourceKey) {
    return { sourceKey: sourceKey, group: 'missing', groupLabel: 'Sursă indisponibilă', icon: 'link_off', label: 'Sursă indisponibilă',
      desc: 'Câmpul original a fost retras sau nu mai este disponibil.', fieldType: 'unknown', typeLabel: 'Indisponibil', supported: false, unavailable: true, sourcePath: sourceKey };
  }

  function normalizeColumns(columns) {
    return (Array.isArray(columns) ? columns : []).map(function (column) {
      if (typeof column === 'string') {
        return { sourceKey: column.indexOf(':') === -1 ? 'system:' + column : column, labelOverride: '' };
      }
      if (!column || typeof column !== 'object') return null;
      var key = column.sourceKey || column.id || '';
      if (key && key.indexOf(':') === -1) key = 'system:' + key;
      return key ? { sourceKey: key, labelOverride: String(column.labelOverride || '') } : null;
    }).filter(Boolean);
  }
  function defaultsConfigFor(vertical) {
    return defaultsFor(vertical).map(function (id) { return { sourceKey: 'system:' + id, labelOverride: '' }; });
  }
  function legacyConfigFor(vertical) {
    var available = availableFor(vertical).map(function (column) { return column.id; });
    var legacy = (vertical && Array.isArray(vertical.listView)) ? vertical.listView.filter(function (id) {
      return typeof id === 'string' && available.indexOf(id) !== -1;
    }) : [];
    return legacy.length ? normalizeColumns(legacy) : defaultsConfigFor(vertical);
  }
  function sharedConfigFor(vertical) {
    var configured = vertical && vertical.listViewConfig && normalizeColumns(vertical.listViewConfig.columns);
    return configured && configured.length ? configured : legacyConfigFor(vertical);
  }
  function effectiveConfigFor(vertical, client) {
    var account = selectedTenant(client);
    var override = account && account.verticalTableOverrides && account.verticalTableOverrides[vertical.id];
    var configured = override && normalizeColumns(override.columns);
    return configured && configured.length ? configured : sharedConfigFor(vertical);
  }
  function effectiveFor(vertical, client) {
    return effectiveConfigFor(vertical, client).map(function (column) {
      return column.sourceKey.indexOf('system:') === 0 ? column.sourceKey.slice(7) : column.sourceKey;
    });
  }
  function resolvedColumns(vertical, options) {
    var opts = options || {};
    var client = Object.prototype.hasOwnProperty.call(opts, 'client') ? opts.client : undefined;
    var config = opts.columns ? normalizeColumns(opts.columns) : effectiveConfigFor(vertical, client);
    return config.map(function (column) {
      return { config: column, source: sourceByKey(vertical, column.sourceKey, client) || unavailableSource(column.sourceKey) };
    });
  }
  function columnLabel(resolved) { return resolved.config.labelOverride || resolved.source.label; }

  function readResponse(activityId, annexId) {
    if (!activityId || !annexId) return null;
    var key = activityId + '::' + annexId;
    var stored = {};
    try { stored = JSON.parse(localStorage.getItem('scriptica.anexaResponses') || '{}') || {}; } catch (e) { stored = {}; }
    return stored[key] || (MOCK().anexaResponseSeeds || {})[key] || null;
  }
  function fileSummary(value) {
    if (!value) return 'Lipsă';
    var count = Array.isArray(value) ? value.length : (typeof value === 'object' && value.count != null ? Number(value.count) : 1);
    if (!count) return 'Lipsă';
    return count === 1 ? 'Încărcat' : count + ' fișiere';
  }
  function annexValueHtml(source, normalized) {
    var response = readResponse(normalized.activityId, source.annexId);
    var values = response && response.values;
    if (!values || !Object.prototype.hasOwnProperty.call(values, String(source.fieldIndex))) return '—';
    var value = values[String(source.fieldIndex)];
    if (FILE_ANNEX_TYPES.indexOf(source.fieldType) !== -1) return esc(fileSummary(value));
    if (value == null || value === '' || (Array.isArray(value) && !value.length)) return '—';
    if (source.fieldType === 'date') return esc(fmtDate(value));
    if (source.fieldType === 'month') {
      var monthParts = String(value).split('-');
      return esc(monthParts.length === 2 ? monthParts[1] + '.' + monthParts[0] : value);
    }
    if (source.fieldType === 'currency') {
      var number = Number(String(value).replace(',', '.'));
      return isNaN(number) ? esc(value) : esc(number.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + ((source.annexField && source.annexField.currency) || 'RON'));
    }
    if (source.fieldType === 'boolean') return esc(value === true || value === 'true' ? 'Da' : (value === false || value === 'false' ? 'Nu' : value));
    return esc(Array.isArray(value) ? value.join(', ') : value);
  }
  function externalProfileMap() {
    try { return JSON.parse(localStorage.getItem('scriptica.externalClients') || '{}') || {}; } catch (e) { return {}; }
  }
  function profileValuesFor(normalized) {
    var map = externalProfileMap();
    var direct = normalized.partyId != null ? map[String(normalized.partyId)] : null;
    if (direct) return direct.profileValues || {};
    var found = Object.keys(map).map(function (key) { return map[key]; }).find(function (record) {
      return record && (record.companyName === normalized.party || record.legalName === normalized.party);
    });
    return (found && found.profileValues) || {};
  }
  function profileValueHtml(source, normalized) {
    var value = profileValuesFor(normalized)[source.profileField.id];
    if (window.SCRIPTICA_BENEFICIARY_PROFILE && typeof window.SCRIPTICA_BENEFICIARY_PROFILE.formatValue === 'function') {
      return esc(window.SCRIPTICA_BENEFICIARY_PROFILE.formatValue(source.profileField, value));
    }
    return value == null || value === '' ? '—' : esc(value);
  }
  function renderSource(source, normalized, vertical) {
    if (!source || source.unavailable) return '—';
    if (source.group === 'system') return source.systemColumn.render(normalized, vertical);
    if (source.group === 'profile') return profileValueHtml(source, normalized);
    if (source.group === 'annex') return annexValueHtml(source, normalized);
    return '—';
  }

  function headerHtml(vertical, options) {
    var opts = options || {};
    var cells = opts.chevron ? '<th style="width:44px;"></th>' : '';
    resolvedColumns(vertical, opts).forEach(function (resolved) {
      var width = resolved.source.width;
      cells += '<th' + (width ? ' style="width:' + width + 'px;"' : '') + '>' + esc(columnLabel(resolved)) + '</th>';
    });
    return '<tr>' + cells + '</tr>';
  }
  function cellsHtml(vertical, normalized, options) {
    return resolvedColumns(vertical, options || {}).map(function (resolved) {
      return '<td>' + renderSource(resolved.source, normalized, vertical) + '</td>';
    }).join('');
  }
  function colCount(vertical, chevron, options) { return resolvedColumns(vertical, options || {}).length + (chevron ? 1 : 0); }

  function stepNameFor(steps, currentStep) {
    var step = steps && steps[(currentStep || 1) - 1];
    return step ? step.name : '';
  }
  function normalizeSituation(situation) {
    var type = (MOCK().situationTypes || []).find(function (item) { return item.id === situation.typeId; });
    return {
      activityId: situation.id, templateId: situation.typeId, partyId: situation.clientId,
      code: situation.id, name: situation.typeName, party: situation.clientCompany, typeName: situation.typeName,
      titularName: situation.titularName, respStepName: situation.responsibleStepName,
      responsibleIds: situation.titularId != null ? [situation.titularId] : [], startDate: situation.startDate,
      deadlineIso: situation['deadlineStep' + situation.currentStep],
      termenState: situation.status === 'inchisa' ? 'finalizat' : (situation.status === 'anulata' ? 'anulat' : null),
      status: situation.status, stepsCompleted: situation.stepsCompleted, totalSteps: situation.totalSteps,
      currentStepName: stepNameFor(type && type.steps, situation.currentStep),
      perioada: typeof window.formatRomanianMonth === 'function' ? window.formatRomanianMonth(situation.startDate) : '', planLabel: ''
    };
  }
  function normalizeMission(mission) {
    var type = (MOCK().situationTypes || []).find(function (item) { return item.id === mission.typeId; });
    var plan = mission.planAnualId ? (MOCK().auditPlansAnnual || []).find(function (item) { return item.id === mission.planAnualId; }) : null;
    var period = mission.perioadaAuditata ? fmtDate(mission.perioadaAuditata.from) + ' – ' + fmtDate(mission.perioadaAuditata.to) : '';
    return {
      activityId: mission.id, templateId: mission.typeId, partyId: mission.entityId,
      code: mission.id, name: mission.name, party: mission.entityName, typeName: mission.typeName,
      titularName: '', respStepName: '', responsibleIds: mission.responsibleIds || [], startDate: mission.startDate,
      deadlineIso: mission['deadlineStep' + mission.currentStep],
      termenState: mission.status === 'aprobata' || mission.status === 'inchisa' ? 'finalizat' : (mission.status === 'anulata' ? 'anulat' : null),
      status: mission.status, stepsCompleted: mission.stepsCompleted, totalSteps: mission.totalSteps,
      currentStepName: stepNameFor(type && type.steps, mission.currentStep), perioada: period, planLabel: plan ? 'Plan ' + plan.year : ''
    };
  }
  function normalizeFlowItem(item) {
    var template = (((MOCK().superAdmin || {}).flowTemplates) || []).find(function (entry) { return entry.id === item.templateId; });
    var steps = (template && template.steps) || [];
    var step = steps[(item.currentStep || 1) - 1];
    var deadline = null;
    if (step && item.startDate) {
      var date = new Date(item.startDate + 'T00:00:00');
      if (!isNaN(date)) {
        date.setDate(date.getDate() + (parseInt(step.offsetDays, 10) || 0));
        deadline = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      }
    }
    return {
      activityId: item.id, templateId: item.templateId, partyId: item.clientId,
      code: item.id, name: item.name, party: item.clientName, typeName: item.templateName,
      titularName: '', respStepName: '', responsibleIds: item.responsibleIds || [], startDate: item.startDate,
      deadlineIso: deadline, termenState: item.status === 'finalizat' || item.status === 'inchisa' ? 'finalizat' : (item.status === 'anulata' ? 'anulat' : null),
      status: item.status, stepsCompleted: item.stepsCompleted, totalSteps: item.totalSteps || steps.length,
      currentStepName: step ? step.name : '', perioada: '', planLabel: ''
    };
  }

  function syntheticItems(vertical, count) {
    var template = (((MOCK().superAdmin || {}).flowTemplates) || []).find(function (item) { return item.verticalId === vertical.id; });
    var steps = (template && template.steps) || [{ name: 'Lucru', offsetDays: 10 }];
    var statuses = ['analiza', 'in_verificare', 'spre_aprobare', 'finalizat'];
    var parties = ['Client Exemplu S.R.L.', 'Beneficiar Demo S.A.', 'Partener Model SRL-D', 'Firma Exemplu S.R.L.'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var start = new Date(TODAY); start.setDate(start.getDate() - (i + 1) * 6);
      var startIso = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
      var deadline = new Date(start); deadline.setDate(deadline.getDate() + (parseInt(steps[0].offsetDays, 10) || 10));
      var deadlineIso = deadline.getFullYear() + '-' + String(deadline.getMonth() + 1).padStart(2, '0') + '-' + String(deadline.getDate()).padStart(2, '0');
      var status = statuses[i % statuses.length];
      out.push({ activityId: 'EX-' + (1001 + i), templateId: template && template.id, partyId: null,
        code: 'EX-' + (1001 + i), name: (vertical.itemLabel || 'Element') + ' exemplu ' + (i + 1), party: parties[i % parties.length],
        typeName: template ? template.name : 'Șablon exemplu', titularName: 'Anca Cobzaru', respStepName: 'Cristina Popescu',
        responsibleIds: [1, 2].slice(0, (i % 2) + 1), startDate: startIso, deadlineIso: deadlineIso,
        termenState: status === 'finalizat' ? 'finalizat' : null, status: status,
        stepsCompleted: Math.min(i, steps.length), totalSteps: steps.length,
        currentStepName: (steps[Math.min(i, steps.length - 1)] || steps[0]).name, perioada: '', planLabel: '' });
    }
    return out;
  }
  function sampleItems(vertical, count) {
    count = count || 3;
    var key = domainKey(vertical), real;
    if (key === 'contabil') real = (MOCK().situations || []).slice(0, count).map(normalizeSituation);
    else if (key === 'audit') real = (MOCK().auditMissions || []).slice(0, count).map(normalizeMission);
    else real = (MOCK().flowItems || []).filter(function (item) { return item.verticalId === vertical.id; }).slice(0, count).map(normalizeFlowItem);
    return real.length >= count ? real : real.concat(syntheticItems(vertical, count - real.length));
  }

  window.SCRIPTICA_LISTVIEW = {
    availableFor: availableFor, defaultsFor: defaultsFor, effectiveFor: effectiveFor, colById: colById,
    sourceGroupsFor: sourceGroupsFor, sourceByKey: sourceByKey,
    defaultsConfigFor: defaultsConfigFor, legacyConfigFor: legacyConfigFor, sharedConfigFor: sharedConfigFor,
    effectiveConfigFor: effectiveConfigFor, normalizeColumns: normalizeColumns,
    headerHtml: headerHtml, cellsHtml: cellsHtml, colCount: colCount,
    normalizeSituation: normalizeSituation, normalizeMission: normalizeMission, normalizeFlowItem: normalizeFlowItem,
    sampleItems: sampleItems, typeLabels: TYPE_LABELS
  };
})();
