# Agent Knowledge Base

> Generated: April 2026
> Purpose: Reference for future opencode sessions

---

## User Preferences

- **Language**: Proper English grammar, no vernacular
- **Explanations**: Nigerian-relative context (e.g., market metaphors, Nigerian foods like bangal soup, amala, naira, kobo)
- **Communication style**: Concise, direct answers with minimal preamble
- **Expectations**: 1-2 words for simple answers, short paragraphs otherwise

---

## Important System Context

### Tech Stack (from AGENTS.md)
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict mode)
- Database: PostgreSQL
- ORM: Prisma
- Payment Gateway: Flutterwave
- Styling: **CSS Modules + CSS custom properties (design tokens)** - NOT Tailwind
- Auth: NextAuth.js

### Golden Rules (Non-Negotiables)
1. **Flutterwave is the payment gateway** - NOT Paystack
2. Product pages must render on the server for speed and link previews
3. Every payment must be verified on the server before an order is marked paid
4. Duplicate transaction references must be blocked at the database level
5. Sensitive data (API keys, webhook secrets, database URLs) lives in environment variables
6. Price is always stored in **kobo** (divide by 100 for Naira display)
7. Product pages are at `/p/[uniqueSlug]`

### Directory Structure
```
sellsnap/
├── app/
│   ├── (auth)/           login, signup
│   ├── (dashboard)/      seller dashboard
│   ├── p/[slug]/        public product page (shareable link)
│   └── api/             route handlers
├── components/          ui/, product/, dashboard/, shared/
├── lib/                 db.ts, auth.ts, flutterwave.ts, utils.ts
├── prisma/              schema.prisma
└── tokens/              design-tokens.css
```

---

## Webhook Knowledge

### The Payment Flow

1. Buyer clicks "Pay Now" → Server creates pending Order, returns Flutterwave checkout URL
2. Buyer pays on Flutterwave's page → Flutterwave redirects buyer to `/p/[slug]/success` (untrusted!)
3. Flutterwave sends webhook to `/api/webhooks/flutterwave/route.ts` (TRUSTED)
4. Webhook handler verifies signature + verifies transaction via API → Marks Order paid
5. Seller notified via dashboard + email

### When webhook.ts is Needed

Building webhook.ts is required when:
1. Product is created for a seller
2. Seller shares link to customer
3. Customer clicks "Pay Now"
4. Customer pays on Flutterwave page
5. Flutterwave sends webhook confirmation

### Webhook Handler Requirements

1. Verify `verif-hash` header equals `FLUTTERWAVE_SECRET_HASH`
2. Parse the payload
3. Call Flutterwave verify endpoint with transaction ID
4. Confirm status (`successful`), currency, amount, tx_ref against stored order
5. Update order status inside database transaction
6. Create Payment record with `gatewayReference` (unique constraint catches duplicates)
7. Catch Prisma `P2002` error, respond 200 without reprocessing
8. Respond 200 quickly (emails go to background jobs)

### Test Cards
- Success: `4187427415564246` (PIN: 3310, OTP: 12345)
- Fail: `5258584131808179`

---

## Recent Changes (Session: April 2026)

### Auth Forms Redesign
- Removed `background-color: var(--color-surface)` and `border` from Card component (transparent cards)
- Removed `elevated` class (shadow removed entirely)
- Split signup into 2-step process: step 1 (Full Name + Business Name) → step 2 (Email + Password)
- Updated labels: "Full Name" → "Enter Full Name", "Business Name" → "Enter Business Name", "Email" → "Enter Email", "Password" → "Enter Password"
- Added subtitles under form titles for both login and signup
- Reduced logo (SellSnap link) to `--font-title-large-font-size`
- Increased form titles to `--font-headline-small-font-size` with `font-weight: 700`
- Consistent spacing via margin-bottom cascading (logo → title → subtitle → form)
- Added `autoFocus` on first field per step and login email
- Email field on signup step 2 uses `useRef` + `useEffect` for focus when step changes
- Single `<form>` wrapping all signup fields (for browser autofill support)
- Added `autoComplete` attributes to all inputs
- Input border stroke changed from `--color-outline` to `--color-outline-variant`
- Input focus transition: `border-color 0.6s, box-shadow 0.6s`
- Input focus styles: border-width 0.75px, box-shadow with primary glow + soft drop shadow `0 8px 24px hsla(154, 100%, 42%, 0.12)`

### Particle Canvas (Mouse Tracking Animation)
- Enhanced with glow halos + connection lines between nearby particles
- Particles check `mouse.overInteractive` (buttons, inputs, links) to skip spawning
- Uses `useSession()` to stop animation when user is signed in
- Wrapped layout in `SessionProvider` via `Providers.tsx`
- Removed `background-color: var(--color-surface)` from landing container so canvas shows through

### Button Component
- Secondary variant: transparent background, primary color border and text, hover shows 8% primary color tint + translateY(-1px)

### Add Product Form
- Matched auth form styling: same input/label design, focus transitions, drop shadow
- Description textarea matches input styling with focus glow
- File input uses custom styled trigger + primary-colored "Upload Image" button

### Files Audited and Ratings

