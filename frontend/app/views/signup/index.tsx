import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSignup = () => {
    console.log("Signup Info:", { firstName, lastName, email });
    router.push("/views/otp");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F0EF]">
      <ImageBackground
        source={require("../../../assets/images/bg3.png")}
        className="flex-1"
        resizeMode="cover"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-start",
              paddingTop: 30,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full px-6 py-8">
              <View className="items-center mb-12">
                <Image
                  source={require("../../../assets/images/logo.png")}
                  className="w-40 h-40"
                  resizeMode="contain"
                />
                <Text className="text-4xl font-bold text-blue-900 text-center mb-4">
                  Welcome to ChatApp
                </Text>
                <Text className="text-lg text-blue-700 text-center px-8 leading-6">
                  Connect instantly with QR codes. Simple, secure, and fast
                  messaging.
                </Text>
              </View>
              <View className="bg-white rounded-3xl p-8 shadow-lg">
                <TextInput
                  className="h-14 border border-gray-200 rounded-xl mb-5 px-4 text-lg bg-gray-50 text-gray-800"
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor="#9CA3AF"
                  autoComplete="given-name"
                  textContentType="givenName"
                />

                <TextInput
                  className="h-14 border border-gray-200 rounded-xl mb-5 px-4 text-lg bg-gray-50 text-gray-800"
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor="#9CA3AF"
                  autoComplete="family-name"
                  textContentType="familyName"
                />

                <TextInput
                  className="h-14 border border-gray-200 rounded-xl mb-6 px-4 text-lg bg-gray-50 text-gray-800"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                  autoComplete="email"
                  textContentType="emailAddress"
                />

                <TouchableOpacity
                  className="bg-[#4895ef] py-4 rounded-xl items-center mt-2 shadow-lg active:scale-95"
                  onPress={handleSignup}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-lg">Sign Up</Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-8">
                  <Text className="text-lg text-gray-600">
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/views/login")}
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg text-[#4895ef] font-bold">
                      Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Signup;
