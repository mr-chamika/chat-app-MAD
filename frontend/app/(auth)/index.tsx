import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image, ImageBackground } from 'expo-image';
import { cssInterop } from 'nativewind';
import { useRouter } from "expo-router";
import * as SQLite from 'expo-sqlite'; // Replaced with expo-sqlite
import { getDB } from "@/services/database";

cssInterop(Image, { className: "style" });
cssInterop(ImageBackground, { className: "style" });

const bg = require("../../assets/images/bg3.png");
const logo = require("../../assets/images/logo.png");

// Define a User type for better type safety
export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePic: string;
};

// Function to save a user to the local database using expo-sqlite
const saveUserToDB = async (db: SQLite.SQLiteDatabase, user: User) => {
  const query = `INSERT OR REPLACE INTO users (_id, firstName, lastName, email, profilePic) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    user._id,
    user.firstName,
    user.lastName,
    user.email,
    user.profilePic,
  ];
  await db.runAsync(query, params); // Use runAsync for INSERT/UPDATE
  console.log(`✅ User saved to DB: ${user.firstName} ${user.lastName}`);
};

const Index = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState(false)

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const validateEmail = (email: string) => {
    if (!email.trim()) return "Email is required.";
    // Simple regex for email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email address is invalid.";
    return "";
  };
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        const payloadToSend = {
          firstName,
          lastName,
          email,
          profilePic: " ",
        };
        const res = await fetch('https://backend-production-e712.up.railway.app/user/signup', {
          method: 'POST',
          body: JSON.stringify(payloadToSend),
          headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
          const serverGeneratedId = await res.text();
          console.log('Signup response:', serverGeneratedId);

          if (serverGeneratedId !== "Signup failed") {

            // setStep(1);
            router.push('/login')
            setError(false)

          } else {
            //alert(serverGeneratedId); // Show specific error like "User already exists"
            setError(true)
          }
        } else {
          alert('Signup request failed');
        }
      } catch (err) {
        console.error("Signup or OTP error:", err);
        alert("Error during signup or sending OTP");
      } finally {
        setIsLoading(false);
      }
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

  const handleVerifyOtp = async () => {

    const db = await getDB()

    const otpCode = otp.join("");
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`https://backend-production-e712.up.railway.app/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode })
      });
      const text = await response.text();
      console.log("Verify OTP response:", text);

      if (response.ok && text.includes("successfully")) {
        if (db) {
          const userForSQLite: User = {
            _id: email, // Placeholder ID, you might get a real one from the server
            firstName,
            lastName,
            email,
            profilePic: " ",
          };
          await saveUserToDB(db, userForSQLite);
          console.log("User saved to local DB after OTP verification");
        }
        Alert.alert("Success!", "Your email has been verified and account created.");
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", text || "Invalid OTP ❌");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      Alert.alert("Error", "Network error while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const otpRes = await fetch("https://backend-production-e712.up.railway.app/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      console.log("Resend OTP API response:", await otpRes.text());
      //Alert.alert("OTP Sent", "A new OTP has been sent to your email");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      Alert.alert("Error", "Error resending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of your JSX remains the same
  return (
    <SafeAreaView className="flex-1">
      <ImageBackground source={bg} resizeMode="cover" className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              <View>
                {/* Signup Form */}
                <View className="items-center mb-10">
                  <Image source={logo} className="w-28 h-28" />
                  <Text className="text-4xl font-bold text-blue-900 text-center mb-4">
                    Welcome to ChatApp
                  </Text>
                </View>

                <View className="bg-white rounded-3xl p-8 shadow-lg">
                  <TextInput
                    className="h-14 border border-gray-200 rounded-xl px-4 text-lg bg-gray-50 text-gray-800"
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#9CA3AF"
                    autoComplete="given-name"
                  />
                  <Text className={`text-red-400 mb-5 mt-1 h-5 ${errors.firstName ? 'opacity-100' : 'opacity-0'}`}>
                    * {errors.firstName || ''}
                  </Text>
                  <TextInput
                    className="h-14 border border-gray-200 rounded-xl px-4 text-lg bg-gray-50 text-gray-800"
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholderTextColor="#9CA3AF"
                    autoComplete="family-name"
                  />
                  <Text className={`text-red-400 mb-5 mt-1 h-5 ${errors.lastName ? 'opacity-100' : 'opacity-0'}`}>
                    * {errors.lastName || ''}
                  </Text>
                  <TextInput
                    className="h-14 border border-gray-200 rounded-xl px-4 text-lg bg-gray-50 text-gray-800"
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                    autoComplete="email"
                  />
                  <Text className={`text-red-400 mb-5 mt-1 h-5 ${errors.email ? 'opacity-100' : 'opacity-0'}`}>
                    * {errors.email || ''}
                  </Text>
                  <Text className={`text-red-400 mb-5 mt-1 h-5 ${error ? 'opacity-100' : 'opacity-0'}`}>
                    * Email already registered. Try login
                  </Text>
                  <TouchableOpacity
                    className={`py-4 rounded-xl items-center mt-4 shadow-lg bg-[#4895ef]`}
                    onPress={handleSignup}
                    disabled={isLoading}
                  >
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Sign Up</Text>}
                  </TouchableOpacity>
                  <View className="flex-row justify-center mt-8">
                    <Text className="text-lg text-gray-600">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                      <Text className="text-lg text-[#4895ef] font-bold">Login</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {step === 1 && (
              <View className="bg-white rounded-3xl p-8 shadow-lg">
                {/* OTP Form */}
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
                      ref={(ref) => { inputRefs.current[index] = ref }}
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
                  {isLoading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Verify OTP</Text>}
                </TouchableOpacity>
                <View className="flex-row justify-center">
                  <Text className="text-lg text-gray-600">Didn't receive the code? </Text>
                  <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                    <Text className="text-lg text-[#4895ef] font-bold">Resend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default Index;