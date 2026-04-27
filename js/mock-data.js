/* ============================================================
   Scriptica — Shared mock dataset
   Used by dashboard, situații, arhivă, and later phases.
   Today for deadline math is pinned to 2026-04-20.
   ============================================================ */

window.SCRIPTICA_MOCK = {

  currentUserId: 1,

  timeTrackingEnabled: true,

  currentUser: {
    id: 1,
    name: "Anca",
    fullName: "Anca Cobzaru",
    role: "Contabil"
  },

  employees: [
    { id: 1, name: "Anca Cobzaru",       role: "Contabil",          avatarId: 47 },
    { id: 2, name: "Cristina Popescu",   role: "Contabil senior",   avatarId: 32 },
    { id: 3, name: "Cosmin Zicemult",    role: "Contabil",          avatarId: 12 },
    { id: 4, name: "Andrei Juvanesco",   role: "Contabil",          avatarId: 60 },
    { id: 5, name: "Anca Revinovici",    role: "Salarizare",        avatarId: 25 },
    { id: 6, name: "Pavel Romanovici",   role: "Consultant fiscal", avatarId: 15 }
  ],

  departments: [
    { id: 1, name: "Contabilitate" },
    { id: 2, name: "Salarizare" },
    { id: 3, name: "Consultanță Fiscală" }
  ],
  departmentsEnabled: true,

  standardSteps: {
    step1: { name: "Recepție documente",     number: 1 },
    step2: { name: "Verificare documente",   number: 2 },
    step3: { name: "Validare și închidere",  number: 3 }
  },

  situationTypes: [
    { id: "raport_lunar",    name: "Raport Lunar",            frequency: "lunar",        offsets: { step1: 10, step2: 20, step3: 30 } },
    { id: "jurnal_tva",      name: "Jurnal TVA",              frequency: "lunar",        offsets: { step1: 7,  step2: 14, step3: 25 } },
    { id: "salarizari",      name: "Salarizări",              frequency: "lunar",        offsets: { step1: 5,  step2: 10, step3: 15 } },
    { id: "declaratii_trim", name: "Declarații Trimestriale", frequency: "trimestrial",  offsets: { step1: 30, step2: 60, step3: 85 } }
  ],

  clients: [
    { id: 1,  companyName: "Canvas S.R.L.",         contactName: "Antonio Popescu",     avatarId: 33, email: "antonio@canvas.ro",  phone: "+40712345678", situationIds: ["0000000126"] },
    { id: 2,  companyName: "Ionuț Profan PFA",      contactName: "Ionuț Profan",        avatarId: 11, situationIds: ["0000000127"] },
    { id: 3,  companyName: "Simbio Cost Control",   contactName: "Mihai Andrei",        avatarId: 14, situationIds: [] },
    { id: 4,  companyName: "Style S.R.L.",          contactName: "Laura Dinu",          avatarId: 44, situationIds: [] },
    { id: 5,  companyName: "Simba Commercial",      contactName: "Radu Ionescu",        avatarId: 17, situationIds: [] },
    { id: 6,  companyName: "Textile Cluj",          contactName: "Ana Maria Stoica",    avatarId: 49, situationIds: [] },
    { id: 7,  companyName: "Simpozion S.R.L.",      contactName: "Vlad Georgescu",      avatarId: 22, situationIds: [] },
    { id: 8,  companyName: "Alexandru Popa PFA",    contactName: "Alexandru Popa",      avatarId: 13, situationIds: [] },
    { id: 9,  companyName: "Simonis S.R.L.",        contactName: "Irina Marin",         avatarId: 48, situationIds: [] },
    { id: 10, companyName: "Talisman Expert",       contactName: "Corneliu Băjenaru",   avatarId: 16, situationIds: [] }
  ],

  currentClientId: 1,

  situations: [
    /* ---- Region 1 (dashboard): Situații Contabile Noi ---- */
    {
      id: "0000000126",
      clientId: 1, clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      typeId: "raport_lunar", typeName: "Raport Lunar", typeLabel: "Raport Lunar Martie 2026",
      titularId: 1, titularName: "Anca Cobzaru",
      responsibleStepId: 1, responsibleStepName: "Anca Cobzaru",
      departmentId: 1,
      startDate: "2026-04-13",
      deadlineStep1: "2026-04-15", deadlineStep2: "2026-05-03", deadlineStep3: "2026-05-13",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "in_verificare",
      daysToDeadline: 13,
      lastNotification: { date: "2026-04-18", time: "09:00" },
      isNew: true,
      activeHelpers: { step1: [], step2: [3], step3: [] },
      helperRequests: [
        {
          id: 1, stepId: 2, requesterId: 1, helperId: 3,
          status: "accepted",
          note: "Ai putea să verifici factura de la Orange? Mi se pare ciudată.",
          requestedAt: "2026-04-18T14:30:00",
          respondedAt: "2026-04-18T15:02:00"
        }
      ],
      clientPending: [
        { id: "cp_1", label: "Factură chirie aprilie",              requested: "2026-04-12" },
        { id: "cp_2", label: "Extras de cont BT (martie-aprilie)",  requested: "2026-04-14" },
        { id: "cp_3", label: "Bon combustibil 18 aprilie",          requested: "2026-04-15" }
      ]
    },
    {
      id: "0000000127",
      clientId: 2, clientCompany: "Ionuț Profan PFA", clientContact: "Ionuț Profan",
      typeId: "jurnal_tva", typeName: "Jurnal TVA", typeLabel: "Jurnal TVA Martie 2026",
      titularId: 1, titularName: "Anca Cobzaru",
      responsibleStepId: 1, responsibleStepName: "Anca Cobzaru",
      departmentId: 2,
      startDate: "2026-04-15",
      deadlineStep1: "2026-04-22", deadlineStep2: "2026-04-29", deadlineStep3: "2026-05-10",
      currentStep: 1, totalSteps: 2, stepsCompleted: 0,
      status: "asteapta_documente",
      daysToDeadline: 2,
      lastNotification: { date: "2026-04-19", time: "08:30" },
      isNew: true
    },
    {
      id: "0000000128",
      clientId: 7, clientCompany: "Simpozion S.R.L.", clientContact: "Vlad Georgescu",
      typeId: "salarizari", typeName: "Salarizări", typeLabel: "Salarizări Martie 2026",
      titularId: 2, titularName: "Cristina Popescu",
      responsibleStepId: 2, responsibleStepName: "Cristina Popescu",
      departmentId: 3,
      startDate: "2026-04-12",
      deadlineStep1: "2026-04-17", deadlineStep2: "2026-04-22", deadlineStep3: "2026-04-27",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "in_verificare",
      daysToDeadline: 2,
      lastNotification: { date: "2026-04-17", time: "14:45" },
      isNew: true,
      activeHelpers: { step1: [], step2: [], step3: [] },
      helperRequests: [
        {
          id: 2, stepId: 2, requesterId: 2, helperId: 1,
          status: "pending",
          note: "Poți să te uiți peste ștatul de salarii? Am nevoie de o a doua opinie pe câteva calcule.",
          requestedAt: "2026-04-19T10:15:00",
          respondedAt: null
        }
      ]
    },

    /* ---- Region 2 (dashboard): Alerte ---- */
    {
      id: "0000000123",
      clientId: 4, clientCompany: "Style S.R.L.", clientContact: "Laura Dinu",
      typeId: "raport_lunar", typeName: "Raport Lunar", typeLabel: "Raport Lunar Februarie 2026",
      titularId: 4, titularName: "Andrei Juvanesco",
      responsibleStepId: 4, responsibleStepName: "Andrei Juvanesco",
      departmentId: 2,
      startDate: "2026-03-05",
      deadlineStep1: "2026-03-15", deadlineStep2: "2026-03-25", deadlineStep3: "2026-04-17",
      currentStep: 3, totalSteps: 3, stepsCompleted: 2,
      status: "intarziere",
      daysToDeadline: -3,
      lastNotification: { date: "2026-04-17", time: "19:00" }
    },
    {
      id: "0000000124",
      clientId: 5, clientCompany: "Simba Commercial", clientContact: "Radu Ionescu",
      typeId: "jurnal_tva", typeName: "Jurnal TVA", typeLabel: "Jurnal TVA Februarie 2026",
      titularId: 6, titularName: "Pavel Romanovici",
      responsibleStepId: 6, responsibleStepName: "Pavel Romanovici",
      departmentId: 3,
      startDate: "2026-03-04",
      deadlineStep1: "2026-03-11", deadlineStep2: "2026-03-18", deadlineStep3: "2026-04-18",
      currentStep: 3, totalSteps: 3, stepsCompleted: 1,
      status: "intarziere",
      daysToDeadline: -2,
      lastNotification: { date: "2026-04-18", time: "19:00" }
    },

    /* ---- Region 3 (dashboard): Clienții Mei (Anca → Canvas & Ionuț Profan) ---- */
    {
      id: "0000000129",
      clientId: 1, clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      typeId: "jurnal_tva", typeName: "Jurnal TVA", typeLabel: "Jurnal TVA Martie 2026",
      titularId: 1, titularName: "Anca Cobzaru",
      responsibleStepId: 1, responsibleStepName: "Anca Cobzaru",
      departmentId: 1,
      startDate: "2026-04-05",
      deadlineStep1: "2026-04-12", deadlineStep2: "2026-04-26", deadlineStep3: "2026-05-06",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "in_verificare",
      daysToDeadline: 6,
      lastNotification: { date: "2026-04-16", time: "11:20" }
    },
    {
      id: "0000000130",
      clientId: 2, clientCompany: "Ionuț Profan PFA", clientContact: "Ionuț Profan",
      typeId: "raport_lunar", typeName: "Raport Lunar", typeLabel: "Raport Lunar Martie 2026",
      titularId: 1, titularName: "Anca Cobzaru",
      responsibleStepId: 1, responsibleStepName: "Anca Cobzaru",
      departmentId: 2,
      startDate: "2026-03-25",
      deadlineStep1: "2026-04-04", deadlineStep2: "2026-04-14", deadlineStep3: "2026-04-24",
      currentStep: 3, totalSteps: 3, stepsCompleted: 2,
      status: "analiza",
      daysToDeadline: 4,
      lastNotification: { date: "2026-04-15", time: "16:05" }
    },

    /* ---- Finalizat example ---- */
    {
      id: "0000000121",
      clientId: 6, clientCompany: "Textile Cluj", clientContact: "Ana Maria Stoica",
      typeId: "raport_lunar", typeName: "Raport Lunar", typeLabel: "Raport Lunar Februarie 2026",
      titularId: 3, titularName: "Cosmin Zicemult",
      responsibleStepId: 3, responsibleStepName: "Cosmin Zicemult",
      departmentId: 1,
      startDate: "2026-03-02",
      deadlineStep1: "2026-03-12", deadlineStep2: "2026-03-22", deadlineStep3: "2026-04-01",
      currentStep: 3, totalSteps: 3, stepsCompleted: 3,
      status: "finalizat",
      daysToDeadline: 0,
      lastNotification: { date: "2026-04-01", time: "17:30" }
    },

    /* ---- Phase 3: extra situations to reach 15+ ---- */

    /* Așteaptă Documente, step1 ongoing */
    {
      id: "0000000131",
      clientId: 6, clientCompany: "Textile Cluj", clientContact: "Ana Maria Stoica",
      typeId: "salarizari", typeName: "Salarizări", typeLabel: "Salarizări Martie 2026",
      titularId: 5, titularName: "Anca Revinovici",
      responsibleStepId: 5, responsibleStepName: "Anca Revinovici",
      departmentId: 3,
      startDate: "2026-04-17",
      deadlineStep1: "2026-04-27", deadlineStep2: "2026-05-02", deadlineStep3: "2026-05-07",
      currentStep: 1, totalSteps: 3, stepsCompleted: 0,
      status: "asteapta_documente",
      daysToDeadline: 7,
      lastNotification: { date: "2026-04-17", time: "10:15" }
    },

    /* Analiză */
    {
      id: "0000000132",
      clientId: 3, clientCompany: "Simbio Cost Control", clientContact: "Mihai Andrei",
      typeId: "raport_lunar", typeName: "Raport Lunar", typeLabel: "Raport Lunar Martie 2026",
      titularId: 3, titularName: "Cosmin Zicemult",
      responsibleStepId: 3, responsibleStepName: "Cosmin Zicemult",
      departmentId: 1,
      startDate: "2026-04-01",
      deadlineStep1: "2026-04-11", deadlineStep2: "2026-04-28", deadlineStep3: "2026-05-05",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "analiza",
      daysToDeadline: 8,
      lastNotification: { date: "2026-04-12", time: "09:45" }
    },

    /* Închisă — păstrată în istoric */
    {
      id: "0000000133",
      clientId: 8, clientCompany: "Alexandru Popa PFA", clientContact: "Alexandru Popa",
      typeId: "jurnal_tva", typeName: "Jurnal TVA", typeLabel: "Jurnal TVA Ianuarie 2026",
      titularId: 2, titularName: "Cristina Popescu",
      responsibleStepId: 2, responsibleStepName: "Cristina Popescu",
      departmentId: 2,
      startDate: "2026-02-01",
      deadlineStep1: "2026-02-08", deadlineStep2: "2026-02-15", deadlineStep3: "2026-02-26",
      currentStep: 3, totalSteps: 3, stepsCompleted: 3,
      status: "inchisa",
      daysToDeadline: 0,
      lastNotification: { date: "2026-02-26", time: "16:50" }
    },

    /* Închisă */
    {
      id: "0000000134",
      clientId: 9, clientCompany: "Simonis S.R.L.", clientContact: "Irina Marin",
      typeId: "salarizari", typeName: "Salarizări", typeLabel: "Salarizări Februarie 2026",
      titularId: 1, titularName: "Anca Cobzaru",
      responsibleStepId: 1, responsibleStepName: "Anca Cobzaru",
      departmentId: 3,
      startDate: "2026-03-08",
      deadlineStep1: "2026-03-13", deadlineStep2: "2026-03-18", deadlineStep3: "2026-03-23",
      currentStep: 3, totalSteps: 3, stepsCompleted: 3,
      status: "inchisa",
      daysToDeadline: 0,
      lastNotification: { date: "2026-03-23", time: "14:10" }
    },

    /* Anulată */
    {
      id: "0000000135",
      clientId: 10, clientCompany: "Talisman Expert", clientContact: "Corneliu Băjenaru",
      typeId: "declaratii_trim", typeName: "Declarații Trimestriale", typeLabel: "Declarații T1 2026",
      titularId: 6, titularName: "Pavel Romanovici",
      responsibleStepId: 6, responsibleStepName: "Pavel Romanovici",
      departmentId: 1,
      startDate: "2026-01-15",
      deadlineStep1: "2026-02-14", deadlineStep2: "2026-03-16", deadlineStep3: "2026-04-10",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "anulata",
      daysToDeadline: 0,
      lastNotification: { date: "2026-03-20", time: "11:00" }
    },

    /* Întârziere */
    {
      id: "0000000136",
      clientId: 8, clientCompany: "Alexandru Popa PFA", clientContact: "Alexandru Popa",
      typeId: "raport_lunar", typeName: "Raport Lunar", typeLabel: "Raport Lunar Martie 2026",
      titularId: 4, titularName: "Andrei Juvanesco",
      responsibleStepId: 4, responsibleStepName: "Andrei Juvanesco",
      departmentId: 2,
      startDate: "2026-03-30",
      deadlineStep1: "2026-04-09", deadlineStep2: "2026-04-19", deadlineStep3: "2026-04-29",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "intarziere",
      daysToDeadline: -1,
      lastNotification: { date: "2026-04-19", time: "19:00" }
    },

    /* În Verificare, declarații trimestriale */
    {
      id: "0000000137",
      clientId: 2, clientCompany: "Ionuț Profan PFA", clientContact: "Ionuț Profan",
      typeId: "declaratii_trim", typeName: "Declarații Trimestriale", typeLabel: "Declarații T1 2026",
      titularId: 1, titularName: "Anca Cobzaru",
      responsibleStepId: 1, responsibleStepName: "Anca Cobzaru",
      departmentId: 3,
      startDate: "2026-03-20",
      deadlineStep1: "2026-04-19", deadlineStep2: "2026-05-19", deadlineStep3: "2026-06-13",
      currentStep: 2, totalSteps: 3, stepsCompleted: 1,
      status: "in_verificare",
      daysToDeadline: 29,
      lastNotification: { date: "2026-04-19", time: "09:30" }
    }
  ],

  messages: [
    {
      id: 1,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.",
      clientContact: "Antonio Popescu",
      sender: "client",
      senderName: "Antonio Popescu",
      date: "2026-04-18",
      body: "Vă trimit atașat situația contabilă pe Martie 2026, dacă mai vin facturi le trimit mai încolo.",
      attachments: [ { count: 3, label: "documente la Raportul Lunar Martie 2026" } ],
      chips: [
        { label: "2x Intrare", style: "neutral" },
        { label: "1x Ieșire",  style: "neutral" }
      ],
      read: false
    },
    {
      id: 2,
      situationId: "0000000127",
      clientCompany: "Ionuț Profan PFA",
      clientContact: "Ionuț Profan",
      sender: "client",
      senderName: "Ionuț Profan",
      date: "2026-04-17",
      body: "Am atașat documentele pentru jurnalul de TVA și o adeverință de salariu. Mulțumesc!",
      attachments: [ { count: 2, label: "documente la Jurnal TVA Martie 2026" } ],
      chips: [
        { label: "1x Intrare",    style: "neutral" },
        { label: "1x Salarizare", style: "neutral" }
      ],
      read: true
    },
    {
      id: 3,
      situationId: "0000000123",
      clientCompany: "Style S.R.L.",
      clientContact: "Laura Dinu",
      sender: "ai",
      senderName: "Mesaj Automat Scriptica A.I.",
      date: "2026-04-17",
      body: "Raportul Lunar Februarie 2026 pentru Style S.R.L. este în întârziere cu 3 zile.\nMotiv: Lipsă Documente. Notificare trimisă clientului pe WhatsApp și Email.",
      attachments: [],
      chips: [],
      read: false,
      channels: ["whatsapp", "email"]
    },
    {
      id: 4,
      situationId: "0000000129",
      clientCompany: "Canvas S.R.L.",
      clientContact: "Antonio Popescu",
      sender: "internal",
      senderName: "Cristina Popescu",
      date: "2026-04-16",
      body: "Anca, am verificat jurnalul TVA pentru Canvas. Poți confirma totalurile când ai o secundă?",
      attachments: [],
      chips: [],
      read: true
    },
    {
      id: 5,
      situationId: "0000000128",
      clientCompany: "Simpozion S.R.L.",
      clientContact: "Vlad Georgescu",
      sender: "client",
      senderName: "Vlad Georgescu",
      date: "2026-04-15",
      body: "Vă trimit un document pe care nu sunt sigur unde îl încadrați — vă rog să-l verificați.",
      attachments: [ { count: 1, label: "document la Salarizări Martie 2026" } ],
      chips: [
        { label: "1x Necategorisit", style: "neutral" }
      ],
      read: false
    },

    /* ---- Extra messages for demo situation 126 (Phase 4a) ---- */
    {
      id: 101,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "system", subtype: "step_completion",
      date: "2026-04-15",
      stepCompleted: 1, stepName: "Recepție documente",
      completedBy: "Anca Cobzaru",
      completedAt: "2026-04-15T11:42:00",
      summary: "Pasul 1 finalizat. Documentele au fost recepționate și verificate pentru completitudine.",
      read: true
    },
    {
      id: 102,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "internal",
      senderName: "Cristina Popescu",
      date: "2026-04-16",
      body: "Anca, am verificat documentația primară. Îți trimit o notă pe @factura_orange_martie să vezi de ce suma diferă de lunile anterioare.",
      attachments: [],
      chips: [],
      read: true
    },
    {
      id: 103,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "ai",
      senderName: "Mesaj Automat Scriptica A.I.",
      date: "2026-04-17",
      body: "Pasul 2 — Verificare documente a început. Responsabil: Anca Cobzaru. Termen estimat: 03.05.2026.",
      attachments: [],
      chips: [],
      read: true,
      channels: ["email"]
    },
    {
      id: 104,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "system", subtype: "helper_request",
      date: "2026-04-18",
      requesterName: "Anca Cobzaru",
      helperName: "Cosmin Zicemult",
      note: "Ai putea să verifici factura de la Orange? Mi se pare ciudată.",
      read: true
    },
    {
      id: 105,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "system", subtype: "helper_response",
      date: "2026-04-18",
      helperName: "Cosmin Zicemult",
      accepted: true,
      read: true
    },
    {
      id: 106,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "internal",
      senderName: "Cosmin Zicemult",
      date: "2026-04-18",
      body: "Primit. Mă uit peste @factura_orange_martie în după-amiaza asta și îți confirm.",
      attachments: [],
      chips: [],
      read: true
    },
    {
      id: 107,
      situationId: "0000000126",
      clientCompany: "Canvas S.R.L.", clientContact: "Antonio Popescu",
      sender: "client",
      senderName: "Antonio Popescu",
      date: "2026-04-19",
      body: "Salutare, am văzut mesajul automat. Dacă mai aveți întrebări despre documente, sunt disponibil și pe WhatsApp.",
      attachments: [],
      chips: [],
      read: false
    }
  ]
};

