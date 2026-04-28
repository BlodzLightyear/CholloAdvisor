import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ActiveSearchesScreen from '../screens/ActiveSearchesScreen';
import SearchFormScreen from '../screens/SearchFormScreen';
import PriceHistoryScreen from '../screens/PriceHistoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useAuth } from '../store/authContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1a1a2e' },
  headerTintColor: '#fff',
};

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarStyle: { backgroundColor: '#1a1a2e' }, tabBarActiveTintColor: '#e94560', tabBarInactiveTintColor: '#aaa', ...screenOptions }}>
      <Tab.Screen name="Búsquedas" component={ActiveSearchesScreen} options={{ tabBarIcon: () => <Text>🔍</Text> }} />
      <Tab.Screen name="Notificaciones" component={NotificationsScreen} options={{ tabBarIcon: () => <Text>🔔</Text> }} />
      <Tab.Screen name="Ajustes" component={SettingsScreen} options={{ tabBarIcon: () => <Text>⚙️</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { authed } = useAuth();

  if (authed === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {authed ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="SearchForm" component={SearchFormScreen} options={{ title: 'Nueva búsqueda' }} />
            <Stack.Screen name="PriceHistory" component={PriceHistoryScreen} options={{ title: 'Historial de precios' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear cuenta' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
