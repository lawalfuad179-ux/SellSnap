'use client';

import { useState } from 'react';
import styles from './ProductCard.module.css';
import { Button } from '@/components/ui/Button';
import { Link as LinkIcon, ExternalLink, Copy, Share2, Check, Pencil } from 'lucide-react';
import Link from 'next/link';
import { ShareModal } from './ShareModal';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  uniqueSlug: string;
  createdAt: Date;
  user?: { businessName?: string; name?: string };
}

interface ProductListCardProps {
  product: Product;
}

export function ProductListCard({ product }: ProductListCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${product.uniqueSlug}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} className={styles.image} />
        </div>
        <div className={styles.body}>
          <div>
            <p className={styles.businessName}>SellSnap</p>
            <h3 className={styles.productName}>{product.name}</h3>
          </div>
          <div className={styles.priceRow}>
            <span className={styles.price}>₦{(product.price / 100).toLocaleString()}</span>
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" size="sm" onClick={copyLink} style={{ flex: 1 }}>
              {copied ? <Check size={14} style={{ marginRight: 'var(--space-4)' }} /> : <Copy size={14} style={{ marginRight: 'var(--space-4)' }} />}
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowShare(true)} style={{ flex: 1 }}>
              <Share2 size={14} style={{ marginRight: 'var(--space-4)' }} />
              Share Link
            </Button>
          </div>
          <div className={styles.secondaryActions}>
            <Link href={`/products/${product.id}/edit`} style={{ flex: 1, textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" fullWidth>
                <Pencil size={14} style={{ marginRight: 'var(--space-4)' }} />
                Edit Product
              </Button>
            </Link>
            <Link href={`/p/${product.uniqueSlug}`} target="_blank" style={{ flex: 1, textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" fullWidth>
                <ExternalLink size={14} style={{ marginRight: 'var(--space-4)' }} />
                View live
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {showShare && (
        <ShareModal product={product} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}

interface ProductLinkCardProps {
  product: Product;
  onCopy?: () => void;
}

export function ProductLinkCard({ product, onCopy }: ProductLinkCardProps) {
  const copyLink = async () => {
    const url = `${window.location.origin}/p/${product.uniqueSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      onCopy?.();
    } catch {
      // Fallback
    }
  };

  return (
    <div className={styles.linkCard}>
      <div className={styles.linkBody}>
        <div className={styles.linkMeta}>
          <span>{product.user?.businessName || 'SellSnap'}</span>
          <span className={styles.linkDot} />
          <span>{new Date(product.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h2 className={styles.linkProductName}>{product.name}</h2>
        <p className={styles.linkDescription}>{product.description}</p>
        <span className={styles.linkPrice}>₦{(product.price / 100).toLocaleString()}</span>
        <div className={styles.linkActions}>
          <Link href={`/p/${product.uniqueSlug}`} target="_blank">
            <Button size="sm">
              <ExternalLink size={14} style={{ marginRight: 'var(--space-4)' }} />
              Open Link
            </Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={copyLink}>
            <Copy size={14} style={{ marginRight: 'var(--space-4)' }} />
            Copy Link
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EmptyProductStateProps {
  onCreateClick?: () => void;
}

export function EmptyProductState({ onCreateClick }: EmptyProductStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <LinkIcon size={48} />
      </div>
      <h3 className={styles.emptyStateTitle}>No products yet</h3>
      <p className={styles.emptyStateText}>Create your first product and start selling with a shareable link.</p>
      {onCreateClick && (
        <Button onClick={onCreateClick}>Create Product</Button>
      )}
    </div>
  );
}
