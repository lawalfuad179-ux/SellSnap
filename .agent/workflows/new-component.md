---
description: Follow this workflow when you need to build a new React component for SellSnap.
---

# Workflow: Creating a New Component

When to use: Building any React component (Button, Card, Input, ProductCard, etc.)

## Step 1: Check First

Search `components/` for existing similar component. Extend instead of duplicating.

## Step 2: Decide Location

- Primitive (Button, Input, Badge) → `components/ui/`
- Product domain → `components/product/`
- Dashboard only → `components/dashboard/`
- Multi-domain → `components/shared/`
- Single use + complex → `app/.../_components/`

## Step 3: Load Context

Read:
1. `skills/component-builder/SKILL.md` — templates, patterns, CSS Modules
2. `rules/design-system.md` — tokens only (when needed)

## Step 4: Build

Use template from `skills/component-builder/SKILL.md`. No custom code here.

## Step 5: Verify

See `skills/component-builder/SKILL.md` for:
- Server vs client decision
- Accessibility checklist
- Testing (360px viewport)

## Step 6: Commit

- Named export
- className prop supported
- Tokens used (not hardcoded values)
- Works on mobile