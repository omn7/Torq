import { View, Text, ScrollView, Pressable, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Utensils, Coffee, Apple, Pizza } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiHost = () => {
  if (Platform.OS === 'web') return 'http://localhost:3001';
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:3001`;
  return 'http://10.0.2.2:3001';
};

const getMealIcon = (type: string) => {
  if (type === 'Breakfast') return <Coffee color="#30E07D" size={24} />;
  if (type === 'Snack') return <Apple color="#30E07D" size={24} />;
  if (type === 'Dinner') return <Pizza color="#30E07D" size={24} />;
  return <Utensils color="#30E07D" size={24} />;
};

export default function MealsScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [addModal, setAddModal] = useState(false);
  const [mealType, setMealType] = useState('Breakfast');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const loadMeals = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      if (stored) {
        const user = JSON.parse(stored);
        setUserData(user);
        
        const host = getApiHost();
        const dateStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`${host}/api/meals?userId=${user.id}&date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          setMeals(data);
        }
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeals();
  }, []);

  const handleAddMeal = async () => {
    if (!mealName.trim() || !calories.trim()) return;
    try {
      const host = getApiHost();
      const dateStr = new Date().toISOString().split('T')[0];
      const res = await fetch(`${host}/api/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          type: mealType,
          name: mealName.trim(),
          calories: parseInt(calories),
          protein: parseInt(protein || '0'),
          carbs: parseInt(carbs || '0'),
          fats: parseInt(fats || '0'),
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setAddModal(false);
        setMealName('');
        setCalories('');
        setProtein('');
        setCarbs('');
        setFats('');
        loadMeals();
      }
    } catch (e) {
      alert("Error adding meal");
    }
  };

  if (loading || !userData) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#30E07D" />
      </SafeAreaView>
    );
  }

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalFats = meals.reduce((sum, m) => sum + m.fats, 0);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="px-5 pt-6 pb-4 border-b border-zinc-900">
        <Text className="text-white text-3xl font-bold">Nutrition</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-xl font-bold">Today's Meals</Text>
            <Text className="text-zinc-500 text-xs mt-1">{totalCalories} / 2,500 kcal</Text>
          </View>
          <Pressable onPress={() => setAddModal(true)} className="bg-[#30E07D]/20 px-4 py-2 rounded-full border border-[#30E07D]/30">
            <Text className="text-[#30E07D] font-bold text-xs">+ Log Meal</Text>
          </Pressable>
        </View>

        {/* Macros */}
        <View className="bg-zinc-900 rounded-3xl p-5 mb-6 flex-row justify-between">
          <View className="items-center flex-1 border-r border-zinc-800">
            <Text className="text-zinc-400 text-xs mb-1">Protein</Text>
            <Text className="text-white font-bold text-lg">{totalProtein}g</Text>
          </View>
          <View className="items-center flex-1 border-r border-zinc-800">
            <Text className="text-zinc-400 text-xs mb-1">Carbs</Text>
            <Text className="text-white font-bold text-lg">{totalCarbs}g</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-zinc-400 text-xs mb-1">Fats</Text>
            <Text className="text-white font-bold text-lg">{totalFats}g</Text>
          </View>
        </View>

        {/* Meal List */}
        {meals.length === 0 ? (
          <View className="bg-zinc-900 rounded-3xl p-8 items-center border border-zinc-800 border-dashed">
            <Utensils color="#52525b" size={40} className="mb-4" />
            <Text className="text-zinc-400 font-medium text-center">No meals logged today</Text>
          </View>
        ) : (
          meals.map(meal => (
            <View key={meal.id} className="bg-zinc-900 rounded-3xl p-4 mb-4 flex-row items-center">
              <View className="w-12 h-12 bg-black rounded-full justify-center items-center mr-4">
                {getMealIcon(meal.type)}
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{meal.type}</Text>
                <Text className="text-zinc-500 text-xs">{meal.name}</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-bold">{meal.calories} kcal</Text>
                <Text className="text-zinc-500 text-[10px] mt-1">P:{meal.protein} C:{meal.carbs} F:{meal.fats}</Text>
              </View>
            </View>
          ))
        )}
        <View className="h-24" />
      </ScrollView>

      {/* Add Meal Modal */}
      {addModal && (
        <View className="absolute inset-0 bg-black/90 justify-center p-6 z-50">
          <ScrollView contentContainerStyle={{ paddingVertical: 40 }} showsVerticalScrollIndicator={false}>
            <View className="bg-zinc-900 rounded-3xl w-full p-6">
              <Text className="text-white text-xl font-bold mb-4">Log a Meal</Text>
              
              <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1">MEAL TYPE</Text>
              <View className="flex-row flex-wrap mb-4">
                {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(t => (
                  <Pressable 
                    key={t}
                    onPress={() => setMealType(t)}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${mealType === t ? 'bg-[#30E07D]/20 border-[#30E07D]' : 'bg-black border-zinc-800'}`}
                  >
                    <Text className={mealType === t ? 'text-[#30E07D] font-bold' : 'text-zinc-500'}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1">FOOD NAME</Text>
              <TextInput
                className="bg-black text-white p-4 rounded-xl mb-4 border border-zinc-800"
                placeholder="e.g. Chicken breast and rice"
                placeholderTextColor="#52525b"
                value={mealName}
                onChangeText={setMealName}
              />

              <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1">CALORIES</Text>
              <TextInput
                className="bg-black text-white p-4 rounded-xl mb-4 border border-zinc-800"
                placeholder="0"
                placeholderTextColor="#52525b"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />

              <View className="flex-row justify-between mb-6">
                <View className="flex-1 mr-2">
                  <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1">PROTEIN (g)</Text>
                  <TextInput
                    className="bg-black text-white p-4 rounded-xl border border-zinc-800"
                    placeholder="0"
                    placeholderTextColor="#52525b"
                    keyboardType="numeric"
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>
                <View className="flex-1 mx-1">
                  <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1">CARBS (g)</Text>
                  <TextInput
                    className="bg-black text-white p-4 rounded-xl border border-zinc-800"
                    placeholder="0"
                    placeholderTextColor="#52525b"
                    keyboardType="numeric"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-zinc-400 text-xs font-bold mb-2 ml-1">FATS (g)</Text>
                  <TextInput
                    className="bg-black text-white p-4 rounded-xl border border-zinc-800"
                    placeholder="0"
                    placeholderTextColor="#52525b"
                    keyboardType="numeric"
                    value={fats}
                    onChangeText={setFats}
                  />
                </View>
              </View>

              <View className="flex-row w-full justify-between">
                <Pressable onPress={() => setAddModal(false)} className="bg-zinc-800 flex-1 rounded-xl p-4 mr-2 items-center"><Text className="text-white font-bold">Cancel</Text></Pressable>
                <Pressable onPress={handleAddMeal} className="bg-[#30E07D] flex-1 rounded-xl p-4 ml-2 items-center"><Text className="text-black font-bold">Save</Text></Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

    </SafeAreaView>
  );
}
