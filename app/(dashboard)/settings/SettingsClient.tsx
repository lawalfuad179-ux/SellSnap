'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Pencil } from 'lucide-react';
import styles from './Settings.module.css';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const SettingsClient = () => {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifLoading, setNotifLoading] = useState<string | null>(null);

  const fetchPrefs = async () => {
    try {
      const res = await fetch('/api/bank-account');
      const acct = await res.json();
      if (acct.data) setAccount(acct.data);
    } catch {}
    try {
      const res = await fetch('/api/notifications/preferences');
      const prefs = await res.json();
      if (prefs.ok && prefs.data) {
        setNotifNewOrder(prefs.data.newOrderAlerts);
        setNotifPayment(prefs.data.paymentConfirmation);
      }
    } catch {}
  };

  const toggleNotif = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    setNotifLoading(key);
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {}
    setNotifLoading(null);
  };

  useEffect(() => { fetchPrefs(); }, []);

  const startEdit = () => {
    if (account) setForm({ bankName: account.bankName, accountNumber: account.accountNumber, accountName: account.accountName });
    setEditing(true);
    setFormError('');
  };

  const saveAccount = async () => {
    setFormError('');
    if (!form.bankName || !form.accountNumber || !form.accountName) {
      setFormError('All fields are required'); return;
    }
    if (!/^\d{10}$/.test(form.accountNumber)) {
      setFormError('Account number must be 10 digits'); return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.ok) {
        setAccount(json.data);
        setEditing(false);
      } else {
        setFormError(json.error || 'Failed to save');
      }
    } catch {
      setFormError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ on, setOn, label, loading }: { on: boolean; setOn: (v: boolean) => void | Promise<void>; label: string; loading?: boolean }) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: loading ? 'wait' : 'pointer', fontSize: 'var(--font-body-medium-font-size)', color: 'var(--color-on-surface)', opacity: loading ? 0.6 : 1 }}>
      {label}
      <div
        onClick={() => { if (!loading) setOn(!on); }}
        style={{
          width: 40, height: 22, borderRadius: 11, padding: 2,
          backgroundColor: on ? 'var(--color-primary)' : 'var(--color-outline-variant)',
          transition: 'background-color 0.2s', cursor: loading ? 'wait' : 'pointer',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.2s',
        }} />
      </div>
    </label>
  );

  return (
    <div>
      <h1 className={styles.pageTitle}>Settings</h1>

      {/* Shareable Store Link */}
      <Card className={styles.group}>
        <h2 className={styles.groupTitle}>Shareable Store Link</h2>
        <p className={styles.groupDesc}>Allow customers to browse all your products at a single link.</p>
        <Toggle on={storeEnabled} setOn={setStoreEnabled} label="Enable store link" />
      </Card>

      {/* Email Notifications */}
      <Card className={styles.group}>
        <h2 className={styles.groupTitle}>Email Notifications</h2>
        <p className={styles.groupDesc}>Receive email alerts for new orders and payments.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          <Toggle on={notifNewOrder} setOn={(v) => toggleNotif('newOrderAlerts', v, setNotifNewOrder)} label="New order alerts" loading={notifLoading === 'newOrderAlerts'} />
          <Toggle on={notifPayment} setOn={(v) => toggleNotif('paymentConfirmation', v, setNotifPayment)} label="Payment confirmation" loading={notifLoading === 'paymentConfirmation'} />
        </div>
      </Card>

      {/* Withdrawal Account */}
      <Card className={styles.group}>
        <div className={styles.groupHeader}>
          <h2 className={styles.groupTitle}>Withdrawal Account</h2>
          {account && !editing && (
            <button className={styles.editBtn} onClick={startEdit}><Pencil size={14} /> Edit</button>
          )}
        </div>

        {!account ? (
          <div>
            <p className={styles.groupDesc}>Set up your bank account for automatic payouts.</p>
            {renderForm()}
          </div>
        ) : editing ? (
          renderForm()
        ) : (
          <div className={styles.accountDisplay}>
            <div className={styles.field}>
              <label>Bank Name</label>
              <p>{account.bankName}</p>
            </div>
            <div className={styles.field}>
              <label>Account Number</label>
              <p>{account.accountNumber}</p>
            </div>
            <div className={styles.field}>
              <label>Account Name</label>
              <p>{account.accountName}</p>
            </div>
          </div>
        )}
      </Card>

    </div>
  );

  function renderForm() {
    return (
      <div className={styles.accountForm}>
        {formError && <p className={styles.formError}>{formError}</p>}
        <div className={styles.field}>
          <label>Bank Name</label>
          <input
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            placeholder="e.g. GTBank"
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label>Account Number</label>
          <input
            value={form.accountNumber}
            onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
            placeholder="0123456789"
            maxLength={10}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label>Account Name</label>
          <input
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            placeholder="Full name on account"
            className={styles.input}
          />
        </div>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => { setEditing(false); setFormError(''); }}>Cancel</button>
          <button className={styles.saveBtn} onClick={saveAccount} disabled={saving}>
            {saving ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </div>
    );
  }
};
