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

  /* Paleta de identitate a verticalelor — perechile accent/suprafață din tokens.css. */
  var VERTICAL_COLORS = [
    { id: 'mov', label: 'Mov' }, { id: 'albastru', label: 'Albastru' }, { id: 'verde', label: 'Verde' },
    { id: 'auriu', label: 'Auriu' }, { id: 'portocaliu', label: 'Portocaliu' }, { id: 'roz', label: 'Roz' }
  ];
  function colorPickerHtml(selected) {
    return '<div class="sa-colorpick">' + VERTICAL_COLORS.map(function (c) {
      return '<button type="button" class="sa-colorpick__btn va-' + c.id + (c.id === selected ? ' is-selected' : '') + '" data-color="' + c.id + '" title="' + c.label + '" aria-label="Culoare ' + c.label + '">' +
        '<span class="sa-colorpick__dot" aria-hidden="true"></span></button>';
    }).join('') + '</div>';
  }
  function bindColorPicker(root) {
    root.querySelectorAll('.sa-colorpick__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        root.querySelectorAll('.sa-colorpick__btn').forEach(function (x) { x.classList.remove('is-selected'); });
        b.classList.add('is-selected');
      });
    });
  }
  function pickedColor(root, fallback) {
    var b = root.querySelector('.sa-colorpick__btn.is-selected');
    return b ? b.getAttribute('data-color') : fallback;
  }
  function vaClass(v) { return window.scripticaVerticalAccentClass ? scripticaVerticalAccentClass(v) : 'va-mov'; }
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
    var preferredType = clientTypeById(qs('ct'));
    var openRequested = qs('new') === 'client';
    root.innerHTML =
      '<header class="page-header"><h1 class="page-header__title">Clienți</h1></header>' +
      '<div class="sa-table-toolbar">' +
        '<p class="sa-subtitle">Toate conturile de business · ' + list.length + ' clienți' +
          (preferredType ? ' · tip selectat: <b>' + esc(preferredType.name) + '</b>' : '') + '</p>' +
        '<button class="btn btn--primary" type="button" id="sa-new-client">Cont de business nou' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
      '</div>' +
      clientsTable(list);
    bindRows(root);
    var nb = root.querySelector('#sa-new-client');
    if (nb) nb.addEventListener('click', function () { openNewClientModal(root, preferredType ? preferredType.id : ''); });
    if (openRequested && preferredType) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.delete('new');
        window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
      } catch (e) { /* Deep link-ul nu este esențial pentru prototip. */ }
      window.setTimeout(function () { openNewClientModal(root, preferredType.id); }, 0);
    }
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
        '<div class="sa-flow-ico sa-flow-ico--va ' + vaClass(v) + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span></div>' +
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
      fieldHtml('Culoare', colorPickerHtml(v && v.color ? v.color : 'mov') + '<span class="form-helper">Identitatea vizuală a verticalei — colorează pill-urile și pictogramele ei în aplicație.</span>') +
      fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(v ? v.description || '' : '') + '</textarea>') +
      '<div class="form-field" data-field="etape">' +
        '<label class="form-label">Etapele ciclului de viață</label>' +
        '<span class="form-helper">Forma fluxului: fiecare element trece prin aceste etape, în ordine. Termenele per etapă se stabilesc pe șabloane. O singură etapă e suficientă pentru lucrul de tip „proiect".</span>' +
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
        bindColorPicker(m);
        m.querySelector('[data-lc-add]').addEventListener('click', function () {
          var rows = m.querySelector('[data-lc-rows]');
          rows.insertAdjacentHTML('beforeend', lcRowHtml('', rows.children.length));
        });
        m.querySelector('[data-lc-rows]').addEventListener('click', function (e) {
          var del = e.target.closest('[data-lc-del]');
          if (!del) return;
          var rows = m.querySelector('[data-lc-rows]');
          if (rows.children.length <= 1) { toast('error', 'O verticală are minimum o etapă.'); return; }
          del.closest('.sa-lc-row').remove();
          Array.prototype.forEach.call(rows.querySelectorAll('.sa-lc-row__n'), function (n, i) { n.textContent = i + 1; });
        });
      },
      onSubmit: function (m, close) {
        clearFieldErrors(m);
        var name = fval(m, 'name');
        var lcNames = Array.prototype.map.call(m.querySelectorAll('[data-lc-name]'), function (i) { return i.value.trim(); }).filter(Boolean);
        setFieldError(m, 'nume', name ? '' : 'Denumirea verticalei este obligatorie.');
        setFieldError(m, 'etape', lcNames.length >= 1 ? '' : 'Definește cel puțin o etapă a ciclului de viață.');
        if (!name || lcNames.length < 1) return;
        var itemLabel = fval(m, 'itemLabel') || 'Element';
        var rec = {
          id: v ? v.id : uid('vert', name, verticals()),
          domain: v ? v.domain : slugify(name),
          builtin: v ? !!v.builtin : false,
          status: v ? (v.status || 'activ') : 'activ',
          name: name,
          icon: pickedIcon(m, 'account_tree'),
          color: pickedColor(m, v && v.color ? v.color : 'mov'),
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
      root.innerHTML = '<p class="sa-subtitle">Verticala nu a fost găsită. <a href="super-admin-fluxuri-v2.html' + vq() + '">Înapoi la Verticale și fluxuri</a></p>';
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
      '<div class="sa-crumb"><a href="super-admin-fluxuri-v2.html?view=superadmin&vertical=' + encodeURIComponent(v.id) + '">Verticale și fluxuri</a> › ' + esc(v.name) + ' · Tabel</div>' +
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
    var state = root._ctState || (root._ctState = { q: '', vert: '', sort: 'nume-asc' });
    var all = clientTypesAll();
    var totalClients = all.reduce(function (a, t) { return a + clientsOfType(t.id).length; }, 0);
    var vertOptions = verticals().filter(function (v) { return v.status === 'activ'; }).map(function (v) {
      return '<option value="' + esc(v.id) + '"' + (state.vert === v.id ? ' selected' : '') + '>' + esc(v.name) + '</option>';
    }).join('');
    var sortOptions = [['nume-asc', 'Nume A–Z'], ['nume-desc', 'Nume Z–A'], ['clienti-desc', 'Cei mai mulți clienți']].map(function (o) {
      return '<option value="' + o[0] + '"' + (state.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');

    root.innerHTML =
      '<header class="page-header"><h1 class="page-header__title">Tipuri de clienți</h1>' +
        '<button class="btn btn--primary" type="button" data-new-ct>Tip de client nou' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
      '</header>' +
      '<p class="sa-subtitle">Fiecare tip definește verticalele și șabloanele de flux primite implicit la înrolare — copiate în workspace-ul clientului, apoi adaptabile din Administrare. Un client are un singur tip.</p>' +
      '<div class="sa-ct-topbar">' +
        '<div class="sa-ct-stats">' +
          '<div class="sa-ct-stat"><span class="material-symbols-outlined" aria-hidden="true">category</span><b>' + all.length + '</b><span>tipuri</span></div>' +
          '<div class="sa-ct-stat"><span class="material-symbols-outlined" aria-hidden="true">apartment</span><b>' + totalClients + '</b><span>clienți folosind aceste tipuri</span></div>' +
        '</div>' +
        '<div class="sa-ct-toolbar">' +
          '<div class="filter-input-search sa-ct-toolbar__search"><span class="material-symbols-outlined" aria-hidden="true">search</span>' +
            '<label class="sr-only" for="ct-search">Caută tip de client</label>' +
            '<input id="ct-search" class="input" type="search" placeholder="Caută tip de client..." autocomplete="off" value="' + esc(state.q) + '">' +
          '</div>' +
          '<label class="sr-only" for="ct-vert">Filtrează după verticală</label>' +
          '<select id="ct-vert" class="select"><option value="">Toate verticalele</option>' + vertOptions + '</select>' +
          '<label class="sr-only" for="ct-sort">Sortează după</label>' +
          '<select id="ct-sort" class="select">' + sortOptions + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="sa-ct-grid" data-ct-grid></div>';

    var grid = root.querySelector('[data-ct-grid]');
    function visibleTypes() {
      var q = state.q.trim().toLowerCase();
      var list = clientTypesAll().filter(function (t) {
        if (state.vert && (t.verticalIds || []).indexOf(state.vert) === -1) return false;
        if (q && (t.name + ' ' + (t.description || '')).toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
      if (state.sort === 'nume-desc') list.sort(function (a, b) { return b.name.localeCompare(a.name, 'ro'); });
      else if (state.sort === 'clienti-desc') list.sort(function (a, b) { return clientsOfType(b.id).length - clientsOfType(a.id).length || a.name.localeCompare(b.name, 'ro'); });
      else list.sort(function (a, b) { return a.name.localeCompare(b.name, 'ro'); });
      return list;
    }
    function redraw() {
      var list = visibleTypes();
      grid.innerHTML = list.map(ctCardHtml).join('') ||
        '<div class="sa-ct-empty"><span class="material-symbols-outlined" aria-hidden="true">search_off</span>Niciun tip de client nu corespunde filtrelor.</div>';
    }
    redraw();
    root.querySelector('#ct-search').addEventListener('input', function () { state.q = this.value; redraw(); });
    root.querySelector('#ct-vert').addEventListener('change', function () { state.vert = this.value; redraw(); });
    root.querySelector('#ct-sort').addEventListener('change', function () { state.sort = this.value; redraw(); });

    if (!root._ctBound) {
      root._ctBound = true;
      root.addEventListener('click', function (e) {
        var b;
        if ((b = e.target.closest('[data-new-ct]'))) openClientTypeModal(root, null);
        else if ((b = e.target.closest('[data-edit-ct]'))) openClientTypeModal(root, clientTypeById(b.getAttribute('data-edit-ct')));
        else if ((b = e.target.closest('[data-del-ct]'))) confirmDeleteClientType(root, clientTypeById(b.getAttribute('data-del-ct')));
        else if ((b = e.target.closest('[data-arch-ct]'))) openArchiveModal(root, clientTypeById(b.getAttribute('data-arch-ct')));
        else if ((b = e.target.closest('[data-tpl-toggle]'))) {
          var card = b.closest('.sa-ct-card');
          var expanded = b.getAttribute('data-expanded') === '1';
          Array.prototype.forEach.call(card.querySelectorAll('.sa-ct-tpl--extra'), function (li) { li.hidden = expanded; });
          b.setAttribute('data-expanded', expanded ? '0' : '1');
          b.innerHTML = (expanded ? 'Vezi toate șabloanele (' + b.getAttribute('data-count') + ')' : 'Arată mai puține') +
            '<span class="material-symbols-outlined" aria-hidden="true">' + (expanded ? 'arrow_forward' : 'expand_less') + '</span>';
        }
      });
    }
  }

  var CT_TPL_VISIBLE = 4; /* șabloane afișate implicit pe card; restul sub „Vezi toate" */

  function ctCardHtml(t) {
    var vs = (t.verticalIds || []).map(verticalById).filter(Boolean);
    var tpls = (t.defaultTemplateIds || []).map(templateById).filter(Boolean);
    var n = clientsOfType(t.id).length;
    var primaryVa = vs.length ? vaClass(vs[0]) : 'va-mov';
    var vertPills = vs.map(function (v) {
      return '<span class="pill pill--va sa-ct-vert ' + vaClass(v) + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span>' + esc(v.name) + '</span>';
    }).join('') || '<span class="admin-table__muted">Nicio verticală</span>';
    var tplList = tpls.map(function (x, i) {
      var v = verticalById(x.verticalId);
      return '<li' + (i >= CT_TPL_VISIBLE ? ' class="sa-ct-tpl--extra" hidden' : '') + '>' +
        '<span class="material-symbols-outlined" aria-hidden="true">description</span>' +
        '<span class="sa-ct-tpl__line"><span class="sa-ct-tpl__name">' + esc(x.name) + '</span> <small>· ' + esc(v ? v.name : '') + '</small></span></li>';
    }).join('');
    var tplToggle = tpls.length > CT_TPL_VISIBLE
      ? '<button type="button" class="sa-ct-tpltoggle" data-tpl-toggle data-count="' + tpls.length + '" data-expanded="0">' +
          'Vezi toate șabloanele (' + tpls.length + ')<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>'
      : '';
    var delBtn = n === 0
      ? '<button class="sa-mini-btn sa-mini-btn--danger" type="button" data-del-ct="' + esc(t.id) + '" title="Șterge tipul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>'
      : '';
    return '<div class="sa-card sa-ct-card">' +
      '<div class="sa-flow-head sa-ct-head">' +
        '<div class="sa-flow-ico sa-flow-ico--va ' + primaryVa + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc(t.icon || 'category') + '</span></div>' +
        '<div class="sa-flow-title"><div class="sa-panel__title">' + esc(t.name) + '</div></div>' +
        '<div class="sa-flow-actions">' +
          '<button class="sa-mini-btn" type="button" data-edit-ct="' + esc(t.id) + '" title="Editează tipul"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button>' +
          delBtn +
        '</div>' +
      '</div>' +
      '<p class="sa-ct-desc">' + esc(t.description || '') + '</p>' +
      '<div class="sa-ct-sec">Verticale</div><div class="sa-ct-verts">' + vertPills + '</div>' +
      '<div class="sa-ct-sec">Șabloane implicite (' + tpls.length + ')</div>' +
      '<ul class="sa-ct-tpllist">' + tplList + '</ul>' + tplToggle +
      '<div class="sa-ct-cfg">' +
        '<button class="sa-ct-cfg__row" type="button" data-arch-ct="' + esc(t.id) + '">' +
          '<span class="material-symbols-outlined sa-ct-cfg__ico" aria-hidden="true">folder_open</span>' +
          '<span class="sa-ct-cfg__text">' +
            '<span class="sa-ct-cfg__label">Structură arhivă' +
              (t.needsReview && t.needsReview.archive ? ' <span class="pill pill--pending">de configurat</span>' : '') + '</span>' +
            '<span class="sa-ct-cfg__meta">' + countArchFolders(t.archiveTree) + ' foldere · sortare automată A.I.</span>' +
          '</span>' +
          '<span class="material-symbols-outlined sa-ct-cfg__go" aria-hidden="true">arrow_forward</span>' +
        '</button>' +
        '<a class="sa-ct-cfg__row" href="super-admin-dashboard.html?ct=' + encodeURIComponent(t.id) +
          (getCurrentView() === 'superadmin' ? '&view=superadmin' : '') + '">' +
          '<span class="material-symbols-outlined sa-ct-cfg__ico" aria-hidden="true">space_dashboard</span>' +
          '<span class="sa-ct-cfg__text">' +
            '<span class="sa-ct-cfg__label">Ecranul Acasă' +
              (t.needsReview && t.needsReview.dashboard ? ' <span class="pill pill--pending">de revizuit</span>' : '') + '</span>' +
            '<span class="sa-ct-cfg__meta">' + ((t.dashboardLayout || []).length) + ' widget-uri · „' + esc(t.clientLabel || 'Client') + '"</span>' +
          '</span>' +
          '<span class="material-symbols-outlined sa-ct-cfg__go" aria-hidden="true">arrow_forward</span>' +
        '</a>' +
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
        '<div class="sa-ct-tpls">' + (tpls || '<span class="admin-table__muted">Fără fluxuri — <a href="super-admin-fluxuri-v2.html' + vq() + '">configurează verticala</a>.</span>') + '</div>' +
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
      root.innerHTML = '<p class="sa-subtitle">Tipul de client nu a fost găsit. <a href="super-admin-tipuri-clienti-v2.html' + vq() + '">Înapoi la Tipuri de clienți</a></p>';
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
      '<div class="sa-crumb"><a href="super-admin-tipuri-clienti-v2.html?view=superadmin&ct=' + encodeURIComponent(ct.id) + '">Tipuri de clienți</a> › ' + esc(ct.name) + ' › Ecranul Acasă</div>' +
      '<header class="page-header"><h1 class="page-header__title">Ecranul Acasă — ' + esc(ct.name) + '</h1>' +
        '<button class="btn btn--primary" type="button" id="dwb-save">Salvează layout-ul<span class="material-symbols-outlined" aria-hidden="true">save</span></button>' +
      '</header>' +
      '<p class="sa-subtitle">Adaugă widget-uri din paletă și aranjează-le prin tragere sau cu săgețile. Clienții de tip „' + esc(ct.name) + '" primesc acest ecran pe Acasă. Paleta oferă doar conținutul acoperit de verticalele tipului.</p>' +
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
      toast('success', 'Ecranul Acasă pentru „' + ct.name + '" a fost salvat.');
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
  var CLIENT_PROFILE_FIELD_TYPES = {
    section_title: { label: 'Titlu secțiune', icon: 'title', defaults: { text: 'Secțiune nouă' } },
    text_short: { label: 'Text scurt', icon: 'short_text', defaults: { label: 'Câmp nou', placeholder: '', help: '', required: false } },
    text_long: { label: 'Text lung', icon: 'subject', defaults: { label: 'Observații', placeholder: '', help: '', required: false } },
    cui: { label: 'CUI / identificator fiscal', icon: 'badge', defaults: { label: 'CUI / CIF', placeholder: 'ex. RO12345678', help: '', required: false } },
    email: { label: 'Adresă de e-mail', icon: 'mail', defaults: { label: 'Adresă de e-mail', placeholder: 'nume@companie.ro', help: '', required: false } },
    phone: { label: 'Număr de telefon', icon: 'call', defaults: { label: 'Număr de telefon', placeholder: '+40', help: '', required: false } },
    date: { label: 'Dată', icon: 'calendar_today', defaults: { label: 'Dată', placeholder: '', help: '', required: false } },
    address: { label: 'Adresă structurată', icon: 'location_on', defaults: { label: 'Adresă', placeholder: 'Stradă, număr, localitate, județ, cod poștal', help: '', required: false } },
    dropdown: { label: 'Listă de opțiuni', icon: 'arrow_drop_down_circle', defaults: { label: 'Alege o opțiune', help: '', required: false, options: ['Opțiunea 1', 'Opțiunea 2'] } },
    boolean: { label: 'Confirmare Da / Nu', icon: 'toggle_on', defaults: { label: 'Confirmare', help: '', required: false } },
    file_upload: { label: 'Document justificativ', icon: 'attach_file', defaults: { label: 'Încarcă documentul', help: '', required: false } },
    repeater_block: { label: 'Bloc repetabil', icon: 'repeat', defaults: { label: 'Elemente multiple', help: 'Utilizatorul poate adăuga mai multe înregistrări.', required: false } }
  };
  var clientProfileFieldSeq = 0;

  function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

  function clientProfileField(type, key, props) {
    var def = CLIENT_PROFILE_FIELD_TYPES[type] || CLIENT_PROFILE_FIELD_TYPES.text_short;
    var field = deepCopy(def.defaults);
    field.id = key || ('cpf_custom_' + Date.now() + '_' + (++clientProfileFieldSeq));
    field.type = type;
    field.scope = 'onboarding_profile';
    field.sensitive = false;
    Object.keys(props || {}).forEach(function (k) { field[k] = props[k]; });
    return field;
  }

  function defaultClientProfileFields(t) {
    var prefix = 'cpf_' + slugify((t && t.id) || 'client') + '_';
    var vids = (t && t.verticalIds) || [];
    var hasAccounting = vids.indexOf('vert_contabil') !== -1;
    var hasAudit = vids.indexOf('vert_audit') !== -1;
    var hasConstruction = vids.indexOf('vert_constructii') !== -1;
    var hasConsulting = vids.indexOf('vert_consultanta') !== -1;
    var result = [
      clientProfileField('section_title', prefix + 'identity_section', { text: 'Identitate' }),
      clientProfileField('dropdown', prefix + 'subject_type', { label: 'Tip persoană / organizație', required: true, options: ['Persoană juridică', 'PFA / profesie liberală', 'Persoană fizică', 'Instituție publică'] }),
      clientProfileField('text_short', prefix + 'legal_name', { label: 'Denumire oficială / nume complet', required: true }),
      clientProfileField('cui', prefix + 'fiscal_id', { label: 'Identificator fiscal', help: 'CUI, CIF, CNP sau NIF, în funcție de tipul selectat.', required: true, sensitive: true }),
      clientProfileField('text_short', prefix + 'registry_number', { label: 'Nr. Registrul Comerțului / registru profesional' }),
      clientProfileField('address', prefix + 'registered_address', { label: 'Sediu social / domiciliu', required: true }),
      clientProfileField('section_title', prefix + 'contact_section', { text: 'Contact principal' }),
      clientProfileField('text_short', prefix + 'contact_name', { label: 'Persoană de contact', required: true }),
      clientProfileField('email', prefix + 'contact_email', { label: 'E-mail principal', required: true }),
      clientProfileField('phone', prefix + 'contact_phone', { label: 'Telefon principal' })
    ];

    if (hasAccounting || hasConsulting) {
      result.push(
        clientProfileField('section_title', prefix + 'tax_section', { text: 'Fiscalitate și conformitate' }),
        clientProfileField('text_short', prefix + 'caen', { label: 'Cod CAEN principal', help: 'Se păstrează împreună cu versiunea CAEN aplicabilă.' }),
        clientProfileField('dropdown', prefix + 'vat_status', { label: 'Înregistrare în scopuri de TVA', required: true, options: ['Neînregistrat', 'TVA normal', 'TVA special art. 317', 'TVA normal și art. 317'] }),
        clientProfileField('boolean', prefix + 'cash_vat', { label: 'Aplică TVA la încasare?' }),
        clientProfileField('dropdown', prefix + 'vat_period', { label: 'Perioadă fiscală TVA', options: ['Lunară', 'Trimestrială', 'Nu se aplică'] }),
        clientProfileField('repeater_block', prefix + 'beneficial_owners', { label: 'Beneficiari reali', help: 'Nume, identificator, cetățenie și participație.', sensitive: true })
      );
    }
    if (hasAudit) {
      result.push(
        clientProfileField('section_title', prefix + 'public_section', { text: 'Date instituție publică' }),
        clientProfileField('text_short', prefix + 'legal_basis', { label: 'Actul normativ de înființare', required: true }),
        clientProfileField('text_short', prefix + 'uat', { label: 'UAT și CIF UAT' }),
        clientProfileField('text_short', prefix + 'treasury', { label: 'Unitate și cod Trezorerie' }),
        clientProfileField('dropdown', prefix + 'authorizer_type', { label: 'Tip ordonator de credite', options: ['Principal', 'Secundar', 'Terțiar', 'Nu se aplică'] }),
        clientProfileField('text_short', prefix + 'superior_entity', { label: 'Instituție ierarhic superioară' })
      );
    }
    if (hasConstruction) {
      result.push(
        clientProfileField('section_title', prefix + 'locations_section', { text: 'Locații și activitate' }),
        clientProfileField('repeater_block', prefix + 'locations', { label: 'Puncte de lucru, depozite și șantiere', help: 'Pentru fiecare locație se păstrează tipul și adresa structurată.' }),
        clientProfileField('text_short', prefix + 'eori', { label: 'Număr EORI', help: 'Se completează numai pentru operațiuni vamale.' })
      );
    }
    return result;
  }

  function clientProfileToolboxHtml() {
    var groups = [
      { label: 'Structură', types: ['section_title'] },
      { label: 'Date de bază', types: ['text_short', 'text_long', 'cui', 'email', 'phone', 'date', 'address'] },
      { label: 'Alegere', types: ['dropdown', 'boolean'] },
      { label: 'Avansat', types: ['file_upload', 'repeater_block'] }
    ];
    return groups.map(function (group) {
      return '<div class="sa-cpf-toolgroup"><div class="sa-cpf-toolgroup__title">' + esc(group.label) + '</div>' +
        group.types.map(function (type) {
          var def = CLIENT_PROFILE_FIELD_TYPES[type];
          return '<button class="sa-cpf-tool" type="button" draggable="true" data-cpf-add="' + esc(type) + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">' + esc(def.icon) + '</span><span>' + esc(def.label) + '</span></button>';
        }).join('') + '</div>';
    }).join('');
  }

  function clientProfilePreviewControl(field) {
    if (field.type === 'text_long' || field.type === 'address') {
      return '<textarea class="input sa-cpf-fake-textarea" disabled placeholder="' + esc(field.placeholder || '') + '"></textarea>';
    }
    if (field.type === 'dropdown') {
      return '<select class="select" disabled><option>' + esc((field.options || [])[0] || 'Selectează...') + '</option></select>';
    }
    if (field.type === 'boolean') {
      return '<div class="sa-cpf-choice"><span>Da</span><span>Nu</span></div>';
    }
    if (field.type === 'file_upload') {
      return '<div class="sa-cpf-upload"><span class="material-symbols-outlined" aria-hidden="true">upload_file</span>Încarcă document</div>';
    }
    if (field.type === 'repeater_block') {
      return '<div class="sa-cpf-repeat"><span class="material-symbols-outlined" aria-hidden="true">add</span>Adaugă înregistrare</div>';
    }
    var inputType = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text';
    return '<input class="input" type="' + inputType + '" disabled placeholder="' + esc(field.placeholder || '') + '">';
  }

  function clientProfileFieldHtml(field, idx, total) {
    if (field.type === 'section_title') {
      return '<div class="sa-cpf-item sa-cpf-item--section" draggable="true" data-cpf-id="' + esc(field.id) + '">' +
        '<span class="material-symbols-outlined sa-cpf-grip" data-cpf-grip aria-hidden="true">drag_indicator</span>' +
        '<strong data-cpf-card-label>' + esc(field.text || 'Secțiune') + '</strong>' +
        '<div class="sa-cpf-item__actions">' + clientProfileMoveButtons(idx, total) + '</div></div>';
    }
    var def = CLIENT_PROFILE_FIELD_TYPES[field.type] || CLIENT_PROFILE_FIELD_TYPES.text_short;
    return '<div class="sa-cpf-item" draggable="true" data-cpf-id="' + esc(field.id) + '">' +
      '<span class="material-symbols-outlined sa-cpf-grip" data-cpf-grip aria-hidden="true">drag_indicator</span>' +
      '<div class="sa-cpf-item__content"><div class="sa-cpf-item__label"><span data-cpf-card-label>' + esc(field.label || def.label) + '</span>' +
        (field.required ? '<b aria-label="Obligatoriu">*</b>' : '') +
        (field.sensitive ? '<span class="pill pill--neutral">Date sensibile</span>' : '') + '</div>' +
        (field.help ? '<div class="sa-cpf-item__help">' + esc(field.help) + '</div>' : '') +
        clientProfilePreviewControl(field) + '</div>' +
      '<div class="sa-cpf-item__actions">' + clientProfileMoveButtons(idx, total) +
        '<button type="button" data-cpf-duplicate title="Duplică"><span class="material-symbols-outlined" aria-hidden="true">content_copy</span></button>' +
        '<button type="button" data-cpf-delete title="Șterge"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button></div></div>';
  }

  function clientProfileMoveButtons(idx, total) {
    return '<button type="button" data-cpf-move="-1" title="Mută sus"' + (idx === 0 ? ' disabled' : '') + '><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button>' +
      '<button type="button" data-cpf-move="1" title="Mută jos"' + (idx === total - 1 ? ' disabled' : '') + '><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button>';
  }

  function findClientProfileField(draft, id) {
    return draft.fields.find(function (field) { return field.id === id; }) || null;
  }

  function clientProfilePropertiesHtml(field) {
    if (!field) {
      return '<div class="sa-cpf-properties__empty"><span class="material-symbols-outlined" aria-hidden="true">tune</span><b>Selectează un câmp</b><span>Aici îi configurezi eticheta și regulile.</span></div>';
    }
    var def = CLIENT_PROFILE_FIELD_TYPES[field.type] || CLIENT_PROFILE_FIELD_TYPES.text_short;
    var html = '<div class="sa-cpf-properties__type">' + esc(def.label) + '</div>';
    if (field.type === 'section_title') {
      html += fieldHtml('Titlul secțiunii', '<input type="text" class="input" data-cpf-prop="text" value="' + esc(field.text || '') + '">');
    } else {
      html += fieldHtml('Etichetă', '<input type="text" class="input" data-cpf-prop="label" value="' + esc(field.label || '') + '">') +
        fieldHtml('Text de ajutor', '<textarea class="input sa-cpf-prop-textarea" data-cpf-prop="help">' + esc(field.help || '') + '</textarea>') +
        '<label class="checkbox sa-cpf-checkbox"><input type="checkbox" data-cpf-prop="required"' + (field.required ? ' checked' : '') + '> Câmp obligatoriu</label>' +
        '<label class="checkbox sa-cpf-checkbox"><input type="checkbox" data-cpf-prop="sensitive"' + (field.sensitive ? ' checked' : '') + '> Date sensibile</label>' +
        fieldHtml('Apare', '<select class="select" data-cpf-prop="scope"><option value="onboarding_profile"' + (field.scope === 'onboarding_profile' ? ' selected' : '') + '>La înrolare și în profil</option><option value="onboarding"' + (field.scope === 'onboarding' ? ' selected' : '') + '>Doar la înrolare</option><option value="profile"' + (field.scope === 'profile' ? ' selected' : '') + '>Doar în profil</option></select>');
      if (field.type === 'dropdown') {
        html += fieldHtml('Opțiuni', '<textarea class="input sa-cpf-options" data-cpf-prop="options" aria-label="Câte o opțiune pe rând">' + esc((field.options || []).join('\n')) + '</textarea>', 'Câte o opțiune pe rând.');
      }
    }
    return html + '<div class="sa-cpf-properties__actions"><button class="btn btn--critical" type="button" data-cpf-delete>Șterge câmpul</button></div>';
  }

  function renderClientProfileBuilder(modal, draft) {
    var canvas = modal.querySelector('[data-cpf-canvas]');
    var props = modal.querySelector('[data-cpf-properties]');
    var count = modal.querySelector('[data-cpf-count]');
    if (!canvas || !props) return;
    canvas.innerHTML = draft.fields.length ? draft.fields.map(function (field, idx) {
      return clientProfileFieldHtml(field, idx, draft.fields.length);
    }).join('') : '<div class="sa-cpf-empty"><span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span><b>Adaugă primul câmp</b><span>Alege o componentă din panoul din stânga.</span></div>';
    props.innerHTML = clientProfilePropertiesHtml(findClientProfileField(draft, draft.selectedFieldId));
    if (count) count.textContent = draft.fields.filter(function (field) { return field.type !== 'section_title'; }).length + ' câmpuri';
  }

  function bindClientProfileBuilder(modal, draft) {
    var builder = modal.querySelector('[data-cpf-builder]');
    var canvas = modal.querySelector('[data-cpf-canvas]');
    if (!builder || !canvas) return;

    function selectAndRender(id) {
      draft.selectedFieldId = id;
      renderClientProfileBuilder(modal, draft);
    }
    function addField(type, at) {
      var field = clientProfileField(type, null, {});
      var index = typeof at === 'number' ? at : draft.fields.length;
      draft.fields.splice(index, 0, field);
      draft.dirty = true;
      selectAndRender(field.id);
    }
    function fieldIndexFromEvent(e) {
      var item = e.target.closest('[data-cpf-id]');
      return item ? draft.fields.findIndex(function (field) { return field.id === item.getAttribute('data-cpf-id'); }) : -1;
    }

    builder.addEventListener('click', function (e) {
      var tool = e.target.closest('[data-cpf-add]');
      if (tool) { addField(tool.getAttribute('data-cpf-add')); return; }
      var item = e.target.closest('[data-cpf-id]');
      if (item && !e.target.closest('button')) draft.selectedFieldId = item.getAttribute('data-cpf-id');
      var idx = fieldIndexFromEvent(e);
      var move = e.target.closest('[data-cpf-move]');
      if (move && idx !== -1) {
        var to = idx + parseInt(move.getAttribute('data-cpf-move'), 10);
        if (to >= 0 && to < draft.fields.length) draft.fields.splice(to, 0, draft.fields.splice(idx, 1)[0]);
        draft.dirty = true;
      }
      var duplicate = e.target.closest('[data-cpf-duplicate]');
      if (duplicate && idx !== -1) {
        var copy = deepCopy(draft.fields[idx]);
        copy.id = 'cpf_custom_' + Date.now() + '_' + (++clientProfileFieldSeq);
        draft.fields.splice(idx + 1, 0, copy);
        draft.selectedFieldId = copy.id;
        draft.dirty = true;
      }
      var remove = e.target.closest('[data-cpf-delete]');
      if (remove) {
        var selectedIdx = idx !== -1 ? idx : draft.fields.findIndex(function (field) { return field.id === draft.selectedFieldId; });
        if (selectedIdx !== -1) draft.fields.splice(selectedIdx, 1);
        draft.selectedFieldId = draft.fields[Math.min(selectedIdx, draft.fields.length - 1)] ? draft.fields[Math.min(selectedIdx, draft.fields.length - 1)].id : null;
        draft.dirty = true;
      }
      if (item || move || duplicate || remove) renderClientProfileBuilder(modal, draft);
    });

    builder.addEventListener('input', function (e) {
      var prop = e.target.getAttribute('data-cpf-prop');
      var field = findClientProfileField(draft, draft.selectedFieldId);
      if (!prop || !field) return;
      if (prop === 'required' || prop === 'sensitive') field[prop] = e.target.checked;
      else if (prop === 'options') field.options = e.target.value.split('\n').map(function (v) { return v.trim(); }).filter(Boolean);
      else field[prop] = e.target.value;
      draft.dirty = true;
      var card = canvas.querySelector('[data-cpf-id="' + field.id + '"] [data-cpf-card-label]');
      if (card && (prop === 'label' || prop === 'text')) card.textContent = e.target.value || 'Fără etichetă';
    });
    builder.addEventListener('change', function (e) {
      if (e.target.hasAttribute('data-cpf-prop')) renderClientProfileBuilder(modal, draft);
    });

    builder.addEventListener('dragstart', function (e) {
      var tool = e.target.closest('[data-cpf-add]');
      var item = e.target.closest('[data-cpf-id]');
      if (tool) { draft.dragType = tool.getAttribute('data-cpf-add'); draft.dragFieldId = null; }
      else if (item) { draft.dragFieldId = item.getAttribute('data-cpf-id'); draft.dragType = null; item.classList.add('is-dragging'); }
      else return;
      e.dataTransfer.effectAllowed = tool ? 'copy' : 'move';
      try { e.dataTransfer.setData('text/plain', draft.dragType || draft.dragFieldId); } catch (err) {}
    });
    builder.addEventListener('dragover', function (e) {
      if (!draft.dragType && !draft.dragFieldId) return;
      if (!e.target.closest('[data-cpf-canvas]')) return;
      e.preventDefault();
      canvas.querySelectorAll('.is-drag-over').forEach(function (el) { el.classList.remove('is-drag-over'); });
      var item = e.target.closest('[data-cpf-id]');
      if (item && item.getAttribute('data-cpf-id') !== draft.dragFieldId) item.classList.add('is-drag-over');
    });
    builder.addEventListener('drop', function (e) {
      if (!e.target.closest('[data-cpf-canvas]')) return;
      e.preventDefault();
      var targetIdx = fieldIndexFromEvent(e);
      if (targetIdx === -1) targetIdx = draft.fields.length;
      if (draft.dragType) addField(draft.dragType, targetIdx);
      else if (draft.dragFieldId) {
        var from = draft.fields.findIndex(function (field) { return field.id === draft.dragFieldId; });
        if (from !== -1) {
          var moved = draft.fields.splice(from, 1)[0];
          if (from < targetIdx) targetIdx--;
          draft.fields.splice(targetIdx, 0, moved);
          draft.selectedFieldId = moved.id;
          draft.dirty = true;
        }
        renderClientProfileBuilder(modal, draft);
      }
      draft.dragType = null;
      draft.dragFieldId = null;
    });
    builder.addEventListener('dragend', function () {
      draft.dragType = null;
      draft.dragFieldId = null;
      canvas.querySelectorAll('.is-dragging, .is-drag-over').forEach(function (el) { el.classList.remove('is-dragging', 'is-drag-over'); });
    });
    var reset = modal.querySelector('[data-cpf-reset]');
    if (reset) reset.addEventListener('click', function () {
      var t = clientTypeById(draft.clientTypeId);
      draft.fields = defaultClientProfileFields(t);
      draft.selectedFieldId = draft.fields[1] ? draft.fields[1].id : null;
      draft.dirty = true;
      renderClientProfileBuilder(modal, draft);
      toast('info', 'Formularul a revenit la structura recomandată pentru tipul ales.');
    });
  }

  function newClientModalBody(ctOptions) {
    return '<div class="sa-onboarding-progress" aria-label="Pașii creării contului">' +
        '<div class="sa-onboarding-progress__step is-active" data-onboarding-progress="1"><span>1</span><div><b>Contul de business</b><small>Identitate și plan</small></div></div>' +
        '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' +
        '<div class="sa-onboarding-progress__step" data-onboarding-progress="2"><span>2</span><div><b>Formularul de înrolare</b><small>Datele clienților săi</small></div></div>' +
      '</div>' +
      '<section class="sa-onboarding-step" data-onboarding-step="1">' +
        fieldHtml('Denumire firmă', '<input type="text" class="input" data-f="name" placeholder="ex. FiscalPro S.R.L.">', null, 'nume') +
        fieldHtml('Tip de client', '<select class="select" data-f="ctype"><option value="">Selectează tipul...</option>' + ctOptions + '</select>', 'Determină verticalele, fluxurile și formularul recomandat.', 'tip') +
        fieldHtml('Plan', '<select class="select" data-f="tier"><option value="baza">Bază</option><option value="plus" selected>Plus</option><option value="ent">Enterprise</option></select>') +
        '<div data-ct-preview class="sa-ct-preview"></div>' +
      '</section>' +
      '<section class="sa-onboarding-step" data-onboarding-step="2" hidden>' +
        '<div class="sa-cpf-head"><div><b>Construiește formularul pentru clienții acestei firme</b><p>Structura pornește de la tipul selectat și rămâne specifică acestui cont.</p></div>' +
          '<div class="sa-cpf-head__actions"><span class="pill pill--neutral" data-cpf-count>0 câmpuri</span><button class="btn btn--ghost" type="button" data-cpf-reset><span class="material-symbols-outlined" aria-hidden="true">restart_alt</span>Revino la recomandări</button></div></div>' +
        '<div class="sa-cpf-builder" data-cpf-builder>' +
          '<aside class="sa-cpf-toolbox" aria-label="Componente disponibile">' + clientProfileToolboxHtml() + '</aside>' +
          '<section class="sa-cpf-canvas-wrap" aria-label="Ordinea câmpurilor"><div class="sa-cpf-canvas-meta">Așa va arăta formularul la înrolare</div><div class="sa-cpf-canvas" data-cpf-canvas></div></section>' +
          '<aside class="sa-cpf-properties" aria-label="Proprietățile câmpului" data-cpf-properties></aside>' +
        '</div>' +
        '<span class="form-error sa-cpf-error" data-cpf-error role="alert"></span>' +
      '</section>';
  }

  function openNewClientModal(root, preferredTypeId) {
    var ctOptions = clientTypesAll().map(function (t) {
      var ready = !!((t.verticalIds || []).length && (t.defaultTemplateIds || []).length);
      return '<option value="' + esc(t.id) + '"' + (t.id === preferredTypeId && ready ? ' selected' : '') +
        (ready ? '' : ' disabled') + '>' + esc(t.name) + (ready ? '' : ' — configurare incompletă') + '</option>';
    }).join('');
    var draft = { step: 1, fields: [], selectedFieldId: null, clientTypeId: '', dirty: false, dragType: null, dragFieldId: null };
    saModal({
      title: 'Cont de business nou',
      subtitle: 'Pasul 1 din 2 · Definește contul care intră în Scriptica.',
      bodyHtml: newClientModalBody(ctOptions),
      submitLabel: 'Continuă',
      wide: true,
      isDirty: function () { return draft.dirty; },
      onOpen: function (m) {
        var dialog = m.querySelector('.modal__dialog');
        var subtitle = m.querySelector('.modal__subtitle');
        var submit = m.querySelector('[data-modal-submit]');
        var cancel = m.querySelector('[data-modal-cancel]');
        var helper = m.querySelector('.modal__footer-helper');
        var sel = m.querySelector('[data-f="ctype"]');
        var prev = m.querySelector('[data-ct-preview]');
        dialog.classList.add('sa-client-onboarding-modal');
        cancel.insertAdjacentHTML('beforebegin', '<button class="btn btn--ghost" type="button" data-onboarding-back hidden><span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>Înapoi</button>');
        var back = m.querySelector('[data-onboarding-back]');

        function showStep(step) {
          draft.step = step;
          dialog.classList.toggle('is-builder-step', step === 2);
          m.querySelectorAll('[data-onboarding-step]').forEach(function (section) { section.hidden = section.getAttribute('data-onboarding-step') !== String(step); });
          m.querySelectorAll('[data-onboarding-progress]').forEach(function (item) {
            var n = parseInt(item.getAttribute('data-onboarding-progress'), 10);
            item.classList.toggle('is-active', n === step);
            item.classList.toggle('is-complete', n < step);
          });
          back.hidden = step === 1;
          cancel.textContent = step === 1 ? 'Anulează' : 'Renunță';
          submit.innerHTML = step === 1 ? 'Continuă<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' : 'Creează contul<span class="material-symbols-outlined" aria-hidden="true">check</span>';
          subtitle.textContent = step === 1 ? 'Pasul 1 din 2 · Definește contul care intră în Scriptica.' : 'Pasul 2 din 2 · Configurează datele cerute la înrolarea clienților săi.';
          helper.textContent = step === 1 ? 'Contul se creează după configurarea ambilor pași.' : 'Formularul poate fi ajustat ulterior din profilul contului.';
          if (step === 2) {
            renderClientProfileBuilder(m, draft);
            window.setTimeout(function () {
              var first = m.querySelector('[data-cpf-add]');
              if (first) first.focus();
            }, 0);
          }
        }
        draft.showStep = showStep;
        function updatePreview() {
          var t = clientTypeById(sel.value);
          if (!t) { prev.innerHTML = ''; return; }
          var vs = (t.verticalIds || []).map(verticalById).filter(Boolean)
            .map(function (v) { return v.name; }).join(' · ');
          prev.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">downloading</span>' +
            'Clientul va primi: <b>' + esc(vs) + '</b> cu ' + (t.defaultTemplateIds || []).length + ' fluxuri publicate.';
        }
        sel.addEventListener('change', updatePreview);
        m.querySelectorAll('[data-onboarding-step="1"] input, [data-onboarding-step="1"] select').forEach(function (control) {
          control.addEventListener('input', function () { draft.dirty = true; });
          control.addEventListener('change', function () { draft.dirty = true; });
        });
        back.addEventListener('click', function () { showStep(1); });
        bindClientProfileBuilder(m, draft);
        updatePreview();
        showStep(1);
      },
      onSubmit: function (m, close) {
        clearFieldErrors(m);
        var name = fval(m, 'name');
        var t = clientTypeById(m.querySelector('[data-f="ctype"]').value);
        if (draft.step === 1) {
          setFieldError(m, 'nume', name ? '' : 'Denumirea firmei este obligatorie.');
          setFieldError(m, 'tip', t ? '' : 'Selectează tipul de client.');
          if (!name || !t) return;
          if (draft.clientTypeId !== t.id) {
            draft.clientTypeId = t.id;
            draft.fields = defaultClientProfileFields(t);
            draft.selectedFieldId = draft.fields[1] ? draft.fields[1].id : null;
          }
          draft.dirty = true;
          draft.showStep(2);
          return;
        }
        var inputFields = draft.fields.filter(function (field) { return field.type !== 'section_title'; });
        var builderError = m.querySelector('[data-cpf-error]');
        if (!inputFields.length) {
          builderError.textContent = 'Adaugă cel puțin un câmp în formularul de înrolare.';
          builderError.style.display = 'block';
          return;
        }
        builderError.textContent = '';
        builderError.style.display = '';
        var tier = m.querySelector('[data-f="tier"]').value;
        var hasAudit = (t.verticalIds || []).indexOf('vert_audit') !== -1;
        var recordId = uid('cli', name, clients());
        var rec = {
          id: recordId, name: name, domain: t.name, clientTypeId: t.id,
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
          clientProfileSchema: {
            id: 'cps_' + recordId,
            version: 1,
            sourceClientTypeId: t.id,
            configuredAt: '20.04.2026',
            fields: deepCopy(draft.fields)
          },
          technical: { vmLoad: [4, 6, 5, 9, 7, 6, 4, 3], vmPeakIdx: 3, aiPerMonth: '0', docsStored: '0', uptime30: 100, lastIncident: '—' },
          downtime: { incidents: [] }
        };
        scripticaFlowSave('saClient', rec);
        close();
        toast('success', 'Contul „' + name + '” a fost creat cu un formular de înrolare de ' + inputFields.length + ' câmpuri.');
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
