import { useAppointments, useAppointmentsByStatus } from '../../hooks/useAppointments';
import { useServices } from '../../hooks/useServices';
import { useStaff } from '../../hooks/useStaff';
import { StatusBadge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatGHS } from '../../utils/formatCurrency';
import { formatDateTime, formatDuration } from '../../utils/formatDate';
import type { Appointment } from '../../types/models';

/* ─── Stat Card ───────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  accent?: string;
}

function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <>
      <style>{`
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: box-shadow var(--transition);
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover { box-shadow: var(--shadow-md); }
        .stat-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        .stat-label {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          color: var(--espresso);
          line-height: 1;
        }
        .stat-sub {
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>

      <div className="stat-card">
        <div className="stat-card-top">
          <span className="stat-label">{label}</span>
          <div className="stat-icon" style={{ background: accent ?? 'var(--cream-mid)' }}>
            {icon}
          </div>
        </div>
        <div className="stat-value">{value}</div>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </>
  );
}

/* ─── Appointment Row ─────────────────────────────────────── */
function AppointmentRow({ appt }: { appt: Appointment }) {
  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500, fontSize: 13.5 }}>
          {appt.service?.name ?? `Service #${appt.serviceId}`}
        </div>
        {appt.notes && (
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {appt.notes}
          </div>
        )}
      </td>
      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {appt.staff?.user?.name ?? `Staff #${appt.staffId}`}
      </td>
      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        {formatDateTime(appt.date)}
      </td>
      <td>
        <StatusBadge status={appt.status} size="sm" />
      </td>
    </tr>
  );
}

/* ─── Dashboard ───────────────────────────────────────────── */
export function Dashboard() {
  const { data: appointments = [], isLoading } = useAppointments();
  const { data: pending = [] } = useAppointmentsByStatus('PENDING');
  const { data: confirmed = [] } = useAppointmentsByStatus('CONFIRMED');
  const { data: services = [] } = useServices();
  const { data: staff = [] } = useStaff();

  if (isLoading) return <PageSpinner message="Loading dashboard…" />;

  const today = new Date().toDateString();
  const todayAppts = appointments.filter(
    (a) => new Date(a.date).toDateString() === today,
  );

  return (
    <>
      <style>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }
        .dashboard-heading {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--espresso);
        }
        .dashboard-sub {
          font-size: 13.5px;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .section-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .section-header {
          padding: 18px 22px 14px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-title {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--espresso);
        }
        .section-badge {
          font-size: 11px;
          padding: 2px 8px;
          background: var(--cream-mid);
          color: var(--text-muted);
          border-radius: var(--radius-full);
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          padding: 10px 22px;
          text-align: left;
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid var(--border);
          background: var(--cream);
        }
        .data-table td {
          padding: 12px 22px;
          border-bottom: 1px solid var(--cream-mid);
          vertical-align: middle;
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #FFFDF7; }
        .empty-row td {
          padding: 32px 22px;
          text-align: center;
          font-style: italic;
          color: var(--text-muted);
          font-family: var(--font-display);
          font-size: 1rem;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dashboard-page animate-fade-up">
        {/* Heading */}
        <div>
          <h1 className="dashboard-heading">Good morning ✦</h1>
          <p className="dashboard-sub">
            {new Date().toLocaleDateString('en-GH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard
            label="Today's Appointments"
            value={todayAppts.length}
            sub={`${confirmed.length} confirmed`}
            icon="◷"
            accent="#FEF3C7"
          />
          <StatCard
            label="Pending Approvals"
            value={pending.length}
            sub="Need confirmation"
            icon="⏳"
            accent="#FFF7ED"
          />
          <StatCard
            label="Active Services"
            value={services.filter((s) => s.isActive).length}
            sub={`of ${services.length} total`}
            icon="✦"
            accent="#D1FAE5"
          />
          <StatCard
            label="Staff Members"
            value={staff.length}
            sub="On roster"
            icon="◎"
            accent="#DBEAFE"
          />
        </div>

        {/* Two column section */}
        <div className="two-col">
          {/* Today's appointments */}
          <div className="section-card">
            <div className="section-header">
              <span className="section-title">Today's Schedule</span>
              <span className="section-badge">{todayAppts.length} appts</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Stylist</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
                           <tbody>
                {todayAppts.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={4}>No appointments today</td>
                  </tr>
                ) : (
                  todayAppts.map((a) => <AppointmentRow key={a.id} appt={a} />)
                )}
              </tbody>
            </table>
          </div>

          {/* Recent all appointments */}
          <div className="section-card">
            <div className="section-header">
              <span className="section-title">Recent Appointments</span>
              <span className="section-badge">{appointments.length} total</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Stylist</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={4}>No appointments yet</td>
                  </tr>
                ) : (
                  appointments.slice(0, 8).map((a) => (
                    <AppointmentRow key={a.id} appt={a} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Services quick view */}
        <div className="section-card">
          <div className="section-header">
            <span className="section-title">Services</span>
            <span className="section-badge">{services.length} services</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={4}>No services configured yet</td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500, fontSize: 13.5 }}>{s.name}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {formatDuration(s.duration)}
                    </td>
                    <td
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--gold-muted)',
                      }}
                    >
                      {formatGHS(s.price)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: s.isActive ? '#D1FAE5' : '#FEE2E2',
                          color: s.isActive ? '#065F46' : '#991B1B',
                          fontWeight: 500,
                        }}
                      >
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

