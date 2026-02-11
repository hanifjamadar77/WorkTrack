import React, { useCallback, useEffect, useState} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { databases, account } from "../../services/appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";

export default function DashboardScreen() {
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    days: 0,
    nights: 0,
    half: 0,
    absent: 0,
    salary: 0,
  });
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useFocusEffect(
  useCallback(() => {
    fetchDashboardData();
  }, [selectedMonth])
);

  const fetchDashboardData = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
      );

      const attendance = response.documents.filter(
        (doc: any) => doc.userId === user.$id,
      );

      let days = 0;
      let nights = 0;
      let half = 0;
      let absent = 0;

      attendance
        .filter((item: any) => {
          const monthFromDate = parseInt(item.date.split("-")[1]) - 1;
          return monthFromDate === selectedMonth;
        })
        .forEach((item: any) => {
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
        APPWRITE_CONFIG.USER_COLLECTION_ID,
      );

      const profile = profileRes.documents.find(
        (doc: any) => doc.userId === user.$id,
      );

      if (profile) {
        setUserName(profile.name);
      }

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
      <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const totalDaysInMonth = new Date(
    new Date().getFullYear(),
    selectedMonth + 1,
    0,
  ).getDate();

  const progressPercent = Math.round((stats.days / totalDaysInMonth) * 100);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style= {{flexDirection: "column",}}>
            <Text style={styles.welcome}>Hi {userName} 👋</Text>
            <Text style={styles.subText}>Here is your work summary</Text>
        </View>
        <TouchableOpacity
          style={styles.monthBox}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.monthText}>
            {
              [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ][selectedMonth]
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gradient Salary Card */}
      <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.salaryCard}>
        <Text style={styles.salaryLabel}>Monthly Earnings</Text>
        <Text style={styles.salaryValue}>₹ {stats.salary}</Text>
      </LinearGradient>

      {/* Progress Section */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Monthly Work Progress</Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Ionicons name="sunny" size={26} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.days}</Text>
          <Text style={styles.statLabel}>Days Worked</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="moon" size={26} color="#555" />
          <Text style={styles.statNumber}>{stats.nights}</Text>
          <Text style={styles.statLabel}>Night Shifts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={26} color="#FFC107" />
          <Text style={styles.statNumber}>{stats.half}</Text>
          <Text style={styles.statLabel}>Half Days</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={26} color="#F44336" />
          <Text style={styles.statNumber}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>

        {/* Mark Today Button */}
        <View style={{ width: "100%", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.markButton}
            onPress={() => router.push("/(tabs)/calendar")}
          >
            <Text style={styles.markButtonText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.monthModal}>
            {[
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ].map((month, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedMonth(index);
                  setShowMonthPicker(false);
                }}
              >
                <Text style={styles.monthItem}>{month}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  monthBox: {
    flex: 0,
    height:60,
    width:60,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    marginBottom: 10,
     shadowColor: "#000",
     shadowOpacity: 0.2,
     justifyContent: "center",
  },
  monthText: {
    fontWeight: "600",
    fontSize: 18,
    color: "#fff",
     textAlign: "center",
    textAlignVertical: "center",
  },
  welcome: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 5,
  },

  subText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },

  salaryCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },

  salaryLabel: {
    color: "#fff",
    fontSize: 16,
  },

  salaryValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 6,
  },

  progressContainer: {
    marginBottom: 25,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  progressText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#333",
  },

  progressPercent: {
    fontWeight: "bold",
    color: "#4CAF50",
    fontSize: 16,
  },

  progressBarBg: {
    height: 14,
    backgroundColor: "#eaeaea",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 6,
  },

  statLabel: {
    marginTop: 4,
    color: "#666",
  },
  markButton: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
  },

  markButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBg: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  monthModal: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  monthItem: {
    padding: 15,
    fontSize: 16,
  },
});
