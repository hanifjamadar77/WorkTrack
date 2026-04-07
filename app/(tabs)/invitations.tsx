import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../constants/config";
import { account, databases } from "../../services/appwrite";

const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
const GROUP_MEMBERS_COLLECTION_ID = APPWRITE_CONFIG.GROUP_MEMBERS_COLLECTION_ID;
const GROUP_COLLECTION_ID = APPWRITE_CONFIG.GROUP_COLLECTION_ID;

type GroupMemberDocument = {
  $id: string;
  groupId: string;
  userId: string;
  status: string;
};

export default function InvitationsScreen() {
  const [invites, setInvites] = useState<GroupMemberDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Fetch Invitations
  const fetchInvites = async () => {
    try {
      setLoading(true);

      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        [Query.equal("userId", user.$id), Query.equal("status", "pending")],
      );

      // 🔥 Fetch group names
      const invitesWithNames = await Promise.all(
        res.documents.map(async (item: any) => {
          try {
            const groupRes = await databases.getDocument(
              DATABASE_ID,
              GROUP_COLLECTION_ID,
              item.groupId,
            );

            return {
              ...item,
              groupName: groupRes.groupName,
            };
          } catch {
            return {
              ...item,
              groupName: "Unknown Group",
            };
          }
        }),
      );

      setInvites(invitesWithNames);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  // ✅ Accept Invite
  const acceptInvite = async (docId: string) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        docId,
        {
          status: "accepted",
        },
      );

      Alert.alert("Success", "Joined group");
      fetchInvites();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to accept");
    }
  };

  // ❌ Reject Invite (optional)
  const rejectInvite = async (docId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        GROUP_MEMBERS_COLLECTION_ID,
        docId,
      );

      Alert.alert("Rejected");
      fetchInvites();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to reject");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Join groups assigned by admins</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.$id}
          refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={fetchInvites} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending invites</Text>
          }
          renderItem={({ item }: any) => (
            <View style={styles.card}>
              {/* 🏷 Group Name */}
              <Text style={styles.groupName}>👥 {item.groupName}</Text>

              <Text style={styles.desc}>
                You’ve been invited to join this group
              </Text>

              {/* 🔘 Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => acceptInvite(item.$id)}
                >
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => rejectInvite(item.$id)}
                >
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    backgroundColor: "#f4f6f8",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 18,
    color: "#413d3d",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },

  groupName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  desc: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    marginBottom: 12,
  },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  acceptBtn: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginRight: 6,
    alignItems: "center",
  },

  rejectBtn: {
    backgroundColor: "#F44336",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 6,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
  },
});
