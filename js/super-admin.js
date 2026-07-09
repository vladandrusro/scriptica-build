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

  /* ---- modal generic construit din JS (paginile HQ nu au markup static) ----
     Reproduce comportamentul modalelor statice: focus inițial, focus trap,
     restaurarea focusului la trigger, footer aliniat la dreapta. `opts.isDirty`
     (funcție) activează garda de modificări nesalvate pe Escape/backdrop/X. */
  var saModalTitleSeq = 0;
  function saModal(opts) {
    var overlay = document.createElement('div');
    var titleId = 'sa-modal-title-' + (++saModalTitleSeq);
    var lastTrigger = document.activeElement;
    overlay.className = 'modal is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.innerHTML =
      '<div class="modal__dialog' + (opts.wide ? ' modal__dialog--wide' : '') + '" role="document">' +
        '<button type="button" class="modal__close" data-modal-close aria-label="Închide fereastra">' +
          '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '<header class="modal__header">' +
          '<h2 class="modal__title" id="' + titleId + '">' + esc(opts.title) + '</h2>' +
          (opts.subtitle ? '<p class="modal__subtitle">' + esc(opts.subtitle) + '</p>' : '') +
        '</header>' +
        '<form class="modal__body" novalidate>' + opts.bodyHtml + '</form>' +
        '<footer class="modal__footer">' +
          '<span class="modal__footer-helper">' + esc(opts.footerHelper || '') + '</span>' +
          '<button type="button" class="btn btn--ghost" data-modal-cancel>Anulează</button>' +
          '<button type="button" class="btn ' + (opts.critical ? 'btn--critical' : 'btn--primary') + '" data-modal-submit>' + esc(opts.submitLabel || 'Salvează') + '</button>' +
        '</footer>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    var dialog = overlay.querySelector('.modal__dialog');

    function close() {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }
    /* garda de modificări nesalvate — confirmarea se deschide DEASUPRA
       modalului curent (overlay separat), fără să-l închidă */
    function guardedClose() {
      if (opts.isDirty && opts.isDirty()) {
        saModal({
          title: 'Renunți la modificările nesalvate?',
          bodyHtml: '<p class="sa-modal-note">Modificările din această fereastră nu au fost salvate și se vor pierde.</p>',
          submitLabel: 'Renunță la modificări', critical: true,
          onSubmit: function (m2, close2) { close2(); close(); }
        });
        return;
      }
      close();
    }
    function onKey(e) {
      if (!document.body.contains(overlay)) return;
      /* dacă o confirmare e deschisă peste noi, ea preia tastatura */
      var overlays = document.querySelectorAll('.modal.is-open');
      if (overlays[overlays.length - 1] !== overlay) return;
      if (e.key === 'Escape') { e.preventDefault(); guardedClose(); }
      else if (e.key === 'Tab') trapFocus(e, dialog);
    }
    document.addEventListener('keydown', onKey);
    overlay.querySelector('[data-modal-close]').addEventListener('click', guardedClose);
    overlay.querySelector('[data-modal-cancel]').addEventListener('click', guardedClose);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) guardedClose(); });
    overlay.querySelector('[data-modal-submit]').addEventListener('click', function (e) {
      e.preventDefault();
      if (opts.onSubmit) opts.onSubmit(overlay, close);
    });
    if (opts.onOpen) opts.onOpen(overlay, close);
    /* focus inițial: primul control din corp, altfel butonul de submit */
    setTimeout(function () {
      var first = dialog.querySelector('.modal__body input:not([disabled]), .modal__body select:not([disabled]), .modal__body textarea:not([disabled]), .modal__body button:not([disabled])') ||
        dialog.querySelector('[data-modal-submit]');
      if (first) first.focus();
    }, 0);
    return { el: overlay, close: close };
  }

  function trapFocus(e, container) {
    if (!container) return;
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function fieldHtml(label, controlHtml, help, name) {
    return '<div class="form-field"' + (name ? ' data-field="' + esc(name) + '"' : '') + '>' +
      '<label class="form-label">' + esc(label) + '</label>' +
      controlHtml +
      (help ? '<span class="form-helper">' + esc(help) + '</span>' : '') +
      '<span class="form-error" role="alert"></span>' +
    '</div>';
  }
  /* validare inline — același pattern ca setError din misiuni-audit.js */
  function setFieldError(root, name, msg) {
    var f = root.querySelector('[data-field="' + name + '"]');
    if (!f) return;
    f.classList.toggle('has-error', !!msg);
    var el = f.querySelector('.form-error');
    if (el) el.textContent = msg || '';
  }
  function clearFieldErrors(root) {
    root.querySelectorAll('.form-field.has-error').forEach(function (f) {
      f.classList.remove('has-error');
    });
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
        '<td style="text-align:right"><a class="sa-rowbtn" href="super-admin-client.html?id=' + esc(c.id) +
          (getCurrentView() === 'superadmin' ? '&view=superadmin' : '') + '" aria-label="Deschide clientul ' + esc(c.name) + '">' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></a></td>' +
      '</tr>';
  }
  function clientsTable(list) {
    return '<div class="sa-table-card"><table class="admin-table">' +
      '<thead><tr><th>Client</th><th>Tip client</th><th>Plan</th><th>Status contract</th><th>Încărcare A.I.</th><th>Înrolat</th><th></th></tr></thead>' +
      '<tbody>' + list.map(clientRow).join('') + '</tbody></table></div>';
  }
  function bindRows(root) {
    root.querySelectorAll('.sa-row').forEach(function (tr) {
      tr.addEventListener('click', function (e) {
        if (e.target.closest('a')) return; /* chevronul e link real (focusabil) */
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
        '<button class="btn btn--primary" type="button" id="sa-new-client">Cont de business nou' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
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
        '<button class="btn btn--primary" type="button" data-new-vert>Verticală nouă' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
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
    /* compat: vechiul deep link ?cols=<verticalId> duce acum la builderul
       de tabel dedicat */
    if (qs('cols')) {
      window.location.replace('super-admin-tabel.html?vertical=' + encodeURIComponent(qs('cols')) +
        (getCurrentView() === 'superadmin' ? '&view=superadmin' : ''));
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
      ? '<span class="pill pill--neutral">Predefinită</span>'
      : '<span class="pill pill--purple">Personalizată</span>';
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
        '<div class="sa-flow-foot__actions">' +
          '<button class="btn btn--secondary" type="button" data-add-tpl="' + esc(v.id) + '">Șablon nou<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
          '<a class="btn btn--ghost" href="super-admin-tabel.html?vertical=' + encodeURIComponent(v.id) + (getCurrentView() === 'superadmin' ? '&view=superadmin' : '') + '">Coloanele tabelului<span class="material-symbols-outlined" aria-hidden="true">view_column</span></a>' +
        '</div>' +
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
      fieldHtml('Denumire verticală', '<input type="text" class="input" data-f="name" value="' + esc(v ? v.name : '') + '" placeholder="ex. Consultanță Fiscală">', null, 'nume') +
      '<div class="sa-form-2col">' +
        fieldHtml('Element de lucru (singular)', '<input type="text" class="input" data-f="itemLabel" value="' + esc(v ? v.itemLabel || '' : '') + '" placeholder="ex. Dosar">', 'Cum se numește un element din verticală.') +
        fieldHtml('Element de lucru (plural)', '<input type="text" class="input" data-f="itemLabelPlural" value="' + esc(v ? v.itemLabelPlural || '' : '') + '" placeholder="ex. Dosare">') +
      '</div>' +
      fieldHtml('Pictogramă', iconPickerHtml(VERTICAL_ICONS, v ? v.icon : VERTICAL_ICONS[0])) +
      fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(v ? v.description || '' : '') + '</textarea>') +
      '<div class="form-field" data-field="etape">' +
        '<label class="form-label">Etapele ciclului de viață</label>' +
        '<span class="form-helper">Forma fluxului: fiecare element trece prin aceste etape, în ordine. Termenele per etapă se stabilesc pe șabloane.</span>' +
        '<div class="sa-lc-rows" data-lc-rows>' + lc.map(lcRowHtml).join('') + '</div>' +
        '<button type="button" class="btn btn--ghost" data-lc-add>Adaugă etapă<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
        '<span class="form-error" role="alert"></span>' +
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
        clearFieldErrors(m);
        var name = fval(m, 'name');
        var lcNames = Array.prototype.map.call(m.querySelectorAll('[data-lc-name]'), function (i) { return i.value.trim(); }).filter(Boolean);
        setFieldError(m, 'nume', name ? '' : 'Denumirea verticalei este obligatorie.');
        setFieldError(m, 'etape', lcNames.length >= 2 ? '' : 'Definește cel puțin două etape ale ciclului de viață.');
        if (!name || lcNames.length < 2) return;
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
        if (v && v.listView) rec.listView = v.listView; /* păstrăm coloanele configurate */
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

  /* Elemente de flux active la clienți — blochează ștergerile care le-ar
     lăsa fără șablon/verticală (timeline gol, item de neterminat). */
  function activeFlowItems(pred) {
    return ((window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.flowItems) || []).filter(function (i) {
      return i.status !== 'finalizat' && i.status !== 'anulata' && pred(i);
    });
  }
  function blockedDeleteModal(title, count) {
    saModal({
      title: title,
      bodyHtml: '<p class="sa-modal-note">' + count + (count === 1 ? ' element activ al clienților folosește' : ' elemente active ale clienților folosesc') +
        ' această configurație. Finalizează-le înainte de ștergere — altfel ar rămâne blocate, fără etape.</p>',
      submitLabel: 'Am înțeles',
      onSubmit: function (m, close) { close(); }
    });
  }

  function confirmDeleteVertical(root, v) {
    if (!v) return;
    var active = activeFlowItems(function (i) { return i.verticalId === v.id; });
    if (active.length) { blockedDeleteModal('Verticala nu poate fi ștearsă', active.length); return; }
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
        fieldHtml('Denumire șablon', '<input type="text" class="input" data-f="name" value="' + esc(t ? t.name : '') + '" placeholder="ex. Opinie fiscală punctuală">', null, 'nume') +
        fieldHtml('Frecvență', '<select class="select" data-f="frequency">' + freqOptions + '</select>') +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(t ? t.description || '' : '') + '</textarea>') +
        '<div class="form-field" data-field="termene"><label class="form-label">Termene pe etapele verticalei</label>' + stepRows +
          '<span class="form-error" role="alert"></span></div>',
      submitLabel: t ? 'Salvează modificările' : 'Creează șablonul',
      onSubmit: function (m, close) {
        clearFieldErrors(m);
        var name = fval(m, 'name');
        var offs = Array.prototype.map.call(m.querySelectorAll('[data-tpl-off]'), function (i) { return parseInt(i.value, 10); });
        var offsBad = offs.some(function (n) { return !n || n < 1; });
        setFieldError(m, 'nume', name ? '' : 'Denumirea șablonului este obligatorie.');
        setFieldError(m, 'termene', offsBad ? 'Completează termenul (în zile) pentru fiecare etapă.' : '');
        if (!name || offsBad) return;
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
    var active = activeFlowItems(function (i) { return i.templateId === t.id; });
    if (active.length) { blockedDeleteModal('Șablonul nu poate fi șters', active.length); return; }
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
     BUILDER DE TABEL — „expresia în tabel" a unei verticale, editată
     într-un mediu simulat: paleta de coloane în stânga, în dreapta
     pagina clientului recreată (antet, filtre decorative, tabel cu
     date pregenerate, paginare). Coloanele se mută și se scot direct
     din capul tabelului simulat.
     ============================================================ */
  function renderTableBuilder(root) {
    var v = verticalById(qs('vertical'));
    if (!v || !window.SCRIPTICA_LISTVIEW) {
      root.innerHTML = '<p class="sa-subtitle">Verticala nu a fost găsită. <a href="super-admin-fluxuri.html' + vq() + '">Înapoi la Fluxuri</a></p>';
      return;
    }
    markFluxuriNavActive();
    var LV = window.SCRIPTICA_LISTVIEW;
    var cols = LV.effectiveFor(v).slice();
    var savedSnapshot = JSON.stringify(cols);
    var samples = LV.sampleItems(v, 6);

    function isDirty() { return JSON.stringify(cols) !== savedSnapshot; }
    function markDirty() {
      var btn = root.querySelector('#tbl-save');
      if (btn) btn.classList.toggle('is-dirty', isDirty());
    }
    window.addEventListener('beforeunload', function (e) {
      if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });

    function paletteHtml() {
      return LV.availableFor(v).map(function (c) {
        var placed = cols.indexOf(c.id) !== -1;
        return '<button type="button" class="sa-dwb-pal' + (placed ? ' is-placed' : '') + '" data-tbl-add="' + esc(c.id) + '"' + (placed ? ' disabled' : '') + '>' +
          '<span class="material-symbols-outlined sa-dwb-pal__ico" aria-hidden="true">' + esc(c.icon || 'view_column') + '</span>' +
          '<span class="sa-dwb-pal__main"><b>' + esc(c.label(v)) + '</b><small>' + esc(c.desc) + '</small></span>' +
          '<span class="material-symbols-outlined sa-dwb-pal__add" aria-hidden="true">' + (placed ? 'check' : 'add') + '</span>' +
        '</button>';
      }).join('');
    }

    /* capul de tabel al simulării — etichete + controale de manipulare directă */
    function simHeaderHtml() {
      var ths = '<th style="width:44px;"></th>';
      cols.forEach(function (id, i) {
        var c = LV.colById(id);
        if (!c) return;
        ths += '<th' + (c.width ? ' style="width:' + c.width + 'px;"' : '') + '>' +
          '<span class="sa-th"><span class="sa-th__label">' + esc(c.label(v)) + '</span>' +
          '<span class="sa-th__ctrl">' +
            '<button type="button" class="sa-th-btn" data-tbl-move="-1" data-i="' + i + '" title="Mută spre stânga"' + (i === 0 ? ' disabled' : '') + '>' +
              '<span class="material-symbols-outlined" aria-hidden="true">chevron_left</span></button>' +
            '<button type="button" class="sa-th-btn" data-tbl-move="1" data-i="' + i + '" title="Mută spre dreapta"' + (i === cols.length - 1 ? ' disabled' : '') + '>' +
              '<span class="material-symbols-outlined" aria-hidden="true">chevron_right</span></button>' +
            '<button type="button" class="sa-th-btn sa-th-btn--danger" data-tbl-remove="' + i + '" title="Scoate coloana"' + (cols.length <= 2 ? ' disabled' : '') + '>' +
              '<span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
          '</span></span></th>';
      });
      return '<tr>' + ths + '</tr>';
    }

    function simHtml() {
      var vv = Object.assign({}, v, { listView: cols });
      var rows = samples.map(function (n) {
        return '<tr class="sit-row"><td class="sit-cell--chevron"><span class="material-symbols-outlined" aria-hidden="true">expand_more</span></td>' +
          LV.cellsHtml(vv, n) + '</tr>';
      }).join('');
      return '<div class="sa-tbl-sim__chrome">' +
          '<span class="material-symbols-outlined" aria-hidden="true">visibility</span>' +
          'Simulare — așa va arăta pagina pentru clienți (date de exemplu)' +
        '</div>' +
        '<div class="sa-tbl-sim__page">' +
          '<div class="sa-tbl-sim__header">' +
            '<span class="sa-tbl-sim__title">' + esc(v.name) + '</span>' +
            '<span class="btn btn--primary sa-tbl-sim__inert">Adaugă<span class="material-symbols-outlined" aria-hidden="true">add</span></span>' +
          '</div>' +
          '<div class="sa-tbl-sim__filters">' +
            '<span class="sa-tbl-sim__search"><span class="material-symbols-outlined" aria-hidden="true">search</span>Caută...</span>' +
            '<span class="sa-tbl-sim__select">Toate statusurile<span class="material-symbols-outlined" aria-hidden="true">expand_more</span></span>' +
            '<span class="sa-tbl-sim__select">Toate șabloanele<span class="material-symbols-outlined" aria-hidden="true">expand_more</span></span>' +
          '</div>' +
          '<div class="table-wrap sa-tbl-sim__tablewrap"><table class="sit-table">' +
            '<thead>' + simHeaderHtml() + '</thead><tbody>' + rows + '</tbody>' +
          '</table></div>' +
          '<div class="sa-tbl-sim__pagination">Pagina 1 din 1 · ' + samples.length + ' elemente (exemplu)</div>' +
        '</div>';
    }

    function hintHtml() {
      return cols.length > 7
        ? '<span class="material-symbols-outlined" aria-hidden="true">info</span>Peste 7 coloane — tabelul poate deveni aglomerat pe ecrane mici.'
        : '';
    }

    function draw() {
      root.querySelector('[data-tbl-palette]').innerHTML = paletteHtml();
      root.querySelector('[data-tbl-sim]').innerHTML = simHtml();
      root.querySelector('[data-tbl-hint]').innerHTML = hintHtml();
      markDirty();
    }

    root.innerHTML =
      '<div class="sa-crumb"><a href="super-admin-fluxuri.html' + vq() + '">Fluxuri</a> › ' + esc(v.name) + ' · Tabel</div>' +
      '<header class="page-header"><h1 class="page-header__title">Tabelul verticalei — ' + esc(v.name) + '</h1>' +
        '<div class="sa-tbl-actions">' +
          '<button class="btn btn--ghost" type="button" id="tbl-reset">Revino la implicit<span class="material-symbols-outlined" aria-hidden="true">restart_alt</span></button>' +
          '<button class="btn btn--primary" type="button" id="tbl-save">Salvează coloanele<span class="material-symbols-outlined" aria-hidden="true">save</span></button>' +
        '</div>' +
      '</header>' +
      '<p class="sa-subtitle">Adaugă coloane din paleta din stânga; mută-le sau scoate-le direct din capul tabelului simulat. Se aplică oriunde apare tabelul acestei verticale. <span class="sa-cols-hint" data-tbl-hint></span></p>' +
      '<div class="sa-dwb">' +
        '<aside class="sa-dwb-palette"><div class="sa-dwb-palette__title">Coloane disponibile</div><div data-tbl-palette></div></aside>' +
        '<div class="sa-dwb-preview sa-tbl-sim" data-tbl-sim></div>' +
      '</div>';
    draw();

    root.querySelector('#tbl-save').addEventListener('click', function () {
      scripticaFlowSave('vertical', Object.assign({}, verticalById(v.id) || v, { listView: cols }));
      savedSnapshot = JSON.stringify(cols);
      markDirty();
      toast('success', 'Coloanele tabelului „' + v.name + '" au fost salvate.');
    });
    root.querySelector('#tbl-reset').addEventListener('click', function () {
      cols = LV.defaultsFor(v);
      draw();
    });
    root.addEventListener('click', function (e) {
      var b;
      if ((b = e.target.closest('[data-tbl-add]'))) {
        cols.push(b.getAttribute('data-tbl-add'));
        draw();
      } else if ((b = e.target.closest('[data-tbl-move]'))) {
        var i = parseInt(b.getAttribute('data-i'), 10);
        var j = i + parseInt(b.getAttribute('data-tbl-move'), 10);
        if (j >= 0 && j < cols.length) {
          var mv = cols.splice(i, 1)[0];
          cols.splice(j, 0, mv);
          draw();
        }
      } else if ((b = e.target.closest('[data-tbl-remove]'))) {
        if (cols.length > 2) { cols.splice(parseInt(b.getAttribute('data-tbl-remove'), 10), 1); draw(); }
      }
    });
  }

  /* builderul de tabel aparține secțiunii „Fluxuri" în rail */
  function markFluxuriNavActive() {
    var nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    nav.querySelectorAll('.nav-item').forEach(function (it) {
      var is = (it.getAttribute('href') || '').indexOf('super-admin-fluxuri') === 0;
      it.classList.toggle('nav-item--active', is);
      var icon = it.querySelector('.material-symbols-outlined');
      if (icon) icon.classList.toggle('filled', is);
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
        '<button class="btn btn--primary" type="button" data-new-ct>Tip de client nou' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
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
        (t.needsReview && t.needsReview.archive ? ' <span class="pill pill--pending">de configurat</span>' : '') +
        '<button class="btn btn--ghost sa-ct-arch__btn" type="button" data-arch-ct="' + esc(t.id) + '">Editează structura</button>' +
      '</div>' +
      '<div class="sa-ct-sec">Acasă (dashboard)</div>' +
      '<div class="sa-ct-arch">' +
        '<span class="material-symbols-outlined" aria-hidden="true">space_dashboard</span>' +
        ((t.dashboardLayout || []).length) + ' widget-uri · denumire: „' + esc(t.clientLabel || 'Client') + '"' +
        (t.needsReview && t.needsReview.dashboard ? ' <span class="pill pill--pending">de revizuit</span>' : '') +
        '<a class="sa-flow-open sa-ct-arch__btn" href="super-admin-dashboard.html?ct=' + encodeURIComponent(t.id) +
          (getCurrentView() === 'superadmin' ? '&view=superadmin' : '') + '">Deschide builderul<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a>' +
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
        '<div class="sa-ct-tpls">' + (tpls || '<span class="admin-table__muted">Fără șabloane — <a href="super-admin-fluxuri.html' + vq() + '">adaugă din „Fluxuri"</a>.</span>') + '</div>' +
      '</div>';
    }).join('');
    saModal({
      title: t ? 'Editează tipul de client' : 'Tip de client nou',
      subtitle: 'Clienții de acest tip primesc la înrolare verticalele bifate, cu șabloanele implicite selectate.',
      bodyHtml:
        fieldHtml('Denumire tip', '<input type="text" class="input" data-f="name" value="' + esc(t ? t.name : '') + '" placeholder="ex. Cabinet de consultanță fiscală">', null, 'nume') +
        fieldHtml('Pictogramă', iconPickerHtml(CT_ICONS, t ? t.icon : CT_ICONS[0])) +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(t ? t.description || '' : '') + '</textarea>') +
        '<div class="sa-form-2col">' +
          fieldHtml('Denumirea părții externe (singular)', '<input type="text" class="input" data-f="clientLabel" value="' + esc(t ? t.clientLabel || '' : '') + '" placeholder="ex. Client, Instituție, Customer">',
            'Cum sunt numiți clienții în aplicație pentru acest tip.') +
          fieldHtml('Denumirea părții externe (plural)', '<input type="text" class="input" data-f="clientLabelPlural" value="' + esc(t ? t.clientLabelPlural || '' : '') + '" placeholder="ex. Clienți, Instituții">') +
        '</div>' +
        '<div class="form-field" data-field="verticale"><label class="form-label">Verticale și șabloane implicite</label>' + blocks +
          '<span class="form-error" role="alert"></span></div>',
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
        clearFieldErrors(m);
        var name = fval(m, 'name');
        var vids = Array.prototype.filter.call(m.querySelectorAll('[data-ct-vert]'), function (c) { return c.checked; })
          .map(function (c) { return c.value; });
        var tids = Array.prototype.filter.call(m.querySelectorAll('[data-ct-tpl]'), function (c) { return c.checked && !c.disabled; })
          .map(function (c) { return c.value; });
        setFieldError(m, 'nume', name ? '' : 'Denumirea tipului este obligatorie.');
        var vErr = !vids.length ? 'Selectează cel puțin o verticală.'
          : (!tids.length ? 'Selectează cel puțin un șablon implicit.' : '');
        setFieldError(m, 'verticale', vErr);
        if (!name || vErr) return;
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
          /* tip nou → arhiva și dashboard-ul pornesc din valori implicite și
             cer o trecere de revizuire (pastile pe card până la prima salvare) */
          needsReview: t ? (t.needsReview || null) : { archive: true, dashboard: true },
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
    /* copie de lucru — se salvează doar la submit; snapshot-ul inițial
       alimentează garda de modificări nesalvate din saModal */
    var tree = JSON.parse(JSON.stringify(
      (t.archiveTree && t.archiveTree.length) ? t.archiveTree : window.scripticaDefaultArchiveTree()
    ));
    var initialSnapshot = JSON.stringify(tree);

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
    function ownerNameFor(typeId) {
      var owner = null;
      (function walk(nodes) {
        nodes.forEach(function (f) {
          if ((f.docTypeIds || []).indexOf(typeId) !== -1) owner = f;
          walk(f.children || []);
        });
      })(tree);
      return owner ? owner.name : '';
    }

    function folderRowHtml(f, depth) {
      var used = usedTypeIds();
      var chips = (f.docTypeIds || []).map(function (id) {
        var dt = window.scripticaDocTypeById(id);
        return '<span class="pill admin-anexa-chip">' + esc(dt ? dt.name : id) +
          '<button type="button" class="admin-anexa-chip__remove" data-arch-rmtype="' + esc(id) + '" data-node="' + esc(f.id) + '" aria-label="Elimină tipul" title="Elimină tipul">' +
            '<span class="material-symbols-outlined" aria-hidden="true">close</span></button></span>';
      }).join('');
      /* tipurile deja alocate rămân vizibile, dezactivate, cu folderul lor —
         regula „un tip → un singur folder" devine lizibilă la locul frecării */
      var anyAvailable = allowedTypes.some(function (dt) { return used.indexOf(dt.id) === -1; });
      var options = allowedTypes.filter(function (dt) { return (f.docTypeIds || []).indexOf(dt.id) === -1; })
        .map(function (dt) {
          if (used.indexOf(dt.id) === -1) {
            return '<option value="' + esc(dt.id) + '">' + esc(dt.name) + '</option>';
          }
          return '<option disabled>' + esc(dt.name) + ' — în „' + esc(ownerNameFor(dt.id)) + '"</option>';
        }).join('');
      var typesUi = f.system
        ? '<div class="sa-arch-row__system"><span class="material-symbols-outlined" aria-hidden="true">smart_toy</span>' +
            'Primește automat documentele pe care A.I. nu le recunoaște. Nu poate fi șters.</div>'
        : '<div class="sa-arch-row__types">' + chips +
            '<select class="select sa-arch-row__select" data-arch-addtype data-node="' + esc(f.id) + '">' +
              '<option value="">' + (anyAvailable ? '+ Adaugă tip de document...' : 'Toate tipurile sunt alocate — vezi unde:') + '</option>' +
              options +
            '</select>' +
          '</div>';
      var actions = f.system ? '' :
        '<button type="button" class="sa-mini-btn" data-arch-move="-1" data-node="' + esc(f.id) + '" title="Mută mai sus"><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button>' +
        '<button type="button" class="sa-mini-btn" data-arch-move="1" data-node="' + esc(f.id) + '" title="Mută mai jos"><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button>' +
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
          'Un tip de document are un singur folder-destinație. Subfolderele participă la rutare împreună cu părintele; ce nu e recunoscut ajunge în „Necategorisit". Ordinea folderelor este ordinea din arhiva clientului.</div>' +
        '<div class="sa-arch-tree" data-arch-tree></div>' +
        '<span class="form-error" role="alert" data-arch-error></span>' +
        '<button type="button" class="btn btn--secondary" data-arch-addroot>Folder nou<span class="material-symbols-outlined" aria-hidden="true">create_new_folder</span></button>',
      submitLabel: 'Salvează structura',
      isDirty: function () { return JSON.stringify(tree) !== initialSnapshot; },
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
          } else if ((b = e.target.closest('[data-arch-move]'))) {
            var hit4 = findNode(tree, b.getAttribute('data-node'));
            if (hit4 && !hit4.node.system) {
              var j = hit4.index + parseInt(b.getAttribute('data-arch-move'), 10);
              /* folderul de sistem rămâne mereu ultimul */
              if (j >= 0 && j < hit4.list.length && !hit4.list[j].system) {
                hit4.list.splice(hit4.index, 1);
                hit4.list.splice(j, 0, hit4.node);
                renderTree(m);
              }
            }
          }
        });
      },
      onSubmit: function (m, close) {
        var errEl = m.querySelector('[data-arch-error]');
        var invalid = false;
        m.querySelectorAll('.sa-arch-row__name').forEach(function (inp) { inp.classList.remove('has-error'); });
        m.querySelectorAll('[data-arch-name]').forEach(function (inp) {
          if (!inp.value.trim() && !inp.disabled) { inp.classList.add('has-error'); invalid = true; }
        });
        var noRealFolder = !tree.some(function (f) { return !f.system; });
        errEl.textContent = invalid ? 'Toate folderele trebuie să aibă un nume.'
          : (noRealFolder ? 'Structura are nevoie de cel puțin un folder în afară de „Necategorisit".' : '');
        if (invalid || noRealFolder) return;
        if (!tree.some(function (f) { return f.system; })) {
          tree.push({ id: archUid(), name: 'Necategorisit', system: true, docTypeIds: [], children: [] });
        }
        var upd = Object.assign({}, t, { archiveTree: tree });
        if (upd.needsReview) upd.needsReview = Object.assign({}, upd.needsReview, { archive: false });
        scripticaFlowSave('clientType', upd);
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
    var savedSnapshot = JSON.stringify(layout);

    function isDirty() { return JSON.stringify(layout) !== savedSnapshot; }
    function markDirty() {
      var btn = root.querySelector('#dwb-save');
      if (btn) btn.classList.toggle('is-dirty', isDirty());
    }
    /* layout-ul trăiește doar local până la Salvează — avertizăm la părăsire */
    window.addEventListener('beforeunload', function (e) {
      if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });

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
          'Dashboard gol — adaugă widget-uri din paleta din stânga.</div>';
      }
      return layout.map(function (item, i) {
        /* widget de flux → scurtătură spre editorul de coloane al verticalei */
        var colsLink = (item.widget === 'flow_summary' && item.params && item.params.verticalId)
          ? '<a class="sa-mini-btn" href="super-admin-tabel.html?vertical=' + encodeURIComponent(item.params.verticalId) +
              (getCurrentView() === 'superadmin' ? '&view=superadmin' : '') + '" title="Configurează tabelul verticalei">' +
              '<span class="material-symbols-outlined" aria-hidden="true">view_column</span></a>'
          : '';
        return '<div class="sa-dwb-item' + (item.size === 'full' ? ' dw-card--full' : '') + '" draggable="true" data-idx="' + i + '">' +
          '<div class="sa-dwb-item__bar">' +
            '<span class="material-symbols-outlined sa-dwb-item__grip" aria-hidden="true">drag_indicator</span>' +
            '<span class="sa-dwb-item__hint">trage sau folosește săgețile</span>' +
            colsLink +
            '<button type="button" class="sa-mini-btn" data-dwb-move="-1" data-i="' + i + '" title="Mută mai sus"' + (i === 0 ? ' disabled' : '') + '>' +
              '<span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button>' +
            '<button type="button" class="sa-mini-btn" data-dwb-move="1" data-i="' + i + '" title="Mută mai jos"' + (i === layout.length - 1 ? ' disabled' : '') + '>' +
              '<span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button>' +
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
      markDirty();
    }

    root.innerHTML =
      '<div class="sa-crumb"><a href="super-admin-tipuri-clienti.html' + vq() + '">Tipuri de clienți</a> › ' + esc(ct.name) + ' · Dashboard</div>' +
      '<header class="page-header"><h1 class="page-header__title">Dashboard — ' + esc(ct.name) + '</h1>' +
        '<button class="btn btn--primary" type="button" id="dwb-save">Salvează layout-ul<span class="material-symbols-outlined" aria-hidden="true">save</span></button>' +
      '</header>' +
      '<p class="sa-subtitle">Adaugă widget-uri din paletă și aranjează-le prin tragere sau cu săgețile. Clienții de tip „' + esc(ct.name) + '" primesc acest dashboard pe Acasă. Paleta oferă doar conținutul acoperit de verticalele tipului.</p>' +
      '<div class="sa-dwb">' +
        '<aside class="sa-dwb-palette"><div class="sa-dwb-palette__title">Widget-uri disponibile</div><div data-dwb-palette></div></aside>' +
        '<div class="sa-dwb-preview"><div class="dw-grid" data-dwb-grid></div></div>' +
      '</div>';
    draw();

    root.querySelector('#dwb-save').addEventListener('click', function () {
      var current = clientTypeById(ct.id) || ct;
      var upd = Object.assign({}, current, { dashboardLayout: layout });
      if (upd.needsReview) upd.needsReview = Object.assign({}, upd.needsReview, { dashboard: false });
      scripticaFlowSave('clientType', upd);
      savedSnapshot = JSON.stringify(layout);
      markDirty();
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
      } else if ((b = e.target.closest('[data-dwb-move]'))) {
        var from = parseInt(b.getAttribute('data-i'), 10);
        var to2 = from + parseInt(b.getAttribute('data-dwb-move'), 10);
        if (to2 >= 0 && to2 < layout.length) {
          var mv = layout.splice(from, 1)[0];
          layout.splice(to2, 0, mv);
          draw();
        }
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
      subtitle: 'La creare, clientul primește fluxurile tipului ales; le poate adapta apoi din Administrare.',
      bodyHtml:
        fieldHtml('Denumire firmă', '<input type="text" class="input" data-f="name" placeholder="ex. FiscalPro S.R.L.">', null, 'nume') +
        fieldHtml('Tip de client', '<select class="select" data-f="ctype"><option value="">Selectează tipul...</option>' + ctOptions + '</select>',
          'Determină verticalele și șabloanele primite la înrolare.', 'tip') +
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
            'Clientul va primi: <b>' + esc(vs) + '</b> cu ' + (t.defaultTemplateIds || []).length + ' șabloane implicite.';
        });
      },
      onSubmit: function (m, close) {
        clearFieldErrors(m);
        var name = fval(m, 'name');
        var t = clientTypeById(m.querySelector('[data-f="ctype"]').value);
        setFieldError(m, 'nume', name ? '' : 'Denumirea firmei este obligatorie.');
        setFieldError(m, 'tip', t ? '' : 'Selectează tipul de client.');
        if (!name || !t) return;
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
        toast('success', 'Contul „' + name + '" a fost creat — fluxurile tipului „' + t.name + '" sunt active pentru client.');
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
      '<div class="sa-sec__h"><span class="material-symbols-outlined" aria-hidden="true">account_tree</span>Fluxurile clientului' +
        '<button class="btn btn--ghost sa-sec__action" type="button" data-change-ct>Schimbă tipul</button></div>' +
      kv('Tip client', ctPill(c.clientTypeId)) +
      inner +
      '<div class="sa-dt-hint"><span class="material-symbols-outlined" aria-hidden="true">info</span>' +
        'Fluxurile afișate urmează tipul curent al clientului — clientul le poate adapta din Administrare.</div>' +
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
        'Fluxurile, arhiva și dashboard-ul clientului se actualizează la noul tip.'),
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
    else if (page === 'super-admin-tabel') renderTableBuilder(root);
  });

})();
