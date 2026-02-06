import { EquationData, HintGenerator } from "@/lib/hint-generator";
import { useSubjects } from "@/lib/subjects-context";
import {
  validateEquationSyntax,
  validateEquationTemplate,
} from "@/utilities/equationValidator";
import { getTopicById } from "@/utilities/topicsLoader";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

const ThemedText = ({ children, type, style }: any) => (
  <span
    style={{
      fontSize: type === "title" ? 34 : type === "subtitle" ? 22 : 17,
      fontWeight:
        type === "title" ? "700" : type === "subtitle" ? "600" : "400",
      color: "#1d1d1f",
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif",
      letterSpacing:
        type === "title"
          ? "-0.02em"
          : type === "subtitle"
            ? "-0.01em"
            : "-0.01em",
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
      fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
      fontSize: 16,
      overflowX: "auto",
      whiteSpace: "pre",
      WebkitOverflowScrolling: "touch",
      color: "#1d1d1f",
      lineHeight: 1.5,
      ...style,
    }}
  >
    {equation}
  </div>
);

type StepCheckpoint = {
  instruction: string;
  checkpoint: string;
};

export default function StudyPage() {
  const { selectedTopics } = useSubjects();
  const [showStudyInterface, setShowStudyInterface] = useState(false);
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
  const [currentProblemTopicIds, setCurrentProblemTopicIds] = useState<
    string[]
  >([]);
  const [currentProblemCategoryName, setCurrentProblemCategoryName] =
    useState<string | null>(null);

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
  const [checkingBypass, setCheckingBypass] = useState(false);
  const [mistakesCollected, setMistakesCollected] = useState<
    Array<{
      stepInstruction: string;
      expectedCheckpoint: string;
      studentInput: string;
      feedback: string;
    }>
  >([]);
  const [mistakeSummary, setMistakeSummary] = useState<string | null>(null);
  const [mistakeSummaryLoading, setMistakeSummaryLoading] = useState(false);

  // Hint state
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [loadingHint, setLoadingHint] = useState(false);
  const hintGeneratorRef = useRef<HintGenerator | null>(null);

  // Chat help modal
  const [showChatModal, setShowChatModal] = useState(false);

  const getAreasToWorkOn = (topicIds: string[]): string => {
    if (topicIds.length === 0) return "";
    const parts = new Set<string>();
    for (const id of topicIds) {
      const result = getTopicById(id);
      if (result?.category?.name && result?.topic?.name) {
        parts.add(`${result.category.name}: ${result.topic.name}`);
      } else if (result?.category?.name) {
        parts.add(result.category.name);
      }
    }
    return Array.from(parts).join(", ");
  };

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

  const parseFinalAnswerValue = (finalAnswer: string): number | null => {
    if (!finalAnswer?.trim()) return null;
    const trimmed = finalAnswer.trim();
    const parts = trimmed.split("=").map((p) => p.trim());
    for (const part of parts) {
      const value = normalizeAnswer(part);
      if (value !== null) return value;
    }
    return normalizeAnswer(trimmed);
  };

  const parseCheckpointValue = (checkpoint: string): number | null => {
    if (!checkpoint?.trim()) return null;
    const parts = checkpoint.split("=").map((p) => p.trim());
    for (const part of parts) {
      const value = normalizeAnswer(part);
      if (value !== null) return value;
    }
    return normalizeAnswer(checkpoint.trim());
  };

  const parseUserAnswerValue = (userInput: string): number | null => {
    if (!userInput?.trim()) return null;
    const asNumber = normalizeAnswer(userInput);
    if (asNumber !== null) return asNumber;
    const parts = userInput.split("=").map((p) => p.trim());
    for (const part of parts) {
      const value = normalizeAnswer(part);
      if (value !== null) return value;
    }
    return null;
  };

  const isFinalAnswerMatch = (userInput: string): boolean => {
    if (!stepData?.finalAnswer?.trim() || !userInput.trim()) return false;
    const expected = parseFinalAnswerValue(stepData.finalAnswer);
    const actual = parseUserAnswerValue(userInput);
    if (expected === null || actual === null) return false;
    return Math.abs(expected - actual) < 0.01;
  };

  const isFinalCheckpointMatch = (userInput: string): boolean => {
    if (!stepData?.steps?.length || !userInput.trim()) return false;
    const lastStep = stepData.steps[stepData.steps.length - 1];
    const expected = parseCheckpointValue(lastStep.checkpoint);
    const actual = parseUserAnswerValue(userInput);
    if (expected === null || actual === null) return false;
    return Math.abs(expected - actual) < 0.01;
  };

  const normalizeCommaSeparatedEquations = (s: string): string[] => {
    return s
      .split(",")
      .map((p) => p.trim().replace(/\s+/g, ""))
      .filter(Boolean)
      .sort();
  };

  const isCommaSeparatedCheckpointMatch = (
    expectedCheckpoint: string,
    studentInput: string,
  ): boolean => {
    if (!expectedCheckpoint.includes(",") || !studentInput.includes(","))
      return false;
    const a = normalizeCommaSeparatedEquations(expectedCheckpoint);
    const b = normalizeCommaSeparatedEquations(studentInput);
    if (a.length !== b.length) return false;
    return a.every((eq, i) => eq === b[i]);
  };

  const tryBypassByGradingFinalStep = async (
    studentInput: string,
  ): Promise<boolean> => {
    if (!stepData?.steps?.length || !studentInput.trim()) return false;
    const lastStep = stepData.steps[stepData.steps.length - 1];
    try {
      const resp = await fetch(`${API_BASE_URL}/api/openai/grade-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startEquation: stepData.startEquation,
          targetVariable: stepData.targetVariable,
          stepInstruction: lastStep.instruction,
          expectedCheckpoint: lastStep.checkpoint,
          studentInput,
        }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      return Boolean(data?.correct);
    } catch {
      return false;
    }
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

    if (!hintGeneratorRef.current) {
      hintGeneratorRef.current = new HintGenerator(problem, equationData);
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
    setMistakesCollected([]);
    setMistakeSummary(null);
    setMistakeSummaryLoading(false);

    const trimmedProblem = userInput.trim();
    setProblem(trimmedProblem);
    setCurrentProblemTopicIds([]);
    setCurrentProblemCategoryName(null);

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
          // Validate extracted equation is mathematically correct
          const eq = extractedData.equation || "";
          const subEq = extractedData.substitutedEquation || "";

          const syntaxCheck = validateEquationSyntax(subEq);
          const templateCheck = validateEquationTemplate(eq, subEq);

          if (!syntaxCheck.isValid || !templateCheck.isValid) {
            console.warn("Extracted equation failed validation:", {
              syntaxErrors: syntaxCheck.errors,
              templateErrors: templateCheck.errors,
            });
            // Still set it, but log the warnings
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
      setMistakesCollected([]);
      setMistakeSummary(null);
      setMistakeSummaryLoading(false);
      setCurrentProblemTopicIds([]);
      setCurrentProblemCategoryName(null);

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
      if (topicIds.length > 0) {
        setCurrentProblemTopicIds(topicIds);
        setCurrentProblemCategoryName(null);
      } else {
        setCurrentProblemTopicIds([]);
        setCurrentProblemCategoryName(
          typeof data.categoryName === "string" ? data.categoryName : null,
        );
      }

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
            // Validate extracted equation is mathematically correct
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

    if (isCommaSeparatedCheckpointMatch(step.checkpoint, practiceAnswer)) {
      setStepFeedbackCorrect(true);
      setStepFeedbackText("Correct.");
      setLastCorrectStepIndex(currentStepIndex);
      setPracticeAnswer("");
      setPracticeFeedback("submitted");
      const next = currentStepIndex + 1;
      if (next >= stepData.steps.length) {
        setCurrentStepIndex(stepData.steps.length);
        if (stepData.finalAnswer) {
          setStepFeedbackText(
            `Correct. Finished. Final answer: ${stepData.finalAnswer}`,
          );
        }
      } else {
        setCurrentStepIndex(next);
      }
      return;
    }

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
          // All steps complete - disable further step submissions
        } else {
          setCurrentStepIndex(next);
        }
      } else {
        setMistakesCollected((prev) =>
          prev.concat({
            stepInstruction: step.instruction,
            expectedCheckpoint: step.checkpoint,
            studentInput: practiceAnswer,
            feedback,
          }),
        );
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

  useEffect(() => {
    if (
      !problem ||
      !stepData ||
      currentStepIndex < stepData.steps.length ||
      mistakesCollected.length === 0 ||
      mistakeSummary !== null
    ) {
      return;
    }
    let cancelled = false;
    setMistakeSummaryLoading(true);
    fetch(`${API_BASE_URL}/api/openai/mistake-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem, mistakes: mistakesCollected }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load summary"))))
      .then((data) => {
        if (!cancelled && typeof data?.summary === "string") {
          setMistakeSummary(data.summary);
        }
      })
      .catch(() => {
        if (!cancelled) setMistakeSummary(null);
      })
      .finally(() => {
        if (!cancelled) setMistakeSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    problem,
    stepData,
    currentStepIndex,
    mistakesCollected.length,
    mistakeSummary,
  ]);

  // Landing page view
  if (!showStudyInterface) {
    return (
      <div style={styles.page}>
        <div style={styles.landingContainer}>
          {/* Image */}
          <div style={styles.imagePlaceholder}>
            <Image
              source={require("@/assets/images/Book.png")}
              style={styles.image}
              contentFit="contain"
            />
            {/* Arrow Button */}
            <button
              style={styles.arrowButton}
              onClick={() => {
                // TODO: Add navigation to new page
                console.log("Arrow button clicked");
              }}
            >
              <Ionicons name="arrow-forward" size={28} color="#ffffff" />
            </button>
          </div>

          {/* Start Learning Today Block - Full Bottom */}
          <div style={styles.startBlock}>
            <div style={styles.startBlockContent}>
              <ThemedText type="title" style={styles.startTitle}>
                Start Learning Today
              </ThemedText>
              <ThemedText style={styles.startSubtitle}>
                Practice math problems with step-by-step guidance and instant
                feedback.
              </ThemedText>
            </div>
            <button
              style={styles.getStartedButton}
              onClick={() => setShowStudyInterface(true)}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Study interface view
  return (
    <div style={styles.page}>
      {/*chat help button*/}
      <button
        type="button"
        style={styles.chatBubbleButton}
        onClick={() => setShowChatModal(true)}
        aria-label="Open help chat"
      >
        <Ionicons name="chatbubble-ellipses" size={26} color="#ffffff" />
      </button>

      {/* Chat help modal */}
      {showChatModal && (
        <div
          style={styles.chatModalOverlay}
          onClick={() => setShowChatModal(false)}
          role="presentation"
        >
          <div
            style={styles.chatModalContent}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Help chat"
          >
            <div style={styles.chatModalHeader}>
              <div style={styles.chatModalHeaderLeft}>
                <div style={styles.chatModalAvatar}>
                  <Ionicons name="chatbubble-ellipses" size={20} color="#a78bfa" />
                </div>
                <div>
                  <ThemedText type="subtitle" style={styles.chatModalTitle}>
                    Help
                  </ThemedText>
                  <span style={styles.chatModalSubtitle}>Ask for guidance</span>
                </div>
              </div>
              <button
                type="button"
                style={styles.chatModalCloseButton}
                onClick={() => setShowChatModal(false)}
                aria-label="Close chat"
              >
                <Ionicons name="close" size={24} color="#1d1d1f" />
              </button>
            </div>
            <div style={styles.chatModalMessages}>
              <div style={styles.chatBubbleBot}>
                <p style={styles.chatBubbleText}>
                  Hi! Chat with me here when you need help. You’ll be able to ask
                  questions and get guidance on your current problem soon.
                </p>
              </div>
            </div>
            <div style={styles.chatModalFooter}>
              <input
                type="text"
                style={styles.chatInput}
                placeholder="Type a message..."
                readOnly
                aria-label="Message input"
              />
              <button
                type="button"
                style={styles.chatSendButton}
                aria-label="Send message"
                disabled
              >
                <Ionicons name="send" size={20} color="#ffffff" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={styles.scrollContainer}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={styles.backButtonContainer}>
            <button
              style={styles.backButton}
              onClick={() => setShowStudyInterface(false)}
            >
              <ThemedText style={styles.backButtonText}>← Back</ThemedText>
            </button>
          </div>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Study</ThemedText>
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
              <ThemedText style={styles.inputErrorText}>
                {inputError}
              </ThemedText>
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
              <ThemedText style={styles.generateButtonText}>
                Random Problem
              </ThemedText>
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

                  <button
                    style={styles.saveButton}
                    onClick={saveEquationAsJSON}
                  >
                    <ThemedText style={styles.buttonText}>
                      Save as JSON
                    </ThemedText>
                  </button>
                </>
              )}

              {/* Step-by-step (checkpoints) uses the existing answer box below */}
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
                        Step{" "}
                        {Math.min(currentStepIndex + 1, stepData.steps.length)}{" "}
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

                      {currentStepIndex >= stepData.steps.length &&
                        mistakesCollected.length > 0 && (
                          <div style={styles.mistakeSummaryBox}>
                            <ThemedText
                              type="subtitle"
                              style={styles.mistakeSummaryTitle}
                            >
                              Summary of mistakes
                            </ThemedText>
                            {mistakeSummaryLoading ? (
                              <ThemedText style={styles.mistakeSummaryText}>
                                Loading…
                              </ThemedText>
                            ) : mistakeSummary ? (
                              <p style={styles.mistakeSummaryText}>
                                {mistakeSummary}
                              </p>
                            ) : null}
                            {(getAreasToWorkOn(currentProblemTopicIds) ||
                              currentProblemCategoryName) && (
                              <div style={styles.mistakeSummaryWorkOn}>
                                <strong>
                                  Work on:{" "}
                                  {getAreasToWorkOn(currentProblemTopicIds) ||
                                    currentProblemCategoryName}
                                </strong>
                              </div>
                            )}
                          </div>
                        )}
                    </>
                  ) : null}
                </ThemedView>
              )}

              <ThemedView style={styles.answerSection}>
                <ThemedText style={styles.answerLabel}>
                  {stepData &&
                  stepData.steps.length > 0 &&
                  currentStepIndex < stepData.steps.length
                    ? "Your Step Result:"
                    : "Your Answer:"}
                </ThemedText>

                {stepData &&
                  stepData.steps.length > 0 &&
                  currentStepIndex < stepData.steps.length && (
                    <ThemedText style={styles.stepInstruction}>
                      {stepData.steps[currentStepIndex]?.instruction}
                    </ThemedText>
                  )}

                <ThemedText style={styles.inputHint}>
                  {stepData &&
                  stepData.steps.length > 0 &&
                  currentStepIndex < stepData.steps.length
                    ? "Tip: Type the equation after this step (e.g. '2x = 10'), or enter the final answer to skip ahead."
                    : "Tip: You can type just the number (like '42') or the full equation (like 'x = 42')"}
                </ThemedText>
                <textarea
                  style={styles.answerInput}
                  placeholder={
                    stepData &&
                    stepData.steps.length > 0 &&
                    currentStepIndex < stepData.steps.length
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
                  disabled={
                    (stepData &&
                      stepData.steps.length > 0 &&
                      currentStepIndex >= stepData.steps.length &&
                      answerCorrect === true) ||
                    false
                  }
                />

                {practiceFeedback && (
                  <ThemedText
                    style={
                      practiceFeedback === "submitted"
                        ? styles.feedbackSubmitted
                        : styles.feedbackCanceled
                    }
                  >
                    {practiceFeedback === "submitted"
                      ? "Submitted"
                      : "Canceled"}
                  </ThemedText>
                )}

                {currentHint && (
                  <div style={styles.hintBox}>
                    <div style={styles.hintHeader}>
                      <span style={styles.hintTitle}>Hint {hintLevel}/3</span>
                      <button
                        onClick={resetHints}
                        style={styles.closeHintButton}
                      >
                        X
                      </button>
                    </div>
                    <p style={styles.hintText}>{currentHint}</p>
                  </div>
                )}

                <div style={styles.answerButtons}>
                  <button
                    onClick={async () => {
                      if (
                        stepData &&
                        stepData.steps.length > 0 &&
                        currentStepIndex < stepData.steps.length
                      ) {
                        if (
                          isFinalAnswerMatch(practiceAnswer) ||
                          isFinalCheckpointMatch(practiceAnswer)
                        ) {
                          setStepFeedbackCorrect(true);
                          setStepFeedbackText(
                            `Correct! ${stepData.finalAnswer ? `Final answer: ${stepData.finalAnswer}` : "You completed the problem."}`,
                          );
                          setCurrentStepIndex(stepData.steps.length);
                          setPracticeAnswer("");
                          setPracticeFeedback("submitted");
                          return;
                        }
                        setCheckingBypass(true);
                        setStepFeedbackText(null);
                        setStepFeedbackCorrect(null);
                        const bypassOk =
                          await tryBypassByGradingFinalStep(practiceAnswer);
                        setCheckingBypass(false);
                        if (bypassOk) {
                          setStepFeedbackCorrect(true);
                          setStepFeedbackText(
                            `Correct! ${stepData.finalAnswer ? `Final answer: ${stepData.finalAnswer}` : "You completed the problem."}`,
                          );
                          setCurrentStepIndex(stepData.steps.length);
                          setPracticeAnswer("");
                          setPracticeFeedback("submitted");
                          return;
                        }
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
                      checkingBypass ||
                      (stepData &&
                        stepData.steps.length > 0 &&
                        currentStepIndex >= stepData.steps.length &&
                        answerCorrect === true) ||
                      false
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
                    <ThemedText style={styles.cancelButtonText}>
                      Cancel
                    </ThemedText>
                  </button>
                  <button
                    onClick={handleGetHint}
                    style={{
                      ...styles.hintButton,
                      ...(loadingHint || hintLevel >= 3
                        ? styles.buttonDisabled
                        : {}),
                    }}
                    disabled={loadingHint || hintLevel >= 3}
                  >
                    <ThemedText style={styles.hintButtonText}>
                      {loadingHint
                        ? "Loading..."
                        : hintLevel >= 3
                          ? "No More Hints"
                          : `Get Hint${hintLevel > 0 ? ` (${hintLevel}/3)` : ""}`}
                    </ThemedText>
                  </button>
                </div>
                {practiceFeedback === "submitted" &&
                  !(
                    stepData &&
                    stepData.steps.length > 0 &&
                    currentStepIndex < stepData.steps.length
                  ) &&
                  answerCorrect !== null && (
                    <div
                      style={
                        answerCorrect
                          ? styles.feedbackCorrect
                          : styles.feedbackIncorrect
                      }
                    >
                      {answerCorrect ? (
                        "✓ Correct! Great job!"
                      ) : (
                        <>
                          <span>
                            ✗ Incorrect.{" "}
                            {correctAnswer
                              ? `The correct answer is ${correctAnswer}.`
                              : "Please try again."}
                          </span>
                          {(getAreasToWorkOn(currentProblemTopicIds) ||
                            currentProblemCategoryName) && (
                              <div style={styles.feedbackWorkOn}>
                                <strong>
                                  Work on:{" "}
                                  {getAreasToWorkOn(currentProblemTopicIds) ||
                                    currentProblemCategoryName}
                                </strong>
                              </div>
                            )}
                        </>
                      )}
                    </div>
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
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  titleContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
    color: "#1d1d1f",
    letterSpacing: "-0.01em",
  },
  textInput: {
    width: "100%",
    borderWidth: 0,
    borderRadius: 12,
    padding: 16,
    fontSize: 17,
    backgroundColor: "#f5f5f7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    color: "#1d1d1f",
    transition: "background-color 0.2s ease",
    outline: "none",
  },
  inputErrorText: {
    display: "block",
    color: "#ff3b30",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "400",
  },
  characterCount: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: "right",
    color: "#86868b",
    marginTop: 4,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    marginBottom: 32,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#a78bfa",
    padding: "14px 20px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(167, 139, 250, 0.3)",
  },
  generateButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: "14px 20px",
    borderRadius: 12,
    border: "1px solid #d2d2d7",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  generateButtonText: {
    color: "#1d1d1f",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: "-0.01em",
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: "-0.01em",
  },
  centerContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    gap: 16,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #f5f5f7",
    borderTop: "3px solid #a78bfa",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    display: "block",
    fontSize: 15,
    opacity: 0.6,
    color: "#86868b",
    fontWeight: "400",
  },
  problemBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "none",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  problemText: {
    fontSize: 17,
    lineHeight: 1.47,
    color: "#1d1d1f",
    fontWeight: "400",
    letterSpacing: "-0.01em",
  },
  equationContainer: {
    gap: 16,
    marginBottom: 20,
  },
  equationLabel: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#1d1d1f",
    letterSpacing: "-0.02em",
  },
  equationBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    border: "none",
  },
  equationTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    opacity: 0.6,
    color: "#86868b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  variablesBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    border: "none",
  },
  variableItem: {
    paddingTop: 6,
    paddingBottom: 6,
  },
  saveButton: {
    backgroundColor: "#a78bfa",
    padding: "12px 28px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    display: "block",
    margin: "20px auto",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(167, 139, 250, 0.3)",
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: "center",
    color: "#86868b",
    fontWeight: "400",
  },
  stepSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    border: "none",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  stepTitle: {
    display: "block",
    marginBottom: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#1d1d1f",
    letterSpacing: "-0.02em",
  },
  stepMeta: {
    display: "block",
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 12,
    color: "#86868b",
    fontWeight: "400",
  },
  stepInstruction: {
    display: "block",
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 12,
    color: "#1d1d1f",
    letterSpacing: "-0.01em",
  },
  stepAttempts: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 10,
    color: "#86868b",
    fontWeight: "400",
  },
  mistakeSummaryBox: {
    marginTop: 20,
    padding: 18,
    backgroundColor: "#faf5ff",
    borderRadius: 12,
    borderLeft: "4px solid #a78bfa",
  },
  mistakeSummaryTitle: {
    display: "block",
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  mistakeSummaryText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#1d1d1f",
    margin: 0,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  },
  mistakeSummaryWorkOn: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
    color: "#1d1d1f",
    letterSpacing: "-0.01em",
  },
  answerLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1d1d1f",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: "-0.01em",
  },
  inputHint: {
    fontSize: 13,
    color: "#86868b",
    fontStyle: "normal",
    marginBottom: 8,
    lineHeight: 1.5,
    fontWeight: "400",
  },
  answerInput: {
    width: "100%",
    borderWidth: 0,
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    backgroundColor: "#f5f5f7",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    resize: "vertical" as "vertical",
    marginBottom: 12,
    color: "#1d1d1f",
    transition: "background-color 0.2s ease",
    outline: "none",
  },
  answerButtons: {
    display: "flex",
    gap: 10,
    marginTop: 12,
  },
  submitAnswerButton: {
    flex: 1,
    backgroundColor: "#a78bfa",
    borderRadius: 12,
    padding: 14,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(167, 139, 250, 0.3)",
  },
  cancelAnswerButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    border: "1px solid #d2d2d7",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  hintButton: {
    flex: "1 1 auto",
    minWidth: 120,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    border: "1px solid #d2d2d7",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  hintButtonText: {
    color: "#1d1d1f",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: "-0.01em",
  },
  hintBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    border: "none",
    maxHeight: 240,
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
    fontSize: 13,
    fontWeight: "600",
    color: "#1d1d1f",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    opacity: 0.8,
  },
  closeHintButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: 20,
    color: "#86868b",
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
    opacity: 0.7,
    transition: "opacity 0.2s ease",
  },
  hintText: {
    fontSize: 15,
    color: "#1d1d1f",
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    fontWeight: "400",
    letterSpacing: "-0.01em",
  },
  cancelButtonText: {
    color: "#1d1d1f",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: "-0.01em",
  },
  feedbackSubmitted: {
    color: "#34c759",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 10,
  },
  feedbackCanceled: {
    color: "#86868b",
    fontSize: 13,
    fontWeight: "400",
    marginTop: 10,
  },
  feedbackCorrect: {
    display: "block",
    color: "#34c759",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    textAlign: "center" as "center",
    letterSpacing: "-0.01em",
  },
  feedbackIncorrect: {
    display: "block",
    color: "#ff3b30",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 16,
    padding: 16,
    backgroundColor: "#fff5f5",
    borderRadius: 12,
    textAlign: "left" as "left",
    letterSpacing: "-0.01em",
  },
  feedbackWorkOn: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "700",
    color: "#1d1d1f",
    letterSpacing: "-0.01em",
  },
  answerSection: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  page: {
    height: "100vh",
    backgroundColor: "#fbfbfd",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  scrollContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "auto",
    padding: "32px 20px",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    boxSizing: "border-box",
  },
  landingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  imagePlaceholder: {
    flex: 1,
    background:
      "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderBottom: "1px solid #e5e5e7",
    overflow: "hidden",
    padding: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  arrowButton: {
    position: "absolute" as const,
    right: 24,
    bottom: 24,
    backgroundColor: "#a78bfa",
    width: 56,
    height: 56,
    borderRadius: 28,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(167, 139, 250, 0.4)",
    transition: "all 0.2s ease",
    zIndex: 10,
  },
  placeholderText: {
    fontSize: 17,
    color: "#86868b",
    fontWeight: "400",
  },
  startBlock: {
    width: "100%",
    backgroundColor: "#ffffff",
    padding: "80px 40px",
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: "40vh",
    position: "relative" as const,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  startBlockContent: {
    maxWidth: 800,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 32,
    alignItems: "center",
    textAlign: "center" as const,
  },
  startTitle: {
    fontSize: 48,
    fontWeight: "700",
    color: "#1d1d1f",
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  startSubtitle: {
    fontSize: 21,
    color: "#86868b",
    fontWeight: "400",
    lineHeight: 1.5,
    letterSpacing: "-0.01em",
    maxWidth: 600,
    textAlign: "center" as const,
  },
  getStartedButton: {
    backgroundColor: "#a78bfa",
    borderRadius: 30,
    padding: "22px 48px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 8px rgba(167, 139, 250, 0.4)",
    alignSelf: "flex-start",
    width: "auto",
    maxWidth: 450,
    textAlign: "center" as const,
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: "-0.01em",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif",
  },
  getStartedButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: "-0.01em",
    textAlign: "center" as const,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', sans-serif",
  },
  backButtonContainer: {
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 8,
    transition: "opacity 0.2s ease",
  },
  backButtonText: {
    color: "#a78bfa",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: "-0.01em",
  },
  chatBubbleButton: {
    position: "fixed" as const,
    right: 24,
    bottom: 96,
    backgroundColor: "#a78bfa",
    width: 56,
    height: 56,
    borderRadius: 28,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(167, 139, 250, 0.4)",
    transition: "all 0.2s ease",
    zIndex: 20,
  },
  chatModalOverlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 24,
    boxSizing: "border-box",
  },
  chatModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.04)",
    width: "100%",
    maxWidth: 420,
    height: "85vh",
    maxHeight: 560,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 14px",
    borderBottom: "1px solid #e5e5e7",
    backgroundColor: "#fbfbfd",
    flexShrink: 0,
  },
  chatModalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  chatModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatModalTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: "600",
    color: "#1d1d1f",
    letterSpacing: "-0.02em",
    display: "block",
  },
  chatModalSubtitle: {
    fontSize: 13,
    color: "#86868b",
    fontWeight: "400",
    marginTop: 2,
    display: "block",
  },
  chatModalCloseButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    transition: "background-color 0.2s ease",
  },
  chatModalMessages: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px 16px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    WebkitOverflowScrolling: "touch",
    backgroundColor: "#fbfbfd",
  },
  chatBubbleBot: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: "12px 16px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e5e7",
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#1d1d1f",
    margin: 0,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    letterSpacing: "-0.01em",
  },
  chatModalFooter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px 16px",
    borderTop: "1px solid #e5e5e7",
    backgroundColor: "#ffffff",
    flexShrink: 0,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    border: "none",
    borderRadius: 22,
    padding: "12px 18px",
    fontSize: 15,
    color: "#1d1d1f",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
    outline: "none",
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#a78bfa",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(167, 139, 250, 0.35)",
    opacity: 0.7,
  },
};
