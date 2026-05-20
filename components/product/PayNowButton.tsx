'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PayNowButtonProps {
  productId: string;
  price: number;
}

export const PayNowButton = ({ productId, price }: PayNowButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
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
      {error && <p style={{ color: 'var(--color-error)', marginBottom: '8px', fontSize: '12px', textAlign: 'center' }}>{error}</p>}
      <Button 
        size="lg" 
        fullWidth 
        onClick={handlePay} 
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </Button>
    </div>
  );
};
