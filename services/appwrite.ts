import { Client, Account, Databases, Storage } from "react-native-appwrite";

export const client = new Client();

client
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6988c3bb0022f94e6b3d")
  .setPlatform("com.hanif_jamadar.worktrack");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
