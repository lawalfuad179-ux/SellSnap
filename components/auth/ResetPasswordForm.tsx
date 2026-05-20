'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

interface ResetPasswordFormProps {
  token: string;
}

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  const validatePassword = (v: string) => {
    if (!v) return undefined;
    if (v.length < 8) return 'Password must contain minimum 8 characters';
    if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(v)) return 'Password must contain a lowercase letter';
    if (!/\d/.test(v)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return 'Password must contain a special character';
    return undefined;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    if (value && value !== password) {
      setFieldErrors((prev) => ({ ...prev, confirm: 'Passwords do not match' }));
    } else {
      setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const pwErr = validatePassword(password);
    const confirmErr = password !== confirm ? 'Passwords do not match' : undefined;
    setFieldErrors({ password: pwErr, confirm: confirmErr });
    if (pwErr || confirmErr) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || 'Something went wrong');
        setIsLoading(false);
      } else {
        setSuccess(true);
        setIsLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
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
          Password reset successful
        </h2>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-body-medium-font-size)', marginBottom: 'var(--space-24)' }}>
          Your password has been updated.
        </p>
        <Button onClick={() => router.push('/auth')} fullWidth>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-32)' }}>
        <h2 style={{ fontSize: 'var(--font-title-medium-font-size)', fontWeight: 600, marginBottom: 'var(--space-8)', color: 'var(--color-on-surface)' }}>
          Reset your password
        </h2>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-body-medium-font-size)' }}>
          Choose a new password for your account.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>

        <Input
          label="New Password"
          name="password"
          id="reset-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          error={fieldErrors.password}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
        />
        <Input
          label="Confirm Password"
          name="confirm"
          id="reset-confirm"
          type="password"
          autoComplete="off"
          required
          error={fieldErrors.confirm}
          value={confirm}
          onChange={(e) => handleConfirmChange(e.target.value)}
        />

        <div style={{ marginTop: 'var(--space-8)' }}>
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'Resetting...' : 'Reset password'}
          </Button>
        </div>
      </form>
    </div>
  );
};
