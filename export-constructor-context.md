# Export mecanica Constructorului de Anexe

> Extragere verbatim din working tree-ul curent (branch `main`, commit `beaa2de`). Niciun fișier sursă nu a fost modificat. Singurul fișier creat este acest document.

Fișiere-sursă: `js/constructor-anexe.js`, `constructor-anexe.html`, `css/constructor.css`, `js/mock-data.js` (`anexeTypes`).

---

## 1. Modelul de date al câmpurilor (verbatim)

### 1.1 Catalogul `FIELD_TYPES` (21 module, cu `defaults`)

Sursă: `js/constructor-anexe.js`.

```javascript
  /* ============================================================
     FIELD TYPE DEFINITIONS — data contract with mock-data.js
     ============================================================ */
  var FIELD_TYPES = {
    section_title: { label: 'Titlu secțiune', icon: 'title', defaults: { text: 'Secțiune nouă' } },
    paragraph: { label: 'Paragraf instrucțiuni', icon: 'notes', defaults: { text: 'Scrie aici instrucțiunile pentru utilizator.' } },
    banner: { label: 'Banner informativ', icon: 'info', defaults: { variant: 'info', text: 'Atenție la corelarea sumelor.' } },
    divider: { label: 'Separator', icon: 'horizontal_rule', defaults: {} },
    text_short: { label: 'Text scurt', icon: 'short_text', defaults: { label: 'Text scurt', placeholder: '', required: false, help: '', maxLength: 100 } },
    text_long: { label: 'Text lung', icon: 'subject', defaults: { label: 'Observații', placeholder: '', required: false, help: '', rows: 3 } },
    number: { label: 'Număr', icon: 'numbers', defaults: { label: 'Cantitate', required: false, help: '', min: null, max: null, decimals: 0 } },
    currency: { label: 'Sumă monetară', icon: 'payments', defaults: { label: 'Sumă', required: false, currency: 'RON', help: '' } },
    percent: { label: 'Procent', icon: 'percent', defaults: { label: 'Cotă TVA', required: false, help: '' } },
    cui: { label: 'Cod fiscal / CUI', icon: 'badge', defaults: { label: 'CUI', required: false, help: 'Cod fiscal românesc, ex: RO12345678' } },
    date: { label: 'Dată', icon: 'calendar_today', defaults: { label: 'Data', required: false, help: '' } },
    month: { label: 'Lună fiscală', icon: 'date_range', defaults: { label: 'Perioada fiscală', required: false, help: '' } },
    dropdown: { label: 'Dropdown', icon: 'arrow_drop_down_circle', defaults: { label: 'Alege o opțiune', required: false, help: '', options: ['Opțiunea 1', 'Opțiunea 2', 'Opțiunea 3'] } },
    radio: { label: 'Radio (alege una)', icon: 'radio_button_checked', defaults: { label: 'Întrebare', required: false, help: '', options: ['Da', 'Nu', 'Nu se aplică'] } },
    checkboxes: { label: 'Bife multiple', icon: 'check_box', defaults: { label: 'Selectează toate aplicabile', required: false, help: '', options: ['Factură', 'Bon fiscal', 'Aviz', 'NIR'] } },
    boolean: { label: 'Confirmare Da/Nu', icon: 'toggle_on', defaults: { label: 'Confirmi că ai verificat?', required: true, help: '' } },
    client_picker: { label: 'Selector client', icon: 'business', defaults: { label: 'Client', required: true, help: 'Alege din portofoliul firmei.', multi: false, source: 'all_clients', filterActive: true, filterAssigned: false } },
    document_picker: { label: 'Selector document', icon: 'description', defaults: { label: 'Document justificativ', required: false, help: 'Documente din pasul curent.', multi: true, source: 'current_situation', filterCategory: 'all' } },
    file_upload: { label: 'Încărcare fișiere', icon: 'attach_file', defaults: { label: 'Atașează fișiere', required: false, help: '', multi: true, maxSizeMB: 10, allowedTypes: 'PDF, JPG, PNG, XLSX' } },
    table: { label: 'Tabel editabil', icon: 'table_chart', defaults: { label: 'Defalcare pe salariați', required: false, help: 'Adaugă câte un rând pentru fiecare salariat.', columns: [
      { name: 'Nume', type: 'text' },
      { name: 'CNP', type: 'text' },
      { name: 'Salariu brut', type: 'currency' }
    ], minRows: 1 } },
    calculated: { label: 'Câmp calculat', icon: 'function', defaults: { label: 'Total', formula: 'subtotal + tva', help: 'Se calculează automat.' } }
  };

```

### 1.2 Structura unui obiect `field` din array-ul `fields`

Un `field` se naște din `deepCopy(FIELD_TYPES[type].defaults)`, plus două proprietăți injectate: `id` (uid runtime, `f_xxxxxxx`) și `type`. Deci proprietățile unui `field` = cheile din `defaults`-ul tipului respectiv (vezi 1.1) + `id` + `type`. La serializare `id` este eliminat (vezi secțiunea 4).

Proprietăți pe tip (din `defaults`):
- `section_title`, `paragraph`: `text`
- `banner`: `variant` (`info`|`warning`|`critical`), `text`
- `divider`: — (niciuna)
- `text_short`: `label`, `placeholder`, `required`, `help`, `maxLength`
- `text_long`: `label`, `placeholder`, `required`, `help`, `rows`
- `number`: `label`, `required`, `help`, `min`, `max`, `decimals`
- `currency`: `label`, `required`, `currency`, `help`
- `percent`, `cui`, `date`, `month`: `label`, `required`, `help`
- `dropdown`, `radio`, `checkboxes`: `label`, `required`, `help`, `options` (array de string)
- `boolean`: `label`, `required`, `help`
- `client_picker`: `label`, `required`, `help`, `multi`, `source`, `filterActive`, `filterAssigned`
- `document_picker`: `label`, `required`, `help`, `multi`, `source`, `filterCategory`
- `file_upload`: `label`, `required`, `help`, `multi`, `maxSizeMB`, `allowedTypes`
- `table`: `label`, `required`, `help`, `columns` (array de `{name, type}`), `minRows`
- `calculated`: `label`, `formula`, `help`

Utilitarele care construiesc/identifică un field (`uid`, `deepCopy`, `findField`, `withUids`, `stripUids`):

```javascript
  function uid() {
    return 'f_' + Math.random().toString(36).slice(2, 9);
  }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function findField(id) {
    if (!id) return null;
    return fields.find(function (f) { return f.id === id; }) || null;
  }

  function withUids(list) {
    list.forEach(function (f) { f.id = uid(); });
    return list;
  }

  function stripUids(list) {
    return list.map(function (f) {
      var copy = deepCopy(f);
      delete copy.id;
      return copy;
    });
  }

```

### 1.3 Funcțiile de adăugare / ștergere / duplicare / reordonare

Sursă: `js/constructor-anexe.js` — blocul `FIELD OPERATIONS` (verbatim). Include `addField`, `removeField`, `duplicateField`, `moveField`, `reorderField`.

```javascript
  /* ============================================================
     FIELD OPERATIONS
     ============================================================ */
  function addField(type, atIndex) {
    if (notFound || mode === 'fill') return;
    var def = FIELD_TYPES[type];
    if (!def) return;
    var newField = deepCopy(def.defaults);
    newField.id = uid();
    newField.type = type;
    if (atIndex === null || atIndex === undefined || atIndex < 0 || atIndex >= fields.length) {
      fields.push(newField);
    } else {
      fields.splice(atIndex, 0, newField);
    }
    selectedId = newField.id;
    render();
  }

  function removeField(id) {
    fields = fields.filter(function (f) { return f.id !== id; });
    if (selectedId === id) selectedId = null;
    render();
  }

  function duplicateField(id) {
    var idx = fields.findIndex(function (f) { return f.id === id; });
    if (idx === -1) return;
    var copy = deepCopy(fields[idx]);
    copy.id = uid();
    fields.splice(idx + 1, 0, copy);
    selectedId = copy.id;
    render();
  }

  function moveField(id, direction) {
    var idx = fields.findIndex(function (f) { return f.id === id; });
    if (idx === -1) return;
    var newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= fields.length) return;
    var tmp = fields[idx];
    fields[idx] = fields[newIdx];
    fields[newIdx] = tmp;
    render();
  }

  function reorderField(id, targetIndex) {
    var currentIndex = fields.findIndex(function (f) { return f.id === id; });
    if (currentIndex === -1) return;
    var moved = fields.splice(currentIndex, 1)[0];
    var adjustedTarget = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
    fields.splice(adjustedTarget, 0, moved);
    selectedId = id;
    render();
  }

```

---

## 2. Există DEJA vreun concept de grupare?

Răspunsuri explicite (analiză pe codul de mai sus):

**Q: Există vreun tip de câmp care conține alte câmpuri (container/grup/secțiune cu copii)? Sau `section_title` e doar un câmp plat?**

**NU există container.** Niciunul dintre cele 21 de tipuri nu are copii. `section_title` este un câmp **plat** care randează doar un titlu `<h3 class="bfield__section-title">` (vezi `renderFieldPreview`, case `section_title`, secțiunea 6) și are o singură proprietate de date, `text`. Nu grupează și nu „conține" câmpurile de după el — separarea vizuală este pur cosmetică.

**Q: Array-ul `fields` este plat sau are deja nesting?**

**PLAT.** Este o singură listă, `var fields = [];`. Toate operațiile lucrează pe un singur nivel: `addField` face `fields.push` / `fields.splice(atIndex, 0, …)`; `reorderField` / `moveField` mută elemente în aceeași listă; `renderCanvasOnly` face `fields.forEach(renderField)`. Niciun `field` nu are o proprietate `children` / `fields` cu alte câmpuri.

