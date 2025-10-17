import { useState } from 'react';
import { FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AssignmentManager() {
  type Problem = {
    id: number;
    question: string;
    answer: string;
    difficulty: string;
  };

  type Assignment = {
    id: number;
    name: string;
    problems: Problem[];
    createdAt: string;
  };

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentName, setAssignmentName] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);

  const createAssignment = () => {
    if (assignmentName.trim()) {
      const newAssignment: Assignment = {
        id: Date.now(),
        name: assignmentName.trim(),
        problems: [],
        createdAt: new Date().toLocaleDateString(),
      };
      setAssignments([...assignments, newAssignment]);
      setAssignmentName('');
      setShowCreateAssignment(false);
    }
  };

  const deleteAssignment = (id: number) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    if (selectedAssignment?.id === id) {
      setSelectedAssignment(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Assignments</Text>
        <Text style={styles.subheading}>Create and manage assignments</Text>

        <TouchableOpacity onPress={() => setShowCreateAssignment(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Create Assignment</Text>
        </TouchableOpacity>

        <Text style={styles.listHeading}>Your Assignments ({assignments.length})</Text>
        {assignments.length === 0 ? (
          <Text style={styles.emptyState}>No assignments yet. Create one above!</Text>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedAssignment(item)}
                style={styles.assignmentCard}
              >
                <View style={styles.assignmentHeader}>
                  <View>
                    <Text style={styles.assignmentName}>{item.name}</Text>
                    <Text style={styles.assignmentMeta}>
                      {item.problems.length} problem{item.problems.length !== 1 ? 's' : ''} • {item.createdAt}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteAssignment(item.id)}
                    style={styles.assignmentDelete}
                  >
                    <Text style={styles.deleteButton}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      <Modal visible={showCreateAssignment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Create Assignment</Text>

            <Text style={styles.label}>Assignment Name</Text>
            <TextInput
              value={assignmentName}
              onChangeText={setAssignmentName}
              placeholder="e.g., Algebra Quiz 1"
              style={styles.textInput}
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowCreateAssignment(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={createAssignment}
                style={[styles.modalButton, styles.confirmButton]}
              >
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  content: {
    padding: 24,
    paddingBottom: 120,
    paddingTop: 60,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold' as 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600' as '600',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center' as const,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  listHeading: {
    fontSize: 20,
    fontWeight: 'bold' as 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyState: {
    color: '#9ca3af',
    textAlign: 'center' as 'center',
    paddingVertical: 32,
    fontSize: 16,
  },
  assignmentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  assignmentDelete: {
    paddingLeft: 16,
  },
  assignmentName: {
    fontSize: 18,
    fontWeight: '600' as '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 13,
    color: '#6b7280',
  },
  problemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  problemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeEasy: {
    backgroundColor: '#dcfce7',
  },
  badgeMedium: {
    backgroundColor: '#fef3c7',
  },
  badgeHard: {
    backgroundColor: '#fee2e2',
  },
  badgeTextEasy: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600' as '600',
  },
  badgeTextMedium: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600' as '600',
  },
  badgeTextHard: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '600' as '600',
  },
  deleteButton: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '600' as '600',
  },
  problemQuestion: {
    fontSize: 16,
    fontWeight: '600' as '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  problemAnswer: {
    fontSize: 14,
    color: '#4b5563',
  },
  answerLabel: {
    fontWeight: '600' as '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    textAlignVertical: 'top' as 'top',
  },
  difficultyButtons: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
  },
  diffButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center' as const,
    backgroundColor: '#f9fafb',
  },
  diffButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  diffButtonText: {
    fontSize: 14,
    fontWeight: '600' as '600',
    color: '#6b7280',
  },
  diffButtonTextActive: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: 'bold' as 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center' as const,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600' as '600',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600' as '600',
    fontSize: 16,
  },
};