import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

import {
  saveMessagesToDB,
  saveChatsToDB,
  getMessagesByChatId,
  getChatById,
  deleteMessageById,
} from "@/services/database";

export type Message = {
  _id: string;
  text: string;
  chatId: string;
  senderId: string;
  status: "sent" | "delivered" | "read";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
};

export type Chat = {
  _id: string;
  participants: string[];
  lastMessageId: string | null;
  status: boolean;
  isOnline: boolean;
  userName: string;
  consent1: boolean;
  consent2: boolean;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
};

const CurrentUserContext = React.createContext<{ currentUserId: string }>({ currentUserId: "" });

const ChatHeader = ({ user }: { user: Chat }) => {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const x = jwtDecode<{ id: string }>(token);
        setCurrentUserId(x.id);
      }
    };
    getToken();
  }, []);

  const participants = Array.isArray(user.participants)
    ? user.participants
    : JSON.parse(user.participants || "[]");
  const names = user.userName?.split(",") || [];
  const otherIndex = participants.findIndex((id: string) => id !== currentUserId);

  let displayName = names[otherIndex] || "Unknown";


  return (
    <View className="flex-row items-center p-2 bg-white border-b border-gray-200 shadow-sm">
      <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
        <Text className="text-2xl font-bold text-blue-600">‹</Text>
      </TouchableOpacity>
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base text-gray-800">
          {displayName}
        </Text>
        {user.isOnline && <Text className="text-sm text-green-600">Online</Text>}
      </View>
      <TouchableOpacity className="p-2">
        <Text className="text-2xl font-bold text-gray-600">⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const MessageBubble = ({ text, sender }: { text: string; sender: string }) => {
  const { currentUserId } = React.useContext(CurrentUserContext);
  const isUser = sender === currentUserId;
  return (
    <View
      className={`p-3 rounded-2xl max-w-[80%] mb-2.5 ${isUser ? "bg-blue-500 self-end" : "bg-white self-start"
        }`}
    >
      <Text className={`${isUser ? "text-white" : "text-black"}`}>{text}</Text>
    </View>
  );
};

const ChatScreen = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!id || !isConnected) return;
    const interval = setInterval(() => {
      fetchMessagesFromServer();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [id, isConnected]);

  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const x = jwtDecode<{ id: string }>(token);
        setCurrentUserId(x.id);
      }
    };
    getToken();
  }, []);

  const loadChatFromDB = async () => {
    if (!id) return;
    const chatData = await getChatById(id);
    console.log(chatData, 'xxxxx')
    if (chatData) setChat(chatData);
  };


  const loadMessagesFromDB = async () => {
    if (!id) return;
    const messages = await getMessagesByChatId(id);
    console.log('chat data', messages)
    setMessageList(messages);
  };

  const fetchChatFromServer = async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/get?id=${id}`);
      if (res.ok) {
        const data: Chat = await res.json();
        const syncedChat = { ...data, isSynced: true };
        setChat(syncedChat);
        await saveChatsToDB([syncedChat]);
      }
    } catch {
      await loadChatFromDB();
    }
  };

  const fetchMessagesFromServer = async () => {
    if (!id) return;
    try {
      const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/message/get?id=${id}`);
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessageList(data.slice().reverse());
        saveMessagesToDB(data);
      }
    } catch {
      loadMessagesFromDB();
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {

        await fetchChatFromServer();
        await fetchMessagesFromServer();
      } else {

        await loadChatFromDB();
        await loadMessagesFromDB();
      }

      setIsLoading(false);
    };

    if (id) loadData();
  }, [id, isConnected]);

  const createMessage = async () => {
    if (message.trim() === "" || !id) return;

    const tempMessageId = new Date().getTime().toString();
    const newMessage: Message = {
      _id: tempMessageId,
      chatId: id,
      text: message,
      senderId: currentUserId,
      status: "sent",
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };

    saveMessagesToDB([newMessage]);
    setMessageList(prev => [newMessage, ...prev]);
    setMessage("");

    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      try {
        const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/message/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMessage),
        });

        if (res.ok) {
          const savedMessage: Message = await res.json();
          await deleteMessageById(tempMessageId);

          saveMessagesToDB([{ ...savedMessage, isSynced: true }]);
          setMessageList(prev =>
            prev.map(msg => (msg._id === tempMessageId ? { ...msg, _id: savedMessage._id, isSynced: true } : msg))
          );
        }
      } catch (err) {
        console.log("Server failed, message stays unsynced:", err);
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <Text>Loading messages...</Text>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Chat not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <CurrentUserContext.Provider value={{ currentUserId }}>
      <SafeAreaView className="flex-1 bg-gray-200">
        <ChatHeader user={chat} />
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1"
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
        >
          <View className="flex-1 p-3">
            {messageList.length > 0 ? (
              <FlatList
                data={messageList}
                renderItem={({ item }) => <MessageBubble text={item.text} sender={item.senderId} />}
                keyExtractor={item => item._id}
                className="flex-1"
                inverted
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text>No messages yet. Start the conversation!</Text>
              </View>
            )}
          </View>
          {isConnected && <View className="flex-row items-center p-3 border-t border-gray-300 bg-white">
            <TextInput
              className="flex-1 h-10 bg-gray-100 rounded-2xl px-4 mr-2"
              placeholder="Type a message..."
              placeholderTextColor="#999"
              onChangeText={setMessage}
              value={message}
            />
            <TouchableOpacity
              onPress={createMessage}
              className={`rounded-full p-3 ${message.trim() === "" ? "bg-blue-300" : "bg-blue-600"}`}
              disabled={message.trim() === ""}
            >
              <Text className="text-white text-base font-semibold">Send</Text>
            </TouchableOpacity>
          </View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CurrentUserContext.Provider>
  );
};

export default ChatScreen;
