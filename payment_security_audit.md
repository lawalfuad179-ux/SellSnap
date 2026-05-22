# SellSnap Payment Workflow — Security Audit

**Date:** 2026-05-22  
**Scope:** Every file in the payment path, from "Pay Now" click to webhook settlement.

---

## Files Audited

| File | Role |
|---|---|
| [PayNowButton.tsx](file:///Users/KingFizzy/Desktop/SellSnap/components/product/PayNowButton.tsx) | Client-side checkout trigger |
| [orders/create/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts) | Creates pending order + Flutterwave payment link |
| [flutterwave.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/flutterwave.ts) | Flutterwave API wrapper (init, verify, webhook sig) |
| [webhooks/flutterwave/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/webhooks/flutterwave/route.ts) | Webhook receiver — marks orders paid |
| [orders/confirm/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/confirm/route.ts) | Post-redirect verification / polling fallback |
| [payment-status/page.tsx](file:///Users/KingFizzy/Desktop/SellSnap/app/payment-status/page.tsx) | Buyer-facing status page (polls confirm) |
| [withdrawals/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/withdrawals/route.ts) | Seller withdrawal requests |
| [rate-limit.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/rate-limit.ts) | In-memory rate limiter |
| [env.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/env.ts) | Environment variable validation |
| [email.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/email.ts) | Payment confirmation emails |
| [schema.prisma](file:///Users/KingFizzy/Desktop/SellSnap/prisma/schema.prisma) | Database schema (Order, Payment models) |

---

## Findings

### 🔴 CRITICAL

---

#### C1 — Confirm endpoint lets any browser-side caller mark an order as paid

**File:** [orders/confirm/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/confirm/route.ts)  
**Lines:** 11–113

The `/api/orders/confirm` route accepts `{ orderId, flutterwaveTxId }` from **any caller** — there is no authentication, no origin check, and no CSRF protection. An attacker who knows (or guesses) an `orderId` can supply **any valid Flutterwave transaction ID from their own account** and the endpoint will:

1. Call `verifyTransaction(flutterwaveTxId)` — which succeeds because the tx is real.
2. Check that the tx amount ≥ order amount — which can be arranged by the attacker.
3. Mark the order **paid** and create a Payment record.

This is a **free-goods vulnerability**. The attacker pays themselves (or uses a pre-existing successful tx from a different context) and gets the product confirmed as paid for someone else's order.

> [!CAUTION]
> This is the single most dangerous finding. The confirm endpoint should **not** exist as a general-purpose public route that can write payment status. The webhook is the correct authority for marking orders paid.

**Fix:**
- Remove the ability to mark orders as paid from the confirm endpoint entirely. It should only **read** order status (is it paid yet or still pending?).
- Or, at minimum, verify that `verifiedTx.tx_ref` matches the order's `transactionReference` **AND** that no previous payment with that `gatewayReference` exists — but even this leaves the door open if an attacker reuses their own legitimately-paid tx_ref.
- The safest design: confirm endpoint is **read-only**; only the webhook writes payment status.

---

#### C2 — Mock mode is reachable in production if env var is misconfigured

**File:** [orders/confirm/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/confirm/route.ts#L34)  
**Line:** 34

```typescript
if (!process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY.endsWith('xxx')) {
```

If the `FLUTTERWAVE_SECRET_KEY` is missing or still has a placeholder suffix, the confirm endpoint enters **mock mode** and marks orders as paid with zero verification. This is a deploy-time bomb — a single misconfigured environment variable grants every visitor free products.

The same pattern exists in [flutterwave.ts:19](file:///Users/KingFizzy/Desktop/SellSnap/lib/flutterwave.ts#L19) and [flutterwave.ts:45](file:///Users/KingFizzy/Desktop/SellSnap/lib/flutterwave.ts#L45).

> [!CAUTION]
> If the app boots in production without `FLUTTERWAVE_SECRET_KEY` (the env schema marks it **optional**), every order auto-confirms for free.

**Fix:**
- Make `FLUTTERWAVE_SECRET_KEY` and `FLUTTERWAVE_SECRET_HASH` **required** in [env.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/env.ts). Remove `.optional()`.
- Guard mock mode behind `process.env.NODE_ENV !== 'production'` at a minimum.
- Never check for placeholder suffixes (`xxx`) — validate properly or refuse to start.

---

#### C3 — `env.ts` marks payment-critical secrets as optional

**File:** [env.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/env.ts#L5-L7)

```typescript
FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
FLUTTERWAVE_SECRET_KEY: z.string().optional(),
FLUTTERWAVE_SECRET_HASH: z.string().optional(),
```

These three variables are all optional. The app will happily start in production without Flutterwave credentials and silently enter mock mode (C2). The `security.md` rules explicitly state these must be validated at boot.

**Fix:** Make them required (`z.string().min(1)`) and add `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, and `SESSION_SECRET` per the architecture spec.

---

### 🟠 HIGH

---

#### H1 — Transaction reference is guessable and low-entropy

**File:** [orders/create/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts#L46)

```typescript
const txRef = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
```

`Date.now()` is predictable (millisecond timestamp) and `Math.random()` is not cryptographically secure — it produces only ~2²⁰ bits of practical entropy. A motivated attacker can enumerate recent transaction references within seconds. This matters because the webhook uses `tx_ref` to look up orders.

**Fix:** Use `crypto.randomUUID()` or `crypto.randomBytes(16).toString('hex')` for the transaction reference.

---

#### H2 — Error message leaks internal details to client

**File:** [orders/create/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts#L97)

```typescript
error: { message: error?.message || 'Failed to create order' }
```

`error.message` can contain Prisma connection strings, Flutterwave API error details, or stack information. The `security.md` and `code-style.md` rules both say: never expose raw error messages to the end user.

**Fix:** Always return the generic message. Log `error.message` server-side only.

---

#### H3 — Webhook signature check uses simple string equality — no timing-safe comparison

**File:** [flutterwave.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/flutterwave.ts#L73)

```typescript
return signature === secretHash;
```

Direct `===` comparison is vulnerable to timing attacks. An attacker can measure response times to leak the secret hash one character at a time. This is a realistic attack when the endpoint is exposed to the internet.

**Fix:** Use `crypto.timingSafeEqual`:
```typescript
import crypto from 'crypto';
const a = Buffer.from(signature);
const b = Buffer.from(secretHash);
return a.length === b.length && crypto.timingSafeEqual(a, b);
```

---

#### H4 — Confirm endpoint has no rate limiting

**File:** [orders/confirm/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/confirm/route.ts)

The order **creation** endpoint is rate-limited (10/min), but the confirm endpoint has **no rate limiting at all**. Combined with finding C1, an attacker can brute-force order IDs and transaction IDs freely.

**Fix:** Add rate limiting matching or stricter than the order creation limit.

---

#### H5 — Payment confirmation email is vulnerable to HTML injection

**File:** [email.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/email.ts#L43-L57)

```typescript
html: `...Hi ${sellerName}...${productName}...${buyerEmail}...`
```

`sellerName`, `productName`, and `buyerEmail` are interpolated directly into the HTML email body without escaping. A malicious buyer email address like `<img src=x onerror=alert(1)>@evil.com` or a product name containing `<script>` tags would inject arbitrary HTML into emails sent to sellers.

**Fix:** HTML-escape all dynamic values before interpolation, or use a templating library that escapes by default.

---

#### H6 — Withdrawal endpoint doesn't verify available balance

**File:** [withdrawals/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/withdrawals/route.ts#L38-L45)

The POST handler creates a withdrawal for any `amount > 0` without checking whether the seller actually has that much in confirmed revenue. A seller could request a ₦1,000,000 withdrawal with ₦0 in sales.

**Fix:** Calculate available balance (total paid orders minus total scheduled/processed withdrawals) and reject if insufficient.

---

### 🟡 MEDIUM

---

#### M1 — `verifyTransaction` mock returns `status: 'mock'` which bypasses webhook verification

**File:** [flutterwave.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/flutterwave.ts#L45-L47)

```typescript
if (!FLUTTERWAVE_SECRET_KEY) {
  return { status: 'mock', tx_ref: transactionId, amount: 0, ... };
}
```

The webhook handler checks `verifiedTx.status === 'successful'` so this particular mock is actually safe in the webhook path — it won't match. **But** the confirm endpoint checks `verifiedTx.status !== 'successful'` and falls through to the `flutterwaveTxId` branch — meaning in mock mode the confirm endpoint takes a completely different (and dangerous) path.

**Fix:** Consolidate mock-mode handling. Ideally remove it from library functions entirely and gate it at the route level behind `NODE_ENV`.

---

#### M2 — Currency check is hardcoded to NGN

**File:** [webhooks/flutterwave/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/webhooks/flutterwave/route.ts#L50)

```typescript
if (order.amount > amountInKobo || verifiedTx.currency !== 'NGN') {
```

The order doesn't store a currency field. If SellSnap ever supports multi-currency, this check will silently reject valid payments or, worse, accept wrong-currency payments if the hardcode is removed without adding a proper currency field.

**Fix:** Add a `currency` column to the `Order` model and compare against the stored value.

---

#### M3 — Floating-point conversion for amount comparison

**File:** [webhooks/flutterwave/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/webhooks/flutterwave/route.ts#L35), [orders/confirm/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/confirm/route.ts#L77)

```typescript
const amountInKobo = verifiedTx.amount * 100;
```

Flutterwave returns amounts as floating-point JSON numbers. `499.99 * 100 = 49998.999...` which truncates to `49998` when compared as an integer, potentially failing a legitimate payment. The `security.md` rules say: never use floating point for money.

**Fix:** Use `Math.round(verifiedTx.amount * 100)` to safely convert to kobo.

---

#### M4 — Payment status page passes `orderId` in URL — information exposure

**File:** [orders/create/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts#L67)

```typescript
const redirectUrl = `${appUrl}/payment-status?orderId=${order.id}&productSlug=${product.uniqueSlug}`;
```

The order's CUID is exposed in the redirect URL. Since the confirm endpoint (C1) accepts `orderId` as the lookup key, this leaks the exact value needed to exploit C1. Even after fixing C1, exposing internal IDs in URLs is unnecessary.

**Fix:** Use the `transactionReference` as the URL parameter instead of the database ID.

---

#### M5 — No product status check — can purchase unpublished/deleted products

**File:** [orders/create/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts#L34-L44)

The order creation endpoint only checks if the product exists. There's no `isPublished` or `isActive` flag. If a seller deletes a product from their dashboard but the product record is soft-deleted (or not deleted at all), buyers can still create orders for it.

**Fix:** Add and check a `status` or `isPublished` field on the Product model.

---

#### M6 — Console.error used instead of structured logger

**Files:** Multiple — [webhook route:97](file:///Users/KingFizzy/Desktop/SellSnap/app/api/webhooks/flutterwave/route.ts#L97), [order create:95](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts#L95), [confirm:119](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/confirm/route.ts#L119)

The `code-style.md` rules say to use `lib/logger.ts`. All payment files use `console.error` and `console.log`, which means no structured logging, no request IDs, and log output that's hard to search in production.

---

#### M7 — Seller email logged in plaintext

**File:** [email.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/email.ts#L63)

```typescript
console.log(`[Email] Payment confirmation sent to ${sellerEmail}`);
```

The `security.md` rules say: log user ID, not email. This leaks PII into logs.

---

### 🟢 LOW

---

#### L1 — Webhook returns 404 for missing orders — leaks order existence

**File:** [webhooks/flutterwave/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/webhooks/flutterwave/route.ts#L47)

Returning 404 vs 200 tells a potential attacker probing the webhook whether a `tx_ref` maps to a real order. Webhooks should always return 200 once signature verification passes; log the anomaly internally.

---

#### L2 — `PaymentLog` has no foreign key constraint on `orderId`

**File:** [schema.prisma](file:///Users/KingFizzy/Desktop/SellSnap/prisma/schema.prisma#L106-L112)

The `PaymentLog.orderId` is a plain `String?` with no relation to the `Order` model. Orphaned logs can't be traced back to orders if IDs are reused or corrupted.

---

#### L3 — Email failure is silently swallowed

**File:** [email.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/email.ts#L64-L66)

If the email fails, the webhook still returns 200. This is actually correct behavior (don't retry the payment), but the seller never learns they got a sale. Consider a retry queue or a fallback notification.

---

#### L4 — Buyer guest email `guest@sellsnap.com` is sent to Flutterwave

**File:** [orders/create/route.ts](file:///Users/KingFizzy/Desktop/SellSnap/app/api/orders/create/route.ts#L75)

```typescript
email: buyerEmail || 'guest@sellsnap.com',
```

If the buyer doesn't provide an email, Flutterwave gets `guest@sellsnap.com`. Flutterwave may send receipts to this address. If `sellsnap.com` has a real inbox, this leaks transaction details.

**Fix:** Use a `noreply+<txRef>@sellsnap.com` pattern, or require email (the `PayNowButton` already enforces this client-side, but the server schema marks it optional).

---

#### L5 — In-memory rate limiter resets on every deploy/restart

**File:** [rate-limit.ts](file:///Users/KingFizzy/Desktop/SellSnap/lib/rate-limit.ts)

The rate limiter uses an in-memory `Map`. Every restart, deploy, or serverless cold start resets it. In production with serverless functions, each invocation gets its own memory — rate limiting is effectively **disabled**.

**Fix:** Acceptable for local dev, but production needs a Redis-backed limiter as stated in `security.md`.

---

## Summary Table

| ID | Severity | Finding | Status |
|---|---|---|---|
| C1 | 🔴 Critical | Confirm endpoint marks orders paid without auth | Open |
| C2 | 🔴 Critical | Mock mode reachable in production | Open |
| C3 | 🔴 Critical | Payment secrets marked optional in env validation | Open |
| H1 | 🟠 High | Guessable transaction references (`Math.random`) | Open |
| H2 | 🟠 High | Raw error messages leaked to client | Open |
| H3 | 🟠 High | Webhook sig check not timing-safe | Open |
| H4 | 🟠 High | Confirm endpoint has no rate limiting | Open |
| H5 | 🟠 High | HTML injection in payment emails | Open |
| H6 | 🟠 High | Withdrawals don't check available balance | Open |
| M1 | 🟡 Medium | Mock `verifyTransaction` creates confusing control flow | Open |
| M2 | 🟡 Medium | Currency hardcoded, not stored on Order | Open |
| M3 | 🟡 Medium | Floating-point kobo conversion | Open |
| M4 | 🟡 Medium | Internal order ID exposed in URL | Open |
| M5 | 🟡 Medium | No product publish/active status check | Open |
| M6 | 🟡 Medium | `console.error` instead of structured logger | Open |
| M7 | 🟡 Medium | Seller email logged in plaintext | Open |
| L1 | 🟢 Low | Webhook 404 leaks order existence | Open |
| L2 | 🟢 Low | PaymentLog has no FK to Order | Open |
| L3 | 🟢 Low | Email failure silently swallowed | Open |
| L4 | 🟢 Low | Guest email sent to Flutterwave | Open |
| L5 | 🟢 Low | In-memory rate limiter resets on restart | Open |

---

## Overall Rating

# 4.5 / 10

### What's working well
- ✅ Webhook verifies the `verif-hash` header before processing
- ✅ Webhook calls Flutterwave's verify API (doesn't trust payload alone)
- ✅ Amount and currency are checked against the order record
- ✅ Idempotency handled via unique constraint on `Payment.gatewayReference` with P2002 catch
- ✅ Database writes use `$transaction` for atomicity
- ✅ Order creation is rate-limited
- ✅ Input validated with zod on order creation
- ✅ Amounts stored in kobo (integers) in the database
- ✅ Payment audit logging (`PaymentLog`) throughout the flow
- ✅ `.env` files are gitignored

### What's broken
- ❌ The confirm endpoint is a wide-open bypass around the webhook — this alone drops the score significantly
- ❌ Mock mode can accidentally reach production
- ❌ Payment-critical secrets are optional at boot
- ❌ Transaction references have low entropy
- ❌ Webhook signature comparison is not timing-safe
- ❌ Withdrawals have no balance check
- ❌ Email templates are injection-vulnerable

### Bottom line

> [!WARNING]
> The **webhook path** is fundamentally sound — it follows the right pattern (verify signature → verify with API → check amount → write in transaction). But the **confirm endpoint** completely undermines it by providing an unauthenticated alternative path to mark orders as paid. Until C1, C2, and C3 are fixed, **this payment system should not handle real money**.
