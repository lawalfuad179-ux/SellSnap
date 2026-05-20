'use client';

import { useRef, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';

interface ImageUploadFieldProps {
  name: string;
  currentImage?: string | null;
  required?: boolean;
}

export const ImageUploadField = ({ name, currentImage, required }: ImageUploadFieldProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (ref.current) ref.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <label style={{ fontSize: 'var(--font-label-medium-font-size)', fontWeight: 'var(--font-label-medium-font-weight)', color: 'var(--color-on-surface)' }}>
        Product Image
      </label>

      <input
        ref={ref}
        name={name}
        type="file"
        accept="image/*"
        required={required}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div
        onClick={() => ref.current?.click()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-12)',
          minHeight: 180,
          padding: 'var(--space-24)',
          border: '2px dashed var(--color-outline-variant)',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface)',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
          position: 'relative',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.backgroundColor = 'hsla(154, 100%, 42%, 0.03)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-outline-variant)'; e.currentTarget.style.backgroundColor = 'var(--color-surface)'; }}
      >
        {preview ? (
          <>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              backgroundColor: 'var(--color-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              position: 'relative',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'hsla(0, 0%, 0%, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={14} color="white" />
              </div>
            </div>
            <span style={{
              fontSize: 'var(--font-body-medium-font-size)',
              color: 'var(--color-on-surface-variant)',
            }}>
              {file ? file.name : 'Tap to change image'}
            </span>
          </>
        ) : (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Image size={24} style={{ color: 'var(--color-outline)' }} />
            </div>
            <span style={{
              fontSize: 'var(--font-body-medium-font-size)',
              color: 'var(--color-on-surface-variant)',
              fontWeight: 500,
            }}>
              Tap to add an image
            </span>
          </>
        )}

        <div
          onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-10)',
            height: 36,
            padding: '0 var(--space-16)',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface-container-highest)',
            color: 'var(--color-on-surface)',
            fontSize: 'var(--font-label-small-font-size)',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-container-high)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-container-highest)'; }}
        >
          <Upload size={14} />
          Upload
        </div>
      </div>
    </div>
  );
};