**Q: Există vreun concept de „repeater" / „grup repetabil" / „rânduri multiple" în afară de modulul `table`?**

**NU.** Singurul mecanism cu rânduri multiple este modulul `table`. Nu există niciun tip „repeater" / „group" / „bloc repetabil" în `FIELD_TYPES`, nici în schemă, nici în UI.

**Q: Cum își stochează `table` coloanele și rândurile în schemă?**

În schemă, `table` stochează **doar definiția coloanelor și un minim de rânduri** — NU date de rânduri:
- `columns`: array de obiecte `{ name: string, type: string }`, unde `type` ∈ `text | number | currency | date` (opțiunile din `renderColumnsEditor`, secțiunea 5). Default-ul are 3 coloane (`Nume`/text, `CNP`/text, `Salariu brut`/currency).
- `minRows`: număr (default `1`).
- **Rândurile de date NU se salvează în schemă.** La build, `renderFieldPreview` (case `table`) randează două rânduri demo goale (`rowHtml + rowHtml`) doar ca previzualizare; rândurile reale sunt dinamice la completarea anexei, în afara constructorului.

Notă: singura „imbricare" existentă în schemă este la nivel de **date frunză**, nu de câmpuri: `options` (array de string-uri pentru `dropdown`/`radio`/`checkboxes`) și `columns` (array de `{name,type}` pentru `table`). Acestea sunt cele mai apropiate structuri de un repeater, dar nu conțin alte `field`-uri.

---

## 3. Mecanica de drag-and-drop și inserare

### 3.1 Markup-ul toolbox-ului (sursa drag-urilor) — `constructor-anexe.html`

Fiecare unealtă este `draggable="true"` cu `data-type`; canvas-ul este `#builder-canvas`.

```html
        <!-- Toolbox -->
        <aside class="builder__panel builder__toolbox" id="builder-toolbox" aria-label="Componente disponibile">
          <div class="builder__toolbox-section">
            <div class="builder__toolbox-title">Layout</div>
            <div class="builder__tool" draggable="true" data-type="section_title"><span class="material-symbols-outlined" aria-hidden="true">title</span><span class="builder__tool-label">Titlu secțiune</span></div>
            <div class="builder__tool" draggable="true" data-type="paragraph"><span class="material-symbols-outlined" aria-hidden="true">notes</span><span class="builder__tool-label">Paragraf instrucțiuni</span></div>
            <div class="builder__tool" draggable="true" data-type="banner"><span class="material-symbols-outlined" aria-hidden="true">info</span><span class="builder__tool-label">Banner informativ</span></div>
            <div class="builder__tool" draggable="true" data-type="divider"><span class="material-symbols-outlined" aria-hidden="true">horizontal_rule</span><span class="builder__tool-label">Separator</span></div>
          </div>
          <div class="builder__toolbox-section">
            <div class="builder__toolbox-title">Text și numere</div>
            <div class="builder__tool" draggable="true" data-type="text_short"><span class="material-symbols-outlined" aria-hidden="true">short_text</span><span class="builder__tool-label">Text scurt</span></div>
            <div class="builder__tool" draggable="true" data-type="text_long"><span class="material-symbols-outlined" aria-hidden="true">subject</span><span class="builder__tool-label">Text lung</span></div>
            <div class="builder__tool" draggable="true" data-type="number"><span class="material-symbols-outlined" aria-hidden="true">numbers</span><span class="builder__tool-label">Număr</span></div>
            <div class="builder__tool" draggable="true" data-type="currency"><span class="material-symbols-outlined" aria-hidden="true">payments</span><span class="builder__tool-label">Sumă monetară</span></div>
            <div class="builder__tool" draggable="true" data-type="percent"><span class="material-symbols-outlined" aria-hidden="true">percent</span><span class="builder__tool-label">Procent</span></div>
            <div class="builder__tool" draggable="true" data-type="cui"><span class="material-symbols-outlined" aria-hidden="true">badge</span><span class="builder__tool-label">Cod fiscal / CUI</span></div>
          </div>
          <div class="builder__toolbox-section">
            <div class="builder__toolbox-title">Date</div>
            <div class="builder__tool" draggable="true" data-type="date"><span class="material-symbols-outlined" aria-hidden="true">calendar_today</span><span class="builder__tool-label">Dată</span></div>
            <div class="builder__tool" draggable="true" data-type="month"><span class="material-symbols-outlined" aria-hidden="true">date_range</span><span class="builder__tool-label">Lună fiscală</span></div>
          </div>
          <div class="builder__toolbox-section">
            <div class="builder__toolbox-title">Alegere</div>
            <div class="builder__tool" draggable="true" data-type="dropdown"><span class="material-symbols-outlined" aria-hidden="true">arrow_drop_down_circle</span><span class="builder__tool-label">Dropdown</span></div>
            <div class="builder__tool" draggable="true" data-type="radio"><span class="material-symbols-outlined" aria-hidden="true">radio_button_checked</span><span class="builder__tool-label">Radio (alege una)</span></div>
            <div class="builder__tool" draggable="true" data-type="checkboxes"><span class="material-symbols-outlined" aria-hidden="true">check_box</span><span class="builder__tool-label">Bife multiple</span></div>
            <div class="builder__tool" draggable="true" data-type="boolean"><span class="material-symbols-outlined" aria-hidden="true">toggle_on</span><span class="builder__tool-label">Confirmare Da/Nu</span></div>
          </div>
          <div class="builder__toolbox-section">
            <div class="builder__toolbox-title">Referințe Scriptica</div>
            <div class="builder__tool" draggable="true" data-type="client_picker"><span class="material-symbols-outlined" aria-hidden="true">business</span><span class="builder__tool-label">Selector client</span></div>
            <div class="builder__tool" draggable="true" data-type="document_picker"><span class="material-symbols-outlined" aria-hidden="true">description</span><span class="builder__tool-label">Selector document</span></div>
          </div>
          <div class="builder__toolbox-section">
            <div class="builder__toolbox-title">Avansat</div>
            <div class="builder__tool" draggable="true" data-type="file_upload"><span class="material-symbols-outlined" aria-hidden="true">attach_file</span><span class="builder__tool-label">Încărcare fișiere</span></div>
            <div class="builder__tool" draggable="true" data-type="table"><span class="material-symbols-outlined" aria-hidden="true">table_chart</span><span class="builder__tool-label">Tabel editabil</span></div>
            <div class="builder__tool" draggable="true" data-type="calculated"><span class="material-symbols-outlined" aria-hidden="true">function</span><span class="builder__tool-label">Câmp calculat</span></div>
          </div>
        </aside>

        <!-- Canvas -->
        <section class="builder__panel builder__canvas-panel" id="builder-canvas-panel" aria-label="Previzualizare anexă">
          <div class="builder__canvas-wrap">
            <div class="builder__canvas-meta">Așa va arăta anexa pentru utilizator</div>
            <div class="builder__canvas" id="builder-canvas"></div>
          </div>
        </section>

```

### 3.2 Handlerele de drag (toolbox → canvas), reordonare, drop și indicator

Sursă: `js/constructor-anexe.js` — blocul `DRAG & DROP` complet (verbatim). Conține `initToolbox`, `attachReorderHandlers`, `initCanvasDnd` (cu calculul `insertIndex` pe baza `clientY` vs. midpoint-ul fiecărui `.bfield`), `cleanupDrag`, `showDropIndicator`, `removeDropIndicator`. `dragState` este definit la `js/constructor-anexe.js:69` și are forma `{ active, source: "toolbox"|"reorder", draggedType, draggedId, insertIndex }`.

