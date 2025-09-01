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
import * as SQLite from 'expo-sqlite'; // Replaced with expo-sqlite
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { saveMessagesToDB } from "@/services/database";

// --- Type Definitions (Unchanged) ---
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
  isSynced: boolean
};


// --- Modernized Database Setup with expo-sqlite ---
const getDBConnection = () => { // No longer async

  if (Platform.OS === "web") {
    console.warn("SQLite not supported on web. Using server only.");
    return null;
  }

  try {
    const db = SQLite.openDatabaseSync('chatApp.db'); // Use openDatabaseSync
    console.log("Database connection successful!");
    return db;
  } catch (error) {
    console.error("Failed to open database:", error);
    return null;
  }
};

const initDB = async (db: SQLite.SQLiteDatabase) => {
  // Create tables if they don't exist
  const query = `
    CREATE TABLE IF NOT EXISTS chats (
        _id TEXT PRIMARY KEY NOT NULL, participants TEXT, lastMessageId TEXT,
        status INTEGER, isOnline INTEGER, userName TEXT, consent1 INTEGER,
        consent2 INTEGER, unreadCount INTEGER, createdAt TEXT, updatedAt TEXT,
        isSynced INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS messages (
        _id TEXT PRIMARY KEY NOT NULL, chatId TEXT NOT NULL, text TEXT,
        senderId TEXT, status TEXT, isDeleted INTEGER, createdAt TEXT,
        updatedAt TEXT, isSynced INTEGER DEFAULT 0
    );`;
  await db.execAsync(query);

  // --- MIGRATION: add missing columns ---
  const chatColumns = await db.getAllAsync<any>("PRAGMA table_info(chats);");
  const messageColumns = await db.getAllAsync<any>("PRAGMA table_info(messages);");

  if (!chatColumns.some((col) => col.name === "isSynced")) {
    await db.execAsync("ALTER TABLE chats ADD COLUMN isSynced INTEGER DEFAULT 0;");
    console.log("🟢 Added missing isSynced column to chats");
  }

  if (!messageColumns.some((col) => col.name === "isSynced")) {
    await db.execAsync("ALTER TABLE messages ADD COLUMN isSynced INTEGER DEFAULT 0;");
    console.log("🟢 Added missing isSynced column to messages");
  }
};


const saveChatsToDB = async (db: SQLite.SQLiteDatabase, chats: Chat[]) => {
  await db.withTransactionAsync(async () => {
    for (const chat of chats) {
      const query = 'INSERT OR REPLACE INTO chats (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const params = [
        chat._id, JSON.stringify(chat.participants), chat.lastMessageId,
        chat.status ? 1 : 0, chat.isOnline ? 1 : 0, chat.userName,
        chat.consent1 ? 1 : 0, chat.consent2 ? 1 : 0, chat.unreadCount,
        chat.createdAt, chat.updatedAt, chat.isSynced ? 1 : 0,
      ];
      await db.runAsync(query, params);
    }
  });
};

// const saveMessagesToDB = async (db: SQLite.SQLiteDatabase, messages: Message[]) => {
//   // Use withTransactionAsync for a cleaner transaction
//   await db.withTransactionAsync(async () => {
//     for (const msg of messages) {
//       const query = `INSERT OR REPLACE INTO messages (_id, chatId, text, senderId, status, isDeleted, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
//       const params = [
//         msg._id, msg.chatId, msg.text, msg.senderId, msg.status,
//         msg.isDeleted ? 1 : 0, msg.createdAt, msg.updatedAt, msg.isSynced ? 1 : 0
//       ];

//       // FIX: Call runAsync on the 'db' object, not 'msg'
//       await db.runAsync(query, params);

//       console.log("newMessage saved:", msg._id);
//     }
//   });
// };
const syncMessagesToServer = async (db: SQLite.SQLiteDatabase) => {
  try {
    const unsyncedMessages = await db.getAllAsync<Message>("SELECT * FROM messages WHERE isSynced = 0");

    if (unsyncedMessages.length === 0) return;
    console.log(`Found ${unsyncedMessages.length} unsynced messages. Syncing...`);

    for (const msg of unsyncedMessages) {
      const { isSynced, ...msgTo } = msg;
      try {
        const res = await fetch("https://chatappbackend-production-e023.up.railway.app/message/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msg: msgTo }),
        });

        if (res.ok) {
          await db.runAsync("UPDATE messages SET isSynced = 1 WHERE _id = ?", [msg._id]);
          console.log(`✅ Synced message: Local ID (${msg._id})`);
        } else {
          console.log("❌ Server rejected message:", msg._id, res.status);
        }
      } catch (err) {
        // console.error("❌ Sync failed for message", msg._id, err);
      }
    }
  } catch (err) {
    //console.error("❌ Error during sync:", err);
  }
};

