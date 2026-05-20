import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
  }

  const url = await uploadFile(file);

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}
