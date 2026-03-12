import { account } from "../services/appwrite"; // ✅ import your appwrite.tsx config
import { Slot, useRouter} from "expo-router";
import { useEffect, useState } from "react";

export default function Layout() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // ✅ Check Appwrite session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await account.get(); // fetch current user
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // ✅ Handle redirects based on auth state
  useEffect(() => {
    if (isAuthenticated === null) return; // wait until auth check completes

    if (!isAuthenticated) {
      router.replace("/"); // guest → login
    } else if (isAuthenticated) {
      router.replace("/(tabs)/dashboard"); // logged-in → seeker dashboard
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    // ✅ simple splash/loading screen
    return null;
  }
  return (
        <Slot /> 
  );
}
