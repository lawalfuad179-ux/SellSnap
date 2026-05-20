import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { ProductsClient } from './ProductsClient';

export default async function ProductsPage() {
  const session = await getSession();
  if (!session) return null;

  const products = await prisma.product.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
  });

  const serialized = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    price: p.price,
  }));

  return <ProductsClient products={serialized} />;
}
