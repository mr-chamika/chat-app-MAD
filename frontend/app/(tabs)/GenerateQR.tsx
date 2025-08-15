import React from "react";
import { View, Text } from "react-native";
import QRCode from "react-native-qrcode-svg";

const GenerateQRScreen: React.FC = () => {
  const hardcodedSessionData = {
    session_id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    creator_user_name: "ChrisG",
    created_at: "1722172680000",
  };

  const connectionInfoString = JSON.stringify(hardcodedSessionData);

  return (
    <View className="flex-1 justify-center items-center bg-white p-5">
      <Text className="text-2xl font-bold text-center mb-4">Start a Chat</Text>
      <Text className="text-lg text-gray-600 text-center mb-8">
        Have the other person scan this QR code to connect.
      </Text>

      <QRCode
        value={connectionInfoString}
        size={250}
        backgroundColor="white"
        color="black"
      />
    </View>
  );
};

export default GenerateQRScreen;
