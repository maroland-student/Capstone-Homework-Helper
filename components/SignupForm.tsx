import { signUp } from '@/lib/auth-client';
import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface SignupData {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

interface SignupFormProps {
  onBackToLogin?: () => void;
}

export default function SignupForm({ onBackToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState<SignupData>({
    email: '',
    password: '',
    name: '',
    firstName: '',
    lastName: ''
  });
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // validation
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttempt;
    if (timeSinceLastAttempt < 4000) {
      const remainingTime = Math.ceil((4000 - timeSinceLastAttempt) / 1000);
      Alert.alert('Please wait', `Please wait ${remainingTime} more seconds before trying again.`);
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
      });
      
      console.log('Signup response - data:', data);
      console.log('Signup response - error:', error);
      
      if (data) {
        console.log('Signup successful:', data);
        //success message
        if (Platform.OS === 'web') {
          // for web, use window.alert as fallback
          window.alert('Account Created!\n\nYour account has been created successfully! You can now sign in.');
          if (onBackToLogin) {
            onBackToLogin();
          }
        } else {
          Alert.alert(
            'Account Created!', 
            'Your account has been created successfully! You can now sign in.', 
            [
              { text: 'OK', onPress: () => {
                if (onBackToLogin) {
                  onBackToLogin();
                }
              }}
            ]
          );
        }
      } else if (error) {
        console.error('Signup error:', error);
        if (Platform.OS === 'web') {
          window.alert('Error: ' + (error.message || 'Failed to create account. Please try again.'));
        } else {
          Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
        }
      } else {
        // case where neither data nor error is returned
        console.log('No data or error returned from signup');
        if (Platform.OS === 'web') {
          window.alert('Account Created!\n\nYour account has been created successfully! You can now sign in.');
          if (onBackToLogin) {
            onBackToLogin();
          }
        } else {
          Alert.alert(
            'Account Created!', 
            'Your account has been created successfully! You can now sign in.', 
            [
              { text: 'OK', onPress: () => {
                if (onBackToLogin) {
                  onBackToLogin();
                }
              }}
            ]
          );
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
        <Text style={styles.hint}>Password must be at least 6 characters long</Text>
        
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: -10,
    marginBottom: 15,
    marginLeft: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
