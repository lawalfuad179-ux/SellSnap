@AGENTS.md

# SellSnap

A Next.js 16 marketplace where sellers create a product, get a shareable link (`/p/[slug]`), buyers pay via Flutterwave, sellers withdraw to a Nigerian bank account. Currency is NGN; **all monetary amounts are stored in kobo (1 NGN = 100 kobo)**.

## Stack

- **Next.js 16.2.4** (App Router) + **React 19.2.4** — see `AGENTS.md`; this is not the Next.js in your training data. `params` is a `Promise` and must be awaited (see [app/(dashboard)/[...view]/page.tsx](app/(dashboard)/[...view]/page.tsx#L11-L13)).
- **NextAuth v4** (`next-auth@4.24.14`) — **not v5/Auth.js**. Config in [lib/auth.ts](lib/auth.ts), credentials provider, JWT session strategy. Use `getSession()` (wraps `getServerSession(authOptions)`) in server code.
- **Prisma 6** with **dual schema** — `prisma/schema.prisma` (SQLite, dev) and `prisma/schema.postgres.prisma` (Postgres, prod). `npm run vercel-build` copies postgres → schema.prisma before `next build`. If you change the data model, **edit both files**.
- **Zod 4** for validation. API routes and server actions both `safeParse` and surface `error.issues[0].message`.
- **Flutterwave** for payments ([lib/flutterwave.ts](lib/flutterwave.ts)). **Mock mode** kicks in when `FLUTTERWAVE_SECRET_KEY` is missing or ends with `xxx` — `initializePayment` returns a fake redirect link with `?mock=true`. Don't remove that path.
- **Resend** for email (optional — code degrades silently if `RESEND_API_KEY` missing).
- **bcryptjs** for password hashing (10 rounds).

No test runner, no CI. Don't add `expect(...)`-style tests unless asked.

## Layout

- `app/` — App Router
  - `app/(dashboard)/` — authed routes. `[...view]/page.tsx` is a catch-all that dispatches to `views/{dashboard,products,orders,profile,settings}-view.tsx`. Add a new tab by updating the switch and adding a view file.
  - `app/(dashboard)/actions.ts` — server actions (`'use server'`). Return shape is `{ ok: true, data } | { ok: false, error: { message } }` — match it.
  - `app/p/[slug]/page.tsx` — public product page
  - `app/payment-status/page.tsx` — Flutterwave redirect lands here, calls `/api/orders/confirm`
  - `app/api/` — route handlers (auth, orders/{create,confirm,revenue}, webhooks/flutterwave, upload/avatar, bank-account, withdrawals, notifications)
- `components/` — grouped by domain (`auth/`, `product/`, `dashboard/`, `orders/`, `notifications/`, `settings/`, `avatar/`, `theme/`, `effects/`, `ui/`)
- `lib/` — `auth.ts`, `db.ts` (Prisma singleton), `env.ts` (Zod-validated env), `flutterwave.ts`, `email.ts`, `storage.ts`, `slug.ts`, `rate-limit.ts`, `validators/`
- `prisma/` — both schemas + committed `dev.db`
- `public/uploads/` — user uploads land here (avatars, product images). The repo currently tracks these.
- `tokens/` — Figma design tokens consumed via CSS custom properties in `app/globals.css`

## Conventions

- **Money in kobo.** UI input is NGN; server multiplies by 100 before insert (see [app/(dashboard)/actions.ts:50](app/(dashboard)/actions.ts#L50)). Display divides by 100. Don't store NGN floats.
- **Server action return shape:** `{ ok, data?, error? }`. Client code branches on `ok`.
- **Slug generation:** [lib/slug.ts](lib/slug.ts) — lowercases, hyphenates, collides by appending a 5-char random suffix, then `${name}-${Date.now()}` as last-resort fallback.
- **File uploads:** [lib/storage.ts](lib/storage.ts) writes to `public/uploads/{uuid}.{ext}` via `fs.writeFileSync`. Comment notes S3/Cloudinary is the prod target — flag if you're about to add another local-disk path.
- **Rate limiting:** in-memory `Map` in [lib/rate-limit.ts](lib/rate-limit.ts) — `authRateLimiter` (5/min) and `orderRateLimiter` (10/min). Resets per process; doesn't survive deploys or scale across instances.
- **Prisma client:** import `prisma from '@/lib/db'` — singleton pattern with `globalThis.prismaGlobal` to avoid dev hot-reload connection leaks.
- **Env access:** import from [lib/env.ts](lib/env.ts) when possible; it Zod-validates at module load and throws on missing required vars (`DATABASE_URL`, `NEXTAUTH_SECRET`).
- **Path alias:** `@/*` → repo root (see `tsconfig.json`).
- **`next.config.ts`** allows server actions up to 10mb and whitelists `192.168.100.27` as a dev origin (LAN device testing). Don't drop that without checking.

## Payment flow

1. Buyer on `/p/[slug]` enters email → [components/product/PayNowButton.tsx](components/product/PayNowButton.tsx) POSTs `/api/orders/create`.
2. [app/api/orders/create/route.ts](app/api/orders/create/route.ts) rate-limits, validates, creates `Order { status: pending, transactionReference }`, calls `initializePayment` → returns `checkoutUrl`.
3. Browser redirects to Flutterwave (or mock URL in dev).
4. Two confirmation paths run in parallel:
   - **Webhook:** [app/api/webhooks/flutterwave/route.ts](app/api/webhooks/flutterwave/route.ts) — `verifyWebhookSignature` checks the header against `FLUTTERWAVE_SECRET_HASH` (plain string compare, per Flutterwave's spec), then verifies, then writes `Payment` + flips `Order.status` to `paid`, then notifies seller.
   - **Client redirect:** `/payment-status?orderId=…&tx_ref=…&transaction_id=…` calls `/api/orders/confirm` ([app/api/orders/confirm/route.ts](app/api/orders/confirm/route.ts)) which does the same verification.
5. Both paths must be **idempotent** — handle Prisma `P2002` (unique constraint on `Payment.orderId` / `gatewayReference`) as success, not error.

## Auth flow

- Signup → `POST /api/auth/signup` (hashes + creates user) → user signs in via NextAuth credentials.
- Forgot password → `POST /api/auth/forgot-password` creates `PasswordResetToken` (1h expiry) and emails reset link.
- Reset → `/auth/reset-password/[token]` → `POST /api/auth/reset-password` updates hash, marks token `used`.
- Onboarding state lives on `User.onboardingStep` / `User.onboardingComplete`; routes under `/api/auth/onboarding-*`.
- Session augmented with `id` and `businessName` via NextAuth callbacks (cast through `as any` — see [lib/auth.ts:50-60](lib/auth.ts#L50-L60)).

## Data model (Prisma)

`User`, `BankAccount` (1:1), `Withdrawal` (status: `scheduled|processed|cancelled`), `Product` (unique `uniqueSlug`), `Order` (enum status: `pending|paid|failed`, unique `transactionReference`), `Payment` (unique `orderId` + `gatewayReference`), `PasswordResetToken`, `Notification`. Money fields are `Int` kobo.

## Commands

```bash
npm run dev           # next dev --hostname 0.0.0.0
npm run build         # next build (uses current schema.prisma)
npm run vercel-build  # swap postgres schema → generate → db push → build
npm run lint          # eslint
npm run secret        # crypto.randomBytes(32).toString('hex') — for NEXTAUTH_SECRET
# `postinstall` runs `prisma generate` automatically
```

Local Postgres: `docker compose up -d postgres` (image `postgres:16`, db `sellsnap`, user/pass `postgres/postgres`, port 5432).

## Env vars

Required: `DATABASE_URL`, `NEXTAUTH_SECRET`.
Optional: `NEXT_PUBLIC_APP_URL` (defaults to `http://localhost:3000`), `FLUTTERWAVE_{PUBLIC_KEY,SECRET_KEY,SECRET_HASH}`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. See `.env.example`.

## Known rough edges

- `prisma/dev.db` is committed; `.gitignore` covers `.env*` and `node_modules` but **not** `public/uploads/` — user uploads end up in the working tree.
- Recent commit subjects are all literal "Recent" — don't use `git log` for narrative context.
- No automated tests or CI. Manually verify payment flow with mock mode before claiming a fix works.
- Rate limiter is in-process only.

## Reference

Always consult [node_modules/next/dist/docs/](node_modules/next/dist/docs/) before touching App Router APIs — the local copy matches the installed version (16.2.4), your training data does not.
