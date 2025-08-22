import React, { useState, useRef } from "react";
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
  StyleSheet,
} from "react-native";
import { Image, ImageBackground } from 'expo-image';
import { cssInterop } from 'nativewind';
import { useRouter } from "expo-router";

cssInterop(Image, { className: "style" });

const bg = require("../../assets/images/bg3.png");
const logo = require("../../assets/images/logo.png");

const Index = () => {
  const router = useRouter();
  // --- State for both Signup and OTP steps ---
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({}); // For validation errors

  const inputRefs = useRef<(TextInput | null)[]>([]);

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
    return Object.keys(newErrors).length === 0; // Return true if form is valid
  };

  // --- Main handler for the "Sign Up" button ---
  const handleSignup = () => {
    if (validateForm()) {
      console.log("Form is valid. Simulating API call to send OTP...");
      setIsLoading(true);
      // **TODO**: Replace this with your actual API call to your backend.
      // Your backend should send an OTP to the user's email.
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      setStep(step + 1);
    }
  };

  // --- OTP Handlers ---
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (otpCode === "123456") {
      const user = { firstName, lastName, email };
      console.log("User created:", user);
      Alert.alert("Success!", "Your email has been verified successfully.");
      router.push("/(tabs)");
    } else {
      Alert.alert("Error", "Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setIsLoading(false);
  };

  const handleResendOTP = () => {
    Alert.alert("OTP Sent", "A new OTP has been sent to your email");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={bg} resizeMode="cover" style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              // --- Signup Form View ---
              <View>
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
              </View>
            )}

            {step === 1 && (
              // --- OTP Form View ---
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
});

export default Index;