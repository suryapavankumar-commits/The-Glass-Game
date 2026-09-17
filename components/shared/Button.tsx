'use client';

import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// BUTTON — Shared button component
// ─────────────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#cc785c] hover:bg-[#a9583e] text-white border border-transparent',
  secondary:
    'bg-[#faf9f5] hover:bg-[#efe9de] text-[#141413] border border-[#e6dfd8]',
  ghost:
    'bg-transparent hover:bg-[#efe9de] text-[#3d3d3a] border border-transparent',
  danger:
    'bg-[#c64545] hover:bg-[#a53636] text-white border border-transparent',
  dark:
    'bg-[#252320] hover:bg-[#2f2d2a] text-[#faf9f5] border border-[#3a3835]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs h-8',
  md: 'px-5 py-2.5 text-sm h-10',
  lg: 'px-7 py-3.5 text-sm h-12',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 font-sans font-medium',
        'rounded-lg transition-colors duration-150 cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-[#cc785c] focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}
