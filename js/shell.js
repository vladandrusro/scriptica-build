/* ============================================================
   Scriptica — Shell behaviour (Phase 1 + Phase 7 client view)
   Burger toggle (persisted) + active rail detection.
   View flag, avatar dropdown menu, client/accountant toggle.
   No framework, no build step.
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'scriptica.sidebarExpanded';
  var MSG_COLLAPSED_KEY = 'scriptica.messagingPanelCollapsed';
  var VIEW_KEY = 'scriptica.view';

  /* --- View flag (personas pe arie de acces) ---
     Personas: complet · contabilitate · audit_stat · client · admin ·
     autoritate · superadmin. 'accountant' = alias legacy = acces complet. */
  var VALID_VIEWS = ['accountant', 'complet', 'contabilitate', 'audit_stat', 'client', 'admin', 'autoritate', 'superadmin'];
  window.getCurrentView = function () {
    var params = new URLSearchParams(window.location.search);
    var p = params.get('view');
    if (p && VALID_VIEWS.indexOf(p) !== -1) return p === 'accountant' ? 'complet' : p;
    try {
      var stored = localStorage.getItem(VIEW_KEY);
      return stored === 'accountant' ? 'complet' : (stored || 'complet'); /* migrare alias legacy */
    } catch (e) { return 'complet'; }
  };
  window.setCurrentView = function (view) {
    try { localStorage.setItem(VIEW_KEY, view); } catch (e) {}
  };

  /* Scope de domenii vizibile pentru persona curentă. Un singur sistem de
     domeniu (contabil/audit), reutilizat din designul de formule/categorii. */
  window.getViewScope = function () {
    var v = getCurrentView();
    var scope;
    if (v === 'contabilitate') scope = ['contabil'];
    else if (v === 'audit_stat' || v === 'autoritate') scope = ['audit'];
    else if (v === 'client') scope = ['contabil'];
    /* complet, accountant, admin, superadmin: toate domeniile, inclusiv
       verticalele custom din registrul de fluxuri (definite de HQ). */
    else scope = ['contabil', 'audit'];
    if (typeof window.scripticaCustomVerticals === 'function') {
      window.scripticaCustomVerticals().forEach(function (cv) {
        if (scope.indexOf(cv.domain) === -1) scope.push(cv.domain);
      });
    }
    /* Persona spune ce are voie rolul să vadă; modulele active spun ce a
       contractat contul curent. Intersecția celor două evită ca o verticală
       dezactivată să rămână accesibilă prin URL sau navigație. */
    if (v !== 'superadmin' && typeof window.scripticaTenantActiveVerticalIds === 'function' &&
        typeof window.scripticaVerticalById === 'function') {
      var moduleDomains = window.scripticaTenantActiveVerticalIds().map(function (verticalId) {
        var vertical = window.scripticaVerticalById(verticalId);
        return vertical ? vertical.domain : null;
      }).filter(Boolean);
      scope = scope.filter(function (domain) { return moduleDomains.indexOf(domain) !== -1; });
    }
    return scope;
  };
  window.viewInScope = function (domain) {
    if (!domain) return true;
    return getViewScope().indexOf(domain) !== -1;
  };

  /* --- Shared avatar helpers (used by header dropdown + anywhere else) --- */
  window.scripticaInitials = function (full) {
    var s = String(full || '').trim();
    if (!s) return '?';
    var parts = s.split(/\s+/);
    var first = parts[0].charAt(0) || '';
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  };

  var AVATAR_COLORS = ['#47386A', '#5B4D7A', '#6E5D8F', '#8673A5', '#A3A0C7', '#38BA31'];
  window.scripticaAvatarColor = function (id) {
    var n = (id == null ? 0 : Number(id));
    if (isNaN(n)) n = 0;
    return AVATAR_COLORS[Math.abs(n) % AVATAR_COLORS.length];
  };

  window.renderAvatar = function (user, size) {
    if (!user) return '';
    var sz = size || 36;
    var name = user.fullName || user.name || user.contactName || '';
    var bg = scripticaAvatarColor(user.id);
    var inits = scripticaInitials(name);
    if (user.avatarId) {
      var url = 'https://i.pravatar.cc/' + (sz * 2) + '?img=' + user.avatarId;
      return '<img class="scriptica-avatar" src="' + url + '" alt="' +
        escapeAttr(name) + '" ' +
        'style="width:100%;height:100%;object-fit:cover;display:block;" ' +
        'data-avatar-bg="' + escapeAttr(bg) + '" data-avatar-initials="' + escapeAttr(inits) + '" ' +
        'onerror="this.outerHTML=\'<span class=&quot;scriptica-avatar-fallback&quot; style=&quot;background:' +
        escapeAttr(bg) + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:' +
        Math.round(sz * 0.4) + 'px;&quot;>' + escapeAttr(inits) + '&quot;>' + escapeAttr(inits) + '</span>\';">';
    }
    return '<span class="scriptica-avatar-fallback" style="background:' + bg +
      ';color:#fff;display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:700;font-size:' +
      Math.round(sz * 0.4) + 'px;">' + inits + '</span>';
  };

  function escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* --- Resolve the user for the current view --- */
  window.scripticaCurrentUser = function () {
    var MOCK = window.SCRIPTICA_MOCK;
    if (!MOCK) return null;
    if (getCurrentView() === 'superadmin') {
      return (MOCK.superAdmin && MOCK.superAdmin.hq) || { id: 9001, name: 'Scriptica HQ', role: 'Super Admin' };
    }
    if (getCurrentView() === 'autoritate') {
      var auths = MOCK.auditAuthorities || [];
      if (auths.length) return auths[0];
    }
    if (getCurrentView() === 'admin') {
      var admins = MOCK.admins || [];
      if (admins.length) return admins[0];
    }
    if (getCurrentView() === 'client') {
      var clients = MOCK.clients || [];
      var cid = MOCK.currentClientId || (clients[0] && clients[0].id);
      return clients.find(function (c) { return c.id === cid; }) || null;
    }
    var uid = MOCK.currentUserId;
    var emp = (MOCK.employees || []).find(function (e) { return e.id === uid; });
    return emp || MOCK.currentUser || null;
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyViewBodyClass();
    initSidebar();
    injectAuditNav();
    injectPlanificareNav();
    injectCustomVerticalNav();
    injectAdminNav();
    gateNavByScope();
    initActiveNav();
    initMessagingToggle();
    buildUserMenu();
    initNonFunctionalStubs();
  });

  /* „Misiuni Audit" — item de navigație injectat dinamic lângă „Situații
     Contabile", ca paginile existente să nu necesite fiecare o editare de
     sidebar (același pattern ca injectAdminNav). Ascuns în vederea client. */
  function injectAuditNav() {
    /* Doar personas cu „audit" în scope (exclude contabilitate/client);
       superadmin are propriul sidebar. */
    if (!viewInScope('audit') || getCurrentView() === 'superadmin') return;
    var nav = document.querySelector('.sidebar__nav');
    if (!nav || nav.querySelector('[data-nav="misiuni-audit"]')) return;
    var a = document.createElement('a');
    a.className = 'nav-item';
    a.href = 'misiuni-audit.html';
    a.setAttribute('data-nav', 'misiuni-audit');
    a.setAttribute('data-domain', 'audit');
    a.innerHTML =
      '<span class="material-symbols-outlined nav-item__icon" aria-hidden="true">verified_user</span>' +
      '<span class="nav-item__label">Misiuni Audit</span>';
    var anchor = nav.querySelector('[href="situatii.html"]');
    if (anchor && anchor.nextSibling) nav.insertBefore(a, anchor.nextSibling);
    else if (anchor) nav.appendChild(a);
    else nav.appendChild(a);
  }

  /* „Planificare Audit" — planificarea multianuală/anuală. Vizibilă doar
     pentru admin local + autoritate decidentă (read-only la aceasta din urmă).
     Injectat lângă „Misiuni Audit". */
  function injectPlanificareNav() {
    var view = getCurrentView();
    if (view !== 'admin' && view !== 'autoritate') return;
    var nav = document.querySelector('.sidebar__nav');
    if (!nav || nav.querySelector('[data-nav="planificare-audit"]')) return;
    var a = document.createElement('a');
    a.className = 'nav-item';
    a.href = 'planificare-audit.html' + (view === 'autoritate' ? '?view=autoritate' : '?view=admin');
    a.setAttribute('data-nav', 'planificare-audit');
    a.setAttribute('data-domain', 'audit');
    a.innerHTML =
      '<span class="material-symbols-outlined nav-item__icon" aria-hidden="true">event_note</span>' +
      '<span class="nav-item__label">Planificare Audit</span>';
    var anchor = nav.querySelector('[data-nav="misiuni-audit"]');
    if (anchor && anchor.nextSibling) nav.insertBefore(a, anchor.nextSibling);
    else nav.appendChild(a);
  }

  /* Verticalele custom din registrul de fluxuri (definite de Super Admin) —
     un item de nav per modul activ, servit de motorul generic flux.html.
     Rolul limitează domeniul, iar contul tenant limitează verticala exactă. */
  function injectCustomVerticalNav() {
    var view = getCurrentView();
    if (view === 'superadmin' || view === 'client') return;
    if (typeof window.scripticaCustomVerticals !== 'function') return;
    var nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    var anchor = nav.querySelector('[data-nav="misiuni-audit"]') || nav.querySelector('[href="situatii.html"]');
    var activeVerticalIds = typeof window.scripticaTenantActiveVerticalIds === 'function'
      ? window.scripticaTenantActiveVerticalIds() : null;
    window.scripticaCustomVerticals().forEach(function (v) {
      if (activeVerticalIds && activeVerticalIds.indexOf(v.id) === -1) return;
      if (nav.querySelector('[data-nav="flux-' + v.id + '"]')) return;
      var a = document.createElement('a');
      a.className = 'nav-item';
      a.href = 'flux.html?vertical=' + encodeURIComponent(v.id);
      a.setAttribute('data-nav', 'flux-' + v.id);
      a.setAttribute('data-domain', v.domain);
      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined nav-item__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = v.icon || 'account_tree';
      var label = document.createElement('span');
      label.className = 'nav-item__label';
      label.textContent = v.name;
      a.appendChild(icon);
      a.appendChild(label);
      if (anchor && anchor.nextSibling) nav.insertBefore(a, anchor.nextSibling);
      else nav.appendChild(a);
      anchor = a;
    });
  }

  /* Admin view gets an extra rail item (Phase 9). Injected dynamically so
     existing pages don't each need a sidebar edit. */
  function injectAdminNav() {
    /* Administrare: persona „admin" + „complet" (acces complet). */
    if (getCurrentView() !== 'admin' && getCurrentView() !== 'complet') return;
    var nav = document.querySelector('.sidebar__nav');
    if (!nav || nav.querySelector('[data-nav="administrare"]')) return;
    var a = document.createElement('a');
    a.className = 'nav-item';
    a.href = 'administrare.html';
    a.setAttribute('data-nav', 'administrare');
    a.innerHTML =
      '<span class="material-symbols-outlined nav-item__icon" aria-hidden="true">admin_panel_settings</span>' +
      '<span class="nav-item__label">Administrare</span>';
    nav.appendChild(a);
  }

  /* Gating de navigație pe arie de acces — ascunde itemii de domeniu care nu
     sunt în scope-ul persoanei (ex. „Situații Contabile" la audit-stat,
     „Misiuni Audit" la contabilitate). Itemii fără domeniu rămân vizibili. */
  function gateNavByScope() {
    var nav = document.querySelector('.sidebar__nav');
    if (!nav) return;
    var sit = nav.querySelector('[href="situatii.html"]');
    if (sit && !sit.getAttribute('data-domain')) sit.setAttribute('data-domain', 'contabil');
    nav.querySelectorAll('.nav-item[data-domain]').forEach(function (it) {
      var dom = it.getAttribute('data-domain');
      it.style.display = viewInScope(dom) ? '' : 'none';
    });
  }

  function applyViewBodyClass() {
    var view = getCurrentView();
    document.body.classList.toggle('body--client', view === 'client');
    document.body.classList.toggle('body--admin', view === 'admin');
    document.body.classList.toggle('body--autoritate', view === 'autoritate');
    document.body.classList.toggle('body--superadmin', view === 'superadmin');
    document.body.classList.toggle('body--complet', view === 'complet');
    document.body.classList.toggle('body--contabilitate', view === 'contabilitate');
    document.body.classList.toggle('body--audit-stat', view === 'audit_stat');
  }

  /* --- Sidebar expand/collapse --- */
  function initSidebar() {
    var sidebar = document.querySelector('.sidebar');
    var shell = document.querySelector('.shell');
    var burger = document.querySelector('.sidebar__burger');
    if (!sidebar || !shell || !burger) return;

    var expanded = false;
    try {
      expanded = localStorage.getItem(STORAGE_KEY) === 'true';
    } catch (e) {
      expanded = false;
    }
    applySidebarState(sidebar, shell, expanded);

    burger.addEventListener('click', function () {
      expanded = !sidebar.classList.contains('sidebar--expanded');
      applySidebarState(sidebar, shell, expanded);
      try {
        localStorage.setItem(STORAGE_KEY, expanded ? 'true' : 'false');
      } catch (e) { /* ignore */ }
    });
  }

  function applySidebarState(sidebar, shell, expanded) {
    sidebar.classList.toggle('sidebar--expanded', expanded);
    shell.classList.toggle('shell--sidebar-expanded', expanded);
  }

  /* --- Active rail item detection + data-nav tagging for CSS-based hiding --- */
  function initActiveNav() {
    var items = document.querySelectorAll('.sidebar__nav .nav-item');
    if (!items.length) return;

    var pathname = window.location.pathname;
    var filename = pathname.split('/').pop() || 'index.html';
    if (filename === '' || filename === 'index.html') filename = 'acasa.html';

    items.forEach(function (item) {
      var href = item.getAttribute('href') || '';
      var hrefFile = href.split('/').pop();
      var slug = (hrefFile || '').replace(/\.html$/, '');
      if (slug && !item.getAttribute('data-nav')) item.setAttribute('data-nav', slug);
      if (hrefFile && hrefFile === filename) {
        item.classList.add('nav-item--active');
        var icon = item.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.add('filled');
      } else {
        item.classList.remove('nav-item--active');
        var icon2 = item.querySelector('.material-symbols-outlined');
        if (icon2) icon2.classList.remove('filled');
      }
    });
  }

  /* --- Messaging panel collapse (chevron, persisted) --- */
  function initMessagingToggle() {
    var panel = document.querySelector('.messaging');
    var toggle = document.querySelector('.messaging__toggle');
    if (!panel || !toggle) return;

    var collapsed = false;
    try { collapsed = localStorage.getItem(MSG_COLLAPSED_KEY) === 'true'; } catch (e) {}
    applyMessagingState(panel, toggle, collapsed);

    toggle.addEventListener('click', function () {
      collapsed = !panel.classList.contains('is-collapsed');
      applyMessagingState(panel, toggle, collapsed);
      try { localStorage.setItem(MSG_COLLAPSED_KEY, collapsed ? 'true' : 'false'); } catch (e) {}
    });
  }

  function applyMessagingState(panel, toggle, collapsed) {
    panel.classList.toggle('is-collapsed', collapsed);
    var icon = toggle.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = collapsed ? 'expand_more' : 'expand_less';
    toggle.setAttribute('aria-label', collapsed ? 'Extinde panoul de mesagerie' : 'Restrânge panoul de mesagerie');
  }

  /* --- Non-functional stubs — log clicks for Phase 1 --- */
  function initNonFunctionalStubs() {
    var logTargets = [
      { sel: '.header__search-input', name: 'search' },
      { sel: '.header__lang', name: 'language selector' },
      { sel: '.header__notification', name: 'notifications' }
    ];
    logTargets.forEach(function (t) {
      var el = document.querySelector(t.sel);
      if (!el) return;
      el.addEventListener('click', function () {
        console.log('[Scriptica] ' + t.name + ' clicked — not wired up in Phase 1.');
      });
    });
  }

  /* --- Header avatar dropdown menu (Phase 7) ---
     Replaces the legacy `.header__welcome` + `.header__user` button combo
     with a clickable trigger + dropdown on every page. */
  function buildUserMenu() {
    var welcome = document.querySelector('.header__welcome');
    var legacyBtn = document.querySelector('.header__icon-btn.header__user');
    if (!welcome && !legacyBtn) return;

    // Build the wrapper + trigger + menu DOM
    var wrapper = document.createElement('div');
    wrapper.className = 'header__user';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'header__user-trigger';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML =
      '<span class="header__user-greeting">Bună, <b data-user-name>—</b></span>' +
      '<span class="header__user-avatar" data-user-avatar></span>';

    var menu = document.createElement('div');
    menu.className = 'header__user-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    menu.innerHTML =
      '<div class="header__user-menu-header">' +
        '<div class="header__user-menu-avatar" data-user-avatar-lg></div>' +
        '<div class="header__user-menu-info">' +
          '<div class="header__user-menu-name" data-user-name></div>' +
          '<div class="header__user-menu-role" data-user-role></div>' +
        '</div>' +
      '</div>' +
      viewSwitchItemsHtml() +
      '<a href="prezentare.html" class="header__user-menu-item header__user-menu-item--primary" role="menuitem">' +
        '<span class="material-symbols-outlined" aria-hidden="true">slideshow</span>' +
        'Vezi prezentarea' +
      '</a>' +
      '<div class="header__user-menu-divider"></div>' +
      '<button type="button" class="header__user-menu-item" disabled title="Funcție disponibilă în versiunea finală">' +
        '<span class="material-symbols-outlined" aria-hidden="true">settings</span>' +
        'Setări' +
      '</button>' +
      '<button type="button" class="header__user-menu-item" disabled title="Funcție disponibilă în versiunea finală">' +
        '<span class="material-symbols-outlined" aria-hidden="true">logout</span>' +
        'Deconectare' +
      '</button>';

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    // Insert wrapper where the old greeting/user button was
    var anchor = welcome || legacyBtn;
    anchor.parentNode.insertBefore(wrapper, anchor);
    if (welcome) welcome.remove();
    if (legacyBtn) legacyBtn.remove();

    updateUserDisplay();

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      menu.hidden = expanded;
    });

    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target) && !trigger.contains(e.target)) {
        trigger.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
    });

    menu.querySelectorAll('[data-view-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setCurrentView(btn.getAttribute('data-view-target'));
        window.location.href = btn.getAttribute('data-view-href');
      });
    });
  }

  /* The two views OTHER than the current one, as menu items (Phase 9: 3-way). */
  function viewSwitchItemsHtml() {
    var cur = getCurrentView();
    if (cur === 'accountant') cur = 'complet'; /* legacy alias */
    var items = [
      { view: 'complet',       label: 'Vezi ca utilizator complet',     href: 'acasa.html?view=complet' },
      { view: 'contabilitate', label: 'Vezi ca și contabilitate',       href: 'acasa.html?view=contabilitate' },
      { view: 'audit_stat',    label: 'Vezi ca audit (stat)',           href: 'misiuni-audit.html?view=audit_stat' },
      { view: 'client',        label: 'Vezi ca și client',              href: 'acasa.html?view=client' },
      { view: 'admin',         label: 'Vezi ca administrator',          href: 'administrare.html?view=admin' },
      { view: 'autoritate',    label: 'Vezi ca autoritate decidentă',   href: 'misiuni-audit.html?view=autoritate' },
      { view: 'superadmin',    label: 'Vezi ca Super Admin',            href: 'super-admin.html?view=superadmin' }
    ].filter(function (it) { return it.view !== cur; });
    return items.map(function (it) {
      return '<button type="button" class="header__user-menu-item header__user-menu-item--primary" data-view-target="' + it.view + '" data-view-href="' + it.href + '">' +
        '<span class="material-symbols-outlined" aria-hidden="true">swap_horiz</span>' +
        '<span>' + it.label + '</span>' +
      '</button>';
    }).join('');
  }

  function updateUserDisplay() {
    var user = scripticaCurrentUser();
    if (!user) return;
    var view = getCurrentView();
    var isClient = view === 'client';
    var fullName = user.fullName || user.name || user.contactName || '';
    var firstName = fullName.split(/\s+/)[0] || fullName;
    var role;
    if (isClient) {
      role = 'Client · ' + (user.companyName || '');
    } else if (view === 'autoritate') {
      role = (user.role || 'Autoritate decidentă') + ' · ' + (user.seniority || 'Scriptica');
    } else if (view === 'superadmin') {
      role = (user.role || 'Super Admin') + ' · Scriptica HQ';
    } else if (view === 'complet') {
      role = 'Acces complet · Scriptica';
    } else if (view === 'contabilitate') {
      role = 'Contabilitate · Scriptica';
    } else if (view === 'audit_stat') {
      role = 'Audit (stat) · Scriptica';
    } else {
      role = (user.role || 'Contabil') + ' · Scriptica';
    }

    document.querySelectorAll('[data-user-name]').forEach(function (el) {
      if (el.tagName === 'B') el.textContent = firstName;
      else el.textContent = fullName;
    });
    document.querySelectorAll('[data-user-role]').forEach(function (el) {
      el.textContent = role;
    });

    var normalUser = { id: user.id, name: fullName, fullName: fullName, avatarId: user.avatarId };
    var smallAvatar = document.querySelector('[data-user-avatar]');
    if (smallAvatar) smallAvatar.innerHTML = renderAvatar(normalUser, 36);
    var largeAvatar = document.querySelector('[data-user-avatar-lg]');
    if (largeAvatar) largeAvatar.innerHTML = renderAvatar(normalUser, 48);
  }

})();
