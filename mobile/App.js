import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/authContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}
