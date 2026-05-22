'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MouseTracker } from '@/components/effects/MouseTracker';
import { PartyPopper, XCircle, Loader2 } from 'lucide-react';

interface Props {
  searchParams: Promise<{ txRef?: string; status?: string; transaction_id?: string; productSlug?: string }>;
}

export default function PaymentStatusPage({ searchParams }: Props) {
  const { txRef, transaction_id, productSlug } = use(searchParams);
  const [state, setState] = useState<'processing' | 'success' | 'failed'>('processing');
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const checkOrder = async () => {
    if (!txRef) {
      setState('failed');
      return;
    }

    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txRef, flutterwaveTxId: transaction_id || '' }),
      });
      const json = await res.json();

      if (json.ok) {
        setState('success');
        clearInterval(pollRef.current);
      } else if (res.status === 429 || json.pending) {
        // Rate limited or webhook not yet arrived — keep polling
      } else {
        setState('failed');
        clearInterval(pollRef.current);
      }
    } catch {
      setState('failed');
      clearInterval(pollRef.current);
    }
  };

  useEffect(() => {
    checkOrder();
    pollRef.current = setInterval(checkOrder, 3000);
    return () => clearInterval(pollRef.current);
  }, [txRef, transaction_id]);

  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: 'var(--space-16)', backgroundColor: 'var(--color-background)',
    }}>
      <MouseTracker />
      <div style={{ position: 'absolute', top: 'var(--space-16)', right: 'var(--space-16)' }}>
        <ThemeToggle />
      </div>

      <Card style={{ textAlign: 'center', maxWidth: '400px' }}>
        {state === 'processing' && (
          <>
            <Loader2 size={48} style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-16)', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ color: 'var(--color-on-surface)', marginBottom: 'var(--space-16)' }}>Confirming Payment...</h2>
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-24)' }}>
              Please wait while we verify your transaction.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <PartyPopper size={48} style={{ color: '#16a34a', marginBottom: 'var(--space-16)' }} />
            <h2 style={{ color: '#16a34a', marginBottom: 'var(--space-16)' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-24)' }}>
              Your payment has been confirmed. The seller has been notified.
            </p>
            <Link href={`/p/${productSlug || ''}`}>
              <Button fullWidth>Return to Product</Button>
            </Link>
          </>
        )}

        {state === 'failed' && (
          <>
            <XCircle size={48} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-16)' }} />
            <h2 style={{ color: 'var(--color-error)', marginBottom: 'var(--space-16)' }}>Payment Failed</h2>
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-24)' }}>
              Something went wrong while confirming your payment. Please try again or contact support.
            </p>
            <Link href={`/p/${productSlug || ''}`}>
              <Button fullWidth>Return to Product</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
