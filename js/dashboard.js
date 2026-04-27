/* ============================================================
   Scriptica — Dashboard (Phase 2)
   Renders Acasă regions + Situație Nouă modal + toasts.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;

  var STATUS_LABELS = {
    analiza:              'Analiză',
    asteapta_documente:   'Așteaptă Documente',
    in_verificare:        'În Verificare',
    finalizat:            'Finalizat',
    inchisa:              'Închisă',
    anulata:              'Anulată',
    intarziere:           'În Întârziere'
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK) {
      console.error('[Scriptica] Mock data missing.');
      return;
    }
    if (routeClientHome()) return;
    renderRegionNew();
    renderRegionAlerts();
    renderRegionClients();
    renderMessaging();
    initHeaderWelcome();
    initNotificationBadge();
    initMessagingBadge();
    initModal();
  });

  /* Client-view home routing: 0 → zero-state; 1 → redirect to detail; 2+ → dashboard.
     Only runs on acasa.html — dashboard.js is loaded on other pages too. */
  function routeClientHome() {
    if (typeof getCurrentView !== 'function' || getCurrentView() !== 'client') return false;
    if (!document.querySelector('.dashboard')) return false;
    var visible = (typeof window.getVisibleSituations === 'function') ? window.getVisibleSituations() : MOCK.situations;
    var active = visible.filter(function (s) {
      return s.status !== 'inchisa' && s.status !== 'anulata';
    });
    if (active.length === 0) {
      renderClientZeroState();
      return true;
    }
    if (active.length === 1) {
      window.location.replace('situatie-detaliu.html?id=' + encodeURIComponent(active[0].id) + '&view=client');
      return true;
    }
    return false; // 2+ falls through to normal dashboard render (filtered)
  }

  function renderClientZeroState() {
    var main = document.getElementById('main') || document.querySelector('main');
    if (!main) return;
    main.innerHTML =
      '<div class="client-zero-state">' +
        '<span class="material-symbols-outlined client-zero-state__icon" aria-hidden="true">handshake</span>' +
        '<p class="client-zero-state__heading">Totul e liniștit momentan</p>' +
        '<p class="client-zero-state__subtitle">Anca va începe să lucreze cu tine în curând. Te vom anunța când apare ceva nou.</p>' +
      '</div>';
  }

  /* ---------- Helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
  }

  function formatDateFull(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }

  function addDaysISO(iso, days) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '';
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function todayISO() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function progressClass(done, total) {
    if (!total) return 'is-low';
    var ratio = done / total;
    if (ratio < 0.25)  return 'is-low';
    if (ratio < 0.75)  return 'is-mid';
    return 'is-high';
  }

  /* ---------- Region 1: Situații Noi ---------- */

  function renderRegionNew() {
    var body = document.querySelector('[data-region="situatii-noi"] .region-card__body');
    if (!body) return;
    var newItems = MOCK.situations.filter(function (s) { return s.isNew; });
    newItems = filterForCurrentView(newItems);
    if (!newItems.length) {
      body.innerHTML = emptyState('inbox', 'Nu există situații contabile noi.');
      updateCount('situatii-noi', 0);
      return;
    }
    var html = '<div class="sit-list">';
    newItems.forEach(function (s) {
      var pc = progressClass(s.stepsCompleted, s.totalSteps);
      html += '' +
        '<a class="sit-list__row" href="situatie-detaliu.html?id=' + esc(s.id) + '">' +
          '<div class="sit-list__main">' +
            '<div class="sit-list__client">' + esc(s.clientCompany) + '</div>' +
            '<div class="sit-list__meta">' + esc(s.typeLabel) + '</div>' +
          '</div>' +
          '<span class="pill pill--progress ' + pc + '">' +
            s.stepsCompleted + '/' + s.totalSteps +
          '</span>' +
        '</a>';
    });
    html += '</div>';
    body.innerHTML = html;
    updateCount('situatii-noi', newItems.length);
  }

  function filterForCurrentView(list) {
    if (typeof window.scripticaIsClientView === 'function' && !window.scripticaIsClientView()) return list;
    if (typeof getCurrentView !== 'function' || getCurrentView() !== 'client') return list;
    var canvasId = window.SCRIPTICA_CANVAS_CLIENT_ID || 1;
    return list.filter(function (s) { return s.clientId === canvasId; });
  }

  /* ---------- Region 2: Alerte ---------- */

  function renderRegionAlerts() {
    var body = document.querySelector('[data-region="alerte"] .region-card__body');
    if (!body) return;
    var alerts = MOCK.situations.filter(function (s) { return s.status === 'intarziere'; });
    alerts = filterForCurrentView(alerts);
    if (!alerts.length) {
      body.innerHTML = emptyState('check_circle', 'Nicio alertă activă. Toate situațiile sunt la zi.');
      updateCount('alerte', 0);
      return;
    }
    var html = '<div class="alert-list">';
    alerts.forEach(function (s) {
      var daysLate = Math.abs(s.daysToDeadline);
      html += '' +
        '<div class="alert-item">' +
          '<div class="alert-item__head">' +
            '<span class="alert-item__client">' + esc(s.clientCompany) + '</span>' +
            '<span class="alert-item__divider">|</span>' +
            '<a class="alert-item__type" href="situatie-detaliu.html?id=' + esc(s.id) + '">' + esc(s.typeLabel) + '</a>' +
            '<span class="alert-item__delay">în întârziere (' + daysLate + ' zile)</span>' +
          '</div>' +
          '<div class="alert-item__reason">Motiv: Lipsă Documente</div>' +
          '<div class="alert-item__notice">Ultima notificare automată Data: ' +
            formatDate(s.lastNotification.date) + ' Ora: ' + esc(s.lastNotification.time) +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    body.innerHTML = html;
    updateCount('alerte', alerts.length);
  }

  /* ---------- Region 3: Clienții Mei ---------- */

  function renderRegionClients() {
    var grid = document.getElementById('clients-grid');
    var countEl = document.getElementById('clients-count');
    if (!grid) return;

    var mySituations = MOCK.situations.filter(function (s) {
      return s.titularId === MOCK.currentUser.id &&
             s.status !== 'inchisa' &&
             s.status !== 'anulata';
    });

    var byClient = {};
    mySituations.forEach(function (s) {
      if (!byClient[s.clientId]) byClient[s.clientId] = { client: null, sits: [] };
      byClient[s.clientId].sits.push(s);
    });

    var clientIds = Object.keys(byClient);
    clientIds.forEach(function (cid) {
      var client = MOCK.clients.find(function (c) { return c.id === parseInt(cid, 10); });
      byClient[cid].client = client;
    });

    if (countEl) countEl.textContent = '(' + clientIds.length + ')';

    if (!clientIds.length) {
      grid.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">person_off</span><p>Nu ai clienți asignați momentan.</p></div>';
      return;
    }

    var html = '';
    clientIds.forEach(function (cid) {
      var entry = byClient[cid];
      var c = entry.client;
      if (!c) return;
      html += '<article class="client-card">' +
        '<div class="client-card__name">' + esc(c.companyName) + '</div>' +
        '<div class="client-card__contact">Contact: ' + esc(c.contactName) + '</div>' +
        '<div class="client-card__divider"></div>';

      entry.sits.forEach(function (s) {
        var period = periodFromISO(s.startDate);
        var displayTitle = esc(s.typeName) + ' ' + period;
        var pc = progressClass(s.stepsCompleted, s.totalSteps);
        html += '<a class="client-card__sit" href="situatie-detaliu.html?id=' + esc(s.id) + '">' +
          '<div class="client-card__sit-row">' +
            '<div class="client-card__sit-main">' +
              '<span class="client-card__sit-type">' + displayTitle + '</span>' +
              '<div class="client-card__sit-status">' +
                '<span class="status-dot status-dot--' + esc(s.status) + '"></span>' +
                'Status: ' + esc(STATUS_LABELS[s.status] || s.status) +
              '</div>' +
            '</div>' +
            '<span class="pill pill--progress ' + pc + '">' + s.stepsCompleted + '/' + s.totalSteps + '</span>' +
          '</div>' +
          '<div class="client-card__sit-notice">Notificare: Data: ' +
            formatDate(s.lastNotification.date) + ' Ora: ' + esc(s.lastNotification.time) +
          '</div>' +
        '</a>';
      });
      html += '</article>';
    });
    grid.innerHTML = html;
  }

  function periodFromISO(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return '';
    return parts[1] + '.' + parts[0].slice(2);
  }

  /* ---------- Region 4: Messaging ---------- */

  function renderMessaging() {
    var list = document.getElementById('messaging-list');
    if (!list) return;
    var msgs = (typeof window.getVisibleMessages === 'function') ? window.getVisibleMessages() : MOCK.messages;
    if (!msgs.length) {
      list.innerHTML = '<div class="empty-state"><span class="material-symbols-outlined">inbox</span><p>Nu ai mesaje noi.</p></div>';
      return;
    }

    var html = '';
    msgs.forEach(function (m) {
      var sitLabel = '';
      var sit = MOCK.situations.find(function (s) { return s.id === m.situationId; });
      if (sit) sitLabel = sit.typeLabel + '_' + sit.clientCompany;

      var attachHtml = '';
      if (m.attachments && m.attachments.length) {
        m.attachments.forEach(function (a) {
          attachHtml += '<div class="message-card__attach">' +
            'A atașat ' + a.count +
            ' <span class="material-symbols-outlined" aria-hidden="true">attach_file</span> ' +
            esc(a.label) +
            '</div>';
        });
      }

      var chipsHtml = '';
      if (m.chips && m.chips.length) {
        chipsHtml = '<div class="message-card__chips">';
        m.chips.forEach(function (c) {
          chipsHtml += '<span class="pill pill--neutral">' + esc(c.label) + '</span>';
        });
        chipsHtml += '</div>';
      }

      var aiHtml = '';
      if (m.sender === 'ai') {
        aiHtml = '<div class="message-card__ai-meta">' +
          '<span class="ai-label">Mesaj Automat Scriptica A.I.</span>' +
          '<span class="ai-channels">' +
            '<span class="channel-icon channel-icon--whatsapp" title="Trimis pe WhatsApp">' +
              '<span class="material-symbols-outlined" aria-hidden="true">chat</span>' +
            '</span>' +
            '<span class="channel-icon channel-icon--email" title="Trimis pe Email">' +
              '<span class="material-symbols-outlined" aria-hidden="true">mail</span>' +
            '</span>' +
          '</span>' +
        '</div>';
      }

      var contactHtml = (m.sender === 'client')
        ? '<div class="message-card__contact">Contact: ' + esc(m.clientContact) + '</div>'
        : '';

      html += '<article class="message-card">' +
        '<div class="message-card__header">' +
          '<div class="message-card__sender">' + esc(m.sender === 'ai' ? m.senderName : m.clientCompany) + '</div>' +
          '<div class="message-card__date">' + formatDateFull(m.date) + '</div>' +
        '</div>' +
        contactHtml +
        '<div class="message-card__body">' + esc(m.body) + '</div>' +
        attachHtml +
        chipsHtml +
        aiHtml +
        (sitLabel ? '<a class="message-link" href="situatie-detaliu.html?id=' + esc(m.situationId) + '">Mergi la ' + esc(sitLabel) + '</a>' : '') +
      '</article>';
    });
    html += '<a class="messaging__see-all" href="situatii.html">Vezi toate...</a>';
    list.innerHTML = html;
  }

  /* ---------- Helpers: empty state + count chip ---------- */

  function emptyState(icon, msg) {
    return '<div class="empty-state">' +
      '<span class="material-symbols-outlined" aria-hidden="true">' + esc(icon) + '</span>' +
      '<p>' + esc(msg) + '</p>' +
    '</div>';
  }

  function updateCount(region, n) {
    var el = document.querySelector('[data-region="' + region + '"] .pill--count');
    if (el) el.textContent = '(' + n + ')';
  }

  function initHeaderWelcome() {
    var el = document.querySelector('[data-welcome-name]');
    if (el) el.textContent = MOCK.currentUser.name;
  }

  function initNotificationBadge() {
    var sits = (typeof window.getVisibleSituations === 'function') ? window.getVisibleSituations() : MOCK.situations;
    var msgs = (typeof window.getVisibleMessages === 'function') ? window.getVisibleMessages() : MOCK.messages;
    var overdue = sits.filter(function (s) { return s.status === 'intarziere'; }).length;
    var unreadMsgs = msgs.filter(function (m) { return !m.read; }).length;
    var badge = document.querySelector('.header__notification .header__badge');
    if (badge) badge.textContent = String(overdue + unreadMsgs);
  }

  function initMessagingBadge() {
    var el = document.querySelector('[data-messaging-count]');
    if (!el) return;
    var msgs = (typeof window.getVisibleMessages === 'function') ? window.getVisibleMessages() : MOCK.messages;
    var unread = msgs.filter(function (m) { return !m.read; }).length;
    el.textContent = '(' + unread + ')';
  }

  /* =============================================================
     MODAL — Situație Nouă
     ============================================================= */

  function initModal() {
    var openBtn = document.getElementById('open-new-situation');
    var modal = document.getElementById('modal-new-situation');
    if (!openBtn || !modal) return;

    var dialog = modal.querySelector('.modal__dialog');
    var closeBtn = modal.querySelector('[data-modal-close]');
    var cancelBtn = modal.querySelector('[data-modal-cancel]');
    var submitBtn = modal.querySelector('[data-modal-submit]');

    var typeSelect = modal.querySelector('[name="tip"]');
    var respSelect = modal.querySelector('[name="responsabil"]');
    var dateInput  = modal.querySelector('[name="dataInceput"]');
    var comboInput = modal.querySelector('.combo__input');
    var comboList  = modal.querySelector('.combo__list');
    var comboHidden = modal.querySelector('[name="clientId"]');

    var deadlineRow1 = modal.querySelector('[data-deadline="1"]');
    var deadlineRow2 = modal.querySelector('[data-deadline="2"]');
    var deadlineRow3 = modal.querySelector('[data-deadline="3"]');

    var lastTrigger = null;

    /* Populate selects */
    typeSelect.innerHTML =
      '<option value="">Selectează tipul...</option>' +
      MOCK.situationTypes.map(function (t) {
        return '<option value="' + esc(t.id) + '">' + esc(t.name) + '</option>';
      }).join('');

    respSelect.innerHTML = MOCK.employees.map(function (e) {
      var sel = (e.id === MOCK.currentUser.id) ? ' selected' : '';
      return '<option value="' + e.id + '"' + sel + '>' + esc(e.name) + '</option>';
    }).join('');

    dateInput.value = todayISO();
    dateInput.min = todayISO();

    /* Open / close */
    openBtn.addEventListener('click', function () {
      lastTrigger = openBtn;
      openModal();
    });
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'Tab') {
        trapFocus(e, dialog);
      }
    });

    function openModal() {
      resetForm();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { typeSelect.focus(); }, 0);
      recomputeDeadlines();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus();
    }

    /* Combobox */
    var activeIdx = -1;
    var filteredClients = MOCK.clients.slice();

    function renderComboList(items) {
      if (!items.length) {
        comboList.innerHTML = '<div class="combo__empty">Niciun client găsit.</div>';
        return;
      }
      comboList.innerHTML = items.map(function (c, i) {
        return '<div class="combo__option' + (i === activeIdx ? ' is-active' : '') + '" data-id="' + c.id + '" role="option">' +
          '<div class="combo__option-title">' + esc(c.companyName) + '</div>' +
          '<div class="combo__option-meta">' + esc(c.contactName) + '</div>' +
        '</div>';
      }).join('');
      comboList.querySelectorAll('.combo__option').forEach(function (opt) {
        opt.addEventListener('mousedown', function (e) {
          e.preventDefault();
          selectClient(parseInt(opt.getAttribute('data-id'), 10));
        });
      });
    }

    function selectClient(id) {
      var c = MOCK.clients.find(function (x) { return x.id === id; });
      if (!c) return;
      comboInput.value = c.companyName;
      comboHidden.value = c.id;
      closeCombo();
    }

    function openCombo() {
      activeIdx = -1;
      filteredClients = filterClients(comboInput.value);
      renderComboList(filteredClients);
      comboList.classList.add('is-open');
    }

    function closeCombo() {
      comboList.classList.remove('is-open');
    }

    function filterClients(q) {
      q = (q || '').toLowerCase().trim();
      if (!q) return MOCK.clients.slice();
      return MOCK.clients.filter(function (c) {
        return c.companyName.toLowerCase().indexOf(q) !== -1;
      });
    }

    comboInput.addEventListener('focus', openCombo);
    comboInput.addEventListener('input', function () {
      comboHidden.value = '';
      activeIdx = -1;
      filteredClients = filterClients(comboInput.value);
      renderComboList(filteredClients);
      comboList.classList.add('is-open');
    });
    comboInput.addEventListener('keydown', function (e) {
      if (!comboList.classList.contains('is-open')) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') openCombo();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(filteredClients.length - 1, activeIdx + 1);
        renderComboList(filteredClients);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(0, activeIdx - 1);
        renderComboList(filteredClients);
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && filteredClients[activeIdx]) {
          e.preventDefault();
          selectClient(filteredClients[activeIdx].id);
        }
      } else if (e.key === 'Escape') {
        closeCombo();
      }
    });
    document.addEventListener('mousedown', function (e) {
      if (!modal.classList.contains('is-open')) return;
      if (!e.target.closest('.combo')) closeCombo();
    });

    /* Live deadlines */
    typeSelect.addEventListener('change', recomputeDeadlines);
    dateInput.addEventListener('change', recomputeDeadlines);
    dateInput.addEventListener('input', recomputeDeadlines);

    function recomputeDeadlines() {
      var t = MOCK.situationTypes.find(function (x) { return x.id === typeSelect.value; });
      var start = dateInput.value;
      if (!t || !start) {
        deadlineRow1.textContent = '—';
        deadlineRow2.textContent = '—';
        deadlineRow3.textContent = '—';
        return;
      }
      deadlineRow1.textContent = formatDateFull(addDaysISO(start, t.offsets.step1));
      deadlineRow2.textContent = formatDateFull(addDaysISO(start, t.offsets.step2));
      deadlineRow3.textContent = formatDateFull(addDaysISO(start, t.offsets.step3));
    }

    /* Submit */
    submitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!validate()) return;
      closeModal();
      showToast('success', 'Situația contabilă a fost creată cu succes.');
    });

    function validate() {
      var ok = true;
      // Type
      setError('tip', !typeSelect.value, 'Selectează tipul situației.');
      if (!typeSelect.value) ok = false;

      // Client
      var validClient = comboHidden.value && MOCK.clients.some(function (c) {
        return c.id === parseInt(comboHidden.value, 10) && c.companyName === comboInput.value;
      });
      setError('client', !validClient, 'Selectează un client din listă.');
      if (!validClient) ok = false;

      // Responsible
      setError('responsabil', !respSelect.value, 'Selectează un responsabil.');
      if (!respSelect.value) ok = false;

      // Date
      var invalidDate = !dateInput.value || dateInput.value < todayISO();
      setError('dataInceput', invalidDate, 'Alege o dată validă (azi sau ulterioară).');
      if (invalidDate) ok = false;

      // Notifications
      var anyChecked = modal.querySelectorAll('input[name="notif"]:checked').length > 0;
      setError('notif', !anyChecked, 'Alege cel puțin o notificare automată.');
      if (!anyChecked) ok = false;

      return ok;
    }

    function setError(name, hasError, msg) {
      var field = modal.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      field.classList.toggle('has-error', hasError);
      var errorEl = field.querySelector('.form-error');
      if (errorEl && msg) errorEl.textContent = msg;
    }

    function resetForm() {
      typeSelect.value = '';
      comboInput.value = '';
      comboHidden.value = '';
      respSelect.value = String(MOCK.currentUser.id);
      dateInput.value = todayISO();
      modal.querySelectorAll('input[name="notif"]').forEach(function (cb) { cb.checked = true; });
      modal.querySelectorAll('.form-field').forEach(function (f) { f.classList.remove('has-error'); });
      closeCombo();
    }
  }

  /* ---------- Focus trap helper ---------- */

  function trapFocus(e, container) {
    var focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* =============================================================
     TOAST
     ============================================================= */

  function showToast(variant, message) {
    var stack = document.getElementById('toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toast-stack';
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + variant;
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<span class="material-symbols-outlined toast__icon filled" aria-hidden="true">' + (icons[variant] || 'info') + '</span>' +
      '<span class="toast__msg">' + esc(message) + '</span>';
    stack.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('is-leaving');
      setTimeout(function () { toast.remove(); }, 250);
    }, 4000);
  }

  window.SCRIPTICA_TOAST = showToast;

})();
