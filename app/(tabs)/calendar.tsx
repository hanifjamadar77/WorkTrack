import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { databases, account } from "../../services/appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { ID } from "react-native-appwrite";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [markedDates, setMarkedDates] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const currentMonthDate = today.toISOString().split("T")[0];

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth]);

  const loadAttendance = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
      );

      const userAttendance = response.documents.filter(
        (doc: any) => doc.userId === user.$id,
      );

      const marks: any = {};

      userAttendance
        .filter((item: any) => {
          const monthFromDate = parseInt(item.date.split("-")[1]) - 1;
          return monthFromDate === selectedMonth;
        })
        .forEach((item: any) => {
          let color = "";

          if (item.status === "day") color = "green";
          if (item.status === "night") color = "gray";
          if (item.status === "day_night") color = "purple";
          if (item.status === "half") color = "yellow";
          if (item.status === "absent") color = "red";

          marks[item.date] = {
            selected: true,
            selectedColor: color,
          };
        });

      setMarkedDates(marks);
    } catch (err) {
      console.log(err);
    }
  };

  const openModal = async (day: any) => {
    try {
      setSelectedDate(day.dateString);

      const user = await account.get();

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
      );

      const existing = response.documents.find(
        (doc: any) => doc.userId === user.$id && doc.date === day.dateString,
      );

      if (existing) {
        setStatus(existing.status);
        setNote(existing.note || "");
      } else {
        setStatus("");
        setNote("");
      }

      setModalVisible(true);
    } catch (err) {
      console.log(err);
    }
  };

  const saveAttendance = async () => {
    try {
      const user = await account.get();

      // Step 1: check if attendance already exists for this date
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
      );

      const existing = response.documents.find(
        (doc: any) => doc.userId === user.$id && doc.date === selectedDate,
      );

      if (existing) {
        // Step 2: update existing attendance
        await databases.updateDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
          existing.$id,
          {
            status: status,
            note: note,
          },
        );

        Alert.alert("Updated", "Attendance updated successfully");
      } else {
        // Step 3: create new attendance
        await databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            date: selectedDate,
            status: status,
            note: note,
          },
        );

        Alert.alert("Saved", "Attendance saved successfully");
      }

      setModalVisible(false);
      setStatus("");
      setNote("");

      loadAttendance(); // refresh calendar
    } catch (err) {
      Alert.alert("Error", "Failed to save attendance");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAttendance();
    setRefreshing(false);
  };

  // const today = new Date();

  const dayName = today.toLocaleDateString("en-US", { weekday: "short" });
  const dateNumber = today.getDate();
  const monthName = today.toLocaleDateString("en-US", { month: "short" });
  const year = today.getFullYear();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.datePanel}>
        <Text style={styles.dateDay}>{dayName}</Text>
        <Text style={styles.dateFull}>
          {dateNumber} {monthName} {year}
        </Text>
      </View>

      <Calendar
        current={currentMonthDate}
        markedDates={markedDates}
        onDayPress={openModal}
        onMonthChange={(month) => {
          setSelectedMonth(month.month - 1);
        }}
        style={styles.calendar}
        theme={{
          textDayFontSize: 20,
          textMonthFontSize: 22,
          textDayHeaderFontSize: 14,
          todayTextColor: "#4CAF50",
          selectedDayBackgroundColor: "#4CAF50",
          arrowColor: "#4CAF50",
          monthTextColor: "#333",
        }}
      />

      <View style={styles.legend}>
        <Text>🟢 Day</Text>
        <Text>⚫ Night</Text>
        <Text>🟣 Day-Night</Text>
        <Text>🟡 Half</Text>
        <Text>🔴 Absent</Text>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.title}>Mark Attendance</Text>

            <View style={styles.statusRow}>
              {[
                { label: "Day", value: "day", color: "green" },
                { label: "Night", value: "night", color: "gray" },
                { label: "Day-Night", value: "day_night", color: "purple" },
                { label: "Half", value: "half", color: "orange" },
                { label: "Absent", value: "absent", color: "red" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.statusBtn,
                    status === item.value && { backgroundColor: item.color },
                  ]}
                  onPress={() => setStatus(item.value)}
                >
                  <Text
                    style={{ color: status === item.value ? "#fff" : "#333" }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Add note"
              style={styles.input}
              value={note}
              onChangeText={setNote}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveAttendance}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, paddingBottom: 90 },

  datePanel: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },

  dateDay: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "600",
  },

  dateFull: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
    color: "#333",
  },

  calendar: {
    borderRadius: 18,
    padding: 12,
    marginTop: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },

  dateIcon: {
    fontSize: 26,
    marginRight: 12,
  },

  dateMain: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  dateSub: {
    fontSize: 13,
    color: "#777",
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 10,
  },

  legend: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    fontSize: 14,
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  statusBtn: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
    width: "48%",
    alignItems: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  option: {
    fontSize: 16,
    padding: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  cancel: {
    textAlign: "center",
    marginTop: 10,
    color: "red",
  },
});
