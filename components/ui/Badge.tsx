import styles from './Badge.module.css';

interface BadgeProps {
  status: 'pending' | 'paid' | 'failed';
  children?: React.ReactNode;
}

export const Badge = ({ status, children }: BadgeProps) => {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {children || status}
    </span>
  );
};
