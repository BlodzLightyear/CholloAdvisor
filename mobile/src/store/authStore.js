import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

export async function login(email, password) {
  const res = await client.post('/auth/login', { email, password });
  await AsyncStorage.setItem('jwt_token', res.data.token);
  await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data;
}

export async function register(email, password) {
  const res = await client.post('/auth/register', { email, password });
  await AsyncStorage.setItem('jwt_token', res.data.token);
  await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data;
}

export async function logout() {
  await AsyncStorage.multiRemove(['jwt_token', 'user']);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function isAuthenticated() {
  const token = await AsyncStorage.getItem('jwt_token');
  return !!token;
}
