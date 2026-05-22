'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { MouseTracker } from '@/components/effects/MouseTracker';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('signup');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-16)', position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'absolute', top: '48px', left: 'var(--space-16)', display: 'flex', alignItems: 'center', height: '36px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            color: 'var(--color-on-surface-variant)',
            textDecoration: 'none',
            fontSize: 'var(--font-body-medium-font-size)',
            fontWeight: 500,
            fontFamily: 'inherit',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-on-surface-variant)')}
        >
          <ArrowLeft size={18} />
          Back
        </Link>
      </div>
      <div style={{ position: 'absolute', top: '48px', right: 'var(--space-16)', display: 'flex', alignItems: 'center', height: '36px' }}>
        <ThemeToggle />
      </div>
      <MouseTracker />
      {mode === 'login' && (
        <LoginForm onToggle={() => setMode('signup')} onForgotPassword={() => setMode('forgot-password')} />
      )}
      {mode === 'signup' && (
        <SignupForm onToggle={() => setMode('login')} />
      )}
      {mode === 'forgot-password' && (
        <ForgotPasswordForm onBack={() => setMode('login')} />
      )}
    </div>
  );
}
