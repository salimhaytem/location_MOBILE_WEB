import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const { isAuthenticated, loadAuth, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadAuth();
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
    
    if (data?.type === 'reservation_confirmed') {
      router.push('/reservations');
    } else if (data?.type === 'checkin_completed') {
      router.push('/reservations');
    } else if (data?.type === 'invoice_ready') {
      router.push(`/reservations/${data.reservationId}`);
    } else if (data?.type === 'reminder') {
      router.push(`/reservations/${data.reservationId}`);
    }

    Alert.alert(title || 'Notification', body);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    if (data?.reservationId) {
      router.push(`/reservations/${data.reservationId}`);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="confirmation/[id]" />
    </Stack>
  );
}