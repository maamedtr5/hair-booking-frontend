// components/booking/SlotCalender.tsx
import { useState, useMemo } from 'react';
import { useAvailableSlots } from '../../hooks/useSlots';
import { useBookingFlowStore } from '../../stores/bookingFlowStore';
import { Spinner } from '../ui/Spinner';
import type { Slot } from '../../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  // leading blanks
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface CalendarHeaderProps {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
}

function CalendarHeader({ year, month, onPrev, onNext, canGoPrev }: CalendarHeaderProps) {
  return (
    <div className="slot-cal__month-nav">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Previous month"
        className="slot-cal__nav-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="slot-cal__month-label">
        {MONTHS[month]} {year}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next month"
        className="slot-cal__nav-btn"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

interface TimeSlotsProps {
  slots: Slot[];
  selectedSlot: Slot | null;
  onSelect: (slot: Slot) => void;
  isLoading: boolean;
}

function TimeSlots({ slots, selectedSlot, onSelect, isLoading }: TimeSlotsProps) {
  if (isLoading) {
    return (
      <div className="slot-cal__time-loading">
        <Spinner size="sm" />
        <span>Loading availability…</span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="slot-cal__no-slots">No available times on this date.</p>
    );
  }

  // Group by morning / afternoon / evening
  const grouped: Record<string, Slot[]> = { Morning: [], Afternoon: [], Evening: [] };
  for (const slot of slots) {
    const h = new Date(slot.startTime).getHours();
    if (h < 12) grouped['Morning'].push(slot);
    else if (h < 17) grouped['Afternoon'].push(slot);
    else grouped['Evening'].push(slot);
  }

  return (
    <div className="slot-cal__times">
      {Object.entries(grouped).map(([label, group]) =>
        group.length > 0 ? (
          <div key={label} className="slot-cal__time-group">
            <span className="slot-cal__time-group-label">{label}</span>
            <div className="slot-cal__time-grid">
              {group.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onSelect(slot)}
                  aria-pressed={selectedSlot?.id === slot.id}
                  className={`slot-cal__time-btn ${selectedSlot?.id === slot.id ? 'slot-cal__time-btn--selected' : ''}`}
                >
                  {formatTime(slot.startTime)}
                </button>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function SlotCalender() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { selectedStaff, selectedSlot, setSlot } = useBookingFlowStore();

  const { data: slots, isLoading } = useAvailableSlots({
    staffId: selectedStaff?.id,
    date: selectedDate?.toISOString().split('T')[0],
  });

  const availableSlots: Slot[] = useMemo(
    () => (slots ?? []).filter((s: Slot) => s.isAvailable),
    [slots]
  );

  // Build a Set of date strings that have at least one available slot
  // We only have this for the selected date; for broader availability hints
  // we show a neutral indicator on all days and only disable past dates.
  const calDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const canGoPrev = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  return (
    <div className="slot-cal">
      {/* ── Calendar ── */}
      <div className="slot-cal__calendar">
        <CalendarHeader
          year={viewYear}
          month={viewMonth}
          onPrev={prevMonth}
          onNext={nextMonth}
          canGoPrev={canGoPrev}
        />

        <div className="slot-cal__grid" role="grid" aria-label="Select appointment date">
          {DAYS.map((d) => (
            <div key={d} className="slot-cal__day-name" role="columnheader" aria-label={d}>
              {d}
            </div>
          ))}
          {calDays.map((date, idx) => {
            if (!date) {
              return <div key={`blank-${idx}`} className="slot-cal__day slot-cal__day--blank" aria-hidden="true" />;
            }
            const isPast = date < today;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate !== null && isSameDay(date, selectedDate);
            return (
              <button
                key={date.toISOString()}
                type="button"
                disabled={isPast}
                onClick={() => setSelectedDate(date)}
                aria-pressed={isSelected}
                aria-label={date.toLocaleDateString('en-GH', { weekday: 'long', month: 'long', day: 'numeric' })}
                className={[
                  'slot-cal__day',
                  isPast ? 'slot-cal__day--past' : '',
                  isToday ? 'slot-cal__day--today' : '',
                  isSelected ? 'slot-cal__day--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time slots ── */}
      <div className="slot-cal__time-panel">
        {selectedDate ? (
          <>
            <p className="slot-cal__date-heading">
              {selectedDate.toLocaleDateString('en-GH', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <TimeSlots
              slots={availableSlots}
              selectedSlot={selectedSlot}
              onSelect={setSlot}
              isLoading={isLoading}
            />
          </>
        ) : (
          <div className="slot-cal__time-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>Select a date to see available times</p>
          </div>
        )}
      </div>

      
    </div>
  );
}