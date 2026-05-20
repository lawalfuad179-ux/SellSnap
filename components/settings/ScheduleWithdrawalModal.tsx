'use client';

import { useState } from 'react';
import { X, CalendarDays } from 'lucide-react';

interface Props {
  availableBalance: number;
  onClose: () => void;
  onSchedule: (amount: number, date: string) => Promise<void>;
}

export const ScheduleWithdrawalModal = ({ availableBalance, onClose, onSchedule }: Props) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { setError('Enter a valid amount'); return; }
    if (numAmount > availableBalance) { setError('Insufficient balance'); return; }
    if (!date) { setError('Select a date'); return; }

    setLoading(true);
    try {
      const scheduledAt = `${date}T${time || '12:00'}:00`;
      await onSchedule(numAmount, scheduledAt);
      onClose();
    } catch {
      setError('Failed to schedule withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'hsla(0, 0%, 0%, 0.3)', padding: 'var(--space-16)',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--color-surface-container-high)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-32)',
        width: '100%', maxWidth: 400, boxShadow: '0 8px 32px hsla(0, 0%, 0%, 0.12)',
      }} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-24)' }}>
          <h2 style={{ fontSize: 'var(--font-headline-small-font-size)', color: 'var(--color-primary)', fontWeight: 700 }}>SellSnap</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: 'var(--font-body-large-font-size)', color: 'var(--color-on-surface)', marginBottom: 'var(--space-8)' }}>Schedule Withdrawal</p>
        <p style={{ fontSize: 'var(--font-body-medium-font-size)', color: 'var(--color-on-surface-variant)', marginBottom: 'var(--space-24)' }}>
          Available balance: ₦{availableBalance.toLocaleString()}
        </p>

        {error && (
          <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-label-medium-font-size)', marginBottom: 'var(--space-12)' }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <div>
            <label htmlFor="wd-amount" style={{ fontSize: 'var(--font-label-small-font-size)', fontWeight: 600, color: 'var(--color-outline)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 'var(--space-6)' }}>
              Amount (₦)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', pointerEvents: 'none', fontSize: 'var(--font-body-large-font-size)', fontWeight: 600 }}>₦</span>
              <input
                id="wd-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', height: 44, padding: '0 12px 0 32px',
                  border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'inherit', fontSize: 'var(--font-body-large-font-size)',
                  color: 'var(--color-on-surface)', backgroundColor: 'var(--color-surface)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="wd-date" style={{ fontSize: 'var(--font-label-small-font-size)', fontWeight: 600, color: 'var(--color-outline)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 'var(--space-6)' }}>
                Date
              </label>
              <div style={{ position: 'relative' }}>
                <CalendarDays size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', pointerEvents: 'none' }} />
                <input
                  id="wd-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%', height: 44, padding: '0 12px 0 36px',
                    border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)',
                    fontFamily: 'inherit', fontSize: 'var(--font-body-medium-font-size)',
                    color: 'var(--color-on-surface)', backgroundColor: 'var(--color-surface)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="wd-time" style={{ fontSize: 'var(--font-label-small-font-size)', fontWeight: 600, color: 'var(--color-outline)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 'var(--space-6)' }}>
                Time
              </label>
              <input
                id="wd-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{
                  width: '100%', height: 44, padding: '0 12px',
                  border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-md)',
                  fontFamily: 'inherit', fontSize: 'var(--font-body-medium-font-size)',
                  color: 'var(--color-on-surface)', backgroundColor: 'var(--color-surface)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-24)' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: 44, border: 'none', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-surface-container-highest)',
              color: 'var(--color-on-surface)', fontFamily: 'inherit',
              fontSize: 'var(--font-label-large-font-size)', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, height: 44, border: 'none', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)', fontFamily: 'inherit',
              fontSize: 'var(--font-label-large-font-size)', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};
