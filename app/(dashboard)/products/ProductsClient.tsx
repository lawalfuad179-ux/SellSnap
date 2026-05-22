'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Plus, Search, ExternalLink, Copy, Check, Pencil, ChevronDown, Share2, Trash2 } from 'lucide-react';
import { ShareModal } from '@/components/product/ShareModal';
import { AddProductModal } from '@/components/product/AddProductModal';
import { EditProductModal } from '@/components/product/EditProductModal';
import { deleteProductAction, undeleteProductAction } from '../actions';
import styles from './Products.module.css';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  uniqueSlug: string;
  createdAt: string;
}

type SortField = 'name' | 'price' | 'createdAt';
type SortDir = 'asc' | 'desc';
type PriceFilter = 'all' | 'low' | 'mid' | 'high';

export const ProductsClient = ({ products }: { products: Product[] }) => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [deletedData, setDeletedData] = useState<any>(null);
  const [undoing, setUndoing] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setDeletedData(null);
    }, 3000);
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    const res = await deleteProductAction(deleteProduct.id);
    if (res.ok) {
      setDeletedData(res.data);
      showToast('Product deleted');
    } else {
      showToast(res.error?.message || 'Failed to delete product');
    }
    setDeleteProduct(null);
    setDeleting(false);
  };

  const handleUndo = async () => {
    if (!deletedData) return;
    clearTimeout(toastTimerRef.current);
    setUndoing(true);
    const res = await undeleteProductAction(deletedData);
    if (res.ok) {
      setToastVisible(false);
      setDeletedData(null);
    }
    setUndoing(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = products;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (priceFilter === 'low') list = list.filter((p) => p.price / 100 <= 1000);
    else if (priceFilter === 'mid') list = list.filter((p) => p.price / 100 > 1000 && p.price / 100 <= 10000);
    else if (priceFilter === 'high') list = list.filter((p) => p.price / 100 > 10000);

    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      list = list.filter((p) => new Date(p.createdAt).toDateString() === today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      list = list.filter((p) => new Date(p.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      list = list.filter((p) => new Date(p.createdAt) >= monthAgo);
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'price') cmp = a.price - b.price;
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [products, search, sortField, sortDir, priceFilter, dateFilter]);

  const copyLink = async (slug: string, id: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ChevronDown size={14} className={`${styles.sortIcon} ${sortField === field ? styles.sortIconActive : ''} ${sortField === field && sortDir === 'desc' ? styles.sortIconDesc : ''}`} />
  );

  if (products.length === 0) {
    return (
      <div>
        <div className={styles.header}>
          <h1 className={styles.title}>Products</h1>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} style={{ marginRight: 'var(--space-4)' }} />
            Add Product
          </button>
        </div>
        <div className={styles.emptyState}>
          <h3>No products yet</h3>
          <p>Create your first product and start selling with a shareable link.</p>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            Create Product
          </button>
        </div>

        {showAddModal && (
          <AddProductModal onClose={() => setShowAddModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Products ({products.length})</h1>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} style={{ marginRight: 'var(--space-4)' }} />
            Add Product
          </button>
        </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
        >
          <option value="all">All Prices</option>
          <option value="low">Low (≤ ₦1,000)</option>
          <option value="mid">Mid (₦1k - ₦10k)</option>
          <option value="high">High (&gt; ₦10k)</option>
        </select>

        <select
          className={styles.filterSelect}
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thImage}>Image</th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => toggleSort('name')}>
                Product <SortIcon field="name" />
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => toggleSort('price')}>
                Price <SortIcon field="price" />
              </th>
              <th className={`${styles.th} ${styles.thDate} ${styles.sortable}`} onClick={() => toggleSort('createdAt')}>
                Date <SortIcon field="createdAt" />
              </th>
              <th className={styles.thActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <td className={styles.tdImage}>
                  <div className={styles.thumbWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.imageUrl} alt={product.name} className={styles.thumb} />
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.productName}>{product.name}</span>
                </td>
                <td className={styles.tdPrice}>
                  ₦{(product.price / 100).toLocaleString()}
                </td>
                <td className={styles.tdDate}>
                  {new Date(product.createdAt).toLocaleDateString('en-NG', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </td>
                <td className={styles.tdActions}>
                  <div className={styles.actionButtons}>
                    <span className={styles.tooltipWrapper}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => copyLink(product.uniqueSlug, product.id)}
                      >
                        {copiedId === product.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      {copiedId === product.id ? (
                        <span className={styles.copyTooltip}>Copied!</span>
                      ) : (
                        <span className={styles.tooltip}>Copy Link</span>
                      )}
                    </span>
                    <span className={styles.tooltipWrapper}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setShareProduct(product)}
                      >
                        <Share2 size={14} />
                      </button>
                      <span className={styles.tooltip}>Share</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setEditProduct(product)}
                      >
                        <Pencil size={14} />
                      </button>
                      <span className={styles.tooltip}>Edit</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                      <Link href={`/p/${product.uniqueSlug}`} target="_blank" className={styles.actionBtn}>
                        <ExternalLink size={14} />
                      </Link>
                      <span className={styles.tooltip}>View live</span>
                    </span>
                    <span className={styles.tooltipWrapper}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setDeleteProduct(product)}
                        style={{ color: 'var(--color-error)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className={styles.tooltip}>Delete</span>
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {shareProduct && (
        <ShareModal product={shareProduct} onClose={() => setShareProduct(null)} />
      )}

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} />
      )}

      {editProduct && (
        <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} />
      )}

      {/* Delete confirmation overlay */}
      {deleteProduct && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'hsla(0, 0%, 0%, 0.4)',
            animation: 'popupFadeIn 0.2s ease',
          }}
          onClick={() => { setDeleteProduct(null); setDeleting(false); }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-24)',
              maxWidth: 380, width: '90%',
              textAlign: 'center',
              boxShadow: 'var(--elevation-3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 'var(--space-8)', color: 'var(--color-on-surface)', fontSize: 'var(--font-title-medium-font-size)' }}>
              Delete Product
            </h3>
            <p style={{ marginBottom: 'var(--space-24)', color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-body-medium-font-size)' }}>
              Are you sure you want to delete "{deleteProduct.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'center' }}>
              <button
                style={{
                  padding: 'var(--space-8) var(--space-16)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-outline-variant)',
                  background: 'none',
                  color: 'var(--color-on-surface)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-body-medium-font-size)',
                  fontFamily: 'inherit',
                }}
                onClick={() => { setDeleteProduct(null); setDeleting(false); }}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: 'var(--space-8) var(--space-16)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: 'var(--color-error)',
                  color: 'var(--color-on-error)',
                  cursor: 'pointer',
                  fontSize: 'var(--font-body-medium-font-size)',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-dismiss toast */}
      <div
        style={{
          position: 'fixed', top: 'var(--space-16)', left: '50%', transform: 'translateX(-50%)', zIndex: 400,
          display: toastVisible ? 'flex' : 'none',
          alignItems: 'center',
          gap: 'var(--space-12)',
          backgroundColor: 'var(--color-surface-container-high)',
          border: '1px solid var(--color-outline-variant)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-12) var(--space-16)',
          fontSize: 'var(--font-body-medium-font-size)',
          fontWeight: 500,
          color: 'var(--color-on-surface)',
          boxShadow: 'var(--elevation-3)',
          whiteSpace: 'nowrap',
          animation: 'toastSlideDown 0.3s ease',
        }}
      >
        <span>{toastMsg}</span>
        {deletedData && (
          <button
            onClick={handleUndo}
            disabled={undoing}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            {undoing ? 'Undoing...' : 'Undo'}
          </button>
        )}
      </div>
    </div>
  );
};
