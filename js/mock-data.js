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
      },
      {
        id: "cli_constructa", name: "ConstructA Group S.R.L.", domain: "Firmă de construcții", clientTypeId: "ct_constructii",
        instance: "constructa.scriptica.ro", users: 5, enrolled: "10.06.2026",
        tier: "plus", contract: "activ", aiLoad: 21,
        commercial: { plan: "Plus", renew: "10.06.2027", billing: "Anual · 4.800 RON", lastPay: "10.06.2026" },
        flags: [
          { name: "Sortare automată A.I.", tier: "Plus", on: true },
          { name: "Mesaje smart", tier: "Plus", on: true },
          { name: "Constructor de Anexe", tier: "Standard", on: true },
          { name: "Vertical Audit", tier: "Enterprise", on: false },
          { name: "Backup local", tier: "Plus · add-on", on: false }
        ],
        technical: {
          vmLoad: [18, 24, 30, 26, 44, 36, 22, 16], vmPeakIdx: 4,
          aiPerMonth: "310", docsStored: "1.4k", uptime30: 99.97, lastIncident: "acum 12 zile"
        },
        downtime: { incidents: [] }
      }
    ],

    /* ============================================================
       Registrul de fluxuri (HQ) — două straturi:
       1. flowVerticals — verticale (categorii de fluxuri) care definesc
          vocabularul de categorii și tipuri de documente. Pașii aparțin
          exclusiv șabloanelor de flux. Cele `builtin` sunt Situații Contabile și Misiuni de
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
        id: "vert_contabil", domain: "contabil", builtin: true, status: "activ", color: "albastru",
        name: "Situații Contabile", icon: "fact_check",
        itemLabel: "Situație", itemLabelPlural: "Situații",
        description: "Categoria fluxurilor contabile recurente și vocabularul documentelor folosite în ele.",
        documentFilters: [{ id: "bonuri", label: "Bonuri" }, { id: "ue", label: "UE" }, { id: "non-ue", label: "Non-UE" }],
        defaultDocumentCategoryIds: ["intrare", "iesire", "salarizare", "necategorisit"],
        documentCategories: [
          { id: "intrare", name: "Intrare", documentTypes: [
            { id: "dt_factura_furnizor", name: "Factură furnizor" }, { id: "dt_bon_fiscal", name: "Bon fiscal" },
            { id: "dt_nir", name: "NIR" }, { id: "dt_aviz_pv", name: "Aviz / Proces verbal" },
            { id: "dt_extras_cont", name: "Extras de cont" }, { id: "dt_registru_casa", name: "Registru de casă" }
          ] },
          { id: "iesire", name: "Ieșire", documentTypes: [
            { id: "dt_factura_emisa", name: "Factură emisă" }, { id: "dt_foaie_parcurs", name: "Foaie de parcurs" }
          ] },
          { id: "salarizare", name: "Salarizare", documentTypes: [
            { id: "dt_stat_salarii", name: "Ștat de salarii" }, { id: "dt_document_hr", name: "Document HR" }
          ] },
          { id: "documentatie_contabila", name: "Documentație contabilă", documentTypes: [
            { id: "dt_declaratie_fiscala", name: "Declarație fiscală" }, { id: "dt_balanta", name: "Balanță de verificare" },
            { id: "dt_registru_imobilizari", name: "Registru imobilizări" }, { id: "dt_situatia_stocurilor", name: "Situația stocurilor" }
          ] },
          { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
        ],
        pages: { list: "situatii.html" }
      },
      {
        id: "vert_audit", domain: "audit", builtin: true, status: "activ", color: "auriu",
        name: "Misiuni de Audit", icon: "verified_user",
        itemLabel: "Misiune", itemLabelPlural: "Misiuni",
        description: "Categoria misiunilor de audit public intern și vocabularul documentelor de audit.",
        documentFilters: [],
        documentCategories: [
          { id: "planificare_audit", name: "Planificare", documentTypes: [
            { id: "dt_ordin_serviciu", name: "Ordin de serviciu" }, { id: "dt_notificare_audit", name: "Notificare misiune" },
            { id: "dt_program_misiune", name: "Program de misiune" }
          ] },
          { id: "documente_lucru", name: "Documente de lucru", documentTypes: [
            { id: "dt_minuta", name: "Minută" }, { id: "dt_fiap", name: "FIAP" }, { id: "dt_fcri", name: "FCRI" }
          ] },
          { id: "rapoarte_audit", name: "Rapoarte", documentTypes: [{ id: "dt_raport_audit", name: "Raport de audit" }] },
          { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
        ],
        pages: { list: "misiuni-audit.html" }
      },
      {
        id: "vert_consultanta", domain: "consultanta", builtin: false, status: "activ", color: "verde",
        name: "Consultanță Fiscală", icon: "balance",
        itemLabel: "Dosar", itemLabelPlural: "Dosare",
        description: "Categoria dosarelor de consultanță fiscală și vocabularul documentelor folosite în ele.",
        documentFilters: [{ id: "ue", label: "UE" }, { id: "non-ue", label: "Non-UE" }],
        documentCategories: [
          { id: "primite", name: "Primite de la client", documentTypes: [
            { id: "dt_solicitare_client", name: "Solicitare client" }, { id: "dt_contract", name: "Contract" },
            { id: "dt_factura_servicii", name: "Factură servicii" }, { id: "dt_corespondenta", name: "E-mail de transmitere" }
          ] },
          { id: "documentare", name: "Documentare", documentTypes: [
            { id: "dt_legislatie", name: "Legislație și practică" }, { id: "dt_document_suport", name: "Document suport" }
          ] },
          { id: "livrabile", name: "Livrabile", documentTypes: [{ id: "dt_opinie_fiscala", name: "Opinie fiscală" }] },
          { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
        ]
      },
      {
        id: "vert_constructii", domain: "constructii", builtin: false, status: "activ", color: "portocaliu",
        name: "Proiecte", icon: "construction",
        itemLabel: "Proiect", itemLabelPlural: "Proiecte",
        description: "Categoria proiectelor de construcții și vocabularul documentelor folosite în fluxurile lor.",
        documentFilters: [],
        documentCategories: [
          { id: "licitatie", name: "Licitație", documentTypes: [
            { id: "dt_propunere_tehnica", name: "Propunere tehnică" }, { id: "dt_oferta_financiara", name: "Ofertă financiară" },
            { id: "dt_caiet_sarcini", name: "Caiet de sarcini" }
          ] },
          { id: "contracte", name: "Contracte", documentTypes: [{ id: "dt_contract_executie", name: "Contract de execuție" }] },
          { id: "executie", name: "Execuție", documentTypes: [
            { id: "dt_pv_receptie", name: "Proces verbal de recepție" }, { id: "dt_pv_nereguli", name: "Proces verbal de constatare a neregulilor" },
            { id: "dt_nota_fundamentare", name: "Notă de fundamentare" }, { id: "dt_situatie_lucrari", name: "Situație de lucrări" },
            { id: "dt_deviz", name: "Deviz" }
          ] },
          { id: "corespondenta", name: "Corespondență", documentTypes: [{ id: "dt_corespondenta", name: "E-mail de transmitere" }] },
          { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
        ]
      }
    ],

    flowTemplates: [
      /* — contabil (oglinda șabloanelor standard provisionate la clienți) — */
      { id: "ft_raport_lunar", verticalId: "vert_contabil", name: "Raport Lunar", frequency: "lunar", status: "activ",
        description: "Raport contabil lunar complet: înregistrare documente, închidere balanță și rapoarte.",
        documentCategoryIds: ["intrare", "iesire", "salarizare", "documentatie_contabila", "necategorisit"],
        steps: [
          { name: "Recepție documente", offsetDays: 10 },
          { name: "Verificare documente", offsetDays: 20 },
          { name: "Validare și închidere", offsetDays: 30 }
        ] },
      { id: "ft_jurnal_tva", verticalId: "vert_contabil", name: "Jurnal TVA", frequency: "lunar", status: "activ",
        description: "Jurnal de TVA cu verificarea corelațiilor D300 ↔ D394.",
        documentCategoryIds: ["intrare", "iesire", "documentatie_contabila", "necategorisit"],
        steps: [
          { name: "Recepție documente", offsetDays: 7 },
          { name: "Verificare documente", offsetDays: 14 },
          { name: "Validare și închidere", offsetDays: 25 }
        ] },
      { id: "ft_salarizari", verticalId: "vert_contabil", name: "Salarizări", frequency: "lunar", status: "activ",
        description: "Calcul salarii, ștat de plată și declarația D112.",
        documentCategoryIds: ["intrare", "salarizare", "documentatie_contabila", "necategorisit"],
        steps: [
          { name: "Recepție documente", offsetDays: 5 },
          { name: "Verificare documente", offsetDays: 10 },
          { name: "Validare și închidere", offsetDays: 15 }
        ] },
      { id: "ft_declaratii_trim", verticalId: "vert_contabil", name: "Declarații Trimestriale", frequency: "trimestrial", status: "activ",
        description: "Declarații fiscale trimestriale (D100, D101).",
        documentCategoryIds: ["intrare", "documentatie_contabila", "necategorisit"],
        steps: [
          { name: "Recepție documente", offsetDays: 30 },
          { name: "Verificare documente", offsetDays: 60 },
          { name: "Validare și închidere", offsetDays: 85 }
        ] },
      /* — audit — */
      { id: "ft_audit_regularitate", verticalId: "vert_audit", name: "Misiune de audit de regularitate", frequency: "anual", status: "activ",
        description: "Misiune de audit public intern de regularitate, structurată pe etapele legale ale misiunii.",
        documentCategoryIds: ["planificare_audit", "documente_lucru", "rapoarte_audit", "necategorisit"],
        steps: [
          { name: "Pregătirea misiunii", offsetDays: 15 },
          { name: "Intervenția la fața locului", offsetDays: 45 },
          { name: "Raportarea rezultatelor", offsetDays: 90 },
          { name: "Urmărirea recomandărilor", offsetDays: 180 }
        ] },
      { id: "ft_audit_risc", verticalId: "vert_audit", name: "Evaluarea riscurilor (Anexa 9)", frequency: "anual", status: "activ",
        description: "Evaluarea riscurilor cu punctaj derivat automat (Probabilitate × Impact × Pondere).",
        documentCategoryIds: ["planificare_audit", "documente_lucru", "rapoarte_audit", "necategorisit"],
        steps: [
          { name: "Evaluarea riscurilor", offsetDays: 20 },
          { name: "Ierarhizare și raport", offsetDays: 40 }
        ] },
      /* — consultanță fiscală (verticală custom, motor generic) — */
      { id: "ft_consult_opinie", verticalId: "vert_consultanta", name: "Opinie fiscală punctuală", frequency: "punctual", status: "activ",
        description: "Opinie scrisă pe o speță fiscală punctuală, cu documentare și livrare către client.",
        documentCategoryIds: ["primite", "documentare", "livrabile", "necategorisit"],
        steps: [
          { id: "ft_consult_opinie_step_1", name: "Analiza solicitării", offsetDays: 3,
            tasks: [
              { id: "ft_consult_opinie_step_1_task_1", label: "Înregistrează întrebarea fiscală", required: true },
              { id: "ft_consult_opinie_step_1_task_2", label: "Confirmă obiectivul și perioada analizată", required: true },
              { id: "ft_consult_opinie_step_1_task_3", label: "Solicită documentele lipsă", required: false }
            ],
            anexeIds: ["anx_consult_fisa_speta"] },
          { id: "ft_consult_opinie_step_2", name: "Documentare și redactare opinie", offsetDays: 10,
            tasks: [
              { id: "ft_consult_opinie_step_2_task_1", label: "Verifică legislația și practica relevante", required: true },
              { id: "ft_consult_opinie_step_2_task_2", label: "Analizează documentele justificative", required: true },
              { id: "ft_consult_opinie_step_2_task_3", label: "Redactează proiectul opiniei", required: true },
              { id: "ft_consult_opinie_step_2_task_4", label: "Solicită revizie internă", required: false }
            ],
            anexeIds: ["anx_consult_analiza", "anx_consult_proiect_opinie"] },
          { id: "ft_consult_opinie_step_3", name: "Livrare și follow-up", offsetDays: 15,
            tasks: [
              { id: "ft_consult_opinie_step_3_task_1", label: "Validează opinia finală", required: true },
              { id: "ft_consult_opinie_step_3_task_2", label: "Transmite opinia clientului", required: true },
              { id: "ft_consult_opinie_step_3_task_3", label: "Înregistrează întrebările de follow-up", required: false }
            ],
            anexeIds: ["anx_consult_validare_livrare"] }
        ] },
      { id: "ft_consult_retainer", verticalId: "vert_consultanta", name: "Consultanță lunară (retainer)", frequency: "lunar", status: "activ",
        description: "Pachet lunar de consultanță: colectarea spețelor, răspunsuri consolidate și sinteză de final de lună.",
        documentCategoryIds: ["primite", "documentare", "livrabile", "necategorisit"],
        steps: [
          { id: "ft_consult_retainer_step_1", name: "Analiza solicitării", offsetDays: 5,
            tasks: [
              { id: "ft_consult_retainer_step_1_task_1", label: "Centralizează solicitările lunii", required: true },
              { id: "ft_consult_retainer_step_1_task_2", label: "Prioritizează spețele urgente", required: true }
            ], anexeIds: ["anx_consult_fisa_speta"] },
          { id: "ft_consult_retainer_step_2", name: "Documentare și redactare opinie", offsetDays: 18,
            tasks: [
              { id: "ft_consult_retainer_step_2_task_1", label: "Documentează fiecare speță", required: true },
              { id: "ft_consult_retainer_step_2_task_2", label: "Redactează răspunsurile consolidate", required: true },
              { id: "ft_consult_retainer_step_2_task_3", label: "Solicită revizie internă", required: false }
            ], anexeIds: ["anx_consult_analiza"] },
          { id: "ft_consult_retainer_step_3", name: "Livrare și follow-up", offsetDays: 25,
            tasks: [
              { id: "ft_consult_retainer_step_3_task_1", label: "Transmite sinteza lunară", required: true },
              { id: "ft_consult_retainer_step_3_task_2", label: "Confirmă închiderea solicitărilor", required: true }
            ], anexeIds: ["anx_consult_validare_livrare"] }
        ] },
      /* — construcții (verticală custom cu O SINGURĂ etapă — proiecte per stadiu) — */
      { id: "ft_constr_ofertare", verticalId: "vert_constructii", name: "Ofertare licitație publică", frequency: "punctual", status: "activ",
        description: "Stadiul 1 — precontractare: propunere tehnică și ofertă financiară, generate din bibliotecă sau încărcate manual.",
        documentCategoryIds: ["licitatie", "corespondenta", "necategorisit"],
        steps: [
          { id: "ft_constr_ofertare_step_1", name: "Lucru", offsetDays: 20,
            tasks: [
              { id: "ft_constr_ofertare_step_1_task_1", label: "Verifică documentația de atribuire", required: true },
              { id: "ft_constr_ofertare_step_1_task_2", label: "Pregătește propunerea tehnică", required: true },
              { id: "ft_constr_ofertare_step_1_task_3", label: "Validează oferta financiară", required: true }
            ], anexeIds: ["anx_constr_propunere"] }
        ] },
      { id: "ft_constr_contractare", verticalId: "vert_constructii", name: "Contractare", frequency: "punctual", status: "activ",
        description: "Stadiul 2 — semnarea contractului după câștigarea licitației: generat în aplicație sau încărcat semnat.",
        documentCategoryIds: ["contracte", "corespondenta", "necategorisit"],
        steps: [
          { id: "ft_constr_contractare_step_1", name: "Lucru", offsetDays: 15,
            tasks: [
              { id: "ft_constr_contractare_step_1_task_1", label: "Verifică forma finală a contractului", required: true },
              { id: "ft_constr_contractare_step_1_task_2", label: "Obține semnăturile părților", required: true }
            ], anexeIds: ["anx_constr_contract"] }
        ] },
      { id: "ft_constr_executie", verticalId: "vert_constructii", name: "Execuție lucrări", frequency: "punctual", status: "activ",
        description: "Stadiul 3 — desfășurarea lucrărilor: PV-uri de recepție, constatare nereguli și note de fundamentare, pe măsura execuției.",
        documentCategoryIds: ["executie", "corespondenta", "necategorisit"],
        steps: [
          { id: "ft_constr_executie_step_1", name: "Lucru", offsetDays: 90,
            tasks: [
              { id: "ft_constr_executie_step_1_task_1", label: "Actualizează stadiul lucrărilor", required: true },
              { id: "ft_constr_executie_step_1_task_2", label: "Înregistrează procesele-verbale", required: true },
              { id: "ft_constr_executie_step_1_task_3", label: "Documentează abaterile și justificările", required: false }
            ], anexeIds: ["anx_constr_pv_receptie", "anx_constr_nota_fundamentare"] }
        ] },
      { id: "ft_constr_complet", verticalId: "vert_constructii", name: "Proiect complet — ofertare și execuție", frequency: "punctual", status: "activ",
        description: "Flux demonstrativ cap-coadă: pașii combină task-uri obișnuite, încărcări obligatorii de documente și anexe reutilizabile.",
        documentCategoryIds: ["licitatie", "contracte", "executie", "corespondenta", "necategorisit"],
        steps: [
          { id: "ft_constr_complet_step_1", name: "Pregătirea ofertei", offsetDays: 15,
            description: "Echipa pregătește oferta și completează propunerea tehnică.",
            tasks: [
              { id: "ft_constr_complet_step_1_task_1", label: "Verifică documentația de atribuire", kind: "standard", required: true },
              { id: "ft_constr_complet_step_1_task_2", label: "Validează oferta financiară", kind: "standard", required: true }
            ], anexeIds: ["anx_constr_propunere"] },
          { id: "ft_constr_complet_step_2", name: "Documentație justificativă", offsetDays: 25,
            description: "Documentele justificative sunt încărcate și legate direct de proiect.",
            tasks: [
              { id: "ft_constr_complet_step_2_task_1", label: "Încarcă documentația tehnică și caietul de sarcini", kind: "document_upload", documentTypeId: "dt_caiet_sarcini", allowMultiple: true, minimumFiles: 1, required: true },
              { id: "ft_constr_complet_step_2_task_2", label: "Confirmă că documentația este completă", kind: "standard", required: true }
            ], anexeIds: ["anx_constr_nota_fundamentare"] },
          { id: "ft_constr_complet_step_3", name: "Contractare", offsetDays: 40,
            description: "Contractul se completează în Scriptica; anexa este singura cerință obligatorie a pasului.",
            tasks: [], anexeIds: ["anx_constr_contract"] },
          { id: "ft_constr_complet_step_4", name: "Urmărirea execuției", offsetDays: 75,
            description: "Situațiile de lucrări sunt încărcate periodic, fără anexă obligatorie.",
            tasks: [
              { id: "ft_constr_complet_step_4_task_1", label: "Încarcă situațiile de lucrări aprobate", kind: "document_upload", documentTypeId: "dt_situatie_lucrari", allowMultiple: true, minimumFiles: 1, required: true }
            ], anexeIds: [] },
          { id: "ft_constr_complet_step_5", name: "Recepția lucrării", offsetDays: 100,
            description: "Procesul-verbal semnat și anexa de recepție închid proiectul.",
            tasks: [
              { id: "ft_constr_complet_step_5_task_1", label: "Încarcă procesul-verbal semnat", kind: "document_upload", documentTypeId: "dt_pv_receptie", allowMultiple: false, minimumFiles: 1, required: true }
            ], anexeIds: ["anx_constr_pv_receptie"] }
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
      },
      {
        id: "ct_constructii", name: "Firmă de construcții", icon: "apartment", builtin: false,
        description: "Firme de construcții — lucrează pe ofertare, contractare și execuție, ca activități independente sau într-un proiect complet cu task-uri, documente și anexe.",
        verticalIds: ["vert_constructii"],
        defaultTemplateIds: ["ft_constr_ofertare", "ft_constr_contractare", "ft_constr_executie", "ft_constr_complet"],
        clientLabel: "Beneficiar", clientLabelPlural: "Beneficiari",
        dashboardLayout: [
          { id: "dw_ct5_1", widget: "flow_summary", params: { verticalId: "vert_constructii" }, size: "half" },
          { id: "dw_ct5_2", widget: "termene", size: "half" },
          { id: "dw_ct5_3", widget: "clienti", size: "full" },
          { id: "dw_ct5_4", widget: "arhiva_recente", params: {}, size: "half" },
          { id: "dw_ct5_5", widget: "echipa", size: "half" }
        ],
        archiveTree: [
          { id: "af_ct5_licitatie", name: "Documentație licitație", docTypeIds: ["dt_propunere_tehnica", "dt_oferta_financiara", "dt_caiet_sarcini"], children: [] },
          { id: "af_ct5_contracte", name: "Contracte", docTypeIds: ["dt_contract_executie"], children: [] },
          { id: "af_ct5_executie", name: "Execuție", docTypeIds: ["dt_pv_receptie", "dt_pv_nereguli", "dt_nota_fundamentare", "dt_situatie_lucrari", "dt_deviz"], children: [] },
          { id: "af_ct5_coresp", name: "Corespondență", docTypeIds: ["dt_corespondenta"], children: [] },
          { id: "af_ct5_necat", name: "Necategorisit", system: true, docTypeIds: [], children: [] }
        ]
      }
    ]
  },

  /* Catalog de compatibilitate pentru structurile de arhivă istorice.
     Sursa canonică a vocabularului A.I. este acum `flowVerticals[].documentCategories`;
     lista plată rămâne pentru id-urile deja salvate în `archiveTree`. */
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
    { id: "dt_propunere_tehnica", name: "Propunere tehnică", domain: "constructii" },
    { id: "dt_oferta_financiara", name: "Ofertă financiară", domain: "constructii" },
    { id: "dt_caiet_sarcini", name: "Caiet de sarcini", domain: "constructii" },
    { id: "dt_contract_executie", name: "Contract de execuție", domain: "constructii" },
    { id: "dt_pv_receptie", name: "Proces verbal de recepție", domain: "constructii" },
    { id: "dt_pv_nereguli", name: "Proces verbal de constatare a neregulilor", domain: "constructii" },
    { id: "dt_nota_fundamentare", name: "Notă de fundamentare", domain: "constructii" },
    { id: "dt_situatie_lucrari", name: "Situație de lucrări", domain: "constructii" },
    { id: "dt_deviz", name: "Deviz", domain: "constructii" },
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
      status: "in_verificare", responsibleIds: [6, 2],
      clientContact: "Radu Stan"
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
    },
    /* — construcții: proiecte cu un singur pas, per stadiu — */
    {
      id: "fi_0005", verticalId: "vert_constructii", domain: "constructii",
      name: "Ofertare — Reabilitare școală gimnazială nr. 4",
      clientName: "Primăria Orașului Otopeni",
      templateId: "ft_constr_ofertare", templateName: "Ofertare licitație publică",
      startDate: "2026-04-12", currentStep: 1, stepsCompleted: 0,
      status: "analiza", responsibleIds: [2, 3]
    },
    {
      id: "fi_0006", verticalId: "vert_constructii", domain: "constructii",
      name: "Contractare — Hală logistică Chitila",
      clientName: "Logistic Park S.R.L.",
      templateId: "ft_constr_contractare", templateName: "Contractare",
      startDate: "2026-04-10", currentStep: 1, stepsCompleted: 0,
      status: "in_verificare", responsibleIds: [2]
    },
    {
      id: "fi_0007", verticalId: "vert_constructii", domain: "constructii",
      name: "Execuție — Reabilitare acoperiș Hala B",
      clientName: "Industrial Est S.A.",
      templateId: "ft_constr_executie", templateName: "Execuție lucrări",
      startDate: "2026-03-01", currentStep: 1, stepsCompleted: 0,
      status: "analiza", responsibleIds: [3, 4]
    },
    {
      id: "fi_0008", verticalId: "vert_constructii", domain: "constructii",
      name: "Execuție — Bloc de locuințe Str. Teiului 12",
      clientName: "Rezidențial Nord S.R.L.",
      templateId: "ft_constr_executie", templateName: "Execuție lucrări",
      startDate: "2026-01-05", currentStep: 1, stepsCompleted: 0,
      status: "in_verificare", responsibleIds: [2, 4]
    },
    {
      id: "fi_0009", verticalId: "vert_constructii", domain: "constructii",
      name: "Ofertare — Extindere sediu administrativ",
      clientName: "Consiliul Local Măgurele",
      templateId: "ft_constr_ofertare", templateName: "Ofertare licitație publică",
      startDate: "2026-03-10", currentStep: 1, stepsCompleted: 1,
      status: "finalizat", responsibleIds: [3]
    },
    {
      id: "fi_0010", verticalId: "vert_constructii", domain: "constructii",
      name: "Proiect complet — Modernizare centru comunitar",
      clientName: "Primăria Municipiului Brașov",
      templateId: "ft_constr_complet", templateName: "Proiect complet — ofertare și execuție",
      startDate: "2026-04-05", currentStep: 2, stepsCompleted: 1,
      status: "asteapta_documente", responsibleIds: [2, 3],
      clientContact: "Andrei Munteanu"
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
    /* — consultanță fiscală: anexe configurate pe pașii fluxului — */
    {
      id: "anx_consult_fisa_speta",
      name: "Fișă de încadrare a speței fiscale",
      status: "activ",
      updatedAt: "2026-04-20",
      categories: ["consultanta"],
      schema: { fields: [
        { type: "section_title", text: "Solicitarea clientului" },
        { type: "text_short", label: "Întrebarea fiscală", required: true, help: "Formulează clar problema care trebuie analizată.", maxLength: 180 },
        { type: "text_long", label: "Context și situație de fapt", required: true, help: "", rows: 4 },
        { type: "date", label: "Data de referință a analizei", required: true, help: "" },
        { type: "document_picker", label: "Documente inițiale", required: false, help: "", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },
    {
      id: "anx_consult_analiza",
      name: "Fișă de analiză fiscală",
      status: "activ",
      updatedAt: "2026-04-20",
      categories: ["consultanta"],
      schema: { fields: [
        { type: "section_title", text: "Analiza speței" },
        { type: "dropdown", label: "Domeniu fiscal", required: true, help: "", options: ["TVA", "Impozit pe profit", "Impozit pe venit", "Accize", "Procedură fiscală"] },
        { type: "text_long", label: "Situația de fapt verificată", required: true, help: "", rows: 4 },
        { type: "text_long", label: "Temeiuri legale aplicabile", required: true, help: "", rows: 4 },
        { type: "checkboxes", label: "Surse consultate", required: true, help: "", options: ["Codul fiscal", "Norme metodologice", "Jurisprudență", "Ghiduri ANAF", "Documentele clientului"] },
        { type: "text_long", label: "Riscuri și interpretări alternative", required: false, help: "", rows: 3 }
      ] }
    },
    {
      id: "anx_consult_proiect_opinie",
      name: "Proiectul opiniei fiscale",
      status: "activ",
      updatedAt: "2026-04-20",
      categories: ["consultanta"],
      schema: { fields: [
        { type: "section_title", text: "Concluzia consultantului" },
        { type: "text_long", label: "Concluzie recomandată", required: true, help: "", rows: 4 },
        { type: "text_long", label: "Argumentație", required: true, help: "", rows: 6 },
        { type: "radio", label: "Revizie internă", required: true, help: "", options: ["De revizuit", "Revizuită — fără observații", "Revizuită — cu observații integrate"] },
        { type: "file_upload", label: "Document de lucru", required: false, help: "", multi: false, maxSizeMB: 10, allowedTypes: "PDF, DOCX" }
      ] }
    },
    {
      id: "anx_consult_validare_livrare",
      name: "Validare și livrare opinie",
      status: "activ",
      updatedAt: "2026-04-20",
      categories: ["consultanta"],
      schema: { fields: [
        { type: "banner", variant: "info", text: "Confirmă forma finală și transmiterea opiniei către client." },
        { type: "boolean", label: "Opinia finală a fost validată", required: true, help: "" },
        { type: "date", label: "Data transmiterii către client", required: true, help: "" },
        { type: "text_long", label: "Întrebări de follow-up", required: false, help: "", rows: 3 }
      ] }
    },
    /* — construcții: biblioteca de formulare a domeniului — */
    {
      id: "anx_constr_propunere",
      name: "Propunere tehnică (licitație)",
      status: "activ",
      updatedAt: "2026-04-15",
      categories: ["constructii"],
      schema: { fields: [
        { type: "section_title", text: "Date licitație" },
        { type: "text_short", label: "Denumirea procedurii", required: true, help: "", maxLength: 120 },
        { type: "text_short", label: "Autoritatea contractantă", required: true, help: "", maxLength: 120 },
        { type: "date", label: "Termen de depunere", required: true, help: "" },
        { type: "divider" },
        { type: "section_title", text: "Soluția tehnică" },
        { type: "text_long", label: "Descrierea soluției tehnice", required: true, help: "" },
        { type: "text_long", label: "Metodologia de execuție", required: false, help: "" },
        { type: "number", label: "Durata de execuție (zile)", required: true, help: "" },
        { type: "file_upload", label: "Planșe / schițe anexate", required: false, help: "", multi: true, maxSizeMB: 10, allowedTypes: "PDF, JPG, PNG, DWG" }
      ] }
    },
    {
      id: "anx_constr_contract",
      name: "Contract de execuție lucrări",
      status: "activ",
      updatedAt: "2026-04-15",
      categories: ["constructii"],
      schema: { fields: [
        { type: "section_title", text: "Părțile contractante" },
        { type: "text_short", label: "Beneficiar", required: true, help: "", maxLength: 120 },
        { type: "text_short", label: "Executant", required: true, help: "", maxLength: 120 },
        { type: "date", label: "Data semnării", required: true, help: "" },
        { type: "divider" },
        { type: "section_title", text: "Obiectul și valoarea" },
        { type: "text_long", label: "Obiectul contractului", required: true, help: "" },
        { type: "currency", label: "Valoarea contractului (fără TVA)", required: true, currency: "RON", help: "" },
        { type: "number", label: "Durata de execuție (luni)", required: false, help: "" },
        { type: "boolean", label: "Garanție de bună execuție constituită", required: false, help: "" }
      ] }
    },
    {
      id: "anx_constr_pv_receptie",
      name: "Proces verbal de recepție",
      status: "activ",
      updatedAt: "2026-04-15",
      categories: ["constructii"],
      schema: { fields: [
        { type: "section_title", text: "Identificarea lucrării" },
        { type: "text_short", label: "Obiectivul / lucrarea", required: true, help: "", maxLength: 120 },
        { type: "date", label: "Data recepției", required: true, help: "" },
        { type: "text_long", label: "Comisia de recepție (membri)", required: false, help: "" },
        { type: "divider" },
        { type: "dropdown", label: "Rezultatul recepției", required: true, help: "", options: ["Admisă", "Admisă cu obiecții", "Amânată", "Respinsă"] },
        { type: "text_long", label: "Observații / obiecții", required: false, help: "" },
        { type: "file_upload", label: "Documente atașate (foto, măsurători)", required: false, help: "", multi: true, maxSizeMB: 10, allowedTypes: "PDF, JPG, PNG" }
      ] }
    },
    {
      id: "anx_constr_nota_fundamentare",
      name: "Notă de fundamentare — refacere deviz",
      status: "activ",
      updatedAt: "2026-04-15",
      categories: ["constructii"],
      schema: { fields: [
        { type: "section_title", text: "Lucrarea" },
        { type: "text_short", label: "Lucrarea / obiectivul", required: true, help: "", maxLength: 120 },
        { type: "text_long", label: "Motivul refacerii devizului de cantități", required: true, help: "" },
        { type: "divider" },
        { type: "section_title", text: "Impact" },
        { type: "currency", label: "Valoare deviz inițial", required: true, currency: "RON", help: "" },
        { type: "currency", label: "Valoare deviz refăcut", required: true, currency: "RON", help: "" },
        { type: "text_long", label: "Impact asupra termenului de execuție", required: false, help: "" }
      ] }
    },
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
    /* Dosarul demonstrativ de consultanță: analiza este completă,
       proiectul opiniei rămâne intenționat incomplet pentru gating. */
    "fi_0001::anx_consult_analiza": {
      values: {
        "1": "TVA",
        "2": "Electro Distrib S.R.L. achiziționează servicii de consultanță de la un furnizor stabilit în afara României.",
        "3": "Art. 278 alin. (2) și art. 307 alin. (2) din Codul fiscal; regulile privind taxarea inversă.",
        "4": ["Codul fiscal", "Norme metodologice", "Documentele clientului"],
        "5": "De confirmat locul prestării pentru serviciile accesorii."
      },
      updatedAt: "2026-04-19",
      completedByName: "Pavel Romanovici"
    },
    "fi_0001::anx_consult_proiect_opinie": {
      values: {
        "1": "Serviciile sunt impozabile în România prin mecanismul taxării inverse.",
        "2": "Beneficiarul român evidențiază TVA colectată și deductibilă, cu respectarea condițiilor generale de deducere."
      },
      updatedAt: "2026-04-20",
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
    { id: "fiscal", label: "Fiscal" },
    { id: "consultanta", label: "Consultanță fiscală" },
    { id: "constructii", label: "Construcții" }
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
    /* ---- Conversația dosarului demonstrativ de consultanță ---- */
    {
      id: 201,
      situationId: "fi_0001",
      clientCompany: "Electro Distrib S.R.L.",
      clientContact: "Radu Stan",
      sender: "client",
      senderName: "Radu Stan",
      date: "2026-04-14",
      body: "Vă trimit contractul și factura furnizorului extern. Avem nevoie să confirmăm tratamentul TVA înainte de depunerea decontului.",
      attachments: [ { count: 2, label: "documente la opinia fiscală" } ],
      chips: [ { label: "2x Primite", style: "neutral" } ],
      read: true
    },
    {
      id: 202,
      situationId: "fi_0001",
      clientCompany: "Electro Distrib S.R.L.",
      clientContact: "Radu Stan",
      sender: "system", subtype: "step_completion",
      date: "2026-04-15",
      stepCompleted: 1, stepName: "Analiza solicitării",
      completedBy: "Pavel Romanovici",
      completedAt: "2026-04-15T10:20:00",
      summary: "Pasul 1 finalizat. Obiectivul analizei și documentele de intrare au fost confirmate cu clientul.",
      read: true
    },
    {
      id: 203,
      situationId: "fi_0001",
      clientCompany: "Electro Distrib S.R.L.",
      clientContact: "Radu Stan",
      sender: "internal",
      senderName: "Cristina Popescu",
      date: "2026-04-18",
      body: "Am verificat încadrarea serviciilor. Te rog să confirmi dacă factura include și servicii accesorii; poate schimba argumentația din proiect.",
      attachments: [],
      chips: [],
      read: true
    },
    {
      id: 204,
      situationId: "fi_0001",
      clientCompany: "Electro Distrib S.R.L.",
      clientContact: "Radu Stan",
      sender: "ai",
      senderName: "Mesaj Automat Scriptica A.I.",
      date: "2026-04-20",
      body: "Pasul 2 — Documentare și redactare opinie este în lucru. Proiectul opiniei are un câmp obligatoriu necompletat: Revizie internă.",
      attachments: [],
      chips: [],
      read: false,
      channels: ["email"]
    },
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

/* ============================================================
   PMB — Primăria Municipiului București (2026-08-18)
   Un client Scriptica de tip „Instituție publică": persona
   `pmb_intern` (Utilizator Intern PMB) vede DOAR acest cont —
   cinci verticale contractate (Resurse Umane, Achiziții Publice,
   Investiții și Lucrări, Solicitări Externe, Solicitări Interne),
   fiecare cu șabloane în limbaj administrativ, vocabular propriu de
   documente și arhivă organizată după nomenclatorul arhivistic
   (Direcție → An → Lună → indicativ X.a.1). Datele sunt seed; nimic
   de aici nu apare pentru personele firmei de contabilitate.
   ============================================================ */
(function seedPmbInstitution() {
  var M = window.SCRIPTICA_MOCK;
  var SA = M.superAdmin;
  var TODAY_ISO = '2026-04-20';

  /* ---- Angajații PMB (înlocuiesc echipa firmei când persona e pmb_intern) ---- */
  M.pmb = {
    currentUserId: 501,
    institution: 'Primăria Municipiului București',
    employees: [
      { id: 501, name: "Mihai Dumitrescu",  role: "Consilier superior · Direcția Managementul Resurselor Umane", avatarId: 68, email: "mihai.dumitrescu@pmb.ro",  username: "mihai.dumitrescu",  status: "activ" },
      { id: 502, name: "Elena Radu",        role: "Șef serviciu · Serviciul Recrutare și Evaluare",            avatarId: 45, email: "elena.radu@pmb.ro",        username: "elena.radu",        status: "activ" },
      { id: 503, name: "Andrei Constantin", role: "Consilier achiziții publice · Direcția Generală Achiziții",  avatarId: 53, email: "andrei.constantin@pmb.ro", username: "andrei.constantin", status: "activ" },
      { id: 504, name: "Ioana Petrescu",    role: "Șef birou · Direcția Generală Investiții",                  avatarId: 26, email: "ioana.petrescu@pmb.ro",    username: "ioana.petrescu",    status: "activ" },
      { id: 505, name: "Cristian Nicolae",  role: "Inspector · Direcția Relații cu Publicul și Registratură",  avatarId: 57, email: "cristian.nicolae@pmb.ro",  username: "cristian.nicolae",  status: "activ" },
      { id: 506, name: "Gabriela Marin",    role: "Consilier juridic · Direcția Juridic",                      avatarId: 20, email: "gabriela.marin@pmb.ro",    username: "gabriela.marin",    status: "activ" }
    ]
  };

  /* ---- Organigrama PMB (sursa: organigrama oficială publicată pe pmb.ro) ----
     Organigrama dictează nomenclatorul arhivistic: structurile cu
     `directieCode` sunt „vii" în Scriptica — codul le leagă de dosarele
     nomenclatorului (arhiveTree), de fluxurile lor (flowItem.archiveContainer
     = numele direcției) și de notificările derivate. `posts` = numărul total
     de posturi al structurii, ca în casetele organigramei oficiale. */
  function orgNode(id, name, posts, directieCode, children) {
    return { id: id, name: name, posts: posts || null, directieCode: directieCode || null, children: children || [] };
  }
  M.pmb.organigrama = {
    conducere: [
      orgNode("org_admin_public", "Administrator Public", null),
      orgNode("org_primar_general", "Primar General", null),
      orgNode("org_corp_control", "Corpul de Control al Primarului General", 24)
    ],
    demnitari: [
      orgNode("org_cab_vp1", "Cabinet Viceprimar 1", 2),
      orgNode("org_vp1", "Viceprimar 1", null),
      orgNode("org_vp2", "Viceprimar 2", null),
      orgNode("org_cab_vp2", "Cabinet Viceprimar 2", 2),
      orgNode("org_secretar_general", "Secretar General al Municipiului București", null),
      orgNode("org_cab_sg", "Cabinet Secretar General", 4),
      orgNode("org_cab_pg", "Cabinet Primar General", 6)
    ],
    directiiGenerale: [
      orgNode("org_dg_economica", "Direcția Generală Economică", 84, null, [
        orgNode("org_d_fin_contab", "Direcția Financiar-Contabilitate", 43, "II"),
        orgNode("org_d_venituri", "Direcția Venituri", 17),
        orgNode("org_d_prog_bugetara", "Direcția Programare și Execuție Bugetară", 23)
      ]),
      orgNode("org_dg_investitii", "Direcția Generală Investiții", 71, "VII", [
        orgNode("org_d_planificare_inv", "Direcția Planificare Investiții", 29),
        orgNode("org_d_urmarire_inv", "Direcția Urmărire Investiții", 41)
      ]),
      orgNode("org_dg_proiecte", "Direcția Generală Management Proiecte cu Finanțare Externă", 47, null, [
        orgNode("org_d_fonduri_neramb", "Direcția Fonduri Nerambursabile", 20),
        orgNode("org_b_accesare_fonduri", "Biroul Accesare Fonduri Rambursabile", 6),
        orgNode("org_b_derulare_fonduri", "Biroul Derulare și Raportare Fonduri Rambursabile", 6),
        orgNode("org_s_uip_glina", "Serviciul UIP Faza 2 Glina", 14)
      ]),
      orgNode("org_dg_urbanism", "Direcția Generală Urbanism și Amenajarea Teritoriului", 69, "VI", [
        orgNode("org_d_urbanism", "Direcția Urbanism", 40),
        orgNode("org_s_proiecte_urbane", "Serviciul Proiecte Urbane", 16),
        orgNode("org_s_publicitate", "Serviciul Publicitate Stradală", 12)
      ]),
      orgNode("org_dg_administratie", "Direcția Generală Administrație și Relația cu CGMB", 122, null, [
        orgNode("org_d_admin_publica", "Direcția Administrație Publică", 29),
        orgNode("org_d_asist_juridica", "Direcția Asistență Tehnică și Juridică", 39),
        orgNode("org_d_relatii_public", "Direcția Relații cu Publicul și Registratură", 53, "I")
      ]),
      orgNode("org_dg_servicii", "Direcția Generală Servicii Publice", 82, null, [
        orgNode("org_d_servicii_publice", "Direcția Servicii Publice", 30),
        orgNode("org_d_servicii_integrate", "Direcția Servicii Integrate", 51)
      ]),
      orgNode("org_dg_achizitii", "Direcția Generală Achiziții Publice", 43, "V", [
        orgNode("org_d_planificare_ach", "Direcția Planificare Achiziții", 16),
        orgNode("org_d_proceduri", "Direcția Proceduri", 18),
        orgNode("org_s_monitorizare_contracte", "Serviciul Monitorizare Derulare Contracte", 8)
      ]),
      orgNode("org_dg_urgenta", "Direcția Generală Situații de Urgență, Statistici și Strategii", 71, null, [
        orgNode("org_s_integrare", "Serviciul Integrare Multiculturală", 8),
        orgNode("org_d_inzestrare", "Direcția Înzestrare Materială și Situații de Urgență", 29),
        orgNode("org_d_statistici", "Direcția Statistici și Strategii", 24),
        orgNode("org_s_cmisu", "Serviciul Administrare Centrul Municipal Integrat pentru Situații de Urgență", 9)
      ]),
      orgNode("org_dg_logistica", "Direcția Generală Logistică", 125, null, [
        orgNode("org_d_informatica", "Direcția Informatică", 32),
        orgNode("org_d_administrativa", "Direcția Administrativă", 92)
      ])
    ],
    subordonareDirecta: [
      orgNode("org_d_patrimoniu", "Direcția Patrimoniu", 58),
      orgNode("org_d_mediu", "Direcția de Mediu", 45),
      orgNode("org_d_juridic", "Direcția Juridic", 86, "IX"),
      orgNode("org_d_mru", "Direcția Managementul Resurselor Umane", 36, "X"),
      orgNode("org_d_audit_calitate", "Direcția Auditul și Managementul Calității", 20),
      orgNode("org_d_integritate", "Direcția de Integritate", 16),
      orgNode("org_d_transporturi", "Direcția Transporturi", 42),
      orgNode("org_d_audit_intern", "Direcția Audit Public Intern", 27),
      orgNode("org_d_guvernanta", "Direcția Guvernanță Corporativă", 17),
      orgNode("org_d_presa", "Direcția de Presă", 25),
      orgNode("org_d_ong", "Direcția Relația cu ONG, Sindicate și Patronate", 17),
      orgNode("org_d_protocol", "Direcția Relații Externe și Protocol", 20),
      orgNode("org_d_cultura", "Direcția Cultură, Învățământ, Turism", 28),
      orgNode("org_s_euro", "Serviciul Euro 2020", 8),
      orgNode("org_s_ssm", "Serviciul Sănătate și Securitate în Muncă", 8),
      orgNode("org_b_secrete", "Biroul Documente Secrete", 6),
      orgNode("org_d_spatiu", "Direcția Spațiu Locativ și cu Altă Destinație", 24),
      orgNode("org_d_debite", "Direcția Monitorizare Recuperare Debite / Creanțe", 25)
    ]
  };

  /* ---- Verticalele PMB — vocabularul documentelor + partea externă proprie ---- */
  SA.flowVerticals.push(
    {
      id: "vert_pmb_ru", domain: "pmb_ru", builtin: false, status: "activ", color: "mov",
      name: "Resurse Umane", icon: "badge",
      itemLabel: "Dosar", itemLabelPlural: "Dosare",
      externalParty: { singular: "Funcționar / candidat", plural: "Funcționari și candidați" },
      description: "Concursuri de recrutare, cercetări disciplinare și promovări în grad profesional pentru funcționarii publici (OUG 57/2019 — Codul administrativ).",
      documentFilters: [],
      documentCategories: [
        { id: "recrutare", name: "Recrutare și concursuri", documentTypes: [
          { id: "dt_pmb_anunt_concurs", name: "Anunț de concurs" }, { id: "dt_pmb_dosar_inscriere", name: "Dosar de înscriere la concurs" },
          { id: "dt_pmb_pv_concurs", name: "Proces-verbal al comisiei de concurs" }, { id: "dt_pmb_raport_concurs", name: "Raport final al concursului" },
          { id: "dt_pmb_act_numire", name: "Act administrativ de numire" }
        ] },
        { id: "disciplina", name: "Comisia de disciplină", documentTypes: [
          { id: "dt_pmb_sesizare_disciplinara", name: "Sesizare disciplinară" }, { id: "dt_pmb_raport_disciplina", name: "Raport al comisiei de disciplină" },
          { id: "dt_pmb_act_sanctionare", name: "Act administrativ de sancționare" }
        ] },
        { id: "cariera", name: "Evoluție în carieră", documentTypes: [
          { id: "dt_pmb_cerere_promovare", name: "Cerere de promovare" }, { id: "dt_pmb_raport_evaluare", name: "Raport de evaluare a performanțelor" },
          { id: "dt_pmb_dispozitie_pg", name: "Dispoziție a Primarului General" }, { id: "dt_pmb_fisa_post", name: "Fișa postului" }
        ] },
        { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
      ]
    },
    {
      id: "vert_pmb_achizitii", domain: "pmb_achizitii", builtin: false, status: "activ", color: "albastru",
      name: "Achiziții Publice", icon: "shopping_cart",
      itemLabel: "Procedură", itemLabelPlural: "Proceduri",
      externalParty: { singular: "Operator economic", plural: "Operatori economici" },
      description: "Proceduri de atribuire conform Legii 98/2016 — de la referatul de necesitate la semnarea și modificarea contractului.",
      documentFilters: [],
      documentCategories: [
        { id: "initiere", name: "Inițiere", documentTypes: [
          { id: "dt_pmb_referat_necesitate", name: "Referat de necesitate" }, { id: "dt_pmb_strategie_contractare", name: "Strategie de contractare" }
        ] },
        { id: "documentatie", name: "Documentație de atribuire", documentTypes: [
          { id: "dt_pmb_caiet_sarcini_ap", name: "Caiet de sarcini" }, { id: "dt_pmb_documentatie_atribuire", name: "Documentație de atribuire" },
          { id: "dt_pmb_anunt_participare", name: "Anunț de participare (SEAP)" }
        ] },
        { id: "evaluare", name: "Evaluare oferte", documentTypes: [
          { id: "dt_pmb_oferta", name: "Ofertă" }, { id: "dt_pmb_raport_procedura", name: "Raport al procedurii" }
        ] },
        { id: "contractare", name: "Contractare", documentTypes: [
          { id: "dt_pmb_contract_ap", name: "Contract de achiziție publică" }, { id: "dt_pmb_act_aditional", name: "Act adițional" },
          { id: "dt_pmb_document_plata", name: "Document de plată (factură / chitanță)" }
        ] },
        { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
      ]
    },
    {
      id: "vert_pmb_investitii", domain: "pmb_investitii", builtin: false, status: "activ", color: "portocaliu",
      name: "Investiții și Lucrări", icon: "engineering",
      itemLabel: "Obiectiv", itemLabelPlural: "Obiective",
      externalParty: { singular: "Executant / proiectant", plural: "Executanți și proiectanți" },
      description: "Obiective de investiții publice: fundamentare (HG 907/2016), aprobarea indicatorilor tehnico-economici prin HCGMB, execuție și recepții (HG 343/2017).",
      documentFilters: [],
      documentCategories: [
        { id: "fundamentare", name: "Fundamentare", documentTypes: [
          { id: "dt_pmb_nota_conceptuala", name: "Notă conceptuală" }, { id: "dt_pmb_tema_proiectare", name: "Temă de proiectare" },
          { id: "dt_pmb_sf", name: "Studiu de fezabilitate" }, { id: "dt_pmb_dali", name: "DALI" }
        ] },
        { id: "aprobare", name: "Aprobare și autorizare", documentTypes: [
          { id: "dt_pmb_hcgmb", name: "Hotărâre a Consiliului General (HCGMB)" }, { id: "dt_pmb_aviz_cte", name: "Aviz CTE" },
          { id: "dt_pmb_pt", name: "Proiect tehnic (PT + DDE)" }, { id: "dt_pmb_ac", name: "Autorizație de construire" }
        ] },
        { id: "executie", name: "Execuție și recepție", documentTypes: [
          { id: "dt_pmb_ordin_incepere", name: "Ordin de începere a lucrărilor" }, { id: "dt_pmb_situatie_lucrari", name: "Situație de lucrări" },
          { id: "dt_pmb_pv_rtl", name: "Proces-verbal de recepție la terminarea lucrărilor" }, { id: "dt_pmb_pv_rf", name: "Proces-verbal de recepție finală" }
        ] },
        { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
      ]
    },
    {
      id: "vert_pmb_solicitari_externe", domain: "pmb_solicitari_externe", builtin: false, status: "activ", color: "verde",
      name: "Solicitări Externe", icon: "public",
      itemLabel: "Solicitare", itemLabelPlural: "Solicitări",
      externalParty: { singular: "Petent", plural: "Petenți" },
      description: "Cererile cetățenilor și ale persoanelor juridice adresate Primăriei: petiții (OG 27/2002), informații de interes public (Legea 544/2001), certificate de urbanism (Legea 50/1991).",
      documentFilters: [],
      documentCategories: [
        { id: "petitii", name: "Petiții", documentTypes: [
          { id: "dt_pmb_petitie", name: "Petiție" }, { id: "dt_pmb_raspuns_petitie", name: "Răspuns la petiție" }
        ] },
        { id: "informatii_publice", name: "Informații de interes public", documentTypes: [
          { id: "dt_pmb_cerere_544", name: "Cerere de informații de interes public" }, { id: "dt_pmb_raspuns_544", name: "Răspuns Legea 544/2001" }
        ] },
        { id: "urbanism", name: "Urbanism", documentTypes: [
          { id: "dt_pmb_cerere_cu", name: "Cerere certificat de urbanism" }, { id: "dt_pmb_cu", name: "Certificat de urbanism" }
        ] },
        { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
      ]
    },
    {
      id: "vert_pmb_solicitari_interne", domain: "pmb_solicitari_interne", builtin: false, status: "activ", color: "roz",
      name: "Solicitări Interne", icon: "forward_to_inbox",
      itemLabel: "Solicitare", itemLabelPlural: "Solicitări",
      externalParty: { singular: "Direcție / compartiment", plural: "Direcții și compartimente" },
      description: "Solicitări între direcțiile și compartimentele Primăriei sau între utilizatorii interni: referate, note interne, avize, deplasări — și fluxuri ad-hoc.",
      documentFilters: [],
      documentCategories: [
        { id: "corespondenta_interna", name: "Corespondență internă", documentTypes: [
          { id: "dt_pmb_nota_interna", name: "Notă internă" }, { id: "dt_pmb_referat", name: "Referat" }, { id: "dt_pmb_adresa_interna", name: "Adresă internă" }
        ] },
        { id: "avize", name: "Avize și vize", documentTypes: [
          { id: "dt_pmb_aviz_legalitate", name: "Aviz de legalitate" }, { id: "dt_pmb_viza_cfpp", name: "Viză CFPP" }
        ] },
        { id: "deplasari", name: "Deplasări", documentTypes: [
          { id: "dt_pmb_ordin_deplasare", name: "Ordin de deplasare" }, { id: "dt_pmb_decont", name: "Decont de cheltuieli" }
        ] },
        { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
      ]
    },
    /* Asistentul AI Scriptica — conversațiile cu LLM-ul local sunt tratate ca
       solicitări („cereri de lămuriri”), în același model de flux ca restul
       aplicației: o cerere = un dosar cu un singur pas, iar panoul lateral devine
       conversația cu asistentul (js/asistent-ai.js). `assistant: true` marchează
       verticala pentru butonul din Mesagerie și pentru workspace-ul dedicat. */
    {
      id: "vert_pmb_asistent_ai", domain: "pmb_asistent_ai", builtin: false, status: "activ", color: "auriu",
      name: "Asistentul AI Scriptica", icon: "auto_awesome", assistant: true,
      itemLabel: "Cerere de lămuriri", itemLabelPlural: "Cereri de lămuriri",
      externalParty: { singular: "Asistent", plural: "Asistenți" },
      description: "Cereri de lămuriri adresate asistentului AI: caută în toate evidențele la care utilizatorul are acces, raționează și răspunde cu surse.",
      documentFilters: [],
      documentCategories: [
        { id: "raspunsuri", name: "Răspunsuri generate", documentTypes: [
          { id: "dt_pmb_ai_nota", name: "Notă de răspuns a asistentului" }
        ] },
        { id: "necategorisit", name: "Necategorisit", system: true, documentTypes: [] }
      ]
    }
  );

  /* ---- Șabloanele PMB — pași, task-uri (standard + încărcări obligatorii) și anexe ---- */
  function step(id, name, offsetDays, tasks, anexeIds, description) {
    return {
      id: id, name: name, offsetDays: offsetDays, description: description || '',
      tasks: tasks.map(function (t, i) {
        if (typeof t === 'string') return { id: id + '_task_' + (i + 1), label: t, kind: 'standard', required: true };
        return { id: id + '_task_' + (i + 1), label: t.label, kind: 'document_upload', documentTypeId: t.doc,
          allowMultiple: t.multi !== false, minimumFiles: 1, required: true };
      }),
      anexeIds: anexeIds || []
    };
  }
  function upload(label, doc, multi) { return { label: label, doc: doc, multi: multi }; }

  SA.flowTemplates.push(
    /* — Resurse Umane — */
    { id: "ft_pmb_ru_recrutare", verticalId: "vert_pmb_ru", name: "Concurs de recrutare — ocuparea unei funcții publice vacante", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ru_recrutare",
      description: "Concurs organizat conform Codului administrativ (art. 618) și HG 611/2008: aprobare, publicitate, selecția dosarelor, probă scrisă și interviu, numire.",
      documentCategoryIds: ["recrutare", "cariera", "necategorisit"],
      steps: [
        step("ft_pmb_ru_recrutare_step_1", "Aprobarea organizării concursului", 5, [
          "Întocmește referatul de aprobare a organizării concursului",
          "Verifică încadrarea postului în planul de ocupare a funcțiilor publice",
          "Obține aprobarea Primarului General"
        ], ["anx_pmb_ru_referat_concurs"]),
        step("ft_pmb_ru_recrutare_step_2", "Publicitatea concursului", 15, [
          upload("Încarcă anunțul de concurs publicat pe site și la avizier (cu 30 de zile înainte)", "dt_pmb_anunt_concurs", false),
          "Transmite anunțul către Agenția Națională a Funcționarilor Publici"
        ]),
        step("ft_pmb_ru_recrutare_step_3", "Selecția dosarelor de înscriere", 40, [
          upload("Încarcă dosarele de înscriere ale candidaților", "dt_pmb_dosar_inscriere", true),
          "Verifică îndeplinirea condițiilor generale și specifice de participare",
          "Afișează rezultatul selecției dosarelor"
        ]),
        step("ft_pmb_ru_recrutare_step_4", "Proba scrisă și interviul", 50, [
          "Organizează proba scrisă",
          "Organizează interviul",
          "Întocmește procesul-verbal al comisiei de concurs"
        ], ["anx_pmb_ru_pv_concurs"]),
        step("ft_pmb_ru_recrutare_step_5", "Rezultatul final și numirea", 60, [
          "Afișează rezultatele finale ale concursului",
          "Soluționează eventualele contestații",
          upload("Încarcă actul administrativ de numire în funcția publică", "dt_pmb_act_numire", false)
        ])
      ] },
    { id: "ft_pmb_ru_disciplina", verticalId: "vert_pmb_ru", name: "Sesizare disciplinară — cercetare administrativă", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ru_disciplina",
      description: "Procedura comisiei de disciplină (HG 1344/2007): înregistrarea sesizării, cercetarea administrativă, raportul comisiei și actul administrativ de sancționare.",
      documentCategoryIds: ["disciplina", "necategorisit"],
      steps: [
        step("ft_pmb_ru_disciplina_step_1", "Înregistrarea sesizării", 5, [
          upload("Încarcă sesizarea disciplinară înregistrată la secretariatul comisiei", "dt_pmb_sesizare_disciplinara", false),
          "Verifică îndeplinirea condițiilor de formă ale sesizării (art. 27 HG 1344/2007)",
          "Comunică sesizarea funcționarului public cercetat"
        ]),
        step("ft_pmb_ru_disciplina_step_2", "Cercetarea administrativă", 30, [
          "Audiază funcționarul public și persoana care a formulat sesizarea",
          "Administrează probele și verifică apărările formulate",
          "Întocmește procesul-verbal al ședinței comisiei"
        ]),
        step("ft_pmb_ru_disciplina_step_3", "Raportul comisiei de disciplină", 45, [
          "Redactează raportul cu propunerea de sancțiune sau de clasare",
          "Transmite raportul Primarului General"
        ], ["anx_pmb_ru_raport_disciplina"]),
        step("ft_pmb_ru_disciplina_step_4", "Actul administrativ de sancționare", 60, [
          upload("Încarcă dispoziția de sancționare (dacă este cazul)", "dt_pmb_act_sanctionare", false),
          "Comunică actul administrativ funcționarului public în termen de 15 zile"
        ])
      ] },
    { id: "ft_pmb_ru_promovare", verticalId: "vert_pmb_ru", name: "Promovare în grad profesional", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ru_cariera",
      description: "Examen de promovare în gradul profesional imediat superior (Codul administrativ art. 478–479): verificarea condițiilor, organizarea examenului, actul de promovare.",
      documentCategoryIds: ["cariera", "recrutare", "necategorisit"],
      steps: [
        step("ft_pmb_ru_promovare_step_1", "Verificarea condițiilor de promovare", 7, [
          upload("Încarcă cererea de promovare a funcționarului public", "dt_pmb_cerere_promovare", false),
          "Verifică vechimea minimă de 3 ani în gradul profesional deținut",
          "Verifică calificativul „foarte bine” la ultimele două evaluări anuale"
        ]),
        step("ft_pmb_ru_promovare_step_2", "Organizarea examenului de promovare", 30, [
          "Aprobă organizarea examenului prin act administrativ",
          "Publică anunțul cu 30 de zile înainte de data examenului",
          "Constituie comisia de examen și comisia de soluționare a contestațiilor"
        ]),
        step("ft_pmb_ru_promovare_step_3", "Susținerea examenului", 45, [
          "Organizează proba scrisă",
          "Afișează rezultatele și soluționează contestațiile"
        ], ["anx_pmb_ru_pv_concurs"]),
        step("ft_pmb_ru_promovare_step_4", "Actul de promovare", 55, [
          upload("Încarcă dispoziția Primarului General de promovare", "dt_pmb_dispozitie_pg", false),
          "Actualizează fișa postului și dosarul profesional"
        ])
      ] },

    /* — Achiziții Publice — */
    { id: "ft_pmb_ap_directa", verticalId: "vert_pmb_achizitii", name: "Achiziție directă", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ap_proceduri",
      description: "Achiziție sub pragurile art. 7 alin. (5) din Legea 98/2016: referat de necesitate, consultarea catalogului electronic SEAP, comandă sau contract.",
      documentCategoryIds: ["initiere", "evaluare", "contractare", "necategorisit"],
      steps: [
        step("ft_pmb_ap_directa_step_1", "Referatul de necesitate", 3, [
          upload("Încarcă referatul de necesitate aprobat", "dt_pmb_referat_necesitate", false),
          "Verifică încadrarea în pragul achiziției directe și în Programul anual al achizițiilor publice"
        ]),
        step("ft_pmb_ap_directa_step_2", "Consultarea catalogului electronic SEAP", 7, [
          "Identifică ofertele din catalogul electronic",
          upload("Încarcă ofertele consultate", "dt_pmb_oferta", true),
          "Alege oferta cea mai avantajoasă și întocmește nota justificativă"
        ], ["anx_pmb_ap_nota_justificativa"]),
        step("ft_pmb_ap_directa_step_3", "Comanda sau contractul", 10, [
          "Emite comanda fermă sau contractul",
          "Înregistrează angajamentul bugetar și legal (ALOP)"
        ])
      ] },
    { id: "ft_pmb_ap_simplificata", verticalId: "vert_pmb_achizitii", name: "Procedură simplificată", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ap_proceduri",
      description: "Procedura simplificată (art. 113 Legea 98/2016): strategie de contractare, documentație de atribuire, publicare în SEAP, evaluarea ofertelor, atribuire și semnarea contractului.",
      documentCategoryIds: ["initiere", "documentatie", "evaluare", "contractare", "necategorisit"],
      steps: [
        step("ft_pmb_ap_simplificata_step_1", "Referatul de necesitate și strategia de contractare", 10, [
          upload("Încarcă referatul de necesitate aprobat", "dt_pmb_referat_necesitate", false),
          "Elaborează strategia de contractare",
          "Verifică sursa de finanțare și încadrarea în PAAP"
        ]),
        step("ft_pmb_ap_simplificata_step_2", "Documentația de atribuire", 25, [
          "Elaborează caietul de sarcini împreună cu compartimentul de specialitate",
          "Elaborează fișa de date a achiziției și DUAE",
          upload("Încarcă documentația de atribuire avizată", "dt_pmb_documentatie_atribuire", true)
        ]),
        step("ft_pmb_ap_simplificata_step_3", "Publicarea în SEAP", 30, [
          "Publică anunțul de participare simplificat",
          "Răspunde solicitărilor de clarificări în termenul legal"
        ]),
        step("ft_pmb_ap_simplificata_step_4", "Evaluarea ofertelor", 55, [
          "Deschide ofertele depuse în SEAP",
          "Evaluează DUAE, propunerile tehnice și financiare",
          "Întocmește raportul procedurii"
        ], ["anx_pmb_ap_raport_procedura"]),
        step("ft_pmb_ap_simplificata_step_5", "Atribuirea și semnarea contractului", 70, [
          "Comunică rezultatul procedurii ofertanților",
          "Așteaptă expirarea termenului de depunere a contestațiilor (5 zile)",
          upload("Încarcă contractul de achiziție publică semnat", "dt_pmb_contract_ap", false)
        ])
      ] },
    { id: "ft_pmb_ap_act_aditional", verticalId: "vert_pmb_achizitii", name: "Modificarea contractului — act adițional", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ap_contracte",
      description: "Modificarea unui contract de achiziție publică în condițiile art. 221 din Legea 98/2016: fundamentare, avize, semnare și publicare în SEAP.",
      documentCategoryIds: ["contractare", "necategorisit"],
      steps: [
        step("ft_pmb_ap_act_aditional_step_1", "Fundamentarea modificării", 7, [
          "Întocmește nota justificativă a modificării",
          "Verifică încadrarea în cazurile permise de art. 221",
          "Obține avizul juridic"
        ]),
        step("ft_pmb_ap_act_aditional_step_2", "Semnarea actului adițional", 14, [
          "Redactează actul adițional",
          "Obține viza de control financiar preventiv propriu",
          upload("Încarcă actul adițional semnat și publicat în SEAP", "dt_pmb_act_aditional", false)
        ])
      ] },

    /* — Investiții și Lucrări — */
    { id: "ft_pmb_inv_obiectiv_nou", verticalId: "vert_pmb_investitii", name: "Obiectiv de investiții nou", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_inv_docte",
      description: "Fundamentarea unui obiectiv de investiții conform HG 907/2016: notă conceptuală, temă de proiectare, studiu de fezabilitate, aprobarea indicatorilor tehnico-economici prin HCGMB.",
      documentCategoryIds: ["fundamentare", "aprobare", "necategorisit"],
      steps: [
        step("ft_pmb_inv_obiectiv_nou_step_1", "Nota conceptuală și tema de proiectare", 15, [
          upload("Încarcă nota conceptuală aprobată", "dt_pmb_nota_conceptuala", false),
          "Elaborează tema de proiectare",
          "Aprobă documentele prin ordonatorul principal de credite"
        ]),
        step("ft_pmb_inv_obiectiv_nou_step_2", "Studiul de fezabilitate", 75, [
          "Achiziționează serviciile de proiectare pentru studiul de fezabilitate",
          upload("Încarcă studiul de fezabilitate recepționat", "dt_pmb_sf", false),
          "Analizează studiul în Consiliul Tehnico-Economic"
        ]),
        step("ft_pmb_inv_obiectiv_nou_step_3", "Aprobarea indicatorilor tehnico-economici", 100, [
          "Redactează proiectul de hotărâre a Consiliului General",
          "Obține avizele comisiilor de specialitate",
          "Supune aprobării CGMB indicatorii tehnico-economici"
        ], ["anx_pmb_inv_indicatori"]),
        step("ft_pmb_inv_obiectiv_nou_step_4", "Includerea în programul de investiții", 110, [
          "Include obiectivul în lista de investiții anexă la bugetul local",
          "Asigură sursa de finanțare (buget local / fonduri externe)"
        ])
      ] },
    { id: "ft_pmb_inv_executie", verticalId: "vert_pmb_investitii", name: "Execuție lucrări și recepție", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_inv_executie",
      description: "Urmărirea execuției unei lucrări publice: ordin de începere, situații de lucrări vizate de dirigintele de șantier, recepția la terminarea lucrărilor și recepția finală (HG 343/2017).",
      documentCategoryIds: ["executie", "aprobare", "necategorisit"],
      steps: [
        step("ft_pmb_inv_executie_step_1", "Ordinul de începere a lucrărilor", 5, [
          upload("Încarcă ordinul de începere a lucrărilor", "dt_pmb_ordin_incepere", false),
          "Predă amplasamentul executantului",
          "Verifică desemnarea dirigintelui de șantier autorizat"
        ]),
        step("ft_pmb_inv_executie_step_2", "Urmărirea execuției", 120, [
          upload("Încarcă situațiile de lucrări lunare vizate", "dt_pmb_situatie_lucrari", true),
          "Verifică stadiul fizic și valoric al lucrărilor",
          "Înregistrează întârzierile și notele de constatare"
        ], ["anx_pmb_inv_stadiu"]),
        step("ft_pmb_inv_executie_step_3", "Recepția la terminarea lucrărilor", 135, [
          "Convoacă comisia de recepție",
          upload("Încarcă procesul-verbal de recepție la terminarea lucrărilor", "dt_pmb_pv_rtl", false)
        ]),
        step("ft_pmb_inv_executie_step_4", "Recepția finală", 500, [
          "Urmărește comportarea lucrării în perioada de garanție",
          upload("Încarcă procesul-verbal de recepție finală", "dt_pmb_pv_rf", false)
        ])
      ] },
    { id: "ft_pmb_inv_reparatii", verticalId: "vert_pmb_investitii", name: "Reparații capitale — DALI și autorizare", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_inv_docte",
      description: "Lucrări de intervenție la construcții existente: expertiză tehnică, documentația de avizare a lucrărilor de intervenții (DALI), aprobare, proiect tehnic și autorizație de construire.",
      documentCategoryIds: ["fundamentare", "aprobare", "necategorisit"],
      steps: [
        step("ft_pmb_inv_reparatii_step_1", "Expertiza tehnică și DALI", 45, [
          "Achiziționează expertiza tehnică a construcției",
          upload("Încarcă documentația de avizare a lucrărilor de intervenții", "dt_pmb_dali", false)
        ]),
        step("ft_pmb_inv_reparatii_step_2", "Aprobarea indicatorilor", 60, [
          "Obține avizul Consiliului Tehnico-Economic",
          "Supune aprobării CGMB indicatorii tehnico-economici"
        ], ["anx_pmb_inv_indicatori"]),
        step("ft_pmb_inv_reparatii_step_3", "Proiectul tehnic și autorizarea", 120, [
          "Recepționează proiectul tehnic și detaliile de execuție",
          upload("Încarcă autorizația de construire", "dt_pmb_ac", false)
        ])
      ] },

    /* — Solicitări Externe — */
    { id: "ft_pmb_ext_petitie", verticalId: "vert_pmb_solicitari_externe", name: "Petiție (OG 27/2002)", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ext_petitii",
      description: "Soluționarea petițiilor cetățenilor în termenul legal de 30 de zile: înregistrare, repartizare, soluționare de către compartimentul de specialitate, comunicarea răspunsului.",
      documentCategoryIds: ["petitii", "necategorisit"],
      steps: [
        step("ft_pmb_ext_petitie_step_1", "Înregistrarea și repartizarea", 2, [
          upload("Încarcă petiția înregistrată în registrul de petiții", "dt_pmb_petitie", false),
          "Verifică datele de identificare ale petentului (petițiile anonime se clasează)",
          "Repartizează petiția compartimentului de specialitate prin rezoluție"
        ]),
        step("ft_pmb_ext_petitie_step_2", "Soluționarea", 25, [
          "Analizează obiectul petiției",
          "Solicită punct de vedere altor structuri, dacă este cazul",
          "Redactează proiectul de răspuns"
        ], ["anx_pmb_ext_fisa_petitie"]),
        step("ft_pmb_ext_petitie_step_3", "Comunicarea răspunsului", 30, [
          "Semnează răspunsul de către conducătorul instituției",
          upload("Încarcă răspunsul comunicat petentului", "dt_pmb_raspuns_petitie", false),
          "Clasează petiția"
        ])
      ] },
    { id: "ft_pmb_ext_544", verticalId: "vert_pmb_solicitari_externe", name: "Cerere de informații de interes public (Legea 544/2001)", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ext_544",
      description: "Accesul la informațiile de interes public: răspuns în 10 zile (sau 30 de zile pentru informații complexe), cu verificarea excepțiilor de la art. 12.",
      documentCategoryIds: ["informatii_publice", "necategorisit"],
      steps: [
        step("ft_pmb_ext_544_step_1", "Înregistrarea cererii", 1, [
          upload("Încarcă cererea înregistrată la compartimentul de informare și relații publice", "dt_pmb_cerere_544", false),
          "Verifică dacă informația solicitată este exceptată de la liberul acces (art. 12)"
        ]),
        step("ft_pmb_ext_544_step_2", "Identificarea informației", 7, [
          "Solicită informația compartimentului care o deține",
          "Stabilește dacă răspunsul se încadrează în 10 zile sau necesită prelungirea la 30 de zile"
        ]),
        step("ft_pmb_ext_544_step_3", "Comunicarea răspunsului", 10, [
          upload("Încarcă răspunsul comunicat solicitantului", "dt_pmb_raspuns_544", false),
          "Înregistrează cererea în evidența pentru raportul anual privind aplicarea Legii 544/2001"
        ])
      ] },
    { id: "ft_pmb_ext_cu", verticalId: "vert_pmb_solicitari_externe", name: "Certificat de urbanism (Legea 50/1991)", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ext_urbanism",
      description: "Emiterea certificatului de urbanism în cel mult 30 de zile: verificarea documentației, analiza regimului juridic, economic și tehnic, semnare și eliberare.",
      documentCategoryIds: ["urbanism", "necategorisit"],
      steps: [
        step("ft_pmb_ext_cu_step_1", "Depunerea cererii", 3, [
          upload("Încarcă cererea-tip, planul de situație și extrasul de carte funciară", "dt_pmb_cerere_cu", true),
          "Verifică achitarea taxei pentru certificatul de urbanism"
        ]),
        step("ft_pmb_ext_cu_step_2", "Analiza urbanistică", 20, [
          "Verifică încadrarea în PUG / PUZ și în regulamentul local de urbanism",
          "Stabilește regimul juridic, economic și tehnic al imobilului"
        ], ["anx_pmb_ext_regim_urbanistic"]),
        step("ft_pmb_ext_cu_step_3", "Emiterea certificatului", 30, [
          "Redactează certificatul de urbanism",
          "Obține semnăturile: Primar General, secretar general, arhitect-șef",
          upload("Încarcă certificatul de urbanism eliberat", "dt_pmb_cu", false)
        ])
      ] },

    /* — Solicitări Interne (ad-hoc întotdeauna prima opțiune) — */
    { id: "ft_pmb_int_adhoc", verticalId: "vert_pmb_solicitari_interne", name: "Solicitare ad-hoc", frequency: "punctual", status: "activ", adhoc: true, archiveFolderId: "af_pmb_int_coresp",
      description: "Flux liber între utilizatorii interni: solicitantul descrie ce are nevoie, iar pașii se stabilesc la deschidere. Configurarea detaliată a fluxurilor ad-hoc urmează.",
      documentCategoryIds: ["corespondenta_interna", "necategorisit"],
      steps: [
        step("ft_pmb_int_adhoc_step_1", "Rezolvare", 10, [
          "Descrie solicitarea și rezultatul așteptat",
          "Confirmă rezolvarea împreună cu solicitantul"
        ], [], "Pas unic, definit de utilizator la deschiderea solicitării.")
      ] },
    { id: "ft_pmb_int_referat", verticalId: "vert_pmb_solicitari_interne", name: "Referat / notă internă către altă direcție", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_int_coresp",
      description: "Corespondență internă între structuri: referatul se înregistrează, se repartizează prin rezoluție și primește răspuns de la structura destinatară.",
      documentCategoryIds: ["corespondenta_interna", "necategorisit"],
      steps: [
        step("ft_pmb_int_referat_step_1", "Redactarea și înregistrarea", 2, [
          upload("Încarcă referatul semnat de șeful structurii", "dt_pmb_referat", false),
          "Înregistrează referatul la registratura internă"
        ]),
        step("ft_pmb_int_referat_step_2", "Analiza în structura destinatară", 7, [
          "Repartizează referatul unui angajat prin rezoluție",
          "Formulează punctul de vedere al structurii"
        ]),
        step("ft_pmb_int_referat_step_3", "Răspunsul", 10, [
          upload("Încarcă adresa de răspuns", "dt_pmb_adresa_interna", false),
          "Clasează referatul la dosarul structurii"
        ])
      ] },
    { id: "ft_pmb_int_aviz", verticalId: "vert_pmb_solicitari_interne", name: "Solicitare aviz (juridic / CFPP)", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_dj_avize",
      description: "Solicitarea avizului de legalitate de la Direcția Juridic sau a vizei de control financiar preventiv propriu pentru un proiect de act administrativ ori de angajament.",
      documentCategoryIds: ["corespondenta_interna", "avize", "necategorisit"],
      steps: [
        step("ft_pmb_int_aviz_step_1", "Transmiterea documentației", 2, [
          "Atașează proiectul de act și nota de fundamentare",
          "Înregistrează solicitarea de aviz"
        ]),
        step("ft_pmb_int_aviz_step_2", "Analiza și emiterea avizului", 7, [
          "Verifică legalitatea / regularitatea operațiunii",
          upload("Încarcă avizul emis (favorabil sau cu observații)", "dt_pmb_aviz_legalitate", false)
        ], ["anx_pmb_int_aviz"])
      ] },
    /* — Asistentul AI (un singur pas: consultarea) — */
    { id: "ft_pmb_ai_cerere", verticalId: "vert_pmb_asistent_ai", name: "Cerere de lămuriri către Asistentul AI", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_ai_lamuriri",
      description: "Conversație cu asistentul AI pe evidențele accesibile utilizatorului: întrebare, raționament, răspuns cu surse; cererea se închide când lămurirea este confirmată.",
      documentCategoryIds: ["raspunsuri", "necategorisit"],
      steps: [
        step("ft_pmb_ai_cerere_step_1", "Consultare", 2, [
          "Formulează cererea de lămuriri în conversația cu asistentul",
          "Verifică sursele indicate în răspuns",
          "Confirmă soluționarea cererii"
        ], [], "Pas unic: conversația cu asistentul se poartă în panoul din dreapta.")
      ] },
    { id: "ft_pmb_int_deplasare", verticalId: "vert_pmb_solicitari_interne", name: "Deplasare în interes de serviciu", frequency: "punctual", status: "activ", archiveFolderId: "af_pmb_fin_deplasari",
      description: "Aprobarea deplasării prin ordin de deplasare și decontarea cheltuielilor (HG 714/2018) în 3 zile lucrătoare de la întoarcere.",
      documentCategoryIds: ["deplasari", "necategorisit"],
      steps: [
        step("ft_pmb_int_deplasare_step_1", "Aprobarea deplasării", 3, [
          upload("Încarcă ordinul de deplasare aprobat de șeful ierarhic", "dt_pmb_ordin_deplasare", false),
          "Confirmă avansul spre decontare, dacă este cazul"
        ]),
        step("ft_pmb_int_deplasare_step_2", "Decontul cheltuielilor", 15, [
          upload("Încarcă documentele justificative și decontul de cheltuieli", "dt_pmb_decont", true),
          "Verifică decontul și transmite-l la plată"
        ])
      ] }
  );

  /* ---- Anexe PMB (formulare completabile în pași) ---- */
  function anexa(id, name, verticalId, fields) {
    return { id: id, name: name, status: "activ", updatedAt: TODAY_ISO,
      categories: [window.SCRIPTICA_MOCK.superAdmin.flowVerticals.find(function (v) { return v.id === verticalId; }).domain],
      verticalIds: [verticalId], verticalIdsVersion: 2, schema: { fields: fields } };
  }
  M.anexeTypes.push(
    anexa("anx_pmb_ru_referat_concurs", "Referat privind organizarea concursului", "vert_pmb_ru", [
      { type: "section_title", text: "Postul scos la concurs" },
      { type: "text_short", label: "Denumirea funcției publice", required: true, help: "ex. Consilier, clasa I, grad profesional asistent", maxLength: 160 },
      { type: "text_short", label: "Compartimentul", required: true, help: "", maxLength: 160 },
      { type: "number", label: "Număr posturi", required: true, help: "", ref: "NR_POSTURI" },
      { type: "radio", label: "Tipul concursului", required: true, help: "", options: ["Recrutare", "Promovare"] },
      { type: "text_long", label: "Condiții specifice de participare", required: true, help: "Studii, vechime în specialitate, cunoștințe.", rows: 4 },
      { type: "text_short", label: "Temei legal", required: true, help: "", maxLength: 160 }
    ]),
    anexa("anx_pmb_ru_pv_concurs", "Proces-verbal al comisiei de concurs / examen", "vert_pmb_ru", [
      { type: "section_title", text: "Ședința comisiei" },
      { type: "date", label: "Data probei", required: true, help: "" },
      { type: "radio", label: "Proba", required: true, help: "", options: ["Selecția dosarelor", "Proba scrisă", "Interviul"] },
      { type: "text_long", label: "Membrii comisiei prezenți", required: true, help: "", rows: 3 },
      { type: "text_long", label: "Candidați și punctaje", required: true, help: "Un candidat pe rând: nume — punctaj — admis/respins.", rows: 5 },
      { type: "boolean", label: "S-au înregistrat contestații", required: false, help: "" }
    ]),
    anexa("anx_pmb_ru_raport_disciplina", "Raport al comisiei de disciplină", "vert_pmb_ru", [
      { type: "section_title", text: "Concluziile cercetării administrative" },
      { type: "text_long", label: "Fapta sesizată și încadrarea", required: true, help: "", rows: 4 },
      { type: "text_long", label: "Probele administrate", required: true, help: "", rows: 4 },
      { type: "dropdown", label: "Propunerea comisiei", required: true, help: "", options: ["Clasarea sesizării", "Mustrare scrisă", "Diminuarea drepturilor salariale cu 5–20% pe 1–3 luni", "Suspendarea dreptului de promovare 1–3 ani", "Retrogradarea în grad profesional", "Destituirea din funcția publică"] },
      { type: "text_long", label: "Motivarea propunerii", required: true, help: "", rows: 4 }
    ]),
    anexa("anx_pmb_ap_nota_justificativa", "Notă justificativă — achiziție directă", "vert_pmb_achizitii", [
      { type: "section_title", text: "Alegerea ofertei" },
      { type: "text_short", label: "Obiectul achiziției", required: true, help: "", maxLength: 200 },
      { type: "text_short", label: "Cod CPV", required: true, help: "", maxLength: 40 },
      { type: "currency", label: "Valoare estimată (fără TVA)", required: true, help: "", ref: "VAL_ESTIMATA" },
      { type: "text_short", label: "Operatorul economic selectat", required: true, help: "", maxLength: 160 },
      { type: "currency", label: "Valoarea ofertei selectate (fără TVA)", required: true, help: "", ref: "VAL_OFERTA" },
      { type: "text_long", label: "Motivarea alegerii", required: true, help: "", rows: 3 }
    ]),
    anexa("anx_pmb_ap_raport_procedura", "Raportul procedurii de atribuire", "vert_pmb_achizitii", [
      { type: "section_title", text: "Rezultatul evaluării" },
      { type: "number", label: "Număr oferte depuse", required: true, help: "", ref: "NR_OFERTE" },
      { type: "number", label: "Număr oferte admisibile", required: true, help: "", ref: "NR_ADMISIBILE" },
      { type: "text_long", label: "Clasamentul ofertelor", required: true, help: "", rows: 4 },
      { type: "text_short", label: "Ofertantul declarat câștigător", required: true, help: "", maxLength: 160 },
      { type: "currency", label: "Valoarea contractului (fără TVA)", required: true, help: "", ref: "VAL_CONTRACT" },
      { type: "checkboxes", label: "Verificări efectuate", required: true, help: "", options: ["DUAE", "Propunerea tehnică", "Propunerea financiară", "Documente de calificare", "Conflict de interese"] }
    ]),
    anexa("anx_pmb_inv_indicatori", "Fișă indicatori tehnico-economici", "vert_pmb_investitii", [
      { type: "section_title", text: "Indicatori aprobați" },
      { type: "text_short", label: "Denumirea obiectivului de investiții", required: true, help: "", maxLength: 200 },
      { type: "currency", label: "Valoarea totală a investiției (inclusiv TVA)", required: true, help: "", ref: "VAL_TOTAL" },
      { type: "currency", label: "din care construcții-montaj (C+M)", required: true, help: "", ref: "VAL_CM" },
      { type: "number", label: "Durata de realizare (luni)", required: true, help: "", ref: "DURATA_LUNI" },
      { type: "dropdown", label: "Sursa de finanțare", required: true, help: "", options: ["Buget local", "Buget de stat", "Fonduri externe nerambursabile", "Credit", "Mixt"] },
      { type: "text_long", label: "Capacități fizice", required: false, help: "", rows: 3 }
    ]),
    anexa("anx_pmb_inv_stadiu", "Fișă de stadiu fizic și valoric", "vert_pmb_investitii", [
      { type: "section_title", text: "Stadiul lucrărilor" },
      { type: "month", label: "Luna de raportare", required: true, help: "" },
      { type: "percent", label: "Stadiu fizic realizat", required: true, help: "", ref: "STADIU_FIZIC" },
      { type: "currency", label: "Valoare decontată cumulat (fără TVA)", required: true, help: "", ref: "VAL_DECONTAT" },
      { type: "text_long", label: "Întârzieri și cauze", required: false, help: "", rows: 3 },
      { type: "boolean", label: "Situația de lucrări vizată de dirigintele de șantier", required: true, help: "" }
    ]),
    anexa("anx_pmb_ext_fisa_petitie", "Fișă de soluționare a petiției", "vert_pmb_solicitari_externe", [
      { type: "section_title", text: "Soluționarea petiției" },
      { type: "text_short", label: "Număr și dată de înregistrare", required: true, help: "", maxLength: 80 },
      { type: "dropdown", label: "Obiectul petiției", required: true, help: "", options: ["Salubrizare și spații verzi", "Infrastructură rutieră", "Urbanism și disciplină în construcții", "Asistență socială", "Transport public", "Altele"] },
      { type: "text_long", label: "Rezumatul soluției", required: true, help: "", rows: 4 },
      { type: "radio", label: "Modul de soluționare", required: true, help: "", options: ["Favorabil", "Nefavorabil", "Redirecționat către altă instituție", "Clasat"] },
      { type: "date", label: "Termen legal de răspuns", required: true, help: "30 de zile de la înregistrare (45 cu prelungire)." }
    ]),
    anexa("anx_pmb_ext_regim_urbanistic", "Fișă regim urbanistic", "vert_pmb_solicitari_externe", [
      { type: "section_title", text: "Regimul imobilului" },
      { type: "text_short", label: "Adresa imobilului", required: true, help: "", maxLength: 200 },
      { type: "text_short", label: "Număr cadastral / carte funciară", required: true, help: "", maxLength: 80 },
      { type: "text_long", label: "Regim juridic", required: true, help: "", rows: 3 },
      { type: "text_long", label: "Regim economic", required: true, help: "", rows: 3 },
      { type: "text_long", label: "Regim tehnic (POT, CUT, regim de înălțime)", required: true, help: "", rows: 3 },
      { type: "checkboxes", label: "Avize necesare", required: false, help: "", options: ["Comisia de circulație", "Direcția de Cultură (monumente)", "Mediu", "Salubritate", "Utilități"] }
    ]),
    anexa("anx_pmb_int_aviz", "Fișă de aviz", "vert_pmb_solicitari_interne", [
      { type: "section_title", text: "Avizul emis" },
      { type: "radio", label: "Tipul avizului", required: true, help: "", options: ["Aviz de legalitate", "Viză CFPP"] },
      { type: "radio", label: "Concluzia", required: true, help: "", options: ["Favorabil", "Favorabil cu observații", "Nefavorabil"] },
      { type: "text_long", label: "Observații", required: false, help: "", rows: 4 },
      { type: "date", label: "Data emiterii", required: true, help: "" }
    ])
  );

  /* ---- Categoria de client „Instituție publică" — arhivă după nomenclatorul arhivistic ----
     Nomenclatorul este dictat de organigramă (obs. prototip 3 AUG 2026):
     Direcție (cifră romană) → Serviciu (literă) → An → dosar cu indicativ
     obligatoriu (X.a.1) și termen de păstrare. `group` leagă în continuare
     dosarul de verticala din care provin fluxurile (setarea „Arhivare la
     finalizare” a fluxului alege dintre dosarele verticalei). */
  SA.clientTypes.push({
    id: "ct_institutie_publica", name: "Instituție publică", icon: "account_balance", builtin: false,
    description: "Autorități și instituții ale administrației publice — primării, consilii județene, instituții subordonate. Arhiva urmează nomenclatorul arhivistic dictat de organigramă (Direcție → Serviciu → An → dosar cu indicativ și termen de păstrare), iar verticalele contractate diferă de la o instituție la alta.",
    verticalIds: [],
    defaultTemplateIds: [],
    clientLabel: "Solicitant", clientLabelPlural: "Solicitanți",
    archiveRouting: "nomenclator",
    dashboardLayout: [],
    archiveTree: [
      /* I. Direcția Relații cu Publicul și Registratură */
      { id: "af_pmb_ext_petitii", group: "Solicitări Externe", code: "I.a.1", directieCode: "I", directie: "Direcția Relații cu Publicul și Registratură", serviciuCode: "a", serviciu: "Serviciul Registratură Generală și Petiții", retention: "5 ani", name: "I.a.1 — Petiții și răspunsuri (OG 27/2002)", docTypeIds: ["dt_pmb_petitie", "dt_pmb_raspuns_petitie"], children: [] },
      { id: "af_pmb_ext_544", group: "Solicitări Externe", code: "I.a.2", directieCode: "I", directie: "Direcția Relații cu Publicul și Registratură", serviciuCode: "a", serviciu: "Serviciul Registratură Generală și Petiții", retention: "5 ani", name: "I.a.2 — Informații de interes public (Legea 544/2001)", docTypeIds: ["dt_pmb_cerere_544", "dt_pmb_raspuns_544"], children: [] },
      { id: "af_pmb_int_coresp", group: "Solicitări Interne", code: "I.b.1", directieCode: "I", directie: "Direcția Relații cu Publicul și Registratură", serviciuCode: "b", serviciu: "Serviciul Corespondență Internă și Secretariat", retention: "5 ani", name: "I.b.1 — Corespondență internă între structuri (note, referate, adrese)", docTypeIds: ["dt_pmb_nota_interna", "dt_pmb_referat", "dt_pmb_adresa_interna"], children: [] },
      { id: "af_pmb_ai_lamuriri", group: "Asistentul AI Scriptica", code: "I.c.1", directieCode: "I", directie: "Direcția Relații cu Publicul și Registratură", serviciuCode: "c", serviciu: "Serviciul Evidența Electronică a Documentelor", retention: "3 ani", name: "I.c.1 — Cereri de lămuriri și note ale Asistentului AI", docTypeIds: ["dt_pmb_ai_nota"], children: [] },
      /* II. Direcția Financiar-Contabilitate */
      { id: "af_pmb_fin_deplasari", group: "Solicitări Interne", code: "II.a.1", directieCode: "II", directie: "Direcția Financiar-Contabilitate", serviciuCode: "a", serviciu: "Serviciul Buget și Execuție Bugetară", retention: "5 ani", name: "II.a.1 — Ordine de deplasare și deconturi de cheltuieli", docTypeIds: ["dt_pmb_ordin_deplasare", "dt_pmb_decont"], children: [] },
      /* V. Direcția Generală Achiziții Publice */
      { id: "af_pmb_ap_proceduri", group: "Achiziții Publice", code: "V.a.1", directieCode: "V", directie: "Direcția Generală Achiziții Publice", serviciuCode: "a", serviciu: "Serviciul Proceduri de Atribuire", retention: "10 ani", name: "V.a.1 — Proceduri de achiziție publică (dosarul achiziției)", docTypeIds: ["dt_pmb_referat_necesitate", "dt_pmb_strategie_contractare", "dt_pmb_caiet_sarcini_ap", "dt_pmb_documentatie_atribuire", "dt_pmb_anunt_participare", "dt_pmb_oferta", "dt_pmb_raport_procedura"], children: [] },
      { id: "af_pmb_ap_contracte", group: "Achiziții Publice", code: "V.b.1", directieCode: "V", directie: "Direcția Generală Achiziții Publice", serviciuCode: "b", serviciu: "Serviciul Monitorizare Contracte", retention: "10 ani", name: "V.b.1 — Contracte de achiziție publică și acte adiționale", docTypeIds: ["dt_pmb_contract_ap", "dt_pmb_act_aditional", "dt_pmb_document_plata"], children: [] },
      /* VI. Direcția Generală Urbanism și Amenajarea Teritoriului */
      { id: "af_pmb_ext_urbanism", group: "Solicitări Externe", code: "VI.a.1", directieCode: "VI", directie: "Direcția Generală Urbanism și Amenajarea Teritoriului", serviciuCode: "a", serviciu: "Serviciul Autorizare și Certificate", retention: "Permanent", name: "VI.a.1 — Certificate de urbanism", docTypeIds: ["dt_pmb_cerere_cu", "dt_pmb_cu"], children: [] },
      /* VII. Direcția Generală Investiții */
      { id: "af_pmb_inv_docte", group: "Investiții și Lucrări", code: "VII.a.1", directieCode: "VII", directie: "Direcția Generală Investiții", serviciuCode: "a", serviciu: "Serviciul Pregătire Investiții", retention: "Permanent", name: "VII.a.1 — Documentații tehnico-economice", docTypeIds: ["dt_pmb_nota_conceptuala", "dt_pmb_tema_proiectare", "dt_pmb_sf", "dt_pmb_dali", "dt_pmb_hcgmb", "dt_pmb_aviz_cte", "dt_pmb_pt", "dt_pmb_ac"], children: [] },
      { id: "af_pmb_inv_executie", group: "Investiții și Lucrări", code: "VII.b.1", directieCode: "VII", directie: "Direcția Generală Investiții", serviciuCode: "b", serviciu: "Serviciul Urmărire Lucrări", retention: "Permanent", name: "VII.b.1 — Execuție lucrări și recepții", docTypeIds: ["dt_pmb_ordin_incepere", "dt_pmb_situatie_lucrari", "dt_pmb_pv_rtl", "dt_pmb_pv_rf"], children: [] },
      /* IX. Direcția Juridic */
      { id: "af_pmb_dj_avize", group: "Solicitări Interne", code: "IX.a.1", directieCode: "IX", directie: "Direcția Juridic", serviciuCode: "a", serviciu: "Serviciul Avizare și Contencios", retention: "10 ani", name: "IX.a.1 — Avize de legalitate și vize CFPP", docTypeIds: ["dt_pmb_aviz_legalitate", "dt_pmb_viza_cfpp"], children: [] },
      /* X. Direcția Managementul Resurselor Umane — conform nomenclatorului de stat */
      { id: "af_pmb_ru_inventare", group: "Resurse Umane", code: "X.a.1", directieCode: "X", directie: "Direcția Managementul Resurselor Umane", serviciuCode: "a", serviciu: "Serviciul Salarizare și Organizare", retention: "Permanent", name: "X.a.1 — Inventarele și procesele-verbale de predare-primire a documentelor create de compartimente la depozitul de arhivă", docTypeIds: [], children: [] },
      { id: "af_pmb_ru_organizare", group: "Resurse Umane", code: "X.a.2", directieCode: "X", directie: "Direcția Managementul Resurselor Umane", serviciuCode: "a", serviciu: "Serviciul Salarizare și Organizare", retention: "Permanent", name: "X.a.2 — Documentație privind organizarea instituției: R.O.F., stat de funcții, scheme de încadrare", docTypeIds: ["dt_pmb_fisa_post"], children: [] },
      { id: "af_pmb_ru_recrutare", group: "Resurse Umane", code: "X.b.1", directieCode: "X", directie: "Direcția Managementul Resurselor Umane", serviciuCode: "b", serviciu: "Serviciul Recrutare și Evaluare", retention: "Permanent", name: "X.b.1 — Recrutare și concursuri (dosarele concursurilor)", docTypeIds: ["dt_pmb_anunt_concurs", "dt_pmb_dosar_inscriere", "dt_pmb_pv_concurs", "dt_pmb_raport_concurs", "dt_pmb_act_numire"], children: [] },
      { id: "af_pmb_ru_cariera", group: "Resurse Umane", code: "X.b.2", directieCode: "X", directie: "Direcția Managementul Resurselor Umane", serviciuCode: "b", serviciu: "Serviciul Recrutare și Evaluare", retention: "10 ani", name: "X.b.2 — Evoluție în carieră și evaluarea performanțelor", docTypeIds: ["dt_pmb_cerere_promovare", "dt_pmb_raport_evaluare", "dt_pmb_dispozitie_pg"], children: [] },
      { id: "af_pmb_ru_disciplina", group: "Resurse Umane", code: "X.c.1", directieCode: "X", directie: "Direcția Managementul Resurselor Umane", serviciuCode: "c", serviciu: "Secretariatul Comisiei de Disciplină", retention: "10 ani", name: "X.c.1 — Cercetări administrative — comisia de disciplină", docTypeIds: ["dt_pmb_sesizare_disciplinara", "dt_pmb_raport_disciplina", "dt_pmb_act_sanctionare"], children: [] },
      { id: "af_pmb_necat", name: "Necategorisit", system: true, docTypeIds: [], children: [] }
    ]
  });

  /* ---- Contul HQ „Primăria Municipiului București" ---- */
  function assignment(verticalId, templateIds) {
    return { id: 'mod_cli_pmb_' + verticalId, verticalId: verticalId, templateIds: templateIds, status: 'activ', activatedAt: '2026-03-01', deactivatedAt: null };
  }
  SA.clients.push({
    id: "cli_pmb", name: "Primăria Municipiului București", domain: "Administrație publică locală", clientTypeId: "ct_institutie_publica",
    instance: "pmb.scriptica.ro", users: 240, enrolled: "01.03.2026",
    tier: "ent", contract: "activ", aiLoad: 71,
    tenantPersona: "pmb_intern",
    commercial: { plan: "Enterprise", renew: "01.03.2027", billing: "Anual · 48.000 RON", lastPay: "01.03.2026" },
    flags: [
      { name: "Sortare automată A.I.", tier: "Plus", on: true },
      { name: "Mesaje smart", tier: "Plus", on: true },
      { name: "Constructor de Anexe", tier: "Standard", on: true },
      { name: "Vertical Audit", tier: "Enterprise", on: false },
      { name: "Backup local", tier: "Plus · add-on", on: true }
    ],
    technical: {
      vmLoad: [40, 58, 66, 84, 90, 76, 62, 48], vmPeakIdx: 4,
      aiPerMonth: "9.860", docsStored: "142k", uptime30: 99.98, lastIncident: "acum 19 zile"
    },
    downtime: { incidents: [
      { cauza: "ai_limit", minutes: 96, day: 10 },
      { cauza: "ai_vm", minutes: 7, day: 21 }
    ] },
    moduleAssignmentsVersion: 1,
    moduleAssignments: [
      assignment("vert_pmb_ru", ["ft_pmb_ru_recrutare", "ft_pmb_ru_disciplina", "ft_pmb_ru_promovare"]),
      assignment("vert_pmb_achizitii", ["ft_pmb_ap_directa", "ft_pmb_ap_simplificata", "ft_pmb_ap_act_aditional"]),
      assignment("vert_pmb_investitii", ["ft_pmb_inv_obiectiv_nou", "ft_pmb_inv_executie", "ft_pmb_inv_reparatii"]),
      assignment("vert_pmb_solicitari_externe", ["ft_pmb_ext_petitie", "ft_pmb_ext_544", "ft_pmb_ext_cu"]),
      assignment("vert_pmb_solicitari_interne", ["ft_pmb_int_adhoc", "ft_pmb_int_referat", "ft_pmb_int_aviz", "ft_pmb_int_deplasare"]),
      assignment("vert_pmb_asistent_ai", ["ft_pmb_ai_cerere"])
    ],
    terminologyVersion: 1,
    terminologyOverrides: {},
    dashboardLayoutVersion: 1,
    dashboardLayout: [
      { id: "dw_pmb_ru", widget: "flow_summary", params: { verticalId: "vert_pmb_ru" }, size: "half" },
      { id: "dw_pmb_ap", widget: "flow_summary", params: { verticalId: "vert_pmb_achizitii" }, size: "half" },
      { id: "dw_pmb_inv", widget: "flow_summary", params: { verticalId: "vert_pmb_investitii" }, size: "half" },
      { id: "dw_pmb_ext", widget: "flow_summary", params: { verticalId: "vert_pmb_solicitari_externe" }, size: "half" },
      { id: "dw_pmb_int", widget: "flow_summary", params: { verticalId: "vert_pmb_solicitari_interne" }, size: "half" },
      { id: "dw_pmb_ai", widget: "flow_summary", params: { verticalId: "vert_pmb_asistent_ai" }, size: "half" },
      { id: "dw_pmb_termene", widget: "termene", size: "half" },
      { id: "dw_pmb_arhiva", widget: "arhiva_recente", params: {}, size: "half" }
    ]
  });

  /* ---- Dosarele PMB (instanțe de flux) — `archiveContainer` = direcția care ține dosarul în arhivă ---- */
  var DMRU = "Direcția Managementul Resurselor Umane";
  var DGAP = "Direcția Generală Achiziții Publice";
  var DGI  = "Direcția Generală Investiții";
  var DRPR = "Direcția Relații cu Publicul și Registratură";
  var DGU  = "Direcția Generală Urbanism și Amenajarea Teritoriului";
  var DJ   = "Direcția Juridic";
  function fi(id, verticalId, domain, templateId, templateName, name, party, contact, container, start, currentStep, done, status, resp) {
    return { id: id, verticalId: verticalId, domain: domain, tenantAccountId: "cli_pmb",
      templateId: templateId, templateName: templateName, name: name,
      clientName: party, clientContact: contact, archiveContainer: container,
      startDate: start, currentStep: currentStep, stepsCompleted: done, status: status, responsibleIds: resp };
  }
  M.flowItems.push(
    fi("fi_pmb_ru_01", "vert_pmb_ru", "pmb_ru", "ft_pmb_ru_recrutare", "Concurs de recrutare — ocuparea unei funcții publice vacante",
      "Concurs consilier superior — Serviciul Buget", "Direcția Financiar-Contabilitate", "Elena Radu", DMRU, "2026-03-09", 4, 3, "in_verificare", [501, 502]),
    fi("fi_pmb_ru_02", "vert_pmb_ru", "pmb_ru", "ft_pmb_ru_recrutare", "Concurs de recrutare — ocuparea unei funcții publice vacante",
      "Concurs inspector debutant — Direcția Urbanism", DGU, "Elena Radu", DMRU, "2026-04-06", 2, 1, "asteapta_documente", [502]),
    fi("fi_pmb_ru_03", "vert_pmb_ru", "pmb_ru", "ft_pmb_ru_disciplina", "Sesizare disciplinară — cercetare administrativă",
      "Cercetare administrativă — sesizare nr. 4412/2026", "Funcționar public cercetat (confidențial)", "Secretariatul comisiei de disciplină", DMRU, "2026-03-25", 2, 1, "in_verificare", [501, 506]),
    fi("fi_pmb_ru_04", "vert_pmb_ru", "pmb_ru", "ft_pmb_ru_promovare", "Promovare în grad profesional",
      "Promovare grad principal — 6 funcționari DGAP", DGAP, "Andrei Constantin", DMRU, "2026-04-01", 2, 1, "analiza", [501]),
    fi("fi_pmb_ru_05", "vert_pmb_ru", "pmb_ru", "ft_pmb_ru_promovare", "Promovare în grad profesional",
      "Promovare grad superior — Direcția Juridic", DJ, "Gabriela Marin", DMRU, "2026-01-12", 4, 4, "finalizat", [502]),

    fi("fi_pmb_ap_01", "vert_pmb_achizitii", "pmb_achizitii", "ft_pmb_ap_simplificata", "Procedură simplificată",
      "Servicii de mentenanță iluminat public — sector central", "Luxten Lighting Company S.A.", "Andrei Constantin", DGAP, "2026-02-23", 4, 3, "in_verificare", [503]),
    fi("fi_pmb_ap_02", "vert_pmb_achizitii", "pmb_achizitii", "ft_pmb_ap_directa", "Achiziție directă",
      "Consumabile birotică — trimestrul II 2026", "Office Depot Romania S.R.L.", "Andrei Constantin", DGAP, "2026-04-14", 2, 1, "analiza", [503]),
    fi("fi_pmb_ap_03", "vert_pmb_achizitii", "pmb_achizitii", "ft_pmb_ap_act_aditional", "Modificarea contractului — act adițional",
      "Act adițional nr. 2 — servicii de pază sedii PMB", "Guard One Security S.R.L.", "Andrei Constantin", DGAP, "2026-04-15", 1, 0, "spre_aprobare", [503, 506]),
    fi("fi_pmb_ap_04", "vert_pmb_achizitii", "pmb_achizitii", "ft_pmb_ap_simplificata", "Procedură simplificată",
      "Servicii de proiectare — pasaj pietonal Piața Unirii", "Search Corporation S.R.L.", "Andrei Constantin", DGAP, "2025-11-10", 5, 5, "finalizat", [503]),
    fi("fi_pmb_ap_05", "vert_pmb_achizitii", "pmb_achizitii", "ft_pmb_ap_directa", "Achiziție directă",
      "Becuri LED pentru sediul PMB — Bd. Regina Elisabeta", "Electric Plus Distribution S.R.L.", "Andrei Constantin", DGAP, "2026-02-09", 3, 3, "finalizat", [503]),

    fi("fi_pmb_inv_01", "vert_pmb_investitii", "pmb_investitii", "ft_pmb_inv_obiectiv_nou", "Obiectiv de investiții nou",
      "Creșă și grădiniță — cartier Străulești", "Proiectant: Urban Design Studio S.R.L.", "Ioana Petrescu", DGI, "2026-01-19", 3, 2, "spre_aprobare", [504]),
    fi("fi_pmb_inv_02", "vert_pmb_investitii", "pmb_investitii", "ft_pmb_inv_executie", "Execuție lucrări și recepție",
      "Reabilitare Pasaj Unirii — lucrări structurale", "Executant: Erbașu Construcții S.A.", "Ioana Petrescu", DGI, "2025-12-01", 2, 1, "in_verificare", [504, 501]),
    fi("fi_pmb_inv_03", "vert_pmb_investitii", "pmb_investitii", "ft_pmb_inv_reparatii", "Reparații capitale — DALI și autorizare",
      "Consolidare Școala Gimnazială nr. 12 (risc seismic)", "Proiectant: Popp & Asociații S.R.L.", "Ioana Petrescu", DGI, "2026-03-02", 2, 1, "asteapta_documente", [504]),

    fi("fi_pmb_ext_01", "vert_pmb_solicitari_externe", "pmb_solicitari_externe", "ft_pmb_ext_petitie", "Petiție (OG 27/2002)",
      "Petiție — zgomot șantier Str. Lipscani nr. 20", "Maria Ionescu", "Maria Ionescu", DRPR, "2026-04-02", 2, 1, "in_verificare", [505]),
    fi("fi_pmb_ext_02", "vert_pmb_solicitari_externe", "pmb_solicitari_externe", "ft_pmb_ext_544", "Cerere de informații de interes public (Legea 544/2001)",
      "Cerere 544 — contracte de salubrizare 2025", "Asociația Pro Transparență", "Radu Vasilescu", DRPR, "2026-04-15", 2, 1, "analiza", [505]),
    fi("fi_pmb_ext_03", "vert_pmb_solicitari_externe", "pmb_solicitari_externe", "ft_pmb_ext_cu", "Certificat de urbanism (Legea 50/1991)",
      "Certificat de urbanism — Bd. Dacia nr. 45", "Imobiliare Dacia S.R.L.", "Alexandru Stan", DGU, "2026-03-30", 2, 1, "in_verificare", [505, 501]),
    fi("fi_pmb_ext_04", "vert_pmb_solicitari_externe", "pmb_solicitari_externe", "ft_pmb_ext_petitie", "Petiție (OG 27/2002)",
      "Petiție — gropi carosabil Calea Moșilor", "Ion Popa", "Ion Popa", DRPR, "2026-03-05", 3, 3, "finalizat", [505]),

    fi("fi_pmb_int_01", "vert_pmb_solicitari_interne", "pmb_solicitari_interne", "ft_pmb_int_aviz", "Solicitare aviz (juridic / CFPP)",
      "Aviz de legalitate — proiect HCGMB taxe locale 2027", "Direcția Venituri", "Gabriela Marin", DJ, "2026-04-16", 2, 1, "in_verificare", [506]),
    fi("fi_pmb_int_02", "vert_pmb_solicitari_interne", "pmb_solicitari_interne", "ft_pmb_int_referat", "Referat / notă internă către altă direcție",
      "Referat — suplimentare posturi Serviciul Registratură", DRPR, "Cristian Nicolae", DMRU, "2026-04-13", 2, 1, "analiza", [501, 505]),
    fi("fi_pmb_int_03", "vert_pmb_solicitari_interne", "pmb_solicitari_interne", "ft_pmb_int_adhoc", "Solicitare ad-hoc",
      "Ad-hoc — acces sală de ședințe pentru comisia de concurs", "Direcția Administrativ", "Mihai Dumitrescu", DMRU, "2026-04-17", 1, 0, "analiza", [501]),
    fi("fi_pmb_int_04", "vert_pmb_solicitari_interne", "pmb_solicitari_interne", "ft_pmb_int_deplasare", "Deplasare în interes de serviciu",
      "Deplasare Cluj-Napoca — conferință achiziții publice", DGAP, "Andrei Constantin", DGAP, "2026-03-16", 2, 2, "finalizat", [503])
  );

  /* ---- Cereri de lămuriri către Asistentul AI (conversații seed) ---- */
  var AI = "Asistentul AI Scriptica";
  var aiReq1 = fi("fi_pmb_ai_01", "vert_pmb_asistent_ai", "pmb_asistent_ai", "ft_pmb_ai_cerere", "Cerere de lămuriri către Asistentul AI",
    "Ce furnizori avem pentru servicii de iluminat public?", AI, "Mihai Dumitrescu", DMRU, "2026-04-17", 1, 1, "finalizat", [501]);
  aiReq1.aiContext = { label: "1 dosar · Achiziții Publice", itemIds: ["fi_pmb_ap_01"] };
  aiReq1.aiMessages = [
    { id: "aim_1", role: "user", at: "2026-04-17T09:12:00", text: "Ce furnizori avem pentru servicii de iluminat public?" },
    { id: "aim_2", role: "assistant", at: "2026-04-17T09:12:04",
      reasoning: [
        "Am identificat termenii-cheie: «furnizori», «iluminat public».",
        "Am căutat în evidențele accesibile rolului tău: 20 de dosare și 23 de documente din 5 verticale.",
        "Am găsit potriviri în Achiziții Publice și am corelat dosarul cu ofertele depuse."
      ],
      answerHtml: "Am găsit <b>1 procedură</b> de achiziție pentru servicii de iluminat public: <b>Servicii de mentenanță iluminat public — sector central</b> (procedură simplificată, în evaluarea ofertelor). Operatorul economic cu ofertă depusă este <b>Luxten Lighting Company S.A.</b>, propunere financiară 1.712.400 RON fără TVA.",
      references: [
        { kind: "dosar", label: "Servicii de mentenanță iluminat public — sector central", href: "situatie-detaliu.html?flowId=fi_pmb_ap_01" },
        { kind: "document", label: "V.a.1_oferta-luxten-lighting_nr-OF-2026-0442_2026-04-09.pdf", href: "situatie-detaliu.html?flowId=fi_pmb_ap_01" }
      ],
      contextShift: { label: "1 dosar · Achiziții Publice", names: ["Servicii de mentenanță iluminat public — sector central"] },
      chips: ["Rezumă dosarul din context", "Care este stadiul?", "Cine este responsabil?"] },
    { id: "aim_3", role: "user", at: "2026-04-17T09:13:10", text: "Care este stadiul?" },
    { id: "aim_4", role: "assistant", at: "2026-04-17T09:13:13",
      reasoning: [
        "Întrebarea se referă la stadiul dosarului din context.",
        "Am citit pasul curent și termenul din șablonul procedurii simplificate."
      ],
      answerHtml: "<b>Servicii de mentenanță iluminat public — sector central</b> este la pasul <b>4/5 — Evaluarea ofertelor</b>, status <b>În Verificare</b>. Următorul pas este atribuirea și semnarea contractului; responsabil: <b>Andrei Constantin</b>.",
      references: [
        { kind: "dosar", label: "Servicii de mentenanță iluminat public — sector central", href: "situatie-detaliu.html?flowId=fi_pmb_ap_01" }
      ],
      contextShift: null,
      chips: ["Ce documente conține?", "Ce termene se apropie?", "Resetează contextul"] }
  ];
  var aiReq2 = fi("fi_pmb_ai_02", "vert_pmb_asistent_ai", "pmb_asistent_ai", "ft_pmb_ai_cerere", "Cerere de lămuriri către Asistentul AI",
    "Câte concursuri de recrutare sunt în derulare?", AI, "Elena Radu", DMRU, "2026-04-19", 1, 0, "in_verificare", [502]);
  aiReq2.aiMessages = [
    { id: "aim_5", role: "user", at: "2026-04-19T14:02:00", text: "Câte concursuri de recrutare sunt în derulare?" },
    { id: "aim_6", role: "assistant", at: "2026-04-19T14:02:03",
      reasoning: [
        "Am identificat termenii-cheie: «concursuri», «recrutare», «în derulare».",
        "Am numărat dosarele din Resurse Umane cu șablonul de concurs care nu sunt finalizate."
      ],
      answerHtml: "Sunt <b>2 concursuri de recrutare</b> în derulare în Resurse Umane: <b>Concurs consilier superior — Serviciul Buget</b> (pasul 4/5, proba scrisă și interviul) și <b>Concurs inspector debutant — Direcția Urbanism</b> (pasul 2/5, publicitatea concursului, așteaptă documente).",
      references: [
        { kind: "dosar", label: "Concurs consilier superior — Serviciul Buget", href: "situatie-detaliu.html?flowId=fi_pmb_ru_01" },
        { kind: "dosar", label: "Concurs inspector debutant — Direcția Urbanism", href: "situatie-detaliu.html?flowId=fi_pmb_ru_02" }
      ],
      contextShift: { label: "2 dosare · Resurse Umane", names: ["Concurs consilier superior — Serviciul Buget", "Concurs inspector debutant — Direcția Urbanism"] },
      chips: ["Ce termene au?", "Cine face parte din comisii?", "Resetează contextul"] }
  ];
  aiReq2.aiContext = { label: "2 dosare · Resurse Umane", itemIds: ["fi_pmb_ru_01", "fi_pmb_ru_02"] };
  /* Exemplu: utilizatorul cere o analiză, asistentul propune analizele standard
     ale instituției ca opțiuni (click → grafic animat în zona de lucru). */
  var aiReq3 = fi("fi_pmb_ai_03", "vert_pmb_asistent_ai", "pmb_asistent_ai", "ft_pmb_ai_cerere", "Cerere de lămuriri către Asistentul AI",
    "Am nevoie de o analiză pentru raportarea către Primarul General", AI, "Ioana Petrescu", DGI, "2026-04-20", 1, 0, "in_verificare", [504]);
  aiReq3.aiMessages = [
    { id: "aim_7", role: "user", at: "2026-04-20T08:40:00", text: "Am nevoie de o analiză pentru raportarea către Primarul General. Ce îmi poți pregăti?" },
    { id: "aim_8", role: "assistant", at: "2026-04-20T08:40:03",
      reasoning: [
        "Am identificat o cerere de analiză fără un subiect precizat.",
        "Am verificat analizele standard disponibile pentru evidențele la care ai acces: solicitări externe, investiții, achiziții, termene pe direcții."
      ],
      answerHtml: "Îți pot pregăti imediat una dintre analizele standard ale instituției — alege de mai jos și îți afișez graficul, indicatorii-cheie și concluziile în zona de lucru. Poți formula și o analiză proprie (ex. „petițiile pe subiecte din T1”).",
      references: [], contextShift: null,
      chips: ["Petiții pe subiecte și timp mediu de soluționare", "Evoluția lunară a solicitărilor externe", "Stadiul obiectivelor de investiții", "Valoarea achizițiilor pe tipuri de procedură", "Termene depășite pe direcții"] }
  ];
  M.flowItems.push(aiReq1, aiReq2, aiReq3);
})();

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
  var seededVerticals = {};
  var seededTemplates = {};
  ((M.superAdmin && M.superAdmin.flowVerticals) || []).forEach(function (v) { seededVerticals[v.id] = v; });
  ((M.superAdmin && M.superAdmin.flowTemplates) || []).forEach(function (t) { seededTemplates[t.id] = t; });
  M.anexeTypes = mergeInto(M.anexeTypes || [], 'scriptica.anexe');
  /* Feedback #2 — referințe stabile pentru coloanele provenite din anexe.
     Răspunsurile rămân indexate exact ca înainte; id-ul este doar metadată
     aditivă și se regenerează determinist inclusiv peste stări locale vechi. */
  M.anexeTypes.forEach(function (anexa) {
    /* Feedback #3 — o anexă rămâne un șablon independent și poate fi
       disponibilă în mai multe verticale. `verticalIds` este clasificarea
       explicită; array gol înseamnă „partajată”. Pentru stările vechi o
       derivăm o singură dată din categoriile legacy, fără a le elimina. */
    if (!Array.isArray(anexa.verticalIds)) {
      var aliases = {
        contabilitate: 'contabil', contabil: 'contabil', salarizare: 'contabil',
        audit: 'audit', constructii: 'constructii', consultanta: 'consultanta', fiscal: 'consultanta'
      };
      anexa.verticalIds = [];
      (anexa.categories || []).forEach(function (category) {
        var domain = aliases[category] || category;
        var vertical = ((M.superAdmin && M.superAdmin.flowVerticals) || []).find(function (item) {
          return item.domain === domain;
        });
        if (vertical && anexa.verticalIds.indexOf(vertical.id) === -1) anexa.verticalIds.push(vertical.id);
      });
    }
    if (!anexa.verticalIdsVersion) anexa.verticalIdsVersion = 1;
    (((anexa || {}).schema || {}).fields || []).forEach(function (field, index) {
      if (!field.id) field.id = 'afld_' + anexa.id + '_' + index;
    });
  });
  M.situationTypes = mergeInto(M.situationTypes || [], 'scriptica.situationTypes');

  /* Registrul de fluxuri + tipuri de clienți (HQ) — același pattern de
     persistență ca tipurile de situații: map id → record în localStorage,
     { deleted: true } = tombstone. */
  var SA = M.superAdmin || {};
  SA.flowVerticals = mergeInto(SA.flowVerticals || [], 'scriptica.flowVerticals');
  SA.flowTemplates = mergeInto(SA.flowTemplates || [], 'scriptica.flowTemplates');
  /* Migrare blândă pentru stări locale vechi: păstrăm editările utilizatorului,
     dar completăm vocabularul de documente introdus după salvarea lor. */
  SA.flowVerticals.forEach(function (v) {
    var seed = seededVerticals[v.id];
    if (seed && v.documentVocabularyVersion !== 1) {
      v.documentCategories = JSON.parse(JSON.stringify(seed.documentCategories || []));
      v.documentFilters = JSON.parse(JSON.stringify(seed.documentFilters || []));
      if (seed.defaultDocumentCategoryIds) v.defaultDocumentCategoryIds = seed.defaultDocumentCategoryIds.slice();
    }
    if (!v.documentFilters && seed) v.documentFilters = JSON.parse(JSON.stringify(seed.documentFilters || []));
    if (!v.defaultDocumentCategoryIds && seed && seed.defaultDocumentCategoryIds) {
      v.defaultDocumentCategoryIds = seed.defaultDocumentCategoryIds.slice();
    }
    v.documentVocabularyVersion = 1;
    delete v.lifecycle;
  });
  SA.flowTemplates.forEach(function (t) {
    var seed = seededTemplates[t.id];
    var vertical = SA.flowVerticals.find(function (v) { return v.id === t.verticalId; });
    var systemIds = ((vertical && vertical.documentCategories) || []).filter(function (category) { return category.system; }).map(function (category) { return category.id; });
    var hasWorkingCategory = (t.documentCategoryIds || []).some(function (id) { return systemIds.indexOf(id) === -1; });
    if ((!t.documentCategoryIds || !t.documentCategoryIds.length || !hasWorkingCategory) && seed && seed.documentCategoryIds) {
      t.documentCategoryIds = seed.documentCategoryIds.slice();
    }
  });
  /* Feedback #3 — completează clasificarea anexelor vechi din utilizările
     reale. Nu duplicăm anexa: același id poate apărea în oricâte verticale.
     Versiunea 2 păstrează ulterior exact selecția făcută în constructor. */
  M.anexeTypes.forEach(function (anexa) {
    if (anexa.verticalIdsVersion === 2) return;
    var verticalIds = Array.isArray(anexa.verticalIds) ? anexa.verticalIds.slice() : [];
    function addVertical(verticalId) {
      if (verticalId && verticalIds.indexOf(verticalId) === -1) verticalIds.push(verticalId);
    }
    function usedIn(activity) {
      return (activity.steps || []).some(function (step) {
        return (step.anexeIds || []).indexOf(anexa.id) !== -1;
      });
    }
    SA.flowTemplates.forEach(function (template) {
      if (usedIn(template)) addVertical(template.verticalId);
    });
    M.situationTypes.forEach(function (type) {
      if (!usedIn(type)) return;
      if (type.verticalId) { addVertical(type.verticalId); return; }
      var domain = type.domain || 'contabil';
      var vertical = SA.flowVerticals.find(function (item) { return item.domain === domain; });
      addVertical(vertical && vertical.id);
    });
    anexa.verticalIds = verticalIds;
    anexa.verticalIdsVersion = 2;
  });
  SA.clientTypes = mergeInto(SA.clientTypes || [], 'scriptica.clientTypes');
  SA.clients = mergeInto(SA.clients || [], 'scriptica.saClients');
  /* Migrare 2026-08 — tipul de client rămâne categorie, iar verticalele
     contractate și layout-ul Acasă aparțin clientului HQ. Pentru înregistrările
     vechi derivăm o singură dată configurația existentă din tip, fără să
     confundăm un array gol salvat explicit cu o stare nemigrată. */
  SA.clients.forEach(function (client) {
    var clientType = (SA.clientTypes || []).find(function (type) { return type.id === client.clientTypeId; });
    if (!(client.moduleAssignmentsVersion === 1 && Array.isArray(client.moduleAssignments))) {
      var templateIds = (clientType && clientType.defaultTemplateIds) || [];
      client.moduleAssignments = ((clientType && clientType.verticalIds) || []).map(function (verticalId) {
        return {
          id: 'mod_' + client.id + '_' + verticalId,
          verticalId: verticalId,
          templateIds: templateIds.filter(function (templateId) {
            var template = (SA.flowTemplates || []).find(function (item) { return item.id === templateId; });
            return template && template.verticalId === verticalId;
          }),
          status: 'activ',
          activatedAt: '2026-04-20',
          deactivatedAt: null
        };
      });
      client.moduleAssignmentsVersion = 1;
    }
    /* Feedback #3 — noul flux demonstrativ de construcții trebuie să fie
       vizibil și pentru conturile deja salvate înainte de apariția lui.
       Adăugarea este versionată și non-distructivă; niciun șablon existent
       și nicio instanță istorică nu sunt eliminate. */
    if (client.clientTypeId === 'ct_constructii' && client.templateCatalogVersion !== 2) {
      var constructionAssignment = (client.moduleAssignments || []).find(function (assignment) {
        return assignment.verticalId === 'vert_constructii';
      });
      if (constructionAssignment && !Array.isArray(constructionAssignment.templateIds)) constructionAssignment.templateIds = [];
      if (constructionAssignment && constructionAssignment.templateIds.indexOf('ft_constr_complet') === -1) {
        constructionAssignment.templateIds.push('ft_constr_complet');
      }
      client.templateCatalogVersion = 2;
    }
    if (!(client.dashboardLayoutVersion === 1 && Array.isArray(client.dashboardLayout))) {
      var activeVerticalIds = (client.moduleAssignments || []).filter(function (assignment) {
        return assignment.status === 'activ';
      }).map(function (assignment) { return assignment.verticalId; });
      var activeDomains = activeVerticalIds.map(function (verticalId) {
        var vertical = (SA.flowVerticals || []).find(function (item) { return item.id === verticalId; });
        return vertical ? vertical.domain : null;
      }).filter(Boolean);
      var legacyLayout = JSON.parse(JSON.stringify((clientType && clientType.dashboardLayout) || []));
      client.dashboardLayout = legacyLayout.filter(function (item) {
        if (item.widget === 'flow_summary') {
          return item.params && activeVerticalIds.indexOf(item.params.verticalId) !== -1;
        }
        if (item.widget === 'situatii_noi' || item.widget === 'alerte' || item.widget === 'mesaje') {
          return activeDomains.indexOf('contabil') !== -1;
        }
        if (item.widget === 'rapoarte_audit') return activeDomains.indexOf('audit') !== -1;
        return true;
      });
      activeVerticalIds.slice().reverse().forEach(function (verticalId) {
        var hasSummary = client.dashboardLayout.some(function (item) {
          return item.widget === 'flow_summary' && item.params && item.params.verticalId === verticalId;
        });
        if (!hasSummary) {
          client.dashboardLayout.unshift({
            id: 'dw_' + client.id + '_' + verticalId,
            widget: 'flow_summary', params: { verticalId: verticalId }, size: 'half'
          });
        }
      });
      if (!activeVerticalIds.length) client.dashboardLayout = [];
      client.dashboardLayoutVersion = 1;
    }
  });
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
  window.scripticaModuleAssignmentsForClient = function (clientOrId, includeInactive) {
    var clients = (window.SCRIPTICA_MOCK.superAdmin && window.SCRIPTICA_MOCK.superAdmin.clients) || [];
    var client = typeof clientOrId === 'string'
      ? clients.find(function (item) { return item.id === clientOrId; })
      : clientOrId;
    var assignments = (client && client.moduleAssignments) || [];
    return includeInactive ? assignments.slice() : assignments.filter(function (assignment) {
      var vertical = window.scripticaVerticalById(assignment.verticalId);
      return assignment.status === 'activ' && vertical && (vertical.status || 'activ') === 'activ';
    });
  };
  window.scripticaActiveModuleVerticalIdsForClient = function (clientOrId) {
    return window.scripticaModuleAssignmentsForClient(clientOrId, false).map(function (assignment) {
      return assignment.verticalId;
    });
  };
  window.scripticaTemplatesForClientModule = function (clientOrId, verticalId, includeInactive) {
    var assignment = window.scripticaModuleAssignmentsForClient(clientOrId, includeInactive)
      .find(function (item) { return item.verticalId === verticalId; });
    if (!assignment) return [];
    return (assignment.templateIds || []).map(function (templateId) {
      return (window.SCRIPTICA_MOCK.superAdmin.flowTemplates || []).find(function (template) {
        return template.id === templateId;
      }) || null;
    }).filter(Boolean);
  };

  /* ---- Terminologie per cont de business ----
     Definițiile comune rămân sursa implicită. Contul salvează numai
     diferențele de afișare; id-urile, ierarhia și rutarea nu sunt atinse. */
  function terminologyClient(clientOrId) {
    var clients = (window.SCRIPTICA_MOCK.superAdmin && window.SCRIPTICA_MOCK.superAdmin.clients) || [];
    if (clientOrId && typeof clientOrId === 'object') return clientOrId;
    if (typeof clientOrId === 'string') {
      return clients.find(function (client) { return client.id === clientOrId; }) || null;
    }
    return typeof window.scripticaTenantAccount === 'function' ? window.scripticaTenantAccount() : null;
  }
  function terminologyOverrides(client) {
    var value = client && client.terminologyOverrides;
    return value && typeof value === 'object' ? value : {};
  }
  function terminologyText(value, fallback) {
    var text = String(value == null ? '' : value).trim();
    return text || fallback;
  }
  window.scripticaEffectiveExternalParty = function (clientOrId, verticalId) {
    var client = terminologyClient(clientOrId);
    var typeId = client && client.clientTypeId
      ? client.clientTypeId
      : (typeof window.scripticaTenantClientTypeId === 'function' ? window.scripticaTenantClientTypeId() : '');
    var type = window.scripticaClientTypeById(typeId) || {};
    var overrides = terminologyOverrides(client).externalParty || {};
    /* O verticală își poate numi propria parte externă (Petent, Operator economic,
       Funcționar / candidat…) — ea are prioritate față de eticheta generală a
       contului, care rămâne fallback-ul pentru suprafețele fără verticală. */
    var vertical = verticalId ? window.scripticaVerticalById(verticalId) : null;
    var verticalOverride = ((terminologyOverrides(client).verticals || {})[verticalId] || {}).externalParty || {};
    var own = (vertical && vertical.externalParty) || {};
    return {
      singular: terminologyText(verticalOverride.singular, terminologyText(own.singular,
        terminologyText(overrides.singular, terminologyText(type.clientLabel, 'Client')))),
      plural: terminologyText(verticalOverride.plural, terminologyText(own.plural,
        terminologyText(overrides.plural, terminologyText(type.clientLabelPlural, 'Clienți'))))
    };
  };

  /* ---- Profilul beneficiarilor ----
     Tipul de client oferă schema comună, iar contul de business păstrează
     o schemă proprie numai după personalizare. În lipsa ambelor, prototipul
     pornește cu un profil util care extinde identitatea fixă, fără să o
     dubleze (CUI, adresă și contacte rămân în câmpurile sistemului). */
  function defaultBeneficiaryProfileSchema(type) {
    var party = terminologyText(type && type.clientLabel, 'Beneficiar');
    return {
      id: 'cps_default_' + ((type && type.id) || 'general'),
      version: 1,
      source: 'scriptica_default',
      fields: [
        { id: 'cpf_default_section', type: 'section_title', text: 'Date suplimentare' },
        { id: 'cpf_default_code', type: 'text_short', label: 'Cod intern ' + party.toLowerCase(),
          help: 'Codul folosit de echipă în evidențele proprii.', required: false, sensitive: false,
          scope: 'onboarding_profile', showInTable: true, showInExternalForm: false },
        { id: 'cpf_default_category', type: 'dropdown', label: 'Categorie de colaborare',
          help: 'Ajută echipa să grupeze portofoliul.', required: false, sensitive: false,
          options: ['Standard', 'Prioritar', 'Ocazional'], scope: 'onboarding_profile',
          showInTable: true, showInExternalForm: true },
        { id: 'cpf_default_notes', type: 'text_long', label: 'Observații de înrolare',
          help: 'Context util pentru începerea colaborării.', required: false, sensitive: false,
          scope: 'onboarding_profile', showInTable: false, showInExternalForm: true },
        { id: 'cpf_default_consent', type: 'boolean', label: 'Acord pentru comunicare electronică',
          help: '', required: false, sensitive: false, scope: 'onboarding_profile',
          showInTable: false, showInExternalForm: true },
        { id: 'cpf_default_support', type: 'file_upload', label: 'Document justificativ',
          help: 'Document opțional pentru verificarea datelor transmise.', required: false,
          sensitive: true, scope: 'onboarding_profile', showInTable: false, showInExternalForm: true }
      ]
    };
  }
  function profileSchemaCopy(schema, inherited, owner) {
    var copy = JSON.parse(JSON.stringify(schema || { version: 1, fields: [] }));
    copy.version = copy.version || 1;
    copy.fields = Array.isArray(copy.fields) ? copy.fields : [];
    var stableOwner = String(copy.id || owner || 'profil').replace(/[^a-zA-Z0-9_-]/g, '_');
    copy.fields.forEach(function (field, index) {
      if (!field.id) field.id = 'cpf_legacy_' + stableOwner + '_' + index;
    });
    copy.inherited = !!inherited;
    copy.owner = owner || '';
    return copy;
  }
  window.scripticaDefaultBeneficiaryProfileSchema = function (clientTypeOrId) {
    var type = typeof clientTypeOrId === 'string' ? window.scripticaClientTypeById(clientTypeOrId) : clientTypeOrId;
    return profileSchemaCopy(defaultBeneficiaryProfileSchema(type || {}), true, 'scriptica:' + ((type && type.id) || 'general'));
  };
  window.scripticaEffectiveBeneficiaryProfileSchema = function (clientOrId) {
    var client = terminologyClient(clientOrId);
    var typeId = client && client.clientTypeId
      ? client.clientTypeId
      : (typeof window.scripticaTenantClientTypeId === 'function' ? window.scripticaTenantClientTypeId() : '');
    var type = window.scripticaClientTypeById(typeId) || {};
    if (client && client.clientProfileSchema && Array.isArray(client.clientProfileSchema.fields)) {
      return profileSchemaCopy(client.clientProfileSchema, false, 'client:' + (client.id || 'nou'));
    }
    if (type.clientProfileSchema && Array.isArray(type.clientProfileSchema.fields)) {
      return profileSchemaCopy(type.clientProfileSchema, true, 'clientType:' + (type.id || 'general'));
    }
    return profileSchemaCopy(defaultBeneficiaryProfileSchema(type), true, 'scriptica:' + (type.id || 'general'));
  };
  window.scripticaEffectiveVerticalTerminology = function (verticalOrId, clientOrId) {
    var vertical = typeof verticalOrId === 'string' ? window.scripticaVerticalById(verticalOrId) : verticalOrId;
    var safe = vertical || {};
    var client = terminologyClient(clientOrId);
    var overrides = terminologyOverrides(client).verticals || {};
    var own = safe.id && overrides[safe.id] ? overrides[safe.id] : {};
    return {
      id: safe.id || '',
      name: terminologyText(own.name, terminologyText(safe.name, 'Verticală')),
      itemLabel: terminologyText(own.itemLabel, terminologyText(safe.itemLabel, 'Element')),
      itemLabelPlural: terminologyText(own.itemLabelPlural, terminologyText(safe.itemLabelPlural, 'Elemente'))
    };
  };
  window.scripticaEffectiveVertical = function (verticalOrId, clientOrId) {
    var vertical = typeof verticalOrId === 'string' ? window.scripticaVerticalById(verticalOrId) : verticalOrId;
    if (!vertical) return null;
    var terms = window.scripticaEffectiveVerticalTerminology(vertical, clientOrId);
    var copy = {};
    Object.keys(vertical).forEach(function (key) { copy[key] = vertical[key]; });
    copy.name = terms.name;
    copy.itemLabel = terms.itemLabel;
    copy.itemLabelPlural = terms.itemLabelPlural;
    return copy;
  };

  function archiveTreeNodes(tree, out, depth, parentKey) {
    (tree || []).forEach(function (folder) {
      out.push({
        key: folder.id,
        defaultName: terminologyText(folder.name, folder.system ? 'Necategorisit' : 'Folder'),
        depth: depth,
        parentKey: parentKey || null,
        system: !!folder.system,
        source: 'clientType',
        inactive: false,
        docTypeIds: (folder.docTypeIds || []).slice(),
        /* nomenclator arhivistic (instituții publice) */
        code: folder.code || '', retention: folder.retention || '',
        directie: folder.directie || '', directieCode: folder.directieCode || '',
        serviciu: folder.serviciu || '', serviciuCode: folder.serviciuCode || '',
        group: folder.group || ''
      });
      archiveTreeNodes(folder.children || [], out, depth + 1, folder.id);
    });
  }
  window.scripticaArchiveFolderDefinitionsForClient = function (clientOrId, includeInactive) {
    var client = terminologyClient(clientOrId);
    var typeId = client && client.clientTypeId
      ? client.clientTypeId
      : (typeof window.scripticaTenantClientTypeId === 'function' ? window.scripticaTenantClientTypeId() : '');
    var type = window.scripticaClientTypeById(typeId) || {};
    var definitions = [];
    archiveTreeNodes((type.archiveTree && type.archiveTree.length) ? type.archiveTree : window.scripticaDefaultArchiveTree(), definitions, 0, null);

    var assignments;
    if (client && Array.isArray(client.moduleAssignments)) {
      assignments = window.scripticaModuleAssignmentsForClient(client, true);
    } else if (typeof window.scripticaTenantModuleAssignments === 'function') {
      assignments = window.scripticaTenantModuleAssignments(true);
    } else {
      assignments = [];
    }
    /* Arhivă după nomenclator (instituții publice): folderele sunt indicativele
       nomenclatorului, iar documentele se rutează după tipul lor — nu se mai
       adaugă câte un folder per șablon de flux. */
    var byNomenclator = type.archiveRouting === 'nomenclator';
    assignments.forEach(function (assignment) {
      if (byNomenclator) return;
      var vertical = window.scripticaVerticalById(assignment.verticalId);
      if (!vertical || vertical.builtin) return;
      if (!includeInactive && assignment.status !== 'activ') return;
      (assignment.templateIds || []).forEach(function (templateId) {
        var template = (window.SCRIPTICA_MOCK.superAdmin.flowTemplates || []).find(function (item) {
          return item.id === templateId && item.verticalId === assignment.verticalId;
        });
        if (!template) return;
        definitions.push({
          key: 'af_flow_' + template.id,
          defaultName: terminologyText(template.name, 'Flux'),
          depth: 0,
          parentKey: null,
          system: false,
          source: 'flowTemplate',
          inactive: assignment.status !== 'activ',
          flowTemplateId: template.id,
          verticalId: assignment.verticalId,
          docTypeIds: []
        });
      });
    });
    if (!definitions.some(function (folder) { return folder.system; })) {
      definitions.push({
        key: 'af_fallback', defaultName: 'Necategorisit', depth: 0, parentKey: null,
        system: true, source: 'system', inactive: false, docTypeIds: []
      });
    }
    var names = terminologyOverrides(client).archiveFolders || {};
    return definitions.map(function (folder) {
      var result = {};
      Object.keys(folder).forEach(function (key) { result[key] = folder[key]; });
      result.name = terminologyText(names[folder.key], folder.defaultName);
      return result;
    });
  };
  window.scripticaEffectiveArchiveFolderName = function (folderKey, defaultName, clientOrId) {
    var client = terminologyClient(clientOrId);
    var names = terminologyOverrides(client).archiveFolders || {};
    return terminologyText(names[folderKey], terminologyText(defaultName, 'Folder'));
  };
  /* ---- Nomenclatorul arhivistic (instituții publice) ----
     Dosarele verticalei = dosarele din arhivele „nomenclator” al căror
     `group` este numele verticalei. Fluxul alege dintre ele dosarul în
     care i se arhivează anexele la finalizare (`template.archiveFolderId`). */
  function walkArchiveFolders(tree, visit) {
    (tree || []).forEach(function (folder) {
      visit(folder);
      walkArchiveFolders(folder.children || [], visit);
    });
  }
  window.scripticaNomenclatorFoldersForVertical = function (verticalId) {
    var vertical = window.scripticaVerticalById(verticalId);
    if (!vertical) return [];
    var out = [];
    (window.SCRIPTICA_MOCK.superAdmin.clientTypes || []).forEach(function (type) {
      if (type.archiveRouting !== 'nomenclator') return;
      walkArchiveFolders(type.archiveTree || [], function (folder) {
        if (!folder.system && folder.group === vertical.name) out.push(folder);
      });
    });
    return out;
  };
  window.scripticaArchiveFolderById = function (folderId) {
    if (!folderId) return null;
    var found = null;
    (window.SCRIPTICA_MOCK.superAdmin.clientTypes || []).forEach(function (type) {
      walkArchiveFolders(type.archiveTree || [], function (folder) {
        if (!found && folder.id === folderId) found = folder;
      });
    });
    return found;
  };
  /* ---- Asistentul AI (verticala marcată `assistant`) ----
     Butonul din Mesagerie și lista verticalei creează o cerere de lămuriri
     goală și deschid workspace-ul ei; conversația se poartă acolo. */
  window.scripticaAssistantVertical = function () {
    if (typeof window.scripticaTenantActiveVerticalIds !== 'function') return null;
    var ids = window.scripticaTenantActiveVerticalIds();
    var vertical = window.scripticaFlowVerticals().find(function (v) { return v.assistant && ids.indexOf(v.id) !== -1; }) || null;
    if (!vertical) return null;
    if (typeof window.viewInScope === 'function' && !window.viewInScope(vertical.domain)) return null;
    return vertical;
  };
  window.scripticaCreateAiRequest = function (initialQuestion) {
    var vertical = window.scripticaAssistantVertical();
    if (!vertical) return null;
    var template = window.scripticaTemplatesForVertical(vertical.id)[0];
    if (!template) return null;
    var M = window.SCRIPTICA_MOCK;
    var me = (M.employees || []).find(function (e) { return e.id === M.currentUserId; });
    var now = new Date();
    var iso = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    var question = String(initialQuestion || '').trim();
    var record = {
      id: 'fi_ai_' + now.getTime(),
      verticalId: vertical.id, domain: vertical.domain,
      tenantAccountId: window.scripticaTenantAccountId() || null,
      name: question ? (question.length > 80 ? question.slice(0, 77) + '…' : question) : (vertical.itemLabel + ' nouă'),
      clientName: 'Asistentul AI Scriptica', clientContact: me ? me.name : '',
      archiveContainer: me && me.role ? me.role.split(' · ').pop() : '',
      templateId: template.id, templateName: template.name,
      startDate: '2026-04-20', currentStep: 1, stepsCompleted: 0,
      status: 'analiza', responsibleIds: me ? [me.id] : [],
      aiMessages: [], aiContext: null, aiPendingQuestion: question || null
    };
    window.scripticaFlowSave('flowItem', record);
    return record;
  };
  window.scripticaFlowItemsForVertical = function (verticalId) {
    return (window.SCRIPTICA_MOCK.flowItems || [])
      .filter(function (i) { return i.verticalId === verticalId; });
  };

  /* ---- Vocabularul documentelor (per verticală) ---- */
  window.scripticaDocumentCategoriesForVertical = function (verticalId) {
    var vertical = window.scripticaVerticalById(verticalId);
    return (vertical && vertical.documentCategories) || [];
  };
  window.scripticaDocumentTypesForVertical = function (verticalId) {
    var types = [];
    window.scripticaDocumentCategoriesForVertical(verticalId).forEach(function (category) {
      (category.documentTypes || []).forEach(function (type) {
        types.push({ id: type.id, name: type.name, verticalId: verticalId, categoryId: category.id });
      });
    });
    return types;
  };
  window.scripticaDocumentTypes = function () {
    var out = [];
    var seen = {};
    window.scripticaFlowVerticals().forEach(function (vertical) {
      window.scripticaDocumentTypesForVertical(vertical.id).forEach(function (type) {
        if (!seen[type.id]) { seen[type.id] = true; out.push(type); }
      });
    });
    /* Compatibilitate pentru structurile de arhivă salvate înainte ca
       vocabularul să fie mutat pe verticală. */
    (window.SCRIPTICA_MOCK.documentTypes || []).forEach(function (type) {
      if (!seen[type.id]) { seen[type.id] = true; out.push(type); }
    });
    return out;
  };
  window.scripticaDocumentCategoryForType = function (verticalId, value) {
    var wanted = String(value || '').toLocaleLowerCase('ro-RO');
    return window.scripticaDocumentCategoriesForVertical(verticalId).find(function (category) {
      return (category.documentTypes || []).some(function (type) {
        return type.id === value || String(type.name || '').toLocaleLowerCase('ro-RO') === wanted;
      });
    }) || null;
  };
  window.scripticaSystemDocumentCategory = function (verticalId) {
    return window.scripticaDocumentCategoriesForVertical(verticalId).find(function (category) {
      return category.system || category.id === 'necategorisit';
    }) || null;
  };
  /* ---- Structura de arhivă (per tip de client) ----
     Arhiva este o configurație separată: urmează nevoile fluxului și nu
     redefinește ori deține categoriile folosite de clasificarea A.I. */
  /* Clasa de identitate cromatică a unei verticale (.va-<culoare>) —
     culoarea se alege în HQ la crearea/editarea verticalei. */
  window.scripticaVerticalAccentClass = function (v) {
    return 'va-' + ((v && v.color) || 'mov');
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

  /* Contul HQ previzualizat pe suprafețele de tenant. Super Admin îl setează
     explicit din detaliul clientului; în lipsa lui păstrăm fallback-ul demo
     istoric pe tip, ca parcursurile existente să nu dispară. */
  window.scripticaTenantAccountId = function () {
    var clients = (window.SCRIPTICA_MOCK.superAdmin && window.SCRIPTICA_MOCK.superAdmin.clients) || [];
    var view = typeof window.getCurrentView === 'function' ? window.getCurrentView() : 'complet';
    /* Conturile cu utilizator intern propriu (ex. PMB → persona `pmb_intern`) sunt
       legate rigid de persona lor: persona vede mereu contul, iar contul nu se
       scurge în celelalte personas prin previzualizarea de tenant a HQ-ului. */
    var owned = clients.find(function (client) { return client.tenantPersona && client.tenantPersona === view; });
    if (owned) return owned.id;
    var id = '';
    try { id = localStorage.getItem('scriptica.tenantAccountId') || ''; } catch (e) {}
    var stored = clients.find(function (client) { return client.id === id; });
    if (!stored) return '';
    if (stored.tenantPersona && view !== 'superadmin' && view !== stored.tenantPersona) return '';
    return stored.id;
  };
  window.scripticaTenantAccount = function () {
    var id = window.scripticaTenantAccountId();
    return id ? (window.SCRIPTICA_MOCK.superAdmin.clients || []).find(function (client) { return client.id === id; }) || null : null;
  };
  window.scripticaSetTenantAccountId = function (id) {
    try {
      if (id) localStorage.setItem('scriptica.tenantAccountId', id);
      else localStorage.removeItem('scriptica.tenantAccountId');
    } catch (e) {}
  };
  window.scripticaTenantModuleAssignments = function (includeInactive) {
    var account = window.scripticaTenantAccount();
    if (account) return window.scripticaModuleAssignmentsForClient(account, includeInactive);
    var type = window.scripticaClientTypeById(window.scripticaTenantClientTypeId());
    var templateIds = (type && type.defaultTemplateIds) || [];
    return ((type && type.verticalIds) || []).map(function (verticalId) {
      return {
        id: 'legacy_' + verticalId,
        verticalId: verticalId,
        templateIds: templateIds.filter(function (templateId) {
          var template = (window.SCRIPTICA_MOCK.superAdmin.flowTemplates || []).find(function (item) { return item.id === templateId; });
          return template && template.verticalId === verticalId;
        }),
        status: 'activ', activatedAt: null, deactivatedAt: null
      };
    });
  };
  window.scripticaTenantActiveVerticalIds = function () {
    return window.scripticaTenantModuleAssignments(false).map(function (assignment) { return assignment.verticalId; });
  };

  /* Tipul de client al firmei demo sau al contului HQ previzualizat — folosit
     de Arhivă și Acasă pentru configurațiile de bază ale categoriei. */
  window.scripticaTenantClientTypeId = function () {
    var account = window.scripticaTenantAccount();
    if (account && account.clientTypeId) return account.clientTypeId;
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

  /* Documentele dosarului configurabil folosesc același motor vizual și
     aceleași acțiuni ca documentele unei situații contabile. */
  window.SCRIPTICA_MOCK.documents.push(
    {
      id: "doc_flow_001", situationId: "fi_0001", domain: "consultanta",
      filename: "contract_servicii_consultanta.pdf", uploadedAt: "2026-04-14T09:12:00",
      source: "email", pagesCount: 6, multiDoc: false, multiDocConfidence: null,
      tipDocument: "Contract", emitent: "Global Tax Advisory GmbH",
      numarDocument: "GTA-184/2026", dataEmiterii: "2026-04-05", perioadaFiscala: "2026-04",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "EUR",
      categoriePropusa: "Contract", broadCategory: "primite", subFilter: "ue",
      confidenceExtraction: 97, confidenceCategorization: 96,
      observatieAI: "Contract pentru servicii de consultanță prestate de un furnizor stabilit în Germania.",
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: "doc_flow_002", situationId: "fi_0001", domain: "consultanta",
      filename: "factura_servicii_GTA_aprilie.pdf", uploadedAt: "2026-04-14T09:14:00",
      source: "email", pagesCount: 1, multiDoc: false, multiDocConfidence: null,
      tipDocument: "Factură servicii", emitent: "Global Tax Advisory GmbH",
      numarDocument: "RE-2026-0418", dataEmiterii: "2026-04-08", perioadaFiscala: "2026-04",
      valoareFaraTVA: 4200, tvaProcent: 0, tvaValoare: 0, valoareTotala: 4200, moneda: "EUR",
      categoriePropusa: "Factură servicii", broadCategory: "primite", subFilter: "ue",
      confidenceExtraction: 98, confidenceCategorization: 97,
      observatieAI: "Factură fără TVA emisă de furnizor UE; este indicat codul valid de TVA al beneficiarului român.",
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: "doc_flow_003", situationId: "fi_0001", domain: "consultanta",
      filename: "corespondenta_speta_TVA.pdf", uploadedAt: "2026-04-15T14:30:00",
      source: "email", pagesCount: 3, multiDoc: false, multiDocConfidence: null,
      tipDocument: "E-mail de transmitere", emitent: "Electro Distrib S.R.L.",
      numarDocument: null, dataEmiterii: "2026-04-15", perioadaFiscala: "2026-04",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: null,
      categoriePropusa: "E-mail de transmitere", broadCategory: "primite", subFilter: null,
      confidenceExtraction: 94, confidenceCategorization: 92,
      observatieAI: "Corespondență cu explicațiile clientului privind natura serviciilor achiziționate.",
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: "doc_flow_004", situationId: "fi_0001", domain: "consultanta",
      filename: "extras_cod_fiscal_art_278.pdf", uploadedAt: "2026-04-18T11:05:00",
      source: "upload", pagesCount: 4, multiDoc: false, multiDocConfidence: null,
      tipDocument: "Legislație și practică", emitent: "Ministerul Finanțelor",
      numarDocument: null, dataEmiterii: "2026-04-18", perioadaFiscala: "2026",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: null,
      categoriePropusa: "Legislație și practică", broadCategory: "documentare", subFilter: null,
      confidenceExtraction: 99, confidenceCategorization: 93,
      observatieAI: "Extras de lucru: locul prestării serviciilor și persoana obligată la plata TVA.",
      verificat: true, verificatManual: false, pageThumbnails: []
    },
    {
      id: "doc_flow_005", situationId: "fi_0001", domain: "consultanta",
      filename: "proiect_opinie_fiscala_v1.docx", uploadedAt: "2026-04-20T09:40:00",
      source: "upload", pagesCount: 5, multiDoc: false, multiDocConfidence: null,
      tipDocument: "Opinie fiscală", emitent: "Scriptica Consulting",
      numarDocument: "OP-17/2026", dataEmiterii: "2026-04-20", perioadaFiscala: "2026-04",
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: null,
      categoriePropusa: "Opinie fiscală", broadCategory: "livrabile", subFilter: null,
      confidenceExtraction: 100, confidenceCategorization: 100,
      observatieAI: "Prima versiune a opiniei fiscale; revizia internă este încă în așteptare.",
      verificat: false, verificatManual: false, pageThumbnails: []
    },
    {
      id: "doc_flow_006", situationId: "fi_0001", domain: "consultanta",
      filename: "scan_anexa_neidentificata.pdf", uploadedAt: "2026-04-20T10:18:00",
      source: "email", pagesCount: 2, multiDoc: false, multiDocConfidence: null,
      tipDocument: "Altele", emitent: "—",
      numarDocument: null, dataEmiterii: null, perioadaFiscala: null,
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: null,
      categoriePropusa: "Altele", broadCategory: "necategorisit", subFilter: null,
      confidenceExtraction: 61, confidenceCategorization: 48,
      observatieAI: "Conținut insuficient pentru o clasificare sigură. Este necesară verificarea manuală.",
      verificat: false, verificatManual: false, pageThumbnails: []
    }
  );

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

/* Task-urile de încărcare păstrează documentele în recordul instanței de
   flux. După generarea tuturor documentelor seed le reunim cu colecțiile
   globale, astfel încât Arhiva și mesageria să le vadă după orice navigare. */
(function mergeEmbeddedFlowContent() {
  var M = window.SCRIPTICA_MOCK;
  function merge(collectionName, propertyName) {
    M[collectionName] = M[collectionName] || [];
    (M.flowItems || []).forEach(function (flowItem) {
      (flowItem[propertyName] || []).forEach(function (record) {
        var prepared = Object.assign({}, record, {
          situationId: flowItem.id,
          domain: record.domain || flowItem.domain
        });
        var existingIndex = M[collectionName].findIndex(function (candidate) {
          return String(candidate.id) === String(prepared.id);
        });
        if (existingIndex >= 0) M[collectionName][existingIndex] = Object.assign({}, M[collectionName][existingIndex], prepared);
        else M[collectionName].push(prepared);
      });
    });
  }
  merge('documents', 'documents');
  merge('messages', 'messages');
})();

/* ------------------------------------------------------------
   PMB — documentele dosarelor (arhiva după nomenclator + Acasă).
   Vizibile doar când `pmb_*` este în scope-ul persoanei.
   ------------------------------------------------------------ */
(function seedPmbDocuments() {
  var M = window.SCRIPTICA_MOCK;
  function d(id, sitId, domain, filename, uploadedAt, source, tip, emitent, nr, dataEmiterii, categorie, obs, pages) {
    return { id: id, situationId: sitId, domain: domain, filename: filename, uploadedAt: uploadedAt, source: source,
      pagesCount: pages || 1, multiDoc: false, multiDocConfidence: null,
      tipDocument: tip, emitent: emitent, numarDocument: nr, dataEmiterii: dataEmiterii, perioadaFiscala: dataEmiterii.slice(0, 7),
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: tip, broadCategory: categorie, subFilter: null,
      confidenceExtraction: 96, confidenceCategorization: 95, observatieAI: obs,
      verificat: true, verificatManual: false, pageThumbnails: [] };
  }
  M.documents.push(
    d("doc_pmb_001", "fi_pmb_ru_01", "pmb_ru", "X.b.1_anunt-concurs-consilier-superior-buget_nr-12-DMRU-2026_2026-03-16.pdf", "2026-03-16T10:05:00", "generat", "Anunț de concurs", "Primăria Municipiului București — DMRU", "12/DMRU/2026", "2026-03-16", "recrutare", "Anunț de concurs pentru funcția publică de consilier superior, Serviciul Buget; termen de depunere a dosarelor 20 de zile.", 2),
    d("doc_pmb_002", "fi_pmb_ru_01", "pmb_ru", "X.b.1_dosar-inscriere-candidat-1_nr-31207-2026_2026-04-02.pdf", "2026-04-02T14:40:00", "registratura", "Dosar de înscriere la concurs", "Candidat — A. Marinescu", "31207/2026", "2026-04-02", "recrutare", "Dosar de înscriere complet: formular, CV, diplomă, adeverință vechime, cazier.", 14),
    d("doc_pmb_003", "fi_pmb_ru_01", "pmb_ru", "X.b.1_pv-selectie-dosare_nr-PV-3-2026_2026-04-08.pdf", "2026-04-08T16:20:00", "generat", "Proces-verbal al comisiei de concurs", "Comisia de concurs", "PV-3/2026", "2026-04-08", "recrutare", "Selecția dosarelor: 4 candidați admiși, 1 respins pentru lipsa vechimii în specialitate.", 3),
    d("doc_pmb_004", "fi_pmb_ru_03", "pmb_ru", "X.c.1_sesizare-disciplinara_nr-4412-2026_2026-03-24.pdf", "2026-03-25T09:10:00", "registratura", "Sesizare disciplinară", "Direcția Generală Achiziții Publice", "4412/2026", "2026-03-24", "disciplina", "Sesizare privind neîndeplinirea atribuțiilor de serviciu; îndeplinește condițiile de formă din HG 1344/2007.", 4),
    d("doc_pmb_005", "fi_pmb_ru_05", "pmb_ru", "X.b.2_dispozitie-pg-promovare-dj_nr-418-2026_2026-03-06.pdf", "2026-03-06T11:30:00", "generat", "Dispoziție a Primarului General", "Primarul General", "418/2026", "2026-03-06", "cariera", "Dispoziție de promovare în grad profesional superior pentru 2 funcționari publici din Direcția Juridic.", 2),

    d("doc_pmb_006", "fi_pmb_ap_01", "pmb_achizitii", "V.a.1_referat-necesitate-iluminat-public_nr-RN-77-2026_2026-02-20.pdf", "2026-02-23T09:00:00", "generat", "Referat de necesitate", "Direcția Utilități Publice", "RN-77/2026", "2026-02-20", "initiere", "Referat de necesitate pentru servicii de mentenanță iluminat public; valoare estimată 1.840.000 RON fără TVA.", 5),
    d("doc_pmb_007", "fi_pmb_ap_01", "pmb_achizitii", "V.a.1_documentatie-atribuire-iluminat_nr-DA-19-2026_2026-03-18.pdf", "2026-03-18T13:15:00", "generat", "Documentație de atribuire", "DGAP", "DA-19/2026", "2026-03-18", "documentatie", "Fișa de date, caiet de sarcini și DUAE — procedură simplificată, criteriul „cel mai bun raport calitate-preț”.", 48),
    d("doc_pmb_008", "fi_pmb_ap_01", "pmb_achizitii", "V.a.1_oferta-luxten-lighting_nr-OF-2026-0442_2026-04-09.pdf", "2026-04-10T10:00:00", "email", "Ofertă", "Luxten Lighting Company S.A.", "OF-2026-0442", "2026-04-09", "evaluare", "Ofertă tehnică și financiară depusă în SEAP; propunere financiară 1.712.400 RON fără TVA.", 62),
    d("doc_pmb_009", "fi_pmb_ap_04", "pmb_achizitii", "V.b.1_contract-proiectare-pasaj-unirii_nr-C-8-2026_2026-01-22.pdf", "2026-01-22T15:45:00", "generat", "Contract de achiziție publică", "PMB / Search Corporation S.R.L.", "C-8/2026", "2026-01-22", "contractare", "Contract de servicii de proiectare semnat după procedura simplificată; durată 8 luni.", 27),
    d("doc_pmb_024", "fi_pmb_ap_05", "pmb_achizitii", "V.b.1_chitanta-becuri-led-philips_nr-CH-2026-0187_2026-02-17.pdf", "2026-02-18T11:05:00", "email", "Document de plată (factură / chitanță)", "Electric Plus Distribution S.R.L.", "CH-2026-0187", "2026-02-17", "contractare", "Chitanță pentru 240 becuri LED Philips CorePro 9W E27, achiziție directă; valoare totală 6.480 RON cu TVA, plătită din bugetul administrativ.", 1),
    d("doc_pmb_025", "fi_pmb_ap_05", "pmb_achizitii", "V.a.1_oferta-becuri-led-osram-respinsa_nr-OF-441-2026_2026-02-11.pdf", "2026-02-12T09:30:00", "email", "Ofertă", "Lumina Pro Trading S.R.L.", "OF-441/2026", "2026-02-11", "evaluare", "Ofertă pentru becuri LED Osram Value 8.5W; respinsă la consultarea catalogului SEAP — preț unitar mai mare cu 14%.", 2),
    d("doc_pmb_026", "fi_pmb_ext_01", "pmb_solicitari_externe", "I.a.1_fotografii-santier-lipscani_nr-P-2210-2026-A_2026-04-18.pdf", "2026-04-18T20:35:00", "email", "Petiție", "Maria Ionescu", "P-2210/2026-A", "2026-04-18", "petitii", "Completare la petiție: 3 fotografii cu utilaje în funcțiune după ora 22:00 pe Str. Lipscani nr. 20, transmise de petentă.", 3),
    d("doc_pmb_010", "fi_pmb_ap_03", "pmb_achizitii", "V.b.1_nota-justificativa-act-aditional-2_nr-AA-2-2026_2026-04-15.pdf", "2026-04-15T12:20:00", "generat", "Act adițional", "DGAP", "AA-2/2026", "2026-04-15", "contractare", "Proiect de act adițional nr. 2 — prelungire durată contract pază cu 3 luni, art. 221 alin. (1) lit. e).", 6),

    d("doc_pmb_011", "fi_pmb_inv_01", "pmb_investitii", "VII.a.1_nota-conceptuala-cresa-straulesti_nr-NC-3-2026_2026-01-15.pdf", "2026-01-19T09:30:00", "generat", "Notă conceptuală", "Direcția Generală Investiții", "NC-3/2026", "2026-01-15", "fundamentare", "Notă conceptuală: creșă 60 de locuri și grădiniță 120 de locuri, teren proprietate publică a Municipiului București.", 8),
    d("doc_pmb_012", "fi_pmb_inv_01", "pmb_investitii", "VII.a.1_studiu-fezabilitate-cresa-straulesti_nr-SF-118-2026_2026-03-25.pdf", "2026-03-27T17:00:00", "email", "Studiu de fezabilitate", "Urban Design Studio S.R.L.", "SF-118/2026", "2026-03-25", "fundamentare", "Studiu de fezabilitate cu două scenarii; scenariul recomandat 14,2 mil. RON cu TVA, durată de execuție 18 luni.", 96),
    d("doc_pmb_013", "fi_pmb_inv_02", "pmb_investitii", "VII.b.1_ordin-incepere-pasaj-unirii_nr-OI-41-2025_2025-12-01.pdf", "2025-12-01T08:45:00", "generat", "Ordin de începere a lucrărilor", "Direcția Generală Investiții", "OI-41/2025", "2025-12-01", "executie", "Ordin de începere a lucrărilor structurale la Pasajul Unirii; predare amplasament la 03.12.2025.", 2),
    d("doc_pmb_014", "fi_pmb_inv_02", "pmb_investitii", "VII.b.1_situatie-lucrari-martie-2026_nr-SL-4-2026_2026-04-03.pdf", "2026-04-07T11:10:00", "email", "Situație de lucrări", "Erbașu Construcții S.A.", "SL-4/2026", "2026-04-03", "executie", "Situație de lucrări luna martie 2026, vizată de dirigintele de șantier; stadiu fizic cumulat 38%.", 22),
    d("doc_pmb_015", "fi_pmb_inv_03", "pmb_investitii", "VII.a.1_dali-consolidare-scoala-12_nr-DALI-27-2026_2026-04-10.pdf", "2026-04-11T14:00:00", "email", "DALI", "Popp & Asociații S.R.L.", "DALI-27/2026", "2026-04-10", "fundamentare", "Documentație de avizare a lucrărilor de intervenții — consolidare seismică, clasa de risc RsI.", 71),

    d("doc_pmb_016", "fi_pmb_ext_01", "pmb_solicitari_externe", "I.a.1_petitie-zgomot-lipscani_nr-P-2210-2026_2026-04-02.pdf", "2026-04-02T09:20:00", "registratura", "Petiție", "Maria Ionescu", "P-2210/2026", "2026-04-02", "petitii", "Petiție privind zgomotul produs de un șantier în afara programului legal; repartizată Poliției Locale.", 2),
    d("doc_pmb_017", "fi_pmb_ext_04", "pmb_solicitari_externe", "I.a.1_raspuns-petitie-calea-mosilor_nr-P-1804-2026_2026-03-30.pdf", "2026-03-30T13:00:00", "generat", "Răspuns la petiție", "Primăria Municipiului București", "P-1804/2026", "2026-03-30", "petitii", "Răspuns comunicat în termen: lucrările de reparații au fost programate în luna aprilie 2026.", 1),
    d("doc_pmb_018", "fi_pmb_ext_02", "pmb_solicitari_externe", "I.a.2_cerere-544-contracte-salubrizare_nr-IP-96-2026_2026-04-15.pdf", "2026-04-15T10:30:00", "email", "Cerere de informații de interes public", "Asociația Pro Transparență", "IP-96/2026", "2026-04-15", "informatii_publice", "Solicitare a listei contractelor de salubrizare încheiate în 2025, cu valori și durate.", 1),
    d("doc_pmb_019", "fi_pmb_ext_03", "pmb_solicitari_externe", "VI.a.1_cerere-certificat-urbanism-dacia-45_nr-CU-518-2026_2026-03-30.pdf", "2026-03-30T15:15:00", "registratura", "Cerere certificat de urbanism", "Imobiliare Dacia S.R.L.", "CU-518/2026", "2026-03-30", "urbanism", "Cerere-tip însoțită de plan de situație și extras CF; imobil situat în zonă protejată.", 9),

    d("doc_pmb_020", "fi_pmb_int_01", "pmb_solicitari_interne", "I.b.1_referat-proiect-hcgmb-taxe-locale-2027_nr-R-233-2026_2026-04-16.pdf", "2026-04-16T09:00:00", "generat", "Referat", "Direcția Venituri", "R-233/2026", "2026-04-16", "corespondenta_interna", "Proiect de hotărâre privind taxele și impozitele locale 2027, transmis spre aviz de legalitate.", 34),
    d("doc_pmb_021", "fi_pmb_int_02", "pmb_solicitari_interne", "I.b.1_referat-suplimentare-posturi-registratura_nr-R-219-2026_2026-04-13.pdf", "2026-04-13T11:40:00", "generat", "Referat", "Direcția Relații cu Publicul și Registratură", "R-219/2026", "2026-04-13", "corespondenta_interna", "Referat privind suplimentarea cu 2 posturi a Serviciului Registratură, cu fundamentarea volumului de lucru.", 3),
    d("doc_pmb_022", "fi_pmb_int_04", "pmb_solicitari_interne", "II.a.1_ordin-deplasare-cluj_nr-OD-14-2026_2026-03-16.pdf", "2026-03-16T08:30:00", "generat", "Ordin de deplasare", "DGAP", "OD-14/2026", "2026-03-16", "deplasari", "Ordin de deplasare pentru conferința națională de achiziții publice, Cluj-Napoca, 18–19 martie 2026.", 1),
    d("doc_pmb_023", "fi_pmb_int_04", "pmb_solicitari_interne", "II.a.1_decont-cheltuieli-cluj_nr-DC-9-2026_2026-03-23.pdf", "2026-03-23T16:10:00", "registratura", "Decont de cheltuieli", "Andrei Constantin", "DC-9/2026", "2026-03-23", "deplasari", "Decont de cheltuieli de deplasare: transport, cazare 2 nopți, diurnă; documente justificative atașate.", 6)
  );

  /* Mesaje din fluxurile PMB (panoul Mesagerie) — vizibile când domeniul lor e în scope */
  M.messages.push(
    { id: 901, situationId: "fi_pmb_ext_01", clientCompany: "Maria Ionescu", clientContact: "Maria Ionescu", sender: "client", senderName: "Maria Ionescu",
      date: "2026-04-18", body: "Bună ziua, revin cu fotografii de aseară — șantierul a lucrat din nou după ora 22:00. Vă rog să îmi comunicați ce măsuri s-au dispus.",
      attachments: [{ count: 3, label: "fotografii la petiția privind zgomotul", docIds: ["doc_pmb_026"] }], chips: [{ label: "Petiție", style: "neutral" }], read: false },
    { id: 902, situationId: "fi_pmb_ap_01", clientCompany: "Luxten Lighting Company S.A.", clientContact: "Dep. Ofertare", sender: "client", senderName: "Luxten Lighting Company S.A.",
      date: "2026-04-17", body: "Am transmis în SEAP clarificările solicitate la propunerea tehnică (fișele tehnice pentru corpurile de iluminat LED). Rămânem la dispoziție.",
      attachments: [{ count: 2, label: "documente la evaluarea ofertelor", docIds: ["doc_pmb_008", "doc_pmb_007"] }], chips: [{ label: "Clarificări SEAP", style: "neutral" }], read: false },
    { id: 903, situationId: "fi_pmb_inv_02", clientCompany: "Erbașu Construcții S.A.", clientContact: "Diriginte de șantier", sender: "client", senderName: "Erbașu Construcții S.A.",
      date: "2026-04-16", body: "Situația de lucrări pe luna martie a fost vizată de dirigintele de șantier. Semnalăm o întârziere de 10 zile la lucrările structurale din cauza avizului de la Metrorex.",
      attachments: [{ count: 1, label: "situație de lucrări martie 2026", docIds: ["doc_pmb_014"] }], chips: [{ label: "Întârziere", style: "critical" }], read: true }
  );

  /* Conversațiile cu asistentul intră și ele în arhivă (I.d.1) ca note ale asistentului */
  function transcript(id, sitId, filename, at, q, n) {
    return { id: id, situationId: sitId, domain: "pmb_asistent_ai", filename: filename, uploadedAt: at, source: "generat",
      pagesCount: 1, multiDoc: false, multiDocConfidence: null, tipDocument: "Notă de răspuns a asistentului", emitent: "Asistentul AI Scriptica",
      numarDocument: null, dataEmiterii: at.slice(0, 10), perioadaFiscala: at.slice(0, 7), valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: "RON",
      categoriePropusa: "Notă de răspuns a asistentului", broadCategory: "raspunsuri", subFilter: null, confidenceExtraction: 100, confidenceCategorization: 100,
      observatieAI: "Transcriptul conversației cu asistentul — " + n + " mesaje. Ultima întrebare: „" + q + "”.", verificat: false, verificatManual: false, pageThumbnails: [], aiTranscript: true };
  }
  M.documents.push(
    transcript("doc_ai_transcript_fi_pmb_ai_01", "fi_pmb_ai_01", "I.c.1_conversatie-asistent-furnizori-iluminat_2026-04-17.pdf", "2026-04-17T09:13:13", "Care este stadiul?", 4),
    transcript("doc_ai_transcript_fi_pmb_ai_02", "fi_pmb_ai_02", "I.c.1_conversatie-asistent-concursuri-recrutare_2026-04-19.pdf", "2026-04-19T14:02:03", "Câte concursuri de recrutare sunt în derulare?", 2)
  );

  /* Persona „Utilizator Intern PMB": echipa vizibilă în aplicație (responsabili,
     widgetul Echipa, antetul) devine echipa Primăriei, nu a firmei de contabilitate. */
  var view = typeof window.getCurrentView === 'function' ? window.getCurrentView() : 'complet';
  if (view === 'pmb_intern' && M.pmb) {
    M.employees = M.pmb.employees;
    M.currentUserId = M.pmb.currentUserId;
    var me = M.pmb.employees.find(function (e) { return e.id === M.pmb.currentUserId; });
    if (me) M.currentUser = { id: me.id, name: me.name.split(' ')[0], fullName: me.name, role: me.role, avatarId: me.avatarId };
  }
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
      var flowItems = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.flowItems) || [];
      all = all.filter(function (d) {
        var domain = d.domain;
        if (!domain && d.situationId) {
          var flowItem = flowItems.find(function (item) { return item.id === d.situationId; });
          domain = flowItem && flowItem.domain;
        }
        return scope.indexOf(domain || 'contabil') !== -1;
      });
    }
    if (!isClientView()) return all;
    var visibleSitIds = window.getVisibleSituations().map(function (s) { return s.id; });
    return all.filter(function (d) { return visibleSitIds.indexOf(d.situationId) !== -1; });
  };

  window.getVisibleMessages = function () {
    var all = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.messages) || [];
    /* Mesajele situațiilor contabile cer 'contabil' în scope; mesajele dosarelor
       generice urmează domeniul verticalei lor (ex. persona PMB). */
    if (typeof window.viewInScope === 'function' && typeof window.getViewScope === 'function') {
      var scope = window.getViewScope();
      var flowItems = (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.flowItems) || [];
      all = all.filter(function (m) {
        var flowItem = m.situationId ? flowItems.find(function (item) { return item.id === m.situationId; }) : null;
        if (flowItem) return scope.indexOf(flowItem.domain) !== -1;
        return scope.indexOf('contabil') !== -1;
      });
      if (!all.length) return [];
    }
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
