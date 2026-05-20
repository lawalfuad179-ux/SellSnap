'use client';

import { useState, useRef } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'lg';
  avatarUrl?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const Avatar = ({ name, size = 'sm', avatarUrl }: AvatarProps) => {
  const [hovering, setHovering] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(avatarUrl || null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.url) {
        setImageUrl(json.url);
      }
    } catch {}
  };

  return (
    <div
      className={`${styles.avatar} ${size === 'lg' ? styles.large : styles.small}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className={styles.image} />
      ) : (
        <span className={styles.initials}>{getInitials(name)}</span>
      )}
      {size === 'lg' && hovering && (
        <button type="button" className={styles.uploadOverlay} onClick={() => fileRef.current?.click()}>
          Upload photo
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
    </div>
  );
};
