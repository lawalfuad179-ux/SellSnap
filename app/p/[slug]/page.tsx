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

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
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

      <div className={styles.productCard}>
        <div className={styles.merchantHeader}>
          <div className={styles.merchantAvatar} aria-hidden="true">
            {product.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.user.avatarUrl}
                alt={product.user.businessName}
                className={styles.merchantAvatarImage}
              />
            ) : (
              <span className={styles.merchantAvatarInitial}>
                {getInitial(product.user.businessName)}
              </span>
            )}
          </div>
          <span className={styles.merchantName}>{product.user.businessName}</span>
        </div>

        <div className={styles.productGrid}>
          <div className={styles.imageColumn}>
            <div className={styles.imageWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                className={styles.productImage}
              />
            </div>
          </div>

          <div className={styles.detailsColumn}>
            <span className={styles.eyebrow}>Product</span>

            <h1 className={styles.productName}>{product.name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.price}>
                ₦{(product.price / 100).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className={styles.priceLabel}>One-Time Payment</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.descriptionBlock}>
              <p className={styles.descriptionLabel}>Description</p>
              <p className={styles.descriptionText}>{product.description}</p>
            </div>

            <div className={styles.paymentCard}>
              <PayNowButton productId={product.id} price={product.price} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
