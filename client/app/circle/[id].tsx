import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Flame, Trophy, User } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/constants/api';


export default function CircleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'leaderboard' | 'chat'>('leaderboard');
  const scrollViewRef = useRef<ScrollView>(null);

  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem('userData');
      let uid = null;
      if (stored) {
        const u = JSON.parse(stored);
        setUserData(u);
        uid = u.id;
      }
      
      const host = API_URL;
      // Fetch circle details (by finding it in the user's circles)
      if (uid) {
        const res = await fetch(`${host}/api/circles?userId=${uid}`);
        if (res.ok) {
          const circles = await res.json();
          const target = circles.find((c: any) => c.id === id);
          if (target) setCircle(target);
        }
      }

      // Fetch Chat
      const chatRes = await fetch(`${host}/api/circles/${id}/chat`);
      if (chatRes.ok) {
        const msgs = await chatRes.json();
        setChatMessages(msgs);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId.trim()) return;
    try {
      const host = API_URL;
      const res = await fetch(`${host}/api/circles/${id}/addMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: newMemberId })
      });
      if (res.ok) {
        setAddMemberModal(false);
        setNewMemberId('');
        loadData(); // Refresh to see the new member
      } else {
        const data = await res.json();
        alert(data.error || "User not found");
      }
    } catch(e) {
      alert("Error adding member");
    }
  };

  useEffect(() => {
    loadData();
    // Simple polling for chat every 5s
    const interval = setInterval(() => {
      if (tab === 'chat') {
        const host = API_URL;
        fetch(`${host}/api/circles/${id}/chat`)
          .then(res => res.json())
          .then(data => setChatMessages(data))
          .catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id, tab]);

  const handleSend = async () => {
    if (!inputText.trim() || !userData) return;
    const txt = inputText.trim();
    setInputText('');
    
    // Optimistic UI update
    const tempMsg = {
      id: Math.random().toString(),
      text: txt,
      senderId: userData.id,
      senderName: userData.name,
      senderAvatar: userData.avatarUrl,
      createdAt: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const host = API_URL;
      await fetch(`${host}/api/circles/${id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userData.id, text: txt })
      });
      // Will be refreshed by polling or next load
    } catch(e) {
      console.error(e);
    }
  };

  // Search autocomplete state
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!newMemberId || newMemberId.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const host = API_URL;
        const res = await fetch(`${host}/api/users/search?q=${encodeURIComponent(newMemberId)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newMemberId]);

  if (loading || !circle) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#30E07D" />
      </SafeAreaView>
    );
  }

  // Sort users by streak for leaderboard
  const leaderboard = [...(circle.users || [])].sort((a, b) => b.streakDays - a.streakDays);

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-zinc-900">
        <Pressable onPress={() => router.back()} className="w-10 h-10 bg-zinc-900 rounded-full justify-center items-center mr-3">
          <ChevronLeft color="white" size={24} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">{circle?.name}</Text>
          <Text className="text-zinc-500 text-xs">{circle?.users?.length} Members</Text>
        </View>
        <Pressable onPress={() => setAddMemberModal(true)} className="bg-[#30E07D]/20 px-3 py-1.5 rounded-full border border-[#30E07D]/30">
          <Text className="text-[#30E07D] font-bold text-xs">+ Add</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mt-4 mb-4">
        <Pressable 
          onPress={() => setTab('leaderboard')} 
          className={`flex-1 p-3 rounded-xl items-center mr-2 ${tab === 'leaderboard' ? 'bg-[#30E07D]' : 'bg-zinc-900'}`}
        >
          <Text className={`font-bold ${tab === 'leaderboard' ? 'text-black' : 'text-zinc-400'}`}>Leaderboard</Text>
        </Pressable>
        <Pressable 
          onPress={() => setTab('chat')} 
          className={`flex-1 p-3 rounded-xl items-center ml-2 ${tab === 'chat' ? 'bg-[#30E07D]' : 'bg-zinc-900'}`}
        >
          <Text className={`font-bold ${tab === 'chat' ? 'text-black' : 'text-zinc-400'}`}>Chat</Text>
        </Pressable>
      </View>

      {tab === 'leaderboard' && (
        <ScrollView className="flex-1 px-4">
          <View className="bg-zinc-900/50 rounded-3xl p-5 border border-zinc-800">
            {leaderboard.map((u, i) => (
              <View key={u.id} className="flex-row items-center py-4 border-b border-zinc-800/50">
                <Text className="text-zinc-500 font-black w-6 text-base">{i + 1}</Text>
                
                <View className="w-10 h-10 bg-black rounded-full overflow-hidden justify-center items-center mr-3">
                  {u.avatarUrl ? <Image source={{ uri: u.avatarUrl }} className="w-full h-full" /> : <User color="#52525b" size={20} />}
                </View>
                
                <View className="flex-1">
                  <Text className="text-white font-bold">{u.name} {u.id === userData?.id && "(You)"}</Text>
                </View>
                
                <View className="items-end">
                  <View className="flex-row items-center">
                    <Flame color="#30E07D" size={16} fill="#30E07D" className="mr-1" />
                    <Text className="text-white font-bold">{u.streakDays}</Text>
                  </View>
                  <Text className="text-zinc-500 text-[10px]">Day Streak</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {tab === 'chat' && (
        <View className="flex-1">
          <ScrollView 
            ref={scrollViewRef}
            className="flex-1 px-4" 
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {chatMessages.length === 0 ? (
              <Text className="text-center text-zinc-500 mt-10">Say hi to your friends!</Text>
            ) : (
              chatMessages.map((msg, i) => {
                const isMe = msg.senderId === userData?.id;
                return (
                  <View key={msg.id} className={`mb-4 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <View className="w-8 h-8 bg-zinc-800 rounded-full mr-2 mt-auto overflow-hidden justify-center items-center">
                        {msg.senderAvatar ? <Image source={{ uri: msg.senderAvatar }} className="w-full h-full" /> : <User color="#52525b" size={14} />}
                      </View>
                    )}
                    <View className={`max-w-[75%] rounded-2xl p-3 ${isMe ? 'bg-[#30E07D] rounded-br-none' : 'bg-zinc-900 rounded-bl-none'}`}>
                      {!isMe && <Text className="text-[#30E07D] text-[10px] font-bold mb-1">{msg.senderName}</Text>}
                      <Text className={isMe ? 'text-black' : 'text-white'}>{msg.text}</Text>
                    </View>
                    {isMe && (
                      <View className="w-8 h-8 bg-[#30E07D]/30 border border-[#30E07D] rounded-full ml-2 mt-auto overflow-hidden justify-center items-center">
                        {msg.senderAvatar ? <Image source={{ uri: msg.senderAvatar }} className="w-full h-full" /> : <User color="black" size={14} />}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Chat Input */}
          <View className="p-4 bg-zinc-900 flex-row items-center border-t border-black">
            <TextInput
              className="flex-1 bg-black text-white px-4 py-3 rounded-full mr-3 border border-zinc-800"
              placeholder="Message your circle..."
              placeholderTextColor="#52525b"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <Pressable onPress={handleSend} className="w-12 h-12 bg-[#30E07D] rounded-full justify-center items-center">
              <Send color="black" size={20} className="ml-1" />
            </Pressable>
          </View>
        </View>
      )}

      {/* Add Member Modal */}
      {addMemberModal && (
        <View className="absolute inset-0 bg-black/80 justify-center items-center p-6 z-50">
          <View className="bg-zinc-900 rounded-3xl w-full p-6 items-center max-h-[80%]">
            <User color="#30E07D" size={40} className="mb-4" />
            <Text className="text-white text-xl font-bold mb-2">Add a Friend</Text>
            <Text className="text-zinc-400 text-center mb-6 text-sm">Search by name or enter their exact email.</Text>
            
            <TextInput
              className="bg-black text-white w-full rounded-xl p-4 text-center font-bold mb-2 border border-zinc-800"
              placeholder="e.g. John or john@example.com"
              placeholderTextColor="#52525b"
              value={newMemberId}
              onChangeText={setNewMemberId}
              autoCapitalize="none"
              autoFocus
            />

            {searchResults.length > 0 && (
              <ScrollView className="w-full max-h-40 mb-4 rounded-xl border border-zinc-800 bg-black">
                {searchResults.map(user => (
                  <Pressable 
                    key={user.id} 
                    onPress={() => setNewMemberId(user.name)}
                    className="p-3 border-b border-zinc-800 flex-row items-center"
                  >
                    <View className="w-8 h-8 bg-zinc-900 rounded-full overflow-hidden justify-center items-center mr-3">
                      {user.avatarUrl ? <Image source={{ uri: user.avatarUrl }} className="w-full h-full" /> : <User color="#52525b" size={12} />}
                    </View>
                    <Text className="text-white font-medium">{user.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            {!searchResults.length && <View className="h-4" />}
            
            <View className="flex-row w-full justify-between">
              <Pressable onPress={() => {setAddMemberModal(false); setNewMemberId(''); setSearchResults([]);}} className="bg-zinc-800 flex-1 rounded-xl p-4 mr-2 items-center"><Text className="text-white font-bold">Cancel</Text></Pressable>
              <Pressable onPress={handleAddMember} className="bg-[#30E07D] flex-1 rounded-xl p-4 ml-2 items-center"><Text className="text-black font-bold">Add</Text></Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
