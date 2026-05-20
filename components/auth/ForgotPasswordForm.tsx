'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Something went wrong');
        setIsLoading(false);
      } else {
        setSent(true);
        setDevUrl(json.devResetUrl || '');
        setIsLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--space-24)',
        }}>
          <CheckCircle size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 style={{ fontSize: 'var(--font-title-medium-font-size)', fontWeight: 600, marginBottom: 'var(--space-8)', color: 'var(--color-on-surface)' }}>
          Check your email
        </h2>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-body-medium-font-size)', marginBottom: 'var(--space-24)' }}>
          If an account exists with {email}, we&apos;ve sent a password reset link.
        </p>
        {devUrl && (
          <div style={{
            backgroundColor: 'var(--color-surface-container-high)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-12) var(--space-16)',
            marginBottom: 'var(--space-24)',
            fontSize: 'var(--font-label-small-font-size)',
            wordBreak: 'break-all',
          }}>
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-4)', fontWeight: 600 }}>Dev mode — reset link:</p>
            <a href={devUrl} style={{ color: 'var(--color-primary)' }}>{devUrl}</a>
          </div>
        )}
        <button
          onClick={onBack}
          style={{
            color: 'var(--color-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-body-medium-font-size)',
            fontWeight: 600,
          }}
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
          color: 'var(--color-on-surface-variant)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--font-body-medium-font-size)',
          marginBottom: 'var(--space-24)',
        }}
      >
        <ArrowLeft size={16} />
        Back to login
      </button>

      <div style={{ textAlign: 'center', marginBottom: 'var(--space-32)' }}>
        <h2 style={{ fontSize: 'var(--font-title-medium-font-size)', fontWeight: 600, marginBottom: 'var(--space-8)', color: 'var(--color-on-surface)' }}>
          Forgot password?
        </h2>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-body-medium-font-size)' }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-label-medium-font-size)' }}>{error}</p>}

        <Input
          label="Enter Email"
          name="email"
          id="forgot-email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div style={{ marginTop: 'var(--space-8)' }}>
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </div>
      </form>
    </div>
  );
};
