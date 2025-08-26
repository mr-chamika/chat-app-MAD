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
import emailjs from '@emailjs/browser';
import { SQLiteDatabase, openDatabase } from 'react-native-sqlite-storage'

cssInterop(Image, { className: "style" });
cssInterop(ImageBackground, { className: "style" }); // Also need to interop ImageBackground

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

// Function to save a user to the local database
const saveUserToDB = async (db: SQLiteDatabase, user: User) => {
  const query = `INSERT OR REPLACE INTO users (_id, firstName, lastName, email, profilePic) VALUES (?, ?, ?, ?, ?)`;
  const params = [
    user._id,
    user.firstName,
    user.lastName,
    user.email,
    user.profilePic,
  ];
  await db.executeSql(query, params);
  console.log(`✅ User saved to DB: ${user.firstName} ${user.lastName}`);
};
const getDBConnection = async () => {
  try {
    const db = await openDatabase({ name: 'chatApp.db', location: 'default' });
    console.log("Database connection successful!");
    return db;
  } catch (error) {
    console.error("Failed to open database:", error);
    return null;
  }
};

const initDB = async (db: SQLiteDatabase) => {
  const userTableQuery = `CREATE TABLE IF NOT EXISTS users (
    _id TEXT PRIMARY KEY NOT NULL,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    profilePic TEXT
  );`;
  await db.executeSql(userTableQuery);
};

const Index = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generatedOtp, setGeneratedOtp] = useState({ code: '', timestamp: 0 });
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const initialize = async () => {
      const dbConnection = await getDBConnection();
      if (dbConnection) {
        await initDB(dbConnection);
        setDb(dbConnection);
      }
    };
    initialize();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required.";
    if (!lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email address is invalid.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 9000).toString();
    setGeneratedOtp({ code: newOtp, timestamp: Date.now() });
    const templateParams = {
      to_name: `${firstName} ${lastName}`,
      email: email,
      otp_code: newOtp,
    };

    try {
      await emailjs.send(
        'service_h0e38l2',
        'template_crl1nc9',
        templateParams,
        {
          publicKey: 'Xav8YamG7K9e8q0nD'
        }
      );
      alert(`A verification code has been sent to ${email}.`);
      setStep(1);
    } catch (error) {
      console.error('EmailJS Error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (validateForm()) {
      handleSendOtp();
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

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter a complete 6-digit OTP.");
      return;
    }

    setIsLoading(true);

    if (otpCode == generatedOtp.code) {
      try {
        const payloadToSend = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          profilePic: " ",
        };

        const res = await fetch('http://localhost:8080/user/signup', {
          method: 'POST',
          body: JSON.stringify(payloadToSend),
          headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status} - ${await res.text()}`);
        }

        const serverGeneratedId = await res.text();
        if (serverGeneratedId != "Signup failed") {

          console.log(serverGeneratedId)
          const userForSQLite: User = {
            _id: serverGeneratedId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            profilePic: " ",
          };

          if (db) {
            await saveUserToDB(db, userForSQLite);
            console.log("User saved to local DB with server ID:", serverGeneratedId);
          } else {
            console.error("Local database not available, user not saved.");
          }

          Alert.alert("Success!", "Your email has been verified and account created.");
          router.replace("/(tabs)");

        } else {

          alert('Account already exists')
          router.replace('/(auth)')

        }
      } catch (err: any) {
        console.log("Error during OTP verification/signup:", err.message);
        Alert.alert('Error', 'An error occurred during signup. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert("Error", "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    Alert.alert("OTP Sent", "A new OTP has been sent to your email");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    handleSendOtp();
  };

  return (
    <SafeAreaView className="flex-1">
      <ImageBackground source={bg} resizeMode="cover" className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              <View>
                <View className="items-center mb-10">
                  <Image source={logo} className="w-28 h-28" />
                  <Text className="text-4xl font-bold text-blue-900 text-center mb-4">
                    Welcome to ChatApp
                  </Text>
                </View>
                {isLoading ? (
                  <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#4895ef" />
                    <Text className="mt-4 text-lg text-gray-500">Sending OTP...</Text>
                  </View>
                ) : (
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
                    <TouchableOpacity
                      className={`py-4 rounded-xl items-center mt-4 shadow-lg bg-[#4895ef]`}
                      onPress={handleSignup}
                    >
                      <Text className="text-white font-bold text-lg">Sign Up</Text>
                    </TouchableOpacity>
                    <View className="flex-row justify-center mt-8">
                      <Text className="text-lg text-gray-600">Already have an account? </Text>
                      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                        <Text className="text-lg text-[#4895ef] font-bold">Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {step === 1 && (
              <View className="bg-white rounded-3xl p-8 shadow-lg">
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
                  className={`py-4 rounded-xl items-center mb-6 shadow-lg ${isLoading ? "bg-gray-400 opacity-50" : "bg-[#4895ef]"}`}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                >
                  <Text className="text-white font-bold text-lg">{isLoading ? "Verifying..." : "Verify OTP"}</Text>
                </TouchableOpacity>
                <View className="flex-row justify-center">
                  <Text className="text-lg text-gray-600">Didn't receive the code? </Text>
                  <TouchableOpacity onPress={handleResendOTP}>
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