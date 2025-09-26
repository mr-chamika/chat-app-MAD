import React, { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

import {
  View,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === "android") {
    setTimeout(() => Alert.alert(title, message), 100);
  } else {
    Alert.alert(title, message);
  }
};

const EditProfile = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  // Seed with empty/default; in a real app, load existing values by id
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setFirstName("");
      setLastName("");
      setAvatarUri(null);
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await fetch(`https://backend-production-e712.up.railway.app/user/get?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        const [first, ...lastArr] = (data.name || "").split(" ");
        setFirstName(first || "");
        setLastName(lastArr.join(" ") || "");
        setAvatarUri(data.profilePic || null);
      } catch (err) {
        showAlert("Error", "Could not load user data.");
      }
    };
    if (id && isConnected) fetchUser();
  }, [id, isConnected]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission needed", "Please allow photo library access.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true, // Not supported in expo-image-picker, so use FileSystem below
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const assetUri = result.assets[0].uri;
        // Convert image to base64
        const base64 = await FileSystem.readAsStringAsync(assetUri, { encoding: FileSystem.EncodingType.Base64 });
        setAvatarUri(`data:image/jpeg;base64,${base64}`);
      }
    } catch (err) {
      showAlert("Image Error", "Could not select image.");
      console.error(err);
    }
  };

  const onSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showAlert("Missing info", "Please enter first and last name.");
      return;
    }
    try {
      const res = await fetch("https://backend-production-e712.up.railway.app/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          firstName,
          lastName,
          avatarUri,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      showAlert("Success", "Profile updated!");
      router.back();
    } catch (err) {
      showAlert("Error", "Could not update profile.");
      console.error(err);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-start",
            paddingVertical: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!isConnected ? (
            <View className="items-center mt-20">
              <Text className="text-red-500 text-lg font-bold">
                Connect to the internet to edit your profile.
              </Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center p-4 bg-gray-50">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                  <Text style={{ fontSize: 22 }}>‹</Text>
                </TouchableOpacity>
                <Text className="flex-1 text-center text-xl font-bold text-gray-800 mr-8">
                  Edit Profile
                </Text>
              </View>

              <View className="items-center mt-4">
                <Image
                  source={
                    avatarUri
                      ? { uri: avatarUri }
                      : require("../../../assets/images/user2.png")
                  }
                  className="w-28 h-28 rounded-full border-4 border-white shadow-md p-20"
                />
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    className="bg-[#4895ef] px-4 py-2 rounded-full"
                    onPress={pickImage}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white font-semibold">Edit Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mx-6 mt-8 bg-white rounded-2xl p-5 shadow-sm">
                <Text className="text-sm font-semibold text-gray-500 mb-2">
                  First Name
                </Text>
                <TextInput
                  className="h-12 border border-gray-200 rounded-xl mb-4 px-4 text-base bg-gray-50 text-gray-800"
                  placeholder="Enter first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoComplete="given-name"
                  textContentType="givenName"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="next"
                />
                <Text className="text-sm font-semibold text-gray-500 mb-2">
                  Last Name
                </Text>
                <TextInput
                  className="h-12 border border-gray-200 rounded-xl mb-2 px-4 text-base bg-gray-50 text-gray-800"
                  placeholder="Enter last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoComplete="family-name"
                  textContentType="familyName"
                  placeholderTextColor="#9CA3AF"
                  returnKeyType="done"
                />
              </View>

              <View className="px-6 mt-6 mb-10">
                <TouchableOpacity
                  className="bg-[#4895ef] py-4 rounded-xl items-center shadow"
                  onPress={onSave}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-base">
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfile;
