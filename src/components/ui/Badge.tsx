import React from 'react';
import type { AppointmentStatus, BookingStatus, PaymentStatus } from '../../types/models';
import { Icons } from './icon'; // central icon registry
import { Loader2 } from 'lucide-react'; // spinner icon from Lucide

type BadgeVariant = 'gold' | 'green' | 'blue' | 'red' | 'muted' | 'amber';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: keyof typeof Icons;   // optional Lucide icon
  loading?: boolean;           // optional loading spinner
}

export function Badge({
  variant = 'muted',
  children,
  size = 'md',
  dot = false,
  icon,
  loading = false,
}: BadgeProps) {
  const IconComponent = icon ? Icons[icon] : null;

  return (
    <>
      <style>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-body);
          font-weight: 500;
          letter-spacing: 0.03em;
          border-radius: var(--radius-full);
          white-space: nowrap;
        }
        .badge-sm { padding: 2px 8px;  font-size: 11px; }
        .badge-md { padding: 3px 10px; font-size: 12px; }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .badge-gold   { background: #FEF3C7; color: #92400E; }
        .badge-green  { background: #D1FAE5; color: #065F46; }
        .badge-blue   { background: #DBEAFE; color: #1E40AF; }
        .badge-red    { background: #FEE2E2; color: #991B1B; }
        .badge-amber  { background: #FFF7ED; color: #9A3412; }
        .badge-muted  { background: var(--cream-mid); color: var(--text-secondary); }
      `}</style>

      <span className={`badge badge-${size} badge-${variant}`}>
        {dot && <span className="badge-dot" aria-hidden="true" />}
        {loading && <Loader2 className="animate-spin" size={14} />}
        {IconComponent && <IconComponent size={14} />}
        {children}
      </span>
    </>
  );
}

/* ─── Status Badge ─────────────────────────────────────────── */
const STATUS_MAP: Record<AppointmentStatus | BookingStatus, BadgeVariant> = {
  PENDING:   'amber',
  CONFIRMED: 'green',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

const STATUS_LABEL: Record<AppointmentStatus | BookingStatus, string> = {
  PENDING:   'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

interface StatusBadgeProps {
  status: AppointmentStatus | BookingStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_MAP[status]} size={size} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/* ─── Payment Badge ────────────────────────────────────────── */
const PAYMENT_MAP: Record<PaymentStatus, BadgeVariant> = {
  PENDING:  'amber',
  SUCCESS:  'green',
  FAILED:   'red',
  REFUNDED: 'muted',
};

interface PaymentBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

export function PaymentBadge({ status, size = 'md' }: PaymentBadgeProps) {
  return (
    <Badge variant={PAYMENT_MAP[status]} size={size} dot>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
