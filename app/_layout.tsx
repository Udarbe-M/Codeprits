import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { requestNotificationPermissions } from '../src/utils/notifications';

export default function RootLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await requestNotificationPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive medication reminders.',
          [{ text: 'OK' }]
        );
      }
    };

    setupNotifications();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Medications' }} />
      <Stack.Screen name="add-medication" options={{ title: 'Add Medication' }} />
      <Stack.Screen name="today-schedule" options={{ title: "Today's Schedule" }} />
    </Stack>
  );
}