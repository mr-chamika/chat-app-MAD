import React from "react";
import {
  View,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const Icon = ({ name, style }: { name: string; style?: any }) => (
  <Text style={[{ fontSize: 22 }, style]}>{name}</Text>
);

const ProfileScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const user = {
    name: "Jane Doe",
    firstName: "Jane",
    lastName: "Doe",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    coverPhotoUrl:
      "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?q=80&w=2070&auto=format&fit=crop",
    bio: "Digital artist & coffee enthusiast. Exploring the world one pixel at a time.",
    email: "jane.doe@example.com",
    isOnline: true,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="relative">
          <Image source={{ uri: user.coverPhotoUrl }} className="w-full h-48" />
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-12 left-4 bg-black/50 p-2 rounded-full"
          >
            <Icon name="‹" style={{ color: "white", fontWeight: "bold" }} />
          </TouchableOpacity>
        </View>

        <View className="items-center -mt-16">
          <View className="relative">
            <Image
              source={{ uri: user.avatarUrl }}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
            {user.isOnline && (
              <View className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
            )}
          </View>
          <Text className="text-3xl font-bold text-gray-800 mt-4">
            {user.name}
          </Text>
          <Text className="text-base text-gray-500 mt-1">
            {user.firstName} {user.lastName}
          </Text>
        </View>

        <View className="px-6 mt-2">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            About
          </Text>
          <Text className="text-base text-gray-600 leading-6">{user.bio}</Text>
        </View>

        <View className="px-6 mt-8">
          <View className="bg-white p-4 rounded-lg shadow-sm">
            <View className="flex-row items-center mb-4">
              <Icon name="📧" style={{ fontSize: 20 }} />
              <Text className="text-base text-gray-700 ml-4">{user.email}</Text>
            </View>
          </View>
        </View>

        <View className="px-6 mt-4 mb-8">
          <View className="bg-white p-4 rounded-lg shadow-sm">
            <TouchableOpacity className="flex-row items-center">
              <Icon name="🚫" style={{ fontSize: 20 }} />
              <Text className="text-base text-red-500 ml-4">
                Block {user.name}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
