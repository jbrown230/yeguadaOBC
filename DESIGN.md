---
name: La Yeguada OBC — Chatbot Admin
description: An instrumentation panel for a community-run chatbot, not a decorated dashboard template
colors:
  accent: "#1B6B47"
  accent-strong: "#124F35"
  accent-soft: "#E7F2EC"
  accent-border: "#BEDDCC"
  ink: "#15171B"
  ink-2: "#21242A"
  text-secondary: "#5C6270"
  text-tertiary: "#7B8190"
  border: "#DDE0E5"
  border-strong: "#C7CBD3"
  surface: "#FFFFFF"
  bg: "#F4F5F6"
  chip-bg: "#E9EBEE"
  warning: "#8A5A12"
  warning-soft: "#FBF1DE"
  danger: "#A3312A"
  danger-soft: "#FBEAE8"
typography:
  2xs:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  xs:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  sm:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "normal"
  base:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
  heading:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "25px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  stat-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  tag:
    backgroundColor: "{colors.chip-bg}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xs}"
    padding: "2px 8px"
---

# Design System: La Yeguada OBC — Chatbot Admin

## Overview

**Creative North Star: "The Instrumentation Panel"**

This dashboard exists so a small, non-technical community organization can trust and operate an AI system they didn't build. The rejected default was the generic AI-dashboard template it started as: a green gradient topbar, circular avatar bubbles, unicode-glyph icons, pill badges on every element, and same-size hero-metric cards with a decorative top accent bar and a faint background emoji. That template photographs well in a thesis screenshot and falls apart under real use — it has no instrumentation feel, no precision, nothing that says "this number can be trusted."

The rebuilt system reads instead as calibrated equipment: a single unified stat strip instead of four separate cards, hairline 1px dividers instead of shadows, monospace figures for anything measured (chat counts, scores, percentages, timestamps), and one committed accent color used sparingly rather than a five-color "nature palette" scattered across badges. The register is explicitly the one the user asked for — Linear, Stripe, and Vercel's dashboards — translated through La Yeguada's own single accent rather than a generic SaaS blue.

Nothing here is decorative. Every icon is hand-authored single-stroke SVG (no emoji, no unicode glyphs). Every color earns its place: neutrals carry structure, the one accent marks state (active nav, resolved status, primary actions, focus).

**Key Characteristics:**
- One committed accent (deep forest green) on an otherwise fully neutral, cool-gray system
- Monospace for every measured figure; proportional sans for everything else
- Hairline (1px) structure over shadow — elevation is rare and reserved for overlays
- Small, precise radii (6–10px); never a pill except true status chips
- A unified stat strip replaces the "four identical KPI cards" template

## Colors

Fully neutral ground with one committed accent; no secondary or tertiary hue — the accent alone carries all emphasis.

### Primary
- **Signature Forest** (`#1B6B47`): the one accent. Primary buttons' success state, active nav indicator, focus rings, resolved-status chips, chart's chatbot series, primary data bars. Used on a small minority of any screen — its rarity is what makes it read as a signal, not decoration.
- **Signature Forest, Strong** (`#124F35`): text-on-tint pairing (e.g. active nav label, "resolved" badge text) and hover-darken for accent surfaces.
- **Signature Forest, Soft** (`#E7F2EC` / border `#BEDDCC`): tint background for the active nav item, resolved-status chips, and intent tags — never used as a large field.

### Neutral
- **Ink** (`#15171B`): primary text; also the fill for primary buttons, the topbar/sidebar brand mark, and chat bubbles/avatars (a near-black square reads as "system," distinct from the accent which reads as "state").
- **Ink, Secondary** (`#5C6270`): secondary text, labels, inactive nav.
- **Ink, Tertiary** (`#7B8190`): placeholder text, timestamps, least-important captions.
- **Hairline Border** (`#DDE0E5`): the default 1px border on every panel, table row, and divider.
- **Hairline Border, Strong** (`#C7CBD3`): input borders and anything that needs to read as interactive/editable.
- **Chip Neutral** (`#E9EBEE`): default tag/chip background when no semantic color applies.
- **Surface** (`#FFFFFF`): every panel, card, input, and the topbar/sidebar.
- **App Ground** (`#F4F5F6`): the page background behind panels.

### Semantic
- **Warning / Amber** (`#8A5A12` on `#FBF1DE`): escalated-to-human status, response-time metric.
- **Danger / Brick** (`#A3312A` on `#FBEAE8`): destructive actions (delete), escalation-rate metric.

