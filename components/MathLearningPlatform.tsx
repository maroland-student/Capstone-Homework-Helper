import { EquationData, HintGenerator, StepContext } from "@/lib/hint-generator";
import { useSubjects } from "@/lib/subjects-context";
import {
    validateEquationSyntax,
    validateEquationTemplate,
} from "@/utilities/equationValidator";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

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
    <div
        style={{
            padding: 16,
            fontFamily: "monospace",
            fontSize: 18,
            overflowX: "auto",
            whiteSpace: "pre",
            WebkitOverflowScrolling: "touch",
            ...style,
        }}
    >
        {equation}
    </div>
);

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

type StepCheckpoint = {
    instruction: string;
    checkpoint: string;
};

export default function MathLearningPlatform() {
    const { selectedTopics } = useSubjects();
    const [activeTab, setActiveTab] = useState<"practice" | "assignments">(
        "practice",
    );

    const [problem, setProblem] = useState<string | null>(null);
    const [equationData, setEquationData] = useState<EquationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState("");
    const [inputError, setInputError] = useState<string | null>(null);
    const [practiceAnswer, setPracticeAnswer] = useState("");
    const [practiceFeedback, setPracticeFeedback] = useState<
        "submitted" | "canceled" | null
    >(null);
    const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
    const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);

    // Checkpoint/Step-by-step state
    const [stepData, setStepData] = useState<{
        targetVariable: string;
        startEquation: string;
        steps: StepCheckpoint[];
        finalAnswer: string;
    } | null>(null);
    const [stepLoading, setStepLoading] = useState(false);
    const [stepError, setStepError] = useState<string | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [lastCorrectStepIndex, setLastCorrectStepIndex] = useState(-1);
    const [stepFeedbackText, setStepFeedbackText] = useState<string | null>(null);
    const [stepFeedbackCorrect, setStepFeedbackCorrect] = useState<
        boolean | null
    >(null);
    const [stepAttemptsByIndex, setStepAttemptsByIndex] = useState<
        Record<number, number>
    >({});

    // Hint state
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [hintLevel, setHintLevel] = useState<number>(0);
    const [loadingHint, setLoadingHint] = useState(false);
    const hintGeneratorRef = useRef<HintGenerator | null>(null);
    const [showCheatSheet, setShowCheatSheet] = useState(false);

    useEffect(() => {
        resetHints();
    }, [currentStepIndex]);

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

    const allStepsComplete =
        stepData !== null &&
        stepData.steps.length > 0 &&
        currentStepIndex >= stepData.steps.length;

    const inActiveStep =
        stepData !== null &&
        stepData.steps.length > 0 &&
        currentStepIndex < stepData.steps.length;

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

    const extractAnswerFromEquation = (
        substitutedEquation: string,
    ): number | null => {
        try {
            const parts = substitutedEquation.split("=").map((p) => p.trim());
            const lastPart = parts[parts.length - 1];

            let expression = lastPart
                .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
                .replace(/\s+/g, "");

            if (/^[0-9+\-*/().\s]+$/.test(expression)) {
                const result = Function(`"use strict"; return (${expression})`)();
                if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
                    return result;
                }
            }
        } catch (e) {
            console.error("Error extracting answer from equation:", e);
        }
        return null;
    };

    const normalizeAnswer = (answer: string): number | null => {
        try {
            let cleaned = answer.trim();
            cleaned = cleaned.replace(
                /\s*(km\/h|km|hours?|hrs?|miles?|mph|units?|degrees?|°)\s*/gi,
                "",
            );
            cleaned = cleaned.replace(/\s+/g, "");

            const numberMatch = cleaned.match(/^-?\d+\.?\d*$/);
            if (numberMatch) {
                return parseFloat(numberMatch[0]);
            }

            if (/^[0-9+\-*/().\s]+$/.test(cleaned)) {
                const result = Function(`"use strict"; return (${cleaned})`)();
                if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
                    return result;
                }
            }
        } catch (e) {
            console.error("Error normalizing answer:", e);
        }
        return null;
    };

    const checkAnswer = (studentAnswer: string): boolean => {
        if (!studentAnswer.trim()) return false;

        let correctValue: number | null = null;

        if (equationData?.substitutedEquation) {
            correctValue = extractAnswerFromEquation(
                equationData.substitutedEquation,
            );
        }

        if (correctValue === null && problem) {
            const answerMatch = problem.match(
                /(?:answer|result|solution|equals?|is)\s*:?\s*([0-9]+\.?[0-9]*)/i,
            );
            if (answerMatch) {
                correctValue = parseFloat(answerMatch[1]);
            }
        }

        if (correctValue === null) {
            return false;
        }

        const studentValue = normalizeAnswer(studentAnswer);

        if (studentValue === null) {
            return false;
        }

        const tolerance = 0.01;
        const isCorrect = Math.abs(studentValue - correctValue) < tolerance;

        setCorrectAnswer(correctValue.toString());
        return isCorrect;
    };

    const handleGetHint = async () => {
        if (!problem) return;

        if (allStepsComplete) return;

        if (!hintGeneratorRef.current) {
            let ctx: StepContext | null = null;
            if (inActiveStep && stepData) {
                const step = stepData.steps[currentStepIndex];
                ctx = {
                    stepIndex: currentStepIndex,
                    totalSteps: stepData.steps.length,
                    instruction: step.instruction,
                    checkpoint: step.checkpoint,
                };
            }
            hintGeneratorRef.current = new HintGenerator(problem, equationData, ctx);
        }

        if (!hintGeneratorRef.current.hasMoreHints()) {
            return;
        }

        setLoadingHint(true);
        try {
            const hintResponse = await hintGeneratorRef.current.getNextHint();
            if (hintResponse) {
                setCurrentHint(hintResponse.hint);
                setHintLevel(hintResponse.level);
            }
        } catch (error) {
            console.error("Failed to get hint:", error);
            setCurrentHint("Unable to generate hint. Please try again.");
        } finally {
            setLoadingHint(false);
        }
    };

    const resetHints = () => {
        setCurrentHint(null);
        setHintLevel(0);
        hintGeneratorRef.current = null;
    };

    const handleSubmitCustomProblem = async () => {
        if (!validateInput(userInput)) return;

        setLoading(true);
        setError(null);
        setInputError(null);
        setEquationData(null);
        setPracticeAnswer("");
        setPracticeFeedback(null);
        setAnswerCorrect(null);
        setCorrectAnswer(null);
        resetHints();

        const trimmedProblem = userInput.trim();
        setProblem(trimmedProblem);

        setExtracting(true);
        try {
            const extractResponse = await fetch(
                `${API_BASE_URL}/api/openai/extract-equation`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ problem: trimmedProblem }),
                },
            );

            if (extractResponse.ok) {
                const extractedData = await extractResponse.json();
                if (extractedData.equation) {
                    const eq = extractedData.equation || "";
                    const subEq = extractedData.substitutedEquation || "";

                    const syntaxCheck = validateEquationSyntax(subEq);
                    const templateCheck = validateEquationTemplate(eq, subEq);

                    if (!syntaxCheck.isValid || !templateCheck.isValid) {
                        console.warn("Extracted equation failed validation:", {
                            syntaxErrors: syntaxCheck.errors,
                            templateErrors: templateCheck.errors,
                        });
                    }

                    setEquationData({
                        equation: eq,
                        substitutedEquation: subEq,
                        variables: Array.isArray(extractedData.variables)
                            ? extractedData.variables
                            : [],
                    });
                }
            } else {
                console.warn("Equation extraction failed");
            }
        } catch (extractErr) {
            console.error("Error extracting equation:", extractErr);
        } finally {
            setExtracting(false);
            setLoading(false);
        }

        setUserInput("");
    };

    const fetchMathProblem = async () => {
        try {
            setLoading(true);
            setError(null);
            setEquationData(null);
            setPracticeAnswer("");
            setPracticeFeedback(null);
            setAnswerCorrect(null);
            setCorrectAnswer(null);
            resetHints();

            const topicIds = Array.from(selectedTopics);
            const queryParams =
                topicIds.length > 0 ? `?topics=${topicIds.join(",")}` : "";

            const response = await fetch(
                `${API_BASE_URL}/api/openai/math-problem${queryParams}`,
            );

            if (!response.ok) {
                const errorText = await response.text().catch(() => "Unknown error");
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (!data || typeof data !== "object") {
                throw new Error("Invalid response format from server");
            }

            const fullProblem = data.problem || "No problem generated";
            setProblem(fullProblem);

            setExtracting(true);
            try {
                const extractResponse = await fetch(
                    `${API_BASE_URL}/api/openai/extract-equation`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ problem: fullProblem }),
                    },
                );

                if (extractResponse.ok) {
                    const extractedData = await extractResponse.json();
                    if (extractedData.equation) {
                        const eq = extractedData.equation || "";
                        const subEq = extractedData.substitutedEquation || "";

                        const syntaxCheck = validateEquationSyntax(subEq);
                        const templateCheck = validateEquationTemplate(eq, subEq);

                        if (!syntaxCheck.isValid || !templateCheck.isValid) {
                            console.warn("Extracted equation failed validation:", {
                                syntaxErrors: syntaxCheck.errors,
                                templateErrors: templateCheck.errors,
                            });
                        }

                        setEquationData({
                            equation: eq,
                            substitutedEquation: subEq,
                            variables: Array.isArray(extractedData.variables)
                                ? extractedData.variables
                                : [],
                        });
                    }
                } else {
                    console.warn("Equation extraction failed");
                }
            } catch (extractErr) {
                console.error("Error extracting equation:", extractErr);
            } finally {
                setExtracting(false);
            }
        } catch (err) {
            console.error("Error fetching math problem:", err);
            setError("Failed to load math problem. Please try again.");
        } finally {
            setLoading(false);
        }
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

        alert("✓ File saved successfully!");
    };

    useEffect(() => {
        const substitutedEquation = equationData?.substitutedEquation?.trim();
        if (!problem || !substitutedEquation) {
            setStepData(null);
            setStepError(null);
            setStepLoading(false);
            setCurrentStepIndex(0);
            setLastCorrectStepIndex(-1);
            setStepFeedbackText(null);
            setStepFeedbackCorrect(null);
            setStepAttemptsByIndex({});
            return;
        }

        let cancelled = false;

        const load = async () => {
            try {
                setStepLoading(true);
                setStepError(null);
                setStepData(null);
                setCurrentStepIndex(0);
                setLastCorrectStepIndex(-1);
                setStepFeedbackText(null);
                setStepFeedbackCorrect(null);
                setStepAttemptsByIndex({});

                const resp = await fetch(
                    `${API_BASE_URL}/api/openai/step-checkpoints`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ problem, substitutedEquation }),
                    },
                );

                if (!resp.ok) {
                    const t = await resp.text().catch(() => "");
                    throw new Error(t || `HTTP ${resp.status}`);
                }

                const data = await resp.json();
                if (cancelled) return;

                const steps: StepCheckpoint[] = Array.isArray(data?.steps)
                    ? data.steps
                        .filter(
                            (s: any) =>
                                s &&
                                typeof s.instruction === "string" &&
                                typeof s.checkpoint === "string",
                        )
                        .map((s: any) => ({
                            instruction: s.instruction,
                            checkpoint: s.checkpoint,
                        }))
                    : [];

                const finalAnswer =
                    typeof data?.finalAnswer === "string" ? data.finalAnswer : "";

                console.log(
                    "[checkpoints] target:",
                    data?.targetVariable,
                    "final:",
                    finalAnswer,
                    "steps:",
                    steps,
                );

                setStepData({
                    targetVariable:
                        typeof data?.targetVariable === "string"
                            ? data.targetVariable
                            : "x",
                    startEquation:
                        typeof data?.startEquation === "string"
                            ? data.startEquation
                            : substitutedEquation,
                    steps,
                    finalAnswer,
                });
            } catch (e: any) {
                if (!cancelled) {
                    setStepError(e?.message || "Failed to load step checkpoints.");
                    setStepData(null);
                }
            } finally {
                if (!cancelled) setStepLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [problem, equationData?.substitutedEquation]);

    const submitStepAttempt = async () => {
        if (!stepData || !stepData.steps?.length) return;
        if (currentStepIndex >= stepData.steps.length) return;
        if (!practiceAnswer.trim()) return;

        const step = stepData.steps[currentStepIndex];
        const attemptNumber = (stepAttemptsByIndex[currentStepIndex] ?? 0) + 1;
        setStepAttemptsByIndex({
            ...stepAttemptsByIndex,
            [currentStepIndex]: attemptNumber,
        });
        setStepFeedbackText(null);
        setStepFeedbackCorrect(null);
        setPracticeFeedback(null);

        try {
            const resp = await fetch(`${API_BASE_URL}/api/openai/grade-step`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    startEquation: stepData.startEquation,
                    targetVariable: stepData.targetVariable,
                    stepInstruction: step.instruction,
                    expectedCheckpoint: step.checkpoint,
                    studentInput: practiceAnswer,
                }),
            });

            if (!resp.ok) {
                const t = await resp.text().catch(() => "");
                throw new Error(t || `HTTP ${resp.status}`);
            }

            const data = await resp.json();
            const correct = Boolean(data?.correct);
            const feedback =
                typeof data?.feedback === "string"
                    ? data.feedback
                    : correct
                        ? "Correct."
                        : "Incorrect.";

            if (correct) {
                setStepFeedbackCorrect(true);
                setStepFeedbackText(feedback);
                setLastCorrectStepIndex(currentStepIndex);
                setPracticeAnswer("");
                setPracticeFeedback("submitted");

                const next = currentStepIndex + 1;
                if (next >= stepData.steps.length) {
                    setCurrentStepIndex(stepData.steps.length);
                    if (stepData.finalAnswer) {
                        setStepFeedbackText(
                            `${feedback} Finished. Final answer: ${stepData.finalAnswer}`,
                        );
                    }
                } else {
                    setCurrentStepIndex(next);
                }
            } else {
                const rollbackTo = Math.max(lastCorrectStepIndex, 0);
                setStepFeedbackCorrect(false);
                setStepFeedbackText(
                    `${feedback} Checkpoint: returning to step ${rollbackTo + 1}.`,
                );
                setCurrentStepIndex(rollbackTo);
                setPracticeAnswer("");
                setPracticeFeedback("submitted");
            }
        } catch (e: any) {
            setStepFeedbackCorrect(false);
            setStepFeedbackText(e?.message || "Failed to grade this step.");
            setPracticeFeedback("submitted");
        }
    };

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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
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

                    {equationData?.substitutedEquation && (
                        <ThemedView style={styles.stepSection}>
                            <ThemedText type="subtitle" style={styles.stepTitle}>
                                Step-by-step (checkpoints)
                            </ThemedText>

                            {stepLoading ? (
                                <ThemedText style={styles.loadingText}>
                                    Loading steps…
                                </ThemedText>
                            ) : stepError ? (
                                <ThemedText style={styles.inputErrorText}>
                                    {stepError}
                                </ThemedText>
                            ) : stepData && stepData.steps.length > 0 ? (
                                <>
                                    <ThemedText style={styles.stepMeta}>
                                        Step {Math.min(currentStepIndex + 1, stepData.steps.length)}{" "}
                                        of {stepData.steps.length}
                                    </ThemedText>

                                    {currentStepIndex >= stepData.steps.length && (
                                        <ThemedText style={styles.feedbackCorrect}>
                                            ✓ Completed all steps.
                                            {stepData.finalAnswer
                                                ? ` Final answer: ${stepData.finalAnswer}`
                                                : ""}
                                        </ThemedText>
                                    )}

                                    {stepFeedbackText && (
                                        <ThemedText
                                            style={
                                                stepFeedbackCorrect === true
                                                    ? styles.feedbackCorrect
                                                    : styles.feedbackIncorrect
                                            }
                                        >
                                            {stepFeedbackText}
                                        </ThemedText>
                                    )}

                                    {currentStepIndex < stepData.steps.length && (
                                        <ThemedText style={styles.stepAttempts}>
                                            Attempts on this step:{" "}
                                            {stepAttemptsByIndex[currentStepIndex] ?? 0}
                                        </ThemedText>
                                    )}
                                </>
                            ) : null}
                        </ThemedView>
                    )}

                    <ThemedView style={styles.answerSection}>
                        <ThemedText style={styles.answerLabel}>
                            {inActiveStep ? "Your Step Result:" : "Your Answer:"}
                        </ThemedText>

                        {inActiveStep && stepData && (
                            <ThemedText style={styles.stepInstruction}>
                                {stepData.steps[currentStepIndex]?.instruction}
                            </ThemedText>
                        )}

                        <ThemedText style={styles.inputHint}>
                            {inActiveStep
                                ? "Tip: Type the equation after doing this step. Example: '2x = 10' or 'x + 5 = 15'"
                                : "Tip: You can type just the number (like '42') or the full equation (like 'x = 42')"}
                        </ThemedText>
                        <textarea
                            style={styles.answerInput}
                            placeholder={
                                inActiveStep
                                    ? "Example: 2x = 10 or x + 5 = 15"
                                    : "Example: 42 or x = 42"
                            }
                            value={practiceAnswer}
                            onChange={(e) => {
                                setPracticeAnswer(e.target.value);
                                setPracticeFeedback(null);
                                setStepFeedbackText(null);
                                setStepFeedbackCorrect(null);
                            }}
                            rows={3}
                            disabled={allStepsComplete && answerCorrect === true}
                        />

                        {role === "teacher" && (
                            <div
                                style={{
                                    marginTop: 6,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowCheatSheet((v) => !v)}
                                    style={styles.debugLink}
                                >
                                    {showCheatSheet ? "Hide (Demo)" : "Show (Demo)"}
                                </button>
                            </div>
                        )}

                        {role === "teacher" &&
                            showCheatSheet &&
                            stepData &&
                            stepData.steps.length > 0 && (
                                <div style={styles.debugBox}>
                                    <div style={styles.debugLine}>
                                        <span style={styles.debugLabel}> Expected : </span>
                                        <span style={styles.debugSingle}>
                                            {" "}
                                            {stepData.steps[currentStepIndex]?.checkpoint}{" "}
                                        </span>
                                    </div>
                                </div>
                            )}

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

                        {currentHint && (
                            <div style={styles.hintBox}>
                                <div style={styles.hintHeader}>
                                    <span style={styles.hintTitle}>
                                        {inActiveStep
                                            ? `Hint for Step ${currentStepIndex + 1} (${hintLevel}/3)`
                                            : `Hint ${hintLevel}/3`}
                                    </span>
                                    <button onClick={resetHints} style={styles.closeHintButton}>
                                        X
                                    </button>
                                </div>
                                <p style={styles.hintText}>{currentHint}</p>
                            </div>
                        )}

                        <div style={styles.answerButtons}>
                            <button
                                onClick={() => {
                                    if (inActiveStep) {
                                        submitStepAttempt();
                                        return;
                                    }

                                    const isCorrect = checkAnswer(practiceAnswer);
                                    setAnswerCorrect(isCorrect);
                                    setPracticeFeedback("submitted");
                                }}
                                style={styles.submitAnswerButton}
                                disabled={
                                    !practiceAnswer.trim() ||
                                    (allStepsComplete && answerCorrect === true)
                                }
                            >
                                <ThemedText style={styles.buttonText}>Submit</ThemedText>
                            </button>
                            <button
                                onClick={() => {
                                    setPracticeFeedback("canceled");
                                    setPracticeAnswer("");
                                    setAnswerCorrect(null);
                                    setCorrectAnswer(null);
                                    setStepFeedbackText(null);
                                    setStepFeedbackCorrect(null);
                                }}
                                style={styles.cancelAnswerButton}
                            >
                                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                            </button>
                            <button
                                onClick={handleGetHint}
                                style={{
                                    ...styles.hintButton,
                                    ...(loadingHint || hintLevel >= 3 || allStepsComplete
                                        ? styles.buttonDisabled
                                        : {}),
                                }}
                                disabled={loadingHint || hintLevel >= 3 || allStepsComplete}
                            >
                                <ThemedText style={styles.buttonText}>
                                    {loadingHint
                                        ? "Loading..."
                                        : hintLevel >= 3 || allStepsComplete
                                            ? "No More Hints"
                                            : inActiveStep
                                                ? `Get Hint for Step ${currentStepIndex + 1}${hintLevel > 0 ? ` (${hintLevel}/3)` : ""}`
                                                : `Get Hint${hintLevel > 0 ? ` (${hintLevel}/3)` : ""}`}
                                </ThemedText>
                            </button>
                        </div>
                        {practiceFeedback === "submitted" &&
                            !inActiveStep &&
                            answerCorrect !== null && (
                                <ThemedText
                                    style={
                                        answerCorrect
                                            ? styles.feedbackCorrect
                                            : styles.feedbackIncorrect
                                    }
                                >
                                    {answerCorrect
                                        ? "✓ Correct! Great job!"
                                        : `✗ Incorrect. ${correctAnswer ? `The correct answer is ${correctAnswer}.` : "Please try again."}`}
                                </ThemedText>
                            )}
                    </ThemedView>
                </>
            ) : (
                <ThemedView style={styles.centerContent}>
                    <ThemedText style={styles.emptyText}>
                        Enter a custom problem above or click Random Problem to get started!
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
                                            ✓ Completed - Score: {submission.score}/
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
        return (
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <button
                    onClick={() => setSelectedAssignment(null)}
                    style={styles.backButton}
                >
                    Back
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
                                                setStudentAnswers({ ...studentAnswers, [item.id]: "" });
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
        <div style={styles.page}>
            <div style={styles.header}>
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
            </div>

            <div style={styles.scrollContainer}>
                <div style={{ marginTop: 24 }}>
                    {activeTab === "practice"
                        ? renderPracticeTab()
                        : renderAssignmentsTab()}
                </div>
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
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: "#f0f9ff",
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
        display: "block",
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
        display: "block",
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
    stepSection: {
        backgroundColor: "rgba(0, 122, 255, 0.06)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        border: "1px solid rgba(0, 122, 255, 0.18)",
    },
    stepTitle: {
        display: "block",
        marginBottom: 8,
    },
    stepMeta: {
        display: "block",
        fontSize: 13,
        opacity: 0.75,
        marginBottom: 8,
    },
    stepInstruction: {
        display: "block",
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    stepAttempts: {
        fontSize: 12,
        opacity: 0.7,
        marginTop: 8,
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
    inputHint: {
        fontSize: 13,
        color: "#6b7280",
        fontStyle: "italic",
        marginBottom: 6,
        lineHeight: 1.4,
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
        gap: 12,
        marginTop: 8,
    },
    submitAnswerButton: {
        flex: 1,
        backgroundColor: "#34C759",
        borderRadius: 8,
        padding: 12,
        border: "none",
        cursor: "pointer",
    },
    cancelAnswerButton: {
        flex: 1,
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
        marginTop: 16,
        marginBottom: 16,
        border: "1px solid rgba(255, 149, 0, 0.3)",
        maxHeight: 220,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
    },
    hintHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    hintTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1f2937",
    },
    closeHintButton: {
        backgroundColor: "transparent",
        border: "none",
        fontSize: 18,
        color: "#6b7280",
        cursor: "pointer",
        padding: 4,
        lineHeight: 1,
    },
    hintText: {
        fontSize: 14,
        color: "#1f2937",
        lineHeight: 1.6,
        margin: 0,
        whiteSpace: "pre-wrap" as const,
        wordBreak: "break-word" as const,
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
    feedbackCorrect: {
        display: "block",
        color: "#16a34a",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
        padding: 12,
        backgroundColor: "#dcfce7",
        borderRadius: 8,
        textAlign: "center" as "center",
    },
    feedbackIncorrect: {
        display: "block",
        color: "#dc2626",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
        padding: 12,
        backgroundColor: "#fef2f2",
        borderRadius: 8,
        textAlign: "center" as "center",
    },
    page: {
        height: "100vh",
        backgroundColor: "#f0f9ff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },

    header: {
        padding: 24,
        paddingBottom: 0,
        position: "sticky" as const,
        top: 0,
        zIndex: 10,
        backgroundColor: "#f0f9ff",
    },
    scrollContainer: {
        flex: 1,
        overflowY: "auto",
        overflowX: "auto",
        padding: 24,
        paddingTop: 0,
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
        boxSizing: "border-box",
    },
    debugLink: {
        background: "none",
        border: "none",
        color: "#9ca3af",
        fontSize: 12,
        cursor: "pointer",
        padding: 0,
    },
    debugBox: {
        backgroundColor: "#fdf2f8",
        border: "1px dashed #f472b6",
        borderRadius: 6,
        padding: "6px 10px",
        marginTop: 6,
        fontSize: 13,
    },
    debugLine: {
        display: "flex",
        gap: 6,
        alignItems: "baseline",
    },
    debugLabel: {
        color: "#db2777",
        fontWeight: 600,
    },
    debugSingle: {
        color: "#831843",
        fontFamily: "monospace",
    },
};