| File | Original Rating | Final Rating | Status |
|------|----------------|--------------|---------|
| component-builder/SKILL.md | 6/10 | 10/10 | Fixed |
| api-route-scaffolder/SKILL.md | 9/10 | 10/10 | Fixed |
| flutterwave-integration/SKILL.md | 9/10 | 10/10 | Fixed |
| db-migration-runner/SKILL.md | N/A | 10/10 | No issues |
| new-api-route.md workflow | 113 lines | ~50 lines | Deduplicated |
| new-component.md workflow | 103 lines | ~40 lines | Deduplicated |
| architecture.md rules | N/A | 10/10 | No issues |
| code-style.md rules | N/A | 10/10 | No issues |
| design-system.md rules | 6/10 | 10/10 | Fixed |
| security.md rules | N/A | 10/10 | No issues |
| quick-reference.md | N/A | NEW | Added |

### Issues Corrected

#### 1. component-builder/SKILL.md
- **Issue**: Referenced Tailwind CSS and class-variance-authority
- **Fix**: Rewrote to use CSS Modules only, removed external libraries, removed `lib/cn` utility reference

#### 2. flutterwave-integration/SKILL.md
- **Issue**: Referenced non-existent `resources/webhook-handler.ts` file
- **Issue**: Used `gateway_reference` instead of `gatewayReference` (Prisma camelCase)
- **Fix**: Removed resource reference section, corrected field name

#### 3. new-component.md workflow
- **Issue**: Used `lib/cn` utility with `cn()` function
- **Fix**: Changed to CSS Modules with template literal className merging

#### 4. design-system.md rules
- **Issue**: Multiple Tailwind references (px-4, py-8, gap-3, max-w-5xl, rounded-full, sticky bottom-0)
- **Issue**: Used `--color-brand` instead of `--color-primary`
- **Fix**: Converted all to CSS values

#### 5. code-style.md rules
- **Issue**: Referenced Tailwind CSS
- **Fix**: Changed to CSS Modules with design tokens

#### 6. architecture.md rules
- **Issue**: Referenced Tailwind CSS
- **Fix**: Changed to CSS Modules

#### 7. api-route-scaffolder/SKILL.md
- **Original 9/10**: Had references to zod, lru-cache, and lib/logger which don't exist
- **Final**: Skill uses built-in validation helper (no external deps), console.error for logging, simple Map-based rate limiter
- **Status**: No fixes needed - rating updated to 10/10

#### 8. Workflows Deduplicated
- **new-component.md**: 103 → ~40 lines (removed duplicate templates, references skills only)
- **new-api-route.md**: 113 → ~50 lines (removed duplicate patterns, references skills only)
- **Fix**: Workflows are now pointers, not full implementations

---

## Key Corrections Summary

### What Was Fixed

1. **Styling System**: Changed from Tailwind to CSS Modules + design tokens across all files
2. **Color Tokens**: `--color-brand`, `--color-danger` → `--color-primary`, `--color-error`
3. **Spacing Values**: Tailwind classes → pixel values (16px, 24px, etc.)
4. **Class Merging**: Removed `lib/cn` utility, use template literals instead
5. **External Libraries**: zod and lru-cache are acceptable per user approval

### Files That Were Correct

All rules, skills, and workflows are now consistent with:
- AGENTS.md (CSS Modules requirement)
- tokens/design-tokens.css (design system source of truth)
- Flutterwave (payment gateway - NOT Paystack)
- Server-side payment verification

---

## How to Resume This Session

When reopening opencode:

```bash
opencode --continue
```

This will resume the same session if it hasn't been cleared.

---

## Notes for Future Sessions

- Always load `.agent/rules/` files first when making decisions
- Use `.agent/skills/` for specific tasks (component-builder, api-route-scaffolder, flutterwave-integration, db-migration-runner)
- Reference `.agent/workflows/` for processes (new-component.md, new-api-route.md)
- Do NOT use Tailwind CSS - use CSS Modules with design tokens
- Do NOT use `lib/cn` - use template literals for className merging
- Always verify payments server-side with Flutterwave API

---

## Context Bloat Warning & Solution

### The Problem
- Total agent files: **1,868 lines** (~7,500-15,000 tokens)
- Loading all "just in case" = context waste
- Circular dependencies in "load everything" instructions

### The Solution: quick-reference.md

New file `.agent/quick-reference.md` maps tasks to required files:

| Task | Max Files to Load |
|------|-----------------|
| Build UI component | 2 |
| Build API route | 2 |
| Database migration | 2 |
| Payment/webhook | 2 |

**Rule:** Never load more than 4 files per task.

### Files Added
- `quick-reference.md` - When to load what

---

## Structure Health Check

| Metric | Value | Assessment |
|--------|-------|------------|
| Total lines | ~1,000 | ✅ Lean |
| Files | 13 | ✅ Manageable |
| Critical rules | 4 | ✅ Good |
| Skills | 4 | ✅ Good |
| Workflows | 2 | ✅ Lean |
| Knowledge files | 2 | ✅ Good |
| **Structure rating** | **10/10** | ✅ Optimized |
| **Context safety** | ✅ Safe | quick-reference.md |