// --- UI Components (Unchanged) ---
const ChatHeader = ({ user }: { user: Chat }) => {
  // ... (This component's code remains the same as it has no DB logic)
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

  let displayName = user.userName;
  if (user.userName && currentUserId) {
    const names = user.userName.split(",");
    if (names.length === 2) {
      displayName = currentUserId === user.participants[0] ? names[0] : names[1];
    }
  }
  return (
    <View className="flex-row items-center p-2 bg-white border-b border-gray-200 shadow-sm">
      <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
        <Text className="text-2xl font-bold text-blue-600">‹</Text>
      </TouchableOpacity>
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base text-gray-800">
          {displayName || `User ${user.participants?.[0] || 'Unknown'}`}
        </Text>
        {user.isOnline && <Text className="text-sm text-green-600">Online</Text>}
      </View>
      <TouchableOpacity className="p-2">
        <Text className="text-2xl font-bold text-gray-600">⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const CurrentUserContext = React.createContext<{ currentUserId: string }>({ currentUserId: "" });

const MessageBubble = ({ text, sender }: { text: string; sender: string; }) => {
  const { currentUserId } = React.useContext(CurrentUserContext);
  const isUser = sender === currentUserId;
  return (
    <View className={`p-3 rounded-2xl max-w-[80%] mb-2.5 ${isUser ? "bg-blue-500 self-end" : "bg-white self-start"}`}>
      <Text className={`${isUser ? "text-white" : "text-black"}`}>{text}</Text>
    </View>
  );
};

// --- Main Chat Screen Component ---
const ChatScreen = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && db) {
        syncMessagesToServer(db);
      }
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const initializeDB = () => { // No longer async
      const dbConnection = getDBConnection();
      console.log(dbConnection, 'ooo')

      if (dbConnection) {
        initDB(dbConnection); // initDB is still async
        setDb(dbConnection);
      }
    };
    initializeDB();
  }, []);

  const fetchChatFromServer = async () => {
    if (!id || !db) return;
    try {
      const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/get?id=${id}`);
      if (res.ok) {
        const data: Chat = await res.json();
        const syncedChat = { ...data, isSynced: true };
        setChat(syncedChat);
        await saveChatsToDB(db, [syncedChat]);
      } else {
        throw new Error('Server fetch failed');
      }
    } catch (err) {
      //console.log("Error fetching chat, falling back to local DB.", err);
      await loadChatFromDB();
    }
  };

  const fetchMessagesFromServer = async () => {
    if (!id || !db) return;
    try {
      const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/message/get?id=${id}`);
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessageList(data.slice().reverse());
        await saveMessagesToDB(data); // Save fetched messages
      } else {
        throw new Error('Server fetch failed');
      }
    } catch (error) {
      console.log('Server fetch failed, falling back to local DB...', error);
      await loadMessagesFromDB();
    }
  };

  const loadChatFromDB = async () => {
    if (!id || !db) return;
    try {
      // Use getFirstAsync for a cleaner query
      const item = await db.getFirstAsync<any>('SELECT * FROM chats WHERE _id = ?', [id]);
      if (item) {
        const loadedChat: Chat = {
          ...item,
          participants: JSON.parse(item.participants),
          status: !!item.status, isOnline: !!item.isOnline,
          consent1: !!item.consent1, consent2: !!item.consent2,
        };
        setChat(loadedChat);
      }
    } catch (error) {
      //console.error("Failed to load chat from DB", error);
    }
  };

  const loadMessagesFromDB = async () => {
    if (!id || !db) return;
    try {
      // Use getAllAsync to get all messages at once
      const messages = await db.getAllAsync<Message>('SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC', [id]);
      setMessageList(messages);
    } catch (error) {
      //console.error("Failed to load messages from DB", error);
      setMessageList([])
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      if (Platform.OS === "web") {
        // 🚀 Web → always fetch from server, no SQLite
        try {
          const chatRes = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/get?id=${id}`);
          if (chatRes.ok) {
            const data: Chat = await chatRes.json();
            setChat({ ...data, isSynced: true });
          }

          const msgRes = await fetch(`https://chatappbackend-production-e023.up.railway.app/message/get?id=${id}`);
          if (msgRes.ok) {
            const data: Message[] = await msgRes.json();
            setMessageList(data.slice().reverse());
          }
        } catch (err) {
          console.error("Web fetch failed", err);
        }

        setIsLoading(false);
        return;
      }

      if (!id || !db) return;
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        await fetchChatFromServer();
        await fetchMessagesFromServer();
      } else {
        console.log("Offline: Loading data from local database.");
        await loadChatFromDB();
        await loadMessagesFromDB();
      }
      setIsLoading(false);
    };
    loadData();
  }, [id, db]);

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

  const createMessage = async () => {
    if (message.trim() === '' || !id || !db) return;
    const tempMessageId = new Date().getTime().toString();
    const newMessage: Message = {
      _id: tempMessageId, chatId: id, text: message,
      senderId: currentUserId, status: 'sent', isDeleted: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      isSynced: false,
    };

    await saveMessagesToDB([newMessage]);

    setMessageList(prev => [newMessage, ...prev]);
    setMessage('');

    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      try {
        const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/message/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessage),
        });

        if (res.ok) {
          const savedMessage: Message = await res.json();
          // Use runAsync to update the message status
          await db.runAsync(
            "UPDATE messages SET _id = ?, isSynced = 1 WHERE _id = ?",
            [savedMessage._id, tempMessageId]
          );
          setMessageList(prev =>
            prev.map(msg =>
              msg._id === tempMessageId ? { ...msg, _id: savedMessage._id, isSynced: true } : msg
            )
          );
        } else throw new Error(`Server error ${res.status}`);
      } catch (err) {
        console.log("Server failed, message stays unsynced in SQLite:", err);
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

  // The rest of your JSX remains the same
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
                keyExtractor={(item) => item._id}
                className="flex-1"
                inverted
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text>No messages yet. Start the conversation!</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center p-3 border-t border-gray-300 bg-white">
            <TextInput
              className="flex-1 h-10 bg-gray-100 rounded-2xl px-4 mr-2"
              placeholder="Type a message..."
              placeholderTextColor="#999"
              onChangeText={setMessage}
              value={message}
            />
            <TouchableOpacity
              onPress={createMessage}
              className={`rounded-full p-3 ${message.trim() === '' ? 'bg-blue-300' : 'bg-blue-600'}`}
              disabled={message.trim() === ''}
            >
              <Text className="text-white text-base font-semibold">Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CurrentUserContext.Provider>
  );
};

export default ChatScreen;

