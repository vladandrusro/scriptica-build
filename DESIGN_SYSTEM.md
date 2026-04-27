# Scriptica — Design System

Single source of truth for design tokens and component styles. All values come from [`css/tokens.css`](css/tokens.css). Live showcase: [`design-system.html`](design-system.html).

> **Note for reviewers:** Every hex code, size, and spacing value below is verified against the codebase. Component usage notes describe how the token is *actually* applied across [`css/base.css`](css/base.css) and [`css/components.css`](css/components.css), not inferred meaning.

---

## 1. Colors

### 1.1 Surfaces

| Token | Hex | Used for |
|---|---|---|
| `--color-surface-white` | `#FFFFFF` | Cards, modals, inputs, header search bar, design-system swatches |
| `--color-surface-2` | `#F5F5FD` | **Page canvas** (`body`, `.shell`), header bar, messaging panel |
| `--color-surface-1` | `#ECECF6` | **Sidebar** (left rail), icon-button hover, ghost-button hover, disabled inputs, neutral pills |

### 1.2 Interactive & typography

| Token | Hex | Used for |
|---|---|---|
| `--color-default` | `#B4AEC4` | Default neutral (matches `border-strong`) |
| `--color-default-highlight` | `#47386A` | **Primary purple** — wordmark, active nav, secondary button text/border, focus outlines, link color |
| `--color-content` | `#000000` | Pure black content |
| `--color-important` | `#FFBF14` | **Yellow CTA** — primary button background, highlight pill |
| `--color-important-highlight` | `#FFDF89` | Light yellow accent |

### 1.3 Semantic

| Token | Hex | Used for |
|---|---|---|
| `--color-critical` | `#FF3C80` | Destructive button, "restant" pill, notification badge |
| `--color-pending` | `#F9A956` | "În așteptare" pill |
| `--color-success` | `#38BA31` | "Finalizat" pill, success messaging |

### 1.4 Derived / supporting

| Token | Hex | Used for |
|---|---|---|
| `--color-text-primary` | `#1A1433` | Headings, body text |
| `--color-text-secondary` | `#4B4560` | Secondary copy, metadata |
| `--color-text-muted` | `#918D9C` | Placeholders, timestamps, disabled labels |
| `--color-border` | `#D4CFDA` | Standard border (cards, inputs) |
| `--color-border-strong` | `#B4AEC4` | Stronger border, dividers |
| `--color-chat-left` | `#F7F7F7` | Incoming chat bubble |
| `--color-chat-right` | `#F4F0FF` | Outgoing chat bubble |
| `--color-important-hover` | `#E5A800` | Yellow CTA hover state |
| `--color-purple-hover` | `#3C2F59` | Secondary/purple button hover state |

---

## 2. Typography

**Font family:** `Lato` (weights 400, 700, 900) with system fallbacks.

| Token | Size | Used for |
|---|---|---|
| `--font-size-headline-1` | `36px` | Page titles |
| `--font-size-headline-2` | `24px` | Section titles |
| `--font-size-subtitle` | `18px` | Page subtitles, secondary context |
| `--font-size-headline-3` | `16px` | Card / subsection headings |
| `--font-size-body` | `14px` | Default body text |
| `--font-size-small` | `12px` | Metadata, timestamps |
| `--font-size-tiny` | `10px` | Version strings, fine print |

**Weights:** `regular` 400 · `bold` 700 · `black` 900 (used only for the `SCRIPTICA` wordmark with `letter-spacing: 0.15em`).

**Line heights:** `tight` 1.2 (headings) · `normal` 1.5 (body) · `relaxed` 1.7.

---

## 3. Spacing — 8pt grid

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `24px` |
| `--space-6` | `32px` |
| `--space-7` | `48px` |
| `--space-8` | `64px` |

---

## 4. Radius

| Token | Value | Used for |
|---|---|---|
| `--radius-sm` | `6px` | Inputs, small chips |
| `--radius-md` | `10px` | Buttons, medium surfaces |
| `--radius-lg` | `16px` | Cards, modals |
| `--radius-pill` | `999px` | Pills, badges, timer |

