import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from './authStore';

export type SyncActionType = 'checkin' | 'checkout' | 'validateCash' | 'createIncident';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  reservationId?: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

interface SyncState {
  pendingActions: SyncAction[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncResult: string | null;

  initialize: () => Promise<void>;
  setOnline: (online: boolean) => void;
  addAction: (action: Omit<SyncAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  removeAction: (id: string) => Promise<void>;
  syncActions: () => Promise<void>;
  getPendingCount: () => number;
}

const STORAGE_KEY = 'pending_sync_actions';

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingActions: [],
  isOnline: true,
  isSyncing: false,
  lastSyncResult: null,

  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const actions = JSON.parse(stored);
        set({ pendingActions: actions });
      }
    } catch (e) {
      console.log('Error loading pending actions:', e);
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;
      set({ isOnline: online });
      if (online && get().pendingActions.length > 0) {
        get().syncActions();
      }
    });

    return () => unsubscribe();
  },

  setOnline: (online) => set({ isOnline: online }),

  addAction: async (action) => {
    const newAction: SyncAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    const updatedActions = [...get().pendingActions, newAction];
    set({ pendingActions: updatedActions });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActions));
  },

  removeAction: async (id) => {
    const updatedActions = get().pendingActions.filter((a) => a.id !== id);
    set({ pendingActions: updatedActions });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedActions));
  },

  syncActions: async () => {
    const { pendingActions, isOnline } = get();
    if (!isOnline || pendingActions.length === 0 || get().isSyncing) return;

    set({ isSyncing: true });

    const token = useAuthStore.getState().token;
    if (!token) {
      set({ isSyncing: false });
      return;
    }

    const results: string[] = [];
    const actionsToRemove: string[] = [];

    for (const action of pendingActions) {
      try {
        let endpoint = '';
        let method = 'POST';
        let body = action.data;

        switch (action.type) {
          case 'checkin':
            endpoint = `/checkinout/${action.reservationId}/checkin`;
            break;
          case 'checkout':
            endpoint = `/checkinout/${action.reservationId}/checkout`;
            break;
          case 'validateCash':
            endpoint = `/checkinout/${action.reservationId}/validate-cash`;
            break;
          case 'createIncident':
            endpoint = '/incidents';
            break;
          default:
            continue;
        }

        const response = await fetch(`http://localhost:4000${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          results.push(`✓ ${action.type} synced`);
          actionsToRemove.push(action.id);
        } else {
          if (action.retryCount >= 3) {
            results.push(`✗ ${action.type} failed after 3 retries`);
            actionsToRemove.push(action.id);
          } else {
            const updatedAction = { ...action, retryCount: action.retryCount + 1 };
            const idx = pendingActions.findIndex((a) => a.id === action.id);
            if (idx !== -1) {
              pendingActions[idx] = updatedAction;
            }
          }
        }
      } catch (error) {
        console.log(`Error syncing ${action.type}:`, error);
        results.push(`✗ ${action.type} network error`);
      }
    }

    if (actionsToRemove.length > 0) {
      const remaining = pendingActions.filter((a) => !actionsToRemove.includes(a.id));
      set({ pendingActions: remaining });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }

    set({
      isSyncing: false,
      lastSyncResult: results.join('\n'),
    });
  },

  getPendingCount: () => get().pendingActions.length,
}));