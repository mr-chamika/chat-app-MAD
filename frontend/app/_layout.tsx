import 'setimmediate';
import { router, Stack } from "expo-router";
import { Alert, StatusBar, View } from "react-native";
import { useEffect } from 'react';
import * as SQLite from 'expo-sqlite';
import './global.css'
import { initDB, checkIfUserExists } from '../services/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This is the only function this file needs.

export default function RootLayout() {
  // This useEffect runs only once when the app starts,
  // ensuring the database is ready before any screens render.
  useEffect(() => {
    initDB();
  }, []);

  const getDBConnection = async () => {

    try {

      const db = SQLite.openDatabaseSync('chatApp.db');

      console.log("Database connection successful!");

      return db;

    } catch (error) {

      console.error("Failed to open database:", error);

      return null;

    }

  };

  useEffect(() => {

    const check = async () => {



      const db = await getDBConnection()

      if (db) {

        //const exists = await checkIfUserExistsInDB()
        const exists = await checkIfUserExists(db)

        if (exists) {

          try {



            const res = await fetch('https://chatappbackend-production-e023.up.railway.app/user/login', {



              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({ email: exists.email })



            });



            if (res.ok) {

              const data = await res.json()



              if (data && data.token) {



                await AsyncStorage.setItem('token', data.token)

                Alert.alert("Success!", "Your email has been verified successfully.");

                router.push("/(tabs)");



              } else {



                alert('Register First...')



              }



            }

          } catch (err) {



            alert(`Network error : ${err}`)



          }



        } else {



          router.replace('/(auth)')



        }

      }



    }

    check()

  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0EF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />
      {/* This Stack simply renders your other screens */}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}