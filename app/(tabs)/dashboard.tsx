import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { databases, account } from "../../services/appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    days: 0,
    nights: 0,
    half: 0,
    absent: 0,
    salary: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID
      );

      const attendance = response.documents.filter(
        (doc: any) => doc.userId === user.$id
      );

      let days = 0;
      let nights = 0;
      let half = 0;
      let absent = 0;

      attendance.forEach((item: any) => {
        if (item.status === "day") days++;
        if (item.status === "night") nights++;
        if (item.status === "day_night") {
          days++;
          nights++;
        }
        if (item.status === "half") half++;
        if (item.status === "absent") absent++;
      });

      // Fetch salary settings
      const profileRes = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.USER_COLLECTION_ID
      );

      const profile = profileRes.documents.find(
        (doc: any) => doc.userId === user.$id
      );

      const daySalary = profile?.daySalary || 0;
      const nightSalary = profile?.nightSalary || 0;
      const halfSalary = profile?.halfDaySalary || 0;

      const salary =
        days * daySalary + nights * nightSalary + half * halfSalary;

      setStats({ days, nights, half, absent, salary });
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Days Worked</Text>
        <Text style={styles.value}>{stats.days}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Night Shifts</Text>
        <Text style={styles.value}>{stats.nights}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Half Days</Text>
        <Text style={styles.value}>{stats.half}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Absent</Text>
        <Text style={styles.value}>{stats.absent}</Text>
      </View>

      <View style={styles.salaryCard}>
        <Text style={styles.salaryLabel}>Monthly Salary</Text>
        <Text style={styles.salaryValue}>₹ {stats.salary}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 18,
    borderRadius: 10,
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    color: "#555"
  },
  value: {
    fontSize: 24,
    fontWeight: "bold"
  },
  salaryCard: {
    backgroundColor: "#4CAF50",
    padding: 20,
    borderRadius: 12,
    marginTop: 10
  },
  salaryLabel: {
    color: "#fff",
    fontSize: 18
  },
  salaryValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
