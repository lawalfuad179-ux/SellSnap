import prisma from '@/lib/db';
import { PayNowButton } from '@/components/product/PayNowButton';
import { ProductPageHeader } from '@/components/product/ProductPageHeader';
import { MouseTracker } from '@/components/effects/MouseTracker';
import { BackLink } from '@/components/ui/BackLink';
import styles from './ProductPage.module.css';
import { Metadata } from 'next';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { uniqueSlug: slug },
    include: { user: true },
  });

  if (!product) {
    return { title: 'Product Not Available | SellSnap' };
  }

  return {
    title: `${product.name} | ${product.user.businessName}`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.imageUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.imageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { uniqueSlug: slug },
    include: { user: true },
  });

  if (!product) {
    return (
      <div className={styles.notFound}>
        <MouseTracker />
        <h1 className={styles.notFoundTitle}>Product Not Available</h1>
        <p className={styles.notFoundText}>This product is no longer available for purchase.</p>
        <Link href="/">
          <Button>Go Back Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <MouseTracker />
      <div className={styles.topBar}>
        <BackLink href="/" />
        <ProductPageHeader />
      </div>
      <div className={styles.imageWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className={styles.productImage} 
        />
      </div>

      <div className={styles.content}>
        <div className={styles.breadcrumb}>
          <span className={styles.businessName}>{product.user.businessName}</span>
          <span className={styles.breadcrumbDot} />
          <span>Product</span>
        </div>

        <h1 className={styles.productName}>{product.name}</h1>

        <div className={styles.priceRow}>
          <span className={styles.price}>₦{(product.price / 100).toLocaleString()}</span>
          <span className={styles.priceLabel}>One-Time Payment</span>
        </div>

        <div className={styles.divider} />

        <div className={styles.description}>
          <p className={styles.descriptionLabel}>Product Description</p>
          <p>{product.description}</p>
        </div>
      </div>

      <div className={styles.payWrapper}>
        <PayNowButton productId={product.id} price={product.price} />
      </div>
    </div>
  );
}
