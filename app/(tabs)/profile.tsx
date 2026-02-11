import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { databases, account, storage } from "../../services/appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { ID } from "react-native-appwrite";
import AppInput from "../../components/Input";

export default function ProfileScreen() {
  const [profileId, setProfileId] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [daySalary, setDaySalary] = useState("");
  const [nightSalary, setNightSalary] = useState("");
  const [halfSalary, setHalfSalary] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const user = await account.get();

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.USER_COLLECTION_ID,
    );

    const profile = response.documents.find(
      (doc: any) => doc.userId === user.$id,
    );

    if (profile) {
      setProfileId(profile.$id);
      setName(profile.name);
      setEmail(profile.email);
      setAvatarUrl(profile.avatar);
      setDaySalary(String(profile.daySalary || ""));
      setNightSalary(String(profile.nightSalary || ""));
      setHalfSalary(String(profile.halfDaySalary || ""));
    }
  };

  // 📸 Pick image
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0]);
    }
  };

  // ☁️ Upload avatar
  const uploadAvatar = async (image: any) => {
    try {
      const file = {
        uri: image.uri,
        type: "image/jpeg",
        name: "avatar.jpg",
        size: image.fileSize || 0,
      };

      const upload = await storage.createFile(
        APPWRITE_CONFIG.BUCKET_ID,
        ID.unique(),
        file,
      );

      const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.BUCKET_ID}/files/${upload.$id}/view?project=${APPWRITE_CONFIG.PROJECT_ID}`;

      setAvatarUrl(fileUrl);

      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.USER_COLLECTION_ID,
        profileId,
        { avatar: fileUrl },
      );

      Alert.alert("Avatar updated");
      console.log("Updating profile ID:", profileId);
      console.log("Saving avatar URL:", fileUrl);
    } catch (err) {
      console.log(err);
      Alert.alert("Upload failed");
    }
  };

  // 💾 Save profile
  const updateProfile = async () => {
    try {
      await databases.updateDocument(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.USER_COLLECTION_ID,
        profileId,
        {
          name,
          daySalary: Number(daySalary),
          nightSalary: Number(nightSalary),
          halfDaySalary: Number(halfSalary),
          avatar: avatarUrl,
        },
      );

      Alert.alert("Profile updated");
    } catch {
      Alert.alert("Update failed");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Avatar */}
      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 30 }}>👤</Text>
          </View>
        )}
      </TouchableOpacity>

      <AppInput
        label="Full Name"
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        icon="person"
      />

      <AppInput
        label="Email"
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        icon="mail"
      />

      <Text style={styles.section}>Salary Settings</Text>

      <AppInput
        label="Day Salary"
        placeholder="Enter amount"
        value={daySalary}
        onChangeText={setDaySalary}
        icon="cash"
      />

      <AppInput
        label="Night Salary"
        placeholder="Enter night salary"
        value={nightSalary}
        onChangeText={setNightSalary}
        icon="moon"
      />

      <AppInput
        label="Half Day Salary"
        placeholder="Enter half day salary"
        value={halfSalary}
        onChangeText={setHalfSalary}
        icon="time"
      />

      <TouchableOpacity style={styles.button} onPress={updateProfile}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120 },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  changeText: {
    color: "blue",
    marginTop: 8,
  },

  label: { marginBottom: 5 },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },

  section: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 10,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
