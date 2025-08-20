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

const Login = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    console.log("Login Info:", { email });
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
              paddingTop: 60,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full px-6 py-8">
              <View className="items-center mb-16">
                <Image
                  source={require("../../../assets/images/logo.png")}
                  className="w-40 h-40"
                  resizeMode="contain"
                />
              </View>
              <View className="bg-white rounded-3xl p-8 shadow-lg">
                <Text className="text-4xl font-bold mb-8 text-center text-gray-800">
                  Welcome Back!
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
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Login;
