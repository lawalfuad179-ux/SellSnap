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
  const [orderData, setOrderData] = useState<{
    productName: string;
    sellerBusinessName: string;
    amount: number;
    transactionReference: string;
  } | null>(null);
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
        setOrderData(json.data);
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

        {state === 'success' && orderData && (
          <>
            <div style={{ marginBottom: 'var(--space-20)' }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <h2 style={{ color: '#111827', fontSize: 'var(--font-headline-small-font-size)', fontWeight: 700, margin: '0 0 var(--space-8)' }}>
              Payment Successful!
            </h2>

            <p style={{ color: '#374151', fontSize: 'var(--font-body-medium-font-size)', lineHeight: '1.5', margin: '0 0 var(--space-24)' }}>
              Thank you for your purchase of <strong>{orderData.productName}</strong> from <strong>{orderData.sellerBusinessName}</strong>.
            </p>

            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-20)',
              marginBottom: 'var(--space-24)',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-8) 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280', fontSize: 'var(--font-body-medium-font-size)' }}>Amount Paid</span>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-body-large-font-size)', color: '#111827' }}>
                  ₦{(orderData.amount / 100).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-8) 0' }}>
                <span style={{ color: '#6b7280', fontSize: 'var(--font-body-medium-font-size)' }}>Transaction Ref</span>
                <span style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontSize: 'var(--font-label-small-font-size)',
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontFamily: 'monospace',
                }}>
                  {orderData.transactionReference.slice(0, 8)}...
                </span>
              </div>
            </div>

            <p style={{ color: '#9ca3af', fontSize: 'var(--font-body-small-font-size)', margin: '0 0 var(--space-24)' }}>
              A receipt has been sent to your email. The seller will contact you shortly.
            </p>

            <Link href={`/p/${productSlug || ''}`}>
              <Button fullWidth>Continue</Button>
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
