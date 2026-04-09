import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Updates from "expo-updates";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../../constants/config";
import { account, databases } from "../../../services/appwrite";
import { calculateStats } from "../../../components/calculateStats";

export default function DashboardScreen() {
  const [userName, setUserName] = useState("");
  const [attendance, setAttendance] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    days: 0,
    nights: 0,
    half: 0,
    absent: 0,
    salary: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      checkUpdate();
    }, [selectedMonth])
  );

  const checkUpdate = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Updates.reloadAsync();
      }
    } catch (e) {
      console.log("Update check failed:", e);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const user = await account.get();

      // 📊 Attendance
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
        [Query.equal("userId", user.$id)]
      );

      setAttendance(response.documents);

      // 👤 Profile
      const profileRes = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.USER_COLLECTION_ID,
        [Query.equal("userId", user.$id)]
      );

      const profileData = profileRes.documents[0];
      setProfile(profileData);
      setUserName(profileData?.name || "");

      // 🔥 Calculate stats (REUSABLE FUNCTION)
      const statsData = calculateStats(
        response.documents,
        selectedMonth,
        profileData
      );

      setStats(statsData);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const totalDaysInMonth = new Date(
    new Date().getFullYear(),
    selectedMonth + 1,
    0
  ).getDate();

  const progressPercent = Math.round(
    (stats.days / totalDaysInMonth) * 100
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcome}>Hi {userName} 👋</Text>
          <Text style={styles.subText}>Manage your and your team attendance</Text>
        </View>

        <TouchableOpacity
          style={styles.monthBox}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.monthText}>
            {[
              "Jan","Feb","Mar","Apr","May","Jun",
              "Jul","Aug","Sep","Oct","Nov","Dec",
            ][selectedMonth]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Salary */}
      <LinearGradient colors={["#4CAF50", "#2E7D32"]} style={styles.salaryCard}>
        <Text style={styles.salaryLabel}>Monthly Earnings</Text>
        <Text style={styles.salaryValue}>₹ {stats.salary}</Text>
      </LinearGradient>

      {/* Progress */}
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

      {/* Stats */}
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
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.markButton}
        onPress={() => router.push("/(tabs)/calendar")}
      >
        <Text style={styles.markButtonText}>Mark Attendance</Text>
      </TouchableOpacity>

      {/* Month Picker */}
      <Modal visible={showMonthPicker} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.monthModal}>
            {[
              "January","February","March","April","May","June",
              "July","August","September","October","November","December",
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
    backgroundColor: "#f6f6f6",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  welcome: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subText: {
    fontSize: 14,
    color: "#666",
  },

  monthBox: {
    height: 60,
    width: 60,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  monthText: {
    fontWeight: "600",
    fontSize: 18,
    color: "#fff",
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
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
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
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
});