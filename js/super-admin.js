/* ============================================================
   Scriptica — Super Admin (zona Scriptica HQ)
   Controller unic pentru cele 5 ecrane (router pe body[data-page]):
     super-admin               → Dashboard global
     super-admin-clienti       → Listă clienți (+ înrolare cu provisioning)
     super-admin-client        → Detaliu client (comercial + tehnic + fluxuri)
     super-admin-fluxuri       → Registrul de fluxuri (verticale + șabloane)
     super-admin-tipuri-clienti→ Tipuri de clienți (pachete de fluxuri implicite)
   Date: window.SCRIPTICA_MOCK.superAdmin (mock din seed).
   Registrul de fluxuri persistă prin scripticaFlowSave (localStorage).
   Downtime: defalcat pe 3 cauze; agregatul global e derivat din
   incidentele per-client. // sursa reala = monitorizare infra, faza ulterioara.
   ============================================================ */
(function () {
  'use strict';

  function SA() { return (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.superAdmin) || null; }
  function clients() { return (SA() && SA().clients) || []; }
  function clientById(id) { return clients().find(function (c) { return c.id === id; }) || null; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function qs(name) { return new URLSearchParams(window.location.search).get(name); }
  function vq() { return getCurrentView() === 'superadmin' ? '?view=superadmin' : ''; }

  /* ---- registrul de fluxuri + tipuri de clienți ---- */
  function verticals() { return (SA() && SA().flowVerticals) || []; }
  function activeVerticals() { return verticals().filter(function (v) { return (v.status || 'activ') === 'activ'; }); }
  function verticalById(id) { return verticals().find(function (v) { return v.id === id; }) || null; }
  function templatesAll() { return (SA() && SA().flowTemplates) || []; }
  function templatesFor(vid) { return templatesAll().filter(function (t) { return t.verticalId === vid; }); }
  function templateById(id) { return templatesAll().find(function (t) { return t.id === id; }) || null; }
  function clientTypesAll() { return (SA() && SA().clientTypes) || []; }
  function clientTypeById(id) { return clientTypesAll().find(function (t) { return t.id === id; }) || null; }
  function clientsOfType(id) { return clients().filter(function (c) { return c.clientTypeId === id; }); }

  function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'x';
  }
  function uid(prefix, name, list) {
    var base = prefix + '_' + slugify(name), id = base, n = 2;
    while (list.some(function (x) { return x.id === id; })) { id = base + '_' + n; n++; }
    return id;
  }
  function toast(variant, msg) { if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, msg); }

  var VERTICAL_ICONS = ['balance', 'gavel', 'handshake', 'savings', 'receipt_long', 'folder_special', 'home_work', 'fact_check', 'science', 'inventory_2'];
  var CT_ICONS = ['calculate', 'verified_user', 'balance', 'diversity_2', 'gavel', 'apartment', 'handshake', 'storefront'];
  var FREQUENCIES = ['lunar', 'trimestrial', 'anual', 'punctual'];

  /* ---- modal generic construit din JS (paginile HQ nu au markup static) ---- */
  function saModal(opts) {
    var overlay = document.createElement('div');
    overlay.className = 'modal is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="modal__dialog" role="document"' + (opts.wide ? ' style="max-width:760px"' : '') + '>' +
        '<button type="button" class="modal__close" data-modal-close aria-label="Închide fereastra">' +
          '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '<header class="modal__header">' +
          '<h2 class="modal__title">' + esc(opts.title) + '</h2>' +
          (opts.subtitle ? '<p class="modal__subtitle">' + esc(opts.subtitle) + '</p>' : '') +
        '</header>' +
        '<form class="modal__body" novalidate>' + opts.bodyHtml + '</form>' +
        '<footer class="modal__footer">' +
          '<button type="button" class="btn btn--ghost" data-modal-cancel>Anulează</button>' +
          '<button type="button" class="btn ' + (opts.critical ? 'btn--critical' : 'btn--primary') + '" data-modal-submit>' + esc(opts.submitLabel || 'Salvează') + '</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    function close() {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    overlay.querySelector('[data-modal-close]').addEventListener('click', close);
    overlay.querySelector('[data-modal-cancel]').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('[data-modal-submit]').addEventListener('click', function (e) {
      e.preventDefault();
      if (opts.onSubmit) opts.onSubmit(overlay, close);
    });
    if (opts.onOpen) opts.onOpen(overlay, close);
    return { el: overlay, close: close };
  }

  function fieldHtml(label, controlHtml, help) {
    return '<div class="form-field">' +
      '<label class="form-label">' + esc(label) + '</label>' +
      controlHtml +
      (help ? '<span class="form-helper">' + esc(help) + '</span>' : '') +
    '</div>';
  }
  function iconPickerHtml(icons, selected) {
    return '<div class="sa-iconpick">' + icons.map(function (ic) {
      return '<button type="button" class="sa-iconpick__btn' + (ic === selected ? ' is-selected' : '') + '" data-icon="' + ic + '" title="' + ic + '">' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + ic + '</span></button>';
    }).join('') + '</div>';
  }
  function bindIconPicker(root) {
    root.querySelectorAll('.sa-iconpick__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        root.querySelectorAll('.sa-iconpick__btn').forEach(function (x) { x.classList.remove('is-selected'); });
        b.classList.add('is-selected');
      });
    });
  }
  function pickedIcon(root, fallback) {
    var b = root.querySelector('.sa-iconpick__btn.is-selected');
    return b ? b.getAttribute('data-icon') : fallback;
  }
  function fval(root, name) {
    var el = root.querySelector('[data-f="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  /* ---- format & lookups ---- */
  function fmtMin(m) {
    m = Number(m) || 0;
    if (m === 0) return '0 min';
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), mm = m % 60;
    return h + 'h' + (mm ? ' ' + mm + 'min' : '');
  }

  var TIER = {
    baza: { cls: 'pill--neutral', label: 'Bază' },
    plus: { cls: 'pill--highlight', label: 'Plus' },
    ent:  { cls: 'pill--purple', label: 'Enterprise' }
  };
  function tierPill(t) { var m = TIER[t] || TIER.baza; return '<span class="pill ' + m.cls + '">' + m.label + '</span>'; }

  var CONTRACT = {
    activ:  { cls: 'status-pill--activ',  label: 'Activ' },
    pauza:  { cls: 'status-pill--pauza',  label: 'Pe pauză' },
    anulat: { cls: 'status-pill--anulat', label: 'Anulat' }
  };
  function statusPill(s) {
    var m = CONTRACT[s] || CONTRACT.activ;
    return '<span class="status-pill ' + m.cls + '"><span class="status-pill__dot"></span>' + m.label + '</span>';
  }

  /* ---- downtime defalcat pe cauză ---- */
  var SEV = { server: 3, ai_vm: 2, ai_limit: 1, ok: 0 };
  var CAUSES = [
    { key: 'server',   label: 'Server Scriptica indisponibil', desc: 'Platforma întreagă a fost inaccesibilă — clientul nu a putut accesa nimic.', icon: 'cloud_off' },
    { key: 'ai_vm',    label: 'VM A.I. indisponibilă',         desc: 'Doar funcțiile A.I. (procesare/sortare) au fost oprite; restul platformei a funcționat.', icon: 'memory' },
    { key: 'ai_limit', label: 'Limită de calcul A.I. atinsă',  desc: 'Procesările A.I. au fost throttle-uite la atingerea plafonului planului — nu e o defecțiune.', icon: 'speed' }
  ];

  function buildStrip(incidents) {
    var cells = []; for (var i = 0; i < 30; i++) cells.push('ok');
    (incidents || []).forEach(function (inc) {
      var d = inc.day;
      if (d == null || d < 0 || d > 29) return;
      if (SEV[inc.cauza] > SEV[cells[d]]) cells[d] = inc.cauza;
    });
    return cells;
  }
  function totals(incidents) {
    var t = { server: 0, ai_vm: 0, ai_limit: 0 };
    (incidents || []).forEach(function (i) { if (t[i.cauza] != null) t[i.cauza] += (Number(i.minutes) || 0); });
    return t;
  }
  function allIncidents() {
    var out = [];
    clients().forEach(function (c) { ((c.downtime && c.downtime.incidents) || []).forEach(function (i) { out.push(i); }); });
    return out;
  }

  /* downtime panel body — opts: { incidents, tier } (tier omis pentru agregat global) */
  function downtimeBody(opts) {
    var inc = opts.incidents || [];
    var t = totals(inc);
    var cells = buildStrip(inc);
    var rows = CAUSES.map(function (c) {
      var chip = (c.key === 'ai_limit' && t.ai_limit > 0)
        ? ' <span class="pill pill--highlight">Semnal upsell</span>' : '';
      return '<div class="sa-dt-row sa-dt-row--' + c.key + '">' +
          '<div class="sa-dt-ico"><span class="material-symbols-outlined" aria-hidden="true">' + c.icon + '</span></div>' +
          '<div class="sa-dt-main"><div class="sa-dt-cause">' + c.label + chip + '</div>' +
            '<div class="sa-dt-desc">' + c.desc + '</div></div>' +
          '<div class="sa-dt-total">' + fmtMin(t[c.key]) + '</div>' +
        '</div>';
    }).join('');
    var strip = '<div class="sa-dt-strip">' + cells.map(function (k) {
      return '<span class="sa-dt-cell' + (k !== 'ok' ? ' sa-dt-cell--' + k : '') + '"></span>';
    }).join('') + '</div>';
    var legend = '<div class="sa-dt-legend">' +
      '<span><i class="ok"></i>Funcțional</span>' +
      '<span><i class="server"></i>Server jos</span>' +
      '<span><i class="ai_vm"></i>VM A.I. jos</span>' +
      '<span><i class="ai_limit"></i>Limită calcul A.I.</span>' +
    '</div>';
    var hint = '';
    if (t.ai_limit > 0 && opts.tier && opts.tier !== 'ent') {
      hint = '<div class="sa-dt-hint"><span class="material-symbols-outlined" aria-hidden="true">trending_up</span>' +
        'Clientul atinge frecvent plafonul de calcul A.I. — ar beneficia de un plan superior.</div>';
    }
    return rows + strip + legend + hint;
  }

  /* ---- charts ---- */
  function vmChart(loads, peakIdx, hours) {
    var bars = (loads || []).map(function (p, i) {
      return '<div class="sa-bar' + (i === peakIdx ? ' sa-bar--peak' : '') + '" style="height:' + p + '%"></div>';
    }).join('');
    var x = (hours || []).map(function (h) { return '<span>' + esc(h) + '</span>'; }).join('');
    return '<div class="sa-chart">' + bars + '</div>' + (x ? '<div class="sa-chart-x">' + x + '</div>' : '');
  }
  /* uptime row derived from the same incidents: server = down, ai_vm = warn,
     ai_limit stays green (NU e indisponibilitate de platformă). */
  function uptimeRow(cells) {
    return '<div class="sa-uptime-row">' + cells.map(function (k) {
      var cls = k === 'server' ? ' sa-uptime-cell--down' : k === 'ai_vm' ? ' sa-uptime-cell--warn' : '';
      return '<span class="sa-uptime-cell' + cls + '"></span>';
    }).join('') + '</div>';
  }

  function clientRow(c) {
    return '<tr class="sa-row" data-id="' + esc(c.id) + '">' +
        '<td><div class="sa-cname">' + esc(c.name) + '<small>' + esc(String(c.domain).toLowerCase()) + ' · ' + c.users + ' utilizatori</small></div></td>' +
        '<td>' + ctPill(c.clientTypeId) + '</td>' +
        '<td>' + tierPill(c.tier) + '</td>' +
        '<td>' + statusPill(c.contract) + '</td>' +
        '<td><div class="sa-load" title="' + c.aiLoad + '%"><span style="width:' + c.aiLoad + '%"></span></div></td>' +
        '<td class="admin-table__muted">' + esc(c.enrolled) + '</td>' +
        '<td style="text-align:right"><span class="sa-rowbtn" aria-hidden="true"><span class="material-symbols-outlined">chevron_right</span></span></td>' +
      '</tr>';
  }
  function clientsTable(list) {
    return '<div class="sa-table-card"><table class="admin-table">' +
      '<thead><tr><th>Client</th><th>Tip client</th><th>Plan</th><th>Status contract</th><th>Încărcare A.I.</th><th>Înrolat</th><th></th></tr></thead>' +
      '<tbody>' + list.map(clientRow).join('') + '</tbody></table></div>';
  }
  function bindRows(root) {
    root.querySelectorAll('.sa-row').forEach(function (tr) {
      tr.addEventListener('click', function () {
        window.location.href = 'super-admin-client.html?id=' + encodeURIComponent(tr.getAttribute('data-id')) +
          (getCurrentView() === 'superadmin' ? '&view=superadmin' : '');
      });
    });
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDashboard(root) {
    var sa = SA();
    var k = sa.kpis;
    var globalCells = buildStrip(allIncidents());
    var recent = clients().slice(0, 3);

    root.innerHTML =
      '<header class="page-header"><h1 class="page-header__title">Dashboard</h1></header>' +
      '<p class="sa-subtitle">Privire de ansamblu asupra platformei · toate conturile de business</p>' +

      '<div class="sa-kpi-grid">' +
        kpi('apartment', 'Clienți activi', k.clientiActivi, '<span class="up">' + esc(k.clientiDelta) + '</span> luna aceasta') +
        kpi('workspace_premium', 'Contracte Plus / Ent.', k.contractePremium, 'din ' + k.conturiTotal + ' conturi') +
        kpi('auto_awesome', 'Procesări A.I. / lună', k.procesariAI, '<span class="up">' + esc(k.procesariDelta) + '</span> vs luna trecută') +
        kpi('pause_circle', 'Pe pauză / restanță', k.pePauza, '<span class="down">necesită atenție</span>') +
      '</div>' +

      '<div class="sa-panels">' +
        '<div class="sa-card">' +
          '<div class="sa-panel__title">Încărcare VM (LLM local)</div>' +
          '<div class="sa-panel__sub">Media pe ultimele 12 ore · procesare documente</div>' +
          vmChart(sa.vmLoadGlobal, sa.vmPeakIdxGlobal, sa.vmHours) +
        '</div>' +
        '<div class="sa-card">' +
          '<div class="sa-panel__title">Uptime servicii</div>' +
          '<div class="sa-panel__sub">Ultimele 30 de zile</div>' +
          '<div class="sa-uptime-big">' + esc(sa.uptime30Global) + '%</div>' +
          uptimeRow(globalCells) +
          '<div class="sa-uptime-legend"><span>acum 30 zile</span><span>azi</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="sa-card" style="margin-bottom:var(--space-5)">' +
        '<div class="sa-panel__title">Downtime defalcat pe cauză</div>' +
        '<div class="sa-panel__sub">Agregat pe toți clienții · ultimele 30 de zile</div>' +
        downtimeBody({ incidents: allIncidents() }) +
      '</div>' +

      '<div class="sa-section-h">Clienți recenți</div>' +
      clientsTable(recent);

    bindRows(root);
  }

  function kpi(icon, label, num, sub) {
    return '<div class="sa-kpi">' +
      '<div class="sa-kpi__label"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' + label + '</div>' +
      '<div class="sa-kpi__num">' + esc(num) + '</div>' +
      '<div class="sa-kpi__sub">' + sub + '</div>' +
    '</div>';
  }

  /* ============================================================
     CLIENTS LIST
     ============================================================ */
  function renderClients(root) {
    var list = clients();
    root.innerHTML =
      '<header class="page-header"><h1 class="page-header__title">Clienți</h1></header>' +
      '<p class="sa-subtitle">Toate conturile de business · ' + list.length + ' clienți</p>' +
      clientsTable(list) +
      '<div style="margin-top:var(--space-4)">' +
        '<button class="btn btn--primary" type="button" id="sa-new-client">' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span>Cont de business nou</button>' +
      '</div>';
    bindRows(root);
    var nb = root.querySelector('#sa-new-client');
    if (nb) nb.addEventListener('click', function () { openNewClientModal(root); });
  }

  /* ============================================================
     CLIENT DETAIL
     ============================================================ */
  function renderClientDetail(root) {
    var c = clientById(qs('id')) || clients()[0];
    if (!c) { root.innerHTML = '<p class="sa-subtitle">Clientul nu a fost găsit.</p>'; return; }
    markClientsNavActive();

    var cm = c.commercial, te = c.technical;
    var cells = buildStrip((c.downtime && c.downtime.incidents) || []);

    root.innerHTML =
      '<div class="sa-crumb"><a href="super-admin-clienti.html' + vq() + '">Clienți</a> › ' + esc(c.name) + '</div>' +

      '<div class="sa-cd-head">' +
        '<div class="sa-cd-logo">' + esc(scripticaInitials(c.name).charAt(0)) + '</div>' +
        '<div>' +
          '<div class="sa-cd-title">' + esc(c.name) + '</div>' +
          '<div class="sa-cd-meta">' +
            '<span><b>Instanță:</b> ' + esc(c.instance) + '</span>' +
            '<span><b>Tip client:</b> ' + esc((clientTypeById(c.clientTypeId) || { name: c.domain }).name) + '</span>' +
            '<span><b>Înrolat:</b> ' + esc(c.enrolled) + '</span>' +
            '<span><b>Utilizatori:</b> ' + c.users + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="sa-cd-actions">' +
          '<button class="btn btn--ghost" type="button"><span class="material-symbols-outlined" aria-hidden="true">edit</span>Editează denumirea</button>' +
          pauseBtn(c) +
          cancelBtn(c) +
        '</div>' +
      '</div>' +

      '<div class="sa-cd-cols">' +
        /* ----- commercial column ----- */
        '<div>' +
          '<div class="sa-sec">' +
            '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">workspace_premium</span>Comercial</div>' +
            kv('Plan', tierPill(c.tier)) +
            kv('Status contract', statusPill(c.contract)) +
            kv('Reînnoire', esc(cm.renew)) +
            kv('Facturare', esc(cm.billing)) +
            kv('Ultima plată', esc(cm.lastPay)) +
          '</div>' +
          provisionedFlowsHtml(c) +
          '<div class="sa-sec">' +
            '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">tune</span>Funcționalități (tier)</div>' +
            '<div class="sa-flags">' + c.flags.map(flagRow).join('') + '</div>' +
          '</div>' +
        '</div>' +
        /* ----- technical column ----- */
        '<div>' +
          '<div class="sa-sec">' +
            '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">dns</span>Tehnic · această instanță</div>' +
            '<div class="sa-panel__sub">Încărcare VM (LLM local) — ultimele 12 ore</div>' +
            vmChart(te.vmLoad, te.vmPeakIdx) +
          '</div>' +
          '<div class="sa-sec">' +
            '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">monitoring</span>Utilizare & uptime</div>' +
            kv('Procesări A.I. / lună', esc(te.aiPerMonth)) +
            kv('Documente stocate', esc(te.docsStored)) +
            kv('Uptime (30 zile)', '<span style="color:var(--color-success)">' + esc(te.uptime30) + '%</span>') +
            kv('Ultimul incident', esc(te.lastIncident)) +
          '</div>' +
          '<div class="sa-sec">' +
            '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">timeline</span>Downtime defalcat pe cauză</div>' +
            '<div class="sa-panel__sub">Ultimele 30 de zile</div>' +
            downtimeBody({ incidents: (c.downtime && c.downtime.incidents) || [], tier: c.tier }) +
          '</div>' +
        '</div>' +
      '</div>';

    bindToggles(root);
    var chg = root.querySelector('[data-change-ct]');
    if (chg) chg.addEventListener('click', function () { openChangeTypeModal(root, c); });
  }

  function kv(k, v) { return '<div class="sa-kv"><span class="sa-kv__k">' + k + '</span><span class="sa-kv__v">' + v + '</span></div>'; }

  function flagRow(f) {
    return '<div class="sa-flag">' +
      '<button type="button" class="sa-toggle' + (f.on ? ' is-on' : '') + '" role="switch" aria-checked="' + (f.on ? 'true' : 'false') + '" aria-label="' + esc(f.name) + '"></button>' +
      '<span class="sa-flag__name">' + esc(f.name) + '</span>' +
      '<span class="sa-flag__tier">' + esc(f.tier) + '</span>' +
    '</div>';
  }
  function bindToggles(root) {
    root.querySelectorAll('.sa-toggle').forEach(function (t) {
      t.addEventListener('click', function () {
        var on = t.classList.toggle('is-on');
        t.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });
  }

  function pauseBtn(c) {
    if (c.contract === 'pauza') {
      return '<button class="btn btn--ghost" type="button"><span class="material-symbols-outlined" aria-hidden="true">play_arrow</span>Reactivează</button>';
    }
    return '<button class="btn btn--ghost" type="button"><span class="material-symbols-outlined" aria-hidden="true">pause</span>Pune pe pauză</button>';
  }
  function cancelBtn(c) {
    if (c.contract === 'anulat') {
      return '<button class="btn btn--ghost" type="button"><span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>Reactivează contract</button>';
    }
    return '<button class="btn btn--critical" type="button"><span class="material-symbols-outlined" aria-hidden="true">cancel</span>Anulează contract</button>';
  }

  /* ============================================================
     FLUXURI — registrul de verticale + șabloane (două straturi)
     ============================================================ */
  function renderFluxuri(root) {
    root.innerHTML =
      '<header class="page-header"><h1 class="page-header__title">Fluxuri</h1>' +
        '<button class="btn btn--primary" type="button" data-new-vert>' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span>Verticală nouă</button>' +
      '</header>' +
      '<p class="sa-subtitle">Registrul platformei: verticale de lucru și șabloanele lor de flux. Pachetele implicite per client se compun în „Tipuri de clienți".</p>' +
      verticals().map(verticalCardHtml).join('');

    if (!root._fluxBound) {
      root._fluxBound = true;
      root.addEventListener('click', function (e) {
        var b;
        if ((b = e.target.closest('[data-new-vert]'))) openVerticalModal(root, null);
        else if ((b = e.target.closest('[data-edit-vert]'))) openVerticalModal(root, verticalById(b.getAttribute('data-edit-vert')));
        else if ((b = e.target.closest('[data-del-vert]'))) confirmDeleteVertical(root, verticalById(b.getAttribute('data-del-vert')));
        else if ((b = e.target.closest('[data-add-tpl]'))) openTemplateModal(root, verticalById(b.getAttribute('data-add-tpl')), null);
        else if ((b = e.target.closest('[data-edit-tpl]'))) {
          var t = templateById(b.getAttribute('data-edit-tpl'));
          if (t) openTemplateModal(root, verticalById(t.verticalId), t);
        }
        else if ((b = e.target.closest('[data-del-tpl]'))) confirmDeleteTemplate(root, templateById(b.getAttribute('data-del-tpl')));
      });
    }
  }

  function verticalCardHtml(v) {
    var tpls = templatesFor(v.id);
    var lc = v.lifecycle || [];
    var stepsHtml = lc.map(function (nm, i) {
      return '<span class="sa-step-chip"><b>' + (i + 1) + '</b>' + esc(nm) + '</span>' +
        (i < lc.length - 1 ? '<span class="material-symbols-outlined sa-step-arrow" aria-hidden="true">arrow_forward</span>' : '');
    }).join('');
    var rows = tpls.map(function (t) {
      var last = (t.steps && t.steps.length) ? (t.steps[t.steps.length - 1].offsetDays || 0) : 0;
      return '<tr>' +
        '<td><div class="sa-cname">' + esc(t.name) + '<small>' + esc(t.description || '') + '</small></div></td>' +
        '<td><span class="pill pill--neutral">' + esc(t.frequency || '—') + '</span></td>' +
        '<td class="admin-table__muted">' + ((t.steps || []).length) + ' etape · termen final +' + last + ' zile</td>' +
        '<td class="sa-row-actions">' +
          '<button class="sa-mini-btn" type="button" data-edit-tpl="' + esc(t.id) + '" title="Editează șablonul"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>' +
          '<button class="sa-mini-btn sa-mini-btn--danger" type="button" data-del-tpl="' + esc(t.id) + '" title="Șterge șablonul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>' +
        '</td></tr>';
    }).join('');
    var badge = v.builtin
      ? '<span class="pill pill--neutral">Standard</span>'
      : '<span class="pill pill--highlight">Custom</span>';
    var actions = v.builtin ? '' :
      '<button class="sa-mini-btn" type="button" data-edit-vert="' + esc(v.id) + '" title="Editează verticala"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>' +
      '<button class="sa-mini-btn sa-mini-btn--danger" type="button" data-del-vert="' + esc(v.id) + '" title="Șterge verticala"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>';
    var listHref = v.builtin ? ((v.pages && v.pages.list) || '#') : ('flux.html?vertical=' + encodeURIComponent(v.id));
    return '<div class="sa-card sa-flow-card">' +
      '<div class="sa-flow-head">' +
        '<div class="sa-flow-ico"><span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span></div>' +
        '<div class="sa-flow-title"><div class="sa-panel__title">' + esc(v.name) + ' ' + badge + '</div>' +
          '<div class="sa-panel__sub">Domeniu: <code>' + esc(v.domain) + '</code> · element de lucru: ' + esc(v.itemLabel || '—') + (v.description ? ' · ' + esc(v.description) : '') + '</div></div>' +
        '<div class="sa-flow-actions">' + actions + '</div>' +
      '</div>' +
      '<div class="sa-flow-steps">' + stepsHtml + '</div>' +
      (tpls.length
        ? '<table class="admin-table sa-flow-table"><thead><tr><th>Șablon de flux</th><th>Frecvență</th><th>Etape</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
        : '<div class="sa-flow-empty">Niciun șablon definit încă pentru această verticală.</div>') +
      '<div class="sa-flow-foot">' +
        '<button class="btn btn--secondary" type="button" data-add-tpl="' + esc(v.id) + '"><span class="material-symbols-outlined" aria-hidden="true">add</span>Șablon nou</button>' +
        '<a class="sa-flow-open" href="' + esc(listHref) + '">Deschide în aplicație<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>' +
      '</div>' +
    '</div>';
  }

  function lcRowHtml(name, i) {
    return '<div class="sa-lc-row">' +
      '<span class="sa-lc-row__n">' + (i + 1) + '</span>' +
      '<input type="text" class="input" data-lc-name value="' + esc(name) + '" placeholder="Numele etapei">' +
      '<button type="button" class="sa-mini-btn sa-mini-btn--danger" data-lc-del aria-label="Elimină etapa"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
    '</div>';
  }

  function openVerticalModal(root, v) {
    var lc = (v && v.lifecycle && v.lifecycle.slice()) || ['', ''];
    var body =
      fieldHtml('Denumire verticală', '<input type="text" class="input" data-f="name" value="' + esc(v ? v.name : '') + '" placeholder="ex. Consultanță Fiscală">') +
      '<div class="sa-form-2col">' +
        fieldHtml('Element de lucru (singular)', '<input type="text" class="input" data-f="itemLabel" value="' + esc(v ? v.itemLabel || '' : '') + '" placeholder="ex. Dosar">', 'Cum se numește un element din verticală.') +
        fieldHtml('Element de lucru (plural)', '<input type="text" class="input" data-f="itemLabelPlural" value="' + esc(v ? v.itemLabelPlural || '' : '') + '" placeholder="ex. Dosare">') +
      '</div>' +
      fieldHtml('Pictogramă', iconPickerHtml(VERTICAL_ICONS, v ? v.icon : VERTICAL_ICONS[0])) +
      fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(v ? v.description || '' : '') + '</textarea>') +
      '<div class="form-field">' +
        '<label class="form-label">Etapele ciclului de viață</label>' +
        '<span class="form-helper">Forma fluxului: fiecare element trece prin aceste etape, în ordine. Termenele per etapă se stabilesc pe șabloane.</span>' +
        '<div class="sa-lc-rows" data-lc-rows>' + lc.map(lcRowHtml).join('') + '</div>' +
        '<button type="button" class="btn btn--ghost" data-lc-add><span class="material-symbols-outlined" aria-hidden="true">add</span>Adaugă etapă</button>' +
      '</div>';

    saModal({
      title: v ? 'Editează verticala' : 'Verticală nouă',
      subtitle: v ? v.name : 'Definește un nou modul de lucru — devine navigabil imediat prin motorul generic.',
      bodyHtml: body, wide: true,
      submitLabel: v ? 'Salvează modificările' : 'Creează verticala',
      onOpen: function (m) {
        bindIconPicker(m);
        m.querySelector('[data-lc-add]').addEventListener('click', function () {
          var rows = m.querySelector('[data-lc-rows]');
          rows.insertAdjacentHTML('beforeend', lcRowHtml('', rows.children.length));
        });
        m.querySelector('[data-lc-rows]').addEventListener('click', function (e) {
          var del = e.target.closest('[data-lc-del]');
          if (!del) return;
          var rows = m.querySelector('[data-lc-rows]');
          if (rows.children.length <= 2) { toast('error', 'O verticală are minimum două etape.'); return; }
          del.closest('.sa-lc-row').remove();
          Array.prototype.forEach.call(rows.querySelectorAll('.sa-lc-row__n'), function (n, i) { n.textContent = i + 1; });
        });
      },
      onSubmit: function (m, close) {
        var name = fval(m, 'name');
        var lcNames = Array.prototype.map.call(m.querySelectorAll('[data-lc-name]'), function (i) { return i.value.trim(); }).filter(Boolean);
        if (!name) { toast('error', 'Denumirea verticalei este obligatorie.'); return; }
        if (lcNames.length < 2) { toast('error', 'Definește cel puțin două etape ale ciclului de viață.'); return; }
        var itemLabel = fval(m, 'itemLabel') || 'Element';
        var rec = {
          id: v ? v.id : uid('vert', name, verticals()),
          domain: v ? v.domain : slugify(name),
          builtin: v ? !!v.builtin : false,
          status: v ? (v.status || 'activ') : 'activ',
          name: name,
          icon: pickedIcon(m, 'account_tree'),
          itemLabel: itemLabel,
          itemLabelPlural: fval(m, 'itemLabelPlural') || itemLabel,
          description: fval(m, 'description'),
          lifecycle: lcNames
        };
        if (v && v.pages) rec.pages = v.pages;
        scripticaFlowSave('vertical', rec);
        /* Realiniere: șabloanele existente preiau noua formă a ciclului de
           viață (offset-urile supraviețuiesc pe indexul etapei). */
        templatesFor(rec.id).forEach(function (t) {
          var steps = rec.lifecycle.map(function (nm, i) {
            return { name: nm, offsetDays: (t.steps && t.steps[i] && t.steps[i].offsetDays) || (i + 1) * 10 };
          });
          scripticaFlowSave('template', Object.assign({}, t, { steps: steps }));
        });
        close();
        toast('success', v ? 'Verticala a fost actualizată.' : 'Verticala „' + name + '" a fost creată — este acum navigabilă în aplicație.');
        renderFluxuri(root);
      }
    });
  }

  function confirmDeleteVertical(root, v) {
    if (!v) return;
    var tpls = templatesFor(v.id);
    var usedBy = clientTypesAll().filter(function (t) { return (t.verticalIds || []).indexOf(v.id) !== -1; });
    saModal({
      title: 'Șterge verticala „' + v.name + '"?',
      bodyHtml: '<p class="sa-modal-note">Se șterg și cele ' + tpls.length + ' șabloane ale verticalei' +
        (usedBy.length ? ', iar verticala este scoasă din ' + usedBy.length + ' tip(uri) de clienți' : '') + '. Acțiunea nu poate fi anulată.</p>',
      submitLabel: 'Șterge definitiv', critical: true,
      onSubmit: function (m, close) {
        tpls.forEach(function (t) { scripticaFlowDelete('template', t.id); });
        usedBy.forEach(function (ct) {
          scripticaFlowSave('clientType', Object.assign({}, ct, {
            verticalIds: (ct.verticalIds || []).filter(function (x) { return x !== v.id; }),
            defaultTemplateIds: (ct.defaultTemplateIds || []).filter(function (x) {
              return !tpls.some(function (t) { return t.id === x; });
            })
          }));
        });
        scripticaFlowDelete('vertical', v.id);
        close();
        toast('success', 'Verticala „' + v.name + '" a fost ștearsă.');
        renderFluxuri(root);
      }
    });
  }

  function openTemplateModal(root, v, t) {
    if (!v) return;
    var stepRows = (v.lifecycle || []).map(function (nm, i) {
      var off = (t && t.steps && t.steps[i]) ? t.steps[i].offsetDays : '';
      return '<div class="sa-tpl-steprow">' +
        '<span class="sa-lc-row__n">' + (i + 1) + '</span>' +
        '<span class="sa-tpl-steprow__name">' + esc(nm) + '</span>' +
        '<span class="sa-tpl-steprow__off">+<input type="number" class="input" min="1" data-tpl-off value="' + esc(off) + '"> zile de la start</span>' +
      '</div>';
    }).join('');
    var freqOptions = FREQUENCIES.map(function (f) {
      return '<option value="' + f + '"' + (t && t.frequency === f ? ' selected' : '') + '>' + f + '</option>';
    }).join('');
    saModal({
      title: t ? 'Editează șablonul' : 'Șablon nou — ' + v.name,
      subtitle: 'Termenele unei instanțe se calculează din data de început + offset-urile etapelor.',
      bodyHtml:
        fieldHtml('Denumire șablon', '<input type="text" class="input" data-f="name" value="' + esc(t ? t.name : '') + '" placeholder="ex. Opinie fiscală punctuală">') +
        fieldHtml('Frecvență', '<select class="select" data-f="frequency">' + freqOptions + '</select>') +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(t ? t.description || '' : '') + '</textarea>') +
        '<div class="form-field"><label class="form-label">Termene pe etapele verticalei</label>' + stepRows + '</div>',
      submitLabel: t ? 'Salvează modificările' : 'Creează șablonul',
      onSubmit: function (m, close) {
        var name = fval(m, 'name');
        if (!name) { toast('error', 'Denumirea șablonului este obligatorie.'); return; }
        var offs = Array.prototype.map.call(m.querySelectorAll('[data-tpl-off]'), function (i) { return parseInt(i.value, 10); });
        if (offs.some(function (n) { return !n || n < 1; })) { toast('error', 'Completează termenul (în zile) pentru fiecare etapă.'); return; }
        var rec = {
          id: t ? t.id : uid('ft', name, templatesAll()),
          verticalId: v.id,
          name: name,
          frequency: m.querySelector('[data-f="frequency"]').value,
          status: t ? (t.status || 'activ') : 'activ',
          description: fval(m, 'description'),
          steps: (v.lifecycle || []).map(function (nm, i) { return { name: nm, offsetDays: offs[i] }; })
        };
        scripticaFlowSave('template', rec);
        close();
        toast('success', t ? 'Șablonul a fost actualizat.' : 'Șablonul „' + name + '" a fost creat.');
        renderFluxuri(root);
      }
    });
  }

  function confirmDeleteTemplate(root, t) {
    if (!t) return;
    var usedBy = clientTypesAll().filter(function (ct) { return (ct.defaultTemplateIds || []).indexOf(t.id) !== -1; });
    saModal({
      title: 'Șterge șablonul „' + t.name + '"?',
      bodyHtml: '<p class="sa-modal-note">' +
        (usedBy.length ? 'Șablonul este scos din ' + usedBy.length + ' tip(uri) de clienți. ' : '') +
        'Acțiunea nu poate fi anulată.</p>',
      submitLabel: 'Șterge definitiv', critical: true,
      onSubmit: function (m, close) {
        usedBy.forEach(function (ct) {
          scripticaFlowSave('clientType', Object.assign({}, ct, {
            defaultTemplateIds: (ct.defaultTemplateIds || []).filter(function (x) { return x !== t.id; })
          }));
        });
        scripticaFlowDelete('template', t.id);
        close();
        toast('success', 'Șablonul a fost șters.');
        renderFluxuri(root);
      }
    });
  }

  /* ============================================================
     TIPURI DE CLIENȚI — pachete de fluxuri implicite la înrolare
     ============================================================ */
  function ctPill(id) {
    var t = clientTypeById(id);
    return t
      ? '<span class="pill pill--neutral sa-ct-pill"><span class="material-symbols-outlined" aria-hidden="true">' + esc(t.icon || 'category') + '</span>' + esc(t.name) + '</span>'
      : '<span class="admin-table__muted">—</span>';
  }

  function renderClientTypes(root) {
    root.innerHTML =
      '<header class="page-header"><h1 class="page-header__title">Tipuri de clienți</h1>' +
        '<button class="btn btn--primary" type="button" data-new-ct>' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span>Tip de client nou</button>' +
      '</header>' +
      '<p class="sa-subtitle">Fiecare tip definește verticalele și șabloanele de flux primite implicit la înrolare — copiate în workspace-ul clientului, apoi adaptabile din Administrare. Un client are un singur tip.</p>' +
      '<div class="sa-ct-grid">' + clientTypesAll().map(ctCardHtml).join('') + '</div>';

    if (!root._ctBound) {
      root._ctBound = true;
      root.addEventListener('click', function (e) {
        var b;
        if ((b = e.target.closest('[data-new-ct]'))) openClientTypeModal(root, null);
        else if ((b = e.target.closest('[data-edit-ct]'))) openClientTypeModal(root, clientTypeById(b.getAttribute('data-edit-ct')));
        else if ((b = e.target.closest('[data-del-ct]'))) confirmDeleteClientType(root, clientTypeById(b.getAttribute('data-del-ct')));
        else if ((b = e.target.closest('[data-arch-ct]'))) openArchiveModal(root, clientTypeById(b.getAttribute('data-arch-ct')));
      });
    }
  }

  function ctCardHtml(t) {
    var vs = (t.verticalIds || []).map(verticalById).filter(Boolean);
    var tpls = (t.defaultTemplateIds || []).map(templateById).filter(Boolean);
    var n = clientsOfType(t.id).length;
    var vertPills = vs.map(function (v) {
      return '<span class="pill pill--neutral sa-ct-vert"><span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span>' + esc(v.name) + '</span>';
    }).join('') || '<span class="admin-table__muted">Nicio verticală</span>';
    var tplList = tpls.map(function (x) {
      var v = verticalById(x.verticalId);
      return '<li>' + esc(x.name) + ' <small>· ' + esc(v ? v.name : '') + '</small></li>';
    }).join('');
    var delBtn = n === 0
      ? '<button class="sa-mini-btn sa-mini-btn--danger" type="button" data-del-ct="' + esc(t.id) + '" title="Șterge tipul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>'
      : '';
    return '<div class="sa-card sa-ct-card">' +
      '<div class="sa-flow-head">' +
        '<div class="sa-flow-ico"><span class="material-symbols-outlined" aria-hidden="true">' + esc(t.icon || 'category') + '</span></div>' +
        '<div class="sa-flow-title"><div class="sa-panel__title">' + esc(t.name) + '</div>' +
          '<div class="sa-panel__sub">' + esc(t.description || '') + '</div></div>' +
        '<div class="sa-flow-actions">' +
          '<button class="sa-mini-btn" type="button" data-edit-ct="' + esc(t.id) + '" title="Editează tipul"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>' +
          delBtn +
        '</div>' +
      '</div>' +
      '<div class="sa-ct-sec">Verticale</div><div class="sa-ct-verts">' + vertPills + '</div>' +
      '<div class="sa-ct-sec">Șabloane implicite (' + tpls.length + ')</div><ul class="sa-ct-tpllist">' + tplList + '</ul>' +
      '<div class="sa-ct-sec">Structură arhivă</div>' +
      '<div class="sa-ct-arch">' +
        '<span class="material-symbols-outlined" aria-hidden="true">folder_open</span>' +
        countArchFolders(t.archiveTree) + ' foldere · sortare automată A.I.' +
        '<button class="btn btn--ghost sa-ct-arch__btn" type="button" data-arch-ct="' + esc(t.id) + '">Configurează</button>' +
      '</div>' +
      '<div class="sa-ct-sec">Dashboard (Acasă)</div>' +
      '<div class="sa-ct-arch">' +
        '<span class="material-symbols-outlined" aria-hidden="true">space_dashboard</span>' +
        ((t.dashboardLayout || []).length) + ' widget-uri · denumire: „' + esc(t.clientLabel || 'Client') + '"' +
        '<a class="btn btn--ghost sa-ct-arch__btn" href="super-admin-dashboard.html?ct=' + encodeURIComponent(t.id) +
          (getCurrentView() === 'superadmin' ? '&view=superadmin' : '') + '">Configurează</a>' +
      '</div>' +
      '<div class="sa-ct-foot"><span class="material-symbols-outlined" aria-hidden="true">apartment</span>' + n + (n === 1 ? ' client' : ' clienți') + ' cu acest tip</div>' +
    '</div>';
  }

  function countArchFolders(tree) {
    var n = 0;
    (tree || []).forEach(function walk(f) {
      n++;
      (f.children || []).forEach(walk);
    });
    return n;
  }

  function openClientTypeModal(root, t) {
    var blocks = activeVerticals().map(function (v) {
      var vChecked = t && (t.verticalIds || []).indexOf(v.id) !== -1;
      var tpls = templatesFor(v.id).map(function (x) {
        var tChecked = t && (t.defaultTemplateIds || []).indexOf(x.id) !== -1;
        return '<label class="checkbox"><input type="checkbox" data-ct-tpl data-vert="' + esc(v.id) + '" value="' + esc(x.id) + '"' +
          (tChecked ? ' checked' : '') + (vChecked ? '' : ' disabled') + '> ' + esc(x.name) + ' <small>(' + esc(x.frequency) + ')</small></label>';
      }).join('');
      return '<div class="sa-ct-vblock">' +
        '<label class="checkbox sa-ct-vblock__head"><input type="checkbox" data-ct-vert value="' + esc(v.id) + '"' + (vChecked ? ' checked' : '') + '> ' +
          '<span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span><b>' + esc(v.name) + '</b></label>' +
        '<div class="sa-ct-tpls">' + (tpls || '<span class="admin-table__muted">Fără șabloane — adaugă din „Fluxuri".</span>') + '</div>' +
      '</div>';
    }).join('');
    saModal({
      title: t ? 'Editează tipul de client' : 'Tip de client nou',
      subtitle: 'Clienții de acest tip primesc la înrolare verticalele bifate, cu șabloanele implicite selectate.',
      bodyHtml:
        fieldHtml('Denumire tip', '<input type="text" class="input" data-f="name" value="' + esc(t ? t.name : '') + '" placeholder="ex. Cabinet de consultanță fiscală">') +
        fieldHtml('Pictogramă', iconPickerHtml(CT_ICONS, t ? t.icon : CT_ICONS[0])) +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(t ? t.description || '' : '') + '</textarea>') +
        '<div class="sa-form-2col">' +
          fieldHtml('Denumirea părții externe (singular)', '<input type="text" class="input" data-f="clientLabel" value="' + esc(t ? t.clientLabel || '' : '') + '" placeholder="ex. Client, Instituție, Customer">',
            'Cum sunt numiți clienții în aplicație pentru acest tip.') +
          fieldHtml('Denumirea părții externe (plural)', '<input type="text" class="input" data-f="clientLabelPlural" value="' + esc(t ? t.clientLabelPlural || '' : '') + '" placeholder="ex. Clienți, Instituții">') +
        '</div>' +
        '<div class="form-field"><label class="form-label">Verticale și șabloane implicite</label>' + blocks + '</div>',
      wide: true,
      submitLabel: t ? 'Salvează modificările' : 'Creează tipul',
      onOpen: function (m) {
        bindIconPicker(m);
        m.querySelectorAll('[data-ct-vert]').forEach(function (cb) {
          cb.addEventListener('change', function () {
            m.querySelectorAll('[data-ct-tpl][data-vert="' + cb.value + '"]').forEach(function (tp) {
              tp.disabled = !cb.checked;
              tp.checked = cb.checked; /* verticală nou-bifată → implicit toate șabloanele ei */
            });
          });
        });
      },
      onSubmit: function (m, close) {
        var name = fval(m, 'name');
        if (!name) { toast('error', 'Denumirea tipului este obligatorie.'); return; }
        var vids = Array.prototype.filter.call(m.querySelectorAll('[data-ct-vert]'), function (c) { return c.checked; })
          .map(function (c) { return c.value; });
        if (!vids.length) { toast('error', 'Selectează cel puțin o verticală.'); return; }
        var tids = Array.prototype.filter.call(m.querySelectorAll('[data-ct-tpl]'), function (c) { return c.checked && !c.disabled; })
          .map(function (c) { return c.value; });
        if (!tids.length) { toast('error', 'Selectează cel puțin un șablon implicit.'); return; }
        var clientLabel = fval(m, 'clientLabel') || 'Client';
        var rec = {
          id: t ? t.id : uid('ct', name, clientTypesAll()),
          builtin: t ? !!t.builtin : false,
          name: name,
          icon: pickedIcon(m, 'category'),
          description: fval(m, 'description'),
          verticalIds: vids,
          defaultTemplateIds: tids,
          archiveTree: t ? (t.archiveTree || []) : window.scripticaDefaultArchiveTree(),
          clientLabel: clientLabel,
          clientLabelPlural: fval(m, 'clientLabelPlural') || (clientLabel + 'i'),
          /* tip nou → dashboard de pornire: un widget per verticală + genericele */
          dashboardLayout: t ? (t.dashboardLayout || []) : vids.map(function (vid, i) {
            return { id: 'dw_' + Date.now().toString(36) + '_' + i, widget: 'flow_summary', params: { verticalId: vid }, size: 'half' };
          }).concat([
            { id: 'dw_' + Date.now().toString(36) + '_t', widget: 'termene', size: 'half' },
            { id: 'dw_' + Date.now().toString(36) + '_c', widget: 'clienti', size: 'full' }
          ])
        };
        scripticaFlowSave('clientType', rec);
        close();
        toast('success', t ? 'Tipul de client a fost actualizat.' : 'Tipul „' + name + '" a fost creat.');
        renderClientTypes(root);
      }
    });
  }

  /* ============================================================
     STRUCTURĂ ARHIVĂ — editorul arborelui de foldere al unui tip
     de client. Fiecare folder declară tipurile de documente pe care
     le ține (regula de rutare a A.I.-ului local); un tip de document
     are un singur folder-destinație în arbore.
     ============================================================ */
  var archUidCounter = 0;
  function archUid() { return 'af_' + Date.now().toString(36) + '_' + (archUidCounter++); }

  function openArchiveModal(root, t) {
    if (!t) return;
    /* copie de lucru — se salvează doar la submit */
    var tree = JSON.parse(JSON.stringify(
      (t.archiveTree && t.archiveTree.length) ? t.archiveTree : window.scripticaDefaultArchiveTree()
    ));

    /* Dropdown-ul oferă tipurile de documente ale verticalelor tipului
       + cele generice (domain null). */
    var domains = (t.verticalIds || []).map(function (vid) {
      var v = verticalById(vid);
      return v ? v.domain : null;
    }).filter(Boolean);
    var allowedTypes = window.scripticaDocumentTypes().filter(function (dt) {
      return !dt.domain || domains.indexOf(dt.domain) !== -1;
    });

    function findNode(nodes, id, parent, depth) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) return { node: nodes[i], parent: parent, list: nodes, index: i, depth: depth || 1 };
        var hit = findNode(nodes[i].children || [], id, nodes[i], (depth || 1) + 1);
        if (hit) return hit;
      }
      return null;
    }
    function usedTypeIds() {
      var used = [];
      (function walk(nodes) {
        nodes.forEach(function (f) {
          used = used.concat(f.docTypeIds || []);
          walk(f.children || []);
        });
      })(tree);
      return used;
    }

    function folderRowHtml(f, depth) {
      var used = usedTypeIds();
      var chips = (f.docTypeIds || []).map(function (id) {
        var dt = window.scripticaDocTypeById(id);
        return '<span class="pill admin-anexa-chip">' + esc(dt ? dt.name : id) +
          '<button type="button" class="admin-anexa-chip__remove" data-arch-rmtype="' + esc(id) + '" data-node="' + esc(f.id) + '" aria-label="Elimină tipul" title="Elimină tipul">' +
            '<span class="material-symbols-outlined" aria-hidden="true">close</span></button></span>';
      }).join('');
      var avail = allowedTypes.filter(function (dt) { return used.indexOf(dt.id) === -1; });
      var typesUi = f.system
        ? '<div class="sa-arch-row__system"><span class="material-symbols-outlined" aria-hidden="true">smart_toy</span>' +
            'Primește automat documentele pe care A.I. nu le recunoaște. Nu poate fi șters.</div>'
        : '<div class="sa-arch-row__types">' + chips +
            '<select class="select sa-arch-row__select" data-arch-addtype data-node="' + esc(f.id) + '">' +
              '<option value="">+ Adaugă tip de document...</option>' +
              avail.map(function (dt) { return '<option value="' + esc(dt.id) + '">' + esc(dt.name) + '</option>'; }).join('') +
            '</select>' +
          '</div>';
      var actions = f.system ? '' :
        (depth < 3 ? '<button type="button" class="sa-mini-btn" data-arch-addchild data-node="' + esc(f.id) + '" title="Adaugă subfolder"><span class="material-symbols-outlined" aria-hidden="true">create_new_folder</span></button>' : '') +
        '<button type="button" class="sa-mini-btn sa-mini-btn--danger" data-arch-del data-node="' + esc(f.id) + '" title="Șterge folderul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>';
      return '<div class="sa-arch-row sa-arch-row--d' + depth + (f.system ? ' sa-arch-row--system' : '') + '">' +
        '<div class="sa-arch-row__head">' +
          '<span class="material-symbols-outlined sa-arch-row__folder" aria-hidden="true">' + (f.system ? 'inbox' : 'folder') + '</span>' +
          '<input type="text" class="input sa-arch-row__name" data-arch-name data-node="' + esc(f.id) + '" value="' + esc(f.name) + '" placeholder="Numele folderului"' + (f.system ? ' disabled' : '') + '>' +
          '<span class="sa-arch-row__actions">' + actions + '</span>' +
        '</div>' +
        typesUi +
      '</div>' +
      (f.children || []).map(function (c) { return folderRowHtml(c, depth + 1); }).join('');
    }

    function renderTree(m) {
      m.querySelector('[data-arch-tree]').innerHTML =
        tree.map(function (f) { return folderRowHtml(f, 1); }).join('');
    }

    saModal({
      title: 'Structură arhivă — ' + t.name,
      subtitle: 'Sistemul de foldere primit implicit de clienții acestui tip. A.I. (LLM-ul local) mută automat fiecare document intrat în folderul care îi declară tipul.',
      wide: true,
      bodyHtml:
        '<div class="sa-arch-note"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>' +
          'Un tip de document are un singur folder-destinație. Subfolderele participă la rutare împreună cu părintele; ce nu e recunoscut ajunge în „Necategorisit".</div>' +
        '<div class="sa-arch-tree" data-arch-tree></div>' +
        '<button type="button" class="btn btn--secondary" data-arch-addroot><span class="material-symbols-outlined" aria-hidden="true">create_new_folder</span>Folder nou</button>',
      submitLabel: 'Salvează structura',
      onOpen: function (m) {
        renderTree(m);
        m.querySelector('[data-arch-addroot]').addEventListener('click', function () {
          /* folderul de sistem rămâne ultimul */
          var sysIdx = tree.findIndex(function (f) { return f.system; });
          var node = { id: archUid(), name: '', docTypeIds: [], children: [] };
          if (sysIdx === -1) tree.push(node); else tree.splice(sysIdx, 0, node);
          renderTree(m);
        });
        var cont = m.querySelector('[data-arch-tree]');
        cont.addEventListener('input', function (e) {
          var inp = e.target.closest('[data-arch-name]');
          if (!inp) return;
          var hit = findNode(tree, inp.getAttribute('data-node'));
          if (hit) hit.node.name = inp.value;
        });
        cont.addEventListener('change', function (e) {
          var sel = e.target.closest('[data-arch-addtype]');
          if (!sel || !sel.value) return;
          var hit = findNode(tree, sel.getAttribute('data-node'));
          if (hit) { hit.node.docTypeIds = (hit.node.docTypeIds || []).concat([sel.value]); renderTree(m); }
        });
        cont.addEventListener('click', function (e) {
          var b;
          if ((b = e.target.closest('[data-arch-rmtype]'))) {
            var hit1 = findNode(tree, b.getAttribute('data-node'));
            if (hit1) {
              var rid = b.getAttribute('data-arch-rmtype');
              hit1.node.docTypeIds = (hit1.node.docTypeIds || []).filter(function (x) { return x !== rid; });
              renderTree(m);
            }
          } else if ((b = e.target.closest('[data-arch-addchild]'))) {
            var hit2 = findNode(tree, b.getAttribute('data-node'));
            if (hit2) {
              hit2.node.children = hit2.node.children || [];
              hit2.node.children.push({ id: archUid(), name: '', docTypeIds: [], children: [] });
              renderTree(m);
            }
          } else if ((b = e.target.closest('[data-arch-del]'))) {
            var hit3 = findNode(tree, b.getAttribute('data-node'));
            if (hit3) { hit3.list.splice(hit3.index, 1); renderTree(m); }
          }
        });
      },
      onSubmit: function (m, close) {
        var invalid = false;
        (function walk(nodes) {
          nodes.forEach(function (f) {
            if (!String(f.name || '').trim()) invalid = true;
            walk(f.children || []);
          });
        })(tree);
        if (invalid) { toast('error', 'Toate folderele trebuie să aibă un nume.'); return; }
        if (!tree.some(function (f) { return !f.system; })) { toast('error', 'Structura are nevoie de cel puțin un folder în afară de „Necategorisit".'); return; }
        if (!tree.some(function (f) { return f.system; })) {
          tree.push({ id: archUid(), name: 'Necategorisit', system: true, docTypeIds: [], children: [] });
        }
        scripticaFlowSave('clientType', Object.assign({}, t, { archiveTree: tree }));
        close();
        toast('success', 'Structura de arhivă pentru „' + t.name + '" a fost salvată.');
        renderClientTypes(root);
      }
    });
  }

  function confirmDeleteClientType(root, t) {
    if (!t) return;
    saModal({
      title: 'Șterge tipul „' + t.name + '"?',
      bodyHtml: '<p class="sa-modal-note">Tipul nu este folosit de niciun client. Acțiunea nu poate fi anulată.</p>',
      submitLabel: 'Șterge definitiv', critical: true,
      onSubmit: function (m, close) {
        scripticaFlowDelete('clientType', t.id);
        close();
        toast('success', 'Tipul de client a fost șters.');
        renderClientTypes(root);
      }
    });
  }

  /* ============================================================
     DASHBOARD BUILDER — layout-ul de Acasă per tip de client.
     Paletă în stânga (widget-urile permise de verticalele tipului),
     preview live în dreapta (aceleași renderere ca pe Acasă, prin
     SCRIPTICA_WIDGETS). Reordonare prin drag & drop; size half/full.
     ============================================================ */
  function renderDashboardBuilder(root) {
    var ct = clientTypeById(qs('ct'));
    if (!ct || !window.SCRIPTICA_WIDGETS) {
      root.innerHTML = '<p class="sa-subtitle">Tipul de client nu a fost găsit. <a href="super-admin-tipuri-clienti.html' + vq() + '">Înapoi la Tipuri de clienți</a></p>';
      return;
    }
    markTipuriNavActive();
    var layout = JSON.parse(JSON.stringify(ct.dashboardLayout || []));
    var palette = window.SCRIPTICA_WIDGETS.paletteFor(ct);
    var dragIdx = null;

    function normParams(p) { return (p && Object.keys(p).length) ? p : null; }
    function keyOf(w, p) { return w + '|' + JSON.stringify(normParams(p)); }
    function placedKeys() { return layout.map(function (it) { return keyOf(it.widget, it.params); }); }

    function paletteHtml() {
      var placed = placedKeys();
      return palette.map(function (p, i) {
        var isPlaced = placed.indexOf(keyOf(p.widget, p.params)) !== -1;
        return '<button type="button" class="sa-dwb-pal' + (isPlaced ? ' is-placed' : '') + '" data-pal-add="' + i + '"' + (isPlaced ? ' disabled' : '') + '>' +
          '<span class="material-symbols-outlined sa-dwb-pal__ico" aria-hidden="true">' + esc(p.icon) + '</span>' +
          '<span class="sa-dwb-pal__main"><b>' + esc(p.label) + '</b><small>' + esc(p.desc) + '</small></span>' +
          '<span class="material-symbols-outlined sa-dwb-pal__add" aria-hidden="true">' + (isPlaced ? 'check' : 'add') + '</span>' +
        '</button>';
      }).join('');
    }

    function previewHtml() {
      if (!layout.length) {
        return '<div class="sa-dwb-empty"><span class="material-symbols-outlined" aria-hidden="true">space_dashboard</span>' +
          'Dashboard gol — adaugă cutii de conținut din paleta din stânga.</div>';
      }
      return layout.map(function (item, i) {
        return '<div class="sa-dwb-item' + (item.size === 'full' ? ' dw-card--full' : '') + '" draggable="true" data-idx="' + i + '">' +
          '<div class="sa-dwb-item__bar">' +
            '<span class="material-symbols-outlined sa-dwb-item__grip" aria-hidden="true">drag_indicator</span>' +
            '<span class="sa-dwb-item__hint">trage pentru a repoziționa</span>' +
            '<button type="button" class="sa-mini-btn" data-dwb-size="' + i + '" title="' + (item.size === 'full' ? 'Fă-l pe jumătate de rând' : 'Fă-l pe tot rândul') + '">' +
              '<span class="material-symbols-outlined" aria-hidden="true">' + (item.size === 'full' ? 'collapse_content' : 'expand_content') + '</span></button>' +
            '<button type="button" class="sa-mini-btn sa-mini-btn--danger" data-dwb-remove="' + i + '" title="Elimină widget-ul">' +
              '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
          '</div>' +
          window.SCRIPTICA_WIDGETS.cardHtml(item, ct) +
        '</div>';
      }).join('');
    }

    function draw() {
      root.querySelector('[data-dwb-palette]').innerHTML = paletteHtml();
      root.querySelector('[data-dwb-grid]').innerHTML = previewHtml();
    }

    root.innerHTML =
      '<div class="sa-crumb"><a href="super-admin-tipuri-clienti.html' + vq() + '">Tipuri de clienți</a> › ' + esc(ct.name) + ' · Dashboard</div>' +
      '<header class="page-header"><h1 class="page-header__title">Dashboard — ' + esc(ct.name) + '</h1>' +
        '<button class="btn btn--primary" type="button" id="dwb-save"><span class="material-symbols-outlined" aria-hidden="true">save</span>Salvează layout-ul</button>' +
      '</header>' +
      '<p class="sa-subtitle">Adaugă cutii de conținut din paletă și aranjează-le prin tragere în preview. Clienții de tip „' + esc(ct.name) + '" primesc acest dashboard pe Acasă. Paleta oferă doar conținutul acoperit de verticalele tipului.</p>' +
      '<div class="sa-dwb">' +
        '<aside class="sa-dwb-palette"><div class="sa-dwb-palette__title">Cutii de conținut</div><div data-dwb-palette></div></aside>' +
        '<div class="sa-dwb-preview"><div class="dw-grid" data-dwb-grid></div></div>' +
      '</div>';
    draw();

    root.querySelector('#dwb-save').addEventListener('click', function () {
      scripticaFlowSave('clientType', Object.assign({}, clientTypeById(ct.id) || ct, { dashboardLayout: layout }));
      toast('success', 'Layout-ul de dashboard pentru „' + ct.name + '" a fost salvat.');
    });

    root.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-pal-add]'))) {
        var p = palette[parseInt(b.getAttribute('data-pal-add'), 10)];
        if (!p) return;
        layout.push({
          id: 'dw_' + Date.now().toString(36) + '_' + layout.length,
          widget: p.widget,
          params: normParams(p.params) || undefined,
          size: p.widget === 'clienti' ? 'full' : 'half'
        });
        draw();
      } else if ((b = e.target.closest('[data-dwb-size]'))) {
        var i1 = parseInt(b.getAttribute('data-dwb-size'), 10);
        layout[i1].size = layout[i1].size === 'full' ? 'half' : 'full';
        draw();
      } else if ((b = e.target.closest('[data-dwb-remove]'))) {
        layout.splice(parseInt(b.getAttribute('data-dwb-remove'), 10), 1);
        draw();
      }
    });

    /* drag & drop de reordonare — mutarea se aplică la drop, redraw o dată */
    var overIdx = null;
    root.addEventListener('dragstart', function (e) {
      var item = e.target.closest('.sa-dwb-item');
      if (!item) return;
      dragIdx = parseInt(item.getAttribute('data-idx'), 10);
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(dragIdx)); } catch (err) {}
      item.classList.add('is-dragging');
    });
    root.addEventListener('dragover', function (e) {
      var item = e.target.closest('.sa-dwb-item');
      if (!item || dragIdx == null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      var idx = parseInt(item.getAttribute('data-idx'), 10);
      if (idx !== overIdx) {
        root.querySelectorAll('.sa-dwb-item').forEach(function (x) { x.classList.remove('is-over'); });
        if (idx !== dragIdx) item.classList.add('is-over');
        overIdx = idx;
      }
    });
    root.addEventListener('drop', function (e) {
      var item = e.target.closest('.sa-dwb-item');
      if (!item || dragIdx == null) return;
      e.preventDefault();
      var to = parseInt(item.getAttribute('data-idx'), 10);
      if (to !== dragIdx) {
        var moved = layout.splice(dragIdx, 1)[0];
        layout.splice(to, 0, moved);
      }
      dragIdx = null; overIdx = null;
      draw();
    });
    root.addEventListener('dragend', function () {
      dragIdx = null; overIdx = null;
      root.querySelectorAll('.sa-dwb-item').forEach(function (x) { x.classList.remove('is-dragging', 'is-over'); });
    });
  }

  /* builder-ul aparține secțiunii „Tipuri de clienți" în rail */
  function markTipuriNavActive() {
    var nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(function (it) {
      var is = (it.getAttribute('href') || '').indexOf('super-admin-tipuri-clienti') === 0;
      it.classList.toggle('nav-item--active', is);
      var icon = it.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.toggle('filled', is);
    });
  }

  /* ============================================================
     ÎNROLARE CLIENT NOU — provisioning din tipul de client
     ============================================================ */
  function openNewClientModal(root) {
    var ctOptions = clientTypesAll().map(function (t) {
      return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
    }).join('');
    saModal({
      title: 'Cont de business nou',
      subtitle: 'La creare, clientul primește automat fluxurile tipului ales (copii editabile în Administrare).',
      bodyHtml:
        fieldHtml('Denumire firmă', '<input type="text" class="input" data-f="name" placeholder="ex. FiscalPro S.R.L.">') +
        fieldHtml('Tip de client', '<select class="select" data-f="ctype"><option value="">Selectează tipul...</option>' + ctOptions + '</select>',
          'Determină verticalele și șabloanele provisionate la înrolare.') +
        fieldHtml('Plan', '<select class="select" data-f="tier"><option value="baza">Bază</option><option value="plus" selected>Plus</option><option value="ent">Enterprise</option></select>') +
        '<div data-ct-preview class="sa-ct-preview"></div>',
      submitLabel: 'Creează contul',
      onOpen: function (m) {
        var sel = m.querySelector('[data-f="ctype"]');
        var prev = m.querySelector('[data-ct-preview]');
        sel.addEventListener('change', function () {
          var t = clientTypeById(sel.value);
          if (!t) { prev.innerHTML = ''; return; }
          var vs = (t.verticalIds || []).map(verticalById).filter(Boolean)
            .map(function (v) { return v.name; }).join(' · ');
          prev.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">downloading</span>' +
            'Se vor provisiona: <b>' + esc(vs) + '</b> cu ' + (t.defaultTemplateIds || []).length + ' șabloane implicite.';
        });
      },
      onSubmit: function (m, close) {
        var name = fval(m, 'name');
        var t = clientTypeById(m.querySelector('[data-f="ctype"]').value);
        if (!name) { toast('error', 'Denumirea firmei este obligatorie.'); return; }
        if (!t) { toast('error', 'Selectează tipul de client.'); return; }
        var tier = m.querySelector('[data-f="tier"]').value;
        var hasAudit = (t.verticalIds || []).indexOf('vert_audit') !== -1;
        var rec = {
          id: uid('cli', name, clients()), name: name, domain: t.name, clientTypeId: t.id,
          instance: slugify(name).replace(/_/g, '') + '.scriptica.ro',
          users: 1, enrolled: '20.04.2026', tier: tier, contract: 'activ', aiLoad: 5,
          commercial: {
            plan: TIER[tier].label, renew: '20.04.2027',
            billing: tier === 'baza' ? 'Lunar · 390 RON' : tier === 'plus' ? 'Anual · 4.800 RON' : 'Anual · 12.000 RON',
            lastPay: '20.04.2026'
          },
          flags: [
            { name: 'Sortare automată A.I.', tier: 'Plus', on: tier !== 'baza' },
            { name: 'Mesaje smart', tier: 'Plus', on: tier !== 'baza' },
            { name: 'Constructor de Anexe', tier: 'Standard', on: true },
            { name: 'Vertical Audit', tier: 'Enterprise', on: hasAudit },
            { name: 'Backup local', tier: 'Plus · add-on', on: false }
          ],
          technical: { vmLoad: [4, 6, 5, 9, 7, 6, 4, 3], vmPeakIdx: 3, aiPerMonth: '0', docsStored: '0', uptime30: 100, lastIncident: '—' },
          downtime: { incidents: [] }
        };
        scripticaFlowSave('saClient', rec);
        close();
        toast('success', 'Contul „' + name + '" a fost creat — fluxurile tipului „' + t.name + '" au fost provisionate.');
        renderClients(root);
      }
    });
  }

  /* Fluxurile provisionate ale unui client — derivate din tipul său. */
  function provisionedFlowsHtml(c) {
    var t = clientTypeById(c.clientTypeId);
    if (!t) return '';
    var inner = (t.verticalIds || []).map(verticalById).filter(Boolean).map(function (v) {
      var tpls = (t.defaultTemplateIds || []).map(templateById).filter(function (x) { return x && x.verticalId === v.id; });
      return '<div class="sa-prov-vert">' +
        '<div class="sa-prov-vert__head"><span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span>' + esc(v.name) + '</div>' +
        '<ul class="sa-ct-tpllist">' + tpls.map(function (x) { return '<li>' + esc(x.name) + ' <small>(' + esc(x.frequency) + ')</small></li>'; }).join('') + '</ul>' +
      '</div>';
    }).join('');
    return '<div class="sa-sec">' +
      '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">account_tree</span>Fluxuri provisionate' +
        '<button class="btn btn--ghost sa-sec__action" type="button" data-change-ct>Schimbă tipul</button></div>' +
      kv('Tip client', ctPill(c.clientTypeId)) +
      inner +
      '<div class="sa-dt-hint"><span class="material-symbols-outlined" aria-hidden="true">info</span>' +
        'Copiate la înrolare din tipul de client — clientul le poate adapta din Administrare.</div>' +
    '</div>';
  }

  function openChangeTypeModal(root, c) {
    var opts = clientTypesAll().map(function (t) {
      return '<option value="' + esc(t.id) + '"' + (t.id === c.clientTypeId ? ' selected' : '') + '>' + esc(t.name) + '</option>';
    }).join('');
    saModal({
      title: 'Schimbă tipul clientului',
      subtitle: c.name,
      bodyHtml: fieldHtml('Tip de client', '<select class="select" data-f="ctype">' + opts + '</select>',
        'Fluxurile noului tip se provisionează suplimentar; cele existente rămân la client.'),
      submitLabel: 'Salvează',
      onSubmit: function (m, close) {
        var t = clientTypeById(m.querySelector('[data-f="ctype"]').value);
        if (!t) return;
        scripticaFlowSave('saClient', Object.assign({}, c, { clientTypeId: t.id, domain: t.name }));
        close();
        toast('success', 'Tipul clientului a fost schimbat în „' + t.name + '".');
        renderClientDetail(root);
      }
    });
  }

  /* detail page: highlight the Clienți rail item (filename won't auto-match) */
  function markClientsNavActive() {
    var nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(function (it) {
      var isClients = (it.getAttribute('href') || '').indexOf('super-admin-clienti') === 0;
      it.classList.toggle('nav-item--active', isClients);
      var icon = it.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.toggle('filled', isClients);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-page');
    var root = document.getElementById('sa-root');
    if (!root || !SA()) return;
    if (page === 'super-admin') renderDashboard(root);
    else if (page === 'super-admin-clienti') renderClients(root);
    else if (page === 'super-admin-client') renderClientDetail(root);
    else if (page === 'super-admin-fluxuri') renderFluxuri(root);
    else if (page === 'super-admin-tipuri-clienti') renderClientTypes(root);
    else if (page === 'super-admin-dashboard') renderDashboardBuilder(root);
  });

})();
