import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuthStore } from '../src/store/authStore';
import { useSyncStore } from '../src/store/syncStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function NetworkStatus({ isOnline, pendingCount }: { isOnline: boolean; pendingCount: number }) {
  if (isOnline && pendingCount === 0) return null;
  
  return (
    <View style={[styles.statusBanner, !isOnline ? styles.offlineBanner : styles.pendingBanner]}>
      <Text style={styles.statusText}>
        {!isOnline 
          ? '⚠️ Hors ligne - Données en cache' 
          : `⏳ ${pendingCount} action(s) en attente de sync`}
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const { isAuthenticated, loadAuth, token } = useAuthStore();
  const { initialize, isOnline, isSyncing, pendingActions } = useSyncStore();

  useEffect(() => {
    loadAuth();
    initialize();
    registerForPushNotifications();
  }, []);

  const registerForPushNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId;
      const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
      
      if (token) {
        await fetch('http://localhost:4000/users/push-token', {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json', 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ pushToken: pushToken.data }),
        });
      }

      Notifications.addNotificationReceivedListener(handleNotification);
      Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    } catch (e) {
      console.log('Push notification error:', e);
    }
  };

  const handleNotification = (notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;
    Alert.alert(title || 'Notification', body, [
      { text: 'OK' },
    ]);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    if (data?.screen) {
      // Navigate based on notification data
      console.log('Navigate to:', data.screen);
    }
  };

  const pendingCount = pendingActions.length;

  return (
    <View style={{ flex: 1 }}>
      <NetworkStatus isOnline={isOnline} pendingCount={pendingCount} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBanner: { padding: 10, alignItems: 'center' },
  offlineBanner: { backgroundColor: '#f59e0b' },
  pendingBanner: { backgroundColor: '#3b82f6' },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});