import { useState } from "react";

const ThemedText = ({ children, type, style }: any) => (
  <span
    style={{
      fontSize: type === "title" ? 32 : type === "subtitle" ? 20 : 16,
      fontWeight: type === "title" || type === "subtitle" ? "bold" : "normal",
      color: "#1f2937",
      ...style,
    }}
  >
    {children}
  </span>
);

const ThemedView = ({ children, style }: any) => (
  <div style={{ ...style }}>{children}</div>
);

const LaTeXRenderer = ({ equation, style }: any) => (
  <div style={{ padding: 16, fontFamily: "monospace", fontSize: 18, ...style }}>
    {equation}
  </div>
);

const ParallaxScrollView = ({ children, headerBackgroundColor }: any) => (
  <div
    style={{
      minHeight: "100vh",
      backgroundColor: "#f0f9ff",
      padding: 24,
    }}
  >
    {children}
  </div>
);

// Types
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

type EquationData = {
  equation: string;
  substitutedEquation: string;
  variables: string[];
};

export default function MathLearningPlatform() {
  const [activeTab, setActiveTab] = useState<"practice" | "assignments">(
    "practice",
  );

  // Practice Tab State
  const [problem, setProblem] = useState<string | null>(null);
  const [equationData, setEquationData] = useState<EquationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInput, setUserInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<
    "submitted" | "canceled" | null
  >(null);
  const [showHint, setShowHint] = useState(false);

  // Assignment Tab State
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
  const [answerFeedback, setAnswerFeedback] = useState<{
    [key: number]: "submitted" | "canceled" | null;
  }>({});

  // Practice Tab Functions
  const validateInput = (text: string): boolean => {
    setInputError(null);
    if (!text || text.trim().length === 0) {
      setInputError("Please enter a math problem");
      return false;
    }
    if (text.trim().length < 10) {
      setInputError("Problem seems too short. Please provide more details");
      return false;
    }
    if (text.length > 2000) {
      setInputError(
        "Problem is too long. Please keep it under 2000 characters",
      );
      return false;
    }
    return true;
  };

  const handleSubmitCustomProblem = async () => {
    if (!validateInput(userInput)) return;

    setLoading(true);
    setError(null);
    setInputError(null);
    setEquationData(null);
    setPracticeAnswer("");
    setPracticeFeedback(null);
    setShowHint(false);

    const trimmedProblem = userInput.trim();
    setProblem(trimmedProblem);

    // Simulate equation extraction
    setTimeout(() => {
      setEquationData({
        equation: "v = \\frac{d}{t}",
        substitutedEquation: "v = \\frac{120}{2} = 60",
        variables: ["v (velocity)", "d (distance)", "t (time)"],
      });
      setLoading(false);
    }, 1000);

    setUserInput("");
  };

  const fetchMathProblem = () => {
    setLoading(true);
    setError(null);
    setEquationData(null);
    setPracticeAnswer("");
    setPracticeFeedback(null);
    setShowHint(false);

    setTimeout(() => {
      setProblem(
        "A car travels 120 km in 2 hours. What is its average speed in km/h?",
      );
      setEquationData({
        equation: "v = \\frac{d}{t}",
        substitutedEquation: "v = \\frac{120}{2} = 60",
        variables: ["v (velocity)", "d (distance)", "t (time)"],
      });
      setLoading(false);
    }, 1000);
  };

  const saveEquationAsJSON = () => {
    if (!equationData) {
      alert("Error: No equation data to save");
      return;
    }

    const jsonData = {
      equation: equationData.equation,
      substitutedEquation: equationData.substitutedEquation,
      variables: equationData.variables,
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `equation_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert("File saved successfully!");
  };

  // Assignment Tab Functions
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
        updatedAssignments.find((a) => a.id === selectedAssignment.id) || null,
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
        updatedAssignments.find((a) => a.id === selectedAssignment.id) || null,
      );
    }
  };

  const submitAssignment = () => {
    if (!selectedAssignment) return;

    let score = 0;
    selectedAssignment.problems.forEach((problem) => {
      const studentAnswer = studentAnswers[problem.id]?.trim().toLowerCase();
      const correctAnswer = problem.answer.trim().toLowerCase();
      if (studentAnswer === correctAnswer) score++;
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

  const getSubmission = (assignmentId: number) => {
    return submissions.find((s) => s.assignmentId === assignmentId);
  };

  const renderPracticeTab = () => (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Equation Practice</ThemedText>
      </ThemedView>

      <ThemedView style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>
          Enter Your Math Problem:
        </ThemedText>
        <textarea
          style={styles.textInput}
          placeholder="e.g., A car travels 120 km in 2 hours. What is its speed?"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          rows={4}
          maxLength={2000}
        />
        {inputError && (
          <ThemedText style={styles.inputErrorText}>{inputError}</ThemedText>
        )}
        <ThemedText style={styles.characterCount}>
          {userInput.length}/2000 characters
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.buttonRow}>
        <button
          style={{
            ...styles.submitButton,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          onClick={handleSubmitCustomProblem}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? "Processing..." : "Submit Problem"}
          </ThemedText>
        </button>
        <button
          style={{
            ...styles.generateButton,
            ...(loading ? styles.buttonDisabled : {}),
          }}
          onClick={fetchMathProblem}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>Random Problem</ThemedText>
        </button>
      </ThemedView>

      {loading && !problem ? (
        <div style={styles.centerContent}>
          <div style={styles.spinner} />
          <ThemedText style={styles.loadingText}>
            Generating problem...
          </ThemedText>
        </div>
      ) : problem ? (
        <>
          <ThemedView style={styles.problemBox}>
            <ThemedText style={styles.problemText}>{problem}</ThemedText>
          </ThemedView>

          {equationData && (
            <>
              <ThemedView style={styles.equationContainer}>
                <ThemedText type="subtitle" style={styles.equationLabel}>
                  Extracted Equation:
                </ThemedText>

                <ThemedView style={styles.equationBox}>
                  <ThemedText style={styles.equationTitle}>
                    Template:
                  </ThemedText>
                  <LaTeXRenderer equation={equationData.equation} />
                </ThemedView>

                {equationData.variables &&
                  equationData.variables.length > 0 && (
                    <ThemedView style={styles.variablesBox}>
                      <ThemedText style={styles.equationTitle}>
                        Variables:
                      </ThemedText>
                      {equationData.variables.map((variable, index) => (
                        <div key={index} style={styles.variableItem}>
                          <ThemedText>{variable}</ThemedText>
                        </div>
                      ))}
                    </ThemedView>
                  )}

                {equationData.substitutedEquation && (
                  <ThemedView style={styles.equationBox}>
                    <ThemedText style={styles.equationTitle}>
                      With Values:
                    </ThemedText>
                    <LaTeXRenderer
                      equation={equationData.substitutedEquation}
                    />
                  </ThemedView>
                )}
              </ThemedView>

              <button style={styles.saveButton} onClick={saveEquationAsJSON}>
                <ThemedText style={styles.buttonText}>Save as JSON</ThemedText>
              </button>
            </>
          )}

          {/* Answer Section */}
          <ThemedView style={styles.answerSection}>
            <ThemedText style={styles.answerLabel}>Your Answer:</ThemedText>
            <textarea
              style={styles.answerInput}
              placeholder="Enter your answer here..."
              value={practiceAnswer}
              onChange={(e) => {
                setPracticeAnswer(e.target.value);
                setPracticeFeedback(null);
              }}
              rows={3}
            />
            {practiceFeedback && (
              <ThemedText
                style={
                  practiceFeedback === "submitted"
                    ? styles.feedbackSubmitted
                    : styles.feedbackCanceled
                }
              >
                {practiceFeedback === "submitted" ? "Submitted" : "Canceled"}
              </ThemedText>
            )}
            <div style={styles.answerButtons}>
              <button
                onClick={() => {
                  setPracticeFeedback("submitted");
                }}
                style={styles.submitAnswerButton}
              >
                <ThemedText style={styles.buttonText}>Submit</ThemedText>
              </button>
              <button
                onClick={() => {
                  setPracticeFeedback("canceled");
                  setPracticeAnswer("");
                }}
                style={styles.cancelAnswerButton}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                style={styles.hintButton}
              >
                <ThemedText style={styles.buttonText}>
                  {showHint ? "Hide Hint" : "Get Hint"}
                </ThemedText>
              </button>
            </div>
            {showHint && (
              <ThemedView style={styles.hintBox}>
                <ThemedText style={styles.hintText}>
                  Hint: Start by identifying the given values and the formula
                  needed to solve this problem.
                </ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </>
      ) : (
        <ThemedView style={styles.centerContent}>
          <ThemedText style={styles.emptyText}>
            Enter a custom problem above or click "Random Problem" to get
            started!
          </ThemedText>
        </ThemedView>
      )}
    </div>
  );

  const renderAssignmentsTab = () => {
    if (selectedAssignment) {
      return renderAssignmentDetail();
    }

    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={styles.roleToggle}>
          <button
            onClick={() => setRole("teacher")}
            style={{
              ...styles.roleButton,
              ...(role === "teacher" ? styles.roleButtonActive : {}),
            }}
          >
            <span
              style={{
                ...styles.roleButtonText,
                ...(role === "teacher" ? styles.roleButtonTextActive : {}),
              }}
            >
              Teacher
            </span>
          </button>
          <button
            onClick={() => setRole("student")}
            style={{
              ...styles.roleButton,
              ...(role === "student" ? styles.roleButtonActive : {}),
            }}
          >
            <span
              style={{
                ...styles.roleButtonText,
                ...(role === "student" ? styles.roleButtonTextActive : {}),
              }}
            >
              Student
            </span>
          </button>
        </div>

        <ThemedText type="title">
          {role === "teacher" ? "Manage Assignments\n" : "My Assignments"}
        </ThemedText>
        <ThemedText style={styles.subheading}>
          {role === "teacher"
            ? "\nCreate and manage assignments"
            : "Complete your assignments"}
        </ThemedText>

        {role === "teacher" && (
          <button
            style={styles.addButton}
            onClick={() => setShowCreateAssignment(true)}
          >
            <ThemedText style={styles.buttonText}>
              + Create Assignment
            </ThemedText>
          </button>
        )}

        <ThemedText style={styles.listHeading}>
          {role === "teacher" ? "Your Assignments" : "Available Assignments"} (
          {assignments.length})
        </ThemedText>

        {assignments.length === 0 ? (
          <ThemedText style={styles.emptyState}>
            {role === "teacher"
              ? "No assignments yet. Create one above!"
              : "No assignments available yet."}
          </ThemedText>
        ) : (
          assignments.map((item) => {
            const submission =
              role === "student" ? getSubmission(item.id) : null;
            const isCompleted = submission !== undefined;

            return (
              <div
                key={item.id}
                style={styles.assignmentCard}
                onClick={() => setSelectedAssignment(item)}
              >
                <div style={{ flex: 1 }}>
                  <ThemedText style={styles.assignmentName}>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.assignmentMeta}>
                    {item.problems.length} problem
                    {item.problems.length !== 1 ? "s" : ""} • {item.createdAt}
                  </ThemedText>
                  {role === "student" && isCompleted && submission && (
                    <ThemedText style={styles.completedLabel}>
                      Completed - Score: {submission.score}/
                      {item.problems.length}
                    </ThemedText>
                  )}
                </div>
                {role === "teacher" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAssignment(item.id);
                    }}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })
        )}

        {showCreateAssignment && (
          <div
            style={styles.modalOverlay}
            onClick={() => setShowCreateAssignment(false)}
          >
            <div
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <ThemedText type="subtitle">Create Assignment</ThemedText>
              <ThemedText style={styles.label}>Assignment Name</ThemedText>
              <input
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                placeholder="e.g., Algebra Quiz 1"
                style={styles.textInput}
              />
              <div style={styles.modalButtons}>
                <button
                  onClick={() => setShowCreateAssignment(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button onClick={createAssignment} style={styles.confirmButton}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAssignmentDetail = () => {
    // Simplified version - full implementation would include problem management UI
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          onClick={() => setSelectedAssignment(null)}
          style={styles.backButton}
        >
          ← Back
        </button>
        <ThemedText type="title">{selectedAssignment!.name}</ThemedText>
        <ThemedText style={styles.subheading}>
          {selectedAssignment!.problems.length} problems
        </ThemedText>

        {role === "teacher" && (
          <button
            style={styles.addButton}
            onClick={() => setShowAddProblem(true)}
          >
            <ThemedText style={styles.buttonText}>+ Add Problem</ThemedText>
          </button>
        )}

        {selectedAssignment!.problems.length === 0 ? (
          <ThemedText style={styles.emptyState}>
            No problems yet. Add one above!
          </ThemedText>
        ) : (
          selectedAssignment!.problems.map((item) => (
            <div key={item.id} style={styles.problemCard}>
              <ThemedText style={styles.problemQuestion}>
                {item.question}
              </ThemedText>
              {role === "teacher" ? (
                <>
                  <ThemedText style={styles.problemAnswer}>
                    <strong>Answer:</strong> {item.answer}
                  </ThemedText>
                  <button
                    onClick={() => deleteProblem(item.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <ThemedText style={styles.answerLabel}>
                    Your Answer:
                  </ThemedText>
                  <textarea
                    style={styles.answerInput}
                    placeholder="Enter your answer here..."
                    value={studentAnswers[item.id] || ""}
                    onChange={(e) =>
                      setStudentAnswers({
                        ...studentAnswers,
                        [item.id]: e.target.value,
                      })
                    }
                    rows={3}
                  />
                  {answerFeedback[item.id] && (
                    <ThemedText
                      style={
                        answerFeedback[item.id] === "submitted"
                          ? styles.feedbackSubmitted
                          : styles.feedbackCanceled
                      }
                    >
                      {answerFeedback[item.id] === "submitted"
                        ? "Submitted"
                        : "Canceled"}
                    </ThemedText>
                  )}
                  <div style={styles.answerButtons}>
                    <button
                      onClick={() => {
                        setAnswerFeedback({
                          ...answerFeedback,
                          [item.id]: "submitted",
                        });
                      }}
                      style={styles.submitAnswerButton}
                    >
                      <ThemedText style={styles.buttonText}>Submit</ThemedText>
                    </button>
                    <button
                      onClick={() => {
                        setAnswerFeedback({
                          ...answerFeedback,
                          [item.id]: "canceled",
                        });
                        setStudentAnswers({
                          ...studentAnswers,
                          [item.id]: "",
                        });
                      }}
                      style={styles.cancelAnswerButton}
                    >
                      <ThemedText style={styles.cancelButtonText}>
                        Cancel
                      </ThemedText>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f0f9ff",
        padding: 24,
        paddingBottom: 200,
        overflowY: "auto",
      }}
    >
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab("practice")}
          style={{
            ...styles.tab,
            ...(activeTab === "practice" ? styles.activeTab : {}),
          }}
        >
          <span
            style={{
              ...styles.tabText,
              ...(activeTab === "practice" ? styles.activeTabText : {}),
            }}
          >
            Practice
          </span>
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          style={{
            ...styles.tab,
            ...(activeTab === "assignments" ? styles.activeTab : {}),
          }}
        >
          <span
            style={{
              ...styles.tabText,
              ...(activeTab === "assignments" ? styles.activeTabText : {}),
            }}
          >
            Assignments
          </span>
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        {activeTab === "practice"
          ? renderPracticeTab()
          : renderAssignmentsTab()}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  tabContainer: {
    display: "flex",
    gap: 12,
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: 8,
    maxWidth: 900,
    margin: "0 auto",
  },
  tab: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "8px 8px 0 0",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  activeTab: {
    backgroundColor: "#2563eb",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "white",
  },
  titleContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.3)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    fontFamily: "inherit",
  },
  inputErrorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "right",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#34C759",
    padding: "12px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  generateButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: "12px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
  problemBox: {
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    border: "1px solid rgba(128, 128, 128, 0.2)",
  },
  problemText: {
    fontSize: 16,
    lineHeight: 1.5,
  },
  equationContainer: {
    gap: 16,
    marginBottom: 16,
  },
  equationLabel: {
    marginBottom: 8,
  },
  equationBox: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    border: "1px solid rgba(0, 122, 255, 0.3)",
  },
  equationTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.8,
  },
  variablesBox: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    border: "1px solid rgba(255, 149, 0, 0.3)",
  },
  variableItem: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  saveButton: {
    backgroundColor: "#34C759",
    padding: "12px 32px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    display: "block",
    margin: "16px auto",
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },
  roleToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    backgroundColor: "transparent",
  },
  roleButtonActive: {
    backgroundColor: "#2563eb",
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  roleButtonTextActive: {
    color: "white",
  },
  subheading: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    border: "none",
    cursor: "pointer",
    width: "100%",
  },
  listHeading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  emptyState: {
    color: "#9ca3af",
    textAlign: "center",
    padding: 32,
    fontSize: 16,
  },
  assignmentCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignmentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  assignmentMeta: {
    fontSize: 13,
    color: "#6b7280",
  },
  completedLabel: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "600",
    marginTop: 4,
  },
  deleteButton: {
    fontSize: 15,
    color: "#ef4444",
    fontWeight: "600",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 8,
  },
  backButton: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
    marginBottom: 16,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
  },
  problemCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  problemQuestion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  problemAnswer: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  modalOverlay: {
    position: "fixed" as "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    maxWidth: 500,
    width: "90%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 12,
  },
  modalButtons: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 12,
    border: "none",
    cursor: "pointer",
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  answerSection: {
    marginTop: 24,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 12,
    marginBottom: 8,
  },
  answerInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.3)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "rgba(128, 128, 128, 0.05)",
    fontFamily: "inherit",
    resize: "vertical" as "vertical",
    marginBottom: 8,
  },
  answerButtons: {
    display: "flex",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap" as "wrap",
  },
  submitAnswerButton: {
    flex: "1 1 auto",
    minWidth: 120,
    backgroundColor: "#34C759",
    borderRadius: 8,
    padding: 12,
    border: "none",
    cursor: "pointer",
  },
  cancelAnswerButton: {
    flex: "1 1 auto",
    minWidth: 120,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    border: "1px solid rgba(128, 128, 128, 0.3)",
    cursor: "pointer",
  },
  hintButton: {
    flex: "1 1 auto",
    minWidth: 120,
    backgroundColor: "#FF9500",
    borderRadius: 8,
    padding: 12,
    border: "none",
    cursor: "pointer",
  },
  hintBox: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    border: "1px solid rgba(255, 149, 0, 0.3)",
  },
  hintText: {
    fontSize: 14,
    color: "#1f2937",
    lineHeight: 1.5,
  },
  cancelButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
  feedbackSubmitted: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  feedbackCanceled: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
};
