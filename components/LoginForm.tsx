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
      console.log('Email recovery requested for:', recoveryData);

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
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#86868b"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#86868b"
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
            style={styles.otpButton}
            onPress={() => setShowOTPLogin(true)}
          >
            <Text style={styles.otpButtonText}>Sign In with OTP</Text>
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
      </View>

      {/* Forgot Password Modal */}
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
              placeholderTextColor="#86868b"
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
                  <Text style={styles.modalSubmitButtonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Forgot Email Modal */}
      <Modal
        visible={showForgotEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeForgotEmailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Recover Email</Text>
            <Text style={styles.modalSubtitle}>
              Enter your account details and we'll send your email address to your registered contact information.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="First Name"
              placeholderTextColor="#86868b"
              value={recoveryData.firstName}
              onChangeText={(text) => setRecoveryData({ ...recoveryData, firstName: text })}
              autoCapitalize="words"
              autoFocus
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Last Name"
              placeholderTextColor="#86868b"
              value={recoveryData.lastName}
              onChangeText={(text) => setRecoveryData({ ...recoveryData, lastName: text })}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Phone Number"
              placeholderTextColor="#86868b"
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
                  <Text style={styles.modalSubmitButtonText}>Recover</Text>
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
    backgroundColor: '#fbfbfd',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1d1d1f',
    letterSpacing: -0.68,
  },
  subtitle: {
    fontSize: 17,
    color: '#86868b',
    marginBottom: 40,
    fontWeight: '400',
    letterSpacing: -0.17,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f5f5f7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 17,
    color: '#1d1d1f',
    borderWidth: 0,
    fontFamily: Platform.select({
      ios: 'SF Pro Text',
      android: 'sans-serif',
      default: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    }),
  },
  button: {
    backgroundColor: '#a78bfa',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.17,
  },
  otpButton: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpButtonText: {
    color: '#1d1d1f',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.17,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 15,
    color: '#86868b',
    fontWeight: '400',
  },
  signupLink: {
    fontSize: 15,
    color: '#a78bfa',
    fontWeight: '500',
  },
  forgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  forgotLink: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '500',
  },
  helpContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f7',
    padding: 16,
    borderRadius: 12,
  },
  helpText: {
    fontSize: 13,
    color: '#86868b',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.44,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#86868b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 21,
    fontWeight: '400',
  },
  modalInput: {
    backgroundColor: '#f5f5f7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 17,
    color: '#1d1d1f',
    borderWidth: 0,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d2d2d7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalSubmitButton: {
    backgroundColor: '#a78bfa',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  modalButtonDisabled: {
    opacity: 0.4,
  },
  modalCancelButtonText: {
    color: '#1d1d1f',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.17,
  },
  modalSubmitButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.17,
  },
});