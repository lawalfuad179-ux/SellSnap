import crypto from 'crypto';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { initializePayment } from '@/lib/flutterwave';
import { orderRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const orderCreateSchema = z.object({
  productId: z.string(),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await orderRateLimiter.check(ip)) {
      return NextResponse.json(
        { ok: false, error: { message: 'Too many requests. Please try again later.' } },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = orderCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { message: 'Invalid request data' } },
        { status: 400 }
      );
    }

    const { productId, buyerName, buyerEmail } = result.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: true },
    });

    if (!product) {
      return NextResponse.json(
        { ok: false, error: { message: 'Product not found' } },
        { status: 404 }
      );
    }

    if (!product.isActive) {
      return NextResponse.json(
        { ok: false, error: { message: 'Product is no longer available' } },
        { status: 410 }
      );
    }

    // Deduplication: check for an existing pending order for the same product + buyer
    const existingPending = await prisma.order.findFirst({
      where: { productId, buyerEmail, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPending) {
      // Reuse the existing order's payment flow
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const existingRedirectUrl = `${appUrl}/payment-status?txRef=${existingPending.transactionReference}&productSlug=${product.uniqueSlug}`;

      const paymentData = await initializePayment({
        tx_ref: existingPending.transactionReference,
        amount: product.price / 100,
        currency: 'NGN',
        redirect_url: existingRedirectUrl,
        customer: {
          email: buyerEmail,
          name: buyerName,
        },
        customizations: {
          title: `${product.name} - ${product.user.businessName}`,
          logo: product.imageUrl,
        },
      });

      await prisma.paymentLog.create({
        data: {
          orderId: existingPending.id,
          event: 'order_created',
          details: `Deduplicated — reused existing order ${existingPending.id}`,
        },
      });

      return NextResponse.json({ ok: true, data: { checkoutUrl: paymentData.link } });
    }

    const txRef = crypto.randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const order = await prisma.order.create({
      data: {
        productId,
        amount: product.price,
        buyerEmail,
        transactionReference: txRef,
        status: 'pending',
      },
    });

    await prisma.paymentLog.create({
      data: {
        orderId: order.id,
        event: 'order_created',
        details: `Amount: ${product.price} kobo, Product: ${product.name}`,
      },
    });

    const redirectUrl = `${appUrl}/payment-status?txRef=${txRef}&productSlug=${product.uniqueSlug}`;

    const paymentData = await initializePayment({
      tx_ref: txRef,
      amount: product.price / 100,
      currency: 'NGN',
      redirect_url: redirectUrl,
      customer: {
        email: buyerEmail,
        name: buyerName,
      },
      customizations: {
        title: `${product.name} - ${product.user.businessName}`,
        logo: product.imageUrl,
      },
    });

    await prisma.paymentLog.create({
      data: {
        orderId: order.id,
        event: 'payment_init',
        details: `Mode: ${paymentData.status || 'live'}, Redirect: ${paymentData.link}`,
      },
    });

    const checkoutUrl = paymentData.link;

    return NextResponse.json({ ok: true, data: { checkoutUrl } });
  } catch (error: any) {
    logger.error('OrderCreate', 'Failed to create order', { error: error?.message });
    return NextResponse.json(
      { ok: false, error: { message: 'Failed to create order' } },
      { status: 500 }
    );
  }
}
