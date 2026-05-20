'use client';

import styles from './Input.module.css';
import { InputHTMLAttributes, forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, onChange, value, defaultValue, type, ...props }, ref) => {
    const [filled, setFilled] = useState(!!value || !!defaultValue);
    const [visible, setVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isPassword = type === 'password';

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setFilled(!!e.target.value);
      onChange?.(e);
    }, [onChange]);

    useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      const onAnimation = () => setFilled(!!el.value);
      el.addEventListener('animationstart', onAnimation);
      return () => el.removeEventListener('animationstart', onAnimation);
    }, []);

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrap}>
          <input
            ref={(node) => {
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            id={id}
            {...props}
            type={isPassword && visible ? 'text' : type}
            value={value}
            defaultValue={defaultValue}
            className={`${styles.input} ${isPassword ? styles.inputPassword : ''} ${filled ? styles.filled : ''} ${error ? styles.hasError : ''}`}
            onChange={handleChange}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setVisible((v) => !v)}
              tabIndex={-1}
              aria-label={visible ? 'Hide password' : 'Show password'}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
