import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id;
  const account = await prisma.bankAccount.findUnique({ where: { userId } });

  return NextResponse.json({ ok: true, data: account });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const userId = (session.user as any).id;
  const { bankName, accountNumber, accountName } = await request.json();

  if (!bankName || !accountNumber || !accountName) {
    return NextResponse.json({ ok: false, error: 'All fields are required' }, { status: 400 });
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    return NextResponse.json({ ok: false, error: 'Account number must be 10 digits' }, { status: 400 });
  }

  try {
    const account = await prisma.bankAccount.upsert({
      where: { userId },
      update: { bankName, accountNumber, accountName },
      create: { userId, bankName, accountNumber, accountName },
    });

    return NextResponse.json({ ok: true, data: account });
  } catch (error: any) {
    console.error('Bank account error:', error?.message || error);
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 });
  }
}
