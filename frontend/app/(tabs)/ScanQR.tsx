import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Platform,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

import { useIsFocused } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { SQLiteDatabase } from "react-native-sqlite-storage";

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
  isSynced: boolean;
};

// Function to save a chat object to the local database
const saveChatToDB = async (db: SQLiteDatabase | null, chat: Chat) => {
  // Add a check to ensure db is not null
  if (!db) {
    console.error("❌ Database is not initialized. Cannot save chat.");
    return;
  }
  try {
    await db.executeSql(
      `INSERT OR REPLACE INTO chats
      (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt,isSynced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
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
        chat.isSynced ? 1 : 0,
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
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId = "2"; // TODO: Replace with actual logged-in user's ID

  const syncChatsToServer = async () => {
    if (!db) return; // This check is important
    try {
      const [results] = await db.executeSql(
        "SELECT * FROM chats WHERE isSynced = 0",
        []
      );
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
              updatedAt: chat.updatedAt,
            }),
          });

          if (res.ok) {
            const newServerId = await res.text(); // Gt new ID from backend response

            // ✅ FIX: Update the local chat with the new server-generated ID and mark it as synced.
            await db.executeSql(
              "UPDATE chats SET _id = ?, isSynced = 1 WHERE _id = ?",
              [newServerId, chat._id]
            );

            console.log(
              `Synced chat: Old ID (${chat._id}) updated to New ID (${newServerId})`
            );
          } else {
            console.log(
              `Sync failed for chat ${chat._id}: Status ${res.status}`
            );
          }
        } catch (err) {
          console.error("Error fetching unsynced chats:", err);
        }
      }
    } catch (err) {
      // console.error("Error fetching unsynced chats:", err);
    }
  };

  // FIX: Added `db` to the dependency array.
  // This ensures the network listener always has the latest `db` object.
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && db) {
        syncChatsToServer();
      }
    });
    return () => unsubscribe();
  }, [db]);

  // FIX: Re-enabled and corrected the database initialization logic.
  // This now runs only on native platforms and inside a useEffect to prevent startup crashes.
  useEffect(() => {
    // Only run this on mobile, not on the web.
    if (Platform.OS !== "web") {
      const initDB = async () => {
        try {
          // Dynamically require the library here
          const sqlite = require("react-native-sqlite-storage");

          // Enable promises inside the async function
          sqlite.enablePromise(true);

          const dbConnection = await sqlite.openDatabase({
            name: "chatApp.db",
            location: "default",
          });

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
          console.log("✅ Database and chats table are ready.");
          setDb(dbConnection); // Set the database state
        } catch (err) {
          console.error("❌ DB initialization failed:", err);
        }
      };
      initDB();
    }
  }, []); // The empty array ensures this runs only once when the component mounts.

  useEffect(() => {
    if (isFocused) {
      setScanned(false);
      setIsLoading(false);
    }
  }, [isFocused]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned || isLoading) return;
    setScanned(true);
    setIsLoading(true);

    const newChat: Chat = {
      _id: data,
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
      isSynced: false,
    };

    try {
      const res = await fetch(
        `http://localhost:8080/chat/create?inviteTo=${data}&scan=${userId}`
      );

      if (res.ok) {
        const newServerId = await res.text();
        newChat._id = newServerId;
        newChat.isSynced = true;
        console.log("Chat created online with ID:", newChat._id);
      } else {
        console.log(
          `Server rejected scan: Status ${res.status}. Saving offline.`
        );
      }
      await saveChatToDB(db, newChat);
      router.push(`/views/ChatScreen/${newChat._id}`);
    } catch (err) {
      console.log("Network error, saving chat offline:", err);
      await saveChatToDB(db, newChat);
      router.push(`/views/ChatScreen/${newChat._id}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---
  if (Platform.OS === "web") {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-center text-gray-700 p-5">
          QR Code scanning is not available on the web.
        </Text>
      </View>
    );
  }

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const userId = "2"; //my id

  const isFocused = useIsFocused();

  const handleBarCodeScanned = async ({
    type,
    data,
  }: BarcodeScanningResult) => {
    try {
      setScanned(true);

      //const res = await fetch(`http://10.98.103.38:8080/chat/create?inviteTo=${data}&scan=${userId}`)
      const res = await fetch(
        `http://localhost:8080/chat/create?inviteTo=${data}&scan=${userId}`
      );

      if (res) {
        const datax = await res.text();

        if (datax) {
          console.log(`Scanned QR Code of type ${type} with data: ${data}`);
          router.push(`/views/ChatScreen/${datax}`);
          setScanned(false);
        } else {
          Alert.alert("QR Code Scanned!", `Data: ${datax}`, [
            { text: "Scan Again", onPress: () => setScanned(false) },
            {
              text: "Cancel",
              onPress: () => {
                setScanned(false);
                router.back();
              },
            },
          ]);
        }
      }
    } catch (err) {
      console.log("Error from creating a chat : ", err);
      Alert.alert("Check your backend connection", "", [
        { text: "Scan Again", onPress: () => setScanned(false) },
        {
          text: "Cancel",
          onPress: () => {
            setScanned(false);
            router.back();
          },
        },
      ]);
    }
  };

  if (!permission) {
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
      {isFocused && !scanned && (
        <CameraView
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View className="flex-1 justify-center items-center bg-black/50">
        <Text className="text-white text-2xl font-bold mb-5">Scan QR Code</Text>
        <View className="w-64 h-64 border-4 border-dashed border-white rounded-xl" />
        {isLoading && (
          <View
            style={StyleSheet.absoluteFillObject}
            className="justify-center items-center bg-black/70"
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="text-white mt-4 text-lg">
              Processing QR Code...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScanQRScreen;
