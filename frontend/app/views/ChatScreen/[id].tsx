import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaFrame } from "react-native-safe-area-context";

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
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];

  consent1: boolean;
  consent2: boolean;
  lastMessageId: string;
  participants: string[];
};

const router = useRouter();

/* const mockMessages: Chat[] = [
  {
    id: "1",
    userName: "Jane Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    lastMessage: "Looks cool! Can you send me the files?",
    timestamp: "10:45 AM",
    unreadCount: 2,
    isOnline: true,
    messages: [
      { id: "m1-1", text: "Hey, I saw the new designs.", sender: "user" },
      { id: "m1-2", text: "Oh great! What do you think?", sender: "other" },
      {
        id: "m1-3",
        text: "Looks cool! Can you send me the files?",
        sender: "user",
      },
    ],
  },
  {
    id: "2",
    userName: "John Smith",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026705d",
    lastMessage: "See you tomorrow at the meeting!",
    timestamp: "9:30 AM",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m2-1", text: "Are we still on for tomorrow?", sender: "user" },
      {
        id: "m2-2",
        text: "Yes, absolutely. See you tomorrow at the meeting!",
        sender: "other",
      },
    ],
  },
  {
    id: "3",
    userName: "Alex Ray",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026706d",
    lastMessage: "Okay, sounds good. I will check it out.",
    timestamp: "Yesterday",
    unreadCount: 5,
    isOnline: true,
    messages: [
      { id: "m3-1", text: "Here is the link.", sender: "other" },
      {
        id: "m3-2",
        text: "Okay, sounds good. I will check it out.",
        sender: "user",
      },
    ],
  },
  {
    id: "4",
    userName: "Sarah Conner",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026707d",
    lastMessage: "Haha, that is hilarious!",
    timestamp: "Yesterday",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m4-1", text: "Did you see that video I sent?", sender: "user" },
      { id: "m4-2", text: "Haha, that is hilarious!", sender: "other" },
    ],
  },
  {
    id: "5",
    userName: "Mike Ross",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026708d",
    lastMessage: "Did you get the documents I sent?",
    timestamp: "Sun",
    unreadCount: 1,
    isOnline: true,
    messages: [
      { id: "m5-1", text: "Did you get the documents I sent?", sender: "user" },
    ],
  },
  {
    id: "6",
    userName: "Emily Carter",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026709d",
    lastMessage: "Let's catch up later this week.",
    timestamp: "Sun",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m6-1", text: "Hey! Long time no see.", sender: "user" },
      { id: "m6-2", text: "I know! We should catch up.", sender: "other" },
      { id: "m6-3", text: "Let's catch up later this week.", sender: "user" },
    ],
  },
  {
    id: "7",
    userName: "Tech Group",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026710d",
    lastMessage: "Alex: Don't forget the deadline!",
    timestamp: "Fri",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m7-1", text: "Alex: Don't forget the deadline!", sender: "other" },
    ],
  },
  {
    id: "8",
    userName: "David Chen",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026711d",
    lastMessage: "Thanks for your help!",
    timestamp: "Fri",
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: "m8-1", text: "The issue is resolved now.", sender: "other" },
      { id: "m8-2", text: "Thanks for your help!", sender: "user" },
    ],
  },
  {
    id: "9",
    userName: "Olivia Martinez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026712d",
    lastMessage: "I have a question about the project.",
    timestamp: "Thu",
    unreadCount: 3,
    isOnline: false,
    messages: [
      {
        id: "m9-1",
        text: "I have a question about the project.",
        sender: "user",
      },
    ],
  },
  {
    id: "10",
    userName: "Ben Taylor",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026713d",
    lastMessage: "Can you review my code?",
    timestamp: "Thu",
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: "m10-1", text: "Can you review my code?", sender: "user" },
    ],
  },
  {
    id: "11",
    userName: "Chloe Wilson",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026714d",
    lastMessage: "Happy Birthday! 🎉",
    timestamp: "Wed",
    unreadCount: 0,
    isOnline: true,
    messages: [{ id: "m11-1", text: "Happy Birthday! 🎉", sender: "other" }],
  },
  {
    id: "12",
    userName: "Daniel Brown",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026715d",
    lastMessage: "Are you free for a quick call?",
    timestamp: "Wed",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m12-1", text: "Are you free for a quick call?", sender: "user" },
    ],
  },
  {
    id: "13",
    userName: "Sophia Garcia",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026716d",
    lastMessage: "No problem!",
    timestamp: "Tue",
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: "m13-1", text: "Thank you!", sender: "user" },
      { id: "m13-2", text: "No problem!", sender: "other" },
    ],
  },
  {
    id: "14",
    userName: "Marketing Team",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026717d",
    lastMessage: "Jane: New campaign brief is up.",
    timestamp: "Tue",
    unreadCount: 1,
    isOnline: false,
    messages: [
      { id: "m14-1", text: "Jane: New campaign brief is up.", sender: "other" },
    ],
  },
  {
    id: "15",
    userName: "James Johnson",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026718d",
    lastMessage: "You too!",
    timestamp: "Mon",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m15-1", text: "Have a great weekend!", sender: "user" },
      { id: "m15-2", text: "You too!", sender: "other" },
    ],
  },
  {
    id: "16",
    userName: "Isabella Rodriguez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026719d",
    lastMessage: "Typing...",
    timestamp: "Mon",
    unreadCount: 0,
    isOnline: true,
    messages: [{ id: "m16-1", text: "Hey, are you there?", sender: "user" }],
  },
  {
    id: "17",
    userName: "William Lee",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026720d",
    lastMessage: "Let me know what you think.",
    timestamp: "7/20/2025",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m17-1", text: "I've sent the proposal.", sender: "other" },
      { id: "m17-2", text: "Let me know what you think.", sender: "other" },
    ],
  },
  {
    id: "18",
    userName: "Mia Hernandez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026721d",
    lastMessage: "Sent the invoice.",
    timestamp: "7/19/2025",
    unreadCount: 0,
    isOnline: false,
    messages: [{ id: "m18-1", text: "Sent the invoice.", sender: "other" }],
  },
  {
    id: "19",
    userName: "Ethan Gonzalez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026722d",
    lastMessage: "Perfect, thank you!",
    timestamp: "7/18/2025",
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: "m19-1", text: "Here are the final files.", sender: "other" },
      { id: "m19-2", text: "Perfect, thank you!", sender: "user" },
    ],
  },
  {
    id: "20",
    userName: "Ava Perez",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026723d",
    lastMessage: "See you there.",
    timestamp: "7/17/2025",
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: "m20-1", text: "The event starts at 7.", sender: "other" },
      { id: "m20-2", text: "See you there.", sender: "user" },
    ],
  },
];
 */
