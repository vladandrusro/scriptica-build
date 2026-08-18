/* ============================================================
   Scriptica — Biblioteca de widget-uri de dashboard
   Catalogul de „cutii de conținut" configurabile per client.
   Folosită de:
     1. acasa.html — redă layout-ul contului HQ previzualizat
     2. super-admin-clienti.html — ultimul pas al înrolării
     3. super-admin-dashboard.html — builderul HQ (paletă + preview live)
   Fiecare widget are un `domain` (null = generic) — paleta oferă doar
   widget-urile acoperite de verticalele clientului configurat.
   Today is pinned to 2026-04-20 for stable prototype data.
   ============================================================ */

(function () {
  'use strict';

  var TODAY = new Date('2026-04-20T00:00:00');

  function MOCK() { return window.SCRIPTICA_MOCK; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var p = String(iso).split('T')[0].split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
  }
  function daysDiff(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.ceil((d - TODAY) / 86400000);
  }
  function addDaysISO(iso, n) {
    var dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return iso;
    dt.setDate(dt.getDate() + (parseInt(n, 10) || 0));
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function emptyState(icon, msg) {
    return '<div class="empty-state"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span><p>' + esc(msg) + '</p></div>';
  }
  function progressClass(done, total) {
    if (!total) return 'is-low';
    var r = done / total;
    return r < 0.25 ? 'is-low' : (r < 0.75 ? 'is-mid' : 'is-high');
  }
  function daysBadge(days) {
    if (days == null) return '';
    var cls = days < 0 ? 'dw-days--late' : (days <= 3 ? 'dw-days--soon' : 'dw-days--ok');
    var label = days < 0 ? (Math.abs(days) + ' zile întârziere') : (days === 0 ? 'azi' : days + ' zile');
    /* compus pe .pill (geometria din design system) — modificatorul dă doar culorile */
    return '<span class="pill dw-days ' + cls + '">' + label + '</span>';
  }

  var STATUS_LABELS = {
    analiza: 'Analiză', asteapta_documente: 'Așteaptă Documente', in_verificare: 'În Verificare',
    spre_aprobare: 'Spre Aprobare', aprobata: 'Aprobată', finalizat: 'Finalizat',
    inchisa: 'Închisă', anulata: 'Anulată', intarziere: 'În Întârziere'
  };
  function statusDot(status) {
    return '<span class="status-dot status-dot--' + esc(status) + '"></span>' + esc(STATUS_LABELS[status] || status);
  }

  /* ---------- surse de date ---------- */

  function activeSituations() {
    return (MOCK().situations || []).filter(function (s) {
      return s.status !== 'inchisa' && s.status !== 'anulata';
    });
  }
  function activeMissions() {
    return (MOCK().auditMissions || []).filter(function (m) {
      return m.status !== 'aprobata' && m.status !== 'anulata' && m.status !== 'inchisa';
    });
  }
  function activeVerticalIds(ct, verticalIds) {
    if (Array.isArray(verticalIds)) return verticalIds.slice();
    var view = (typeof window.getCurrentView === 'function') ? window.getCurrentView() : 'complet';
    if (view !== 'superadmin' && typeof window.scripticaTenantActiveVerticalIds === 'function') {
      return window.scripticaTenantActiveVerticalIds().filter(function (verticalId) {
        var vertical = window.scripticaVerticalById(verticalId);
        return vertical && (typeof window.viewInScope !== 'function' || window.viewInScope(vertical.domain));
      });
    }
    if (view === 'superadmin' && typeof window.scripticaFlowVerticals === 'function') {
      return window.scripticaFlowVerticals().map(function (vertical) { return vertical.id; });
    }
    return (ct && ct.verticalIds) || [];
  }
  function ctDomains(ct, verticalIds) {
    return (verticalIds || activeVerticalIds(ct)).map(function (vid) {
      var v = window.scripticaVerticalById(vid);
      return v ? v.domain : null;
    }).filter(Boolean);
  }
  function effectiveVertical(verticalOrId, client) {
    if (typeof window.scripticaEffectiveVertical === 'function') {
      return window.scripticaEffectiveVertical(verticalOrId, client);
    }
    return typeof verticalOrId === 'string' ? window.scripticaVerticalById(verticalOrId) : verticalOrId;
  }
  function externalParty(ct, client) {
    if (typeof window.scripticaEffectiveExternalParty === 'function') {
      return window.scripticaEffectiveExternalParty(client);
    }
    return { singular: (ct && ct.clientLabel) || 'Client', plural: (ct && ct.clientLabelPlural) || 'Clienți' };
  }
  function archiveDefinitions(ct, client) {
    if (typeof window.scripticaArchiveFolderDefinitionsForClient === 'function') {
      return window.scripticaArchiveFolderDefinitionsForClient(client, true);
    }
    return (ct.archiveTree || []).map(function (folder) {
      return { key: folder.id, name: folder.name, defaultName: folder.name, depth: 0, system: !!folder.system };
    });
  }
  function findFolder(tree, id) {
    for (var i = 0; i < (tree || []).length; i++) {
      if (tree[i].id === id) return tree[i];
      var hit = findFolder(tree[i].children || [], id);
      if (hit) return hit;
    }
    return null;
  }
  function folderTypeNames(folder) {
    var names = [];
    (function walk(n) {
      (n.docTypeIds || []).forEach(function (id) {
        var dt = window.scripticaDocTypeById(id);
        if (dt) names.push(dt.name);
      });
      (n.children || []).forEach(walk);
    })(folder);
    return names;
  }

  function rowsHtml(rows) {
    return '<div class="dw-rows">' + rows.join('') + '</div>';
  }
  function rowHtml(href, title, sub, trail) {
    var inner =
      '<div class="dw-row__main"><div class="dw-row__title">' + title + '</div>' +
        (sub ? '<div class="dw-row__sub">' + sub + '</div>' : '') + '</div>' +
      (trail || '');
    return href
      ? '<a class="dw-row" href="' + esc(href) + '">' + inner + '</a>'
      : '<div class="dw-row">' + inner + '</div>';
  }

  /* ---------- renderers per widget ---------- */

  var RENDERERS = {

    situatii_noi: function (params, ct, verticalIds, client) {
      var terms = effectiveVertical('vert_contabil', client) || { itemLabel: 'Situație', itemLabelPlural: 'Situații' };
      var items = (MOCK().situations || []).filter(function (s) { return s.isNew; });
      var rows = items.slice(0, 5).map(function (s) {
        return rowHtml('situatie-detaliu.html?id=' + esc(s.id), esc(s.clientCompany), esc(s.typeLabel),
          '<span class="pill pill--progress ' + progressClass(s.stepsCompleted, s.totalSteps) + '">' + s.stepsCompleted + '/' + s.totalSteps + '</span>');
      });
      return {
        title: terms.itemLabelPlural + ' noi', icon: 'description', count: items.length,
        bodyHtml: items.length ? rowsHtml(rows) : emptyState('inbox', 'Nu există ' + terms.itemLabelPlural.toLowerCase() + ' noi.'),
        footerHtml: '<button class="btn btn--primary" type="button" data-dw-open-situation>' + terms.itemLabel + ' nouă' +
          '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
          '<a class="ghost-link" href="situatii.html">Toate ' + esc(terms.itemLabelPlural.toLowerCase()) + '</a>'
      };
    },

    alerte: function () {
      var alerts = (MOCK().situations || []).filter(function (s) { return s.status === 'intarziere'; });
      var rows = alerts.slice(0, 5).map(function (s) {
        return rowHtml('situatie-detaliu.html?id=' + esc(s.id), esc(s.clientCompany), esc(s.typeLabel),
          daysBadge(s.daysToDeadline));
      });
      return {
        title: 'Alerte', icon: 'notifications', count: alerts.length,
        bodyHtml: alerts.length ? rowsHtml(rows) : emptyState('check_circle', 'Nicio alertă activă. Totul este la zi.'),
        footerHtml: '<a class="ghost-link" href="situatii.html?filter=intarziere">Toate Alertele</a>'
      };
    },

    flow_summary: function (params, ct, verticalIds, client) {
      var v = effectiveVertical(params && params.verticalId, client);
      if (!v) return { title: 'Flux necunoscut', icon: 'help', count: 0, bodyHtml: emptyState('error', 'Verticala nu mai există în registru.') };
      var rows = [], count = 0, listHref;
      if (v.domain === 'contabil') {
        var sits = activeSituations();
        count = sits.length;
        listHref = 'situatii.html';
        rows = sits.slice(0, 5).map(function (s) {
          return rowHtml('situatie-detaliu.html?id=' + esc(s.id), esc(s.clientCompany), esc(s.typeLabel),
            '<span class="pill pill--progress ' + progressClass(s.stepsCompleted, s.totalSteps) + '">' + s.stepsCompleted + '/' + s.totalSteps + '</span>');
        });
      } else if (v.domain === 'audit') {
        var mis = activeMissions();
        count = mis.length;
        listHref = 'misiuni-audit.html';
        rows = mis.slice(0, 5).map(function (m) {
          return rowHtml('misiune-audit-workspace.html?id=' + esc(m.id), esc(m.name), esc(m.entityName),
            '<span class="dw-status">' + statusDot(m.status) + '</span>');
        });
      } else {
        var items = window.scripticaFlowItemsForVertical(v.id).filter(function (i) { return i.status !== 'finalizat'; });
        count = items.length;
        listHref = 'flux.html?vertical=' + encodeURIComponent(v.id);
        rows = items.slice(0, 5).map(function (i) {
          return rowHtml('situatie-detaliu.html?flowId=' + esc(i.id), esc(i.name), esc(i.clientName || ''),
            '<span class="dw-status">' + statusDot(i.status) + '</span>');
        });
      }
      return {
        title: v.name, icon: v.icon || 'account_tree', count: count,
        bodyHtml: rows.length ? rowsHtml(rows) : emptyState('inbox', 'Niciun element activ în această verticală.'),
        footerHtml: '<a class="ghost-link" href="' + esc(listHref) + '">Vezi toate</a>'
      };
    },

    clienti: function (params, ct, verticalIds, client) {
      var party = externalParty(ct, client);
      var label = party.plural;
      var cards = [];
      if (ctDomains(ct, verticalIds).indexOf('contabil') !== -1) {
        var byClient = {};
        activeSituations().forEach(function (s) {
          if (!byClient[s.clientId]) byClient[s.clientId] = 0;
          byClient[s.clientId]++;
        });
        cards = Object.keys(byClient).map(function (cid) {
          var c = (MOCK().clients || []).find(function (x) { return x.id === parseInt(cid, 10); });
          if (!c) return '';
          return '<div class="dw-client"><div class="dw-client__name">' + esc(c.companyName) + '</div>' +
            '<div class="dw-client__meta">Contact: ' + esc(c.contactName || '—') + '</div>' +
            '<div class="dw-client__count">' + byClient[cid] + ' ' + esc(((effectiveVertical('vert_contabil', client) || {}).itemLabelPlural || 'situații').toLowerCase()) + ' active</div></div>';
        }).filter(Boolean);
      } else if (ctDomains(ct, verticalIds).indexOf('audit') !== -1) {
        cards = (MOCK().auditEntities || []).map(function (e) {
          var n = activeMissions().filter(function (m) { return m.entityId === e.id; }).length;
          return '<div class="dw-client"><div class="dw-client__name">' + esc(e.name) + '</div>' +
            '<div class="dw-client__meta">Contact: ' + esc(e.contactName || '—') + '</div>' +
            '<div class="dw-client__count">' + n + ' ' + esc(((effectiveVertical('vert_audit', client) || {}).itemLabelPlural || 'misiuni').toLowerCase()) + ' active</div></div>';
        });
      } else {
        var seen = {};
        var scopedVerticalIds = activeVerticalIds(ct, verticalIds);
        (MOCK().flowItems || []).forEach(function (i) {
          if (!i.clientName || scopedVerticalIds.indexOf(i.verticalId) === -1) return;
          seen[i.clientName] = (seen[i.clientName] || 0) + 1;
        });
        cards = Object.keys(seen).map(function (name) {
          return '<div class="dw-client"><div class="dw-client__name">' + esc(name) + '</div>' +
            '<div class="dw-client__count">' + seen[name] + ' dosare</div></div>';
        });
      }
      return {
        title: label, icon: 'group', count: cards.length,
        bodyHtml: cards.length ? '<div class="dw-clients">' + cards.join('') + '</div>'
          : emptyState('person_off', 'Nu există ' + label.toLowerCase() + ' cu activitate momentan.')
      };
    },

    termene: function (params, ct, verticalIds) {
      var doms = ctDomains(ct, verticalIds);
      var rows = [];
      if (doms.indexOf('contabil') !== -1) {
        activeSituations().forEach(function (s) {
          if (typeof s.daysToDeadline !== 'number') return;
          rows.push({ days: s.daysToDeadline, title: esc(s.typeLabel), sub: esc(s.clientCompany), href: 'situatie-detaliu.html?id=' + esc(s.id) });
        });
      }
      if (doms.indexOf('audit') !== -1) {
        activeMissions().forEach(function (m) {
          var iso = m['deadlineStep' + m.currentStep];
          var d = iso ? daysDiff(iso) : null;
          if (d == null) return;
          rows.push({ days: d, title: esc(m.name), sub: esc(m.entityName), href: 'misiune-audit-workspace.html?id=' + esc(m.id) });
        });
      }
      activeVerticalIds(ct, verticalIds).forEach(function (vid) {
        var v = window.scripticaVerticalById(vid);
        if (!v || v.builtin) return;
        window.scripticaFlowItemsForVertical(vid).forEach(function (i) {
          if (i.status === 'finalizat') return;
          var tpl = (MOCK().superAdmin.flowTemplates || []).find(function (t) { return t.id === i.templateId; });
          var step = tpl && tpl.steps && tpl.steps[(i.currentStep || 1) - 1];
          if (!step) return;
          var d = daysDiff(addDaysISO(i.startDate, step.offsetDays));
          if (d == null) return;
          rows.push({ days: d, title: esc(i.name), sub: esc(i.clientName || ''), href: 'situatie-detaliu.html?flowId=' + esc(i.id) });
        });
      });
      rows.sort(function (a, b) { return a.days - b.days; });
      var html = rows.slice(0, 6).map(function (r) {
        return rowHtml(r.href, r.title, r.sub, daysBadge(r.days));
      });
      return {
        title: 'Termene apropiate', icon: 'schedule', count: rows.length,
        bodyHtml: rows.length ? rowsHtml(html) : emptyState('event_available', 'Niciun termen în perioada următoare.')
      };
    },

    arhiva_recente: function (params, ct, verticalIds, client) {
      var doms = ctDomains(ct, verticalIds);
      var docs = (MOCK().documents || []).filter(function (d) {
        return doms.indexOf(d.domain || 'contabil') !== -1;
      });
      var title = 'Arhivă — recente';
      if (params && params.folderId) {
        var folderDefinition = archiveDefinitions(ct, client).find(function (item) { return item.key === params.folderId; });
        var folder = findFolder(ct.archiveTree || [], params.folderId);
        if (folderDefinition) {
          title = 'Arhivă — ' + folderDefinition.name;
          var names = folder ? folderTypeNames(folder) : [];
          docs = folderDefinition.system
            ? docs.filter(function (d) { return true; }) /* fallback-ul: aproximăm cu toate */
            : (folderDefinition.flowTemplateId ? docs : docs.filter(function (d) { return names.indexOf(d.tipDocument) !== -1; }));
        }
      }
      docs = docs.slice().sort(function (a, b) { return String(b.uploadedAt).localeCompare(String(a.uploadedAt)); });
      var rows = docs.slice(0, 5).map(function (d) {
        return rowHtml('arhiva.html',
          '<span class="material-symbols-outlined dw-doc-ico" aria-hidden="true">description</span>' + esc(d.filename),
          esc(d.tipDocument || ''),
          '<span class="dw-row__date">' + fmtDate(d.uploadedAt) + '</span>');
      });
      return {
        title: title, icon: 'archive', count: docs.length,
        bodyHtml: rows.length ? rowsHtml(rows) : emptyState('folder_off', 'Niciun document în acest folder.'),
        footerHtml: '<a class="ghost-link" href="arhiva.html">Deschide Arhiva</a>'
      };
    },

    mesaje: function () {
      var msgs = (MOCK().messages || []).filter(function (m) { return !m.read; });
      var rows = msgs.slice(0, 3).map(function (m) {
        var body = String(m.body || '');
        if (body.length > 90) body = body.slice(0, 90) + '…';
        return rowHtml(null, esc(m.sender === 'ai' ? m.senderName : m.clientCompany), esc(body),
          '<span class="dw-row__date">' + fmtDate(m.date) + '</span>');
      });
      return {
        title: 'Mesaje necitite', icon: 'chat', count: msgs.length,
        bodyHtml: msgs.length ? rowsHtml(rows) : emptyState('mark_email_read', 'Nu ai mesaje necitite.')
      };
    },

    rapoarte_audit: function () {
      var reports = MOCK().auditReports || {};
      var ids = Object.keys(reports);
      var rows = ids.map(function (mid) {
        var r = reports[mid];
        var m = (MOCK().auditMissions || []).find(function (x) { return x.id === mid; });
        return rowHtml('misiuni-audit.html', esc(m ? m.name : mid), esc(r.domain || ''),
          '<span class="pill pill--neutral">' + esc(r.level) + '</span>');
      });
      return {
        title: 'Rapoarte de audit', icon: 'lab_profile', count: ids.length,
        bodyHtml: ids.length ? rowsHtml(rows) : emptyState('lab_profile', 'Niciun raport finalizat încă.'),
        footerHtml: '<a class="ghost-link" href="misiuni-audit.html">Toate rapoartele</a>'
      };
    },

    notificari: function (params, ct, verticalIds, client) {
      var doms = ctDomains(ct, verticalIds);
      var items = [];
      if (doms.indexOf('contabil') !== -1) {
        var overdue = (MOCK().situations || []).filter(function (s) { return s.status === 'intarziere'; }).length;
        if (overdue) items.push({ icon: 'warning', text: overdue + ' ' + ((effectiveVertical('vert_contabil', client) || {}).itemLabelPlural || 'situații').toLowerCase() + ' în întârziere' });
        var unread = (MOCK().messages || []).filter(function (m) { return !m.read; }).length;
        if (unread) items.push({ icon: 'chat', text: unread + ' mesaje necitite' });
      }
      if (doms.indexOf('audit') !== -1) {
        var spre = (MOCK().auditMissions || []).filter(function (m) { return m.status === 'spre_aprobare'; }).length;
        if (spre) items.push({ icon: 'approval', text: spre + ' ' + ((effectiveVertical('vert_audit', client) || {}).itemLabelPlural || 'misiuni').toLowerCase() + ' spre aprobare' });
      }
      var rows = items.map(function (i) {
        return rowHtml(null, '<span class="material-symbols-outlined dw-doc-ico" aria-hidden="true">' + i.icon + '</span>' + esc(i.text), '');
      });
      return {
        title: 'Notificări', icon: 'notifications_active', count: items.length,
        bodyHtml: items.length ? rowsHtml(rows) : emptyState('notifications_off', 'Nicio notificare nouă.')
      };
    },

    echipa: function () {
      var emps = (MOCK().employees || []).filter(function (e) { return (e.status || 'activ') === 'activ'; });
      var rows = emps.map(function (e) {
        var av = (typeof window.renderAvatar === 'function')
          ? '<span class="avatar avatar--sm">' + window.renderAvatar(e, 28) + '</span>' : '';
        return rowHtml(null, av + ' ' + esc(e.name), '', '<span class="dw-row__date">' + esc(e.role) + '</span>');
      });
      return {
        title: 'Echipa', icon: 'diversity_3', count: emps.length,
        bodyHtml: emps.length ? rowsHtml(rows) : emptyState('person_off', 'Niciun membru activ.')
      };
    }
  };

  /* ---------- catalog + paletă ---------- */

  var GENERIC_DEFS = [
    { widget: 'clienti', icon: 'group', desc: 'Partea externă a firmei, cu activitatea curentă.' },
    { widget: 'termene', icon: 'schedule', label: 'Termene apropiate', desc: 'Cele mai apropiate termene din toate fluxurile.' },
    { widget: 'notificari', icon: 'notifications_active', label: 'Notificări', desc: 'Sumarul alertelor și al lucrurilor de rezolvat.' },
    { widget: 'echipa', icon: 'diversity_3', label: 'Echipa', desc: 'Membrii activi ai firmei.' }
  ];

  function paletteFor(ct, verticalIds, client) {
    var entries = [];
    var scopedVerticalIds = Array.isArray(verticalIds) ? verticalIds : activeVerticalIds(ct);
    scopedVerticalIds.forEach(function (vid) {
      var v = effectiveVertical(vid, client);
      if (!v) return;
      entries.push({ widget: 'flow_summary', params: { verticalId: vid }, label: v.name, icon: v.icon || 'account_tree', desc: 'Elementele active din verticala „' + v.name + '".' });
    });
    var doms = ctDomains(ct, scopedVerticalIds);
    if (doms.indexOf('contabil') !== -1) {
      var accountingTerms = effectiveVertical('vert_contabil', client) || { itemLabel: 'Situație', itemLabelPlural: 'Situații' };
      entries.push({ widget: 'situatii_noi', params: null, label: accountingTerms.itemLabelPlural + ' noi', icon: 'description', desc: accountingTerms.itemLabelPlural + ' abia deschise + butonul „' + accountingTerms.itemLabel + ' nouă".' });
      entries.push({ widget: 'alerte', params: null, label: 'Alerte', icon: 'notifications', desc: accountingTerms.itemLabelPlural + ' în întârziere.' });
      entries.push({ widget: 'mesaje', params: null, label: 'Mesaje necitite', icon: 'chat', desc: 'Ultimele mesaje de la clienți și A.I.' });
    }
    if (doms.indexOf('audit') !== -1) {
      entries.push({ widget: 'rapoarte_audit', params: null, label: 'Rapoarte de audit', icon: 'lab_profile', desc: 'Rapoartele finale ale misiunilor încheiate.' });
    }
    GENERIC_DEFS.forEach(function (d) {
      entries.push({ widget: d.widget, params: null, label: d.label || externalParty(ct, client).plural, icon: d.icon, desc: d.desc });
    });
    entries.push({ widget: 'arhiva_recente', params: {}, label: 'Arhivă — recente', icon: 'archive', desc: 'Ultimele documente intrate în arhivă.' });
    archiveDefinitions(ct, client).forEach(function (f) {
      if (f.system || f.depth) return;
      entries.push({ widget: 'arhiva_recente', params: { folderId: f.key }, label: 'Arhivă — ' + f.name, icon: 'folder', desc: 'Ultimele documente din folderul „' + f.name + '".' });
    });
    return entries;
  }

  function render(item, ct, verticalIds, client) {
    var fn = RENDERERS[item.widget];
    if (!fn) return { title: item.widget, icon: 'help', count: 0, bodyHtml: emptyState('error', 'Widget necunoscut.') };
    return fn(item.params || {}, ct, verticalIds, client);
  }

  function cardHtml(item, ct, verticalIds, client) {
    var r = render(item, ct, verticalIds, client);
    /* Widgetul unei verticale preia culoarea ei de identitate (aleasă în HQ). */
    var vaCls = '';
    if (item.widget === 'flow_summary' && item.params && window.scripticaVerticalAccentClass) {
      var vv = window.scripticaVerticalById(item.params.verticalId);
      if (vv) vaCls = ' va-ico ' + scripticaVerticalAccentClass(vv);
    }
    return '<section class="region-card dw-card dw-card--' + (item.size === 'full' ? 'full' : 'half') + '" data-dw-id="' + esc(item.id) + '">' +
      '<header class="region-card__header">' +
        '<span class="material-symbols-outlined' + vaCls + '" aria-hidden="true">' + esc(r.icon) + '</span>' +
        '<h2 class="region-card__title">' + esc(r.title) + '</h2>' +
        '<span class="pill pill--count">(' + r.count + ')</span>' +
      '</header>' +
      '<div class="region-card__body">' + r.bodyHtml + '</div>' +
      (r.footerHtml ? '<footer class="region-card__footer">' + r.footerHtml + '</footer>' : '') +
    '</section>';
  }

  window.SCRIPTICA_WIDGETS = { render: render, cardHtml: cardHtml, paletteFor: paletteFor };

  /* ---------- Acasă (tenant): redă layout-ul configurat ----------
     Rulează după dashboard.js (ordinea scripturilor) → suprascrie
     dashboard-ul static cu layout-ul contului HQ previzualizat.
     Vederea „client" (portal extern) și superadmin rămân neatinse. */
  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK()) return;
    var filename = window.location.pathname.split('/').pop() || 'index.html';
    if (filename !== 'acasa.html') return;
    var view = (typeof window.getCurrentView === 'function') ? window.getCurrentView() : 'complet';
    if (view === 'client' || view === 'superadmin') return;
    var ct = window.scripticaClientTypeById(window.scripticaTenantClientTypeId());
    if (!ct) return;
    var tenantAccount = typeof window.scripticaTenantAccount === 'function' ? window.scripticaTenantAccount() : null;
    var layout = (tenantAccount && Array.isArray(tenantAccount.dashboardLayout)
      ? tenantAccount.dashboardLayout
      : (ct.dashboardLayout || [])).slice();
    var moduleVerticalIds = activeVerticalIds(ct);
    var contractedVerticalIds = typeof window.scripticaTenantActiveVerticalIds === 'function'
      ? window.scripticaTenantActiveVerticalIds() : moduleVerticalIds;
    var restrictedByRole = contractedVerticalIds.length > 0 && moduleVerticalIds.length === 0;
    var moduleDomains = moduleVerticalIds.map(function (verticalId) {
      var vertical = window.scripticaVerticalById(verticalId);
      return vertical ? vertical.domain : null;
    }).filter(Boolean);
    layout = layout.filter(function (item) {
      if (item.widget === 'flow_summary') {
        return item.params && moduleVerticalIds.indexOf(item.params.verticalId) !== -1;
      }
      if (item.widget === 'situatii_noi' || item.widget === 'alerte' || item.widget === 'mesaje') {
        return moduleDomains.indexOf('contabil') !== -1;
      }
      if (item.widget === 'rapoarte_audit') return moduleDomains.indexOf('audit') !== -1;
      return true;
    }).slice();
    moduleVerticalIds.forEach(function (verticalId, index) {
      var exists = layout.some(function (item) {
        return item.widget === 'flow_summary' && item.params && item.params.verticalId === verticalId;
      });
      if (!exists) {
        layout.splice(index, 0, {
          id: 'dw_module_' + verticalId,
          widget: 'flow_summary', params: { verticalId: verticalId }, size: 'half'
        });
      }
    });
    if (!moduleVerticalIds.length) layout = [];
    var main = document.getElementById('main');
    if (!main) return;

    main.innerHTML = '<div class="dashboard">' +
      (!moduleVerticalIds.length ? '<div class="scope-block"><span class="material-symbols-outlined" aria-hidden="true">extension_off</span><h2>' +
        (restrictedByRole ? 'Nicio verticală disponibilă pentru acest rol' : 'Verticalele nu sunt activate încă') + '</h2><p>' +
        (restrictedByRole ? 'Contul are verticale active, dar ele nu intră în aria acestei personae.' : 'Contul este creat și poate fi configurat ulterior de Scriptica HQ.') + '</p></div>' : '') +
      '<div class="dw-grid">' +
      layout.map(function (item) { return cardHtml(item, ct, moduleVerticalIds, tenantAccount); }).join('') +
    '</div>' +
    '<p class="dw-note">Dashboard configurat pentru profilul firmei de către administratorul platformei.</p>' +
    '</div>';

    /* Butonul „Situație Nouă" din widget: modalul static + handlerele lui
       (close/submit) rămân montate de dashboard.js; refacem doar deschiderea. */
    var openBtn = main.querySelector('[data-dw-open-situation]');
    if (openBtn) openBtn.addEventListener('click', function () {
      var modal = document.getElementById('modal-new-situation');
      if (!modal) return;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

})();
