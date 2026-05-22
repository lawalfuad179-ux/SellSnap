import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/flutterwave';
import { sendPaymentConfirmationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('verif-hash');
    const bodyText = await request.text();

    if (!signature || !verifyWebhookSignature(signature)) {
      return new NextResponse('OK', { status: 200 });
    }

    const payload = JSON.parse(bodyText);
    logger.info('Webhook', 'Webhook received', { event: payload.event });

    if (payload.event === 'charge.completed' && payload.data) {
      const txId = payload.data.id.toString();

      await prisma.paymentLog.create({
        data: { orderId: null, event: 'webhook_received', details: `TxID: ${txId}` },
      });

      const verifiedTx = await verifyTransaction(txId);

      if (verifiedTx.status === 'successful') {
        const txRef = verifiedTx.tx_ref;

        await prisma.paymentLog.create({
          data: { orderId: null, event: 'webhook_verified', details: `TxID: ${txId}, TxRef: ${txRef}` },
        });

        const amountInKobo = Math.round(verifiedTx.amount * 100);

        const order = await prisma.order.findUnique({
          where: { transactionReference: txRef },
          include: { product: { include: { user: true } } },
        });

        if (!order) {
          await prisma.paymentLog.create({
            data: { orderId: null, event: 'verification_failed', details: `Order not found for txRef: ${txRef}` },
          });
          logger.warn('Webhook', 'Order not found', { txRef });
          return new NextResponse('OK', { status: 200 });
        }

        if (order.amount > amountInKobo || verifiedTx.currency !== order.currency) {
          await prisma.paymentLog.create({
            data: { orderId: order.id, event: 'amount_mismatch', details: `Expected >= ${order.amount} ${order.currency}, got ${amountInKobo} ${verifiedTx.currency}` },
          });
          logger.warn('Webhook', 'Amount or currency mismatch', {
            orderId: order.id,
            expected: `${order.amount} ${order.currency}`,
            got: `${amountInKobo} ${verifiedTx.currency}`,
          });
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          });
          return new NextResponse('OK', { status: 200 });
        }

        if (amountInKobo > order.amount) {
          logger.warn('Webhook', 'Overpayment detected', { orderId: order.id, expected: order.amount, paid: amountInKobo });
        }

        try {
          await prisma.$transaction([
            prisma.payment.create({
              data: {
                orderId: order.id,
                gatewayReference: txId,
                status: 'successful',
                paidAt: new Date(verifiedTx.created_at),
              },
            }),
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'paid' },
            }),
            ...(order.product
              ? [
                  prisma.notification.create({
                    data: {
                      userId: order.product.userId,
                      title: 'New Order',
                      message: `Someone purchased "${order.product.name}"`,
                    },
                  }),
                ]
              : []),
          ]);

          await prisma.paymentLog.create({
            data: { orderId: order.id, event: 'webhook_processed', details: `Payment confirmed. Amount: ${amountInKobo} ${order.currency}` },
          });

          const seller = order.product.user;
          logger.info('Webhook', 'Payment processed', { orderId: order.id, userId: seller.id });

          await sendPaymentConfirmationEmail({
            sellerEmail: seller.email,
            sellerName: seller.name,
            productName: order.product.name,
            amount: order.amount,
            buyerEmail: order.buyerEmail,
          });
        } catch (e: any) {
          if (e.code === 'P2002') {
            return new NextResponse('OK', { status: 200 });
          }
          throw e;
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    logger.error('Webhook', 'Processing error', { error: error?.message });
    return new NextResponse('OK', { status: 200 });
  }
}
