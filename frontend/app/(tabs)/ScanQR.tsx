// import React, { useState, useEffect } from "react";
// import { View, Text, Platform, Button, StyleSheet, ActivityIndicator, Alert } from "react-native";
// import { useRouter } from "expo-router";
// import {
//   CameraView,
//   useCameraPermissions,
//   BarcodeScanningResult,
// } from "expo-camera";
// import { useIsFocused } from "@react-navigation/native";
// import NetInfo from "@react-native-community/netinfo";
// import * as SQLite from 'expo-sqlite'; // Updated import
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { jwtDecode } from "jwt-decode";

// // --- Type Definitions ---
// interface Token {
//   id: string;
//   email: string;
//   name: string
// }
// export type Chat = {
//   _id: string;
//   participants: string[];
//   lastMessageId: string | null;
//   status: boolean;
//   isOnline: boolean;
//   userName: string;
//   consent1: boolean;
//   consent2: boolean;
//   unreadCount: number;
//   createdAt: string;
//   updatedAt: string;
//   isSynced: boolean;
// };

// // --- Local Database Function using expo-sqlite ---
// const saveChatToDB = async (db: SQLite.SQLiteDatabase, chat: Chat) => {
//   if (!db) {
//     console.error("❌ Database is not initialized. Cannot save chat.");
//     return;
//   }
//   try {
//     // Use the modern `runAsync` method
//     await db.runAsync(
//       `INSERT OR REPLACE INTO chats (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         chat._id,
//         JSON.stringify(chat.participants),
//         chat.lastMessageId,
//         chat.status ? 1 : 0,
//         chat.isOnline ? 1 : 0,
//         chat.userName,
//         chat.consent1 ? 1 : 0,
//         chat.consent2 ? 1 : 0,
//         chat.unreadCount,
//         chat.createdAt,
//         chat.updatedAt,
//         chat.isSynced ? 1 : 0
//       ]
//     );
//     console.log("✅ Chat inserted:", chat._id);
//   } catch (err) {
//     console.error("❌ Error inserting chat:", err);
//   }
// };

// // --- Main Component ---
// const ScanQRScreen = () => {
//   const router = useRouter();
//   const isFocused = useIsFocused();
//   const [permission, requestPermission] = useCameraPermissions();
//   const [scanned, setScanned] = useState(false);
//   const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [userId, setUserId] = useState<string>("");
//   const [myName, setMyName] = useState<string>("");

//   useEffect(() => {
//     const getToken = async () => {
//       const token = await AsyncStorage.getItem("token");
//       if (token) {
//         const x = jwtDecode<Token>(token);
//         setUserId(x.id);
//         setMyName(x.name);
//         console.log('my name ', x.name)
//       }
//     };
//     getToken();
//   }, []);

//   const syncChatsToServer = async () => {
//     if (!db) return;
//     try {
//       // Use the modern `getAllAsync` method
//       const unsyncedChats = await db.getAllAsync<any>("SELECT * FROM chats WHERE isSynced = 0");
//       for (const chat of unsyncedChats) {
//         console.log('user name', chat.userName)
//         try {
//           const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/creates`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               _id: chat._id, participants: JSON.parse(chat.participants),
//               status: !!chat.status, isOnline: !!chat.isOnline,
//               userName: chat.userName, consent1: !!chat.consent1,
//               consent2: !!chat.consent2, unreadCount: chat.unreadCount,
//               createdAt: chat.createdAt, updatedAt: chat.updatedAt,
//             }),
//           });

