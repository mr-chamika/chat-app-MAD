import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Image,
  View,
  Text,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const HomeA = require("../../assets/images/chat.png");
const UserA = require("../../assets/images/user2.png");
const Car = require("../../assets/images/qrg.png");
const Locat = require("../../assets/images/qrscan.png");

export default function _Layout() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F2F0EF]">
      <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={-45}
      >
        <View
          className="flex-1"
          style={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          <Tabs
            screenOptions={{
              tabBarShowLabel: false,
              headerShown: false,
              tabBarStyle: {
                backgroundColor: "#4895ef",
                height: 65,
                paddingTop: 13,
                borderColor: "#4895ef",
              },
              tabBarItemStyle: {
                flex: 1,
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                height: 40,
              },
            }}
          >
            {
              <Tabs.Screen
                name="index"
                options={{
                  tabBarIcon: ({ focused }) => (
                    <View
                      className={`p-2 rounded-full ${
                        focused ? "bg-white" : "bg-transparent"
                      }`}
                    >
                      <Image source={HomeA} />
                    </View>
                  ),
                }}
              />
            }
            <Tabs.Screen
              name="GenerateQR"
              options={{
                tabBarIcon: ({ focused }) => (
                  <View
                    className={`p-2 rounded-full ${
                      focused ? "bg-white" : "bg-transparent"
                    }`}
                  >
                    <Image source={Car} />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="ScanQR"
              options={{
                tabBarIcon: ({ focused }) => (
                  <View
                    className={`p-2 rounded-full ${
                      focused ? "bg-white" : "bg-transparent"
                    }`}
                  >
                    <Image source={Locat} />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                tabBarIcon: ({ focused }) => (
                  <View
                    className={`p-2 rounded-full ${
                      focused ? "bg-white" : "bg-transparent"
                    }`}
                  >
                    <Image source={UserA} />
                  </View>
                ),
              }}
            />
          </Tabs>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
