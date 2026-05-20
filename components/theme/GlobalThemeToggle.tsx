'use client';

import { ThemeToggle } from './ThemeToggle';

export const GlobalThemeToggle = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 'var(--space-16)',
      right: 'var(--space-16)',
      zIndex: 100,
    }}>
      <ThemeToggle />
    </div>
  );
};
