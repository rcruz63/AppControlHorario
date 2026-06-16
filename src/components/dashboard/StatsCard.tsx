// ============================================================
// StatsCard — Card de estadísticas reutilizable
// ============================================================

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'info';
  };
  children?: ReactNode;
  variant?: 'light' | 'dark';
  className?: string;
}

const BADGE_COLORS = {
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  info: 'bg-secondary text-white',
};

export default function StatsCard({
  icon: Icon,
  title,
  value,
  subtitle,
  badge,
  children,
  variant = 'light',
  className = '',
}: StatsCardProps) {
  const isLight = variant === 'light';

  return (
    <div
      className={`
        rounded-2xl p-5 transition-all duration-200 hover:shadow-lg
        ${isLight ? 'bg-bg-surface shadow-md' : 'dark-card'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon
            size={18}
            className={isLight ? 'text-text-secondary' : 'text-text-sidebar'}
          />
          <span
            className={`text-sm font-medium ${
              isLight ? 'text-text-secondary' : 'text-text-sidebar'
            }`}
          >
            {title}
          </span>
        </div>
        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE_COLORS[badge.variant]}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-2">
        <span
          className={`text-3xl font-bold timer-display ${
            isLight ? 'text-text-primary' : 'text-text-inverse'
          }`}
        >
          {value}
        </span>
        {subtitle && (
          <span
            className={`text-sm ${
              isLight ? 'text-text-secondary' : 'text-text-sidebar'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>

      {/* Contenido extra (gráficos, etc.) */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
