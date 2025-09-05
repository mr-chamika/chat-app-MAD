import 'setimmediate';
import { router, Stack } from "expo-router";
import { Alert, StatusBar, Text, View } from "react-native";
import { useEffect, useState } from 'react';
import './global.css'
import { initDB, checkIfUserExists, getDB } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is the only function this file needs.

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  // This useEffect runs only once when the app starts,
  // ensuring the database is ready before any screens render.
  useEffect(() => {
    const setupDB = async () => {
      await initDB(); // ✅ Initi1alize DB tables before using them
      setDbReady(true); // <-- Use state to trigger re-render
      console.log('running intiDB')
    };
    setupDB();
  }, []);
  useEffect(() => {
    if (dbReady) {
      alert('db running');
    }
    // Remove the else part!
  }, [dbReady]);
  // const getDBConnection = async () => {

  //   try {

  //     const db = SQLite.openDatabaseSync('chatApp.db');

  //     console.log("Database connection successful!");

  //     return db;

  //   } catch (error) {

  //     console.error("Failed to open database:", error);

  //     return null;

  //   }

  // };

  useEffect(() => {
    if (!dbReady) return;

    const check = async () => {
      // Check for saved token first
      const token = await AsyncStorage.getItem('token');
      if (token) {
        router.push("/(tabs)");
        return;
      }

      const db = await getDB();
      if (!db) {
        console.error("DB not initialized");
        return [];
      }

      const exists = await checkIfUserExists(db);
      if (!exists || !exists.email) {
        router.replace('/(auth)');
        return;
      }

      try {
        const res = await fetch('https://chatappbackend-production-e023.up.railway.app/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: exists.email })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.token) {
            await AsyncStorage.setItem('token', data.token);
            Alert.alert("Success!", "Your email has been verified successfully.");
            router.push("/(tabs)");
          } else {
            alert('Register First...');
          }
        }
      } catch (err) {
        router.push('/(tabs)');
      }
    };

    check();
  }, [dbReady]);
  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading database...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0EF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />
      {/* This Stack simply renders your other screens */}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}