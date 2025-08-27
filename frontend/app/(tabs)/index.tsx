import 'setimmediate'; // Polyfill for setImmediate
import React, { useState, useEffect, useCallback } from "react";
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
  ActivityIndicator,
  Alert
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { enablePromise, openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';

// --- Type Definitions ---
export type Message = {
  _id: string;
  text: string;
  chatId: string;
  senderId: string;
  status: "sent" | "delivered" | "read";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Chat = {
  _id: string;
  userName: string;
  avatarUrl: string;
  lastMessage: string | null;
  timestamp: string | null;
  unreadCount: number;
  isOnline: boolean;
  consent1: boolean;
  consent2: boolean;
  lastMessageId: string | null;
  participants: string[];
  createdAt: string;
  updatedAt: string;
  // Added isSynced field to track sync status
  isSynced: boolean;
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
    return null;
  }
};

const initDB = async (db: SQLiteDatabase) => {
  // Added 'isSynced' column to the chats table
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
  updatedAt TEXT,
  isSynced INTEGER DEFAULT 0
);`;
  const messageTableQuery = `CREATE TABLE IF NOT EXISTS messages (
    _id TEXT PRIMARY KEY NOT NULL,
    chatId TEXT NOT NULL,
    text TEXT,
    senderId TEXT,
    status INTEGER,
    isDelted INTEGER,
    createdAt TEXT,
    updatedAt TEXT
  );`;
  await db.executeSql(chatTableQuery);
  await db.executeSql(messageTableQuery);
};

const saveChatsToDB = async (db: SQLiteDatabase, chats: Chat[]) => {
  await db.transaction(async tx => {
    for (const chat of chats) {
      // The INS--ERT query now matches the CREATE TABLE query
      const query = `INSERT OR REPLACE INTO chats 
  (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt, isSynced) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        chat._id,
        JSON.stringify(chat.participants),
        chat.lastMessageId || null,
        (chat as any).status ? 1 : 0,
        chat.isOnline ? 1 : 0,
        chat.userName,
        chat.consent1 ? 1 : 0,
        chat.consent2 ? 1 : 0,
        chat.unreadCount,
        chat.createdAt,
        chat.updatedAt,
        chat.isSynced ? 1 : 0
      ];
      await tx.executeSql(query, params);
    }
  });
};
const loadChatsFromDB = async (db: SQLiteDatabase) => {
  try {
    const [results] = await db.executeSql('SELECT * FROM chats ORDER BY createdAt DESC', []);
    const chats: Chat[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      if (item) {
        chats.push({
          ...item,
          isOnline: !!item.isOnline,
          consent1: !!item.consent1,
          consent2: !!item.consent2,
          status: !!item.status,
          participants: JSON.parse(item.participants),
          unreadCount: item.unreadCount,
          isSynced: !!item.isSynced,
        });
      }
    }
    return chats;
  } catch (error) {
    console.error("Failed to load chats from DB", error);
    return [];
  }
};

// --- UI Components ---
const router = useRouter();
const userId = "2";
const icon = require("../../assets/images/user2.png");

const ChatListItem = ({
  item,
  onPress,
}: {
  item: Chat;
  onPress: () => void;
}) => (
  <View className="flex-row items-center p-3 border-b border-gray-200 bg-white">
    <TouchableOpacity
      onPress={() => router.push(`/views/userProfile/${item._id}`)}
      className="relative mr-4"
    >
      <Image
        //source={{ uri: item.avatarUrl }}
        source={icon}
        className="w-14 h-14 rounded-full"
      />
      {item.isOnline && (
        <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      )}
    </TouchableOpacity>
    <TouchableOpacity onPress={onPress} className=" flex flex-1 flex-row">
      <View className="flex-1 gap-3">
        <Text className="font-bold text-base text-gray-800">
          {item.userName}
        </Text>
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          {item.lastMessageId ? item.lastMessageId : "Be the first Messager..."}
        </Text>
      </View>
      <View className="items-end gap-3">
        <Text className="text-xs text-gray-400 mb-1">
          {item.createdAt
            ? new Date(item.createdAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "numeric",
            })
            : "No date"}
        </Text>
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

