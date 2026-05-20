'use client';

import { useEffect, useState } from 'react';
import styles from './ShareModal.module.css';
import { X, Check, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  product: {
    name: string;
    price: number;
    imageUrl: string;
    uniqueSlug: string;
  };
  onClose: () => void;
}

const platforms = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    key: 'twitter',
    label: 'X (Twitter)',
    color: '#000',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    key: 'telegram',
    label: 'Telegram',
    color: '#0088CC',
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.7-6.05c.73-.33 1.43.18 1.15 1.3l-2.67 12.6c-.21.92-.75 1.14-1.52.71l-4.2-3.1-2.02 1.95c-.23.23-.42.44-.5.58z"/>
      </svg>
    ),
  },
];

export function ShareModal({ product, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/p/${product.uniqueSlug}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareTo = (platform: string) => {
    const text = `Check out ${product.name} — ₦${(product.price / 100).toLocaleString()} via SellSnap`;
    const url = productUrl;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);

    let href = '';
    switch (platform) {
      case 'whatsapp':
        href = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'twitter':
        href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'telegram':
        href = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
    }
    window.open(href, '_blank', 'width=600,height=400');
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandName}>SellSnap</span>
          </div>

          <div className={styles.productPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
            <div className={styles.productInfo}>
              <p className={styles.productInfoName}>{product.name}</p>
              <p className={styles.productInfoPrice}>₦{(product.price / 100).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={styles.linkDisplay}>
          <p className={styles.linkLabel}>Share Link</p>
          <div className={styles.linkBox}>
            <LinkIcon size={14} />
            <span className={styles.linkBoxText}>{productUrl}</span>
            <button className={styles.copyBtn} onClick={copyLink}>
              {copied ? <Check size={14} /> : 'Copy'}
            </button>
          </div>
        </div>

        <div className={styles.platforms}>
          {platforms.map((p) => (
            <button key={p.key} className={styles.platformBtn} onClick={() => shareTo(p.key)}>
              <span className={styles.platformIcon} style={{ backgroundColor: p.color }}>
                {p.icon}
              </span>
              <span className={styles.platformLabel}>{p.label}</span>
            </button>
          ))}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          <X size={14} />
          Close
        </button>
      </div>
    </div>
  );
}
