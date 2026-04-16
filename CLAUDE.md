# Employment Hero — Resources & Webinar Landing Templates

## Project overview

Two sets of 5-block Custom HTML snippets pasted into WordPress pages:

| Prefix | Template type | Root class |
|--------|--------------|------------|
| (none) | Resource / downloadable | `.eh-resource-landing` |
| `wbn-` | Webinar / event | `.eh-webinar-landing` |

Each template consists of blocks `00` → `05` pasted as separate Custom HTML blocks in this order:
`00-styles` → `01-hero` → `02-*` → `03-*` → `04-form-tray` → `05-scripts`

---

## Marketo form integration — canonical approach

**Plugin:** Employment Hero's `marketo-form-v2` WordPress plugin.

### Container markup (in `04-form-tray.html`)

```html
<div
  class="eh_marketo_form-container_v2"
  data-marketo-form='{"is_multi_steps":false,"form_data":[{"base_url":"//hr.employmenthero.io","munchkin_id":"387-SZZ-170","form_id":"FORM_ID","css_classes":""}],"submit_text":"Download now","success_handling_method":"thank_you_page","thank_you_page_url":"https://employmenthero.com/thank-you/downloadable/","progress_indicator_type":"progress-bar","enable_revenue_hero":false}'
></div>
```

Configure per resource: `form_id`, `submit_text`, `thank_you_page_url`.

### Plugin script (at the bottom of `04-form-tray.html`)

```html
<script src="https://employmenthero.com/wp-content/plugins/employmentherocom2025-blocks/build/marketo-form-v2/view.js?ver=260248ac2ef7f3a763b0" defer></script>
```

**Why this is required manually:** WordPress auto-loads `marketo-form-v2/view.js` only when a *native* marketo-form-v2 block is detected on the page. Custom HTML blocks bypass that detection, so the script must be self-loaded. If it 404s after a plugin update, copy the new URL from any EH page source.

**Do not confuse with:** `marketo-form/view.js` (v1) — this is always auto-loaded by WordPress but only handles `.eh_marketo_form-container` (no `_v2` suffix) and will NOT render our form.

---

## Select field placeholder pattern

### The problem
`<select>` has no `placeholder` attribute (browser limitation). Marketo hides all `.mktoLabel` elements via inline `style="display:none"`. Showing labels above all fields causes visual inconsistency vs text inputs, repetition, and extra form height.

### The solution
**CSS** — keep all `.mktoLabel` hidden:
```css
#eh-form-tray .mktoLabel { display: none !important; }
```

**CSS** — grey colour hook for the blank placeholder option:
```css
#eh-form-tray select.eh-select-placeholder {
  color: var(--neutral-400) !important; /* match input::placeholder */
}
```

**JS** (`initSelectLabels()` in `05-scripts.html`) — after Marketo renders, for each select:
1. Read the field name from the hidden `.mktoLabel` text
2. If the first `<option>` has a real value → prepend a `value="" disabled selected` option using that label text
3. If the first `<option>` is already blank → replace its text with the label text
4. Add `eh-select-placeholder` class while value is `""`, remove on `change`

```javascript
function initSelectLabels() {
  var tray = document.getElementById('eh-form-tray');
  if (!tray) return;

  var attempts = 0;
  var timer = setInterval(function () {
    attempts++;
    var rows = tray.querySelectorAll('.mktoFormRow');

    if (rows.length || attempts >= 50) {
      clearInterval(timer);

      rows.forEach(function (row) {
        var sel = row.querySelector('select');
        if (!sel) return;

        var labelEl  = row.querySelector('.mktoLabel');
        var labelText = labelEl ? labelEl.textContent.replace(/\*/g, '').trim() : '';

        var firstOpt = sel.options[0];
        if (firstOpt && firstOpt.value !== '') {
          var blank = document.createElement('option');
          blank.value    = '';
          blank.disabled = true;
          blank.selected = true;
          blank.textContent = labelText || 'Select\u2026';
          sel.insertBefore(blank, firstOpt);
        } else if (firstOpt && labelText) {
          firstOpt.textContent = labelText;
        }

        function syncClass() {
          sel.classList.toggle('eh-select-placeholder', sel.value === '');
        }
        syncClass();
        sel.addEventListener('change', syncClass);
      });
    }
  }, 200);
}
```

Call `initSelectLabels()` from `init()` in every scripts file.

---

## Full-bleed hero breakout

EH's WordPress theme applies `max-width` + `margin: auto` to all direct children of `.is-layout-constrained`. There is **no** `.wp-block-html` wrapper around Custom HTML blocks in the EH frontend DOM.

**Fix — CSS** (in `00-styles.html`):
```css
.is-layout-constrained > .eh-resource-landing,
.is-layout-constrained > .eh-webinar-landing {
  max-width: none !important;
  width: 100% !important;
  margin-left: calc(-1 * var(--wp--style--root--padding-left, 0px)) !important;
  margin-right: calc(-1 * var(--wp--style--root--padding-right, 0px)) !important;
}
```

**Fix — JS** (in `05-scripts.html`, `initFullBleed()`):
```javascript
document.querySelectorAll('.eh-resource-landing').forEach(function (el) {
  el.style.maxWidth    = 'none';
  el.style.width       = '100%';
  el.style.marginLeft  = '0';
  el.style.marginRight = '0';
});
```
Inline styles beat `!important` in any external stylesheet — the JS is the strongest override and acts as belt-and-suspenders alongside the CSS rule.

---

## Marketo form HTML structure (key facts)

- Each field is in its own `.mktoFormRow` (single column layout)
- `.mktoAsterix` is a `<div>` inside `.mktoLabel` — hide it globally
- Hint text under fields uses `.mktoInstruction` (not `.mktoHint`)
- Submit button is inside `.eh_marketo_form-button-container > .mktoButton`
- Spacer elements (`.mktoOffset`, `.mktoGutter`, `.mktoClear`) — hide all
- Labels are set to `display:none` via inline style by the plugin — CSS `!important` in author stylesheets overrides normal inline styles per the CSS cascade

---

## Loading indicator auto-hide

The loader (`div.eh-form-loading`) auto-hides via CSS once Marketo renders:

```css
.eh-form-body:has(.mktoForm .mktoFormRow) .eh-form-loading {
  display: none !important;
}
```

`.mktoFormRow` is reliably present in every Marketo form rendering — use this selector regardless of `form_id`.

---

## Marketo instance details (AU)

| Key | Value |
|-----|-------|
| `base_url` | `//hr.employmenthero.io` |
| `munchkin_id` | `387-SZZ-170` |
| Resource form ID | `1737` |
| Webinar form ID | `1739` |
| Resource thank-you URL | `https://employmenthero.com/thank-you/downloadable/` |
| Webinar thank-you URL | `https://employmenthero.com/thank-you/webinar/` |

---

## WordPress variables used (resource template)

| Purpose | Variable |
|---------|----------|
| Brand colour | `var(--wp--preset--color--violet-500)` |
| Neutral text | `var(--wp--preset--color--neutral-500)` |
| Input border | `var(--wp--preset--color--neutral-200)` |
| Font family | `var(--wp--preset--font-family--default)` |
| Small text | `var(--wp--preset--font-size--xs)` |
| Body text | `var(--wp--preset--font-size--sm)` |

Webinar template uses local CSS custom properties (`--eh-purple`, `--eh-gray-500`, `--font-family`, etc.) defined in `wbn-00-styles.html`.
