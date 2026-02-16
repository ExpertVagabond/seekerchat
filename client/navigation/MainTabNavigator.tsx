import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import ChatStackNavigator from "./ChatStackNavigator";
import ChannelStackNavigator from "./ChannelStackNavigator";
import SettingsScreen from "@/screens/SettingsScreen";
import type { MainTabParamList } from "./types";
import { colors, fontSize } from "@/constants/theme";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: fontSize.xs },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ChatsTab"
        component={ChatStackNavigator}
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChannelsTab"
        component={ChannelStackNavigator}
        options={{
          title: "Channels",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerShown: true,
          headerStyle: { backgroundColor: colors.bgSecondary },
          headerTintColor: colors.text,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
