'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { MouseTracker } from '@/components/effects/MouseTracker';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('signup');

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 'var(--space-16)', position: 'relative', zIndex: 1 }}>
      <div style={{ position: 'absolute', top: 'var(--space-16)', right: 'var(--space-16)' }}>
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
