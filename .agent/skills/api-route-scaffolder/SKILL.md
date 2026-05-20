# API Route Scaffolder Skill

Load this skill when creating or modifying a Next.js route handler (`app/api/**/route.ts`) or a server action. It tells you the exact shape every route should have in SellSnap, so routes behave consistently whether they handle a login, an order creation, or a webhook.

## Before You Start

Read `.agents/rules/architecture.md` and `.agents/rules/security.md`. This skill assumes you know the difference between a server action and a route handler, and it assumes you will validate input and handle errors the way those rules describe.

Ask: should this be a server action or a route handler?
- **Server action** if the caller is our own dashboard UI and the action is a form submit or a UI-triggered mutation.
- **Route handler** if the caller is a public client (the product page), a third party (Flutterwave webhook), or another service.

Server actions are the default for internal writes. Route handlers are for external boundaries.

## Route Handler Template

### POST (Create/Update)
```ts
// app/api/<resource>/<action>/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

type Success<T> = { ok: true; data: T };
type Failure = { ok: false; error: { code: string; message: string } };

function validateInput<T>(body: unknown, schema: Record<keyof T, string>): { success: true; data: T } | { success: false; error: string } {
  const errors: string[] = [];
  for (const [key, type] of Object.entries(schema)) {
    const value = (body as Record<string, unknown>)[key];
    if (type === 'string' && typeof value !== 'string') errors.push(`${key} must be a string`);
    if (type === 'number' && typeof value !== 'number') errors.push(`${key} must be a number`);
    if (type === 'string.email' && typeof value !== 'string') errors.push(`${key} must be a string`);
    if (type === 'string.email' && value && !value.includes('@')) errors.push(`${key} must be a valid email`);
  }
  if (errors.length > 0) return { success: false, error: errors.join(', ') };
  return { success: true, data: body as T };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Request body is required.' } },
        { status: 400 }
      );
    }

    const validated = validateInput<{ name: string; price: number }>(body, { name: 'string', price: 'number' });
    if (!validated.success) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: validated.error } },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } },
        { status: 401 }
      );
    }

    const result = await db.product.create({
      data: {
        name: validated.data.name,
        price: validated.data.price,
        userId: session.userId,
      },
    });

    return NextResponse.json<Success<typeof result>>({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    console.error('api.product.create.failed', { error });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    );
  }
}
```

### GET (Read)
```ts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));

    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } },
        { status: 401 }
      );
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { userId: session.userId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({ where: { userId: session.userId } }),
    ]);

    return NextResponse.json<Success<{ products: typeof products; total: number; page: number; limit: number }>>({
      ok: true,
      data: { products, total, page, limit },
    });
  } catch (error) {
    console.error('api.product.list.failed', { error });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    );
  }
}
```

### PATCH (Partial Update)
```ts
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'Request body is required.' } },
        { status: 400 }
      );
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } },
        { status: 401 }
      );
    }

    const params = await context.params;
    const existing = await db.product.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'not_found', message: 'Product not found.' } },
        { status: 404 }
      );
    }

    const validated = validateInput<{ name?: string; price?: number }>(body, {
      name: 'string',
      price: 'number',
    });
    if (!body.name && !body.price) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'invalid_input', message: 'At least one field to update is required.' } },
        { status: 400 }
      );
    }

    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        ...(validated.data.name && { name: validated.data.name }),
        ...(validated.data.price && { price: validated.data.price }),
      },
    });

    return NextResponse.json<Success<typeof updated>>({ ok: true, data: updated });
  } catch (error) {
    console.error('api.product.update.failed', { error });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    );
  }
}
```

### DELETE (Remove)
```ts
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } },
        { status: 401 }
      );
    }

    const params = await context.params;
    const existing = await db.product.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== session.userId) {
      return NextResponse.json<Failure>(
        { ok: false, error: { code: 'not_found', message: 'Product not found.' } },
        { status: 404 }
      );
    }

    await db.product.delete({ where: { id: params.id } });
    return NextResponse.json<Success<null>>({ ok: true, data: null });
  } catch (error) {
    console.error('api.product.delete.failed', { error });
    return NextResponse.json<Failure>(
      { ok: false, error: { code: 'server_error', message: 'Something went wrong. Please try again.' } },
      { status: 500 }
    );
  }
}
```

## Validation Helper

Use a simple validation function inline or extract to `lib/validation.ts`:

