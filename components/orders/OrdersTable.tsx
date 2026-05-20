'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { Search, ChevronDown } from 'lucide-react';
import styles from './OrdersTable.module.css';

interface Order {
  id: string;
  amount: number;
  status: string;
  buyerEmail: string | null;
  createdAt: string;
  product: { name: string; imageUrl?: string };
}

interface OrdersTableProps {
  orders: Order[];
  compact?: boolean;
}

export const OrdersTable = ({ orders, compact }: OrdersTableProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.product.name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    return [...list].sort((a, b) => {
      const cmp = sortField === 'date'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : a.amount - b.amount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [orders, search, statusFilter, sortField, sortDir]);

  if (orders.length === 0) {
    return <div className={styles.empty}>No orders yet.</div>;
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <ChevronDown size={13} className={`${styles.sortIcon} ${sortField === field ? styles.sortIconActive : ''} ${sortField === field && sortDir === 'desc' ? styles.sortIconDesc : ''}`} />
  );

  return (
    <div>
      {!compact && (
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thImage}>Image</th>
              <th className={styles.th}>Product</th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => toggleSort('amount')}>
                Amount <SortIcon field="amount" />
              </th>
              <th className={`${styles.th} ${styles.sortable}`} onClick={() => toggleSort('date')}>
                Date <SortIcon field="date" />
              </th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td className={styles.tdImage}>
                  <div className={styles.thumbWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={order.product.imageUrl || ''} alt={order.product.name} className={styles.thumb} />
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.productName}>{order.product.name}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.amount}>₦{(order.amount / 100).toLocaleString()}</span>
                </td>
                <td className={styles.td}>
                  <span className={styles.date}>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                </td>
                <td className={styles.td}>
                  <Badge status={order.status as 'pending' | 'paid' | 'failed'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
