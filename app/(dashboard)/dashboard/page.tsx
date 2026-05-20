import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { OrdersTable } from '@/components/orders/OrdersTable';
import styles from './Dashboard.module.css';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const userId = (session.user as any).id;

  const [userData, productsCount, totalOrders, revenue, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, avatarUrl: true },
    }),
    prisma.product.count({ where: { userId } }),
    prisma.order.count({ where: { product: { userId } } }),
    prisma.order.aggregate({
      where: { product: { userId }, status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.order.findMany({
      where: { product: { userId } },
      include: { product: { select: { name: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const totalRevenue = revenue._sum.amount ? revenue._sum.amount / 100 : 0;
  const totalCommission = totalRevenue * 0.05;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.greeting}>
          Welcome back, {(session.user as any).businessName}!
        </h1>
        <DashboardHeader name={session.user?.name || ''} avatarUrl={userData?.avatarUrl || null} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-16)', marginBottom: 'var(--space-48)' }}>
        <Card className={styles.statCard}>
          <h3 className={styles.statLabel}>Total Revenue</h3>
          <p className={styles.statValue} style={{ color: 'var(--color-primary)' }}>
            ₦{totalRevenue.toLocaleString()}
          </p>
        </Card>
        <Card className={styles.statCard}>
          <h3 className={styles.statLabel}>SellSnap Commission</h3>
          <p className={styles.statValue} style={{ color: 'var(--color-primary)' }}>
            ₦{totalCommission.toLocaleString()}
          </p>
        </Card>
        <Card className={styles.statCard}>
          <h3 className={styles.statLabel}>Total Orders</h3>
          <p className={styles.statValue} style={{ color: 'var(--color-on-surface)' }}>
            {totalOrders}
          </p>
        </Card>
        <Card className={styles.statCard}>
          <h3 className={styles.statLabel}>Active Products</h3>
          <p className={styles.statValue} style={{ color: 'var(--color-on-surface)' }}>
            {productsCount}
          </p>
        </Card>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-16)' }}>
        <h2 style={{ fontSize: 'var(--font-title-large-font-size)' }}>Recent Orders</h2>
        <Link href="/orders">
          <Button variant="ghost" size="sm">View all</Button>
        </Link>
      </div>

      <OrdersTable orders={recentOrders.map(o => ({ ...o, createdAt: o.createdAt.toISOString() }))} />
    </div>
  );
}
