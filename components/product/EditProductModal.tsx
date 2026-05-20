'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { updateProductAction } from '@/app/(dashboard)/actions';
import { X } from 'lucide-react';
import styles from './AddProductModal.module.css';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  uniqueSlug: string;
}

interface EditProductModalProps {
  product: Product;
  onClose: () => void;
}

export const EditProductModal = ({ product, onClose }: EditProductModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await updateProductAction(product.id, formData);

    if (!res.ok) {
      setError(res.error?.message || 'Failed to update product');
      setIsLoading(false);
    } else {
      router.refresh();
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-20)' }}>
          <h2 style={{ fontSize: 'var(--font-title-medium-font-size)', fontWeight: 600, color: 'var(--color-on-surface)' }}>
            Edit Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'none',
              border: 'none',
              color: 'var(--color-on-surface-variant)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--font-label-medium-font-size)', marginBottom: 'var(--space-8)' }}>{error}</p>}

          <input type="hidden" name="imageUrl" value={product.imageUrl} />

          <Input
            label="Enter Product Name"
            name="name"
            id="edit-name"
            defaultValue={product.name}
            autoFocus
            required
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <label htmlFor="edit-description" style={{ fontSize: 'var(--font-label-medium-font-size)', fontWeight: 'var(--font-label-medium-font-weight)', color: 'var(--color-on-surface)' }}>
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={4}
              defaultValue={product.description}
              required
              style={{
                height: '44px',
                padding: 'var(--space-12)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'inherit',
                fontSize: 'var(--font-body-large-font-size)',
                color: 'var(--color-on-surface)',
                backgroundColor: 'var(--color-surface)',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.6s, box-shadow 0.6s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = '0 0 0 2px var(--color-primary-container), 0 8px 24px hsla(154, 100%, 42%, 0.12)'; e.target.style.borderWidth = '0.75px'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-outline-variant)'; e.target.style.boxShadow = 'none'; e.target.style.borderWidth = '1px'; }}
            />
          </div>

          <Input
            label="Enter Price (₦)"
            name="price"
            id="edit-price"
            type="number"
            min="100"
            defaultValue={product.price / 100}
            required
          />

          <ImageUploadField name="image" currentImage={product.imageUrl} />

          <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-8)' }}>
            <Button variant="secondary" fullWidth type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
