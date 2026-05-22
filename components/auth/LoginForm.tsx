'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';


export function LoginForm({ onToggle, onForgotPassword }: { onToggle: () => void; onForgotPassword: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean }>({});

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return touched.email ? 'Field cannot be empty' : undefined;
    if (email.includes('@') && /\./.test(email.split('@')[1] || '')) return undefined;
    return 'Enter a valid email address';
  };

  const handleFocus = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    const value = (document.getElementById('email') as HTMLInputElement)?.value || '';
    if (!value.trim()) setFieldErrors((prev) => ({ ...prev, email: 'Field cannot be empty' }));
  };

  const handleChange = (value: string) => {
    setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
  };

  const handleBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    setTouched({ email: true });

    const emailErr = !email.trim() ? 'Field cannot be empty' : validateEmail(email);
    setFieldErrors({ email: emailErr });
    if (emailErr) return;

    setIsLoading(true);

    const password = formData.get('password') as string;
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Invalid email or password');
      setIsLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      {error && (
        <div style={{
          backgroundColor: 'var(--color-error-container)',
          color: 'var(--color-on-error-container)',
          padding: 'var(--space-12) var(--space-16)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-body-medium-font-size)',
          fontWeight: 500,
          marginBottom: 'var(--space-16)',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-32)' }}>
        <h1 style={{ marginBottom: 'var(--space-24)', fontSize: 'var(--font-title-large-font-size)' }}><Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-block', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>SellSnap</Link></h1>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-headline-small-font-size)', fontWeight: '700', marginBottom: 'var(--space-8)' }}>Welcome back</p>
        <p style={{ color: 'var(--color-outline)', fontSize: 'var(--font-body-medium-font-size)', marginBottom: 'var(--space-24)' }}>Log in to access your dashboard and manage your products.</p>
      </div>

      <form onSubmit={handleSubmit} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>

        <Input
          label="Enter Email"
          name="email"
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          error={fieldErrors.email}
          onFocus={handleFocus}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
        <Input
          label="Enter Password"
          name="password"
          id="password"
          type="password"
          autoComplete="current-password"
          required
          onFocus={() => setError('')}
        />

        <button type="button" onClick={onForgotPassword} style={{
          alignSelf: 'flex-end',
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          fontSize: 'var(--font-label-small-font-size)',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '-4px',
          padding: 0,
        }}>
          Forgot password?
        </button>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'Logging in...' : 'Log in'}
          </Button>
        </div>
      </form>

      <div style={{ marginTop: 'var(--space-24)', textAlign: 'center', fontSize: 'var(--font-body-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
        <p>Don't have an account?{' '}
          <button onClick={onToggle} style={{ color: 'var(--color-primary)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
