import crypto from 'crypto';

export function isMockMode(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  return !key || key.endsWith('xxx');
}

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function initializePayment(data: {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name?: string;
  };
  customizations: {
    title: string;
    logo?: string;
  };
}) {
  if (isMockMode()) {
    const url = new URL(data.redirect_url);
    url.searchParams.set('mock', 'true');
    return { link: url.toString(), status: 'mock' };
  }

  const response = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await response.json();
  
  if (json.status !== 'success') {
    throw new Error('Payment initialization failed');
  }

  return json.data;
}

export async function verifyTransaction(transactionId: string) {
  if (isMockMode()) {
    return { status: 'successful', tx_ref: transactionId, amount: 0, currency: 'NGN', created_at: new Date().toISOString() };
  }

  const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await response.json();

  if (json.status !== 'success') {
    throw new Error('Transaction verification failed');
  }

  return json.data;
}

export function verifyWebhookSignature(signature: string): boolean {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) return false;

  if (signature.length !== secretHash.length) return false;

  const sigBuf = Buffer.from(signature);
  const hashBuf = Buffer.from(secretHash);
  return crypto.timingSafeEqual(sigBuf, hashBuf);
}
