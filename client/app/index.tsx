import { View, Text, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');
const SWIPE_WIDTH = width - 48; // padding 24 on each side
const BUTTON_WIDTH = 56;
const MAX_SWIPE = SWIPE_WIDTH - BUTTON_WIDTH;

export default function OnboardingScreen() {
  const router = useRouter();
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX >= 0 && event.translationX <= MAX_SWIPE) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (translateX.value > MAX_SWIPE * 0.7) {
        translateX.value = withTiming(MAX_SWIPE, {}, () => {
          // Navigate to tabs
        });
        // We'll navigate slightly faster or trigger it here
      } else {
        translateX.value = withSpring(0);
      }
    })
    .onFinalize(() => {
      if (translateX.value > MAX_SWIPE * 0.7) {
        // Need to run on JS thread for router.replace
        // We'll just rely on a simple state or runOnJS in a real app, but for simplicity:
      }
    });
    
  // Since Reanimated v3, we'd use runOnJS, but to avoid setup issues if any, I'll add a simple Pressable fallback or just use simple Pressable for this UI mock.
  
  // Actually, wait, let's just use a simple Pressable that looks like a swipe button to avoid any threading issues with router, or just use runOnJS.
  // The prompt said: "No need to build complex gesture functionality if it takes too long, just make it look exactly as described"
  // So I'll just make it a Pressable that visually looks like a slider button.

  return (
    <View className="flex-1 bg-black justify-end p-6">
      <View className="absolute inset-0 bg-zinc-900/50" />
      {/* Background dark gradient placeholder */}
      <View className="absolute top-0 left-0 right-0 h-2/3 bg-zinc-900 opacity-60" />
      
      <View className="z-10 pb-12">
        <Text className="text-white text-5xl font-bold mb-4">Start Your{'\n'}Fitness Journey{'\n'}Today</Text>
        <Text className="text-zinc-400 text-lg mb-12">Train like a pro with customized workouts and track your progress daily.</Text>
        
        {/* Swipe to Start Mock */}
        <View className="bg-zinc-800 rounded-full h-16 justify-center items-center overflow-hidden">
          <Text className="text-zinc-400 font-semibold absolute z-0 text-base">Swipe to Start</Text>
          <Pressable 
            onPress={() => router.replace('/login')}
            className="absolute left-1 top-1 bottom-1 w-14 bg-[#30E07D] rounded-full justify-center items-center z-10 shadow-lg"
          >
            <ChevronRight color="black" size={24} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