---

## 5. Shadows

All shadows use a tinted dark-purple (`rgba(39, 35, 67, …)`) instead of pure black for warmth.

| Token | Value | Used for |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(39, 35, 67, 0.06)` | Cards |
| `--shadow-md` | `0 4px 12px rgba(39, 35, 67, 0.08)` | Hover lift, dropdowns |
| `--shadow-lg` | `0 12px 32px rgba(39, 35, 67, 0.12)` | Modals, popovers |

---

## 6. Components

### 6.1 Buttons

Height `40px`, padding `0 16px`, radius `--radius-md`, font `14px / 700`.

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| **Primary** (yellow CTA) | `--color-important` `#FFBF14` | `--color-default-highlight` `#47386A` | none | bg → `--color-important-hover` `#E5A800` |
| **Secondary** (outlined purple) | transparent | `--color-default-highlight` | `1px solid --color-default-highlight` | bg → `--color-default-highlight`, text → white |
| **Ghost** (borderless) | transparent | `--color-default-highlight` | none | bg → `--color-surface-1` |
| **Critical** (destructive) | transparent | `--color-critical` `#FF3C80` | `1px solid --color-critical` | bg → `--color-critical`, text → white |
| **Disabled** (any variant) | `#D4CFDA` | `--color-text-muted` | none | — |

Icons inside buttons use Material Symbols Outlined at `20px`.

### 6.2 Inputs

Height `40px`, padding `0 12px`, radius `--radius-sm`, border `1px solid --color-border`, background `--color-surface-white`, text `--color-text-primary`.

- **Placeholder:** `--color-text-muted`
- **Focus:** border → `--color-default-highlight`, plus `box-shadow: 0 0 0 2px rgba(71, 56, 106, 0.18)`
- **Disabled:** background → `--color-surface-1`, text → `--color-text-muted`

### 6.3 Pills / badges

Padding `4px 12px`, radius `--radius-pill`, font `12px / 700`, line-height `1.4`.

| Variant | Background | Text |
|---|---|---|
| `pill--neutral` | `--color-surface-1` | `--color-text-primary` |
| `pill--critical` | `--color-critical` | white |
| `pill--pending` | `--color-pending` | white |
| `pill--success` | `--color-success` | white |
| `pill--highlight` | `--color-important` | `--color-default-highlight` |
| `pill--purple` | `--color-default-highlight` | white |

### 6.4 Cards

Background `--color-surface-white`, radius `--radius-lg` (`16px`), padding `--space-5` (`24px`), shadow `--shadow-sm`.

---

## 7. Layout dimensions

| Token | Value | Element |
|---|---|---|
| `--sidebar-width-expanded` | `225px` | Sidebar (open) |
| `--sidebar-width-collapsed` | `72px` | Sidebar (collapsed, default) |
| `--header-height` | `64px` | Top header bar |
| `--messaging-panel-width` | `340px` | Right messaging panel |

---

## 8. Iconography

**Material Symbols Outlined** (Google Fonts), loaded with axes `opsz 20..48, wght 100..700, FILL 0..1, GRAD -50..200`.

- **Default:** outlined style, `FILL 0`
- **Filled variant:** add class `filled` → applies `font-variation-settings: 'FILL' 1`
- **Default size:** `24px` (browser default for Material Symbols), buttons override to `20px`

---

## 9. Motion

| Token | Value | Used for |
|---|---|---|
| `--transition-fast` | `150ms ease` | Hover color shifts |
| `--transition-base` | `200ms ease` | Default UI transitions |
| `--transition-slow` | `300ms ease` | Sidebar expand/collapse, modals |

---

## 10. Z-index scale

| Token | Value | Layer |
|---|---|---|
| `--z-base` | `1` | Default content |
| `--z-sticky` | `100` | Sticky headers |
| `--z-dropdown` | `200` | Menus, dropdowns |
| `--z-modal` | `300` | Modals, dialogs |
| `--z-toast` | `400` | Toasts, alerts |
