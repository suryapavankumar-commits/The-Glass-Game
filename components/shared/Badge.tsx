'use client';

import React from 'react';

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'coral' | 'dark' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[#efe9de] text-[#141413]',
  success: 'bg-[#5db872]/15 text-[#3a8a4a]',
  warning: 'bg-[#d4a017]/15 text-[#9a7210]',
  error:   'bg-[#c64545]/15 text-[#c64545]',
  coral:   'bg-[#cc785c] text-white',
  dark:    'bg-[#252320] text-[#faf9f5]',
  muted:   'bg-[#e8e0d2] text-[#6c6a64]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#6c6a64]',
  success: 'bg-[#5db872]',
  warning: 'bg-[#d4a017]',
  error:   'bg-[#c64545]',
  coral:   'bg-white',
  dark:    'bg-[#a09d96]',
  muted:   'bg-[#8e8b82]',
};

export function Badge({ variant = 'default', children, className = '', dot }: BadgeProps) {
  return (
    <span className={[
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full',
      'text-[11px] font-medium font-sans tracking-wide',
      badgeVariants[variant],
      className,
    ].join(' ')}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// ── Status Dot ────────────────────────────────────────────────────────────────

type StatusVariant = 'live' | 'success' | 'warning' | 'error' | 'muted' | 'idle';

interface StatusDotProps {
  variant?: StatusVariant;
  label?: string;
  animate?: boolean;
  className?: string;
}

const dotVariantColors: Record<StatusVariant, string> = {
  live:    'bg-[#5db872]',
  success: 'bg-[#5db872]',
  warning: 'bg-[#d4a017]',
  error:   'bg-[#c64545]',
  muted:   'bg-[#8e8b82]',
  idle:    'bg-[#6c6a64]',
};

export function StatusDot({ variant = 'idle', label, animate = false, className = '' }: StatusDotProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={[
        'w-2 h-2 rounded-full flex-shrink-0',
        dotVariantColors[variant],
        animate ? 'animate-pulse-dot' : '',
      ].join(' ')} />
      {label && (
        <span className="text-[11px] font-medium font-sans tracking-wide uppercase">
          {label}
        </span>
      )}
    </span>
  );
}

// ── Metric ────────────────────────────────────────────────────────────────────

interface MetricProps {
  label: string;
  value: string | number;
  sub?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export function Metric({ label, value, sub, variant = 'light', className = '' }: MetricProps) {
  const isDark = variant === 'dark';
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className={`text-caption-upper ${isDark ? 'text-[#a09d96]' : 'text-[#6c6a64]'}`}>
        {label}
      </span>
      <span className={`font-mono text-lg font-medium ${isDark ? 'text-[#faf9f5]' : 'text-[#141413]'}`}>
        {value}
      </span>
      {sub && (
        <span className={`text-xs ${isDark ? 'text-[#6c6a64]' : 'text-[#8e8b82]'}`}>{sub}</span>
      )}
    </div>
  );
}
