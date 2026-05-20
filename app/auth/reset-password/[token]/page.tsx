import prisma from '@/lib/db';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-16)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontSize: 'var(--font-title-medium-font-size)', fontWeight: 600, marginBottom: 'var(--space-8)', color: 'var(--color-on-surface)' }}>
            Invalid or expired link
          </h2>
          <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-body-medium-font-size)', marginBottom: 'var(--space-24)' }}>
            This password reset link is no longer valid. Request a new one.
          </p>
          <a href="/auth" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'var(--space-16)',
    }}>
      <ResetPasswordForm token={token} />
    </div>
  );
}
