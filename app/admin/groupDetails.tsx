import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ID, Models, Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { databases } from "../../services/appwrite";
import { handleRemoveMember } from "../../services/authServices";
import { IUserProfile } from "../../types/user";

const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
const USER_COLLECTION_ID = APPWRITE_CONFIG.USER_COLLECTION_ID;
const GROUP_MEMBERS_COLLECTION_ID = APPWRITE_CONFIG.GROUP_MEMBERS_COLLECTION_ID;

type UserDocument = Models.Document & IUserProfile;

type GroupMemberWithUser = UserDocument & {
  membershipId: string;
};

export default function GroupDetails() {
  const { groupId } = useLocalSearchParams();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [acceptedUsers, setAcceptedUsers] = useState<GroupMemberWithUser[]>([]);
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
      const existing = await databases.listDocuments(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        [Query.equal("groupId", groupId), Query.equal("userId", userId)],
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
        },
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
        [Query.equal("groupId", groupId), Query.equal("status", "accepted")],
      );

      const usersData = await Promise.all(
        members.documents.map(async (m: any) => {
          const res = await databases.listDocuments(
            DATABASE_ID,
            USER_COLLECTION_ID,
            [Query.equal("userId", m.userId)],
          );

          const userDoc = res.documents[0] as unknown as UserDocument;
          if (!userDoc) return null;

          return {
            ...userDoc,
            membershipId: m.$id,
          };
        }),
      );

      setAcceptedUsers(
        usersData.filter((item): item is GroupMemberWithUser => item !== null),
      );
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberLongPress = (member: GroupMemberWithUser) => {
    Alert.alert("Member Options", `Remove ${member.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => handleRemoveMember(member.membershipId),
      },
    ]);
  };

  useEffect(() => {
    fetchAcceptedUsers();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={acceptedUsers}
        keyExtractor={(item) => item.membershipId}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAcceptedUsers} />
        }
        ListHeaderComponent={
          <>
            {/* 🔥 HEADER */}
            <Text style={styles.title}>Group Details</Text>
            <Text style={styles.subtitleTop}>
              Search and manage your team members
            </Text>

            {/* 🔍 SEARCH CARD */}
            <View style={styles.searchCard}>
              <TextInput
                placeholder="Search users..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={searchUsers}
                style={styles.input}
              />
            </View>

            {/* 🔍 SEARCH RESULTS */}
            {users.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Search Results</Text>

                {users.map((item) => (
                  <View key={item.$id} style={styles.userCard}>
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
                ))}
              </>
            )}

            {/* 👥 MEMBERS TITLE */}
            <Text style={styles.sectionTitle}>Group Members</Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users in this group</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleMemberLongPress(item)}
            delayLongPress={300}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/admin/userDetails",
                params: { userId: item.userId },
              })
            }
          >
            <View style={styles.memberCard}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>

              <Text style={styles.arrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 20,
    marginTop: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#065602",
  },

  subtitleTop: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#065602",
  },

  searchCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  input: {
    backgroundColor: "#f1f3f5",
    padding: 14,
    borderRadius: 10,
    fontSize: 14,
  },

  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },

  memberCard: {
    backgroundColor: "#caf4ba",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },

  name: {
    fontSize: 17,
    fontWeight: "bold",
  },

  email: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },

  inviteBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  inviteText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  arrow: {
    fontSize: 20,
    color: "#164617",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
  },
});
