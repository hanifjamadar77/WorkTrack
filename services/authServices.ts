import { ID, Query } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../constants/config";
import { account, databases } from "./appwrite";

export const signupUser = async (
  email: string,
  password: string,
  name: string,
) => {
  try {
    // 1️⃣ Create authentication user
    await account.create(
      ID.unique(),
      email.trim(),
      password.trim(),
      name.trim(),
    );

    // 2️⃣ Login immediately
    await account.createEmailPasswordSession(email.trim(), password.trim());

    // 3️⃣ Get current user
    const user = await account.get();

    // 4️⃣ Create profile document in database
    await databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.USER_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        name: name.trim(),
        email: email.trim(),
        daySalary: 0,
        nightSalary: 0,
        halfDaySalary: 0,
        avatar: "",
      },
    );
  } catch (error: any) {
    console.log("SIGNUP ERROR:", error);
    throw new Error(error?.message || "Signup failed");
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    await account.createEmailPasswordSession(email.trim(), password.trim());
  } catch (error: any) {
    console.log("LOGIN ERROR:", error?.message);
    throw new Error(error?.message || "Login failed");
  }
};

// export const getCurrentUser = async () => {
//   try {
//     return await account.get();
//   } catch (error) {
//     return null;
//   }
// };

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw new Error("No user logged in");

    const currentUser = await databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.USER_COLLECTION_ID,
      [Query.equal("accountId", [currentAccount.$id])]
    );

    if (!currentUser || currentUser.total === 0)
      throw new Error("User not found");

    return currentUser.documents[0];
  } catch (e : any) {
    console.error("❌ getCurrentUser error:", e);
    throw new Error(e?.message || "Failed to fetch user");
  }
};

export const logoutUser = async () => {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.log("Logout error:", error);
  }
};
