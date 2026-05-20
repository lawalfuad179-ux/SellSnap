import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';
import { initializePayment } from '@/lib/flutterwave';
import { orderRateLimiter } from '@/lib/rate-limit';

const orderCreateSchema = z.object({
  productId: z.string(),
  amount: z.number().int(), // amount in kobo
  buyerEmail: z.string().email().optional().or(z.literal('')),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!orderRateLimiter.check(ip)) {
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

    const { productId, amount, buyerEmail } = result.data;

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

    if (product.price !== amount) {
      return NextResponse.json(
        { ok: false, error: { message: 'Amount mismatch' } },
        { status: 400 }
      );
    }

    const txRef = `tx-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const order = await prisma.order.create({
      data: {
        productId,
        amount,
        buyerEmail: buyerEmail || null,
        transactionReference: txRef,
        status: 'pending',
      },
    });

    const redirectUrl = `${appUrl}/payment-status?orderId=${order.id}&productSlug=${product.uniqueSlug}`;

    const paymentData = await initializePayment({
      tx_ref: txRef,
      amount: amount / 100,
      currency: 'NGN',
      redirect_url: redirectUrl,
      customer: {
        email: buyerEmail || 'guest@sellsnap.com',
      },
      customizations: {
        title: `${product.name} - ${product.user.businessName}`,
        logo: product.imageUrl,
      },
    });

    const checkoutUrl = paymentData.link;

    return NextResponse.json({ ok: true, data: { checkoutUrl } });
  } catch (error: any) {
    console.error('Order creation error:', error?.message || error, error?.stack || '');
    return NextResponse.json(
      { ok: false, error: { message: error?.message || 'Failed to create order' } },
      { status: 500 }
    );
  }
}
