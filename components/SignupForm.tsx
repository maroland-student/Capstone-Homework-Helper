import { signUp } from "@/lib/auth-client";
import { useState } from "react";

import {
  createError,
  ErrorType,
  parseAuthError,
  parseNetworkError,
} from "@/lib/error-utils";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface SignupData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: "teacher" | "student";
}

interface SignupFormProps {
  onBackToLogin?: () => void;
}

export default function SignupForm({ onBackToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({
    email: "",
    password: "",
    name: "",
    firstName: "",
    lastName: "",
    role: "student",
  });
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const missingFields = [];
    if (!formData.name.trim()) missingFields.push("Full Name");
    if (!formData.email.trim()) missingFields.push("Email");
    if (!formData.password.trim()) missingFields.push("Password");

    if (missingFields.length > 0) {
      const error = createError(
        ErrorType.REQUIRED_FIELD,
        `Missing required fields: ${missingFields.join(", ")}`,
        "Required forms must be filled out"
      );

      if (Platform.OS === "web") {
        window.alert(`Error: ${error.userMessage}`);
      } else {
        Alert.alert("Error", error.userMessage);
      }
      return;
    }

    if (formData.password.length < 6) {
      const error = createError(
        ErrorType.PASSWORD_TOO_SHORT,
        "Password must be at least 6 characters long",
        "Password must be at least 6 characters long"
      );

      if (Platform.OS === "web") {
        window.alert(`Error: ${error.userMessage}`);
      } else {
        Alert.alert("Error", error.userMessage);
      }
      return;
    }

    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttempt;
    if (timeSinceLastAttempt < 4000) {
      const remainingTime = Math.ceil((4000 - timeSinceLastAttempt) / 1000);
      const error = createError(
        ErrorType.INTERNAL_ERROR,
        `Rate limit: Please wait ${remainingTime} more seconds`,
        `Please wait ${remainingTime} more seconds before trying again.`
      );

      if (Platform.OS === "web") {
        window.alert(`Please wait: ${error.userMessage}`);
      } else {
        Alert.alert("Please wait", error.userMessage);
      }
      return;
    }

    try {
      setLoading(true);
      setLastSignupAttempt(now);

      const { data, error } = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        image: undefined,
        role: formData.role,
      } as any);

      console.log("Signup response - data:", data);
      console.log("Signup response - error:", error);

      if (data) {
        console.log("Signup successful:", data);
        if (Platform.OS === "web") {
          window.alert(
            "Account Created!\n\nYour account has been created successfully! You can now sign in."
          );
          if (onBackToLogin) {
            onBackToLogin();
          }
        } else {
          Alert.alert(
            "Account Created!",
            "Your account has been created successfully! You can now sign in.",
            [
              {
                text: "OK",
                onPress: () => {
                  if (onBackToLogin) {
                    onBackToLogin();
                  }
                },
              },
            ]
          );
        }
      } else if (error) {
        const appError = parseAuthError(error);
        console.error(`[${appError.type}] Signup error:`, appError.message);

        if (Platform.OS === "web") {
          window.alert(`Error: ${appError.userMessage}`);
        } else {
          Alert.alert("Error", appError.userMessage);
        }
      } else {
        console.log("No data or error returned from signup");
        if (Platform.OS === "web") {
          window.alert(
            "Account Created!\n\nYour account has been created successfully! You can now sign in."
          );
          if (onBackToLogin) {
            onBackToLogin();
          }
        } else {
          Alert.alert(
            "Account Created!",
            "Your account has been created successfully! You can now sign in.",
            [
              {
                text: "OK",
                onPress: () => {
                  if (onBackToLogin) {
                    onBackToLogin();
                  }
                },
              },
            ]
          );
        }
      }
    } catch (error: any) {
      const appError = parseNetworkError(error);
      console.error(`[${appError.type}] Signup error:`, appError.message);

      if (Platform.OS === "web") {
        window.alert(`Error: ${appError.userMessage}`);
      } else {
        Alert.alert("Error", appError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Email *"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password *"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />
        <Text style={styles.hint}>
          Password must be at least 6 characters long
        </Text>

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>I am a: *</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === "student" && styles.roleButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, role: "student" })}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === "student" && styles.roleButtonTextActive,
                ]}
              >
                Student
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleButton,
                formData.role === "teacher" && styles.roleButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, role: "teacher" })}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  formData.role === "teacher" && styles.roleButtonTextActive,
                ]}
              >
                Teacher
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="First Name (Optional)"
          value={formData.firstName}
          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Last Name (Optional)"
          value={formData.lastName}
          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          autoCapitalize="words"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {onBackToLogin && (
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onBackToLogin}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  form: {
    width: "100%",
    maxWidth: 300,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
  },
  roleContainer: {
    marginBottom: 15,
  },
  roleLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "500",
  },
  roleButtons: {
    flexDirection: "row",
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    backgroundColor: "white",
    alignItems: "center",
  },
  roleButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#E8F4FF",
  },
  roleButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  roleButtonTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
  },
  loginLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
