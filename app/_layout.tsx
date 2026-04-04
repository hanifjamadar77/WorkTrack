import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../constants/config";
import { account, databases } from "../services/appwrite";

export default function Layout() {
  const router = useRouter();
  const segments = useSegments(); // 🔥 important

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await account.get();

        const res = await databases.listDocuments(
          APPWRITE_CONFIG.DATABASE_ID,
          APPWRITE_CONFIG.USER_COLLECTION_ID,
          [Query.equal("userId", user.$id)],
        );

        const currentUser = res.documents[0];

        const inAuthScreen = (segments.length as number) === 0; // "/" login

        if (currentUser.role === "admin") {
          if (!segments[0]?.includes("admin")) {
            router.replace("/admin/(tabs)/dashboard");
          }
        } else {
          if (segments[0] !== "(tabs)") {
            router.replace("/(tabs)/dashboard");
          }
        }
      } catch (err) {
        console.log("No session");

        const inAuthScreen = (segments.length as number) === 0;

        // 🔥 ONLY redirect if NOT already on login
        if (!inAuthScreen) {
          router.replace("/");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}
