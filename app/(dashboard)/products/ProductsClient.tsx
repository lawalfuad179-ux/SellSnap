'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Plus, Search, ExternalLink, Copy, Check, Pencil, ChevronDown, Share2 } from 'lucide-react';
import { ShareModal } from '@/components/product/ShareModal';
import { AddProductModal } from '@/components/product/AddProductModal';
import { EditProductModal } from '@/components/product/EditProductModal';
import styles from './Products.module.css';

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
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

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
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} style={{ marginRight: 'var(--space-4)' }} />
            Add Product
          </Button>
        </div>
        <div className={styles.emptyState}>
          <h3>No products yet</h3>
          <p>Create your first product and start selling with a shareable link.</p>
          <Button onClick={() => setShowAddModal(true)}>Create Product</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Products ({products.length})</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} style={{ marginRight: 'var(--space-4)' }} />
            Add Product
          </Button>
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
    </div>
  );
};
