
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
import { enablePromise, openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';

// --- Type Definitions (Aligned with Backend Model) ---
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

// This Chat type now mirrors your Java `Chat` model
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
  createdAt: string; // Using string to store ISO date format
  updatedAt: string;
};

// --- Modernized Database Setup ---
enablePromise(true);


const getDBConnection = async () => {
  try {
    const db = await openDatabase({ name: 'chatApp.db', location: 'default' });
    console.log("Database connection successful!");
    return db;
  } catch (error) {
    console.error("Failed to open database:", error);
    return null; // Return null on failure
  }
};

// Updated the schema for the 'chats' table to match the new Chat type
const initDB = async (db: SQLiteDatabase) => {
  const chatTableQuery = `CREATE TABLE IF NOT EXISTS chats (
        _id TEXT PRIMARY KEY NOT NULL,
        participants TEXT,
        lastMessageId TEXT,
        status INTEGER,
        isOnline INTEGER,
        userName TEXT,
        consent1 INTEGER,
        consent2 INTEGER,
        unreadCount INTEGER,
        createdAt TEXT,
        updatedAt TEXT
    );`;
  const messageTableQuery = `CREATE TABLE IF NOT EXISTS messages (
    _id TEXT PRIMARY KEY NOT NULL,
    chatId TEXT NOT NULL,
    text TEXT,
    senderId TEXT,
    status TEXT,
    isDeleted INTEGER,
    createdAt TEXT,
    updatedAt TEXT,
    isSynced INTEGER DEFAULT 0
  );`;
  await db.executeSql(chatTableQuery);
  await db.executeSql(messageTableQuery);
};

// Updated se unction to handle all fields from the Chat model
const saveChatToDB = async (db: SQLiteDatabase, chat: Chat) => {
  const query = `INSERT OR REPLACE INTO chats 
        (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  // Booleans are converted to 1 (true) or 0 (false) for SQLite
  const params = [
    chat._id,
    JSON.stringify(chat.participants),
    chat.lastMessageId,
    chat.status ? 1 : 0,
    chat.isOnline ? 1 : 0,
    chat.userName,
    chat.consent1 ? 1 : 0,
    chat.consent2 ? 1 : 0,
    chat.unreadCount,
    chat.createdAt,
    chat.updatedAt,

  ];
  await db.executeSql(query, params);
};

const saveMessagesToDB = async (db: SQLiteDatabase, messages: Message[]) => {
  await db.transaction(async tx => {
    for (const msg of messages) {
      const query = `INSERT OR REPLACE INTO messages 
        (_id, chatId, text, senderId, status, isDeleted, createdAt, updatedAt, isSynced) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        msg._id,
        msg.chatId,
        msg.text,
        msg.senderId,
        msg.status, // Save status as text
        msg.isDeleted ? 1 : 0, // Convert boolean to integer
        msg.createdAt,
        msg.updatedAt,
        msg.isSynced ? 1 : 0 // Save sync status
      ];
      await tx.executeSql(query, params);
    }
  });
};

const syncMessagesToServer = async (db: any) => {
  try {
    const [results] = await db.executeSql(
      "SELECT * FROM messages WHERE isSynced = 0"
    );

    const unsyncedMessages: any[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      unsyncedMessages.push(results.rows.item(i));
    }

    if (unsyncedMessages.length === 0) {
      console.log("No unsynced messages.");
      return;
    }

    console.log(`Found ${unsyncedMessages.length} unsynced messages. Syncing...`);

    for (const msg of unsyncedMessages) {
      try {
        const res = await fetch("http://localhost:8080/message/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: msg.chatId,
            text: msg.text,
            senderId: msg.senderId,
            status: msg.status,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt,
          }),
        });

        if (res.ok) {
          const savedMsg = await res.json();

          // ✅ Update SQLite: replace old _id with server's _id & mark as synced
          await db.executeSql("UPDATE messages SET isSynced = 1 WHERE _id = ?", [msg._id]);

          console.log(
            `✅ Synced message: Local ID (${msg._id}) → Server ID (${savedMsg._id})`
          );
        } else {
          console.log("❌ Server rejected message:", msg._id, res.status);
        }
      } catch (err) {
        //console.error("❌ Sync failed for message", msg._id, err);
      }
    }
  } catch (err) {
    console.error("❌ Error during sync:", err);
  }
};

