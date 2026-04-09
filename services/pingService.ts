import { account } from "./appwrite";

/**
 * Simple ping to keep Appwrite project active
 */
export const pingServer = async () => {
  try {
    const res = await account.get(); // 🔥 counts as activity
    console.log("✅ Appwrite Ping Success:", res.$id);
  } catch (error) {
    console.log("❌ Appwrite Ping Failed:", error);
  }
};