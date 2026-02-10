import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,

        tabBarActiveTintColor: "#4CAF50",
        tabBarInactiveTintColor: "#999",

        tabBarStyle: {
          position: "absolute",
          bottom: 15,
          left: 15,
          right: 15,
          elevation: 10,
          backgroundColor: "#ffffff",
          borderRadius: 20,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 10,
          borderTopWidth: 0
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginBottom: 4
        }
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: "center" }}>
              <Ionicons
                name={focused ? "stats-chart" : "stats-chart-outline"}
                size={size}
                color={color}
              />
            </View>
          )
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={size}
              color={color}
            />
          )
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          )
        }}
      />
    </Tabs>
  );
}
