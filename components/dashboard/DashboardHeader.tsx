'use client';

import Link from 'next/link';
import { Avatar } from '@/components/avatar/Avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

interface DashboardHeaderProps {
  name: string;
  avatarUrl?: string | null;
}

export const DashboardHeader = ({ name, avatarUrl }: DashboardHeaderProps) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
      <ThemeToggle />
      <NotificationDropdown />
      <Link href="/profile">
        <Avatar name={name} avatarUrl={avatarUrl} />
      </Link>
    </div>
  );
};
