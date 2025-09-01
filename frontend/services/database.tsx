import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

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
export const db =
  Platform.OS === "web"
    ? {
      runAsync: async () => { },
      execAsync: async () => { },
      getFirstAsync: async () => null,
      getAllAsync: async () => [],
      withTransactionAsync: async (cb: any) => cb(),
    } as unknown as SQLite.SQLiteDatabase
    : SQLite.openDatabaseSync("chatApp.db");

// --- Write Queue to Prevent "Database is Locked" Errors ---
let writePromise: Promise<void> = Promise.resolve();
let isInitialized = false; // <-- FIX 1: Add a flag to run init only once


const enqueueDbWrite = (writeOperation: () => Promise<void>): Promise<void> => {
  writePromise = writePromise.then(async () => {
    try {
      await writeOperation();
    } catch (error) {
      //console.error("A queued database write operation failed:", error);
    }
  });
  return writePromise;
};

// --- Centralized Database Functions ---

export const initDB = async (): Promise<void> => {
  // No longer needs to be in the queue
  if (isInitialized) {
    return;
  }
  await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
            _id TEXT PRIMARY KEY, 
            firstName TEXT, 
            lastName TEXT, 
            email TEXT, 
            profilePic TEXT
        );
      CREATE TABLE IF NOT EXISTS chats (
            _id TEXT PRIMARY KEY, 
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
        CREATE TABLE IF NOT EXISTS messages (
            _id TEXT PRIMARY KEY, 
            chatId TEXT NOT NULL, 
            text TEXT, 
            senderId TEXT, 
            status TEXT, 
            isDeleted INTEGER, 
            createdAt TEXT, 
            updatedAt TEXT, 
            isSynced INTEGER DEFAULT 0
        );
  `);
  isInitialized = true;
  console.log("Database tables initialized successfully!");
};
// --- WRITE Operations (Queued) ---
if (Platform.OS === "web") {
  console.warn("SQLite not supported on web, skipping DB actions.");
} else {
  initDB();
}

export const saveUserToDB = (user: User): Promise<void> => {
  return enqueueDbWrite(async () => {
    await db.runAsync(
      'INSERT OR REPLACE INTO users (_id, firstName, lastName, email, profilePic) VALUES (?, ?, ?, ?, ?)',
      [user._id, user.firstName, user.lastName, user.email, user.profilePic]
    );
  });
};

export const saveChatsToDB = (chats: Chat[]): Promise<void> => {
  return enqueueDbWrite(async () => {
    await db.withTransactionAsync(async () => {
      for (const chat of chats) {
        await db.runAsync(
          `INSERT OR REPLACE INTO chats (_id, participants, lastMessageId, status, isOnline, userName, consent1, consent2, unreadCount, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [chat._id, JSON.stringify(chat.participants), chat.lastMessageId, chat.status ? 1 : 0, chat.isOnline ? 1 : 0, chat.userName, chat.consent1 ? 1 : 0, chat.consent2 ? 1 : 0, chat.unreadCount, chat.createdAt, chat.updatedAt, chat.isSynced ? 1 : 0]
        );
      }
    });
  });
};

export const saveMessagesToDB = (messages: Message[]): Promise<void> => {
  return enqueueDbWrite(async () => {
    await db.withTransactionAsync(async () => {
      for (const msg of messages) {
        await db.runAsync(
          `INSERT OR REPLACE INTO messages (_id, chatId, text, senderId, status, isDeleted, createdAt, updatedAt, isSynced) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [msg._id, msg.chatId, msg.text, msg.senderId, msg.status, msg.isDeleted ? 1 : 0, msg.createdAt, msg.updatedAt, msg.isSynced ? 1 : 0]
        );
      }
    });
  });
};

export const clearChatsInDB = (): Promise<void> => {
  return enqueueDbWrite(async () => {
    await db.execAsync('DELETE FROM chats');
  });
};


// --- READ Operations (Direct) ---


export const checkIfUserExists = async (db: SQLite.SQLiteDatabase) => {
  try {
    // FIX: getFirstAsync directly returns the user object or null.
    const user: any = await db.getFirstAsync('SELECT email FROM users LIMIT 1');

    if (user) {
      console.log("User found in SQLite:", user);
      return user; // The user object was found and returned.
    } else {
      console.log("No user found in SQLite.");
      return null; // getFirstAsync returned null, so no user was found.
    }
  } catch (error) {
    console.error("Error checking for user:", error);
    return null;
  }
};

export const checkIfUserExistsInDB = async (): Promise<User | null> => {
  try {
    const user = await db.getFirstAsync<User>('SELECT email FROM users LIMIT 1');
    return user ?? null;
  } catch (error) {
    //console.error("Failed to check for user:", error);
    return null;
  }
};

export const loadChatsFromDB = async (): Promise<Chat[]> => {
  try {
    const results = await db.getAllAsync<any>('SELECT * FROM chats ORDER BY createdAt DESC');
    return results.map(item => ({
      ...item,
      isOnline: !!item.isOnline, consent1: !!item.consent1,
      consent2: !!item.consent2, status: !!item.status,
      participants: JSON.parse(item.participants || '[]'),
      isSynced: !!item.isSynced,
    }));
  } catch (error) {
    //console.error("Failed to load chats from DB", error);
    return [];
  }
};

export const loadChatFromDB = async (chatId: string): Promise<Chat | null> => {
  try {
    const item = await db.getFirstAsync<any>('SELECT * FROM chats WHERE _id = ?', [chatId]);
    if (item) {
      return {
        ...item,
        participants: JSON.parse(item.participants || '[]'),
        status: !!item.status, isOnline: !!item.isOnline,
        consent1: !!item.consent1, consent2: !!item.consent2,
        isSynced: !!item.isSynced,
      };
    }
    return null;
  } catch (error) {
    //console.error("Failed to load chat from DB", error);
    return null;
  }
};

export const loadMessagesFromDB = async (chatId: string): Promise<Message[]> => {
  try {
    return await db.getAllAsync<Message>('SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt DESC', [chatId]);
  } catch (error) {
    //console.error("Failed to load messages from DB", error);
    return [];
  }
};
