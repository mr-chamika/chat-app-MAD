import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { Alert, Platform } from 'react-native';

// --- Type Definitions ---
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string;
}

export interface Chat {
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
}

export interface Message {
  _id: string;
  text: string;
  chatId: string;
  senderId: string;
  status: "sent" | "delivered" | "read";
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
}

// --- Single Database Connection ---
let db: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {

  if (!db) {
    db = await SQLite.openDatabaseAsync('chatApp.db');

  }

  // We can be certain db is not null here, but checking is safer
  if (!db) {
    throw new Error("Database failed to initialize.");
  }

  return db;
};

// --- Centralized Database Functions ---

export const saveUserToDB = async (user: User): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    'INSERT OR REPLACE INTO users (_id, firstName, lastName, email, profilePic) VALUES (?, ?, ?, ?, ?)',
    user._id, user.firstName, user.lastName, user.email, user.profilePic
  );
};

export const saveChatsToDB = async (chats: Chat[]): Promise<void> => {
  const db = await getDB();
  for (const chat of chats) {
    await db.runAsync(
      `INSERT OR REPLACE INTO chats (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    );
  }
};

export const saveMessagesToDB = async (messages: Message[]): Promise<void> => {
  const db = await getDB();
  for (const msg of messages) {
    await db.runAsync(
      `INSERT OR REPLACE INTO messages (_id, chatId, text, senderId, status, isDeleted, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      msg._id,
      msg.chatId,
      msg.text,
      msg.senderId,
      msg.status,
      msg.isDeleted ? 1 : 0,
      msg.createdAt,
      msg.updatedAt,
      msg.isSynced ? 1 : 0
    );
  }
};

export const clearChatsInDB = async (): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM chats');
};

export const getMessagesByChatId = async (chatId: string): Promise<Message[]> => {
  if (Platform.OS === "web") {
    console.warn("Skipping getMessagesByChatId on web");
    return [];
  }
  try {
    const db = await getDB();
    const rows = await db.getAllAsync<Message>(
      "SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC",
      [chatId]
    );
    return rows.map(msg => ({ ...msg, isSynced: !!msg.isSynced, isDeleted: !!msg.isDeleted }));
  } catch (err) {
    //console.error("Failed to load messages:", err);
    alert("Please restart the app")

    return [];
  }
};
export const getUserById = async (userId: string) => {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM users WHERE _id = ?', userId);
  return rows.length > 0 ? rows[0] : null;
};

export const updateUserInDB = async (user: { _id: string; firstName: string; lastName: string; profilePic?: string }) => {

  const db = await getDB();
  await db.runAsync(
    "UPDATE users SET firstName = ?, lastName = ?, profilePic = ? WHERE _id = ?",
    user.firstName, user.lastName, user.profilePic ?? null, user._id
  );

  const rows = await db.getAllAsync('SELECT * FROM users WHERE _id = ?', user._id);
  if (rows.length > 0) {
    console.log("Updated user record:", rows[0]);
  } else {
    console.log("No user found with id:", user._id);
  }

};

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  if (Platform.OS === "web") {
    console.warn("Skipping getChatById on web");
    return null;
  }
  try {
    const db = await getDB();
    console.log(chatId, 'sat ayid')
    const rows = await db.getAllAsync('SELECT * FROM chats WHERE _id = ?', chatId);
    if (rows.length > 0) {
      const item: any = rows[0];
      return {
        ...item,
        participants: (() => {
          try {
            return JSON.parse(item.participants || "[]");
          } catch {
            return [];
          }
        })(),
        status: !!item.status,
        isOnline: !!item.isOnline,
        consent1: !!item.consent1,
        consent2: !!item.consent2,
        isSynced: !!item.isSynced,
      };
    }
    return null;
  } catch (err) {
    //console.error("Failed to load chat:", err);
    // alert("Please restart the app")

    return null;
  }
};

