import React, { useState } from 'react';
import { TrendingUp, Scissors, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getRevenueReport, getTopServices } from '../../api/reports';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { formatGHS } from '../../utils/formatCurrency';
import '../../styles/layout/PageStyles/ReportStyles.css';

const toISO = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0];

export function Reports() {
  // Initialize date range: one month ago to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return toISO(d.toISOString());
  });
  const [endDate, setEndDate] = useState(() => toISO(new Date().toISOString()));

  // Fetch revenue report
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ['reports', 'revenue', startDate, endDate],
    queryFn: () => getRevenueReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

  // Fetch top services
  const { data: topServices, isLoading: topLoading } = useQuery({
    queryKey: ['reports', 'top-services'],
    queryFn: () => getTopServices(10),
  });

  // Determine max values for bar chart scaling
  const maxRevenue = Math.max(
    ...(revenue?.breakdown?.map((b) => b.amount) ?? [1])
  );
  const maxBookings = Math.max(
    ...(topServices?.services?.map((s) => s.bookings) ?? [1])
  );

  // Export report data as CSV
 const handleExport = () => {
    if (!revenue?.breakdown) return;
    const rows = [
      ['Date', 'Bookings', 'Revenue (GHS)'],
      ...revenue.breakdown.map((b) => [b.date, b.bookings, b.amount.toFixed(2)]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locs-allure-revenue-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
     
      {/* Main content */}
      <div className="reports-page animate-fade-up">
        {/* Header */}
        <div className="reports-header">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-sub">Revenue and performance analytics</p>
          </div>
          {/* Date range controls */}
          <div className="date-controls">
            <span className="date-control-label">From</span>
            <input
              type="date"
              className="date-input"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="date-control-label">To</span>
            <input
              type="date"
              className="date-input"
              value={endDate}
              min={startDate}
              max={toISO(new Date().toISOString())}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={handleExport}>
              Export CSV
            </Button>
          </div>
        </div>

        {/* Loading spinner or report content */}
        {revLoading ? (
          <PageSpinner message="Loading reports…" />
        ) : (
          <>
            {/* KPIs */}
            <div className="report-cards">
              <div className="report-kpi">
                <div className="kpi-label">Total Revenue</div>
                <div className="kpi-value">{formatGHS(revenue?.totalRevenue ?? 0)}</div>
                <div className="kpi-sub">{startDate} – {endDate}</div>
              </div>
              <div className="report-kpi">
                <div className="kpi-label">Total Bookings</div>
                <div className="kpi-value">
                  {revenue?.breakdown?.reduce((s, b) => s + b.bookings, 0) ?? 0}
                </div>
                <div className="kpi-sub">Across selected period</div>
              </div>
              <div className="report-kpi">
                <div className="kpi-label">Avg. per Booking</div>
                <div className="kpi-value">
                  {(() => {
                    const total = revenue?.totalRevenue ?? 0;
                    const count = revenue?.breakdown?.reduce((s, b) => s + b.bookings, 0) ?? 0;
                    return formatGHS(count > 0 ? total / count : 0);
                  })()}
                </div>
                <div className="kpi-sub">Average booking value</div>
              </div>
            </div>

            {/* Revenue over time chart */}
            {revenue?.breakdown && revenue.breakdown.length > 0 && (
              <div className="section-card">
                <div className="section-header">
                  <TrendingUp size={16} style={{ color: 'var(--gold-muted)' }} />
                  <span className="section-title">Revenue Over Time</span>
                </div>
                <div className="section-body">
                  {/* Bar chart for revenue */}
                  <div className="bar-chart">
                    {revenue.breakdown.slice(-14).map((item) => (
                      <div key={item.date} className="bar-row">
                        <span className="bar-label">{item.date.slice(5)}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${
                                maxRevenue > 0 ? (item.amount / maxRevenue) * 100 : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="bar-value">{formatGHS(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Detailed table of revenue */}
                  <table className="revenue-table" style={{ marginTop: 20 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Bookings</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.breakdown.map((item) => (
                        <tr key={item.date}>
                          <td>{item.date}</td>
                          <td>{item.bookings}</td>
                          <td style={{ fontWeight: 500, color: 'var(--gold-muted)' }}>
                            {formatGHS(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Top Services Section */}
        <div className="section-card">
          <div className="section-header">
            <Scissors size={16} style={{ color: 'var(--gold-muted)' }} />
            <span className="section-title">Top Services</span>
          </div>
          <div className="section-body">
            {topLoading ? (
              <PageSpinner message="Loading…" />
            ) : (
              <div className="bar-chart">
                {(topServices?.services ?? []).map((s) => (
                  <div key={s.serviceId} className="bar-row">
                    <span className="bar-label" title={s.name}>{s.name}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill blue"
                        style={{
                          width: `${maxBookings > 0 ? (s.bookings / maxBookings) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="bar-value">{s.bookings} bookings</span>
                  </div>
                ))}
                {!topServices?.services?.length && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                    No service data available yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}