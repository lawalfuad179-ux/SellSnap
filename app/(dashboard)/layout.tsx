'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import styles from './Layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const isOnboarding = pathname === '/onboarding';

  return (
    <div className={styles.layout}>
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={closeMobile} onOpenMobile={openMobile} onboarding={isOnboarding} />
      <main className={styles.mainContent}>
        <div className={`${styles.container} ${isOnboarding ? styles.onboardingContainer : styles.dashboardContainer}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
