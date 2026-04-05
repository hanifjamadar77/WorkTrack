import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { ID, Models, Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { databases } from "../../services/appwrite";
import { IUserProfile } from "../../types/user";

const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
const USER_COLLECTION_ID = APPWRITE_CONFIG.USER_COLLECTION_ID;
const GROUP_MEMBERS_COLLECTION_ID =
  APPWRITE_CONFIG.GROUP_MEMBERS_COLLECTION_ID;

type UserDocument = Models.Document & IUserProfile;

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [acceptedUsers, setAcceptedUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Search Users
  const searchUsers = async (text: string) => {
    setSearch(text);

    if (text.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        USER_COLLECTION_ID,
        [
          Query.equal("role", "user"),
          Query.search("name", text),
        ]
      );

      setUsers(res.documents as unknown as UserDocument[]);
    } catch (err) {
      console.log(err);
    }
  };

  // 📩 Send Invite
  const inviteUser = async (userId: string) => {
    try {
      const existing = await databases.listDocuments(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        [
          Query.equal("groupId", groupId),
          Query.equal("userId", userId),
        ]
      );

      if (existing.documents.length > 0) {
        Alert.alert("Already Invited");
        return;
      }

      await databases.createDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        ID.unique(),
        {
          groupId: groupId,
          userId: userId,
          status: "pending",
        }
      );

      Alert.alert("Invite Sent");
    } catch (err) {
      console.log(err);
      Alert.alert("Error sending invite");
    }
  };

  // 🔥 Fetch accepted users
  const fetchAcceptedUsers = async () => {
    try {
      setLoading(true);

      const members = await databases.listDocuments(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        [
          Query.equal("groupId", groupId),
          Query.equal("status", "accepted"),
        ]
      );

      const usersData = await Promise.all(
        members.documents.map(async (m: any) => {
          const res = await databases.listDocuments(
            DATABASE_ID,
            USER_COLLECTION_ID,
            [Query.equal("userId", m.userId)]
          );

          return res.documents[0];
        })
      );

      setAcceptedUsers(usersData as unknown as UserDocument[]);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Details</Text>

      {/* 🔍 Search */}
      <TextInput
        placeholder="Search users..."
        value={search}
        onChangeText={searchUsers}
        style={styles.input}
      />

      {/* 🔍 Search Results */}
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

      {/* 🔥 Accepted Users */}
      <Text style={styles.subtitle}>Group Members</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={acceptedUsers}
          keyExtractor={(item) => item.$id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No users yet</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/admin/userDetails",
                  params: { userId: item.userId },
                })
              }
            >
              <View style={styles.card}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
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

  card: {
    padding: 15,
    backgroundColor: "#e8f5e9",
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

  emptyText: {
    textAlign: "center",
    color: "gray",
    marginTop: 10,
  },
});