```ts
type FieldType = 'string' | 'number' | 'boolean' | 'string.email';

function validateInput<T extends Record<string, unknown>>(
  body: unknown,
  schema: Record<keyof T, FieldType>
): { success: true; data: T } | { success: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Request body must be an object' };
  }

  const errors: string[] = [];
  const data = {} as T;

  for (const [key, type] of Object.entries(schema)) {
    const value = (body as Record<string, unknown>)[key];
    const keyStr = key as string;

    if (value === undefined || value === null) {
      errors.push(`${keyStr} is required`);
      continue;
    }

    if (type === 'string' && typeof value !== 'string') {
      errors.push(`${keyStr} must be a string`);
    } else if (type === 'number' && typeof value !== 'number') {
      errors.push(`${keyStr} must be a number`);
    } else if (type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${keyStr} must be a boolean`);
    } else if (type === 'string.email' && (typeof value !== 'string' || !value.includes('@'))) {
      errors.push(`${keyStr} must be a valid email`);
    } else {
      (data as Record<string, unknown>)[keyStr] = value;
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join(', ') };
  }

  return { success: true, data };
}
```

## The Rules

**Always validate input.** The request body, query params, and path params all come from outside and cannot be trusted. Use the validation helper above - it's lightweight and has no external dependencies.

**Always authenticate before authorizing.** Check the session exists, then check the session has permission to do the thing. Authorization is always per-resource. "Can this user edit this product?" means checking `product.userId === session.userId`, not just "is this user signed in?"

**Always return a consistent envelope.** Success is `{ ok: true, data }`. Failure is `{ ok: false, error: { code, message } }`. The client parses the same shape everywhere, which keeps error handling simple.

**Never return raw error messages.** Log the real error on the server (using `console.error` with structured keys), return a sanitized message to the client. A Prisma error message might reveal the database schema or the structure of your query. A stack trace is even worse.

**Use proper HTTP status codes.**
- `200` for success.
- `201` for resource creation.
- `400` for validation errors (client sent garbage).
- `401` for unauthenticated (no session).
- `403` for unauthorized (session exists but lacks permission).
- `404` for resource not found.
- `409` for conflicts (duplicate slug, duplicate order).
- `429` for rate limit hits.
- `500` for server errors.

**Rate limit public endpoints.** Anything reachable without a session must have a rate limit. Apply to login, signup, password reset, and order creation on the public product page.

For rate limiting, use a simple in-memory approach:

```ts
// Simple in-memory rate limiter for development
// For production, use Redis
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}
```

**Log structured data.** Use `console.error('api.product.create.failed', { error })` - structured logs can be queried. The format is `<category>.<action>.<result>`.

## Server Action Template

```ts
// app/(dashboard)/<area>/actions.ts

'use server';

import { revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

type ActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: { code: string; message: string } };

export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) {
      return { ok: false, error: { code: 'unauthorized', message: 'Please sign in.' } };
    }

    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));

    if (!name || typeof name !== 'string') {
      return { ok: false, error: { code: 'invalid_input', message: 'Name is required.' } };
    }

    if (!price || price <= 0) {
      return { ok: false, error: { code: 'invalid_input', message: 'Price must be greater than 0.' } };
    }

    const product = await db.product.create({
      data: { name, price, userId: session.userId },
    });

    revalidateTag('products');
    return { ok: true, data: product };
  } catch (error) {
    console.error('action.create_product.failed', { error });
    return { ok: false, error: { code: 'server_error', message: 'Something went wrong.' } };
  }
}
```

Server actions that redirect on success do so at the end with `redirect(...)`. Actions that return data let the caller handle the response.

## Idempotency

Any route that creates something paid for must be idempotent. Use database unique constraints on `transactionReference` to prevent duplicates. Do not try to implement idempotency with application-level locking - the database is the source of truth.

## Testing Patterns

Test route handlers and server actions with the following patterns:

- **Unit tests**: Test validation logic, authorization checks, and business functions in isolation.
- **Integration tests**: Test the full route handler with a test database. Reset between tests.
- **Mock external services**: Mock Flutterwave API calls and other third-party dependencies.
- **Test error cases**: Ensure validation failures, authentication errors, and server errors return correct status codes and envelopes.
- **Test idempotency**: Verify duplicate requests don't create duplicate resources.
- **Test rate limiting**: Ensure rate-limited endpoints return 429 when exceeded.

Example test structure:
```ts
import { POST } from '@/app/api/products/route';
import { db } from '@/lib/db';

describe('POST /api/products', () => {
  beforeEach(async () => {
    await db.product.deleteMany();
  });

  it('creates a product when authenticated', async () => {
    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', price: 1000 }),
    });

    // Note: In real tests, mock getSession to return a session
    const response = await POST(req);
    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id');
  });
});
```

## What NOT to Do

- **Do NOT use external validation libraries like zod.** Use the simple validation helper above.
- **Do NOT use external caching libraries for rate limiting.** Use the simple Map-based approach.
- **Do NOT log raw user input.** It may contain sensitive data.
- **Do NOT return Prisma error messages directly.** Sanitize them.
- **Do NOT skip the authorization check.** Authentication is not authorization.

## Common Mistakes

- Skipping input validation and trusting TypeScript. TypeScript does not run at runtime.
- Authenticating but forgetting to authorize. Any signed-in user could edit anyone else's product.
- Using a `GET` for a mutation. Stick to REST conventions: `POST` creates, `PATCH` updates, `DELETE` deletes, `GET` reads.
- Returning raw Prisma errors or exception messages.
- Forgetting to `revalidateTag` after a server action mutates data. The cache will serve stale data.
- Putting business logic inline in the route handler. If it is more than a few lines, move it to `lib/`.