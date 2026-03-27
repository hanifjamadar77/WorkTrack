import { View, Text, StyleSheet } from "react-native";

export default function GroupsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>
      <Text>Create and manage worker groups</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
});