import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatListScreen from "@/screens/ChatListScreen";
import ChatRoomScreen from "@/screens/ChatRoomScreen";
import NewDMScreen from "@/screens/NewDMScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import type { ChatStackParamList } from "./types";
import { colors, fontSize } from "@/constants/theme";

const Stack = createNativeStackNavigator<ChatStackParamList>();

export default function ChatStackNavigator() {
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
        name="ChatList"
        component={ChatListScreen}
        options={{ title: "Chats" }}
      />
      <Stack.Screen
        name="ChatRoom"
        component={ChatRoomScreen}
        options={({ route }) => ({ title: route.params.channelName })}
      />
      <Stack.Screen
        name="NewDM"
        component={NewDMScreen}
        options={{ title: "New Message", presentation: "modal" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Stack.Navigator>
  );
}
