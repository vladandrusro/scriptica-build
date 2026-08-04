/* ============================================================
   Scriptica — Tipuri de clienți V2 (explorare locală)
   Workspace de configurare: categorie, arhivă de bază și Acasă.
   ============================================================ */
(function () {
  'use strict';

  var root;
  var dialogSeq = 0;
  var archiveUid = 0;
  var state = { q: '', selectedId: '' };
  var CT_ICONS = ['calculate', 'verified_user', 'balance', 'diversity_2', 'gavel', 'apartment', 'handshake', 'storefront'];

  function SA() { return (window.SCRIPTICA_MOCK && window.SCRIPTICA_MOCK.superAdmin) || null; }
  function clientTypes() { return (SA() && SA().clientTypes) || []; }
  function verticals() { return (SA() && SA().flowVerticals) || []; }
  function templates() { return (SA() && SA().flowTemplates) || []; }
  function clients() { return (SA() && SA().clients) || []; }
  function typeById(id) { return clientTypes().find(function (t) { return t.id === id; }) || null; }
  function verticalById(id) { return verticals().find(function (v) { return v.id === id; }) || null; }
  function clientsForType(id) { return clients().filter(function (c) { return c.clientTypeId === id; }); }
  /* Compatibilitate pentru editorul de pachet rămas izolat în codul V1;
     suprafața V2 nu îl mai expune și modulele se gestionează per client. */
  function templatesForVertical(id) { return templates().filter(function (t) { return t.verticalId === id; }); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function plural(n, one, many) { return n === 1 ? one : many; }
  function toast(variant, message) {
    if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(variant, message);
  }
  function vaClass(v) {
    return typeof window.scripticaVerticalAccentClass === 'function'
      ? window.scripticaVerticalAccentClass(v) : 'va-mov';
  }
  function slugify(s) {
    return normalize(s).replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'nou';
  }
  function uniqueId(prefix, name, list) {
    var base = prefix + '_' + slugify(name), id = base, i = 2;
    while (list.some(function (x) { return x.id === id; })) { id = base + '_' + i; i++; }
    return id;
  }
  function nextArchiveId() { return 'af_' + Date.now().toString(36) + '_' + (archiveUid++); }

  function countFolders(tree) {
    var n = 0;
    (tree || []).forEach(function walk(folder) {
      n++;
      (folder.children || []).forEach(walk);
    });
    return n;
  }
  function countRoutedTypes(tree) {
    var ids = [];
    (tree || []).forEach(function walk(folder) {
      ids = ids.concat(folder.docTypeIds || []);
      (folder.children || []).forEach(walk);
    });
    return ids.length;
  }
  function hasSystemFolder(tree) {
    var found = false;
    (tree || []).forEach(function walk(folder) {
      if (folder.system) found = true;
      (folder.children || []).forEach(walk);
    });
    return found;
  }
  function surfaceStatus(t, key) {
    var review = t.needsReview || {};
    var missing = key === 'archive'
      ? !(t.archiveTree && t.archiveTree.length)
      : !(t.dashboardLayout && t.dashboardLayout.length);
    return (review[key] || missing)
      ? { label: 'De revizuit', css: 'pill--pending', icon: 'pending_actions', ready: false }
      : { label: 'Configurat', css: 'pill--success', icon: 'check_circle', ready: true };
  }
  function configuredCount(t) {
    return [surfaceStatus(t, 'archive'), surfaceStatus(t, 'dashboard')]
      .filter(function (s) { return s.ready; }).length;
  }

  function selectedType() {
    var selected = typeById(state.selectedId);
    if (selected) return selected;
    selected = clientTypes()[0] || null;
    state.selectedId = selected ? selected.id : '';
    return selected;
  }
  function visibleTypes() {
    var q = normalize(state.q);
    return clientTypes().filter(function (t) {
      if (!q) return true;
      var haystack = [t.name, t.description, t.clientLabel, t.clientLabelPlural].join(' ');
      return normalize(haystack).indexOf(q) !== -1;
    }).sort(function (a, b) { return a.name.localeCompare(b.name, 'ro'); });
  }
  function rememberSelection(id) {
    state.selectedId = id;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('ct', id);
      url.searchParams.set('view', 'superadmin');
      window.history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString());
    } catch (e) { /* URL-ul nu este esențial pentru prototip. */ }
  }

  function setupPathHtml(t) {
    var context = t ? '&ct=' + encodeURIComponent(t.id) : '';
    return '<nav class="sa-setup" aria-label="Pașii configurării Super Admin">' +
      '<a class="sa-setup__step is-active" href="super-admin-tipuri-clienti-v2.html?view=superadmin" aria-current="step"><span>1</span><div><small>Clasifică organizația</small><b>Tip de client</b></div></a>' +
      '<span class="material-symbols-outlined sa-setup__arrow" aria-hidden="true">arrow_forward</span>' +
      '<a class="sa-setup__step" href="super-admin-clienti.html?view=superadmin' + context + '&new=client"><span>2</span><div><small>Creează contul</small><b>Client</b></div></a>' +
      '<span class="material-symbols-outlined sa-setup__arrow" aria-hidden="true">arrow_forward</span>' +
      '<a class="sa-setup__step" href="super-admin-clienti.html?view=superadmin' + context + '"><span>3</span><div><small>Activează verticalele</small><b>Module</b></div></a>' +
    '</nav>';
  }

  function renderPage() {
    var type = selectedType();
    var totalClients = clientTypes().reduce(function (sum, t) { return sum + clientsForType(t.id).length; }, 0);
    root.innerHTML =
      '<header class="page-header ctv2-page-header">' +
        '<div class="ctv2-heading"><div class="ctv2-heading__line">' +
          '<h1 class="page-header__title">Tipuri de clienți</h1><span class="pill pill--neutral">Pasul 1 din 3</span></div>' +
          '<p class="ctv2-intro">Tipul descrie organizația, fără să îi impună fluxurile. Clientul poate fi creat imediat, iar modulele se activează ulterior din profilul lui.</p>' +
        '</div>' +
        '<div class="ctv2-page-actions">' +
          '<button class="btn btn--primary" type="button" data-new-type>Tip de client nou' +
            '<span class="material-symbols-outlined" aria-hidden="true">add</span></button>' +
        '</div>' +
      '</header>' +
      setupPathHtml(type) +
      '<div class="ctv2-summary" aria-label="Rezumat tipuri de clienți">' +
        summaryMetric('category', clientTypes().length, 'tipuri definite') +
        summaryMetric('apartment', totalClients, 'clienți înrolați') +
        '<span class="ctv2-summary__explain"><span class="material-symbols-outlined" aria-hidden="true">info</span>' +
          'Un client are un singur tip, dar modulele contractate îi aparțin individual.</span>' +
      '</div>' +
      '<div class="ctv2-workspace">' +
        '<aside class="ctv2-selector" aria-label="Tipuri de clienți">' +
          '<div class="ctv2-selector__head"><h2>Alege tipul</h2><span>' + clientTypes().length + '</span></div>' +
          '<div class="filter-input-search ctv2-search"><span class="material-symbols-outlined" aria-hidden="true">search</span>' +
            '<label class="sr-only" for="ctv2-search">Caută un tip de client</label>' +
            '<input id="ctv2-search" class="input" type="search" placeholder="Caută un tip..." autocomplete="off" value="' + esc(state.q) + '"></div>' +
          '<div class="ctv2-selector__list" data-type-list>' + typeListHtml() + '</div>' +
        '</aside>' +
        '<section class="ctv2-detail" data-type-detail>' + (type ? detailHtml(type) : emptyDetailHtml()) + '</section>' +
      '</div>';
  }

  function summaryMetric(icon, number, label) {
    return '<div class="ctv2-summary__metric"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span>' +
      '<b>' + number + '</b><span>' + esc(label) + '</span></div>';
  }

  function typeListHtml() {
    var list = visibleTypes();
    if (!list.length) {
      return '<div class="ctv2-selector__empty"><span class="material-symbols-outlined" aria-hidden="true">search_off</span>' +
        '<b>Niciun rezultat</b><button type="button" data-clear-search>Șterge căutarea</button></div>';
    }
    return list.map(function (t) {
      var n = clientsForType(t.id).length;
      var selected = t.id === state.selectedId;
      var attention = 2 - configuredCount(t);
      var primary = 'va-mov';
      return '<button class="ctv2-type' + (selected ? ' is-selected' : '') + '" type="button" data-select-type="' + esc(t.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
        '<span class="ctv2-type__icon ' + primary + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc(t.icon || 'category') + '</span></span>' +
        '<span class="ctv2-type__copy"><b>' + esc(t.name) + '</b><small>' + n + ' ' + plural(n, 'client', 'clienți') + '</small></span>' +
        (attention ? '<span class="ctv2-type__attention" title="' + attention + ' configurări de revizuit">' + attention + '</span>' :
          '<span class="material-symbols-outlined ctv2-type__ready" aria-label="Configurat">check_circle</span>') +
      '</button>';
    }).join('');
  }

  function emptyDetailHtml() {
    return '<div class="ctv2-detail__empty"><span class="material-symbols-outlined" aria-hidden="true">category</span>' +
      '<h2>Nu există tipuri de clienți</h2><p>Creează primul tip pentru a-i defini experiența.</p>' +
      '<button class="btn btn--primary" type="button" data-new-type>Tip de client nou</button></div>';
  }

  function detailHtml(t) {
    var n = clientsForType(t.id).length;
    var configured = configuredCount(t);
    var primary = 'va-mov';
    return '<div class="ctv2-detail__head">' +
        '<div class="ctv2-detail__identity">' +
          '<span class="ctv2-detail__icon ' + primary + '"><span class="material-symbols-outlined" aria-hidden="true">' + esc(t.icon || 'category') + '</span></span>' +
          '<div><div class="ctv2-detail__eyebrow">Tip de client selectat</div><h2>' + esc(t.name) + '</h2>' +
            '<p>' + esc(t.description || 'Fără descriere.') + '</p></div>' +
        '</div>' +
        '<div class="ctv2-detail__actions">' +
          '<button class="btn btn--ghost" type="button" data-edit-type="' + esc(t.id) + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">edit</span>Editează tipul</button>' +
          '<button class="btn btn--ghost" type="button" data-show-clients="' + esc(t.id) + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">apartment</span>' + n + ' ' + plural(n, 'client', 'clienți') + '</button>' +
          (n === 0 ? '<button class="sa-mini-btn sa-mini-btn--danger" type="button" data-delete-type="' + esc(t.id) + '" title="Șterge tipul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>' : '') +
        '</div>' +
      '</div>' +
      impactHtml(t, n) +
      '<div class="ctv2-composition-head"><div><span class="ctv2-detail__eyebrow">Configurație de bază</span>' +
        '<h3>Categoria rămâne separată de module</h3></div>' +
        '<span class="ctv2-progress"><b>' + configured + '/2</b> configurări verificate</span></div>' +
      '<div class="ctv2-modules">' +
        archiveModuleHtml(t) + dashboardModuleHtml(t) +
      '</div>';
  }

  function impactHtml(t, n) {
    if (!n) {
      return '<div class="ctv2-impact ctv2-impact--safe"><span class="material-symbols-outlined" aria-hidden="true">science</span>' +
        '<span><b>Poți experimenta fără impact.</b> Acest tip nu este folosit încă de niciun client.</span></div>';
    }
    return '<div class="ctv2-impact"><span class="material-symbols-outlined" aria-hidden="true">campaign</span>' +
      '<span><b>' + n + ' ' + plural(n, 'client folosește', 'clienți folosesc') + ' acest tip.</b> Schimbările de categorie nu activează și nu dezactivează modulele clienților existenți.</span></div>';
  }

  function statusPill(status) {
    return '<span class="pill ' + status.css + '"><span class="material-symbols-outlined" aria-hidden="true">' + status.icon + '</span>' + esc(status.label) + '</span>';
  }
  function moduleHead(number, icon, title, scope, status) {
    return '<header class="ctv2-module__head"><span class="ctv2-module__number">' + number + '</span>' +
      '<span class="ctv2-module__icon"><span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span></span>' +
      '<div class="ctv2-module__title"><small>' + esc(scope) + '</small><h4>' + esc(title) + '</h4></div>' + statusPill(status) + '</header>';
  }

  function flattenFolders(tree) {
    var list = [];
    (tree || []).forEach(function walk(folder, depth) {
      list.push({ folder: folder, depth: depth || 1 });
      (folder.children || []).forEach(function (child) { walk(child, (depth || 1) + 1); });
    });
    return list;
  }
  function folderPreviewHtml(tree) {
    var flat = flattenFolders(tree);
    var system = flat.find(function (entry) { return entry.folder.system; });
    var rows = flat.filter(function (entry) { return !entry.folder.system; }).slice(0, 4);
    if (system) rows.push(system);
    var hidden = Math.max(0, flat.length - rows.length);
    return '<div class="ctv2-folder-preview">' + rows.map(function (entry) {
      var f = entry.folder;
      return '<div class="ctv2-folder ctv2-folder--d' + Math.min(entry.depth, 3) + (f.system ? ' is-system' : '') + '">' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + (f.system ? 'inbox' : 'folder') + '</span>' +
        '<b>' + esc(f.name) + '</b><small>' + (f.system ? 'ce nu recunoaște A.I.' : (f.docTypeIds || []).length + ' tipuri') + '</small></div>';
    }).join('') + (hidden ? '<span class="ctv2-more">+' + hidden + ' dosare în structură</span>' : '') + '</div>';
  }
  function archiveModuleHtml(t) {
    var status = surfaceStatus(t, 'archive');
    return '<article class="ctv2-module' + (status.ready ? '' : ' is-review') + '">' + moduleHead('1', 'folder_open', 'Arhivă și rutare A.I.', 'Configurație de bază', status) +
      '<div class="ctv2-module__body"><p>Definește arborele de dosare și destinația unică a fiecărui tip de document.</p>' +
        '<div class="ctv2-inline-metrics"><span><b>' + countFolders(t.archiveTree) + '</b> dosare</span><span><b>' + countRoutedTypes(t.archiveTree) + '</b> tipuri rutate</span></div>' +
        folderPreviewHtml(t.archiveTree || []) +
      '</div><footer class="ctv2-module__foot"><button class="btn btn--secondary" type="button" data-edit-archive="' + esc(t.id) + '">Configurează arhiva<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button></footer></article>';
  }

  function widgetLabel(item, t) {
    var labels = {
      situatii_noi: 'Situații noi', alerte: 'Alerte', clienti: t.clientLabelPlural || 'Clienți',
      termene: 'Termene', notificari: 'Notificări', echipa: 'Echipa',
      arhiva_recente: 'Arhivă', mesaje: 'Mesaje', rapoarte_audit: 'Rapoarte audit'
    };
    if (item.widget === 'flow_summary' && item.params) {
      var v = verticalById(item.params.verticalId);
      return v ? v.name : 'Verticală';
    }
    if (item.widget === 'arhiva_recente' && item.params && item.params.folderId) {
      var folder = flattenFolders(t.archiveTree || []).find(function (entry) { return entry.folder.id === item.params.folderId; });
      return folder ? 'Arhivă · ' + folder.folder.name : 'Arhivă';
    }
    return labels[item.widget] || item.widget;
  }
  function dashboardPreviewHtml(t) {
    var layout = t.dashboardLayout || [];
    return '<div class="ctv2-dashboard-preview">' + layout.slice(0, 6).map(function (item) {
      return '<div class="ctv2-widget' + (item.size === 'full' ? ' is-full' : '') + '"><span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span>' +
        '<b>' + esc(widgetLabel(item, t)) + '</b></div>';
    }).join('') + '</div>' + (layout.length > 6 ? '<span class="ctv2-more">+' + (layout.length - 6) + ' widget-uri</span>' : '');
  }
  function dashboardModuleHtml(t) {
    var status = surfaceStatus(t, 'dashboard');
    return '<article class="ctv2-module' + (status.ready ? '' : ' is-review') + '">' + moduleHead('2', 'space_dashboard', 'Ecranul Acasă', 'Configurație de bază', status) +
      '<div class="ctv2-module__body"><p>Compune baza ecranului Acasă. Modulele verticale active ale fiecărui client se adaugă și se ascund automat.</p>' +
        '<div class="ctv2-inline-metrics"><span><b>' + ((t.dashboardLayout || []).length) + '</b> widget-uri</span><span>jumătate sau rând complet</span></div>' +
        dashboardPreviewHtml(t) +
      '</div><footer class="ctv2-module__foot"><a class="btn btn--secondary" href="super-admin-dashboard.html?ct=' + encodeURIComponent(t.id) + '&view=superadmin">Construiește Acasă<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></a></footer></article>';
  }

  function handleRootClick(e) {
    var el;
    if ((el = e.target.closest('[data-select-type]'))) {
      rememberSelection(el.getAttribute('data-select-type'));
      renderPage();
    } else if ((el = e.target.closest('[data-clear-search]'))) {
      state.q = '';
      renderPage();
    } else if ((el = e.target.closest('[data-new-type]'))) {
      openTypeEditor(null);
    } else if ((el = e.target.closest('[data-edit-type]'))) {
      openTypeEditor(typeById(el.getAttribute('data-edit-type')));
    } else if ((el = e.target.closest('[data-edit-archive]'))) {
      openArchiveEditor(typeById(el.getAttribute('data-edit-archive')));
    } else if ((el = e.target.closest('[data-show-clients]'))) {
      openClients(typeById(el.getAttribute('data-show-clients')));
    } else if ((el = e.target.closest('[data-delete-type]'))) {
      confirmDelete(typeById(el.getAttribute('data-delete-type')));
    }
  }

  function handleRootInput(e) {
    if (e.target.id !== 'ctv2-search') return;
    state.q = e.target.value;
    var list = root.querySelector('[data-type-list]');
    if (list) list.innerHTML = typeListHtml();
  }

  function fieldHtml(label, controlHtml, help, name) {
    return '<div class="form-field"' + (name ? ' data-field="' + esc(name) + '"' : '') + '><label class="form-label">' + esc(label) + '</label>' +
      controlHtml + (help ? '<span class="form-helper">' + esc(help) + '</span>' : '') + '<span class="form-error" role="alert"></span></div>';
  }
  function setFieldError(scope, name, message) {
    var field = scope.querySelector('[data-field="' + name + '"]');
    if (!field) return;
    field.classList.toggle('has-error', !!message);
    var error = field.querySelector('.form-error');
    if (error) error.textContent = message || '';
  }
  function fval(scope, name) {
    var field = scope.querySelector('[data-f="' + name + '"]');
    return field ? field.value.trim() : '';
  }
  function iconPickerHtml(selected) {
    return '<div class="sa-iconpick">' + CT_ICONS.map(function (icon) {
      return '<button type="button" class="sa-iconpick__btn' + (icon === selected ? ' is-selected' : '') + '" data-pick-icon="' + icon + '" title="' + icon + '">' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + icon + '</span></button>';
    }).join('') + '</div>';
  }

  function openTypeEditor(t) {
    var isNew = !t;
    var initialState = JSON.stringify({
      name: t ? t.name : '',
      icon: t ? t.icon : CT_ICONS[0],
      description: t ? t.description || '' : '',
      clientLabel: t ? t.clientLabel || '' : '',
      clientLabelPlural: t ? t.clientLabelPlural || '' : ''
    });

    function editorState(dialog) {
      var selectedIcon = dialog.querySelector('[data-pick-icon].is-selected');
      return JSON.stringify({
        name: fval(dialog, 'name'),
        icon: selectedIcon ? selectedIcon.getAttribute('data-pick-icon') : CT_ICONS[0],
        description: fval(dialog, 'description'),
        clientLabel: fval(dialog, 'clientLabel'),
        clientLabelPlural: fval(dialog, 'clientLabelPlural')
      });
    }

    openDialog({
      title: isNew ? 'Tip de client nou' : 'Editează tipul de client',
      subtitle: isNew
        ? 'Definește categoria organizației. Clientul poate fi creat fără module.'
        : t.name,
      bodyHtml:
        '<div class="ctv2-editor-note"><span class="material-symbols-outlined" aria-hidden="true">category</span>' +
          '<span><b>Tipul de client este doar categoria organizației.</b> Verticalele se activează ca module pe fiecare client, în funcție de plan.</span></div>' +
        fieldHtml('Denumirea tipului', '<input class="input" type="text" data-f="name" value="' + esc(t ? t.name : '') + '" placeholder="ex. Firmă de contabilitate">', null, 'name') +
        fieldHtml('Pictogramă', iconPickerHtml(t ? t.icon : CT_ICONS[0])) +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description" placeholder="Ce fel de organizații folosesc acest tip?">' + esc(t ? t.description || '' : '') + '</textarea>') +
        '<div class="sa-form-2col">' +
          fieldHtml('Partea externă · singular', '<input class="input" type="text" data-f="clientLabel" value="' + esc(t ? t.clientLabel || '' : '') + '" placeholder="Client">', 'Exemple: Client, Instituție, Beneficiar.') +
          fieldHtml('Partea externă · plural', '<input class="input" type="text" data-f="clientLabelPlural" value="' + esc(t ? t.clientLabelPlural || '' : '') + '" placeholder="Clienți">') +
        '</div>',
      submitLabel: isNew ? 'Creează tipul' : 'Salvează modificările',
      isDirty: function (dialog) { return editorState(dialog) !== initialState; },
      onOpen: function (dialog) {
        dialog.querySelectorAll('[data-pick-icon]').forEach(function (button) {
          button.addEventListener('click', function () {
            dialog.querySelectorAll('[data-pick-icon]').forEach(function (x) { x.classList.remove('is-selected'); });
            button.classList.add('is-selected');
          });
        });
      },
      onSubmit: function (dialog, close) {
        var name = fval(dialog, 'name');
        setFieldError(dialog, 'name', name ? '' : 'Denumirea tipului este obligatorie.');
        if (!name) return;
        var selectedIcon = dialog.querySelector('[data-pick-icon].is-selected');
        var clientLabel = fval(dialog, 'clientLabel') || 'Client';
        var id = t ? t.id : uniqueId('ct', name, clientTypes());
        var record = t ? Object.assign({}, t) : {
          id: id,
          builtin: false,
          verticalIds: [],
          defaultTemplateIds: [],
          archiveTree: typeof window.scripticaDefaultArchiveTree === 'function' ? window.scripticaDefaultArchiveTree() : [],
          dashboardLayout: [],
          needsReview: { archive: true, dashboard: true }
        };
        record.name = name;
        record.icon = selectedIcon ? selectedIcon.getAttribute('data-pick-icon') : 'category';
        record.description = fval(dialog, 'description');
        record.clientLabel = clientLabel;
        record.clientLabelPlural = fval(dialog, 'clientLabelPlural') ||
          (clientLabel === 'Client' ? 'Clienți' : clientLabel === 'Instituție' ? 'Instituții' : clientLabel + 'i');
        window.scripticaFlowSave('clientType', record);
        rememberSelection(id);
        close();
        if (isNew) {
          window.location.href = 'super-admin-clienti.html?view=superadmin&ct=' + encodeURIComponent(id) + '&new=client';
          return;
        }
        renderPage();
        toast('success', 'Tipul „' + name + '” a fost actualizat.');
      }
    });
  }

  function packageBlocksHtml(t) {
    return verticals().filter(function (v) { return (v.status || 'activ') === 'activ'; }).map(function (v) {
      var selected = !!(t && (t.verticalIds || []).indexOf(v.id) !== -1);
      var tplRows = templatesForVertical(v.id).map(function (tpl) {
        var checked = !!(t && (t.defaultTemplateIds || []).indexOf(tpl.id) !== -1);
        return '<label class="checkbox"><input type="checkbox" data-package-template data-vertical="' + esc(v.id) + '" value="' + esc(tpl.id) + '"' +
          (checked ? ' checked' : '') + (selected ? '' : ' disabled') + '> ' + esc(tpl.name) + ' <small>(' + esc(tpl.frequency) + ')</small></label>';
      }).join('');
      return '<div class="sa-ct-vblock ' + vaClass(v) + '"><label class="checkbox sa-ct-vblock__head">' +
        '<input type="checkbox" data-package-vertical value="' + esc(v.id) + '"' + (selected ? ' checked' : '') + '>' +
        '<span class="material-symbols-outlined" aria-hidden="true">' + esc(v.icon || 'account_tree') + '</span><b>' + esc(v.name) + '</b></label>' +
        '<div class="sa-ct-tpls">' + (tplRows || '<span class="text-muted">Fără șabloane disponibile.</span>') + '</div></div>';
    }).join('');
  }

  function openPackageEditor(t) {
    var isNew = !t;
    var initialPackageState = JSON.stringify({
      name: t ? t.name : '',
      icon: t ? t.icon : CT_ICONS[0],
      description: t ? t.description || '' : '',
      clientLabel: t ? t.clientLabel || '' : '',
      clientLabelPlural: t ? t.clientLabelPlural || '' : '',
      verticalIds: t ? (t.verticalIds || []).slice().sort() : [],
      defaultTemplateIds: t ? (t.defaultTemplateIds || []).slice().sort() : []
    });

    function packageState(dialog) {
      var selectedIcon = dialog.querySelector('[data-pick-icon].is-selected');
      return JSON.stringify({
        name: fval(dialog, 'name'),
        icon: selectedIcon ? selectedIcon.getAttribute('data-pick-icon') : CT_ICONS[0],
        description: fval(dialog, 'description'),
        clientLabel: fval(dialog, 'clientLabel'),
        clientLabelPlural: fval(dialog, 'clientLabelPlural'),
        verticalIds: Array.prototype.filter.call(dialog.querySelectorAll('[data-package-vertical]'), function (cb) { return cb.checked; })
          .map(function (cb) { return cb.value; }).sort(),
        defaultTemplateIds: Array.prototype.filter.call(dialog.querySelectorAll('[data-package-template]'), function (cb) { return cb.checked && !cb.disabled; })
          .map(function (cb) { return cb.value; }).sort()
      });
    }
    openDialog({
      title: isNew ? 'Tip de client nou' : 'Pachet de lucru — ' + t.name,
      subtitle: 'Alege punctul de pornire al noilor înrolări și vocabularul folosit în aplicație.',
      wide: true,
      bodyHtml:
        '<div class="ctv2-editor-note"><span class="material-symbols-outlined" aria-hidden="true">account_tree</span>' +
          '<span>Verticalele și șabloanele sunt copiate la înrolare, apoi pot fi adaptate în workspace-ul clientului. Arhiva și Acasă se configurează separat.</span></div>' +
        fieldHtml('Denumirea tipului', '<input class="input" type="text" data-f="name" value="' + esc(t ? t.name : '') + '" placeholder="ex. Cabinet de consultanță fiscală">', null, 'name') +
        fieldHtml('Pictogramă', iconPickerHtml(t ? t.icon : CT_ICONS[0])) +
        fieldHtml('Descriere', '<textarea class="input" rows="2" data-f="description">' + esc(t ? t.description || '' : '') + '</textarea>') +
        '<div class="sa-form-2col">' +
          fieldHtml('Partea externă · singular', '<input class="input" type="text" data-f="clientLabel" value="' + esc(t ? t.clientLabel || '' : '') + '" placeholder="Client">', 'Exemple: Client, Instituție, Beneficiar.') +
          fieldHtml('Partea externă · plural', '<input class="input" type="text" data-f="clientLabelPlural" value="' + esc(t ? t.clientLabelPlural || '' : '') + '" placeholder="Clienți">') +
        '</div>' +
        '<div class="form-field" data-field="package"><label class="form-label">Verticale și șabloane implicite</label>' + packageBlocksHtml(t) + '<span class="form-error" role="alert"></span></div>',
      submitLabel: isNew ? 'Creează tipul' : 'Salvează pachetul',
      isDirty: function (dialog) {
        return packageState(dialog) !== initialPackageState;
      },
      onOpen: function (dialog) {
        dialog.querySelectorAll('[data-pick-icon]').forEach(function (button) {
          button.addEventListener('click', function () {
            dialog.querySelectorAll('[data-pick-icon]').forEach(function (x) { x.classList.remove('is-selected'); });
            button.classList.add('is-selected');
          });
        });
        dialog.querySelectorAll('[data-package-vertical]').forEach(function (checkbox) {
          checkbox.addEventListener('change', function () {
            dialog.querySelectorAll('[data-package-template][data-vertical="' + checkbox.value + '"]').forEach(function (tpl) {
              tpl.disabled = !checkbox.checked;
              if (checkbox.checked) tpl.checked = true;
            });
          });
        });
      },
      onSubmit: function (dialog, close) {
        var name = fval(dialog, 'name');
        var vids = Array.prototype.filter.call(dialog.querySelectorAll('[data-package-vertical]'), function (cb) { return cb.checked; })
          .map(function (cb) { return cb.value; });
        var tids = Array.prototype.filter.call(dialog.querySelectorAll('[data-package-template]'), function (cb) { return cb.checked && !cb.disabled; })
          .map(function (cb) { return cb.value; });
        setFieldError(dialog, 'name', name ? '' : 'Denumirea tipului este obligatorie.');
        var packageError = !vids.length ? 'Selectează cel puțin o verticală.' : (!tids.length ? 'Selectează cel puțin un șablon implicit.' : '');
        setFieldError(dialog, 'package', packageError);
        if (!name || packageError) return;
        var selectedIcon = dialog.querySelector('[data-pick-icon].is-selected');
        var clientLabel = fval(dialog, 'clientLabel') || 'Client';
        var id = t ? t.id : uniqueId('ct', name, clientTypes());
        var now = Date.now().toString(36);
        var record = {
          id: id, builtin: t ? !!t.builtin : false, name: name,
          icon: selectedIcon ? selectedIcon.getAttribute('data-pick-icon') : 'category',
          description: fval(dialog, 'description'), verticalIds: vids, defaultTemplateIds: tids,
          clientLabel: clientLabel, clientLabelPlural: fval(dialog, 'clientLabelPlural') || (clientLabel + 'i'),
          archiveTree: t ? (t.archiveTree || []) : window.scripticaDefaultArchiveTree(),
          dashboardLayout: t ? (t.dashboardLayout || []) : vids.map(function (vid, i) {
            return { id: 'dw_' + now + '_' + i, widget: 'flow_summary', params: { verticalId: vid }, size: 'half' };
          }).concat([{ id: 'dw_' + now + '_t', widget: 'termene', size: 'half' }, { id: 'dw_' + now + '_c', widget: 'clienti', size: 'full' }]),
          needsReview: t ? (t.needsReview || null) : { archive: true, dashboard: true }
        };
        window.scripticaFlowSave('clientType', record);
        rememberSelection(id);
        close();
        renderPage();
        toast('success', isNew ? 'Tipul „' + name + '” a fost creat. Revizuiește acum Arhiva și Acasă.' : 'Pachetul de lucru pentru „' + name + '” a fost salvat.');
      }
    });
  }

  function openArchiveEditor(t) {
    if (!t) return;
    var tree = JSON.parse(JSON.stringify((t.archiveTree && t.archiveTree.length) ? t.archiveTree : window.scripticaDefaultArchiveTree()));
    var snapshot = JSON.stringify(tree);
    var allowedTypes = window.scripticaDocumentTypes();

    function findNode(nodes, id, depth) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id === id) return { node: nodes[i], list: nodes, index: i, depth: depth || 1 };
        var found = findNode(nodes[i].children || [], id, (depth || 1) + 1);
        if (found) return found;
      }
      return null;
    }
    function usedTypeIds() {
      var used = [];
      flattenFolders(tree).forEach(function (entry) { used = used.concat(entry.folder.docTypeIds || []); });
      return used;
    }
    function ownerName(id) {
      var entry = flattenFolders(tree).find(function (x) { return (x.folder.docTypeIds || []).indexOf(id) !== -1; });
      return entry ? entry.folder.name : '';
    }
    function rowHtml(folder, depth) {
      var used = usedTypeIds();
      var chips = (folder.docTypeIds || []).map(function (id) {
        var dt = window.scripticaDocTypeById(id);
        return '<span class="pill admin-anexa-chip">' + esc(dt ? dt.name : id) + '<button type="button" class="admin-anexa-chip__remove" data-archive-remove-type="' + esc(id) + '" data-node="' + esc(folder.id) + '" aria-label="Elimină tipul"><span class="material-symbols-outlined" aria-hidden="true">close</span></button></span>';
      }).join('');
      var options = allowedTypes.filter(function (dt) { return (folder.docTypeIds || []).indexOf(dt.id) === -1; }).map(function (dt) {
        var taken = used.indexOf(dt.id) !== -1;
        return '<option' + (taken ? ' disabled' : ' value="' + esc(dt.id) + '"') + '>' + esc(dt.name) + (taken ? ' — în „' + esc(ownerName(dt.id)) + '”' : '') + '</option>';
      }).join('');
      var actions = folder.system ? '' :
        '<button class="sa-mini-btn" type="button" data-archive-move="-1" data-node="' + esc(folder.id) + '" title="Mută mai sus"><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button>' +
        '<button class="sa-mini-btn" type="button" data-archive-move="1" data-node="' + esc(folder.id) + '" title="Mută mai jos"><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button>' +
        (depth < 3 ? '<button class="sa-mini-btn" type="button" data-archive-add-child data-node="' + esc(folder.id) + '" title="Adaugă subdosar"><span class="material-symbols-outlined" aria-hidden="true">create_new_folder</span></button>' : '') +
        '<button class="sa-mini-btn sa-mini-btn--danger" type="button" data-archive-delete data-node="' + esc(folder.id) + '" title="Șterge dosarul"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>';
      return '<div class="sa-arch-row sa-arch-row--d' + depth + (folder.system ? ' sa-arch-row--system' : '') + '">' +
        '<div class="sa-arch-row__head"><span class="material-symbols-outlined sa-arch-row__folder" aria-hidden="true">' + (folder.system ? 'inbox' : 'folder') + '</span>' +
          '<input class="input sa-arch-row__name" type="text" data-archive-name data-node="' + esc(folder.id) + '" value="' + esc(folder.name) + '"' + (folder.system ? ' disabled' : '') + '>' +
          '<span class="sa-arch-row__actions">' + actions + '</span></div>' +
        (folder.system ? '<div class="sa-arch-row__system"><span class="material-symbols-outlined" aria-hidden="true">smart_toy</span>Primește automat ce nu recunoaște A.I. și nu poate fi șters.</div>' :
          '<div class="sa-arch-row__types">' + chips + '<select class="select sa-arch-row__select" data-archive-add-type data-node="' + esc(folder.id) + '"><option value="">+ Adaugă tip de document...</option>' + options + '</select></div>') +
      '</div>' + (folder.children || []).map(function (child) { return rowHtml(child, depth + 1); }).join('');
    }
    function draw(dialog) {
      var treeRoot = dialog.querySelector('[data-archive-tree]');
      if (treeRoot) treeRoot.innerHTML = tree.map(function (folder) { return rowHtml(folder, 1); }).join('');
    }

    openDialog({
      title: 'Structura arhivei — ' + t.name,
      subtitle: 'A.I.-ul local mută automat fiecare document în dosarul care îi declară tipul.',
      wide: true,
      bodyHtml: '<div class="sa-arch-note"><span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>' +
        'Un tip de document are o singură destinație. Subdosarele participă la rutare; ce nu este recunoscut ajunge în „Necategorisit”. Ordinea de aici devine ordinea din arhiva clientului.</div>' +
        '<div class="sa-arch-tree" data-archive-tree></div><span class="form-error" role="alert" data-archive-error></span>' +
        '<button class="btn btn--secondary" type="button" data-archive-add-root>Dosar nou<span class="material-symbols-outlined" aria-hidden="true">create_new_folder</span></button>',
      submitLabel: 'Salvează structura',
      isDirty: function () { return JSON.stringify(tree) !== snapshot; },
      onOpen: function (dialog) {
        draw(dialog);
        dialog.querySelector('[data-archive-add-root]').addEventListener('click', function () {
          var systemIndex = tree.findIndex(function (folder) { return folder.system; });
          var folder = { id: nextArchiveId(), name: '', docTypeIds: [], children: [] };
          if (systemIndex === -1) tree.push(folder); else tree.splice(systemIndex, 0, folder);
          draw(dialog);
        });
        var treeRoot = dialog.querySelector('[data-archive-tree]');
        treeRoot.addEventListener('input', function (e) {
          var input = e.target.closest('[data-archive-name]');
          if (!input) return;
          var found = findNode(tree, input.getAttribute('data-node'));
          if (found) found.node.name = input.value;
        });
        treeRoot.addEventListener('change', function (e) {
          var select = e.target.closest('[data-archive-add-type]');
          if (!select || !select.value) return;
          var found = findNode(tree, select.getAttribute('data-node'));
          if (found) found.node.docTypeIds = (found.node.docTypeIds || []).concat([select.value]);
          draw(dialog);
        });
        treeRoot.addEventListener('click', function (e) {
          var button;
          if ((button = e.target.closest('[data-archive-remove-type]'))) {
            var foundType = findNode(tree, button.getAttribute('data-node'));
            if (foundType) foundType.node.docTypeIds = (foundType.node.docTypeIds || []).filter(function (id) { return id !== button.getAttribute('data-archive-remove-type'); });
            draw(dialog);
          } else if ((button = e.target.closest('[data-archive-add-child]'))) {
            var foundParent = findNode(tree, button.getAttribute('data-node'));
            if (foundParent) {
              foundParent.node.children = foundParent.node.children || [];
              foundParent.node.children.push({ id: nextArchiveId(), name: '', docTypeIds: [], children: [] });
            }
            draw(dialog);
          } else if ((button = e.target.closest('[data-archive-delete]'))) {
            var foundDelete = findNode(tree, button.getAttribute('data-node'));
            if (foundDelete) foundDelete.list.splice(foundDelete.index, 1);
            draw(dialog);
          } else if ((button = e.target.closest('[data-archive-move]'))) {
            var foundMove = findNode(tree, button.getAttribute('data-node'));
            var target = foundMove ? foundMove.index + parseInt(button.getAttribute('data-archive-move'), 10) : -1;
            if (foundMove && target >= 0 && target < foundMove.list.length && !foundMove.list[target].system) {
              foundMove.list.splice(foundMove.index, 1);
              foundMove.list.splice(target, 0, foundMove.node);
            }
            draw(dialog);
          }
        });
      },
      onSubmit: function (dialog, close) {
        var invalid = false;
        dialog.querySelectorAll('[data-archive-name]').forEach(function (input) {
          input.classList.remove('has-error');
          if (!input.disabled && !input.value.trim()) { input.classList.add('has-error'); invalid = true; }
        });
        var hasRealFolder = flattenFolders(tree).some(function (entry) { return !entry.folder.system; });
        var error = dialog.querySelector('[data-archive-error]');
        error.textContent = invalid ? 'Toate dosarele trebuie să aibă un nume.' : (!hasRealFolder ? 'Adaugă cel puțin un dosar în afară de „Necategorisit”.' : '');
        if (invalid || !hasRealFolder) return;
        if (!hasSystemFolder(tree)) tree.push({ id: nextArchiveId(), name: 'Necategorisit', system: true, docTypeIds: [], children: [] });
        var updated = Object.assign({}, t, { archiveTree: tree });
        if (updated.needsReview) updated.needsReview = Object.assign({}, updated.needsReview, { archive: false });
        window.scripticaFlowSave('clientType', updated);
        close();
        renderPage();
        toast('success', 'Structura de arhivă pentru „' + t.name + '” a fost salvată.');
      }
    });
  }

  function openClients(t) {
    if (!t) return;
    var list = clientsForType(t.id);
    openDialog({
      title: list.length ? 'Clienți care folosesc acest tip' : 'Tip nefolosit',
      subtitle: t.name,
      bodyHtml: list.length ? '<div class="ctv2-client-list">' + list.map(function (client) {
        return '<div class="ctv2-client-row"><span class="material-symbols-outlined" aria-hidden="true">apartment</span><b>' + esc(client.name) + '</b><small>' + esc(client.contract || 'activ') + '</small></div>';
      }).join('') + '</div>' : '<div class="ctv2-editor-note"><span class="material-symbols-outlined" aria-hidden="true">inventory_2</span><span>Acest tip nu este folosit încă de niciun client.</span></div>',
      footerHtml: '<span class="modal__footer-helper"></span><a class="btn btn--ghost" href="super-admin-clienti.html?view=superadmin">Deschide lista de clienți</a><button class="btn btn--primary" type="button" data-dialog-close>Închide</button>'
    });
  }

  function confirmDelete(t) {
    if (!t) return;
    var usedBy = clientsForType(t.id);
    if (usedBy.length) {
      openDialog({
        title: 'Tipul nu poate fi șters', subtitle: t.name,
        bodyHtml: '<div class="ctv2-editor-note ctv2-editor-note--critical"><span class="material-symbols-outlined" aria-hidden="true">block</span><span><b>' + usedBy.length + ' ' + plural(usedBy.length, 'client folosește', 'clienți folosesc') + ' acest tip.</b> Schimbă mai întâi tipul acelor clienți.</span></div>',
        footerHtml: '<span class="modal__footer-helper"></span><button class="btn btn--primary" type="button" data-dialog-close>Am înțeles</button>'
      });
      return;
    }
    openDialog({
      title: 'Ștergi definitiv tipul?', subtitle: t.name, critical: true, submitLabel: 'Șterge definitiv',
      bodyHtml: '<div class="ctv2-editor-note ctv2-editor-note--critical"><span class="material-symbols-outlined" aria-hidden="true">delete_forever</span><span>Vor fi eliminate pachetul de lucru, regulile de arhivare și layout-ul Acasă. Acțiunea nu poate fi anulată.</span></div>',
      onSubmit: function (dialog, close) {
        window.scripticaFlowDelete('clientType', t.id);
        state.selectedId = clientTypes()[0] ? clientTypes()[0].id : '';
        close();
        renderPage();
        toast('success', 'Tipul de client a fost șters.');
      }
    });
  }

  function openDialog(opts) {
    var overlay = document.createElement('div');
    var titleId = 'ctv2-dialog-title-' + (++dialogSeq);
    var previousFocus = document.activeElement;
    var footer = opts.footerHtml || '<span class="modal__footer-helper"></span><button class="btn btn--ghost" type="button" data-dialog-cancel>Anulează</button>' +
      '<button class="btn ' + (opts.critical ? 'btn--critical' : 'btn--primary') + '" type="button" data-dialog-submit>' + esc(opts.submitLabel || 'Salvează') + '</button>';
    overlay.className = 'modal is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.innerHTML = '<div class="modal__dialog' + (opts.wide ? ' modal__dialog--wide' : '') + '" role="document">' +
      '<button class="modal__close" type="button" data-dialog-close aria-label="Închide fereastra"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
      '<header class="modal__header"><h2 class="modal__title" id="' + titleId + '">' + esc(opts.title) + '</h2>' +
        (opts.subtitle ? '<p class="modal__subtitle">' + esc(opts.subtitle) + '</p>' : '') + '</header>' +
      '<form class="modal__body" novalidate>' + opts.bodyHtml + '</form><footer class="modal__footer">' + footer + '</footer></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    var dialog = overlay.querySelector('.modal__dialog');

    function close() {
      overlay.remove();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    }
    function guardedClose() {
      if (opts.isDirty && opts.isDirty(overlay)) {
        openDialog({
          title: 'Renunți la modificările nesalvate?', critical: true, submitLabel: 'Renunță la modificări',
          bodyHtml: '<div class="ctv2-editor-note ctv2-editor-note--critical"><span class="material-symbols-outlined" aria-hidden="true">warning</span><span>Modificările din această fereastră se vor pierde.</span></div>',
          onSubmit: function (confirmDialog, closeConfirm) { closeConfirm(); close(); }
        });
        return;
      }
      close();
    }
    function onKey(e) {
      if (!document.body.contains(overlay)) return;
      var dialogs = document.querySelectorAll('.modal.is-open');
      if (dialogs[dialogs.length - 1] !== overlay) return;
      if (e.key === 'Escape') { e.preventDefault(); guardedClose(); }
      else if (e.key === 'Tab') trapFocus(e, dialog);
    }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-dialog-close]')) guardedClose();
      else if (e.target.closest('[data-dialog-cancel]')) guardedClose();
    });
    var submit = overlay.querySelector('[data-dialog-submit]');
    if (submit) submit.addEventListener('click', function (e) {
      e.preventDefault();
      if (opts.onSubmit) opts.onSubmit(overlay, close);
      else close();
    });
    if (opts.onOpen) opts.onOpen(overlay, close);
    setTimeout(function () {
      var first = dialog.querySelector('.modal__body input:not([disabled]), .modal__body select:not([disabled]), .modal__body textarea:not([disabled]), .modal__body button:not([disabled])') || dialog.querySelector('[data-dialog-submit], [data-dialog-close]');
      if (first) first.focus();
    }, 0);
  }

  function trapFocus(e, container) {
    var focusable = container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function init() {
    root = document.getElementById('ctv2-root');
    if (!root || !SA()) return;
    var requested = new URLSearchParams(window.location.search).get('ct');
    state.selectedId = typeById(requested) ? requested : (clientTypes()[0] ? clientTypes()[0].id : '');
    root.addEventListener('click', handleRootClick);
    root.addEventListener('input', handleRootInput);
    renderPage();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