// export const Logout = async (): Promise<void> => {
//   const db = await getDB();
//   await db.runAsync('DELETE FROM users');
// };
export const Logout = async (): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM users');
  await AsyncStorage.removeItem("token")
  console.log('Logged out');
};

export const checkIfUserExistsInDB = async (): Promise<User | null> => {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM users LIMIT 1');
  if (rows.length > 0) {
    return rows[0] as User;
  }
  return null;
};

export const checkIfUserExists = async (db: SQLite.SQLiteDatabase) => {
  try {
    const user: any = await db.getFirstAsync('SELECT email FROM users LIMIT 1');
    if (user) {
      console.log("User found in SQLite:", user);
      return user;
    } else {
      console.log("No user found in SQLite.");
      return null;
    }
  } catch (error) {
    //console.error("Error checking for user:", error);
    //alert("Please restart the app")

    return null;
  }
};

export const updateUserEmailInDB = async (userId: string, newEmail: string): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    "UPDATE users SET email = ? WHERE _id = ?",
    newEmail, userId
  );
  // Optional: log the updated user
  const rows = await db.getAllAsync('SELECT * FROM users WHERE _id = ?', userId);
  if (rows.length > 0) {
    console.log("Updated user email:", rows[0]);
  } else {
    console.log("No user found with id:", userId);
  }
};

export const loadChatsFromDB = async (): Promise<Chat[]> => {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM chats');
  const chats: Chat[] = [];
  for (const itemRaw of rows) {
    const item: any = itemRaw;
    chats.push({
      ...item,
      participants: (() => {
        try {
          return JSON.parse(item.participants || "[]");
        } catch {
          return [];
        }
      })(),
      status: !!item.status,
      isOnline: !!item.isOnline,
      consent1: !!item.consent1,
      consent2: !!item.consent2,
      isSynced: !!item.isSynced,
    });
  }
  return chats;
};
export const deleteMessageById = async (messageId: string): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM messages WHERE _id = ?', messageId);
  console.log('duplicate deleted')
};
export const loadChatFromDB = async (chatId: string): Promise<Chat | null> => {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM chats WHERE _id = ?', chatId);
  if (rows.length > 0) {
    const item: any = rows[0];
    return {
      ...item,
      participants: (() => {
        try {
          return JSON.parse(item.participants || "[]");
        } catch {
          return [];
        }
      })(),
      status: !!item.status,
      isOnline: !!item.isOnline,
      consent1: !!item.consent1,
      consent2: !!item.consent2,
      isSynced: !!item.isSynced,
    };
  }
  return null;
};
export let dbReady = false;

export const initDB = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  const db = await getDB();
  if (!db) return;
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS users (_id TEXT PRIMARY KEY, firstName TEXT, lastName TEXT, email TEXT, profilePic TEXT);`
  );
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS chats (_id TEXT PRIMARY KEY, participants TEXT, lastMessageId TEXT, status INTEGER, isOnline INTEGER, userName TEXT, consent1 INTEGER, consent2 INTEGER, unreadCount INTEGER, createdAt TEXT, updatedAt TEXT, isSynced INTEGER DEFAULT 0);`
  );
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS messages (_id TEXT PRIMARY KEY, chatId TEXT NOT NULL, text TEXT, senderId TEXT, status TEXT, isDeleted INTEGER, createdAt TEXT, updatedAt TEXT, isSynced INTEGER DEFAULT 0);`
  );
  isInitialized = true;
  dbReady = true;
  console.log("Database tables initialized successfully!");
};

export const loadMessagesFromDB = async (chatId: string): Promise<Message[]> => {
  const db = await getDB();
  const rows = await db.getAllAsync('SELECT * FROM messages WHERE chatId = ?', chatId);
  const messages: Message[] = [];
  for (const msgRaw of rows) {
    const msg: any = msgRaw;
    messages.push({
      ...msg,
      isSynced: !!msg.isSynced,
      isDeleted: !!msg.isDeleted,
    });
  }
  return messages;
};