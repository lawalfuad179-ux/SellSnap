'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ScheduleWithdrawalModal } from '@/components/settings/ScheduleWithdrawalModal';
import { Pencil, Trash2, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';
import styles from './Settings.module.css';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  scheduledAt: string;
  createdAt: string;
}

export const SettingsClient = () => {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [storeEnabled, setStoreEnabled] = useState(true);
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifPayment, setNotifPayment] = useState(true);
  const [notifPayout, setNotifPayout] = useState(false);

  const fetchData = async () => {
    const [acctRes, wdRes] = await Promise.all([
      fetch('/api/bank-account'),
      fetch('/api/withdrawals'),
    ]);
    const acct = await acctRes.json();
    const wd = await wdRes.json();
    if (acct.data) setAccount(acct.data);
    setWithdrawals(wd.data || []);
  };

  const fetchRevenue = async () => {
    try {
      const res = await fetch('/api/orders/revenue');
      const json = await res.json();
      if (json.ok) setRevenue(json.revenue / 100);
    } catch {}
  };

  useEffect(() => { fetchData(); fetchRevenue(); }, []);

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

  const handleSchedule = async (amount: number, scheduledAt: string) => {
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, scheduledAt }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error);
    await fetchData();
  };

  const deleteWithdrawal = async (id: string) => {
    await fetch('/api/withdrawals', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchData();
  };

  const scheduledWithdrawals = withdrawals.filter((w) => w.status === 'scheduled');

  const Toggle = ({ on, setOn, label }: { on: boolean; setOn: (v: boolean) => void; label: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 'var(--font-body-medium-font-size)', color: 'var(--color-on-surface)' }}>
      {label}
      <div
        onClick={() => setOn(!on)}
        style={{
          width: 40, height: 22, borderRadius: 11, padding: 2,
          backgroundColor: on ? 'var(--color-primary)' : 'var(--color-outline-variant)',
          transition: 'background-color 0.2s', cursor: 'pointer',
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
        <p className={styles.groupDesc}>Receive email alerts for new orders and payouts.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          <Toggle on={notifNewOrder} setOn={setNotifNewOrder} label="New order alerts" />
          <Toggle on={notifPayment} setOn={setNotifPayment} label="Payment confirmation" />
          <Toggle on={notifPayout} setOn={setNotifPayout} label="Payout notifications" />
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

      {/* Payout Schedule */}
      <Card className={styles.group}>
        <div className={styles.groupHeader}>
          <h2 className={styles.groupTitle}>Payout Schedule</h2>
        </div>

        {account ? (
          <>
            <p className={styles.groupDesc}>Earnings are automatically sent to your withdrawal account every Monday.</p>
            <button className={styles.scheduleCta} onClick={() => setShowSchedule(true)}>
              <Plus size={16} />
              Schedule Withdrawal
            </button>
          </>
        ) : (
          <p className={styles.errorText}>Set up a withdrawal account before scheduling payouts.</p>
        )}

        {scheduledWithdrawals.length > 0 && (
          <div style={{ marginTop: 'var(--space-20)' }}>
            <p className={styles.scheduledLabel}>Scheduled Withdrawals</p>
            {scheduledWithdrawals.map((w) => (
              <div key={w.id} className={styles.withdrawalRow}>
                <div>
                  <p className={styles.wdAmount}>₦{(w.amount / 100).toLocaleString()}</p>
                  <p className={styles.wdDate}>{format(new Date(w.scheduledAt), 'MMM d, yyyy · h:mm a')}</p>
                </div>
                <button className={styles.wdAction} onClick={() => deleteWithdrawal(w.id)} title="Cancel">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showSchedule && (
        <ScheduleWithdrawalModal
          availableBalance={revenue}
          onClose={() => setShowSchedule(false)}
          onSchedule={handleSchedule}
        />
      )}
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
            {saving ? 'Saving...' : <><Check size={14} /> Save Account</>}
          </button>
        </div>
      </div>
    );
  }
};
