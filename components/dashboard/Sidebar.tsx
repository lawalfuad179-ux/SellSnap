'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';
import { LayoutDashboard, Package, ListOrdered, LogOut, PanelRightClose, PanelRightOpen, Settings, User, X, Sun, Moon } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/orders', label: 'Orders', icon: ListOrdered },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenMobile: () => void;
  onboarding?: boolean;
}

export const Sidebar = ({ mobileOpen, onCloseMobile, onOpenMobile, onboarding }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  const navLinks = navItems.map((item) => {
    const Icon = item.icon;
    const isActive = pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onCloseMobile}
        className={`${styles.navLink} ${isActive ? styles.active : ''}`}
      >
        <Icon className={styles.icon} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  });

  if (onboarding) {
    return (
      <>
        <aside className={`${styles.sidebar} ${styles.onboardingSidebar}`}>
          <div className={styles.brand}>
            <h2 className={styles.brandName}>SellSnap</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)', marginTop: 'auto' }}>
            <button type="button" className={styles.themeButton} onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <Moon size={20} /> : <Sun size={20} />}
              <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
            <div className={styles.footer}>
              <button type="button" className={styles.logoutButton} onClick={() => setShowConfirm(true)}>
                <LogOut className={styles.logoutIcon} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </aside>
        {showConfirm && (
          <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
            <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.confirmBrand}>SellSnap</h2>
              <p className={styles.confirmText}>Are you sure you want to log out?</p>
              <div className={styles.confirmActions}>
                <button className={styles.cancelButton} onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button className={styles.confirmLogoutButton} onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {mobileOpen && <div className={styles.mobileOverlay} onClick={onCloseMobile} />}

      {/* Animated Hamburger/Close button */}
      <button
        type="button"
        className={`${styles.mobileHamburgerButton} ${mobileOpen ? styles.mobileOpenButton : ''}`}
        onClick={mobileOpen ? onCloseMobile : onOpenMobile}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        <div className={`${styles.hamburgerIcon} ${mobileOpen ? styles.open : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>

        <div className={styles.brand}>
          <h2 className={styles.brandName}>{collapsed ? 'S' : 'SellSnap'}</h2>
        </div>

        <button
          type="button"
          className={`${styles.collapseToggle} ${collapsed ? styles.collapseToggleCollapsed : ''}`}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
        </button>

        <nav className={styles.nav}>{navLinks}</nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
          <button type="button" className={styles.themeButton} onClick={toggleTheme} aria-label="Toggle theme">
            {dark ? <Moon size={20} /> : <Sun size={20} />}
            {!collapsed && <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>

          <div className={styles.footer}>
            <button type="button" className={styles.logoutButton} onClick={() => setShowConfirm(true)}>
              <LogOut className={styles.logoutIcon} />
              {!collapsed && <span>Log out</span>}
            </button>
          </div>
        </div>
      </aside>

      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.confirmBrand}>SellSnap</h2>
            <p className={styles.confirmText}>Are you sure you want to log out?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelButton} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className={styles.confirmLogoutButton} onClick={handleLogout}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
