import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

import { Image, ImageBackground } from 'expo-image'
import { cssInterop } from 'nativewind'
cssInterop(Image, { className: "style" });


const Login = () => {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    console.log("Login Info:", { email });
    router.push("/(auth)/otp");
  };

  return (
    <View className={`${Platform.OS === 'web' ? 'h-screen overflow-auto' : 'flex-1'}`}>

      <SafeAreaView className="h-full" edges={["top", "bottom"]}>
        <View className="h-full bg-[#ffffff]">

          <ImageBackground
            source={require("../../assets/images/bg3.png")}
            className="w-full h-screen"

          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >

              <View className="w-full px-6 py-8">
                <View className="items-center mb-16">
                  <Image
                    source={require("../../assets/images/logo.png")}
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
                      onPress={() => router.push("/(auth)")}
                      activeOpacity={0.7}
                    >
                      <Text className="text-lg text-[#4895ef] font-bold">
                        Sign Up
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

            </KeyboardAvoidingView>
          </ImageBackground>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Login;
