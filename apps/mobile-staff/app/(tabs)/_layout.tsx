import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) redirect('/auth/login');
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: () => '📅' }} />
      <Tabs.Screen name="cash" options={{ title: 'Cash', tabBarIcon: () => '💵' }} />
      <Tabs.Screen name="incidents" options={{ title: 'Incidents', tabBarIcon: () => '⚠️' }} />
    </Tabs>
  );
}