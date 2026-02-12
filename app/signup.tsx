import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { router } from "expo-router";
import { signupUser } from "../services/authServices";
import AppInput from "../components/Input";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      await signupUser(email, password, name);
      Alert.alert("Success", "Account created successfully");
      router.replace("./(tabs)/dashboard");
    } catch (err: any) {
      Alert.alert("Signup Failed", err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Image */}
        <ImageBackground
          source={require("../assets/images/thomas-shelby.jpg")}
          style={styles.topImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your work</Text>
          </View>
        </ImageBackground>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.card}>

            <AppInput
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              icon="person"
            />

            <AppInput
              label="Email"
              placeholder="Enter email"
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

            <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
              <Text style={styles.signupText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.link}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topImage: {
    height: 260,
    justifyContent: "flex-end"
  },

  overlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 20
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold"
  },

  subtitle: {
    color: "#eee",
    marginTop: 4
  },

  formContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f6f6f6",
    marginTop: -40
  },

  card: {
    backgroundColor: "#fff",
    padding: 22,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6
  },

  signupBtn: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10
  },

  signupText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },

  link: {
    marginTop: 18,
    textAlign: "center",
    color: "#4CAF50",
    fontWeight: "600"
  }
});
