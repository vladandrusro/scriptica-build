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

  /* Phase 9 — firm administrator (admin view persona) */
  admins: [
    { id: 100, name: "Victor Stanciu", fullName: "Victor Stanciu", role: "Administrator", avatarId: 59,
      email: "victor.stanciu@scriptica.ro", username: "victor.stanciu", status: "activ" }
  ],

  employees: [
    { id: 1, name: "Anca Cobzaru",       role: "Contabil",          avatarId: 47, email: "anca.cobzaru@scriptica.ro",     username: "anca.cobzaru",     status: "activ" },
    { id: 2, name: "Cristina Popescu",   role: "Contabil senior",   avatarId: 32, email: "cristina.popescu@scriptica.ro", username: "cristina.popescu", status: "activ" },
    { id: 3, name: "Cosmin Zicemult",    role: "Contabil",          avatarId: 12, email: "cosmin.zicemult@scriptica.ro",  username: "cosmin.zicemult",  status: "activ" },
    { id: 4, name: "Andrei Juvanesco",   role: "Contabil",          avatarId: 60, email: "andrei.juvanesco@scriptica.ro", username: "andrei.juvanesco", status: "activ" },
    { id: 5, name: "Anca Revinovici",    role: "Salarizare",        avatarId: 25, email: "anca.revinovici@scriptica.ro",  username: "anca.revinovici",  status: "activ" },
    { id: 6, name: "Pavel Romanovici",   role: "Consultant fiscal", avatarId: 15, email: "pavel.romanovici@scriptica.ro", username: "pavel.romanovici", status: "inactiv" }
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

  /* Phase 10 — situation types carry their full per-step definition:
     step name, deadline offset (days from start), tasks (free text, defined
     in the admin editor) and attached anexe (ids from anexeTypes, picked
     in the admin editor). Minimum one step per type. */
  situationTypes: [
    {
      id: "raport_lunar", name: "Raport Lunar", frequency: "lunar", status: "activ",
      description: "Raport contabil lunar complet: înregistrare documente, închidere balanță și rapoarte.",
      offsets: { step1: 10, step2: 20, step3: 30 },
      steps: [
        { name: "Recepție documente",    offsetDays: 10,
          tasks: ["Primire documente de la client", "Verificare completitudine", "Confirmare recepție"],
          anexeIds: ["anx_2"] },
        { name: "Verificare documente",  offsetDays: 20,
          tasks: ["Verificare organizare dosar", "E-Factura", "Înregistrare Documente", "Ștat Salarii", "Închidere Balanță", "Salvare Rapoarte", "Declarație OP-uri"],
          anexeIds: ["anx_4", "anx_5"] },
        { name: "Validare și închidere", offsetDays: 30,
          tasks: ["Verificare finală de contabil senior", "Închidere situație"],
          anexeIds: ["anx_3"] }
      ]
    },
    {
      id: "jurnal_tva", name: "Jurnal TVA", frequency: "lunar", status: "activ",
      description: "Jurnal de TVA cu verificarea corelațiilor D300 ↔ D394.",
      offsets: { step1: 7, step2: 14, step3: 25 },
      steps: [
        { name: "Recepție documente",    offsetDays: 7,
          tasks: ["Primire documente de la client", "Verificare completitudine", "Confirmare recepție"],
          anexeIds: [] },
        { name: "Verificare documente",  offsetDays: 14,
          tasks: ["Verificare organizare dosar", "E-Factura", "Înregistrare Documente", "Ștat Salarii", "Închidere Balanță", "Salvare Rapoarte", "Declarație OP-uri"],
          anexeIds: ["anx_1"] },
        { name: "Validare și închidere", offsetDays: 25,
          tasks: ["Verificare finală de contabil senior", "Închidere situație"],
          anexeIds: [] }
      ]
    },
    {
      id: "salarizari", name: "Salarizări", frequency: "lunar", status: "activ",
      description: "Calcul salarii, ștat de plată și declarația D112.",
      offsets: { step1: 5, step2: 10, step3: 15 },
      steps: [
        { name: "Recepție documente",    offsetDays: 5,
          tasks: ["Primire documente de la client", "Verificare completitudine", "Confirmare recepție"],
          anexeIds: [] },
        { name: "Verificare documente",  offsetDays: 10,
          tasks: ["Verificare organizare dosar", "E-Factura", "Înregistrare Documente", "Ștat Salarii", "Închidere Balanță", "Salvare Rapoarte", "Declarație OP-uri"],
          anexeIds: [] },
        { name: "Validare și închidere", offsetDays: 15,
          tasks: ["Verificare finală de contabil senior", "Închidere situație"],
          anexeIds: [] }
      ]
    },
    {
      id: "declaratii_trim", name: "Declarații Trimestriale", frequency: "trimestrial", status: "activ",
      description: "Declarații fiscale trimestriale (D100, D101).",
      offsets: { step1: 30, step2: 60, step3: 85 },
      steps: [
        { name: "Recepție documente",    offsetDays: 30,
          tasks: ["Primire documente de la client", "Verificare completitudine", "Confirmare recepție"],
          anexeIds: [] },
        { name: "Verificare documente",  offsetDays: 60,
          tasks: ["Verificare organizare dosar", "E-Factura", "Înregistrare Documente", "Ștat Salarii", "Închidere Balanță", "Salvare Rapoarte", "Declarație OP-uri"],
          anexeIds: [] },
        { name: "Validare și închidere", offsetDays: 85,
          tasks: ["Verificare finală de contabil senior", "Închidere situație"],
          anexeIds: [] }
      ]
    },
    /* Tip de misiune de audit (domain: 'audit'). Tipurile contabile de mai sus
       nu au `domain` — absența este tratată ca 'contabil' (zero migrare). */
    {
      id: "misiune_audit_regularitate", name: "Misiune de audit de regularitate",
      domain: "audit", frequency: "anual", status: "activ",
      description: "Misiune de audit public intern de regularitate, structurată pe etapele legale ale misiunii.",
      // Termene orientative — adminul le ajustează per firmă.
      // mapare orientativă pe etape
      steps: [
        { name: "Pregătirea misiunii", offsetDays: 15,
          tasks: [],
          anexeIds: ["anx_audit_ordin_serviciu", "anx_audit_declaratie_independenta", "anx_audit_notificare", "anx_audit_minuta_deschidere", "anx_audit_chestionar_cunostinta", "anx_audit_studiu_preliminar", "anx_audit_punctaj_riscuri", "anx_audit_program_misiune"] },
        { name: "Intervenția la fața locului", offsetDays: 45,
          tasks: [],
          anexeIds: ["anx_audit_chestionar_ci", "anx_audit_evaluare_ci", "anx_audit_lista_verificare", "anx_audit_test", "anx_obiective_audit", "anx_audit_fiap", "anx_audit_fcri"] },
        { name: "Raportarea rezultatelor", offsetDays: 90,
          tasks: [],
          anexeIds: [] },
        { name: "Urmărirea recomandărilor", offsetDays: 180,
          tasks: [],
          anexeIds: ["anx_audit_urmarire_recomandari"] }
      ]
    },
    /* Tip demonstrativ pentru formulele automate (lanțul de risc Anexa 9).
       `formulas` trăiește pe tip → se aplică tuturor misiunilor de acest tip.
       Referințe prin {anexaId}.{ref} către anexele atașate pașilor. */
    {
      id: "misiune_audit_risc", name: "Evaluarea riscurilor (Anexa 9)",
      domain: "audit", frequency: "anual", status: "activ",
      description: "Misiune demonstrativă a calculului automat: punctajul riscului se derivă din criteriile de risc (Probabilitate × Impact × Pondere).",
      steps: [
        { name: "Evaluarea riscurilor", offsetDays: 20, tasks: [],
          anexeIds: ["anx_criterii_risc", "anx_punctaj_risc"] },
        { name: "Ierarhizare și raport", offsetDays: 40, tasks: [], anexeIds: [] }
      ],
      formulas: [
        { resultRef: "anx_punctaj_risc.PUNCTAJ",
          expr: "anx_criterii_risc.PROB * anx_criterii_risc.IMP * anx_criterii_risc.PONDERE",
          resultType: "decimal",
          allowManualOverride: true }
      ]
    }
  ],

  /* Entități auditate (parte externă a misiunilor de audit) — analog clienților
     pentru contabilitate. Folosite de combobox-ul „Entitate auditată". */
  auditEntities: [
    { id: 1, name: "Primăria Sectorului 1", contactName: "Direcția Economică" },
    { id: 2, name: "Spitalul Clinic Județean Cluj", contactName: "Direcția Financiar-Contabilă" },
    { id: 3, name: "Consiliul Județean Ilfov", contactName: "Compartiment Buget" },
    { id: 4, name: "Regia Autonomă de Transport", contactName: "Serviciul Audit Intern" }
  ],

  /* Autoritate decidentă — utilizator INTERN de senioritate maximă care vede
     tot (inclusiv rapoartele) și avizează misiunile de audit. */
  auditAuthorities: [
    { id: 901, name: "Mihai Constantinescu", role: "Autoritate decidentă", seniority: "Senioritate maximă", avatarId: 68 }
  ],

  /* Misiuni de audit (domain:'audit'). Stocate separat de `situations`
     (contabile) ca să nu treacă prin pipeline-ul de îmbogățire contabil și
     să garanteze zero regresie pe Situații Contabile. Instanțe ale tipului
     'misiune_audit_regularitate'. Termene = start + offset-urile pașilor. */
  auditMissions: [
    {
      id: "audit_0001", domain: "audit",
      name: "Audit de regularitate — achiziții publice 2025",
      entityId: 1, entityName: "Primăria Sectorului 1",
      typeId: "misiune_audit_regularitate", typeName: "Misiune de audit de regularitate",
      startDate: "2026-03-20",
      deadlineStep1: "2026-04-04", deadlineStep2: "2026-05-04", deadlineStep3: "2026-06-18", deadlineStep4: "2026-09-16",
      currentStep: 2, totalSteps: 4, stepsCompleted: 1,
      status: "in_verificare",
      responsibleIds: [2, 1, 3],
      perioadaAuditata: { from: "2025-01-01", to: "2025-12-31" },
      planAnualId: "pa_2026"
    },
    {
      id: "audit_0002", domain: "audit",
      name: "Audit de regularitate — execuție bugetară 2024",
      entityId: 2, entityName: "Spitalul Clinic Județean Cluj",
      typeId: "misiune_audit_regularitate", typeName: "Misiune de audit de regularitate",
      startDate: "2026-01-10",
      deadlineStep1: "2026-01-25", deadlineStep2: "2026-02-24", deadlineStep3: "2026-04-10", deadlineStep4: "2026-07-09",
      currentStep: 3, totalSteps: 4, stepsCompleted: 3,
      status: "spre_aprobare",
      responsibleIds: [2, 4],
      perioadaAuditata: { from: "2024-01-01", to: "2024-12-31" }
    },
    {
      id: "audit_0003", domain: "audit",
      name: "Audit de regularitate — fonduri europene 2025",
      entityId: 3, entityName: "Consiliul Județean Ilfov",
      typeId: "misiune_audit_regularitate", typeName: "Misiune de audit de regularitate",
      startDate: "2026-04-05",
      deadlineStep1: "2026-04-20", deadlineStep2: "2026-05-20", deadlineStep3: "2026-07-04", deadlineStep4: "2026-10-02",
      currentStep: 1, totalSteps: 4, stepsCompleted: 0,
      status: "analiza",
      responsibleIds: [1, 5, 2, 3],
      perioadaAuditata: { from: "2025-01-01", to: "2025-12-31" }
    },
    {
      id: "audit_0004", domain: "audit",
      name: "Audit de regularitate — salarizare 2024",
      entityId: 1, entityName: "Primăria Sectorului 1",
      typeId: "misiune_audit_regularitate", typeName: "Misiune de audit de regularitate",
      startDate: "2026-02-01",
      deadlineStep1: "2026-02-16", deadlineStep2: "2026-03-18", deadlineStep3: "2026-05-02", deadlineStep4: "2026-07-31",
      currentStep: 3, totalSteps: 4, stepsCompleted: 3,
      status: "spre_aprobare",
      responsibleIds: [2, 1],
      perioadaAuditata: { from: "2024-01-01", to: "2024-12-31" },
      planAnualId: "pa_2026"
    },
    {
      id: "audit_0005", domain: "audit",
      name: "Audit de regularitate — investiții 2023",
      entityId: 1, entityName: "Primăria Sectorului 1",
      typeId: "misiune_audit_regularitate", typeName: "Misiune de audit de regularitate",
      startDate: "2025-09-01",
      deadlineStep1: "2025-09-16", deadlineStep2: "2025-10-16", deadlineStep3: "2025-11-30", deadlineStep4: "2026-02-28",
      currentStep: 4, totalSteps: 4, stepsCompleted: 4,
      status: "aprobata",
      responsibleIds: [2, 1, 3],
      perioadaAuditata: { from: "2023-01-01", to: "2023-12-31" }
    },
    {
      id: "audit_0006", domain: "audit",
      name: "Audit de regularitate — achiziții publice 2023",
      entityId: 1, entityName: "Primăria Sectorului 1",
      typeId: "misiune_audit_regularitate", typeName: "Misiune de audit de regularitate",
      startDate: "2025-06-01",
      deadlineStep1: "2025-06-16", deadlineStep2: "2025-07-16", deadlineStep3: "2025-08-30", deadlineStep4: "2025-11-28",
      currentStep: 4, totalSteps: 4, stepsCompleted: 4,
      status: "aprobata",
      responsibleIds: [4, 1],
      perioadaAuditata: { from: "2023-01-01", to: "2023-12-31" }
    },
    {
      id: "audit_risc_demo", domain: "audit",
      name: "Evaluarea riscurilor — analiză preliminară 2025",
      entityId: 1, entityName: "Primăria Sectorului 1",
      typeId: "misiune_audit_risc", typeName: "Evaluarea riscurilor (Anexa 9)",
      startDate: "2026-04-01",
      deadlineStep1: "2026-04-21", deadlineStep2: "2026-05-11",
      currentStep: 1, totalSteps: 2, stepsCompleted: 0,
      status: "in_verificare",
      responsibleIds: [2, 1],
      perioadaAuditata: { from: "2025-01-01", to: "2025-12-31" }
    }
  ],

  /* Planificarea auditului (Brief #7). Planul multianual așază misiunile
     orientativ pe ~3-5 ani; planul anual derivă din el și, la demarare,
     fiecare intrare devine o misiune reală (auditMissions). */
  auditPlansMultiannual: [
    {
      id: "pma_2026_2029", name: "Plan multianual de audit public intern 2026–2029",
      fromYear: 2026, toYear: 2029, status: "aprobat",
      // Misiuni orientative — denumiri în linii mari, se rafinează în planul anual.
      missions: [
        "Audit de regularitate — achiziții publice",
        "Audit de regularitate — salarizare și resurse umane",
        "Audit de performanță — investiții publice",
        "Audit de sistem — securitatea sistemelor informatice",
        "Audit de regularitate — fonduri europene",
        "Audit de regularitate — patrimoniu și inventariere"
      ]
    }
  ],
  auditPlansAnnual: [
    {
      id: "pa_2026", multiannualId: "pma_2026_2029", year: 2026, status: "aprobat",
      entries: [
        { id: "pae_1", name: "Audit de regularitate — achiziții publice 2025", entityId: 1, perioadaAuditata: { from: "2025-01-01", to: "2025-12-31" }, responsibleIds: [2, 1, 3], riskNote: "Risc ridicat — volum mare de achiziții directe, procedură neactualizată.", missionId: "audit_0001" },
        { id: "pae_2", name: "Audit de regularitate — salarizare 2024", entityId: 1, perioadaAuditata: { from: "2024-01-01", to: "2024-12-31" }, responsibleIds: [2, 1], riskNote: "Risc mediu — modificări legislative salariale frecvente.", missionId: "audit_0004" },
        { id: "pae_3", name: "Audit de performanță — investiții publice", entityId: 1, perioadaAuditata: { from: "2024-01-01", to: "2025-12-31" }, responsibleIds: [3], riskNote: "Risc ridicat — proiecte de infrastructură cu întârzieri repetate.", missionId: null },
        { id: "pae_4", name: "Audit de sistem — securitatea sistemelor IT", entityId: 1, perioadaAuditata: { from: "2026-01-01", to: "2026-12-31" }, responsibleIds: [2], riskNote: "Risc mediu — sisteme critice neauditate în ultimii 3 ani.", missionId: null }
      ]
    }
  ],

  // Plan anual aprobat până la 20 dec. anul precedent; referat de justificare per misiune; planuri păstrate 10 ani. Fază ulterioară.

  /* Rapoarte finale de audit (Brief #8) — pentru misiunile finalizate.
     // Scor/criticitate: mock din seed. Calcul real = LLM local, faza ulterioara, tier platit. */
  auditReports: {
    "audit_0005": {
      score: 20, level: "Nivel Sever",
      domain: "Fiabilitatea sistemului financiar contabil",
      auditor: "Ionuț Zicemult", finalizat: "2026-04-21", perioada: "12.05.2021 – 12.06.2022",
      objectives: [
        { title: "Analiza modului de organizare a activității financiar-contabile", crit: "hi", criticality: "Critic",
          constatareTitle: "Atribuții nerealizate la fișa de post",
          constatareText: "La fișa de post pentru șef serviciu au fost identificate atribuții care în realitate nu sunt realizate de către ocupantul acestui post, ci sunt incluse în atribuțiile Directorului Economic.",
          recomandareTitle: "Actualizarea fișelor de post",
          recomandareText: "Recomandăm actualizarea fișelor de post și adaptarea acestora la obiectivele specifice ale Serviciului Contabilitate.",
          action: "part", actionText: "Actualizarea fișelor de post. Responsabil: Direcția Resurse Umane. Termen: 30.06.2026." },
        { title: "Realizarea activităților financiar-contabile conform reglementărilor", crit: "mid", criticality: "Mediu",
          constatareTitle: "Flux de facturi neconform",
          constatareText: "Facturile înregistrate la Registratură sunt preluate de Serviciul Financiar fără a fi transmise la timp Serviciului Contabilitate.",
          recomandareTitle: "Transmiterea facturilor la Contabilitate",
          recomandareText: "Facturile trebuie transmise Serviciului Contabilitate și introduse în SIMEC conform O.M.F.P. nr. 1792/2002.",
          action: "ok", actionText: "Procedură actualizată. Responsabil: Direcția Economică. Termen: 31.08.2026 — implementat." },
        { title: "Evaluarea subsistemului de control intern managerial", crit: "hi", criticality: "Ridicat",
          constatareTitle: "Riscuri neidentificate",
          constatareText: "În cadrul Serviciului Financiar nu au fost identificate riscurile asociate activităților specifice desfășurate.",
          recomandareTitle: "Registru de riscuri",
          recomandareText: "La nivelul fiecărei structuri se vor stabili obiectivele și riscurile asociate, centralizate la nivelul Grupului de lucru SCIM.",
          action: "no", actionText: "Registrul de riscuri — neînceput. Responsabil: SCIM. Termen: 31.12.2026." },
        { title: "Respectarea termenelor de raportare financiară", crit: "mid", criticality: "Mediu",
          constatareTitle: "Întârzieri ocazionale",
          constatareText: "Au fost identificate 2 cazuri de raportare cu întârziere peste termenul legal.",
          recomandareTitle: "Calendar de raportare",
          recomandareText: "Implementarea unui calendar automatizat de raportare cu alerte.",
          action: "ok", actionText: "Calendar activ din iulie 2026. Responsabil: Direcția Economică — implementat." }
      ]
    },
    "audit_0006": {
      score: 5, level: "Nivel Scăzut",
      domain: "Analiza modului de efectuare a achizițiilor directe",
      auditor: "Andrei Juvanesco", finalizat: "2026-03-18", perioada: "Anul 2023",
      objectives: [
        { title: "Organizarea și reglementarea achizițiilor directe", crit: "lo", criticality: "Scăzut",
          constatareTitle: "Procedură conformă",
          constatareText: "Procedura operațională pentru achiziții directe este actualizată și aplicată corespunzător.",
          recomandareTitle: "Menținere bune practici",
          recomandareText: "Se recomandă menținerea registrului centralizat și revizuirea anuală.",
          action: "ok", actionText: "Revizuire anuală programată — implementat." },
        { title: "Respectarea pragurilor valorice", crit: "lo", criticality: "Scăzut",
          constatareTitle: "Praguri respectate",
          constatareText: "Toate achizițiile directe verificate s-au încadrat în pragurile valorice legale.",
          recomandareTitle: "Monitorizare continuă",
          recomandareText: "Monitorizarea automată a pragurilor la inițierea achiziției.",
          action: "ok", actionText: "Sistem de avertizare activ — implementat." },
        { title: "Documentarea notelor justificative", crit: "mid", criticality: "Mediu",
          constatareTitle: "Note justificative incomplete",
          constatareText: "Pentru 2 achiziții nu a fost documentată nota justificativă de estimare a valorii.",
          recomandareTitle: "Template notă justificativă",
          recomandareText: "Introducerea unui template obligatoriu pentru nota justificativă.",
          action: "part", actionText: "Template creat; instruire în curs. Termen: 31.10.2026." }
      ]
    }
  },

  /* ============================================================
     Super Admin (zona Scriptica) — Brief Super Admin.
     Scriptica HQ vede toate conturile de business; gestionează
     comercial (tier/contract) + tehnic (infrastructură).
     Date mock din seed; sursa reală = monitorizare infra/billing,
     fază ulterioară.
     ------------------------------------------------------------
     Downtime defalcat pe 3 cauze — fiecare incident are `cauza`:
       'server'   = platforma întreagă jos (cel mai grav)        → critical
       'ai_vm'    = doar funcțiile A.I. jos (severitate medie)   → pending
       'ai_limit' = plafon de calcul A.I. atins → throttling.
                    NU e defecțiune, e semnal comercial de upsell → important
     `day` = indexul zilei în fereastra de 30 de zile (0 = acum 30 zile, 29 = azi).
     // downtime: mock din seed; sursa reala = monitorizare infra, faza ulterioara.
     ============================================================ */
  superAdmin: {
    hq: { id: 9001, name: "Scriptica HQ", role: "Super Admin" },

    kpis: {
      clientiActivi: 34, clientiDelta: "+3",
      contractePremium: 19, conturiTotal: 34,
      procesariAI: "12.4k", procesariDelta: "+18%",
      pePauza: 2
    },

    /* Încărcare VM globală (LLM local) — media pe ultimele 12 ore, % per interval. */
    vmLoadGlobal: [40, 55, 48, 70, 92, 64, 50, 58, 44, 38, 52, 46],
    vmPeakIdxGlobal: 4,
    vmHours: ["08", "10", "12", "14", "16", "18"],

    uptime30Global: 99.94,

    clients: [
      {
        id: "cli_contzilla", name: "Contzilla S.R.L.", domain: "Contabilitate", clientTypeId: "ct_contabilitate",
        instance: "contzilla.scriptica.ro", users: 12, enrolled: "14.01.2026",
        tier: "plus", contract: "activ", aiLoad: 62,
        commercial: { plan: "Plus", renew: "14.01.2027", billing: "Anual · 4.800 RON", lastPay: "14.01.2026" },
        flags: [
          { name: "Sortare automată A.I.", tier: "Plus", on: true },
          { name: "Mesaje smart", tier: "Plus", on: true },
          { name: "Constructor de Anexe", tier: "Standard", on: true },
          { name: "Vertical Audit", tier: "Enterprise", on: false },
          { name: "Backup local", tier: "Plus · add-on", on: false }
        ],
        technical: {
          vmLoad: [50, 64, 58, 88, 72, 60, 54, 48], vmPeakIdx: 3,
          aiPerMonth: "1.240", docsStored: "8.6k", uptime30: 99.97, lastIncident: "acum 11 zile"
        },
        downtime: { incidents: [
          { cauza: "server", minutes: 4, day: 16 },
          { cauza: "ai_vm", minutes: 11, day: 23 },
          { cauza: "ai_limit", minutes: 138, day: 27 }
        ] }
      },
      {
        id: "cli_auditexpert", name: "Audit Expert Group", domain: "Audit", clientTypeId: "ct_audit",
        instance: "auditexpert.scriptica.ro", users: 8, enrolled: "03.11.2025",
        tier: "ent", contract: "activ", aiLoad: 84,
        commercial: { plan: "Enterprise", renew: "03.11.2026", billing: "Anual · 12.000 RON", lastPay: "03.11.2025" },
        flags: [
          { name: "Sortare automată A.I.", tier: "Plus", on: true },
          { name: "Mesaje smart", tier: "Plus", on: true },
          { name: "Constructor de Anexe", tier: "Standard", on: true },
          { name: "Vertical Audit", tier: "Enterprise", on: true },
          { name: "Backup local", tier: "Plus · add-on", on: true }
        ],
        technical: {
          vmLoad: [62, 70, 66, 90, 80, 72, 68, 60], vmPeakIdx: 3,
          aiPerMonth: "3.120", docsStored: "21k", uptime30: 99.99, lastIncident: "acum 3 zile"
        },
        downtime: { incidents: [
          { cauza: "ai_vm", minutes: 6, day: 12 },
          { cauza: "ai_limit", minutes: 22, day: 20 }
        ] }
      },
      {
        id: "cli_finpartners", name: "FinPartners", domain: "Contabilitate", clientTypeId: "ct_contabilitate",
        instance: "finpartners.scriptica.ro", users: 4, enrolled: "22.02.2026",
        tier: "baza", contract: "pauza", aiLoad: 20,
        commercial: { plan: "Bază", renew: "—", billing: "Lunar · 390 RON", lastPay: "restanță (mai 2026)" },
        flags: [
          { name: "Sortare automată A.I.", tier: "Plus", on: false },
          { name: "Mesaje smart", tier: "Plus", on: false },
          { name: "Constructor de Anexe", tier: "Standard", on: true },
          { name: "Vertical Audit", tier: "Enterprise", on: false },
          { name: "Backup local", tier: "Plus · add-on", on: false }
        ],
        technical: {
          vmLoad: [18, 24, 20, 40, 30, 22, 16, 14], vmPeakIdx: 3,
          aiPerMonth: "210", docsStored: "1.2k", uptime30: 99.90, lastIncident: "acum 2 zile"
        },
        downtime: { incidents: [
          { cauza: "server", minutes: 12, day: 8 },
          { cauza: "ai_vm", minutes: 3, day: 14 },
          { cauza: "ai_limit", minutes: 44, day: 25 }
        ] }
      },
      {
        id: "cli_contaprim", name: "ContaPrim", domain: "Contabilitate", clientTypeId: "ct_contabilitate",
        instance: "contaprim.scriptica.ro", users: 6, enrolled: "09.2025",
        tier: "baza", contract: "anulat", aiLoad: 8,
        commercial: { plan: "Bază", renew: "—", billing: "—", lastPay: "—" },
        flags: [
          { name: "Sortare automată A.I.", tier: "Plus", on: false },
          { name: "Mesaje smart", tier: "Plus", on: false },
          { name: "Constructor de Anexe", tier: "Standard", on: false },
          { name: "Vertical Audit", tier: "Enterprise", on: false },
          { name: "Backup local", tier: "Plus · add-on", on: false }
        ],
        technical: {
          vmLoad: [6, 8, 5, 12, 9, 7, 4, 3], vmPeakIdx: 3,
          aiPerMonth: "0", docsStored: "640", uptime30: 99.50, lastIncident: "—"
        },
        downtime: { incidents: [] }
      },
      {
        id: "cli_taxwise", name: "TaxWise Consulting", domain: "Consultanță fiscală", clientTypeId: "ct_consultanta",
        instance: "taxwise.scriptica.ro", users: 3, enrolled: "02.06.2026",
        tier: "plus", contract: "activ", aiLoad: 34,
        commercial: { plan: "Plus", renew: "02.06.2027", billing: "Anual · 4.800 RON", lastPay: "02.06.2026" },
        flags: [
          { name: "Sortare automată A.I.", tier: "Plus", on: true },
          { name: "Mesaje smart", tier: "Plus", on: true },
          { name: "Constructor de Anexe", tier: "Standard", on: true },
          { name: "Vertical Audit", tier: "Enterprise", on: false },
          { name: "Backup local", tier: "Plus · add-on", on: false }
        ],
        technical: {
          vmLoad: [22, 30, 26, 48, 40, 32, 24, 20], vmPeakIdx: 3,
          aiPerMonth: "460", docsStored: "2.1k", uptime30: 99.95, lastIncident: "acum 6 zile"
        },
        downtime: { incidents: [
          { cauza: "ai_limit", minutes: 18, day: 26 }
        ] }
      }
    ],

    /* ============================================================
       Registrul de fluxuri (HQ) — două straturi:
       1. flowVerticals — verticale (module de lucru) cu forma ciclului
          de viață. Cele `builtin` sunt Situații Contabile și Misiuni de
          Audit — au pagini dedicate; cele custom sunt servite de motorul
          generic (flux.html / flux-detaliu.html).
       2. flowTemplates — șabloane concrete de flux în interiorul unei
          verticale (echivalentul HQ al situationTypes de la client).
       Tipurile de clienți (clientTypes) leagă verticale + șabloane
       implicite; la înrolare, șabloanele sunt COPIATE în workspace-ul
       clientului (seed-then-editable, editabile apoi în Administrare).
       Editările HQ persistă în localStorage (același pattern mergeInto
       ca 'scriptica.situationTypes').
       ============================================================ */
    flowVerticals: [
      {
        id: "vert_contabil", domain: "contabil", builtin: true, status: "activ",
        name: "Situații Contabile", icon: "fact_check",
        itemLabel: "Situație", itemLabelPlural: "Situații",
        description: "Verticala contabilă: situații recurente pe pași standard (recepție → verificare → validare).",
        lifecycle: ["Recepție documente", "Verificare documente", "Validare și închidere"],
        pages: { list: "situatii.html" }
      },
      {
        id: "vert_audit", domain: "audit", builtin: true, status: "activ",
        name: "Misiuni de Audit", icon: "verified_user",
        itemLabel: "Misiune", itemLabelPlural: "Misiuni",
        description: "Verticala de audit public intern: misiuni pe etapele legale, cu planificare multianuală și rapoarte.",
        lifecycle: ["Pregătirea misiunii", "Intervenția la fața locului", "Raportarea rezultatelor", "Urmărirea recomandărilor"],
        pages: { list: "misiuni-audit.html" }
      },
      {
        id: "vert_consultanta", domain: "consultanta", builtin: false, status: "activ",
        name: "Consultanță Fiscală", icon: "balance",
        itemLabel: "Dosar", itemLabelPlural: "Dosare",
        description: "Dosare de consultanță fiscală: analiza solicitării, documentare, opinie scrisă și livrare.",
        lifecycle: ["Analiza solicitării", "Documentare și redactare opinie", "Livrare și follow-up"]
      }
    ],

    flowTemplates: [
      /* — contabil (oglinda șabloanelor standard provisionate la clienți) — */
      { id: "ft_raport_lunar", verticalId: "vert_contabil", name: "Raport Lunar", frequency: "lunar", status: "activ",
        description: "Raport contabil lunar complet: înregistrare documente, închidere balanță și rapoarte.",
        steps: [
          { name: "Recepție documente", offsetDays: 10 },
          { name: "Verificare documente", offsetDays: 20 },
          { name: "Validare și închidere", offsetDays: 30 }
        ] },
      { id: "ft_jurnal_tva", verticalId: "vert_contabil", name: "Jurnal TVA", frequency: "lunar", status: "activ",
        description: "Jurnal de TVA cu verificarea corelațiilor D300 ↔ D394.",
        steps: [
          { name: "Recepție documente", offsetDays: 7 },
          { name: "Verificare documente", offsetDays: 14 },
          { name: "Validare și închidere", offsetDays: 25 }
        ] },
      { id: "ft_salarizari", verticalId: "vert_contabil", name: "Salarizări", frequency: "lunar", status: "activ",
        description: "Calcul salarii, ștat de plată și declarația D112.",
        steps: [
          { name: "Recepție documente", offsetDays: 5 },
          { name: "Verificare documente", offsetDays: 10 },
          { name: "Validare și închidere", offsetDays: 15 }
        ] },
      { id: "ft_declaratii_trim", verticalId: "vert_contabil", name: "Declarații Trimestriale", frequency: "trimestrial", status: "activ",
        description: "Declarații fiscale trimestriale (D100, D101).",
        steps: [
          { name: "Recepție documente", offsetDays: 30 },
          { name: "Verificare documente", offsetDays: 60 },
          { name: "Validare și închidere", offsetDays: 85 }
        ] },
      /* — audit — */
      { id: "ft_audit_regularitate", verticalId: "vert_audit", name: "Misiune de audit de regularitate", frequency: "anual", status: "activ",
        description: "Misiune de audit public intern de regularitate, structurată pe etapele legale ale misiunii.",
        steps: [
          { name: "Pregătirea misiunii", offsetDays: 15 },
          { name: "Intervenția la fața locului", offsetDays: 45 },
          { name: "Raportarea rezultatelor", offsetDays: 90 },
          { name: "Urmărirea recomandărilor", offsetDays: 180 }
        ] },
      { id: "ft_audit_risc", verticalId: "vert_audit", name: "Evaluarea riscurilor (Anexa 9)", frequency: "anual", status: "activ",
        description: "Evaluarea riscurilor cu punctaj derivat automat (Probabilitate × Impact × Pondere).",
        steps: [
          { name: "Evaluarea riscurilor", offsetDays: 20 },
          { name: "Ierarhizare și raport", offsetDays: 40 }
        ] },
      /* — consultanță fiscală (verticală custom, motor generic) — */
      { id: "ft_consult_opinie", verticalId: "vert_consultanta", name: "Opinie fiscală punctuală", frequency: "punctual", status: "activ",
        description: "Opinie scrisă pe o speță fiscală punctuală, cu documentare și livrare către client.",
        steps: [
          { name: "Analiza solicitării", offsetDays: 3 },
          { name: "Documentare și redactare opinie", offsetDays: 10 },
          { name: "Livrare și follow-up", offsetDays: 15 }
        ] },
      { id: "ft_consult_retainer", verticalId: "vert_consultanta", name: "Consultanță lunară (retainer)", frequency: "lunar", status: "activ",
        description: "Pachet lunar de consultanță: colectarea spețelor, răspunsuri consolidate și sinteză de final de lună.",
        steps: [
          { name: "Analiza solicitării", offsetDays: 5 },
          { name: "Documentare și redactare opinie", offsetDays: 18 },
          { name: "Livrare și follow-up", offsetDays: 25 }
        ] }
    ],

    /* Tipuri de clienți — fiecare tip împachetează verticalele + șabloanele
       implicite pe care clienții de acest tip le primesc la înrolare.
       Un client are UN singur tip (hibrizii au tip dedicat, ex. ct_mixt).
       ------------------------------------------------------------
       `archiveTree` = structura de arhivă (sistemul de foldere) primită
       implicit de clienții tipului. Fiecare folder declară prin
       `docTypeIds` ce tipuri de documente ține — regula după care A.I.
       (LLM-ul local) mută automat documentele intrate. Un tip de document
       are UN singur folder-destinație. Folderul cu `system: true`
       (Necategorisit) primește tot ce A.I. nu recunoaște și nu poate fi
       șters. Subfolderele participă la rutare împreună cu părintele. */
    clientTypes: [
      {
        id: "ct_contabilitate", name: "Cabinet de contabilitate", icon: "calculate", builtin: true,
        description: "Firme de contabilitate — primesc verticala contabilă cu șabloanele standard de situații.",
        verticalIds: ["vert_contabil"],
        defaultTemplateIds: ["ft_raport_lunar", "ft_jurnal_tva", "ft_salarizari", "ft_declaratii_trim"],
        /* Terminologia pentru partea externă (cum își numește firma clienții)
           + layout-ul de dashboard (Acasă): listă ordonată de widget-uri,
           size 'half' (o coloană) sau 'full' (toată lățimea). */
        clientLabel: "Client", clientLabelPlural: "Clienți",
        dashboardLayout: [
          { id: "dw_ct1_1", widget: "situatii_noi", size: "half" },
          { id: "dw_ct1_2", widget: "alerte", size: "half" },
          { id: "dw_ct1_3", widget: "clienti", size: "full" },
          { id: "dw_ct1_4", widget: "arhiva_recente", params: {}, size: "half" },
          { id: "dw_ct1_5", widget: "notificari", size: "half" }
        ],
        archiveTree: [
          { id: "af_ct1_intrare", name: "Documente intrare", docTypeIds: ["dt_factura_furnizor", "dt_bon_fiscal", "dt_nir", "dt_aviz_pv"], children: [] },
          { id: "af_ct1_iesire", name: "Documente ieșire", docTypeIds: ["dt_factura_emisa", "dt_foaie_parcurs"], children: [] },
          { id: "af_ct1_banca", name: "Bancă și casă", docTypeIds: ["dt_extras_cont", "dt_registru_casa"], children: [] },
          { id: "af_ct1_salarizare", name: "Salarizare", docTypeIds: ["dt_stat_salarii", "dt_document_hr"], children: [] },
          { id: "af_ct1_documentatie", name: "Documentație contabilă", docTypeIds: ["dt_balanta", "dt_registru_imobilizari", "dt_situatia_stocurilor"], children: [
            { id: "af_ct1_declaratii", name: "Declarații ANAF", docTypeIds: ["dt_declaratie_fiscala"], children: [] }
          ] },
          { id: "af_ct1_necat", name: "Necategorisit", system: true, docTypeIds: [], children: [] }
        ]
      },
      {
        id: "ct_audit", name: "Firmă de audit", icon: "verified_user", builtin: true,
        description: "Structuri de audit public intern — primesc verticala de audit cu misiunile standard.",
        verticalIds: ["vert_audit"],
        defaultTemplateIds: ["ft_audit_regularitate", "ft_audit_risc"],
        /* Partea externă a auditului = entități publice → „Instituție". */
        clientLabel: "Instituție", clientLabelPlural: "Instituții",
        dashboardLayout: [
          { id: "dw_ct2_1", widget: "flow_summary", params: { verticalId: "vert_audit" }, size: "half" },
          { id: "dw_ct2_2", widget: "termene", size: "half" },
          { id: "dw_ct2_3", widget: "rapoarte_audit", size: "half" },
          { id: "dw_ct2_4", widget: "arhiva_recente", params: { folderId: "af_ct2_rapoarte" }, size: "half" },
          { id: "dw_ct2_5", widget: "clienti", size: "full" }
        ],
        archiveTree: [
          { id: "af_ct2_permanent", name: "Dosar permanent", docTypeIds: ["dt_ordin_serviciu", "dt_notificare_audit", "dt_minuta"], children: [] },
          { id: "af_ct2_lucru", name: "Documente de lucru", docTypeIds: ["dt_program_misiune", "dt_fiap", "dt_fcri"], children: [] },
          { id: "af_ct2_rapoarte", name: "Rapoarte de audit", docTypeIds: ["dt_raport_audit"], children: [] },
          { id: "af_ct2_coresp", name: "Corespondență", docTypeIds: ["dt_corespondenta"], children: [] },
          { id: "af_ct2_necat", name: "Necategorisit", system: true, docTypeIds: [], children: [] }
        ]
      },
      {
        id: "ct_mixt", name: "Cabinet mixt (servicii multiple)", icon: "diversity_2", builtin: true,
        description: "Firme care oferă mai multe servicii — contabilitate, audit și consultanță fiscală — primesc toate verticalele active cu șabloanele standard.",
        verticalIds: ["vert_contabil", "vert_audit", "vert_consultanta"],
        defaultTemplateIds: ["ft_raport_lunar", "ft_jurnal_tva", "ft_salarizari", "ft_declaratii_trim", "ft_audit_regularitate", "ft_audit_risc", "ft_consult_opinie", "ft_consult_retainer"],
        clientLabel: "Client", clientLabelPlural: "Clienți",
        dashboardLayout: [
          { id: "dw_ct3_1", widget: "situatii_noi", size: "half" },
          { id: "dw_ct3_2", widget: "alerte", size: "half" },
          { id: "dw_ct3_3", widget: "flow_summary", params: { verticalId: "vert_audit" }, size: "half" },
          { id: "dw_ct3_4", widget: "termene", size: "half" },
          { id: "dw_ct3_5", widget: "clienti", size: "full" },
          { id: "dw_ct3_6", widget: "arhiva_recente", params: {}, size: "half" },
          { id: "dw_ct3_7", widget: "notificari", size: "half" }
        ],
        archiveTree: [
          { id: "af_ct3_intrare", name: "Documente intrare", docTypeIds: ["dt_factura_furnizor", "dt_bon_fiscal", "dt_nir", "dt_aviz_pv"], children: [] },
          { id: "af_ct3_iesire", name: "Documente ieșire", docTypeIds: ["dt_factura_emisa", "dt_foaie_parcurs"], children: [] },
          { id: "af_ct3_banca", name: "Bancă și casă", docTypeIds: ["dt_extras_cont", "dt_registru_casa"], children: [] },
          { id: "af_ct3_salarizare", name: "Salarizare", docTypeIds: ["dt_stat_salarii", "dt_document_hr"], children: [] },
          { id: "af_ct3_documentatie", name: "Documentație contabilă", docTypeIds: ["dt_balanta", "dt_registru_imobilizari", "dt_situatia_stocurilor"], children: [
            { id: "af_ct3_declaratii", name: "Declarații ANAF", docTypeIds: ["dt_declaratie_fiscala"], children: [] }
          ] },
          { id: "af_ct3_audit", name: "Dosar audit", docTypeIds: [], children: [
            { id: "af_ct3_audit_permanent", name: "Dosar permanent", docTypeIds: ["dt_ordin_serviciu", "dt_notificare_audit", "dt_minuta"], children: [] },
            { id: "af_ct3_audit_lucru", name: "Documente de lucru", docTypeIds: ["dt_program_misiune", "dt_fiap", "dt_fcri"], children: [] },
            { id: "af_ct3_audit_rapoarte", name: "Rapoarte de audit", docTypeIds: ["dt_raport_audit"], children: [] }
          ] },
          { id: "af_ct3_necat", name: "Necategorisit", system: true, docTypeIds: [], children: [] }
        ]
      },
      {
        id: "ct_consultanta", name: "Cabinet de consultanță fiscală", icon: "balance", builtin: false,
        description: "Cabinete de consultanță fiscală — primesc verticala de consultanță cu șabloanele de dosare.",
        verticalIds: ["vert_consultanta"],
        defaultTemplateIds: ["ft_consult_opinie", "ft_consult_retainer"],
        clientLabel: "Client", clientLabelPlural: "Clienți",
        dashboardLayout: [
          { id: "dw_ct4_1", widget: "flow_summary", params: { verticalId: "vert_consultanta" }, size: "half" },
          { id: "dw_ct4_2", widget: "termene", size: "half" },
          { id: "dw_ct4_3", widget: "arhiva_recente", params: {}, size: "half" },
          { id: "dw_ct4_4", widget: "echipa", size: "half" }
        ],
        archiveTree: [
          { id: "af_ct4_solicitari", name: "Solicitări clienți", docTypeIds: ["dt_corespondenta"], children: [] },
          { id: "af_ct4_opinii", name: "Opinii emise", docTypeIds: ["dt_opinie_fiscala"], children: [] },
          { id: "af_ct4_suport", name: "Documente suport", docTypeIds: ["dt_contract"], children: [] },
          { id: "af_ct4_necat", name: "Necategorisit", system: true, docTypeIds: [], children: [] }
        ]
      }
    ]
  },

  /* Tipuri de documente — vocabularul cu care A.I. (LLM-ul local)
     etichetează documentele intrate (câmpul `tipDocument` de pe document).
     Sursa dropdown-ului din editorul de structură de arhivă; `domain`
     leagă tipul de verticala din care provine (null = generic). */
  documentTypes: [
    { id: "dt_factura_furnizor", name: "Factură furnizor", domain: "contabil" },
    { id: "dt_factura_emisa", name: "Factură emisă", domain: "contabil" },
    { id: "dt_bon_fiscal", name: "Bon fiscal", domain: "contabil" },
    { id: "dt_extras_cont", name: "Extras de cont", domain: "contabil" },
    { id: "dt_registru_casa", name: "Registru de casă", domain: "contabil" },
    { id: "dt_nir", name: "NIR", domain: "contabil" },
    { id: "dt_aviz_pv", name: "Aviz / Proces verbal", domain: "contabil" },
    { id: "dt_foaie_parcurs", name: "Foaie de parcurs", domain: "contabil" },
    { id: "dt_stat_salarii", name: "Ștat de salarii", domain: "contabil" },
    { id: "dt_document_hr", name: "Document HR", domain: "contabil" },
    { id: "dt_declaratie_fiscala", name: "Declarație fiscală", domain: "contabil" },
    { id: "dt_balanta", name: "Balanță de verificare", domain: "contabil" },
    { id: "dt_registru_imobilizari", name: "Registru imobilizări", domain: "contabil" },
    { id: "dt_situatia_stocurilor", name: "Situația stocurilor", domain: "contabil" },
    { id: "dt_ordin_serviciu", name: "Ordin de serviciu", domain: "audit" },
    { id: "dt_notificare_audit", name: "Notificare misiune", domain: "audit" },
    { id: "dt_minuta", name: "Minută", domain: "audit" },
    { id: "dt_program_misiune", name: "Program de misiune", domain: "audit" },
    { id: "dt_fiap", name: "FIAP", domain: "audit" },
    { id: "dt_fcri", name: "FCRI", domain: "audit" },
    { id: "dt_raport_audit", name: "Raport de audit", domain: "audit" },
    { id: "dt_opinie_fiscala", name: "Opinie fiscală", domain: "consultanta" },
    { id: "dt_contract", name: "Contract", domain: null },
    { id: "dt_corespondenta", name: "E-mail de transmitere", domain: null },
    { id: "dt_document_multiplu", name: "Document multiplu", domain: null },
    { id: "dt_altele", name: "Altele", domain: null }
  ],

  /* Instanțe pentru verticalele custom (motorul generic flux.html).
     Echivalentul `situations`/`auditMissions` pentru domeniile noi.
     Termenele se calculează la runtime din startDate + offset-urile
     șablonului. Itemii creați din UI persistă în 'scriptica.flowItems'. */
  flowItems: [
    {
      id: "fi_0001", verticalId: "vert_consultanta", domain: "consultanta",
      name: "Opinie fiscală — tratament TVA import servicii",
      clientName: "Electro Distrib S.R.L.",
      templateId: "ft_consult_opinie", templateName: "Opinie fiscală punctuală",
      startDate: "2026-04-08", currentStep: 2, stepsCompleted: 1,
      status: "in_verificare", responsibleIds: [6, 2]
    },
    {
      id: "fi_0002", verticalId: "vert_consultanta", domain: "consultanta",
      name: "Consultanță lunară — aprilie 2026",
      clientName: "Mobexpert Log S.R.L.",
      templateId: "ft_consult_retainer", templateName: "Consultanță lunară (retainer)",
      startDate: "2026-04-01", currentStep: 3, stepsCompleted: 2,
      status: "spre_aprobare", responsibleIds: [6]
    },
    {
      id: "fi_0003", verticalId: "vert_consultanta", domain: "consultanta",
      name: "Opinie fiscală — regim micro vs. profit 2026",
      clientName: "AgroSem Trading S.R.L.",
      templateId: "ft_consult_opinie", templateName: "Opinie fiscală punctuală",
      startDate: "2026-04-15", currentStep: 1, stepsCompleted: 0,
      status: "analiza", responsibleIds: [6, 4]
    },
    {
      id: "fi_0004", verticalId: "vert_consultanta", domain: "consultanta",
      name: "Consultanță lunară — martie 2026",
      clientName: "Mobexpert Log S.R.L.",
      templateId: "ft_consult_retainer", templateName: "Consultanță lunară (retainer)",
      startDate: "2026-03-01", currentStep: 3, stepsCompleted: 3,
      status: "finalizat", responsibleIds: [6, 2]
    }
  ],

  /* Phase 9 — taguri administrabile (admin panel) */
  adminTags: [
    { id: 1, name: "Urgent",             usageCount: 12 },
    { id: 2, name: "De verificat",       usageCount: 31 },
    { id: 3, name: "TVA",                usageCount: 18 },
    { id: 4, name: "Client nou",         usageCount: 4 },
    { id: 5, name: "Salarizare",         usageCount: 9 },
    { id: 6, name: "Bilanț anual",       usageCount: 2 },
    { id: 7, name: "Lipsă documente",    usageCount: 7 },
    { id: 8, name: "Prioritate scăzută", usageCount: 1 }
  ],

  /* Phase 9/10 — Tipuri de anexe (Constructor de Anexe).
     Standalone, reusable templates — NOT bound to a type or step here.
     Attachment happens in situationTypes[].steps[].anexeIds, configured
     in the admin editor. `schema.fields` uses the module types of the
     constructor (see js/constructor-anexe.js). */
  anexeTypes: [
    {
      id: "anx_1",
      name: "Anexă verificare corelație D300 ↔ D394",
      status: "activ",
      updatedAt: "2026-04-18",
      schema: { fields: [
        { type: "section_title", text: "Date generale" },
        { type: "paragraph", text: "Completează datele de identificare ale documentului supus verificării. Toate câmpurile marcate cu * sunt obligatorii." },
        { type: "client_picker", label: "Client", required: true, help: "Alege din portofoliul firmei.", multi: false, source: "all_clients", filterActive: true, filterAssigned: false },
        { type: "month", label: "Perioada fiscală", required: true, help: "" },
        { type: "divider" },
        { type: "section_title", text: "Corelație D300 ↔ D394" },
        { type: "banner", variant: "warning", text: "Diferențele între D300 și D394 generează notificări de conformare ANAF. Verifică cu atenție." },
        { type: "currency", label: "Total livrări D300 (rd. 13)", required: true, currency: "RON", help: "" },
        { type: "currency", label: "Total livrări D394 (Secțiunea C)", required: true, currency: "RON", help: "" },
        { type: "calculated", label: "Diferență", formula: "D300_rd13 - D394_C", help: "Trebuie să fie 0. Orice diferență necesită justificare." },
        { type: "radio", label: "Sumele se corelează?", required: true, help: "", options: ["Da, perfect", "Da, cu diferență minoră justificată", "Nu, necesită corectură"] },
        { type: "text_long", label: "Observații verificare", rows: 3, placeholder: "Notează orice neconcordanță observată...", required: false, help: "" },
        { type: "document_picker", label: "Documente justificative consultate", required: false, help: "Selectează documentele din pasul Recepție pe care le-ai folosit.", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_2",
      name: "Fișă intake documente client",
      status: "activ",
      updatedAt: "2026-04-10",
      schema: { fields: [
        { type: "section_title", text: "Date despre luna raportată" },
        { type: "paragraph", text: "Completează aceste informații împreună cu documentele lunii. Ne ajută să procesăm corect și rapid." },
        { type: "month", label: "Perioada raportată", required: true, help: "" },
        { type: "number", label: "Salariați activi", required: true, help: "Numărul de angajați activi în luna raportată.", min: 0, max: null, decimals: 0 },
        { type: "currency", label: "Cifră de afaceri estimată", required: false, currency: "RON", help: "" },
        { type: "boolean", label: "Au existat modificări față de luna trecută?", required: true, help: "Angajări, încetări, contracte noi, investiții." },
        { type: "text_long", label: "Detalii modificări", rows: 3, placeholder: "Descrie pe scurt modificările...", required: false, help: "" },
        { type: "file_upload", label: "Documente suplimentare", required: false, help: "", multi: true, maxSizeMB: 10, allowedTypes: "PDF, JPG, PNG, XLSX" }
      ] }
    },
    {
      id: "anx_3",
      name: "Fișă validare finală contabil senior",
      status: "activ",
      updatedAt: "2026-03-28",
      schema: { fields: [
        { type: "banner", variant: "info", text: "Această fișă se completează de contabilul senior înainte de închiderea situației." },
        { type: "checkboxes", label: "Verificări efectuate", required: true, help: "", options: ["Balanță închisă", "Jurnale TVA corelate", "Declarații depuse", "Rapoarte salvate în arhivă"] },
        { type: "boolean", label: "Confirm că situația poate fi închisă", required: true, help: "" },
        { type: "text_long", label: "Observații validare", rows: 3, placeholder: "", required: false, help: "" }
      ] }
    },
    {
      id: "anx_4",
      name: "Fișă verificare balanță lunară",
      status: "activ",
      updatedAt: "2026-04-15",
      schema: { fields: [
        { type: "section_title", text: "Verificare balanță" },
        { type: "paragraph", text: "Confirmă verificările de balanță efectuate înainte de închiderea lunii. Fișa se completează de responsabilul pasului." },
        { type: "month", label: "Perioada verificată", required: true, help: "" },
        { type: "checkboxes", label: "Verificări efectuate", required: true, help: "", options: ["Solduri inițiale preluate corect", "Rulaje complete pe toate conturile", "Conturi furnizori/clienți reconciliate", "Amortizări înregistrate"] },
        { type: "boolean", label: "Balanța este echilibrată?", required: true, help: "Totalul debitelor egal cu totalul creditelor." },
        { type: "text_long", label: "Observații", rows: 3, placeholder: "Notează orice diferență sau ajustare efectuată...", required: false, help: "" }
      ] }
    },
    {
      id: "anx_5",
      name: "Reconciliere extras bancar",
      status: "activ",
      updatedAt: "2026-04-19",
      schema: { fields: [
        { type: "section_title", text: "Reconciliere bancară" },
        { type: "banner", variant: "info", text: "Compară soldul din extrasul bancar cu soldul din contabilitate înainte de închiderea lunii." },
        { type: "month", label: "Perioada reconciliată", required: true, help: "" },
        { type: "dropdown", label: "Banca", required: true, help: "", options: ["Banca Transilvania", "BCR", "ING Bank", "BRD"] },
        { type: "currency", label: "Sold final extras bancar", required: true, currency: "RON", help: "" },
        { type: "currency", label: "Sold final în contabilitate", required: true, currency: "RON", help: "" },
        { type: "calculated", label: "Diferență", formula: "sold_extras - sold_contabilitate", help: "Trebuie să fie 0. Orice diferență necesită explicație." },
        { type: "radio", label: "Soldurile corespund?", required: true, help: "", options: ["Da, perfect", "Diferență justificată", "Nu, necesită investigare"] },
        { type: "text_long", label: "Explicația diferențelor", rows: 3, placeholder: "Comisioane neînregistrate, încasări în tranzit...", required: false, help: "" },
        { type: "file_upload", label: "Extras de cont atașat", required: true, help: "", multi: true, maxSizeMB: 10, allowedTypes: "PDF, JPG, PNG" }
      ] }
    },

    /* ============================================================
       Anexe Misiune de Audit (Phase audit — seed)
       ============================================================ */

    /* Part B — anexă completă cu repeater_block */
    {
      id: "anx_obiective_audit",
      name: "Obiectivele Misiunii",
      status: "activ",
      updatedAt: "2026-04-20",
      schema: { fields: [
        { type: "paragraph", text: "Definește obiectivele misiunii de audit. Pentru fiecare obiectiv, completează titlul, constatarea și eventualele iregularități identificate." },
        { type: "repeater_block",
          label: "Obiectiv",
          addLabel: "Adaugă obiectiv",
          minBlocks: 1,
          maxBlocks: null,
          blockFields: [
            { type: "text_long", label: "Titlul obiectivului", rows: 1, required: true, help: "" },
            { type: "text_long", label: "Constatare", rows: 3, required: false, help: "" },
            { type: "text_long", label: "Iregularitate", rows: 3, required: false, help: "" },
            { type: "text_long", label: "Recomandare", rows: 3, required: false, help: "Recomandarea generează un rând în Etapa IV — Urmărirea recomandărilor." }
          ]
        }
      ] }
    },

    /* Part C — instrumente standard (HG 1086/2013). Seed-uri minimal-plauzibile. */
    {
      id: "anx_audit_ordin_serviciu",
      name: "Ordin de serviciu",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Ordin de serviciu" },
        { type: "text_short", label: "Număr ordin", required: true, help: "", maxLength: 50 },
        { type: "date", label: "Data emiterii", required: true, help: "" },
        { type: "text_short", label: "Structura/entitatea auditată", required: true, help: "", maxLength: 120 },
        { type: "text_long", label: "Scopul și obiectivele misiunii", rows: 3, required: true, help: "" },
        { type: "text_long", label: "Echipa de audit desemnată", rows: 2, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_declaratie_independenta",
      name: "Declarație de independență",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Declarație de independență" },
        { type: "text_short", label: "Numele auditorului", required: true, help: "", maxLength: 120 },
        { type: "checkboxes", label: "Incompatibilități identificate", required: false, help: "", options: ["Relații de rudenie", "Interese financiare", "Implicare anterioară în activitatea auditată", "Niciuna"] },
        { type: "boolean", label: "Confirm independența față de structura auditată", required: true, help: "" },
        { type: "text_long", label: "Observații", rows: 2, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_notificare",
      name: "Notificare privind declanșarea misiunii",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Notificare privind declanșarea misiunii de audit" },
        { type: "text_short", label: "Structura auditată", required: true, help: "", maxLength: 120 },
        { type: "date", label: "Data notificării", required: true, help: "" },
        { type: "text_long", label: "Conținutul notificării", rows: 4, required: true, help: "" },
        { type: "document_picker", label: "Documente anexate", required: false, help: "", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_audit_minuta_deschidere",
      name: "Minuta ședinței de deschidere",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Minuta ședinței de deschidere" },
        { type: "date", label: "Data ședinței", required: true, help: "" },
        { type: "text_long", label: "Participanți", rows: 3, required: true, help: "" },
        { type: "text_long", label: "Aspecte discutate", rows: 4, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_chestionar_cunostinta",
      name: "Chestionar de luare la cunoștință",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Chestionar de luare la cunoștință (CLC)" },
        { type: "text_long", label: "Descrierea activității structurii auditate", rows: 4, required: true, help: "" },
        { type: "text_long", label: "Cadrul legal aplicabil", rows: 3, required: false, help: "" },
        { type: "text_long", label: "Observații", rows: 2, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_studiu_preliminar",
      name: "Studiu preliminar",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Studiu preliminar" },
        { type: "text_long", label: "Obiective și domenii analizate", rows: 4, required: true, help: "" },
        { type: "text_long", label: "Riscuri preliminare identificate", rows: 3, required: false, help: "" },
        { type: "document_picker", label: "Documente consultate", required: false, help: "", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_audit_punctaj_riscuri",
      name: "Stabilirea punctajului riscurilor și ierarhizarea",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Stabilirea punctajului riscurilor și ierarhizarea" },
        { type: "table", label: "Evaluarea riscurilor", required: true, help: "Un rând per risc identificat.", columns: [
          { name: "Risc identificat", type: "text" },
          { name: "Probabilitate", type: "number" },
          { name: "Impact", type: "number" },
          { name: "Punctaj total", type: "number" }
        ], minRows: 1 },
        { type: "text_long", label: "Observații privind ierarhizarea", rows: 2, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_chestionar_ci",
      name: "Chestionar de control intern",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Chestionar de control intern (CCI)" },
        { type: "text_long", label: "Întrebări privind controlul intern", rows: 4, required: true, help: "" },
        { type: "radio", label: "Există controale formalizate?", required: true, help: "", options: ["Da", "Parțial", "Nu"] },
        { type: "text_long", label: "Observații", rows: 2, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_evaluare_ci",
      name: "Evaluarea inițială a controlului intern",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Evaluarea inițială a controlului intern" },
        { type: "radio", label: "Nivelul controlului intern", required: true, help: "", options: ["Ridicat", "Mediu", "Scăzut"] },
        { type: "text_long", label: "Justificare și concluzii", rows: 4, required: true, help: "" }
      ] }
    },
    {
      id: "anx_audit_program_misiune",
      name: "Programul misiunii",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Programul misiunii de audit" },
        { type: "table", label: "Activități planificate", required: true, help: "", columns: [
          { name: "Activitate", type: "text" },
          { name: "Responsabil", type: "text" },
          { name: "Termen", type: "date" }
        ], minRows: 1 },
        { type: "text_long", label: "Note", rows: 2, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_lista_verificare",
      name: "Chestionar – listă de verificare",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Chestionar – listă de verificare (CLV)" },
        { type: "checkboxes", label: "Elemente verificate", required: true, help: "", options: ["Documente justificative complete", "Aprobări conforme", "Înregistrări corecte", "Respectarea termenelor"] },
        { type: "text_long", label: "Observații per element", rows: 3, required: false, help: "" }
      ] }
    },
    {
      id: "anx_audit_test",
      name: "Test",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Test" },
        { type: "text_long", label: "Obiectivul testului", rows: 2, required: true, help: "" },
        { type: "text_long", label: "Eșantionul testat", rows: 2, required: false, help: "" },
        { type: "text_long", label: "Rezultatele testării", rows: 3, required: true, help: "" },
        { type: "document_picker", label: "Probe de audit", required: false, help: "", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_audit_fiap",
      name: "FIAP — Fișă de identificare și analiză a problemei",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      // NOTĂ: FIAP are flux de confirmare/semnătură externă; FCRI are escaladare 3 zile — de tratat în faza relevantă, nu acum.
      schema: { fields: [
        { type: "section_title", text: "FIAP — Fișă de identificare și analiză a problemei" },
        { type: "text_long", label: "Problema identificată", rows: 2, required: true, help: "" },
        { type: "text_long", label: "Constatare", rows: 3, required: true, help: "" },
        { type: "text_long", label: "Cauze", rows: 2, required: false, help: "" },
        { type: "text_long", label: "Consecințe", rows: 2, required: false, help: "" },
        { type: "text_long", label: "Recomandări", rows: 3, required: true, help: "" },
        { type: "document_picker", label: "Probe atașate", required: false, help: "", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_audit_fcri",
      name: "FCRI — Formular de constatare și raportare a iregularităților",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      // NOTĂ: FIAP are flux de confirmare/semnătură externă; FCRI are escaladare 3 zile — de tratat în faza relevantă, nu acum.
      schema: { fields: [
        { type: "section_title", text: "FCRI — Formular de constatare și raportare a iregularităților" },
        { type: "text_long", label: "Iregularitatea constatată", rows: 3, required: true, help: "" },
        { type: "text_long", label: "Actul normativ încălcat", rows: 2, required: true, help: "" },
        { type: "date", label: "Data constatării", required: true, help: "" },
        { type: "text_long", label: "Măsuri propuse", rows: 3, required: false, help: "" },
        { type: "document_picker", label: "Documente justificative", required: false, help: "", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_audit_urmarire_recomandari",
      name: "Fișa de urmărire a implementării recomandărilor",
      status: "activ",
      updatedAt: "2026-04-20",
      // STUB: câmpuri de validat vs HG 1086/2013
      schema: { fields: [
        { type: "section_title", text: "Fișa de urmărire a implementării recomandărilor" },
        { type: "table", label: "Stadiul recomandărilor", required: true, help: "", columns: [
          { name: "Recomandare", type: "text" },
          { name: "Termen", type: "date" },
          { name: "Stadiu", type: "text" }
        ], minRows: 1 },
        { type: "text_long", label: "Observații", rows: 2, required: false, help: "" }
      ] }
    },

    /* ===== Lanțul de risc — Anexa 9 (HG 1086/2013). Demonstrează calculul
       automat cross-anexă: PUNCTAJ = PROB × IMP × PONDERE. Câmpurile numerice
       au cod `ref`; formula e legată la nivelul tipului `misiune_audit_risc`. ===== */
    {
      id: "anx_criterii_risc",
      name: "Criterii de risc (Anexa 9)",
      status: "activ",
      categories: ["audit"],
      updatedAt: "2026-04-20",
      schema: { fields: [
        { type: "section_title", text: "Evaluarea riscului activității auditabile" },
        { type: "paragraph", text: "Stabilește criteriile de risc conform Anexei 9 la HG 1086/2013. Probabilitatea și impactul se notează de la 1 (minim) la 3 (maxim); ponderea reflectă importanța criteriului." },
        { type: "number", label: "Probabilitate (1–3)", required: true, help: "Probabilitatea de apariție a riscului.", min: 1, max: 3, decimals: 0, ref: "PROB" },
        { type: "number", label: "Impact (1–3)", required: true, help: "Impactul riscului asupra obiectivelor.", min: 1, max: 3, decimals: 0, ref: "IMP" },
        { type: "number", label: "Pondere criteriu", required: true, help: "Ponderea criteriului (ex. 1,0–2,0).", min: 0, max: null, decimals: 2, ref: "PONDERE" }
      ] }
    },
    {
      id: "anx_punctaj_risc",
      name: "Stabilirea punctajului riscurilor",
      status: "activ",
      categories: ["audit"],
      updatedAt: "2026-04-20",
      schema: { fields: [
        { type: "section_title", text: "Punctajul total al riscului" },
        { type: "paragraph", text: "Punctajul se calculează automat din criteriile de risc: Probabilitate × Impact × Pondere. Nivelul de risc se stabilește pe baza punctajului și determină ierarhizarea activităților." },
        { type: "number", label: "Punctaj total risc", required: true, help: "Calculat automat din criteriile de risc.", min: 0, max: null, decimals: 2, ref: "PUNCTAJ" },
        { type: "dropdown", label: "Nivel de risc", required: true, help: "Mapează punctajul la un nivel — ierarhizează activitățile.", options: ["Scăzut", "Mediu", "Ridicat"] }
      ] }
    }
  ],

  /* Phase 10 — seeded anexă responses (per situation instance).
     Base layer for the fill state: localStorage 'scriptica.anexaResponses'
     overrides these per key. Keys: situationId + '::' + anexaTypeId.
     Values map is keyed by the field's index in schema.fields (as string).
     anx_4 on situation 126: all 3 mandatory fields filled → 100%, complete.
     anx_5 on situation 126: 3 of 6 mandatory filled → 50%, in progress. */
  anexaResponseSeeds: {
    "0000000126::anx_4": {
      values: {
        "2": "2026-03",
        "3": ["Solduri inițiale preluate corect", "Rulaje complete pe toate conturile", "Conturi furnizori/clienți reconciliate", "Amortizări înregistrate"],
        "4": "Da",
        "5": "Verificat integral, fără diferențe."
      },
      updatedAt: "2026-04-18",
      completedByName: "Anca Cobzaru"
    },
    "0000000126::anx_5": {
      values: {
        "2": "2026-03",
        "3": "Banca Transilvania",
        "4": "48250.75"
      },
      updatedAt: "2026-04-19",
      completedByName: null
    },
    /* Lanțul de risc — sursele (PROB/IMP/PONDERE) seedate pe misiunea demo.
       Deschiderea anexei „Stabilirea punctajului" arată PUNCTAJ = 2×3×1,5 = 9,
       calculat automat. Câmpurile sunt indexate: PROB=2, IMP=3, PONDERE=4. */
    "audit_risc_demo::anx_criterii_risc": {
      values: { "2": "2", "3": "3", "4": "1.5" },
      updatedAt: "2026-04-19",
      completedByName: "Iulian Popescu"
    }
  },

  /* Categorii de anexe (Part D) — sursa comună pentru Constructor (multi-select)
     și pentru filtrul din picker-ul de anexe al builder-ului de tip de misiune. */
  anexaCategories: [
    { id: "contabilitate", label: "Contabilitate" },
    { id: "audit", label: "Audit" },
    { id: "salarizare", label: "Salarizare" },
    { id: "fiscal", label: "Fiscal" }
  ],

  clients: [
    { id: 1,  companyName: "Canvas S.R.L.",         contactName: "Antonio Popescu",     avatarId: 33, email: "antonio@canvas.ro",        phone: "+40712345678", cui: "RO18234561", personType: "pj",  status: "activ",   situationIds: ["0000000126"] },
    { id: 2,  companyName: "Ionuț Profan PFA",      contactName: "Ionuț Profan",        avatarId: 11, email: "ionut.profan@gmail.com",   phone: "+40723118430", cui: "29415876",   personType: "pfa", status: "activ",   situationIds: ["0000000127"] },
    { id: 3,  companyName: "Simbio Cost Control",   contactName: "Mihai Andrei",        avatarId: 14, email: "office@simbio.ro",         phone: "+40745220817", cui: "RO33108294", personType: "pj",  status: "activ",   situationIds: [] },
    { id: 4,  companyName: "Style S.R.L.",          contactName: "Laura Dinu",          avatarId: 44, email: "laura@style-srl.ro",       phone: "+40731652209", cui: "RO15890327", personType: "pj",  status: "activ",   situationIds: [] },
    { id: 5,  companyName: "Simba Commercial",      contactName: "Radu Ionescu",        avatarId: 17, email: "radu@simbacom.ro",         phone: "+40762914556", cui: "RO24471053", personType: "pj",  status: "activ",   situationIds: [] },
    { id: 6,  companyName: "Textile Cluj",          contactName: "Ana Maria Stoica",    avatarId: 49, email: "contact@textilecluj.ro",   phone: "+40755381194", cui: "RO9822146",  personType: "pj",  status: "activ",   situationIds: [] },
    { id: 7,  companyName: "Simpozion S.R.L.",      contactName: "Vlad Georgescu",      avatarId: 22, email: "vlad@simpozion.ro",        phone: "+40728443067", cui: "RO40117825", personType: "pj",  status: "activ",   situationIds: [] },
    { id: 8,  companyName: "Alexandru Popa PFA",    contactName: "Alexandru Popa",      avatarId: 13, email: "alex.popa.pfa@gmail.com",  phone: "+40741906122", cui: "31556204",   personType: "pfa", status: "activ",   situationIds: [] },
    { id: 9,  companyName: "Simonis S.R.L.",        contactName: "Irina Marin",         avatarId: 48, email: "irina@simonis.ro",         phone: "+40769230815", cui: "RO27384910", personType: "pj",  status: "activ",   situationIds: [] },
    { id: 10, companyName: "Talisman Expert",       contactName: "Corneliu Băjenaru",   avatarId: 16, email: "office@talisman-expert.ro", phone: "+40733517248", cui: "RO36205178", personType: "pj",  status: "inactiv", situationIds: [] }
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
   PHASE 10 — Admin overrides from localStorage
   The admin panel persists content-type edits so the demo survives
   navigation: 'scriptica.anexe' and 'scriptica.situationTypes' are
   maps id → full record ({ deleted: true } acts as a tombstone).
   Applied once at load, BEFORE task augmentation, so every page
   reads SCRIPTICA_MOCK directly and sees the configured state.
   ------------------------------------------------------------ */
(function applyAdminOverrides() {
  function mergeInto(list, storageKey) {
    var map;
    try { map = JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch (e) { map = {}; }
    if (!map || typeof map !== 'object') return list;
    var out = [];
    list.forEach(function (item) {
      var ov = map[item.id];
      if (ov && ov.deleted) { delete map[item.id]; return; }
      out.push(ov ? ov : item);
      delete map[item.id];
    });
    Object.keys(map).forEach(function (id) {
      var ov = map[id];
      if (ov && !ov.deleted) out.push(ov);
    });
    return out;
  }
  var M = window.SCRIPTICA_MOCK;
  M.anexeTypes = mergeInto(M.anexeTypes || [], 'scriptica.anexe');
  M.situationTypes = mergeInto(M.situationTypes || [], 'scriptica.situationTypes');

  /* Registrul de fluxuri + tipuri de clienți (HQ) — același pattern de
     persistență ca tipurile de situații: map id → record în localStorage,
     { deleted: true } = tombstone. */
  var SA = M.superAdmin || {};
  SA.flowVerticals = mergeInto(SA.flowVerticals || [], 'scriptica.flowVerticals');
  SA.flowTemplates = mergeInto(SA.flowTemplates || [], 'scriptica.flowTemplates');
  SA.clientTypes = mergeInto(SA.clientTypes || [], 'scriptica.clientTypes');
  SA.clients = mergeInto(SA.clients || [], 'scriptica.saClients');
  M.flowItems = mergeInto(M.flowItems || [], 'scriptica.flowItems');
})();

/* ------------------------------------------------------------
   Registrul de fluxuri — helper-e globale.
   Folosite de shell (navigație dinamică), motorul generic (flux.html)
   și ecranele Super Admin. Salvarea scrie map-ul id → record în
   localStorage și actualizează obiectul MOCK în memorie.
   ------------------------------------------------------------ */
(function flowRegistryHelpers() {
  function readMap(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function writeRecord(key, record) {
    var map = readMap(key);
    map[record.id] = record;
    try { localStorage.setItem(key, JSON.stringify(map)); } catch (e) {}
  }

  var KEYS = {
    vertical: 'scriptica.flowVerticals',
    template: 'scriptica.flowTemplates',
    clientType: 'scriptica.clientTypes',
    saClient: 'scriptica.saClients',
    flowItem: 'scriptica.flowItems'
  };
  var LISTS = {
    vertical:  function (M) { return M.superAdmin.flowVerticals; },
    template:  function (M) { return M.superAdmin.flowTemplates; },
    clientType:function (M) { return M.superAdmin.clientTypes; },
    saClient:  function (M) { return M.superAdmin.clients; },
    flowItem:  function (M) { return M.flowItems; }
  };

  /* Upsert: persistă și sincronizează lista în memorie. kind ∈ KEYS. */
  window.scripticaFlowSave = function (kind, record) {
    if (!KEYS[kind] || !record || !record.id) return;
    writeRecord(KEYS[kind], record);
    var list = LISTS[kind](window.SCRIPTICA_MOCK);
    var idx = list.findIndex(function (x) { return x.id === record.id; });
    if (record.deleted) { if (idx !== -1) list.splice(idx, 1); }
    else if (idx !== -1) list[idx] = record;
    else list.push(record);
  };
  window.scripticaFlowDelete = function (kind, id) {
    window.scripticaFlowSave(kind, { id: id, deleted: true });
  };

  window.scripticaFlowVerticals = function () {
    return (window.SCRIPTICA_MOCK.superAdmin.flowVerticals || [])
      .filter(function (v) { return (v.status || 'activ') === 'activ'; });
  };
  window.scripticaCustomVerticals = function () {
    return window.scripticaFlowVerticals().filter(function (v) { return !v.builtin; });
  };
  window.scripticaVerticalById = function (id) {
    return (window.SCRIPTICA_MOCK.superAdmin.flowVerticals || [])
      .find(function (v) { return v.id === id; }) || null;
  };
  window.scripticaTemplatesForVertical = function (verticalId) {
    return (window.SCRIPTICA_MOCK.superAdmin.flowTemplates || [])
      .filter(function (t) { return t.verticalId === verticalId; });
  };
  window.scripticaClientTypes = function () {
    return window.SCRIPTICA_MOCK.superAdmin.clientTypes || [];
  };
  window.scripticaClientTypeById = function (id) {
    return window.scripticaClientTypes().find(function (t) { return t.id === id; }) || null;
  };
  window.scripticaFlowItemsForVertical = function (verticalId) {
    return (window.SCRIPTICA_MOCK.flowItems || [])
      .filter(function (i) { return i.verticalId === verticalId; });
  };

  /* ---- Structura de arhivă (per tip de client) ---- */
  window.scripticaDocumentTypes = function () {
    return window.SCRIPTICA_MOCK.documentTypes || [];
  };
  window.scripticaDocTypeById = function (id) {
    return window.scripticaDocumentTypes().find(function (t) { return t.id === id; }) || null;
  };
  /* Structura implicită pentru tipurile de clienți create din UI. */
  window.scripticaDefaultArchiveTree = function () {
    return [
      { id: 'af_doc_' + Date.now(), name: 'Documente', docTypeIds: [], children: [] },
      { id: 'af_necat_' + Date.now(), name: 'Necategorisit', system: true, docTypeIds: [], children: [] }
    ];
  };
  window.scripticaArchiveTreeFor = function (clientTypeId) {
    var ct = window.scripticaClientTypeById(clientTypeId);
    return (ct && ct.archiveTree && ct.archiveTree.length)
      ? ct.archiveTree
      : window.scripticaDefaultArchiveTree();
  };

  /* Tipul de client al firmei demo, dedus din persona curentă — folosit de
     paginile de tenant (Arhivă, Acasă) ca să reflecte configurația HQ. */
  window.scripticaTenantClientTypeId = function () {
    var v = (typeof window.getCurrentView === 'function') ? window.getCurrentView() : 'complet';
    if (v === 'contabilitate' || v === 'client') return 'ct_contabilitate';
    if (v === 'audit_stat' || v === 'autoritate') return 'ct_audit';
    return 'ct_mixt'; /* complet, admin — firma demo e cabinet mixt */
  };
})();

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
  /* Phase 10 — tasks now come from each situation's TYPE definition
     (situationTypes[].steps[].tasks, configured in the admin editor).
     Ids are assigned sequentially across steps (1, 2, 3... per
     situation) which keeps them identical to the old fixed template
     ids for the seeded 3-step types — time sessions depend on that. */
  var FALLBACK_STEPS = [
    { name: "Recepție documente",
      tasks: ["Primire documente de la client", "Verificare completitudine", "Confirmare recepție"] },
    { name: "Verificare documente",
      tasks: ["Verificare organizare dosar", "E-Factura", "Înregistrare Documente", "Ștat Salarii", "Închidere Balanță", "Salvare Rapoarte", "Declarație OP-uri"] },
    { name: "Validare și închidere",
      tasks: ["Verificare finală de contabil senior", "Închidere situație"] }
  ];

  window.SCRIPTICA_MOCK.situations.forEach(function (s) {
    /* Default helper state if not already set on the situation */
    if (!s.activeHelpers)   s.activeHelpers = { step1: [], step2: [], step3: [] };
    if (!s.helperRequests)  s.helperRequests = [];

    var type = window.SCRIPTICA_MOCK.situationTypes.find(function (t) { return t.id === s.typeId; });
    var steps = (type && type.steps && type.steps.length) ? type.steps : FALLBACK_STEPS;

    var tasks = {};
    var nextId = 1;
    steps.forEach(function (step, idx) {
      var stepNum = idx + 1;
      var allDone;
      if (s.status === 'inchisa' || s.status === 'finalizat') {
        allDone = true;
      } else {
        allDone = stepNum < s.currentStep;
      }
      tasks['step' + stepNum] = (step.tasks || []).map(function (label) {
        return {
          id: nextId++,
          label: label,
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
    },

    /* ===== Arhivă AUDIT (domain:'audit') — separată de contabil. Vizibilă doar
       personelor cu „audit" în scope; container = entitatea auditată (din misiune).
       Documente de audit dedicate, ca aria de audit să nu fie goală. ===== */
    {
      id: "adoc_001", domain: "audit", missionId: "audit_0005", entityId: 1,
      filename: "raport_final_audit_investitii_2023.pdf",
      uploadedAt: "2026-02-20T11:00:00", source: "upload", pagesCount: 24,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Raport de audit", emitent: "Compartiment Audit Public Intern",
      numarDocument: "RA-2023-014", dataEmiterii: "2026-02-18", perioadaFiscala: "2023",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Raport de audit", broadCategory: "documentatie-contabila", subFilter: null,
      confidenceExtraction: 96, confidenceCategorization: 97,
      observatieAI: "Raport final al misiunii de audit privind investițiile 2023 — constatări și recomandări către conducerea entității.",
      verificat: true, verificatManual: true, pageThumbnails: []
    },
    {
      id: "adoc_002", domain: "audit", missionId: "audit_0005", entityId: 1,
      filename: "fiap_control_intern_2023.pdf",
      uploadedAt: "2025-11-12T09:30:00", source: "upload", pagesCount: 6,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "FIAP", emitent: "Echipa de audit",
      numarDocument: "FIAP-014-3", dataEmiterii: "2025-11-10", perioadaFiscala: "2023",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Fișă de identificare", broadCategory: "documentatie-contabila", subFilter: null,
      confidenceExtraction: 91, confidenceCategorization: 90,
      observatieAI: "Fișă de identificare și analiză a problemei privind subsistemul de control intern managerial.",
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: "adoc_003", domain: "audit", missionId: "audit_0006", entityId: 1,
      filename: "raport_final_achizitii_2023.pdf",
      uploadedAt: "2025-08-28T15:45:00", source: "upload", pagesCount: 18,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Raport de audit", emitent: "Compartiment Audit Public Intern",
      numarDocument: "RA-2023-009", dataEmiterii: "2025-08-25", perioadaFiscala: "2023",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Raport de audit", broadCategory: "documentatie-contabila", subFilter: null,
      confidenceExtraction: 94, confidenceCategorization: 95,
      observatieAI: "Raport final al misiunii privind achizițiile publice 2023; punctaj de risc scăzut, fără iregularități majore.",
      verificat: true, verificatManual: true, pageThumbnails: []
    },
    {
      id: "adoc_004", domain: "audit", missionId: "audit_0002", entityId: 2,
      filename: "minuta_sedinta_deschidere.pdf",
      uploadedAt: "2026-02-05T10:00:00", source: "upload", pagesCount: 2,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Minută", emitent: "Spitalul Clinic Județean Cluj",
      numarDocument: "MIN-2024-02", dataEmiterii: "2026-02-03", perioadaFiscala: "2024",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Minută ședință", broadCategory: "necategorisit", subFilter: null,
      confidenceExtraction: 88, confidenceCategorization: 84,
      observatieAI: "Minuta ședinței de deschidere a misiunii de audit privind execuția bugetară 2024.",
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: "adoc_005", domain: "audit", missionId: "audit_0001", entityId: 1,
      filename: "ordin_serviciu_achizitii_2025.pdf",
      uploadedAt: "2026-03-21T08:15:00", source: "upload", pagesCount: 1,
      multiDoc: false, multiDocConfidence: null,
      tipDocument: "Ordin de serviciu", emitent: "Conducătorul compartimentului de audit",
      numarDocument: "OS-2025-031", dataEmiterii: "2026-03-20", perioadaFiscala: "2025",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Ordin de serviciu", broadCategory: "documentatie-contabila", subFilter: null,
      confidenceExtraction: 97, confidenceCategorization: 96,
      observatieAI: "Ordin de serviciu pentru misiunea de audit privind achizițiile publice 2025.",
      verificat: true, verificatManual: false, pageThumbnails: []
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

/* ============================================================
   Client-view scoping helpers + label mappers.
   In production these would be auth-scoped server queries; for
   the prototype, frontend filtering keyed on body--client view.
   ============================================================ */
(function () {
  'use strict';

  var CANVAS_CLIENT_ID = 1;
  window.SCRIPTICA_CANVAS_CLIENT_ID = CANVAS_CLIENT_ID;

  function isClientView() {
    return typeof window.getCurrentView === 'function' && window.getCurrentView() === 'client';
  }
  window.scripticaIsClientView = isClientView;

  window.getVisibleSituations = function () {
    var all = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.situations) || [];
    /* Situațiile sunt domeniul contabil → ascunse personelor fără 'contabil' în scope. */
    if (typeof window.viewInScope === 'function' && !window.viewInScope('contabil')) return [];
    if (!isClientView()) return all;
    return all.filter(function (s) { return s.clientId === CANVAS_CLIENT_ID; });
  };

  window.getVisibleClients = function () {
    var all = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.clients) || [];
    if (!isClientView()) return all;
    return all.filter(function (c) { return c.id === CANVAS_CLIENT_ID; });
  };

  /* Personas pe arie de acces — taguim anexele de audit cu domeniul 'audit'
     (id-uri anx_audit_* + anx_obiective_audit). Anexele contabile rămân
     netaguite = vizibile peste tot (decizie: untagged = peste tot).
     anx_criterii_risc / anx_punctaj_risc au deja categories:['audit']. */
  (function tagAuditAnexe() {
    var M = window.SCRIPTICA_MOCK;
    (M.anexeTypes || []).forEach(function (a) {
      var isAudit = /^anx_audit/.test(a.id) || a.id === 'anx_obiective_audit';
      if (isAudit && (!a.categories || !a.categories.length)) a.categories = ['audit'];
    });
  })();

  /* Biblioteca de anexe vizibilă pentru scope-ul persoanei curente
     (categories ∩ scope; netaguit = vizibil peste tot). */
  window.getVisibleAnexe = function () {
    var all = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.anexeTypes) || [];
    var scope = (typeof window.getViewScope === 'function') ? window.getViewScope() : ['contabil', 'audit'];
    return all.filter(function (a) {
      var cats = a.categories;
      if (!cats || !cats.length) return true;
      return cats.some(function (c) { return scope.indexOf(c) !== -1; });
    });
  };

  window.getVisibleDocuments = function () {
    var all = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.documents) || [];
    if (typeof window.getViewScope === 'function') {
      var scope = window.getViewScope();
      all = all.filter(function (d) { return scope.indexOf(d.domain || 'contabil') !== -1; });
    }
    if (!isClientView()) return all;
    var visibleSitIds = window.getVisibleSituations().map(function (s) { return s.id; });
    return all.filter(function (d) { return visibleSitIds.indexOf(d.situationId) !== -1; });
  };

  window.getVisibleMessages = function () {
    var all = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.messages) || [];
    /* Mesajele sunt legate de situații contabile → ascunse fără 'contabil' în scope. */
    if (typeof window.viewInScope === 'function' && !window.viewInScope('contabil')) return [];
    if (!isClientView()) return all;
    var canvas = ((window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.clients) || [])
      .find(function (c) { return c.id === CANVAS_CLIENT_ID; });
    var canvasName = canvas ? canvas.companyName : '';
    var visibleSitIds = window.getVisibleSituations().map(function (s) { return s.id; });
    return all.filter(function (m) {
      if (m.situationId && visibleSitIds.indexOf(m.situationId) === -1) return false;
      if (m.clientCompany && m.clientCompany !== canvasName) return false;
      return true;
    });
  };

  var CLIENT_STATUS_LABELS = {
    analiza:            'În procesare',
    asteapta_documente: 'Așteaptă documente de la dvs.',
    in_verificare:      'În procesare',
    in_intarziere:      'În întârziere',
    intarziere:         'În întârziere',
    finalizat:          'Finalizat',
    inchisa:            'Finalizat',
    anulata:            'Anulată'
  };

  window.getClientFriendlyStatus = function (internalStatus) {
    return CLIENT_STATUS_LABELS[internalStatus] || internalStatus;
  };

  window.getRequiredClientAction = function (situation) {
    if (!situation) return '—';
    if (situation.status === 'asteapta_documente') return 'Trimiteți documentele';
    if ((situation.status === 'intarziere' || situation.status === 'in_intarziere') &&
        (situation.currentStep === 1 || situation.currentStep === 'receptie')) {
      return 'Trimiteți documentele urgent';
    }
    return '—';
  };

  var ROMANIAN_MONTHS = [
    'Ianuarie', 'Februarie', 'Martie',  'Aprilie',
    'Mai',      'Iunie',     'Iulie',   'August',
    'Septembrie','Octombrie','Noiembrie','Decembrie'
  ];

  window.formatRomanianMonth = function (iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    if (parts.length < 2) return iso;
    var monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx < 0 || monthIdx > 11) return iso;
    return ROMANIAN_MONTHS[monthIdx] + ' ' + parts[0];
  };
})();
