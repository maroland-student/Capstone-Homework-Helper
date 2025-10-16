import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { signIn, signUp } from '../lib/auth-client';
import { useAuth } from '../lib/auth-context';

export default function AuthTest() {
  const { user, loading, signOut } = useAuth();

  const handleTestSignUp = async () => {
    try {
      const { data, error } = await signUp.email({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        image: undefined,
        callbackURL: "/(tabs)/explore"
      });
      
      if (data) {
        Alert.alert('Success', 'Test user created successfully!');
      } else {
        Alert.alert('Error', error?.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Signup failed');
    }
  };

  const handleTestSignIn = async () => {
    try {
      const { data, error } = await signIn.email({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      });
      
      if (data) {
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Error', error?.message || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Test</Text>
      
      {user ? (
        <View>
          <Text style={styles.text}>Welcome, {user.name || user.email}!</Text>
          <TouchableOpacity style={styles.button} onPress={signOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.text}>Not signed in</Text>
          <TouchableOpacity style={styles.button} onPress={handleTestSignUp}>
            <Text style={styles.buttonText}>Test Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleTestSignIn}>
            <Text style={styles.buttonText}>Test Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
