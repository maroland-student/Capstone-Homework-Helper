import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

interface MathProblemModalProps {
  visible: boolean;
  problem: string | null;
  onClose: () => void;
  onSubmit?: (answer: string) => void;
}

export default function MathProblemModal({
  visible,
  problem,
  onClose,
  onSubmit,
}: MathProblemModalProps) {
  const [answer, setAnswer] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Reset feedback when modal opens
  useEffect(() => {
    if (visible) {
      setFeedbackMessage(null);
      setAnswer('');
    }
  }, [visible]);

  const handleSubmit = () => {
    if (answer.trim()) {
      setFeedbackMessage('Text submitted!');
      if (onSubmit) {
        onSubmit(answer);
      }
      // Clear feedback after 3 seconds to ensure it's visible
      setTimeout(() => {
        setFeedbackMessage(null);
        setAnswer('');
      }, 3000);
    }
  };

  const handleClose = () => {
    setFeedbackMessage('Button clicked!');
    setAnswer('');
    // Clear feedback after 1 second, then close
    setTimeout(() => {
      setFeedbackMessage(null);
      onClose();
    }, 1000);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Math Problem</Text>
          
          {/* Question Box */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>Question:</Text>
            <View style={styles.questionBox}>
              <Text style={styles.questionText}>
                {problem || 'No problem available'}
              </Text>
            </View>
          </View>

          {/* Answer Input */}
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Your Answer:</Text>
            <TextInput
              style={styles.answerInput}
              placeholder="Enter your answer here..."
              value={answer}
              onChangeText={setAnswer}
              multiline={false}
              keyboardType="default"
              autoCapitalize="none"
            />
          </View>

          {/* Feedback Message */}
          {feedbackMessage && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
            
            {onSubmit && (
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={!answer.trim()}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  questionBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  answerContainer: {
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  answerInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    minHeight: 50,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
