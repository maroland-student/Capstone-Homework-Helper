import { signIn } from '@/lib/auth-client';
import { useAuth } from '@/lib/auth-context';
import { createError, ErrorType, parseAuthError, parseNetworkError } from '@/lib/error-utils';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import OTPLoginForm from './OTPLoginForm';
import PasswordResetForm from './PasswordResetForm';

interface LoginData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSignupPress?: () => void;
}

export default function LoginForm({ onSignupPress }: LoginFormProps) {
  const { setHasExplicitlyLoggedIn } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showForgotEmailModal, setShowForgotEmailModal] = useState(false);
  const [showOTPLogin, setShowOTPLogin] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [recoveryData, setRecoveryData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleForgotEmail = () => {
    setShowForgotEmailModal(true);
  };

  const handleEmailRecovery = async () => {
    if (!recoveryData.firstName || !recoveryData.lastName || !recoveryData.phoneNumber) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in all fields');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
      return;
    }

    try {
      setRecoveryLoading(true);
      // add function to recover email tmmr
      // call better auth post request to recover email
      console.log('Email recovery requested for:', recoveryData);
      
      // add api call to recover email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (Platform.OS === 'web') {
        window.alert('Account information sent to your registered email address');
      } else {
        Alert.alert('Success', 'Account information sent to your registered email address');
      }
      
      setShowForgotEmailModal(false);
      setRecoveryData({ firstName: '', lastName: '', phoneNumber: '' });
    } catch (error) {
      console.error('Email recovery error:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to recover account information. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to recover account information. Please try again.');
      }
    } finally {
      setRecoveryLoading(false);
    }
  };

  const closeForgotEmailModal = () => {
    setShowForgotEmailModal(false);
    setRecoveryData({ firstName: '', lastName: '', phoneNumber: '' });
  };

  const handleOTPLoginSuccess = (data: any) => {
    console.log('OTP Login successful:', data);
    setHasExplicitlyLoggedIn(true);
    router.replace('/(tabs)/welcome-dashboard');
  };

  const handleOTPLoginError = (error: any) => {
    console.error('OTP Login error:', error);
  };

  const handlePasswordResetSuccess = (data: any) => {
    console.log('Password reset successful:', data);
    setShowPasswordReset(false);
    setResetEmail('');
    Alert.alert('Success', 'Password reset successfully! You can now sign in with your new password.');
  };

  const handlePasswordResetError = (error: any) => {
    console.error('Password reset error:', error);
    Alert.alert('Error', 'Password reset failed. Please try again.');
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your email address');
      } else {
        Alert.alert('Error', 'Please enter your email address');
      }
      return;
    }

    try {
      setResetLoading(true);
      console.log('Password reset requested for:', resetEmail);
      
      // Use the new OTP-based password reset
      const { emailOtp } = await import('@/lib/auth-client');
      const { data, error } = await emailOtp.sendVerificationOtp({
        email: resetEmail,
        type: 'forget-password',
      });
      
      if (error) {
        if (Platform.OS === 'web') {
          window.alert(`Error: ${error.message || 'Failed to send password reset OTP'}`);
        } else {
          Alert.alert('Error', error.message || 'Failed to send password reset OTP');
        }
      } else {
        // Show the password reset form with OTP input
        setShowForgotPasswordModal(false);
        setShowPasswordReset(true);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to send password reset OTP. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to send password reset OTP. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setResetEmail('');
  };

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
        setHasExplicitlyLoggedIn(true);
        router.replace('/(tabs)/welcome-dashboard');
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

  if (showOTPLogin) {
    return (
      <OTPLoginForm
        onSuccess={handleOTPLoginSuccess}
        onError={handleOTPLoginError}
        onBack={() => setShowOTPLogin(false)}
      />
    );
  }

  if (showPasswordReset) {
    return (
      <PasswordResetForm
        email={resetEmail}
        onSuccess={handlePasswordResetSuccess}
        onError={handlePasswordResetError}
        onBack={() => setShowPasswordReset(false)}
      />
    );
  }

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
        
        <View style={styles.forgotContainer}>
          <TouchableOpacity onPress={handleForgotEmail}>
            <Text style={styles.forgotLink}>Forgot Email?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
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

        <TouchableOpacity 
          style={styles.otpLink} 
          onPress={() => setShowOTPLogin(true)}
        >
          <Text style={styles.otpLinkText}>Sign In with OTP</Text>
        </TouchableOpacity>
        
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            Having trouble signing in? Try using OTP or make sure you're using the correct email and password.
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

      {}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeForgotPasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter the email address associated with your account and we'll send you a verification code to reset your password.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email address"
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeForgotPasswordModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, resetLoading && styles.modalButtonDisabled]}
                onPress={handlePasswordReset}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={showForgotEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeForgotEmailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Recover Email Address</Text>
            <Text style={styles.modalSubtitle}>
              Enter your account details below and we'll send your email address to your registered contact information.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              value={recoveryData.firstName}
              onChangeText={(text) => setRecoveryData({ ...recoveryData, firstName: text })}
              autoCapitalize="words"
              autoFocus
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              value={recoveryData.lastName}
              onChangeText={(text) => setRecoveryData({ ...recoveryData, lastName: text })}
              autoCapitalize="words"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              value={recoveryData.phoneNumber}
              onChangeText={(text) => setRecoveryData({ ...recoveryData, phoneNumber: text })}
              keyboardType="phone-pad"
            />
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeForgotEmailModal}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, recoveryLoading && styles.modalButtonDisabled]}
                onPress={handleEmailRecovery}
                disabled={recoveryLoading}
              >
                {recoveryLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>Recover Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  otpLink: {
    padding: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  otpLinkText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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
  forgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  forgotLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalInput: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalSubmitButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
