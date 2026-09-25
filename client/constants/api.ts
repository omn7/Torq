import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getApiHost = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'web') return 'http://localhost:3001';
  
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3001`;
  }
  
  return 'http://10.0.2.2:3001';
};

export const API_URL = getApiHost();
