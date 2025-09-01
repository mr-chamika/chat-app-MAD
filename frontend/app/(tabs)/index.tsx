import 'setimmediate';
import React, { useState, useEffect, useCallback } from "react";
import { View, FlatList, SafeAreaView, Text, Image, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { loadChatsFromDB, saveChatsToDB, clearChatsInDB, type Chat } from '../../services/database'; // Adjust path if needed

// --- UI Components ---

// Define props for ChatListItem for type safety
interface ChatListItemProps {
  item: Chat;
  onPress: () => void;
  currentUserId: string;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ item, onPress, currentUserId }) => {
  const router = useRouter();

  const getOtherParticipantName = (chat: Chat, currentUserId: string): string => {
    if (chat.userName && currentUserId) {
      const names = chat.userName.split(",");
      if (names.length === 2) {
        // Corrected logic to return the *other* user's name
        return currentUserId === chat.participants[0] ? names[0] : names[1];
      }
      return chat.userName;
    }
    return `User ${chat.participants?.[0] || 'Unknown'}`;
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
          <Text className="font-bold text-base text-gray-800">{displayName}</Text>
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


// --- Main Component ---
const Index: React.FC = () => {
  const router = useRouter();
  const [chatList, setChatList] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [offline, setOffline] = useState<boolean>(false);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode<{ id: string }>(token);
        setUserId(decoded.id);
      }
    };
    getToken();
  }, []);

  const getChatList = async () => {
    if (isLoading || isClearing || !userId) return;
    setIsLoading(true);

    try {
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/list?id=${userId}`);
        if (!res.ok) throw new Error(`Server error`);

        const serverChats: Chat[] = await res.json();
        const syncedChats = serverChats.map(chat => ({ ...chat, isSynced: true }));
        await saveChatsToDB(syncedChats);
        setChatList(syncedChats);
        setOffline(false);
      } else {
        const localChats = await loadChatsFromDB();
        setChatList(localChats);
        setOffline(true);
      }
    } catch (err) {
      console.log("Fallback to local DB...", err);
      const localChats = await loadChatsFromDB();
      setChatList(localChats);
      setOffline(true);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Create a timer to ensure the login process finishes its database write first.
      const timer = setTimeout(() => {
        if (!isClearing) {
          getChatList();
        }
      }, 100); // A small 100ms delay is enough to prevent the race condition.

      // Cleanup function to clear the timer if the user navigates away quickly.
      return () => clearTimeout(timer);

    }, [userId, isClearing])
  );

  const clearAllChats = async () => {
    setIsClearing(true);
    await clearChatsInDB();
    setChatList([]);
    setIsClearing(false);
  };

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chatList);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      // A temporary getOtherParticipantName function for filtering
      const getDisplayName = (chat: Chat, currentUserId: string): string => {
        if (chat.userName && currentUserId) {
          const names = chat.userName.split(",");
          if (names.length === 2) {
            return currentUserId === chat.participants[0] ? names[0] : names[1];
          }
          return chat.userName;
        }
        return "";
      };
      const filtered = chatList.filter((chat) =>
        getDisplayName(chat, userId).toLowerCase().startsWith(lowercasedQuery)

      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chatList, userId]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pb-2">
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
            <TouchableOpacity onPress={clearAllChats} disabled={isLoading || isClearing}>
              <Text className="text-blue-600">clear</Text>
            </TouchableOpacity>
            <Text className="text-md font-bold text-gray-400 self-center">{offline ? 'Offline' : 'Online'}</Text>
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
            <View className="flex-1 justify-center items-center mt-20">
              <Text className="text-lg text-gray-500">No chats found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default Index;