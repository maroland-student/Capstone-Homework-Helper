import { useState } from "react";
import { StyleSheet, View } from "react-native";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

export default function LoginScreen() {
  const [showSignup, setShowSignup] = useState(false);

  const handleSignupPress = () => {
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
  };

  return (
    <View style={styles.container}>
      {showSignup ? (
        <SignupForm onBackToLogin={handleBackToLogin} />
      ) : (
        <LoginForm onSignupPress={handleSignupPress} />
      )}

      <View style={styles.testContainer}></View>
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
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  testContainer: {
    marginTop: 20,
    width: "100%",
    maxWidth: 400,
  },
});
