import { Tabs } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Home, Utensils, Play, Activity, Grid, MessageCircle, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 24,
          right: 24,
          elevation: 0,
          backgroundColor: '#18181b', // zinc-900
          borderRadius: 32,
          height: 72,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home color={focused ? '#30E07D' : '#71717a'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          tabBarIcon: ({ color, focused }) => (
            <Utensils color={focused ? '#30E07D' : '#71717a'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="action"
        options={{
          title: 'Action',
          tabBarButton: (props) => {
            const router = require('expo-router').useRouter();
            return (
              <View className="justify-center items-center pb-6">
                <Pressable 
                  onPress={() => router.push('/action')}
                  className="w-14 h-14 rounded-full bg-[#30E07D] justify-center items-center shadow-lg border-4 border-black"
                  style={{
                    shadowColor: '#30E07D',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                  }}
                >
                  <Play fill="black" color="black" size={24} className="ml-1" />
                </Pressable>
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle color={focused ? '#30E07D' : '#71717a'} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <User color={focused ? '#30E07D' : '#71717a'} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
