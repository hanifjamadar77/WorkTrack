import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { ID, Models, Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { databases } from "../../services/appwrite";
import { IUserProfile } from "../../types/user";

const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
const USER_COLLECTION_ID = APPWRITE_CONFIG.USER_COLLECTION_ID;
const GROUP_MEMBERS_COLLECTION_ID = APPWRITE_CONFIG.GROUP_MEMBERS_COLLECTION_ID;

type UserDocument = Models.Document & IUserProfile;

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserDocument[]>([]);

  // 🔍 Search Users
  const searchUsers = async (text: string) => {
    setSearch(text);

    if (!text) {
      setUsers([]);
      return;
    }

    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        USER_COLLECTION_ID,
        [Query.equal("role", "user"), Query.search("name", text)],
      );

      setUsers(res.documents as unknown as UserDocument[]);
    } catch (err) {
      console.log(err);
    }
  };

  // 📩 Send Invite
  const inviteUser = async (userId: string) => {
    try {
      // 🔥 Check if already invited
      const existing = await databases.listDocuments(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        [Query.equal("groupId", groupId), Query.equal("userId", userId)],
      );

      if (existing.documents.length > 0) {
        Alert.alert("Already Invited");
        return;
      }

      // ✅ Send invite
      await databases.createDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          groupId: groupId,
          userId: userId,
          status: "pending",
        },
      );

      Alert.alert("Invite Sent");
    } catch (err) {
      console.log(err);
      Alert.alert("Error sending invite");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Users</Text>

      {/* 🔍 Search Input */}
      <TextInput
        placeholder="Search users..."
        value={search}
        onChangeText={searchUsers}
        style={styles.input}
      />

      {/* 👥 User List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>

            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => inviteUser(item.userId)}
            >
              <Text style={styles.inviteText}>Invite</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },

  name: {
    fontWeight: "bold",
  },

  email: {
    color: "gray",
    fontSize: 12,
  },

  inviteBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
  },

  inviteText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
