'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BackLinkProps {
  href: string;
  label?: string;
}

export function BackLink({ href, label = 'Back' }: BackLinkProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        color: 'var(--color-outline)',
        fontSize: 'var(--font-label-medium-font-size)',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-outline)')}
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  );
}
