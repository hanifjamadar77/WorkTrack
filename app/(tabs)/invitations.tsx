import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
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

      setInvites(res.documents as unknown as GroupMemberDocument[]);
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
      <Text style={styles.title}>Invitations</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.$id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending invites</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.groupText}>Group ID: {item.groupId}</Text>

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
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },

  card: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  groupText: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  acceptBtn: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },

  rejectBtn: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
});
