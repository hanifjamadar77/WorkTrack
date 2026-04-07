import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { Calendar } from "react-native-calendars";
import { APPWRITE_CONFIG } from "../../constants/config";
import { databases } from "../../services/appwrite";
import { calculateStats } from "../../components/calculateStats";
import { LinearGradient } from "expo-linear-gradient";

const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
const ATTENDANCE_COLLECTION_ID = APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID;
const USER_COLLECTION_ID = APPWRITE_CONFIG.USER_COLLECTION_ID;

export default function UserDetails() {
  const { userId } = useLocalSearchParams();

  const [attendance, setAttendance] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    days: 0,
    nights: 0,
    half: 0,
    absent: 0,
    salary: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 👤 Fetch user profile
      const userRes = await databases.listDocuments(
        DATABASE_ID,
        USER_COLLECTION_ID,
        [Query.equal("userId", userId)],
      );

      const userData = userRes.documents[0];
      setUser(userData);

      // 📊 Fetch all attendance (no date filter)
      const attRes = await databases.listDocuments(
        DATABASE_ID,
        ATTENDANCE_COLLECTION_ID,
        [Query.equal("userId", userId)],
      );

      setAttendance(attRes.documents);

      // 🔥 Use reusable function
      const currentMonth = new Date().getMonth();

      const statsData = calculateStats(
        attRes.documents,
        currentMonth,
        userData,
      );

      setStats(statsData);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // 📅 Calendar markings
  const getMarkedDates = () => {
    const marks: any = {};

    attendance.forEach((item) => {
      const date = item.date?.split("T")[0];
      if (!date) return;

      let color = "#ccc";

      if (item.status === "day")
        color = "#4CAF50"; // green
      else if (item.status === "night")
        color = "#000"; // black
      else if (item.status === "half")
        color = "#FFA500"; // orange
      else if (item.status === "absent")
        color = "#F44336"; // red
      else if (item.status === "day_night") color = "#9C27B0"; // purple

      marks[date] = {
        selected: true,
        selectedColor: color,
        selectedTextColor: "#fff",
      };
    });

    return marks;
  };

  // 📊 Progress
  const totalDaysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();

  const progressPercent = Math.round((stats.days / totalDaysInMonth) * 100);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 👤 User Info */}
      <Text style={styles.title}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {/* 💰 Earnings */}
      <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Earnings</Text>
        <Text style={styles.amount}>₹{stats.salary}</Text>
      </LinearGradient>

      {/* 📅 Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.days}</Text>
          <Text style={styles.statLabel}>Day</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.nights}</Text>
          <Text style={styles.statLabel}>Night</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.half}</Text>
          <Text style={styles.statLabel}>Half</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>

      {/* 📅 Calendar */}
      <Text style={styles.subtitle}>Attendance Calendar</Text>

      <Calendar
        markedDates={getMarkedDates()}
        theme={{
          todayTextColor: "#4CAF50",
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f6f6f6",
    marginTop:30,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color:"#014904"
  },

  email: {
    color: "gray",
    marginBottom: 20,
  },

  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 16,
  },

  amount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 6,
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statBox: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "22%",
    elevation: 2,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },

  statLabel: {
    fontSize: 12,
    color: "gray",
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});
