import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrdersTable } from '@/components/orders/OrdersTable';

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) return null;

  const orders = await prisma.order.findMany({
    where: { product: { userId: (session.user as any).id } },
    include: { product: { select: { name: true, imageUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-headline-medium-font-size)', marginBottom: 'var(--space-32)' }}>Orders</h1>
      <OrdersTable orders={serialized} />
    </div>
  );
}
