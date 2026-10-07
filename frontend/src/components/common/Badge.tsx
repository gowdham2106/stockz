import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'live' | 'demo' | 'positive' | 'negative' | 'warning' | 'primary' | 'neutral' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] font-semibold',
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold tracking-wide'
  }[size];

  const variantClasses = {
    live: 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    demo: 'bg-amber-950/80 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    positive: 'bg-trade-positiveMuted text-trade-positive border border-trade-positive/20',
    negative: 'bg-trade-negativeMuted text-trade-negative border border-trade-negative/20',
    warning: 'bg-trade-warningMuted text-trade-warning border border-trade-warning/20',
    primary: 'bg-trade-primary/15 text-trade-primary border border-trade-primary/30',
    neutral: 'bg-trade-surface3 text-trade-muted border border-trade-border',
    outline: 'bg-transparent text-trade-text border border-trade-borderLight'
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeClasses} ${variantClasses} ${className}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'live' || variant === 'positive' ? 'bg-emerald-400' :
            variant === 'demo' || variant === 'warning' ? 'bg-amber-400' :
            variant === 'negative' ? 'bg-red-400' : 'bg-trade-primary'
          }`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            variant === 'live' || variant === 'positive' ? 'bg-emerald-500' :
            variant === 'demo' || variant === 'warning' ? 'bg-amber-500' :
            variant === 'negative' ? 'bg-red-500' : 'bg-trade-primary'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => {
  return (
    <div className={`animate-pulse rounded bg-trade-surface3/60 border border-trade-border/30 ${className}`} />
  );
};
