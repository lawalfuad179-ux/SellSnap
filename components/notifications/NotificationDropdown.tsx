'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Bell, CheckCheck, Check } from 'lucide-react';
import styles from './NotificationDropdown.module.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setNotifications(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = async (id: string) => {
    await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div ref={ref} className={styles.wrapper}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className={styles.markReadButton} onClick={markAllRead}>
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <p className={styles.empty}>No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`${styles.item} ${n.read ? styles.read : styles.unread}`}>
                  {!n.read && <span className={styles.unreadDot} />}
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{n.title}</div>
                    <p className={styles.itemMessage}>{n.message}</p>
                    <span className={styles.itemTime}>{format(new Date(n.createdAt), 'PPp')}</span>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      className={styles.markOneButton}
                      onClick={(e) => { e.stopPropagation(); markOneRead(n.id); }}
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
