import { signIn } from '@/lib/auth-client';
import { createError, ErrorType, parseAuthError, parseNetworkError } from '@/lib/error-utils';
import { router } from 'expo-router';
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

interface LoginData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSignupPress?: () => void;
}

export default function LoginForm({ onSignupPress }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      const error = createError(
        ErrorType.REQUIRED_FIELD,
        'Email and password are required',
        'Please enter both email and password'
      );
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.userMessage}`);
      } else {
        Alert.alert('Error', error.userMessage);
      }
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: true
      });
      
      console.log('Login response - data:', data);
      console.log('Login response - error:', error);
      
      if (data) {
        console.log('Login successful:', data);
        // navigation will be handled by the parent component
        router.replace('/(tabs)/explore');
      } else if (error) {
        const appError = parseAuthError(error);
        console.error(`[${appError.type}] Login error:`, appError.message);
        
        if (Platform.OS === 'web') {
          window.alert(`Error: ${appError.userMessage}`);
        } else {
          Alert.alert('Error', appError.userMessage);
        }
      } else {
        console.log('No data or error returned from login');
        const error = createError(
          ErrorType.INVALID_CREDENTIALS,
          'No response from server',
          'Invalid email or password'
        );
        
        if (Platform.OS === 'web') {
          window.alert(`Error: ${error.userMessage}`);
        } else {
          Alert.alert('Error', error.userMessage);
        }
      }
    } catch (error: any) {
      const appError = parseNetworkError(error);
      console.error(`[${appError.type}] Login error:`, appError.message);
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${appError.userMessage}`);
      } else {
        Alert.alert('Error', appError.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => setFormData({ ...formData, password: text })}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Having trouble signing in? Make sure you're using the correct email and password.
          </Text>
        </View>
        
        {onSignupPress && (
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onSignupPress}>
              <Text style={styles.signupLink}>Sign up</Text>
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  helpContainer: {
    marginTop: 15,
    paddingHorizontal: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});
