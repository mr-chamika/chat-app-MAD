import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image, ImageBackground } from 'expo-image';
import { cssInterop } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { saveUserToDB, User, dbReady } from '../../services/database'; // Adjust path if needed

cssInterop(Image, { className: "style" });

// Define the shape of the data decoded from the JWT token
interface Token {
  id: string;
  email: string;
  name: string;
  firstName?: string; // Optional, in case the token only has 'name'
  lastName?: string;  // Optional
}

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = async () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    try {
      const otpRes = await fetch("https://chatappbackend-production-e023.up.railway.app/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (otpRes.ok) {
        //Alert.alert("OTP Sent", "An OTP has been sent to your email!");
        setStep(1);
      } else {
        Alert.alert("Error", "Failed to send OTP. This email might not be registered.");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {

    if (!dbReady) {
      Alert.alert("Please wait", "Database is still loading. Try again in a moment.");
      setIsLoading(false);
      return;
    }

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP.");
      return;
    }
    setIsLoading(true);
    try {
      alert('begin')
      // Step 1: Verify the OTP is correct
      const verifyRes = await fetch(`https://chatappbackend-production-e023.up.railway.app/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const verifyText = await verifyRes.text();
      alert('res' + verifyText)
      if (!verifyRes.ok || !verifyText.includes("successfully")) {
        throw new Error(verifyText || "Invalid OTP ❌");

      } else {


        // Step 2: OTP is valid, now perform the actual login to get user data and token
        const loginRes = await fetch('https://chatappbackend-production-e023.up.railway.app/user/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!loginRes.ok) {
          throw new Error("Login failed after OTP verification.");
        }

        const data = await loginRes.json();
        if (!data || !data.token) {
          throw new Error("Could not retrieve session token.");
        } else {



          // Step 3: Decode the token to get user details
          const decodedToken = jwtDecode<Token>(data.token);
          const userToSave: User = {
            _id: decodedToken.id,
            firstName: decodedToken.firstName || decodedToken.name.split(" ")[0],
            lastName: decodedToken.lastName || decodedToken.name.split(" ")[1] || '',
            email: decodedToken.email,
            profilePic: "" // Add profile pic if available in token
          };

          // Step 4: Save user to the local SQLite database using the queued function
          await saveUserToDB(userToSave);

          // Step 5: Save the token to AsyncStorage
          await AsyncStorage.setItem('token', data.token);

          // Step 6: Finally, navigate to the main app
          //Alert.alert("Success!", "You have been logged in successfully.");
          router.replace("/(tabs)");

        }
      }
    } catch (err: any) {
      console.error("Verify OTP or Login error:", err);
      Alert.alert("Error changed", "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await fetch("https://chatappbackend-production-e023.up.railway.app/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      // Alert.alert("OTP Sent", "A new OTP has been sent to your email");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      Alert.alert("Error", "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent: { key } }: { nativeEvent: { key: string } }, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View className={` ${Platform.OS === 'web' ? 'h-screen overflow-auto' : 'flex-1'}`}>
      <SafeAreaView className="h-full">
        <View className="h-full bg-[#ffffff]">
          <ImageBackground
            source={require("../../assets/images/bg3.png")}
            className="w-full h-screen"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="h-full justify-center"
            >
              {step === 0 && (
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
                      placeholderTextColor="#9CA3AF"
                      autoComplete="email"
                    />
                    <TouchableOpacity
                      className="bg-[#4895ef] py-4 rounded-xl items-center mt-2 shadow-lg active:scale-95"
                      onPress={handleSendOtp}
                      disabled={isLoading}
                    >
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Login</Text>}
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
              )}

              {step === 1 && (
                <View className="justify-center px-5">
                  <View className="bg-white rounded-3xl p-8 shadow-lg ">
                    <Text className="text-4xl font-bold mb-4 text-center text-gray-800">
                      Verify Email
                    </Text>
                    <Text className="text-lg text-gray-600 text-center mb-8 leading-6">
                      We've sent a 6-digit code to {email}
                    </Text>
                    <View className="flex-row justify-between mb-8">
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => { if (ref) inputRefs.current[index] = ref }}
                          className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${digit ? "border-[#4895ef] bg-blue-50" : "border-gray-200 bg-gray-50"} text-gray-800`}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text.slice(-1), index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          keyboardType="numeric"
                          maxLength={1}
                          selectTextOnFocus
                          autoFocus={index === 0}
                        />
                      ))}
                    </View>
                    <TouchableOpacity
                      className={`py-4 rounded-xl items-center mb-6 shadow-lg ${isLoading ? "bg-gray-400" : "bg-[#4895ef]"}`}
                      onPress={handleVerifyOtp}
                      disabled={isLoading}
                    >
                      {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Verify & Login</Text>}
                    </TouchableOpacity>
                    <View className="flex-row justify-center">
                      <Text className="text-lg text-gray-600">Didn't receive the code? </Text>
                      <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                        <Text className="text-lg text-[#4895ef] font-bold">Resend</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </KeyboardAvoidingView>
          </ImageBackground>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default Login;