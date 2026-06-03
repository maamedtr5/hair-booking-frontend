import { create } from 'zustand';
import type { BookingFlowState, Service, Staff, Slot, Promocode } from '../types/models';

interface BookingFlowStore extends BookingFlowState {
  // Step navigation
  setStep: (step: BookingFlowState['step']) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Selection setters
  setService: (service: Service | null) => void;
  setStaff: (staff: Staff | null) => void;
  setSlot: (slot: Slot | null) => void;
  setDate: (date: string | null) => void;
  setPromocode: (promo: Promocode | null) => void;
  setNotes: (notes: string) => void;

  // Reset entire flow (after successful booking or on cancel)
  reset: () => void;
}

const initialState: BookingFlowState = {
  step: 1,
  selectedService: null,
  selectedStaff: null,
  selectedSlot: null,
  selectedDate: null,
  appliedPromocode: null,
  notes: '',
};

export const useBookingFlowStore = create<BookingFlowStore>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  nextStep: () => {
    const current = get().step;
    if (current < 4) set({ step: (current + 1) as BookingFlowState['step'] });
  },

  prevStep: () => {
    const current = get().step;
    if (current > 1) set({ step: (current - 1) as BookingFlowState['step'] });
  },

  setService: (service) =>
    set({
      selectedService: service,
      // Clear downstream selections when service changes
      selectedStaff: null,
      selectedSlot: null,
      selectedDate: null,
    }),

  setStaff: (staff) =>
    set({
      selectedStaff: staff,
      // Clear slot when staff changes
      selectedSlot: null,
    }),

  setSlot: (slot) => set({ selectedSlot: slot }),

  setDate: (date) =>
    set({
      selectedDate: date,
      // Clear slot when date changes
      selectedSlot: null,
    }),

  setPromocode: (promo) => set({ appliedPromocode: promo }),

  setNotes: (notes) => set({ notes }),

  reset: () => set(initialState),
}));