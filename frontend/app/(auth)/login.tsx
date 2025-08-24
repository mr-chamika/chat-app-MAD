import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import emailjs from '@emailjs/browser'
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { Image, ImageBackground } from 'expo-image'
import { cssInterop } from 'nativewind'
cssInterop(Image, { className: "style" });
import { jwtDecode } from 'jwt-decode'

const Login = () => {
  // --- State for both Signup and OTP steps ---

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState({ code: '', timestamp: 0 });

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0)

  const handleLogin = async () => {

    console.log("Login Info:", { email });
    handleSendOtp();

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
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (otpCode === generatedOtp.code) {

      try {

        const res = await fetch('http://localhost:8080/user/login', {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ "email": email })

        });

        if (res.ok) {
          const data = await res.json()

          if (data && data.token) {

            console.log(jwtDecode(data.token))
            Alert.alert("Success!", "Your email has been verified successfully.");
            router.push("/(tabs)");

          } else {

            alert('Register First...')

          }

        }
      } catch (err) {

        alert(`Network error : ${err}`)

      }




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

  const handleSendOtp = async () => {
    setIsLoading(true);
    const newOtp = Math.floor(100000 + Math.random() * 9000).toString();
    setGeneratedOtp({ code: newOtp, timestamp: Date.now() });
    const templateParams = {
      to_name: email,
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
              className="h-full"
            >

              {step == 0 &&

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
              }


              {step === 1 && (
                // --- OTP Form View ---
                <View className="h-screen justify-center px-5">
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