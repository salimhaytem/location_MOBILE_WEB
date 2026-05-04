import { create } from 'zustand';
import { PaymentMethod, PendingReservation } from '@carloc/shared';

interface ReservationState {
  pendingReservation: PendingReservation | null;
  setPendingReservation: (reservation: PendingReservation) => void;
  updatePaymentMethod: (method: PaymentMethod) => void;
  updateOptions: (options: { insurance?: boolean; gps?: boolean; babySeat?: boolean }) => void;
  clearReservation: () => void;
}

export const useReservationStore = create<ReservationState>((set) => ({
  pendingReservation: null,

  setPendingReservation: (reservation) =>
    set({ pendingReservation: reservation }),

  updatePaymentMethod: (method) =>
    set((state) => ({
      pendingReservation: state.pendingReservation
        ? { ...state.pendingReservation, paymentMethod: method }
        : null,
    })),

  updateOptions: (options) =>
    set((state) => ({
      pendingReservation: state.pendingReservation
        ? { ...state.pendingReservation, ...options }
        : null,
    })),

  clearReservation: () =>
    set({ pendingReservation: null }),
}));