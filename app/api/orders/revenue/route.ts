import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id;

  const revenue = await prisma.order.aggregate({
    where: { product: { userId }, status: 'paid' },
    _sum: { amount: true },
  });

  return NextResponse.json({ ok: true, revenue: revenue._sum.amount || 0 });
}