```javascript
  /* ============================================================
     DRAG & DROP — toolbox → canvas + reordonare cu indicator
     ============================================================ */
  function initToolbox() {
    document.querySelectorAll('.builder__tool').forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        dragState.active = true;
        dragState.source = 'toolbox';
        dragState.draggedType = item.getAttribute('data-type');
        dragState.draggedId = null;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', item.getAttribute('data-type'));
        canvasEl.classList.add('builder__canvas--drag-active');
      });
      item.addEventListener('dragend', cleanupDrag);
      /* Click pe componentă = adaugă la final */
      item.addEventListener('click', function () {
        addField(item.getAttribute('data-type'));
      });
    });
  }

  function attachReorderHandlers(fieldEl) {
    var handle = fieldEl.querySelector('.bfield__handle');
    if (!handle) return;

    fieldEl.setAttribute('draggable', 'true');

    /* Drag-ul pornește DOAR din mâner */
    var allowDrag = false;
    handle.addEventListener('mousedown', function () { allowDrag = true; });
    fieldEl.addEventListener('mouseup', function () { allowDrag = false; });

    fieldEl.addEventListener('dragstart', function (e) {
      if (!allowDrag || mode === 'fill') {
        e.preventDefault();
        return;
      }
      dragState.active = true;
      dragState.source = 'reorder';
      dragState.draggedId = fieldEl.getAttribute('data-id');
      dragState.draggedType = null;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', fieldEl.getAttribute('data-id'));
      fieldEl.classList.add('bfield--dragging');
      canvasEl.classList.add('builder__canvas--drag-active');
    });

    fieldEl.addEventListener('dragend', function () {
      /* Orice tentativă nouă de drag cere un mousedown proaspăt pe mâner,
         inclusiv după drop no-op sau drag anulat cu Escape. */
      allowDrag = false;
      fieldEl.classList.remove('bfield--dragging');
      cleanupDrag();
    });
  }

  function initCanvasDnd() {
    canvasEl.addEventListener('dragover', function (e) {
      if (!dragState.active) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = dragState.source === 'reorder' ? 'move' : 'copy';

      var fieldEls = Array.prototype.slice.call(canvasEl.querySelectorAll('.bfield'));
      var mouseY = e.clientY;
      var insertIndex = fieldEls.length;

      for (var i = 0; i < fieldEls.length; i++) {
        var rect = fieldEls[i].getBoundingClientRect();
        var midpoint = rect.top + rect.height / 2;
        if (mouseY < midpoint) {
          insertIndex = i;
          break;
        }
      }

      /* No-op: reordonare pe propria poziție — ascunde indicatorul */
      if (dragState.source === 'reorder') {
        var draggedIdx = fields.findIndex(function (f) { return f.id === dragState.draggedId; });
        if (insertIndex === draggedIdx || insertIndex === draggedIdx + 1) {
          removeDropIndicator();
          dragState.insertIndex = -1;
          return;
        }
      }

      dragState.insertIndex = insertIndex;
      showDropIndicator(insertIndex);
    });

    canvasEl.addEventListener('dragleave', function (e) {
      if (e.target === canvasEl && !canvasEl.contains(e.relatedTarget)) {
        removeDropIndicator();
      }
    });

    canvasEl.addEventListener('drop', function (e) {
      e.preventDefault();
      if (!dragState.active || dragState.insertIndex < 0) {
        cleanupDrag();
        return;
      }
      if (dragState.source === 'toolbox') {
        addField(dragState.draggedType, dragState.insertIndex);
      } else if (dragState.source === 'reorder') {
        reorderField(dragState.draggedId, dragState.insertIndex);
      }
      cleanupDrag();
    });
  }

  function cleanupDrag() {
    dragState = { active: false, source: null, draggedType: null, draggedId: null, insertIndex: 0 };
    removeDropIndicator();
    canvasEl.classList.remove('builder__canvas--drag-active');
    canvasEl.querySelectorAll('.bfield--dragging').forEach(function (el) {
      el.classList.remove('bfield--dragging');
    });
  }

  function showDropIndicator(idx) {
    removeDropIndicator();
    var indicator = document.createElement('div');
    indicator.className = 'builder__drop-indicator';
    indicator.id = 'drop-indicator';
    var fieldEls = canvasEl.querySelectorAll('.bfield');
    if (idx >= fieldEls.length) {
      canvasEl.appendChild(indicator);
    } else {
      canvasEl.insertBefore(indicator, fieldEls[idx]);
    }
  }

  function removeDropIndicator() {
    var existing = document.getElementById('drop-indicator');
    if (existing) existing.remove();
  }

```

> `reorderField(id, targetIndex)` (apelat din handler-ul de `drop`) este în secțiunea 1.3. Indicatorul de drop galben-pulsant (`.builder__drop-indicator`) este inserat în DOM de `showDropIndicator` fie înainte de `.bfield`-ul de la `insertIndex`, fie la finalul canvas-ului; stilizarea lui (3px, `--color-important`, animația `builder-pulse`, capetele `::before`/`::after`) este în secțiunea 7.

---

## 4. Schema serializată — exemplu real

### 4.1 `stripUids` / `withUids` și persistența (`writeStore`, cheia localStorage)

Cheia localStorage este **`scriptica.anexe`** (`var ANEXE_KEY = 'scriptica.anexe';`). Store-ul este o hartă `{ [anexaId]: record }`. `withUids` adaugă `id` runtime la încărcare; `stripUids` îl elimină la serializare. (`stripUids`/`withUids` sunt și în secțiunea 1.2.)

Store read/write (verbatim):

```javascript
  /* ============================================================
     LOCALSTORAGE STORE — contract 'scriptica.anexe'
     ============================================================ */
  function readStore() {
    try {
      var raw = localStorage.getItem(ANEXE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(map) {
    try { localStorage.setItem(ANEXE_KEY, JSON.stringify(map)); } catch (e) { /* ignore */ }
  }

```

`showJson` — generează preview-ul „Vezi JSON Schema" (doar `{ name, fields }`, fără `id`):

```javascript
  function showJson() {
    var modal = document.getElementById('modal-json');
    var pre = document.getElementById('json-output');
    if (!modal || !pre) return;
    var schema = {
      name: (nameInput.value || '').trim() || 'Anexă nouă',
      fields: stripUids(fields)
    };
    pre.textContent = JSON.stringify(schema, null, 2);
    openModal(modal);
  }

```

`saveAnexa` / `resetAnexa` — construiește `record` complet (`{ id, name, status, updatedAt, schema:{fields} }`), îl scrie în harta `scriptica.anexe` și actualizează `MOCK.anexeTypes` în memorie:

```javascript
  /* ============================================================
     SAVE / RESET
     ============================================================ */
  function saveAnexa() {
    if (notFound) return;
    var name = (nameInput.value || '').trim() || 'Anexă nouă';

    /* Id nou generat O SINGURĂ DATĂ; salvările ulterioare actualizează */
    if (!anexaId) {
      anexaId = 'anx_' + Date.now();
      try {
        history.replaceState(null, '', 'constructor-anexe.html?id=' + encodeURIComponent(anexaId));
      } catch (e) { /* ignore */ }
    }

    /* Înregistrare completă, fără chei moștenite (situationTypeId/step) —
       construită de la zero, deci orice cheie legacy este eliminată. */
    var record = {
      id: anexaId,
      name: name,
      status: anexaStatus || 'activ',
      updatedAt: TODAY_ISO,
      schema: { fields: stripUids(fields) }
    };

    /* 1) Persistă în harta 'scriptica.anexe' (supraviețuiește navigării). */
    var map = readStore();
    map[anexaId] = record;
    writeStore(map);

    /* 2) Actualizează MOCK.anexeTypes în memorie (sursa de citire centrală). */
    var list = (MOCK && MOCK.anexeTypes) ? MOCK.anexeTypes : [];
    var idx = list.findIndex(function (a) { return a.id === anexaId; });
    if (idx === -1) list.push(record);
    else list[idx] = record;

    originalFields = stripUids(fields);
    originalName = name;
    nameInput.value = name;
    toast('success', 'Anexa a fost salvată.');
  }

  function resetAnexa() {
    fields = withUids(deepCopy(originalFields));
    nameInput.value = originalName;
    selectedId = null;
    render();
    toast('info', 'Anexa a fost resetată.');
  }

```

### 4.2 Schema unei anexe reale — `anx_1` (seed din `js/mock-data.js` `anexeTypes`)

Înregistrarea completă, verbatim din `js/mock-data.js` (forma `{ id, name, status, updatedAt, schema:{fields:[...]} }`). Notă: câmpurile seed NU au `id` (ids se adaugă runtime de `withUids`).

```javascript
    {
      id: "anx_1",
      name: "Anexă verificare corelație D300 ↔ D394",
      status: "activ",
      updatedAt: "2026-04-18",
      schema: { fields: [
        { type: "section_title", text: "Date generale" },
        { type: "paragraph", text: "Completează datele de identificare ale documentului supus verificării. Toate câmpurile marcate cu * sunt obligatorii." },
        { type: "client_picker", label: "Client", required: true, help: "Alege din portofoliul firmei.", multi: false, source: "all_clients", filterActive: true, filterAssigned: false },
        { type: "month", label: "Perioada fiscală", required: true, help: "" },
        { type: "divider" },
        { type: "section_title", text: "Corelație D300 ↔ D394" },
        { type: "banner", variant: "warning", text: "Diferențele între D300 și D394 generează notificări de conformare ANAF. Verifică cu atenție." },
        { type: "currency", label: "Total livrări D300 (rd. 13)", required: true, currency: "RON", help: "" },
        { type: "currency", label: "Total livrări D394 (Secțiunea C)", required: true, currency: "RON", help: "" },
        { type: "calculated", label: "Diferență", formula: "D300_rd13 - D394_C", help: "Trebuie să fie 0. Orice diferență necesită justificare." },
        { type: "radio", label: "Sumele se corelează?", required: true, help: "", options: ["Da, perfect", "Da, cu diferență minoră justificată", "Nu, necesită corectură"] },
        { type: "text_long", label: "Observații verificare", rows: 3, placeholder: "Notează orice neconcordanță observată...", required: false, help: "" },
        { type: "document_picker", label: "Documente justificative consultate", required: false, help: "Selectează documentele din pasul Recepție pe care le-ai folosit.", multi: true, source: "current_situation", filterCategory: "all" }
      ] }
    },

```

### 4.3 Output real „Vezi JSON Schema" pentru `anx_1` (rulat în pagină)

Capturat rulând `constructor-anexe.html?id=anx_1` și apăsând butonul „Vezi JSON Schema" (`#json-output` `textContent`, verbatim). Acesta e exact ce produce `showJson`: `{ name, fields }`, cu `id`-urile eliminate de `stripUids`. (Diferă de înregistrarea salvată din 4.2, care adaugă `id` / `status` / `updatedAt` și învelește câmpurile în `schema`.)

