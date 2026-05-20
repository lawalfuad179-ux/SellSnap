import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-surface)',
      padding: 'var(--space-16)',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: 'var(--font-display-medium-font-size)', color: 'var(--color-primary)' }}>
        404
      </h1>
      <p style={{ fontSize: 'var(--font-headline-small-font-size)', color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-32)' }}>
        This product is no longer available or the page does not exist.
      </p>
      <Link href="/">
        <Button>Go Back Home</Button>
      </Link>
    </div>
  );
}