/* ------------------------------------------------------------
   PHASE 5 — Archival situations
   Seeded BEFORE augmentTasks so their task lists get populated too.
   ------------------------------------------------------------ */
(function seedArchivalSituations() {
  var RO_MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function addDays(isoStr, n) {
    var dt = new Date(isoStr + 'T00:00:00');
    dt.setDate(dt.getDate() + n);
    return iso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  var CFG = [
    /* Canvas S.R.L. (1) */
    { id: "0000000140", clientId: 1, titularId: 2, year: 2026, month: 2,  dept: 1 },
    { id: "0000000141", clientId: 1, titularId: 1, year: 2026, month: 1,  dept: 1 },
    { id: "0000000142", clientId: 1, titularId: 2, year: 2025, month: 12, dept: 1 },
    { id: "0000000143", clientId: 1, titularId: 1, year: 2025, month: 11, dept: 1 },
    /* Ionuț Profan PFA (2) */
    { id: "0000000160", clientId: 2, titularId: 1, year: 2026, month: 2,  dept: 2 },
    { id: "0000000161", clientId: 2, titularId: 1, year: 2026, month: 1,  dept: 2 },
    /* Simbio Cost Control (3) */
    { id: "0000000190", clientId: 3, titularId: 3, year: 2026, month: 2,  dept: 1 },
    /* Style S.R.L. (4) */
    { id: "0000000170", clientId: 4, titularId: 4, year: 2026, month: 2,  dept: 2 },
    /* Simba Commercial (5) */
    { id: "0000000150", clientId: 5, titularId: 6, year: 2026, month: 3,  dept: 3 },
    { id: "0000000151", clientId: 5, titularId: 6, year: 2026, month: 2,  dept: 3 },
    { id: "0000000152", clientId: 5, titularId: 6, year: 2025, month: 12, dept: 3 },
    { id: "0000000153", clientId: 5, titularId: 6, year: 2025, month: 11, dept: 3 },
    /* Textile Cluj (6) */
    { id: "0000000180", clientId: 6, titularId: 3, year: 2026, month: 3,  dept: 1 }
  ];

  var TODAY = new Date('2026-04-20');

  CFG.forEach(function (c) {
    var client = window.SCRIPTICA_MOCK.clients.find(function (x) { return x.id === c.clientId; });
    var titular = window.SCRIPTICA_MOCK.employees.find(function (e) { return e.id === c.titularId; });
    if (!client || !titular) return;

    var startIso = iso(c.year, c.month, 2);
    var d1 = addDays(startIso, 10);
    var d2 = addDays(startIso, 20);
    var d3 = addDays(startIso, 30);

    // Anything ending before "today" (April 2026) is closed; Mar 2026 still in verification.
    var closedByDate = (new Date(d3 + 'T00:00:00') < TODAY);
    var currentStep = closedByDate ? 3 : 2;
    var stepsCompleted = closedByDate ? 3 : 1;
    var status = closedByDate ? 'inchisa' : 'in_verificare';

    window.SCRIPTICA_MOCK.situations.push({
      id: c.id,
      clientId: c.clientId,
      clientCompany: client.companyName,
      clientContact: client.contactName,
      typeId: 'raport_lunar',
      typeName: 'Raport Lunar',
      typeLabel: 'Raport Lunar ' + RO_MONTHS[c.month - 1] + ' ' + c.year,
      titularId: c.titularId,
      titularName: titular.name,
      responsibleStepId: c.titularId,
      responsibleStepName: titular.name,
      departmentId: c.dept,
      startDate: startIso,
      deadlineStep1: d1,
      deadlineStep2: d2,
      deadlineStep3: d3,
      currentStep: currentStep,
      totalSteps: 3,
      stepsCompleted: stepsCompleted,
      status: status,
      daysToDeadline: 0,
      lastNotification: { date: d3, time: '17:00' }
    });
  });
})();

/* ------------------------------------------------------------
   Task augmentation — pre-fills step1/step2/step3 task lists
   based on each situation's currentStep and status.
   ------------------------------------------------------------ */
(function augmentTasks() {
  var TASK_TEMPLATES = {
    step1: [
      { id: 1, label: "Primire documente de la client" },
      { id: 2, label: "Verificare completitudine" },
      { id: 3, label: "Confirmare recepție" }
    ],
    step2: [
      { id: 4,  label: "Verificare organizare dosar" },
      { id: 5,  label: "E-Factura" },
      { id: 6,  label: "Înregistrare Documente" },
      { id: 7,  label: "Ștat Salarii" },
      { id: 8,  label: "Închidere Balanță" },
      { id: 9,  label: "Salvare Rapoarte" },
      { id: 10, label: "Declarație OP-uri" }
    ],
    step3: [
      { id: 11, label: "Verificare finală de contabil senior" },
      { id: 12, label: "Închidere situație" }
    ]
  };

  var STEP_KEYS = ['step1', 'step2', 'step3'];

  window.SCRIPTICA_MOCK.situations.forEach(function (s) {
    /* Default helper state if not already set on the situation */
    if (!s.activeHelpers)   s.activeHelpers = { step1: [], step2: [], step3: [] };
    if (!s.helperRequests)  s.helperRequests = [];

    var tasks = {};
    STEP_KEYS.forEach(function (key, idx) {
      var stepNum = idx + 1;
      var template = TASK_TEMPLATES[key];
      var allDone;
      if (s.status === 'inchisa' || s.status === 'finalizat') {
        allDone = true;
      } else if (s.status === 'anulata') {
        allDone = stepNum < s.currentStep;
      } else {
        allDone = stepNum < s.currentStep;
      }
      tasks[key] = template.map(function (t) {
        return {
          id: t.id,
          label: t.label,
          completed: allDone,
          assigneeId: allDone ? s.titularId : null,
          completedAt: allDone ? '2026-04-15T10:00:00' : null,
          observation: '',
          needsSeniorAttention: false,
          attachments: []
        };
      });
    });
    s.tasks = tasks;
  });

  /* ============================================================
     PHASE 4b — Documents for demo situation 0000000126
     21 varied docs across Intrare / Ieșire / Salarizare / Necategorisit.
     ============================================================ */
  window.SCRIPTICA_MOCK.documents = [

    /* ---- Intrare (7) ---- */
    {
      id: "doc_001",
      situationId: "0000000126",
      filename: "factura_orange_martie_2026.pdf",
      uploadedAt: "2026-04-10T14:22:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură furnizor",
      emitent: "Orange România S.A.",
      numarDocument: "235165",
      dataEmiterii: "2026-04-05",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: 248.90, tvaProcent: 19, tvaValoare: 47.29, valoareTotala: 296.19, moneda: "RON",
      categoriePropusa: "Factură furnizor",
      broadCategory: "intrare",
      subFilter: null,
      confidenceExtraction: 95, confidenceCategorization: 98,
      observatieAI: "Servicii telecom Orange România, TVA 19% calculat corect, valoare totală 296.19 RON.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_002",
      situationId: "0000000126",
      filename: "factura_ovh_hosting.pdf",
      uploadedAt: "2026-04-09T10:15:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură furnizor",
      emitent: "OVH SAS",
      numarDocument: "RO-FR-88412",
      dataEmiterii: "2026-04-01",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: 125.00, tvaProcent: 19, tvaValoare: 23.75, valoareTotala: 148.75, moneda: "EUR",
      categoriePropusa: "Factură furnizor",
      broadCategory: "intrare",
      subFilter: "ue",
      confidenceExtraction: 78, confidenceCategorization: 92,
      observatieAI: "Servicii hosting OVH, Franța. Taxare inversă UE aplicabilă — verificați dacă TVA-ul este tratat corect în jurnal.",
      verificat: false, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_003",
      situationId: "0000000126",
      filename: "facturi_digi_multi.pdf",
      uploadedAt: "2026-04-12T09:41:00",
      source: "whatsapp",
      pagesCount: 2,
      multiDoc: true, multiDocConfidence: "clear",
      tipDocument: "Factură furnizor",
      emitent: "Digi Communications",
      numarDocument: "DC-2026-4419",
      dataEmiterii: "2026-04-02",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: 89.00, tvaProcent: 19, tvaValoare: 16.91, valoareTotala: 105.91, moneda: "RON",
      categoriePropusa: "Factură furnizor",
      broadCategory: "intrare",
      subFilter: null,
      confidenceExtraction: 93, confidenceCategorization: 96,
      observatieAI: "Digi Communications — martie, servicii telecom. 2 documente detectate și separate automat.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_004",
      situationId: "0000000126",
      filename: "bon_omv_petrom_12_04.jpg",
      uploadedAt: "2026-04-12T18:03:00",
      source: "upload",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Bon fiscal",
      emitent: "OMV Petrom",
      numarDocument: "0081731",
      dataEmiterii: "2026-04-12",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 207.81, tvaProcent: 19, tvaValoare: 39.49, valoareTotala: 247.30, moneda: "RON",
      categoriePropusa: "Bon fiscal",
      broadCategory: "intrare",
      subFilter: "bonuri",
      confidenceExtraction: 94, confidenceCategorization: 97,
      observatieAI: "OMV Petrom — combustibil, valoare totală 247.30 RON.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_005",
      situationId: "0000000126",
      filename: "bon_mega_image_08_04.jpg",
      uploadedAt: "2026-04-09T12:04:00",
      source: "upload",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Bon fiscal",
      emitent: "Mega Image",
      numarDocument: "0012884",
      dataEmiterii: "2026-04-08",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 71.02, tvaProcent: 9, tvaValoare: 6.39, valoareTotala: 77.41, moneda: "RON",
      categoriePropusa: "Bon fiscal",
      broadCategory: "intrare",
      subFilter: "bonuri",
      confidenceExtraction: 88, confidenceCategorization: 91,
      observatieAI: "Mega Image — articole alimentare (TVA 9%) și nealimentare (TVA 19%). Verificați împărțirea pe cote dacă este necesar pentru deducere.",
      verificat: false, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_006",
      situationId: "0000000126",
      filename: "NIR_003_aprilie.pdf",
      uploadedAt: "2026-04-11T11:02:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "NIR",
      emitent: "Canvas S.R.L.",
      numarDocument: "NIR-2026-003",
      dataEmiterii: "2026-04-11",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 1840.00, tvaProcent: 19, tvaValoare: 349.60, valoareTotala: 2189.60, moneda: "RON",
      categoriePropusa: "NIR",
      broadCategory: "intrare",
      subFilter: null,
      confidenceExtraction: 92, confidenceCategorization: 93,
      observatieAI: "Comandă de consumabile. Valoarea corespunde cu factura furnizor atașată în același e-mail.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_007",
      situationId: "0000000126",
      filename: "factura_shell_kazakhstan.pdf",
      uploadedAt: "2026-04-14T08:30:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură furnizor",
      emitent: "Shell International",
      numarDocument: "SHL-KZ-5521",
      dataEmiterii: "2026-04-07",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 420.00, tvaProcent: 0, tvaValoare: 0, valoareTotala: 420.00, moneda: "USD",
      categoriePropusa: "Factură furnizor",
      broadCategory: "intrare",
      subFilter: "non-ue",
      confidenceExtraction: 91, confidenceCategorization: 94,
      observatieAI: "Shell International (Kazakhstan). Verificați regimul TVA (import servicii) și cursul valutar la data înregistrării.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },

    /* ---- Ieșire (3) ---- */
    {
      id: "doc_008",
      situationId: "0000000126",
      filename: "factura_emisa_mega_image_037.pdf",
      uploadedAt: "2026-04-08T16:12:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură emisă",
      emitent: "Canvas S.R.L.",
      numarDocument: "CNV-2026-037",
      dataEmiterii: "2026-04-08",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 1048.74, tvaProcent: 19, tvaValoare: 199.26, valoareTotala: 1248.00, moneda: "RON",
      categoriePropusa: "Factură emisă",
      broadCategory: "iesire",
      subFilter: null,
      confidenceExtraction: 97, confidenceCategorization: 99,
      observatieAI: "Canvas S.R.L. → Mega Image, valoare totală 1,248.00 RON inclusiv TVA 19%.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_009",
      situationId: "0000000126",
      filename: "factura_emisa_textile_cluj_038.pdf",
      uploadedAt: "2026-04-10T09:44:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură emisă",
      emitent: "Canvas S.R.L.",
      numarDocument: "CNV-2026-038",
      dataEmiterii: "2026-04-10",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 2100.00, tvaProcent: 19, tvaValoare: 399.00, valoareTotala: 2499.00, moneda: "RON",
      categoriePropusa: "Factură emisă",
      broadCategory: "iesire",
      subFilter: null,
      confidenceExtraction: 96, confidenceCategorization: 98,
      observatieAI: "Canvas S.R.L. → Textile Cluj, consultanță lunară. Valoare totală 2,499.00 RON.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_010",
      situationId: "0000000126",
      filename: "factura_emisa_simbio_039.pdf",
      uploadedAt: "2026-04-11T14:22:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură emisă",
      emitent: "Canvas S.R.L.",
      numarDocument: "CNV-2026-039",
      dataEmiterii: "2026-04-11",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: 3150.00, tvaProcent: 19, tvaValoare: 598.50, valoareTotala: 3748.50, moneda: "RON",
      categoriePropusa: "Factură emisă",
      broadCategory: "iesire",
      subFilter: null,
      confidenceExtraction: 94, confidenceCategorization: 97,
      observatieAI: "Canvas S.R.L. → Simbio Cost Control, servicii de consultanță. TVA calculat corect.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },

    /* ---- Salarizare (2) ---- */
    {
      id: "doc_011",
      situationId: "0000000126",
      filename: "stat_salarii_martie_2026.xlsx",
      uploadedAt: "2026-04-05T11:03:00",
      source: "upload",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Document HR",
      emitent: "Canvas S.R.L.",
      numarDocument: "STAT-2026-03",
      dataEmiterii: "2026-04-05",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: 18420.00, moneda: "RON",
      categoriePropusa: "Document HR",
      broadCategory: "salarizare",
      subFilter: null,
      confidenceExtraction: 93, confidenceCategorization: 96,
      observatieAI: "Martie 2026, 7 angajați. Total brut identificat: 18,420 RON.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_012",
      situationId: "0000000126",
      filename: "fluturasi_salariale_martie_2026.pdf",
      uploadedAt: "2026-04-05T11:05:00",
      source: "upload",
      pagesCount: 7,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Document HR",
      emitent: "Canvas S.R.L.",
      numarDocument: "FLT-2026-03",
      dataEmiterii: "2026-04-05",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Document HR",
      broadCategory: "salarizare",
      subFilter: null,
      confidenceExtraction: 91, confidenceCategorization: 95,
      observatieAI: "Martie 2026 — 7 pagini, câte un fluturaș per angajat.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },

    /* ---- Necategorisit (9) ---- */
    {
      id: "doc_013",
      situationId: "0000000126",
      filename: "situatia_stocurilor_q1.xlsx",
      uploadedAt: "2026-04-06T13:31:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Situația stocurilor",
      emitent: "Canvas S.R.L.",
      numarDocument: "STOC-Q1-2026",
      dataEmiterii: "2026-04-05",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Situația stocurilor",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 92, confidenceCategorization: 94,
      observatieAI: "Raport intern pentru Q1 2026, nu un document fiscal. Nu se aplică regulile de categorisire transacțională.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_014",
      situationId: "0000000126",
      filename: "balanta_verificare_q1.pdf",
      uploadedAt: "2026-04-06T13:32:00",
      source: "email",
      pagesCount: 3,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Balanță de verificare",
      emitent: "Canvas S.R.L.",
      numarDocument: "BAL-Q1-2026",
      dataEmiterii: "2026-04-04",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Balanță de verificare",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 95, confidenceCategorization: 97,
      observatieAI: "Q1 2026 — raport intern de control, nu este un document tranzacțional.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_015",
      situationId: "0000000126",
      filename: "registru_casa_martie.pdf",
      uploadedAt: "2026-04-04T17:00:00",
      source: "email",
      pagesCount: 2,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Registru de casă",
      emitent: "Canvas S.R.L.",
      numarDocument: "REG-CASA-03-2026",
      dataEmiterii: "2026-04-01",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Registru de casă",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 90, confidenceCategorization: 93,
      observatieAI: "Martie 2026 — conține toate intrările și ieșirile de numerar.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_016",
      situationId: "0000000126",
      filename: "foaie_parcurs_auto_canvas.pdf",
      uploadedAt: "2026-04-07T10:20:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Foaie de parcurs",
      emitent: "Canvas S.R.L.",
      numarDocument: "FP-003-2026",
      dataEmiterii: "2026-04-03",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Foaie de parcurs",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 89, confidenceCategorization: 92,
      observatieAI: "Auto Canvas — justificare consum combustibil. Asociați cu bonul OMV corespunzător.",
      verificat: false, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_017",
      situationId: "0000000126",
      filename: "registru_imobilizari_2026.pdf",
      uploadedAt: "2026-04-03T09:00:00",
      source: "email",
      pagesCount: 2,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Registru imobilizări",
      emitent: "Canvas S.R.L.",
      numarDocument: "REG-IMOB-2026",
      dataEmiterii: "2026-03-31",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Registru imobilizări",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 92, confidenceCategorization: 95,
      observatieAI: "Actualizat pe luna martie. Două intrări noi identificate.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_018",
      situationId: "0000000126",
      filename: "email_antonio_transmitere.eml",
      uploadedAt: "2026-04-10T14:20:00",
      source: "email",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "E-mail de transmitere",
      emitent: "Antonio Popescu (Canvas S.R.L.)",
      numarDocument: null,
      dataEmiterii: "2026-04-10",
      perioadaFiscala: "2026-03",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: null,
      categoriePropusa: "E-mail de transmitere",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 91, confidenceCategorization: 90,
      observatieAI: "De la Antonio Popescu: 'atașez facturile lunii'. Fișierele atașate au fost procesate separat.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_019",
      situationId: "0000000126",
      filename: "aviz_receptie_dhl.pdf",
      uploadedAt: "2026-04-13T15:12:00",
      source: "whatsapp",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Aviz / Proces verbal",
      emitent: "DHL Express",
      numarDocument: "AV-DHL-9921",
      dataEmiterii: "2026-04-13",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: null,
      categoriePropusa: "Aviz / Proces verbal",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 90, confidenceCategorization: 90,
      observatieAI: "DHL Express — însoțire marfă. Document operațional, urmează a fi corelat cu factura furnizor aferentă.",
      verificat: true, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_020",
      situationId: "0000000126",
      filename: "bon_scanat_calitate_slaba.jpg",
      uploadedAt: "2026-04-14T18:44:00",
      source: "whatsapp",
      pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Bon fiscal",
      emitent: "—",
      numarDocument: null,
      dataEmiterii: null,
      perioadaFiscala: null,
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Bon fiscal",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 62, confidenceCategorization: 55,
      observatieAI: "Scanat la calitate scăzută. Valorile numerice au fost parțial extrase. Verificare manuală recomandată înainte de înregistrare.",
      verificat: false, verificatManual: false,
      pageThumbnails: []
    },
    {
      id: "doc_021",
      situationId: "0000000126",
      filename: "scan_whatsapp_multi_documente.pdf",
      uploadedAt: "2026-04-15T09:17:00",
      source: "whatsapp",
      pagesCount: 4,
      multiDoc: true, multiDocConfidence: "ambiguous",
      tipDocument: "Document multiplu",
      emitent: "—",
      numarDocument: null,
      dataEmiterii: "2026-04-14",
      perioadaFiscala: "2026-04",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Document multiplu",
      broadCategory: "necategorisit",
      subFilter: null,
      confidenceExtraction: 75, confidenceCategorization: 68,
      observatieAI: "Pare să conțină 3 facturi distincte pe paginile 1, 2-3 și 4. Necesită separare manuală pentru confirmare.",
      verificat: false, verificatManual: false,
      pageThumbnails: [null, null, null, null]
    }
  ];

  /* Seed a plausible observation on one completed task per completed step
     for every situation, plus a couple of senior-attention flags for variety.
     Ensures the Situații table's expanded row always has something to show. */
  (function seedObservations() {
    var OBS_POOL = [
      "Verificat cu atenție, totul este în regulă.",
      "Serviciile e-factura au raportat o eroare. Am reîncercat cu succes.",
      "Am verificat salariul lui Ionescu — corect.",
      "TVA calculat pe cota de 9% pentru produsele alimentare; restul pe 19%.",
      "Lipsă bon fiscal OMV. Am cerut clientului să retrimită.",
      "Înregistrările sunt complete, dar un furnizor (Enel) a trimis factura pe valoarea incorectă — de discutat la validare.",
      "Am finalizat cu observația că există o discrepanță de 12 RON între total și sumele individuale. De verificat.",
      "Totul OK."
    ];
    var idx = 0;
    window.SCRIPTICA_MOCK.situations.forEach(function (s) {
      ['step1', 'step2', 'step3'].forEach(function (k) {
        var tasks = s.tasks && s.tasks[k];
        if (!tasks) return;
        var done = tasks.filter(function (t) {
          return t.completed && !(t.observation && t.observation.length);
        });
        if (!done.length) return;
        done[done.length - 1].observation = OBS_POOL[idx % OBS_POOL.length];
        idx++;
      });
    });

    /* Sprinkle senior-attention flags on a couple of specific completed tasks. */
    var seniorTargets = [
      { id: "0000000123", step: 'step2', taskId: 9  },
      { id: "0000000134", step: 'step2', taskId: 10 }
    ];
    seniorTargets.forEach(function (t) {
      var s = window.SCRIPTICA_MOCK.situations.find(function (x) { return x.id === t.id; });
      if (!s || !s.tasks || !s.tasks[t.step]) return;
      var task = s.tasks[t.step].find(function (tt) { return tt.id === t.taskId; });
      if (task) task.needsSeniorAttention = true;
    });
  })();

  /* Demo detail: flesh out a couple of step-1 tasks on the demo situation
     so the task-indicator icons (notes / senior-attention / attachment count)
     have something to render in Phase 4a screenshots. */
  (function decorateDemoTasks() {
    var demo = window.SCRIPTICA_MOCK.situations.find(function (s) { return s.id === '0000000126'; });
    if (!demo || !demo.tasks || !demo.tasks.step1) return;
    var t1 = demo.tasks.step1[0];
    if (t1) {
      t1.observation = 'Toate documentele primite. Confirmat cu clientul pe e-mail.';
      t1.assigneeId = 1;
    }
    var t2 = demo.tasks.step1[1];
    if (t2) {
      t2.needsSeniorAttention = true;
      t2.observation = 'Factura Orange are o sumă diferită față de celelalte luni — necesită verificare seniori.';
      t2.assigneeId = 1;
    }
    var t3 = demo.tasks.step1[2];
    if (t3) {
      t3.attachments = [
        { name: 'confirmare-receptie.pdf', size: 42131, type: 'application/pdf' }
      ];
      t3.assigneeId = 1;
    }
  })();

  /* ============================================================
     PHASE 4c — Time sessions
     In-memory only. Real persistence handled by timer.js via localStorage
     (for the ACTIVE timer only). Saved sessions live here and reset on reload.
     ============================================================ */
  window.SCRIPTICA_MOCK.timeSessions = [
    { id: 1,  userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [1,2],    taskLabels: ["Primire documente de la client","Verificare completitudine"], startedAt: "2026-04-01T09:00:00", endedAt: "2026-04-01T09:45:00", durationSeconds: 2700,  perTaskSeconds: 1350,  observation: "" },
    { id: 2,  userId: 1, situationId: "0000000127", clientCompany: "Ionuț Profan PFA", typeLabel: "Jurnal TVA Martie 2026",   taskIds: [1],       taskLabels: ["Primire documente de la client"], startedAt: "2026-04-01T13:30:00", endedAt: "2026-04-01T15:15:00", durationSeconds: 6300,  perTaskSeconds: 6300,  observation: "" },
    { id: 3,  userId: 1, situationId: "0000000129", clientCompany: "Canvas S.R.L.",    typeLabel: "Jurnal TVA Martie 2026",   taskIds: [4],       taskLabels: ["Verificare organizare dosar"], startedAt: "2026-04-03T10:00:00", endedAt: "2026-04-03T10:30:00", durationSeconds: 1800,  perTaskSeconds: 1800,  observation: "" },
    { id: 4,  userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [3],       taskLabels: ["Confirmare recepție"], startedAt: "2026-04-04T14:00:00", endedAt: "2026-04-04T15:45:00", durationSeconds: 6300,  perTaskSeconds: 6300,  observation: "" },
    { id: 5,  userId: 1, situationId: "0000000130", clientCompany: "Ionuț Profan PFA", typeLabel: "Raport Lunar Martie 2026", taskIds: [5],       taskLabels: ["E-Factura"], startedAt: "2026-04-07T09:15:00", endedAt: "2026-04-07T11:20:00", durationSeconds: 7500,  perTaskSeconds: 7500,  observation: "" },
    { id: 6,  userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [4],       taskLabels: ["Verificare organizare dosar"], startedAt: "2026-04-08T08:30:00", endedAt: "2026-04-08T09:00:00", durationSeconds: 1800,  perTaskSeconds: 1800,  observation: "Discuție cu clientul despre factura Orange." },
    { id: 7,  userId: 1, situationId: "0000000127", clientCompany: "Ionuț Profan PFA", typeLabel: "Jurnal TVA Martie 2026",   taskIds: [1,2],    taskLabels: ["Primire documente de la client","Verificare completitudine"], startedAt: "2026-04-08T15:00:00", endedAt: "2026-04-08T17:30:00", durationSeconds: 9000,  perTaskSeconds: 4500,  observation: "" },
    { id: 8,  userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [5],       taskLabels: ["E-Factura"], startedAt: "2026-04-10T10:00:00", endedAt: "2026-04-10T10:45:00", durationSeconds: 2700,  perTaskSeconds: 2700,  observation: "" },
    { id: 9,  userId: 1, situationId: "0000000129", clientCompany: "Canvas S.R.L.",    typeLabel: "Jurnal TVA Martie 2026",   taskIds: [5,6],    taskLabels: ["E-Factura","Înregistrare Documente"], startedAt: "2026-04-11T13:00:00", endedAt: "2026-04-11T15:45:00", durationSeconds: 9900,  perTaskSeconds: 4950,  observation: "" },
    { id: 10, userId: 1, situationId: "0000000130", clientCompany: "Ionuț Profan PFA", typeLabel: "Raport Lunar Martie 2026", taskIds: [11],      taskLabels: ["Verificare finală de contabil senior"], startedAt: "2026-04-13T09:00:00", endedAt: "2026-04-13T10:15:00", durationSeconds: 4500,  perTaskSeconds: 4500,  observation: "" },
    { id: 11, userId: 3, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [7],       taskLabels: ["Ștat Salarii"], startedAt: "2026-04-13T14:00:00", endedAt: "2026-04-13T14:20:00", durationSeconds: 1200,  perTaskSeconds: 1200,  observation: "" },
    { id: 12, userId: 1, situationId: "0000000127", clientCompany: "Ionuț Profan PFA", typeLabel: "Jurnal TVA Martie 2026",   taskIds: [6],       taskLabels: ["Înregistrare Documente"], startedAt: "2026-04-14T08:00:00", endedAt: "2026-04-14T11:30:00", durationSeconds: 12600, perTaskSeconds: 12600, observation: "" },
    { id: 13, userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [5,6],    taskLabels: ["E-Factura","Înregistrare Documente"], startedAt: "2026-04-15T09:12:00", endedAt: "2026-04-15T10:42:00", durationSeconds: 5400,  perTaskSeconds: 2700,  observation: "" },
    { id: 14, userId: 1, situationId: "0000000129", clientCompany: "Canvas S.R.L.",    typeLabel: "Jurnal TVA Martie 2026",   taskIds: [8],       taskLabels: ["Închidere Balanță"], startedAt: "2026-04-16T11:00:00", endedAt: "2026-04-16T11:30:00", durationSeconds: 1800,  perTaskSeconds: 1800,  observation: "" },
    { id: 15, userId: 1, situationId: "0000000130", clientCompany: "Ionuț Profan PFA", typeLabel: "Raport Lunar Martie 2026", taskIds: [12],      taskLabels: ["Închidere situație"], startedAt: "2026-04-16T16:00:00", endedAt: "2026-04-16T17:45:00", durationSeconds: 6300,  perTaskSeconds: 6300,  observation: "Verificare detaliată reguli TVA." },
    { id: 16, userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [5],       taskLabels: ["E-Factura"], startedAt: "2026-04-17T09:00:00", endedAt: "2026-04-17T09:10:00", durationSeconds: 600,   perTaskSeconds: 600,   observation: "" },
    { id: 17, userId: 1, situationId: "0000000130", clientCompany: "Ionuț Profan PFA", typeLabel: "Raport Lunar Martie 2026", taskIds: [11,12],  taskLabels: ["Verificare finală de contabil senior","Închidere situație"], startedAt: "2026-04-17T15:00:00", endedAt: "2026-04-17T15:30:00", durationSeconds: 1800, perTaskSeconds: 900,   observation: "" },
    { id: 18, userId: 1, situationId: "0000000127", clientCompany: "Ionuț Profan PFA", typeLabel: "Jurnal TVA Martie 2026",   taskIds: [8],       taskLabels: ["Închidere Balanță"], startedAt: "2026-04-18T08:45:00", endedAt: "2026-04-18T11:15:00", durationSeconds: 9000,  perTaskSeconds: 9000,  observation: "" },
    { id: 19, userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [6],       taskLabels: ["Înregistrare Documente"], startedAt: "2026-04-18T14:00:00", endedAt: "2026-04-18T14:05:00", durationSeconds: 300,   perTaskSeconds: 300,   observation: "" },
    { id: 20, userId: 1, situationId: "0000000129", clientCompany: "Canvas S.R.L.",    typeLabel: "Jurnal TVA Martie 2026",   taskIds: [9],       taskLabels: ["Salvare Rapoarte"], startedAt: "2026-04-19T10:00:00", endedAt: "2026-04-19T12:00:00", durationSeconds: 7200,  perTaskSeconds: 7200,  observation: "" },
    { id: 21, userId: 1, situationId: "0000000130", clientCompany: "Ionuț Profan PFA", typeLabel: "Raport Lunar Martie 2026", taskIds: [11],      taskLabels: ["Verificare finală de contabil senior"], startedAt: "2026-04-19T13:30:00", endedAt: "2026-04-19T15:00:00", durationSeconds: 5400,  perTaskSeconds: 5400,  observation: "" },
    { id: 22, userId: 1, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [5],       taskLabels: ["E-Factura"], startedAt: "2026-04-20T09:00:00", endedAt: "2026-04-20T09:45:00", durationSeconds: 2700,  perTaskSeconds: 2700,  observation: "" },
    { id: 23, userId: 2, situationId: "0000000126", clientCompany: "Canvas S.R.L.",    typeLabel: "Raport Lunar Martie 2026", taskIds: [5],       taskLabels: ["E-Factura"], startedAt: "2026-04-19T10:30:00", endedAt: "2026-04-19T11:15:00", durationSeconds: 2700,  perTaskSeconds: 2700,  observation: "" }
  ];

  /* Totals helper — scoped to a situation so shared task ids don't bleed across. */
  window.SCRIPTICA_MOCK.getTaskTotalSeconds = function (taskId, situationId) {
    return (this.timeSessions || [])
      .filter(function (s) {
        if (s.taskIds.indexOf(taskId) === -1) return false;
        if (situationId && s.situationId !== situationId) return false;
        return true;
      })
      .reduce(function (sum, s) { return sum + (s.perTaskSeconds || 0); }, 0);
  };

  /* ============================================================
     PHASE 5 — Archival documents
     ~36 docs spread across 5 clients and 6+ months (Nov 2025 → Mar 2026).
     Adds source: "generat" and broadCategory: "documentatie-contabila".
     ============================================================ */
  (function seedArchivalDocuments() {
    var RO_MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];
    function pad(n) { return String(n).padStart(2, '0'); }
    function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

    var TEMPLATES = {
      intrare: [
        { tip: "Factură furnizor", slug: "factura_orange",  emitent: "Orange România S.A.",  source: "email" },
        { tip: "Factură furnizor", slug: "factura_enel",    emitent: "Enel Energie S.A.",    source: "email" },
        { tip: "Factură furnizor", slug: "factura_digi",    emitent: "Digi Communications", source: "whatsapp" },
        { tip: "Bon fiscal",       slug: "bon_omv",         emitent: "OMV Petrom",           source: "upload", subFilter: "bonuri" },
        { tip: "NIR",              slug: "NIR_receptie",    emitent: "Canvas S.R.L.",        source: "email" }
      ],
      iesire: [
        { tip: "Factură emisă", slug: "factura_emisa_partener", emitent: null, source: "email" }
      ],
      salarizare: [
        { tip: "Document HR", slug: "stat_salarii_hr", emitent: null, source: "upload" }
      ],
      necategorisit: [
        { tip: "Aviz / Proces verbal", slug: "aviz_dhl",      emitent: "DHL Express", source: "whatsapp" },
        { tip: "Registru de casă",     slug: "registru_casa", emitent: null,          source: "email" }
      ],
      'documentatie-contabila': [
        { tip: "Balanță de verificare", slug: "balanta_verificare",   source: "generat" },
        { tip: "Jurnal TVA",            slug: "jurnal_tva",           source: "generat" },
        { tip: "Declarație D100",       slug: "declaratia_d100",      source: "generat" },
        { tip: "Declarație D394",       slug: "declaratia_d394",      source: "generat" },
        { tip: "Ștat salarii",          slug: "stat_salarii_final",   source: "generat" },
        { tip: "Fluturași salariale",   slug: "fluturasi",            source: "generat" },
        { tip: "Registru jurnal",       slug: "registru_jurnal",      source: "generat" }
      ]
    };

    var PLAN = [
      { sitId: "0000000140", year: 2026, month: 2,  counts: { intrare: 3, iesire: 1, salarizare: 1, necategorisit: 1, 'documentatie-contabila': 4 } },
      { sitId: "0000000141", year: 2026, month: 1,  counts: { intrare: 2, iesire: 1,                necategorisit: 1, 'documentatie-contabila': 3 } },
      { sitId: "0000000142", year: 2025, month: 12, counts: { intrare: 2,                                              'documentatie-contabila': 3 } },
      { sitId: "0000000143", year: 2025, month: 11, counts: { intrare: 2, iesire: 1,                                   'documentatie-contabila': 3 } },
      { sitId: "0000000160", year: 2026, month: 2,  counts: { intrare: 2,                                              'documentatie-contabila': 3 } },
      { sitId: "0000000161", year: 2026, month: 1,  counts: { intrare: 1,                                              'documentatie-contabila': 3 } },
      { sitId: "0000000190", year: 2026, month: 2,  counts: { intrare: 2,             salarizare: 1,                   'documentatie-contabila': 3 } },
      { sitId: "0000000170", year: 2026, month: 2,  counts: { intrare: 2,                                              'documentatie-contabila': 3 } },
      { sitId: "0000000150", year: 2026, month: 3,  counts: { intrare: 2, iesire: 1,                                   'documentatie-contabila': 3 } },
      { sitId: "0000000151", year: 2026, month: 2,  counts: { intrare: 2, iesire: 1,                                   'documentatie-contabila': 3 } },
      { sitId: "0000000152", year: 2025, month: 12, counts: { intrare: 1,                                              'documentatie-contabila': 3 } },
      { sitId: "0000000153", year: 2025, month: 11, counts: { intrare: 2,                                              'documentatie-contabila': 3 } },
      { sitId: "0000000180", year: 2026, month: 3,  counts: { intrare: 2, iesire: 1,                                   'documentatie-contabila': 3 } },
      /* Seed docs onto the pre-existing closed situations so their detail
         pages and their tree nodes in Arhivă aren't empty. */
      { sitId: "0000000121", year: 2026, month: 2,  counts: { intrare: 2, iesire: 1, salarizare: 1,                    'documentatie-contabila': 3 } },
      { sitId: "0000000133", year: 2026, month: 1,  counts: { intrare: 2, iesire: 1,                                   'documentatie-contabila': 3 } },
      { sitId: "0000000134", year: 2026, month: 2,  counts: {             iesire: 1, salarizare: 1,                    'documentatie-contabila': 3 } }
    ];

    var docSeq = 1000;

    PLAN.forEach(function (entry) {
      var sit = window.SCRIPTICA_MOCK.situations.find(function (s) { return s.id === entry.sitId; });
      if (!sit) return;
      var monthSlug = RO_MONTHS[entry.month - 1].toLowerCase();

      Object.keys(entry.counts).forEach(function (cat) {
        var n = entry.counts[cat];
        var tpls = TEMPLATES[cat] || [];
        for (var i = 0; i < n; i++) {
          var t = tpls[i % tpls.length];
          if (!t) continue;
          var dayBase = (cat === 'documentatie-contabila') ? 25 : 4;
          var day = Math.min(28, dayBase + i * 2);
          var dateIso = iso(entry.year, entry.month, day);
          var hour = 8 + i;
          if (hour > 18) hour = 18;
          var uploadedAt = dateIso + 'T' + pad(hour) + ':' + pad((i * 7) % 60) + ':00';
          var isGen = (t.source === 'generat');
          var emitent = isGen ? sit.clientCompany : (t.emitent || sit.clientCompany);
          var confE = isGen ? 100 : 88 + ((i + entry.month) % 11);
          var confC = isGen ? 100 : 90 + ((i * 3) % 9);
          if (confE > 99) confE = 99;
          if (confC > 99) confC = 99;

          window.SCRIPTICA_MOCK.documents.push({
            id: 'doc_arh_' + (++docSeq),
            situationId: entry.sitId,
            filename: t.slug + '_' + monthSlug + '_' + entry.year + (isGen ? '.pdf' : '.pdf'),
            uploadedAt: uploadedAt,
            source: t.source,
            pagesCount: 1,
            multiDoc: false,
            multiDocConfidence: null,
            tipDocument: t.tip,
            emitent: emitent,
            produsDe: isGen ? sit.titularName : null,
            numarDocument: null,
            dataEmiterii: dateIso,
            perioadaFiscala: entry.year + '-' + pad(entry.month),
            valoareFaraTVA: null,
            tvaProcent: null,
            tvaValoare: null,
            valoareTotala: null,
            moneda: 'RON',
            categoriePropusa: t.tip,
            broadCategory: cat,
            subFilter: t.subFilter || null,
            confidenceExtraction: confE,
            confidenceCategorization: confC,
            observatieAI: isGen
              ? ('Generat pentru ' + sit.clientCompany + ' — perioada ' + RO_MONTHS[entry.month - 1] + ' ' + entry.year + '.')
              : (emitent + ' — perioada ' + RO_MONTHS[entry.month - 1] + ' ' + entry.year + '.'),
            verificat: true,
            verificatManual: false,
            pageThumbnails: []
          });
        }
      });
    });
  })();

  /* Assign a previewTemplate to every mock document based on tipDocument. */
  (function () {
    var TEMPLATE_BY_TIP = {
      'Factură furnizor':       'factura',
      'Factură emisă':          'factura',
      'Bon fiscal':             'bon',
      'NIR':                    'nir',
      'Balanță de verificare':  'balanta',
      'Jurnal TVA':             'jurnal',
      'Registru de casă':       'jurnal',
      'Registru jurnal':        'jurnal',
      'Registru imobilizări':   'jurnal',
      'Stat salarii':           'stat-salarii',
      'Ștat salarii':           'stat-salarii',
      'Fluturași':              'stat-salarii',
      'Fluturași salariale':    'stat-salarii',
      'Document HR':            'stat-salarii',
      'Declarație D100':        'declaratie',
      'Declarație D394':        'declaratie',
      'Declarație D112':        'declaratie',
      'E-mail de transmitere':  'email'
    };
    (window.SCRIPTICA_MOCK.documents || []).forEach(function (d) {
      if (d.previewTemplate) return;
      d.previewTemplate = TEMPLATE_BY_TIP[d.tipDocument] || 'default';
    });
  })();

  /* Per-user breakdown for a task — returns [{userId, seconds}, ...] sorted desc. */
  window.SCRIPTICA_MOCK.getTaskTimeByUser = function (taskId, situationId) {
    var byUser = {};
    (this.timeSessions || []).forEach(function (s) {
      if (s.taskIds.indexOf(taskId) === -1) return;
      if (situationId && s.situationId !== situationId) return;
      byUser[s.userId] = (byUser[s.userId] || 0) + (s.perTaskSeconds || 0);
    });
    return Object.keys(byUser)
      .map(function (uid) { return { userId: parseInt(uid, 10), seconds: byUser[uid] }; })
      .sort(function (a, b) { return b.seconds - a.seconds; });
  };
})();
