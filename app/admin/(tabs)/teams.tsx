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
  ScrollView,
  RefreshControl,
} from "react-native";
import { ID, Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../../constants/config";
import { account, databases } from "../../../services/appwrite";
import {deleteGroup} from "../../../services/authServices";
import { router } from "expo-router";

const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;
const GROUP_COLLECTION_ID = APPWRITE_CONFIG.GROUP_COLLECTION_ID;

type Group = {
  $id: string;
  groupName: string;
  adminId: string;
};

export default function GroupsScreen() {
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);

      const user = await account.get();

      const res = await databases.listDocuments(
        DATABASE_ID,
        GROUP_COLLECTION_ID,
        [Query.equal("adminId", user.$id)],
      );

      setGroups(res.documents as unknown as Group[]);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 🔥 Create group
  const createGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Enter group name");
      return;
    }

    try {
      const user = await account.get();

      await databases.createDocument(
        DATABASE_ID,
        GROUP_COLLECTION_ID,
        ID.unique(),
        {
          groupName: groupName.trim(),
          adminId: user.$id,
        },
      );

      Alert.alert("Success", "Group created");

      setGroupName("");
      fetchGroups(); // refresh
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to create group");
    }
  };

  const handleLongPress = (group: any) => {
  Alert.alert(
    "Group Options",
    `Manage "${group.groupName}"`,
    [
      {
        text: "Delete Group",
        style: "destructive",
        onPress: () => deleteGroup(group.$id),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );
};

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={
                <RefreshControl refreshing={loading} onRefresh={fetchGroups} />
              }>
        {/* 🔥 HEADER */}
        <Text style={styles.title}>Create and manage worker groups</Text>

        {/* 🔥 CREATE GROUP CARD */}
        <View style={styles.createCard}>
          <TextInput
            placeholder="Enter group name..."
            placeholderTextColor="#999"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
          />

          <TouchableOpacity style={styles.btn} onPress={createGroup}>
            <Text style={styles.btnText}>+ Create Group</Text>
          </TouchableOpacity>
        </View>

        {/* 🔄 Loading */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4CAF50"
            style={{ marginTop: 30 }}
          />
        ) : groups.length === 0 ? (
          <Text style={styles.emptyText}>No groups created yet</Text>
        ) : (
          groups.map((item) => (
            <TouchableOpacity
              key={item.$id}
              onPress={() =>
                router.push({
                  pathname: "/admin/groupDetails",
                  params: { groupId: item.$id },
                })
              }
              onLongPress={() => handleLongPress(item)}
              delayLongPress={300}
              activeOpacity={0.8}
            >
              <View style={styles.card}>
                <View>
                  <Text style={styles.groupName}>{item.groupName}</Text>
                  <Text style={styles.subText}>Tap to manage users</Text>
                </View>

                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },

  createCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },

  input: {
    backgroundColor: "#f1f3f5",
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    marginBottom: 12,
  },

  btn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  card: {
    backgroundColor: "#e8f9d3",
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },

  groupName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#065602",
  },

  subText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  arrow: {
    fontSize: 20,
    color: "#4CAF50",
    fontWeight: "bold",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 30,
    color: "#999",
    fontSize: 14,
  },
});
