import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mail, Lock } from 'lucide-react-native';
import Constants from 'expo-constants';

const getApiHost = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001';
  
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3001`;
  }
  
  return 'http://10.0.2.2:3001';
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const host = getApiHost();

      const response = await fetch(`${host}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      router.replace('/(tabs)');
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black justify-center p-6">
      <Text className="text-white text-4xl font-bold mb-2">Welcome Back</Text>
      <Text className="text-zinc-400 text-lg mb-8">Log in to track your fitness journey.</Text>

      {errorMessage ? (
        <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
          <Text className="text-red-500 font-semibold">{errorMessage}</Text>
        </View>
      ) : null}

      <View className="mb-4">
        <View className="flex-row items-center bg-zinc-900 rounded-xl p-4 mb-4">
          <Mail color="#a1a1aa" size={20} className="mr-3" />
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Email"
            placeholderTextColor="#a1a1aa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="flex-row items-center bg-zinc-900 rounded-xl p-4 mb-8">
          <Lock color="#a1a1aa" size={20} className="mr-3" />
          <TextInput
            className="flex-1 text-white text-base"
            placeholder="Password"
            placeholderTextColor="#a1a1aa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Pressable 
          onPress={handleLogin}
          disabled={loading}
          className={`bg-[#30E07D] rounded-xl p-4 items-center ${loading ? 'opacity-70' : 'opacity-100'}`}
        >
          <Text className="text-black font-bold text-lg">{loading ? 'Logging in...' : 'Log In'}</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-center mt-6">
        <Text className="text-zinc-400">Don't have an account? </Text>
        <Pressable onPress={() => router.push('/register')}>
          <Text className="text-[#30E07D] font-bold">Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
}
