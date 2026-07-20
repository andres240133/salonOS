import { create } from 'zustand';

// ── Domain Types ──────────────────────────────────────────────────────────────

export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string;
}

export interface Slot {
  date: string;
  time: string;
  spotsLeft: number;
}

export interface ConfirmedBooking {
  bookingId: string;
  scheduledAt: string;
  serviceName: string;
}

// ── Store Contract ────────────────────────────────────────────────────────────

export interface BookingState {
  step: 1 | 2 | 3 | 4;
  selectedService: Service | null;
  selectedSlot: { date: string; time: string } | null;
  clientName: string;
  clientPhone: string;
  clientNotes: string;
  confirmedBooking: ConfirmedBooking | null;
  slotTakenAlternatives: Slot[] | null;

  /** Navigates to a specific step in the booking flow. */
  setStep: (step: 1 | 2 | 3 | 4) => void;

  /** Selects a service and resets the chosen slot (different service → different availability). */
  setService: (service: Service) => void;

  /** Selects a date/time slot for the appointment. */
  setSlot: (slot: { date: string; time: string }) => void;

  /** Stores the client's contact details and optional notes. */
  setClientData: (name: string, phone: string, notes: string) => void;

  /** Records the confirmed booking returned by the API. */
  setConfirmed: (booking: ConfirmedBooking) => void;

  /** Stores alternative slots surfaced when the chosen slot is already taken. */
  setSlotTaken: (alternatives: Slot[]) => void;

  /** Resets the entire booking flow back to its initial state. */
  resetFlow: () => void;
}

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState: Pick<
  BookingState,
  | 'step'
  | 'selectedService'
  | 'selectedSlot'
  | 'clientName'
  | 'clientPhone'
  | 'clientNotes'
  | 'confirmedBooking'
  | 'slotTakenAlternatives'
> = {
  step: 1,
  selectedService: null,
  selectedSlot: null,
  clientName: '',
  clientPhone: '',
  clientNotes: '',
  confirmedBooking: null,
  slotTakenAlternatives: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

/** Zustand store managing the multi-step booking flow state. */
export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setStep: (step) => {
    set({ step });
  },

  setService: (service) => {
    set({ selectedService: service, selectedSlot: null });
  },

  setSlot: (slot) => {
    set({ selectedSlot: slot });
  },

  setClientData: (name, phone, notes) => {
    set({ clientName: name, clientPhone: phone, clientNotes: notes });
  },

  setConfirmed: (booking) => {
    set({ confirmedBooking: booking });
  },

  setSlotTaken: (alternatives) => {
    set({ slotTakenAlternatives: alternatives });
  },

  resetFlow: () => {
    set({ ...initialState });
  },
}));
