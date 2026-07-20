/* ============================================================
   Scriptica — Completare anexe (Phase 10)
   Cardurile de anexe per pas + modalul full-screen de completare.
   Expune window.SCRIPTICA_ANEXE = { renderCards, allComplete,
   getStepAnexe }.

   Contract răspunsuri — localStorage 'scriptica.anexaResponses':
   map cheie = situationId + '::' + anexaTypeId →
   { values: { [fieldIndexAsString]: value },
     updatedAt: 'YYYY-MM-DD', completedByName: string|null }.
   Today is pinned to 2026-04-20.
   ============================================================ */

(function () {
  'use strict';

  var RESP_KEY = 'scriptica.anexaResponses';
  var TODAY_ISO = '2026-04-20';
  var LAYOUT_TYPES = ['section_title', 'paragraph', 'banner', 'divider'];

  function getMock() {
    return window.SCRIPTICA_MOCK || {};
  }

  /* ---------- Utilitare ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(variant, msg) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, msg);
  }

  /* Completatorul = angajatul curent (MOCK.employees după MOCK.currentUserId,
     fallback MOCK.currentUser) — aceeași rezolvare ca în situatie-detaliu.js,
     ca numele din footerul anexei să coincidă cu cel al task-urilor,
     indiferent de view-ul persistat în localStorage (ex. 'admin'). */
  function currentUserName() {
    var M = getMock();
    var u = (M.employees || []).find(function (e) { return e.id === M.currentUserId; }) || M.currentUser;
    if (!u) return null;
    return u.fullName || u.name || null;
  }

  function isClientView() {
    return typeof window.getCurrentView === 'function' && window.getCurrentView() === 'client';
  }

  /* ---------- Stocare răspunsuri ---------- */

  function readMap() {
    try {
      var raw = localStorage.getItem(RESP_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeMap(map) {
    try { localStorage.setItem(RESP_KEY, JSON.stringify(map)); } catch (e) { /* ignore */ }
  }

  function respKey(situationId, anexaTypeId) {
    return situationId + '::' + anexaTypeId;
  }

  function getResponse(situation, anexaTypeId) {
    var key = respKey(situation.id, anexaTypeId);
    var stored = readMap()[key];
    if (stored) return stored;
    /* Seeded demo states from mock-data (MOCK.anexaResponseSeeds) act as
       the base layer; anything saved in localStorage overrides per key. */
    var seeds = getMock().anexaResponseSeeds || {};
    return seeds[key] || null;
  }

  /* ============================================================
     FORMULE AUTOMATE (cross-anexă) — motor de calcul
     Formulele trăiesc pe tipul de misiune (situationType.formulas);
     fiecare = { resultRef:"{anexaId}.{REF}", expr, resultType, allowManualOverride }.
     Referențiabile sunt DOAR câmpurile numerice cu `ref`.
     Evaluator sigur (fără eval) — recursive descent, operatori aritmetici și paranteze.
     ============================================================ */

  function tokenizeExpr(expr) {
    var s = String(expr == null ? '' : expr), tokens = [], i = 0;
    while (i < s.length) {
      var ch = s.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') { i++; continue; }
      if ('+-*/()'.indexOf(ch) !== -1) { tokens.push({ t: 'op', v: ch }); i++; continue; }
      if ((ch >= '0' && ch <= '9') || ch === '.') {
        var num = '';
        while (i < s.length && ((s.charAt(i) >= '0' && s.charAt(i) <= '9') || s.charAt(i) === '.')) { num += s.charAt(i); i++; }
        tokens.push({ t: 'num', v: parseFloat(num) }); continue;
      }
      if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') {
        var id = '';
        while (i < s.length) { var c = s.charAt(i); if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '_' || c === '.') { id += c; i++; } else break; }
        tokens.push({ t: 'ref', v: id }); continue;
      }
      return { error: 'Caracter neacceptat: ' + ch };
    }
    return { tokens: tokens };
  }

  /* resolver(refToken) → number | null. Returns {ok,value} | {ok:false,reason,missing}. */
  function evalExpr(expr, resolver) {
    var tk = tokenizeExpr(expr);
    if (tk.error) return { ok: false, reason: tk.error };
    var tokens = tk.tokens;
    if (!tokens.length) return { ok: false, reason: 'empty' };
    var pos = 0, missing = [], hadError = false;
    function peek() { return tokens[pos]; }
    function next() { return tokens[pos++]; }
    function parseExpression() {
      var v = parseTerm();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        var op = next().v; var r = parseTerm(); v = (op === '+') ? v + r : v - r;
      }
      return v;
    }
    function parseTerm() {
      var v = parseFactor();
      while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) {
        var op = next().v; var r = parseFactor();
        if (op === '*') v = v * r; else { if (r === 0) hadError = hadError || 'div0'; v = v / r; }
      }
      return v;
    }
    function parseFactor() {
      var t = peek();
      if (!t) { hadError = hadError || 'expr'; return NaN; }
      if (t.t === 'op' && (t.v === '-' || t.v === '+')) { next(); var f = parseFactor(); return t.v === '-' ? -f : f; }
      if (t.t === 'op' && t.v === '(') {
        next(); var e = parseExpression();
        if (peek() && peek().t === 'op' && peek().v === ')') next(); else hadError = hadError || 'paren';
        return e;
      }
      if (t.t === 'num') { next(); return t.v; }
      if (t.t === 'ref') {
        next();
        var val = resolver(t.v);
        if (val == null || isNaN(Number(val))) { missing.push(t.v); return NaN; }
        return Number(val);
      }
      hadError = hadError || 'expr'; next(); return NaN;
    }
    var result = parseExpression();
    if (peek()) hadError = hadError || 'trailing';
    if (missing.length) return { ok: false, reason: 'missing', missing: missing };
    if (hadError) return { ok: false, reason: hadError };
    if (isNaN(result) || !isFinite(result)) return { ok: false, reason: 'expr' };
    return { ok: true, value: result };
  }

  function typeOfSituation(situation) {
    if (situation && situation.flowDefinition) return situation.flowDefinition;
    return (getMock().situationTypes || []).find(function (t) { return t.id === situation.typeId; }) || null;
  }
  function formulasForType(situation) {
    var t = typeOfSituation(situation);
    return (t && t.formulas) || [];
  }
  function anexaById(id) {
    return (getMock().anexeTypes || []).find(function (a) { return a.id === id; }) || null;
  }
  /* Formula al cărei rezultat aterizează pe `field` din `anexa` (sau null). */
  function resultFormulaForField(situation, anexa, field) {
    if (!field || !field.ref) return null;
    var target = anexa.id + '.' + field.ref;
    return formulasForType(situation).find(function (f) { return f.resultRef === target; }) || null;
  }
  function anexaHasFormulaResult(situation, anexa) {
    var fields = (anexa.schema && anexa.schema.fields) || [];
    return fields.some(function (f) { return !!resultFormulaForField(situation, anexa, f); });
  }

  /* Registru {anexaId.REF → number}. opts.liveAnexaId + opts.liveValues
     suprascriu răspunsul salvat cu draft-ul anexei aflate în editare. */
  function buildRefRegistry(situation, opts) {
    var type = typeOfSituation(situation);
    if (!type) return {};
    var anexaIds = {};
    (type.steps || []).forEach(function (st) { (st.anexeIds || []).forEach(function (id) { anexaIds[id] = true; }); });
    var reg = {};
    Object.keys(anexaIds).forEach(function (aid) {
      var anexa = anexaById(aid);
      if (!anexa) return;
      var fields = (anexa.schema && anexa.schema.fields) || [];
      var values;
      if (opts && opts.liveAnexaId === aid && opts.liveValues) values = opts.liveValues;
      else { var resp = getResponse(situation, aid); values = (resp && resp.values) || {}; }
      fields.forEach(function (f, idx) {
        if (!f.ref) return;
        var raw = values[String(idx)];
        var num = (raw == null || String(raw).trim() === '') ? null : Number(raw);
        reg[aid + '.' + f.ref] = (num == null || isNaN(num)) ? undefined : num;
      });
    });
    return reg;
  }

  function computeFormula(situation, formula, opts) {
    var reg = buildRefRegistry(situation, opts);
    return evalExpr(formula.expr, function (ref) { return (reg[ref] != null) ? reg[ref] : null; });
  }

  function formatComputed(value, resultType) {
    if (resultType === 'integer') return String(Math.round(value));
    var r = Math.round(value * 100) / 100;
    return String(r);
  }

  /* Derivarea completă pentru modalul „Vezi calculul". */
  function deriveFormula(situation, formula, opts) {
    var reg = buildRefRegistry(situation, opts);
    var tk = tokenizeExpr(formula.expr);
    var seen = {}, parts = [];
    (tk.tokens || []).forEach(function (t) {
      if (t.t !== 'ref' || seen[t.v]) return; seen[t.v] = 1;
      var dot = t.v.indexOf('.');
      var aid = dot >= 0 ? t.v.slice(0, dot) : '';
      var ref = dot >= 0 ? t.v.slice(dot + 1) : t.v;
      var anexa = anexaById(aid);
      var label = '';
      if (anexa) { var fld = ((anexa.schema && anexa.schema.fields) || []).find(function (f) { return f.ref === ref; }); label = fld ? fld.label : ''; }
      parts.push({ token: t.v, anexaId: aid, anexaName: anexa ? anexa.name : aid, ref: ref, label: label, value: reg[t.v] });
    });
    return { expr: formula.expr, parts: parts, result: computeFormula(situation, formula, opts) };
  }

  /* Întoarce o copie a `values` cu câmpurile-rezultat auto completate
     (când sursele sunt complete și câmpul nu e suprascris manual). Folosit la
     calculul completării pe card, fără a deschide modalul. */
  function withComputedValues(situation, anexa, values) {
    if (!formulasForType(situation).length) return values;
    var fields = (anexa.schema && anexa.schema.fields) || [];
    var out = null;
    fields.forEach(function (f, idx) {
      var formula = resultFormulaForField(situation, anexa, f);
      if (!formula) return;
      if (values['__fxman__' + idx]) return; /* suprascris manual → valoarea userului */
      var auto = computeFormula(situation, formula, null);
      if (auto.ok) { if (!out) out = JSON.parse(JSON.stringify(values)); out[String(idx)] = formatComputed(auto.value, formula.resultType); }
    });
    return out || values;
  }

  /* ---------- Anexele pasului curent ---------- */

  function getStepAnexe(situation) {
    var M = getMock();
    if (!situation) return [];
    var type = typeOfSituation(situation);
    if (!type || !type.steps) return [];
    var step = type.steps[situation.currentStep - 1];
    if (!step) return [];
    return (step.anexeIds || []).map(function (id) {
      return (M.anexeTypes || []).find(function (a) { return a.id === id; });
    }).filter(Boolean);
  }

  /* ---------- Calcul completare (contract câmpuri obligatorii) ---------- */

  function availableDocs(situation) {
    return (getMock().documents || []).filter(function (d) {
      return d.situationId === situation.id;
    });
  }

  function isRequiredInput(field) {
    if (LAYOUT_TYPES.indexOf(field.type) !== -1) return false;
    if (field.type === 'calculated') return false;
    return field.required === true;
  }

  function hasText(v) {
    return typeof v === 'string' && v.trim() !== '';
  }

  function isFieldComplete(field, value, situation) {
    var t = field.type;
    if (t === 'text_short' || t === 'text_long' || t === 'cui') {
      return hasText(value);
    }
    if (t === 'number' || t === 'percent' || t === 'currency') {
      return value != null && String(value) !== '';
    }
    if (t === 'date' || t === 'month') {
      return hasText(value);
    }
    if (t === 'dropdown' || t === 'radio' || t === 'boolean') {
      return value != null && String(value) !== '';
    }
    if (t === 'checkboxes') {
      return Array.isArray(value) && value.length >= 1;
    }
    if (t === 'client_picker') {
      if (field.multi) return Array.isArray(value) && value.length >= 1;
      return value != null && String(value) !== '';
    }
    if (t === 'document_picker') {
      if (!availableDocs(situation).length) return true;
      if (field.multi) return Array.isArray(value) && value.length >= 1;
      return value != null && String(value) !== '';
    }
    if (t === 'file_upload') {
      return Array.isArray(value) && value.length >= 1;
    }
    if (t === 'table') {
      var minRows = Math.max(1, parseInt(field.minRows, 10) || 1);
      if (!Array.isArray(value) || value.length < minRows) return false;
      var cols = field.columns || [];
      return value.every(function (row) {
        for (var c = 0; c < cols.length; c++) {
          var cell = row ? row[String(c)] : null;
          if (cell == null || String(cell).trim() === '') return false;
        }
        return true;
      });
    }
    return true;
  }

  function completionFromValues(fields, values, situation) {
    var total = 0;
    var done = 0;
    fields.forEach(function (f, idx) {
      if (!isRequiredInput(f)) return;
      total++;
      if (isFieldComplete(f, values[String(idx)], situation)) done++;
    });
    var percent = (total === 0) ? 100 : Math.round(100 * done / total);
    return { total: total, done: done, percent: percent };
  }

  function completionFor(situation, anexa) {
    var fields = (anexa.schema && anexa.schema.fields) || [];
    var resp = getResponse(situation, anexa.id);
    var values = (resp && resp.values) || {};
    values = withComputedValues(situation, anexa, values);
    var comp = completionFromValues(fields, values, situation);
    comp.completedByName = resp ? (resp.completedByName || null) : null;
    return comp;
  }

  function allComplete(situation) {
    return getStepAnexe(situation).every(function (a) {
      return completionFor(situation, a).percent === 100;
    });
  }

  /* ---------- Carduri ---------- */

  function renderCards(containerEl, situation, opts) {
    if (!containerEl) return;
    /* Pagina poate impune read-only (ex. rol 'viewer' pe panoul de
       task-uri) — se combină cu verificarea de status din modal. */
    var pageReadonly = !!(opts && opts.readonly);
    var anexe = getStepAnexe(situation);
    if (isClientView() || !anexe.length) {
      containerEl.innerHTML = '';
      return;
    }

    var cardsHtml = anexe.map(function (a, i) {
      var comp = completionFor(situation, a);
      var cardCls = '';
      var footCls = 'anexa-card__footer--neutral';
      var footHtml = '0% · Neînceput';
      if (comp.percent >= 100) {
        cardCls = ' anexa-card--done';
        footCls = 'anexa-card__footer--done';
        var by = comp.completedByName || situation.responsibleStepName || '';
        footHtml = '<span class="material-symbols-outlined filled" aria-hidden="true">check_circle</span>' +
          '<span>100% · ' + esc(by) + '</span>';
      } else if (comp.percent > 0) {
        footCls = 'anexa-card__footer--progress';
        footHtml = '<span>' + comp.percent + '% · ' + esc(situation.responsibleStepName || '') + '</span>';
      } else {
        footHtml = '<span>0% · Neînceput</span>';
      }
      return '<div class="anexa-card' + cardCls + '" role="button" tabindex="0"' +
        ' data-anexa-open="' + esc(a.id) + '" aria-label="' +
        (pageReadonly ? 'Vezi anexa ' : 'Completează anexa ') + esc(a.name) + '">' +
        '<div class="anexa-card__body">' +
          '<div class="anexa-card__eyebrow">Anexa ' + (i + 1) + '</div>' +
          '<div class="anexa-card__name">' + esc(a.name) + '</div>' +
        '</div>' +
        '<div class="anexa-card__footer ' + footCls + '">' + footHtml + '</div>' +
      '</div>';
    }).join('');

    containerEl.innerHTML =
      '<div class="anexa-cards">' +
        '<div class="anexa-cards__label">Anexe pas ' + situation.currentStep + '</div>' +
        '<div class="anexa-cards__grid">' + cardsHtml + '</div>' +
      '</div>';

    containerEl.querySelectorAll('[data-anexa-open]').forEach(function (card) {
      var id = card.getAttribute('data-anexa-open');
      function activate() {
        var anexa = anexe.find(function (x) { return x.id === id; });
        if (anexa) openFillModal(situation, anexa, pageReadonly);
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  /* ---------- Randare câmpuri formular ---------- */

  function wrapField(idx, inner) {
    return '<div class="afield" data-afield-wrap="' + idx + '">' + inner + '</div>';
  }

  function labelHtml(field) {
    if (!field.label) return '';
    var req = (field.required === true) ? ' <span class="afield__required">*</span>' : '';
    return '<span class="afield__label">' + esc(field.label) + req + '</span>';
  }

  function helpHtml(field) {
    return field.help ? '<div class="afield__help">' + esc(field.help) + '</div>' : '';
  }

  function optionListHtml(idx, options, selected, multi, dis, emptyLabel) {
    if (multi) {
      var sel = Array.isArray(selected) ? selected : [];
      return '<div class="afield__checks" data-af-checks="' + idx + '">' +
        options.map(function (o) {
          var checked = sel.indexOf(o) !== -1 ? ' checked' : '';
          return '<label><input type="checkbox" data-af-check="' + idx + '" value="' + esc(o) + '"' + checked + dis + '> ' + esc(o) + '</label>';
        }).join('') +
      '</div>';
    }
    return '<select class="afield__input" data-af="' + idx + '"' + dis + '>' +
      '<option value="">' + esc(emptyLabel || '— Alege —') + '</option>' +
      options.map(function (o) {
        var s = (selected === o) ? ' selected' : '';
        return '<option value="' + esc(o) + '"' + s + '>' + esc(o) + '</option>';
      }).join('') +
    '</select>';
  }

  /* Starea unui câmp-rezultat: manual / auto / override / pending. */
  function resultFieldState(situation, anexa, field, idx, draft, formula) {
    var manualEdited = !!draft['__fxman__' + idx];
    var auto = computeFormula(situation, formula, { liveAnexaId: anexa.id, liveValues: draft });
    var autoStr = auto.ok ? formatComputed(auto.value, formula.resultType) : null;
    var cur = (draft[String(idx)] != null) ? String(draft[String(idx)]) : '';
    if (!manualEdited) {
      if (auto.ok) return { state: 'auto', value: autoStr, auto: auto, autoStr: autoStr, showUpdate: false };
      return { state: 'pending', value: cur, auto: auto, autoStr: null, showUpdate: false };
    }
    if (auto.ok) return { state: 'override', value: cur, auto: auto, autoStr: autoStr, showUpdate: (autoStr !== cur) };
    return { state: 'manual', value: cur, auto: auto, autoStr: null, showUpdate: false };
  }

  /* Randarea unui câmp-rezultat (în locul lui normal) cu comportament special. */
  function computedFieldHtml(field, idx, draft, situation, anexa, formula, readonly) {
    var st = resultFieldState(situation, anexa, field, idx, draft, formula);
    var unit = field.type === 'currency' ? esc(field.currency || 'RON') : (field.type === 'percent' ? '%' : '');
    var tag, note = '', cls;
    if (st.state === 'auto') {
      tag = '<span class="afield-fx__tag afield-fx__tag--auto"><span class="material-symbols-outlined" aria-hidden="true">function</span>fx · calculat automat</span>';
      note = 'Valoare calculată automat din alte câmpuri. Poate fi incorectă dacă sursele nu sunt complete.';
      cls = 'is-auto';
    } else if (st.state === 'override') {
      tag = '<span class="afield-fx__tag afield-fx__tag--manual"><span class="material-symbols-outlined" aria-hidden="true">edit</span>modificat manual</span>';
      cls = 'is-override';
    } else if (st.state === 'manual') {
      tag = '<span class="afield-fx__tag afield-fx__tag--manual"><span class="material-symbols-outlined" aria-hidden="true">edit</span>scris manual</span>';
      cls = 'is-manual';
    } else {
      tag = '<span class="afield-fx__tag afield-fx__tag--pending"><span class="material-symbols-outlined" aria-hidden="true">function</span>necalculat</span>';
      note = 'Se calculează automat după ce completezi câmpurile sursă.';
      cls = 'is-pending';
    }

    var dis = readonly ? ' disabled' : '';
    var recalcBtn = (!readonly && st.state === 'auto')
      ? '<button type="button" class="afield-fx__recalc" data-fx-recalc="' + idx + '" title="Recalculează" aria-label="Recalculează"><span class="material-symbols-outlined" aria-hidden="true">restart_alt</span></button>'
      : '';
    var input = '<input class="afield__input" type="number" step="any" data-af="' + idx + '" data-fx-input="' + idx + '"' +
      ' value="' + esc(st.value) + '"' + dis + '>';
    var group = '<div class="afield__group afield-fx__group">' + input +
      (unit ? '<span class="afield__unit">' + unit + '</span>' : '') + recalcBtn + '</div>';

    /* „Vezi calculul" mereu accesibil. */
    var head = '<div class="afield-fx__head">' + tag +
      '<button type="button" class="afield-fx__link" data-fx-derive="' + idx + '">Vezi calculul</button>' +
    '</div>';
    var noteHtml = note ? '<div class="afield-fx__note">' + esc(note) + '</div>' : '';

    var updateHtml = '';
    if (st.showUpdate && !readonly) {
      updateHtml = '<div class="afield-fx__update">' +
        '<span class="material-symbols-outlined" aria-hidden="true">sync</span>' +
        '<div class="afield-fx__update-body">' +
          '<div>S-a modificat ceva în misiune. Rezultat calculat nou: <strong>' + esc(st.autoStr) + (unit ? ' ' + unit : '') + '</strong>.</div>' +
          '<div class="afield-fx__update-actions">' +
            '<button type="button" class="afield-fx__btn afield-fx__btn--primary" data-fx-recalc="' + idx + '">Actualizează</button>' +
            '<button type="button" class="afield-fx__btn" data-fx-derive="' + idx + '">Vezi calculul</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    return wrapField(idx, labelHtml(field) + helpHtml(field) +
      '<div class="afield-fx ' + cls + '">' + head + group + noteHtml + updateHtml + '</div>');
  }

  function fieldHtml(field, idx, draft, situation, readonly, anexa) {
    /* Câmp-rezultat al unei formule automate (legată pe tipul de misiune)? */
    if (anexa) {
      var resFormula = resultFormulaForField(situation, anexa, field);
      if (resFormula) return computedFieldHtml(field, idx, draft, situation, anexa, resFormula, readonly);
    }
    var dis = readonly ? ' disabled' : '';
    var v = draft[String(idx)];
    var inner = '';
    var variant, icons, options, files, chips, cols, rows, head, body;

    switch (field.type) {

      case 'section_title':
        return wrapField(idx, '<h3 class="afield__section-title">' + esc(field.text) + '</h3>');

      case 'paragraph':
        return wrapField(idx, '<p class="afield__paragraph">' + esc(field.text) + '</p>');

      case 'banner':
        variant = (field.variant === 'warning' || field.variant === 'critical') ? field.variant : 'info';
        icons = { info: 'info', warning: 'warning', critical: 'error' };
        return wrapField(idx,
          '<div class="afield__banner afield__banner--' + variant + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">' + icons[variant] + '</span>' +
            '<span>' + esc(field.text) + '</span>' +
          '</div>');

      case 'divider':
        return wrapField(idx, '<hr class="afield__divider">');

      case 'text_short':
        inner = '<input class="afield__input" type="text" data-af="' + idx + '"' +
          (field.maxLength ? ' maxlength="' + (parseInt(field.maxLength, 10) || 100) + '"' : '') +
          ' placeholder="' + esc(field.placeholder || '') + '" value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'text_long':
        inner = '<textarea class="afield__input" rows="' + (parseInt(field.rows, 10) || 3) + '" data-af="' + idx + '"' +
          ' placeholder="' + esc(field.placeholder || '') + '"' + dis + '>' + esc(v || '') + '</textarea>';
        break;

      case 'number':
        inner = '<input class="afield__input" type="number" data-af="' + idx + '"' +
          (field.min != null ? ' min="' + esc(field.min) + '"' : '') +
          (field.max != null ? ' max="' + esc(field.max) + '"' : '') +
          ' step="' + ((parseInt(field.decimals, 10) || 0) > 0 ? 'any' : '1') + '"' +
          ' value="' + esc(v != null ? v : '') + '"' + dis + '>';
        break;

      case 'currency':
        inner = '<div class="afield__group">' +
          '<input class="afield__input" type="number" step="0.01" placeholder="0,00" data-af="' + idx + '"' +
            ' value="' + esc(v != null ? v : '') + '"' + dis + '>' +
          '<span class="afield__unit">' + esc(field.currency || 'RON') + '</span>' +
        '</div>';
        break;

      case 'percent':
        inner = '<div class="afield__group">' +
          '<input class="afield__input" type="number" step="0.01" min="0" max="100" placeholder="0,00" data-af="' + idx + '"' +
            ' value="' + esc(v != null ? v : '') + '"' + dis + '>' +
          '<span class="afield__unit">%</span>' +
        '</div>';
        break;

      case 'cui':
        inner = '<input class="afield__input" type="text" placeholder="RO12345678" data-af="' + idx + '"' +
          ' value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'date':
        inner = '<input class="afield__input" type="date" data-af="' + idx + '" value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'month':
        inner = '<input class="afield__input" type="month" data-af="' + idx + '" value="' + esc(v || '') + '"' + dis + '>';
        break;

      case 'dropdown':
        inner = optionListHtml(idx, field.options || [], v, false, dis);
        break;

      case 'radio':
        inner = '<div class="afield__radios">' +
          (field.options || []).map(function (o) {
            var checked = (v === o) ? ' checked' : '';
            return '<label><input type="radio" name="af-r-' + idx + '" data-af-radio="' + idx + '"' +
              ' value="' + esc(o) + '"' + checked + dis + '> ' + esc(o) + '</label>';
          }).join('') +
        '</div>';
        break;

      case 'checkboxes':
        inner = optionListHtml(idx, field.options || [], v, true, dis);
        break;

      case 'boolean':
        inner = '<div class="afield__radios">' +
          ['Da', 'Nu'].map(function (o) {
            var checked = (v === o) ? ' checked' : '';
            return '<label><input type="radio" name="af-r-' + idx + '" data-af-radio="' + idx + '"' +
              ' value="' + esc(o) + '"' + checked + dis + '> ' + esc(o) + '</label>';
          }).join('') +
        '</div>';
        break;

      case 'client_picker':
        options = (getMock().clients || []).map(function (c) { return c.companyName; });
        inner = optionListHtml(idx, options, v, !!field.multi, dis, '— Alege client —');
        break;

      case 'document_picker':
        options = availableDocs(situation).map(function (d) { return d.filename; });
        if (!options.length) {
          inner = '<div class="afield__empty-note">Niciun document disponibil</div>';
        } else {
          inner = optionListHtml(idx, options, v, !!field.multi, dis, '— Alege document —');
        }
        break;

      case 'file_upload':
        files = Array.isArray(v) ? v : [];
        chips = files.map(function (name, i) {
          return '<span class="afield__chip"><span class="afield__chip-name">' + esc(name) + '</span>' +
            (readonly ? '' :
              '<button type="button" class="afield__chip-remove" data-af-file-remove="' + idx + '" data-file-i="' + i + '" aria-label="Elimină fișierul">' +
                '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
              '</button>') +
          '</span>';
        }).join('');
        inner = '<div class="afield__upload">' +
          (readonly ? '' :
            '<button type="button" class="btn btn--ghost" data-af-file-pick="' + idx + '">' +
              '<span class="material-symbols-outlined" aria-hidden="true">attach_file</span>' +
              'Selectează fișiere' +
            '</button>' +
            '<input type="file" hidden' + (field.multi ? ' multiple' : '') + ' data-af-file="' + idx + '">') +
          '<span class="afield__upload-meta">' + esc(field.allowedTypes || '') +
            (field.maxSizeMB != null ? ' · max ' + esc(field.maxSizeMB) + ' MB' : '') +
          '</span>' +
        '</div>' +
        (files.length ? '<div class="afield__chips">' + chips + '</div>' :
          (readonly ? '<div class="afield__empty-note">Niciun fișier atașat</div>' : ''));
        break;

      case 'table':
        cols = field.columns || [];
        rows = Array.isArray(v) ? v : [];
        head = '<tr>' +
          cols.map(function (c) { return '<th>' + esc(c.name) + '</th>'; }).join('') +
          (readonly ? '' : '<th class="afield__cell-del"></th>') +
        '</tr>';
        body = rows.map(function (row, r) {
          return '<tr>' +
            cols.map(function (c, ci) {
              var cellVal = (row && row[String(ci)] != null) ? row[String(ci)] : '';
              var inputType = (c.type === 'number' || c.type === 'currency') ? 'number' :
                (c.type === 'date' ? 'date' : 'text');
              var step = (c.type === 'currency') ? ' step="0.01"' : '';
              return '<td><input class="afield__input afield__cell-input" type="' + inputType + '"' + step +
                ' data-af-cell="' + idx + '" data-row="' + r + '" data-col="' + ci + '"' +
                ' value="' + esc(cellVal) + '"' + dis + '></td>';
            }).join('') +
            (readonly ? '' :
              '<td class="afield__cell-del">' +
                '<button type="button" data-af-del-row="' + idx + '" data-row="' + r + '" aria-label="Șterge rândul">' +
                  '<span class="material-symbols-outlined" aria-hidden="true">delete</span>' +
                '</button>' +
              '</td>') +
          '</tr>';
        }).join('');
        inner = '<table class="afield__table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
          (rows.length ? '' : '<div class="afield__empty-note">Niciun rând adăugat.</div>') +
          (readonly ? '' :
            '<button type="button" class="afield__table-add" data-af-add-row="' + idx + '">' +
              '<span class="material-symbols-outlined" aria-hidden="true">add</span>' +
              'Adaugă rând' +
            '</button>');
        break;

      case 'calculated':
        inner = '<div class="afield__calculated">' +
          '<span class="material-symbols-outlined" aria-hidden="true">function</span>' +
          '<span>= ' + esc(field.formula || '') + '</span>' +
        '</div>';
        break;

      default:
        inner = '<p class="afield__paragraph">Tip necunoscut: ' + esc(field.type) + '</p>';
    }

    return wrapField(idx, labelHtml(field) + helpHtml(field) + inner);
  }

  /* ---------- Modal de completare ---------- */

  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll(
      'a[href], button:not([disabled]):not([hidden]), input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function openFillModal(situation, anexa, forceReadonly) {
    var modal = document.getElementById('modal-anexa-fill');
    if (!modal) return;

    var fields = (anexa.schema && anexa.schema.fields) || [];
    var readonly = !!forceReadonly ||
      situation.status === 'anulata' || situation.status === 'inchisa';
    var stored = getResponse(situation, anexa.id);

    var draft = {};
    try { draft = (stored && stored.values) ? JSON.parse(JSON.stringify(stored.values)) : {}; }
    catch (e) { draft = {}; }

    /* Tabelele pornesc cu max(1, minRows) rânduri goale dacă nu există date. */
    fields.forEach(function (f, idx) {
      if (f.type !== 'table') return;
      var key = String(idx);
      if (!Array.isArray(draft[key]) || !draft[key].length) {
        var minRows = Math.max(1, parseInt(f.minRows, 10) || 1);
        var seed = [];
        for (var r = 0; r < minRows; r++) seed.push({});
        draft[key] = seed;
      }
    });

    var titleEl = modal.querySelector('[data-anexa-title]');
    var subEl = modal.querySelector('[data-anexa-subtitle]');
    var formEl = modal.querySelector('#anexa-form');
    var saveBtn = modal.querySelector('[data-anexa-save]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');
    var closeBtn = modal.querySelector('[data-modal-close]');
    var progressText = modal.querySelector('[data-anexa-progress-text]');
    var progressBar = modal.querySelector('[data-anexa-progress-bar]');

    titleEl.textContent = anexa.name;
    subEl.textContent = situation.typeLabel + ' · ' + situation.clientCompany;
    saveBtn.hidden = readonly;

    /* Sincronizează câmpurile-rezultat (auto) în draft, respectând override-ul
       manual. Sursele incomplete → câmpul rămâne gol. */
    function syncComputedFields() {
      fields.forEach(function (f, idx) {
        var formula = resultFormulaForField(situation, anexa, f);
        if (!formula) return;
        if (draft['__fxman__' + idx]) return;
        var auto = computeFormula(situation, formula, { liveAnexaId: anexa.id, liveValues: draft });
        if (auto.ok) draft[String(idx)] = formatComputed(auto.value, formula.resultType);
        else delete draft[String(idx)];
      });
    }

    function updateProgress() {
      syncComputedFields();
      var comp = completionFromValues(fields, draft, situation);
      progressText.textContent = comp.done + ' din ' + comp.total + ' câmpuri obligatorii completate';
      progressBar.style.width = comp.percent + '%';
      progressBar.classList.toggle('is-complete', comp.percent === 100);
      return comp.percent;
    }

    function renderFormBody() {
      syncComputedFields();
      formEl.innerHTML = fields.map(function (f, idx) {
        return fieldHtml(f, idx, draft, situation, readonly, anexa);
      }).join('');
      updateProgress();
    }

    var hasFormula = anexaHasFormulaResult(situation, anexa);

    function handleValueEvent(e) {
      if (readonly) return;
      var el = e.target;
      if (el.hasAttribute('data-af')) {
        draft[el.getAttribute('data-af')] = el.value;
        if (el.hasAttribute('data-fx-input')) draft['__fxman__' + el.getAttribute('data-fx-input')] = true;
      } else if (el.hasAttribute('data-af-radio')) {
        if (el.checked) draft[el.getAttribute('data-af-radio')] = el.value;
      } else if (el.hasAttribute('data-af-check')) {
        var cIdx = el.getAttribute('data-af-check');
        var wrap = formEl.querySelector('[data-af-checks="' + cIdx + '"]');
        var vals = [];
        if (wrap) {
          wrap.querySelectorAll('input[data-af-check]').forEach(function (cb) {
            if (cb.checked) vals.push(cb.value);
          });
        }
        draft[cIdx] = vals;
      } else if (el.hasAttribute('data-af-cell')) {
        var tIdx = el.getAttribute('data-af-cell');
        var row = parseInt(el.getAttribute('data-row'), 10);
        var col = el.getAttribute('data-col');
        if (!Array.isArray(draft[tIdx])) draft[tIdx] = [];
        if (!draft[tIdx][row]) draft[tIdx][row] = {};
        draft[tIdx][row][col] = el.value;
      } else if (el.hasAttribute('data-af-file')) {
        var fIdx = el.getAttribute('data-af-file');
        var fieldDef = fields[parseInt(fIdx, 10)] || {};
        var names = Array.isArray(draft[fIdx]) ? draft[fIdx].slice() : [];
        Array.prototype.forEach.call(el.files || [], function (f) {
          if (fieldDef.multi === false) names = [f.name];
          else names.push(f.name);
        });
        draft[fIdx] = names;
        el.value = '';
        renderFormBody();
        return;
      } else {
        return;
      }
      /* La blur (change), dacă anexa are câmpuri-rezultat, re-randăm pentru a
         actualiza tag-urile/tooltip-urile (auto → modificat manual etc.). */
      if (e.type === 'change' && hasFormula) { renderFormBody(); return; }
      updateProgress();
    }

    formEl.oninput = handleValueEvent;
    formEl.onchange = handleValueEvent;
    formEl.onsubmit = function (e) { e.preventDefault(); };
    formEl.onclick = function (e) {
      /* „Vezi calculul" e accesibil și în read-only. */
      var deriveRO = e.target.closest('[data-fx-derive]');
      if (deriveRO) {
        var dRo = parseInt(deriveRO.getAttribute('data-fx-derive'), 10);
        openDeriveModal(situation, anexa, fields[dRo], dRo, draft);
        return;
      }
      if (readonly) return;
      var recalc = e.target.closest('[data-fx-recalc]');
      if (recalc) {
        delete draft['__fxman__' + recalc.getAttribute('data-fx-recalc')];
        renderFormBody();
        return;
      }
      var pick = e.target.closest('[data-af-file-pick]');
      if (pick) {
        var inp = formEl.querySelector('input[data-af-file="' + pick.getAttribute('data-af-file-pick') + '"]');
        if (inp) inp.click();
        return;
      }
      var rm = e.target.closest('[data-af-file-remove]');
      if (rm) {
        var fIdx = rm.getAttribute('data-af-file-remove');
        var i = parseInt(rm.getAttribute('data-file-i'), 10);
        if (Array.isArray(draft[fIdx])) draft[fIdx].splice(i, 1);
        renderFormBody();
        return;
      }
      var add = e.target.closest('[data-af-add-row]');
      if (add) {
        var aIdx = add.getAttribute('data-af-add-row');
        if (!Array.isArray(draft[aIdx])) draft[aIdx] = [];
        draft[aIdx].push({});
        renderFormBody();
        return;
      }
      var del = e.target.closest('[data-af-del-row]');
      if (del) {
        var dIdx = del.getAttribute('data-af-del-row');
        var r = parseInt(del.getAttribute('data-row'), 10);
        if (Array.isArray(draft[dIdx])) draft[dIdx].splice(r, 1);
        renderFormBody();
      }
    };

    function cleanup() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      modal.removeEventListener('click', onBackdrop);
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); cleanup(); }
      else if (e.key === 'Tab') trapFocus(e, modal.querySelector('.modal__dialog'));
    }
    function onBackdrop(e) {
      if (e.target === modal) cleanup();
    }

    closeBtn.onclick = cleanup;
    cancelBtn.onclick = cleanup;
    saveBtn.onclick = function () {
      if (readonly) return;
      var pct = updateProgress();
      var map = readMap();
      var key = respKey(situation.id, anexa.id);
      var prev = map[key];
      var completedByName = prev ? (prev.completedByName || null) : null;
      if (pct === 100) {
        if (!completedByName) completedByName = currentUserName();
      } else {
        completedByName = null;
      }
      map[key] = { values: draft, updatedAt: TODAY_ISO, completedByName: completedByName };
      writeMap(map);
      cleanup();
      toast('success', pct === 100 ? 'Anexa este completă.' : 'Progres salvat.');
      try {
        window.dispatchEvent(new CustomEvent('scriptica:anexa-saved', {
          detail: { situationId: situation.id, anexaTypeId: anexa.id, percent: pct }
        }));
      } catch (e) {
        var ev = document.createEvent('Event');
        ev.initEvent('scriptica:anexa-saved', false, false);
        window.dispatchEvent(ev);
      }
    };

    modal.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    renderFormBody();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      var first = formEl.querySelector('input:not([disabled]):not([hidden]), select:not([disabled]), textarea:not([disabled])');
      (first || closeBtn).focus();
    }, 0);
  }

  /* ---------- Modal „Vezi calculul" (derivare) ---------- */
  function openDeriveModal(situation, anexa, field, idx, draft) {
    var formula = resultFormulaForField(situation, anexa, field);
    if (!formula) return;
    var d = deriveFormula(situation, formula, { liveAnexaId: anexa.id, liveValues: draft });
    var existing = document.getElementById('fx-derive-modal');
    if (existing) existing.remove();

    var rows = d.parts.map(function (p) {
      var val = (p.value == null)
        ? '<span class="fx-derive__missing">necompletat</span>'
        : esc(formatComputed(p.value, 'decimal'));
      return '<tr><td>' + esc(p.label || p.ref) + '</td>' +
        '<td class="fx-derive__src">' + esc(p.anexaName) + ' · <code>' + esc(p.ref) + '</code></td>' +
        '<td class="fx-derive__val">' + val + '</td></tr>';
    }).join('');
    var resultLine = d.result.ok
      ? '<strong>' + esc(formatComputed(d.result.value, formula.resultType)) + '</strong>'
      : '<span class="fx-derive__missing">nu se poate calcula — surse incomplete</span>';
    var manualNote = '';
    if (draft['__fxman__' + idx]) {
      var cur = draft[String(idx)] != null ? String(draft[String(idx)]) : '';
      var differs = d.result.ok && formatComputed(d.result.value, formula.resultType) !== cur;
      manualNote = '<div class="fx-derive__manual">' +
        '<span class="material-symbols-outlined" aria-hidden="true">edit</span>' +
        'Valoare introdusă manual: <strong>' + esc(cur) + '</strong>' + (differs ? ' — diferă de valoarea calculată.' : '.') +
      '</div>';
    }

    var overlay = document.createElement('div');
    overlay.id = 'fx-derive-modal';
    overlay.className = 'fx-derive-overlay';
    overlay.innerHTML =
      '<div class="fx-derive" role="dialog" aria-modal="true" aria-label="Cum a fost calculat acest câmp">' +
        '<div class="fx-derive__head">' +
          '<div><div class="fx-derive__eyebrow">Cum a fost calculat acest câmp</div>' +
            '<div class="fx-derive__title">' + esc(field.label || 'Câmp calculat') + '</div></div>' +
          '<button type="button" class="fx-derive__close" data-fx-derive-close aria-label="Închide">' +
            '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '</div>' +
        '<div class="fx-derive__body">' +
          '<table class="fx-derive__table"><thead><tr><th>Câmp sursă</th><th>Din anexa</th><th>Valoare</th></tr></thead>' +
            '<tbody>' + rows + '</tbody></table>' +
          '<div class="fx-derive__formula"><span class="fx-derive__formula-label">Formulă</span><code>' + esc(d.expr) + '</code></div>' +
          '<div class="fx-derive__result">Rezultat calculat: ' + resultLine + '</div>' +
          manualNote +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    function close() { overlay.remove(); document.removeEventListener('keydown', onEsc); }
    function onEsc(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    var cb = overlay.querySelector('[data-fx-derive-close]');
    if (cb) cb.addEventListener('click', close);
    document.addEventListener('keydown', onEsc);
  }

  /* ---------- API public ---------- */

  window.SCRIPTICA_ANEXE = {
    renderCards: renderCards,
    allComplete: allComplete,
    getStepAnexe: getStepAnexe
  };

})();
