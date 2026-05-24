import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyTransaction, isMockMode } from '@/lib/flutterwave';
import { orderRateLimiter } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendPaymentConfirmationEmail, sendBuyerReceiptEmail } from '@/lib/email';

async function log(orderId: string | null, event: string, details: string) {
  try {
    await prisma.paymentLog.create({ data: { orderId, event, details } });
  } catch {}
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await orderRateLimiter.check(ip)) {
      return NextResponse.json(
        { ok: false, error: 'Too many requests' },
        { status: 429 }
      );
    }

    const { txRef, flutterwaveTxId } = await request.json();

    if (!txRef) {
      return NextResponse.json({ ok: false, error: 'Missing transaction reference' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { transactionReference: txRef },
      include: { product: { include: { user: true } } },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 });
    }

    // Already processed by webhook
    if (order.status === 'paid') {
      return NextResponse.json({
        ok: true,
        data: {
          productName: order.product.name,
          sellerBusinessName: order.product.user.businessName,
          amount: order.amount,
          transactionReference: order.transactionReference,
        },
      });
    }

    if (order.status === 'failed' || order.status === 'expired') {
      return NextResponse.json({ ok: false, error: `Order ${order.status}` });
    }

    // Mock mode — local dev only
    if (isMockMode()) {
      const product = await prisma.product.findUnique({
        where: { id: order.productId },
        select: { userId: true, name: true, user: true },
      });

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
        ...(product
          ? [
              prisma.notification.create({
                data: {
                  userId: product.userId,
                  title: 'New Order',
                  message: `Someone purchased "${product.name}"`,
                },
              }),
            ]
          : []),
      ]);

      if (product && product.user) {
        const emailPromises = [
          sendPaymentConfirmationEmail({
            sellerEmail: product.user.email,
            sellerName: product.user.name,
            productName: product.name,
            amount: order.amount,
            buyerEmail: order.buyerEmail,
            userId: product.user.id,
          })
        ];

        if (order.buyerEmail) {
          emailPromises.push(
            sendBuyerReceiptEmail({
              buyerEmail: order.buyerEmail,
              sellerBusinessName: product.user.businessName,
              productName: product.name,
              amount: order.amount,
            })
          );
        }

        Promise.allSettled(emailPromises).catch((e) => {
          logger.error('OrderConfirm', 'Email dispatch error', { error: (e as Error)?.message });
        });
      }

      await log(order.id, 'redirect_confirmed', 'Mock mode — payment processed');
      return NextResponse.json({
        ok: true,
        data: {
          productName: order.product.name,
          sellerBusinessName: order.product.user.businessName,
          amount: order.amount,
          transactionReference: order.transactionReference,
        },
      });
    }

    // Production mode — verify with Flutterwave API, then process.
    if (flutterwaveTxId) {
      try {
        const verifiedTx = await verifyTransaction(flutterwaveTxId);
        if (verifiedTx.status !== 'successful') {
          await log(order.id, 'verification_failed', `Tx status: ${verifiedTx.status}`);
          return NextResponse.json({ ok: false, error: 'Transaction not successful' });
        }
        if (verifiedTx.tx_ref !== order.transactionReference) {
          await log(order.id, 'verification_failed', `TxRef mismatch`);
          return NextResponse.json({ ok: false, error: 'Transaction reference mismatch' });
        }
        const amountInKobo = Math.round(verifiedTx.amount * 100);
        if (order.amount > amountInKobo) {
          await log(order.id, 'amount_mismatch', `Expected >= ${order.amount}, got ${amountInKobo}`);
          return NextResponse.json({ ok: false, error: 'Amount less than product price' });
        }
        if (amountInKobo > order.amount) {
          await log(order.id, 'amount_mismatch', `Overpayment: paid ${amountInKobo}, expected ${order.amount}`);
          logger.warn('OrderConfirm', 'Overpayment detected', { orderId: order.id, expected: order.amount, paid: amountInKobo });
        }
      } catch {
        await log(order.id, 'verification_failed', 'verifyTransaction threw');
        return NextResponse.json({ ok: false, error: 'Payment verification failed' });
      }

      const product = await prisma.product.findUnique({
        where: { id: order.productId },
        select: { userId: true, name: true, user: true },
      });

      await prisma.$transaction([
        prisma.payment.create({
          data: {
            orderId: order.id,
            gatewayReference: flutterwaveTxId,
            status: 'successful',
            paidAt: new Date(),
          },
        }),
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'paid' },
        }),
        ...(product
          ? [
              prisma.notification.create({
                data: {
                  userId: product.userId,
                  title: 'New Order',
                  message: `Someone purchased "${product.name}"`,
                },
              }),
            ]
          : []),
      ]);

      if (product && product.user) {
        const emailPromises = [
          sendPaymentConfirmationEmail({
            sellerEmail: product.user.email,
            sellerName: product.user.name,
            productName: product.name,
            amount: order.amount,
            buyerEmail: order.buyerEmail,
            userId: product.user.id,
          })
        ];

        if (order.buyerEmail) {
          emailPromises.push(
            sendBuyerReceiptEmail({
              buyerEmail: order.buyerEmail,
              sellerBusinessName: product.user.businessName,
              productName: product.name,
              amount: order.amount,
            })
          );
        }

        Promise.allSettled(emailPromises).catch((e) => {
          logger.error('OrderConfirm', 'Email dispatch error', { error: (e as Error)?.message });
        });
      }

      await log(order.id, 'redirect_confirmed', `Verified via Flutterwave API. TxID: ${flutterwaveTxId}`);
      return NextResponse.json({
        ok: true,
        data: {
          productName: order.product.name,
          sellerBusinessName: order.product.user.businessName,
          amount: order.amount,
          transactionReference: order.transactionReference,
        },
      });
    }

    // Webhook hasn't arrived yet — keep polling
    await log(order.id, 'redirect_confirmed', 'Webhook not yet arrived — polling');
    return NextResponse.json({ ok: false, pending: true, error: 'Awaiting webhook confirmation' });
  } catch (error: any) {
    logger.error('OrderConfirm', 'Confirmation error', { error: error?.message });

    if (error.code === 'P2002') {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Failed to confirm order' }, { status: 500 });
  }
}