### Named Rules
**The One Accent Rule.** Only one saturated color exists in this system. If a new state needs a color, reach for a neutral or a semantic (warning/danger) before introducing a second accent hue.

## Typography

**UI Font:** Inter (with -apple-system, BlinkMacSystemFont, Segoe UI fallback)
**Data Font:** JetBrains Mono (with ui-monospace, SFMono-Regular, Menlo fallback)

**Character:** A workhorse grotesk for every label, sentence, and control, paired with a monospace exclusively for anything that is a measurement — this is the single strongest signal that separates "instrumentation" from "decorated template." The pairing is deliberately restrained per this project's Operate-mode register (see PRODUCT.md); it is not meant to carry personality on its own the way a Persuade surface's type would.

### Hierarchy
Six steps, no exceptions — every `font-size` in the codebase is one of these (`--fs-2xs` … `--fs-data` in `index.css`), never a one-off literal.

- **Data** (JetBrains Mono, 600, tabular-nums, 25px): stat-strip figures. The one size that departs from the base scale, reserved for the single most important number on a page.
- **Heading** (600, 19px, -0.01em tracking): page titles. One per page, top-left, never centered.
- **Base** (500, 13px, 1.5 line-height): the default — buttons, inputs, nav items, panel titles, checkboxes.
- **Sm** (500, 12.5px, 1.55 line-height): dense secondary text — table cells, chat bubbles, page subtitles, sidebar org name.
- **Xs** (600, 11px): tags, status badges, field labels, secondary chrome (topbar/sidebar marks, sub-lines).
- **2xs** (600, 10.5px, uppercase, 0.05em tracking): the smallest step — stat labels, table headers, timestamps, avatar initials, footer text. Always tertiary-colored, never the primary accent.

### Named Rules
**The Measured-Figure Rule.** Any number that represents a live measurement (a count, a percentage, a score, a duration, a timestamp) is set in the mono `data` face with tabular figures. Static prose numbers (version strings, years) stay in the UI scale.
**The Six-Step Rule.** Every font-size is one of the six scale steps (`--fs-2xs` through `--fs-lg`, plus `--fs-data`). A one-off literal size is a bug, not a variant — snap it to the nearest step or add a new named step to the scale, never both an old and a near-duplicate new value.

## Layout

Three-column app shell: fixed sidebar (232px) — fluid main column — fixed chat panel (336px), inside a 56px topbar. Main column padding is 24px/28px on desktop, tightening to 16px at ≤768px.

