import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: string;
  error?: string;
  editable?: boolean;
};

export default function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  icon,
  error,
  editable = true,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputBox,
          isFocused && styles.focusedBox,
          !editable && { backgroundColor: "#eee" },
          error && styles.errorBox,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={isFocused ? "#4CAF50" : "#777"}
            style={{ marginRight: 8 }}
          />
        )}

        <TextInput
          style={[styles.input, !editable && { color: "#999" }]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#999"
          editable={editable}
        />

        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={20}
              color="#777"
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#333",
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  focusedBox: {
    borderColor: "#4CAF50",
  },

  errorBox: {
    borderColor: "#F44336",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  errorText: {
    marginTop: 4,
    color: "#F44336",
    fontSize: 12,
  },
});
