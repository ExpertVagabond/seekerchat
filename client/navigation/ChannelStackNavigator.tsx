import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChannelBrowserScreen from "@/screens/ChannelBrowserScreen";
import ChatRoomScreen from "@/screens/ChatRoomScreen";
import type { ChannelStackParamList } from "./types";
import { colors, fontSize } from "@/constants/theme";

const Stack = createNativeStackNavigator<ChannelStackParamList>();

export default function ChannelStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: fontSize.lg, fontWeight: "600" },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen
        name="ChannelBrowser"
        component={ChannelBrowserScreen}
        options={{ title: "Channels" }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({ route }) => ({ title: route.params.channelName })}
      />
    </Stack.Navigator>
  );
}
