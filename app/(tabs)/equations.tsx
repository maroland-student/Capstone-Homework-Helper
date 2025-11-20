import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { LaTeXRenderer } from '@/components/LaTeXRenderer';
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
  const [equationData, setEquationData] = useState<EquationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('Failed to fetch math problem');
      }

      const data = await response.json();
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
            
            setEquationData(extractedData);
          } else {
            setError('No equation was extracted from the problem. Please try again.');
          }
        } else {
          const errorData = await extractResponse.json().catch(() => ({}));
          setError(`Failed to extract equation: ${errorData.message || 'Unknown error'}`);
        }
      } catch (extractErr) {
        console.error('Error extracting equation:', extractErr);
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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E8F0FE', dark: '#0F172A' }}
      headerImage={<View />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Equations</ThemedText>
      </ThemedView>
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="subtitle">Lets Practice!</ThemedText>
      </ThemedView>
      <ThemedView style={styles.problemContainer}>
        {loading ? (
          <ThemedView style={styles.centerContent}>
            <ActivityIndicator size="large" />
            <ThemedText style={styles.loadingText}>Generating problem...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.centerContent}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
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
              <>
                <ThemedView style={styles.equationContainer}>
                  <ThemedText type="subtitle" style={styles.equationLabel}>
                    Extracted Equation:
                  </ThemedText>
                  
                  <ThemedView style={styles.equationBox}>
                    <ThemedText style={styles.equationTitle}>Template:</ThemedText>
                    <LaTeXRenderer equation={equationData.equation} style={styles.latexRenderer} />
                  </ThemedView>

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

                  {equationData.substitutedEquation && (
                    <ThemedView style={styles.equationBox}>
                      <ThemedText style={styles.equationTitle}>With Values:</ThemedText>
                      <LaTeXRenderer equation={equationData.substitutedEquation} style={styles.latexRenderer} />
                    </ThemedView>
                  )}
                </ThemedView>

                <ThemedView style={styles.buttonContainer}>
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
              </>
            )}
          </>
        ) : (
          <ThemedView style={styles.centerContent}>
            <ThemedText style={styles.emptyText}>
              {selectedTopics.size === 0 
                ? 'Please select topics on the Subjects page first, then click "New Question" to get started!'
                : 'Click "New Question" to get started!'}
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.newQuestionButton}
          onPress={fetchMathProblem}
          disabled={loading || extracting}
        >
          <ThemedText style={styles.buttonText}>New Question</ThemedText>
        </TouchableOpacity>
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
  problemContainer: {
    marginTop: 16,
    marginBottom: 24,
    gap: 16,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  newQuestionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
});