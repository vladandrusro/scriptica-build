/* ============================================================
   Scriptica — datele studiului de caz „Consultanță finanțări”
   Sunt adăugate în registrul local al prototipului, fără să înlocuiască
   datele sau configurările deja create de utilizator.
   ============================================================ */
(function () {
  'use strict';

  function readMap(key) {
    try { return JSON.parse(window.localStorage.getItem(key) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function mergeRecords(key, records) {
    var map = readMap(key);
    records.forEach(function (record) { map[record.id] = record; });
    try { window.localStorage.setItem(key, JSON.stringify(map)); } catch (e) {}
  }

  function mergeDefaults(key, entries) {
    var map = readMap(key);
    Object.keys(entries).forEach(function (entryKey) {
      if (!map[entryKey]) map[entryKey] = entries[entryKey];
    });
    try { window.localStorage.setItem(key, JSON.stringify(map)); } catch (e) {}
  }

  function clearPresentationDraft(templateId) {
    var key = 'scriptica.prototype.fluxuriV2';
    try {
      var model = JSON.parse(window.localStorage.getItem(key) || 'null');
      if (!model || !Array.isArray(model.templates)) return;
      model.templates = model.templates.filter(function (item) { return item.id !== templateId; });
      model.draftTemplateIds = (model.draftTemplateIds || []).filter(function (id) { return id !== templateId; });
      window.localStorage.setItem(key, JSON.stringify(model));
    } catch (e) {}
  }

  var vertical = {
    id: 'vert_finantari',
    domain: 'finantari',
    builtin: false,
    status: 'activ',
    color: 'verde',
    name: 'Proiecte de Finanțare',
    icon: 'account_tree',
    itemLabel: 'Proiect',
    itemLabelPlural: 'Proiecte',
    description: 'Proiecte de finanțare nerambursabilă, urmărite de la diagnosticul de eligibilitate până la clarificări și contractare.',
    documentVocabularyVersion: 1,
    documentCategories: [
      { id: 'documente_solicitant', name: 'Documente solicitant', documentTypes: [
        { id: 'dt_grant_certificat_onrc', name: 'Certificat constatator ONRC' },
        { id: 'dt_grant_situatii_financiare', name: 'Situații financiare' },
        { id: 'dt_grant_recipisa', name: 'Recipisă bilanț' },
        { id: 'dt_grant_certificat_fiscal', name: 'Certificat fiscal' }
      ] },
      { id: 'eligibilitate', name: 'Eligibilitate', documentTypes: [
        { id: 'dt_grant_declaratie_imm', name: 'Declarație IMM' },
        { id: 'dt_grant_declaratie_eligibilitate', name: 'Declarație de eligibilitate' }
      ] },
      { id: 'buget_fundamentare', name: 'Buget și fundamentare', documentTypes: [
        { id: 'dt_grant_oferta', name: 'Ofertă de preț' },
        { id: 'dt_grant_plan_afaceri', name: 'Plan de afaceri' },
        { id: 'dt_grant_macheta', name: 'Machetă financiară' }
      ] },
      { id: 'depunere', name: 'Depunere', documentTypes: [
        { id: 'dt_grant_cerere', name: 'Cerere de finanțare' },
        { id: 'dt_grant_dovada_depunere', name: 'Dovadă depunere MySMIS' }
      ] },
      { id: 'clarificari_contractare', name: 'Clarificări și contractare', documentTypes: [
        { id: 'dt_grant_solicitare_clarificari', name: 'Solicitare de clarificări' },
        { id: 'dt_grant_raspuns_clarificari', name: 'Răspuns la clarificări' },
        { id: 'dt_grant_contract', name: 'Contract de finanțare' }
      ] },
      { id: 'necategorisit', name: 'Necategorisit', system: true, documentTypes: [] }
    ],
    defaultDocumentCategoryIds: ['documente_solicitant', 'eligibilitate', 'buget_fundamentare', 'depunere', 'clarificari_contractare', 'necategorisit'],
    documentFilters: [],
    listView: ['element', 'etapa', 'termen_data', 'responsabili', 'status', 'progres']
  };

  var documentChecklistAnnex = {
    id: 'anx_finantari_documente',
    name: 'Fișă de verificare — documente solicitant',
    status: 'activ',
    updatedAt: '2026-04-20',
    categories: ['finantari'],
    schema: { fields: [
      { type: 'section_title', text: 'Identificarea solicitantului' },
      { type: 'text_short', label: 'Denumirea solicitantului', required: true, help: '', maxLength: 120 },
      { type: 'cui', label: 'CUI', required: true, help: 'Codul fiscal al solicitantului.' },
      { type: 'date', label: 'Data emiterii certificatului constatator', required: true, help: 'Certificatul trebuie să fie emis cu cel mult 30 de zile înainte de depunere.' },
      { type: 'file_upload', label: 'Certificat constatator ONRC', required: true, help: 'Încarcă documentul în format PDF.', multi: false, maxSizeMB: 10, allowedTypes: 'PDF' },
      { type: 'file_upload', label: 'Situații financiare și recipisă', required: true, help: 'Încarcă documentele pentru ultimul exercițiu financiar.', multi: true, maxSizeMB: 10, allowedTypes: 'PDF' },
      { type: 'text_long', label: 'Observații pentru solicitant', required: false, help: '', rows: 3 }
    ] }
  };

  var budgetAnnex = {
    id: 'anx_finantari_buget',
    name: 'Fișă de fundamentare — buget și oferte',
    status: 'activ',
    updatedAt: '2026-04-20',
    categories: ['finantari'],
    schema: { fields: [
      { type: 'section_title', text: 'Fundamentarea costurilor' },
      { type: 'currency', label: 'Valoarea totală eligibilă', required: true, currency: 'RON', help: '' },
      { type: 'file_upload', label: 'Sursele de preț', required: true, help: 'Încarcă minimum două surse pentru fiecare cost.', multi: true, maxSizeMB: 10, allowedTypes: 'PDF, XLSX' },
      { type: 'text_long', label: 'Justificarea costurilor', required: true, help: '', rows: 4 }
    ] }
  };

  var template = {
    id: 'ft_finantare_depunere',
    verticalId: vertical.id,
    name: 'Pregătire și depunere proiect de finanțare',
    frequency: 'punctual',
    status: 'activ',
    description: 'Flux unic pentru pregătirea unei cereri de finanțare a unei microîntreprinderi, construit pe cerințele documentare ale PR BI P1/1.8/1/2025.',
    documentCategoryIds: ['documente_solicitant', 'eligibilitate', 'buget_fundamentare', 'depunere', 'clarificari_contractare', 'necategorisit'],
    steps: [
      {
        id: 'ft_finantare_depunere_step_1',
        name: 'Diagnostic de eligibilitate',
        description: 'Confirmă eligibilitatea solicitantului, a investiției și punctajul minim realist.',
        offsetDays: 5,
        requireApproval: false,
        anexeIds: [],
        tasks: [
          { id: 'grant_task_1_1', label: 'Confirmă încadrarea ca microîntreprindere', required: true },
          { id: 'grant_task_1_2', label: 'Verifică activitatea CAEN și locul de implementare', required: true },
          { id: 'grant_task_1_3', label: 'Estimează punctajul tehnico-financiar', required: true }
        ]
      },
      {
        id: 'ft_finantare_depunere_step_2',
        name: 'Colectare documente și dovezi',
        description: 'Adună documentele solicitantului și verifică valabilitatea fiecăruia înainte de redactare.',
        offsetDays: 25,
        requireApproval: false,
        anexeIds: [documentChecklistAnnex.id],
        tasks: [
          { id: 'grant_task_2_1', label: 'Colectează situațiile financiare și recipisa', required: true },
          { id: 'grant_task_2_2', label: 'Obține certificatul constatator ONRC valabil', required: true },
          { id: 'grant_task_2_3', label: 'Notează întrebările pentru solicitant', required: false }
        ]
      },
      {
        id: 'ft_finantare_depunere_step_3',
        name: 'Buget și plan de afaceri',
        description: 'Corelează activitățile, bugetul, calendarul, ofertele și macheta financiară.',
        offsetDays: 45,
        requireApproval: false,
        anexeIds: [budgetAnnex.id],
        tasks: [
          { id: 'grant_task_3_1', label: 'Corelează bugetul cu activitățile și calendarul', required: true },
          { id: 'grant_task_3_2', label: 'Atașează minimum două surse de preț', required: true },
          { id: 'grant_task_3_3', label: 'Finalizează planul de afaceri și macheta financiară', required: true }
        ]
      },
      {
        id: 'ft_finantare_depunere_step_4',
        name: 'Revizie, semnare și depunere',
        description: 'Verifică dosarul final, obține semnăturile și transmite cererea în MySMIS.',
        offsetDays: 60,
        requireApproval: true,
        anexeIds: [],
        tasks: [
          { id: 'grant_task_4_1', label: 'Verifică lista completă de documente obligatorii', required: true },
          { id: 'grant_task_4_2', label: 'Confirmă semnătura electronică a reprezentantului', required: true },
          { id: 'grant_task_4_3', label: 'Transmite cererea și salvează dovada depunerii', required: true }
        ]
      },
      {
        id: 'ft_finantare_depunere_step_5',
        name: 'Clarificări și contractare',
        description: 'Urmărește solicitările autorității și documentele actualizate necesare contractării.',
        offsetDays: 90,
        requireApproval: false,
        anexeIds: [],
        tasks: [
          { id: 'grant_task_5_1', label: 'Înregistrează fiecare solicitare de clarificări', required: true },
          { id: 'grant_task_5_2', label: 'Urmărește documentele actualizate pentru contractare', required: true },
          { id: 'grant_task_5_3', label: 'Arhivează rezultatul și decizia finală', required: true }
        ]
      }
    ]
  };

  var clientType = {
    id: 'ct_finantari',
    name: 'Consultanță pentru finanțări nerambursabile',
    icon: 'account_tree',
    builtin: false,
    description: 'Firme care pregătesc și urmăresc proiecte de finanțare pentru companii solicitante.',
    verticalIds: [vertical.id],
    defaultTemplateIds: [template.id],
    clientLabel: 'Solicitant',
    clientLabelPlural: 'Solicitanți',
    dashboardLayout: [
      { id: 'dw_grant_1', widget: 'flow_summary', params: { verticalId: vertical.id }, size: 'half' },
      { id: 'dw_grant_2', widget: 'termene', size: 'half' },
      { id: 'dw_grant_3', widget: 'clienti', size: 'full' },
      { id: 'dw_grant_4', widget: 'arhiva_recente', params: { folderId: 'af_grant_cerere' }, size: 'half' },
      { id: 'dw_grant_5', widget: 'echipa', size: 'half' }
    ],
    archiveTree: [
      { id: 'af_grant_eligibilitate', name: '01. Diagnostic și eligibilitate', docTypeIds: ['dt_altele'], children: [] },
      { id: 'af_grant_solicitant', name: '02. Documente solicitant', docTypeIds: [], children: [] },
      { id: 'af_grant_buget', name: '03. Buget și oferte', docTypeIds: [], children: [] },
      { id: 'af_grant_cerere', name: '04. Cerere și anexe', docTypeIds: [], children: [] },
      { id: 'af_grant_clarificari', name: '05. Clarificări', docTypeIds: ['dt_corespondenta'], children: [] },
      { id: 'af_grant_contractare', name: '06. Contractare', docTypeIds: ['dt_contract'], children: [] },
      { id: 'af_grant_necat', name: 'Necategorisit', system: true, docTypeIds: [], children: [] }
    ]
  };

  var businessClient = {
    id: 'cli_grant_nord',
    name: 'Nord Grant Consulting S.R.L.',
    domain: clientType.name,
    clientTypeId: clientType.id,
    instance: 'nordgrant.scriptica.ro',
    users: 8,
    enrolled: '20.04.2026',
    tier: 'plus',
    contract: 'activ',
    aiLoad: 18,
    commercial: {
      plan: 'Plus',
      renew: '20.04.2027',
      billing: 'Anual · 4.800 RON',
      lastPay: '20.04.2026'
    },
    flags: [
      { name: 'Sortare automată A.I.', tier: 'Plus', on: true },
      { name: 'Mesaje smart', tier: 'Plus', on: true },
      { name: 'Constructor de Anexe', tier: 'Standard', on: true },
      { name: 'Vertical Audit', tier: 'Enterprise', on: false },
      { name: 'Backup local', tier: 'Plus · add-on', on: false }
    ],
    technical: {
      vmLoad: [8, 11, 15, 18, 12, 9, 7, 6],
      vmPeakIdx: 3,
      aiPerMonth: '186',
      docsStored: '1.248',
      uptime30: 100,
      lastIncident: '—'
    },
    downtime: { incidents: [] }
  };

  var grantDocuments = [
    {
      id: 'doc_grant_001', filename: 'certificat_constatator_atelier_nord.pdf', uploadedAt: '2026-04-16T09:20:00',
      source: 'email', pagesCount: 4, multiDoc: false, multiDocConfidence: null,
      tipDocument: 'Certificat constatator ONRC', emitent: 'Oficiul Național al Registrului Comerțului',
      numarDocument: 'ONRC-18472', dataEmiterii: '2026-04-15', perioadaFiscala: '',
      categoriePropusa: 'Certificat constatator ONRC', broadCategory: 'documente_solicitant', subFilter: null,
      confidenceExtraction: 97, confidenceCategorization: 98,
      observatieAI: 'Certificat constatator emis la 15 aprilie 2026; documentul este în termen pentru depunere.',
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: 'doc_grant_002', filename: 'situatii_financiare_2025_atelier_nord.pdf', uploadedAt: '2026-04-16T09:24:00',
      source: 'email', pagesCount: 12, multiDoc: false, multiDocConfidence: null,
      tipDocument: 'Situații financiare', emitent: 'Atelier Nord S.R.L.',
      numarDocument: 'SF-2025', dataEmiterii: '2026-03-28', perioadaFiscala: '2025',
      categoriePropusa: 'Situații financiare', broadCategory: 'documente_solicitant', subFilter: null,
      confidenceExtraction: 94, confidenceCategorization: 97,
      observatieAI: 'Situațiile financiare pentru 2025 sunt semnate și conțin bilanțul, contul de profit și pierdere și datele informative.',
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: 'doc_grant_003', filename: 'recipisa_bilant_2025.pdf', uploadedAt: '2026-04-16T09:25:00',
      source: 'email', pagesCount: 1, multiDoc: false, multiDocConfidence: null,
      tipDocument: 'Recipisă bilanț', emitent: 'ANAF',
      numarDocument: 'RCP-580331', dataEmiterii: '2026-03-28', perioadaFiscala: '2025',
      categoriePropusa: 'Recipisă bilanț', broadCategory: 'documente_solicitant', subFilter: null,
      confidenceExtraction: 93, confidenceCategorization: 96,
      observatieAI: 'Recipisa confirmă depunerea și validarea situațiilor financiare pentru anul 2025.',
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: 'doc_grant_004', filename: 'declaratie_incadrare_imm_semnata.pdf', uploadedAt: '2026-04-17T14:10:00',
      source: 'upload', pagesCount: 2, multiDoc: false, multiDocConfidence: null,
      tipDocument: 'Declarație IMM', emitent: 'Atelier Nord S.R.L.',
      numarDocument: 'DIMM-04-2026', dataEmiterii: '2026-04-17', perioadaFiscala: '',
      categoriePropusa: 'Declarație IMM', broadCategory: 'eligibilitate', subFilter: null,
      confidenceExtraction: 92, confidenceCategorization: 95,
      observatieAI: 'Declarația este semnată de reprezentantul legal și confirmă încadrarea solicitantului ca microîntreprindere.',
      verificat: false, verificatManual: false, pageThumbnails: []
    },
    {
      id: 'doc_grant_005', filename: 'oferta_centru_prelucrate_cnc.pdf', uploadedAt: '2026-04-18T11:40:00',
      source: 'whatsapp', pagesCount: 3, multiDoc: false, multiDocConfidence: null,
      tipDocument: 'Ofertă de preț', emitent: 'TechMill România S.R.L.',
      numarDocument: 'OF-726/2026', dataEmiterii: '2026-04-18', perioadaFiscala: '',
      categoriePropusa: 'Ofertă de preț', broadCategory: 'buget_fundamentare', subFilter: null,
      confidenceExtraction: 88, confidenceCategorization: 91,
      observatieAI: 'Ofertă pentru centru de prelucrare CNC; valoarea și termenul de valabilitate au fost identificate.',
      verificat: false, verificatManual: false, pageThumbnails: []
    },
    {
      id: 'doc_grant_006', filename: 'scan_whatsapp_19_aprilie.pdf', uploadedAt: '2026-04-19T16:05:00',
      source: 'whatsapp', pagesCount: 2, multiDoc: true, multiDocConfidence: 'ambiguous',
      tipDocument: 'Altele', emitent: 'Atelier Nord S.R.L.',
      numarDocument: '', dataEmiterii: '', perioadaFiscala: '',
      categoriePropusa: 'Altele', broadCategory: 'documente_solicitant', subFilter: null,
      confidenceExtraction: 58, confidenceCategorization: 61,
      observatieAI: 'Scan cu două documente; clasificarea necesită verificare manuală.',
      verificat: false, verificatManual: false, pageThumbnails: []
    }
  ];

  var grantMessages = [
    {
      id: 'grant_msg_001', clientCompany: 'Atelier Nord S.R.L.', clientContact: 'Mihai Ionescu',
      sender: 'client', senderName: 'Mihai Ionescu', date: '2026-04-16',
      body: 'Am trimis certificatul constatator, situațiile financiare și recipisa. Certificatul fiscal ar trebui să ajungă mâine.',
      attachments: [{ count: 3, label: 'documente solicitant' }],
      chips: [{ label: '3x Documente solicitant', style: 'neutral' }], read: true
    },
    {
      id: 'grant_msg_002', clientCompany: 'Atelier Nord S.R.L.', clientContact: 'Mihai Ionescu',
      sender: 'system', subtype: 'step_completion', date: '2026-04-15',
      stepCompleted: 1, stepName: 'Diagnostic de eligibilitate', completedBy: 'Anca Cobzaru',
      completedAt: '2026-04-15T10:00:00',
      summary: 'Pasul 1 finalizat. Eligibilitatea solicitantului și punctajul estimat au fost confirmate.', read: true
    },
    {
      id: 'grant_msg_003', clientCompany: 'Atelier Nord S.R.L.', clientContact: 'Mihai Ionescu',
      sender: 'internal', senderName: 'Cristina Popescu', date: '2026-04-18',
      body: 'Situațiile financiare și recipisa se potrivesc. Mai avem nevoie de certificatul fiscal și de confirmarea datei certificatului ONRC.',
      attachments: [], chips: [], read: true
    },
    {
      id: 'grant_msg_004', clientCompany: 'Atelier Nord S.R.L.', clientContact: 'Mihai Ionescu',
      sender: 'ai', senderName: 'Mesaj Automat Scriptica A.I.', date: '2026-04-20',
      body: 'Pasul 2 — Colectare documente și dovezi este blocat: un task obligatoriu și trei câmpuri obligatorii din anexă sunt necompletate.',
      attachments: [], chips: [], read: false, channels: ['email']
    }
  ];

  var flowItems = [
    {
      id: 'fi_grant_0001', verticalId: vertical.id, domain: vertical.domain,
      name: 'Modernizare tehnologică — Atelier Nord', clientName: 'Atelier Nord S.R.L.',
      clientContact: 'Mihai Ionescu',
      templateId: template.id, templateName: template.name,
      startDate: '2026-04-01', currentStep: 2, stepsCompleted: 1,
      status: 'asteapta_documente', responsibleIds: [1, 2],
      tasks: { step2: [
        { id: 'grant_task_2_1', completed: true, assigneeId: 1, completedAt: '2026-04-18T10:30:00', observation: 'Situațiile financiare și recipisa au fost verificate.', needsSeniorAttention: false, attachments: [] },
        { id: 'grant_task_2_2', completed: false, assigneeId: null, completedAt: null, observation: '', needsSeniorAttention: false, attachments: [] },
        { id: 'grant_task_2_3', completed: false, assigneeId: null, completedAt: null, observation: '', needsSeniorAttention: false, attachments: [] }
      ] },
      documents: grantDocuments,
      messages: grantMessages
    },
    {
      id: 'fi_grant_0002', verticalId: vertical.id, domain: vertical.domain,
      name: 'Automatizare producție — Nexo Pack', clientName: 'Nexo Pack S.R.L.',
      templateId: template.id, templateName: template.name,
      startDate: '2026-03-10', currentStep: 3, stepsCompleted: 2,
      status: 'in_verificare', responsibleIds: [3, 4]
    },
    {
      id: 'fi_grant_0003', verticalId: vertical.id, domain: vertical.domain,
      name: 'Digitalizare laborator — Medica Nova', clientName: 'Medica Nova S.R.L.',
      templateId: template.id, templateName: template.name,
      startDate: '2026-03-01', currentStep: 4, stepsCompleted: 3,
      status: 'spre_aprobare', responsibleIds: [2, 6]
    },
    {
      id: 'fi_grant_0004', verticalId: vertical.id, domain: vertical.domain,
      name: 'Extindere capacitate — Feronix', clientName: 'Feronix S.R.L.',
      templateId: template.id, templateName: template.name,
      startDate: '2026-01-15', currentStep: 5, stepsCompleted: 4,
      status: 'in_verificare', responsibleIds: [1, 3]
    }
  ];

  mergeRecords('scriptica.flowVerticals', [vertical]);
  mergeRecords('scriptica.flowTemplates', [template]);
  mergeRecords('scriptica.anexe', [documentChecklistAnnex, budgetAnnex]);
  mergeRecords('scriptica.clientTypes', [clientType]);
  mergeRecords('scriptica.saClients', [businessClient]);
  mergeRecords('scriptica.flowItems', flowItems);
  mergeDefaults('scriptica.anexaResponses', {
    'fi_grant_0001::anx_finantari_documente': {
      values: { '1': 'Atelier Nord S.R.L.', '2': 'RO45871230' },
      updatedAt: '2026-04-20', completedByName: null
    }
  });
  clearPresentationDraft(template.id);

  window.SCRIPTICA_CASE_STUDY = {
    verticalId: vertical.id,
    templateId: template.id,
    clientTypeId: clientType.id,
    businessClientId: businessClient.id,
    focusFlowItemId: flowItems[0].id
  };
})();
