/* ============================================================
   Scriptica — Rapoarte misiuni de audit (Brief #8)
   Tab „Rapoarte" din pagina Misiuni Audit: tabel expandabil cu 3
   niveluri (rând → sinteză+obiective in-place → modal detaliu),
   raport complet (iconița ochi) și modal per-obiectiv.
   Scor + criticitate = perspectivă atribuită A.I. (mock din seed).
   // Scor/criticitate: mock din seed. Calcul real = LLM local, faza ulterioara, tier platit.
   Expus ca window.SCRIPTICA_RAPOARTE pentru misiuni-audit.js.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;

  /* Gating comercial: scorul/criticitatea A.I. apar doar pe planul Plus.
     Pentru prototip e activ; pe false → degradare elegantă (fără scor/criticitate). */
  var AI_TIER = true;

  var SEV = {
    critical: 'var(--color-critical)',
    pending: 'var(--color-pending)',
    success: 'var(--color-success)'
  };

  var rapState = { search: '', domain: '', auditor: '', entity: '', crit: '', expandedId: null };
  var overlay = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function fmtDate(iso) { if (!iso) return ''; var p = iso.split('-'); return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso; }
  function toast(v, m) { if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(v, m); }

  var FINAL_STATUSES = ['aprobata', 'respinsa', 'inchisa', 'finalizat'];

  function statusOverrides() {
    try { return JSON.parse(localStorage.getItem('scriptica.auditMissionStatus') || '{}') || {}; }
    catch (e) { return {}; }
  }

  /* Misiunile finalizate care au raport în seed. */
  function reportMissions() {
    var ov = statusOverrides();
    var reports = MOCK.auditReports || {};
    return (MOCK.auditMissions || [])
      .map(function (m) { return ov[m.id] ? Object.assign({}, m, { status: ov[m.id] }) : m; })
      .filter(function (m) { return FINAL_STATUSES.indexOf(m.status) !== -1 && reports[m.id]; });
  }
  function reportOf(m) { return (MOCK.auditReports || {})[m.id] || null; }

  /* ---------- Severity helpers ---------- */
  function critCounts(objs) {
    var c = { hi: 0, mid: 0, lo: 0 };
    objs.forEach(function (o) { if (c[o.crit] != null) c[o.crit]++; });
    return c;
  }
  function actCounts(objs) {
    var c = { no: 0, part: 0, ok: 0 };
    objs.forEach(function (o) { if (c[o.action] != null) c[o.action]++; });
    return c;
  }
  function sevBar(parts) {
    var total = parts.reduce(function (s, p) { return s + p.n; }, 0) || 1;
    return '<div class="rap-sevbar">' + parts.filter(function (p) { return p.n > 0; }).map(function (p) {
      return '<span style="width:' + (100 * p.n / total) + '%;background:' + p.color + '"></span>';
    }).join('') + '</div>';
  }
  function critBar(objs) {
    var c = critCounts(objs);
    return sevBar([{ n: c.hi, color: SEV.critical }, { n: c.mid, color: SEV.pending }, { n: c.lo, color: SEV.success }]);
  }
  function actBar(objs) {
    var c = actCounts(objs);
    return sevBar([{ n: c.no, color: SEV.critical }, { n: c.part, color: SEV.pending }, { n: c.ok, color: SEV.success }]);
  }
  function implCount(objs) { return objs.filter(function (o) { return o.action === 'ok'; }).length; }
  function hasIrregularities(rep) { return rep.objectives.some(function (o) { return o.crit === 'hi'; }); }

  var WEIGHT = {
    hi: { cls: 'weight--hi', icon: 'priority_high' },
    mid: { cls: 'weight--mid', icon: 'remove' },
    lo: { cls: 'weight--lo', icon: 'check' }
  };
  function weightPill(o) {
    var w = WEIGHT[o.crit] || WEIGHT.lo;
    return '<span class="rap-weight ' + w.cls + '"><span class="material-symbols-outlined" aria-hidden="true">' + w.icon + '</span>' + esc(o.criticality) + '</span>';
  }
  var ACT = {
    ok: { cls: 'act--ok', icon: 'check_circle', label: 'Implementată' },
    part: { cls: 'act--part', icon: 'pending', label: 'Parțial implementată' },
    no: { cls: 'act--no', icon: 'cancel', label: 'Neimplementată' }
  };
  function actStatus(o) {
    var a = ACT[o.action] || ACT.no;
    return '<span class="rap-act ' + a.cls + '"><span class="material-symbols-outlined" aria-hidden="true">' + a.icon + '</span>' + a.label + '</span>';
  }

  /* ---------- Public entry ---------- */
  function render(root) {
    if (!root) return;
    root.innerHTML =
      filtersHtml() +
      '<div class="rap-table" id="rap-table"></div>';
    bindFilters(root);
    renderTable(root);
  }

  function filtersHtml() {
    var ms = reportMissions();
    var reps = ms.map(reportOf);
    var domains = uniq(reps.map(function (r) { return r.domain; }));
    var auditors = uniq(reps.map(function (r) { return r.auditor; }));
    var entities = uniq(ms.map(function (m) { return m.entityName; }));
    function opts(label, list) {
      return '<option value="">' + label + '</option>' + list.map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('');
    }
    return '<div class="filters rap-filters">' +
      '<div class="filter-search rap-search">' +
        '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
        '<input class="input" type="search" data-rap="search" placeholder="Caută misiune sau entitate..." autocomplete="off">' +
      '</div>' +
      '<div class="filter-field"><label class="filter-field__label">Data finalizare</label><select class="select" disabled><option>Oricând</option></select></div>' +
      '<div class="filter-field"><label class="filter-field__label">Domeniu auditabil</label><select class="select" data-rap="domain">' + opts('Toate domeniile', domains) + '</select></div>' +
      '<div class="filter-field"><label class="filter-field__label">Auditor</label><select class="select" data-rap="auditor">' + opts('Toți auditorii', auditors) + '</select></div>' +
      '<div class="filter-field"><label class="filter-field__label">Entitate publică</label><select class="select" data-rap="entity">' + opts('Toate entitățile', entities) + '</select></div>' +
      '<div class="filter-field"><label class="filter-field__label">Criticitate</label><select class="select" data-rap="crit"><option value="">Toate</option><option value="irr">Are iregularități</option></select></div>' +
      '<div class="filters__spacer"></div>' +
      '<button type="button" class="filter-clear" data-rap="clear"><span class="material-symbols-outlined" aria-hidden="true">close</span>Șterge filtre</button>' +
    '</div>';
  }

  function uniq(a) { var seen = {}, out = []; a.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } }); return out; }

  function bindFilters(root) {
    root.querySelectorAll('[data-rap]').forEach(function (el) {
      var key = el.getAttribute('data-rap');
      if (key === 'clear') {
        el.addEventListener('click', function () {
          rapState = { search: '', domain: '', auditor: '', entity: '', crit: '', expandedId: rapState.expandedId };
          render(root);
        });
      } else if (key === 'search') {
        el.addEventListener('input', function () { rapState.search = el.value; renderTable(root); });
      } else if (rapState.hasOwnProperty(key)) {
        el.addEventListener('change', function () { rapState[key] = el.value; renderTable(root); });
      }
    });
  }

  function filtered() {
    var q = norm(rapState.search);
    return reportMissions().filter(function (m) {
      var r = reportOf(m);
      if (q && norm(m.name).indexOf(q) === -1 && norm(m.entityName).indexOf(q) === -1 && norm(r.domain).indexOf(q) === -1) return false;
      if (rapState.domain && r.domain !== rapState.domain) return false;
      if (rapState.auditor && r.auditor !== rapState.auditor) return false;
      if (rapState.entity && m.entityName !== rapState.entity) return false;
      if (rapState.crit === 'irr' && !hasIrregularities(r)) return false;
      return true;
    });
  }

  function renderTable(root) {
    var el = root.querySelector('#rap-table');
    if (!el) return;
    var list = filtered();
    if (!list.length) {
      el.innerHTML = '<div class="rap-empty"><span class="material-symbols-outlined" aria-hidden="true">search_off</span>' +
        '<p>Niciun raport finalizat nu corespunde filtrelor.</p></div>';
      return;
    }
    el.innerHTML =
      '<div class="rap-thead">' +
        '<span></span><span>Entitate Publică</span><span>Domeniul Auditabil</span><span>Auditor</span><span>Trimitere</span><span style="text-align:right">Acțiuni</span>' +
      '</div>' +
      list.map(missionRow).join('');
    bindTable(root);
  }

  function missionRow(m) {
    var r = reportOf(m);
    var open = rapState.expandedId === m.id;
    return '<div class="rap-mission' + (open ? ' open' : '') + '" data-id="' + esc(m.id) + '">' +
      '<div class="rap-row" data-row>' +
        '<span class="material-symbols-outlined rap-chev" aria-hidden="true">expand_more</span>' +
        '<div class="rap-entity">' + esc(m.entityName) + '</div>' +
        '<div class="rap-domain">' + esc(r.domain) + '</div>' +
        '<div class="rap-auditor">' + esc(r.auditor) + '</div>' +
        '<div class="rap-date">' + esc(fmtDate(r.finalizat)) + '</div>' +
        '<div class="rap-acts" data-stop>' +
          '<button type="button" class="rap-iconbtn" data-eye title="Vizualizează raportul complet"><span class="material-symbols-outlined" aria-hidden="true">visibility</span></button>' +
          '<a class="rap-iconbtn" href="misiune-audit-workspace.html?id=' + esc(m.id) + '" title="Conversația misiunii"><span class="material-symbols-outlined" aria-hidden="true">chat_bubble</span></a>' +
        '</div>' +
      '</div>' +
      (open ? panelHtml(m, r) : '') +
    '</div>';
  }

  function panelHtml(m, r) {
    var objs = r.objectives;
    var score = AI_TIER
      ? '<div class="rap-score"><div class="rap-score-n">' + esc(r.score) + '</div><div>' +
          '<div class="rap-score-ai"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>Scor A.I.</div>' +
          '<div class="rap-score-l">' + esc(r.level) + '</div></div></div>'
      : '<div class="rap-score rap-score--off"><span class="material-symbols-outlined" aria-hidden="true">lock</span><div class="rap-score-l">Scor A.I. — plan Plus</div></div>';
    var synth =
      '<div class="rap-synth">' + score +
        metric(objs.length, 'Obiective', '') +
        metric(objs.length, 'Constatări', critBar(objs)) +
        metric(objs.length, 'Recomandări', critBar(objs)) +
        metric(objs.length, 'Acțiuni', actBar(objs)) +
        '<div class="rap-impl"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>' + implCount(objs) + ' Acțiuni Implementate</div>' +
      '</div>';
    var objList = '<div class="rap-objlist-h">Obiectivele misiunii · Perioada auditată ' + esc(r.perioada) + '</div>' +
      objs.map(function (o, i) { return objRow(m, o, i); }).join('');
    return '<div class="rap-panel">' + synth + objList + '</div>';
  }

  function metric(n, label, bar) {
    return '<div class="rap-metric"><div class="rap-metric-top"><b>' + n + '</b>' + esc(label) + '</div>' + (bar || '') + '</div>';
  }

  function objRow(m, o, i) {
    var critMetric = AI_TIER ? '<span class="rap-objmetric-l">Constatare</span>' + sevBar([{ n: 1, color: o.crit === 'hi' ? SEV.critical : o.crit === 'mid' ? SEV.pending : SEV.success }]) : '';
    return '<div class="rap-objrow">' +
      '<div class="rap-objidx">' + (i + 1) + '</div>' +
      '<div class="rap-objname">' + esc(o.title) + '</div>' +
      '<div class="rap-objmetrics">' +
        '<div class="rap-objmetric"><span class="rap-objmetric-l">Acțiune</span>' + actBar([o]) + '</div>' +
        (AI_TIER ? weightPill(o) : '') +
      '</div>' +
      '<button type="button" class="rap-objopen" data-obj="' + esc(m.id) + ':' + i + '" title="Detaliu obiectiv"><span class="material-symbols-outlined" aria-hidden="true">open_in_full</span></button>' +
    '</div>';
  }

  function bindTable(root) {
    root.querySelectorAll('.rap-mission').forEach(function (mEl) {
      var id = mEl.getAttribute('data-id');
      var rowEl = mEl.querySelector('[data-row]');
      rowEl.addEventListener('click', function (e) {
        if (e.target.closest('[data-stop]')) return;
        rapState.expandedId = (rapState.expandedId === id) ? null : id;
        renderTable(root);
      });
      var eye = mEl.querySelector('[data-eye]');
      if (eye) eye.addEventListener('click', function (e) { e.stopPropagation(); openFullReport(id); });
      mEl.querySelectorAll('[data-obj]').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var parts = btn.getAttribute('data-obj').split(':');
          openObjModal(parts[0], parseInt(parts[1], 10));
        });
      });
    });
  }

  /* ---------- Modals ---------- */
  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'rap-overlay';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeOverlay(); });
    return overlay;
  }
  function openOverlay(html) {
    ensureOverlay().innerHTML = html;
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    overlay.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', closeOverlay); });
    overlay.querySelectorAll('[data-rep-action]').forEach(function (b) {
      b.addEventListener('click', function () { repAction(b.getAttribute('data-rep-action')); });
    });
    return overlay;
  }
  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('show');
    overlay.innerHTML = '';
    document.body.style.overflow = '';
  }
  function repAction(kind) {
    if (kind === 'print') { window.print(); return; }
    var msg = { preview: 'Previzualizare raport (prototip).', share: 'Link de partajare generat (prototip).', word: 'Export Word generat (prototip).' };
    toast('info', msg[kind] || 'Acțiune (prototip).');
  }
  function actionsBar() {
    return '<div class="rap-modal-actions">' +
      '<button type="button" class="btn btn--ghost" data-rep-action="print"><span class="material-symbols-outlined" aria-hidden="true">print</span>Printează</button>' +
      '<button type="button" class="btn btn--ghost" data-rep-action="preview"><span class="material-symbols-outlined" aria-hidden="true">visibility</span>Previzualizează</button>' +
      '<button type="button" class="btn btn--ghost" data-rep-action="share"><span class="material-symbols-outlined" aria-hidden="true">share</span>Share</button>' +
      '<button type="button" class="btn btn--primary" data-rep-action="word"><span class="material-symbols-outlined" aria-hidden="true">description</span>Export Word</button>' +
      (AI_TIER ? '<span class="rap-ai-note"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>Scor și criticitate generate de Scriptica A.I. (plan Plus)</span>' : '') +
    '</div>';
  }

  /* Raportul COMPLET — carduri colorate per-obiectiv (iconița ochi). */
  function openFullReport(missionId) {
    var m = (MOCK.auditMissions || []).find(function (x) { return x.id === missionId; });
    var r = reportOf(m || {});
    if (!m || !r) return;
    var objs = r.objectives;
    var scoreChip = AI_TIER
      ? '<div class="rap-score"><div class="rap-score-n">' + esc(r.score) + '</div><div>' +
          '<div class="rap-score-ai"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>Scor A.I.</div>' +
          '<div class="rap-score-l">' + esc(r.level) + '</div></div></div>'
      : '';
    var cards = objs.map(function (o, i) { return ocardHtml(o, i); }).join('');
    openOverlay(
      '<div class="rap-modal rap-modal--full">' +
        '<div class="rap-rhead">' +
          '<div class="rap-rhead-main">' +
            '<div class="rap-eyebrow">Raport misiune ' + esc(m.id) + ' · ' + esc(m.entityName) + '</div>' +
            '<div class="rap-rtitle">' + esc(r.domain) + '</div>' +
            '<div class="rap-rmeta"><span><b>Auditor:</b> ' + esc(r.auditor) + '</span><span><b>Perioada auditată:</b> ' + esc(r.perioada) + '</span><span><b>Finalizat:</b> ' + esc(fmtDate(r.finalizat)) + '</span></div>' +
          '</div>' + scoreChip +
          '<button type="button" class="rap-close" data-close aria-label="Închide"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '</div>' +
        '<div class="rap-rollup">' +
          metric(objs.length, 'Obiective', '') +
          metric(objs.length, 'Constatări', critBar(objs)) +
          metric(objs.length, 'Recomandări', critBar(objs)) +
          metric(objs.length, 'Acțiuni', actBar(objs)) +
          '<div class="rap-impl"><span class="material-symbols-outlined" aria-hidden="true">check_circle</span>' + implCount(objs) + ' Acțiuni Implementate</div>' +
        '</div>' +
        '<div class="rap-rbody"><div class="rap-ocards">' + cards + '</div></div>' +
        actionsBar() +
      '</div>'
    );
    /* „Detaliu" din cardul colorat → modal per-obiectiv */
    overlay.querySelectorAll('[data-ocard-obj]').forEach(function (btn) {
      btn.addEventListener('click', function () { openObjModal(missionId, parseInt(btn.getAttribute('data-ocard-obj'), 10)); });
    });
  }

  function ocardHtml(o, i) {
    var color = 'oc--' + ((i % 4) + 1);
    var critPill = AI_TIER ? weightPill(o) : '';
    return '<div class="rap-ocard ' + color + '">' +
      '<div class="rap-ocard-top">' +
        '<div class="rap-ot-row"><span class="rap-ot-idx">Obiectiv ' + (i + 1) + '</span>' + critPill + '</div>' +
        '<div class="rap-ot-title">' + esc(o.title) + '</div>' +
      '</div>' +
      '<div class="rap-osec rap-osec--find"><div class="rap-osec-h"><span class="material-symbols-outlined" aria-hidden="true">search</span>Constatări</div><div class="rap-osec-text">' + esc(trunc(o.constatareText, 150)) + '</div></div>' +
      '<div class="rap-osec-divider"></div>' +
      '<div class="rap-osec rap-osec--rec"><div class="rap-osec-h"><span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>Recomandări</div><div class="rap-osec-text">' + esc(trunc(o.recomandareText, 150)) + '</div></div>' +
      '<div class="rap-ocard-foot">' + actStatus(o) + '<span class="rap-ocard-detail" data-ocard-obj="' + i + '">Detaliu<span class="material-symbols-outlined" aria-hidden="true">open_in_full</span></span></div>' +
    '</div>';
  }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; }

  /* Modal per-obiectiv — Constatare → Recomandare → Acțiune (3 coloane). */
  function openObjModal(missionId, idx) {
    var m = (MOCK.auditMissions || []).find(function (x) { return x.id === missionId; });
    var r = reportOf(m || {});
    if (!m || !r || !r.objectives[idx]) return;
    var o = r.objectives[idx];
    openOverlay(
      '<div class="rap-modal rap-modal--obj">' +
        '<div class="rap-modal-head">' +
          '<div>' +
            '<div class="rap-eyebrow">Obiectiv ' + (idx + 1) + ' · Misiune ' + esc(m.id) + ' · ' + esc(m.entityName) + '</div>' +
            '<div class="rap-modal-title">' + esc(o.title) + '</div>' +
            '<div class="rap-rmeta"><span><b>Auditor:</b> ' + esc(r.auditor) + '</span><span><b>Perioada auditată:</b> ' + esc(r.perioada) + '</span></div>' +
          '</div>' +
          '<button type="button" class="rap-close" data-close aria-label="Închide"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '</div>' +
        '<div class="rap-modal-body">' +
          (AI_TIER ? '<div class="rap-objweight">' + weightPill(o) + ' <span class="rap-crit-note">Criticitate calculată A.I.</span></div>' : '') +
          '<div class="rap-finding">' +
            '<div class="rap-fcol rap-fcol--find"><div class="rap-fcol-h"><span class="material-symbols-outlined" aria-hidden="true">search</span>Constatare</div>' +
              '<div class="rap-fcol-title">' + esc(o.constatareTitle) + '</div><div class="rap-fcol-text">' + esc(o.constatareText) + '</div></div>' +
            '<div class="rap-fcol rap-fcol--rec"><div class="rap-fcol-h"><span class="material-symbols-outlined" aria-hidden="true">lightbulb</span>Recomandare</div>' +
              '<div class="rap-fcol-title">' + esc(o.recomandareTitle) + '</div><div class="rap-fcol-text">' + esc(o.recomandareText) + '</div></div>' +
            '<div class="rap-fcol rap-fcol--act"><div class="rap-fcol-h"><span class="material-symbols-outlined" aria-hidden="true">task_alt</span>Acțiune &amp; stadiu</div>' +
              actStatus(o) + '<div class="rap-fcol-text">' + esc(o.actionText) + '</div></div>' +
          '</div>' +
        '</div>' +
        actionsBar() +
      '</div>'
    );
  }

  window.SCRIPTICA_RAPOARTE = { render: render };
})();
