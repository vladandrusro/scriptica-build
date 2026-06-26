/* ============================================================
   Scriptica — Spațiul de lucru al Misiunii de Audit (Brief #4)
   Reutilizează componentele reale (step-card, anexa-card +
   anexa-fill, task-detail-row + time clusters, docs-table,
   message-card) și randează o misiune `domain:'audit'`.
   Elemente NOI: cardul „Obiectivele Misiunii" expandabil inline,
   2 subtipuri de mesaj smart (statice din seed), rândul fixat
   „Dosar Permanent" în tabelul de documente.
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;

  /* Persona „autoritate decidentă" — rol de aprobare EXTERN, read-only. */
  function isAuthority() {
    return typeof window.getCurrentView === 'function' && window.getCurrentView() === 'autoritate';
  }
  function statusOverrides() {
    try { return JSON.parse(localStorage.getItem('scriptica.auditMissionStatus') || '{}') || {}; }
    catch (e) { return {}; }
  }
  function setStatusOverride(id, st) {
    try { var m = statusOverrides(); m[id] = st; localStorage.setItem('scriptica.auditMissionStatus', JSON.stringify(m)); }
    catch (e) { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK || document.body.getAttribute('data-page') !== 'misiune-audit-workspace') return;
    var mission = resolveMission();
    if (!mission) return;
    seedDemoAnexaResponses(mission);
    render(mission);
    if (isAuthority()) renderDecisionBar(mission);
    window.addEventListener('scriptica:anexa-saved', function () { renderStepBody(mission); });
  });

  /* ---------- Utils ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function employeeById(id) { return (MOCK.employees || []).find(function (e) { return e.id === id; }) || null; }
  function avatarBox(user, cls, size) {
    if (!user) return '';
    var inner = (typeof window.renderAvatar === 'function') ? window.renderAvatar(user, size || 32) : esc((user.name || '?').charAt(0));
    return '<span class="' + cls + '" title="' + esc(user.name || '') + '">' + inner + '</span>';
  }
  function toast(variant, msg) { if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, msg); }
  function typeOf(mission) { return (MOCK.situationTypes || []).find(function (t) { return t.id === mission.typeId; }) || null; }
  function stepName(mission) {
    var t = typeOf(mission);
    var st = (t && t.steps) ? t.steps[mission.currentStep - 1] : null;
    return (st && st.name) || ('Pasul ' + mission.currentStep);
  }

  /* ---------- Mission resolution (din #3; altfel fallback local) ---------- */
  function resolveMission() {
    var params = new URLSearchParams(window.location.search);
    var id = params.get('id');
    var pool = MOCK.auditMissions || [];
    var m = id ? pool.find(function (x) { return x.id === id; }) : null;
    if (!m) m = pool.find(function (x) { return x.id === 'audit_0001'; }) || pool[0];
    /* fallback local — se folosește misiunea din #3 când e disponibilă. */
    if (!m) {
      m = {
        id: 'audit_local', domain: 'audit',
        name: 'Audit de regularitate (demo local)',
        entityName: 'Primăria Sectorului 1',
        typeId: 'misiune_audit_regularitate', typeName: 'Misiune de audit de regularitate',
        currentStep: 2, totalSteps: 4,
        responsibleIds: [2, 1]
      };
    }
    /* Copie de lucru + override de status (din decizia autorității, persistat). */
    m = Object.assign({}, m);
    var ov = statusOverrides();
    if (ov[m.id]) m.status = ov[m.id];
    /* anexa-fill are nevoie de responsibleStepName pe obiectul misiune. */
    if (!m.responsibleStepName) {
      var first = employeeById((m.responsibleIds || [])[0]);
      m.responsibleStepName = first ? first.name : '';
    }
    /* Subtitlul modalului de completare folosește typeLabel · clientCompany;
       pe misiuni de audit le mapăm din typeName · entityName. */
    if (!m.typeLabel) m.typeLabel = m.typeName || 'Misiune de audit';
    if (!m.clientCompany) m.clientCompany = m.entityName || '';
    return m;
  }

  /* ============================================================
     Conținut demo local pentru workspace (tasks/obiective/docs/
     mesaje). Misiunea în sine (nume/entitate/etapă/echipă) vine
     din #3; acest conținut e ilustrativ pentru prototip.
     ============================================================ */
  var objectives = [
    {
      title: 'Analiza modului de organizare și reglementare a achizițiilor directe',
      constatare: 'Procedura operațională pentru achiziții directe nu a fost actualizată din 2021; nu există un registru centralizat al achizițiilor sub prag.',
      iregularitate: 'Trei achiziții directe efectuate fără notă justificativă privind estimarea valorii.',
      recomandare: 'Actualizarea procedurii operaționale și constituirea unui registru centralizat al achizițiilor directe.'
    },
    {
      title: 'Verificarea respectării termenelor de plată către furnizori',
      constatare: 'Termenele sunt în general respectate; 2 cazuri de întârziere peste 60 de zile, justificate prin lipsă temporară de disponibil.',
      iregularitate: '',
      recomandare: 'Monitorizarea lunară a termenelor de plată și constituirea unui fond de rulment.'
    }
  ];

  /* Etapa IV — Urmărirea recomandărilor. Recomandările DERIVĂ din obiective;
     seed pe misiunea închisă/aprobată. „Neînsușită" = recomandare cu care
     autoritatea nu a fost de acord (stare manuală în prototip). */
  var REC_STATUSES = [
    { key: 'implementata', label: 'Implementată' },
    { key: 'partial', label: 'Parțial implementată' },
    { key: 'neimplementata', label: 'Neimplementată' },
    { key: 'neinsusita', label: 'Neînsușită' }
  ];
  var recommendations = [
    { text: 'Actualizarea procedurii operaționale pentru achiziții directe și constituirea unui registru centralizat.', obiectiv: 'Obiectiv 1 — Achiziții directe', status: 'implementata', plan: 'Revizuire PO + registru digital · termen 30.09.2026 · Direcția Achiziții', progres: 'Procedură aprobată; registrul în uz din august 2026.' },
    { text: 'Întocmirea notelor justificative de estimare a valorii pentru toate achizițiile directe.', obiectiv: 'Obiectiv 1 — Achiziții directe', status: 'partial', plan: 'Template notă + instruire personal · termen 31.10.2026 · Direcția Achiziții', progres: 'Template creat; instruirea personalului în curs.' },
    { text: 'Implementarea unui sistem de avertizare la depășirea pragului de achiziție directă.', obiectiv: 'Obiectiv 1 — Achiziții directe', status: 'neinsusita', plan: '—', progres: 'Entitatea consideră măsura disproporționată; neînsușită.' },
    { text: 'Monitorizarea lunară a termenelor de plată către furnizori.', obiectiv: 'Obiectiv 2 — Termene de plată', status: 'implementata', plan: 'Raport lunar automat · termen 31.08.2026 · Direcția Economică', progres: 'Raport activ din iulie 2026.' },
    { text: 'Constituirea unui fond de rulment pentru evitarea întârzierilor de plată.', obiectiv: 'Obiectiv 2 — Termene de plată', status: 'neimplementata', plan: 'Analiză bugetară + aprobare consiliu · termen 31.12.2026 · Direcția Buget', progres: 'Necesită aprobarea consiliului local — neînceput.' },
    { text: 'Separarea atribuțiilor între inițierea și aprobarea plăților.', obiectiv: 'Obiectiv 2 — Control intern', status: 'partial', plan: 'Revizuire fișe de post · termen 30.11.2026 · Resurse Umane', progres: 'Fișele a 2 din 4 posturi revizuite.' }
  ];

  var tasks = [
    { id: 'wt1', label: 'Confirmă primirea Dosarului Permanent', completed: true, times: [{ uid: 2, label: '30m' }] },
    { id: 'wt2', label: 'Realizează interviurile cu personalul structurii auditate', completed: false, times: [{ uid: 2, label: '2h 25m' }, { uid: 1, label: '45m' }] },
    { id: 'wt3', label: 'Testează tranzacțiile selectate pe eșantion', completed: false, times: [{ uid: 1, label: '50m' }] },
    { id: 'wt4', label: 'Documentează probele de audit în dosarul curent', completed: false, times: [] }
  ];

  var DOC_CATEGORIES = [
    { key: 'all', label: 'Toate' },
    { key: 'proba', label: 'Probe de audit' },
    { key: 'entitate', label: 'Documente entitate' },
    { key: 'normativ', label: 'Acte normative' },
    { key: 'necategorisit', label: 'Necategorisit' }
  ];
  var docs = [
    { cat: 'proba', icon: 'mail', name: 'contracte_achizitii_2024.pdf', tip: 'Probă', desc: '3 contracte de achiziție directă; valorile estimate nu sunt documentate prin notă justificativă.', status: 'pending', statusLabel: 'În așteptare' },
    { cat: 'proba', icon: 'description', name: 'registru_plati_furnizori.xlsx', tip: 'Probă', desc: 'Evidența plăților; 2 întârzieri peste 60 de zile identificate automat.', status: 'verificat', statusLabel: 'Verificat' },
    { cat: 'entitate', icon: 'description', name: 'organigrama_primarie.pdf', tip: 'Document entitate', desc: 'Structura organizatorică a Primăriei Sector 1, valabilă 2024.', status: 'verificat', statusLabel: 'Verificat' },
    { cat: 'normativ', icon: 'gavel', name: 'HG_626_1998.pdf', tip: 'Act normativ', desc: 'Hotărâre de Guvern relevantă pentru obiectivul achizițiilor; reformată 04.09.2015.', status: 'verificat', statusLabel: 'Verificat' },
    { cat: 'proba', icon: 'description', name: 'esantion_tranzactii.xlsx', tip: 'Probă', desc: 'Eșantion de 40 de tranzacții selectate pentru testare pe baza pragului de semnificație.', status: 'pending', statusLabel: 'În așteptare' },
    { cat: 'necategorisit', icon: 'help', name: 'scan_2024_06_21.pdf', tip: 'Necategorisit', desc: 'Document scanat, neclasificat încă de AI — necesită verificare manuală.', status: 'pending', statusLabel: 'Neclasificat' }
  ];

  /* Mesaje (statice din seed) — incl. 2 subtipuri smart. */
  var messages = [
    { type: 'dosar_check', title: 'Verifică Dosarul Permanent', icon: 'inventory_2',
      body: 'Entitatea a expus Dosarul Permanent în format digital (adăugat 21.06.2024). Confirmă că ai luat la cunoștință înainte de a continua intervenția.',
      action: 'Am luat la cunoștință', meta: 'Mesaj Automat Scriptica A.I.' },
    { type: 'human', sender: 'Loredana Popescu', date: '13.05, 14:21',
      body: 'Am făcut rost de documente. Le-am atașat aici.', attach: '@contracte_achizitii_2024.pdf' },
    { type: 'step_completion', title: 'Anexă finalizată',
      body: 'Iulian Popescu a completat Anexa — Chestionar de Control Intern (100%).', meta: 'Mesaj Automat Scriptica A.I.', date: '13.05, 15:02' },
    { type: 'deadline_projection', title: 'Proiecție termen', icon: 'schedule',
      body: 'Iulian Popescu a completat o anexă. La ritmul actual, termenul misiunii (25 oct 2024) va fi depășit cu aproximativ 4 zile. Recomandare: prioritizează FIAP și formularul de iregularități.',
      meta: 'Mesaj Automat Scriptica A.I. · proiecție' }
  ];

  /* Seed demo completion pentru câteva anexe (bază MOCK.anexaResponseSeeds). */
  function seedDemoAnexaResponses(mission) {
    if (!MOCK.anexaResponseSeeds) MOCK.anexaResponseSeeds = {};
    var k = function (a) { return mission.id + '::' + a; };
    if (!MOCK.anexaResponseSeeds[k('anx_audit_chestionar_ci')]) {
      MOCK.anexaResponseSeeds[k('anx_audit_chestionar_ci')] = {
        values: { '1': 'Controale formalizate și documentate.', '2': 'Da' },
        completedByName: 'Iulian Popescu'
      };
    }
    if (!MOCK.anexaResponseSeeds[k('anx_audit_evaluare_ci')]) {
      MOCK.anexaResponseSeeds[k('anx_audit_evaluare_ci')] = {
        values: { '1': 'Mediu' },
        completedByName: null
      };
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function render(mission) {
    renderTitle(mission);
    renderStepBanner(mission);
    renderStepBody(mission);
    renderDocs(mission);
    renderMessages(mission);
  }

  function renderTitle(mission) {
    var el = $('ws-title');
    if (!el) return;
    el.innerHTML =
      '<button class="detail-title__back" type="button" id="ws-back" aria-label="Înapoi la Misiuni Audit">' +
        '<span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>' +
      '</button>' +
      '<span class="detail-title__text">' + esc(mission.entityName) + ' — ' + esc(mission.name) + '</span>';
    var back = $('ws-back');
    if (back) back.addEventListener('click', function () { window.location.href = 'misiuni-audit.html'; });
  }

  function renderStepBanner(mission) {
    var el = $('ws-step-banner');
    if (!el) return;
    var ids = mission.responsibleIds || [];
    var avatarsHtml = ids.map(function (id, i) {
      return avatarBox(employeeById(id), 'avatar' + (i === 0 ? '' : ' avatar--sm'), i === 0 ? 64 : 56);
    }).join('');
    el.innerHTML =
      '<div class="step-banner__row">' +
        '<div class="step-banner__left">' +
          '<span class="step-banner__pill">Pasul ' + mission.currentStep + '/' + mission.totalSteps + '</span>' +
          '<span class="step-banner__sep">•</span>' +
          '<span class="step-banner__name">' + esc(stepName(mission)) + '</span>' +
        '</div>' +
        '<div class="step-banner__right">' +
          '<div class="avatars-cluster" aria-label="Echipă misiune">' + avatarsHtml + '</div>' +
          '<button class="timer-btn" type="button" id="ws-timer" title="Pornește cronometrarea" aria-label="Pornește cronometrarea">' +
            '<span class="material-symbols-outlined filled" aria-hidden="true">timer</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<p class="step-banner__help-text">Pentru a finaliza acest pas, completează anexele și confirmă acțiunile necesare.</p>';
    var t = $('ws-timer');
    if (t) t.addEventListener('click', function () { toast('info', 'Cronometrarea pornește din pagina de time tracking.'); });
  }

  function renderStepBody(mission) {
    var el = $('ws-step-body');
    if (!el) return;
    var ro = isAuthority();

    /* Etapa IV — corpul pasului devine tabelul de recomandări.
       Rămâne accesibil chiar dacă misiunea e aprobată/închisă. */
    if (mission.currentStep === 4) {
      renderRecommendations(el, ro);
      return;
    }

    var tasksHtml = '<div class="task-panel__list">' + tasks.map(function (t) { return taskRowHtml(t, ro); }).join('') + '</div>';
    var anexeOk = window.SCRIPTICA_ANEXE ? window.SCRIPTICA_ANEXE.allComplete(mission) : false;
    var tasksOk = tasks.every(function (t) { return t.completed; });
    var canFinalize = anexeOk && tasksOk;
    var blockMsg = 'Finalizați toate task-urile și anexele pentru a trece la etapa următoare.';

    /* Footer-ul auditorului — DOAR pentru echipă; autoritatea primește bara de decizie. */
    var actionsHtml = ro ? '' :
      '<div class="step-actions">' +
        '<button type="button" class="btn btn--critical" id="ws-cancel">' +
          '<span class="material-symbols-outlined" aria-hidden="true">cancel</span>Anulează misiunea' +
        '</button>' +
        '<div class="step-actions__center">' +
          '<button type="button" class="btn btn--pending" id="ws-assist">' +
            '<span class="material-symbols-outlined" aria-hidden="true">help_outline</span>Cere asistență' +
          '</button>' +
        '</div>' +
        '<button type="button" class="btn btn--primary" id="ws-finalize"' + (canFinalize ? '' : ' disabled title="' + esc(blockMsg) + '"') + '>' +
          'Finalizează pasul<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' +
        '</button>' +
      '</div>';

    el.innerHTML =
      '<div id="ws-anexe"></div>' +
      '<div class="task-panel' + (ro ? ' is-readonly' : '') + '">' + tasksHtml + actionsHtml + '</div>';

    /* Anexe reale via anexa-fill (carduri + math % + form full-screen).
       readonly:true pentru autoritate → formularul se deschide ne-editabil. */
    if (window.SCRIPTICA_ANEXE) {
      window.SCRIPTICA_ANEXE.renderCards($('ws-anexe'), mission, { readonly: ro });
    }
    injectObiectiveCard(ro);

    if (!ro) {
      el.querySelectorAll('[data-ws-task]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var id = cb.getAttribute('data-ws-task');
          var t = tasks.find(function (x) { return x.id === id; });
          if (t) t.completed = cb.checked;
          renderStepBody(mission);
        });
      });
      var c = $('ws-cancel'); if (c) c.addEventListener('click', function () { toast('info', 'Anularea misiunii necesită confirmare (prototip).'); });
      var a = $('ws-assist'); if (a) a.addEventListener('click', function () { toast('info', 'Cererea de asistență se trimite echipei (prototip).'); });
      var f = $('ws-finalize'); if (f && !f.disabled) f.addEventListener('click', function () { toast('success', 'Pas finalizat.'); });
    }
  }

  function taskRowHtml(t, ro) {
    var timeBlock = '';
    if (t.times && t.times.length) {
      timeBlock = '<span class="task-time-cluster">' + t.times.map(function (ut) {
        var u = employeeById(ut.uid);
        if (!u) return '';
        return '<span class="task-time" title="' + esc(u.name) + ': ' + esc(ut.label) + '">' +
          avatarBox(u, 'avatar avatar--pill', 40) +
          '<span class="task-time__label">' + esc(ut.label) + '</span>' +
        '</span>';
      }).join('') + '</span>';
    }
    return '<label class="task-detail-row">' +
      '<input type="checkbox" data-ws-task="' + esc(t.id) + '"' + (t.completed ? ' checked' : '') + (ro ? ' disabled' : '') + '>' +
      '<span class="task-detail-row__label' + (t.completed ? ' is-done' : '') + '">' + esc(t.label) + '</span>' +
      timeBlock +
    '</label>';
  }

  /* ---------- Cardul „Obiectivele Misiunii" (inline, expandabil) ---------- */
  function injectObiectiveCard(ro) {
    var container = $('ws-anexe');
    if (!container) return;
    var grid = container.querySelector('.anexa-cards__grid');
    if (!grid) {
      /* Biblioteca de anexe lipsește — construim un wrapper minimal. */
      container.innerHTML = '<div class="anexa-cards"><div class="anexa-cards__label">ANEXE PAS ' +
        '</div><div class="anexa-cards__grid"></div></div>';
      grid = container.querySelector('.anexa-cards__grid');
    }
    /* elimină cardul de obiective generat de anexa-fill (îl randăm noi inline). */
    var generated = grid.querySelector('[data-anexa-open="anx_obiective_audit"]');
    if (generated) generated.remove();

    var card = document.createElement('div');
    card.className = 'anexa-card anexa-card--obiective is-open';
    card.id = 'ws-obj-card';
    card.appendChild(buildObjHead());
    card.appendChild(buildObjBody(ro));
    grid.insertBefore(card, grid.firstChild);

    card.querySelector('.obj-head').addEventListener('click', function () {
      card.classList.toggle('is-open');
    });
  }

  function buildObjHead() {
    var head = document.createElement('div');
    head.className = 'obj-head';
    head.innerHTML =
      '<div class="obj-head__left">' +
        '<span class="material-symbols-outlined obj-head__icon" aria-hidden="true">flag</span>' +
        '<span class="obj-head__title">Obiectivele Misiunii</span>' +
        '<span class="obj-head__count">· ' + objectives.length + ' ' + (objectives.length === 1 ? 'obiectiv' : 'obiective') + '</span>' +
      '</div>' +
      '<span class="material-symbols-outlined obj-head__chevron" aria-hidden="true">expand_more</span>';
    return head;
  }

  function buildObjBody(ro) {
    var body = document.createElement('div');
    body.className = 'obj-body';
    body.innerHTML = objectives.map(function (o, i) {
      return '<div class="obj-block">' +
        '<div class="obj-block__title">Obiectiv ' + (i + 1) + ' — ' + esc(o.title) + '</div>' +
        objFieldHtml('Constatare', o.constatare, 'Nespecificat') +
        objFieldHtml('Iregularitate', o.iregularitate, 'Nu au fost identificate iregularități pentru acest obiectiv.') +
        objFieldHtml('Recomandare', o.recomandare, 'Nespecificat') +
      '</div>';
    }).join('') +
      /* „Adaugă obiectiv" — doar pentru echipă (read-only la autoritate). */
      (ro ? '' :
        '<button type="button" class="obj-add" id="ws-obj-add">' +
          '<span class="material-symbols-outlined" aria-hidden="true" style="font-size:20px;">add</span>Adaugă obiectiv' +
        '</button>');
    /* „Adaugă obiectiv" = comportamentul blocului repetabil: adaugă un bloc nou. */
    if (!ro) {
      setTimeout(function () {
        var add = body.querySelector('#ws-obj-add');
        if (add) add.addEventListener('click', function (e) {
          e.stopPropagation();
          objectives.push({ title: 'Obiectiv nou', constatare: '', iregularitate: '' });
          var card = $('ws-obj-card');
          if (card) {
            card.replaceChild(buildObjBody(ro), card.querySelector('.obj-body'));
            card.replaceChild(buildObjHead(), card.querySelector('.obj-head'));
            card.querySelector('.obj-head').addEventListener('click', function () { card.classList.toggle('is-open'); });
            card.classList.add('is-open');
          }
        });
      }, 0);
    }
    return body;
  }

  function objFieldHtml(label, value, emptyText) {
    var empty = !value || !String(value).trim();
    return '<div class="obj-field">' +
      '<span class="obj-field__label">' + esc(label) + '</span>' +
      '<div class="obj-field__value' + (empty ? ' obj-field__value--empty' : '') + '">' +
        (empty ? esc(emptyText || '—') : esc(value)) +
      '</div>' +
    '</div>';
  }

  /* ---------- Etapa IV — tabel de recomandări + sumar ----------
     // Cadență raportare (fază ulterioară): progres anual la UCAAPI;
     // recomandări neînsușite raportate trimestrial. Prototipul afișează
     // doar tabelul + sumarul. */
  function recLabel(key) {
    var s = REC_STATUSES.find(function (x) { return x.key === key; });
    return s ? s.label : key;
  }

  function renderRecommendations(el, ro) {
    var counts = { total: recommendations.length, implementata: 0, partial: 0, neimplementata: 0, neinsusita: 0 };
    recommendations.forEach(function (r) { if (counts[r.status] != null) counts[r.status]++; });

    var summary =
      '<div class="rec-summary">' +
        '<span class="pill pill--purple">Total: ' + counts.total + '</span>' +
        '<span class="pill pill--success">Implementate: ' + counts.implementata + '</span>' +
        '<span class="pill pill--pending">Parțial: ' + counts.partial + '</span>' +
        '<span class="pill pill--critical">Neimplementate: ' + counts.neimplementata + '</span>' +
        '<span class="pill pill--neutral">Neînsușite: ' + counts.neinsusita + '</span>' +
      '</div>';

    var rows = recommendations.map(function (r, i) {
      var statusCell = ro
        ? '<span class="doc-status rec-status--' + esc(r.status) + '"><span class="doc-status__dot"></span>' + esc(recLabel(r.status)) + '</span>'
        : '<select class="select rec-status-select rec-status--' + esc(r.status) + '" data-rec-idx="' + i + '" aria-label="Status recomandare">' +
            REC_STATUSES.map(function (s) {
              return '<option value="' + esc(s.key) + '"' + (s.key === r.status ? ' selected' : '') + '>' + esc(s.label) + '</option>';
            }).join('') +
          '</select>';
      return '<tr class="doc-row">' +
        '<td><div class="rec-text">' + esc(r.text) + '</div><div class="rec-obiectiv">' + esc(r.obiectiv) + '</div></td>' +
        '<td>' + statusCell + '</td>' +
        '<td><div class="doc-desc__text">' + esc(r.plan) + '</div></td>' +
        '<td><div class="doc-desc__text">' + esc(r.progres) + '</div></td>' +
      '</tr>';
    }).join('');

    el.innerHTML =
      '<div class="rec-panel">' +
        '<div class="rec-panel__head"><span class="material-symbols-outlined" aria-hidden="true">checklist</span> Urmărirea implementării recomandărilor</div>' +
        summary +
        '<table class="docs-table rec-table">' +
          '<colgroup><col><col style="width:210px;"><col><col style="width:230px;"></colgroup>' +
          '<thead><tr><th>Recomandare</th><th>Status</th><th>Plan de acțiune</th><th>Progres / observații</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';

    if (!ro) {
      el.querySelectorAll('[data-rec-idx]').forEach(function (sel) {
        sel.addEventListener('change', function () {
          var idx = parseInt(sel.getAttribute('data-rec-idx'), 10);
          if (recommendations[idx]) recommendations[idx].status = sel.value;
          renderRecommendations(el, ro); /* recalculează sumarul + reculoare */
        });
      });
    }
  }

  /* ---------- Documente (tab-uri audit + rând fixat Dosar Permanent) ---------- */
  var activeDocCat = 'all';
  function renderDocs(mission) {
    var el = $('ws-docs');
    if (!el) return;
    var total = docs.length;
    var tabsHtml = DOC_CATEGORIES.map(function (c) {
      var count = c.key === 'all' ? total : docs.filter(function (d) { return d.cat === c.key; }).length;
      var isNeed = c.key === 'necategorisit' && count > 0;
      var badge = isNeed ? ' <span class="pill pill--critical">' + count + '</span>' : ' (' + count + ')';
      return '<button type="button" class="doc-tab' + (c.key === activeDocCat ? ' is-active' : '') + '" data-doc-tab="' + c.key + '">' +
        esc(c.label) + (c.key === 'necategorisit' ? badge : ' (' + count + ')') + '</button>';
    }).join('');

    var visible = docs.filter(function (d) { return activeDocCat === 'all' || d.cat === activeDocCat; });

    el.innerHTML =
      '<div class="docs-section__header">' +
        '<div class="docs-section__title">Documente <span class="docs-section__title-count">(' + total + ')</span></div>' +
        '<div class="documents-toolbar__actions">' +
          '<button class="icon-btn" type="button" aria-label="Caută"><span class="material-symbols-outlined" aria-hidden="true">search</span></button>' +
          '<button class="icon-btn icon-btn--add" type="button" aria-label="Adaugă document"><span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="doc-tabs">' + tabsHtml + '</div>' +
      '<div class="doc-subfilters">' +
        '<span class="doc-subfilters__label">Filtre suplimentare:</span>' +
        '<label><input type="checkbox"> Furnizate de entitate</label>' +
        '<label><input type="checkbox"> Solicitate de auditor</label>' +
      '</div>' +
      '<table class="docs-table">' +
        '<colgroup><col style="width:44px;"><col><col><col style="width:140px;"><col class="col-actions"></colgroup>' +
        '<thead><tr>' +
          '<th class="doc-checkbox"><input type="checkbox" aria-label="Selectează toate"></th>' +
          '<th>Nume Document</th>' +
          '<th>Descriere <span class="docs-table__header-hint">(interpretare AI)</span></th>' +
          '<th>Status Verificare</th>' +
          '<th class="th-actions">Acțiuni</th>' +
        '</tr></thead>' +
        '<tbody>' + pinnedRowHtml() + visible.map(docRowHtml).join('') + '</tbody>' +
      '</table>';

    el.querySelectorAll('[data-doc-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () { activeDocCat = btn.getAttribute('data-doc-tab'); renderDocs(mission); });
    });
  }

  function pinnedRowHtml() {
    return '<tr class="doc-row doc-row--pinned">' +
      '<td class="doc-checkbox"><span class="doc-pin material-symbols-outlined filled" title="Fixat sus" aria-hidden="true">push_pin</span></td>' +
      '<td><span class="doc-name"><span class="material-symbols-outlined" aria-hidden="true">inventory_2</span>' +
        '<span class="doc-name__filename">Dosar Permanent</span><span class="doc-name__set-meta">3 documente</span></span></td>' +
      '<td><div class="doc-desc__text"><span class="doc-row__tip">Dosar entitate</span>Organigramă, plan strategic, acte de înființare — fapte despre entitate care persistă între misiuni.</div></td>' +
      '<td><span class="doc-status doc-status--pending"><span class="doc-status__dot"></span>De confirmat</span></td>' +
      '<td class="td-actions"><span class="doc-actions">' +
        '<button class="doc-actions__icon" type="button" title="Deschide"><span class="material-symbols-outlined" aria-hidden="true">open_in_full</span></button>' +
        '<button class="doc-actions__icon" type="button" title="Descarcă"><span class="material-symbols-outlined" aria-hidden="true">download</span></button>' +
      '</span></td>' +
    '</tr>';
  }

  function docRowHtml(d) {
    return '<tr class="doc-row">' +
      '<td class="doc-checkbox"><input type="checkbox" aria-label="Selectează"></td>' +
      '<td><span class="doc-name"><span class="material-symbols-outlined" aria-hidden="true">' + esc(d.icon) + '</span>' +
        '<span class="doc-name__filename">' + esc(d.name) + '</span></span></td>' +
      '<td><div class="doc-desc__text"><span class="doc-row__tip">' + esc(d.tip) + '</span>' + esc(d.desc) + '</div></td>' +
      '<td><span class="doc-status doc-status--' + esc(d.status) + '"><span class="doc-status__dot"></span>' + esc(d.statusLabel) + '</span></td>' +
      '<td class="td-actions"><span class="doc-actions">' +
        '<button class="doc-actions__icon" type="button" title="Trimite"><span class="material-symbols-outlined" aria-hidden="true">share</span></button>' +
        '<button class="doc-actions__icon" type="button" title="Descarcă"><span class="material-symbols-outlined" aria-hidden="true">download</span></button>' +
        '<button class="doc-actions__icon" type="button" title="Editează"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>' +
        '<button class="doc-actions__icon" type="button" title="Reclasifică"><span class="material-symbols-outlined" aria-hidden="true">swap_horiz</span></button>' +
      '</span></td>' +
    '</tr>';
  }

  /* ---------- Messaging (statice din seed, incl. 2 subtipuri smart) ---------- */
  function renderMessages(mission) {
    var el = $('ws-msg-list');
    if (!el) return;
    var meta = $('ws-chat-meta');
    if (meta) meta.textContent = 'Misiune ' + mission.id + ' · echipă + entitate auditată';
    el.innerHTML = messages.map(messageHtml).join('');
    bindMessageActions();
  }

  function bindMessageActions() {
    var el = $('ws-msg-list');
    if (!el) return;
    el.querySelectorAll('[data-dosar-ack]').forEach(function (btn) {
      btn.addEventListener('click', function () { toast('success', 'Ai confirmat Dosarul Permanent.'); btn.disabled = true; });
    });
  }

  /* Mesaj nou produs de o decizie a autorității (sus în conversație). */
  function addDecisionMessage(msg) {
    messages.unshift(msg);
    var list = $('ws-msg-list');
    if (list) { list.innerHTML = messages.map(messageHtml).join(''); bindMessageActions(); }
  }

  function messageHtml(m) {
    if (m.type === 'approved') {
      return '<div class="message-card message-card--step-completion">' +
        '<div class="step-completion__header"><span class="material-symbols-outlined step-completion__icon" aria-hidden="true">verified</span>' +
          '<span class="step-completion__title">Misiune aprobată</span></div>' +
        '<div class="step-completion__summary">Misiunea a fost aprobată de ' + esc(m.name || 'autoritatea decidentă') + '.</div>' +
        '<div class="step-completion__meta"><span>Mesaj Automat Scriptica A.I.</span><span></span></div>' +
      '</div>';
    }
    if (m.type === 'changes_requested') {
      return '<div class="message-card message-card--deadline-projection">' +
        '<div class="proj__header"><span class="material-symbols-outlined proj__icon" aria-hidden="true">edit_note</span>' +
          '<span class="proj__title">Modificări cerute</span></div>' +
        '<div class="proj__summary">Autoritatea decidentă a cerut modificări: „' + esc(m.body) + '"</div>' +
        '<div class="proj__meta">Mesaj Automat Scriptica A.I.</div>' +
      '</div>';
    }
    if (m.type === 'rejected') {
      return '<div class="message-card message-card--system-cancelled">' +
        '<div class="message-card__sys-head"><span class="material-symbols-outlined" aria-hidden="true">cancel</span> Misiune respinsă de autoritatea decidentă</div>' +
        '<div class="message-card__body">' + esc(m.body) + '</div>' +
      '</div>';
    }
    if (m.type === 'dosar_check') {
      return '<div class="message-card message-card--deadline-projection">' +
        '<div class="proj__header"><span class="material-symbols-outlined proj__icon" aria-hidden="true">' + esc(m.icon || 'inventory_2') + '</span>' +
          '<span class="proj__title">' + esc(m.title) + '</span></div>' +
        '<div class="proj__summary">' + esc(m.body) + '</div>' +
        '<div class="proj__action"><button class="btn btn--primary" type="button" data-dosar-ack>' + esc(m.action || 'Am luat la cunoștință') + '</button></div>' +
        '<div class="proj__meta" style="margin-top: var(--space-2);">' + esc(m.meta) + '</div>' +
      '</div>';
    }
    if (m.type === 'deadline_projection') {
      return '<div class="message-card message-card--deadline-projection">' +
        '<div class="proj__header"><span class="material-symbols-outlined proj__icon" aria-hidden="true">' + esc(m.icon || 'schedule') + '</span>' +
          '<span class="proj__title">' + esc(m.title) + '</span></div>' +
        '<div class="proj__summary">' + esc(m.body) + '</div>' +
        '<div class="proj__meta">' + esc(m.meta) + '</div>' +
      '</div>';
    }
    if (m.type === 'step_completion') {
      return '<div class="message-card message-card--step-completion">' +
        '<div class="step-completion__header"><span class="material-symbols-outlined step-completion__icon" aria-hidden="true">check_circle</span>' +
          '<span class="step-completion__title">' + esc(m.title) + '</span></div>' +
        '<div class="step-completion__summary">' + esc(m.body) + '</div>' +
        '<div class="step-completion__meta"><span>' + esc(m.meta) + '</span><span>' + esc(m.date || '') + '</span></div>' +
      '</div>';
    }
    /* human */
    var attach = m.attach ? '<span class="message-card__attach"><span class="material-symbols-outlined" aria-hidden="true">attach_file</span>' +
      '<span class="doc-reference">' + esc(m.attach) + '</span></span>' : '';
    return '<div class="message-card">' +
      '<div class="message-card__header"><span class="message-card__sender">' + esc(m.sender) + '</span>' +
        '<span class="message-card__date">' + esc(m.date || '') + '</span></div>' +
      '<div class="message-card__body">' + esc(m.body) + '</div>' + attach +
    '</div>';
  }

  /* ============================================================
     Bara de decizie (autoritate) — reciclează pattern-ul step-actions.
     Înlocuiește footer-ul auditorului. 3 stări: Aprobă / Cere
     modificări / Respinge. Fiecare produce un mesaj system în chat.
     // Nuanță legală (fază ulterioară): avizarea poate fi "cu excepții pe
     // nr. recomandare" — recomandări neînsușite. Prototipul folosește 3 stări simple.
     ============================================================ */
  function renderDecisionBar(mission) {
    var old = $('ws-decision-bar');
    if (old) old.remove();
    var approved = mission.status === 'aprobata';
    var bar = document.createElement('div');
    bar.id = 'ws-decision-bar';
    bar.className = 'ws-decision-bar';
    bar.innerHTML =
      '<div class="ws-decision-note" id="ws-dec-note" hidden>' +
        '<textarea class="composer__textarea" id="ws-dec-text" rows="2" placeholder="Adaugă un comentariu pentru echipă..."></textarea>' +
        '<div class="ws-decision-note__row">' +
          '<button type="button" class="btn btn--ghost" id="ws-dec-cancel">Renunță</button>' +
          '<button type="button" class="btn btn--primary" id="ws-dec-send">Trimite</button>' +
        '</div>' +
      '</div>' +
      '<div class="step-actions">' +
        (approved
          ? '<span class="ws-decision-done"><span class="material-symbols-outlined filled" aria-hidden="true">check_circle</span> Misiune aprobată</span>'
          : '<button type="button" class="btn btn--critical" id="ws-reject"><span class="material-symbols-outlined" aria-hidden="true">cancel</span>Respinge</button>' +
            '<div class="step-actions__center"><button type="button" class="btn btn--pending" id="ws-changes"><span class="material-symbols-outlined" aria-hidden="true">edit_note</span>Cere modificări</button></div>' +
            '<button type="button" class="btn btn--primary" id="ws-approve">Aprobă<span class="material-symbols-outlined" aria-hidden="true">check</span></button>') +
      '</div>';
    var shell = document.querySelector('.shell');
    (shell || document.body).appendChild(bar);
    if (approved) return;

    var pending = null;
    var note = $('ws-dec-note');
    var text = $('ws-dec-text');
    function showNote(mode) { pending = mode; note.hidden = false; text.value = ''; text.focus(); }
    function hideNote() { pending = null; note.hidden = true; }

    var auth = (MOCK.auditAuthorities || [])[0];
    var authName = auth ? auth.name : 'autoritatea decidentă';

    $('ws-approve').addEventListener('click', function () {
      setStatusOverride(mission.id, 'aprobata');
      mission.status = 'aprobata';
      addDecisionMessage({ type: 'approved', name: authName });
      toast('success', 'Misiune aprobată.');
      renderDecisionBar(mission);
    });
    $('ws-changes').addEventListener('click', function () { showNote('changes'); });
    $('ws-reject').addEventListener('click', function () { showNote('reject'); });
    $('ws-dec-cancel').addEventListener('click', hideNote);
    $('ws-dec-send').addEventListener('click', function () {
      var val = (text.value || '').trim();
      if (pending === 'changes') {
        addDecisionMessage({ type: 'changes_requested', body: val || '(fără detalii)' });
        toast('info', 'Cererea de modificări a fost trimisă echipei.');
      } else if (pending === 'reject') {
        setStatusOverride(mission.id, 'in_verificare');
        mission.status = 'in_verificare';
        addDecisionMessage({ type: 'rejected', body: val || '(fără motiv specificat)' });
        toast('error', 'Misiune respinsă — revine la echipă.');
      }
      hideNote();
    });
  }

})();