```json
{
  "name": "Anexă verificare corelație D300 ↔ D394",
  "fields": [
    {
      "type": "section_title",
      "text": "Date generale"
    },
    {
      "type": "paragraph",
      "text": "Completează datele de identificare ale documentului supus verificării. Toate câmpurile marcate cu * sunt obligatorii."
    },
    {
      "type": "client_picker",
      "label": "Client",
      "required": true,
      "help": "Alege din portofoliul firmei.",
      "multi": false,
      "source": "all_clients",
      "filterActive": true,
      "filterAssigned": false
    },
    {
      "type": "month",
      "label": "Perioada fiscală",
      "required": true,
      "help": ""
    },
    {
      "type": "divider"
    },
    {
      "type": "section_title",
      "text": "Corelație D300 ↔ D394"
    },
    {
      "type": "banner",
      "variant": "warning",
      "text": "Diferențele între D300 și D394 generează notificări de conformare ANAF. Verifică cu atenție."
    },
    {
      "type": "currency",
      "label": "Total livrări D300 (rd. 13)",
      "required": true,
      "currency": "RON",
      "help": ""
    },
    {
      "type": "currency",
      "label": "Total livrări D394 (Secțiunea C)",
      "required": true,
      "currency": "RON",
      "help": ""
    },
    {
      "type": "calculated",
      "label": "Diferență",
      "formula": "D300_rd13 - D394_C",
      "help": "Trebuie să fie 0. Orice diferență necesită justificare."
    },
    {
      "type": "radio",
      "label": "Sumele se corelează?",
      "required": true,
      "help": "",
      "options": [
        "Da, perfect",
        "Da, cu diferență minoră justificată",
        "Nu, necesită corectură"
      ]
    },
    {
      "type": "text_long",
      "label": "Observații verificare",
      "rows": 3,
      "placeholder": "Notează orice neconcordanță observată...",
      "required": false,
      "help": ""
    },
    {
      "type": "document_picker",
      "label": "Documente justificative consultate",
      "required": false,
      "help": "Selectează documentele din pasul Recepție pe care le-ai folosit.",
      "multi": true,
      "source": "current_situation",
      "filterCategory": "all"
    }
  ]
}

```

---
## 5. Panoul de proprietăți (settings, dreapta)

`renderSettings` decide ce grupuri de proprietăți apar per tip de câmp. Pe scurt, ce e editabil:
- **Comun tuturor input-urilor:** `label` + `help` (grup „Etichetă"); `required` (grup „Validare", exclus pentru `section_title`/`paragraph`/`banner`/`divider`/`calculated`).
- **Layout:** `section_title`/`paragraph` → `text`; `banner` → `variant` + `text`; `divider` → nimic.
- **`text_short`:** `placeholder`, `maxLength`. **`text_long`:** `placeholder`, `rows`.
- **`number`:** `min`, `max`, `decimals`. **`currency`:** `currency` (RON/EUR/USD).
- **Choice fields (`dropdown`/`radio`/`checkboxes`):** editor de `options` (`renderOptionsEditor`).
- **`client_picker`:** `source` + filtre (`filterActive`, `filterAssigned`) + `multi`.
- **`document_picker`:** `source` + `filterCategory` + `multi`.
- **`file_upload`:** `multi`, `allowedTypes`, `maxSizeMB`.
- **`table`:** editor de `columns` (`renderColumnsEditor`: nume + tip text/number/currency/date) + `minRows`.
- **`calculated`:** `formula`.
- **Footer:** butoane Duplică / Șterge.

Verbatim — `renderSettings` + generatoarele de rânduri (`group`/`textRow`/`numberRow`/`selectRow`/`checkboxRow`/`sourceNote`), editoarele `renderOptionsEditor` / `renderColumnsEditor`, handlerele de input (`onSettingInput`/`onOptionInput`/`onColumnInput`, add/remove option/column) și `attachSettingsHandlers`. Sursă: `js/constructor-anexe.js`.

