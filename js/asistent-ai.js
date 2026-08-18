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

  var state = { item: null, vertical: null, kb: null, pending: null, typing: false, els: {} };

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
    mountPanel();
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
  function stem(t) { return t.length > 5 ? t.slice(0, t.length - 2) : (t.length > 4 ? t.slice(0, t.length - 1) : t); }
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

  function intentOf(q) {
    var n = norm(q);
    if (/\b(reset|toate dosarele|contextul initial|sterge contextul|iesi din context)/.test(n)) return 'reset';
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
    var toks = tokens(question);
    var intent = intentOf(question);
    var ctx = contextItems();
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

    if (intent === 'count') {
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
    return { reasoning: reasoning, answerHtml: html, references: refs, contextShift: shift, chips: chips };
  }

  function defaultChips() {
    return ['Ce termene se apropie?', 'Câte dosare active am pe fiecare verticală?', 'Cine răspunde de achizițiile în derulare?'];
  }

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
    render();
    var delay = 900 + Math.min(1500, question.length * 12);
    state.pending = setTimeout(function () {
      state.pending = null;
      var result = answer(question);
      var msg = { id: 'aim_' + Date.now(), role: 'assistant', at: nowIso(),
        reasoning: result.reasoning, answerHtml: result.answerHtml, references: result.references,
        contextShift: result.contextShift, chips: result.chips };
      msgs.push(msg);
      if (result.contextShift) {
        state.item.aiContext = result.contextShift.itemIds && result.contextShift.itemIds.length
          ? { label: result.contextShift.label, itemIds: result.contextShift.itemIds }
          : null;
      }
      state.typing = false;
      persist();
      render();
    }, delay);
  }

  function stopResponding() {
    if (state.pending) { clearTimeout(state.pending); state.pending = null; }
    state.typing = false;
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
        '<div class="ai-msg__answer">Bună, ' + esc((MOCK.currentUser && MOCK.currentUser.name) || '') + '. Întreabă-mă orice despre dosarele, documentele și termenele la care ai acces — caut în toate evidențele instituției și îți arăt sursele.</div>' +
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
  }

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
