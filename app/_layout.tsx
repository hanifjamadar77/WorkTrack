import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { account } from "../services/appwrite";

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
        </>
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
  );
}
