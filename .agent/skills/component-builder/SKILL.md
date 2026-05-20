# Component Builder Skill

Load this skill whenever you are creating or modifying a React component in SellSnap. It tells you where the component goes, how it should be structured, and how to wire it up to the design system without reinventing anything.

## Before You Start

Read `.agents/rules/design-system.md` first. Components that do not follow the design system get rejected at review. This skill assumes you already know the tokens in `tokens/design-tokens.css`.

Then ask: does this component already exist? Search `components/` before adding a new one. Two slightly different `Button` components is how codebases rot.

## Where Components Live

```
components/
├── ui/                  primitives: Button, Input, Card, Badge, Avatar, etc.
├── product/             anything specific to the product domain (ProductCard, ProductImage, PriceTag)
├── dashboard/           anything that only exists inside the seller dashboard (OrdersTable, ProductList)
└── shared/              composites used across more than one domain (EmptyState, PageHeader)
```

If a component is used exactly once and it is complex, it can live next to the page that uses it in `app/.../_components/`. Promote it to `components/` when a second caller shows up.

## Component File Template

```tsx
// components/<folder>/<ComponentName>.tsx

import styles from './<ComponentName>.module.css';

type <ComponentName>Props = {
  children?: React.ReactNode;
  className?: string;
};

export function <ComponentName>({ children, className }: <ComponentName>Props) {
  return (
    <div className={className ? `${styles.container} ${className}` : styles.container}>
      {children}
    </div>
  );
}
```

Notes:
- Named export, not default export. Default exports make renaming harder and break auto-imports.
- `className` prop is always accepted on components that render a single root element. Append to component's base classes using a template literal.
- Props type goes above the component, named `<ComponentName>Props`.
- Required props come before optional ones in the type definition.

## Server vs. Client Components

Default to server components. A component becomes a client component only when it needs one of these:
- React state (`useState`, `useReducer`)
- Effects (`useEffect`, `useLayoutEffect`)
- Browser-only APIs (`window`, `document`, `localStorage`)
- Event handlers that are more than a simple link (`onClick`, `onChange`)
- Context consumption for interactivity

If you add `"use client"`, put it on the first line of the file. Do not add it defensively.

Keep the client boundary as low in the tree as possible. A page that is mostly static but has one interactive button should not be a client component; the button should be.

## Styling

Use CSS Modules with design tokens from `tokens/design-tokens.css`. No external libraries.

Import style file as:
```ts
import styles from './<ComponentName>.module.css';
```

Apply classes as:
```tsx
<div className={styles.container}>...</div>
```

Use CSS custom properties from tokens:
```css
.container {
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  font-family: var(--font-body-medium-font-family);
  font-size: var(--font-body-medium-font-size);
  border-radius: 8px;
  padding: 16px;
}
```

If spacing values are needed, they should be defined in the design tokens file.

## Using Design Tokens

Colors (use these, not hex values):
- `--color-primary`, `--color-on-primary`
- `--color-surface`, `--color-on-surface`
- `--color-background`, `--color-on-background`
- `--color-error`, `--color-on-error`
- `--color-outline`

Typography (use these tokens):
- `--font-display-large-*` through `--font-label-small-*`

Example:
```css
.button {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-label-large-font-family);
  font-size: var(--font-label-large-font-size);
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.button:hover {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}
```

## Variants

For components with variants (Button, Badge), use CSS custom properties with variant classes. No external libraries like class-variance-authority.

```css
/* Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-family: var(--font-label-large-font-family);
  font-size: var(--font-label-large-font-size);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants as modifier classes */
.primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
}

.primary:hover:not(:disabled) {
  background-color: var(--color-primary-container);
  color: var(--color-on-primary-container);
}

.secondary {
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  border: 1px solid var(--color-outline);
}

.secondary:hover:not(:disabled) {
  background-color: var(--color-surface-variant);
}

.ghost {
  background-color: transparent;
  color: var(--color-on-surface);
}

.ghost:hover:not(:disabled) {
  background-color: var(--color-surface-variant);
}

.danger {
  background-color: var(--color-error);
  color: var(--color-on-error);
}

.danger:hover:not(:disabled) {
  background-color: var(--color-error-container);
  color: var(--color-on-error-container);
}

/* Sizes */
.sm {
  padding: 4px 12px;
  font-family: var(--font-label-medium-font-family);
  font-size: var(--font-label-medium-font-size);
}

.md {
  padding: 8px 16px;
  font-family: var(--font-label-large-font-family);
  font-size: var(--font-label-large-font-size);
}

.lg {
  padding: 12px 24px;
  font-family: var(--font-body-large-font-family);
  font-size: var(--font-body-large-font-size);
}
```

```tsx
// components/ui/Button.tsx
import styles from './Button.module.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const variantClass = styles[variant];
  const sizeClass = styles[size];
  const combinedClass = `${styles.button} ${variantClass} ${sizeClass}${className ? ` ${className}` : ''}`;

  return (
    <button className={combinedClass} {...props}>
      {children}
    </button>
  );
}
```

## Accessibility

Every interactive element needs a keyboard-reachable focus state. Use `focus-visible` with an outline:
```css
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Buttons without visible text need `aria-label`. Icon-only buttons are the most common offender. Do not let them ship without a label.

Form inputs need associated labels via `htmlFor`/`id`. Error messages are linked via `aria-describedby`.

Images need `alt`. Decorative images use `alt=""`. Do not omit the attribute.

## Props to Avoid

- Do not expose raw color props (`color="red"`). Use variants.
- Do not expose raw size values in pixels. Use the size variants.
- Do not accept arbitrary inline styles via a `style` prop unless there is a specific reason (like a dynamic value that cannot be expressed in CSS).

## Testing a New Component

If the component is a primitive (lives in `ui/`), write a simple Storybook-style manual-check by importing it into `app/_dev/page.tsx` (a dev-only route gated by `NODE_ENV === 'development'`). Verify:
- Default appearance
- Every variant
- Every size
- Disabled state (if applicable)
- Focus state (tab into it)
- Hover state
- On mobile viewport (Chrome DevTools at 360px wide)

Domain components (product, dashboard) can be reviewed in place on the relevant page.

## What NOT to Do

- **Do NOT use Tailwind CSS.** This project uses CSS Modules with design tokens.
- **Do NOT use class-variance-authority or any other CSS-in-JS library.** Use plain CSS.
- **Do NOT use arbitrary values like `style={{ color: '#1A7F3C' }}`.** Use tokens.
- **Do NOT use pixel values.** Use tokens or CSS-calculated values.
- **Do NOT create a new primitive when an existing one would work with a new variant.** Extend, do not duplicate.

## Common Mistakes

- Creating a new primitive when an existing one would work with a new variant. Extend, do not duplicate.
- Forgetting `className` prop on a component that might need to be laid out differently in different places.
- Making a component a client component because it was easier, when a server component would have worked.
- Using pixel values instead of design tokens.
- Hardcoding colors instead of using design tokens.
- Adding complex logic inside the JSX. Extract to a named constant or helper above the return.