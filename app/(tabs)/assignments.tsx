import { useState, useEffect } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getSavedExtractedEquations,
  attachStudentListener, 
  removeSavedEquation,
  clearSavedEquations,
  type SavedEquation,
} from "@/lib/saved-equations";

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

  type StudentSubmission = {
    assignmentId: number;
    answers: { [problemId: number]: string };
    submittedAt: string;
    score?: number;
  };

  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
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

  const [studentAnswers, setStudentAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [showSubmission, setShowSubmission] = useState(false);

  // temp for just in memory until we can implement persistent storage (myEd database? )
  const [savedEquations, setSavedEquations] = useState<SavedEquation[]>(
    getSavedExtractedEquations()
  );

  useEffect(() => {
    return attachStudentListener(setSavedEquations);
  }, 
  
  // tracks 'saved list' -> can format later for 'different folder or classes
  // sub out array
  
  []);

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

  const submitAssignment = () => {
    if (!selectedAssignment) return;

    let score = 0;
    selectedAssignment.problems.forEach((problem) => {
      const studentAnswer = studentAnswers[problem.id]?.trim().toLowerCase();
      const correctAnswer = problem.answer.trim().toLowerCase();
      if (studentAnswer === correctAnswer) {
        score++;
      }
    });

    const submission: StudentSubmission = {
      assignmentId: selectedAssignment.id,
      answers: studentAnswers,
      submittedAt: new Date().toLocaleString(),
      score,
    };

    setSubmissions([...submissions, submission]);
    setShowSubmission(true);
  };

  const hasSubmitted = (assignmentId: number) => {
    return submissions.some((s) => s.assignmentId === assignmentId);
  };

  const getSubmission = (assignmentId: number) => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const closeSubmissionView = () => {
    setShowSubmission(false);
    setSelectedAssignment(null);
    setStudentAnswers({});
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

  if (role === "student" && selectedAssignment) {
    const submission = getSubmission(selectedAssignment.id);
    const isCompleted = submission !== undefined;

    if (showSubmission && submission) {
      return (
        <ScrollView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.heading}>Assignment Submitted!</Text>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreText}>Your Score</Text>
              <Text style={styles.scoreNumber}>
                {submission.score} / {selectedAssignment.problems.length}
              </Text>
              <Text style={styles.scorePercentage}>
                {Math.round(
                  (submission.score! / selectedAssignment.problems.length) * 100
                )}
                %
              </Text>
            </View>

            <Text style={styles.listHeading}>Review Your Answers</Text>
            <FlatList
              data={selectedAssignment.problems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const studentAnswer = submission.answers[item.id];
                const isCorrect =
                  studentAnswer?.trim().toLowerCase() ===
                  item.answer.trim().toLowerCase();

                return (
                  <View style={styles.problemCard}>
                    <View style={styles.problemHeader}>
                      <View style={getDifficultyBadgeStyle(item.difficulty)}>
                        <Text style={getDifficultyTextStyle(item.difficulty)}>
                          {item.difficulty.charAt(0).toUpperCase() +
                            item.difficulty.slice(1)}
                        </Text>
                      </View>
                      <View
                        style={
                          isCorrect
                            ? styles.correctBadge
                            : styles.incorrectBadge
                        }
                      >
                        <Text
                          style={
                            isCorrect
                              ? styles.correctText
                              : styles.incorrectText
                          }
                        >
                          {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.problemQuestion}>{item.question}</Text>
                    <Text style={styles.problemAnswer}>
                      <Text style={styles.answerLabel}>Your Answer: </Text>
                      {studentAnswer || "No answer"}
                    </Text>
                    <Text style={styles.problemAnswer}>
                      <Text style={styles.answerLabel}>Correct Answer: </Text>
                      {item.answer}
                    </Text>
                  </View>
                );
              }}
              scrollEnabled={false}
            />

            <TouchableOpacity
              onPress={closeSubmissionView}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>Back to Assignments</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

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

          {isCompleted ? (
            <View style={styles.completedBanner}>
              <Text style={styles.completedText}>✓ Completed</Text>
              <TouchableOpacity onPress={() => setShowSubmission(true)}>
                <Text style={styles.viewResultsButton}>View Results</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.listHeading}>Complete the Problems</Text>
              <FlatList
                data={selectedAssignment.problems}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.problemCard}>
                    <View style={styles.problemHeader}>
                      <Text style={styles.problemNumber}>
                        Problem {index + 1}
                      </Text>
                      <View style={getDifficultyBadgeStyle(item.difficulty)}>
                        <Text style={getDifficultyTextStyle(item.difficulty)}>
                          {item.difficulty.charAt(0).toUpperCase() +
                            item.difficulty.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.problemQuestion}>{item.question}</Text>
                    <Text style={styles.problemMeta}>
                      <Text style={styles.answerLabel}>Type: </Text>
                      {getTypeLabel(item.type)}
                    </Text>

                    {item.type === "text" && (
                      <TextInput
                        value={studentAnswers[item.id] || ""}
                        onChangeText={(text) =>
                          setStudentAnswers({
                            ...studentAnswers,
                            [item.id]: text,
                          })
                        }
                        placeholder="Type your answer..."
                        style={[styles.textInput, styles.studentInput]}
                        multiline
                        numberOfLines={3}
                        placeholderTextColor="#9ca3af"
                      />
                    )}

                    {item.type === "truefalse" && (
                      <View style={styles.difficultyButtons}>
                        {["True", "False"].map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            onPress={() =>
                              setStudentAnswers({
                                ...studentAnswers,
                                [item.id]: opt,
                              })
                            }
                            style={[
                              styles.diffButton,
                              studentAnswers[item.id] === opt &&
                              styles.diffButtonActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.diffButtonText,
                                studentAnswers[item.id] === opt &&
                                styles.diffButtonTextActive,
                              ]}
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {item.type === "multiplechoice" && item.options && (
                      <View style={styles.optionsList}>
                        {item.options.map((option, optIndex) => (
                          <TouchableOpacity
                            key={optIndex}
                            onPress={() =>
                              setStudentAnswers({
                                ...studentAnswers,
                                [item.id]: option,
                              })
                            }
                            style={[
                              styles.multipleChoiceOption,
                              studentAnswers[item.id] === option &&
                              styles.multipleChoiceOptionSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.multipleChoiceText,
                                studentAnswers[item.id] === option &&
                                styles.multipleChoiceTextSelected,
                              ]}
                            >
                              {option}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
                scrollEnabled={false}
              />

              <TouchableOpacity
                onPress={submitAssignment}
                style={[
                  styles.addButton,
                  Object.keys(studentAnswers).length !==
                  selectedAssignment.problems.length && styles.disabledButton,
                ]}
                disabled={
                  Object.keys(studentAnswers).length !==
                  selectedAssignment.problems.length
                }
              >
                <Text style={styles.addButtonText}>Submit Assignment</Text>
              </TouchableOpacity>
              {Object.keys(studentAnswers).length !==
                selectedAssignment.problems.length && (
                  <Text style={styles.warningText}>
                    Please answer all problems before submitting
                  </Text>
                )}
            </>
          )}
        </View>
      </ScrollView>
    );
  }

  if (role === "teacher" && selectedAssignment) {
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
        <View style={styles.roleToggle}>
          <TouchableOpacity
            onPress={() => {
              setRole("teacher");
              setSelectedAssignment(null);
              setStudentAnswers({});
            }}
            style={[
              styles.roleButton,
              role === "teacher" && styles.roleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "teacher" && styles.roleButtonTextActive,
              ]}
            >
              Teacher
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setRole("student");
              setSelectedAssignment(null);
              setStudentAnswers({});
            }}
            style={[
              styles.roleButton,
              role === "student" && styles.roleButtonActive,
            ]}
          >
            <Text
              style={[
                styles.roleButtonText,
                role === "student" && styles.roleButtonTextActive,
              ]}
            >
              Student
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>
          {role === "teacher" ? "Manage Assignments" : "My Assignments"}
        </Text>
        <Text style={styles.subheading}>
          {role === "teacher"
            ? "Create and manage assignments"
            : "Complete your assignments"}
        </Text>

        {role === "teacher" && (
          <TouchableOpacity
            onPress={() => setShowCreateAssignment(true)}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+ Create Assignment</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.listHeading}>
          {role === "teacher" ? "Your Assignments" : "Available Assignments"} (
          {assignments.length})
        </Text>

        {role === "student" && !selectedAssignment && !showSubmission && (
          <>
          <Text style={styles.listHeading}>
             SAVED / Extracted Equations ({savedEquations.length})
          </Text>


          {savedEquations.length === 0 ? (
            <Text style={styles.emptyState}>
                Nothing saved yet. Use the "Save to Student" via 'Equations' Tab.
            </Text>

          ) : (


            <FlatList
              data={savedEquations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.extractSaveContainer}>
                  <Text style={styles.extractSavedTitle} numberOfLines={2}>
                    {item.fromProblem}
                  </Text>

                

                  <Text style={styles.extractSavedlabel}> Equation</Text>
                  <Text style={styles.extractEquationOnLine}>{item.equation}</Text>


                  {item.substitutedEquation ? (
                    <>
                      <Text style={styles.extractSavedlabel}>With Values</Text>
                      <Text style={styles.extractEquationOnLine}>
                        {item.substitutedEquation}
                      </Text>
                    
                    
                    </>
                  ) : null}

                  {!!item.variables?.length && (
                    <Text style={styles.extractSavedVars}>
                      Variables: {item.variables.join(", ")}
                    </Text>
                  )}


                  <View style={styles.extractSavedFooter}>
                    <Text style={styles.extractTimeStamp}>Saved {item.savedAt}</Text>
                    <TouchableOpacity onPress={() => removeSavedEquation(item.id)}>
                      <Text style={styles.extractDeleteButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                
                </View>
              )}
              scrollEnabled={false}
              />
              )}


              {savedEquations.length > 0 && (
                <TouchableOpacity
                onPress={clearSavedEquations}
                style={styles.addButton} > 
                <Text style={styles.addButtonText}> Clear Saved Equations </Text>
                </TouchableOpacity>
              )}
         
          </>
        )}

        {assignments.length === 0 ? (
          <Text style={styles.emptyState}>
            {role === "teacher"
              ? "No assignments yet. Create one above!"
              : "No assignments available yet."}
          </Text>
        ) : (
          <FlatList
            data={assignments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const submission =
                role === "student" ? getSubmission(item.id) : null;
              const isCompleted = submission !== undefined;

              return (
                <TouchableOpacity
                  onPress={() => {
                    if (role === "student" && isCompleted) {
                      setSelectedAssignment(item);
                      setShowSubmission(true);
                    } else {
                      setSelectedAssignment(item);
                    }
                  }}
                  style={styles.assignmentCard}
                >
                  <View style={styles.assignmentHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.assignmentName}>{item.name}</Text>
                      <Text style={styles.assignmentMeta}>
                        {item.problems.length} problem
                        {item.problems.length !== 1 ? "s" : ""} •{" "}
                        {item.createdAt}
                      </Text>
                      {role === "student" && isCompleted && submission && (
                        <Text style={styles.completedLabel}>
                          ✓ Completed - Score: {submission.score}/
                          {item.problems.length}
                        </Text>
                      )}
                    </View>
                    {role === "teacher" && (
                      <TouchableOpacity
                        onPress={() => deleteAssignment(item.id)}
                        style={styles.assignmentDelete}
                      >
                        <Text style={styles.deleteButton}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
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
  roleToggle: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 24,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center" as const,
  },
  roleButtonActive: {
    backgroundColor: "#2563eb",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600" as "600",
    color: "#6b7280",
  },
  roleButtonTextActive: {
    color: "white",
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: "center" as const,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
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
  completedLabel: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600" as "600",
    marginTop: 4,
  },
  completedBanner: {
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  completedText: {
    fontSize: 16,
    color: "#166534",
    fontWeight: "600" as "600",
  },
  viewResultsButton: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600" as "600",
  },
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
  problemNumber: {
    fontSize: 14,
    fontWeight: "600" as "600",
    color: "#2563eb",
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
  correctBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  incorrectBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  correctText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "600" as "600",
  },
  incorrectText: {
    color: "#991b1b",
    fontSize: 12,
    fontWeight: "600" as "600",
  },
  deleteButton: { fontSize: 15, color: "#ef4444", fontWeight: "600" as "600" },
  problemQuestion: {
    fontSize: 16,
    fontWeight: "600" as "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  problemAnswer: { fontSize: 14, color: "#4b5563", marginBottom: 4 },
  answerLabel: { fontWeight: "600" as "600" },
  studentInput: {
    marginTop: 8,
  },
  multipleChoiceOption: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  multipleChoiceOptionSelected: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  multipleChoiceText: {
    fontSize: 14,
    color: "#1f2937",
  },
  multipleChoiceTextSelected: {
    fontWeight: "600" as "600",
    color: "#2563eb",
  },
  scoreCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    alignItems: "center" as const,
    elevation: 3,
  },
  scoreText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "bold" as "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: "600" as "600",
    color: "#16a34a",
  },
  warningText: {
    color: "#ef4444",
    textAlign: "center" as "center",
    fontSize: 14,
    marginTop: 8,
  },
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

  extractSaveContainer: {
    backgroundColor: "white",
    padding: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  extractSavedTitle: {
    fontSize: 16, 
    fontWeight: "500" as const,
    color: "#1f2937",

  },

  extractSavedlabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#6b7280",
  },

  extractEquationOnLine: {
    fontSize: 14,
    color: "#1f2937",
  },

  extractSavedVars: {
    fontSize: 12, 
    color: "#374151",
    marginTop: 6,
  },

  extractSavedFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 10,
  },

  extractTimeStamp: {
    fontSize: 12,
    color: "#6b7280",
  },

  extractDeleteButtonText: {
    fontSize: 14,
    color: "#ef4442",
    fontWeight: "500" as const,
  },
}