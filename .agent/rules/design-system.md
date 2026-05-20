---
trigger: always_on
---

# Rule: Design System

## Token Files Are the Source of Truth

The project has one design token file. The agent must never modify it:

- `tokens/design-token.css` — all color values, all font sizes, weights, line heights, and font families

The token file export CSS custom properties (CSS variables) that are available globally.

## Mandatory: Use CSS Variables, Never Raw Values

The agent must never write hardcoded color values or typography values anywhere in this codebase.

**Wrong:**
```css
color: #1a1a1a;
font-size: 16px;
font-family: 'Inter', sans-serif;
background: #f5f5f5;
```

**Correct:**
```css
color: var(--color-text-primary);
font-size: var(--font-size-base);
font-family: var(--font-family-base);
background: var(--color-surface);
```

Before writing any style value, check the token files. If a variable exists for what you need, use it. If it does not exist, ask before inventing a new value.

Dark mode is a launch feature. check the token files for light and dark mode color values, ask the developer if you need to modify a color for accessibility.

## Spacing Scale

Use multiples of 4px for all spacing (margin, padding, gap). Do not use arbitrary values.

Allowed: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`

Be generous with whitespace, especially on mobile. A cramped interface feels cheap. A spacious one feels considered.

Common patterns:
- Page padding on mobile: `16px` (4 × 4px)
- Page padding on desktop: `24px` (4 × 6px), max content width `640px` for product pages, `1280px` for dashboard
- Section spacing: `32px` (4 × 8px) to `48px` (4 × 12px)
- Card padding: `16px` on mobile, `24px` on desktop
- Gap between related items: `12px` (4 × 3px)
- Gap between unrelated sections: `32px` (4 × 8px) or more


## Border Radius

The product has a consistent border radius. Use these values only:

- Small elements (badges, tags): `4px`
- Buttons and inputs: `8px`
- Cards and modals: `12px`


## Styling Method

- All component styles use CSS Modules (`.module.css` files).
- No inline `style={{}}` props except for truly dynamic values that cannot be expressed in CSS (e.g., a progress bar width driven by a number).
- No Tailwind. No styled-components. CSS Modules only.


## Design Principles

**Speed first.** If a visual choice slows down the page, it loses. No loading spinners on the product page. No blocking fonts. No animations on the critical path.

**Mobile first.** Design for a 360px-wide screen and scale up. A buyer reading WhatsApp on a $100 Android phone is the default user, not a designer on a 27-inch monitor. Every component must be built mobile-first:

- Default styles target mobile (small screens).
- Use `@media (min-width: 768px)` to layer in desktop styles.
- Touch targets must be a minimum of 44px tall.
- The product checkout page (`/p/[slug]`) must be fully functional on a 375px viewport.

**Trust through clarity.** Clean typography, generous spacing, real product imagery, and obvious call-to-action buttons. Nothing clever that makes the buyer wonder if they are on a scam page.

**Calm over clever.** No shadows stacked on shadows. No gradients for their own sake. No dark patterns around the "Pay Now" button. The interface should feel like it was built by adults who respect the buyer's time.


## Components

Primitives live in `components/ui/`. Compose them, do not replicate them.

### Button

Three variants: `primary`, `secondary`, `ghost`. One destructive variant: `danger`. Three sizes: `sm`, `md`, `lg`. The default is `md`. The "Pay Now" button on the product page is always `primary` and `lg`.

- Primary: filled with `--color-primary`, white text.
- Secondary: `--color-surface` background, `--color-on-surface` text, `--color-outline` border.
- Ghost: transparent, `--color-on-surface` text, no border until hover.
- Danger: filled with `--color-error`, white text.

Buttons are full-width on mobile when they are the primary action on a screen. A full-width "Pay Now" button is easier to tap than a centered small one.

### Input

Single input style. Label sits above the input, not inside it. Placeholder text is never a substitute for a label. Error messages appear below the input in `--color-error`, with a small icon. Focused state uses a `--color-primary` ring.

Inputs are at least 44px tall on mobile to meet touch target guidelines. Do not shrink them to save space.

### Card

Rounded corners (`12px`), subtle border (`border-[--color-outline]`), no drop shadow by default. Add a subtle shadow only when a card needs to float above a busy background.

### Badge

Used for order status. `pending` is warning, `paid` is success, `failed` is danger. Small, fully rounded (`border-radius: 9999px` or similar), uppercase text at 10px.

## Product Page Layout

This is the most important page. Follow the layout exactly:

1. Product image fills the top of the viewport, 1:1 aspect ratio on mobile, 4:3 or 1:1 on desktop depending on the image.
2. Seller's business name sits just below the image in `text-body-sm`, muted.
3. Product name in `text-display`.
4. Price in `text-h1`, bold, with currency symbol (`₦`) and comma grouping.
5. Description in `text-body`.
6. "Pay Now" button, full-width, `primary` variant, `lg` size, anchored to the bottom of the viewport on mobile via `position: sticky; bottom: 0;`.

The total above-the-fold content on mobile should be: image, name, price, Pay Now button. Description sits below the fold but should be reachable with one scroll.

## Dashboard Layout

Left sidebar on desktop with Products, Orders, Settings. Collapses to a top bar on mobile. The main content area is a single column with `max-width: 1280px`. Do not build multi-column dashboards; the data is simple and a single column is easier to scan.

## Iconography

Lucide React. One icon library, no mixing. Icons are 20px inside buttons, 24px in nav, 16px inline with text. Icons always have an accessible label via `aria-label` or visible text.

## Accessibility

Every interactive element is reachable by keyboard. Focus states are visible and use `--color-primary`. Color contrast meets WCAG on both modes.

Form inputs have associated labels. Error messages are linked to their inputs with `aria-describedby`. Buttons have text or an `aria-label`.

Images have `alt` text. Product images use the product name as alt text. Decorative images use `alt=""`.

## What Not to Do

- Do not add skeumorphic effects, glassmorphism, or neumorphism. They go out of style fast and cost performance.
- Do not use more than two font weights in a single screen (regular and bold is usually enough, plus semibold for headings).
- Do not center-align body text. Left-align everything except buttons and single-line headings.
- Do not build carousels on the product page. One product, one image, one price. Carousels hurt conversion.
- Do not stack multiple modals. If a flow needs two decisions, it needs two pages.
