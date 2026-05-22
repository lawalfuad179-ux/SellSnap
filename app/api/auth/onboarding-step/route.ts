import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true, onboardingComplete: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: { step: user.onboardingStep, complete: user.onboardingComplete } });
  } catch (error) {
    console.error('Failed to fetch onboarding step:', error);
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { step } = await request.json();
    if (typeof step !== 'number' || step < 0 || step > 3) {
      return NextResponse.json({ ok: false, error: 'Invalid step' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: step },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save onboarding step:', error);
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 });
  }
}
