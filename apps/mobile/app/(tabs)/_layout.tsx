import { Tabs } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { redirect } from 'expo-router';
import { useEffect } from 'react';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      redirect('/auth/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: () => '🏠' }} />
      <Tabs.Screen name="reservations" options={{ title: 'Réservations', tabBarIcon: () => '📋' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: () => '👤' }} />
    </Tabs>
  );
}