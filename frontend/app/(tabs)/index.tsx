import 'setimmediate';
import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, SafeAreaView, Text, Image, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
// Note: We assume the database.ts file is now refactored for the classic API
import { loadChatsFromDB, saveChatsToDB, clearChatsInDB, type Chat } from '../../services/database';

// --- UI Components (No changes needed here) ---

interface ChatListItemProps {
  item: Chat;
  onPress: () => void;
  currentUserId: string;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ item, onPress, currentUserId }) => {
  const router = useRouter();

  const getOtherParticipantName = (chat: Chat, currentUserId: string): string => {
    // Parse participants as array if not already
    const participants = Array.isArray(chat.participants)
      ? chat.participants
      : JSON.parse(chat.participants || "[]");

    // Split userName into names array
    const names = chat.userName?.split(",") || [];

    // Find the index of the other participant
    const otherIndex = participants.findIndex((id: string) => id !== currentUserId);
    console.log(otherIndex)
    // Return the other user's name if available
    if (names.length === 2 && otherIndex !== -1) {
      return names[otherIndex];
    }
    return names[0] || "Unknown";
  };

  const displayName = getOtherParticipantName(item, currentUserId);

  return (
    <View className="flex-row items-center p-3 border-b border-gray-200 bg-white">
      <TouchableOpacity onPress={() => router.push(`/views/userProfile/${item._id}`)} className="relative mr-4">
        <Image source={require("../../assets/images/user2.png")} className="w-14 h-14 rounded-full" />
        {item.isOnline && <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
      </TouchableOpacity>
      <TouchableOpacity onPress={onPress} className="flex flex-1 flex-row">
        <View className="flex-1 gap-3">
          <Text className="font-bold text-base text-gray-800" numberOfLines={1}>{displayName}</Text>
          <Text className="text-sm text-gray-500" numberOfLines={1}>{item.lastMessageId || "Be the first to message..."}</Text>
        </View>
        <View className="items-end gap-3">
          <Text className="text-xs text-gray-400 mb-1">
            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "numeric" }) : "No date"}
          </Text>
          {item.unreadCount > 0 && (
            <View className="bg-blue-600 rounded-full w-6 h-6 justify-center items-center">
              <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};


// --- Main Component (SQL parts will be implicitly fixed by using the refactored database.ts) ---
const Index: React.FC = () => {
  const router = useRouter();
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [isMobileDataOn, setIsMobileDataOn] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState(true);
  const [caset, setCase] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode<{ id: string }>(token);
          setUserId(decoded.id);
        } catch (e) {
          alert("Please login again: " + e);
        }
      }
    };
    getToken();
  }, []);

  // This hook is for polling, no DB logic here.
  useEffect(() => {
    const interval = setInterval(() => {
      // This logic can trigger getChatList, which relies on the fixed DB functions.
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Network info hooks, no DB logic here.
  useEffect(() => {
    const fetchInitial = async () => {
      const state = await NetInfo.fetch();
      setIsMobileDataOn(!!state.isConnected && state.type === 'cellular');
      setIsConnected(!!state.isConnected);
    };
    fetchInitial();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsMobileDataOn(!!state.isConnected && state.type === 'cellular');
      setIsConnected(!!state.isConnected);
    });
    return unsubscribe;
  }, []);


  const getChatList = async () => {
    if (isLoading || isClearing || !userId) return;
    setIsLoading(true);

    try {


      // FIX: Uses the classic-API-wrapped loadChatsFromDB function
      const localChats = await loadChatsFromDB();
      setChatList(localChats);
      console.log(localChats, 'llll')
      console.log("Loaded chats from local DB:", localChats.length);

      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        setCase(false);
        try {
          console.log('chatsssss')

          const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/list?id=${userId}`);
          if (!res.ok) throw new Error(`Server error ${res.status}`);

          const serverChats: Chat[] = await res.json();
          const syncedChats = serverChats.map(chat => ({ ...chat, isSynced: true }));
          const mergedChats = mergeChats(localChats, syncedChats);

          // FIX: Uses the classic-API-wrapped saveChatsToDB function
          await saveChatsToDB(mergedChats);

          setChatList(mergedChats);
          console.log("Updated chats from server:", mergedChats.length);
        } catch (err) {
          console.log("Server fetch failed, showing local DB...", err);
          // We already loaded local chats, so we just show them
        }
      } else {
        if (!localChats || localChats.length === 0) {
          setCase(true);
        }
        console.log("Offline mode, showing local DB chats");
      }
    } catch (err) {
      //console.log("Error loading chats:", err);
      alert("Please restart the app")
    } finally {
      setIsLoading(false);
    }
  };

  const mergeChats = (local: Chat[], server: Chat[]): Chat[] => {
    const map = new Map<string, Chat>();
    local.forEach(chat => map.set(chat._id, chat));
    server.forEach(chat => {
      // A simple merge: server data overwrites local, but you could make this more sophisticated
      const existing = map.get(chat._id) || {};
      map.set(chat._id, { ...existing, ...chat, isSynced: true });
    });
    return Array.from(map.values());
  };

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(async () => {
        if (!isClearing && userId) {
          await getChatList();
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [userId, isClearing, isConnected])
  );

  const clearAllChats = async () => {
    setIsClearing(true);
    try {
      await clearChatsInDB();
      setChatList([]);
      setFilteredChats([]);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const getDisplayName = (chat: Chat, currentUserId: string): string => {
        if (chat.userName && currentUserId) {
          const names = chat.userName.split(",");
          if (names.length === 2) {
            const userIndex = chat.participants.indexOf(currentUserId);
            return userIndex === 0 ? names[1] : names[0];
          }
          return chat.userName;
        }
        return "";
      };
      const filtered = chatList.filter((chat) =>
        getDisplayName(chat, userId).toLowerCase().includes(lowercasedQuery)
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chatList, userId]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pb-2">
      {(caset) ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-lg text-red-500">Please connect to the internet</Text>
        </View>
      ) : (
        <>
          <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
            {isSearchActive ? (
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search chats..."
                className="flex-1 h-10 bg-gray-100 rounded-lg px-4"
                autoFocus
              />
            ) : (
              <View className='flex-row gap-5 items-center'>
                <Text className="text-2xl font-bold text-gray-800">Chats</Text>
                {/* <TouchableOpacity onPress={clearAllChats} disabled={isLoading || isClearing}>
                  <Text className="text-blue-600">clear</Text>
                </TouchableOpacity> */}
                <Text className="text-md font-bold text-gray-400 self-center">{isConnected ? 'Online' : 'Offline'}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setIsSearchActive(!isSearchActive)} className="p-2">
              <Text className="text-2xl">{isSearchActive ? "✕" : "🔍"}</Text>
            </TouchableOpacity>
          </View>

          {(isLoading || isClearing) ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#2563eb" />
              <Text className="mt-2 text-gray-600">{isClearing ? 'Clearing data...' : 'Loading chats...'}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredChats}
              renderItem={({ item }) => (
                <ChatListItem
                  item={item}
                  currentUserId={userId}
                  onPress={() => router.push(`/views/ChatScreen/${item._id}`)}
                />
              )}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={
                <View className="h-screen justify-center items-center">
                  <Text className="text-lg text-gray-500">No chats found.</Text>
                  <TouchableOpacity
                    className="bg-blue-600 px-6 py-3 rounded-lg mt-4"
                    onPress={() => router.push('/(tabs)/ScanQR')}
                  >
                    <Text className="text-white text-base font-semibold">Scan QR to Start Chat</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default Index;

