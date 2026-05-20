import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const fromEmail = process.env.RESEND_FROM_EMAIL || 'SellSnap <onboarding@resend.dev>';

export async function sendPaymentConfirmationEmail({
  sellerEmail,
  sellerName,
  productName,
  amount,
  buyerEmail,
}: {
  sellerEmail: string;
  sellerName: string;
  productName: string;
  amount: number;
  buyerEmail: string | null;
}) {
  const client = getResend();
  if (!client) {
    console.log('[Email] RESEND_API_KEY not set, skipping email notification');
    return;
  }

  try {
    const formattedAmount = `₦${(amount / 100).toLocaleString()}`;

    await client.emails.send({
      from: fromEmail,
      to: sellerEmail,
      subject: `You received a payment for ${productName}`,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Payment Received!</h2>
        <p>Hi ${sellerName},</p>
        <p>Great news! A buyer has just paid for your product.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Product</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #16a34a;">${formattedAmount}</td>
          </tr>
          ${buyerEmail ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Buyer</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${buyerEmail}</td>
          </tr>` : ''}
        </table>
        <p style="color: #6b7280; font-size: 14px;">View your orders in the <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="color: #16a34a;">SellSnap dashboard</a>.</p>
      </div>`,
    });

    console.log(`[Email] Payment confirmation sent to ${sellerEmail}`);
  } catch (error) {
    console.error('[Email] Failed to send payment confirmation:', error);
  }
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  const client = getResend();
  if (!client) {
    console.log('[Email] RESEND_API_KEY not set, skipping password reset email');
    return;
  }

  try {
    await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset your SellSnap password',
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Password Reset</h2>
        <p>You requested a password reset for your SellSnap account.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });
    console.log(`[Email] Password reset email sent to ${email}`);
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
  }
}
