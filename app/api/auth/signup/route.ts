import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signupSchema } from '@/lib/validators/authSchemas';
import { authRateLimiter } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!await authRateLimiter.check(ip)) {
      return NextResponse.json({ ok: false, error: { message: 'Too many requests' } }, { status: 429 });
    }

    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: { message: result.error.issues[0].message } },
        { status: 400 }
      );
    }

    const { email, password, name, businessName } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { ok: false, error: { message: 'User with this email already exists' } },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 14);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        businessName,
        passwordHash,
      },
    });

    // Fire and forget welcome email
    sendWelcomeEmail({ email: user.email, name: user.name }).catch((e) => {
      console.error('Welcome email error:', e);
    });

    return NextResponse.json({ ok: true, data: { id: user.id } });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { ok: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
