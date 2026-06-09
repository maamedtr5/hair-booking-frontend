import React, { useState } from 'react';
import { useForm, type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Edit2, Trash2, Mail } from 'lucide-react';

import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from '../../hooks/useStaff';
import { PageSpinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

import { staffSchema, type StaffFormValues } from '../../validators/staffValidator';
import type { Staff } from '../../types/models';
import '../../styles/layout/PageStyles/StaffModal.css';


// 🔹 Centralized styles object
const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--espresso)' },
  sub: { fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px', transition: 'box-shadow var(--transition)' },
  cardHover: { boxShadow: 'var(--shadow-md)' },
  top: { display: 'flex', alignItems: 'center', gap: '14px' },
  avatar: { width: '52px', height: '52px', borderRadius: '50%', background: 'var(--espresso)', border: '2px solid var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'var(--gold-light)', flexShrink: 0 },
  name: { fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--espresso)' },
  role: { fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' },
  bio: { fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 },
  meta: { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  actions: { display: 'flex', gap: '8px', marginTop: '4px', paddingTop: '14px', borderTop: '1px solid var(--cream-mid)' },
  emptyGrid: { gridColumn: '1 / -1', padding: '48px 24px', textAlign: 'center' as const, border: '1.5px dashed var(--border)', borderRadius: 'var(--radius-lg)' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--espresso)', marginBottom: '8px' },
  formFields: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  bioTextarea: { width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--espresso)', resize: 'vertical' as const, minHeight: '80px', background: 'var(--bg-card)' },
  fieldLabel: { fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' },
};

// 🔹 Empty state component
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={styles.emptyGrid}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
      <div style={styles.emptyTitle}>No staff members yet</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Add your first team member to get started
      </p>
      <Button size="sm" onClick={onAdd}>Add First Member</Button>
    </div>
  );
}

// 🔹 Staff card component
function StaffCard({
  member,
  onEdit,
  onRemove,
}: {
  member: Staff;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div style={styles.card} className="animate-fade-up">
      <div style={styles.top}>
        <div style={styles.avatar}>{member.user?.name?.charAt(0).toUpperCase() ?? 'S'}</div>
        <div>
          <div style={styles.name}>{member.user?.name ?? `Staff #${member.id}`}</div>
          <div style={styles.role}>Stylist</div>
        </div>
      </div>
      {member.bio && <div style={styles.bio}>{member.bio}</div>}
      <div style={styles.meta}>
        {member.user?.email && (
          <div style={styles.metaRow}><Mail size={12} /> {member.user.email}</div>
        )}
      </div>
      <div style={styles.actions}>
        <Button variant="outline" size="sm" icon={<Edit2 size={13} />} onClick={onEdit}>Edit</Button>
        <Button variant="danger" size="sm" icon={<Trash2 size={13} />} onClick={onRemove}>Remove</Button>
      </div>
    </div>
  );
}


// 🔹 Create staff modal
function CreateStaffModal({
  isOpen, onClose, onSubmit, errors, isSubmitting, register,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  errors: FieldErrors<StaffFormValues>;
  isSubmitting: boolean;
  register: UseFormRegister<StaffFormValues>;
}) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Add Staff Member"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button form="staff-form" type="submit" loading={isSubmitting}>Add Member</Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={onSubmit} noValidate>
        <div style={styles.formFields}>
          <div style={styles.formRow}>
            <Input label="Full name" placeholder="Ama Asante" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="ama@example.com" error={errors.email?.message} {...register('email')} />
          </div>
          <Input label="Phone (optional)" type="tel" placeholder="+233 XX XXX XXXX" error={errors.phone?.message} {...register('phone')} />
          <div>
            <label style={styles.fieldLabel}>Bio (optional)</label>
            <textarea style={styles.bioTextarea} placeholder="Brief description of specialties and experience…" {...register('bio')} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

// 🔹 Main StaffPage
export function StaffPage() {
  const { data: staff = [], isLoading } = useStaff();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Staff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema) });

  // Handle create
  const handleCreate = async (values: StaffFormValues) => {
    await createMutation.mutateAsync({ userId: 0, bio: values.bio ?? '' });
    setCreateOpen(false);
    resetForm();
  };

  return (
    <>
      <div className="staff-page animate-fade-up">
        <div className="staff-page-header">
          <div>
            <h1 className="page-title">Staff</h1>
            <p className="page-sub">
              {staff.length} team member{staff.length !== 1 ? 's' : ''} on roster
            </p>
          </div>
          <Button icon={<UserPlus size={15} />} onClick={() => setCreateOpen(true)}>
            Add Staff Member
          </Button>
        </div>

        {isLoading ? (
          <PageSpinner message="Loading staff…" />
        ) : (
          <div style={styles.grid}>
            {staff.length === 0 ? (
              <EmptyState onAdd={() => setCreateOpen(true)} />
            ) : (
              staff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onEdit={() => setEditTarget(member)}
                  onRemove={() => setDeleteTarget(member.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      <CreateStaffModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit(handleCreate)}
        errors={errors}
        isSubmitting={isSubmitting}
        register={register}
      />

      {/* Edit Staff Modal */}
      {editTarget && (
        <Modal
          open={true}
          onClose={() => setEditTarget(null)}
          title="Edit Staff Member"
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button form="edit-staff-form" type="submit" loading={updateMutation.isPending}>
                Save Changes
              </Button>
            </>
          }
        >
          <form
            id="edit-staff-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (editTarget) {
                updateMutation.mutate(
                  { id: editTarget.id, payload: { bio: editTarget.bio ?? '' } },
                  { onSettled: () => setEditTarget(null) }
                );
              }
            }}
            noValidate
          >
            <div style={styles.formFields}>
              <div style={styles.formRow}>
                <Input label="Full name" defaultValue={editTarget.user?.name} disabled />
                <Input label="Email" type="email" defaultValue={editTarget.user?.email} disabled />
              </div>
              <div>
                <label style={styles.fieldLabel}>Bio</label>
                <textarea
                  style={styles.bioTextarea}
                  defaultValue={editTarget.bio ?? ''}
                  onChange={(e) => setEditTarget({ ...editTarget, bio: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget, { onSettled: () => setDeleteTarget(null) });
          }
        }}
        title="Remove Staff Member"
        message="Are you sure you want to remove this staff member? Their appointment history will be preserved."
        confirmLabel="Remove"
        danger
        loading={deleteMutation.isPending}
      />
    </>
  );
}