//           if (res.ok) {
//             const newServerId = await res.text();
//             // Use the modern `runAsync` method for the update
//             await db.runAsync(
//               "UPDATE chats SET _id = ?, isSynced = 1 WHERE _id = ?",
//               [newServerId, chat._id]
//             );
//             console.log(`Synced chat: Old ID (${chat._id}) -> New ID (${newServerId})`);
//           } else {
//             console.log(`Sync failed for chat ${chat._id}: Status ${res.status}`);
//           }
//         } catch (err) {
//           console.log(`Sync error for chat ${chat._id}:`, err);
//         }
//       }
//     } catch (err) {
//       console.error("Error fetching unsynced chats:", err);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       if (state.isConnected && db) {
//         syncChatsToServer();
//       }
//     });
//     return () => unsubscribe();
//   }, [db]);

//   useEffect(() => {
//     if (Platform.OS !== 'web') {
//       const initDB = () => { // No longer needs to be async
//         try {
//           // Use the modern synchronous open method
//           const dbConnection = SQLite.openDatabaseSync("chatApp.db");

//           // Use execAsync to run table creation
//           dbConnection.execAsync(`
//             CREATE TABLE IF NOT EXISTS chats (
//               _id TEXT PRIMARY KEY NOT NULL, participants TEXT, lastMessageId TEXT,
//               status INTEGER, isOnline INTEGER, userName TEXT, consent1 INTEGER,
//               consent2 INTEGER, unreadCount INTEGER, createdAt TEXT,
//               updatedAt TEXT, isSynced INTEGER DEFAULT 0
//             );
//           `);
//           console.log("✅ Database and chats table are ready.");
//           setDb(dbConnection);
//         } catch (err) {
//           console.error("❌ DB initialization failed:", err);
//         }
//       };
//       initDB();
//     }
//   }, []);

//   useEffect(() => {
//     if (isFocused) {
//       setScanned(false);
//       setIsLoading(false);
//     }
//   }, [isFocused]);

//   const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
//     // ... This function's logic remains exactly the same
//     if (!userId) {
//       Alert.alert("Error", "User ID not loaded. Please try again.");
//       setIsLoading(false);
//       setScanned(false);
//       return;
//     }
//     let parse;
//     try {
//       parse = JSON.parse(data);
//       console.log('this is parse', parse)
//     } catch (err) {
//       Alert.alert("Invalid QR Code", "The scanned QR code is not valid.");
//       setIsLoading(false);
//       setScanned(false);
//       return;
//     }

//     if (scanned || isLoading) return;
//     setScanned(true);
//     setIsLoading(true);

//     if (!db || !userId || !myName) {
//       Alert.alert("Error", "User data or database is not ready. Please try again in a moment.");
//       setIsLoading(false);
//       setScanned(false);
//       return;
//     }

//     let scannedUserName = parse.name;
//     if (!scannedUserName) {
//       console.warn('Scanned QR does not contain a name field:', parse);
//       scannedUserName = "Unknown";
//     }
//     const combinedUserNames = `${myName},${scannedUserName}`;

//     const newChat: Chat = {
//       _id: parse.id, participants: [userId, parse.id],
//       lastMessageId: null, status: true, isOnline: false,
//       userName: combinedUserNames, consent1: false, consent2: false,
//       unreadCount: 0, createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(), isSynced: false
//     };

//     try {
//       const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/create?inviteTo=${parse.id}&scan=${userId}&userName=${combinedUserNames}`);

//       if (res.ok) {
//         const newServerId = await res.text();
//         newChat._id = newServerId;
//         newChat.isSynced = true;
//       } else {
//         console.log(`Server rejected scan: Status ${res.status}. Saving offline.`);
//       }
//       await saveChatToDB(db, newChat); // Pass the db object from state

//       router.push(`/views/ChatScreen/${newChat._id}`);
//     } catch (err) {
//       console.log("Network error, saving chat offline:", err);
//       await saveChatToDB(db, newChat); // Pass the db object from state
//       router.push(`/views/ChatScreen/${newChat._id}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- Render Logic (Unchanged) ---
//   if (Platform.OS === "web") {
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-100">
//         <Text className="text-xl text-center text-gray-700 p-5">
//           QR Code scanning is not available on the web.
//         </Text>
//       </View>
//     );
//   }

