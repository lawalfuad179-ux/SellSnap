import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'No session found. Please log in again.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'Invalid session data.' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Onboarding complete error:', error?.message || error);
    return NextResponse.json({ ok: false, error: error?.message || 'Something went wrong' }, { status: 500 });
  }
}
