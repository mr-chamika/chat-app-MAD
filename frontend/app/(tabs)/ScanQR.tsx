import React, { useState } from "react";
import { View, Text, Alert, Platform, Button, StyleSheet } from "react-native";

import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";

import { useIsFocused } from "@react-navigation/native";

const ScanQRScreen = () => {
  if (Platform.OS === "web") {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-xl text-center text-gray-700 p-5">
          QR Code scanning is not available on the web.
        </Text>
      </View>
    );
  }

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const isFocused = useIsFocused();

  const handleBarCodeScanned = ({ type, data }: BarcodeScanningResult) => {
    setScanned(true);
    console.log(`Scanned QR Code of type ${type} with data: ${data}`);
    Alert.alert("QR Code Scanned!", `Data: ${data}`, [
      { text: "Scan Again", onPress: () => setScanned(false) },
    ]);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-800">
        <Text className="text-white text-center text-lg mb-4">
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-black">
      {isFocused && !scanned && (
        <CameraView
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          style={StyleSheet.absoluteFillObject}
          className="absolute top-0 left-0 right-0 bottom-0"
        />
      )}
      <View className="flex-1 justify-center items-center bg-black/50">
        <Text className="text-white text-2xl font-bold mb-5">Scan QR Code</Text>
        <View className="w-64 h-64 border-4 border-dashed border-white rounded-xl" />
      </View>
    </View>
  );
};

export default ScanQRScreen;
