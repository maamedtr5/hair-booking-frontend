// components/dashboard/RevenueChart.tsx
import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts';
import { useRevenueReport } from '../../hooks/useReports';
import { Spinner } from '../ui/Spinner';
import './styles/layout/DashboardStyles/RevenueChart.css'
// ─── Types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d' | '12m';

interface ChartDataPoint {
  label: string;
  revenue: number;
  bookings: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatGHSShort(value: number): string {
  if (value >= 1_000_000) return `GH₵${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `GH₵${(value / 1_000).toFixed(1)}K`;
  return formatGHS(value);
}

function getPeriodDates(period: Period): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  if (period === '7d') start.setDate(end.getDate() - 7);
  else if (period === '30d') start.setDate(end.getDate() - 30);
  else if (period === '90d') start.setDate(end.getDate() - 90);
  else start.setMonth(end.getMonth() - 11);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

// Transform backend revenue report into chart-friendly data
function transformReportData(data: any, period: Period): ChartDataPoint[] {
  if (!data?.dailyRevenue && !data?.monthlyRevenue) return [];

  const source: { date: string; revenue: number; bookings?: number }[] =
    period === '12m' ? (data.monthlyRevenue ?? []) : (data.dailyRevenue ?? []);

  return source.map((item) => ({
    label:
      period === '12m'
        ? new Date(item.date).toLocaleDateString('en-GH', { month: 'short' })
        : new Date(item.date).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }),
    revenue: item.revenue ?? 0,
    bookings: item.bookings ?? 0,
  }));
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const bookings = payload.find((p) => p.dataKey === 'bookings')?.value ?? 0;
  return (
    <div className="rev-chart__tooltip">
      <p className="rev-chart__tooltip-label">{label}</p>
      <p className="rev-chart__tooltip-revenue">{formatGHS(revenue as number)}</p>
      <p className="rev-chart__tooltip-bookings">{bookings} booking{bookings !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const PERIODS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '12m', label: '12 months' },
];

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('30d');
  const { startDate, endDate } = useMemo(() => getPeriodDates(period), [period]);

  const { data, isLoading, isError } = useRevenueReport({ startDate, endDate });

  const chartData = useMemo(() => transformReportData(data, period), [data, period]);

  const totalRevenue: number = useMemo(
    () => chartData.reduce((sum, d) => sum + d.revenue, 0),
    [chartData]
  );
  const totalBookings: number = useMemo(
    () => chartData.reduce((sum, d) => sum + d.bookings, 0),
    [chartData]
  );

  return (
    <div className="rev-chart">
      {/* Header */}
      <div className="rev-chart__header">
        <div>
          <h3 className="rev-chart__title">Revenue</h3>
          {!isLoading && !isError && (
            <p className="rev-chart__total" aria-live="polite">
              {formatGHS(totalRevenue)}
              <span className="rev-chart__total-sub"> · {totalBookings} appointments</span>
            </p>
          )}
        </div>

        <div className="rev-chart__period-tabs" role="tablist" aria-label="Select time period">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={period === p.value}
              onClick={() => setPeriod(p.value)}
              className={`rev-chart__period-btn ${period === p.value ? 'rev-chart__period-btn--active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="rev-chart__body">
        {isLoading ? (
          <div className="rev-chart__loading">
            <Spinner size="md" />
            <span>Loading revenue data…</span>
          </div>
        ) : isError ? (
          <div className="rev-chart__error">
            <p>Unable to load revenue data.</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="rev-chart__empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <p>No revenue data for this period.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border, #e5e0d8)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: '#9a8e82' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatGHSShort}
                tick={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fill: '#9a8e82' }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#c9a96e"
                strokeWidth={2.5}
                fill="url(#revGradient)"
                dot={false}
                activeDot={{ r: 5, fill: '#c9a96e', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

    
    </div>
  );
}