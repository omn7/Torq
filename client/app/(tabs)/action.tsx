import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Plus, Trash2, Droplets, Scale } from 'lucide-react-native';
import { useEffect, useState, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/api';

const WORKOUT_DB = {
  "Chest": ["Barbell Flat Bench Press", "Dumbbell Flat Bench Press", "Incline Barbell Bench Press", "Incline Dumbbell Bench Press", "Decline Bench Press", "Dumbbell Chest Flye", "Cable Chest Flye", "Pec Deck Machine Flye", "Chest Dips", "Push-ups", "Machine Chest Press"],
  "Back": ["Barbell Deadlift", "Barbell Bent-Over Row", "Dumbbell Single-Arm Row", "Lat Pulldown", "Seated Cable Row", "T-Bar Row", "Pull-ups", "Straight-Arm Cable Pulldown", "Face Pulls", "Back Extensions"],
  "Legs": ["Barbell Back Squat", "Barbell Front Squat", "Leg Press", "Romanian Deadlift (RDL)", "Bulgarian Split Squat", "Walking Lunges", "Leg Extension Machine", "Lying Leg Curl Machine", "Seated Leg Curl Machine", "Standing Calf Raise", "Hip Thrust"],
  "Shoulders": ["Overhead Barbell Press", "Seated Dumbbell Shoulder Press", "Arnold Press", "Dumbbell Lateral Raise", "Cable Lateral Raise", "Front Dumbbell Raise", "Rear Delt Dumbbell Flye", "Reverse Pec Deck", "Dumbbell Shrugs"],
  "Biceps": ["Standing Barbell Bicep Curl", "Standing Dumbbell Bicep Curl", "EZ-Bar Preacher Curl", "Incline Dumbbell Curl", "Hammer Curl", "Concentration Curl", "Cable Bicep Curl", "Spider Curl"],
  "Triceps": ["Tricep Rope Pushdown", "Straight-Bar Cable Pushdown", "Skull Crushers", "Overhead Dumbbell Tricep Extension", "Overhead Cable Tricep Extension", "Close-Grip Barbell Bench Press", "Tricep Dips", "Cable Kickbacks"]
};
const MUSCLES = Object.keys(WORKOUT_DB);
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


export default function ActionScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyMetrics, setWeeklyMetrics] = useState<any[]>([]);

  // Workout Builder State
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [activeExercises, setActiveExercises] = useState<any[]>([]); // { name: string, sets: [] }
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('userData');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      setUserData(user);

      const host = API_URL;
      const res = await fetch(`${host}/api/metrics/weekly?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setWeeklyMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load metrics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleMuscle = (muscle: string) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const addExercise = (exerciseName: string) => {
    setActiveExercises([...activeExercises, { name: exerciseName, sets: [{ reps: '', weight: '' }] }]);
    setExerciseModalVisible(false);
  };

  const addSet = (exIndex: number) => {
    const updated = [...activeExercises];
    updated[exIndex].sets.push({ reps: '', weight: '' });
    setActiveExercises(updated);
  };

  const updateSet = (exIndex: number, setIndex: number, field: 'reps'|'weight', value: string) => {
    const updated = [...activeExercises];
    updated[exIndex].sets[setIndex][field] = value;
    setActiveExercises(updated);
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    const updated = [...activeExercises];
    updated[exIndex].sets.splice(setIndex, 1);
    if (updated[exIndex].sets.length === 0) {
      updated.splice(exIndex, 1);
    }
    setActiveExercises(updated);
  };

  const saveWorkout = async () => {
    if (activeExercises.length === 0) return;
    setIsSavingWorkout(true);
    try {
      const host = API_URL;
      const dbSets = [];
      for (const ex of activeExercises) {
        let setNum = 1;
        for (const s of ex.sets) {
          if (s.reps && s.weight) {
            dbSets.push({
              exerciseName: ex.name,
              setNumber: setNum++,
              reps: Number(s.reps),
              weightKg: Number(s.weight)
            });
          }
        }
      }
      
      if (dbSets.length === 0) {
         setIsSavingWorkout(false);
         return;
      }

      const response = await fetch(`${host}/api/workouts/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          sets: dbSets
        })
      });
      
      const resData = await response.json();
      if (resData.newStreak !== undefined) {
        const updatedUser = { ...userData, streakDays: resData.newStreak };
        setUserData(updatedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }

      setActiveExercises([]);
      setSelectedMuscles([]);
      Alert.alert("Success", "Workout saved successfully!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save workout");
    } finally {
      setIsSavingWorkout(false);
    }
  };

  const dayName = useMemo(() => DAYS[new Date().getDay()], []);
  const availableExercises = useMemo(() => {
    let list: string[] = [];
    selectedMuscles.forEach(m => {
      list = [...list, ...(WORKOUT_DB as any)[m]];
    });
    return list;
  }, [selectedMuscles]);

  // Transform weekly metrics for charts (last 7 days)
  const chartData = useMemo(() => {
    const data = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const map = new Map();
    weeklyMetrics.forEach(m => {
      map.set(m.date.split('T')[0], m);
    });

    let maxWater = 0;
    let maxWeight = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = map.get(dateStr) || { waterIntakeMl: 0, weightKg: 0 };
      
      const waterL = dayData.waterIntakeMl / 1000;
      const weight = dayData.weightKg || 0;

      if (waterL > maxWater) maxWater = waterL;
      if (weight > maxWeight) maxWeight = weight;

      data.push({
        day: dayNames[d.getDay()],
        waterL,
        weight
      });
    }
    return { data, maxWater: maxWater || 1, maxWeight: maxWeight || 1 };
  }, [weeklyMetrics]);

  if (loading && !userData) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#30E07D" />
      </SafeAreaView>
    );
  }

  const streak = userData?.streakDays || 0;

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-white text-3xl font-bold mb-6">Progress</Text>

        {/* Streak Counter */}
        <View className="bg-zinc-900 rounded-3xl p-6 mb-8 items-center border border-[#30E07D]/20">
          <View className="w-20 h-20 bg-black rounded-full justify-center items-center mb-4 border-2 border-[#30E07D]">
            <Flame color="#30E07D" fill="#30E07D" size={36} />
          </View>
          <Text className="text-white text-4xl font-black mb-1">{streak}</Text>
          <Text className="text-zinc-400 text-base font-medium">Day Streak!</Text>
          <Text className="text-zinc-500 text-xs mt-2 text-center">
            {streak > 0 ? `You're on fire! Keep it up and hit ${streak + 1} days tomorrow.` : "Start your streak today!"}
          </Text>
        </View>

        {/* Weekly Weight Graph */}
        <View className="mb-8">
          <View className="flex-row items-center mb-3">
            <Scale color="#A855F7" size={18} className="mr-2" />
            <Text className="text-white text-base font-bold">Weight History</Text>
          </View>
          <View className="bg-zinc-900 rounded-2xl p-4 h-28 flex-row justify-between items-end">
            {chartData.data.map((item, index) => {
              const heightPercentage = Math.max((item.weight / chartData.maxWeight) * 100, 5); 
              const isToday = index === 6;
              return (
                <View key={index} className="items-center w-6">
                  <View className="w-full justify-end items-center h-16 flex-col-reverse">
                    <View className={`w-full rounded-t-sm ${isToday ? 'bg-[#A855F7]' : 'bg-zinc-700'}`} style={{ height: `${heightPercentage}%` }} />
                  </View>
                  <Text className={`mt-1 text-[8px] font-bold ${isToday ? 'text-[#A855F7]' : 'text-zinc-400'}`}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Workout Builder */}
        <View className="mb-4 mt-4">
          <Text className="text-[#30E07D] font-bold text-sm uppercase mb-1">Today is {dayName}</Text>
          <Text className="text-white text-xl font-bold mb-4">Log Your Workout</Text>
          
          <Text className="text-zinc-400 font-medium mb-3">1. Select Muscle Groups</Text>
          <View className="flex-row flex-wrap mb-6">
            {MUSCLES.map(m => {
              const isSelected = selectedMuscles.includes(m);
              return (
                <Pressable key={m} onPress={() => toggleMuscle(m)} className={`px-4 py-2 rounded-full mr-2 mb-2 border ${isSelected ? 'bg-[#30E07D] border-[#30E07D]' : 'bg-transparent border-zinc-700'}`}>
                  <Text className={`font-bold ${isSelected ? 'text-black' : 'text-zinc-400'}`}>{m}</Text>
                </Pressable>
              )
            })}
          </View>

          {selectedMuscles.length > 0 && (
            <Pressable onPress={() => setExerciseModalVisible(true)} className="bg-zinc-800 py-4 rounded-2xl items-center flex-row justify-center mb-6">
              <Plus color="white" size={20} className="mr-2" />
              <Text className="text-white font-bold text-base">Add Exercise</Text>
            </Pressable>
          )}

          {activeExercises.map((ex, exIndex) => (
            <View key={exIndex} className="bg-zinc-900 rounded-3xl p-5 mb-4">
              <Text className="text-white font-bold text-lg mb-4">{ex.name}</Text>
              
              <View className="flex-row justify-between mb-2 px-2">
                <Text className="text-zinc-500 text-xs font-bold w-1/4">SET</Text>
                <Text className="text-zinc-500 text-xs font-bold w-1/4 text-center">REPS</Text>
                <Text className="text-zinc-500 text-xs font-bold w-1/4 text-center">KG</Text>
                <View className="w-8"></View>
              </View>

              {ex.sets.map((set: any, setIndex: number) => (
                <View key={setIndex} className="flex-row justify-between items-center mb-3 bg-black/40 rounded-xl p-2">
                  <View className="w-1/4 justify-center pl-2">
                    <Text className="text-white font-bold">{setIndex + 1}</Text>
                  </View>
                  <View className="w-1/4 px-1">
                    <TextInput 
                      className="bg-zinc-800 text-white rounded-lg p-2 text-center" 
                      keyboardType="numeric" 
                      placeholder="0" 
                      placeholderTextColor="#52525b"
                      value={set.reps}
                      onChangeText={(v) => updateSet(exIndex, setIndex, 'reps', v)}
                    />
                  </View>
                  <View className="w-1/4 px-1">
                    <TextInput 
                      className="bg-zinc-800 text-white rounded-lg p-2 text-center" 
                      keyboardType="numeric" 
                      placeholder="0" 
                      placeholderTextColor="#52525b"
                      value={set.weight}
                      onChangeText={(v) => updateSet(exIndex, setIndex, 'weight', v)}
                    />
                  </View>
                  <Pressable onPress={() => removeSet(exIndex, setIndex)} className="w-8 h-8 justify-center items-center">
                    <Trash2 color="#ef4444" size={18} />
                  </Pressable>
                </View>
              ))}

              <Pressable onPress={() => addSet(exIndex)} className="mt-2 py-3 bg-zinc-800 rounded-xl items-center">
                <Text className="text-white font-bold text-sm">+ Add Set</Text>
              </Pressable>
            </View>
          ))}

          {activeExercises.length > 0 && (
            <Pressable onPress={saveWorkout} disabled={isSavingWorkout} className={`bg-[#30E07D] py-4 rounded-2xl items-center mt-4 ${isSavingWorkout ? 'opacity-50':''}`}>
              <Text className="text-black font-bold text-lg">{isSavingWorkout ? 'Saving...' : 'Save Workout'}</Text>
            </Pressable>
          )}

        </View>

      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal visible={exerciseModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-zinc-900">
          <View className="p-5 border-b border-zinc-800 flex-row justify-between items-center">
            <Text className="text-white text-xl font-bold">Select Exercise</Text>
            <Pressable onPress={() => setExerciseModalVisible(false)}><Text className="text-[#30E07D] font-bold text-lg">Close</Text></Pressable>
          </View>
          <ScrollView className="flex-1 p-5">
            {availableExercises.map(ex => (
              <Pressable key={ex} onPress={() => addExercise(ex)} className="bg-zinc-800 p-4 rounded-xl mb-3 flex-row justify-between items-center">
                <Text className="text-white font-semibold text-base">{ex}</Text>
                <Plus color="#30E07D" size={20} />
              </Pressable>
            ))}
            <View className="h-10" />
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
