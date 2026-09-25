import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, User, Users, ChevronRight, Edit3, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiHost = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3001`;
  return 'http://10.0.2.2:3001';
};

export default function MoreScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');

  const loadProfileData = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const user = JSON.parse(stored);
        setUserData(user);
        setEditName(user.name || '');
        setEditBio(user.bio || '');
        setEditAvatarUrl(user.avatarUrl || '');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    router.replace('/login');
  };

  const handleSaveProfile = async () => {
    try {
      const host = getApiHost();
      const res = await fetch(`${host}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          name: editName,
          bio: editBio,
          avatarUrl: editAvatarUrl
        })
      });
      if (res.ok) {
        const updated = await res.json();
        const fullUser = { ...userData, ...updated };
        setUserData(fullUser);
        await AsyncStorage.setItem('userData', JSON.stringify(fullUser));
        setIsEditing(false);
      }
    } catch(e) {
      Alert.alert("Error", "Could not update profile");
    }
  };

  if (loading || !userData) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#30E07D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-white text-3xl font-bold mb-6">Profile</Text>

        {/* Profile Card */}
        <View className="bg-zinc-900 rounded-3xl p-6 mb-8 relative">
          {!isEditing && (
            <Pressable onPress={() => setIsEditing(true)} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full z-10">
              <Edit3 color="#a1a1aa" size={18} />
            </Pressable>
          )}

          <View className="items-center mb-4">
            <View className="w-24 h-24 bg-zinc-800 rounded-full mb-3 justify-center items-center overflow-hidden">
              {userData.avatarUrl ? (
                <Image source={{ uri: userData.avatarUrl }} className="w-full h-full" />
              ) : (
                <User color="#52525b" size={40} />
              )}
            </View>
            {!isEditing ? (
              <>
                <Text className="text-white text-2xl font-bold">{userData.name}</Text>
                <Text className="text-[#30E07D] font-medium mb-2">{userData.email}</Text>
                <Text className="text-zinc-400 text-center text-sm px-4">{userData.bio || "No bio added yet. Tap edit to tell your friends about your fitness goals!"}</Text>
              </>
            ) : (
              <View className="w-full">
                <Text className="text-zinc-400 text-xs font-bold mb-1 ml-1">NAME</Text>
                <TextInput className="bg-black text-white p-3 rounded-xl mb-3" value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor="#52525b" />
                <Text className="text-zinc-400 text-xs font-bold mb-1 ml-1">BIO</Text>
                <TextInput className="bg-black text-white p-3 rounded-xl mb-3" value={editBio} onChangeText={setEditBio} placeholder="Bio" placeholderTextColor="#52525b" multiline />
                <Text className="text-zinc-400 text-xs font-bold mb-1 ml-1">AVATAR URL (Optional)</Text>
                <TextInput className="bg-black text-white p-3 rounded-xl mb-4" value={editAvatarUrl} onChangeText={setEditAvatarUrl} placeholder="https://..." placeholderTextColor="#52525b" />
                <View className="flex-row justify-between">
                  <Pressable onPress={() => setIsEditing(false)} className="bg-zinc-800 flex-1 p-3 rounded-xl items-center mr-2"><Text className="text-white font-bold">Cancel</Text></Pressable>
                  <Pressable onPress={handleSaveProfile} className="bg-[#30E07D] flex-1 p-3 rounded-xl items-center ml-2"><Text className="text-black font-bold">Save</Text></Pressable>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Settings */}
        <Text className="text-white text-xl font-bold mb-4">Settings</Text>
        <View className="bg-zinc-900 rounded-3xl p-2 mb-8">
          <Pressable className="flex-row items-center justify-between p-4 border-b border-zinc-800">
            <Text className="text-white font-medium">Notifications</Text>
            <ChevronRight color="#52525b" size={20} />
          </Pressable>
          <Pressable className="flex-row items-center justify-between p-4 border-b border-zinc-800">
            <Text className="text-white font-medium">Privacy & Security</Text>
            <ChevronRight color="#52525b" size={20} />
          </Pressable>
          <Pressable onPress={handleLogout} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <LogOut color="#ef4444" size={20} className="mr-3" />
              <Text className="text-red-500 font-medium">Log Out</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
