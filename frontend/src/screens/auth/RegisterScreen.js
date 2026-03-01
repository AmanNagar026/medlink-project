import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { validateEmail } from "../../utils/helpers";
import ECGLogo from "../../components/ECGLogo";

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [role, setRole] = useState("PATIENT");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    licenseNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!validateEmail(form.email)) e.email = "Enter a valid email";
    if (!form.password || form.password.length < 6)
      e.password = "At least 6 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (role === "DOCTOR") {
      if (!form.specialization.trim())
        e.specialization = "Specialization is required";
      if (!form.licenseNumber.trim())
        e.licenseNumber = "License number is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const registerData = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phoneNumber: "",
        role: role,
        specialization: form.specialization || "General",
        licenseNumber: form.licenseNumber || "",
      };
      await register(registerData);
      Alert.alert(
        "Success",
        "You have been successfully registered! Please sign in to continue.",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1e6f78", "#1b5f67", "#143f47"]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.logoCircle}>
              <ECGLogo size={60} />
            </View>

            <Text style={styles.title}>Join MedLink</Text>
            <Text style={styles.subtitle}>Create your account</Text>

            {/* Role Switch */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  role === "PATIENT" && styles.roleActive,
                ]}
                onPress={() => setRole("PATIENT")}
              >
                <Text
                  style={
                    role === "PATIENT"
                      ? styles.roleTextActive
                      : styles.roleText
                  }
                >
                  Patient
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleBtn,
                  role === "DOCTOR" && styles.roleActive,
                ]}
                onPress={() => setRole("DOCTOR")}
              >
                <Text
                  style={
                    role === "DOCTOR"
                      ? styles.roleTextActive
                      : styles.roleText
                  }
                >
                  Doctor
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={[styles.input, errors.name && styles.inputError]} 
              placeholder="John Doe" 
              value={form.name}
              onChangeText={(v) => set("name", v)}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={[styles.input, errors.email && styles.inputError]} 
              placeholder="your.email@example.com" 
              value={form.email}
              onChangeText={(v) => set("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={[styles.input, errors.password && styles.inputError]} 
              secureTextEntry 
              placeholder="••••••••" 
              value={form.password}
              onChangeText={(v) => set("password", v)}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput 
              style={[styles.input, errors.confirmPassword && styles.inputError]} 
              secureTextEntry 
              placeholder="••••••••" 
              value={form.confirmPassword}
              onChangeText={(v) => set("confirmPassword", v)}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            {role === "DOCTOR" && (
              <>
                <Text style={styles.label}>Specialization</Text>
                <TextInput 
                  style={[styles.input, errors.specialization && styles.inputError]} 
                  placeholder="Cardiology" 
                  value={form.specialization}
                  onChangeText={(v) => set("specialization", v)}
                />
                {errors.specialization && <Text style={styles.errorText}>{errors.specialization}</Text>}

                <Text style={styles.label}>License Number</Text>
                <TextInput 
                  style={[styles.input, errors.licenseNumber && styles.inputError]} 
                  placeholder="License #" 
                  value={form.licenseNumber}
                  onChangeText={(v) => set("licenseNumber", v)}
                />
                {errors.licenseNumber && <Text style={styles.errorText}>{errors.licenseNumber}</Text>}
              </>
            )}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing up..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerRow}>
              <Text style={{ color: "#666" }}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}> Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1e6f78",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  roleContainer: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  roleActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  roleTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e6f78",
  },
  label: {
    alignSelf: "flex-start",
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  button: {
    width: "100%",
    height: 48,
    backgroundColor: "#1e6f78",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    marginTop: 20,
  },
  link: {
    color: "#1e6f78",
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default RegisterScreen;
