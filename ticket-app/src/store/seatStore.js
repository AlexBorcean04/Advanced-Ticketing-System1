import { create } from 'zustand';

const useSeatStore = create((set) => ({
  selectedSeats: [],
  holdExpiresAt: null,
  setSelectedSeats: (selectedSeats) =>
    set((state) => ({
      selectedSeats:
        typeof selectedSeats === 'function'
          ? selectedSeats(state.selectedSeats)
          : selectedSeats,
    })),
  setHoldExpiresAt: (holdExpiresAt) => set({ holdExpiresAt }),
  clearHold: () =>
    set((state) => (state.holdExpiresAt === null ? state : { holdExpiresAt: null })),
}));

export default useSeatStore;
