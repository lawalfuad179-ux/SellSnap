'use client';

import { Menu } from 'lucide-react';

export const MobileHamburger = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <button
      type="button"
      className="mobile-hamburger"
      onClick={onOpen}
      aria-label="Open menu"
      style={{
        display: 'none',
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface)',
        border: 'none',
        color: 'var(--color-on-surface)',
        cursor: 'pointer',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 4px hsla(0, 0%, 0%, 0.08)',
        flexShrink: 0,
      }}
    >
      <Menu size={22} />
    </button>
  );
};
