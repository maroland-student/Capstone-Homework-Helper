import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { LaTeXRenderer } from '@/components/LaTeXRenderer';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSubjects } from '@/lib/subjects-context';
import { parseEquationData } from '@/utilities/equationParser';
import { validateEquationData } from '@/utilities/equationValidator';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface EquationData {
  equation: string;
  substitutedEquation: string;
  variables: string[];
}

export default function EquationsScreen() {
  const { selectedTopics } = useSubjects();
  const [problem, setProblem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [equationData, setEquationData] = useState<EquationData | null>(null);

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

  const extractEquation = async (problemText: string) => {
    setExtracting(true);
    let extractResponse: Response | null = null;
    try {
      extractResponse = await fetch(`${API_BASE_URL}/api/openai/extract-equation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ problem: problemText }),
      });

      if (!extractResponse.ok) {
        const errorText = await extractResponse.text().catch(() => 'Unknown error');
        console.error(`Equation extraction failed with status ${extractResponse.status}:`, errorText);
        setEquationData(null);
        return;
      }

      const extractedData = await extractResponse.json();

      if (!extractedData || typeof extractedData !== 'object') {
        console.error('Invalid equation extraction response format:', extractedData);
        setEquationData(null);
        return;
      }

      if (extractedData.equation) {
        const eqData = {
          equation: extractedData.equation || '',
          substitutedEquation: extractedData.substitutedEquation || '',
          variables: Array.isArray(extractedData.variables) ? extractedData.variables : [],
        };
        setEquationData(eqData);

        // Validate the extracted equation
        try {
          const parsedData = parseEquationData(
            eqData.equation,
            eqData.substitutedEquation,
            eqData.variables
          );

          const validation = validateEquationData(
            eqData.equation,
            eqData.substitutedEquation,
            eqData.variables,
            parsedData
          );

          if (validation.errors.length > 0) {
            console.error('AI extraction validation errors:', validation.errors);
            const errorMessage = `Equation extraction has issues:\n${validation.errors.join('\n')}\n\nYou may need to try again or the equation may not work correctly in a calculator.`;
            setError(errorMessage);
          } else {
            setError(null);

            if (validation.warnings.length > 0) {
              console.warn('AI extraction validation warnings:', validation.warnings);
              if (Platform.OS !== 'web') {
                Alert.alert(
                  'Extraction Warning',
                  `The extracted equation has some warnings:\n${validation.warnings.join('\n')}\n\nYou can still use it, but it may need correction.`,
                  [{ text: 'OK' }]
                );
              }
            }
          }
        } catch (parseErr) {
          console.error('Error parsing/validating equation:', parseErr);
          // Continue even if parsing fails
        }
      } else {
        console.error('No equation was extracted from the problem. Response:', extractedData);
        setError('No equation was extracted from the problem. Please try again.');
        setEquationData(null);
      }
    } catch (extractErr) {
      console.error('Error extracting equation:', extractErr);
      try {
        if (extractResponse) {
          const errorData = await extractResponse.json().catch(() => ({}));
          console.error('Extraction error details:', errorData);
          setError(`Failed to extract equation: ${errorData.message || 'Unknown error'}`);
        } else {
          setError(`Failed to extract equation: ${extractErr instanceof Error ? extractErr.message : 'Unknown error'}`);
        }
      } catch {
        setError(`Failed to extract equation: ${extractErr instanceof Error ? extractErr.message : 'Unknown error'}`);
      }
      setEquationData(null);
    } finally {
      setExtracting(false);
    }
  };

  const saveEquationAsJSON = async () => {
    if (!equationData) {
      if (Platform.OS === 'web') {
        window.alert('Error: No equation data to save');
      } else {
        Alert.alert('Error', 'No equation data to save');
      }
      return;
    }

    setSaving(true);

    try {
      const parsedData = parseEquationData(
        equationData.equation,
        equationData.substitutedEquation,
        equationData.variables
      );

      const validation = validateEquationData(
        equationData.equation,
        equationData.substitutedEquation,
        equationData.variables,
        parsedData
      );

      if (!validation.isValid && validation.errors.length > 0) {
        const errorMessage = `Validation found issues:\n\n${validation.errors.join('\n')}${validation.warnings.length > 0 ? '\n\nWarnings:\n' + validation.warnings.join('\n') : ''}\n\nYou can still save, but the data may not work correctly in a calculator.`;

        if (Platform.OS === 'web') {
          const shouldContinue = window.confirm(
            `${errorMessage}\n\nDo you want to save anyway?`
          );
          if (!shouldContinue) {
            setSaving(false);
            return;
          }
        } else {
          Alert.alert(
            'Validation Issues Found',
            errorMessage + '\n\nSaving anyway...',
            [{ text: 'OK' }]
          );
        }
      }

      const jsonString = JSON.stringify(parsedData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `equation_${timestamp}.json`;

      let fileUri: string;

      if (Platform.OS === 'web') {
        fileUri = '';
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.alert(`✓ File Saved Successfully!\n\nFilename: ${filename}\n\nFile will be downloaded to your Downloads folder.`);
      } else {
        const cacheDir = Paths.cache;
        const file = cacheDir.createFile(filename, 'application/json');
        file.write(jsonString, { encoding: 'utf8' });
        fileUri = file.uri;

        const fileSize = new Blob([jsonString]).size;
        Alert.alert(
          '✓ File Saved Successfully!',
          `Filename: ${filename}\n\nFile saved to:\n${fileUri}\n\nSize: ${(fileSize / 1024).toFixed(2)} KB`,
          [
            {
              text: 'Share File',
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  try {
                    await Sharing.shareAsync(fileUri, {
                      mimeType: 'application/json',
                      dialogTitle: 'Save Equation Data',
                    });
                  } catch (shareError: any) {
                    Alert.alert('Share Error', `Could not open share dialog: ${shareError.message}`);
                  }
                } else {
                  Alert.alert(
                    'File Location',
                    `File saved to:\n${fileUri}\n\nSharing is not available on this platform.`,
                    [{ text: 'OK' }]
                  );
                }
              },
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage = `✗ Save Failed\n\nFailed to save equation:\n\n${error.message}\n\nPlease try again.`;

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('✗ Save Failed', errorMessage, [{ text: 'OK' }]);
      }
    } finally {
      setSaving(false);
    }
  };

  const fetchMathProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      setEquationData(null);

      const topicIds = Array.from(selectedTopics);
      const queryParams = topicIds.length > 0
        ? `?topics=${topicIds.join(',')}`
        : '';

      const response = await fetch(`${API_BASE_URL}/api/openai/math-problem${queryParams}`);
      
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

      setExtracting(true);
      try {
        const extractResponse = await fetch(`${API_BASE_URL}/api/openai/extract-equation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ problem: fullProblem }),
        });

        if (extractResponse.ok) {
          const extractedData = await extractResponse.json();
          if (extractedData.equation) {
            const parsedData = parseEquationData(
              extractedData.equation,
              extractedData.substitutedEquation,
              extractedData.variables
            );

            const validation = validateEquationData(
              extractedData.equation,
              extractedData.substitutedEquation,
              extractedData.variables,
              parsedData
            );

            if (validation.errors.length > 0) {
              console.error('AI extraction validation errors:', validation.errors);
              const errorMessage = `Equation extraction has issues:\n${validation.errors.join('\n')}\n\nYou may need to try again or the equation may not work correctly in a calculator.`;
              setError(errorMessage);
            } else {
              setError(null);

              if (validation.warnings.length > 0) {
                console.warn('AI extraction validation warnings:', validation.warnings);
                if (Platform.OS !== 'web') {
                  Alert.alert(
                    'Extraction Warning',
                    `The extracted equation has some warnings:\n${validation.warnings.join('\n')}\n\nYou can still use it, but it may need correction.`,
                    [{ text: 'OK' }]
                  );
                }
              }
            }

            setEquationData({
              equation: extractedData.equation || '',
              substitutedEquation: extractedData.substitutedEquation || '',
              variables: Array.isArray(extractedData.variables) ? extractedData.variables : [],
            });
          } else {
            setError('No equation was extracted from the problem. Please try again.');
          }
        } else {
          const errorData = await extractResponse.json().catch(() => ({}));
          console.error(`Equation extraction failed with status ${extractResponse.status}`);
          setError(`Failed to extract equation: ${errorData.message || 'Unknown error'}`);
        }
      } catch (extractErr) {
        console.error('Error extracting equation:', extractErr);
        // Don't show error for extraction failures, just continue without equation
      } finally {
        setExtracting(false);
      }
    } catch (err) {
      console.error('Error fetching math problem:', err);
      setError('Failed to load math problem. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitCustomProblem = async () => {
    if (!validateInput(userInput)) {
      return;
    }

    try {
      setError(null);
      setInputError(null);
      setEquationData(null);

      const trimmedProblem = userInput.trim();
      setProblem(trimmedProblem);
      setUserInput('');

      // Clear input after successful submission
      setAnswer('');
      setFeedbackMessage(null);

      // Extract equation from user's problem
      await extractEquation(trimmedProblem);
    } catch (err) {
      console.error('Error processing custom problem:', err);
      setError('Failed to process your problem. Please try again.');
    }
  };

  const handleInputChange = (text: string) => {
    setUserInput(text);
    // Clear error when user starts typing
    if (inputError) {
      setInputError(null);
    }
  };

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      setFeedbackMessage('Text submitted!');
      console.log('Answer submitted:', answer);
      // Clear feedback after 3 seconds
      setTimeout(() => {
        setFeedbackMessage(null);
        setAnswer('');
      }, 3000);
    }
  };

  const handleNewQuestion = () => {
    setProblem(null);
    setAnswer('');
    setFeedbackMessage(null);
    setError(null);
    setEquationData(null);
  };

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

      {/* Status Display */}
      {loading && (
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Generating problem...</ThemedText>
        </ThemedView>
      )}

      {error && (
        <ThemedView style={styles.centerContent}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}

      {/* Main Practice Section - Question and Answer */}
      {problem && !loading && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.practiceSection}
        >
          {/* Question Display */}
          <ThemedView style={styles.questionSection}>
            <ThemedText style={styles.questionLabel}>Question:</ThemedText>
            <ThemedView style={styles.questionBox}>
              <ThemedText style={styles.questionText}>{problem}</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* Extracted Equation Display */}
          {extracting && (
            <ThemedView style={styles.centerContent}>
              <ActivityIndicator size="small" />
              <ThemedText style={styles.loadingText}>Extracting equation...</ThemedText>
            </ThemedView>
          )}

          {equationData && equationData.equation && !extracting && (
            <ThemedView style={styles.equationContainer}>
              <ThemedText style={styles.equationLabel}>Extracted Equation:</ThemedText>
              
              <ThemedView style={styles.equationBox}>
                <ThemedText style={styles.equationTitle}>Template:</ThemedText>
                <LaTeXRenderer equation={equationData.equation} style={styles.latexRenderer} />
              </ThemedView>

              {equationData.substitutedEquation && (
                <ThemedView style={styles.equationBox}>
                  <ThemedText style={styles.equationTitle}>With Values:</ThemedText>
                  <LaTeXRenderer equation={equationData.substitutedEquation} style={styles.latexRenderer} />
                </ThemedView>
              )}

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

              {/* Save Button */}
              <ThemedView style={styles.saveButtonContainer}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={saveEquationAsJSON}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" style={styles.saveLoader} />
                      <ThemedText style={styles.buttonText}>Saving...</ThemedText>
                    </>
                  ) : (
                    <ThemedText style={styles.buttonText}>Save as JSON</ThemedText>
                  )}
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          )}

          {/* Answer Input */}
          <ThemedView style={styles.answerSection}>
            <ThemedText style={styles.answerLabel}>Your Answer:</ThemedText>
            <TextInput
              style={styles.answerInput}
              placeholder="Enter your answer here..."
              placeholderTextColor="#999"
              value={answer}
              onChangeText={setAnswer}
              multiline={false}
              keyboardType="default"
              autoCapitalize="none"
            />
          </ThemedView>

          {/* Feedback Message */}
          {feedbackMessage && (
            <ThemedView style={styles.feedbackContainer}>
              <ThemedText style={styles.feedbackText}>{feedbackMessage}</ThemedText>
            </ThemedView>
          )}

          {/* Action Buttons */}
          <ThemedView style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.submitAnswerButton, !answer.trim() && styles.buttonDisabled]}
              onPress={handleSubmitAnswer}
              disabled={!answer.trim()}
            >
              <ThemedText style={styles.buttonText}>Submit Answer</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newQuestionButton, styles.secondaryButton]}
              onPress={handleNewQuestion}
            >
              <ThemedText style={styles.secondaryButtonText}>New Question</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      )}

      {/* Empty State - with input option */}
      {!problem && !loading && !error && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.emptyStateSection}
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
              editable={!loading}
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
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmitCustomProblem}
              disabled={loading || !userInput.trim()}
            >
              <ThemedText style={styles.buttonText}>
                Submit Problem
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.generateButton, loading && styles.buttonDisabled]}
              onPress={fetchMathProblem}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                Random Problem
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </KeyboardAvoidingView>
      )}
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
    marginBottom: 24,
  },
  emptyStateSection: {
    marginTop: 16,
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
  practiceSection: {
    marginTop: 24,
    marginBottom: 24,
    gap: 24,
  },
  questionSection: {
    gap: 12,
  },
  questionLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  questionBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    minHeight: 100,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
  },
  answerSection: {
    gap: 12,
  },
  answerLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  answerInput: {
    backgroundColor: 'rgba(128, 128, 128, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.3)',
    fontSize: 18,
    minHeight: 60,
  },
  feedbackContainer: {
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  submitAnswerButton: {
    backgroundColor: '#34C759',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newQuestionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
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
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
  equationContainer: {
    gap: 16,
    marginTop: 8,
  },
  equationLabel: {
    fontSize: 16,
    fontWeight: '700',
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
    minHeight: 40,
    marginTop: 4,
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
  saveButtonContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveLoader: {
    marginRight: 0,
  },
});
