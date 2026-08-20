# Design System — "Verandah"

A new visual language for Silver Group Rentals, designed before any page was built and implemented
as tokens in `src/styles/tokens.css`. It shares nothing with the previous interface, which was a
white-and-navy Airbnb pastiche (Playfair Display + Inter + Sacramento script, `rounded-2xl`
everywhere, centred hero photo with a pill search bar, soft drop shadows).

## 1. Direction

**Warm editorial.** Think a printed property portfolio: paper-toned ground, ink-black type, one
earthen accent, hairline rules instead of shadows, generous vertical rhythm, and numbered sections.
Photography is the only saturated element on the page.

Three rules the whole system obeys:

1. **Rules, not shadows.** Separation comes from 1px hairlines and background steps. Shadow is
   reserved for genuinely floating layers (modals, popovers, the mobile action bar).
2. **Crisp corners.** Radii top out at 8px (pills excepted). Nothing is a soft blob.
3. **Type does the hierarchy.** Size, weight, tracking and case carry structure — colour is not a
   hierarchy device.

## 2. Colour tokens

Semantic names only; components never reference a raw hex or a palette step.

| Token | Light value | Role |
|---|---|---|
| `--ground` | `#F7F4EE` | Page background (warm paper) |
| `--surface` | `#FFFFFF` | Cards, panels, inputs |
| `--surface-sunken` | `#EFEAE1` | Wells, skeletons, calendar off-days |
| `--ink` | `#17150F` | Primary text, headings |
| `--ink-muted` | `#5C564A` | Secondary text |
| `--ink-faint` | `#8A8272` | Tertiary text, captions, disabled |
| `--line` | `#E0D9CB` | Hairline borders |
| `--line-strong` | `#C6BCA8` | Emphasised borders, focus outlines on dark |
| `--clay` / `--clay-strong` / `--clay-tint` | `#A9482A` / `#8C371F` / `#F5E7E0` | Primary accent: links, primary buttons, active states |
| `--moss` / `--moss-tint` | `#3F5B4A` / `#E4EBE4` | Secondary accent: "available", success |
| `--ochre` / `--ochre-tint` | `#9A6B15` | Warnings, "held" dates |
| `--rust` / `--rust-tint` | `#8E2C1C` / `#F7E3DF` | Errors, "booked" dates |
| `--focus` | `#1F5F8B` | Focus ring — deliberately unrelated to any state colour |

Contrast: `--ink` on `--ground` is 14.8:1; `--ink-muted` on `--surface` 7.1:1; `--clay` on `--surface`
5.4:1; white on `--clay` 5.1:1. All ≥ AA for their sizes. Status is never signalled by colour alone —
every availability state also carries a shape (dot, strike, ring) and an `aria-label`.

Dark mode is intentionally out of scope for v1; every token is defined once on `:root` so adding a
`prefers-color-scheme` block later is a token-file change, not a component change.

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Fraunces** (variable serif, `opsz`/`SOFT`/`WONK`) | Headlines only, weight 500–600, tight tracking |
| Body / UI | **Manrope** | 400/500/600/700 |
| Numeric | Manrope with `font-variant-numeric: tabular-nums` | Calendars, prices, counts |

Fluid modular scale (1.200 mobile → 1.250 desktop), all `clamp()`:

| Token | Size | Use |
|---|---|---|
| `--text-2xs` | 0.6875rem | Overlines, badges |
| `--text-xs` | 0.75rem | Captions, legends |
| `--text-sm` | 0.875rem | Secondary UI |
| `--text-base` | 1rem | Body |
| `--text-lg` | clamp(1.0625, …, 1.125rem) | Lead paragraphs |
| `--text-xl` → `--text-4xl` | clamp() pairs | Headings h4 → h1 |
| `--text-display` | clamp(2.75rem, 6vw, 4.5rem) | Hero |

Measure is capped at `68ch` for prose. Line heights: 1.08 display, 1.2 headings, 1.6 body.
An **overline** pattern (0.6875rem, 600, `letter-spacing: .16em`, uppercase, `--ink-faint`) plus a
two-digit section index (`01`) opens every major section — the structural signature of the system.

## 4. Spacing, layout, radii

