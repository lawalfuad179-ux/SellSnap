import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/flutterwave';
import { sendPaymentConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('verif-hash');
    const bodyText = await request.text();

    if (!signature || !verifyWebhookSignature(signature, bodyText)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    if (payload.event === 'charge.completed' && payload.data) {
      const txId = payload.data.id.toString();
      
      // Verify with Flutterwave directly to ensure payload isn't spoofed
      const verifiedTx = await verifyTransaction(txId);
      
      if (verifiedTx.status === 'successful') {
        const txRef = verifiedTx.tx_ref;
        // Amount verified is in Naira, we need kobo to compare with db
        const amountInKobo = verifiedTx.amount * 100;

        const order = await prisma.order.findUnique({
          where: { transactionReference: txRef },
          include: { product: { include: { user: true } } },
        });

        if (!order) {
          console.error(`Order not found for txRef: ${txRef}`);
          return new NextResponse('Order not found', { status: 404 });
        }

        if (order.amount !== amountInKobo || verifiedTx.currency !== 'NGN') {
          console.error(`Amount or currency mismatch. Expected ${order.amount} kobo NGN, got ${amountInKobo} ${verifiedTx.currency}`);
          return new NextResponse('Invalid amount or currency', { status: 400 });
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
          ]);

          const seller = order.product.user;
          await sendPaymentConfirmationEmail({
            sellerEmail: seller.email,
            sellerName: seller.name,
            productName: order.product.name,
            amount: order.amount,
            buyerEmail: order.buyerEmail,
          });
        } catch (e: any) {
          if (e.code === 'P2002') {
            // Unique constraint failed, meaning payment was already processed (Idempotency)
            return new NextResponse('Already processed', { status: 200 });
          }
          throw e;
        }
      }
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
