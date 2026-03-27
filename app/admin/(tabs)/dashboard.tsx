import { View, Text, StyleSheet } from "react-native";

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Manage workers and groups</Text>
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
  subtitle: {
    marginTop: 10,
    color: "gray",
  },
});