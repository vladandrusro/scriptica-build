/* ============================================================
   Scriptica — Motorul de coloane pentru tabelele de fluxuri
   O verticală își definește „expresia în tabel" (v.listView = listă
   ordonată de id-uri de coloane) în Super Admin → Fluxuri → Coloanele
   tabelului. Motorul e folosit de:
     - situatii.js (vederea internă; portalul de client rămâne neatins)
     - misiuni-audit.js
     - flux.js (motorul generic al verticalelor custom)
     - super-admin.js (editorul de coloane, cu preview live)
   Fiecare pagină normalizează elementele ei (normalizeSituation /
   normalizeMission / normalizeFlowItem), iar motorul redă antetul și
   celulele identic peste tot. Fără listView salvat, defaults-urile
   reproduc exact tabelele actuale (zero regresie).
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var TODAY = new Date('2026-04-20T00:00:00');

  function MOCK() { return window.SCRIPTICA_MOCK; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
  }
  function daysDiff(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.ceil((d - TODAY) / 86400000);
  }

  var STATUS_LABELS = {
    analiza: 'Analiză', asteapta_documente: 'Așteaptă Documente', in_verificare: 'În Verificare',
    spre_aprobare: 'Spre Aprobare', aprobata: 'Aprobată', finalizat: 'Finalizat',
    inchisa: 'Închisă', anulata: 'Anulată', intarziere: 'În Întârziere'
  };

  /* ---------- randări de celule (pe câmpurile normalizate) ---------- */

  function termenCell(n) {
    if (n.termenState === 'finalizat') return '<span class="termen--finalizat">Finalizată</span>';
    if (n.termenState === 'anulat') return '<span class="termen--anulat">Anulată</span>';
    if (!n.deadlineIso) return '—';
    var days = daysDiff(n.deadlineIso);
    if (days == null) return '—';
    if (days < 0) {
      var late = Math.abs(days);
      return '<span class="termen--overdue">' + late + (late === 1 ? ' zi întârziere' : ' zile întârziere') + '</span>';
    }
    if (days === 0) return '<span class="termen--today">azi</span>';
    if (days <= 3)  return '<span class="termen--soon">' + days + (days === 1 ? ' zi' : ' zile') + '</span>';
    return '<span class="termen--ok">' + days + ' zile</span>';
  }
  function statusCell(n) {
    return '<span class="sit-status sit-status--' + esc(n.status) + '">' +
      '<span class="status-dot status-dot--' + esc(n.status) + '"></span>' +
      esc(STATUS_LABELS[n.status] || n.status) + '</span>';
  }
  function progressCell(n) {
    if (!n.totalSteps) return '—';
    var ratio = n.totalSteps ? (n.stepsCompleted || 0) / n.totalSteps : 0;
    var cls = ratio < 0.25 ? 'is-low' : (ratio < 0.75 ? 'is-mid' : 'is-high');
    return '<span class="pill pill--progress ' + cls + '">' + (n.stepsCompleted || 0) + '/' + n.totalSteps + '</span>';
  }
  function avatarsCell(n) {
    var ids = n.responsibleIds || [];
    if (!ids.length) return '—';
    var shown = ids.slice(0, 3);
    var rest = ids.length - shown.length;
    var avatars = shown.map(function (id) {
      var e = (MOCK().employees || []).find(function (x) { return x.id === id; });
      if (!e) return '';
      return '<span class="lv-avatar" title="' + esc(e.name) + '">' +
        (typeof window.renderAvatar === 'function' ? window.renderAvatar(e, 28) : esc(e.name.charAt(0))) + '</span>';
    }).join('');
    return '<span class="lv-avatars">' + avatars + (rest > 0 ? '<span class="lv-avatars__more">+' + rest + '</span>' : '') + '</span>';
  }
  function elementCell(n) {
    return '<div class="lv-name">' + esc(n.name || '—') + '</div>' +
      (n.party ? '<div class="lv-sub">' + esc(n.party) + '</div>' : '');
  }

  /* ---------- catalogul de coloane ----------
     `domains`: null = disponibilă oriunde; 'custom' acoperă orice verticală
     non-builtin. `label` poate depinde de verticală (ex. partea externă). */
  var CATALOG = [
    { id: 'element', icon: 'badge',        width: null,  domains: null,
      label: function (v) { return v.itemLabel || 'Element'; },
      desc: 'Denumirea elementului + partea externă, pe două rânduri.',
      render: elementCell },
    { id: 'cod', icon: 'tag',            width: 140,   domains: ['contabil'],
      label: function () { return 'Cod'; },
      desc: 'Codul intern al situației.',
      render: function (n) { return '<span class="sit-cell--code">' + esc(n.code || '—') + '</span>'; } },
    { id: 'partener', icon: 'apartment',       width: null,  domains: null,
      label: function (v) { return v.domain === 'audit' ? 'Entitate' : 'Client'; },
      desc: 'Partea externă (client / entitate / beneficiar).',
      render: function (n) { return esc(n.party || '—'); } },
    { id: 'tip', icon: 'category',            width: 220,   domains: null,
      label: function (v) { return v.domain === 'contabil' ? 'Denumire Raport' : 'Șablon'; },
      desc: 'Șablonul de flux din care e creat elementul.',
      render: function (n) { return esc(n.typeName || '—'); } },
    { id: 'termen', icon: 'schedule',         width: 110,   domains: null,
      label: function () { return 'Termen'; },
      desc: 'Zilele rămase până la termenul etapei curente.',
      render: termenCell },
    { id: 'termen_data', icon: 'event',    width: 130,   domains: null,
      label: function () { return 'Data termen'; },
      desc: 'Data calendaristică a termenului curent.',
      render: function (n) { return fmtDate(n.deadlineIso); } },
    { id: 'status', icon: 'flag',         width: 180,   domains: null,
      label: function () { return 'Status'; },
      desc: 'Statusul curent, cu indicator colorat.',
      render: statusCell },
    { id: 'titular', icon: 'person',        width: 160,   domains: ['contabil'],
      label: function () { return 'Titular'; },
      desc: 'Titularul situației (responsabilul general).',
      render: function (n) { return esc(n.titularName || '—'); } },
    { id: 'responsabil_pas', icon: 'person_pin_circle', width: 160,  domains: ['contabil'],
      label: function () { return 'Responsabil Pas'; },
      desc: 'Responsabilul pasului curent.',
      render: function (n) { return esc(n.respStepName || '—'); } },
    { id: 'responsabili', icon: 'group',   width: 160,   domains: ['audit', 'custom'],
      label: function () { return 'Responsabili'; },
      desc: 'Echipa responsabilă (avatare).',
      render: avatarsCell },
    { id: 'data_start', icon: 'today',     width: 120,   domains: null,
      label: function () { return 'Dată Start'; },
      desc: 'Data de început a elementului.',
      render: function (n) { return fmtDate(n.startDate); } },
    { id: 'progres', icon: 'clock_loader_40',        width: 90,    domains: null,
      label: function () { return 'Pas'; },
      desc: 'Progresul pe etape (ex. 2/4).',
      render: progressCell },
    { id: 'etapa', icon: 'footprint',          width: 200,   domains: null,
      label: function () { return 'Etapa curentă'; },
      desc: 'Numele etapei în care se află elementul.',
      render: function (n) { return esc(n.currentStepName || '—'); } },
    { id: 'perioada', icon: 'date_range',       width: 160,   domains: ['contabil', 'audit'],
      label: function (v) { return v.domain === 'audit' ? 'Perioadă auditată' : 'Perioadă'; },
      desc: 'Perioada acoperită (luna raportată / perioada auditată).',
      render: function (n) { return esc(n.perioada || '—'); } },
    { id: 'plan_anual', icon: 'event_note',     width: 120,   domains: ['audit'],
      label: function () { return 'Plan anual'; },
      desc: 'Planul anual din care provine misiunea.',
      render: function (n) { return esc(n.planLabel || '—'); } }
  ];

  var DEFAULTS = {
    contabil: ['cod', 'partener', 'titular', 'data_start', 'termen', 'responsabil_pas', 'status', 'tip', 'progres'],
    audit:    ['element', 'tip', 'termen', 'responsabili', 'status'],
    custom:   ['element', 'tip', 'termen', 'responsabili', 'status']
  };

  function domainKey(v) {
    return (v && (v.domain === 'contabil' || v.domain === 'audit')) ? v.domain : 'custom';
  }
  function colById(id) {
    return CATALOG.find(function (c) { return c.id === id; }) || null;
  }
  function availableFor(v) {
    var dk = domainKey(v);
    return CATALOG.filter(function (c) { return !c.domains || c.domains.indexOf(dk) !== -1; });
  }
  function defaultsFor(v) {
    return DEFAULTS[domainKey(v)].slice();
  }
  /* coloanele efective: listView salvat (igienizat) sau default-urile */
  function effectiveFor(v) {
    var avail = availableFor(v).map(function (c) { return c.id; });
    var ids = (v && v.listView && v.listView.length)
      ? v.listView.filter(function (id) { return avail.indexOf(id) !== -1; })
      : [];
    return ids.length ? ids : defaultsFor(v);
  }

  function headerHtml(v, opts) {
    var cols = effectiveFor(v);
    var cells = (opts && opts.chevron ? '<th style="width:44px;"></th>' : '');
    cols.forEach(function (id) {
      var c = colById(id);
      if (!c) return;
      cells += '<th' + (c.width ? ' style="width:' + c.width + 'px;"' : '') + '>' + esc(c.label(v)) + '</th>';
    });
    return '<tr>' + cells + '</tr>';
  }
  function cellsHtml(v, n) {
    return effectiveFor(v).map(function (id) {
      var c = colById(id);
      return c ? '<td>' + c.render(n, v) + '</td>' : '';
    }).join('');
  }
  function colCount(v, chevron) {
    return effectiveFor(v).length + (chevron ? 1 : 0);
  }

  /* ---------- normalizatoare per sursă de date ---------- */

  function stepNameFor(steps, currentStep) {
    var st = steps && steps[(currentStep || 1) - 1];
    return st ? st.name : '';
  }

  function normalizeSituation(s) {
    var type = (MOCK().situationTypes || []).find(function (t) { return t.id === s.typeId; });
    return {
      code: s.id,
      name: s.typeName,
      party: s.clientCompany,
      typeName: s.typeName,
      titularName: s.titularName,
      respStepName: s.responsibleStepName,
      responsibleIds: s.titularId != null ? [s.titularId] : [],
      startDate: s.startDate,
      deadlineIso: s['deadlineStep' + s.currentStep],
      termenState: s.status === 'inchisa' ? 'finalizat' : (s.status === 'anulata' ? 'anulat' : null),
      status: s.status,
      stepsCompleted: s.stepsCompleted, totalSteps: s.totalSteps,
      currentStepName: stepNameFor(type && type.steps, s.currentStep),
      perioada: (typeof window.formatRomanianMonth === 'function') ? window.formatRomanianMonth(s.startDate) : '',
      planLabel: ''
    };
  }

  function normalizeMission(m) {
    var type = (MOCK().situationTypes || []).find(function (t) { return t.id === m.typeId; });
    var plan = m.planAnualId ? (MOCK().auditPlansAnnual || []).find(function (p) { return p.id === m.planAnualId; }) : null;
    var per = m.perioadaAuditata ? (fmtDate(m.perioadaAuditata.from) + ' – ' + fmtDate(m.perioadaAuditata.to)) : '';
    return {
      code: m.id,
      name: m.name,
      party: m.entityName,
      typeName: m.typeName,
      titularName: '', respStepName: '',
      responsibleIds: m.responsibleIds || [],
      startDate: m.startDate,
      deadlineIso: m['deadlineStep' + m.currentStep],
      termenState: (m.status === 'aprobata' || m.status === 'inchisa') ? 'finalizat' : (m.status === 'anulata' ? 'anulat' : null),
      status: m.status,
      stepsCompleted: m.stepsCompleted, totalSteps: m.totalSteps,
      currentStepName: stepNameFor(type && type.steps, m.currentStep),
      perioada: per,
      planLabel: plan ? ('Plan ' + plan.year) : ''
    };
  }

  function normalizeFlowItem(i) {
    var tpl = (MOCK().superAdmin.flowTemplates || []).find(function (t) { return t.id === i.templateId; });
    var steps = (tpl && tpl.steps) || [];
    var st = steps[(i.currentStep || 1) - 1];
    var deadline = null;
    if (st && i.startDate) {
      var dt = new Date(i.startDate + 'T00:00:00');
      if (!isNaN(dt)) {
        dt.setDate(dt.getDate() + (parseInt(st.offsetDays, 10) || 0));
        deadline = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      }
    }
    return {
      code: i.id,
      name: i.name,
      party: i.clientName,
      typeName: i.templateName,
      titularName: '', respStepName: '',
      responsibleIds: i.responsibleIds || [],
      startDate: i.startDate,
      deadlineIso: deadline,
      termenState: (i.status === 'finalizat' || i.status === 'inchisa') ? 'finalizat' : (i.status === 'anulata' ? 'anulat' : null),
      status: i.status,
      stepsCompleted: i.stepsCompleted, totalSteps: i.totalSteps || steps.length,
      currentStepName: st ? st.name : '',
      perioada: '',
      planLabel: ''
    };
  }

  /* Rânduri-exemplu pentru simulatorul din editorul HQ — date reale,
     completate cu rânduri sintetice pregenerate când verticala e goală
     (simularea nu trebuie să arate niciodată moartă). */
  function syntheticItems(v, count) {
    var label = v.itemLabel || 'Element';
    var tpl = (MOCK().superAdmin.flowTemplates || []).find(function (t) { return t.verticalId === v.id; });
    var steps = (tpl && tpl.steps) || [{ name: (v.lifecycle || ['Etapa 1'])[0], offsetDays: 10 }];
    var statuses = ['analiza', 'in_verificare', 'spre_aprobare', 'finalizat'];
    var parties = ['Client Exemplu S.R.L.', 'Beneficiar Demo S.A.', 'Partener Model SRL-D', 'Firma Exemplu S.R.L.'];
    var out = [];
    for (var i = 0; i < count; i++) {
      var start = new Date(TODAY);
      start.setDate(start.getDate() - (i + 1) * 6);
      var startIso = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0');
      var dl = new Date(start);
      dl.setDate(dl.getDate() + (parseInt(steps[0].offsetDays, 10) || 10));
      var dlIso = dl.getFullYear() + '-' + String(dl.getMonth() + 1).padStart(2, '0') + '-' + String(dl.getDate()).padStart(2, '0');
      var status = statuses[i % statuses.length];
      out.push({
        code: 'EX-' + (1001 + i),
        name: label + ' exemplu ' + (i + 1),
        party: parties[i % parties.length],
        typeName: tpl ? tpl.name : 'Șablon exemplu',
        titularName: 'Anca Cobzaru', respStepName: 'Cristina Popescu',
        responsibleIds: [1, 2].slice(0, (i % 2) + 1),
        startDate: startIso,
        deadlineIso: dlIso,
        termenState: status === 'finalizat' ? 'finalizat' : null,
        status: status,
        stepsCompleted: Math.min(i, steps.length), totalSteps: steps.length,
        currentStepName: (steps[Math.min(i, steps.length - 1)] || steps[0]).name,
        perioada: '', planLabel: ''
      });
    }
    return out;
  }

  function sampleItems(v, count) {
    count = count || 3;
    var dk = domainKey(v);
    var real;
    if (dk === 'contabil') real = (MOCK().situations || []).slice(0, count).map(normalizeSituation);
    else if (dk === 'audit') real = (MOCK().auditMissions || []).slice(0, count).map(normalizeMission);
    else real = (MOCK().flowItems || []).filter(function (i) { return i.verticalId === v.id; }).slice(0, count).map(normalizeFlowItem);
    return real.length >= count ? real : real.concat(syntheticItems(v, count - real.length));
  }

  window.SCRIPTICA_LISTVIEW = {
    availableFor: availableFor,
    defaultsFor: defaultsFor,
    effectiveFor: effectiveFor,
    colById: colById,
    headerHtml: headerHtml,
    cellsHtml: cellsHtml,
    colCount: colCount,
    normalizeSituation: normalizeSituation,
    normalizeMission: normalizeMission,
    normalizeFlowItem: normalizeFlowItem,
    sampleItems: sampleItems
  };

})();
