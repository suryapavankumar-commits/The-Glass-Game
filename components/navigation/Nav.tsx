'use client';

// ─────────────────────────────────────────────────────────────────────────────
// NAV — Minimal top navigation
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Play, Clock, Brain, Info, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/play',      label: 'Play',       icon: Play },
  { href: '/glass-box', label: 'Glass Box',  icon: Eye },
  { href: '/runs',      label: 'Runs',       icon: Clock },
  { href: '/memory',   label: 'Memory',     icon: Brain },
  { href: '/about',    label: 'About',      icon: Info },
];

interface NavProps {
  variant?: 'light' | 'dark';
}

export function Nav({ variant = 'light' }: NavProps) {
  const pathname = usePathname();
  const isDark = variant === 'dark';

  return (
    <nav
      className={[
        'fixed top-0 left-0 right-0 z-50 h-14',
        'flex items-center justify-between px-6',
        isDark
          ? 'bg-[#181715]/95 border-b border-[#252320]'
          : 'bg-[#faf9f5]/95 border-b border-[#e6dfd8]',
        'backdrop-blur-sm',
      ].join(' ')}
      aria-label="Main navigation"
    >
      {/* Wordmark */}
      <Link
        href="/"
        className={`flex items-center gap-2 group ${isDark ? 'text-[#faf9f5]' : 'text-[#141413]'}`}
        aria-label="The Glass Game — Home"
      >
        {/* Diamond glyph */}
        <span
          className="w-5 h-5 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path
              d="M10 2L18 10L10 18L2 10L10 2Z"
              stroke={isDark ? '#cc785c' : '#cc785c'}
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M10 5L15 10L10 15L5 10L10 5Z"
              fill="#cc785c"
              opacity="0.3"
            />
          </svg>
        </span>
        <span className="font-sans text-sm font-medium tracking-[0.08em] uppercase">
          The Glass Game
        </span>
      </Link>

      {/* Center links */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                active
                  ? isDark
                    ? 'bg-[#252320] text-[#faf9f5]'
                    : 'bg-[#efe9de] text-[#141413]'
                  : isDark
                    ? 'text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#252320]'
                    : 'text-[#6c6a64] hover:text-[#141413] hover:bg-[#f5f0e8]',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={13} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* Right — Demo button */}
      <Link
        href="/play?demo=true"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors"
        aria-label="Start Demo Mode"
      >
        <Zap size={12} />
        Demo
      </Link>
    </nav>
  );
}