```javascript
  /* ============================================================
     RENDER — settings panel
     ============================================================ */
  function renderSettings() {
    if (!settingsEmptyEl || !settingsContentEl) return;
    var field = findField(selectedId);
    if (!field || mode === 'fill') {
      settingsEmptyEl.hidden = false;
      settingsContentEl.hidden = true;
      settingsContentEl.innerHTML = '';
      return;
    }

    var def = FIELD_TYPES[field.type] || { label: field.type };
    var html =
      '<div class="builder__settings-header">' +
        '<div class="builder__settings-type">' + esc(def.label) + '</div>' +
        '<h3 class="builder__settings-title">' + esc(field.label || field.text || 'Fără etichetă') + '</h3>' +
      '</div>';

    /* === Tipuri de layout === */
    if (field.type === 'section_title' || field.type === 'paragraph') {
      html += group('Conținut', textRow('text', 'Text afișat', field.text, 'textarea'));
    } else if (field.type === 'banner') {
      html += group('Conținut',
        selectRow('variant', 'Stil', field.variant, [
          { v: 'info', l: 'Informativ' },
          { v: 'warning', l: 'Avertisment' },
          { v: 'critical', l: 'Critic' }
        ]) +
        textRow('text', 'Text', field.text, 'textarea')
      );
    } else if (field.type === 'divider') {
      html += '<div class="builder__settings-note">Separatorul nu are proprietăți de configurat.</div>';
    } else {
      /* === Câmpuri de input — etichetă comună === */
      html += group('Etichetă',
        textRow('label', 'Etichetă (vizibilă utilizatorului)', field.label || '') +
        textRow('help', 'Text de ajutor (sub etichetă)', field.help || '', 'textarea')
      );

      /* Configurare per-tip */
      if (field.type === 'text_short') {
        html += group('Configurare',
          textRow('placeholder', 'Placeholder', field.placeholder || '') +
          numberRow('maxLength', 'Lungime maximă', field.maxLength)
        );
      }
      if (field.type === 'text_long') {
        html += group('Configurare',
          textRow('placeholder', 'Placeholder', field.placeholder || '') +
          numberRow('rows', 'Înălțime (rânduri)', field.rows)
        );
      }
      if (field.type === 'number') {
        html += group('Configurare',
          numberRow('min', 'Valoare minimă', field.min) +
          numberRow('max', 'Valoare maximă', field.max) +
          numberRow('decimals', 'Număr de zecimale', field.decimals)
        );
      }
      if (field.type === 'currency') {
        html += group('Configurare',
          selectRow('currency', 'Monedă', field.currency, [
            { v: 'RON', l: 'RON' }, { v: 'EUR', l: 'EUR' }, { v: 'USD', l: 'USD' }
          ])
        );
      }

      /* Opțiuni inline (dropdown / radio / checkboxes) */
      if (field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkboxes') {
        html += group('Opțiuni', renderOptionsEditor(field));
      }

      /* Selector client — sursă de date + filtre */
      if (field.type === 'client_picker') {
        html += group('Sursă de date',
          sourceNote('Lista vine din baza de date Scriptica.') +
          selectRow('source', 'Listă afișată', field.source, [
            { v: 'all_clients', l: 'Toți clienții firmei' },
            { v: 'my_clients', l: 'Doar clienții mei (asignați)' },
            { v: 'department_clients', l: 'Clienții departamentului meu' }
          ])
        );
        html += group('Filtre',
          checkboxRow('filterActive', 'Doar clienți activi (exclude arhivați)', field.filterActive) +
          checkboxRow('filterAssigned', 'Doar clienți cu situație activă în pasul curent', field.filterAssigned)
        );
        html += group('Configurare', checkboxRow('multi', 'Permite selecție multiplă', field.multi));
      } else if (field.type === 'document_picker') {
        html += group('Sursă de date',
          sourceNote('Documentele se preiau din situația contabilă curentă.') +
          selectRow('source', 'Documente disponibile', field.source, [
            { v: 'current_situation', l: 'Din situația curentă (toți pașii)' },
            { v: 'current_step', l: 'Doar din pasul curent' },
            { v: 'previous_steps', l: 'Doar din pașii anteriori' }
          ])
        );
        html += group('Filtru categorie',
          selectRow('filterCategory', 'Afișează doar categoria', field.filterCategory, [
            { v: 'all', l: 'Toate categoriile' },
            { v: 'intrare', l: 'Doar Intrare' },
            { v: 'iesire', l: 'Doar Ieșire' },
            { v: 'salarizare', l: 'Doar Salarizare' },
            { v: 'necategorisit', l: 'Doar Necategorisit' }
          ])
        );
        html += group('Configurare', checkboxRow('multi', 'Permite selecție multiplă', field.multi));
      } else if (field.type === 'file_upload') {
        html += group('Configurare', checkboxRow('multi', 'Permite selecție multiplă', field.multi));
        html += group('Restricții fișiere',
          textRow('allowedTypes', 'Tipuri permise', field.allowedTypes) +
          numberRow('maxSizeMB', 'Dimensiune max (MB)', field.maxSizeMB)
        );
      }

      /* Coloane tabel */
      if (field.type === 'table') {
        html += group('Coloane', renderColumnsEditor(field));
        html += group('Configurare', numberRow('minRows', 'Număr minim de rânduri', field.minRows));
      }

      /* Formulă câmp calculat */
      if (field.type === 'calculated') {
        html += group('Formulă',
          textRow('formula', 'Expresie de calcul', field.formula, 'textarea') +
          '<div class="builder__formula-help">Folosește numele câmpurilor: <code>subtotal + tva</code>, <code>pret * cantitate</code></div>'
        );
      }

      /* Validare — comună */
      if (['section_title', 'paragraph', 'banner', 'divider', 'calculated'].indexOf(field.type) === -1) {
        html += group('Validare', checkboxRow('required', 'Câmp obligatoriu', field.required));
      }
    }

    /* Footer */
    html +=
      '<div class="builder__settings-footer">' +
        '<button type="button" class="btn btn--ghost" data-settings-duplicate>' +
          '<span class="material-symbols-outlined" aria-hidden="true">content_copy</span> Duplică' +
        '</button>' +
        '<button type="button" class="btn btn--ghost builder__settings-delete" data-settings-delete>' +
          '<span class="material-symbols-outlined" aria-hidden="true">delete</span> Șterge' +
        '</button>' +
      '</div>';

    settingsEmptyEl.hidden = true;
    settingsContentEl.hidden = false;
    settingsContentEl.innerHTML = html;
    attachSettingsHandlers();
  }

  /* --- Generatoare de rânduri pentru settings --- */
  function group(title, inner) {
    return '<div class="builder__sgroup"><div class="builder__sgroup-title">' + esc(title) + '</div>' + inner + '</div>';
  }

  function textRow(key, label, value, kind) {
    if (kind === 'textarea') {
      return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
        '<textarea data-key="' + esc(key) + '">' + esc(value || '') + '</textarea></div>';
    }
    return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
      '<input data-key="' + esc(key) + '" type="text" value="' + esc(value || '') + '"></div>';
  }

  function numberRow(key, label, value) {
    var v = (value === null || value === undefined) ? '' : value;
    return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
      '<input data-key="' + esc(key) + '" type="number" value="' + esc(v) + '"></div>';
  }

  function selectRow(key, label, value, options) {
    return '<div class="builder__srow"><label>' + esc(label) + '</label>' +
      '<select data-key="' + esc(key) + '">' +
      options.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (o.v === value ? ' selected' : '') + '>' + esc(o.l) + '</option>';
      }).join('') +
      '</select></div>';
  }

  function checkboxRow(key, label, value) {
    return '<div class="builder__srow builder__srow--inline"><label>' +
      '<input data-key="' + esc(key) + '" type="checkbox"' + (value ? ' checked' : '') + '> ' +
      esc(label) + '</label></div>';
  }

  function sourceNote(text) {
    return '<div class="builder__source-note">' +
      '<span class="material-symbols-outlined" aria-hidden="true">database</span>' +
      '<span>' + esc(text) + '</span></div>';
  }

  function renderOptionsEditor(field) {
    var options = field.options || [];
    return '<div class="builder__options">' +
      options.map(function (opt, i) {
        return '<div class="builder__option-row">' +
          '<span class="builder__option-grip"><span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span></span>' +
          '<input type="text" value="' + esc(opt) + '" data-opt-idx="' + i + '">' +
          '<button type="button" data-opt-remove="' + i + '" title="Șterge opțiunea"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
        '</div>';
      }).join('') +
      '<button type="button" class="builder__add-btn" data-add-option>' +
        '<span class="material-symbols-outlined" aria-hidden="true">add</span> Adaugă opțiune' +
      '</button>' +
    '</div>';
  }

  function renderColumnsEditor(field) {
    var columns = field.columns || [];
    return '<div class="builder__columns">' +
      columns.map(function (col, i) {
        return '<div class="builder__column">' +
          '<div class="builder__column-head">' +
            '<span>Coloana ' + (i + 1) + '</span>' +
            '<button type="button" data-col-remove="' + i + '" title="Șterge coloana"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>' +
          '</div>' +
          '<div class="builder__column-fields">' +
            '<input type="text" value="' + esc(col.name) + '" data-col-idx="' + i + '" data-col-key="name" placeholder="Nume coloană">' +
            '<select data-col-idx="' + i + '" data-col-key="type">' +
              '<option value="text"' + (col.type === 'text' ? ' selected' : '') + '>Text</option>' +
              '<option value="number"' + (col.type === 'number' ? ' selected' : '') + '>Număr</option>' +
              '<option value="currency"' + (col.type === 'currency' ? ' selected' : '') + '>Sumă</option>' +
              '<option value="date"' + (col.type === 'date' ? ' selected' : '') + '>Dată</option>' +
            '</select>' +
          '</div>' +
        '</div>';
      }).join('') +
      '<button type="button" class="builder__add-btn" data-add-column>' +
        '<span class="material-symbols-outlined" aria-hidden="true">add</span> Adaugă coloană' +
      '</button>' +
    '</div>';
  }

  /* --- Handlere pentru settings (re-randează DOAR canvas-ul la tastare,
         ca input-ul să nu piardă focusul) --- */
  function onSettingInput(e) {
    var el = e.target;
    var key = el.getAttribute('data-key');
    var f = findField(selectedId);
    if (!f || !key) return;
    var val;
    if (el.type === 'checkbox') val = el.checked;
    else if (el.type === 'number') val = el.value === '' ? null : Number(el.value);
    else val = el.value;
    f[key] = val;
    renderCanvasOnly();
  }

  function onOptionInput(e) {
    var idx = parseInt(e.target.getAttribute('data-opt-idx'), 10);
    var f = findField(selectedId);
    if (f && f.options && idx >= 0 && idx < f.options.length) {
      f.options[idx] = e.target.value;
      renderCanvasOnly();
    }
  }

  function onColumnInput(e) {
    var idx = parseInt(e.target.getAttribute('data-col-idx'), 10);
    var key = e.target.getAttribute('data-col-key');
    var f = findField(selectedId);
    if (f && f.columns && f.columns[idx] && key) {
      f.columns[idx][key] = e.target.value;
      renderCanvasOnly();
    }
  }

  function addOption() {
    var f = findField(selectedId);
    if (f && f.options) { f.options.push('Opțiune nouă'); render(); }
  }

  function removeOption(idx) {
    var f = findField(selectedId);
    if (f && f.options && f.options.length > 1) { f.options.splice(idx, 1); render(); }
  }

  function addColumn() {
    var f = findField(selectedId);
    if (f && f.columns) { f.columns.push({ name: 'Coloană nouă', type: 'text' }); render(); }
  }

  function removeColumn(idx) {
    var f = findField(selectedId);
    if (f && f.columns && f.columns.length > 1) { f.columns.splice(idx, 1); render(); }
  }

  function attachSettingsHandlers() {
    settingsContentEl.querySelectorAll('[data-key]').forEach(function (el) {
      el.addEventListener('input', onSettingInput);
      if (el.tagName === 'SELECT') el.addEventListener('change', onSettingInput);
    });
    settingsContentEl.querySelectorAll('[data-opt-idx]').forEach(function (el) {
      el.addEventListener('input', onOptionInput);
    });
    settingsContentEl.querySelectorAll('[data-opt-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeOption(parseInt(btn.getAttribute('data-opt-remove'), 10));
      });
    });
    settingsContentEl.querySelectorAll('[data-add-option]').forEach(function (btn) {
      btn.addEventListener('click', addOption);
    });
    settingsContentEl.querySelectorAll('[data-col-idx]').forEach(function (el) {
      el.addEventListener('input', onColumnInput);
      if (el.tagName === 'SELECT') el.addEventListener('change', onColumnInput);
    });
    settingsContentEl.querySelectorAll('[data-col-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeColumn(parseInt(btn.getAttribute('data-col-remove'), 10));
      });
    });
    settingsContentEl.querySelectorAll('[data-add-column]').forEach(function (btn) {
      btn.addEventListener('click', addColumn);
    });
    settingsContentEl.querySelectorAll('[data-settings-duplicate]').forEach(function (btn) {
      btn.addEventListener('click', function () { duplicateField(selectedId); });
    });
    settingsContentEl.querySelectorAll('[data-settings-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { removeField(selectedId); });
    });
  }

```

---

## 6. Modul preview și randarea câmpurilor în canvas

### 6.1 „Construiește" vs. „Previzualizează" (`mode`)

`mode` este global, inițial `'design'`. Toggle-ul din topbar are două butoane cu `data-mode="design"` și `data-mode="fill"` (markup la `constructor-anexe.html:98-107`). Modul „Previzualizează" = `mode === 'fill'`. Efecte ale lui `fill`: dezactivează selecția/editarea câmpurilor (`renderField` și `attachReorderHandlers` ies devreme când `mode === 'fill'`), ascunde panourile toolbox + settings (`builder__workspace--fill`), pune canvas-ul în `builder__canvas--fill`, golește `selectedId`, iar `renderSettings` afișează starea goală. `addField` este de asemenea blocat în `fill`. Verbatim, `initModeToggle`:

```javascript
  /* ============================================================
     MODE TOGGLE — Construiește / Previzualizează
     ============================================================ */
  function initModeToggle() {
    var btns = document.querySelectorAll('.builder__mode-btn');
    var workspace = document.getElementById('builder-workspace');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var m = btn.getAttribute('data-mode');
        if (m === mode) return;
        mode = m;
        btns.forEach(function (b) {
          var active = (b === btn);
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        var isFill = (mode === 'fill');
        if (workspace) workspace.classList.toggle('builder__workspace--fill', isFill);
        canvasEl.classList.toggle('builder__canvas--fill', isFill);
        if (isFill) selectedId = null;
        render();
      });
    });
  }

```

### 6.2 `render` / `renderCanvasOnly` / `renderField` / `renderFieldPreview` (verbatim)

Sursă: `js/constructor-anexe.js`. `renderFieldPreview` este `switch`-ul care randează fiecare dintre cele 21 de tipuri în canvas (inclusiv case `table` care emite `rowHtml + rowHtml` = 2 rânduri demo).

