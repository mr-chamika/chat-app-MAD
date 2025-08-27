import { Stack } from "expo-router";
import "./global.css";
import { StatusBar } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />

      <Stack screenOptions={{ headerShown: false }}>


      </Stack>
    </>
  );
}
