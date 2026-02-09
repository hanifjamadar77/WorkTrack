import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
