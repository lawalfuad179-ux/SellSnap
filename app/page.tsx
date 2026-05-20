import Link from 'next/link';
import { MouseTracker } from '@/components/effects/MouseTracker';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import './globals.css';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <div style={{ position: 'absolute', top: 'var(--space-16)', right: 'var(--space-16)' }}>
        <ThemeToggle />
      </div>
      <MouseTracker />
      <main className="landing-content">
        <h1 className="landing-logo">SellSnap</h1>
        <h2 className="landing-title">Sell anything in seconds<br />using just a link.</h2>
        <p className="landing-subtitle">
          Sell instantly, Share anywhere.
        </p>
        <Link href="/auth" className="get-started-button">
          Get Started
        </Link>
      </main>
    </div>
  );
}
