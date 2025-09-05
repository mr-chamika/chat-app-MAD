import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface Token {
  id: string;
  email: string;
  name: string;
}

const GenerateQRScreen: React.FC = () => {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const x = jwtDecode<Token>(token);
          const userData = {
            username: x.email,
            id: x.id,
            name: x.name
          };
          setQrValue(JSON.stringify(userData));
        } else {
          setError("No token found. Please login first.");
        }
      } catch (err: any) {
        setError("Error decoding token: " + (err?.message || String(err)));
      }
    };
    getToken();
  }, []);

  useEffect(() => {
    if (qrValue !== null) {
      console.log("qrValue updated:", qrValue);
    }
    if (error) console.log("Error:", error);
  }, [qrValue, error]);

  return (
    <View className="flex-1 justify-center items-center bg-white p-5">
      <Text className="text-2xl font-bold text-center mb-4">Start a Chat</Text>
      <Text className="text-lg text-gray-600 text-center mb-8">
        Let the other person scan this QR code to connect.

      </Text>

      {error ? (
        <Text style={{ color: "red", marginBottom: 16, textAlign: "center" }}>{error}</Text>
      ) : qrValue ? (
        <QRCode value={qrValue} size={250} backgroundColor="white" color="black" />
      ) : (
        <ActivityIndicator size="large" color="#000000" />
      )}
    </View>
  );
};

export default GenerateQRScreen;
