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
import { ID, Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../../../constants/config";
import { account, databases } from "../../../services/appwrite";
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
        [Query.equal("adminId", user.$id)]
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
        }
      );

      Alert.alert("Success", "Group created");

      setGroupName("");
      fetchGroups(); // refresh

    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to create group");
    }
  };

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Groups</Text>

      {/* 🔥 Create Group Section */}
      <View style={styles.createBox}>
        <TextInput
          placeholder="Enter group name"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
        />

        <TouchableOpacity style={styles.btn} onPress={createGroup}>
          <Text style={styles.btnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* 🔄 Loading */}
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.$id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No groups created yet</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/admin/groupDetails",
                  params: { groupId: item.$id },
                })
              }
            >
              <View style={styles.card}>
                <Text style={styles.groupName}>{item.groupName}</Text>
                <Text style={styles.subText}>Tap to manage users</Text>
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

  createBox: {
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  btn: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  card: {
    padding: 16,
    backgroundColor: "#f1f1f1",
    borderRadius: 12,
    marginBottom: 10,
  },

  groupName: {
    fontWeight: "bold",
    fontSize: 16,
  },

  subText: {
    fontSize: 12,
    color: "gray",
    marginTop: 4,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "gray",
  },
});