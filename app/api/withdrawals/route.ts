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

  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      amount: Math.round(amount * 100),
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled',
    },
  });

  return NextResponse.json({ ok: true, data: withdrawal });
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
