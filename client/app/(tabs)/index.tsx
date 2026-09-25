import { View, Text, ScrollView, Pressable, Platform, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Flame, TrendingUp, Footprints, Droplets, Flame as CalorieFlame, Scale, Plus, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiHost = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3001`;
  return 'http://10.0.2.2:3001';
};

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [userName, setUserName] = useState('Guest');
  const [challenge, setChallenge] = useState<any>(null);
  const [volumeData, setVolumeData] = useState<{ day: string, volume: number }[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Calendar State
  const [selectedDateStr, setSelectedDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  // Edit Metrics Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'water' | 'weight' | null>(null);
  const [inputValue, setInputValue] = useState('');

  const loadMetricsForDate = async (uid: string, dateStr: string) => {
    try {
      const host = getApiHost();
      const metricsRes = await fetch(`${host}/api/metrics/daily?userId=${uid}&date=${dateStr}`);
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      let uid = null;
      if (stored) {
        const user = JSON.parse(stored);
        setUserData(user);
        setUserName(user.name || 'Guest');
        uid = user.id;
      }

      const host = getApiHost();
        
      const res = await fetch(`${host}/api/home-feed`);
      if (res.ok) {
        const feed = await res.json();
        setChallenge(feed.challenge);
      }

      if (uid) {
        const volRes = await fetch(`${host}/api/metrics/weekly-volume?userId=${uid}`);
        if (volRes.ok) {
          const rawData = await volRes.json();
          const chartData = [];
          const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().split('T')[0];
            chartData.push({
              day: dayNames[d.getDay()],
              volume: rawData[dateKey] || 0
            });
          }
          setVolumeData(chartData);
        }

        await loadMetricsForDate(uid, selectedDateStr);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (userData) {
      loadMetricsForDate(userData.id, selectedDateStr);
    }
  }, [selectedDateStr, userData]);

  const handleLogData = async () => {
    if (!inputValue || isNaN(Number(inputValue)) || !userData) return;
    setModalVisible(false);
    try {
      const host = getApiHost();
      // Log for the *selected* date so it feels dynamic
      const endpoint = modalType === 'water' ? '/api/metrics/water' : '/api/metrics/weight';
      const body: any = { userId: userData.id, date: selectedDateStr };
      if (modalType === 'water') {
        body.amount = Number(inputValue);
      } else {
        body.weightKg = Number(inputValue);
      }
      await fetch(`${host}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      await loadMetricsForDate(userData.id, selectedDateStr);
    } catch (error) {
      console.error("Error logging data", error);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const days = useMemo(() => {
    const today = new Date();
    const result = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      result.push({
        day: dayNames[d.getDay()],
        date: d.getDate().toString(),
        fullDateStr: dStr,
        active: dStr === selectedDateStr,
      });
    }
    return result;
  }, [selectedDateStr]);

  const maxVolume = useMemo(() => {
    let max = 0;
    volumeData.forEach(d => { if (d.volume > max) max = d.volume; });
    return max || 1;
  }, [volumeData]);

  const hasWorkoutData = useMemo(() => {
    return volumeData.some(d => d.volume > 0);
  }, [volumeData]);

  if (loading && !metrics) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#30E07D" />
      </SafeAreaView>
    );
  }

  const steps = metrics?.stepsCount || 0;
  const water = metrics?.waterIntakeMl ? (metrics.waterIntakeMl / 1000).toFixed(1) : "0.0";
  const calories = metrics?.caloriesEaten || 0;
  const weight = metrics?.weightKg || "--";
  const showHardwareWarning = steps === 0 && calories === 0;

  const isSelectedToday = selectedDateStr === new Date().toISOString().split('T')[0];

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-6">
          <View>
            <Text className="text-zinc-400 text-sm font-medium">{greeting}</Text>
            <Text className="text-white text-2xl font-bold">{userName} 🚀</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-zinc-800 rounded-full justify-center items-center mr-3">
              <Bell color="white" size={20} />
            </View>
            <Pressable onPress={() => router.push('/(tabs)/more')} className="w-10 h-10 bg-zinc-800 rounded-full justify-center items-center">
              <User color="white" size={20} />
            </Pressable>
          </View>
        </View>

        {/* 7-day calendar strip */}
        <View className="flex-row justify-between mb-8">
          {days.map((item, index) => (
            <Pressable 
              key={index} 
              onPress={() => setSelectedDateStr(item.fullDateStr)}
              className={`items-center justify-center h-16 flex-1 mx-1 rounded-[20px] ${item.active ? 'bg-[#30E07D]' : 'bg-zinc-900'}`}
            >
              <Text className={`text-[10px] mb-1 ${item.active ? 'text-black font-bold' : 'text-zinc-400 font-medium'}`}>{item.day}</Text>
              <Text className={`text-base font-bold ${item.active ? 'text-black' : 'text-white'}`}>{item.date}</Text>
            </Pressable>
          ))}
        </View>

        {/* Ongoing challenge card */}
        {challenge ? (
          <View className="bg-zinc-900 rounded-3xl p-5 mb-8">
            <View className="flex-row items-center mb-2">
              <Flame color="#FF5A5F" size={20} className="mr-2" />
              <Text className="text-white text-lg font-bold">{challenge.title}</Text>
            </View>
            <Text className="text-zinc-400 text-sm mb-4">{challenge.description}</Text>
            <View className="h-2 bg-zinc-800 rounded-full mb-4">
              <View className="h-2 bg-[#30E07D] rounded-full w-[45%]" />
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-zinc-400 text-xs">45% Completed</Text>
              <Pressable className="bg-[#30E07D] px-4 py-2 rounded-full">
                <Text className="text-black font-semibold text-xs">Continue</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="bg-zinc-900 rounded-3xl p-5 mb-8 justify-center items-center">
            <Text className="text-zinc-400 text-sm">No active challenge</Text>
          </View>
        )}

        {/* Daily Goals Snapshot */}
        <Text className="text-white text-xl font-bold mb-4">{isSelectedToday ? "Today's Goals" : "Goals Snapshot"}</Text>
        <View className="flex-row flex-wrap justify-between mb-8">
          <View className="w-[48%] bg-zinc-900 rounded-3xl p-4 mb-4 relative overflow-hidden">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#30E07D]/10 rounded-full justify-center items-center mr-3"><Footprints color="#30E07D" size={20} /></View>
              <Text className="text-white font-semibold">Steps</Text>
            </View>
            {showHardwareWarning ? (
              <View><Text className="text-zinc-400 text-xs font-bold mb-1">Not Connected</Text></View>
            ) : (
              <><Text className="text-white text-2xl font-bold mb-1">{steps.toLocaleString()}</Text><Text className="text-zinc-500 text-xs">/ 10,000</Text></>
            )}
          </View>
          <View className="w-[48%] bg-zinc-900 rounded-3xl p-4 mb-4 relative overflow-hidden">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#FF5A5F]/10 rounded-full justify-center items-center mr-3"><CalorieFlame color="#FF5A5F" size={20} /></View>
              <Text className="text-white font-semibold">Calories</Text>
            </View>
            {showHardwareWarning ? (
              <View><Text className="text-zinc-400 text-xs font-bold mb-1">Not Connected</Text></View>
            ) : (
              <><Text className="text-white text-2xl font-bold mb-1">{calories.toLocaleString()}</Text><Text className="text-zinc-500 text-xs">/ 2,400 kcal</Text></>
            )}
          </View>
          <View className="w-[48%] bg-zinc-900 rounded-3xl p-4 mb-4 relative overflow-hidden">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#3B82F6]/10 rounded-full justify-center items-center mr-3"><Droplets color="#3B82F6" size={20} /></View>
              <Text className="text-white font-semibold">Water</Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">{water}L</Text><Text className="text-zinc-500 text-xs">/ 2.5L</Text>
            <Pressable onPress={() => { setModalType('water'); setInputValue(''); setModalVisible(true); }} className="absolute right-4 bottom-4 w-8 h-8 bg-[#3B82F6] rounded-full justify-center items-center"><Plus color="white" size={16} /></Pressable>
          </View>
          <View className="w-[48%] bg-zinc-900 rounded-3xl p-4 mb-4 relative overflow-hidden">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#A855F7]/10 rounded-full justify-center items-center mr-3"><Scale color="#A855F7" size={20} /></View>
              <Text className="text-white font-semibold">Weight</Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">{weight}</Text><Text className="text-zinc-500 text-xs">kg</Text>
            <Pressable onPress={() => { setModalType('weight'); setInputValue(''); setModalVisible(true); }} className="absolute right-4 bottom-4 w-8 h-8 bg-[#A855F7] rounded-full justify-center items-center"><Plus color="white" size={16} /></Pressable>
          </View>
        </View>

        {/* Weekly Volume Bar Graph */}
        <View className="mb-8">
          <View className="flex-row justify-between items-end mb-4">
            <View className="flex-row items-center">
              <TrendingUp color="#30E07D" size={20} className="mr-2" />
              <Text className="text-white text-lg font-bold">Weekly Volume</Text>
            </View>
            <Text className="text-zinc-400 text-xs">(Reps × Weight)</Text>
          </View>

          {hasWorkoutData ? (
            <View className="bg-zinc-900 rounded-3xl p-4 h-32 flex-row justify-between items-end">
              {volumeData.map((item, index) => {
                const heightPercentage = Math.max((item.volume / maxVolume) * 100, 5); 
                const isToday = index === 6;
                return (
                  <View key={index} className="items-center w-8">
                    <View className="w-full justify-end items-center h-20 flex-col-reverse">
                      <View 
                        className={`w-full rounded-t-sm ${isToday ? 'bg-[#30E07D]' : 'bg-zinc-700'}`} 
                        style={{ height: `${heightPercentage}%` }} 
                      />
                    </View>
                    <Text className={`mt-1 text-[10px] font-bold ${isToday ? 'text-[#30E07D]' : 'text-zinc-400'}`}>
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-zinc-900 rounded-3xl p-6 h-32 justify-center items-center border border-zinc-800 border-dashed">
              <TrendingUp color="#52525b" size={28} className="mb-2" />
              <Text className="text-zinc-400 text-sm font-medium">No workout data logged yet.</Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Input Modal for Water/Weight */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-zinc-900 rounded-3xl w-full p-6 items-center">
            <Text className="text-white text-xl font-bold mb-4">
              {modalType === 'water' ? 'Log Water (ml)' : 'Log Weight (kg)'}
            </Text>
            <TextInput
              className="bg-zinc-800 text-white w-full rounded-xl p-4 text-center text-xl font-bold mb-6"
              placeholder={modalType === 'water' ? 'e.g. 250' : 'e.g. 75.5'}
              placeholderTextColor="#a1a1aa"
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
            />
            <View className="flex-row w-full justify-between">
              <Pressable onPress={() => setModalVisible(false)} className="bg-zinc-800 flex-1 rounded-xl p-4 mr-2 items-center"><Text className="text-white font-bold">Cancel</Text></Pressable>
              <Pressable onPress={handleLogData} className="bg-[#30E07D] flex-1 rounded-xl p-4 ml-2 items-center"><Text className="text-black font-bold">Save</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
