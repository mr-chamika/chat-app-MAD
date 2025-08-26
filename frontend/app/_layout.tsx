import 'setimmediate';
import { Stack } from "expo-router";
import "./global.css";
import { StatusBar } from "react-native";
import { openDatabase, SQLiteDatabase } from 'react-native-sqlite-storage';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';

export default function RootLayout() {

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

  const checkIfUserExists = async (db: SQLiteDatabase) => {
    try {
      const [results] = await db.executeSql('SELECT * FROM users LIMIT 1', []);

      if (results.rows.length > 0) {

        return true;

      }
    } catch (error) {
      //console.error("Error checking for user:", error);
      return false;
    }
  };

  useEffect(() => {
    const check = async () => {

      const db = await getDBConnection()
      if (db) {

        const exists = await checkIfUserExists(db)
        if (exists) {
          console.log(exists)

          router.replace('/(tabs)')

        } else {

          router.replace('/(auth)')

        }
      }

    }
    check()
  }, [])


  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

      <Stack screenOptions={{ headerShown: false }}>

      </Stack>
    </>
  );
}
