'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PayNowButtonProps {
  productId: string;
  price: number;
}

export const PayNowButton = ({ productId, price }: PayNowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const handlePay = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
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
          amount: price,
          buyerEmail: email,
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
          htmlFor="buyer-email"
          style={{
            display: 'block',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--font-label-medium-font-size)',
            fontWeight: 600,
            color: 'var(--color-on-surface)',
          }}
        >
          Your Email
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
      <Button
        size="lg"
        fullWidth
        onClick={handlePay}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>

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
