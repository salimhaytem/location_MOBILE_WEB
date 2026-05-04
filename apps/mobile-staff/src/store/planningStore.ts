import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Reservation {
  id: string;
  user: { firstName: string; lastName: string };
  vehicle: { brand: string; model: string; registrationNumber: string; mileage: number };
  pickupDate: string;
  returnDate: string;
  totalPrice: number;
  depositPaid: boolean;
  paymentMethod?: string;
  status: string;
}

interface PendingAction {
  id: string;
  type: 'checkin' | 'checkout' | 'validateCash';
  data: any;
  timestamp: string;
}

interface PlanningState {
  departures: Reservation[];
  returns: Reservation[];
  pendingActions: PendingAction[];
  lastSync: string | null;
  isOnline: boolean;

  setOnline: (online: boolean) => void;
  setPlanning: (departures: Reservation[], returns: Reservation[]) => void;
  addPendingAction: (action: PendingAction) => void;
  clearPendingAction: (id: string) => void;
  loadCached: () => Promise<void>;
  cachePlanning: (departures: Reservation[], returns: Reservation[]) => Promise<void>;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
  departures: [],
  returns: [],
  pendingActions: [],
  lastSync: null,
  isOnline: true,

  setOnline: (online) => set({ isOnline: online }),

  setPlanning: (departures, returns) => {
    set({ departures, returns, lastSync: new Date().toISOString() });
    get().cachePlanning(departures, returns);
  },

  addPendingAction: async (action) => {
    const actions = [...get().pendingActions, action];
    set({ pendingActions: actions });
    await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
  },

  clearPendingAction: async (id) => {
    const actions = get().pendingActions.filter((a) => a.id !== id);
    set({ pendingActions: actions });
    await AsyncStorage.setItem('pendingActions', JSON.stringify(actions));
  },

  loadCached: async () => {
    const cached = await AsyncStorage.getItem('planningCache');
    const actions = await AsyncStorage.getItem('pendingActions');
    if (cached) {
      const data = JSON.parse(cached);
      set({ departures: data.departures || [], returns: data.returns || [], lastSync: data.lastSync });
    }
    if (actions) {
      set({ pendingActions: JSON.parse(actions) });
    }
  },

  cachePlanning: async (departures, returns) => {
    const data = { departures, returns, lastSync: new Date().toISOString() };
    await AsyncStorage.setItem('planningCache', JSON.stringify(data));
  },
}));