Responsive collapse (unchanged breakpoints from the prior implementation, preserved because they already matched the app's real usage pattern): at ≤1100px the chat panel becomes a right-side drawer (toggled from the topbar); at ≤768px the sidebar becomes a left-side drawer (toggled via a hamburger button), and the topbar hides secondary chrome (status chip, notification bell, admin label) to keep the wordmark and drawer controls reachable. Below ≤480px, multi-column grids (stat strip, intent grid) collapse to a single column.

The stat strip is a single bordered container with internal 1px dividers between cells rather than N separate cards with gaps — this is the system's signature departure from the "grid of KPI cards" template, and it collapses to a 2-column, then 1-column grid (with hairlines following the wrap) at narrower widths.

## Elevation & Depth

Flat by default. Structure comes from 1px hairline borders, not shadows — the vast majority of surfaces (panels, table rows, stat cells) carry a border and zero shadow. Shadow is reserved for genuinely elevated, temporary surfaces: the mobile sidebar/chat drawers when open, and dropdown-style overlays.

### Shadow Vocabulary
- **xs** (`0 1px 2px rgba(15,17,20,0.04)`): the segmented-control active pill; barely-there separation.
- **sm** (`0 1px 3px rgba(15,17,20,0.06), 0 1px 2px rgba(15,17,20,0.04)`): tooltip/chart-tooltip surfaces.
- **md** (`0 8px 24px rgba(15,17,20,0.10), 0 2px 6px rgba(15,17,20,0.06)`): the sidebar and chat drawers when they slide over content on narrow viewports.
- **focus** (`0 0 0 3px rgba(27,107,71,0.16)`): focus/active ring on inputs and the chat textarea, tinted from the accent rather than a generic blue.

### Named Rules
**The Flat-By-Default Rule.** A panel at rest never has a shadow. Shadow only appears on a surface that is temporarily floating above the rest of the page (a drawer, a tooltip).

## Shapes

Small, precise radii — never the large "friendly SaaS" pill-everything look. Panels and inputs use 8–10px; small controls (tags, icon buttons) use 4–6px. The only true pill (`border-radius: 9999px`) is reserved for status chips (backend-online indicator, resolved/escalated badges) and the segmented-control track — i.e., controls that are semantically a "state capsule," never a generic container. Borders are always a real 1px solid hairline (never sub-pixel 0.5px, which renders inconsistently across displays).

## Components

### Buttons
- **Shape:** 6px radius, 8px/14px padding, 13px/600 weight label.
- **Primary:** ink (`#15171B`) fill, white text; darkens to `#21242A` on hover. A `.is-success` variant swaps the fill to the accent (used for the Config page's "Guardado" confirmation state).
- **Secondary:** white fill, 1px strong-border, ink text; hover fills `App Ground` and darkens the border.
- **Ghost:** transparent, secondary-ink text; hover fills a light neutral tint.
- **Danger-ghost:** transparent, danger-colored text; hover fills the danger-soft tint. Used only for destructive actions (delete a knowledge-base entry).

### Tags / Chips
- **Style:** 4px radius (not pill), neutral chip background by default; `tag-accent`/`tag-warning`/`tag-danger` variants swap in the matching soft/strong pair. `tag-mono` sets the label in the data face (used for intent IDs like `booking.tour`).
- **Status chips** (backend online/offline, resolved/escalated): the one place a true pill radius is used, always paired with a small status dot.

### Cards / Panels (`.panel`)
- **Corner Style:** 10px radius.
- **Background:** white surface.
- **Shadow Strategy:** none at rest (see Elevation & Depth).
- **Border:** 1px hairline.
- **Internal Padding:** 18–20px.

### Stat Strip (signature component)
A single `.panel`-bordered row of `.stat-cell` items, each showing an uppercase tertiary label, a large mono value, and an optional trend line (accent for "up," danger for "down"). Cells are separated by an internal 1px hairline rather than gaps between separate cards — this is the component that most visibly replaces the rejected "grid of KPI cards" default. Wraps to 2 then 1 columns responsively, with the hairlines re-computed per row.

### Inputs / Fields
- **Style:** 1px strong-border, 6px radius, white surface (gray-50 for the chat textarea to distinguish it from the page).
- **Focus:** border shifts to the accent plus a 3px accent-tinted focus ring (`--shadow-focus`).
- **Read-only:** gray-50 background, secondary-ink text, no pointer affordance.

### Navigation (sidebar)
Icon (17px authored SVG, single 1.75px stroke) + label, 8px/10px padding, 6px radius. Inactive: secondary-ink text, transparent background. Hover: fills `App Ground`. Active: accent-soft background, accent-strong text, 600 weight, plus a 3px rounded accent bar floating just outside the item's left edge (not a full-height `border-left`, which the prior implementation overused across cards and badges).

### Chat Panel (signature component)
Bot bubbles: light-neutral fill, ink text, asymmetric corner (sharp bottom-left) to indicate origin. User bubbles: ink fill, white text, mirrored asymmetric corner. Typing indicator is three neutral dots with a subtle vertical dip (`typingDip` keyframe) — deliberately not a bounce/elastic easing. Intent tags under bot replies use `tag-accent tag-mono`.

## Do's and Don'ts

### Do:
- **Do** set every live-measured number (counts, percentages, scores, timestamps) in JetBrains Mono with tabular figures.
- **Do** use hairline 1px borders as the default structural device; reach for shadow only on genuinely floating surfaces.
- **Do** keep the accent to a small minority of any screen — active state, primary action, resolved status, one chart series.
- **Do** author icons as single-stroke SVG at a consistent 1.75px weight; never fall back to emoji or unicode glyphs.
- **Do** use the stat-strip pattern (bordered row + internal dividers) for any new grouped-metrics display, not a grid of separate cards.

### Don't:
- **Don't** introduce a second saturated accent color; route new states through the neutral scale or the warning/danger semantics.
- **Don't** use a full pill radius on anything except true status chips and the segmented control — cards, buttons, and tags stay at 4–10px.
- **Don't** add a decorative top accent bar, background icon glyph, or gradient fill to a card; those were the rejected template's signature tells.
- **Don't** animate `width`/`height`/`padding`/`margin` for data-driven bars — animate `transform: scaleX()` from a `transform-origin`, as the progress bars do.
- **Don't** use a colored `border-left` above 1px as a generic "emphasis" device; the sidebar's floating accent bar is the one sanctioned exception, not a pattern to repeat elsewhere.
