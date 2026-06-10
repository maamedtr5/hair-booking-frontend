import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ArrowLeft } from 'lucide-react';
import apiClient from '../../utils/apiClient';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDateTime } from '../../utils/formatDate';
import { toast } from '../../store/uiStore';
import { getErrorMessage } from '../../utils/apiClient';
import type { Client, Appointment } from '../../types/models';
import '../../styles/layout/PageStyles/ClientNoteStyles.css';

// ── Loader shell ───────────────────────────────────────────────────────────────
// Fetches data and renders a spinner until both client + appointments arrive,
// then mounts <ClientNotesForm> once with stable initial values — no effects needed.

export function ClientNotes() {
  const { clientId } = useParams<{ clientId: string }>();
  const id = Number(clientId);

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/clients/${id}`);
      return (data.data ?? data) as Client;
    },
    enabled: !!id,
  });

  const { data: appointments = [], isLoading: apptsLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', 'client', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/appointments/client/${id}`);
      return (data.data ?? data) as Appointment[];
    },
    enabled: !!id,
  });

  if (clientLoading || apptsLoading) return <PageSpinner message="Loading client…" />;

  return (
    <ClientNotesForm
      id={id}
      client={client ?? null}
      appointments={appointments}
    />
  );
}

// ── Inner form ────────────────────────────────────────────────────────────────
// Receives resolved data as props so useState initialisers run exactly once.
// No effects, no refs, no cascading renders.

interface ClientNotesFormProps {
  id: number;
  client: Client | null;
  appointments: Appointment[];
}

function ClientNotesForm({ id, client, appointments }: ClientNotesFormProps) {
  const qc = useQueryClient();

  // Initialised from props on first mount — stable, no effect required
  const [notes, setNotes] = useState<string>(client?.notes ?? '');
  const [address, setAddress] = useState<string>(client?.address ?? '');

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.put(`/clients/${id}`, { address, notes });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients', id] });
      toast.success('Client notes saved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="notes-page animate-fade-up">
      <Link to="/staff/schedule" className="notes-back">
        <ArrowLeft size={15} /> Back to Schedule
      </Link>

      {/* Client profile */}
      <div className="client-card">
        <div className="client-avatar">
          {client?.name?.charAt(0).toUpperCase() ?? 'C'}
        </div>
        <div>
          <div className="client-name">{client?.name ?? `Client #${id}`}</div>
          <div className="client-meta">
            {client?.email ?? '—'}
            {client?.email && client?.address && ' · '}
            {client?.address}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="section-card">
        <div className="section-header">Hair Notes & Preferences</div>
        <div className="section-body">
          <label className="field-label">Staff Notes</label>
          <textarea
            className="notes-textarea"
            placeholder="Allergies, preferred products, hair type, special instructions…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <label className="field-label">Address / Contact Info</label>
          <textarea
            className="notes-textarea"
            style={{ minHeight: 60 }}
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Client address or additional contact info"
          />
          <Button
            icon={<Save size={14} />}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Notes
          </Button>
        </div>
      </div>

      {/* Appointment history */}
      <div className="section-card">
        <div className="section-header">Appointment History ({appointments.length})</div>
        <div className="section-body">
          {appointments.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No appointments yet
            </p>
          ) : (
            appointments.map(a => (
              <div key={a.id} className="appt-mini">
                <div style={{ flex: 1 }}>
                  <div className="appt-mini-service">
                    {a.service?.name ?? `Service #${a.serviceId}`}
                  </div>
                  <div className="appt-mini-date">{formatDateTime(a.date)}</div>
                </div>
                <StatusBadge status={a.status} size="sm" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}