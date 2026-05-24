'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { BackLink } from '@/components/ui/BackLink';
import styles from './PaymentStatus.module.css';

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
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <BackLink href="/" />
        <ThemeToggle />
      </div>

      <main aria-live="polite" aria-label="Payment status">
        {state === 'processing' && (
          <div className={styles.processingCard} role="status">
            <div className={styles.iconContainer}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.loader} style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <h1 className={styles.processingHeading}>Confirming Payment...</h1>
            <p className={styles.processingText}>
              Please wait while we verify your transaction.
            </p>
          </div>
        )}

        {state === 'success' && orderData && (
          <div className={styles.contentCard} role="status" aria-label="Payment successful">
            <div className={styles.iconContainer}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.successIcon} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <h1 className={styles.statusHeading}>Payment Successful!</h1>

            <p className={styles.confirmationText}>
              Thank you for your purchase of <strong>{orderData.productName}</strong> from <strong>{orderData.sellerBusinessName}</strong>.
            </p>

            <div className={styles.detailsCard}>
              <div className={`${styles.detailRow} ${styles.detailRowBorder}`}>
                <span className={styles.detailLabel}>Amount Paid</span>
                <span className={styles.detailValue}>
                  ₦{(orderData.amount / 100).toLocaleString()}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Transaction Ref</span>
                <span className={styles.refBadge}>
                  {orderData.transactionReference.slice(0, 8)}...
                </span>
              </div>
            </div>

            <p className={styles.footerNote}>
              A receipt has been sent to your email. The seller will contact you shortly.
            </p>

            <Link href={`/p/${productSlug || ''}`} className={styles.fullWidthLink}>
              <Button fullWidth>Continue</Button>
            </Link>
          </div>
        )}

        {state === 'failed' && (
          <div className={styles.failedCard} role="alert">
            <div className={styles.iconContainer}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.failedIcon} aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>

            <h1 className={styles.failedHeading}>Payment Failed</h1>

            <p className={styles.failedText}>{errorMsg}</p>

            <Link href={`/p/${productSlug || ''}`} className={styles.fullWidthLink}>
              <Button fullWidth>Try Again</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
