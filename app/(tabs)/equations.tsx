import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import { LaTeXRenderer } from '@/components/LaTeXRenderer';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// CAN ADJUST LATER
const MAX_HINTS = 3;

interface EquationData {
  equation: string;
  newEquation: string;
  variables: string[];
}

export default function EquationsScreen() {
  const [problem, setProblem] = useState<string | null>(null);
  const [equationData, setEquationData] = useState<EquationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hintTier, setHintTier] = useState<number>(0);

  const fetchMathProblem = async () => {
    try {
      setLoading(true);
      setError(null);
      setEquationData(null);


      // STARTS folded up
      setHintTier(0);

      
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


            // changes just to include fallback state 
        if (extractResponse.ok) {
          const extractedData = await extractResponse.json();
          const { equation, substitutedEquation, variables } = extractedData ?? {};
          if (typeof equation == 'string' && equation.trim()) {
            setEquationData({
              // Just leaving it as an empty array/string until next sprint 4 -> GPT filtering

              equation: equation.trim(),
              newEquation: typeof substitutedEquation === 'string' ? 
                        substitutedEquation 
                          : '',
              variables: Array.isArray(variables) ? 
                        variables.filter(entryVar => typeof entryVar === 'string') 
                        : [],
            });
          }

          // Preventing the immediate state updating (still temp)
          else {
            setEquationData(null);
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

  const showNextHint = () => setHintTier((prev) => Math.min(MAX_HINTS, prev + 1));
  const resetHints = () => setHintTier(0);



  const hintsRemaining = !!equationData && !!equationData.equation;



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

              {/* wraps title, buttons, all other content  */}
            <ThemedView style={styles.hintsAllContainer}>

                {/* has text 'HINTS'  */}
              <ThemedView style={styles.hintHeaderContainer}>


                <ThemedText type="subtitle" style={styles.hintTitle}> HINTS </ThemedText>
                  <ThemedText style={styles.hintCounter}>


                    {hintTier}/{MAX_HINTS} SHOWN
                  </ThemedText>
              </ThemedView>


              {/*  Just in case GPT is being slow and the user gets the user doesn't see anything yet */}
              {!hintsRemaining && !extracting && (
                <ThemedText style={styles.hintPreLoad}>
                  HINTS APPEAR AFTER EQUATION IS EXTRACTED
                </ThemedText>
              )}


              {/* Greyed out for now, TODO: Spam /rate limiter here!   */}
              <TouchableOpacity
                style={[
                  styles.hintButton,
                  (!hintsRemaining || hintTier >= MAX_HINTS ) && styles.hintButtonDisabled,

                ]}



                onPress={showNextHint}
                disabled={!hintsRemaining || hintTier >=MAX_HINTS}
                >

                <ThemedText style={styles.buttonText}>
                  {hintTier < MAX_HINTS ? 'Show Next hint' : 'All hints have been shown. No more available.'}
                </ThemedText>

                </TouchableOpacity>

                {hintTier > 0 && (
                  <TouchableOpacity style={styles.hintResetButton} onPress={resetHints}>
                    <ThemedText style={styles.hintResetButtonText}> RESET ALL HINTS </ThemedText>
                  </TouchableOpacity>
                )}


            </ThemedView>

            {/*  Added extra 'and' condition to each of the states. 3 for now  */}


            {equationData && equationData.equation && hintTier >= 1 && (
              <ThemedView style={styles.equationContainer}>
                <ThemedText type="subtitle" style={styles.equationLabel}>
                  Extracted Equation:
                </ThemedText>


                
                {/* Template Equation */}
                <ThemedView style={styles.equationBox}>
                  <ThemedText style={styles.equationTitle}> HINT/Screen 1 - Template:</ThemedText>
                  <LaTeXRenderer equation={equationData.equation} style={styles.latexRenderer} />
                </ThemedView>




                {/* Variables List */}
                {hintTier >=2 && equationData.variables && equationData.variables.length > 0 && (
                  <ThemedView style={styles.variablesBox}>
                    <ThemedText style={styles.equationTitle}>HINT/Screen 2: - Variables:</ThemedText>
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
                {hintTier >=MAX_HINTS  && equationData.newEquation && (
                  <ThemedView style={styles.equationBox}>
                    <ThemedText style={styles.equationTitle}>HINT/Screen 3 - With Values:</ThemedText>
                    <LaTeXRenderer equation={equationData.newEquation} style={styles.latexRenderer} />
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



  hintsAllContainer: {
    gap: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: 'rgba(128, 128, 128, 0.4)',
    padding: 12,
  },
  hintHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  hintTitle: {
    color: '#007AFF',
    fontWeight: 'bold',
  },


  hintCounter: { 
    opacity: 0.8, 
    fontSize: 12
  },
  hintPreLoad: { 
    opacity: 0.8, 
    fontSize: 12
  },

  hintButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderColor: 'rgba(0, 122, 255, 0.3)',
    borderRadius:5,
    padding: 10,
    alignItems: 'center',

  },
  hintButtonDisabled : {
    backgroundColor: 'rgba(0, 122, 255, 0.20)',

  },

  hintResetButton: {
    marginTop: 10,
    padding: 5,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(0,122, 255, 0.30)',
    backgroundColor: 'rgba(0, 122, 255, 0.5)',
  },
  hintResetButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF'

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