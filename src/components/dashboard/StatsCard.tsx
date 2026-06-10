// components/dashboard/StatsCard.tsx
import type { ReactNode } from 'react';

type TrendDirection = 'up' | 'down' | 'neutral';
import './styles/layout/DashboardStyles/StatsCard.css'

interface StatsCardProps {
  title: string;
  value: string | number;
  /** Optional sub-label below value, e.g. "this month" */
  subtitle?: string;
  /** Percentage or absolute change string, e.g. "+12%" */
  change?: string;
  /** Which direction the change is */
  trend?: TrendDirection;
  /** Whether a positive trend is good (default true). Set false for e.g. cancellations */
  positiveIsGood?: boolean;
  icon?: ReactNode;
  isLoading?: boolean;
  /** Optional click handler to drill down */
  onClick?: () => void;
}

function TrendBadge({
  change,
  trend,
  positiveIsGood = true,
}: {
  change: string;
  trend: TrendDirection;
  positiveIsGood?: boolean;
}) {
  const isGood =
    trend === 'neutral' ? null : (trend === 'up') === positiveIsGood;

  const colorClass =
    trend === 'neutral'
      ? 'stats-card__trend--neutral'
      : isGood
      ? 'stats-card__trend--positive'
      : 'stats-card__trend--negative';

  return (
    <span className={`stats-card__trend ${colorClass}`} aria-label={`Change: ${change}`}>
      {trend === 'up' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
      {trend === 'down' && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
      {change}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="stats-card stats-card--loading" aria-busy="true" aria-label="Loading stat">
      <div className="stats-card__skeleton stats-card__skeleton--icon" />
      <div className="stats-card__skeleton stats-card__skeleton--title" />
      <div className="stats-card__skeleton stats-card__skeleton--value" />
      <div className="stats-card__skeleton stats-card__skeleton--sub" />
    </div>
  );
}

export function StatsCard({
  title,
  value,
  subtitle,
  change,
  trend = 'neutral',
  positiveIsGood = true,
  icon,
  isLoading = false,
  onClick,
}: StatsCardProps) {
  if (isLoading) return <SkeletonCard />;

  const Tag = onClick ? 'button' : 'div';

  return (
    <>
      <Tag
        className={`stats-card ${onClick ? 'stats-card--clickable' : ''}`}
        onClick={onClick}
        type={onClick ? 'button' : undefined}
        aria-label={onClick ? `View ${title} details` : undefined}
      >
        <div className="stats-card__top">
          {icon && <span className="stats-card__icon" aria-hidden="true">{icon}</span>}
          <span className="stats-card__title">{title}</span>
          {change && (
            <TrendBadge change={change} trend={trend} positiveIsGood={positiveIsGood} />
          )}
        </div>

        <div className="stats-card__value" aria-live="polite">
          {value}
        </div>

        {subtitle && (
          <div className="stats-card__subtitle">{subtitle}</div>
        )}

        {onClick && (
          <div className="stats-card__arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        )}
      </Tag>

      
    </>
  );
}

// ─── Convenience preset icons ─────────────────────────────────────────────────

export function RevenueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function AppointmentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function ClientIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function CancellationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}