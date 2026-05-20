import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { orderId, transactionRef, flutterwaveStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'Missing order ID' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'paid') {
      return NextResponse.json({ ok: true });
    }

    if (order.status === 'failed') {
      return NextResponse.json({ ok: false, error: 'Order already marked as failed' });
    }

    if (!process.env.FLUTTERWAVE_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY.endsWith('xxx')) {
      const product = await prisma.product.findUnique({ where: { id: order.productId }, select: { userId: true, name: true } });

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            orderId: order.id,
            gatewayReference: `mock-${order.transactionReference}`,
            status: 'successful',
            paidAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'paid' },
        }),
        ...(product ? [prisma.notification.create({
          data: {
            userId: product.userId,
            title: 'New Order',
            message: `Someone purchased "${product.name}"`,
          },
        })] : []),
      ]);

      return NextResponse.json({ ok: true });
    }

    if (flutterwaveStatus === 'successful' || flutterwaveStatus === 'completed') {
      const product = await prisma.product.findUnique({ where: { id: order.productId }, select: { userId: true, name: true } });

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            orderId: order.id,
            gatewayReference: transactionRef || order.transactionReference,
            status: 'successful',
            paidAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'paid' },
        }),
        ...(product ? [prisma.notification.create({
          data: {
            userId: product.userId,
            title: 'New Order',
            message: `Someone purchased "${product.name}"`,
          },
        })] : []),
      ]);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Payment not confirmed' });
  } catch (error: any) {
    console.error('Order confirmation error:', error);

    // P2002 = unique constraint — idempotent, treat as success
    if (error.code === 'P2002') {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Failed to confirm order' }, { status: 500 });
  }
}
