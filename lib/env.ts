import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_HASH: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  EMAIL_PROVIDER: z.enum(['smtp', 'resend']).default('smtp'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  const issues = _env.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
  console.error('❌ Invalid environment variables:', issues);
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const env = _env.data;
