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
} from "react-native";
import { useRouter } from "expo-router";

const Login = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    // Handle login logic here
    console.log("Login Info:", { email });
    router.push("/views/otp");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2F0EF]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full px-6 py-8">
            <View className="bg-white rounded-3xl p-8 shadow-lg">
              <Text className="text-4xl font-bold mb-8 text-center text-gray-800">
                Login
              </Text>

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
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-lg">Login</Text>
              </TouchableOpacity>

              {/* Signup Link */}
              <View className="flex-row justify-center mt-8">
                <Text className="text-lg text-gray-600">
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/views/signup")}
                  activeOpacity={0.7}
                >
                  <Text className="text-lg text-[#4895ef] font-bold">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