```javascript
  /* ============================================================
     RENDER — canvas
     ============================================================ */
  function render() {
    renderCanvasOnly();
    renderSettings();
  }

  function renderCanvasOnly() {
    if (!canvasEl) return;
    if (notFound) {
      canvasEl.innerHTML =
        '<div class="builder__error">' +
          '<span class="material-symbols-outlined" aria-hidden="true">search_off</span>' +
          '<p>Anexa nu a fost găsită.</p>' +
          '<a href="administrare.html#tipuri-anexe">Înapoi la Tipuri de Anexe</a>' +
        '</div>';
      return;
    }
    canvasEl.innerHTML = '';
    if (!fields.length) {
      canvasEl.innerHTML =
        '<div class="builder__empty">' +
          '<span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span>' +
          '<p class="builder__empty-strong">Trage componente din panoul din stânga</p>' +
          '<p>sau apasă pe o componentă pentru a o adăuga.</p>' +
        '</div>';
      return;
    }
    fields.forEach(function (f, idx) {
      canvasEl.appendChild(renderField(f, idx));
    });
  }

  function renderField(field, idx) {
    var wrapper = document.createElement('div');
    wrapper.className = 'bfield' + (selectedId === field.id ? ' bfield--selected' : '');
    wrapper.setAttribute('data-id', field.id);
    wrapper.setAttribute('data-idx', String(idx));

    wrapper.addEventListener('click', function (e) {
      if (mode === 'fill') return;
      e.stopPropagation();
      if (selectedId !== field.id) {
        selectedId = field.id;
        render();
      }
    });

    /* Mâner de tragere — în afara marginii stângi */
    var handle = document.createElement('div');
    handle.className = 'bfield__handle';
    handle.title = 'Trage pentru a reordona';
    handle.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">drag_indicator</span>';
    handle.addEventListener('click', function (e) { e.stopPropagation(); });
    wrapper.appendChild(handle);

    /* Bara de acțiuni — vizibilă pe câmpul selectat */
    var actions = document.createElement('div');
    actions.className = 'bfield__actions';
    actions.innerHTML =
      '<button type="button" data-action="up" title="Mută sus"><span class="material-symbols-outlined" aria-hidden="true">arrow_upward</span></button>' +
      '<button type="button" data-action="down" title="Mută jos"><span class="material-symbols-outlined" aria-hidden="true">arrow_downward</span></button>' +
      '<button type="button" data-action="copy" title="Duplică"><span class="material-symbols-outlined" aria-hidden="true">content_copy</span></button>' +
      '<button type="button" data-action="delete" title="Șterge"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>';
    actions.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) return;
      e.stopPropagation();
      var action = btn.getAttribute('data-action');
      if (action === 'up') moveField(field.id, -1);
      else if (action === 'down') moveField(field.id, 1);
      else if (action === 'copy') duplicateField(field.id);
      else if (action === 'delete') removeField(field.id);
    });
    wrapper.appendChild(actions);

    wrapper.appendChild(renderFieldPreview(field));

    attachReorderHandlers(wrapper);

    return wrapper;
  }

  /* ============================================================
     RENDER — field previews (toate cele 21 de tipuri)
     ============================================================ */
  function renderFieldPreview(field) {
    var container = document.createElement('div');
    container.className = 'bfield__preview';

    var helpHtml = field.help ? '<div class="bfield__help">' + esc(field.help) + '</div>' : '';
    var reqMark = field.required ? ' <span class="bfield__required">*</span>' : '';
    var labelHtml = field.label ? '<div class="bfield__label">' + esc(field.label) + reqMark + '</div>' : '';

    var options = field.options || [];
    var variant, bannerIcons, cpSource, cpFilters, dpSource, dpCategory, cols, headHtml, rowHtml;

    switch (field.type) {
      case 'section_title':
        container.innerHTML = '<h3 class="bfield__section-title">' + esc(field.text) + '</h3>';
        break;

      case 'paragraph':
        container.innerHTML = '<p class="bfield__paragraph">' + esc(field.text) + '</p>';
        break;

      case 'banner':
        variant = (field.variant === 'warning' || field.variant === 'critical') ? field.variant : 'info';
        bannerIcons = { info: 'info', warning: 'warning', critical: 'error' };
        container.innerHTML =
          '<div class="bfield__banner bfield__banner--' + variant + '">' +
            '<span class="material-symbols-outlined" aria-hidden="true">' + bannerIcons[variant] + '</span>' +
            '<span>' + esc(field.text) + '</span>' +
          '</div>';
        break;

      case 'divider':
        container.innerHTML = '<hr class="bfield__divider">';
        break;

      case 'text_short':
        container.innerHTML = labelHtml + helpHtml +
          '<input class="bfield__input" type="text" placeholder="' + esc(field.placeholder || '') + '">';
        break;

      case 'text_long':
        container.innerHTML = labelHtml + helpHtml +
          '<textarea class="bfield__input" rows="' + (parseInt(field.rows, 10) || 3) + '" placeholder="' + esc(field.placeholder || '') + '"></textarea>';
        break;

      case 'number':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="number">';
        break;

      case 'currency':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__group">' +
            '<input class="bfield__input" type="number" step="0.01" placeholder="0,00">' +
            '<span class="bfield__unit">' + esc(field.currency || 'RON') + '</span>' +
          '</div>';
        break;

      case 'percent':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__group">' +
            '<input class="bfield__input" type="number" step="0.01" min="0" max="100" placeholder="0,00">' +
            '<span class="bfield__unit">%</span>' +
          '</div>';
        break;

      case 'cui':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="text" placeholder="RO12345678">';
        break;

      case 'date':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="date">';
        break;

      case 'month':
        container.innerHTML = labelHtml + helpHtml + '<input class="bfield__input" type="month">';
        break;

      case 'dropdown':
        container.innerHTML = labelHtml + helpHtml +
          '<select class="bfield__input">' +
            '<option value="">— Alege —</option>' +
            options.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') +
          '</select>';
        break;

      case 'radio':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__radios">' +
            options.map(function (o) {
              return '<label><input type="radio" name="' + esc(field.id) + '"> ' + esc(o) + '</label>';
            }).join('') +
          '</div>';
        break;

      case 'checkboxes':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__checks">' +
            options.map(function (o) {
              return '<label><input type="checkbox"> ' + esc(o) + '</label>';
            }).join('') +
          '</div>';
        break;

      case 'boolean':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__radios">' +
            '<label><input type="radio" name="' + esc(field.id) + '"> Da</label>' +
            '<label><input type="radio" name="' + esc(field.id) + '"> Nu</label>' +
          '</div>';
        break;

      case 'client_picker':
        cpSource = ({
          all_clients: 'Toți clienții firmei',
          my_clients: 'Clienții mei',
          department_clients: 'Clienții departamentului'
        })[field.source] || 'Toți clienții firmei';
        cpFilters = [];
        if (field.filterActive) cpFilters.push('activi');
        if (field.filterAssigned) cpFilters.push('cu situație activă');
        container.innerHTML = labelHtml + helpHtml +
          '<select class="bfield__input"' + (field.multi ? ' multiple size="3"' : '') + '>' +
            '<option value="">— Alege client din portofoliu —</option>' +
            '<option>Canvas S.R.L.</option>' +
            '<option>Ionuț Profan PFA</option>' +
            '<option>Simbio Cost Control</option>' +
          '</select>' +
          '<div class="bfield__source">' +
            '<span class="material-symbols-outlined" aria-hidden="true">database</span>' +
            'Sursă: ' + esc(cpSource) + (cpFilters.length ? ' · filtre: ' + esc(cpFilters.join(', ')) : '') +
          '</div>';
        break;

      case 'document_picker':
        dpSource = ({
          current_situation: 'Toți pașii situației',
          current_step: 'Pasul curent',
          previous_steps: 'Pașii anteriori'
        })[field.source] || 'Situația curentă';
        dpCategory = ({
          all: 'toate',
          intrare: 'Intrare',
          iesire: 'Ieșire',
          salarizare: 'Salarizare',
          necategorisit: 'Necategorisit'
        })[field.filterCategory] || 'toate';
        container.innerHTML = labelHtml + helpHtml +
          '<select class="bfield__input"' + (field.multi ? ' multiple size="3"' : '') + '>' +
            '<option>factura_orange_martie_2026.pdf</option>' +
            '<option>bonuri_curatenie_intrare.png</option>' +
            '<option>extras_bcr_martie.pdf</option>' +
          '</select>' +
          '<div class="bfield__source">' +
            '<span class="material-symbols-outlined" aria-hidden="true">database</span>' +
            'Sursă: ' + esc(dpSource) + ' · categorie: ' + esc(dpCategory) +
          '</div>';
        break;

      case 'file_upload':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__upload">' +
            '<span class="material-symbols-outlined" aria-hidden="true">cloud_upload</span>' +
            '<div>Trage fișierele aici sau apasă pentru a alege</div>' +
            '<div class="bfield__upload-meta">' + esc(field.allowedTypes || '') + ' · max ' + esc(field.maxSizeMB == null ? '—' : field.maxSizeMB) + ' MB</div>' +
          '</div>';
        break;

      case 'table':
        cols = field.columns || [];
        headHtml = cols.map(function (c) { return '<th>' + esc(c.name) + '</th>'; }).join('');
        rowHtml = '<tr>' +
          cols.map(function () { return '<td><input class="bfield__input bfield__cell-input" type="text"></td>'; }).join('') +
          '<td class="bfield__cell-del"><span class="material-symbols-outlined" aria-hidden="true">delete</span></td></tr>';
        container.innerHTML = labelHtml + helpHtml +
          '<table class="bfield__table">' +
            '<thead><tr>' + headHtml + '<th class="bfield__cell-del"></th></tr></thead>' +
            '<tbody>' + rowHtml + rowHtml + '</tbody>' +
          '</table>' +
          '<div class="bfield__table-footer">+ Adaugă rând</div>';
        break;

      case 'calculated':
        container.innerHTML = labelHtml + helpHtml +
          '<div class="bfield__calculated">' +
            '<span class="material-symbols-outlined" aria-hidden="true">function</span>' +
            '<span>= ' + esc(field.formula || '') + '</span>' +
          '</div>';
        break;

      default:
        container.innerHTML = '<p class="bfield__paragraph">Tip necunoscut: ' + esc(field.type) + '</p>';
    }

    return container;
  }

```

