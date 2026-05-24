import { z } from 'zod';

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  FLUTTERWAVE_PUBLIC_KEY: isProd ? z.string().min(1) : z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: isProd ? z.string().min(1) : z.string().optional(),
  FLUTTERWAVE_SECRET_HASH: isProd ? z.string().min(1) : z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
