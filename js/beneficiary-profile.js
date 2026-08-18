/* ============================================================
   Scriptica — Profil beneficiar (Feedback #2)
   Renderer unic pentru formularul intern și previzualizarea formularului
   extern. Schema este definită la HQ; valorile rămân pe beneficiarul din
   Administrare, în `profileValues`, fără să înlocuiască identitatea,
   contactele, accesul sau regulile de colaborare existente.
   ============================================================ */
(function () {
  'use strict';

  var TYPE_META = {
    section_title: { label: 'Titlu secțiune', icon: 'title' },
    text_short: { label: 'Text scurt', icon: 'short_text' },
    text_long: { label: 'Text lung', icon: 'subject' },
    cui: { label: 'CUI / identificator fiscal', icon: 'badge' },
    email: { label: 'Adresă de e-mail', icon: 'mail' },
    phone: { label: 'Număr de telefon', icon: 'call' },
    date: { label: 'Dată', icon: 'calendar_today' },
    address: { label: 'Adresă structurată', icon: 'location_on' },
    dropdown: { label: 'Listă de opțiuni', icon: 'arrow_drop_down_circle' },
    boolean: { label: 'Confirmare Da / Nu', icon: 'toggle_on' },
    file_upload: { label: 'Document justificativ', icon: 'attach_file' },
    repeater_block: { label: 'Bloc repetabil', icon: 'repeat' }
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function fieldValue(values, field) {
    return values && Object.prototype.hasOwnProperty.call(values, field.id) ? values[field.id] : '';
  }
  function isVisible(field, scope) {
    if (!field) return false;
    if (field.type === 'section_title') return true;
    if (scope === 'external') return field.showInExternalForm !== false;
    if (scope === 'table') return !!field.showInTable;
    if (scope === 'profile') return field.scope !== 'onboarding';
    return field.scope !== 'profile';
  }
  function visibleFields(schema, scope) {
    var fields = ((schema || {}).fields || []).filter(function (field) { return isVisible(field, scope); });
    return fields.filter(function (field, index) {
      if (field.type !== 'section_title') return true;
      for (var i = index + 1; i < fields.length; i++) {
        if (fields[i].type === 'section_title') return false;
        return true;
      }
      return false;
    });
  }
  function inputId(prefix, field, suffix) {
    return (prefix || 'bpf') + '_' + String(field.id || 'field').replace(/[^a-zA-Z0-9_-]/g, '_') + (suffix || '');
  }
  function helperHtml(field) {
    return field.help ? '<span class="form-helper">' + esc(field.help) + '</span>' : '';
  }
  function errorHtml() { return '<span class="form-error" role="alert"></span>'; }

  function addressHtml(field, value, opts) {
    value = value && typeof value === 'object' ? value : {};
    var disabled = opts.disabled ? ' disabled' : '';
    var prefix = inputId(opts.idPrefix, field, '_');
    return '<div class="bpf-address" id="' + inputId(opts.idPrefix, field, '') + '" role="group" aria-label="' + esc(field.label || 'Adresă') + '">' +
      '<label><span>Stradă și număr</span><input class="input" id="' + prefix + 'street" data-bpf-address="street" value="' + esc(value.street || '') + '"' + disabled + '></label>' +
      '<label><span>Localitate</span><input class="input" id="' + prefix + 'locality" data-bpf-address="locality" value="' + esc(value.locality || '') + '"' + disabled + '></label>' +
      '<label><span>Județ / sector</span><input class="input" id="' + prefix + 'county" data-bpf-address="county" value="' + esc(value.county || '') + '"' + disabled + '></label>' +
      '<label><span>Cod poștal</span><input class="input" id="' + prefix + 'postalCode" data-bpf-address="postalCode" value="' + esc(value.postalCode || '') + '"' + disabled + '></label>' +
    '</div>';
  }
  function fileHtml(field, value, opts) {
    var disabled = opts.disabled ? ' disabled' : '';
    var files = Array.isArray(value) ? value : (value && value.name ? [value] : []);
    return '<label class="bpf-upload">' +
      '<input type="file" id="' + inputId(opts.idPrefix, field, '') + '" data-bpf-input' + (field.multi ? ' multiple' : '') + disabled + '>' +
      '<span class="material-symbols-outlined" aria-hidden="true">upload_file</span>' +
      '<span><b>' + (files.length ? (files.length === 1 ? esc(files[0].name || 'Document selectat') : files.length + ' documente selectate') : 'Alege documentul') + '</b>' +
        '<small>' + (files.length ? 'Selecția este păstrată ca metadate în prototip.' : 'Fișierul nu este trimis către un server.') + '</small></span>' +
    '</label>';
  }
  function repeaterHtml(field, value, opts) {
    var rows = Array.isArray(value) ? value : [];
    var disabled = opts.disabled ? ' disabled' : '';
    return '<div class="bpf-repeater" id="' + inputId(opts.idPrefix, field, '') + '" role="group" aria-label="' + esc(field.label || 'Listă repetabilă') + '" data-bpf-repeater>' +
      (rows.length ? rows.map(function (row, index) {
        return '<div class="bpf-repeater__row"><input class="input" data-bpf-repeat-value data-bpf-repeat-index="' + index + '" value="' + esc(row || '') + '"' + disabled + '>' +
          (opts.disabled ? '' : '<button type="button" class="admin-action-btn admin-action-btn--delete" data-bpf-repeat-remove="' + index + '" aria-label="Elimină înregistrarea"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>') + '</div>';
      }).join('') : '<div class="bpf-repeater__empty">Nu există încă înregistrări.</div>') +
      (opts.disabled ? '' : '<button type="button" class="admin-add-btn" data-bpf-repeat-add><span class="material-symbols-outlined" aria-hidden="true">add</span>Adaugă înregistrare</button>') +
    '</div>';
  }
  function controlHtml(field, value, opts) {
    var disabled = opts.disabled ? ' disabled' : '';
    var id = inputId(opts.idPrefix, field, '');
    if (field.type === 'text_long') {
      return '<textarea class="input" rows="3" id="' + id + '" data-bpf-input' + disabled + ' placeholder="' + esc(field.placeholder || '') + '">' + esc(value || '') + '</textarea>';
    }
    if (field.type === 'dropdown') {
      return '<select class="select" id="' + id + '" data-bpf-input' + disabled + '><option value="">Selectează...</option>' +
        (field.options || []).map(function (option) { return '<option value="' + esc(option) + '"' + (String(value) === String(option) ? ' selected' : '') + '>' + esc(option) + '</option>'; }).join('') + '</select>';
    }
    if (field.type === 'boolean') {
      return '<select class="select" id="' + id + '" data-bpf-input' + disabled + '><option value="">Selectează...</option>' +
        '<option value="Da"' + (value === true || value === 'Da' ? ' selected' : '') + '>Da</option>' +
        '<option value="Nu"' + (value === false || value === 'Nu' ? ' selected' : '') + '>Nu</option></select>';
    }
    if (field.type === 'address') return addressHtml(field, value, opts);
    if (field.type === 'file_upload') return fileHtml(field, value, opts);
    if (field.type === 'repeater_block') return repeaterHtml(field, value, opts);
    var type = field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text';
    return '<input class="input" type="' + type + '" id="' + id + '" data-bpf-input value="' + esc(value || '') + '"' + disabled + ' placeholder="' + esc(field.placeholder || '') + '">';
  }
  function fieldHtml(field, values, opts) {
    if (field.type === 'section_title') {
      return '<div class="bpf-section-title"><span class="material-symbols-outlined" aria-hidden="true">segment</span><h4>' + esc(field.text || 'Secțiune') + '</h4></div>';
    }
    var value = fieldValue(values, field);
    return '<div class="form-field bpf-field" data-bpf-field="' + esc(field.id) + '">' +
      '<label class="form-label" for="' + inputId(opts.idPrefix, field, '') + '">' + esc(field.label || 'Câmp') + (field.required ? '*' : '') + '</label>' +
      controlHtml(field, value, opts) + helperHtml(field) + errorHtml() +
    '</div>';
  }
  function formHtml(schema, values, options) {
    var opts = options || {};
    var fields = visibleFields(schema, opts.scope || 'onboarding');
    if (!fields.some(function (field) { return field.type !== 'section_title'; })) {
      return '<div class="bpf-empty"><span class="material-symbols-outlined" aria-hidden="true">dynamic_form</span><p>Nu sunt configurate câmpuri pentru această utilizare.</p></div>';
    }
    return '<div class="bpf-form" data-bpf-form>' + fields.map(function (field) {
      return fieldHtml(field, values || {}, opts);
    }).join('') + '</div>';
  }

  function renderInto(host, schema, values, options) {
    if (!host) return;
    var opts = options || {};
    var targetValues = values || {};
    host.innerHTML = formHtml(schema, targetValues, opts);
    if (opts.disabled) return;
    var fieldMap = {};
    ((schema || {}).fields || []).forEach(function (field) { fieldMap[field.id] = field; });

    function changed(field) {
      if (typeof opts.onChange === 'function') opts.onChange(targetValues, field);
    }
    host.oninput = function (event) {
      var wrap = event.target.closest('[data-bpf-field]');
      if (!wrap) return;
      var field = fieldMap[wrap.getAttribute('data-bpf-field')];
      if (!field || field.type === 'file_upload') return;
      if (event.target.hasAttribute('data-bpf-address')) {
        var address = targetValues[field.id] && typeof targetValues[field.id] === 'object' ? targetValues[field.id] : {};
        address[event.target.getAttribute('data-bpf-address')] = event.target.value;
        targetValues[field.id] = address;
      } else if (event.target.hasAttribute('data-bpf-repeat-value')) {
        var rows = Array.isArray(targetValues[field.id]) ? targetValues[field.id] : [];
        rows[parseInt(event.target.getAttribute('data-bpf-repeat-index'), 10)] = event.target.value;
        targetValues[field.id] = rows;
      } else if (event.target.hasAttribute('data-bpf-input')) {
        targetValues[field.id] = event.target.value;
      }
      changed(field);
    };
    host.onchange = function (event) {
      var wrap = event.target.closest('[data-bpf-field]');
      if (!wrap) return;
      var field = fieldMap[wrap.getAttribute('data-bpf-field')];
      if (!field) return;
      if (field.type === 'file_upload' && event.target.files) {
        targetValues[field.id] = Array.prototype.map.call(event.target.files, function (file) {
          return { name: file.name, size: file.size, type: file.type || 'application/octet-stream' };
        });
        renderInto(host, schema, targetValues, opts);
      } else if (event.target.hasAttribute('data-bpf-input')) {
        targetValues[field.id] = event.target.value;
        changed(field);
      }
    };
    host.onclick = function (event) {
      var wrap = event.target.closest('[data-bpf-field]');
      if (!wrap) return;
      var field = fieldMap[wrap.getAttribute('data-bpf-field')];
      if (!field || field.type !== 'repeater_block') return;
      var rows = Array.isArray(targetValues[field.id]) ? targetValues[field.id] : [];
      var add = event.target.closest('[data-bpf-repeat-add]');
      var remove = event.target.closest('[data-bpf-repeat-remove]');
      if (add) rows.push('');
      else if (remove) rows.splice(parseInt(remove.getAttribute('data-bpf-repeat-remove'), 10), 1);
      else return;
      targetValues[field.id] = rows;
      changed(field);
      renderInto(host, schema, targetValues, opts);
    };
  }

  function hasValue(field, value) {
    if (field.type === 'address') return value && typeof value === 'object' && Object.keys(value).some(function (key) { return String(value[key] || '').trim(); });
    if (field.type === 'file_upload') return (Array.isArray(value) && value.length > 0) || !!(value && typeof value === 'object' && value.name);
    if (field.type === 'repeater_block') return Array.isArray(value) && value.length > 0;
    return value === true || value === false || String(value == null ? '' : value).trim() !== '';
  }
  function validate(host, schema, values, options) {
    var opts = options || {};
    var valid = true;
    visibleFields(schema, opts.scope || 'onboarding').forEach(function (field) {
      if (field.type === 'section_title' || !field.required) return;
      var wrap = host && host.querySelector('[data-bpf-field="' + String(field.id).replace(/"/g, '\\"') + '"]');
      var missing = !hasValue(field, fieldValue(values || {}, field));
      if (wrap) {
        wrap.classList.toggle('has-error', missing);
        var error = wrap.querySelector('.form-error');
        if (error) error.textContent = missing ? 'Câmpul este obligatoriu.' : '';
      }
      if (missing) valid = false;
    });
    return valid;
  }

  function formatValue(field, value) {
    if (!hasValue(field || {}, value)) return '—';
    if (field.type === 'address') {
      return [value.street, value.locality, value.county, value.postalCode].filter(Boolean).join(', ') || '—';
    }
    if (field.type === 'file_upload') {
      var fileCount = Array.isArray(value) ? value.length : 1;
      return fileCount === 1 ? 'Încărcat' : fileCount + ' fișiere';
    }
    if (field.type === 'repeater_block') return value.length + (value.length === 1 ? ' înregistrare' : ' înregistrări');
    if (field.type === 'boolean') return value === true || value === 'true' ? 'Da' : (value === false || value === 'false' ? 'Nu' : String(value));
    if (field.type === 'date') {
      var parts = String(value).split('-');
      return parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : String(value);
    }
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  window.SCRIPTICA_BENEFICIARY_PROFILE = {
    typeMeta: TYPE_META,
    clone: clone,
    visibleFields: visibleFields,
    formHtml: formHtml,
    renderInto: renderInto,
    validate: validate,
    formatValue: formatValue
  };
})();