// --- UI Components ---
const ChatHeader = ({ user }: { user: Chat }) => {
  const router = useRouter();
  return (
    <View className="flex-row items-center p-2 bg-white border-b border-gray-200 shadow-sm">
      <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
        <Text className="text-2xl font-bold text-blue-600">‹</Text>
      </TouchableOpacity>
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base text-gray-800">
          {user.userName || `User ${user.participants?.[0] || 'Unknown'}`}
        </Text>
        {user.isOnline && <Text className="text-sm text-green-600">Online</Text>}
      </View>
      <TouchableOpacity className="p-2">
        <Text className="text-2xl font-bold text-gray-600">⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const MessageBubble = ({ text, sender }: { text: string; sender: string; }) => {
  const isUser = sender === '6874baf06bb6ef13073a1236'; // Replace with dynamic current user ID
  return (
    <View className={`p-3 rounded-2xl max-w-[80%] mb-2.5 ${isUser ? "bg-blue-500 self-end" : "bg-white self-start"}`}>
      <Text className={`${isUser ? "text-white" : "text-black"}`}>{text}</Text>
    </View>
  );
};

// --- Main Chat Screen Component ---
const ChatScreen = () => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useLocalSearchParams<{ id: string }>();

  // db?.transaction(tx => {
  //   tx.executeSql("SELECT * FROM chats", [], (txObj, resultSet) => {
  //     for (let i = 0; i < resultSet.rows.length; i++) {
  //       console.log("Chats =>", resultSet.rows.item(i));
  //     }
  //   });
  // });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && db) { // Ensure db is available
        // Existing chat sync
        syncMessagesToServer(db); // New message sync
      }
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        const dbConnection = await getDBConnection();

        if (dbConnection) {

          await initDB(dbConnection);
          setDb(dbConnection);

        }
      } catch (error) {
        console.error("Failed to initialize database", error);
      }
    };
    initializeDB();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !db) return;
      setIsLoading(true);
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

  const fetchChatFromServer = async () => {
    if (!id || !db) return;
    try {
      const res = await fetch(`http://localhost:8080/chat/get?id=${id}`);
      if (res.ok) {
        const data: Chat = await res.json();
        setChat(data);
        await saveChatToDB(db, data);
      }
    } catch (err) {
      console.log("Error fetching chat, falling back to local DB.", err);
      await loadChatFromDB();
    }
  };

  const fetchMessagesFromServer = async () => {
    if (!id || !db) return;
    try {
      const res = await fetch(`http://localhost:8080/message/get?id=${id}`);
      if (res.ok) {
        const data: Message[] = await res.json();
        setMessageList(data.slice().reverse());
        //await saveMessagesToDB(db, data);
      }
    } catch (error) {
      console.log('Server fetch failed, falling back to local DB...', error);
      await loadMessagesFromDB();
    }
  };

  // Updated load function to correctly parse all fields from the DB
  const loadChatFromDB = async () => {
    if (!id || !db) return;
    try {
      const [results] = await db.executeSql('SELECT * FROM chats WHERE _id = ?', [id]);
      if (results.rows.length > 0) {
        const item = results.rows.item(0);
        const loadedChat: Chat = {
          ...item,
          participants: JSON.parse(item.participants),
          // Convert integers back to booleans
          status: !!item.status,
          isOnline: !!item.isOnline,
          consent1: !!item.consent1,
          consent2: !!item.consent2,
        };
        setChat(loadedChat);
      }
    } catch (error) {
      console.error("Failed to load chat from DB", error);
    }
  };

  const loadMessagesFromDB = async () => {
    if (!id || !db) return;
    try {
      const [results] = await db.executeSql('SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC', [id]);
      const messages: Message[] = [];
      for (let i = 0; i < results.rows.length; i++) {
        messages.push(results.rows.item(i));
      }
      setMessageList(messages);
    } catch (error) {
      console.error("Failed to load messages from DB", error);
    }
  };

  // Inside ChatScreen component
  const createMessage = async () => {
    if (message.trim() === '' || !id || !db) return;

    const tempMessageId = new Date().getTime().toString(); // temporary ID
    const newMessage: Message = {
      _id: tempMessageId,
      chatId: id,
      text: message,
      senderId: '6874baf06bb6ef13073a1236', // your user ID
      status: 'sent',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };

    // 1️⃣ Save to SQLite first
    await saveMessagesToDB(db, [newMessage]);

    // 2️⃣ Optimistically show in UI
    setMessageList(prev => [newMessage, ...prev]);
    setMessage('');

    // 3️⃣ If online, send to server
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      try {
        const res = await fetch(`http://localhost:8080/message/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessage),
        });

        if (res.ok) {
          const savedMessage: Message = await res.json();

          // 4️⃣ Update SQLite to mark synced (and update server _id if changed)
          await db.executeSql(
            "UPDATE messages SET _id = ?, isSynced = 1 WHERE _id = ?",
            [savedMessage._id, tempMessageId]
          );

          // Update UI as well
          setMessageList(prev =>
            prev.map(msg =>
              msg._id === tempMessageId ? { ...msg, _id: savedMessage._id, isSynced: true } : msg
            )
          );

          console.log('Message sent & saved to DB:', savedMessage._id);
        } else throw new Error(`Server error ${res.status}`);
      } catch (err) {
        console.log("Server failed, message stays unsynced in SQLite:", err);
      }
    } else {
      console.log("Offline: message saved locally, will sync later.");
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
  );
};

export default ChatScreen;