import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/avatar/Avatar';
import { BackLink } from '@/components/ui/BackLink';
import styles from '../profile/Profile.module.css';
import { Store, User, Banknote } from 'lucide-react';

export default async function ProfileView() {
  const session = await getSession();
  if (!session) return null;

  const userId = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, businessName: true, avatarUrl: true },
  });

  if (!user) return null;

  const totalRevenue = await prisma.order.aggregate({
    where: { product: { userId }, status: 'paid' },
    _sum: { amount: true },
  });

  const revenue = totalRevenue._sum.amount ? totalRevenue._sum.amount / 100 : 0;
  const commission = revenue * 0.05;

  return (
    <div>
      <BackLink href="/dashboard" />
      <h1 className={styles.pageTitle}>Profile</h1>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <User size={20} />
          <h2>Profile</h2>
        </div>
        <div className={styles.profileRow}>
          <Avatar name={user.name} size="lg" avatarUrl={user.avatarUrl} />
          <div>
            <p className={styles.businessName}>{user.businessName}</p>
            <p className={styles.email}>{user.email}</p>
            <p className={styles.name}>{user.name}</p>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <Store size={20} />
          <h2>Store Details</h2>
        </div>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label>Business Name</label>
            <p>{user.businessName}</p>
          </div>
          <div className={styles.field}>
            <label>Owner Name</label>
            <p>{user.name}</p>
          </div>
          <div className={styles.field}>
            <label>Contact Email</label>
            <p>{user.email}</p>
          </div>
          <div className={styles.field}>
            <label>Commission Rate</label>
            <p>5%</p>
          </div>
        </div>
      </Card>

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <Banknote size={20} />
          <h2>Payout & Earnings</h2>
        </div>
        <div className={styles.payoutGrid}>
          <div className={styles.payoutCard}>
            <p className={styles.payoutLabel}>Total Revenue</p>
            <p className={styles.payoutValue}>₦{revenue.toLocaleString()}</p>
          </div>
          <div className={styles.payoutCard}>
            <p className={styles.payoutLabel}>SellSnap Commission (5%)</p>
            <p className={styles.payoutValue}>₦{commission.toLocaleString()}</p>
          </div>
          <div className={styles.payoutCard}>
            <p className={styles.payoutLabel}>Your Earnings</p>
            <p className={styles.payoutValueAccent}>₦{(revenue - commission).toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
