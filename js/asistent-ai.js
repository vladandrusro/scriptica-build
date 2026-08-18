/* ============================================================
   Scriptica — Asistentul AI Scriptica (2026-08-18)
   Conversația cu LLM-ul local, tratată ca o „cerere de lămuriri":
   un flux cu un singur pas din verticala marcată `assistant`. Pe
   situatie-detaliu.html?flowId=<cerere> panoul Mesagerie devine
   conversația cu asistentul (întrebare → raționament → răspuns cu
   surse → schimbarea contextului), în stilul demo-urilor de tip
   „knowledge graph": fiecare răspuns restrânge contextul la
   dosarele găsite, iar întrebările următoare pornesc de acolo.
   Motorul este o simulare locală: caută în dosarele, documentele
   și responsabilii la care persona curentă are acces (scope-ul
   verticalelor active) și compune răspunsul determinist.
   Persistă în `flowItems` (aiMessages, aiContext) prin scripticaFlowSave.
   Se încarcă după situatie-detaliu.js și documents.js.
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var TODAY = new Date('2026-04-20T00:00:00');
  var MAX_CHARS = 2000;

  var STATUS_LABELS = {
    analiza: 'Analiză', asteapta_documente: 'Așteaptă Documente', in_verificare: 'În Verificare',
    spre_aprobare: 'Spre Aprobare', aprobata: 'Aprobată', finalizat: 'Finalizat',
    inchisa: 'Închisă', anulata: 'Anulată', intarziere: 'În Întârziere'
  };
  var STOPWORDS = ['care','este','sunt','pentru','din','de','la','in','cu','si','sau','ce','cat','cati','cate','cum','cand','unde','cine','pe','un','o','ai','am','avem','aveti','are','au','fost','fie','mai','mi','imi','va','vreau','arata','spune','despre','toate','tot','toti','toate','asta','acest','aceasta','acestea','al','a','ale','lui','ei','lor','sa','se','ne','nu','da','dar','iar','ori','fara','prin','peste','sub','intre','catre','pana','dupa','le','il','ii','noi','voi','ele','el','ea','ma','te'];

  var state = { item: null, vertical: null, kb: null, pending: null, typing: false, els: {},
    canvas: { mode: 'idle', msgId: null, preview: null } };

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK) return;
    var params = new URLSearchParams(window.location.search);
    var flowId = params.get('flowId');
    if (!flowId) return;
    var item = (MOCK.flowItems || []).find(function (f) { return f.id === flowId; });
    if (!item) return;
    var vertical = typeof window.scripticaVerticalById === 'function' ? window.scripticaVerticalById(item.verticalId) : null;
    if (!vertical || !vertical.assistant) return;
    if (typeof window.viewInScope === 'function' && !window.viewInScope(vertical.domain)) return;
    state.item = item;
    state.vertical = typeof window.scripticaEffectiveVertical === 'function' ? window.scripticaEffectiveVertical(vertical) : vertical;
    state.item.aiMessages = Array.isArray(item.aiMessages) ? item.aiMessages : [];
    state.kb = buildKnowledgeBase();
    document.body.classList.add('ai-workspace');
    state.item.aiDocuments = Array.isArray(item.aiDocuments) ? item.aiDocuments : [];
    /* documentele generate anterior reintră în lista dosarului (persistă pe flowItem) */
    state.item.aiDocuments.forEach(function (d) {
      if (!(MOCK.documents || []).some(function (x) { return x.id === d.id; })) MOCK.documents.push(d);
    });
    mountPanel();
    mountCanvas();
    var lastAssistant = state.item.aiMessages.slice().reverse().find(function (m) { return m.role === 'assistant' && m.canvas; });
    if (lastAssistant) { state.canvas.mode = 'result'; state.canvas.msgId = lastAssistant.id; }
    render();
    if (item.aiPendingQuestion) {
      var q = item.aiPendingQuestion;
      item.aiPendingQuestion = null;
      persist();
      ask(q);
    } else if (window.location.hash === '#asistent') {
      setTimeout(function () { if (state.els.input) state.els.input.focus(); }, 50);
    }
  });

  /* ---------- utilitare ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function tokens(text) {
    return norm(text).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(function (t) {
      return t.length >= 3 && STOPWORDS.indexOf(t) === -1;
    });
  }
  /* rădăcină grosieră pentru română (achizițiilor → achizi, petiția → petiti, concursuri → concur) */
  function stem(t) { return t.length > 6 ? t.slice(0, 6) : (t.length > 4 ? t.slice(0, 4) : t); }
  function hits(haystack, toks) {
    var h = norm(haystack);
    var n = 0;
    toks.forEach(function (t) { if (h.indexOf(stem(t)) !== -1) n++; });
    return n;
  }
  function addDaysISO(iso, n) {
    var dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return iso;
    dt.setDate(dt.getDate() + (parseInt(n, 10) || 0));
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function daysDiff(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.ceil((d - TODAY) / 86400000);
  }
  function fmtDate(iso) {
    var p = String(iso || '').split('T')[0].split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
  }
  function fmtTime(iso) {
    var m = String(iso || '').match(/T(\d\d:\d\d)/);
    return m ? m[1] : '';
  }
  function nowIso() {
    var d = new Date();
    return '2026-04-20T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  }
  function toast(variant, message) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, message);
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function joinNames(names, max) {
    var shown = names.slice(0, max);
    var rest = names.length - shown.length;
    return shown.map(function (n) { return '<b>' + esc(n) + '</b>'; }).join(', ') + (rest > 0 ? ' și încă ' + plural(rest, 'unul', 'altele') : '');
  }

  /* ---------- baza de cunoștințe accesibilă utilizatorului ---------- */

  function buildKnowledgeBase() {
    var activeIds = typeof window.scripticaTenantActiveVerticalIds === 'function' ? window.scripticaTenantActiveVerticalIds() : [];
    var verticals = activeIds.map(function (id) {
      var v = window.scripticaVerticalById(id);
      if (!v || v.assistant) return null;
      if (typeof window.viewInScope === 'function' && !window.viewInScope(v.domain)) return null;
      return typeof window.scripticaEffectiveVertical === 'function' ? window.scripticaEffectiveVertical(v) : v;
    }).filter(Boolean);
    var verticalIds = verticals.map(function (v) { return v.id; });
    var templates = (MOCK.superAdmin.flowTemplates || []).filter(function (t) { return verticalIds.indexOf(t.verticalId) !== -1; });
    var items = (MOCK.flowItems || []).filter(function (f) { return verticalIds.indexOf(f.verticalId) !== -1; }).map(function (f) {
      var v = verticals.find(function (x) { return x.id === f.verticalId; });
      var t = templates.find(function (x) { return x.id === f.templateId; });
      var steps = (t && t.steps) || [];
      var step = steps[(f.currentStep || 1) - 1];
      var deadline = step && f.startDate ? addDaysISO(f.startDate, step.offsetDays) : null;
      var responsibles = (f.responsibleIds || []).map(function (id) {
        var e = (MOCK.employees || []).find(function (x) { return x.id === id; });
        return e ? e.name : null;
      }).filter(Boolean);
      return {
        id: f.id, name: f.name, party: f.clientName || '', contact: f.clientContact || '', container: f.archiveContainer || '',
        verticalId: f.verticalId, verticalName: v ? v.name : '', itemLabel: v ? v.itemLabel : 'Dosar',
        templateName: f.templateName || (t && t.name) || '', status: f.status, statusLabel: STATUS_LABELS[f.status] || f.status,
        currentStep: f.currentStep || 1, totalSteps: steps.length || 1, stepName: step ? step.name : '',
        deadline: deadline, days: deadline ? daysDiff(deadline) : null, responsibles: responsibles,
        active: ['finalizat', 'inchisa', 'anulata'].indexOf(f.status) === -1,
        href: 'situatie-detaliu.html?flowId=' + encodeURIComponent(f.id)
      };
    });
    var itemIds = items.map(function (i) { return i.id; });
    var docs = (MOCK.documents || []).filter(function (d) { return itemIds.indexOf(d.situationId) !== -1; }).map(function (d) {
      var owner = items.find(function (i) { return i.id === d.situationId; });
      return { id: d.id, filename: d.filename, tip: d.tipDocument || '', emitent: d.emitent || '', nr: d.numarDocument || '',
        date: d.dataEmiterii || '', obs: d.observatieAI || '', itemId: d.situationId, itemName: owner ? owner.name : '',
        href: owner ? owner.href : 'arhiva.html' };
    });
    var people = (MOCK.employees || []).map(function (e) { return { id: e.id, name: e.name, role: e.role || '' }; });
    return { verticals: verticals, templates: templates, items: items, docs: docs, people: people };
  }

  /* ---------- motorul de răspuns (simulare determinată) ---------- */

  var DOC_NOUNS = [
    { re: /\b(raport)/, type: 'Raport', title: 'Raport' },
    { re: /\b(situati|centraliz)/, type: 'Situație centralizatoare', title: 'Situație centralizatoare' },
    { re: /\b(nota interna|nota de informare|nota)/, type: 'Notă internă', title: 'Notă internă' },
    { re: /\b(adres)/, type: 'Adresă', title: 'Adresă' },
    { re: /\b(raspuns)/, type: 'Răspuns', title: 'Răspuns' },
    { re: /\b(referat)/, type: 'Referat', title: 'Referat' },
    { re: /\b(informare)/, type: 'Notă de informare', title: 'Notă de informare' },
    { re: /\b(proces.?verbal|minut)/, type: 'Proces-verbal', title: 'Proces-verbal' }
  ];
  function docNounOf(q) {
    var n = norm(q);
    for (var i = 0; i < DOC_NOUNS.length; i++) if (DOC_NOUNS[i].re.test(n)) return DOC_NOUNS[i];
    return null;
  }
  /* Analize predefinite, relevante pentru o primărie — cu date agregate de
     demonstrație (evidențele seed sunt prea mici pentru statistici reale) și,
     unde se poate, cu date calculate din dosarele accesibile. */
  var CHART_PRESETS = [
    { id: 'petitii_subiecte', re: /(petiti|sesizar).*(subiect|categori|tem)|(subiect|categori|tem).*(petiti|sesizar)|petitii pe subiecte/,
      title: 'Petiții pe subiecte — trimestrul I 2026', type: 'bars',
      labels: ['Salubrizare și spații verzi', 'Infrastructură rutieră', 'Urbanism și disciplină în construcții', 'Transport public', 'Asistență socială', 'Altele'],
      values: [184, 152, 97, 76, 41, 63], unit: 'petiții',
      tiles: [{ label: 'Petiții înregistrate', value: 613 }, { label: 'Timp mediu de soluționare', value: 18, suffix: ' zile' }, { label: 'Soluționate în termenul legal', value: 92, suffix: '%' }, { label: 'Redirecționate altor instituții', value: 47 }],
      insight: 'Salubrizarea și infrastructura rutieră concentrează 55% din petiții. Timpul mediu de soluționare (18 zile) se încadrează în termenul legal de 30 de zile; 8% dintre petiții au depășit termenul, majoritatea la Urbanism.',
      chips: ['Evoluția lunară a solicitărilor externe', 'Termene depășite pe direcții', 'Întocmește raportul trimestrial al petițiilor'] },
    { id: 'solicitari_lunar', re: /(evolut|lunar|pe luni|trend).*(solicit|petiti|cerer)|(solicit|petiti|cerer).*(lunar|pe luni|evolut|trend)/,
      title: 'Evoluția lunară a solicitărilor externe — 2026', type: 'line',
      labels: ['Ian', 'Feb', 'Mar', 'Apr*'],
      series: [{ name: 'Petiții (OG 27/2002)', values: [148, 171, 163, 131] }, { name: 'Cereri Legea 544/2001', values: [22, 31, 27, 19] }, { name: 'Certificate de urbanism', values: [64, 58, 71, 44] }],
      unit: 'solicitări', note: '* aprilie: date până la 20.04.2026',
      tiles: [{ label: 'Total T1 2026', value: 755 }, { label: 'Vârf lunar', value: 260, suffix: ' (feb.)' }, { label: 'Răspunsuri în termen', value: 94, suffix: '%' }],
      insight: 'Volumul crește în februarie–martie (dezbaterea bugetului local) și scade în aprilie. Cererile 544 rămân sub 5% din total; certificatele de urbanism sunt a doua categorie ca volum.',
      chips: ['Petiții pe subiecte', 'Stadiul obiectivelor de investiții', 'Resetează contextul'] },
    { id: 'investitii_stadiu', re: /(stadiu|fizic|valoric|progres).*(investit|obiectiv|lucrar)|(investit|obiectiv|lucrar).*(stadiu|fizic|valoric|progres)/,
      title: 'Stadiul obiectivelor de investiții — fizic și valoric', type: 'hbars',
      labels: ['Reabilitare Pasaj Unirii — lucrări structurale', 'Creșă și grădiniță — cartier Străulești', 'Consolidare Școala Gimnazială nr. 12', 'Servicii de proiectare — pasaj pietonal Piața Unirii'],
      values: [38, 12, 8, 100], unit: '%',
      tiles: [{ label: 'Obiective în derulare', value: 3 }, { label: 'Stadiu fizic mediu', value: 19, suffix: '%' }, { label: 'Valoare decontată cumulat', value: 21.4, suffix: ' mil. RON', decimals: 1 }, { label: 'Obiective cu întârziere', value: 1, critical: true }],
      insight: 'Pasajul Unirii are stadiul fizic 38% și o întârziere de 10 zile la lucrările structurale (aviz Metrorex). Creșa Străulești așteaptă aprobarea indicatorilor în CGMB; Școala 12 este în faza DALI.',
      chips: ['Ce termene se apropie la investiții?', 'Valoarea achizițiilor pe tipuri de procedură', 'Întocmește nota de informare privind stadiul investițiilor'] },
    { id: 'termene_directii', re: /(termen|intarzi|restant).*(directi|structur|compartiment)|(directi|structur|compartiment).*(termen|intarzi|restant)|termene depasite pe directii/,
      title: 'Termene depășite pe direcții — dosare active', type: 'bars', computed: 'lateByDirection', unit: 'dosare',
      insight: 'Calculat din dosarele accesibile: pentru fiecare direcție, dosarele active al căror termen al pasului curent este depășit față de 20.04.2026.',
      chips: ['Cine este responsabil?', 'Ce termene se apropie?', 'Întocmește situația dosarelor cu termen depășit'] },
    { id: 'achizitii_valoare', re: /(valoar|suma|cat).*(achizit|contract|procedur)|(achizit|contract|procedur).*(valoar|suma|pe tipuri)/,
      title: 'Valoarea achizițiilor publice pe tipuri de procedură — 2026', type: 'donut',
      labels: ['Licitație deschisă', 'Procedură simplificată', 'Achiziție directă', 'Negociere fără publicare'],
      values: [41.7, 12.4, 3.1, 1.8], unit: 'mil. RON', decimals: 1,
      tiles: [{ label: 'Valoare totală estimată', value: 59, suffix: ' mil. RON' }, { label: 'Proceduri în derulare', value: 14 }, { label: 'Contracte semnate 2026', value: 9 }, { label: 'Economii față de estimare', value: 6.2, suffix: '%', decimals: 1 }],
      insight: 'Licitațiile deschise reprezintă 71% din valoare, dar doar 3 proceduri; achizițiile directe sunt cele mai numeroase (26) și sub 6% din valoare.',
      chips: ['Stadiul obiectivelor de investiții', 'Petiții pe subiecte', 'Întocmește situația centralizatoare a achizițiilor în derulare'] }
  ];
  function chartPresetOf(q) {
    var n = norm(q);
    for (var i = 0; i < CHART_PRESETS.length; i++) if (CHART_PRESETS[i].re.test(n)) return CHART_PRESETS[i];
    return null;
  }
  function intentOf(q) {
    var n = norm(q);
    if (/\b(reset|toate dosarele|contextul initial|sterge contextul|iesi din context)/.test(n)) return 'reset';
    if (chartPresetOf(q) && !/\b(genereaz|intocm|redact|creeaz|elaboreaz|scrie|pregat)/.test(n)) return 'chart';
    if (/\b(genereaz|intocm|redact|creeaz|elaboreaz|scrie|pregat|emite|completeaz|fa-mi|fa o|fa un)/.test(n) && docNounOf(q)) return 'generate';
    if (/\b(statistic|analiz|distribu|evolut|procent|medie|total|valoare|suma|cat costa|grafic|pe verticale|pe directii|pe subiecte|pe luni)/.test(n)) return 'analysis';
    if (/\b(rezum|sumar|sintez|pe scurt)/.test(n)) return 'summary';
    if (/\b(cate|cati|cat de multe|numar|numarul)\b/.test(n)) return 'count';
    if (/\b(cine|responsabil|raspunde de|se ocupa|comisi)/.test(n)) return 'who';
    if (/\b(termen|scadent|cand|intarzi|apropi|expira|pana la)/.test(n)) return 'deadline';
    if (/\b(document|fisier|pdf|contine|atasat|anexa)/.test(n)) return 'docs';
    if (/\b(stadiu|status|faza|etapa|pasul|pasii|la ce pas|unde a ajuns|in ce punct)/.test(n)) return 'status';
    return 'search';
  }

  function contextItems() {
    var ctx = state.item.aiContext;
    if (!ctx || !Array.isArray(ctx.itemIds) || !ctx.itemIds.length) return null;
    var found = state.kb.items.filter(function (i) { return ctx.itemIds.indexOf(i.id) !== -1; });
    return found.length ? found : null;
  }

  /* Scor „tare” = potriviri pe identitatea dosarului (nume, parte, structură,
     verticală, șablon, responsabili); statusul/pasul contează doar la ordonare,
     ca să nu „prindă” întrebări generice precum „ce documente…”. */
  function scoreItems(pool, toks) {
    return pool.map(function (i) {
      var strong = hits(i.name, toks) * 3 + hits(i.verticalName, toks) * 3 + hits(i.party + ' ' + i.contact + ' ' + i.container, toks) * 2 +
        hits(i.templateName + ' ' + i.responsibles.join(' '), toks) * 2;
      var weak = hits(i.stepName + ' ' + i.statusLabel, toks);
      return { item: i, score: strong * 10 + weak, strong: strong };
    }).filter(function (r) { return r.strong > 0; }).sort(function (a, b) { return b.score - a.score; });
  }
  function scoreDocs(pool, toks) {
    return pool.map(function (d) {
      var s = hits(d.filename.replace(/[_\-.]/g, ' ') + ' ' + d.tip, toks) * 3 + hits(d.emitent + ' ' + d.nr + ' ' + d.itemName, toks) * 2 + hits(d.obs, toks);
      return { doc: d, score: s };
    }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score; });
  }

  function verticalsSummary(items) {
    var by = {};
    items.forEach(function (i) { by[i.verticalName] = (by[i.verticalName] || 0) + 1; });
    return Object.keys(by).map(function (k) { return k + ' (' + by[k] + ')'; });
  }
  function shiftFor(items) {
    if (!items.length) return null;
    var names = items.map(function (i) { return i.name; });
    var verts = [];
    items.forEach(function (i) { if (verts.indexOf(i.verticalName) === -1) verts.push(i.verticalName); });
    var label = items.length === 1 ? items[0].name : plural(items.length, 'dosar', 'dosare') + ' · ' + verts.join(', ');
    return { label: label, names: names, itemIds: items.map(function (i) { return i.id; }) };
  }
  function itemRef(i) { return { kind: 'dosar', label: i.name, sub: i.verticalName + ' · ' + i.statusLabel, href: i.href }; }
  function docRef(d) { return { kind: 'document', label: d.filename, sub: d.tip + (d.itemName ? ' · ' + d.itemName : ''), href: d.href }; }
  function personRef(name) {
    var p = state.kb.people.find(function (x) { return x.name === name; });
    return { kind: 'persoana', label: name, sub: p ? p.role : '', href: null };
  }
  function itemLine(i) {
    return '<li><a href="' + esc(i.href) + '"><b>' + esc(i.name) + '</b></a> — ' + esc(i.verticalName) + ', pasul ' + i.currentStep + '/' + i.totalSteps +
      (i.stepName ? ' (' + esc(i.stepName) + ')' : '') + ', ' + esc(i.statusLabel) + '</li>';
  }

  function answer(question) {
    var kb = state.kb;
    var intent = intentOf(question);
    /* cuvintele care exprimă intenția nu sunt termeni de căutare */
    var toks = tokens(question).filter(function (t) {
      return !/^(docum|fisier|dosar|cerer|termen|stadiu|status|responsab|rezum|sumar|analiz|statist|intocm|genere|redact|situat|centraliz|verific|arata|lista|listez|caut)/.test(t);
    });
    var ctx = contextItems();
    /* întrebările la nivel de instituție ies explicit din context */
    if (/(fiecare vertical|toate vertical|pe vertical|nivelul institut|in total|toate dosarele|intreaga primar)/.test(norm(question))) ctx = null;
    var reasoning = [];
    var refs = [];
    var shift = null;
    var html = '';
    var chips = [];
    var scopeLine = 'Am căutat în evidențele accesibile rolului tău: ' + plural(kb.items.length, 'dosar', 'dosare') + ' și ' +
      plural(kb.docs.length, 'document', 'documente') + ' din ' + plural(kb.verticals.length, 'verticală', 'verticale') +
      ' (' + kb.verticals.map(function (v) { return v.name; }).join(', ') + ').';

    if (intent === 'reset') {
      reasoning.push('Ai cerut revenirea la contextul inițial.');
      html = 'Am resetat contextul conversației: întrebările următoare vor fi căutate în <b>toate dosarele</b> la care ai acces (' + plural(kb.items.length, 'dosar', 'dosare') + ').';
      shift = { label: 'Toate dosarele accesibile (' + kb.items.length + ')', names: [], itemIds: [] };
      chips = defaultChips();
      return { reasoning: reasoning, answerHtml: html, references: refs, contextShift: shift, chips: chips };
    }

    /* mulțimea de lucru: contextul (dacă are potriviri) sau tot */
    var pool = kb.items;
    var usedContext = false;
    var scored;
    if (toks.length) reasoning.push('Am identificat termenii-cheie: ' + toks.slice(0, 5).map(function (t) { return '«' + esc(t) + '»'; }).join(', ') + '.');
    reasoning.push(scopeLine);
    if (ctx) {
      var inCtx = toks.length ? scoreItems(ctx, toks) : [];
      /* întrebare generică (fără o entitate nouă identificabilă nicăieri) → rămânem în context */
      var genericFollowUp = !toks.length || !scoreItems(kb.items, toks).length;
      if (inCtx.length || genericFollowUp) {
        pool = ctx; usedContext = true;
        reasoning.push('Am restrâns căutarea la contextul curent: ' + esc(state.item.aiContext.label) + '.');
      } else {
        reasoning.push('În contextul curent nu am găsit potriviri, așa că am extins căutarea la toate dosarele accesibile.');
      }
    }
    scored = toks.length ? scoreItems(pool, toks) : pool.map(function (i) { return { item: i, score: 1 }; });
    var matched = scored.map(function (r) { return r.item; });
    /* „în derulare / active” restrânge la dosarele nefinalizate, indiferent de intenție */
    var wantsActive = /\b(derulare|activ|deschis|in curs|nefinaliz)/.test(norm(question));
    if (wantsActive && matched.some(function (i) { return i.active; })) matched = matched.filter(function (i) { return i.active; });
    var matchedDocs = toks.length ? scoreDocs(kb.docs.filter(function (d) { return usedContext ? pool.some(function (i) { return i.id === d.itemId; }) : true; }), toks).map(function (r) { return r.doc; }) : [];
    if (usedContext && !toks.length) matched = pool;

    if (intent === 'chart') {
      var preset = chartPresetOf(question);
      var chart = buildChart(preset);
      reasoning.push('Am recunoscut o analiză standard a instituției: „' + esc(preset.title) + '”.');
      reasoning.push(preset.computed ? 'Am calculat valorile din dosarele accesibile rolului tău (' + plural(kb.items.length, 'dosar', 'dosare') + ').' : 'Am agregat evidențele din registre pe perioada analizată și am pregătit graficul.');
      reasoning.push('Am extras concluziile principale și le-am însoțit de indicatorii-cheie.');
      html = '<b>' + esc(preset.title) + '</b> — ' + esc(chart.insight) + ' Graficul și indicatorii sunt în zona de lucru din stânga.';
      refs = (chart.refItems || []).map(itemRef);
      chips = preset.chips || defaultChips();
      return { reasoning: reasoning, answerHtml: html, references: refs, contextShift: null, chips: chips,
        canvas: { kind: 'chart', title: preset.title, chart: chart } };
    }
    if (intent === 'analysis' || intent === 'count') {
      var subject = matched.length ? matched : pool;
      if (wantsActive) subject = subject.filter(function (i) { return i.active; });
      var an = analysis(subject, question);
      reasoning.push('Am grupat ' + plural(subject.length, 'dosar', 'dosare') + ' pe verticale și statusuri, am calculat termenele depășite și am extras valorile din documentele atașate.');
      html = an.summaryHtml;
      refs = subject.slice(0, 6).map(itemRef);
      if (subject.length && subject.length <= 8 && !usedContext) shift = shiftFor(subject);
      chips = ['Întocmește o situație centralizatoare cu aceste date', 'Ce termene se apropie?', 'Cine este responsabil?'];
      reasoning.push('Am formulat răspunsul cu ' + plural(refs.length, 'sursă verificabilă', 'surse verificabile') + ' din aplicație.');
      return { reasoning: reasoning, answerHtml: html, references: refs, contextShift: shift, chips: chips,
        canvas: { kind: 'analysis', title: an.title, tiles: an.tiles, rows: an.rows, bars: an.bars, itemIds: subject.map(function (i) { return i.id; }) } };
    }
    if (intent === 'generate') {
      var noun = docNounOf(question);
      var basis = matched.length ? matched : pool;
      if (wantsActive) basis = basis.filter(function (i) { return i.active; });
      var doc = generateDocument(noun, question, basis);
      reasoning.push('Am identificat tipul de document cerut: ' + noun.type.toLowerCase() + '.');
      reasoning.push('Am compus documentul din ' + plural(basis.length, 'dosar', 'dosare') + (basis.length ? ' (' + verticalsSummary(basis).join(', ') + ')' : '') + ', cu antetul instituției, număr de înregistrare provizoriu și tabelul de date.');
      reasoning.push('Am salvat documentul în dosarul acestei cereri; îl poți previzualiza, descărca sau trimite pe flux.');
      html = 'Am întocmit <b>' + esc(doc.title) + '</b> (' + esc(doc.filename) + '). Îl vezi în previzualizarea din stânga și în zona <b>Documente</b> a cererii; are ' + plural(doc.rows.length, 'poziție', 'poziții') + ' și antetul instituției.';
      refs = [{ kind: 'document', label: doc.filename, sub: doc.type + ' · generat de asistent', href: '#preview:doc:' + doc.id }].concat(basis.slice(0, 4).map(itemRef));
      if (basis.length && basis.length <= 8 && !usedContext) shift = shiftFor(basis);
      chips = ['Trimite documentul spre avizare', 'Ce termene se apropie?', 'Resetează contextul'];
      return { reasoning: reasoning, answerHtml: html, references: refs, contextShift: shift, chips: chips,
        canvas: { kind: 'document', doc: doc } };
    }
    if (intent === 'count_legacy') {
      var subject = matched.length ? matched : pool;
      var activeOnly = wantsActive;
      if (activeOnly) subject = subject.filter(function (i) { return i.active; });
      reasoning.push('Am numărat ' + (activeOnly ? 'dosarele active' : 'dosarele') + (matched.length && toks.length ? ' care corespund termenilor' : '') + ', grupate pe verticale.');
      html = 'Sunt <b>' + plural(subject.length, 'dosar', 'dosare') + '</b>' + (activeOnly ? ' în derulare' : '') + (matched.length && toks.length ? ' care corespund' : '') +
        (subject.length ? ': ' + verticalsSummary(subject).join(', ') + '.' : '.') +
        (subject.length && subject.length <= 6 ? '<ul class="ai-list">' + subject.map(itemLine).join('') + '</ul>' : '');
      refs = subject.slice(0, 6).map(itemRef);
      if (subject.length && subject.length <= 8) shift = shiftFor(subject);
      chips = ['Ce termene se apropie?', 'Cine este responsabil?', 'Rezumă dosarele din context'];
    } else if (intent === 'who') {
      var whoItems = matched.length ? matched : pool;
      var people = {};
      whoItems.forEach(function (i) { i.responsibles.forEach(function (n) { (people[n] = people[n] || []).push(i.name); }); });
      var names = Object.keys(people);
      reasoning.push('Am corelat dosarele găsite cu responsabilii lor din echipă.');
      if (!names.length) html = 'Nu am găsit responsabili desemnați pentru dosarele care corespund întrebării.';
      else html = 'Responsabili: ' + names.map(function (n) {
        var p = state.kb.people.find(function (x) { return x.name === n; });
        return '<b>' + esc(n) + '</b>' + (p ? ' (' + esc(p.role) + ')' : '') + ' — ' + plural(people[n].length, 'dosar', 'dosare');
      }).join('; ') + '.' + (whoItems.length <= 6 ? '<ul class="ai-list">' + whoItems.map(itemLine).join('') + '</ul>' : '');
      refs = names.slice(0, 4).map(personRef).concat(whoItems.slice(0, 4).map(itemRef));
      if (whoItems.length && whoItems.length <= 8 && !usedContext) shift = shiftFor(whoItems);
      chips = ['Ce termene au dosarele lor?', 'Care este stadiul?', 'Resetează contextul'];
    } else if (intent === 'deadline') {
      var dl = (matched.length ? matched : pool).filter(function (i) { return i.active && i.days != null; }).sort(function (a, b) { return a.days - b.days; });
      reasoning.push('Am calculat termenul pasului curent din data de început și șablonul fiecărui dosar, apoi le-am ordonat cronologic.');
      if (!dl.length) html = 'Nu există termene active pentru dosarele din această selecție.';
      else html = 'Cele mai apropiate termene:<ul class="ai-list">' + dl.slice(0, 6).map(function (i) {
        var d = i.days < 0 ? '<span class="ai-late">' + Math.abs(i.days) + ' zile întârziere</span>' : (i.days === 0 ? '<b>azi</b>' : 'în ' + plural(i.days, 'zi', 'zile'));
        return '<li><a href="' + esc(i.href) + '"><b>' + esc(i.name) + '</b></a> — ' + esc(i.stepName || 'pasul curent') + ', termen ' + fmtDate(i.deadline) + ' (' + d + ')</li>';
      }).join('') + '</ul>' + (dl.some(function (i) { return i.days < 0; }) ? 'Dosarele marcate sunt <b>depășite</b> — recomand prioritizarea lor.' : '');
      refs = dl.slice(0, 6).map(itemRef);
      if (dl.length && dl.length <= 6 && !usedContext) shift = shiftFor(dl);
      chips = ['Cine este responsabil?', 'Care este stadiul?', 'Resetează contextul'];
    } else if (intent === 'status') {
      var st = matched.length ? matched : pool;
      reasoning.push('Am citit pasul curent, statusul și responsabilul din fiecare dosar.');
      if (!st.length) html = 'Nu am găsit dosare care să corespundă întrebării.';
      else html = (st.length === 1 ? 'Stadiul dosarului:' : 'Stadiul dosarelor:') + '<ul class="ai-list">' + st.slice(0, 6).map(function (i) {
        return '<li><a href="' + esc(i.href) + '"><b>' + esc(i.name) + '</b></a> — pasul <b>' + i.currentStep + '/' + i.totalSteps + (i.stepName ? ' — ' + esc(i.stepName) : '') + '</b>, status <b>' + esc(i.statusLabel) + '</b>' +
          (i.responsibles.length ? ', responsabil ' + esc(i.responsibles.join(', ')) : '') + (i.deadline ? ', termen ' + fmtDate(i.deadline) : '') + '</li>';
      }).join('') + '</ul>';
      refs = st.slice(0, 6).map(itemRef);
      if (st.length && st.length <= 6 && !usedContext) shift = shiftFor(st);
      chips = ['Ce documente conține?', 'Ce termene se apropie?', 'Resetează contextul'];
    } else if (intent === 'docs') {
      var docPool = usedContext ? kb.docs.filter(function (d) { return pool.some(function (i) { return i.id === d.itemId; }); }) : (matchedDocs.length ? matchedDocs : kb.docs.filter(function (d) { return matched.some(function (i) { return i.id === d.itemId; }); }));
      reasoning.push('Am listat documentele atașate dosarelor din selecție, cu tipul stabilit de clasificarea automată.');
      if (!docPool.length) html = 'Nu am găsit documente pentru această selecție.';
      else html = 'Am găsit <b>' + plural(docPool.length, 'document', 'documente') + '</b>:<ul class="ai-list">' + docPool.slice(0, 8).map(function (d) {
        return '<li><a href="' + esc(d.href) + '"><b>' + esc(d.filename) + '</b></a> — ' + esc(d.tip) + (d.emitent ? ', emitent ' + esc(d.emitent) : '') + (d.date ? ', ' + fmtDate(d.date) : '') + '</li>';
      }).join('') + '</ul>';
      refs = docPool.slice(0, 8).map(docRef);
      chips = ['Rezumă dosarele din context', 'Cine este responsabil?', 'Resetează contextul'];
    } else if (intent === 'summary') {
      var sm = matched.length && toks.length ? matched : pool;
      reasoning.push('Am sintetizat fiecare dosar: partea implicată, pasul curent, statusul, termenul și documentele atașate.');
      if (!sm.length) html = 'Nu am ce rezuma — nu există dosare în selecție.';
      else html = 'Rezumat pentru <b>' + plural(sm.length, 'dosar', 'dosare') + '</b>:<ul class="ai-list">' + sm.slice(0, 6).map(function (i) {
        var nd = kb.docs.filter(function (d) { return d.itemId === i.id; }).length;
        return '<li><a href="' + esc(i.href) + '"><b>' + esc(i.name) + '</b></a> (' + esc(i.verticalName) + ') — ' + esc(i.party || '—') + '; pasul ' + i.currentStep + '/' + i.totalSteps + (i.stepName ? ' „' + esc(i.stepName) + '”' : '') + ', ' + esc(i.statusLabel) +
          (i.deadline ? ', termen ' + fmtDate(i.deadline) : '') + '; ' + plural(nd, 'document', 'documente') + (i.responsibles.length ? '; responsabil ' + esc(i.responsibles[0]) : '') + '.</li>';
      }).join('') + '</ul>';
      refs = sm.slice(0, 6).map(itemRef);
      if (!usedContext && sm.length <= 6) shift = shiftFor(sm);
      chips = ['Ce termene se apropie?', 'Ce documente conțin?', 'Resetează contextul'];
    } else {
      /* căutare generală */
      reasoning.push('Am corelat dosarele găsite cu documentele și responsabilii lor.');
      if (!matched.length && !matchedDocs.length) {
        html = 'Nu am găsit dosare sau documente care să corespundă termenilor căutați' + (usedContext ? ' nici în context, nici în restul evidențelor' : '') +
          '. Încearcă o formulare cu denumirea dosarului, a părții implicate (petent, operator economic, direcție) sau a tipului de document.';
        chips = defaultChips();
      } else {
        var parts = [];
        if (matched.length) parts.push('<b>' + plural(matched.length, 'dosar', 'dosare') + '</b> (' + verticalsSummary(matched).join(', ') + ')');
        if (matchedDocs.length) parts.push('<b>' + plural(matchedDocs.length, 'document', 'documente') + '</b>');
        html = 'Am găsit ' + parts.join(' și ') + '.' +
          (matched.length ? '<ul class="ai-list">' + matched.slice(0, 5).map(itemLine).join('') + '</ul>' : '') +
          (matchedDocs.length ? '<div class="ai-sub">Documente relevante:</div><ul class="ai-list">' + matchedDocs.slice(0, 4).map(function (d) {
            return '<li><a href="' + esc(d.href) + '"><b>' + esc(d.filename) + '</b></a> — ' + esc(d.tip) + (d.itemName ? ' · ' + esc(d.itemName) : '') + '</li>';
          }).join('') + '</ul>' : '');
        refs = matched.slice(0, 5).map(itemRef).concat(matchedDocs.slice(0, 4).map(docRef));
        var shiftItems = matched.length ? matched.slice(0, 8) : [];
        if (!matched.length && matchedDocs.length) {
          shiftItems = kb.items.filter(function (i) { return matchedDocs.some(function (d) { return d.itemId === i.id; }); }).slice(0, 8);
        }
        if (shiftItems.length) shift = shiftFor(shiftItems);
        chips = ['Rezumă dosarele din context', 'Care este stadiul?', 'Cine este responsabil?'];
      }
    }
    reasoning.push('Am formulat răspunsul cu ' + plural(refs.length, 'sursă verificabilă', 'surse verificabile') + ' din aplicație.');
    /* canvas: lista rezultatelor (dosare + documente) cu preview la click */
    var resultItems = intent === 'docs' ? [] : (matched.length ? matched : (intent === 'search' ? [] : pool)).slice(0, 12);
    var resultDocs = intent === 'docs'
      ? kb.docs.filter(function (d) { return (usedContext ? pool : (matched.length ? matched : pool)).some(function (i) { return i.id === d.itemId; }); }).slice(0, 12)
      : matchedDocs.slice(0, 8);
    var canvas = (resultItems.length || resultDocs.length)
      ? { kind: 'search', title: 'Rezultate pentru „' + question + '”', itemIds: resultItems.map(function (i) { return i.id; }), docIds: resultDocs.map(function (d) { return d.id; }) }
      : { kind: 'note', title: 'Niciun rezultat', text: 'Nu am găsit dosare sau documente potrivite. Reformulează cu o denumire de dosar, o direcție, un petent sau un tip de document.' };
    return { reasoning: reasoning, answerHtml: html, references: refs, contextShift: shift, chips: chips, canvas: canvas };
  }

  /* ---------- analize / statistici ---------- */

  function amountsFromDocs(items) {
    var total = 0, n = 0;
    var ids = items.map(function (i) { return i.id; });
    state.kb.docs.forEach(function (d) {
      if (ids.indexOf(d.itemId) === -1) return;
      var m = String(d.obs || '').match(/(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?\s*(mil\.\s*)?RON/);
      if (!m) return;
      var v = parseFloat(m[1].replace(/\./g, '') + (m[2] ? '.' + m[2] : ''));
      if (m[3]) v = v * 1000000;
      if (!isNaN(v)) { total += v; n++; }
    });
    return { total: total, count: n };
  }
  function fmtRon(v) {
    var s = Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return s + ' RON';
  }
  function analysis(items, question) {
    var byVert = {}, byStatus = {}, late = 0, active = 0, docs = 0;
    items.forEach(function (i) {
      byVert[i.verticalName] = (byVert[i.verticalName] || 0) + 1;
      byStatus[i.statusLabel] = (byStatus[i.statusLabel] || 0) + 1;
      if (i.active) active++;
      if (i.active && i.days != null && i.days < 0) late++;
      docs += state.kb.docs.filter(function (d) { return d.itemId === i.id; }).length;
    });
    var amounts = amountsFromDocs(items);
    var tiles = [
      { label: 'Dosare', value: String(items.length) },
      { label: 'Active', value: String(active) },
      { label: 'Termene depășite', value: String(late), critical: late > 0 },
      { label: 'Documente', value: String(docs) }
    ];
    if (amounts.count) tiles.push({ label: 'Valori identificate în documente', value: fmtRon(amounts.total), sub: plural(amounts.count, 'document', 'documente') });
    var rows = items.map(function (i) {
      return [i.name, i.verticalName, i.currentStep + '/' + i.totalSteps + (i.stepName ? ' — ' + i.stepName : ''), i.statusLabel, i.deadline ? fmtDate(i.deadline) : '—', i.responsibles.join(', ') || '—'];
    });
    var maxV = 0; Object.keys(byVert).forEach(function (k) { maxV = Math.max(maxV, byVert[k]); });
    var bars = Object.keys(byVert).map(function (k) { return { label: k, value: byVert[k], pct: maxV ? Math.round(byVert[k] / maxV * 100) : 0 }; });
    var statusTxt = Object.keys(byStatus).map(function (k) { return k + ' ' + byStatus[k]; }).join(', ');
    var summaryHtml = 'Analiza acoperă <b>' + plural(items.length, 'dosar', 'dosare') + '</b>' + (items.length ? ' (' + verticalsSummary(items).join(', ') + ')' : '') +
      ': ' + active + ' active, <b>' + late + '</b> cu termen depășit, ' + plural(docs, 'document', 'documente') + ' atașate' +
      (amounts.count ? ', valori identificate în documente: <b>' + fmtRon(amounts.total) + '</b>' : '') + '.' +
      (statusTxt ? ' Pe statusuri: ' + esc(statusTxt) + '.' : '') + ' Tabelul complet și graficul sunt în zona de lucru din stânga.';
    return { title: 'Analiză: ' + question, tiles: tiles, rows: rows, bars: bars, summaryHtml: summaryHtml };
  }

  /* ---------- documente generate ---------- */

  function slug(s) {
    return norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48).replace(/_$/, '');
  }
  function generateDocument(noun, question, basis) {
    var me = (MOCK.employees || []).find(function (e) { return e.id === MOCK.currentUserId; });
    var direction = me && me.role ? me.role.split(' · ').pop() : 'Primăria Municipiului București';
    var subject = question.replace(/^[^a-zăâîșț]*(genereaz[ăa]|întocme[șs]te|intocmeste|redacteaz[ăa]|creeaz[ăa]|elaboreaz[ăa]|scrie|preg[ăa]te[șs]te|emite|completeaz[ăa])\s*(o|un|te rog|mi|imi|îmi)?\s*/i, '').replace(/[?.!]+$/, '').trim();
    var subjectCap = subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : '';
    var title = !subject ? noun.title
      : (noun.re.test(norm(subject).slice(0, 24)) ? subjectCap : noun.title + ' — ' + subjectCap);
    var nr = 'AI-' + String(1000 + (state.item.aiDocuments || []).length + 1) + '/' + fmtDate('2026-04-20');
    var verts = verticalsSummary(basis);
    var late = basis.filter(function (i) { return i.active && i.days != null && i.days < 0; });
    var amounts = amountsFromDocs(basis);
    var paragraphs = [];
    if (/raspuns/i.test(noun.type)) {
      var target = basis[0];
      paragraphs.push('Ca urmare a solicitării dumneavoastră' + (target ? ' înregistrate în dosarul „' + target.name + '”' : '') + ', vă comunicăm următoarele:');
      paragraphs.push('Aspectele sesizate au fost analizate de compartimentul de specialitate' + (target && target.responsibles.length ? ' (' + target.responsibles[0] + ')' : '') + '. ' +
        (target ? 'Dosarul se află la pasul ' + target.currentStep + '/' + target.totalSteps + (target.stepName ? ' — ' + target.stepName : '') + ', cu termen ' + (target.deadline ? fmtDate(target.deadline) : 'în curs de stabilire') + '.' : ''));
      paragraphs.push('Prezentul răspuns a fost întocmit cu sprijinul Asistentului AI Scriptica și urmează să fie verificat și semnat de conducătorul structurii competente, în termenul legal.');
    } else {
      paragraphs.push('În conformitate cu evidențele gestionate în Scriptica, la data de ' + fmtDate('2026-04-20') + ' se înregistrează ' + plural(basis.length, 'dosar', 'dosare') + (verts.length ? ' în ' + verts.join(', ') : '') + '.');
      paragraphs.push('Din acestea, ' + basis.filter(function (i) { return i.active; }).length + ' sunt în derulare, iar ' + late.length + ' au termenul pasului curent depășit' + (late.length ? ' (' + late.map(function (i) { return i.name; }).slice(0, 3).join('; ') + (late.length > 3 ? ' ș.a.' : '') + ')' : '') + '.' +
        (amounts.count ? ' Valorile identificate în documentele atașate însumează ' + fmtRon(amounts.total) + '.' : ''));
      paragraphs.push('Situația detaliată este prezentată în tabelul de mai jos. Documentul a fost generat de Asistentul AI Scriptica pe baza datelor accesibile utilizatorului și necesită verificarea și avizarea structurii emitente.');
    }
    var rows = basis.map(function (i, idx) {
      return [String(idx + 1), i.name, i.verticalName, i.currentStep + '/' + i.totalSteps, i.statusLabel, i.deadline ? fmtDate(i.deadline) : '—', i.responsibles.join(', ') || '—'];
    });
    var id = 'doc_ai_' + Date.now();
    var filename = slug(title) + '.pdf';
    var doc = { id: id, type: noun.type, title: title, filename: filename, nr: nr, date: fmtDate('2026-04-20'), direction: direction,
      author: me ? me.name : 'Utilizator intern', paragraphs: paragraphs, columns: ['Nr.', 'Dosar', 'Verticală', 'Pas', 'Status', 'Termen', 'Responsabil'], rows: rows };
    /* înregistrarea în lista de documente a cererii (persistă pe flowItem) */
    var record = { id: id, situationId: state.item.id, domain: state.vertical.domain, filename: filename,
      uploadedAt: nowIso(), source: 'generat', pagesCount: Math.max(1, Math.ceil(rows.length / 18) + 1), multiDoc: false, multiDocConfidence: null,
      tipDocument: 'Notă de răspuns a asistentului', emitent: 'Asistentul AI Scriptica · ' + direction, numarDocument: nr, dataEmiterii: '2026-04-20', perioadaFiscala: '2026-04',
      valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: amounts.count ? amounts.total : null, moneda: 'RON',
      categoriePropusa: 'Notă de răspuns a asistentului', broadCategory: 'raspunsuri', subFilter: null,
      confidenceExtraction: 100, confidenceCategorization: 100, observatieAI: noun.type + ' generat de asistent la cererea „' + question + '” — ' + plural(rows.length, 'poziție', 'poziții') + '.',
      verificat: false, verificatManual: false, pageThumbnails: [], aiGenerated: doc };
    state.item.aiDocuments.push(record);
    if (!(MOCK.documents || []).some(function (x) { return x.id === id; })) MOCK.documents.push(record);
    if (typeof window.SCRIPTICA_DOCS_REFRESH === 'function') setTimeout(window.SCRIPTICA_DOCS_REFRESH, 0);
    return doc;
  }

  function buildChart(preset) {
    var chart = { type: preset.type, labels: (preset.labels || []).slice(), values: (preset.values || []).slice(), series: preset.series || null,
      unit: preset.unit || '', decimals: preset.decimals || 0, note: preset.note || '', tiles: (preset.tiles || []).slice(), insight: preset.insight, refItems: [] };
    if (preset.computed === 'lateByDirection') {
      var by = {}, refItems = [];
      state.kb.items.forEach(function (i) {
        var dir = i.container || 'Fără structură';
        if (!by[dir]) by[dir] = { late: 0, active: 0 };
        if (i.active) by[dir].active++;
        if (i.active && i.days != null && i.days < 0) { by[dir].late++; refItems.push(i); }
      });
      var dirs = Object.keys(by).sort(function (a, b) { return by[b].late - by[a].late || by[b].active - by[a].active; });
      chart.labels = dirs.map(function (d) { return d.replace('Direcția Generală ', 'DG ').replace('Direcția ', 'D. '); });
      chart.values = dirs.map(function (d) { return by[d].late; });
      var totalLate = chart.values.reduce(function (a, b) { return a + b; }, 0);
      chart.tiles = [{ label: 'Dosare active', value: state.kb.items.filter(function (i) { return i.active; }).length }, { label: 'Cu termen depășit', value: totalLate, critical: totalLate > 0 }, { label: 'Direcții afectate', value: chart.values.filter(function (v) { return v > 0; }).length }];
      chart.refItems = refItems.slice(0, 6);
      chart.insight = totalLate ? 'Cele mai multe termene depășite: ' + dirs[0] + ' (' + by[dirs[0]].late + '). ' + preset.insight : 'Nu există dosare active cu termen depășit. ' + preset.insight;
    }
    return chart;
  }

  var CHART_COLORS = ['var(--vertical-auriu)', 'var(--vertical-albastru)', 'var(--vertical-verde)', 'var(--vertical-mov)', 'var(--vertical-portocaliu)', 'var(--vertical-roz)'];
  function fmtNum(v, decimals) {
    var n = Number(v) || 0;
    var s = decimals ? n.toFixed(decimals).replace('.', ',') : Math.round(n).toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function chartHtml(chart) {
    if (chart.type === 'line') return lineChartSvg(chart);
    if (chart.type === 'donut') return donutChartSvg(chart);
    if (chart.type === 'hbars') return hbarsHtml(chart);
    return barsChartSvg(chart);
  }
  function barsChartSvg(chart) {
    var W = 720, H = 300, padL = 40, padB = 70, padT = 20;
    var n = chart.values.length || 1;
    var max = Math.max.apply(null, chart.values.concat([1]));
    var slot = (W - padL) / n, bw = Math.min(64, slot * 0.6);
    var bars = chart.values.map(function (v, i) {
      var h = (H - padB - padT) * (v / max);
      var x = padL + slot * i + (slot - bw) / 2, y = H - padB - h;
      return '<g class="ai-chart__bar" style="animation-delay:' + (i * 90) + 'ms; transform-origin: ' + (x + bw / 2) + 'px ' + (H - padB) + 'px">' +
        '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="6" fill="' + CHART_COLORS[i % CHART_COLORS.length] + '"></rect></g>' +
        '<text class="ai-chart__value ai-chart__fade" style="animation-delay:' + (500 + i * 90) + 'ms" x="' + (x + bw / 2) + '" y="' + (y - 8) + '" text-anchor="middle">' + fmtNum(v, chart.decimals) + '</text>' +
        '<text class="ai-chart__label" x="' + (x + bw / 2) + '" y="' + (H - padB + 18) + '" text-anchor="middle">' + wrapLabel(chart.labels[i], x + bw / 2) + '</text>';
    }).join('');
    var grid = [0.25, 0.5, 0.75, 1].map(function (f) {
      var y = H - padB - (H - padB - padT) * f;
      return '<line x1="' + padL + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="ai-chart__grid"></line><text class="ai-chart__tick" x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + fmtNum(max * f, chart.decimals) + '</text>';
    }).join('');
    return '<svg class="ai-chart ai-chart--bars" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(chart.labels.join(', ')) + '">' + grid + bars + '</svg>' + (chart.unit ? '<div class="ai-chart__unit">' + esc(chart.unit) + '</div>' : '');
  }
  function wrapLabel(text, x) {
    var words = String(text || '').split(' ');
    var lines = [], cur = '';
    words.forEach(function (w) { if ((cur + ' ' + w).trim().length > 16 && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
    if (cur) lines.push(cur);
    return lines.slice(0, 3).map(function (l, i) { return '<tspan x="' + x + '" dy="' + (i ? 13 : 0) + '">' + esc(l) + '</tspan>'; }).join('');
  }
  function lineChartSvg(chart) {
    var W = 720, H = 300, padL = 44, padB = 40, padT = 20, padR = 20;
    var series = chart.series || [{ name: '', values: chart.values }];
    var all = []; series.forEach(function (sr) { all = all.concat(sr.values); });
    var max = Math.max.apply(null, all.concat([1]));
    var n = chart.labels.length || 1;
    var stepX = (W - padL - padR) / Math.max(1, n - 1);
    var grid = [0.25, 0.5, 0.75, 1].map(function (f) {
      var y = H - padB - (H - padB - padT) * f;
      return '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '" class="ai-chart__grid"></line><text class="ai-chart__tick" x="' + (padL - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + fmtNum(max * f) + '</text>';
    }).join('');
    var xlabels = chart.labels.map(function (l, i) { return '<text class="ai-chart__label" x="' + (padL + stepX * i) + '" y="' + (H - padB + 20) + '" text-anchor="middle">' + esc(l) + '</text>'; }).join('');
    var lines = series.map(function (sr, si) {
      var pts = sr.values.map(function (v, i) { return [padL + stepX * i, H - padB - (H - padB - padT) * (v / max)]; });
      var d = pts.map(function (pt, i) { return (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1); }).join(' ');
      var color = CHART_COLORS[si % CHART_COLORS.length];
      return '<path class="ai-chart__line" d="' + d + '" stroke="' + color + '" style="animation-delay:' + (si * 200) + 'ms"></path>' +
        pts.map(function (pt, i) { return '<circle class="ai-chart__fade" cx="' + pt[0] + '" cy="' + pt[1] + '" r="4" fill="' + color + '" style="animation-delay:' + (700 + si * 200 + i * 120) + 'ms"></circle>' +
          '<text class="ai-chart__value ai-chart__fade" x="' + pt[0] + '" y="' + (pt[1] - 10) + '" text-anchor="middle" style="animation-delay:' + (700 + si * 200 + i * 120) + 'ms">' + fmtNum(sr.values[i]) + '</text>'; }).join('');
    }).join('');
    var legend = series.length > 1 ? '<div class="ai-chart__legend">' + series.map(function (sr, si) { return '<span><i style="background:' + CHART_COLORS[si % CHART_COLORS.length] + '"></i>' + esc(sr.name) + '</span>'; }).join('') + '</div>' : '';
    return legend + '<svg class="ai-chart ai-chart--line" viewBox="0 0 ' + W + ' ' + H + '" role="img">' + grid + xlabels + lines + '</svg>' + (chart.note ? '<div class="ai-chart__unit">' + esc(chart.note) + '</div>' : '');
  }
  function donutChartSvg(chart) {
    var total = chart.values.reduce(function (a, b) { return a + b; }, 0) || 1;
    var R = 80, C = 2 * Math.PI * R, offset = 0;
    var segs = chart.values.map(function (v, i) {
      var len = C * (v / total);
      var seg = '<circle class="ai-chart__seg" cx="110" cy="110" r="' + R + '" fill="none" stroke="' + CHART_COLORS[i % CHART_COLORS.length] + '" stroke-width="30" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-offset).toFixed(2) + '" style="animation-delay:' + (i * 220) + 'ms"></circle>';
      offset += len; return seg;
    }).join('');
    var legend = '<ul class="ai-chart__donut-legend">' + chart.values.map(function (v, i) {
      return '<li class="ai-chart__fade" style="animation-delay:' + (i * 220 + 300) + 'ms"><i style="background:' + CHART_COLORS[i % CHART_COLORS.length] + '"></i><span>' + esc(chart.labels[i]) + '</span><b>' + fmtNum(v, chart.decimals) + ' ' + esc(chart.unit) + '</b><em>' + Math.round(v / total * 100) + '%</em></li>';
    }).join('') + '</ul>';
    return '<div class="ai-chart__donut"><svg class="ai-chart ai-chart--donut" viewBox="0 0 220 220" role="img"><g transform="rotate(-90 110 110)">' + segs + '</g>' +
      '<text class="ai-chart__center" x="110" y="104" text-anchor="middle">' + fmtNum(total, chart.decimals) + '</text><text class="ai-chart__center-sub" x="110" y="124" text-anchor="middle">' + esc(chart.unit) + '</text></svg>' + legend + '</div>';
  }
  function hbarsHtml(chart) {
    return '<div class="ai-bars ai-bars--animated">' + chart.values.map(function (v, i) {
      return '<div class="ai-bar ai-chart__fade" style="animation-delay:' + (i * 120) + 'ms"><span class="ai-bar__label">' + esc(chart.labels[i]) + '</span><span class="ai-bar__track"><span class="ai-bar__fill" style="width:' + Math.min(100, v) + '%; animation-delay:' + (i * 120) + 'ms; background:' + CHART_COLORS[i % CHART_COLORS.length] + '"></span></span><span class="ai-bar__value">' + fmtNum(v, chart.decimals) + esc(chart.unit === '%' ? '%' : ' ' + chart.unit) + '</span></div>';
    }).join('') + '</div>';
  }
  function chartCanvasHtml(cv) {
    var chart = cv.chart;
    var tiles = (chart.tiles || []).map(function (t) {
      return '<div class="ai-tile' + (t.critical ? ' ai-tile--critical' : '') + '"><div class="ai-tile__value" data-count="' + t.value + '" data-decimals="' + (t.decimals || 0) + '" data-suffix="' + esc(t.suffix || '') + '">0' + esc(t.suffix || '') + '</div><div class="ai-tile__label">' + esc(t.label) + '</div></div>';
    }).join('');
    return '<div class="ai-tiles">' + tiles + '</div>' +
      '<div class="ai-chart-card">' + chartHtml(chart) + '</div>' +
      '<div class="ai-insight"><span class="material-symbols-outlined" aria-hidden="true">lightbulb</span><span>' + esc(chart.insight) + '</span></div>' +
      '<div class="ai-canvas__actions"><button type="button" class="btn btn--primary" data-ai-generate-from="nota">Întocmește o notă din această analiză<span class="material-symbols-outlined" aria-hidden="true">description</span></button>' +
      '<button type="button" class="btn btn--secondary" data-ai-stub="Exportul graficului va fi disponibil în versiunea finală."><span class="material-symbols-outlined" aria-hidden="true">download</span>Exportă graficul</button></div>';
  }
  /* numărătoare animată pe tile-uri (după randare) */
  function animateCounters(root) {
    var els = root.querySelectorAll('[data-count]');
    if (!els.length) return;
    var start = null, dur = 900;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
      els.forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-count')) || 0, dec = parseInt(el.getAttribute('data-decimals'), 10) || 0;
        el.textContent = fmtNum(target * e, dec) + (el.getAttribute('data-suffix') || '');
      });
      if (p < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function defaultChips() {
    return ['Ce termene se apropie?', 'Câte dosare active am pe fiecare verticală?', 'Întocmește situația achizițiilor în derulare'];
  }
  var EXAMPLE_PROMPTS = [
    { icon: 'search', label: 'Caută', text: 'Ce documente avem la Pasajul Unirii?' },
    { icon: 'monitoring', label: 'Analizează', text: 'Petiții pe subiecte și timp mediu de soluționare' },
    { icon: 'description', label: 'Întocmește', text: 'Întocmește situația centralizatoare a achizițiilor în derulare' },
    { icon: 'mail', label: 'Redactează', text: 'Redactează răspunsul la petiția privind zgomotul de pe Str. Lipscani' }
  ];

  /* ---------- panoul ---------- */

  function mountPanel() {
    var aside = document.querySelector('.messaging');
    if (!aside) return;
    aside.setAttribute('aria-label', state.vertical.name);
    aside.classList.add('ai-panel');
    aside.innerHTML =
      '<div class="messaging__header ai-panel__header">' +
        '<div class="messaging__title-group">' +
          '<span class="material-symbols-outlined ai-panel__icon" aria-hidden="true">' + esc(state.vertical.icon || 'auto_awesome') + '</span>' +
          '<div>' +
            '<h3 class="messaging__title">' + esc(state.vertical.name) + '</h3>' +
            '<div class="ai-panel__context" data-ai-context></div>' +
          '</div>' +
        '</div>' +
        '<button class="messaging__toggle" type="button" aria-label="Restrânge panoul asistentului">' +
          '<span class="material-symbols-outlined" aria-hidden="true">expand_less</span>' +
        '</button>' +
      '</div>' +
      '<div class="ai-panel__list" data-ai-list></div>' +
      '<div class="ai-panel__chips" data-ai-chips></div>' +
      '<div class="composer ai-composer">' +
        '<textarea class="composer__textarea" data-ai-input rows="2" maxlength="' + MAX_CHARS + '" placeholder="Întreabă orice despre dosarele la care ai acces…"></textarea>' +
        '<div class="composer__row">' +
          '<span class="ai-composer__counter" data-ai-counter>0/' + MAX_CHARS + '</span>' +
          '<button class="composer__send" type="button" data-ai-send aria-label="Trimite întrebarea" disabled>' +
            '<span class="material-symbols-outlined" aria-hidden="true">send</span>' +
          '</button>' +
        '</div>' +
      '</div>';
    state.els.list = aside.querySelector('[data-ai-list]');
    state.els.chips = aside.querySelector('[data-ai-chips]');
    state.els.input = aside.querySelector('[data-ai-input]');
    state.els.counter = aside.querySelector('[data-ai-counter]');
    state.els.send = aside.querySelector('[data-ai-send]');
    state.els.context = aside.querySelector('[data-ai-context]');

    state.els.input.addEventListener('input', function () {
      var n = state.els.input.value.length;
      state.els.counter.textContent = n + '/' + MAX_CHARS;
      state.els.send.disabled = !state.els.input.value.trim() || state.typing;
    });
    state.els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    state.els.send.addEventListener('click', submit);
    aside.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-ai-chip]');
      if (chip) { ask(chip.getAttribute('data-ai-chip')); return; }
      var stop = e.target.closest('[data-ai-stop]');
      if (stop) { stopResponding(); return; }
      var copy = e.target.closest('[data-ai-copy]');
      if (copy) {
        var card = copy.closest('[data-ai-msg]');
        var text = card ? (card.querySelector('.ai-msg__answer') || {}).textContent || '' : '';
        try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (err) {}
        toast('success', 'Răspunsul a fost copiat.');
        return;
      }
      var vote = e.target.closest('[data-ai-vote]');
      if (vote) {
        vote.closest('.ai-msg__actions').querySelectorAll('[data-ai-vote]').forEach(function (b) { b.classList.remove('is-active'); });
        vote.classList.add('is-active');
        toast('info', 'Mulțumim — feedbackul ajută la antrenarea asistentului.');
        return;
      }
      var tog = e.target.closest('[data-ai-toggle]');
      if (tog) {
        var target = tog.parentNode.querySelector('.ai-fold__body');
        var open = tog.getAttribute('aria-expanded') === 'true';
        tog.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (target) target.hidden = open;
      }
    });
  }

  function submit() {
    var q = state.els.input.value.trim();
    if (!q || state.typing) return;
    state.els.input.value = '';
    state.els.counter.textContent = '0/' + MAX_CHARS;
    state.els.send.disabled = true;
    ask(q);
  }

  function ask(question) {
    if (state.typing) return;
    var msgs = state.item.aiMessages;
    msgs.push({ id: 'aim_' + Date.now(), role: 'user', at: nowIso(), text: question });
    if (/ nouă$/.test(state.item.name || '') || !state.item.name) {
      state.item.name = question.length > 80 ? question.slice(0, 77) + '…' : question;
      var title = document.querySelector('.detail-topbar__title');
      if (title) title.textContent = (state.item.clientCompany || state.item.clientName || '') + ' — ' + state.item.name;
      document.title = state.item.name + ' — Scriptica';
    }
    if (state.item.status === 'analiza') state.item.status = 'in_verificare';
    persist();
    state.typing = true;
    var result = answer(question);
    /* canvasul arată raționamentul pas cu pas, apoi rezultatul; chatul primește răspunsul scurt la final */
    state.canvas = { mode: 'thinking', msgId: null, preview: null, question: question, steps: result.reasoning, revealed: 0 };
    render();
    var stepDelay = 650;
    function reveal() {
      if (state.canvas.mode !== 'thinking') return;
      state.canvas.revealed++;
      renderCanvas();
      if (state.canvas.revealed < result.reasoning.length) { state.pending = setTimeout(reveal, stepDelay); return; }
      state.pending = setTimeout(finish, 500);
    }
    function finish() {
      state.pending = null;
      var msg = { id: 'aim_' + Date.now(), role: 'assistant', at: nowIso(),
        reasoning: result.reasoning, answerHtml: result.answerHtml, references: result.references,
        contextShift: result.contextShift, chips: result.chips, canvas: result.canvas || null };
      msgs.push(msg);
      if (result.contextShift) {
        state.item.aiContext = result.contextShift.itemIds && result.contextShift.itemIds.length
          ? { label: result.contextShift.label, itemIds: result.contextShift.itemIds }
          : null;
      }
      state.typing = false;
      state.canvas = { mode: 'result', msgId: msg.id, preview: null };
      upsertTranscript(question);
      persist();
      render();
    }
    state.pending = setTimeout(reveal, 400);
  }

  /* Conversația se arhivează ca „notă a asistentului” în dosarul cererii (I.d.1) */
  function upsertTranscript(lastQuestion) {
    var id = 'doc_ai_transcript_' + state.item.id;
    var n = state.item.aiMessages.length;
    var existing = state.item.aiDocuments.find(function (d) { return d.id === id; });
    var record = existing || { id: id, situationId: state.item.id, domain: state.vertical.domain,
      filename: 'conversatie_asistent_' + slug(state.item.name || 'cerere') + '.pdf', source: 'generat',
      pagesCount: 1, multiDoc: false, multiDocConfidence: null, tipDocument: 'Notă de răspuns a asistentului', emitent: 'Asistentul AI Scriptica',
      numarDocument: null, dataEmiterii: '2026-04-20', perioadaFiscala: '2026-04', valoareFaraTVA: null, tvaProcent: null, tvaValoare: null, valoareTotala: null, moneda: 'RON',
      categoriePropusa: 'Notă de răspuns a asistentului', broadCategory: 'raspunsuri', subFilter: null, confidenceExtraction: 100, confidenceCategorization: 100,
      verificat: false, verificatManual: false, pageThumbnails: [], aiTranscript: true };
    record.uploadedAt = nowIso();
    record.pagesCount = Math.max(1, Math.ceil(n / 6));
    record.observatieAI = 'Transcriptul conversației cu asistentul — ' + plural(n, 'mesaj', 'mesaje') + '. Ultima întrebare: „' + lastQuestion + '”.';
    if (!existing) state.item.aiDocuments.push(record);
    var idx = (MOCK.documents || []).findIndex(function (x) { return x.id === id; });
    if (idx === -1) MOCK.documents.push(record); else MOCK.documents[idx] = record;
    if (typeof window.SCRIPTICA_DOCS_REFRESH === 'function') setTimeout(window.SCRIPTICA_DOCS_REFRESH, 0);
  }

  function stopResponding() {
    if (state.pending) { clearTimeout(state.pending); state.pending = null; }
    state.typing = false;
    state.canvas = { mode: 'idle', msgId: null, preview: null };
    state.item.aiMessages.push({ id: 'aim_' + Date.now(), role: 'assistant', at: nowIso(), stopped: true,
      reasoning: [], answerHtml: 'Răspunsul a fost oprit la cererea ta.', references: [], contextShift: null, chips: defaultChips() });
    persist();
    render();
  }

  function persist() {
    if (typeof window.scripticaFlowSave !== 'function') return;
    var record = Object.assign({}, state.item);
    delete record.flowDefinition;
    delete record.__isFlowWorkspace;
    delete record.flowItemLabel;
    delete record.flowVerticalId;
    window.scripticaFlowSave('flowItem', record);
  }

  /* ---------- randare ---------- */

  function render() {
    if (!state.els.list) return;
    var msgs = state.item.aiMessages;
    var ctxLabel = state.item.aiContext && state.item.aiContext.label
      ? state.item.aiContext.label
      : 'Toate dosarele accesibile (' + state.kb.items.length + ')';
    state.els.context.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">my_location</span>' + esc(ctxLabel);

    var html = '<div class="ai-msg ai-msg--assistant ai-msg--intro">' +
      '<div class="ai-msg__avatar"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span></div>' +
      '<div class="ai-msg__bubble">' +
        '<div class="ai-msg__answer">Salut, ' + esc((MOCK.currentUser && MOCK.currentUser.name) || '') + '! Caut în dosarele și documentele la care ai acces, fac analize și statistici și întocmesc documente. Rezultatele detaliate apar în zona de lucru din stânga.</div>' +
        '<div class="ai-msg__disclaimer"><span class="material-symbols-outlined" aria-hidden="true">info</span>Răspunsurile generate de AI pot varia. Verifică sursele indicate.</div>' +
      '</div></div>';
    html += msgs.map(msgHtml).join('');
    if (state.typing) {
      html += '<div class="ai-msg ai-msg--assistant ai-msg--typing" aria-live="polite">' +
        '<div class="ai-msg__avatar"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span></div>' +
        '<div class="ai-msg__bubble"><div class="ai-typing"><span></span><span></span><span></span></div>' +
        '<button type="button" class="btn btn--ghost btn--sm ai-stop" data-ai-stop><span class="material-symbols-outlined" aria-hidden="true">stop_circle</span>Oprește răspunsul</button></div></div>';
    }
    state.els.list.innerHTML = html;

    var last = msgs.length ? msgs[msgs.length - 1] : null;
    var chips = state.typing ? [] : ((last && last.role === 'assistant' && last.chips && last.chips.length) ? last.chips : defaultChips());
    state.els.chips.innerHTML = chips.map(function (c) {
      return '<button type="button" class="ai-chip" data-ai-chip="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('');
    state.els.send.disabled = !state.els.input.value.trim() || state.typing;
    state.els.list.scrollTop = state.els.list.scrollHeight;
    var aside = document.querySelector('.messaging');
    if (aside) aside.scrollTop = aside.scrollHeight;
    renderCanvas();
  }

  /* ---------- canvasul de lucru (zona principală) ---------- */

  function mountCanvas() {
    var docs = document.getElementById('docs-section');
    var main = document.getElementById('detail-main');
    if (!main) return;
    var section = document.createElement('section');
    section.className = 'ai-canvas';
    section.id = 'ai-canvas';
    section.setAttribute('aria-label', 'Zona de lucru a asistentului');
    if (docs && docs.parentNode === main) main.insertBefore(section, docs); else main.appendChild(section);
    state.els.canvas = section;
    section.addEventListener('click', function (e) {
      var ex = e.target.closest('[data-ai-example]');
      if (ex) { ask(ex.getAttribute('data-ai-example')); return; }
      var row = e.target.closest('[data-ai-preview]');
      if (row) { state.canvas.preview = row.getAttribute('data-ai-preview'); renderCanvas(); return; }
      var back = e.target.closest('[data-ai-preview-close]');
      if (back) { state.canvas.preview = null; renderCanvas(); return; }
      var gen = e.target.closest('[data-ai-generate-from]');
      if (gen) { ask(gen.getAttribute('data-ai-generate-from') === 'nota' ? 'Întocmește o notă de informare cu concluziile acestei analize' : 'Întocmește o situație centralizatoare cu aceste date'); return; }
      var stub = e.target.closest('[data-ai-stub]');
      if (stub) { toast('info', stub.getAttribute('data-ai-stub')); return; }
    });
    /* sursele din chat cu #preview: deschid previzualizarea în canvas, nu navighează */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#preview:"]');
      if (!a) return;
      e.preventDefault();
      state.canvas.preview = a.getAttribute('href').slice('#preview:'.length);
      if (state.canvas.mode !== 'result') state.canvas.mode = 'result';
      renderCanvas();
      var el = document.getElementById('ai-canvas');
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderCanvas() {
    var el = state.els.canvas;
    if (!el) return;
    var c = state.canvas;
    var html;
    if (c.mode === 'thinking') html = canvasThinkingHtml(c);
    else if (c.mode === 'result') {
      var msg = state.item.aiMessages.find(function (m) { return m.id === c.msgId; });
      html = msg && msg.canvas ? canvasResultHtml(msg) : canvasIdleHtml();
    } else html = canvasIdleHtml();
    el.innerHTML = html;
    if (c.mode === 'result' && !c.preview) animateCounters(el);
  }

  function canvasIdleHtml() {
    var name = (MOCK.currentUser && MOCK.currentUser.name) || '';
    return '<div class="ai-canvas__idle">' +
      '<div class="ai-canvas__hero">' +
        '<span class="material-symbols-outlined ai-canvas__hero-icon" aria-hidden="true">auto_awesome</span>' +
        '<h2 class="ai-canvas__greeting">Salut ' + esc(name) + ', cu ce te pot ajuta azi?</h2>' +
        '<p class="ai-canvas__sub">Caut în dosarele și documentele la care ai acces, fac analize și statistici și întocmesc note, situații sau răspunsuri. Documentele generate intră automat în zona Documente a acestei cereri.</p>' +
      '</div>' +
      '<div class="ai-examples">' + EXAMPLE_PROMPTS.map(function (p) {
        return '<button type="button" class="ai-example" data-ai-example="' + esc(p.text) + '">' +
          '<span class="material-symbols-outlined" aria-hidden="true">' + p.icon + '</span>' +
          '<span class="ai-example__label">' + esc(p.label) + '</span>' +
          '<span class="ai-example__text">' + esc(p.text) + '</span></button>';
      }).join('') + '</div>' +
    '</div>';
  }

  function canvasThinkingHtml(c) {
    return '<div class="ai-canvas__head">' +
        '<span class="material-symbols-outlined ai-spin" aria-hidden="true">progress_activity</span>' +
        '<div><div class="ai-canvas__kicker">Asistentul lucrează</div><h2 class="ai-canvas__title">' + esc(c.question) + '</h2></div>' +
      '</div>' +
      '<ol class="ai-think">' + c.steps.map(function (st, i) {
        var cls = i < c.revealed ? 'is-done' : (i === c.revealed ? 'is-current' : 'is-pending');
        var icon = i < c.revealed ? 'check_circle' : (i === c.revealed ? 'progress_activity' : 'radio_button_unchecked');
        return '<li class="ai-think__step ' + cls + '"><span class="material-symbols-outlined' + (i === c.revealed ? ' ai-spin' : '') + '" aria-hidden="true">' + icon + '</span><span>' + st + '</span></li>';
      }).join('') + '</ol>';
  }

  function canvasResultHtml(msg) {
    var cv = msg.canvas;
    var head = '<div class="ai-canvas__head">' +
        '<span class="material-symbols-outlined ai-canvas__head-icon" aria-hidden="true">' + (cv.kind === 'document' ? 'description' : (cv.kind === 'analysis' || cv.kind === 'chart' ? 'monitoring' : 'search')) + '</span>' +
        '<div><div class="ai-canvas__kicker">' + (cv.kind === 'document' ? 'Document generat' : (cv.kind === 'chart' ? 'Analiză grafică' : (cv.kind === 'analysis' ? 'Analiză' : 'Rezultate'))) + '</div><h2 class="ai-canvas__title">' + esc(cv.title || cv.doc && cv.doc.title || '') + '</h2></div>' +
      '</div>';
    var think = foldHtml('psychology', 'Cum am ajuns aici · ' + plural((msg.reasoning || []).length, 'pas', 'pași'),
      '<ol class="ai-think ai-think--compact">' + (msg.reasoning || []).map(function (r) { return '<li class="ai-think__step is-done"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span>' + r + '</span></li>'; }).join('') + '</ol>', false);
    if (state.canvas.preview) return head + previewHtml(state.canvas.preview);
    if (cv.kind === 'note') return head + '<p class="ai-canvas__note">' + esc(cv.text) + '</p>' + think;
    if (cv.kind === 'search') return head + think + searchResultsHtml(cv);
    if (cv.kind === 'analysis') return head + think + analysisHtml(cv);
    if (cv.kind === 'chart') return head + think + chartCanvasHtml(cv);
    if (cv.kind === 'document') return head + think + documentHtml(cv.doc, true);
    return head;
  }

  function searchResultsHtml(cv) {
    var items = (cv.itemIds || []).map(function (id) { return state.kb.items.find(function (i) { return i.id === id; }); }).filter(Boolean);
    var docs = (cv.docIds || []).map(function (id) { return state.kb.docs.find(function (d) { return d.id === id; }); }).filter(Boolean);
    var html = '';
    if (items.length) {
      html += '<h3 class="ai-canvas__section">Dosare (' + items.length + ')</h3><div class="ai-results">' + items.map(function (i) {
        return '<button type="button" class="ai-result" data-ai-preview="item:' + esc(i.id) + '">' +
          '<span class="material-symbols-outlined ai-result__icon" aria-hidden="true">folder_open</span>' +
          '<span class="ai-result__main"><span class="ai-result__title">' + esc(i.name) + '</span><span class="ai-result__sub">' + esc(i.verticalName) + ' · ' + esc(i.party) + ' · pasul ' + i.currentStep + '/' + i.totalSteps + '</span></span>' +
          '<span class="sit-status sit-status--' + esc(i.status) + '"><span class="status-dot status-dot--' + esc(i.status) + '"></span>' + esc(i.statusLabel) + '</span>' +
          '<span class="material-symbols-outlined ai-result__go" aria-hidden="true">chevron_right</span></button>';
      }).join('') + '</div>';
    }
    if (docs.length) {
      html += '<h3 class="ai-canvas__section">Documente (' + docs.length + ')</h3><div class="ai-results">' + docs.map(function (d) {
        return '<button type="button" class="ai-result" data-ai-preview="doc:' + esc(d.id) + '">' +
          '<span class="material-symbols-outlined ai-result__icon" aria-hidden="true">description</span>' +
          '<span class="ai-result__main"><span class="ai-result__title">' + esc(d.filename) + '</span><span class="ai-result__sub">' + esc(d.tip) + (d.emitent ? ' · ' + esc(d.emitent) : '') + (d.itemName ? ' · ' + esc(d.itemName) : '') + '</span></span>' +
          '<span class="ai-result__date">' + esc(fmtDate(d.date)) + '</span>' +
          '<span class="material-symbols-outlined ai-result__go" aria-hidden="true">chevron_right</span></button>';
      }).join('') + '</div>';
    }
    return html || '<p class="ai-canvas__note">Niciun rezultat.</p>';
  }

  function analysisHtml(cv) {
    var tiles = (cv.tiles || []).map(function (t) {
      return '<div class="ai-tile' + (t.critical ? ' ai-tile--critical' : '') + '"><div class="ai-tile__value">' + esc(t.value) + '</div><div class="ai-tile__label">' + esc(t.label) + (t.sub ? ' · ' + esc(t.sub) : '') + '</div></div>';
    }).join('');
    var bars = (cv.bars || []).length ? '<h3 class="ai-canvas__section">Distribuție pe verticale</h3><div class="ai-bars">' + cv.bars.map(function (b) {
      return '<div class="ai-bar"><span class="ai-bar__label">' + esc(b.label) + '</span><span class="ai-bar__track"><span class="ai-bar__fill" style="width:' + b.pct + '%"></span></span><span class="ai-bar__value">' + b.value + '</span></div>';
    }).join('') + '</div>' : '';
    var table = (cv.rows || []).length ? '<h3 class="ai-canvas__section">Detaliu (' + cv.rows.length + ')</h3><div class="table-wrap"><table class="sit-table ai-table"><thead><tr><th>Dosar</th><th>Verticală</th><th>Pas</th><th>Status</th><th>Termen</th><th>Responsabil</th></tr></thead><tbody>' +
      cv.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '';
    var actions = '<div class="ai-canvas__actions"><button type="button" class="btn btn--primary" data-ai-generate-from>Întocmește o situație din această analiză<span class="material-symbols-outlined" aria-hidden="true">description</span></button></div>';
    return '<div class="ai-tiles">' + tiles + '</div>' + bars + table + actions;
  }

  function documentHtml(doc, withActions) {
    var body = '<article class="ai-doc">' +
      '<header class="ai-doc__letterhead">' +
        '<div class="ai-doc__institution">PRIMĂRIA MUNICIPIULUI BUCUREȘTI</div>' +
        '<div class="ai-doc__direction">' + esc(doc.direction) + '</div>' +
        '<div class="ai-doc__meta"><span>Nr. ' + esc(doc.nr) + '</span><span>București, ' + esc(doc.date) + '</span></div>' +
      '</header>' +
      '<h1 class="ai-doc__title">' + esc(doc.title) + '</h1>' +
      doc.paragraphs.map(function (p) { return '<p class="ai-doc__p">' + esc(p) + '</p>'; }).join('') +
      (doc.rows && doc.rows.length ? '<table class="ai-doc__table"><thead><tr>' + doc.columns.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        doc.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '') +
      '<footer class="ai-doc__footer"><div>Întocmit: <b>Asistentul AI Scriptica</b> · la cererea ' + esc(doc.author) + '</div><div>Verificat / avizat: ____________________</div></footer>' +
    '</article>';
    var actions = withActions ? '<div class="ai-canvas__actions">' +
      '<button type="button" class="btn btn--secondary" data-ai-stub="Descărcarea documentelor va fi disponibilă în versiunea finală."><span class="material-symbols-outlined" aria-hidden="true">download</span>Descarcă PDF</button>' +
      '<button type="button" class="btn btn--primary" data-ai-stub="Trimiterea pe fluxul de avizare va fi disponibilă în versiunea finală.">Trimite spre avizare<span class="material-symbols-outlined" aria-hidden="true">send</span></button>' +
      '<span class="ai-canvas__saved"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>Salvat în Documente: ' + esc(doc.filename) + '</span>' +
    '</div>' : '';
    return body + actions;
  }

  function previewHtml(key) {
    var kind = key.split(':')[0], id = key.slice(kind.length + 1);
    var back = '<button type="button" class="btn btn--ghost ai-preview__back" data-ai-preview-close><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>Înapoi la rezultate</button>';
    if (kind === 'doc') {
      var d = state.kb.docs.find(function (x) { return x.id === id; });
      var raw = (MOCK.documents || []).find(function (x) { return x.id === id; });
      if (raw && raw.aiGenerated) return back + documentHtml(raw.aiGenerated, true);
      if (!d && !raw) return back + '<p class="ai-canvas__note">Documentul nu mai este disponibil.</p>';
      var doc = d || { filename: raw.filename, tip: raw.tipDocument, emitent: raw.emitent, nr: raw.numarDocument, date: raw.dataEmiterii, obs: raw.observatieAI, itemName: '', href: 'arhiva.html' };
      return back + '<div class="ai-preview">' +
        '<div class="ai-preview__page">' +
          '<div class="ai-doc__letterhead"><div class="ai-doc__institution">' + esc(doc.emitent || '—') + '</div><div class="ai-doc__meta"><span>' + (doc.nr ? 'Nr. ' + esc(doc.nr) : '') + '</span><span>' + esc(fmtDate(doc.date)) + '</span></div></div>' +
          '<h1 class="ai-doc__title">' + esc(doc.tip) + '</h1>' +
          '<p class="ai-doc__p">' + esc(doc.obs || '') + '</p>' +
          '<p class="ai-doc__p ai-doc__p--muted">Previzualizare generată din metadatele extrase de clasificarea automată; conținutul integral al fișierului se deschide din dosar.</p>' +
        '</div>' +
        '<aside class="ai-preview__meta">' +
          '<h3 class="ai-canvas__section">Fișa documentului</h3>' +
          kvHtml('Fișier', doc.filename) + kvHtml('Tip document', doc.tip) + kvHtml('Emitent', doc.emitent || '—') + kvHtml('Număr', doc.nr || '—') + kvHtml('Data emiterii', fmtDate(doc.date)) + kvHtml('Dosar', doc.itemName || '—') +
          '<a class="btn btn--secondary" href="' + esc(doc.href) + '"><span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>Deschide dosarul</a>' +
        '</aside></div>';
    }
    var i = state.kb.items.find(function (x) { return x.id === id; });
    if (!i) return back + '<p class="ai-canvas__note">Dosarul nu mai este disponibil.</p>';
    var docs = state.kb.docs.filter(function (d) { return d.itemId === i.id; });
    return back + '<div class="ai-preview">' +
      '<div class="ai-preview__page ai-preview__page--item">' +
        '<div class="ai-canvas__kicker">' + esc(i.verticalName) + ' · ' + esc(i.templateName) + '</div>' +
        '<h1 class="ai-doc__title">' + esc(i.name) + '</h1>' +
        '<div class="ai-tiles ai-tiles--compact">' +
          '<div class="ai-tile"><div class="ai-tile__value">' + i.currentStep + '/' + i.totalSteps + '</div><div class="ai-tile__label">' + esc(i.stepName || 'pas curent') + '</div></div>' +
          '<div class="ai-tile"><div class="ai-tile__value">' + esc(i.statusLabel) + '</div><div class="ai-tile__label">status</div></div>' +
          '<div class="ai-tile' + (i.days != null && i.days < 0 ? ' ai-tile--critical' : '') + '"><div class="ai-tile__value">' + (i.deadline ? esc(fmtDate(i.deadline)) : '—') + '</div><div class="ai-tile__label">' + (i.days == null ? 'termen' : (i.days < 0 ? Math.abs(i.days) + ' zile întârziere' : 'în ' + plural(i.days, 'zi', 'zile'))) + '</div></div>' +
        '</div>' +
        '<h3 class="ai-canvas__section">Documente (' + docs.length + ')</h3>' +
        (docs.length ? '<div class="ai-results">' + docs.map(function (d) {
          return '<button type="button" class="ai-result" data-ai-preview="doc:' + esc(d.id) + '"><span class="material-symbols-outlined ai-result__icon" aria-hidden="true">description</span><span class="ai-result__main"><span class="ai-result__title">' + esc(d.filename) + '</span><span class="ai-result__sub">' + esc(d.tip) + '</span></span><span class="material-symbols-outlined ai-result__go" aria-hidden="true">chevron_right</span></button>';
        }).join('') + '</div>' : '<p class="ai-canvas__note">Fără documente atașate.</p>') +
      '</div>' +
      '<aside class="ai-preview__meta">' +
        '<h3 class="ai-canvas__section">Fișa dosarului</h3>' +
        kvHtml('Parte implicată', i.party || '—') + kvHtml('Contact', i.contact || '—') + kvHtml('Structura', i.container || '—') + kvHtml('Responsabili', i.responsibles.join(', ') || '—') + kvHtml('Data început', '—') +
        '<a class="btn btn--secondary" href="' + esc(i.href) + '"><span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>Deschide dosarul</a>' +
      '</aside></div>';
  }
  function kvHtml(k, v) { return '<div class="ai-kv"><span class="ai-kv__k">' + esc(k) + '</span><span class="ai-kv__v">' + esc(v) + '</span></div>'; }

  function foldHtml(icon, title, bodyHtml, open) {
    return '<div class="ai-fold">' +
      '<button type="button" class="ai-fold__toggle" data-ai-toggle aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="material-symbols-outlined ai-fold__chevron" aria-hidden="true">expand_more</span>' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' + esc(title) + '</button>' +
      '<div class="ai-fold__body"' + (open ? '' : ' hidden') + '>' + bodyHtml + '</div>' +
    '</div>';
  }

  function msgHtml(m) {
    if (m.role === 'user') {
      return '<div class="ai-msg ai-msg--user" data-ai-msg="' + esc(m.id) + '">' +
        '<div class="ai-msg__bubble"><div class="ai-msg__text">' + esc(m.text) + '</div><div class="ai-msg__time">' + esc(fmtTime(m.at)) + '</div></div></div>';
    }
    var reasoning = (m.reasoning || []).length
      ? foldHtml('psychology', 'Raționament · ' + plural(m.reasoning.length, 'pas', 'pași'),
          '<ol class="ai-reasoning">' + m.reasoning.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ol>', false)
      : '';
    var refs = (m.references || []).length
      ? foldHtml('link', 'Surse · ' + plural(m.references.length, 'element', 'elemente'),
          '<ul class="ai-refs">' + m.references.map(function (r) {
            var icon = r.kind === 'document' ? 'description' : (r.kind === 'persoana' ? 'person' : 'folder_open');
            var inner = '<span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span><span class="ai-refs__main"><span class="ai-refs__label">' + esc(r.label) + '</span>' + (r.sub ? '<span class="ai-refs__sub">' + esc(r.sub) + '</span>' : '') + '</span>';
            return '<li>' + (r.href ? '<a class="ai-refs__item" href="' + esc(r.href) + '">' + inner + '<span class="material-symbols-outlined ai-refs__go" aria-hidden="true">open_in_new</span></a>' : '<span class="ai-refs__item">' + inner + '</span>') + '</li>';
          }).join('') + '</ul>', true)
      : '';
    var shift = m.contextShift
      ? '<div class="ai-shift"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Contextul conversației s-a schimbat la: ' +
          (m.contextShift.names && m.contextShift.names.length ? joinNames(m.contextShift.names, 2) : '<b>' + esc(m.contextShift.label) + '</b>') + '</span></div>'
      : '';
    return '<div class="ai-msg ai-msg--assistant' + (m.stopped ? ' ai-msg--stopped' : '') + '" data-ai-msg="' + esc(m.id) + '">' +
      '<div class="ai-msg__avatar"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span></div>' +
      '<div class="ai-msg__bubble">' +
        reasoning +
        '<div class="ai-msg__answer">' + m.answerHtml + '</div>' +
        '<div class="ai-msg__actions">' +
          '<button type="button" class="ai-icon-btn" data-ai-copy title="Copiază răspunsul" aria-label="Copiază răspunsul"><span class="material-symbols-outlined" aria-hidden="true">content_copy</span></button>' +
          '<button type="button" class="ai-icon-btn" data-ai-vote="up" title="Răspuns util" aria-label="Răspuns util"><span class="material-symbols-outlined" aria-hidden="true">thumb_up</span></button>' +
          '<button type="button" class="ai-icon-btn" data-ai-vote="down" title="Răspuns neutil" aria-label="Răspuns neutil"><span class="material-symbols-outlined" aria-hidden="true">thumb_down</span></button>' +
          '<span class="ai-msg__time">' + esc(fmtTime(m.at)) + '</span>' +
        '</div>' +
        refs +
      '</div></div>' + shift;
  }
})();
