import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'STAFF' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
  pushToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  setPushToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  pushToken: null,
  isAuthenticated: false,

  login: async (user, token) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    (globalThis as any).session = { token };
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        set({ pushToken: token });
        
        await fetch('http://localhost:4000/users/push-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pushToken: token }),
        });
      }
    } catch (e) {
      console.log('Push token error:', e);
    }

    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    (globalThis as any).session = { token: null };
    set({ user: null, token: null, pushToken: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      (globalThis as any).session = { token };
      set({ user, token, isAuthenticated: true });
    }
  },

  setPushToken: (token) => set({ pushToken: token }),
}));