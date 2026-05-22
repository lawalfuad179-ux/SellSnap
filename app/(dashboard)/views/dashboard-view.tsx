import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { OrdersTable } from '@/components/orders/OrdersTable';


import styles from '../dashboard/Dashboard.module.css';
import Link from 'next/link';

function TrendPct({ value, isZero, label }: { value: number; isZero: boolean; label: string }) {
  if (isZero || value === 0) return null;
  const isUp = value > 0;
  return (
    <span
      style={{
        fontSize: 'var(--font-label-medium-font-size)',
        fontWeight: 600,
        color: isUp ? 'var(--color-trend-up)' : 'var(--color-error)',
        animation: 'trendFadeIn 0.6s ease',
      }}
    >
      {isUp ? '+' : ''}{value}% <span style={{ fontWeight: 400, opacity: 0.6 }}>{label}</span>
    </span>
  );
}

export default async function DashboardView() {
  const session = await getSession();
  if (!session) return null;

  const userId = (session.user as any).id;

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [userData, productsCount, totalOrders, revenue, recentOrders, thisMonthOrders, lastMonthOrders, thisMonthRevenue, lastMonthRevenue, thisMonthProducts, lastMonthProducts] = await Promise.all([
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
    prisma.order.count({
      where: { product: { userId }, createdAt: { gte: startOfThisMonth, lt: startOfNextMonth } },
    }),
    prisma.order.count({
      where: { product: { userId }, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
    }),
    prisma.order.aggregate({
      where: { product: { userId }, status: 'paid', createdAt: { gte: startOfThisMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: { product: { userId }, status: 'paid', createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      _sum: { amount: true },
    }),
    prisma.product.count({
      where: { userId, createdAt: { gte: startOfThisMonth, lt: startOfNextMonth } },
    }),
    prisma.product.count({
      where: { userId, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
    }),
  ]);

  const totalRevenue = revenue._sum.amount ? revenue._sum.amount / 100 : 0;
  const totalCommission = totalRevenue * 0.05;

  const thisMonthRevenueAmount = thisMonthRevenue._sum.amount ? thisMonthRevenue._sum.amount / 100 : 0;
  const lastMonthRevenueAmount = lastMonthRevenue._sum.amount ? lastMonthRevenue._sum.amount / 100 : 0;
  const revenueGrowth = lastMonthRevenueAmount > 0 ? Math.round(((thisMonthRevenueAmount - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100) : thisMonthRevenueAmount > 0 ? 100 : 0;

  const orderGrowth = lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : thisMonthOrders > 0 ? 100 : 0;

  const productGrowth = lastMonthProducts > 0 ? Math.round(((thisMonthProducts - lastMonthProducts) / lastMonthProducts) * 100) : thisMonthProducts > 0 ? 100 : 0;

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.greeting}>
          Welcome back, {(session.user as any).businessName}!
        </h1>
        <DashboardHeader name={session.user?.name || ''} avatarUrl={userData?.avatarUrl || null} />
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statBody}>
            <h3 className={styles.statLabel}>Total Revenue</h3>
            <div className={styles.statValueRow}>
              <p className={styles.statValue} style={{ color: 'var(--color-primary)' }}>
                ₦{totalRevenue.toLocaleString()}
              </p>
            </div>
            <TrendPct value={revenueGrowth} isZero={lastMonthRevenueAmount === 0 && thisMonthRevenueAmount === 0} label="from last month" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statBody}>
            <h3 className={styles.statLabel}>Commission</h3>
            <div className={styles.statValueRow}>
              <p className={styles.statValue} style={{ color: 'var(--color-primary)' }}>
                ₦{totalCommission.toLocaleString()}
              </p>
            </div>
            <TrendPct value={revenueGrowth} isZero={lastMonthRevenueAmount === 0 && thisMonthRevenueAmount === 0} label="from last month" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statBody}>
            <h3 className={styles.statLabel}>Total Orders</h3>
            <div className={styles.statValueRow}>
              <p className={styles.statValue} style={{ color: 'var(--color-on-surface)' }}>
                {totalOrders}
              </p>
            </div>
            <TrendPct value={orderGrowth} isZero={lastMonthOrders === 0 && thisMonthOrders === 0} label="from last month" />
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statBody}>
            <h3 className={styles.statLabel}>Active Products</h3>
            <div className={styles.statValueRow}>
              <p className={styles.statValue} style={{ color: 'var(--color-on-surface)' }}>
                {productsCount}
              </p>
            </div>
            <TrendPct value={productGrowth} isZero={lastMonthProducts === 0 && thisMonthProducts === 0} label="from last month" />
          </div>
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
