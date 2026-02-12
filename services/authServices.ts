import { account, databases } from "./appwrite";
import { ID } from "react-native-appwrite";
import { APPWRITE_CONFIG } from "../constants/config";

export const signupUser = async (email: string, password: string, name: string) => {
  try {
    // STEP 1: create auth user
    await account.create(ID.unique(), email, password, name);

    // STEP 2: login immediately
    await account.createEmailPasswordSession(email, password);

    const user = await account.get();

    // STEP 3: create profile
    await databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.USER_COLLECTION_ID,
      ID.unique(),
      {
        userId: user.$id,
        name,
        email,
        avatar: "",
        daySalary: 0,
        nightSalary: 0,
        halfDaySalary: 0
      }
    );

  } catch (error: any) {
    console.log("SIGNUP ERROR:", error);
    throw new Error(error.message);
  }
};


export const loginUser = async (email: string, password: string) => {
  try {
    await account.createEmailPasswordSession(email, password);
  } catch (error: any) {
    console.log("LOGIN ERROR:", error);
    throw new Error("Invalid email or password");
  }
};



export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
};


export const logoutUser = async () => {
  try {
    await account.deleteSession("current");
  } catch (error) {
    console.log("Logout error:", error);
  }
};

