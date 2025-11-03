import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

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