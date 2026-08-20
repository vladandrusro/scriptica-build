/* ============================================================
   Scriptica — Organigramă (instituții publice, ex. PMB)
   Organigrama dictează nomenclatorul arhivistic (obs. prototip
   3 AUG 2026): fiecare structură „vie" își expune de aici
   dosarele de arhivă (folder), fluxurile (forum) și notificările
   (clopoțel). Canvas panoramabil cu zoom; sertar lateral cu
   detaliile structurii. Today is pinned to 2026-04-20.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  var root = document.getElementById('organigrama-main');
  if (!MOCK || !root) return;

  var TODAY_ISO = '2026-04-20';
  var CLOSED_YEAR_BEFORE = 2026; /* anii anteriori sunt „închiși" în arhivă */

  var STATUS_LABELS = {
    analiza: 'Analiză',
    asteapta_documente: 'Așteaptă documente',
    in_verificare: 'În verificare',
    spre_aprobare: 'Spre aprobare',
    aprobata: 'Aprobată',
    finalizat: 'Finalizat',
    inchisa: 'Închisă',
    anulata: 'Anulată',
    intarziere: 'În întârziere'
  };
  var CLOSED_STATUSES = ['finalizat', 'inchisa', 'anulata'];

  var state = {
    x: 0, y: 0, scale: 1,
    drawer: null,          /* { node, live, tab } */
    query: ''
  };

  document.addEventListener('DOMContentLoaded', init);

  function tenantClientType() {
    if (typeof window.scripticaClientTypeById !== 'function' || typeof window.scripticaTenantClientTypeId !== 'function') return null;
    return window.scripticaClientTypeById(window.scripticaTenantClientTypeId());
  }

  function organigrama() {
    return (MOCK.pmb && MOCK.pmb.organigrama) || null;
  }

  function init() {
    var clientType = tenantClientType();
    if (!clientType || clientType.archiveRouting !== 'nomenclator' || !organigrama()) {
      root.innerHTML =
        '<div class="org-guard">' +
          '<span class="material-symbols-outlined" aria-hidden="true">lan</span>' +
          '<h2>Organigrama nu este disponibilă pentru acest cont</h2>' +
          '<p>Organigrama descrie instituțiile publice cu arhivă organizată după nomenclatorul arhivistic. Alege contul „Primăria Municipiului București" pentru a o vedea.</p>' +
        '</div>';
      return;
    }
    render();
    fitToCanvas();
  }

  /* ---------- Datele structurilor „vii" ---------- */

  function archiveFoldersByCode(code) {
    var tree = typeof window.scripticaArchiveTreeFor === 'function'
      ? window.scripticaArchiveTreeFor(window.scripticaTenantClientTypeId()) : [];
    return (tree || []).filter(function (folder) { return !folder.system && folder.directieCode === code; });
  }

  function docTypeNames(folder) {
    var names = [];
    (folder.docTypeIds || []).forEach(function (id) {
      var dt = typeof window.scripticaDocTypeById === 'function' ? window.scripticaDocTypeById(id) : null;
      if (dt) names.push(dt.name);
    });
    return names;
  }

  function pmbDocuments() {
    return (MOCK.documents || []).filter(function (doc) {
      return String(doc.domain || '').indexOf('pmb_') === 0;
    });
  }

  function docsForFolder(folder) {
    var names = docTypeNames(folder);
    return pmbDocuments().filter(function (doc) {
      if (doc.archiveFolderId) return doc.archiveFolderId === folder.id;
      return names.indexOf(doc.tipDocument) !== -1;
    });
  }

  function flowsForDirectie(directieName) {
    return (MOCK.flowItems || []).filter(function (item) {
      if (item.archiveContainer !== directieName) return false;
      if (typeof window.viewInScope === 'function' && !window.viewInScope(item.domain)) return false;
      return true;
    });
  }

  function addDaysISO(iso, days) {
    var date = new Date(String(iso || '') + 'T00:00:00');
    if (isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + (parseInt(days, 10) || 0));
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function formatDateRo(iso) {
    if (!iso) return '—';
    var parts = String(iso).split('-');
    return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : iso;
  }

  function flowDeadline(item) {
    var template = ((MOCK.superAdmin || {}).flowTemplates || []).find(function (t) { return t.id === item.templateId; });
    var step = template && template.steps ? template.steps[(parseInt(item.currentStep, 10) || 1) - 1] : null;
    return step ? addDaysISO(item.startDate, step.offsetDays) : '';
  }

  function isFlowClosed(item) {
    return CLOSED_STATUSES.indexOf(item.status) !== -1;
  }

  /* Sinteza unei direcții vii: dosare + fluxuri + notificări derivate. */
  function liveInfoFor(code) {
    var folders = archiveFoldersByCode(code);
    if (!folders.length) return null;
    var directieName = folders[0].directie;
    var folderRows = folders.map(function (folder) {
      var docs = docsForFolder(folder);
      var closedDocs = docs.filter(function (doc) {
        return new Date(doc.uploadedAt).getFullYear() < CLOSED_YEAR_BEFORE;
      });
      return { folder: folder, docs: docs, closedDocs: closedDocs };
    });
    var flows = flowsForDirectie(directieName).map(function (item) {
      var deadline = flowDeadline(item);
      return {
        item: item,
        deadline: deadline,
        overdue: !isFlowClosed(item) && deadline && deadline < TODAY_ISO
      };
    }).sort(function (a, b) {
      var closedA = isFlowClosed(a.item) ? 1 : 0;
      var closedB = isFlowClosed(b.item) ? 1 : 0;
      if (closedA !== closedB) return closedA - closedB;
      return String(a.deadline).localeCompare(String(b.deadline));
    });

    var flowIds = flows.map(function (row) { return row.item.id; });
    var unread = (MOCK.messages || []).filter(function (message) {
      return flowIds.indexOf(message.situationId) !== -1 && message.read === false && message.sender !== 'system';
    });

    var notifications = [];
    flows.forEach(function (row) {
      if (row.overdue) {
        notifications.push({
          severity: 'critical', icon: 'schedule',
          title: 'Termen depășit: ' + row.item.name,
          meta: 'Pasul ' + row.item.currentStep + ' — scadent la ' + formatDateRo(row.deadline),
          href: 'situatie-detaliu.html?flowId=' + encodeURIComponent(row.item.id)
        });
      }
      if (row.item.status === 'spre_aprobare') {
        notifications.push({
          severity: 'pending', icon: 'approval',
          title: 'Așteaptă aprobare: ' + row.item.name,
          meta: row.item.templateName || '',
          href: 'situatie-detaliu.html?flowId=' + encodeURIComponent(row.item.id)
        });
      }
    });
    unread.forEach(function (message) {
      var flow = flows.find(function (row) { return row.item.id === message.situationId; });
      notifications.push({
        severity: 'info', icon: 'mark_email_unread',
        title: 'Mesaj necitit — ' + (message.senderName || 'expeditor extern'),
        meta: flow ? flow.item.name : '',
        href: 'situatie-detaliu.html?flowId=' + encodeURIComponent(message.situationId)
      });
    });
    var closedTotal = 0;
    folderRows.forEach(function (row) { closedTotal += row.closedDocs.length; });
    if (closedTotal) {
      notifications.push({
        severity: 'info', icon: 'lock',
        title: 'An arhivistic închis: ' + (CLOSED_YEAR_BEFORE - 1),
        meta: closedTotal + (closedTotal === 1 ? ' document cu acces reglementat' : ' documente cu acces reglementat'),
        href: 'arhiva.html'
      });
    }

    return {
      code: code,
      directieName: directieName,
      folders: folderRows,
      flows: flows,
      notifications: notifications,
      activeFlows: flows.filter(function (row) { return !isFlowClosed(row.item); }).length,
      hasCritical: notifications.some(function (n) { return n.severity === 'critical'; })
    };
  }

  /* Sinteza întregii instituții (cardul Primarului General). */
  function liveInfoAll() {
    var codes = [];
    var org = organigrama();
    function collect(nodes) {
      (nodes || []).forEach(function (node) {
        if (node.directieCode) codes.push(node.directieCode);
        collect(node.children);
      });
    }
    collect(org.directiiGenerale);
    collect(org.subordonareDirecta);
    var merged = { code: '', directieName: 'Toată instituția', folders: [], flows: [], notifications: [], activeFlows: 0, hasCritical: false };
    codes.forEach(function (code) {
      var info = liveInfoFor(code);
      if (!info) return;
      merged.folders = merged.folders.concat(info.folders);
      merged.flows = merged.flows.concat(info.flows);
      merged.notifications = merged.notifications.concat(info.notifications);
      merged.activeFlows += info.activeFlows;
      merged.hasCritical = merged.hasCritical || info.hasCritical;
    });
    return merged;
  }

  /* ---------- Randare ---------- */

  function render() {
    var org = organigrama();
    root.innerHTML =
      '<div class="org-page">' +
        '<header class="org-page-header">' +
          '<div>' +
            '<h1>Organigramă</h1>' +
            '<p class="org-page-header__sub">' + esc((MOCK.pmb && MOCK.pmb.institution) || 'Instituție publică') +
              ' — organigrama dictează nomenclatorul arhivistic; structurile evidențiate își expun dosarele, fluxurile și notificările.</p>' +
          '</div>' +
          '<div class="org-toolbar">' +
            '<div class="org-search">' +
              '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
              '<input type="search" id="org-search" placeholder="Caută o structură..." value="' + esc(state.query) + '" aria-label="Caută o structură în organigramă">' +
            '</div>' +
            '<div class="org-zoom" role="group" aria-label="Zoom">' +
              '<button class="org-zoom__btn" type="button" data-zoom="out" title="Micșorează"><span class="material-symbols-outlined" aria-hidden="true">remove</span></button>' +
              '<span class="org-zoom__level" data-zoom-level>100%</span>' +
              '<button class="org-zoom__btn" type="button" data-zoom="in" title="Mărește"><span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
              '<button class="org-zoom__btn" type="button" data-zoom="fit" title="Încadrează organigrama"><span class="material-symbols-outlined" aria-hidden="true">fit_screen</span></button>' +
            '</div>' +
            '<div class="org-legend">' +
              '<span class="org-legend__item"><span class="org-legend__swatch org-legend__swatch--live"></span>cu evidențe în Scriptica</span>' +
              '<span class="org-legend__item"><span class="org-legend__swatch"></span>fără evidențe (demo)</span>' +
            '</div>' +
          '</div>' +
        '</header>' +
        '<div class="org-canvas" data-canvas>' +
          '<div class="org-world" data-world>' + worldHtml(org) + '</div>' +
        '</div>' +
      '</div>' +
      drawerHtml();

    bind();
  }

  function worldHtml(org) {
    var pgInfo = liveInfoAll();
    var conducere =
      '<div class="org-row">' +
        cellHtml(org.conducere[0]) +
        primarCellHtml(org.conducere[1], pgInfo) +
        cellHtml(org.conducere[2]) +
      '</div>';

    /* fiecare bandă poartă propriul racord vertical continuu (::before)
       către banda anterioară; eticheta plutește în stânga, fără să rupă linia */
    var demnitari =
      '<div class="org-band">' +
        '<div class="org-row org-row--railed">' +
          org.demnitari.map(function (node) { return cellHtml(node); }).join('') +
        '</div>' +
      '</div>';

    var directiiGenerale =
      '<div class="org-band org-band--labeled">' +
        '<div class="org-band-label"><span class="material-symbols-outlined" aria-hidden="true">account_tree</span>Direcții generale — aparatul de specialitate</div>' +
        '<div class="org-row org-row--railed">' +
          org.directiiGenerale.map(function (node) { return branchCellHtml(node); }).join('') +
        '</div>' +
      '</div>';

    var subordonare =
      '<div class="org-band org-band--labeled">' +
        '<div class="org-band-label"><span class="material-symbols-outlined" aria-hidden="true">supervisor_account</span>În subordinea directă a Primarului General</div>' +
        '<div class="org-direct-panel"><div class="org-direct-grid">' +
          org.subordonareDirecta.map(function (node) { return cardHtml(node); }).join('') +
        '</div></div>' +
      '</div>';

    return conducere + demnitari + directiiGenerale + subordonare;
  }

  function cellHtml(node) {
    return '<div class="org-cell">' + cardHtml(node) + '</div>';
  }

  function branchCellHtml(node) {
    var children = (node.children || []).map(function (child) {
      return '<div class="org-cell">' + cardHtml(child) + '</div>';
    }).join('');
    return '<div class="org-cell">' + cardHtml(node) +
      (children ? '<div class="org-children">' + children + '</div>' : '') +
    '</div>';
  }

  function primarCellHtml(node, info) {
    var actions = actionsHtml('__all__', info);
    return '<div class="org-cell">' +
      '<div class="org-card org-card--primar" data-org-code="__all__" role="button" tabindex="0" aria-label="Deschide sinteza întregii instituții" data-org-node="' + esc(node.id) + '" data-org-name="' + esc(normalize(node.name)) + '">' +
        '<span class="org-card__name">' + esc(node.name) + '</span>' +
        actions +
      '</div>' +
    '</div>';
  }

  function cardHtml(node) {
    var info = node.directieCode ? liveInfoFor(node.directieCode) : null;
    var classes = 'org-card ' + (info ? 'org-card--live' : 'org-card--muted');
    var meta = '';
    if (info || node.posts) {
      meta = '<span class="org-card__meta">' +
        (info ? '<span class="org-card__code">' + esc(node.directieCode) + '</span>' : '') +
        (node.posts ? '<span class="org-card__posts">' + node.posts + ' posturi</span>' : '') +
      '</span>';
    }
    return '<div class="' + classes + '"' + (info ? ' data-org-code="' + esc(node.directieCode) + '" role="button" tabindex="0" aria-label="Deschide detaliile structurii ' + esc(node.name) + '"' : '') + ' data-org-node="' + esc(node.id) + '" data-org-name="' + esc(normalize(node.name)) + '">' +
      '<span class="org-card__name">' + esc(node.name) + '</span>' +
      meta +
      (info ? actionsHtml(node.directieCode, info) : '') +
    '</div>';
  }

  function actionsHtml(code, info) {
    var notifBadge = info.notifications.length
      ? '<span class="org-action__badge' + (info.hasCritical ? ' org-action__badge--critical' : '') + '">' + info.notifications.length + '</span>'
      : '<span class="org-action__badge org-action__badge--zero">0</span>';
    return '<span class="org-card__actions">' +
      '<button type="button" class="org-action" data-org-open="' + esc(code) + '" data-org-tab="fluxuri" title="Fluxurile structurii" aria-label="Fluxurile structurii">' +
        '<span class="material-symbols-outlined" aria-hidden="true">forum</span>' +
        '<span class="org-action__badge' + (info.activeFlows ? '' : ' org-action__badge--zero') + '">' + info.activeFlows + '</span>' +
      '</button>' +
      '<button type="button" class="org-action" data-org-open="' + esc(code) + '" data-org-tab="notificari" title="Notificările structurii" aria-label="Notificările structurii">' +
        '<span class="material-symbols-outlined" aria-hidden="true">notifications</span>' + notifBadge +
      '</button>' +
      '<button type="button" class="org-action" data-org-open="' + esc(code) + '" data-org-tab="dosare" title="Dosarele de arhivă ale structurii" aria-label="Dosarele de arhivă ale structurii">' +
        '<span class="material-symbols-outlined" aria-hidden="true">folder</span>' +
        '<span class="org-action__badge">' + info.folders.length + '</span>' +
      '</button>' +
    '</span>';
  }

  /* ---------- Sertarul ---------- */

  function drawerHtml() {
    return '<aside class="org-drawer" id="org-drawer" aria-label="Detaliile structurii selectate" aria-hidden="true"></aside>';
  }

  function openDrawer(code, tab) {
    var info = code === '__all__' ? liveInfoAll() : liveInfoFor(code);
    if (!info) return;
    state.drawer = { code: code, tab: tab || 'dosare' };
    renderDrawer(info);
  }

  function closeDrawer() {
    state.drawer = null;
    var drawer = document.getElementById('org-drawer');
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
  }

  function renderDrawer(info) {
    var drawer = document.getElementById('org-drawer');
    if (!drawer || !state.drawer) return;
    var tab = state.drawer.tab;
    var title = state.drawer.code === '__all__'
      ? 'Primar General — toată instituția'
      : info.directieName;

    var tabs = [
      { id: 'dosare', label: 'Dosare', count: info.folders.length },
      { id: 'fluxuri', label: 'Fluxuri', count: info.flows.length },
      { id: 'notificari', label: 'Notificări', count: info.notifications.length }
    ];

    drawer.innerHTML =
      '<header class="org-drawer__header">' +
        '<div class="org-drawer__title">' +
          '<h2>' + esc(title) + '</h2>' +
          '<span class="org-card__meta">' +
            (state.drawer.code !== '__all__' ? '<span class="org-card__code">Direcția ' + esc(state.drawer.code) + ' în nomenclator</span>' : '') +
            '<span class="org-card__posts">' + info.folders.length + (info.folders.length === 1 ? ' dosar' : ' dosare') + ' · ' +
              info.activeFlows + ' fluxuri active</span>' +
          '</span>' +
        '</div>' +
        '<button type="button" class="org-drawer__close" data-org-close aria-label="Închide panoul">' +
          '<span class="material-symbols-outlined" aria-hidden="true">close</span>' +
        '</button>' +
      '</header>' +
      '<nav class="org-drawer__tabs" role="tablist">' +
        tabs.map(function (item) {
          return '<button type="button" role="tab" class="org-tab' + (tab === item.id ? ' is-active' : '') + '" data-org-drawer-tab="' + item.id + '" aria-selected="' + (tab === item.id) + '">' +
            esc(item.label) + '<span class="org-tab__count">' + item.count + '</span></button>';
        }).join('') +
      '</nav>' +
      '<div class="org-drawer__body">' + drawerBodyHtml(info, tab) + '</div>';

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    bindDrawer(info);
  }

  function drawerBodyHtml(info, tab) {
    if (tab === 'dosare') return dosareHtml(info);
    if (tab === 'fluxuri') return fluxuriHtml(info);
    return notificariHtml(info);
  }

  function dosareHtml(info) {
    if (!info.folders.length) return emptyHtml('folder_off', 'Nicio structură de arhivă pentru această structură.');
    var bySrv = {};
    var order = [];
    info.folders.forEach(function (row) {
      var key = (row.folder.serviciuCode || '') + '. ' + (row.folder.serviciu || 'Serviciu');
      if (!bySrv[key]) { bySrv[key] = []; order.push(key); }
      bySrv[key].push(row);
    });
    return order.map(function (key) {
      var rows = bySrv[key].map(function (row) {
        var folder = row.folder;
        return '<a class="org-item" href="arhiva.html?folder=' + encodeURIComponent(folder.id) + '">' +
          '<span class="org-item__icon"><span class="material-symbols-outlined" aria-hidden="true">folder</span></span>' +
          '<span class="org-item__body">' +
            '<span class="org-item__title">' + esc(folder.name) + '</span>' +
            '<span class="org-item__meta">' +
              '<span>' + row.docs.length + (row.docs.length === 1 ? ' document' : ' documente') + '</span>' +
              (folder.retention ? '<span>· păstrare: ' + esc(folder.retention) + '</span>' : '') +
              (row.closedDocs.length ? '<span>· ' + row.closedDocs.length + ' în ani închiși</span>' : '') +
            '</span>' +
          '</span>' +
          '<span class="org-item__open"><span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></span>' +
        '</a>';
      }).join('');
      return '<h3 class="org-drawer__group">' + esc(key) + '</h3>' + rows;
    }).join('');
  }

  function statusPill(row) {
    var status = row.item.status;
    var label = STATUS_LABELS[status] || status;
    var cls = 'pill--neutral';
    if (row.overdue) { cls = 'pill--critical'; label = 'Termen depășit'; }
    else if (status === 'finalizat' || status === 'inchisa' || status === 'aprobata') cls = 'pill--success';
    else if (status === 'spre_aprobare' || status === 'asteapta_documente') cls = 'pill--pending';
    return '<span class="pill ' + cls + '">' + esc(label) + '</span>';
  }

  function fluxuriHtml(info) {
    if (!info.flows.length) return emptyHtml('forum', 'Niciun flux înregistrat pentru această structură.');
    return info.flows.map(function (row) {
      var vertical = typeof window.scripticaEffectiveVertical === 'function'
        ? window.scripticaEffectiveVertical(row.item.verticalId) : null;
      return '<a class="org-item" href="situatie-detaliu.html?flowId=' + encodeURIComponent(row.item.id) + '">' +
        '<span class="org-item__icon' + (row.overdue ? ' org-item__icon--critical' : '') + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc((vertical && vertical.icon) || 'account_tree') + '</span></span>' +
        '<span class="org-item__body">' +
          '<span class="org-item__title">' + esc(row.item.name) + '</span>' +
          '<span class="org-item__meta">' +
            statusPill(row) +
            '<span>' + esc(row.item.templateName || '') + '</span>' +
            (row.deadline && !isFlowClosed(row.item) ? '<span>· termen: ' + esc(formatDateRo(row.deadline)) + '</span>' : '') +
          '</span>' +
        '</span>' +
        '<span class="org-item__open"><span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></span>' +
      '</a>';
    }).join('');
  }

  function notificariHtml(info) {
    if (!info.notifications.length) return emptyHtml('notifications_off', 'Nicio notificare — structura este la zi.');
    var iconCls = { critical: ' org-item__icon--critical', pending: ' org-item__icon--pending', info: '' };
    return info.notifications.map(function (item) {
      return '<a class="org-item" href="' + esc(item.href) + '">' +
        '<span class="org-item__icon' + (iconCls[item.severity] || '') + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc(item.icon) + '</span></span>' +
        '<span class="org-item__body">' +
          '<span class="org-item__title">' + esc(item.title) + '</span>' +
          (item.meta ? '<span class="org-item__meta">' + esc(item.meta) + '</span>' : '') +
        '</span>' +
        '<span class="org-item__open"><span class="material-symbols-outlined" aria-hidden="true">open_in_new</span></span>' +
      '</a>';
    }).join('');
  }

  function emptyHtml(icon, text) {
    return '<div class="org-drawer__empty">' +
      '<span class="material-symbols-outlined" aria-hidden="true">' + esc(icon) + '</span>' + esc(text) +
    '</div>';
  }

  /* ---------- Pan / zoom / căutare ---------- */

  function world() { return root.querySelector('[data-world]'); }
  function canvas() { return root.querySelector('[data-canvas]'); }

  function applyTransform() {
    var el = world();
    if (!el) return;
    el.style.transform = 'translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
    var level = root.querySelector('[data-zoom-level]');
    if (level) level.textContent = Math.round(state.scale * 100) + '%';
  }

  function fitToCanvas() {
    var canvasEl = canvas();
    var worldEl = world();
    if (!canvasEl || !worldEl) return;
    var worldWidth = worldEl.scrollWidth || worldEl.offsetWidth;
    var worldHeight = worldEl.scrollHeight || worldEl.offsetHeight;
    if (!worldWidth || !worldHeight) return;
    /* încadrează pe ambele axe: pe ecrane mari organigrama întreagă e
       vizibilă (inclusiv banda de subordonare directă), pe ecrane mici
       scala nu coboară sub 35% — restul se panoramează */
    var fitW = (canvasEl.clientWidth - 32) / worldWidth;
    var fitH = (canvasEl.clientHeight - 32) / worldHeight;
    state.scale = Math.min(1, Math.max(0.35, Math.min(fitW, fitH)));
    state.x = Math.max(16, (canvasEl.clientWidth - worldWidth * state.scale) / 2);
    state.y = Math.max(16, (canvasEl.clientHeight - worldHeight * state.scale) / 2);
    applyTransform();
  }

  function zoomAt(cx, cy, factor) {
    var next = Math.min(1.6, Math.max(0.3, state.scale * factor));
    var ratio = next / state.scale;
    state.x = cx - (cx - state.x) * ratio;
    state.y = cy - (cy - state.y) * ratio;
    state.scale = next;
    applyTransform();
  }

  function applySearch() {
    var q = normalize(state.query);
    root.querySelectorAll('.org-card').forEach(function (card) {
      card.classList.remove('is-dim', 'is-hit');
      if (!q) return;
      var hit = card.getAttribute('data-org-name').indexOf(q) !== -1;
      card.classList.add(hit ? 'is-hit' : 'is-dim');
    });
  }

  /* ---------- Legare evenimente ---------- */

  function bind() {
    var canvasEl = canvas();
    if (!canvasEl) return;

    /* pan cu mouse-ul (nu pornește de pe butoane/linkuri); un drag real
       nu trebuie să deschidă sertarul cardului la mouseup */
    var panning = null;
    var panMoved = false;
    canvasEl.addEventListener('mousedown', function (e) {
      if (e.target.closest('button, a, input')) return;
      panning = { startX: e.clientX, startY: e.clientY, originX: state.x, originY: state.y };
      panMoved = false;
      canvasEl.classList.add('is-panning');
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!panning) return;
      if (Math.abs(e.clientX - panning.startX) + Math.abs(e.clientY - panning.startY) > 4) panMoved = true;
      state.x = panning.originX + (e.clientX - panning.startX);
      state.y = panning.originY + (e.clientY - panning.startY);
      applyTransform();
    });
    document.addEventListener('mouseup', function () {
      panning = null;
      canvasEl.classList.remove('is-panning');
    });

    /* întregul card al unei structuri vii deschide sertarul (iconițele
       țintesc direct fila lor) */
    canvasEl.addEventListener('click', function (e) {
      if (panMoved || e.target.closest('button, a, input')) return;
      var card = e.target.closest('[data-org-code]');
      if (card) openDrawer(card.getAttribute('data-org-code'), 'dosare');
    });
    canvasEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('[data-org-code]');
      if (card) { e.preventDefault(); openDrawer(card.getAttribute('data-org-code'), 'dosare'); }
    });

    /* zoom cu Ctrl/⌘ + scroll; scroll simplu = panoramare */
    canvasEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = canvasEl.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.1 : 0.9);
      } else {
        state.x -= e.deltaX;
        state.y -= e.deltaY;
        applyTransform();
      }
    }, { passive: false });

    root.querySelectorAll('[data-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-zoom');
        var canvasRect = canvasEl.getBoundingClientRect();
        if (kind === 'fit') fitToCanvas();
        else zoomAt(canvasRect.width / 2, canvasRect.height / 2, kind === 'in' ? 1.2 : 1 / 1.2);
      });
    });

    var search = document.getElementById('org-search');
    if (search) {
      search.addEventListener('input', function () {
        state.query = search.value;
        applySearch();
      });
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          state.query = '';
          search.value = '';
          applySearch();
        }
      });
    }

    /* deschiderea sertarului de pe iconițele structurilor vii */
    root.querySelectorAll('[data-org-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDrawer(btn.getAttribute('data-org-open'), btn.getAttribute('data-org-tab'));
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && state.drawer) closeDrawer();
    });

    window.addEventListener('resize', function () {
      if (!state.drawer) fitToCanvas();
    });

    applySearch();
  }

  function bindDrawer(info) {
    var drawer = document.getElementById('org-drawer');
    if (!drawer) return;
    var closeBtn = drawer.querySelector('[data-org-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('[data-org-drawer-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.drawer.tab = btn.getAttribute('data-org-drawer-tab');
        renderDrawer(info);
      });
    });
  }

  /* ---------- Utilitare ---------- */

  function normalize(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
