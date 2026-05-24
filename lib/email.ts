import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import prisma from '@/lib/db';
import { logger } from '@/lib/logger';

let transporter: nodemailer.Transporter | null = null;
let resendClient: Resend | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Get the correct "from" address based on provider
function getFromEmail(): string {
  if (process.env.EMAIL_PROVIDER === 'resend') {
    return process.env.RESEND_FROM_EMAIL || 'SellSnap <onboarding@resend.dev>';
  }
  return process.env.SMTP_FROM_EMAIL || 'SellSnap <updates@sellsnap.local>';
}

// Unified dispatcher
async function dispatchEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';
  const from = getFromEmail();

  if (provider === 'resend') {
    const client = getResendClient();
    if (!client) {
      logger.info('Email', 'RESEND_API_KEY not set, skipping email dispatch via Resend');
      return;
    }
    await client.emails.send({ from, to, subject, html });
    logger.info('Email', 'Dispatched via Resend', { to });
  } else {
    const client = getTransporter();
    if (!client) {
      logger.info('Email', 'SMTP_HOST not set, skipping email dispatch via SMTP');
      return;
    }
    await client.sendMail({ from, to, subject, html });
    logger.info('Email', 'Dispatched via SMTP', { to });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function sendPaymentConfirmationEmail({
  sellerEmail,
  sellerName,
  productName,
  amount,
  buyerEmail,
  userId,
}: {
  sellerEmail: string;
  sellerName: string;
  productName: string;
  amount: number;
  buyerEmail: string | null;
  userId: string;
}) {
  try {
    const prefs = await prisma.emailPreference.findUnique({ where: { userId } });
    if (prefs && !prefs.paymentConfirmation) {
      logger.info('Email', 'Skipped — user disabled payment confirmation email', { userId });
      return;
    }

    const formattedAmount = `₦${(amount / 100).toLocaleString()}`;
    const safeName = escapeHtml(sellerName);
    const safeProduct = escapeHtml(productName);
    const safeAmount = escapeHtml(formattedAmount);
    const safeBuyer = buyerEmail ? escapeHtml(buyerEmail) : '';

    await dispatchEmail({
      to: sellerEmail,
      subject: `You received a payment for ${safeProduct}`,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Payment Received!</h2>
        <p>Hi ${safeName},</p>
        <p>Great news! A buyer has just paid for your product.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Product</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${safeProduct}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #16a34a;">${safeAmount}</td>
          </tr>
          ${buyerEmail ? `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Buyer</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${safeBuyer}</td>
          </tr>` : ''}
        </table>
        <p style="color: #6b7280; font-size: 14px;">View your orders in the <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="color: #16a34a;">SellSnap dashboard</a>.</p>
      </div>`,
    });
  } catch (error) {
    logger.error('Email', 'Failed to send payment confirmation', { error: (error as Error)?.message });
  }
}

export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  try {
    const safeUrl = escapeHtml(resetUrl);
    const safeEmail = escapeHtml(email);

    await dispatchEmail({
      to: email,
      subject: 'Reset your SellSnap password',
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Password Reset</h2>
        <p>You requested a password reset for your SellSnap account linked to <strong>${safeEmail}</strong>.</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${safeUrl}" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });
  } catch (error) {
    logger.error('Email', 'Failed to send password reset email', { error: (error as Error)?.message });
  }
}

export async function sendBuyerReceiptEmail({
  buyerEmail,
  sellerBusinessName,
  productName,
  amount,
}: {
  buyerEmail: string;
  sellerBusinessName: string;
  productName: string;
  amount: number;
}) {
  try {
    const formattedAmount = `₦${(amount / 100).toLocaleString()}`;
    const safeBusiness = escapeHtml(sellerBusinessName);
    const safeProduct = escapeHtml(productName);
    const safeAmount = escapeHtml(formattedAmount);

    await dispatchEmail({
      to: buyerEmail,
      subject: `Receipt — ${safeProduct}`,
      html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>

        <h2 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center;">Payment Successful!</h2>

        <p style="color: #374151; font-size: 15px; line-height: 1.5; margin: 0 0 24px; text-align: center;">
          Thank you for your purchase of <strong>${safeProduct}</strong> from <strong>${safeBusiness}</strong>.
        </p>

        <table style="width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate; overflow: hidden; margin-bottom: 24px;">
          <tbody>
            <tr>
              <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Amount Paid</td>
              <td style="padding: 12px 16px; font-weight: 700; font-size: 15px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">${safeAmount}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Product</td>
              <td style="padding: 12px 16px; font-weight: 600; font-size: 14px; color: #111827; text-align: right; border-bottom: 1px solid #f3f4f6;">${safeProduct}</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; color: #6b7280; font-size: 14px;">Seller</td>
              <td style="padding: 12px 16px; font-weight: 600; font-size: 14px; color: #111827; text-align: right;">${safeBusiness}</td>
            </tr>
          </tbody>
        </table>

        <p style="color: #9ca3af; font-size: 13px; line-height: 1.4; text-align: center; margin: 0;">
          Thank you for choosing <strong>SellSnap</strong>. If you have any questions, reply to this email or contact the seller directly.
        </p>
      </div>`,
    });
  } catch (error) {
    logger.error('Email', 'Failed to send buyer receipt', { error: (error as Error)?.message });
  }
}

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  try {
    const safeName = escapeHtml(name);

    await dispatchEmail({
      to: email,
      subject: 'Welcome to SellSnap!',
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Welcome aboard, ${safeName}! 🚀</h2>
        <p>We're thrilled to have you join SellSnap. You're just a few steps away from selling your products directly to your customers with zero hassle.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li><strong>Complete your profile:</strong> Add your business details and logo.</li>
          <li><strong>Add your bank account:</strong> So we know where to send your money!</li>
          <li><strong>Create your first product:</strong> Get a shareable link instantly.</li>
        </ul>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background-color: #16a34a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Go to Dashboard</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Happy selling!<br/>The SellSnap Team</p>
      </div>`,
    });
  } catch (error) {
    logger.error('Email', 'Failed to send welcome email', { error: (error as Error)?.message });
  }
}
