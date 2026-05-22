'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';


export function SignupForm({ onToggle }: { onToggle: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; businessName?: string; email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; businessName?: boolean; email?: boolean; password?: boolean }>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const businessNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const getVal = (ref: React.RefObject<HTMLInputElement | null>) => ref.current?.value || '';

  useEffect(() => {
    if (step === 2) emailRef.current?.focus();
  }, [step]);

  const emptyMsg = 'Field cannot be empty';

  const validateName = (v: string) => !v.trim() ? (touched.name ? emptyMsg : undefined) : v.trim().length < 2 ? 'Name must be at least 2 characters' : undefined;
  const validateBusinessName = (v: string) => !v.trim() ? (touched.businessName ? emptyMsg : undefined) : v.trim().length < 2 ? 'Business name must be at least 2 characters' : undefined;
  const validateEmail = (v: string) => {
    if (!v.trim()) return touched.email ? emptyMsg : undefined;
    if (v.includes('@') && /\./.test(v.split('@')[1] || '')) return undefined;
    return 'Enter a valid email address';
  };
  const validatePassword = (v: string) => {
    if (!v) return touched.password ? emptyMsg : undefined;
    if (v.length < 8) return 'Password must contain minimum 8 characters';
    if (!/[A-Z]/.test(v)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(v)) return 'Password must contain a lowercase letter';
    if (!/\d/.test(v)) return 'Password must contain a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(v)) return 'Password must contain a special character';
    return undefined;
  };

  const handleFocus = (field: string, ref: React.RefObject<HTMLInputElement | null>) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const value = getVal(ref);
    if (!value.trim()) setFieldErrors((prev) => ({ ...prev, [field]: emptyMsg }));
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'name') setFieldErrors((prev) => ({ ...prev, name: validateName(value) }));
    else if (field === 'businessName') setFieldErrors((prev) => ({ ...prev, businessName: validateBusinessName(value) }));
    else if (field === 'email') setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    else if (field === 'password') setFieldErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') return;
    let err: string | undefined;
    switch (field) {
      case 'name': err = validateName(value); break;
      case 'businessName': err = validateBusinessName(value); break;
      case 'password': err = validatePassword(value); break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleContinue = (e: React.MouseEvent) => {
    e.preventDefault();
    setTouched({ name: true, businessName: true });
    const name = getVal(nameRef);
    const businessName = getVal(businessNameRef);
    const nameErr = !name.trim() ? emptyMsg : validateName(name);
    const businessErr = !businessName.trim() ? emptyMsg : validateBusinessName(businessName);
    setFieldErrors({ name: nameErr, businessName: businessErr });
    if (nameErr || businessErr) return;
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 1) return;

    const email = getVal(emailRef);
    const password = getVal(passwordRef);

    setTouched({ email: true, password: true });

    const emailErr = !email.trim() ? emptyMsg : validateEmail(email);
    const passwordErr = !password ? emptyMsg : validatePassword(password);
    setFieldErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: getVal(nameRef), businessName: getVal(businessNameRef), email, password }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error?.message || 'Failed to sign up');
        setIsLoading(false);
      } else {
        const signInRes = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (signInRes?.error) {
          setError('Account created! Please log in.');
          setIsLoading(false);
        } else {
          router.push('/onboarding');
          router.refresh();
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-32)' }}>
        <h1 style={{ marginBottom: 'var(--space-24)', fontSize: 'var(--font-title-large-font-size)' }}><Link href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'inline-block', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>SellSnap</Link></h1>
        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-headline-small-font-size)', fontWeight: '700', marginBottom: 'var(--space-8)' }}>
          {step === 1 ? 'Create your seller account' : 'Almost done!'}
        </p>
        <p style={{ color: 'var(--color-outline)', fontSize: 'var(--font-body-medium-font-size)', marginBottom: 'var(--space-24)' }}>
          {step === 1 ? 'Tell us about yourself to get started.' : 'Secure your account with your email and a password.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
        {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-label-medium-font-size)' }}>{error}</p>}

        <div style={{ display: step === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <Input
            ref={nameRef}
            label="Enter Full Name"
            name="name"
            id="name"
            autoComplete="name"
            onFocus={() => handleFocus('name', nameRef)}
            onChange={e => handleChange('name', e.target.value)}
            onBlur={(e) => handleBlur('name', e.target.value)}
            autoFocus
            required
            error={fieldErrors.name}
          />
          <Input
            ref={businessNameRef}
            label="Enter Business Name"
            name="businessName"
            id="businessName"
            autoComplete="organization"
            onFocus={() => handleFocus('businessName', businessNameRef)}
            onChange={e => handleChange('businessName', e.target.value)}
            onBlur={(e) => handleBlur('businessName', e.target.value)}
            required
            error={fieldErrors.businessName}
          />

          <div style={{ marginTop: 'var(--space-8)' }}>
            <Button type="button" onClick={handleContinue} fullWidth>
              Continue
              <span className="desktop-only"><ArrowRight size={20} strokeWidth={1.5} style={{ marginLeft: 'var(--space-4)' }} /></span>
            </Button>
          </div>
        </div>

        <div style={{ display: step === 2 ? 'flex' : 'none', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <Input
            ref={emailRef}
            label="Enter Email"
            name="email"
            id="email"
            type="email"
            autoComplete="email"
            onFocus={() => handleFocus('email', emailRef)}
            onChange={e => handleChange('email', e.target.value)}
            required
            error={fieldErrors.email}
          />
          <Input
            ref={passwordRef}
            label="Choose Password"
            name="password"
            id="password"
            type="password"
            autoComplete="new-password"
            onFocus={() => handleFocus('password', passwordRef)}
            onChange={e => handleChange('password', e.target.value)}
            onBlur={(e) => handleBlur('password', e.target.value)}
            required
            error={fieldErrors.password}
          />

          <div style={{ marginTop: 'var(--space-8)' }}>
            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>

          <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ color: 'var(--color-on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--font-body-medium-font-size)', textDecoration: 'underline' }}>
            Back
          </button>
        </div>
      </form>

      <div style={{ marginTop: 'var(--space-24)', textAlign: 'center', fontSize: 'var(--font-body-medium-font-size)', color: 'var(--color-on-surface-variant)' }}>
        <p>Already have an account?{' '}
          <button onClick={onToggle} style={{ color: 'var(--color-primary)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}>
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
