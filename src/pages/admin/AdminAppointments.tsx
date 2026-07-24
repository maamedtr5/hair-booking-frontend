// pages/admin/AdminAppointments.tsx
import { AppointmentTable } from '../../components/dashboard/AppointmentTable';

export default function AdminAppointments() {
  return (
    <div className="admin-appts-page">
      <div className="admin-appts-page__header">
        <div>
          <h1 className="admin-appts-page__title">Appointments</h1>
          <p className="admin-appts-page__sub">Search, filter and manage every booking.</p>
        </div>
      </div>

      <div className="admin-appts-page__panel">
        <AppointmentTable />
      </div>
    </div>
  );
}
