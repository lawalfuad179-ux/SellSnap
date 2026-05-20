import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email address' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const { sendPasswordResetEmail } = await import('@/lib/email');
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;
    await sendPasswordResetEmail({ email, resetUrl });

    const isDev = !process.env.RESEND_API_KEY;
    if (isDev) {
      console.log('\n========================================');
      console.log('  PASSWORD RESET LINK (dev mode):');
      console.log(`  ${resetUrl}`);
      console.log('========================================\n');
    }

    return NextResponse.json({ ok: true, devResetUrl: isDev ? resetUrl : undefined });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ ok: false, error: 'Something went wrong' }, { status: 500 });
  }
}
