import React, { useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

const Icon = ({ name, style }: { name: string; style?: any }) => (
  <Text style={[{ fontSize: 22, width: 25 }, style]}>{name}</Text>
);

const MyProfileScreen = () => {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const myProfile = {
    name: "Maya",
    avatarUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704a",
    email: "maya.dev@example.com",

    qrCodeData: JSON.stringify({ userId: "maya_dev_123", name: "Maya" }),
  };

  const validateEmail = () => {
    let error = "";
    if (!newEmail.trim()) {
      error = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(newEmail)) {
      error = "Email address is invalid.";
    }
    setEmailError(error);
    return !error;
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showOtp && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOtp, resendTimer]);

  const handleGetOtp = () => {
    if (!validateEmail()) {
      Alert.alert("Invalid Email", emailError);
      return;
    }
    Alert.alert("OTP Sent", `OTP sent to ${newEmail}`);
    setShowOtp(true);
    setResendTimer(30);
  };

  const handleResendOtp = () => {
    Alert.alert("OTP Sent", `OTP resent to ${newEmail}`);
    setOtp("");
    setResendTimer(30);
  };

  const handleVerifyOtp = () => {
    setIsVerifying(true);
    setOtpError("");
    setTimeout(() => {
      setIsVerifying(false);
      if (otp === "123456") {
        Alert.alert("Success", "Email changed successfully!");
        setShowOtp(false);
        setOtp("");
        setNewEmail("");
        setOtpError("");
        // You can update myProfile.email here if needed
      } else {
        setOtpError("Invalid OTP. Try again.");
      }
    }, 800);
  };

  const ProfileOption = ({
    icon,
    label,
    value,
    onPress,
    showArrow = true,
  }: {
    icon: string;
    label: string;
    value?: string;
    onPress?: () => void;
    showArrow?: boolean;
  }) => {
    const Wrapper: any = onPress ? TouchableOpacity : View;
    return (
      <Wrapper
        className="flex-row items-center py-4"
        {...(onPress
          ? { onPress, accessbilityRole: "button", activeOpacity: 0.7 }
          : {})}
      >
        <Icon name={icon} style={{ color: "#4B5563" }} />
        <Text className="flex-1 text-base text-gray-800 ml-4">{label}</Text>
        {value && <Text className="text-base text-gray-500 mr-2">{value}</Text>}
        {showArrow && !!onPress && (
          <Icon name="›" style={{ color: "#9CA3AF", fontSize: 20 }} />
        )}
      </Wrapper>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="flex-row items-center p-4 bg-gray-50">
            <Text className="flex-1 text-center text-xl font-bold text-gray-800 mr-8">
              Profile
            </Text>
          </View>

          <View className="items-center p-6">
            <Image
              source={{ uri: myProfile.avatarUrl }}
              className="w-28 h-28 rounded-full border-4 border-white shadow-md"
            />
            <Text className="text-3xl font-bold text-gray-800 mt-4">
              {myProfile.name}
            </Text>
          </View>

          <View className="mx-4 mt-4">
            <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
              Account
            </Text>
            <View className="bg-white rounded-xl shadow-sm px-4">
              <ProfileOption
                icon="👤"
                label="Edit Profile"
                onPress={() =>
                  router.push({
                    pathname: "/views/editProfile/[id]",
                    params: { id: "maya_dev_123" },
                  })
                }
              />
            </View>
          </View>

          <View className="mx-4 mt-4">
            <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
              Change Email
            </Text>
            <View className="bg-white rounded-xl shadow-sm px-4">
              <ProfileOption
                icon="📧"
                label="Email"
                value={myProfile.email}
                showArrow={false}
              />
              <View className="border-t border-gray-100" />
              <TextInput
                className="h-12 border border-gray-200 rounded-xl mb-4 px-4 text-base bg-gray-50 text-gray-800"
                placeholder="Enter new email"
                value={newEmail}
                onChangeText={setNewEmail}
                autoComplete="email"
                textContentType="emailAddress"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
              />
              {emailError ? (
                <Text className="text-red-500 mb-2">{emailError}</Text>
              ) : null}
              <TouchableOpacity
                className="bg-[#4895ef] py-3 rounded-xl items-center mb-4"
                onPress={handleGetOtp}
              >
                <Text className="text-white font-bold text-base">Get OTP</Text>
              </TouchableOpacity>
              {showOtp && (
                <View className="mb-4">
                  <Text className="text-base text-gray-700 mb-2">
                    Enter OTP
                  </Text>
                  <TextInput
                    className="h-12 border border-gray-200 rounded-xl px-4 text-base bg-gray-50 text-gray-800 mb-2"
                    placeholder="XXXXXX"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholderTextColor="#9CA3AF"
                  />
                  {otpError ? (
                    <Text className="text-red-500 mb-2 text-center">
                      {otpError}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    className={`bg-green-600 py-3 rounded-xl items-center ${
                      isVerifying ? "opacity-50" : ""
                    }`}
                    onPress={handleVerifyOtp}
                    disabled={isVerifying}
                  >
                    <Text className="text-white font-bold text-base">
                      {isVerifying ? "Verifying..." : "Verify"}
                    </Text>
                  </TouchableOpacity>
                  {resendTimer > 0 ? (
                    <Text className="text-gray-500 text-center mt-2">
                      Resend OTP in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      className="mt-2"
                    >
                      <Text className="text-[#4895ef] font-bold text-center">
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          <View className="p-4 mt-8 mb-4">
            <TouchableOpacity
              className="bg-red-500/10 py-3 rounded-full items-center"
              onPress={() => router.replace("/(auth)")}
            >
              <Text className="text-red-500 font-bold text-base">Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MyProfileScreen;
