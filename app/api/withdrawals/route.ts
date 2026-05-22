import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id;
  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ ok: true, data: withdrawals });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id;
  const { amount, scheduledAt } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 });
  }

  if (!scheduledAt) {
    return NextResponse.json({ ok: false, error: 'Schedule date is required' }, { status: 400 });
  }

  const account = await prisma.bankAccount.findUnique({ where: { userId } });
  if (!account) {
    return NextResponse.json({ ok: false, error: 'Set up a withdrawal account first' }, { status: 400 });
  }

  // Calculate available balance
  const [revenue, existingWithdrawals] = await Promise.all([
    prisma.order.aggregate({
      where: { product: { userId }, status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { userId, status: { in: ['scheduled', 'processed'] } },
      _sum: { amount: true },
    }),
  ]);

  const requestedAmount = Math.round(amount * 100);

  // Atomic balance check + withdrawal creation inside a serialized transaction
  try {
    const withdrawal = await prisma.$transaction(async (tx) => {
      const [revenue, existingWithdrawals] = await Promise.all([
        tx.order.aggregate({
          where: { product: { userId }, status: 'paid' },
          _sum: { amount: true },
        }),
        tx.withdrawal.aggregate({
          where: { userId, status: { in: ['scheduled', 'processed'] } },
          _sum: { amount: true },
        }),
      ]);

      const totalRevenue = revenue._sum.amount || 0;
      const totalWithdrawn = existingWithdrawals._sum.amount || 0;
      const availableBalance = totalRevenue - totalWithdrawn;

      if (requestedAmount > availableBalance) {
        throw new Error('Insufficient balance');
      }

      return tx.withdrawal.create({
        data: {
          userId,
          amount: requestedAmount,
          scheduledAt: new Date(scheduledAt),
          status: 'scheduled',
        },
      });
    });

    return NextResponse.json({ ok: true, data: withdrawal });
  } catch (err: any) {
    if (err.message === 'Insufficient balance') {
      return NextResponse.json({ ok: false, error: 'Insufficient balance' }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await request.json();

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal || withdrawal.userId !== userId) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  await prisma.withdrawal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
