// app/_Layout.tsx
import { Tabs } from "expo-router";
import { Image, View, StatusBar } from "react-native";

const HomeA = require("../../assets/images/chat.png");

export default function _Layout() {

    return (

        <View className="flex-1 bg-[#F2F0EF]">
            <StatusBar barStyle="dark-content" backgroundColor="#F2F0EF" />


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
                {<Tabs.Screen
                    name="index"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <View
                                className={`p-2 rounded-full ${focused ? "bg-white" : "bg-transparent"
                                    }`}
                            >
                                <Image source={HomeA} />
                            </View>
                        ),
                    }}
                />}

            </Tabs>
        </View>
    );
}
