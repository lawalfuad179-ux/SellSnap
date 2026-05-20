'use client';

import { useState } from 'react';

export const SettingsToggle = ({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) => {
  const [on, setOn] = useState(defaultChecked);

  return (
    <label style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', fontSize: 'var(--font-body-medium-font-size)',
      color: 'var(--color-on-surface)',
    }}>
      {label}
      <div style={{
        width: 40, height: 22, borderRadius: 11, padding: 2,
        backgroundColor: on ? 'var(--color-primary)' : 'var(--color-outline-variant)',
        transition: 'background-color 0.2s', cursor: 'pointer',
      }} onClick={() => setOn(!on)}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          backgroundColor: 'white',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }} />
      </div>
    </label>
  );
};
