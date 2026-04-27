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

  /* --- View flag (Phase 7) --- */
  window.getCurrentView = function () {
    var params = new URLSearchParams(window.location.search);
    var p = params.get('view');
    if (p === 'client') return 'client';
    if (p === 'accountant') return 'accountant';
    try { return localStorage.getItem(VIEW_KEY) || 'accountant'; }
    catch (e) { return 'accountant'; }
  };
  window.setCurrentView = function (view) {
    try { localStorage.setItem(VIEW_KEY, view); } catch (e) {}
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
    initActiveNav();
    initMessagingToggle();
    buildUserMenu();
    initNonFunctionalStubs();
  });

  function applyViewBodyClass() {
    if (getCurrentView() === 'client') document.body.classList.add('body--client');
    else document.body.classList.remove('body--client');
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
      '<button type="button" class="header__user-menu-item header__user-menu-item--primary" data-action="toggle-view">' +
        '<span class="material-symbols-outlined" aria-hidden="true">swap_horiz</span>' +
        '<span data-view-toggle-label>Vezi ca și client</span>' +
      '</button>' +
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
    refreshToggleLabel();

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

    var toggleBtn = menu.querySelector('[data-action="toggle-view"]');
    toggleBtn.addEventListener('click', function () {
      var next = getCurrentView() === 'client' ? 'accountant' : 'client';
      setCurrentView(next);
      window.location.href = next === 'client' ? 'acasa.html?view=client' : 'acasa.html';
    });
  }

  function updateUserDisplay() {
    var user = scripticaCurrentUser();
    if (!user) return;
    var isClient = getCurrentView() === 'client';
    var fullName = user.fullName || user.name || user.contactName || '';
    var firstName = fullName.split(/\s+/)[0] || fullName;
    var role = isClient
      ? ('Client · ' + (user.companyName || ''))
      : ((user.role || 'Contabil') + ' · Scriptica');

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

  function refreshToggleLabel() {
    var el = document.querySelector('[data-view-toggle-label]');
    if (!el) return;
    el.textContent = getCurrentView() === 'client' ? 'Vezi ca și contabil' : 'Vezi ca și client';
  }
})();
