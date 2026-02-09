import { account, databases } from "./appwrite";
import { ID } from "appwrite";
import { APPWRITE_CONFIG } from "../constants/config";

export const signupUser = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    // create auth account
    const user = await account.create(ID.unique(), email, password, name);

    // create profile in database
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

    return user;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    throw error;
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
  await account.deleteSession("current");
};