// --- Main Chat List Component ---
const Index = () => {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mockChatList, setMockChatList] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>(mockChatList);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offline, setOffline] = useState(false)

  // Added syncChatsToServer functi
  const syncChatsToServer = async () => {
    if (!db) return;

    try {
      // Get all offline/unsynced chats from SQLite
      const [results] = await db.executeSql(
        "SELECT * FROM chats WHERE isSynced = 0"
      );

      for (let i = 0; i < results.rows.length; i++) {
        const chat = results.rows.item(i);

        try {
          const res = await fetch("http://localhost:8080/chat/creates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({

              participants: JSON.parse(chat.participants),
              lastMessageId: chat.lastMessageId,
              status: !!chat.status,
              isOnline: !!chat.isOnline,
              userName: chat.userName,
              consent1: !!chat.consent1,
              consent2: !!chat.consent2,
              unreadCount: chat.unreadCount,
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt,
            }),
          });

          if (res.ok) {
            // Only mark the chat as synced locally

            const newId = await res.text()

            await db.executeSql(
              "UPDATE chats SET _id = ?, isSynced = 1 WHERE _id = ?",
              [newId, chat._id] // The first '?' is the new ID, the second is the old ID
            );
            console.log("Synced chat to MongoDB:", chat._id);
          } else {
            console.log("Sync failed for chat", chat._id, res.status);
          }
        } catch (err) {
          console.log("Sync failed for chat", chat._id, err);
        }
      }

    } catch (err) {
      console.error("Error fetching unsynced chats:", err);
    }
  };

  // Added nework listener to sync when online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {

      if (state.isConnected) {
        syncChatsToServer();
      }
    });
    return () => unsubscribe();
  }, [db]); // Added db as a depende

  // Initialize the database connection
  useEffect(() => {
    const initializeDB = async () => {
      const dbConnection = await getDBConnection();
      if (dbConnection) {
        await initDB(dbConnection);
        setDb(dbConnection);
      }
    };
    initializeDB();
  }, []);

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
  }, [searchQuery, mockChatList]);

  const handleNavigateToChat = (chatId: string) => {
    router.push(`/views/ChatScreen/${chatId}`);
  };

  const getChatList = async () => {
    setIsLoading(true);

    // Wait for the database state to be set before proceeding
    // This prevents the "Database is not ready" warning
    let database = db;
    if (!database) {
      console.log("Waiting for database connection...");
      database = await getDBConnection();
      if (!database) {
        console.warn("Database connection failed. Cannot load chats.");
        setIsLoading(false);
        return;
      }
      setDb(database);
    }

    const networkState = await NetInfo.fetch();

    if (networkState.isConnected) {
      console.log("Online: Fetching chat list from server...");
      try {
        const res = await fetch(`http://localhost:8080/chat/list?id=${userId}`);


        if (!res.ok) {//
          console.log(`Server returned status: ${res.status}`);

        }

        const data = await res.json();
        setMockChatList(data);
        // await saveChatsToDB(database, data);
        // console.log("Chats fetched from server and saved to local DB.");
        setOffline(false);

      } catch (err: any) { // Use 'fany to access= the error message
        console.log("Server fetch failed, falling back to local DB...", err);
        const localChats = await loadChatsFromDB(database);
        setMockChatList(localChats);
        console.log("Loaded chats from local DB:", localChats);

        // Provide a speciic alert for the user
        //Alert.alert("Server Error", err.message || "Could not connect to the server. Displaying local chats.");
        setOffline(true);
      }
    } else {
      console.log("Offline: Loading chat list from local database.");
      const localChats = await loadChatsFromDB(database);
      setMockChatList(localChats);
      setOffline(true);
    }//

    setIsLoading(false);
  };
  useFocusEffect(
    useCallback(() => {
      getChatList();
    }, [])
  );

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
          <View className='flex-row gap-5'>
            <Text className="text-2xl font-bold text-gray-800">Chats</Text>
            <Text className="text-md font-bold text-gray-400 self-center">{offline ? 'Offline' : 'Online'}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => setIsSearchActive(!isSearchActive)}
          className="p-2"
        >
          <Text className="text-2xl">{isSearchActive ? "✕" : "🔍"}</Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {isLoading && mockChatList.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={({ item }) => (
            <ChatListItem
              item={item}
              onPress={() => handleNavigateToChat(item._id)}
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