import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { LaTeXRenderer } from '@/components/LaTeXRenderer';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { parseEquationData } from '@/utilities/equationParser';

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
    console.log('Starting save process...');
    
    try {
      // Parse the equation to extract coefficients and structure
      const parsedData = parseEquationData(
        equationData.equation,
        equationData.substitutedEquation,
        equationData.variables
      );
      console.log('Equation parsed successfully');

      // Create JSON string
      const jsonString = JSON.stringify(parsedData, null, 2);
      console.log('JSON string created, length:', jsonString.length);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `equation_${timestamp}.json`;
      console.log('Filename:', filename);
      
      let fileUri: string;
      
      if (Platform.OS === 'web') {
        // On web, just use the blob directly for download
        // No need to create a file in the file system
        fileUri = ''; // Not needed for web
        console.log('Web platform - will use blob download');
      } else {
        // On mobile, create file using directory's createFile method
        try {
          // Get cache directory
          const cacheDir = Paths.cache;
          
          // Create file in cache directory
          const file = cacheDir.createFile(filename, 'application/json');
          console.log('File object created:', file.uri);
          
          // Write file content
          file.write(jsonString, { encoding: 'utf8' });
          console.log('File written successfully');
          
          fileUri = file.uri;
        } catch (fileError: any) {
          console.error('Error creating/writing file:', fileError);
          console.error('Full error details:', JSON.stringify(fileError, null, 2));
          throw new Error(`Failed to create file: ${fileError.message || 'Unknown error'}`);
        }
      }

      // Verify file was written (only on mobile)
      if (Platform.OS !== 'web') {
        try {
          const fileInfo = await Paths.info(fileUri);
          console.log('File info:', fileInfo);
          if (!fileInfo.exists) {
            throw new Error('File was not created successfully');
          }
        } catch (verifyError) {
          // If verification fails, still try to proceed - file might be valid
          console.warn('Could not verify file:', verifyError);
        }
      }
      
      // Calculate approximate file size from JSON string
      const fileSize = new Blob([jsonString]).size;
      console.log('File size:', fileSize, 'bytes');
      console.log('File URI:', fileUri || 'N/A (web download)');

      // Show success message with file path
      const filePathInfo = Platform.OS === 'web' 
        ? `File will be downloaded to your Downloads folder.`
        : `File saved to:\n${fileUri}`;
      
      const successMessage = `✓ File Saved Successfully!\n\nFilename: ${filename}\n\n${filePathInfo}\n\nSize: ${(fileSize / 1024).toFixed(2)} KB\n\nYou can now share or export this file.`;
      
      console.log('Showing success alert...');
      console.log('Full file path:', fileUri || 'Web download (no file path)');
      
      if (Platform.OS === 'web') {
        // On web, use window.alert and trigger download
        window.alert(successMessage);
        
        // Create download link for web
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('File downloaded on web to Downloads folder');
      } else {
        Alert.alert(
          '✓ File Saved Successfully!',
          `Filename: ${filename}\n\n${filePathInfo}\n\nSize: ${(fileSize / 1024).toFixed(2)} KB\n\nYou can now share or export this file.`,
          [
            {
              text: 'Share File',
              onPress: async () => {
                // Share/save the file (only on mobile)
                if (Platform.OS !== 'web') {
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
      console.error('Error saving equation:', error);
      const errorMessage = `✗ Save Failed\n\nFailed to save equation:\n\n${error.message}\n\nPlease try again.`;
      
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert(
          '✗ Save Failed',
          `Failed to save equation:\n\n${error.message}\n\nPlease try again.`,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSaving(false);
      console.log('Save process completed');
    }
  };

  const fetchMathProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      setEquationData(null);
      
      const response = await fetch(`${API_BASE_URL}/api/openai/math-problem`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch math problem');
      }

      const data = await response.json();
      const fullProblem = data.problem || 'No problem generated';
      setProblem(fullProblem);
      
      // Extract equation from problem
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
            setEquationData(extractedData);
          }
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

                {/* Save Button */}
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
            <ThemedText style={styles.emptyText}>Click "New Question" to get started!</ThemedText>
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
  variableKey: {
    fontWeight: '600',
  },
  variableValue: {
    fontWeight: '600',
    color: '#007AFF',
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