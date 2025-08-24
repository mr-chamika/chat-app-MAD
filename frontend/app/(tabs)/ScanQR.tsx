import React, { useState, useEffect } from "react";
import { View, Text, Alert, Platform, Button, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo"
import SQLite from "react-native-sqlite-storage";

SQLite.enablePromise(true);
// Define the shape of the Chat object
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

export const getDBConnection = async () => {
  try {
    const db = await SQLite.openDatabase(
      { name: "chat.db", location: "default" }
    );
    console.log("✅ DB Connected");
    return db;
  } catch (error) {
    console.error("❌ DB connection error:", error);
    throw error;
  }
};


// Function to save a chat object to the local database
// This function assumes `db` will be null on web, and valid on native.
const saveChatToDB = async (db: any, chat: Chat) => {
  try {
    await db.executeSql(
      `INSERT OR REPLACE INTO chats
      (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt,isSynced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        chat._id,
        JSON.stringify(chat.participants), // ✅ store as JSON string
        chat.lastMessageId,
        chat.status ? 1 : 0,
        chat.isOnline ? 1 : 0,
        chat.userName,
        chat.consent1 ? 1 : 0,
        chat.consent2 ? 1 : 0,
        chat.unreadCount,
        chat.createdAt,
        chat.updatedAt,
        chat.isSynced ?? 0
      ]
    );
    console.log("✅ Chat inserted:", chat._id);
  } catch (err) {
    console.error("❌ Error inserting chat:", err);
  }
};


// --- Main Component ---
const ScanQRScreen = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [db, setDb] = useState<any>(null); // State to hold the database connection
  const [isLoading, setIsLoading] = useState(false); // New state for loading indicator

  // TODO: This should be replaced with the actual logged-in user's ID
  const userId = "2";


  const syncChatsToServer = async () => {
    const db = await getDBConnection();
    if (!db) return;
    try {
      const [results] = await db.executeSql("SELECT * FROM chats WHERE isSynced = 0", []);
      for (let i = 0; i < results.rows.length; i++) {
        const chat = results.rows.item(i);
        try {
          const res = await fetch(`http://localhost:8080/chat/creates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              _id: chat._id, // Send temporary ID to server
              participants: JSON.parse(chat.participants),
              status: !!chat.status,
              isOnline: !!chat.isOnline,
              userName: chat.userName,
              consent1: !!chat.consent1,
              consent2: !!chat.consent2,
              unreadCount: chat.unreadCount,
              createdAt: chat.createdAt,
              updatedAt: chat.updatedAt
            }),
          });

          if (res.ok) {
            const newServerId = await res.text(); // Gt new ID from backend response

            // ✅ FIX: Update the local chat with the new server-generated ID and mark it as synced.
            await db.executeSql(
              "UPDATE chats SET _id = ?, isSynced = 1 WHERE _id = ?",
              [newServerId, chat._id]
            );

            console.log(`Synced chat: Old ID (${chat._id}) updated to New ID (${newServerId})`);
          } else {
            console.log(`Sync failed for chat ${chat._id}: Status ${res.status}`);
          }
        } catch (err) {
          //console.log(`Sync failed for chat ${chat._id}:`, err);
        }
      }
    } catch (err) {
      // console.error("Error fetching unsynced chats:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncChatsToServer();
      }
    });
    return () => unsubscribe();
  }, []);


  // Effect to initialize the database connection when the component mounts
  // THIS WAS COMMENTED OUT - IT IS NOW UNCOMMENTED AND ACTIVE!
  useEffect(() => {
    if (Platform.OS !== "web") {
      const initDB = async () => {
        try {
          const sqlite = require("react-native-sqlite-storage");
          sqlite.enablePromise(true);

          const dbConnection = await sqlite.openDatabase({
            name: "chatApp.db",
            location: "default",
          });

          // ✅ Wait for table creation
          await dbConnection.executeSql(`
          CREATE TABLE IF NOT EXISTS chats (
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

          );
        `);

          console.log("✅ Chats table ready");
          setDb(dbConnection);
        } catch (err) {
          console.error("DB init failed ❌", err);
        }
      };

      initDB();
    }
  }, []);

  // Effect to reset the scanner when the screen is focused
  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      setIsLoading(false); // Reset loading state when screen is focused
    }
  }, [isFocused]);

  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    if (scanned || isLoading) return;
    setScanned(true);
    setIsLoading(true);

    // Initial temporary chat object
    const newChat: Chat = {
      _id: data, // Temporary ID
      participants: [userId, data],
      lastMessageId: null,
      status: true,
      isOnline: false,
      userName: `User-${data}`,
      consent1: false,
      consent2: false,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSynced: false
    };

    try {
      // Try to create the chat on the backend
      const res = await fetch(
        `http://localhost:8080/chat/create?inviteTo=${data}&scan=${userId}`
      );

      if (res.ok) {
        // ✅ Success: Update the ID with the server's ID
        const newServerId = await res.text();
        newChat._id = newServerId;
        newChat.isSynced = true; // Mark as synced since it was created online
        console.log("Chat created online with ID:", newChat._id);
      } else {
        // ❌ Server Rejected: Treat as an offline-only chat for now
        // The 'newChat' object remains unchanged with its temporary ID
        console.log(`Server rejected scan: Status ${res.status}. Saving offline.`);
        // No need to throw an error, just proceed to save locally
      }

      // Save the chat to SQLite regardless of online/offline success
      await saveChatToDB(db, newChat);

      router.push(`/views/ChatScreen/${newChat._id}`);

    } catch (err) {
      // ❌ Network failure: Save the chat locally with the temporary ID
      console.log("Network error, saving chat offline:", err);
      await saveChatToDB(db, newChat);
      router.push(`/views/ChatScreen/${newChat._id}`);
    } finally {
      setScanned(false);
      setIsLoading(false);
    }
  };

  // --- Render Logic ---
  if (Platform.OS === "web") {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-center text-gray-700 p-5">
          QR Code scanning is not available on the web.
          <Text className="text-sm text-gray-500 mt-2">
            (Local database storage is also not available on web.)
          </Text>
        </Text>
      </View>
    );
  }

  if (!permission) {
    // Permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-800">
        <Text className="text-white text-center text-lg mb-4">
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-black">
      {
        (isFocused && !scanned) && (
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            style={StyleSheet.absoluteFillObject}
            className="absolute top-0 left-0 right-0 bottom-0"
          />
        )}

      <View className="flex-1 justify-center items-center bg-black/50">
        <Text className="text-white text-2xl font-bold mb-5">Scan QR Code</Text>
        <View className="w-64 h-64 border-4 border-dashed border-white rounded-xl" />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={StyleSheet.absoluteFillObject} className="justify-center items-center bg-black/70">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="text-white mt-4 text-lg">Processing QR Code...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScanQRScreen;
