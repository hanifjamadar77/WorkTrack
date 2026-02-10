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
  ScrollView
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

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      const user = await account.get();

      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID
      );

      const userAttendance = response.documents.filter(
        (doc: any) => doc.userId === user.$id
      );

      const marks: any = {};

      userAttendance.forEach((item: any) => {
        let color = "";

        if (item.status === "day") color = "green";
        if (item.status === "night") color = "gray";
        if (item.status === "day_night") color = "purple";
        if (item.status === "half") color = "yellow";
        if (item.status === "absent") color = "red";

        marks[item.date] = {
          selected: true,
          selectedColor: color
        };
      });

      setMarkedDates(marks);
    } catch (err) {
      console.log(err);
    }
  };

  const openModal = (day: any) => {
    setSelectedDate(day.dateString);
    setModalVisible(true);
  };

const saveAttendance = async () => {
  try {
    const user = await account.get();

    // Step 1: check if attendance already exists for this date
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID
    );

    const existing = response.documents.find(
      (doc: any) =>
        doc.userId === user.$id && doc.date === selectedDate
    );

    if (existing) {
      // Step 2: update existing attendance
      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
        existing.$id,
        {
          status: status,
          note: note
        }
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
          note: note
        }
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

  return (
    <ScrollView 
    style={styles.container}
    refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
  >
      <Calendar markedDates={markedDates} onDayPress={openModal} />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.title}>Mark Attendance</Text>

            <TouchableOpacity onPress={() => setStatus("day")}>
              <Text style={styles.option}>🟢 Day Work</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStatus("night")}>
              <Text style={styles.option}>⚫ Night Work</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStatus("day_night")}>
              <Text style={styles.option}>🟣 Day + Night</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStatus("half")}>
              <Text style={styles.option}>🟡 Half Day</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStatus("absent")}>
              <Text style={styles.option}>🔴 Absent</Text>
            </TouchableOpacity>

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
  container: { flex: 1, padding: 10 , paddingBottom: 90},

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  modal: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15
  },
  option: {
    fontSize: 16,
    padding: 10
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 8
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginTop: 15
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  },
  cancel: {
    textAlign: "center",
    marginTop: 10,
    color: "red"
  }
});
