import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Star, Play, Clock, Flame } from 'lucide-react-native';

export default function WorkoutDetailsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-black">
      {/* Media Player Preview / Header */}
      <View className="h-2/5 bg-zinc-800 relative">
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-16 h-16 bg-black/50 rounded-full justify-center items-center">
            <Play fill="white" color="white" size={32} className="ml-1" />
          </View>
        </View>
        
        <SafeAreaView className="absolute top-0 left-0 right-0 flex-row justify-between px-4 pt-4">
          <Pressable 
            onPress={() => router.back()}
            className="w-10 h-10 bg-black/50 rounded-full justify-center items-center backdrop-blur-md"
          >
            <ArrowLeft color="white" size={20} />
          </Pressable>
        </SafeAreaView>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Title & Rating */}
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <Text className="text-white text-3xl font-bold mb-2">HIIT Fat Burner</Text>
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center mr-4">
                <Clock color="#a1a1aa" size={16} className="mr-1" />
                <Text className="text-zinc-400 text-sm">45 Min</Text>
              </View>
              <View className="flex-row items-center">
                <Flame color="#a1a1aa" size={16} className="mr-1" />
                <Text className="text-zinc-400 text-sm">500 kcal</Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center bg-zinc-900 px-3 py-1.5 rounded-full">
            <Star fill="#F59E0B" color="#F59E0B" size={16} className="mr-1" />
            <Text className="text-white font-bold text-sm">4.9</Text>
          </View>
        </View>

        {/* Description */}
        <Text className="text-white text-lg font-semibold mb-2 mt-4">About this workout</Text>
        <Text className="text-zinc-400 text-base leading-6 mb-8">
          A high-intensity interval training session designed to maximize calorie burn and improve cardiovascular endurance. No equipment needed. Be prepared to sweat!
        </Text>

        {/* Trainer Bio */}
        <Text className="text-white text-lg font-semibold mb-4">Instructor</Text>
        <View className="flex-row items-center bg-zinc-900 p-4 rounded-2xl mb-8">
          <View className="w-16 h-16 bg-zinc-700 rounded-full mr-4" />
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Sarah Jenkins</Text>
            <Text className="text-zinc-400 text-sm mb-1">Master Trainer</Text>
          </View>
          <Pressable className="bg-zinc-800 px-4 py-2 rounded-full">
            <Text className="text-white text-sm font-medium">Follow</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-xl">
        <Pressable className="bg-[#30E07D] py-4 rounded-full items-center shadow-lg shadow-[#30E07D]/30">
          <Text className="text-black font-bold text-lg">Join Now</Text>
        </Pressable>
      </View>
    </View>
  );
}
