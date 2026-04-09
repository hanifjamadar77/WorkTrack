import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { APPWRITE_CONFIG } from "@/constants/config";
import { account, databases } from "@/services/appwrite";
import { router } from "expo-router";
import { Query } from "react-native-appwrite";
import AppInput from "../components/Input";
import { loginUser } from "../services/authServices";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
      return;
    }

    try {
      await loginUser(email, password);

      // 🔥 Get current user
      const user = await account.get();

      // 🔥 Fetch user profile from DB
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.DATABASE_ID,
        APPWRITE_CONFIG.USER_COLLECTION_ID,
        [Query.equal("userId", user.$id)],
      );

      if (response.documents.length === 0) {
        Alert.alert("Error", "User profile not found");
        return;
      }

      const currentUser = response.documents[0];

      // 🔥 Navigate based on role
      if (currentUser.role === "admin") {
        router.replace("./admin/(tabs)/dashboard"); // 👈 create this later
      } else {
        router.replace("./(tabs)/dashboard");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Image */}
        <ImageBackground
          source={require("../assets/images/bg.jpg")}
          style={styles.topImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to continue</Text>
          </View>
        </ImageBackground>

        {/* Login Form */}
        <ScrollView contentContainerStyle={styles.formContainer}>
          <View style={styles.card}>
            <AppInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon="mail"
            />

            <AppInput
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock-closed"
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("./signup")}>
              <Text style={styles.link}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topImage: {
    height: 300,
    justifyContent: "flex-end",
  },

  overlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#eee",
    marginTop: 4,
  },

  formContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f6f6f6",
    marginTop: -10,
  },

  card: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },

  loginBtn: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    marginTop: 14,
    color: "#0681b8",
    fontWeight: "bold",
    fontSize: 16,
  },
});
