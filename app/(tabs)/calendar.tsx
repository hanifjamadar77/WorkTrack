import React, { useEffect, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Calendar } from "react-native-calendars";
import { APPWRITE_CONFIG } from "../../constants/config";
import { account, databases } from "../../services/appwrite";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [markedDates, setMarkedDates] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const currentMonthDate = today.toISOString().split("T")[0];

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, [selectedMonth]);

  const loadAttendance = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.limit(100),
          Query.orderDesc("$createdAt"),
        ],
      );

      console.log("loadAttendance: docs returned", response.documents.length);

      const userAttendance = response.documents.filter(
        (doc: any) => doc.userId === user.$id,
      );

      console.log(
        "loadAttendance: filtered userAttendance",
        userAttendance.length,
      );
      const marks: any = {};

      const getMonthFrom = (dateStr: any) => {
        if (!dateStr) return -1;
        // try Date parsing first
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) return d.getMonth();
        } catch (e) {}
        try {
          const parts = (dateStr + "").split("-");
          if (parts.length >= 2) return parseInt(parts[1]) - 1;
        } catch (e) {}
        return -1;
      };

      console.log(
        "loadAttendance: sample userAttendance dates",
        userAttendance.slice(0, 8).map((i: any) => ({
          date: i.date,
          type: typeof i.date,
          monthParsed: getMonthFrom(i.date),
        })),
      );

      // Build marks from all attendance docs (avoid month-filter mismatch)
      userAttendance.forEach((item: any) => {
        const itemDate = item.date;
        const monthFromDate = getMonthFrom(item.date);
        console.log(
          "loadAttendance: marking",
          item.date,
          item.status,
          "monthFromDate",
          monthFromDate,
        );
        let color = "";

        if (item.status === "day") color = "green";
        if (item.status === "night") color = "gray";
        if (item.status === "day_night") color = "purple";
        // half is yellow, half_night is orange
        if (item.status === "half") color = "yellow";
        if (item.status === "half_night") color = "orange";
        if (item.status === "absent") color = "red";

        if (itemDate) {
          marks[itemDate] = {
            selected: true,
            selectedColor: color,
          };
        }
      });

      console.log(
        "loadAttendance: marks built count",
        Object.keys(marks).length,
      );
      console.log(
        "loadAttendance: sample marks",
        Object.keys(marks).slice(0, 5),
      );

      // Merge backend marks with any optimistic local marks
      setMarkedDates((prev: any) => ({ ...prev, ...marks }));
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
        [
          Query.equal("userId", user.$id),
          Query.equal("date", day.dateString),
          Query.limit(1),
        ],
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
    if (saving) return; // prevent double click

    setSaving(true);
    try {
      const user = await account.get();

      // Step 1: check if attendance already exists for this date
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
        [
          Query.equal("userId", user.$id),
          Query.equal("date", selectedDate),
          Query.limit(1),
        ],
      );

      if (response.documents.length > 0) {
        const existing = response.documents[0];

        await databases.updateDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
          existing.$id,
          {
            status,
            note,
          },
        );
      } else {
        await databases.createDocument(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            date: selectedDate,
            status,
            note,
          },
        );
      }

      setModalVisible(false);
      setStatus("");
      setNote("");

      // update calendar immediately so UI reflects change even if backend is slow
      const getColor = (s: string) => {
        if (s === "day") return "green";
        if (s === "night") return "gray";
        if (s === "day_night") return "purple";
        if (s === "half") return "yellow";
        if (s === "half_night") return "orange";
        if (s === "absent") return "red";
        return "#4CAF50";
      };

      setMarkedDates((prev: any) => ({
        ...prev,
        [selectedDate]: { selected: true, selectedColor: getColor(status) },
      }));

      // notify other screens (dashboard) to refresh and provide optimistic payload
      try {
        DeviceEventEmitter.emit("attendanceUpdated", {
          userId: user.$id,
          date: selectedDate,
          status,
          note,
        });
      } catch (e) {
        // ignore
      }

      // confirm record exists on backend for this date
      try {
        const verify = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
          [
            Query.equal("userId", user.$id),
            Query.equal("date", selectedDate),
            Query.limit(1),
          ],
        );
        console.log(
          "saveAttendance: verify backend doc count",
          verify.documents.length,
          selectedDate,
          verify.documents[0],
        );
      } catch (e) {
        console.log("saveAttendance: verify failed", e);
      }

      // also try to reload from backend
      loadAttendance(); // refresh calendar
    } catch (err) {
      Alert.alert("Error", "Failed to save attendance");
    } finally {
      setSaving(false);
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
        {[
          { emoji: "🟢", label: "Day" },
          { emoji: "⚫", label: "Night" },
          { emoji: "🟣", label: "Day-Night" },
          { emoji: "🟡", label: "Half" },
          { emoji: "🔴", label: "Absent" },
          { emoji: "🟠", label: "Half-Day-Night" },
        ].map((it) => (
          <View key={it.label} style={styles.legendItem}>
            <Text>
              {it.emoji} {it.label}
            </Text>
          </View>
        ))}
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
                {
                  label: "Half-Day-Night",
                  value: "half_night",
                  color: "orange",
                },
                { label: "Half", value: "half", color: "yellow" },
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

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveAttendance}
              disabled={saving}
            >
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
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
    fontSize: 14,
  },

  legendItem: {
    width: "33%",
    alignItems: "center",
    marginBottom: 8,
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