//   if (!permission) {
//     return <View />;
//   }

//   if (!permission.granted) {
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-800">
//         <Text className="text-white text-center text-lg mb-4">
//           We need your permission to show the camera
//         </Text>
//         <Button onPress={requestPermission} title="Grant Permission" />
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 justify-center items-center bg-black">
//       {isFocused && !scanned && (
//         <CameraView
//           onBarcodeScanned={handleBarCodeScanned}
//           barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
//           style={StyleSheet.absoluteFillObject}
//         />
//       )}
//       <View className="flex-1 justify-center items-center bg-black/50">
//         <Text className="text-white text-2xl font-bold mb-5">Scan QR Code{ }</Text>
//         <View className="w-64 h-64 border-4 border-dashed border-white rounded-xl" />
//         {isLoading && (
//           <View style={StyleSheet.absoluteFillObject} className="justify-center items-center bg-black/70">
//             <ActivityIndicator size="large" color="#FFFFFF" />
//             <Text className="text-white mt-4 text-lg">Processing QR Code...</Text>
//           </View>
//         )}
//       </View>
//     </View>
//   );
// };

// export default ScanQRScreen;

import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Platform, Button, StyleSheet,
  ActivityIndicator, Alert, Animated
} from "react-native";
import { useRouter } from "expo-router";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import * as SQLite from 'expo-sqlite';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

// --- Type Definitions ---
interface Token {
  id: string;
  email: string;
  name: string
}
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

// --- Local Database Function using expo-sqlite ---
const saveChatToDB = async (db: SQLite.SQLiteDatabase, chat: Chat) => {
  if (!db) {
    console.error("❌ Database is not initialized. Cannot save chat.");
    return;
  }
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO chats (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        chat.isSynced ? 1 : 0
      ]
    );
    console.log("✅ Chat inserted:", chat._id);
  } catch (err) {
    //console.error("❌ Error inserting chat:", err);
  }
};

