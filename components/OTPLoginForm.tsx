import { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { emailOtp, signIn } from '../lib/auth-client';

const COOLDOWN_TIME = 30;

interface OTPLoginFormProps {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onBack?: () => void;
}

type Step = 'email' | 'otp' | 'password-reset';

export default function OTPLoginForm({ 
  onSuccess, 
  onError, 
  onBack 
}: OTPLoginFormProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [cooldown, setCooldown] = useState(0);

  const [otpSent, setOtpSent] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const sendOTP = async (type: 'sign-in' | 'forget-password') => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await emailOtp.sendVerificationOtp({
        email,
        type,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send OTP');
        onError?.(error);
      } else {
        setOtpSent(true);
        setStep('otp');
        Alert.alert('Success', 'OTP sent successfully! Check your email.');

        setCooldown(COOLDOWN_TIME);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signIn.emailOtp({
        email,
        otp,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Invalid OTP');
        setAttempts(prev => prev + 1);
        onError?.(error);
      } else {
        Alert.alert('Success', 'Signed in successfully!');
        onSuccess?.(data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgetPassword = async () => {
    await sendOTP('forget-password');
  };

  const handleResend = async () => {

    if (isResending) {
      Alert.alert('Please Wait! We are sending a new code...');
      return;
    }

    if (cooldown > 0) {
      Alert.alert('Attention', `Please wait ${cooldown} second${cooldown === 1 ? '' : 's'} before you resend.`);
      return;
    }
    setIsResending(true);
    await sendOTP('sign-in');
    setIsResending(false);


  };

  useEffect(() =>  {
    if (cooldown <= 0) {
      return;
    }
    const downTime = setInterval(() => {
      setCooldown((s) => (s>0 ? s-1 : 0));
    }, 1000);

    return () => clearInterval(downTime);
  }, 
  
  [cooldown > 0]

);



  const renderEmailStep = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In with Email</Text>
      <Text style={styles.description}>
        Enter your email address and we'll send you a verification code.
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => sendOTP('sign-in')}
        disabled={isLoading || !email}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.forgetPasswordButton}
        onPress={handleForgetPassword}
        disabled={isLoading}
      >
        <Text style={styles.forgetPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.description}>
        We've sent a 6-digit code to {email}. Enter it below to sign in.
      </Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter 6-digit code"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={verifyOTP}
        disabled={isLoading || !otp || otp.length !== 6}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify & Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, (isResending || cooldown > 0 )&& styles.buttonDisabled]}
        onPress={handleResend}
          // keeping the button 'looking' disabled, but still going through a 'press' scenario
        accessibilityState={{ disabled: isResending || cooldown > 0}}
      >
        {isResending ? (
          <ActivityIndicator color="#007AFF" />
        ) : cooldown > 0 ? (
          <Text style={styles.resendButtonText}>PLEASE WAIT! You are able to Resend in {cooldown} seconds</Text>
        ) : (
          <Text style={styles.resendButtonText}>Resend One-time Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('email')}
      >
        <Text style={styles.backButtonText}>← Change Email</Text>
      </TouchableOpacity>

      {attempts > 0 && (
        <Text style={styles.attemptsText}>
          Attempts: {attempts}/3
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {step === 'email' && renderEmailStep()}
      {step === 'otp' && renderOTPStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 15,
  },
  resendButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  forgetPasswordButton: {
    padding: 10,
    alignSelf: 'center',
    marginBottom: 15,
  },
  forgetPasswordText: {
    color: '#007AFF',
    fontSize: 16,
  },
  backButton: {
    padding: 10,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  attemptsText: {
    textAlign: 'center',
    color: '#ff6b6b',
    fontSize: 14,
    marginTop: 10,
  },
});
