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
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const inputRefs = useRef<TextInput[]>([]);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter a complete 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      console.log("OTP Code:", otpCode);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      router.push("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    Alert.alert("OTP Sent", "A new OTP has been sent to your email");
    setOtp(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full px-6 py-8">
              <View className="bg-white rounded-3xl p-8 shadow-lg">
                <Text className="text-4xl font-bold mb-4 text-center text-gray-800">
                  Verify Email
                </Text>

                <Text className="text-lg text-gray-600 text-center mb-8 leading-6">
                  We've sent a 6-digit verification code to your email address
                </Text>

                <View className="flex-row justify-between mb-8">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref!)}
                      className={`w-12 h-14 border-2 rounded-xl text-center text-xl font-bold ${
                        digit
                          ? "border-[#4895ef] bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      } text-gray-800`}
                      value={digit}
                      onChangeText={(text) =>
                        handleOtpChange(text.slice(-1), index)
                      }
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  className={`py-4 rounded-xl items-center mb-6 shadow-lg ${
                    isLoading ? "bg-gray-400" : "bg-[#4895ef]"
                  }`}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-lg">
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center">
                  <Text className="text-lg text-gray-600">
                    Didn't receive the code?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResendOTP}
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg text-[#4895ef] font-bold">
                      Resend
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

export default OTPVerification;
