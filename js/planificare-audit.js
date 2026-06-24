/* ============================================================
   Scriptica — Planificare Audit (Brief #7)
   Plan multianual + plan anual. Admin local gestionează; autoritatea
   decidentă vede read-only. „Demarează misiunea" reutilizează modalul
   de creare din lista de misiuni (#3) prin ?demareaza=<entryId>.
   ============================================================ */

(function () {
  'use strict';

  var MOCK = window.SCRIPTICA_MOCK;

  document.addEventListener('DOMContentLoaded', function () {
    if (!MOCK || document.body.getAttribute('data-page') !== 'planificare-audit') return;
    render();
    initEditModal();
  });

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function isAuthority() { return typeof window.getCurrentView === 'function' && window.getCurrentView() === 'autoritate'; }
  function employeeById(id) { return (MOCK.employees || []).find(function (e) { return e.id === id; }) || null; }
  function entityById(id) { return (MOCK.auditEntities || []).find(function (e) { return e.id === id; }) || null; }
  function toast(v, m) { if (typeof window.SCRIPTICA_TOAST === 'function') window.SCRIPTICA_TOAST(v, m); }

  function multiannual() { return (MOCK.auditPlansMultiannual || [])[0] || null; }
  function annual() { return (MOCK.auditPlansAnnual || [])[0] || null; }

  function avatarBox(user) {
    if (!user) return '';
    var inner = (typeof window.renderAvatar === 'function') ? window.renderAvatar(user, 28) : esc((user.name || '?').charAt(0));
    return '<span class="avatar" title="' + esc(user.name || '') + '">' + inner + '</span>';
  }

  function fmt(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] : iso;
  }
  function formatPerioada(per) {
    if (!per) return '—';
    if (typeof per === 'string') return per;
    var f = per.from, t = per.to;
    if (f && t) {
      var fy = f.slice(0, 4), ty = t.slice(0, 4);
      if (f.slice(5) === '01-01' && t.slice(5) === '12-31') {
        return fy === ty ? ('Anul ' + fy) : (fy + '–' + ty);
      }
      return fmt(f) + ' – ' + fmt(t);
    }
    return '—';
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function render() {
    renderMultiannual();
    renderAnnual();
  }

  function renderMultiannual() {
    var el = $('plan-multianual');
    if (!el) return;
    var p = multiannual();
    if (!p) { el.innerHTML = '<div class="plan-card">Niciun plan multianual configurat.</div>'; return; }
    var statusPill = p.status === 'aprobat'
      ? '<span class="pill pill--success">Aprobat</span>'
      : '<span class="pill pill--neutral">Ciornă</span>';
    var editBtn = isAuthority() ? '' :
      '<button type="button" class="btn btn--ghost" id="plan-edit-btn">' +
        '<span class="material-symbols-outlined" aria-hidden="true">edit</span>Editează planul' +
      '</button>';
    var chips = (p.missions || []).map(function (m) {
      return '<span class="plan-mission-chip"><span class="material-symbols-outlined" aria-hidden="true">verified_user</span>' + esc(m) + '</span>';
    }).join('');
    el.innerHTML =
      '<div class="plan-card">' +
        '<div class="plan-card__head">' +
          '<div class="plan-card__title">' + esc(p.name) + '</div>' +
          '<div class="plan-card__head-right">' + statusPill + editBtn + '</div>' +
        '</div>' +
        '<div class="plan-card__meta">Orizont: ' + esc(p.fromYear) + '–' + esc(p.toYear) + '</div>' +
        '<div class="plan-missions__label">Misiuni orientative</div>' +
        '<div class="plan-missions__list">' + (chips || '<span class="plan-risk">Nicio misiune definită.</span>') + '</div>' +
      '</div>';
    var btn = $('plan-edit-btn');
    if (btn) btn.addEventListener('click', openEditModal);
  }

  function renderAnnual() {
    var el = $('plan-anual');
    if (!el) return;
    var p = annual();
    if (!p) { el.innerHTML = '<div class="plan-card">Niciun plan anual configurat.</div>'; return; }
    var ro = isAuthority();
    var rows = (p.entries || []).map(function (e) { return entryRowHtml(e, ro); }).join('');
    el.innerHTML =
      '<div class="docs-section__header">' +
        '<div class="docs-section__title">Plan anual ' + esc(p.year) + ' ' +
          (p.status === 'aprobat' ? '<span class="pill pill--success" style="margin-left:var(--space-2);">Aprobat</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="table-wrap">' +
        '<table class="admin-table plan-annual-table">' +
          '<thead><tr>' +
            '<th>Misiune</th>' +
            '<th style="width:170px;">Entitate</th>' +
            '<th style="width:130px;">Perioadă auditată</th>' +
            '<th style="width:120px;">Responsabili</th>' +
            '<th>Fundamentare risc</th>' +
            '<th style="width:120px;">Status</th>' +
            '<th style="width:150px;">Acțiune</th>' +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';

    el.querySelectorAll('[data-demareaza]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.location.href = 'misiuni-audit.html?demareaza=' + encodeURIComponent(btn.getAttribute('data-demareaza'));
      });
    });
  }

  function entryRowHtml(e, ro) {
    var ent = entityById(e.entityId);
    var avatars = (e.responsibleIds || []).map(function (id) { return avatarBox(employeeById(id)); }).join('');
    var started = !!e.missionId;
    var statusHtml = started
      ? '<span class="plan-status plan-status--demarata"><span class="material-symbols-outlined" aria-hidden="true">play_circle</span>Demarată</span>'
      : '<span class="plan-status plan-status--planificata"><span class="material-symbols-outlined" aria-hidden="true">schedule</span>Planificată</span>';
    var action;
    if (started) {
      action = '<a class="plan-link" href="misiune-audit-workspace.html?id=' + esc(e.missionId) + '">Vezi misiunea →</a>';
    } else if (ro) {
      action = '<span class="admin-table__muted">—</span>';
    } else {
      action = '<button type="button" class="btn btn--secondary" data-demareaza="' + esc(e.id) + '">Demarează</button>';
    }
    return '<tr>' +
      '<td class="admin-table__name">' + esc(e.name) + '</td>' +
      '<td>' + esc(ent ? ent.name : '—') + '</td>' +
      '<td>' + esc(formatPerioada(e.perioadaAuditata)) + '</td>' +
      '<td><span class="am-resp"><span class="avatars-cluster">' + avatars + '</span></span></td>' +
      '<td><div class="plan-risk">' + esc(e.riskNote || '—') + '</div></td>' +
      '<td>' + statusHtml + '</td>' +
      '<td>' + action + '</td>' +
    '</tr>';
  }

  /* ============================================================
     EDIT MODAL — plan multianual (admin)
     ============================================================ */
  var modal;
  function initEditModal() {
    modal = $('modal-plan-edit');
    if (!modal) return;
    modal.querySelectorAll('[data-modal-close], [data-modal-cancel]').forEach(function (b) {
      b.addEventListener('click', closeEditModal);
    });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeEditModal(); });
    document.addEventListener('keydown', function (e) {
      if (modal.classList.contains('is-open') && e.key === 'Escape') { e.preventDefault(); closeEditModal(); }
    });
    var save = $('mpe-save');
    if (save) save.addEventListener('click', saveEdit);
  }

  function openEditModal() {
    var p = multiannual();
    if (!p || !modal) return;
    $('mpe-nume').value = p.name || '';
    $('mpe-from').value = p.fromYear || '';
    $('mpe-to').value = p.toYear || '';
    $('mpe-status').value = p.status || 'aprobat';
    $('mpe-missions').value = (p.missions || []).join('\n');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('mpe-nume').focus(); }, 0);
  }

  function closeEditModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function saveEdit() {
    var p = multiannual();
    if (!p) return;
    var nume = $('mpe-nume').value.trim();
    var from = parseInt($('mpe-from').value, 10);
    var to = parseInt($('mpe-to').value, 10);
    var ok = true;
    setErr('nume', !nume, 'Introdu denumirea planului.');
    if (!nume) ok = false;
    var badYears = !from || !to || to < from;
    setErr('from', !from, 'An invalid.');
    setErr('to', badYears, 'Anul de sfârșit trebuie ≥ anul de început.');
    if (!from || badYears) ok = false;
    if (!ok) return;

    p.name = nume;
    p.fromYear = from;
    p.toYear = to;
    p.status = $('mpe-status').value;
    p.missions = $('mpe-missions').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    closeEditModal();
    renderMultiannual();
    toast('success', 'Planul multianual a fost salvat.');
  }

  function setErr(field, has, msg) {
    var f = modal.querySelector('[data-field="' + field + '"]');
    if (!f) return;
    f.classList.toggle('has-error', has);
    var e = f.querySelector('.form-error');
    if (e && msg) e.textContent = msg;
  }

})();
