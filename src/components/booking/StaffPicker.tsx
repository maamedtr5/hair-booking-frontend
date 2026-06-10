// components/booking/StaffPicker.tsx
import { useStaff } from '../../hooks/useStaff';
import { useBookingFlowStore } from '../../stores/bookingFlowStore';
import { Spinner } from '../ui/Spinner';
import type { Staff } from '../../types';
import  '..styles/layout/BookingStyles/StaffPicker.css'

interface StaffCardProps {
  staff: Staff;
  selected: boolean;
  onSelect: (staff: Staff) => void;
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="staff-card__stars" aria-label={`Rating: ${value.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={i < Math.round(value) ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className={i < Math.round(value) ? 'staff-card__star--filled' : 'staff-card__star--empty'}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="staff-card__rating-value">{value.toFixed(1)}</span>
    </span>
  );
}

function StaffCard({ staff, selected, onSelect }: StaffCardProps) {
  const initials = staff.user?.name
    ? staff.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <button
      type="button"
      onClick={() => onSelect(staff)}
      aria-pressed={selected}
      className={`staff-card ${selected ? 'staff-card--selected' : ''}`}
    >
      <div className="staff-card__avatar" aria-hidden="true">
        {staff.user?.avatarUrl ? (
          <img src={staff.user.avatarUrl} alt={staff.user.name} className="staff-card__avatar-img" />
        ) : (
          <span className="staff-card__avatar-initials">{initials}</span>
        )}
      </div>

      <div className="staff-card__info">
        <span className="staff-card__name">{staff.user?.name ?? 'Stylist'}</span>

        {staff.specialties && staff.specialties.length > 0 && (
          <div className="staff-card__specialties">
            {staff.specialties.slice(0, 3).map((s: string) => (
              <span key={s} className="staff-card__specialty-tag">{s}</span>
            ))}
            {staff.specialties.length > 3 && (
              <span className="staff-card__specialty-tag staff-card__specialty-tag--more">
                +{staff.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {staff.bio && (
          <p className="staff-card__bio">{staff.bio}</p>
        )}

        {typeof staff.averageRating === 'number' && (
          <StarRating value={staff.averageRating} />
        )}
      </div>

      {selected && (
        <div className="staff-card__check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}

// "No preference" option — backend assigns the next available stylist
function AnyStaffCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`staff-card staff-card--any ${selected ? 'staff-card--selected' : ''}`}
    >
      <div className="staff-card__avatar staff-card__avatar--any" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <div className="staff-card__info">
        <span className="staff-card__name">No preference</span>
        <p className="staff-card__bio">We'll match you with the next available stylist.</p>
      </div>
      {selected && (
        <div className="staff-card__check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function StaffPicker() {
  const { data: staffList, isLoading, isError } = useStaff();
  const { selectedStaff, setStaff } = useBookingFlowStore();

  if (isLoading) {
    return (
      <div className="staff-picker__loading">
        <Spinner size="lg" />
        <p>Loading stylists…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="staff-picker__error">
        <p>Unable to load stylists. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="staff-picker">
      <div className="staff-picker__list" role="listbox" aria-label="Select a stylist">
        <AnyStaffCard
          selected={selectedStaff === null}
          onSelect={() => setStaff(null)}
        />
        {(staffList ?? []).map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            selected={selectedStaff?.id === staff.id}
            onSelect={setStaff}
          />
        ))}
      </div>

     
    </div>
  );
}