import React from "react";
import {
  View,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";

const Icon = ({ name, style }: { name: string; style?: any }) => (
  <Text style={[{ fontSize: 22, width: 25 }, style]}>{name}</Text>
);

const MyProfileScreen = () => {
  const router = useRouter();

  const myProfile = {
    name: "Maya",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704a",
    status: "React Native Developer | Building cool apps.",
    phone: "+1 (555) 123-4567",
    email: "maya.dev@example.com",

    qrCodeData: JSON.stringify({ userId: "maya_dev_123", name: "Maya" }),
  };

  const ProfileOption = ({
    icon,
    label,
    value,
    onPress,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} className="flex-row items-center py-4">
      <Icon name={icon} style={{ color: "#4B5563" }} />
      <Text className="flex-1 text-base text-gray-800 ml-4">{label}</Text>
      {value && <Text className="text-base text-gray-500 mr-2">{value}</Text>}
      <Icon name="›" style={{ color: "#9CA3AF", fontSize: 20 }} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center p-4 bg-gray-50">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Icon name="‹" style={{ color: "#374151", fontWeight: "bold" }} />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-bold text-gray-800 mr-8">
            Profile
          </Text>
        </View>

        <View className="items-center p-6">
          <Image
            source={{ uri: myProfile.avatarUrl }}
            className="w-28 h-28 rounded-full border-4 border-white shadow-md"
          />
          <Text className="text-3xl font-bold text-gray-800 mt-4">
            {myProfile.name}
          </Text>
          <Text className="text-base text-gray-500 mt-1 text-center px-4">
            {myProfile.status}
          </Text>
        </View>

        <View className="mx-4 mt-4">
          <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
            ACCOUNT
          </Text>
          <View className="bg-white rounded-xl shadow-sm px-4">
            <ProfileOption icon="👤" label="Edit Profile" />
            <View className="border-t border-gray-100" />
            <ProfileOption icon="📞" label="Phone" value={myProfile.phone} />
            <View className="border-t border-gray-100" />
            <ProfileOption icon="📧" label="Email" value={myProfile.email} />
          </View>
        </View>

        <View className="mx-4 mt-6">
          <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
            SETTINGS
          </Text>
          <View className="bg-white rounded-xl shadow-sm px-4">
            <ProfileOption icon="🔔" label="Notifications" />
            <View className="border-t border-gray-100" />
            <ProfileOption icon="🔒" label="Privacy" />
            <View className="border-t border-gray-100" />
            <ProfileOption icon="🎨" label="Appearance" />
          </View>
        </View>

        <View className="p-4 mt-8 mb-4">
          <TouchableOpacity className="bg-red-500/10 py-3 rounded-full items-center">
            <Text className="text-red-500 font-bold text-base">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyProfileScreen;