---

## 7. CSS relevant

Sursă: `css/constructor.css` — conținut integral (fișierul e dedicat exclusiv builder-ului: topbar, mode toggle, workspace, toolbox `.builder__tool`, canvas `.builder__canvas`, wrapper-ul de câmp `.bfield` cu `--selected` / `--dragging`, mânerul `.bfield__handle`, bara `.bfield__actions`, preview-urile `.bfield__*`, indicatorul de drop `.builder__drop-indicator` + `@keyframes builder-pulse`, panoul de setări `.builder__settings*` / `.builder__sgroup` / `.builder__srow` / `.builder__options` / `.builder__columns`, și JSON peek).

```css
/* ============================================================
   Scriptica — Constructor de Anexe (Phase 9)
   Builder topbar + workspace (toolbox / canvas / settings),
   canvas fields (.bfield), settings editors, drag & drop.
   Tokens only — see css/tokens.css.
   ============================================================ */

/* ------------------------------------------------------------
   Shell: no messaging panel, full-height workspace
   ------------------------------------------------------------ */
.shell--builder .main {
  margin-right: 0;
  padding: var(--header-height) 0 0 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ------------------------------------------------------------
   Builder topbar
   ------------------------------------------------------------ */
.builder__topbar {
  flex-shrink: 0;
  background: var(--color-surface-white);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-5);
}

.builder__topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.builder__topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.builder__back {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--color-default-highlight);
  background: transparent;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.builder__back:hover {
  background: var(--color-surface-1);
  text-decoration: none;
}

.builder__title-block {
  min-width: 0;
}

.builder__breadcrumb {
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.builder__name-input {
  border: 1px solid transparent;
  background: transparent;
  font-family: var(--font-family-base);
  font-size: var(--font-size-subtitle);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  padding: var(--space-1) var(--space-2);
  margin-left: calc(-1 * var(--space-2));
  border-radius: var(--radius-sm);
  width: 420px;
  max-width: 100%;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.builder__name-input:hover {
  background: var(--color-surface-1);
}

.builder__name-input:focus,
.builder__name-input:focus-visible {
  outline: none;
  border-color: var(--color-default-highlight);
  background: var(--color-surface-white);
}

.builder__name-input:disabled {
  color: var(--color-text-muted);
  background: transparent;
  cursor: not-allowed;
}

/* Mode toggle (segmented) */
.builder__mode-toggle {
  display: flex;
  background: var(--color-surface-1);
  border-radius: var(--radius-sm);
  padding: var(--space-1);
  gap: var(--space-1);
}

.builder__mode-btn {
  border: none;
  background: transparent;
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.builder__mode-btn .material-symbols-outlined {
  font-size: 16px;
}

.builder__mode-btn.is-active {
  background: var(--color-default-highlight);
  color: var(--color-surface-white);
}

.builder__mode-btn:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

/* ------------------------------------------------------------
   Workspace grid: toolbox / canvas / settings
   ------------------------------------------------------------ */
.builder__workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px 1fr 320px;
}

.builder__panel {
  overflow-y: auto;
  min-height: 0;
}

.builder__toolbox {
  background: var(--color-surface-white);
  border-right: 1px solid var(--color-border);
  padding: var(--space-4);
}

.builder__canvas-panel {
  background: var(--color-surface-2);
  padding: var(--space-6) var(--space-5);
}

.builder__settings {
  background: var(--color-surface-white);
  border-left: 1px solid var(--color-border);
  padding: var(--space-4);
}

/* Fill (preview) mode: workspace becomes a single column */
.builder__workspace--fill {
  grid-template-columns: 1fr;
}

.builder__workspace--fill .builder__toolbox,
.builder__workspace--fill .builder__settings {
  display: none;
}

/* ------------------------------------------------------------
   Toolbox
   ------------------------------------------------------------ */
.builder__toolbox-section {
  margin-bottom: var(--space-5);
}

.builder__toolbox-title {
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
  padding: 0 var(--space-2);
}

.builder__tool {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: grab;
  user-select: none;
  border: 1px solid transparent;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.builder__tool:hover {
  background: var(--color-surface-1);
  border-color: var(--color-border);
}

.builder__tool:active {
  cursor: grabbing;
}

.builder__tool .material-symbols-outlined {
  font-size: 18px;
  color: var(--color-default-highlight);
}

.builder__tool-label {
  font-size: var(--font-size-small);
  color: var(--color-text-primary);
}

/* ------------------------------------------------------------
   Canvas
   ------------------------------------------------------------ */
.builder__canvas-wrap {
  max-width: 720px;
  margin: 0 auto;
}

.builder__canvas-meta {
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

.builder__canvas {
  background: var(--color-surface-white);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  min-height: 600px;
  box-shadow: var(--shadow-sm);
  transition: background var(--transition-fast);
}

.builder__canvas--drag-active {
  background: var(--color-surface-2);
}

.builder__canvas--drag-active .builder__empty {
  display: none;
}

/* Empty state */
.builder__empty {
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
}

.builder__empty .material-symbols-outlined {
  font-size: 48px;
  display: block;
  margin: 0 auto var(--space-3);
  color: var(--color-default);
}

.builder__empty p {
  margin: var(--space-1) 0;
  font-size: var(--font-size-body);
}

.builder__empty-strong {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

/* Inline error state (anexă negăsită) */
.builder__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-7) var(--space-4);
  color: var(--color-text-muted);
  text-align: center;
}

.builder__error .material-symbols-outlined {
  font-size: 48px;
  color: var(--color-border-strong);
}

.builder__error a {
  font-weight: var(--font-weight-bold);
}

/* Drop indicator (yellow, per design system exception) */
.builder__drop-indicator {
  height: 3px;
  background: var(--color-important);
  border-radius: var(--radius-pill);
  margin: 0;
  position: relative;
  box-shadow: 0 0 0 1px rgba(255, 191, 20, 0.3);
  animation: builder-pulse 1.2s ease-in-out infinite;
}

.builder__drop-indicator::before,
.builder__drop-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-important);
  transform: translateY(-50%);
}

.builder__drop-indicator::before { left: -4px; }
.builder__drop-indicator::after  { right: -4px; }

@keyframes builder-pulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(255, 191, 20, 0.3); }
  50%      { box-shadow: 0 0 0 4px rgba(255, 191, 20, 0.15); }
}

/* ------------------------------------------------------------
   Canvas fields (.bfield)
   ------------------------------------------------------------ */
.bfield {
  position: relative;
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.bfield:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border);
}

.bfield--selected {
  background: var(--color-surface-2);
  border-color: var(--color-default-highlight);
  box-shadow: 0 0 0 3px rgba(71, 56, 106, 0.12);
}

.bfield--dragging {
  opacity: 0.35;
  background: var(--color-surface-1);
}

.bfield__label {
  display: block;
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.bfield__required {
  color: var(--color-critical);
}

.bfield__help {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  margin: var(--space-1) 0 var(--space-2);
}

/* Drag handle — purple grip outside the field's left edge */
.bfield__handle {
  position: absolute;
  left: -28px;
  top: var(--space-3);
  width: 22px;
  height: 28px;
  background: var(--color-default-highlight);
  color: var(--color-surface-white);
  border-radius: var(--radius-sm);
  display: none;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.bfield__handle:active {
  cursor: grabbing;
}

.bfield__handle .material-symbols-outlined {
  font-size: 16px;
}

.bfield:hover .bfield__handle,
.bfield--selected .bfield__handle {
  display: flex;
}

/* Floating action toolbar (selected field) */
.bfield__actions {
  position: absolute;
  top: -12px;
  right: var(--space-2);
  background: var(--color-default-highlight);
  border-radius: var(--radius-sm);
  padding: var(--space-1);
  display: none;
  gap: var(--space-1);
  z-index: var(--z-base);
}

.bfield--selected .bfield__actions {
  display: flex;
}

.bfield__actions button {
  background: transparent;
  border: none;
  color: var(--color-surface-white);
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}

.bfield__actions button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.bfield__actions .material-symbols-outlined {
  font-size: 16px;
}

/* ------------------------------------------------------------
   Field previews
   ------------------------------------------------------------ */
.bfield__input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-body);
  background: var(--color-surface-white);
  color: var(--color-text-primary);
  pointer-events: none;
}

textarea.bfield__input {
  resize: none;
  min-height: 70px;
}

.bfield__group {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.bfield__unit {
  background: var(--color-surface-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.bfield__radios,
.bfield__checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.bfield__radios label,
.bfield__checks label {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-regular);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: default;
  /* În modul de construcție previzualizarea este inertă (vezi .bfield__input);
     pe label, nu doar pe input — click-ul pe label ar comuta controlul. */
  pointer-events: none;
}

.bfield__radios input,
.bfield__checks input {
  accent-color: var(--color-default-highlight);
  margin: 0;
  pointer-events: none;
}

/* Layout previews */
.bfield__section-title {
  font-size: var(--font-size-subtitle);
  font-weight: var(--font-weight-bold);
  color: var(--color-default-highlight);
  margin: 0;
  padding-top: var(--space-2);
}

.bfield__paragraph {
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
  margin: 0;
  font-size: var(--font-size-body);
}

.bfield__divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0;
}

.bfield__banner {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  font-size: var(--font-size-body);
}

.bfield__banner .material-symbols-outlined {
  font-size: 18px;
  flex-shrink: 0;
}

.bfield__banner--info {
  background: var(--color-surface-1);
  color: var(--color-default-highlight);
}

.bfield__banner--warning {
  background: var(--color-pending-surface);
  color: var(--color-text-primary);
}

.bfield__banner--warning .material-symbols-outlined {
  color: var(--color-pending);
}

.bfield__banner--critical {
  background: #FFEBF2; /* pattern reused from .task-row__flag (components.css) */
  color: var(--color-critical);
}

/* Picker source caption */
.bfield__source {
  font-size: var(--font-size-tiny);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.bfield__source .material-symbols-outlined {
  font-size: 14px;
}

/* File upload preview */
.bfield__upload {
  border: 2px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-surface-2);
  font-size: var(--font-size-body);
}

.bfield__upload .material-symbols-outlined {
  font-size: 24px;
  color: var(--color-default);
  display: block;
  margin: 0 auto var(--space-2);
}

.bfield__upload-meta {
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

/* Table preview */
.bfield__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-body);
}

.bfield__table th {
  background: var(--color-surface-1);
  padding: var(--space-2) var(--space-3);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-tiny);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  text-align: left;
}

.bfield__table td {
  padding: var(--space-1) var(--space-2);
}

.bfield__table tbody tr:nth-child(2n) td {
  background: var(--color-surface-2);
}

.bfield__cell-input {
  border: none;
  padding: var(--space-1) var(--space-2);
}

.bfield__cell-del {
  width: 30px;
  text-align: center;
  color: var(--color-text-muted);
}

.bfield__cell-del .material-symbols-outlined {
  font-size: 16px;
}

.bfield__table-footer {
  margin-top: var(--space-2);
  font-size: var(--font-size-small);
  color: var(--color-text-muted);
  font-style: italic;
}

/* Calculated preview */
.bfield__calculated {
  background: var(--color-surface-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.bfield__calculated .material-symbols-outlined {
  font-size: 16px;
  color: var(--color-default-highlight);
}

/* Fill (preview) mode — fields lose builder affordances */
.builder__canvas--fill .bfield {
  cursor: default;
}

.builder__canvas--fill .bfield:hover {
  background: transparent;
  border-color: transparent;
}

.builder__canvas--fill .bfield__handle,
.builder__canvas--fill .bfield__actions {
  display: none;
}

.builder__canvas--fill .bfield__input {
  pointer-events: auto;
}

.builder__canvas--fill .bfield__radios label,
.builder__canvas--fill .bfield__checks label {
  cursor: pointer;
  pointer-events: auto;
}

.builder__canvas--fill .bfield__radios input,
.builder__canvas--fill .bfield__checks input {
  pointer-events: auto;
}

/* ------------------------------------------------------------
   Settings panel
   ------------------------------------------------------------ */
.builder__settings-empty {
  padding: var(--space-7) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
}

.builder__settings-empty .material-symbols-outlined {
  font-size: 40px;
  color: var(--color-default);
  display: block;
  margin: 0 auto var(--space-3);
}

.builder__settings-empty p {
  font-size: var(--font-size-small);
  line-height: var(--line-height-normal);
  margin: var(--space-1) 0;
}

.builder__settings-empty-strong {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.builder__settings-header {
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}

.builder__settings-type {
  font-size: var(--font-size-tiny);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-bold);
}

.builder__settings-title {
  font-size: var(--font-size-headline-3);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: var(--space-1) 0 0;
  overflow-wrap: break-word;
}

.builder__settings-note {
  color: var(--color-text-muted);
  font-size: var(--font-size-small);
  text-align: center;
  padding: var(--space-5) 0;
}

.builder__sgroup {
  margin-bottom: var(--space-4);
}

.builder__sgroup-title {
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

.builder__srow {
  margin-bottom: var(--space-3);
}

.builder__srow > label {
  display: block;
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
}

.builder__srow input[type="text"],
.builder__srow input[type="number"],
.builder__srow select,
.builder__srow textarea,
.builder__options input[type="text"],
.builder__column-fields input[type="text"],
.builder__column-fields select {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  background: var(--color-surface-white);
  color: var(--color-text-primary);
  transition: border-color var(--transition-fast);
}

.builder__srow input:focus-visible,
.builder__srow select:focus-visible,
.builder__srow textarea:focus-visible,
.builder__options input:focus-visible,
.builder__column-fields input:focus-visible,
.builder__column-fields select:focus-visible {
  outline: none;
  border-color: var(--color-default-highlight);
  box-shadow: 0 0 0 2px rgba(71, 56, 106, 0.18);
}

.builder__srow textarea {
  resize: vertical;
  min-height: 60px;
}

.builder__srow--inline > label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-primary);
  cursor: pointer;
  margin-bottom: 0;
}

.builder__srow--inline input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-default-highlight);
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

/* Sursă de date — callout */
.builder__source-note {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  padding: var(--space-2) 0;
  margin-bottom: var(--space-2);
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

.builder__source-note .material-symbols-outlined {
  font-size: 14px;
  color: var(--color-default-highlight);
  flex-shrink: 0;
  margin-top: 2px;
}

/* Options editor */
.builder__options {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.builder__option-row {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

.builder__option-grip {
  color: var(--color-text-muted);
  cursor: grab;
  display: inline-flex;
  flex-shrink: 0;
}

.builder__option-grip .material-symbols-outlined {
  font-size: 16px;
}

.builder__option-row input {
  flex: 1;
}

.builder__option-row button {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  width: 24px;
  height: 24px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.builder__option-row button:hover {
  background: var(--color-surface-1);
  color: var(--color-critical);
}

.builder__option-row button .material-symbols-outlined {
  font-size: 16px;
}

.builder__add-btn {
  background: var(--color-surface-1);
  border: 1px dashed var(--color-border-strong);
  color: var(--color-default-highlight);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.builder__add-btn:hover {
  background: var(--color-surface-2);
  border-color: var(--color-default-highlight);
}

.builder__add-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Columns editor (table) */
.builder__column {
  background: var(--color-surface-1);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.builder__column-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.builder__column-head span {
  font-size: var(--font-size-tiny);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.builder__column-head button {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}

.builder__column-head button:hover {
  color: var(--color-critical);
}

.builder__column-head .material-symbols-outlined {
  font-size: 16px;
}

.builder__column-fields {
  display: grid;
  grid-template-columns: 1fr 80px;
  gap: var(--space-1);
}

/* Formula helper */
.builder__formula-help {
  font-size: var(--font-size-tiny);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.builder__formula-help code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Settings footer */
.builder__settings-footer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-3);
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-2);
}

.builder__settings-footer .btn {
  flex: 1;
}

.builder__settings-delete {
  color: var(--color-critical);
}

/* ------------------------------------------------------------
   JSON peek
   ------------------------------------------------------------ */
.builder__json-peek {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  background: var(--color-default-highlight);
  color: var(--color-surface-white);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  box-shadow: var(--shadow-md);
  z-index: var(--z-dropdown);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  transition: background var(--transition-fast);
}

.builder__json-peek:hover:not(:disabled) {
  background: var(--color-purple-hover);
}

.builder__json-peek:disabled {
  background: var(--color-default);
  cursor: not-allowed;
}

.builder__json-peek .material-symbols-outlined {
  font-size: 16px;
}

.builder__json-dialog {
  width: min(760px, 90vw);
}

.builder__json-pre {
  background: var(--color-surface-2);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow: auto;
  max-height: 50vh;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--font-size-small);
  line-height: var(--line-height-normal);
  margin: 0;
}

/* Panel scrollbars */
.builder__panel::-webkit-scrollbar {
  width: 8px;
}

.builder__panel::-webkit-scrollbar-track {
  background: transparent;
}

.builder__panel::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: var(--radius-sm);
}

```

