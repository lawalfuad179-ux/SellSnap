import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

if (!process.env.NEXTAUTH_URL && process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXTAUTH_URL = process.env.NEXT_PUBLIC_APP_URL;
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
