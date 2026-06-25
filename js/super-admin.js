/* ============================================================
   Scriptica — Super Admin (zona Scriptica HQ)
   Controller unic pentru cele 3 ecrane (router pe body[data-page]):
     super-admin           → Dashboard global
     super-admin-clienti   → Listă clienți
     super-admin-client    → Detaliu client (comercial + tehnic)
   Date: window.SCRIPTICA_MOCK.superAdmin (mock din seed).
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
        '<td>' + tierPill(c.tier) + '</td>' +
        '<td>' + statusPill(c.contract) + '</td>' +
        '<td><div class="sa-load" title="' + c.aiLoad + '%"><span style="width:' + c.aiLoad + '%"></span></div></td>' +
        '<td class="admin-table__muted">' + esc(c.enrolled) + '</td>' +
        '<td style="text-align:right"><span class="sa-rowbtn" aria-hidden="true"><span class="material-symbols-outlined">chevron_right</span></span></td>' +
      '</tr>';
  }
  function clientsTable(list) {
    return '<div class="sa-table-card"><table class="admin-table">' +
      '<thead><tr><th>Client</th><th>Plan</th><th>Status contract</th><th>Încărcare A.I.</th><th>Înrolat</th><th></th></tr></thead>' +
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
    if (nb) nb.addEventListener('click', function () {
      console.log('[Scriptica] Cont de business nou — flux de înrolare, fază ulterioară.');
    });
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
            '<span><b>Domeniu:</b> ' + esc(c.domain) + '</span>' +
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
  });

})();