---

## 8. Diferențe față de fișierele statice

- **Sursa extragerii:** working tree curent pe branch `main` (curat), commit `beaa2de` („Phase 9+10: admin view, Administrare panel, Constructor de Anexe, per-step anexe…"). Tot codul din secțiunile 1–7 este copiat din aceste fișiere statice.
- **Secțiunea 4.3 (JSON peek live):** a fost rulată din EXACT aceste fișiere (server local pe working tree), după `localStorage.removeItem('scriptica.anexe')` ca să nu existe override-uri — deci reflectă seed-ul `anx_1` din `js/mock-data.js`, nu o versiune din localStorage.
- **vs. deploy-ul live (`scriptica.vandrus.dev/constructor-anexe`):** NU am comparat cu deploy-ul live. Deploy-ul este manual (`npx wrangler pages deploy`), deci e posibil ca live-ul să fie în urma working tree-ului, dar **nu știu** cu certitudine fără a-l descărca — nu ghicesc.

Observații factuale (nu modificări):
- Cache-busting în `constructor-anexe.html`: CSS cu `?v=14`, scripturile cu `?v=17`.
- La evaluarea scriptului, `constructor-anexe.js` setează `localStorage['scriptica.view'] = 'admin'` (linia 12) ca shell.js să randeze contextul de admin.
- `TODAY_ISO = '2026-04-20'` este folosit ca `updatedAt` la salvare; `anexaId` nou = `'anx_' + Date.now()`.
- `MOCK.anexeTypes` este produs central în `js/mock-data.js` prin merge-ul override-urilor din `scriptica.anexe` (`mergeInto`, ~linia 717) — Constructorul citește din `MOCK.anexeTypes`.
