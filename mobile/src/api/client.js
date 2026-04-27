import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://10.0.2.2:3000' : 'https://your-backend.com';

const client = axios.create({ baseURL: BASE_URL, timeout: 15000 });

client.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