4px base step: `--space-1` 4px … `--space-16` 128px. Section rhythm: `--space-14` (96px) mobile,
`--space-16` (128px) desktop.

* Container: `max-width: 1180px`, gutters 20 / 32 / 48px at sm / md / lg.
* Grid: 12 columns, 24px gutter desktop, collapsing to 6 (tablet) and 4 (mobile).
* Breakpoints: `sm 480`, `md 768`, `lg 1024`, `xl 1280`.
* Radii: `--radius-xs 2px`, `--radius-sm 4px`, `--radius-md 6px`, `--radius-lg 8px`, `--radius-pill 999px`.
* Elevation: `--shadow-raised` (subtle, popovers), `--shadow-overlay` (modals). Nothing else.

## 5. Components

Every primitive is in `src/components/ui/`, is typed, forwards refs where it wraps a DOM node, and
takes no application knowledge.

* **Button** — variants `primary` (clay fill), `secondary` (ink outline), `ghost`, `link`,
  `danger`; sizes `sm | md | lg`; `loading` swaps the label for a spinner while preserving width and
  setting `aria-busy`; disabled never relies on colour alone.
* **Field / Input / Textarea / Select / Checkbox** — one `Field` wrapper owns label, hint, error,
  required marker and wiring of `id` / `aria-describedby` / `aria-invalid`. Inputs are 44px min
  target, 1px `--line` border, 2px `--focus` ring offset by 2px.
* **Stepper** — accessible numeric stepper (`role="group"`, live region announcing the value, min/max
  clamping, disabled reasons).
* **Card** — hairline-bordered surface; `interactive` variant lifts the border to `--line-strong` and
  translates the media 2px on hover; the whole card is one focusable link target.
* **Modal** — the only dialog primitive: portal, `role="dialog"` + `aria-modal`, focus trap, focus
  restore, Escape, scroll lock, `sm | md | lg | full` sizes, optional sticky footer.
* **Table** — `DataTable` with a hairline head rule, tabular numerals, zebra-free rows, an
  `overflow-x: auto` wrapper, and a caption for screen readers.
* **Skeleton / Spinner** — shimmer respects `prefers-reduced-motion` (falls back to a static tint).
* **Notice** — `info | success | warning | error`, icon + title + body + optional action; used for
  every backend error state.
* **Toast** — bottom-centre stack in a polite live region.
* **Tag / Overline / SectionHeading / Divider / Stat** — small typographic primitives.

Icons are an **original inline-SVG set** (`components/icons/`): 24×24 grid, 1.5px stroke, round caps,
`currentColor`, `aria-hidden` unless given a title. No icon library is bundled.

## 6. Interaction & motion

* Durations 120 / 180 / 240ms; easing `cubic-bezier(.2,.6,.2,1)`.
* Hover moves borders and backgrounds, never layout — except cards, which translate media by 2px.
* Focus is always visible: 2px `--focus` ring, 2px offset, never removed.
* Every animation, smooth scroll and shimmer is disabled under `prefers-reduced-motion: reduce`.
* Scroll-reveal is opacity + 12px translate, once, and is skipped entirely under reduced motion.

## 7. Responsive behaviour

| Surface | Mobile (<768) | Tablet (768–1023) | Desktop (≥1024) |
|---|---|---|---|
| Header | Logo + menu button → full-height drawer | Same | Inline nav + phone CTA |
| Hero | Stacked: type, then photo mosaic | Type over 2-col mosaic | 7/5 split |
| Stay grid | 1-up | 2-up | 3-up |
| Stay detail | Single column; reservation panel becomes a sticky bottom bar opening a sheet | Single column, inline panel | 8/4 split, sticky panel |
| Calendar | 1 month | 2 months | 2 months |
| Gallery | 1-up filmstrip | 2-up | Lead + filmstrip |
| Tables | Horizontal scroll with a shadow hint | Full | Full |

## 8. Accessibility baseline

Semantic landmarks (`header`/`nav`/`main`/`footer`), one `h1` per view, ordered headings, skip link,
visible focus, 44px targets, labelled controls, `aria-live` for async results, dialogs trapped and
restorable, colour never the sole signal, images with meaningful alt text (decorative ones
`alt=""`), and reduced-motion support throughout.
