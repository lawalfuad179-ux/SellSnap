import crypto from 'crypto';

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
  if (!FLUTTERWAVE_SECRET_KEY || FLUTTERWAVE_SECRET_KEY.endsWith('xxx')) {
    console.log('[Flutterwave] No valid secret key configured — using mock mode');
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
    throw new Error(json.message || 'Payment initialization failed');
  }

  return json.data;
}

export async function verifyTransaction(transactionId: string) {
  if (!FLUTTERWAVE_SECRET_KEY) {
    return { status: 'mock', tx_ref: transactionId, amount: 0, currency: 'NGN', created_at: new Date().toISOString() };
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
    throw new Error(json.message || 'Transaction verification failed');
  }

  return json.data;
}

export function verifyWebhookSignature(signature: string, payload: string) {
  const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!secretHash) {
    return false;
  }

  // Flutterwave just uses a direct string comparison for the secret hash sent in the header
  return signature === secretHash;
}
