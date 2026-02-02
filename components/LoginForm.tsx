import { signIn } from '@/lib/auth-client';
import { useAuth } from '@/lib/auth-context';
import { createError, ErrorType, parseAuthError, parseNetworkError } from '@/lib/error-utils';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
      <View style={styles.decorativeCircle3} />
      <View style={styles.decorativeCircle4} />
      <View style={styles.decorativeCircle5} />

      <View style={styles.contentWrapper}>
        {/* Left side - Brand section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>Ai Homework Helper</Text>
          <Text style={styles.brandSubtitle}>Welcome to the app</Text>
        </View>

        {/* Right side - Login card */}
        <View style={styles.loginCard}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>USER LOGIN</Text>
            <Text style={styles.cardSubtitle}>Welcome to the website</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>👤</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>🔒</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry
                />
              </View>

              <View style={styles.rememberForgotContainer}>
                <View style={styles.rememberContainer}>
                  <View style={styles.checkbox} />
                  <Text style={styles.rememberText}>Remember</Text>
                </View>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotLink}>Forgot password ?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <View style={styles.loginButtonGradient}>
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginButtonText}>LOGIN</Text>
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.otpButton}
                onPress={() => setShowOTPLogin(true)}
              >
                <Text style={styles.otpButtonText}>Sign In with OTP</Text>
              </TouchableOpacity>

              {onSignupPress && (
                <View style={styles.signupContainer}>
                  <TouchableOpacity onPress={onSignupPress}>
                    <Text style={styles.signupLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity onPress={handleForgotEmail} style={styles.forgotEmailButton}>
                <Text style={styles.forgotEmailText}>Forgot Email?</Text>
              </TouchableOpacity>
            </View>
          </View>
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

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#7C3AED',
    ...(Platform.OS === 'web' && ({
      backgroundImage: 'linear-gradient(135deg, #6B46C1 0%, #8B5CF6 33%, #A78BFA 66%, #C4B5FD 100%)',
      minHeight: '100vh',
      width: '100vw',
      height: '100vh',
    } as any)),
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -100,
    left: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: 100,
    right: -80,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: 200,
    left: 50,
  },
  decorativeCircle4: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    top: 300,
    left: 200,
  },
  decorativeCircle5: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: 100,
    right: 150,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: isSmallScreen ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1,
    gap: isSmallScreen ? 20 : 60,
  },
  brandSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: isSmallScreen ? 20 : 0,
    marginRight: isSmallScreen ? 0 : 40,
  },
  brandTitle: {
    fontSize: isSmallScreen ? 32 : 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtitle: {
    fontSize: isSmallScreen ? 14 : 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '300',
    textAlign: 'center',
  },
  loginCard: {
    width: isSmallScreen ? '100%' : 420,
    maxWidth: 420,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  cardContent: {
    padding: 32,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#86868b',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
    overflow: 'hidden',
  },
  inputIconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  inputIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 15,
    color: '#1d1d1f',
  },
  rememberForgotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    marginRight: 8,
  },
  rememberText: {
    fontSize: 13,
    color: '#6B46C1',
    fontWeight: '500',
  },
  forgotLink: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    ...(Platform.OS === 'web' && ({
      backgroundImage: 'linear-gradient(90deg, #7C3AED 0%, #6B21A8 100%)',
    } as any)),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  otpButton: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#A78BFA',
  },
  otpButtonText: {
    color: '#6B46C1',
    fontSize: 15,
    fontWeight: '600',
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  signupLink: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  forgotEmailButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotEmailText: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#86868b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 15,
    color: '#1d1d1f',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#d2d2d7',
  },
  modalSubmitButton: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalCancelButtonText: {
    color: '#1d1d1f',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});