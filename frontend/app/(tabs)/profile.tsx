import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useState, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Logout, updateUserEmailInDB } from '../../services/database'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

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
  const [profile, setProfile] = useState<{ name: string; email: string; avatar: string; userId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [x, setx] = useState("")


  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      let userId = null;
      if (token) {
        const decoded = jwtDecode<{ id: string }>(token);
        userId = decoded.id;
        const res = await fetch(`https://chatappbackend-production-e023.up.railway.app/user/get?id=${userId}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile({
          name: data.name,
          email: data.email,
          avatar: data.profilePic || "https://i.pravatar.cc/150?u=a042581f4e29026704a",
          userId: data._id,
        });
      }
    } catch (err) {
      setProfile(null);
      Alert.alert("Connect to the internet", "Data cannot be loaded from the database. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!isConnected) {
        setProfile(null);
        setLoading(false);
        return;
      }
      fetchProfile();
    }, [isConnected])
  );


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

  const handleSendOtp = async () => {
    if (!validateEmail()) {

      return;
    }
    setIsLoading(true);
    try {
      const otpRes = await fetch("https://chatappbackend-production-e023.up.railway.app/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail })
      });

      if (otpRes.ok) {
        setShowOtp(true);
        setResendTimer(30);
        setOtp("");
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Error", "Failed to send OTP. This email might not be registered.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await fetch("https://chatappbackend-production-e023.up.railway.app/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail })
      });
      setOtp("");
      inputRefs.current[0]?.focus();
      setResendTimer(30);
    } catch (err) {
      Alert.alert("Error", "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmail = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://chatappbackend-production-e023.up.railway.app/user/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile?.userId, x: profile?.email, email: newEmail })
      });
      const data = await res.text()

      if (res.ok) {

        console.log('data', data)
        if (data.toLowerCase().includes("success")) {

          handleSendOtp()
          setx("")

        } else {
          setEmailError("")
          setx(data)
          return;

        }

      } else {

        setEmailError("")
        setx(data)
        return;

      }

    } catch (err) {
      Alert.alert("Error", "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };


  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit OTP.");
      return;
    }
    setIsVerifying(true);
    setOtpError("");
    try {
      const verifyRes = await fetch(`https://chatappbackend-production-e023.up.railway.app/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, otp })
      });

      const verifyText = await verifyRes.text();
      if (!verifyRes.ok || !verifyText.includes("successfully")) {
        setOtpError(verifyText || "Invalid OTP ❌");
      }
      // Update email using /user/update
      const updateRes = await fetch("https://chatappbackend-production-e023.up.railway.app/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: profile?.userId,
          email: newEmail
        })
      });

      if (!updateRes.ok) {
        Alert.alert("Error", "Failed to update email.");
      } else {
        // Refetch profile to show new email
        await fetchProfile();
        if (profile) {
          await updateUserEmailInDB(profile.userId, newEmail);
        }
        setShowOtp(false);
        setOtp("");
        setNewEmail("");
        setOtpError("");
        setx("")
        await Logout();
        router.replace("/(auth)/login");

      }
    } catch (err) {
      setOtpError("Network error or invalid OTP.");
    } finally {
      setIsVerifying(false);
    }
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
          ? { onPress, accessibilityRole: "button", activeOpacity: 0.7 }
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
          {!loading && !profile && (
            <View className="items-center mt-10">
              <Text className="text-red-500 text-lg font-bold">
                Connect to the internet to load your profile.
              </Text>
            </View>
          )}
          <View className="flex-row items-center p-4 bg-gray-50">
            <Text className="flex-1 text-center text-xl font-bold text-gray-800 mr-8">
              Profile
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4895ef" style={{ marginTop: 40 }} />
          ) : profile && (
            <View className="items-center p-6">
              <Image
                source={profile.avatar && profile.avatar.trim() !== "" ? { uri: profile.avatar } : require("../../assets/images/user2.png")}
                className="w-28 h-28 rounded-full border-4 border-white shadow-md"
              />
              <Text className="text-3xl font-bold text-gray-800 mt-4">
                {profile.name}
              </Text>
              <Text className="text-base text-gray-600 mt-2">
                {profile.name
                  ? "@" +
                  profile.name
                    .split(" ")
                    .map(part => part && part.toLowerCase())
                    .filter(Boolean)
                    .join("")
                  : ""}
              </Text>
            </View>
          )}

          <View className="mx-4 mt-4">
            <Text className="text-sm font-semibold text-gray-500 px-4 mb-2">
              Account
            </Text>
            <View className="bg-white rounded-xl shadow-sm px-4">
              <ProfileOption
                icon="👤"
                label="Edit Profile"
                onPress={() => profile && router.push(`/views/editProfile/${profile.userId}`)}
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
                value={profile?.email}
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
              {x !== "" &&
                <Text className="text-red-500 mb-2">{x}</Text>

              }
              <TouchableOpacity
                className="bg-[#4895ef] py-3 rounded-xl items-center mb-4"
                onPress={checkEmail}
                disabled={isLoading}
              >
                <Text className="text-white font-bold text-base">
                  {isLoading ? "Sending OTP..." : "Get OTP"}
                </Text>
              </TouchableOpacity>
              {showOtp && (
                <View className="mb-4">
                  <Text className="text-base text-gray-700 mb-2">
                    Enter OTP
                  </Text>
                  <TextInput
                    ref={el => { inputRefs.current[0] = el; }}
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
                    className={`bg-green-600 py-3 rounded-xl items-center ${isVerifying ? "opacity-50" : ""
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
                      disabled={isLoading}
                    >
                      <Text className="text-[#4895ef] font-bold text-center">
                        {isLoading ? "Resending..." : "Resend OTP"}
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
              onPress={async () => {
                await Logout();
                router.replace("/(auth)/login");
              }}
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