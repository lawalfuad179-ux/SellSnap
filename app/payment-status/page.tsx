'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MouseTracker } from '@/components/effects/MouseTracker';
import { PartyPopper, XCircle, Loader2 } from 'lucide-react';

const MAX_RETRIES = 20;

interface Props {
  searchParams: Promise<{ txRef?: string; status?: string; transaction_id?: string; productSlug?: string }>;
}

export default function PaymentStatusPage({ searchParams }: Props) {
  const { txRef, transaction_id, productSlug } = use(searchParams);
  const [state, setState] = useState<'processing' | 'success' | 'failed'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const retryRef = useRef(0);

  const checkOrder = async () => {
    if (!txRef) {
      setState('failed');
      setErrorMsg('Missing transaction reference.');
      return;
    }

    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txRef, flutterwaveTxId: transaction_id || undefined }),
      });
      const json = await res.json();

      if (json.ok) {
        setState('success');
        clearInterval(pollRef.current);
      } else if (res.status === 429 || json.pending) {
        retryRef.current += 1;
        if (retryRef.current >= MAX_RETRIES) {
          setState('failed');
          setErrorMsg('Payment confirmation timed out. The payment may still be processing — check your order history.');
          clearInterval(pollRef.current);
        }
      } else {
        setState('failed');
        setErrorMsg(json.error || 'Something went wrong. Please try again.');
        clearInterval(pollRef.current);
      }
    } catch {
      setState('failed');
      setErrorMsg('Network error. Please try again.');
      clearInterval(pollRef.current);
    }
  };

  useEffect(() => {
    retryRef.current = 0;
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
            <p style={{ color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-12)' }}>
              {errorMsg}
            </p>
            <Link href={`/p/${productSlug || ''}`}>
              <Button fullWidth>Try Again</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
