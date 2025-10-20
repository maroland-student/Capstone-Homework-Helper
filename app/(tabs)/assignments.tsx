import { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AssignmentManager() {
  type Problem = {
    id: number;
    question: string;
    type: "text" | "truefalse" | "multiplechoice";
    answer: string;
    options?: string[];
    difficulty: string;
  };

  type Assignment = {
    id: number;
    name: string;
    problems: Problem[];
    createdAt: string;
  };

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentName, setAssignmentName] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [problemType, setProblemType] = useState<
    "text" | "truefalse" | "multiplechoice"
  >("text");
  const [problemOptions, setProblemOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  const createAssignment = () => {
    if (assignmentName.trim()) {
      const newAssignment: Assignment = {
        id: Date.now(),
        name: assignmentName.trim(),
        problems: [],
        createdAt: new Date().toLocaleDateString(),
      };
      setAssignments([...assignments, newAssignment]);
      setAssignmentName("");
      setShowCreateAssignment(false);
    }
  };

  const deleteAssignment = (id: number) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    if (selectedAssignment?.id === id) {
      setSelectedAssignment(null);
    }
  };

  const addProblemToAssignment = () => {
    if (selectedAssignment && question.trim() && answer.trim()) {
      const updatedAssignments = assignments.map((a) => {
        if (a.id === selectedAssignment.id) {
          const newProblem: Problem = {
            id: Date.now(),
            question: question.trim(),
            type: problemType,
            answer: answer.trim(),
            options:
              problemType === "multiplechoice"
                ? problemOptions
                : problemType === "truefalse"
                ? ["True", "False"]
                : undefined,
            difficulty,
          };
          return { ...a, problems: [...a.problems, newProblem] };
        }
        return a;
      });
      setAssignments(updatedAssignments);
      setSelectedAssignment(
        updatedAssignments.find((a) => a.id === selectedAssignment.id) || null
      );
      resetProblemForm();
      setShowAddProblem(false);
    }
  };

  const resetProblemForm = () => {
    setQuestion("");
    setAnswer("");
    setDifficulty("medium");
    setProblemOptions([]);
    setNewOption("");
  };

  const addOption = () => {
    if (newOption.trim() && !problemOptions.includes(newOption.trim())) {
      setProblemOptions([...problemOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  const removeOption = (index: number) => {
    setProblemOptions(problemOptions.filter((_, i) => i !== index));
  };

  const deleteProblem = (problemId: number) => {
    if (selectedAssignment) {
      const updatedAssignments = assignments.map((a) => {
        if (a.id === selectedAssignment.id) {
          return {
            ...a,
            problems: a.problems.filter((p) => p.id !== problemId),
          };
        }
        return a;
      });
      setAssignments(updatedAssignments);
      setSelectedAssignment(
        updatedAssignments.find((a) => a.id === selectedAssignment.id) || null
      );
    }
  };

  const getDifficultyBadgeStyle = (diff: string) => {
    if (diff === "easy") return [styles.badge, styles.badgeEasy];
    if (diff === "medium") return [styles.badge, styles.badgeMedium];
    return [styles.badge, styles.badgeHard];
  };

  const getDifficultyTextStyle = (diff: string) => {
    if (diff === "easy") return styles.badgeTextEasy;
    if (diff === "medium") return styles.badgeTextMedium;
    return styles.badgeTextHard;
  };

  const getTypeLabel = (type: string) => {
    if (type === "text") return "Text";
    if (type === "truefalse") return "True/False";
    return "Multiple Choice";
  };

  if (selectedAssignment) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => setSelectedAssignment(null)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>{selectedAssignment.name}</Text>
          <Text style={styles.subheading}>
            {selectedAssignment.problems.length} problems
          </Text>

          <TouchableOpacity
            onPress={() => {
              resetProblemForm();
              setShowAddProblem(true);
            }}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Add Problem</Text>
          </TouchableOpacity>

          <Text style={styles.listHeading}>Problems</Text>
          {selectedAssignment.problems.length === 0 ? (
            <Text style={styles.emptyState}>
              No problems yet. Add one above!
            </Text>
          ) : (
            <FlatList
              data={selectedAssignment.problems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.problemCard}>
                  <View style={styles.problemHeader}>
                    <View style={getDifficultyBadgeStyle(item.difficulty)}>
                      <Text style={getDifficultyTextStyle(item.difficulty)}>
                        {item.difficulty.charAt(0).toUpperCase() +
                          item.difficulty.slice(1)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteProblem(item.id)}>
                      <Text style={styles.deleteButton}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.problemQuestion}>{item.question}</Text>
                  <Text style={styles.problemMeta}>
                    <Text style={styles.answerLabel}>Type: </Text>
                    {getTypeLabel(item.type)}
                  </Text>
                  <Text style={styles.problemAnswer}>
                    <Text style={styles.answerLabel}>Answer: </Text>
                    {item.answer}
                  </Text>
                  {item.options && (
                    <Text style={styles.problemOptions}>
                      <Text style={styles.answerLabel}>Options: </Text>
                      {item.options.join(", ")}
                    </Text>
                  )}
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>

        <Modal visible={showAddProblem} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ justifyContent: "flex-end" }}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalHeading}>Add Problem</Text>

                <Text style={styles.label}>Problem Question</Text>
                <TextInput
                  value={question}
                  onChangeText={setQuestion}
                  placeholder="Enter the problem question..."
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.label}>Problem Type</Text>
                <View style={styles.difficultyButtons}>
                  {(["text", "truefalse", "multiplechoice"] as const).map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          setProblemType(type);
                          setProblemOptions([]);
                        }}
                        style={[
                          styles.diffButton,
                          problemType === type && styles.diffButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffButtonText,
                            problemType === type && styles.diffButtonTextActive,
                          ]}
                        >
                          {getTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {problemType === "multiplechoice" && (
                  <View>
                    <Text style={styles.label}>Multiple Choice Options</Text>
                    <View style={styles.optionInputContainer}>
                      <TextInput
                        value={newOption}
                        onChangeText={setNewOption}
                        placeholder="Enter an option..."
                        style={[styles.textInput, styles.optionInput]}
                        placeholderTextColor="#9ca3af"
                      />
                      <TouchableOpacity
                        onPress={addOption}
                        style={styles.addOptionButton}
                      >
                        <Text style={styles.addOptionText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                    {problemOptions.length > 0 && (
                      <View style={styles.optionsList}>
                        {problemOptions.map((option, index) => (
                          <View key={index} style={styles.optionItem}>
                            <Text style={styles.optionText}>{option}</Text>
                            <TouchableOpacity
                              onPress={() => removeOption(index)}
                            >
                              <Text style={styles.removeOptionText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <Text style={styles.label}>
                  {problemType === "truefalse" ? "Correct Answer" : "Answer"}
                </Text>
                {problemType === "truefalse" ? (
                  <View style={styles.difficultyButtons}>
                    {(["True", "False"] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => setAnswer(opt)}
                        style={[
                          styles.diffButton,
                          answer === opt && styles.diffButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffButtonText,
                            answer === opt && styles.diffButtonTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    value={answer}
                    onChangeText={setAnswer}
                    placeholder="Enter the answer..."
                    style={styles.textInput}
                    multiline
                    numberOfLines={2}
                    placeholderTextColor="#9ca3af"
                  />
                )}

                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.difficultyButtons}>
                  {(["easy", "medium", "hard"] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() => setDifficulty(level)}
                      style={[
                        styles.diffButton,
                        difficulty === level && styles.diffButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.diffButtonText,
                          difficulty === level && styles.diffButtonTextActive,
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={() => setShowAddProblem(false)}
                    style={[styles.modalButton, styles.cancelButton]}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={addProblemToAssignment}
                    style={[styles.modalButton, styles.confirmButton]}
                  >
                    <Text style={styles.confirmButtonText}>Add Problem</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Assignments</Text>
        <Text style={styles.subheading}>Create and manage assignments</Text>

        <TouchableOpacity
          onPress={() => setShowCreateAssignment(true)}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ Create Assignment</Text>
        </TouchableOpacity>

        <Text style={styles.listHeading}>
          Your Assignments ({assignments.length})
        </Text>
        {assignments.length === 0 ? (
          <Text style={styles.emptyState}>
            No assignments yet. Create one above!
          </Text>
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
                      {item.problems.length} problem
                      {item.problems.length !== 1 ? "s" : ""} • {item.createdAt}
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
  container: { flex: 1, backgroundColor: "#f0f9ff" },
  content: { padding: 24, paddingBottom: 120, paddingTop: 60 },
  heading: {
    fontSize: 32,
    fontWeight: "bold" as "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subheading: { fontSize: 16, color: "#4b5563", marginBottom: 24 },
  backButton: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600" as "600",
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: "center" as const,
  },
  addButtonText: { color: "white", fontSize: 16, fontWeight: "600" as const },
  listHeading: {
    fontSize: 20,
    fontWeight: "bold" as "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  emptyState: {
    color: "#9ca3af",
    textAlign: "center" as "center",
    paddingVertical: 32,
    fontSize: 16,
  },
  assignmentCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  assignmentDelete: { paddingLeft: 16 },
  assignmentName: {
    fontSize: 18,
    fontWeight: "600" as "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  assignmentMeta: { fontSize: 13, color: "#6b7280" },
  problemCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  problemHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  problemMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  problemOptions: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeEasy: { backgroundColor: "#dcfce7" },
  badgeMedium: { backgroundColor: "#fef3c7" },
  badgeHard: { backgroundColor: "#fee2e2" },
  badgeTextEasy: { color: "#166534", fontSize: 12, fontWeight: "600" as "600" },
  badgeTextMedium: {
    color: "#92400e",
    fontSize: 12,
    fontWeight: "600" as "600",
  },
  badgeTextHard: { color: "#991b1b", fontSize: 12, fontWeight: "600" as "600" },
  deleteButton: { fontSize: 15, color: "#ef4444", fontWeight: "600" as "600" },
  problemQuestion: {
    fontSize: 16,
    fontWeight: "600" as "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  problemAnswer: { fontSize: 14, color: "#4b5563" },
  answerLabel: { fontWeight: "600" as "600" },
  label: {
    fontSize: 14,
    fontWeight: "600" as "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
    textAlignVertical: "top" as "top",
  },
  optionInputContainer: {
    flexDirection: "row" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  optionInput: { flex: 1 },
  addOptionButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center" as const,
  },
  addOptionText: { color: "white", fontWeight: "600" as "600", fontSize: 14 },
  optionsList: { marginTop: 12, gap: 8 },
  optionItem: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionText: { fontSize: 14, color: "#1f2937", flex: 1 },
  removeOptionText: {
    fontSize: 20,
    color: "#ef4444",
    fontWeight: "600" as "600",
  },
  difficultyButtons: { flexDirection: "row" as const, gap: 8, marginTop: 8 },
  diffButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center" as const,
    backgroundColor: "#f9fafb",
  },
  diffButtonActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  diffButtonText: {
    fontSize: 14,
    fontWeight: "600" as "600",
    color: "#6b7280",
  },
  diffButtonTextActive: { color: "white" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalScroll: { flex: 1, justifyContent: "flex-end" as const },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: "bold" as "bold",
    color: "#1f2937",
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row" as const, gap: 12, marginTop: 24 },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center" as const,
  },
  cancelButton: { backgroundColor: "#f3f4f6" },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "600" as "600",
    fontSize: 16,
  },
  confirmButton: { backgroundColor: "#2563eb" },
  confirmButtonText: {
    color: "white",
    fontWeight: "600" as "600",
    fontSize: 16,
  },
};