const ChatHeader = ({ user }: { user: Chat }) => {
  return (
    <View className="flex-row items-center p-2 bg-white border-b border-gray-200 shadow-sm">
      <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
        <Text className="text-2xl font-bold text-blue-600">‹</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity
        className="relative"
        onPress={() => router.push(`/views/userProfile/${id}`)}
      >
        <Image
          source={{ uri: user.avatarUrl }}
          className="w-11 h-11 rounded-full"
        />
        {user.isOnline && (
          <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </TouchableOpacity> */}

      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base text-gray-800">
          user {user.participants[0]}
        </Text>
        {user.isOnline && (
          <Text className="text-sm text-green-600">Online</Text>
        )}
      </View>

      <TouchableOpacity className="p-2">
        <Text className="text-2xl font-bold text-gray-600">⋮</Text>
      </TouchableOpacity>
    </View>
  );
};

const MessageBubble = ({
  text,
  sender,
}: {
  text: string;
  sender: string;
}) => {
  const isUser = sender === '6874baf06bb6ef13073a1236';
  return (
    <View
      className={`p-3 rounded-2xl max-w-[80%] mb-2.5 ${isUser ? "bg-blue-500 self-end" : "bg-white self-start"
        }`}
    >
      <Text className={`${isUser ? "text-white" : "text-black"}`}>{text}</Text>
    </View>
  );
};

const ChatScreen = () => {

  const [chat, setChat] = useState<Chat | null>(null)
  const [message, setMessage] = useState('')
  const [messageList, setMessageList] = useState<Message[]>([])

  const { id } = useLocalSearchParams();

  useEffect(() => {
    const getChat = async () => {
      try {

        //const res = await fetch(`http://10.98.103.38:8080/chat/get?id=${id}`)
        const res = await fetch(`http://localhost:8080/chat/get?id=${id}`)

        if (res) {
          const data = await res.json();

          //console.log(data)
          setChat(data);
        } else {
          setChat(null);
        }
      } catch (err) {
        console.log("Error from get chat : ", err);
      }
    };

    getChat()
    getChats()


  }, [id])

  const getChats = async () => {

    try {

      const res = await fetch(`http://localhost:8080/message/get?id=${id}`)

      if (res.ok) {

        const data = await res.json()

        if (data.length > 0) {

          setMessageList(data.reverse())

        } else {

          setMessageList([]);

        }

      }

    } catch (error) {

      console.log('Error from chatList loading useForcusEffect : ', error)
      setMessageList([]);

    }

  }

  //const chat = mockMessages.find((c) => c.id === id);

  if (!chat) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-lg text-red-500">Chat not found.</Text>
      </SafeAreaView>
    );
  }

  const createMessage = async () => {

    try {

      const newMessage = {

        chatId: id,
        text: message,
        senderId: '6874baf06bb6ef13073a1236'

      }

      const res = await fetch(`http://localhost:8080/message/create`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)

      })

      if (res.ok) {

        const data = await res.json()

        setMessage('');
        setMessageList(prevMessages => [data, ...prevMessages])

      }

    } catch (err) {

      console.log('Error from message create : ', err);
    }

  }

  return (
    <SafeAreaView className="flex-1 bg-gray-200">
      <ChatHeader user={chat} />

      <View className="flex-1 p-3">
        {messageList.length > 0 ? <FlatList
          data={messageList}
          renderItem={({ item }) => (
            <MessageBubble text={item.text} sender={item.senderId} />
          )}
          keyExtractor={(item) => item._id}
          className="flex-1 overflow-hidden"
          inverted
        />

          :
          <View className=" w-full h-full items-center justify-center">
            <Text>No messages yet</Text>
          </View>
        }
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
          className={` rounded-full p-3 ${message.trim() === '' ? 'bg-blue-300' : 'bg-blue-600'}`}
          disabled={message.trim() === ''}
        >

          <Text className="text-white text-base">Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
