/* ============================================================
   Scriptica — Arhivă (Phase 5)
   Hierarchical read-only document library:
   Client → Year → Month → Category.
   Reuses the AI Extraction Modal from documents.js in read-only mode.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;
  if (!MOCK || !document.getElementById('arhiva-main')) return;

  var SELECTION_KEY = 'scriptica.arhiva.selection';
  var RO_MONTHS = ['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'];

  /* ---------- Foldere din structura de arhivă (per tip de client) ----------
     Arhiva este separată de vocabularul de clasificare al verticalei. Pentru
     fluxurile configurabile, ea urmează direct nevoia de lucru: fiecare flux
     inclus în tipul de client primește propriul dosar. Structurile istorice
     de arhivă rămân disponibile pentru domeniile dedicate. */
  function tenantClientTypeId() {
    return (typeof window.scripticaTenantClientTypeId === 'function')
      ? window.scripticaTenantClientTypeId()
      : 'ct_mixt';
  }

  function buildArchiveFolders() {
    var tenantAccount = typeof window.scripticaTenantAccount === 'function' ? window.scripticaTenantAccount() : null;
    var clientType = typeof window.scripticaClientTypeById === 'function'
      ? window.scripticaClientTypeById(tenantClientTypeId()) : null;
    var tree = (typeof window.scripticaArchiveTreeFor === 'function')
      ? window.scripticaArchiveTreeFor(tenantClientTypeId()) : [];
    var folders = tree.map(function (f) {
      var names = [];
      (function walk(n) {
        (n.docTypeIds || []).forEach(function (id) {
          var dt = window.scripticaDocTypeById(id);
          if (dt) names.push(dt.name);
        });
        (n.children || []).forEach(walk);
      })(f);
      var label = typeof window.scripticaEffectiveArchiveFolderName === 'function'
        ? window.scripticaEffectiveArchiveFolderName(f.id, f.name, tenantAccount) : f.name;
      /* `group` = verticala căreia îi aparține indicativul (arhivă după nomenclator) */
      return { key: f.id, label: label, system: !!f.system, typeNames: names, group: f.group || '' };
    });
    var assignments = typeof window.scripticaTenantModuleAssignments === 'function'
      ? window.scripticaTenantModuleAssignments(true) : [];
    var templateIds = [];
    assignments.forEach(function (assignment) {
      templateIds = templateIds.concat(assignment.templateIds || []);
    });
    if (!assignments.length && !window.scripticaTenantAccountId()) {
      templateIds = (clientType && clientType.defaultTemplateIds) || [];
    }
    var moduleVerticalIds = assignments.length
      ? assignments.map(function (assignment) { return assignment.verticalId; })
      : ((clientType && clientType.verticalIds) || []);
    var customVerticalIds = moduleVerticalIds.filter(function (verticalId) {
      var vertical = typeof window.scripticaVerticalById === 'function' ? window.scripticaVerticalById(verticalId) : null;
      return vertical && !vertical.builtin;
    });
    /* Instituții publice: arhiva urmează nomenclatorul arhivistic (indicative
       X.a.1 pe direcții), iar documentele se rutează după tipul lor —
       fără foldere per șablon de flux. */
    if (clientType && clientType.archiveRouting === 'nomenclator') customVerticalIds = [];
    ((MOCK.superAdmin && MOCK.superAdmin.flowTemplates) || []).forEach(function (template) {
      if (templateIds.indexOf(template.id) === -1 || customVerticalIds.indexOf(template.verticalId) === -1) return;
      var assignment = assignments.find(function (item) { return item.verticalId === template.verticalId; });
      folders.push({
        key: 'af_flow_' + template.id,
        label: (typeof window.scripticaEffectiveArchiveFolderName === 'function'
          ? window.scripticaEffectiveArchiveFolderName('af_flow_' + template.id, template.name, tenantAccount)
          : template.name) + (assignment && assignment.status !== 'activ' ? ' · verticală inactivă' : ''),
        system: false, flowTemplateId: template.id, typeNames: []
      });
    });
    if (!folders.some(function (f) { return f.system; })) {
      folders.push({ key: 'af_fallback', label: typeof window.scripticaEffectiveArchiveFolderName === 'function'
        ? window.scripticaEffectiveArchiveFolderName('af_fallback', 'Necategorisit', tenantAccount) : 'Necategorisit', system: true, typeNames: [] });
    }
    return folders;
  }

  var ARCH_FOLDERS = buildArchiveFolders();
  var CATEGORY_LABELS = {};
  var CATEGORY_GROUPS = {};
  var CATEGORY_ORDER = [];
  var SYSTEM_FOLDER_KEY = null;
  ARCH_FOLDERS.forEach(function (f) {
    CATEGORY_ORDER.push(f.key);
    CATEGORY_LABELS[f.key] = f.label;
    CATEGORY_GROUPS[f.key] = f.group || '';
    if (f.system) SYSTEM_FOLDER_KEY = f.key;
  });

  function docCategory(doc) {
    var flowItem = (MOCK.flowItems || []).find(function (item) { return item.id === doc.situationId; });
    if (flowItem) {
      var flowFolder = ARCH_FOLDERS.find(function (folder) { return folder.flowTemplateId === flowItem.templateId; });
      if (flowFolder) return flowFolder.key;
      /* fără folder de flux (arhivă după nomenclator) → rutare după tipul documentului */
      for (var j = 0; j < ARCH_FOLDERS.length; j++) {
        if (!ARCH_FOLDERS[j].system && ARCH_FOLDERS[j].typeNames.indexOf(doc.tipDocument) !== -1) return ARCH_FOLDERS[j].key;
      }
      return SYSTEM_FOLDER_KEY;
    }
    for (var i = 0; i < ARCH_FOLDERS.length; i++) {
      if (!ARCH_FOLDERS[i].system && ARCH_FOLDERS[i].typeNames.indexOf(doc.tipDocument) !== -1) {
        return ARCH_FOLDERS[i].key;
      }
    }
    return SYSTEM_FOLDER_KEY;
  }

  var state = {
    tree: {},
    selection: null,   // { clientId, year, month, category }
    expanded: new Set(),
    clientSearch: '',
    globalSearch: '',
    pageSize: 25,
    page: 1
  };

  document.addEventListener('DOMContentLoaded', init);

  function isClientView() {
    return typeof getCurrentView === 'function' && getCurrentView() === 'client';
  }

  function externalParty() {
    return typeof window.scripticaEffectiveExternalParty === 'function'
      ? window.scripticaEffectiveExternalParty()
      : { singular: 'Client', plural: 'Clienți' };
  }
  /* Eticheta containerului de nivel 1 din arbore: partea externă a contului
     sau, pentru arhiva după nomenclator, structura organizatorică (direcția). */
  function containerLabel() {
    var clientType = typeof window.scripticaClientTypeById === 'function'
      ? window.scripticaClientTypeById(tenantClientTypeId()) : null;
    if (clientType && clientType.archiveRouting === 'nomenclator') return 'Direcție';
    return externalParty().singular;
  }

  function getArchiveDocs() {
    if (typeof window.getVisibleDocuments === 'function') return window.getVisibleDocuments();
    return MOCK.documents || [];
  }

  /* ---------- Container/proveniență per domeniu (personas pe arie) ----------
     Contabil: container = client (din situație). Audit: container = entitatea
     auditată (din misiune). Astfel arhiva grupează ambele domenii în același
     arbore (Container → An → Lună → Categorie). */
  /* Id container: numeric pentru clienți contabili (păstrăm comportamentul
     existent), string pentru entitățile de audit ('aud_<id>'). */
  function cidVal(id) {
    return /^\d+$/.test(String(id)) ? parseInt(id, 10) : String(id);
  }

  function docContainer(doc) {
    if ((doc.domain || 'contabil') === 'audit') {
      var m = (MOCK.auditMissions || []).find(function (x) { return x.id === doc.missionId; });
      var entId = (doc.entityId != null) ? doc.entityId : (m && m.entityId);
      var ent = (MOCK.auditEntities || []).find(function (e) { return e.id === entId; });
      if (!ent) return null;
      return { id: 'aud_' + ent.id, companyName: ent.name, _audit: true };
    }
    var flowItem = (MOCK.flowItems || []).find(function (item) { return item.id === doc.situationId; });
    if (flowItem) {
      /* `archiveContainer` (ex. direcția care ține dosarul) are prioritate față
         de partea externă — arhiva instituției e organizată pe structuri. */
      var containerName = flowItem.archiveContainer || flowItem.clientName;
      return { id: 'flow_' + String(containerName || flowItem.id).toLowerCase().replace(/[^a-z0-9]+/g, '_'), companyName: containerName || externalParty().singular + ' flux', _flow: true };
    }
    var sit = (MOCK.situations || []).find(function (s) { return s.id === doc.situationId; });
    if (!sit) return null;
    return (MOCK.clients || []).find(function (c) { return c.id === sit.clientId; }) || null;
  }

  function docProvenanceCellHtml(d) {
    if ((d.domain || 'contabil') === 'audit') {
      var m = (MOCK.auditMissions || []).find(function (x) { return x.id === d.missionId; });
      if (!m) return '<td><span class="text-muted">—</span></td>';
      var sl = m.status === 'aprobata' ? 'Aprobată' : (m.status === 'spre_aprobare' ? 'Spre aprobare' : 'Activă');
      var sc = m.status === 'aprobata' ? 'doc-row__source-status--closed' : 'doc-row__source-status--active';
      return '<td><a class="doc-row__source-situation" href="misiune-audit-workspace.html?id=' + esc(m.id) + '">' +
        esc(m.name) + '<span class="doc-row__source-status ' + sc + '">' + sl + '</span></a></td>';
    }
    var flowItem = (MOCK.flowItems || []).find(function (item) { return item.id === d.situationId; });
    if (flowItem) {
      var flowStatus = flowItem.status === 'finalizat' || flowItem.status === 'inchisa' ? 'Finalizat' : 'Activ';
      var flowStatusClass = flowStatus === 'Finalizat' ? 'doc-row__source-status--closed' : 'doc-row__source-status--active';
      return '<td><a class="doc-row__source-situation" href="situatie-detaliu.html?flowId=' + esc(flowItem.id) + '">' +
        esc(flowItem.name) + '<span class="doc-row__source-status ' + flowStatusClass + '">' + flowStatus + '</span></a></td>';
    }
    var sit = (MOCK.situations || []).find(function (s) { return s.id === d.situationId; });
    if (!sit) return '<td><span class="text-muted">—</span></td>';
    var statusLabel = sit.status === 'inchisa' ? 'Finalizată' : (sit.status === 'anulata' ? 'Anulată' : 'Activă');
    var statusCls = sit.status === 'inchisa' ? 'doc-row__source-status--closed' :
                    (sit.status === 'anulata' ? 'doc-row__source-status--cancel' : 'doc-row__source-status--active');
    return '<td><a class="doc-row__source-situation" href="situatie-detaliu.html?id=' + esc(sit.id) + '">' +
      esc(sit.typeLabel) + '<span class="doc-row__source-status ' + statusCls + '">' + statusLabel + '</span></a></td>';
  }

  function init() {
    state.tree = buildTree();
    restoreSelection();
    // Auto-expand the single client branch for client view so the user
    // lands on a years-first tree instead of a collapsed client node.
    if (isClientView()) {
      Object.keys(state.tree).forEach(function (cid) {
        state.expanded.add('client:' + cid);
      });
    }
    render();
  }

  /* ---------- Tree build ---------- */

  function buildTree() {
    var t = {};
    getArchiveDocs().forEach(function (doc) {
      var client = docContainer(doc);
      if (!client) return;
      var d = new Date(doc.uploadedAt);
      var year = d.getFullYear();
      var month = d.getMonth() + 1;
      var cat = docCategory(doc);

      if (!t[client.id]) t[client.id] = { client: client, years: {}, total: 0 };
      if (!t[client.id].years[year]) t[client.id].years[year] = { months: {}, total: 0 };
      if (!t[client.id].years[year].months[month]) {
        t[client.id].years[year].months[month] = { categories: emptyCats(), total: 0 };
      }
      t[client.id].years[year].months[month].categories[cat].push(doc);
      t[client.id].years[year].months[month].total++;
      t[client.id].years[year].total++;
      t[client.id].total++;
    });
    return t;
  }

  function emptyCats() {
    var c = {};
    CATEGORY_ORDER.forEach(function (k) { c[k] = []; });
    return c;
  }

  /* ---------- Selection persistence ---------- */

  function restoreSelection() {
    try {
      var raw = localStorage.getItem(SELECTION_KEY);
      if (!raw) return;
      var sel = JSON.parse(raw);
      if (!sel || !sel.level || !sel.clientId) return;
      if (!state.tree[sel.clientId]) return;
      /* selecție salvată cu o structură de arhivă veche → o ignorăm */
      if (sel.category && !CATEGORY_LABELS[sel.category]) return;
      state.selection = {
        level: sel.level,
        clientId: sel.clientId,
        year: sel.year || null,
        month: sel.month || null,
        category: sel.category || null
      };
      // Auto-expand the path leading to the selection.
      state.expanded.add(key('client', sel.clientId));
      if (sel.year)  state.expanded.add(key('year', sel.clientId, sel.year));
      if (sel.month) state.expanded.add(key('month', sel.clientId, sel.year, sel.month));
    } catch (e) { /* ignore */ }
  }

  function saveSelection() {
    try {
      if (state.selection) localStorage.setItem(SELECTION_KEY, JSON.stringify(state.selection));
      else localStorage.removeItem(SELECTION_KEY);
    } catch (e) {}
  }

  function key() {
    return Array.prototype.slice.call(arguments).join(':');
  }

  /* Every-level filter: if clientId/year/month/category is set, narrow accordingly. */
  function getDocumentsForSelection(sel) {
    if (!sel) return [];
    return getArchiveDocs().filter(function (d) {
      var container = docContainer(d);
      if (!container) return false;
      if (sel.clientId && String(container.id) !== String(sel.clientId)) return false;
      var dt = new Date(d.uploadedAt);
      if (sel.year  && dt.getFullYear() !== sel.year)  return false;
      if (sel.month && (dt.getMonth() + 1) !== sel.month) return false;
      if (sel.category && docCategory(d) !== sel.category) return false;
      return true;
    });
  }

  function getCategoryCounts(sel) {
    var scope = {
      level: sel.level,
      clientId: sel.clientId,
      year: sel.year,
      month: sel.month,
      category: null  // explicitly ignore the current pill filter for counting
    };
    var docs = getDocumentsForSelection(scope);
    var counts = { all: docs.length };
    CATEGORY_ORDER.forEach(function (c) {
      counts[c] = docs.filter(function (d) { return docCategory(d) === c; }).length;
    });
    return counts;
  }

  /* ---------- Render root ---------- */

  function render() {
    var root = document.getElementById('arhiva-main');
    if (!root) return;

    var titleText = isClientView() ? 'Documentele mele' : 'Arhivă';
    root.innerHTML =
      '<header class="arhiva-page-header">' +
        '<h1>' + esc(titleText) + '</h1>' +
        '<div class="arhiva-global-search">' +
          '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
          '<input id="arhiva-global" type="search" placeholder="Caută document... (nume, emitent, descriere AI)" value="' + esc(state.globalSearch) + '">' +
        '</div>' +
      '</header>' +
      '<div class="arhiva-grid">' +
        '<aside class="arhiva-tree" aria-label="Navigație arhivă">' + treeHtml() + '</aside>' +
        '<div class="arhiva-content">' + contentHtml() + '</div>' +
      '</div>';

    bindGlobalSearch();
    bindTree();
    bindContent();
  }

  /* ---------- Tree rendering ---------- */

  function treeHtml() {
    var html =
      '<div class="arhiva-tree__search">' +
        '<span class="material-symbols-outlined" aria-hidden="true">search</span>' +
        '<input id="arhiva-tree-search" type="search" class="arhiva-tree__search-input" placeholder="Caută ' + esc(containerLabel().toLowerCase()) + '..." value="' + esc(state.clientSearch) + '">' +
      '</div>';

    var q = state.clientSearch.toLowerCase().trim();
    var clientIds = Object.keys(state.tree)
      .map(function (id) { return cidVal(id); })
      .filter(function (id) {
        var c = state.tree[id].client;
        return !q || c.companyName.toLowerCase().indexOf(q) !== -1;
      })
      .sort(function (a, b) {
        return state.tree[a].client.companyName.localeCompare(state.tree[b].client.companyName, 'ro');
      });

    if (!clientIds.length) {
      html += '<div class="arhiva-tree__empty">Nicio intrare pentru „' + esc(containerLabel().toLowerCase()) + '” găsită.</div>';
      return html;
    }

    html += '<div class="arhiva-tree__list" role="tree">';
    clientIds.forEach(function (cid) {
      html += clientNodeHtml(cid);
    });
    html += '</div>';
    return html;
  }

  function isActiveNode(level, clientId, year, month, category) {
    var sel = state.selection;
    if (!sel || sel.level !== level) return false;
    if (sel.clientId !== clientId) return false;
    if (level === 'client')   return true;
    if (sel.year !== year) return false;
    if (level === 'year')    return true;
    if (sel.month !== month) return false;
    if (level === 'month')   return true;
    return sel.category === category;
  }

  function clientNodeHtml(clientId) {
    var node = state.tree[clientId];
    var c = node.client;
    var kExp = key('client', clientId);
    var expanded = isClientView() ? true : state.expanded.has(kExp);
    var active = isActiveNode('client', clientId);

    var childrenHtml = '';
    if (expanded) {
      var years = Object.keys(node.years)
        .map(function (y) { return parseInt(y, 10); })
        .sort(function (a, b) { return b - a; });
      years.forEach(function (year) { childrenHtml += yearNodeHtml(clientId, year); });
    }

    if (isClientView()) {
      // De-emphasized header, not a clickable folder
      return '<div>' +
        '<div class="arhiva-tree__node arhiva-tree__node--client arhiva-tree__node--client-header" aria-level="1">' +
          '<span class="arhiva-tree__label">' + esc(c.companyName) + '</span>' +
        '</div>' +
        '<div class="arhiva-tree__children is-open">' + childrenHtml + '</div>' +
      '</div>';
    }

    return '<div>' +
      '<button class="arhiva-tree__node arhiva-tree__node--client' + (active ? ' arhiva-tree__node--active' : '') + '" ' +
        'role="treeitem" aria-level="1" ' +
        'aria-expanded="' + (expanded ? 'true' : 'false') + '" ' +
        (active ? 'aria-selected="true" ' : '') +
        'data-node-level="client" ' +
        'data-node-client="' + clientId + '" ' +
        'data-expand="' + kExp + '">' +
        '<span class="material-symbols-outlined arhiva-tree__chevron" aria-hidden="true">chevron_right</span>' +
        '<span class="material-symbols-outlined arhiva-tree__folder" aria-hidden="true">folder</span>' +
        '<span class="arhiva-tree__label">' + esc(c.companyName) + '</span>' +
        '<span class="arhiva-tree__count">' + node.total + '</span>' +
      '</button>' +
      '<div class="arhiva-tree__children' + (expanded ? ' is-open' : '') + '">' +
        childrenHtml +
      '</div>' +
    '</div>';
  }

  function yearNodeHtml(clientId, year) {
    var node = state.tree[clientId].years[year];
    var kExp = key('year', clientId, year);
    var expanded = state.expanded.has(kExp);
    var active = isActiveNode('year', clientId, year);

    var childrenHtml = '';
    if (expanded) {
      var months = Object.keys(node.months)
        .map(function (m) { return parseInt(m, 10); })
        .sort(function (a, b) { return b - a; });
      months.forEach(function (m) { childrenHtml += monthNodeHtml(clientId, year, m); });
    }

    return '<div>' +
      '<button class="arhiva-tree__node arhiva-tree__node--year' + (active ? ' arhiva-tree__node--active' : '') + '" ' +
        'role="treeitem" aria-level="2" ' +
        'aria-expanded="' + (expanded ? 'true' : 'false') + '" ' +
        (active ? 'aria-selected="true" ' : '') +
        'data-node-level="year" ' +
        'data-node-client="' + clientId + '" ' +
        'data-node-year="' + year + '" ' +
        'data-expand="' + kExp + '">' +
        '<span class="material-symbols-outlined arhiva-tree__chevron" aria-hidden="true">chevron_right</span>' +
        '<span class="material-symbols-outlined arhiva-tree__folder" aria-hidden="true">folder</span>' +
        '<span class="arhiva-tree__label">' + year + '</span>' +
        '<span class="arhiva-tree__count">' + node.total + '</span>' +
      '</button>' +
      '<div class="arhiva-tree__children' + (expanded ? ' is-open' : '') + '">' +
        childrenHtml +
      '</div>' +
    '</div>';
  }

  function monthNodeHtml(clientId, year, month) {
    var node = state.tree[clientId].years[year].months[month];
    var kExp = key('month', clientId, year, month);
    var expanded = state.expanded.has(kExp);
    var active = isActiveNode('month', clientId, year, month);

    var childrenHtml = '';
    if (expanded) {
      var lastGroup = null;
      CATEGORY_ORDER.forEach(function (cat) {
        var group = CATEGORY_GROUPS[cat] || '';
        /* arhivă după nomenclator: indicativele sunt grupate pe verticala lor */
        if (group && group !== lastGroup) {
          childrenHtml += '<div class="arhiva-tree__group" role="presentation">' +
            '<span class="material-symbols-outlined" aria-hidden="true">folder_open</span>' + esc(group) + '</div>';
        }
        lastGroup = group;
        childrenHtml += categoryNodeHtml(clientId, year, month, cat, (node.categories[cat] || []).length);
      });
    }

    return '<div>' +
      '<button class="arhiva-tree__node arhiva-tree__node--month' + (active ? ' arhiva-tree__node--active' : '') + '" ' +
        'role="treeitem" aria-level="3" ' +
        'aria-expanded="' + (expanded ? 'true' : 'false') + '" ' +
        (active ? 'aria-selected="true" ' : '') +
        'data-node-level="month" ' +
        'data-node-client="' + clientId + '" ' +
        'data-node-year="' + year + '" ' +
        'data-node-month="' + month + '" ' +
        'data-expand="' + kExp + '">' +
        '<span class="material-symbols-outlined arhiva-tree__chevron" aria-hidden="true">chevron_right</span>' +
        '<span class="material-symbols-outlined arhiva-tree__folder" aria-hidden="true">folder</span>' +
        '<span class="arhiva-tree__label">' + esc(RO_MONTHS[month - 1]) + '</span>' +
        '<span class="arhiva-tree__count">' + node.total + '</span>' +
      '</button>' +
      '<div class="arhiva-tree__children' + (expanded ? ' is-open' : '') + '">' +
        childrenHtml +
      '</div>' +
    '</div>';
  }

  function categoryNodeHtml(clientId, year, month, cat, count) {
    var active = isActiveNode('category', clientId, year, month, cat);
    var empty = count === 0;
    var classes = 'arhiva-tree__node arhiva-tree__node--category';
    if (active) classes += ' arhiva-tree__node--active';
    if (empty) classes += ' arhiva-tree__node--disabled';

    return '<button class="' + classes + '" ' +
      'role="treeitem" aria-level="4" ' +
      (active ? 'aria-selected="true" ' : '') +
      (empty ? 'aria-disabled="true" ' : '') +
      'data-node-level="category" ' +
      'data-node-client="' + clientId + '" ' +
      'data-node-year="' + year + '" ' +
      'data-node-month="' + month + '" ' +
      'data-node-category="' + esc(cat) + '"' +
      (empty ? ' tabindex="-1"' : '') + '>' +
      '<span class="arhiva-tree__chevron arhiva-tree__chevron--placeholder" aria-hidden="true"></span>' +
      '<span class="arhiva-tree__bullet" aria-hidden="true">•</span>' +
      '<span class="arhiva-tree__label">' + esc(CATEGORY_LABELS[cat]) + '</span>' +
      '<span class="arhiva-tree__count">' + count + '</span>' +
    '</button>';
  }

  /* ---------- Content pane ---------- */

  function contentHtml() {
    if (state.globalSearch && state.globalSearch.trim()) return globalSearchContentHtml();
    if (!state.selection) return noSelectionEmptyHtml();
    return folderContentHtml();
  }

  function noSelectionEmptyHtml() {
    return '<div class="arhiva-empty">' +
      '<span class="material-symbols-outlined" aria-hidden="true" style="font-size:64px;">folder_open</span>' +
      '<h2>Selectează un folder pentru a vedea documentele</h2>' +
      '<p>Navighează în structura din stânga: ' + esc(containerLabel()) + ' → An → Lună → Categorie</p>' +
    '</div>';
  }

  function folderContentHtml() {
    var sel = state.selection;
    var client = state.tree[sel.clientId] ? state.tree[sel.clientId].client : null;
    var docs = getDocumentsForSelection(sel).slice().sort(sortDocs);

    /* Breadcrumb — terminates at sel.level. Clicking any segment re-selects at that level. */
    var crumbs = '<nav class="arhiva-breadcrumb" aria-label="Cale">' +
      '<button class="arhiva-breadcrumb__item" data-crumb="root">Arhivă</button>';

    if (client && !isClientView()) {
      crumbs += '<span class="arhiva-breadcrumb__separator">▸</span>';
      if (sel.level === 'client') {
        crumbs += '<span class="arhiva-breadcrumb__item arhiva-breadcrumb__item--current">' + esc(client.companyName) + '</span>';
      } else {
        crumbs += '<button class="arhiva-breadcrumb__item" data-crumb="client">' + esc(client.companyName) + '</button>';
      }
    }
    if (sel.year) {
      crumbs += '<span class="arhiva-breadcrumb__separator">▸</span>';
      if (sel.level === 'year') {
        crumbs += '<span class="arhiva-breadcrumb__item arhiva-breadcrumb__item--current">' + sel.year + '</span>';
      } else {
        crumbs += '<button class="arhiva-breadcrumb__item" data-crumb="year">' + sel.year + '</button>';
      }
    }
    if (sel.month) {
      crumbs += '<span class="arhiva-breadcrumb__separator">▸</span>';
      if (sel.level === 'month') {
        crumbs += '<span class="arhiva-breadcrumb__item arhiva-breadcrumb__item--current">' + esc(RO_MONTHS[sel.month - 1]) + '</span>';
      } else {
        crumbs += '<button class="arhiva-breadcrumb__item" data-crumb="month">' + esc(RO_MONTHS[sel.month - 1]) + '</button>';
      }
    }
    if (sel.level === 'category' && sel.category) {
      crumbs += '<span class="arhiva-breadcrumb__separator">▸</span>';
      crumbs += '<span class="arhiva-breadcrumb__item arhiva-breadcrumb__item--current">' + esc(CATEGORY_LABELS[sel.category]) + '</span>';
    }
    crumbs += '</nav>';

    /* Category pills — only when the selected level is NOT a leaf. */
    var pillsHtml = '';
    if (sel.level !== 'category') {
      pillsHtml = pillsRowHtml(sel);
    }

    if (!docs.length) {
      return crumbs + pillsHtml + '<div class="arhiva-empty">' +
        '<span class="material-symbols-outlined" aria-hidden="true" style="font-size:48px;">folder_off</span>' +
        '<p>Niciun document în acest folder.</p>' +
      '</div>';
    }

    return crumbs + pillsHtml + '<div class="arhiva-list-wrap">' +
      documentsTableHtml(docs, true) +
      paginationHtml(docs.length) +
    '</div>';
  }

  function pillsRowHtml(sel) {
    var counts = getCategoryCounts(sel);
    var activeCat = sel.category || null;
    var html = '<div class="arhiva-main__filters">';
    html += pillHtml('all', 'Toate', counts.all, !activeCat, false);
    CATEGORY_ORDER.forEach(function (c) {
      var empty = counts[c] === 0;
      html += pillHtml(c, CATEGORY_LABELS[c], counts[c], activeCat === c, empty);
    });
    html += '</div>';
    return html;
  }

  function pillHtml(cat, label, count, active, empty) {
    var classes = 'arhiva-main__filter';
    if (active) classes += ' arhiva-main__filter--active';
    if (empty)  classes += ' arhiva-main__filter--empty';
    return '<button type="button" class="' + classes + '" data-pill="' + esc(cat) + '"' +
      (empty ? ' tabindex="-1"' : '') + '>' +
      esc(label) +
      ' <span class="arhiva-main__filter-count">' + count + '</span>' +
    '</button>';
  }

  function globalSearchContentHtml() {
    var q = state.globalSearch.toLowerCase().trim();
    var docs = getArchiveDocs().filter(function (d) {
      if (!matchesGlobal(d, q)) return false;
      // must belong to a known container (client/entitate) — safety
      return !!docContainer(d);
    }).sort(sortDocs);

    var crumbs = '<nav class="arhiva-breadcrumb" aria-label="Cale">' +
      '<button class="arhiva-breadcrumb__item" data-crumb="root">Arhivă</button>' +
      '<span class="arhiva-breadcrumb__separator">▸</span>' +
      '<span class="arhiva-breadcrumb__item arhiva-breadcrumb__item--current">Rezultate căutare</span>' +
    '</nav>';

    if (!docs.length) {
      return crumbs + '<div class="arhiva-empty">' +
        '<span class="material-symbols-outlined" aria-hidden="true" style="font-size:48px;">search_off</span>' +
        '<h2>Niciun document găsit pentru „' + esc(state.globalSearch) + '"</h2>' +
        '<button type="button" data-reset-global>Resetează căutarea</button>' +
      '</div>';
    }

    return crumbs + '<div class="arhiva-list-wrap">' +
      '<div class="arhiva-list-info">' +
        '<span>' + docs.length + ' rezultate pentru „' + esc(state.globalSearch) + '"</span>' +
        '<button type="button" data-reset-global>Resetează</button>' +
      '</div>' +
      documentsTableHtml(docs, true) +
      paginationHtml(docs.length) +
    '</div>';
  }

  function matchesGlobal(d, q) {
    var bag = [d.filename, d.emitent, d.observatieAI, d.tipDocument].join(' ').toLowerCase();
    bag = bag.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var needle = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return bag.indexOf(needle) !== -1;
  }

  function sortDocs(a, b) {
    return new Date(b.uploadedAt) - new Date(a.uploadedAt);
  }

  /* ---------- Documents table ---------- */

  function documentsTableHtml(docs, showProvenance) {
    var totalPages = Math.max(1, Math.ceil(docs.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    var start = (state.page - 1) * state.pageSize;
    var pageItems = docs.slice(start, start + state.pageSize);

    return '<div class="docs-table-wrap">' +
      '<table class="docs-table">' +
        '<colgroup>' +
          '<col>' +
          '<col>' +
          (showProvenance ? '<col style="width:200px">' : '') +
          '<col style="width:140px">' +
          '<col style="width:120px">' +
        '</colgroup>' +
        '<thead><tr>' +
          '<th>Nume Document</th>' +
          '<th>Descriere <span class="docs-table__header-hint">(interpretare AI)</span></th>' +
          (showProvenance ? '<th>Proveniență</th>' : '') +
          '<th>Status Verificare</th>' +
          '<th style="text-align:right;">Acțiuni</th>' +
        '</tr></thead>' +
        '<tbody>' +
          pageItems.map(function (d) { return arhivaRowHtml(d, showProvenance); }).join('') +
        '</tbody>' +
      '</table>' +
    '</div>';
  }

  function arhivaRowHtml(d, showProvenance) {
    var srcIcon = sourceIcon(d.source);
    var confE = d.confidenceExtraction, confC = d.confidenceCategorization;
    var min = Math.min(confE, confC);
    var statusKey, statusText, statusDot;
    if (min < 70) { statusKey = 'low';      statusText = 'Verificare';   statusDot = 'intarziere'; }
    else if (d.verificat || d.verificatManual) { statusKey = 'verificat'; statusText = 'Verificat'; statusDot = 'finalizat'; }
    else                                        { statusKey = 'pending';  statusText = 'În așteptare'; statusDot = 'asteapta_documente'; }

    var tipLabel = (window.SCRIPTICA_DOC_TIP_PREFIX ? window.SCRIPTICA_DOC_TIP_PREFIX(d.tipDocument) : (d.tipDocument || ''));
    var tipPrefix = tipLabel ? '<span class="doc-row__tip">' + esc(tipLabel) + '</span>' : '';

    var provenance = '';
    if (showProvenance) {
      provenance = docProvenanceCellHtml(d);
    }

    return '<tr class="doc-row" data-doc-id="' + esc(d.id) + '">' +
      '<td>' +
        '<div class="doc-name" data-ai-open="' + esc(d.id) + '">' +
          '<span class="material-symbols-outlined doc-name__source" aria-hidden="true">' + srcIcon + '</span>' +
          '<span class="doc-name__filename">' + esc(d.filename) + '</span>' +
        '</div>' +
      '</td>' +
      '<td>' +
        '<div class="doc-desc__text">' + tipPrefix + esc(d.observatieAI || '') + '</div>' +
      '</td>' +
      provenance +
      '<td>' +
        '<span class="doc-status doc-status--' + statusKey + '">' +
          '<span class="status-dot status-dot--' + statusDot + '"></span>' + statusText +
        '</span>' +
      '</td>' +
      '<td>' +
        '<div class="doc-actions" style="justify-content:flex-end;">' +
          '<button type="button" class="doc-actions__icon" title="Deschide detalii" data-ai-open="' + esc(d.id) + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>' +
          '</button>' +
          '<button type="button" class="doc-actions__icon" title="Descarcă" data-act-download>' +
            '<span class="material-symbols-outlined" aria-hidden="true">download</span>' +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  function sourceIcon(src) {
    if (src === 'email') return 'mail';
    if (src === 'whatsapp') return 'chat';
    if (src === 'generat') return 'auto_awesome';
    return 'upload_file';
  }

  /* ---------- Pagination ---------- */

  function paginationHtml(total) {
    var totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    var sizes = [10, 25, 50].map(function (n) {
      return '<button type="button" class="size-pill' + (state.pageSize === n ? ' is-active' : '') +
        '" data-size="' + n + '">' + n + '</button>';
    }).join('');

    var nums = pageNumbers(state.page, totalPages).map(function (n) {
      if (n === '...') return '<span class="page-ellipsis">…</span>';
      return '<button type="button" class="page-pill' + (state.page === n ? ' is-active' : '') +
        '" data-page="' + n + '">' + n + '</button>';
    }).join('');

    return '<nav class="pagination" aria-label="Paginare">' +
      '<div class="pagination__left">' +
        '<span class="pagination__info">Număr intrări afișate:</span>' + sizes +
      '</div>' +
      '<div class="pagination__right">' +
        '<span class="pagination__info">Pagina ' + state.page + ' din ' + totalPages + ' (' + total + ' elemente)</span>' +
        '<button type="button" class="page-pill page-nav" data-nav="prev"' + (state.page === 1 ? ' disabled' : '') + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_left</span>' +
        '</button>' +
        nums +
        '<button type="button" class="page-pill page-nav" data-nav="next"' + (state.page === totalPages ? ' disabled' : '') + '>' +
          '<span class="material-symbols-outlined" aria-hidden="true">chevron_right</span>' +
        '</button>' +
      '</div>' +
    '</nav>';
  }

  function pageNumbers(cur, tot) {
    if (tot <= 5) {
      var out = [];
      for (var i = 1; i <= tot; i++) out.push(i);
      return out;
    }
    if (cur <= 3) return [1, 2, 3, 4, '...', tot];
    if (cur >= tot - 2) return [1, '...', tot - 3, tot - 2, tot - 1, tot];
    return [1, '...', cur - 1, cur, cur + 1, '...', tot];
  }

  /* ---------- Event binding ---------- */

  function bindGlobalSearch() {
    var el = document.getElementById('arhiva-global');
    if (!el) return;
    el.addEventListener('input', function () {
      state.globalSearch = el.value;
      state.page = 1;
      render();
      var again = document.getElementById('arhiva-global');
      if (again) {
        again.focus();
        var len = again.value.length;
        again.setSelectionRange(len, len);
      }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        state.globalSearch = '';
        el.value = '';
        render();
      }
    });
  }

  function bindTree() {
    var tree = document.querySelector('.arhiva-tree');
    if (!tree) return;

    var search = tree.querySelector('#arhiva-tree-search');
    if (search) {
      search.addEventListener('input', function () {
        state.clientSearch = search.value;
        render();
        var again = document.getElementById('arhiva-tree-search');
        if (again) {
          again.focus();
          var len = again.value.length;
          again.setSelectionRange(len, len);
        }
      });
    }

    /* Unified node click handler — every level is selectable, non-leaf
       nodes additionally toggle their expansion. */
    tree.querySelectorAll('[data-node-level]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('arhiva-tree__node--disabled')) return;
        var level = btn.getAttribute('data-node-level');
        var clientId = cidVal(btn.getAttribute('data-node-client'));
        var year  = btn.getAttribute('data-node-year');
        var month = btn.getAttribute('data-node-month');
        var cat   = btn.getAttribute('data-node-category');

        /* Toggle expansion for non-leaf nodes */
        if (level !== 'category') {
          var k = btn.getAttribute('data-expand');
          if (k) {
            if (state.expanded.has(k)) state.expanded.delete(k);
            else state.expanded.add(k);
          }
        }

        state.selection = {
          level: level,
          clientId: clientId,
          year:  year  ? parseInt(year, 10)  : null,
          month: month ? parseInt(month, 10) : null,
          category: cat || null
        };
        state.globalSearch = '';
        state.page = 1;
        saveSelection();
        render();
      });
    });
  }

  function bindContent() {
    var root = document.getElementById('arhiva-main');
    if (!root) return;

    /* Breadcrumb navigation — jump back to the clicked level. */
    root.querySelectorAll('[data-crumb]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-crumb');
        var cur = state.selection;
        if (target === 'root') {
          state.selection = null;
        } else if (cur) {
          if (target === 'client') {
            state.selection = { level: 'client', clientId: cur.clientId, year: null, month: null, category: null };
            state.expanded.add(key('client', cur.clientId));
          } else if (target === 'year') {
            state.selection = { level: 'year', clientId: cur.clientId, year: cur.year, month: null, category: null };
            state.expanded.add(key('year', cur.clientId, cur.year));
          } else if (target === 'month') {
            state.selection = { level: 'month', clientId: cur.clientId, year: cur.year, month: cur.month, category: null };
            state.expanded.add(key('month', cur.clientId, cur.year, cur.month));
          }
        }
        state.page = 1;
        saveSelection();
        render();
      });
    });

    /* Category pill clicks — set sel.category (or clear it for "Toate").
       Keeps sel.level at current non-leaf (client/year/month). */
    root.querySelectorAll('[data-pill]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('arhiva-main__filter--empty')) return;
        var cat = btn.getAttribute('data-pill');
        if (!state.selection) return;
        state.selection.category = (cat === 'all') ? null : cat;
        state.page = 1;
        saveSelection();
        render();
      });
    });

    /* Reset search */
    root.querySelectorAll('[data-reset-global]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.globalSearch = '';
        render();
      });
    });

    /* Open AI modal — read only */
    root.querySelectorAll('[data-ai-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var id = el.getAttribute('data-ai-open');
        if (window.SCRIPTICA_OPEN_DOC_AI_MODAL) {
          window.SCRIPTICA_OPEN_DOC_AI_MODAL(id, { readOnly: true });
        }
      });
    });

    /* Download stub */
    root.querySelectorAll('[data-act-download]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.SCRIPTICA_TOAST) window.SCRIPTICA_TOAST('info', 'Funcție disponibilă în versiunea finală.');
      });
    });

    /* Pagination */
    root.querySelectorAll('[data-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.pageSize = parseInt(btn.getAttribute('data-size'), 10);
        state.page = 1;
        render();
      });
    });
    root.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.page = parseInt(btn.getAttribute('data-page'), 10);
        render();
      });
    });
    root.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var totalPages = Math.max(1, Math.ceil(getCurrentDocsCount() / state.pageSize));
        if (btn.getAttribute('data-nav') === 'prev') state.page = Math.max(1, state.page - 1);
        else state.page = Math.min(totalPages, state.page + 1);
        render();
      });
    });
  }

  function getCurrentDocsCount() {
    if (state.globalSearch && state.globalSearch.trim()) {
      var q = state.globalSearch.toLowerCase().trim();
      return getArchiveDocs().filter(function (d) {
        return matchesGlobal(d, q) && docContainer(d);
      }).length;
    }
    if (state.selection) {
      return getDocumentsForSelection(state.selection).length;
    }
    return 0;
  }

  /* ---------- Utilities ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();
