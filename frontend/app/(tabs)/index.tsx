import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

type Chat = {
  id: string;
  userName: string;
  avatarUrl: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
};

const mockChatList: Chat[] = [
  {
    id: "1",
    userName: "Jane Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    lastMessage: "Looks cool! Can you send me the files?",
    timestamp: "10:45 AM",
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: "2",
    userName: "John Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026705d",
    lastMessage: "See you tomorrow at the meeting!",
    timestamp: "9:30 AM",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "3",
    userName: "Alex Ray",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026706d",
    lastMessage: "Okay, sounds good. I will check it out.",
    timestamp: "Yesterday",
    unreadCount: 5,
    isOnline: true,
  },
  {
    id: "4",
    userName: "Sarah Conner",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026707d",
    lastMessage: "Haha, that is hilarious!",
    timestamp: "Yesterday",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "5",
    userName: "Mike Ross",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026708d",
    lastMessage: "Did you get the documents I sent?",
    timestamp: "Sun",
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: "6",
    userName: "Emily Carter",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026709d",
    lastMessage: "Let's catch up later this week.",
    timestamp: "Sun",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "7",
    userName: "Tech Group",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026710d",
    lastMessage: "Alex: Don't forget the deadline!",
    timestamp: "Fri",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "8",
    userName: "David Chen",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026711d",
    lastMessage: "Thanks for your help!",
    timestamp: "Fri",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "9",
    userName: "Olivia Martinez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026712d",
    lastMessage: "I have a question about the project.",
    timestamp: "Thu",
    unreadCount: 3,
    isOnline: false,
  },
  {
    id: "10",
    userName: "Ben Taylor",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026713d",
    lastMessage: "Can you review my code?",
    timestamp: "Thu",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "11",
    userName: "Chloe Wilson",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026714d",
    lastMessage: "Happy Birthday! 🎉",
    timestamp: "Wed",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "12",
    userName: "Daniel Brown",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026715d",
    lastMessage: "Are you free for a quick call?",
    timestamp: "Wed",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "13",
    userName: "Sophia Garcia",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026716d",
    lastMessage: "No problem!",
    timestamp: "Tue",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "14",
    userName: "Marketing Team",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026717d",
    lastMessage: "Jane: New campaign brief is up.",
    timestamp: "Tue",
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: "15",
    userName: "James Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026718d",
    lastMessage: "You too!",
    timestamp: "Mon",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "16",
    userName: "Isabella Rodriguez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026719d",
    lastMessage: "Typing...",
    timestamp: "Mon",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "17",
    userName: "William Lee",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026720d",
    lastMessage: "Let me know what you think.",
    timestamp: "7/20/2025",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "18",
    userName: "Mia Hernandez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026721d",
    lastMessage: "Sent the invoice.",
    timestamp: "7/19/2025",
    unreadCount: 0,
    isOnline: false,
  },
  {
    id: "19",
    userName: "Ethan Gonzalez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026722d",
    lastMessage: "Perfect, thank you!",
    timestamp: "7/18/2025",
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: "20",
    userName: "Ava Perez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026723d",
    lastMessage: "See you there.",
    timestamp: "7/17/2025",
    unreadCount: 0,
    isOnline: false,
  },
];

const router = useRouter();
const ChatListItem = ({
  item,
  onPress,
}: {
  item: Chat;
  onPress: () => void;
}) => (
  <View className="flex-row items-center p-3 border-b border-gray-200 bg-white">
    <TouchableOpacity
      onPress={() => router.push(`/views/userProfile/${item.id}`)}
      className="relative mr-4"
    >
      <Image
        source={{ uri: item.avatarUrl }}
        className="w-14 h-14 rounded-full"
      />
      {item.isOnline && (
        <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      )}
    </TouchableOpacity>
    <TouchableOpacity onPress={onPress} className=" flex flex-1 flex-row">
      <View className="flex-1">
        <Text className="font-bold text-base text-gray-800">
          {item.userName}
        </Text>
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-xs text-gray-400 mb-1">{item.timestamp}</Text>
        {item.unreadCount > 0 && (
          <View className="bg-blue-600 rounded-full w-6 h-6 justify-center items-center">
            <Text className="text-white text-xs font-bold">
              {item.unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  </View>
);

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredChats, setFilteredChats] = useState<Chat[]>(mockChatList);
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(mockChatList);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = mockChatList.filter((chat) =>
        chat.userName.toLowerCase().startsWith(lowercasedQuery)
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery]);
  const handleNavigateToChat = (chatId: string) => {
    router.push(`/views/ChatScreen/${chatId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 pb-2">
      {/* Header */}
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
          <Text className="text-2xl font-bold text-gray-800">Chats</Text>
        )}
        <TouchableOpacity
          onPress={() => setIsSearchActive(!isSearchActive)}
          className="p-2"
        >
          <Text className="text-2xl">{isSearchActive ? "✕" : "🔍"}</Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={({ item }) => (
          <ChatListItem
            item={item}
            onPress={() => handleNavigateToChat(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-lg text-gray-500">No chats found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Index;
