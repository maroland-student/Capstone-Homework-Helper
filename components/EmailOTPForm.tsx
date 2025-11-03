import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { emailOtp, signIn } from '../lib/auth-client';

interface EmailOTPFormProps {
  email: string;
  type: 'sign-in' | 'email-verification' | 'forget-password';
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onBack?: () => void;
}

export default function EmailOTPForm({ 
  email, 
  type, 
  onSuccess, 
  onError, 
  onBack 
}: EmailOTPFormProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const getTitle = () => {
    switch (type) {
      case 'sign-in':
        return 'Sign In with OTP';
      case 'email-verification':
        return 'Verify Your Email';
      case 'forget-password':
        return 'Reset Password';
      default:
        return 'Enter OTP';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'sign-in':
        return `We've sent a 6-digit code to ${email}. Enter it below to sign in.`;
      case 'email-verification':
        return `We've sent a 6-digit verification code to ${email}. Enter it below to verify your email.`;
      case 'forget-password':
        return `We've sent a 6-digit code to ${email}. Enter it below to reset your password.`;
      default:
        return `We've sent a 6-digit code to ${email}. Enter it below.`;
    }
  };

  const sendOTP = async () => {
    setIsResending(true);
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
        Alert.alert('Success', 'OTP sent successfully! Check your email.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
      onError?.(err);
    } finally {
      setIsResending(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      if (type === 'sign-in') {
        result = await signIn.emailOtp({
          email,
          otp,
        });
      } else if (type === 'email-verification') {
        result = await emailOtp.verifyEmail({
          email,
          otp,
        });
      } else if (type === 'forget-password') {
        const checkResult = await emailOtp.checkVerificationOtp({
          email,
          type: 'forget-password',
          otp,
        });
        
        if (checkResult.error) {
          Alert.alert('Error', checkResult.error.message || 'Invalid OTP');
          setAttempts(prev => prev + 1);
          return;
        }
        

        Alert.alert('Success', 'OTP verified! You can now reset your password.');
        onSuccess?.(checkResult.data);
        return;
      }

      if (result?.error) {
        Alert.alert('Error', result.error.message || 'Invalid OTP');
        setAttempts(prev => prev + 1);
        onError?.(result.error);
      } else {
        Alert.alert('Success', 'OTP verified successfully!');
        onSuccess?.(result?.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      onError?.(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    await sendOTP();
  };


  React.useEffect(() => {
    if (!otpSent) {
      sendOTP();
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.description}>{getDescription()}</Text>
      
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
          <Text style={styles.buttonText}>Verify OTP</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, isResending && styles.buttonDisabled]}
        onPress={handleResend}
        disabled={isResending}
      >
        {isResending ? (
          <ActivityIndicator color="#007AFF" />
        ) : (
          <Text style={styles.resendButtonText}>Resend OTP</Text>
        )}
      </TouchableOpacity>

      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      )}

      {attempts > 0 && (
        <Text style={styles.attemptsText}>
          Attempts: {attempts}/3
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 2,
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
