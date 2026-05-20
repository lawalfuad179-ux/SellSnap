---
description: Follow this workflow when you need to add a new API route or server action to SellSnap.
---

# Workflow: Creating a New API Route

When to use: Building any API route handler or server action

## Step 1: Decide Type

- Dashboard UI form submit → **server action** (`actions.ts`)
- Public client / webhook / third party → **route handler** (`route.ts`)

## Step 2: Check Data Model

Sketch: fields in → validation → table reads/writes → success/failure envelope.

If money involved: see `skills/flutterwave-integration/SKILL.md` for idempotency.

## Step 3: Load Context

Read:
1. `skills/api-route-scaffolder/SKILL.md` — templates, validation helper, patterns
2. `rules/architecture.md` — directory structure (when needed)
3. `rules/security.md` — payment/auth rules (when needed)

## Step 4: Build

Use template from `skills/api-route-scaffolder/SKILL.md`. No custom code here.

## Step 5: Test

See `skills/api-route-scaffolder/SKILL.md` for:
- Happy path
- Error paths (400, 401, 403)
- Idempotency check
- Rate limiting (if public)

## Step 6: Verify Security

See `skills/api-route-scaffolder/SKILL.md` for checklist:
- [ ] Input validated
- [ ] Session checked
- [ ] Ownership check
- [ ] Rate limit (if public)
- [ ] No raw errors
- [ ] Idempotency (if payment)

## Step 7: Commit

- Envelope: `{ ok: true, data }` / `{ ok: false, error: { code, message } }`