import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function ensurePreferences(userId: string) {
  let prefs = await prisma.emailPreference.findUnique({ where: { userId } });
  if (!prefs) {
    prefs = await prisma.emailPreference.create({
      data: { userId },
    });
  }
  return prefs;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    const prefs = await ensurePreferences(userId);
    return NextResponse.json({ ok: true, data: prefs });
  } catch (error: any) {
    logger.error('NotifPrefs', 'GET failed', { error: error?.message });
    return NextResponse.json({ ok: false, error: 'Failed to load preferences' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await request.json();
    const { newOrderAlerts, paymentConfirmation } = body;

    await ensurePreferences(userId);

    const prefs = await prisma.emailPreference.update({
      where: { userId },
      data: {
        ...(typeof newOrderAlerts === 'boolean' && { newOrderAlerts }),
        ...(typeof paymentConfirmation === 'boolean' && { paymentConfirmation }),
      },
    });

    logger.info('NotifPrefs', 'Updated', { userId, prefs });
    return NextResponse.json({ ok: true, data: prefs });
  } catch (error: any) {
    logger.error('NotifPrefs', 'PUT failed', { error: error?.message });
    return NextResponse.json({ ok: false, error: 'Failed to save preferences' }, { status: 500 });
  }
}
