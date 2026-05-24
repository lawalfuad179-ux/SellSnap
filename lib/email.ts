import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

let transporter: nodemailer.Transporter | null = null;

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

const fromEmail = process.env.SMTP_FROM_EMAIL || 'SellSnap <updates@sellsnap.local>';

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
}: {
  sellerEmail: string;
  sellerName: string;
  productName: string;
  amount: number;
  buyerEmail: string | null;
}) {
  const client = getTransporter();
  if (!client) {
    logger.info('Email', 'SMTP_HOST not set, skipping email notification');
    return;
  }

  try {
    const formattedAmount = `₦${(amount / 100).toLocaleString()}`;
    const safeName = escapeHtml(sellerName);
    const safeProduct = escapeHtml(productName);
    const safeAmount = escapeHtml(formattedAmount);
    const safeBuyer = buyerEmail ? escapeHtml(buyerEmail) : '';

    await client.sendMail({
      from: fromEmail,
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

    logger.info('Email', 'Payment confirmation sent');
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
  const client = getTransporter();
  if (!client) {
    logger.info('Email', 'SMTP_HOST not set, skipping password reset email');
    return;
  }

  try {
    const safeUrl = escapeHtml(resetUrl);
    const safeEmail = escapeHtml(email);

    await client.sendMail({
      from: fromEmail,
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

    logger.info('Email', 'Password reset email sent');
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
  const client = getTransporter();
  if (!client) {
    logger.info('Email', 'SMTP_HOST not set, skipping buyer receipt email');
    return;
  }

  try {
    const formattedAmount = `₦${(amount / 100).toLocaleString()}`;
    const safeBusiness = escapeHtml(sellerBusinessName);
    const safeProduct = escapeHtml(productName);
    const safeAmount = escapeHtml(formattedAmount);
    const safeBuyerEmail = escapeHtml(buyerEmail);

    await client.sendMail({
      from: fromEmail,
      to: buyerEmail,
      subject: `Your receipt for ${safeProduct}`,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Thank you for your purchase!</h2>
        <p>This is a receipt for your recent purchase from <strong>${safeBusiness}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Product</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${safeProduct}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount Paid</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #16a34a;">${safeAmount}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 14px;">If you have any questions about this order, please contact the seller directly.</p>
      </div>`,
    });

    logger.info('Email', 'Buyer receipt sent', { to: safeBuyerEmail });
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
  const client = getTransporter();
  if (!client) {
    logger.info('Email', 'SMTP_HOST not set, skipping welcome email');
    return;
  }

  try {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);

    await client.sendMail({
      from: fromEmail,
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

    logger.info('Email', 'Welcome email sent', { to: safeEmail });
  } catch (error) {
    logger.error('Email', 'Failed to send welcome email', { error: (error as Error)?.message });
  }
}
