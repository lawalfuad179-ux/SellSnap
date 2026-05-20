'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { createProductAction } from '@/app/(dashboard)/actions';
import { Check, TrendingUp, Info, ArrowLeft, Upload, X, Camera } from 'lucide-react';
import styles from './Onboarding.module.css';

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const userName = session?.user?.name || 'there';
  const userBusinessName = (session?.user as any)?.businessName || '';

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/onboarding-complete', { method: 'POST' });
      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json?.error || 'Unable to save progress. You can still access the dashboard.');
        setIsLoading(false);
      }
    } catch {
      router.push('/dashboard');
      router.refresh();
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 0) {
      router.push('/dashboard');
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <div className={styles.page}>
      {/* Brand */}
      <div className={styles.brand}>SellSnap</div>

      {/* Step indicator (1 — 2 — 3 — 4) */}
      <div className={styles.stepIndicator}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={styles.stepNode}>
            <div
              className={[
                styles.stepCircle,
                i < step
                  ? styles.stepCircleCompleted
                  : i === step
                    ? styles.stepCircleActive
                    : styles.stepCircleInactive,
              ].join(' ')}
            >
              {i < step ? <Check size={16} /> : i + 1}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className={[
                  styles.stepLine,
                  i < step ? styles.stepLineCompleted : styles.stepLineIncomplete,
                ].join(' ')}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Card wrapper with back button */}
      <div className={styles.cardWrapper}>
        {/* Back button */}
        {step !== 1 && (
          <button type="button" className={styles.backButton} onClick={handleBack}>
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        {/* Card content */}
        <div className={styles.card}>
          {step === 0 && (
            <StepWelcome
              userName={userName}
              onContinue={() => {
                setError('');
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <StepProfile
              userName={userName}
              businessName={userBusinessName}
              onContinue={() => {
                setError('');
                setStep(2);
              }}
            />
          )}

          {step === 2 && (
            <StepBank
              onContinue={() => {
                setError('');
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <StepProduct
              onFinish={handleFinish}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Bottom navigation footer for stage two (step === 1) */}
        {step === 1 ? (
          <div className={styles.footerRow}>
            <button type="button" className={styles.backButtonBottom} onClick={handleBack}>
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              type="button"
              className={styles.skipButtonBottom}
              onClick={handleSkip}
              disabled={isLoading}
            >
              {isLoading ? 'Finishing...' : 'Skip For Now'}
            </button>
          </div>
        ) : (
          /* Skip for now — below card on every step */
          <button
            type="button"
            className={styles.skipButton}
            onClick={handleSkip}
            disabled={isLoading}
          >
            {isLoading ? 'Finishing...' : 'Skip For Now'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────
   Step 1: Welcome
   ─────────────────────────────────────────────── */
function StepWelcome({
  userName,
  onContinue,
}: {
  userName: string;
  onContinue: () => void;
}) {
  return (
    <>
      {/* Icon */}
      <div className={styles.welcomeIcon}>
        <TrendingUp size={36} className={styles.welcomeIconSvg} />
      </div>

      {/* Heading */}
      <h1 className={styles.welcomeHeading}>
        Welcome, {userName}! 🎉
      </h1>

      {/* Description */}
      <p className={styles.welcomeDescription}>
        SellSnap turns any product into a shareable payment link in seconds.
        Share it on WhatsApp or Instagram — no store needed.
      </p>

      {/* Feature highlights */}
      <div className={styles.featureList}>
        <div className={styles.featureItem}>
          <span className={styles.featureEmoji}>⚡</span>
          <div className={styles.featureContent}>
            <span className={styles.featureTitle}>Instant links</span>
            <span className={styles.featureSubtitle}>
              Generate a unique payment link for any product in under a minute.
            </span>
          </div>
        </div>

        <div className={styles.featureItem}>
          <span className={styles.featureEmoji}>💳</span>
          <div className={styles.featureContent}>
            <span className={styles.featureTitle}>Secure payments</span>
            <span className={styles.featureSubtitle}>
              Powered by Flutterwave — trusted by millions across Africa.
            </span>
          </div>
        </div>

        <div className={styles.featureItem}>
          <span className={styles.featureEmoji}>📊</span>
          <div className={styles.featureContent}>
            <span className={styles.featureTitle}>Track everything</span>
            <span className={styles.featureSubtitle}>
              See every order and payment from your personal dashboard.
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button type="button" className={styles.ctaButton} onClick={onContinue}>
        Let&apos;s Get Started →
      </button>
    </>
  );
}

/* ───────────────────────────────────────────────
   Step 2: Profile review with avatar upload
   ─────────────────────────────────────────────── */
function StepProfile({
  userName,
  businessName,
  onContinue,
}: {
  userName: string;
  businessName: string;
  onContinue: () => void;
}) {
  const initial = userName.charAt(0).toUpperCase();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <h1 className={styles.profileHeading}>Your profile looks great 👤</h1>
      <p className={styles.profileSubtitle}>
        Here&apos;s how buyers will see your seller details on every product page.
        You can update these anytime from Settings.
      </p>

      {/* Profile card */}
      <div className={styles.profileCard}>
        <div className={styles.profileAvatarWrapper}>
          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Avatar circle — clickable to upload */}
          <div
            className={styles.profileAvatar}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload profile photo"
            onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click(); }}
          >
            {preview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className={styles.profileAvatarImage} />
                <div className={styles.profileAvatarOverlay}>
                  <Camera size={20} color="white" />
                </div>
              </>
            ) : (
              initial
            )}
          </div>

          {preview ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-error)',
                fontSize: 'var(--font-label-small-font-size)',
                fontFamily: 'inherit',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Remove Photo
            </button>
          ) : (
            <span className={styles.profileAvatarHint}>Tap to upload a photo</span>
          )}
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.profileRow}>
            <span className={styles.profileRowLabel}>Full name</span>
            <span className={styles.profileRowValue}>{userName}</span>
          </div>
          <div className={styles.profileRow}>
            <span className={styles.profileRowLabel}>Business name</span>
            <span className={styles.profileRowValue}>{businessName || '—'}</span>
          </div>
        </div>
      </div>

      {/* Info banner — toned down */}
      <div className={styles.profileInfoBanner}>
        <Info size={18} className={styles.profileInfoIcon} />
        <span className={styles.profileInfoText}>
          Your payment link will show your business name to buyers.
        </span>
      </div>

      {/* CTA */}
      <button type="button" className={styles.ctaButton} onClick={onContinue}>
        Looks Good, Continue →
      </button>
    </>
  );
}

/* ───────────────────────────────────────────────
   Step 3: Bank connection
   ─────────────────────────────────────────────── */
function StepBank({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const [connected, setConnected] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  const validate = (formData: FormData): boolean => {
    const errors: Record<string, string> = {};
    const bankName = (formData.get('bankName') as string || '').trim();
    const accountNumber = (formData.get('accountNumber') as string || '').trim();
    const accountName = (formData.get('accountName') as string || '').trim();

    if (!bankName) errors.bankName = 'Bank name is required';
    if (!accountNumber) errors.accountNumber = 'Account number is required';
    else if (accountNumber.length < 10) errors.accountNumber = 'Account number must be 10 digits';
    if (!accountName) errors.accountName = 'Account name is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!validate(formData)) return;

    setSubmitting(true);

    const body = {
      bankName: formData.get('bankName'),
      accountNumber: formData.get('accountNumber'),
      accountName: formData.get('accountName'),
    };

    try {
      const res = await fetch('/api/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) {
        showToast(json.error || 'Something went wrong');
        setSubmitting(false);
      } else {
        setConnected(true);
        setSubmitting(false);
      }
    } catch {
      showToast('Something went wrong');
      setSubmitting(false);
    }
  };

  if (connected) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>
          <Check size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
        <p className={styles.successText}>Bank account connected!</p>
        <button
          type="button"
          className={styles.ctaButton}
          style={{ marginTop: 'var(--space-24)' }}
          onClick={onContinue}
        >
          Continue →
        </button>
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      <h1 className={styles.bankHeading}>Connect your bank 🏦</h1>
      <p className={styles.bankSubtitle}>
        Add your bank details so we can send your earnings directly to you.
        You can also do this later from Settings.
      </p>

      <form onSubmit={handleSubmit} className={styles.bankForm} noValidate>
        <div>
          <Input label="Bank name" name="bankName" id="onboarding-bank" autoFocus />
          {fieldErrors.bankName && <p className={styles.fieldError}>{fieldErrors.bankName}</p>}
        </div>
        <div>
          <Input label="Account number" name="accountNumber" id="onboarding-accnum" type="text" maxLength={10} />
          {fieldErrors.accountNumber && <p className={styles.fieldError}>{fieldErrors.accountNumber}</p>}
        </div>
        <div>
          <Input label="Account name" name="accountName" id="onboarding-accname" />
          {fieldErrors.accountName && <p className={styles.fieldError}>{fieldErrors.accountName}</p>}
        </div>
        <button type="submit" className={styles.ctaButton} disabled={submitting}>
          {submitting ? 'Connecting...' : 'Connect & Continue →'}
        </button>
      </form>
    </>
  );
}

/* ───────────────────────────────────────────────
   Step 4: Create first product
   ─────────────────────────────────────────────── */
function StepProduct({
  onFinish,
  isLoading,
}: {
  onFinish: () => void;
  isLoading: boolean;
}) {
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  const validate = (formData: FormData): boolean => {
    const errors: Record<string, string> = {};
    const name = (formData.get('name') as string || '').trim();
    const description = (formData.get('description') as string || '').trim();
    const price = formData.get('price') as string || '';
    const image = formData.get('image') as File | null;

    if (!name) errors.name = 'Product name is required';
    if (!description) errors.description = 'Description is required';
    if (!price || Number(price) < 100) errors.price = 'Price must be at least ₦100';
    if (!image || image.size === 0) errors.image = 'Product image is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!validate(formData)) return;

    setSubmitting(true);
    const res = await createProductAction(formData);

    if (!res.ok) {
      showToast(res.error?.message || 'Failed to create product');
      setSubmitting(false);
    } else {
      setCreated(true);
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>
          <Check size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
        <p className={styles.successText}>Product created! 🎉</p>
        <button
          type="button"
          className={styles.ctaButton}
          style={{ marginTop: 'var(--space-24)' }}
          onClick={onFinish}
          disabled={isLoading}
        >
          {isLoading ? 'Finishing...' : 'Go to Dashboard →'}
        </button>
      </div>
    );
  }

  return (
    <>
      <Toast message={toastMsg} visible={toastVisible} onDismiss={() => setToastVisible(false)} />

      <h1 className={styles.productHeading}>Add your first product 🛍️</h1>
      <p className={styles.productSubtitle}>
        Create a product and share its payment link with your customers.
        You can always add more products later.
      </p>

      <form onSubmit={handleSubmit} className={styles.productForm} noValidate>
        <div>
          <Input label="Product name" name="name" id="onboarding-product-name" autoFocus />
          {fieldErrors.name && <p className={styles.fieldError}>{fieldErrors.name}</p>}
        </div>
        <div className={styles.textareaWrapper}>
          <label htmlFor="onboarding-product-desc" className={styles.textareaLabel}>
            Description
          </label>
          <textarea
            id="onboarding-product-desc"
            name="description"
            rows={3}
            className={styles.textarea}
            placeholder="Describe your product..."
          />
          {fieldErrors.description && <p className={styles.fieldError}>{fieldErrors.description}</p>}
        </div>
        <div>
          <Input label="Price (₦)" name="price" id="onboarding-product-price" type="number" min={100} />
          {fieldErrors.price && <p className={styles.fieldError}>{fieldErrors.price}</p>}
        </div>
        <div>
          <ImageUploadField name="image" />
          {fieldErrors.image && <p className={styles.fieldError}>{fieldErrors.image}</p>}
        </div>
        <button type="submit" className={styles.ctaButton} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Product & Go To Dashboard →'}
        </button>
      </form>
    </>
  );
}

/* ───────────────────────────────────────────────
   Toast
   ─────────────────────────────────────────────── */
function Toast({
  message,
  visible,
  onDismiss,
}: {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return <div className={styles.toast}>{message}</div>;
}
