import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/utils/fcmSetup';
import { isAuthenticated } from './src/store/authStore';

export default function App() {
  useEffect(() => {
    isAuthenticated().then(authed => {
      if (authed) registerForPushNotifications();
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
