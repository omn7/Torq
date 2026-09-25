import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, ChevronRight, MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import Constants from 'expo-constants';

const getApiHost = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3001`;
  return 'http://10.0.2.2:3001';
};

export default function ChatScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Circle State
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [circleName, setCircleName] = useState('');

  const loadCircles = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const user = JSON.parse(stored);
        setUserData(user);

        const host = getApiHost();
        const res = await fetch(`${host}/api/circles?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCircles(data);
        }
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCircles();
  }, []);

  const handleJoinCircle = async () => {
    if (!circleName.trim()) return;
    try {
      const host = getApiHost();
      const res = await fetch(`${host}/api/circles/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, name: circleName.trim() })
      });
      if (res.ok) {
        setJoinModalVisible(false);
        setCircleName('');
        loadCircles(); // Refresh circles
      }
    } catch(e) {
      Alert.alert("Error", "Could not join circle");
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
      <View className="px-5 pt-6 pb-4 border-b border-zinc-900">
        <Text className="text-white text-3xl font-bold">Chats & Circles</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-white text-xl font-bold">My Circles</Text>
          <Pressable onPress={() => setJoinModalVisible(true)} className="bg-[#30E07D]/20 px-4 py-2 rounded-full border border-[#30E07D]/30">
            <Text className="text-[#30E07D] font-bold text-xs">+ Join/Create</Text>
          </Pressable>
        </View>

        {circles.length === 0 ? (
          <View className="bg-zinc-900 rounded-3xl p-8 items-center border border-zinc-800 border-dashed mt-4">
            <MessageCircle color="#52525b" size={48} className="mb-4" />
            <Text className="text-zinc-400 font-medium text-center text-lg mb-2">No active chats</Text>
            <Text className="text-zinc-500 text-sm text-center">Join or create a circle to start chatting with your friends and seeing their stats!</Text>
          </View>
        ) : (
          circles.map(circle => (
            <Pressable 
              key={circle.id} 
              onPress={() => router.push(`/circle/${circle.id}`)}
              className="bg-zinc-900 rounded-3xl p-5 mb-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <View className="w-14 h-14 bg-black rounded-full justify-center items-center mr-4 border border-zinc-800">
                  <Users color="#30E07D" size={24} />
                </View>
                <View>
                  <Text className="text-white font-bold text-xl mb-1">{circle.name}</Text>
                  <Text className="text-zinc-500 text-sm">{circle.users?.length || 0} Members</Text>
                </View>
              </View>
              <ChevronRight color="#52525b" size={24} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Join Circle Modal */}
      <Modal visible={joinModalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-zinc-900 rounded-3xl w-full p-6 items-center">
            <Users color="#30E07D" size={40} className="mb-4" />
            <Text className="text-white text-xl font-bold mb-2">Join a Circle</Text>
            <Text className="text-zinc-400 text-center mb-6 text-sm">Enter a circle name. If it doesn't exist, we will create it for you to invite your friends!</Text>
            
            <TextInput
              className="bg-black text-white w-full rounded-xl p-4 text-center font-bold mb-6 border border-zinc-800"
              placeholder="e.g. FitFam, GymBros"
              placeholderTextColor="#52525b"
              value={circleName}
              onChangeText={setCircleName}
              autoFocus
            />
            
            <View className="flex-row w-full justify-between">
              <Pressable onPress={() => {setJoinModalVisible(false); setCircleName('');}} className="bg-zinc-800 flex-1 rounded-xl p-4 mr-2 items-center"><Text className="text-white font-bold">Cancel</Text></Pressable>
              <Pressable onPress={handleJoinCircle} className="bg-[#30E07D] flex-1 rounded-xl p-4 ml-2 items-center"><Text className="text-black font-bold">Join</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
