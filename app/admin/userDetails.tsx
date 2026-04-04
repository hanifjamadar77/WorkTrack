import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { databases } from "../../services/appwrite";

type AttendanceRecord = {
  $id: string;
  userId: string;
  date: string;
  status: string;
  note?: string;
};

export default function UserDetails() {
  const { userId } = useLocalSearchParams();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.ATTENDANCE_COLLECTION_ID,
        [Query.equal("userId", userId)],
      );

      setAttendance(res.documents as unknown as AttendanceRecord[]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>User Attendance</Text>

      <Text>Total Records: {attendance.length}</Text>
    </View>
  );
}
