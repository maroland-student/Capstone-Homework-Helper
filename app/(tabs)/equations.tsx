import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { LaTeXRenderer } from '@/components/LaTeXRenderer';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface EquationData {
  equation: string;
  substitutedEquation: string;
  variables: string[];
}

export default function EquationsScreen() {
  const [problem, setProblem] = useState<string | null>(null);
  const [equationData, setEquationData] = useState<EquationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const validateInput = (text: string): boolean => {
    setInputError(null);

    if (!text || text.trim().length === 0) {
      setInputError('Please enter a math problem');
      return false;
    }

    if (text.trim().length < 10) {
      setInputError('Problem seems too short. Please provide more details');
      return false;
    }

    if (text.length > 2000) {
      setInputError('Problem is too long. Please keep it under 2000 characters');
      return false;
    }

    return true;
  };

  const fetchMathProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      setEquationData(null);

      const response = await fetch(`${API_BASE_URL}/api/openai/math-problem`, {
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      const fullProblem = data.problem || 'No problem generated';
      setProblem(fullProblem);

      // Extract equation from problem
      await extractEquation(fullProblem);
    } catch (err) {
      console.error('Error fetching math problem:', err);

      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
          setError('Request timed out. Please check your connection and try again.');
        } else if (err.message.includes('fetch')) {
          setError('Network error. Please check your connection.');
        } else {
          setError(`Failed to load math problem: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const extractEquation = async (problemText: string) => {
    setExtracting(true);
    try {
      const extractResponse = await fetch(`${API_BASE_URL}/api/openai/extract-equation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: problemText }),
        signal: AbortSignal.timeout(30000),
      });

      if (!extractResponse.ok) {
        console.warn(`Equation extraction failed with status ${extractResponse.status}`);
        return; // Silently continue without equation
      }

      const extractedData = await extractResponse.json();

      if (!extractedData || typeof extractedData !== 'object') {
        console.warn('Invalid equation extraction response format');
        return;
      }

      if (extractedData.equation) {
        setEquationData({
          equation: extractedData.equation || '',
          substitutedEquation: extractedData.substitutedEquation || '',
          variables: Array.isArray(extractedData.variables) ? extractedData.variables : [],
        });
      }
    } catch (extractErr) {
      console.error('Error extracting equation:', extractErr);
      // Don't show error for extraction failures, just continue without equation
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmitCustomProblem = async () => {
    if (!validateInput(userInput)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInputError(null);
      setEquationData(null);

      const trimmedProblem = userInput.trim();
      setProblem(trimmedProblem);

      // Extract equation from user's problem
      await extractEquation(trimmedProblem);

      // Clear input after successful submission
      setUserInput('');
    } catch (err) {
      console.error('Error processing custom problem:', err);
      setError('Failed to process your problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setUserInput(text);
    // Clear error when user starts typing
    if (inputError) {
      setInputError(null);
    }
  };

  const isProcessing = loading || extracting;

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F0FE', dark: '#0F172A' }}
      headerImage={<View />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Equations</ThemedText>
      </ThemedView>
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="subtitle">Let's Practice!</ThemedText>
      </ThemedView>

      {/* Input Section */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputSection}
      >
        <ThemedView style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Enter Your Math Problem:</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              inputError ? styles.textInputError : null,
            ]}
            placeholder="e.g., A car travels 120 km in 2 hours. What is its speed?"
            placeholderTextColor="#999"
            value={userInput}
            onChangeText={handleInputChange}
            multiline
            numberOfLines={4}
            maxLength={2000}
            editable={!isProcessing}
          />
          {inputError && (
            <ThemedText style={styles.inputErrorText}>{inputError}</ThemedText>
          )}
          <ThemedText style={styles.characterCount}>
            {userInput.length}/2000 characters
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.submitButton, isProcessing && styles.buttonDisabled]}
            onPress={handleSubmitCustomProblem}
            disabled={isProcessing}
          >
            <ThemedText style={styles.buttonText}>
              {isProcessing ? 'Processing...' : 'Submit Problem'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.generateButton, isProcessing && styles.buttonDisabled]}
            onPress={fetchMathProblem}
            disabled={isProcessing}
          >
            <ThemedText style={styles.buttonText}>
              Random Problem
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </KeyboardAvoidingView>

      {/* Problem Display Section */}
      <ThemedView style={styles.problemContainer}>
        {loading && !problem ? (
          <ThemedView style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Generating problem...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.centerContent}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <ThemedText style={styles.retryButtonText}>Dismiss</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : problem ? (
          <>
            <ThemedView style={styles.problemBox}>
              <ThemedText style={styles.problemText}>{problem}</ThemedText>
            </ThemedView>

            {extracting && (
              <ThemedView style={styles.centerContent}>
                <ActivityIndicator size="small" />
                <ThemedText style={styles.loadingText}>Extracting equation...</ThemedText>
              </ThemedView>
            )}

            {equationData && equationData.equation && (
              <ThemedView style={styles.equationContainer}>
                <ThemedText type="subtitle" style={styles.equationLabel}>
                  Extracted Equation:
                </ThemedText>

                {/* Template Equation */}
                <ThemedView style={styles.equationBox}>
                  <ThemedText style={styles.equationTitle}>Template:</ThemedText>
                  <LaTeXRenderer equation={equationData.equation} style={styles.latexRenderer} />
                </ThemedView>

                {/* Variables List */}
                {equationData.variables && equationData.variables.length > 0 && (
                  <ThemedView style={styles.variablesBox}>
                    <ThemedText style={styles.equationTitle}>Variables:</ThemedText>
                    <View style={styles.variablesList}>
                      {equationData.variables.map((variable, index) => (
                        <View key={index} style={styles.variableItem}>
                          <ThemedText style={styles.variableText}>{variable}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </ThemedView>
                )}

                {/* Substituted Equation */}
                {equationData.substitutedEquation && (
                  <ThemedView style={styles.equationBox}>
                    <ThemedText style={styles.equationTitle}>With Values:</ThemedText>
                    <LaTeXRenderer equation={equationData.substitutedEquation} style={styles.latexRenderer} />
                  </ThemedView>
                )}
              </ThemedView>
            )}
          </>
        ) : (
          <ThemedView style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>
              Enter a math problem above or click "Random Problem" to get started!
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
  },
  textInputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  inputErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  problemContainer: {
    marginTop: 16,
    marginBottom: 24,
    gap: 16,
  },
  problemBox: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  problemText: {
    fontSize: 16,
    lineHeight: 24,
  },
  equationContainer: {
    gap: 16,
  },
  equationLabel: {
    marginBottom: 8,
  },
  equationBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  equationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  latexRenderer: {
    minHeight: 60,
    marginTop: 8,
  },
  variablesBox: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  variablesList: {
    gap: 8,
    marginTop: 8,
  },
  variableItem: {
    paddingVertical: 4,
  },
  variableText: {
    fontSize: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  retryButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
});