// --- Main Component ---
const ScanQRScreen = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [myName, setMyName] = useState<string>("");

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const initDB = () => { // No longer needs to be async
        try {
          // Use the modern synchronous open method
          const dbConnection = SQLite.openDatabaseSync("chatApp.db");

          // Use execAsync to run table creation
          dbConnection.execAsync(`
            CREATE TABLE IF NOT EXISTS chats (
              _id TEXT PRIMARY KEY NOT NULL, participants TEXT, lastMessageId TEXT,
              status INTEGER, isOnline INTEGER, userName TEXT, consent1 INTEGER,
              consent2 INTEGER, unreadCount INTEGER, createdAt TEXT,
              updatedAt TEXT, isSynced INTEGER DEFAULT 0
            );
          `);
          console.log("✅ Database and chats table are ready.");
          setDb(dbConnection);
        } catch (err) {
          console.error("❌ DB initialization failed:", err);
        }
      };
      initDB();
    }
  }, []);


  useEffect(() => {
    const getToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const x = jwtDecode<Token>(token);
        setUserId(x.id);
        setMyName(x.name);
        console.log('my name ', x.name)
      }
    };
    getToken();
  }, []);

  const syncChatsToServer = async () => {
    if (!db) return;
    try {
      // Use the modern `getAllAsync` method
      const unsyncedChats = await db.getAllAsync<any>("SELECT * FROM chats WHERE isSynced = 0");
      for (const chat of unsyncedChats) {
        console.log('user name', chat.userName)
        try {
          const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/creates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              _id: chat._id, participants: JSON.parse(chat.participants),
              status: !!chat.status, isOnline: !!chat.isOnline,
              userName: chat.userName, consent1: !!chat.consent1,
              consent2: !!chat.consent2, unreadCount: chat.unreadCount,
              createdAt: chat.createdAt, updatedAt: chat.updatedAt,
            }),
          });

          if (res.ok) {
            const newServerId = await res.text();
            // Use the modern `runAsync` method for the update
            await db.runAsync(
              "UPDATE chats SET _id = ?, isSynced = 1 WHERE _id = ?",
              [newServerId, chat._id]
            );
            console.log(`Synced chat: Old ID (${chat._id}) -> New ID (${newServerId})`);
          } else {
            console.log(`Sync failed for chat ${chat._id}: Status ${res.status}`);
          }
        } catch (err) {
          console.log(`Sync error for chat ${chat._id}:`, err);
        }
      }
    } catch (err) {
      //console.error("Error fetching unsynced chats:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && db) {
        syncChatsToServer();
      }
    });
    return () => unsubscribe();
  }, [db]);


  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    // ... This function's logic remains exactly the same
    if (!userId) {
      Alert.alert("Error", "User ID not loaded. Please try again.");
      setIsLoading(false);
      setScanned(false);
      return;
    }
    let parse;
    try {
      parse = JSON.parse(data);
      console.log('this is parse', parse)
    } catch (err) {
      Alert.alert("Invalid QR Code", "The scanned QR code is not valid.");
      setIsLoading(false);
      setScanned(false);
      return;
    }

    if (scanned || isLoading) return;
    setScanned(true);
    setIsLoading(true);

    if (!db || !userId || !myName) {
      Alert.alert("Error", "User data or database is not ready. Please try again in a moment.");
      setIsLoading(false);
      setScanned(false);
      return;
    }

    let scannedUserName = parse.name;
    if (!scannedUserName) {
      console.warn('Scanned QR does not contain a name field:', parse);
      scannedUserName = "Unknown";
    }
    const combinedUserNames = `${myName},${scannedUserName}`;

    const newChat: Chat = {
      _id: parse.id, participants: [userId, parse.id],
      lastMessageId: null, status: true, isOnline: false,
      userName: combinedUserNames, consent1: false, consent2: false,
      unreadCount: 0, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), isSynced: false
    };

    try {
      const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/chat/create?inviteTo=${parse.id}&scan=${userId}&userName=${combinedUserNames}`);

      if (res.ok) {
        const newServerId = await res.text();
        newChat._id = newServerId;
        newChat.isSynced = true;
      } else {
        console.log(`Server rejected scan: Status ${res.status}. Saving offline.`);
      }
      await saveChatToDB(db, newChat); /// Pass the db object from state
      setScanned(false); // <--- reset
      router.push(`/views/ChatScreen/${newChat._id}`);
    } catch (err) {
      console.log("Network error, saving chat offline:", err);
      await saveChatToDB(db, newChat); // Pass the db object from state
      router.push(`/views/ChatScreen/${newChat._id}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Scanner Line Animation ---
  const lineAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(lineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  const translateY = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 230],
  });

  // --- Render ---
  if (Platform.OS === "web") {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-center text-gray-700 p-5">
          QR Code scanning is not available on the web.
        </Text>
      </View>
    );
  }

  if (!permission) return <View />;
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
    <View className="flex-1 bg-black">
      {isFocused && !scanned && (
        <CameraView
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      {/* Overlay */}
      <View className="flex-1 justify-center items-center bg-black/60">
        <Text className="text-white text-2xl font-bold mb-5">
          Scan QR Code
        </Text>

        {/* Transparent Scan Window */}
        <View className="w-[250px] h-[250px] border-2 border-green-400 rounded-xl relative overflow-hidden">
          {/* Animated Scanning Line */}
          <Animated.View
            style={{
              transform: [{ translateY }],
            }}
            className="absolute top-0 w-full h-[3px] bg-red-500"
          />
        </View>

        {/* Loading Overlay */}
        {isLoading && (
          <View className="absolute inset-0 justify-center items-center bg-black/20">
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text className="text-white mt-4 text-lg">Processing QR Code...</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default ScanQRScreen;
