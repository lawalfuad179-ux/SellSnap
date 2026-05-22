'use client';

import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';

interface PayNowButtonProps {
  productId: string;
  price: number;
}

export const PayNowButton = ({ productId, price }: PayNowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handlePay = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Please enter your full name');
      return;
    }

    if (!trimmedEmail) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          buyerName: trimmedName,
          buyerEmail: trimmedEmail,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error?.message || 'Payment failed. Please try again');
      }

      // Redirect to Flutterwave checkout URL
      window.location.href = json.data.checkoutUrl;
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <label
          htmlFor="buyer-name"
          style={{
            display: 'block',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--font-label-medium-font-size)',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
          }}
        >
          Full Name
        </label>
        <input
          id="buyer-name"
          type="text"
          autoFocus
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 var(--space-14)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--font-body-medium-font-size)',
            color: 'var(--color-on-surface)',
            backgroundColor: 'var(--color-surface-container-lowest)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 'var(--space-16)' }}>
        <label
          htmlFor="buyer-email"
          style={{
            display: 'block',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--font-label-medium-font-size)',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
          }}
        >
          Your E-mail
        </label>
        <input
          id="buyer-email"
          type="email"
          placeholder="Where should we send your receipt?"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            height: '48px',
            padding: '0 var(--space-14)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'inherit',
            fontSize: 'var(--font-body-medium-font-size)',
            color: 'var(--color-on-surface)',
            backgroundColor: 'var(--color-surface-container-lowest)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {error && (
        <p
          style={{
            color: 'var(--color-error)',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--font-label-small-font-size)',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handlePay}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '56px',
          padding: '0 var(--space-24)',
          backgroundColor: isLoading ? 'var(--color-primary)' : 'var(--color-primary)',
          color: 'var(--color-on-primary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontFamily: 'var(--font-label-large-font-family)',
          fontWeight: 'var(--font-label-large-font-weight)',
          fontSize: 'var(--font-title-medium-font-size)',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--elevation-3)'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {isLoading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-8)' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            Processing...
          </span>
        ) : (
          'Pay Now'
        )}
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-8)',
          marginTop: 'var(--space-14)',
          fontSize: 'var(--font-label-small-font-size)',
          color: 'var(--color-on-surface-variant)',
        }}
      >
        <Lock size={12} />
        Secured by Flutterwave
      </div>
    </div>
  );
};
