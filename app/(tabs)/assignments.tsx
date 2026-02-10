import { EquationData, HintGenerator } from "@/lib/hint-generator";
import { useSubjects } from "@/lib/subjects-context";
import { validateEquationSyntax, validateEquationTemplate } from "@/utilities/equationValidator";
import { closeParens } from "@/utilities/input-validation";
import { useEffect, useRef, useState } from "react";
import Pin, {PinData} from "@/components/Pin";

function normalizeStepInput(s: string): string {
  const trimmed = (s || "").trim().replace(/\s+/g, " ");
  return closeParens(trimmed);
}

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
  <div style={{ padding: 16, fontFamily: "monospace", fontSize: 18,
        overflowX: "auto", whiteSpace: "pre", WebkitOverflowScrolling: "touch", ...style }}>
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

type CompletedStep = {
  stepIndex: number;
  instruction: string;
  correct: string;
  response?: string;
  timestamp: string;
}



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
  const [stepFeedbackCorrect, setStepFeedbackCorrect] = useState<boolean | null>(null);
  const [stepAttemptsByIndex, setStepAttemptsByIndex] = useState<Record<number, number>>({});
  

  // Hint state
  const [currentHint, setCurrentHint] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState<number>(0);
  const [loadingHint, setLoadingHint] = useState(false);
  const hintGeneratorRef = useRef<HintGenerator | null>(null);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<CompletedStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<Record<number, boolean>>({});
  const [pinned, setPinned] = useState<PinData | null>(null);
  const [pinVisibility, setPinVisibility] = useState(false);



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
      const tryPart = (part: string): number | null => {
        const expression = part
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
          .replace(/\s+/g, "");
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) return null;
        const result = Function(`"use strict"; return (${expression})`)();
        if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
          return result;
        }
        return null;
      };
      const lastPart = parts[parts.length - 1];
      let value = tryPart(lastPart);
      if (value !== null) return value;
      if (parts.length >= 2) value = tryPart(parts[0]);
      return value;
    } catch (e) {
      console.error("Error extracting answer from equation:", e);
    }
    return null;
  };

  const normalizeAnswer = (answer: string): number | null => {
    try {
      let cleaned = (answer || "").trim();
      cleaned = cleaned.replace(
        /\s*(km\/h|km|hours?|hrs?|miles?|mph|units?|degrees?|°)\s*/gi,
        "",
      );
      cleaned = cleaned.replace(/\s+/g, "");

      const numberMatch = cleaned.match(/^-?\d+\.?\d*$/);
      if (numberMatch) {
        return parseFloat(numberMatch[0]);
      }
      const sciNotationMatch = cleaned.match(
        /^-?\d+\.?\d*[eE][+-]?\d+$/,
      );
      if (sciNotationMatch) {
        const n = parseFloat(sciNotationMatch[0]);
        if (!isNaN(n) && isFinite(n)) return n;
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

  const checkAnswer = (studentAnswer: string): boolean => {
    if (!studentAnswer.trim()) return false;

    let correctValue: number | null = null;

    if (stepData?.finalAnswer?.trim()) {
      correctValue = parseFinalAnswerValue(stepData.finalAnswer);
    }
    if (correctValue === null && equationData?.substitutedEquation) {
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

    const tolerance = 0.02;
    const relTolerance = 1e-6;
    const diff = Math.abs(studentValue - correctValue);
    const isCorrect =
      diff < tolerance ||
      diff < Math.max(Math.abs(studentValue), Math.abs(correctValue)) * relTolerance;

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
    setPinned(null);
    setPinVisibility(true);
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
      setPinned(null);
      setPinVisibility(true);

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
      setCompletedSteps([]);
      setExpandedStep({});

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
        setCompletedSteps([]);
        setExpandedStep({});

        const resp = await fetch(`${API_BASE_URL}/api/openai/step-checkpoints`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problem, substitutedEquation }),
        });

        if (!resp.ok) {
          const t = await resp.text().catch(() => "");
          throw new Error(t || `HTTP ${resp.status}`);
        }

        const data = await resp.json();
        if (cancelled) return;

        const steps: StepCheckpoint[] = Array.isArray(data?.steps)
          ? data.steps
              .filter((s: any) => s && typeof s.instruction === "string" && typeof s.checkpoint === "string")
              .map((s: any) => ({ instruction: s.instruction, checkpoint: s.checkpoint }))
          : [];

        const finalAnswer =
          typeof data?.finalAnswer === "string" ? data.finalAnswer : "";


        console.log("[checkpoints] target:", data?.targetVariable, "final:", finalAnswer, "steps:", steps);

        setStepData({
          targetVariable: typeof data?.targetVariable === "string" ? data.targetVariable : "x",
          startEquation: typeof data?.startEquation === "string" ? data.startEquation : substitutedEquation,
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


  // testing state actually working/updating before UI build
  useEffect(() => {
    console.log(" Steps :", completedSteps);
  }, [completedSteps])

  const normalizeForCheckpointCompare = (s: string): string =>
    (s || "").trim().replace(/\s+/g, " ");
  const compactForCheckpointCompare = (s: string): string =>
    normalizeForCheckpointCompare(s).replace(/\s+/g, "");
  const isExactCheckpointMatch = (expectedCheckpoint: string, studentInput: string): boolean => {
    if (!expectedCheckpoint?.trim() || !studentInput?.trim()) return false;
    const a = normalizeForCheckpointCompare(expectedCheckpoint);
    const b = normalizeForCheckpointCompare(studentInput);
    if (a === b) return true;
    return compactForCheckpointCompare(expectedCheckpoint) === compactForCheckpointCompare(studentInput);
  };

  const submitStepAttempt = async () => {
    if (!stepData || !stepData.steps?.length) return;
    if (currentStepIndex >= stepData.steps.length) return;
    if (!practiceAnswer.trim()) return;

    const step = stepData.steps[currentStepIndex];
    const attemptNumber = (stepAttemptsByIndex[currentStepIndex] ?? 0) + 1;
    setStepAttemptsByIndex({ ...stepAttemptsByIndex, [currentStepIndex]: attemptNumber });
    setStepFeedbackText(null);
    setStepFeedbackCorrect(null);
    setPracticeFeedback(null);

    if (isExactCheckpointMatch(step.checkpoint, practiceAnswer)) {
      const timestamp = new Date().toLocaleString();
      setCompletedSteps((prevStep) => {
        const nextStep: CompletedStep[] = [];
        let i = 0;
        for (i; i < prevStep.length; i++) {
          const prevRecord = prevStep[i];
          if (prevRecord.stepIndex !== currentStepIndex) nextStep.push(prevRecord);
        }
        nextStep.push({
          stepIndex: currentStepIndex,
          instruction: step.instruction,
          correct: practiceAnswer,
          response: "Correct.",
          timestamp,
        });
        return nextStep.sort((i, j) => (i.stepIndex < j.stepIndex ? -1 : i.stepIndex > j.stepIndex ? 1 : 0));
      });
      setStepFeedbackCorrect(true);
      setStepFeedbackText("Correct.");
      setLastCorrectStepIndex(currentStepIndex);
      setPracticeAnswer("");
      setPracticeFeedback("submitted");
      const next = currentStepIndex + 1;
      if (next >= stepData.steps.length) {
        setCurrentStepIndex(stepData.steps.length);
        if (stepData.finalAnswer) {
          setStepFeedbackText(`Correct. Finished. Final answer: ${stepData.finalAnswer}`);
        }
      } else {
        setCurrentStepIndex(next);
      }
      return;
    }

    try {
      const studentInput = normalizeStepInput(practiceAnswer);
      const resp = await fetch(`${API_BASE_URL}/api/openai/grade-step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startEquation: stepData.startEquation,
          targetVariable: stepData.targetVariable,
          stepInstruction: step.instruction,
          expectedCheckpoint: step.checkpoint,
          studentInput,
        }),
      });

      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(t || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const correct = Boolean(data?.correct);
      const feedback = typeof data?.feedback === "string" ? data.feedback : (correct ? "Correct." : "Incorrect.");

      if (correct) {

        const timestamp = new Date().toLocaleString();

        const stepRecord: CompletedStep = {
          stepIndex: currentStepIndex,
          instruction: step.instruction,
          correct: practiceAnswer,
          response: feedback,
          timestamp: timestamp,

        }

        setCompletedSteps((prevStep) => {
          const nextStep: CompletedStep[] =[];
        

        // I'm just adding this copying loop in to avoid any duplicates in case 
          // there's an accidental redo of the logging
        let i = 0;
        for (i; i < prevStep.length; i++) {

          const prevRecord = prevStep[i];
          const prevRecordIndex = prevRecord.stepIndex;

          let sameStep = false;
          if (prevRecordIndex === currentStepIndex){
            sameStep = true;
          }

          if (!sameStep) {
            nextStep.push(prevRecord);
          }
    }
          nextStep.push(stepRecord);


          nextStep.sort((i, j) => {

            if (i.stepIndex < j.stepIndex) {
              return -1;
            }
            if (i.stepIndex > j.stepIndex) {
              return 1;
            }


            return 0;
          })

          return nextStep;


      })
    
        setStepFeedbackCorrect(true);
        setStepFeedbackText(feedback);
        setLastCorrectStepIndex(currentStepIndex);
        setPracticeAnswer("");
        setPracticeFeedback("submitted");

        const next = currentStepIndex + 1;
        if (next >= stepData.steps.length) {
          setCurrentStepIndex(stepData.steps.length);
          if (stepData.finalAnswer) {
            setStepFeedbackText(`${feedback} Finished. Final answer: ${stepData.finalAnswer}`);
          }
          // All steps complete - disable further step submissions
        } else {
          setCurrentStepIndex(next);
        }
      } else {
        const rollbackTo = Math.max(lastCorrectStepIndex, 0);
        setStepFeedbackCorrect(false);
        setStepFeedbackText(`${feedback} Checkpoint: returning to step ${rollbackTo + 1}.`);
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

    <div style={styles.practiceOuterContainer}>
      <div style={styles.practiceLayout}>
      <div style={styles.practiceCentralContent}>
          <div style={styles.pinMain}>

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
              {false && (
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
              )}
              {false && (
                <button style={styles.saveButton} onClick={saveEquationAsJSON}>
                  <ThemedText style={styles.buttonText}>Save as JSON</ThemedText>
                </button>
              )}
            </>
          )}

          {/* Step-by-step (checkpoints) uses the existing answer box below */}
          {equationData?.substitutedEquation && (
            <ThemedView style={styles.stepSection}>
              <ThemedText type="subtitle" style={styles.stepTitle}>
                Step-by-step (checkpoints)
              </ThemedText>

              {stepLoading ? (
                <ThemedText style={styles.loadingText}>Loading steps…</ThemedText>
              ) : stepError ? (
                <ThemedText style={styles.inputErrorText}>{stepError}</ThemedText>

              ) : stepData && stepData.steps.length > 0 ? (
                <>
                  <ThemedText style={styles.stepMeta}>
                    {currentStepIndex >= stepData.steps.length ? (
                      <>Completed: {stepData.steps.length} of {stepData.steps.length} steps</>
                    ) : (
                      <>
                        Step{" "}
                        {Math.max(
                          1,
                          Math.min(
                            currentStepIndex + 1,
                            stepData.steps.length,
                          ),
                        )}{" "}
                        of {stepData.steps.length}
                      </>
                    )}
                  </ThemedText>

                  {currentStepIndex >= stepData.steps.length && (
                    <ThemedText style={styles.feedbackCorrect}>
                      ✓ Completed all steps.{stepData.finalAnswer ? ` Final answer: ${stepData.finalAnswer}` : ""}
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
                      Attempts on this step: {stepAttemptsByIndex[currentStepIndex] ?? 0}
                    </ThemedText>
                  )}
                </>
              ) : null}
            </ThemedView>
          )}


          {completedSteps.length > 0 && (


            <ThemedView style={styles.completedStepsContainer}>
              <ThemedText style={styles.completedStepsHeader}>
                 Previous Work:
              </ThemedText>
            

            <ThemedText style={styles.completedStepsTitle}>
              These Steps Are Correct. Expand to see more Details...
            </ThemedText>


            {completedSteps.map((stepItem) => {
              const expanded = expandedStep[stepItem.stepIndex] === true;

              return (
                <div key={stepItem.stepIndex} style={styles.completedRow}>
                  <div style={styles.completedTopRow}>  



                    <ThemedText style={styles.completedStepBigLabel}>
                      Step {stepItem.stepIndex + 1}
                    </ThemedText>
                    <ThemedText style={styles.completedStepSmallLabel}>
                      Correct: {stepItem.correct}
                    </ThemedText>
                    <ThemedText style={styles.completedStepSmallLabel}>
                      Completed At: {stepItem.timestamp}
                    </ThemedText>

                </div>

                    <button type="button"
                            style={styles.completedButton}
                            onClick={() => {

                              setExpandedStep((prev) =>{
                                const next: Record<number, boolean> = {}

                                for (const i in prev) {
                                  next[Number(i)] = prev[Number(i)];
                                }

                                next[stepItem.stepIndex] = !prev[stepItem.stepIndex];
                                return next;
                              })

                              
                            }}

                          >
                            {expanded ? 'Hide' : 'View'}
                          </button>
                       
                      
          {/* Expanded part! */}

                      {expanded && (
                        <div style={styles.expandedMainContainer}>
                          
                          <ThemedText style={styles.expandedHeader}>
                            Instruction: 
                          </ThemedText>
                          <ThemedText style={styles.expandedText}>
                            {stepItem.instruction}
                          </ThemedText>

                        
                        {stepItem.response && (
                          <>

                          <ThemedText style={styles.expandedLabel}>
                            Feedback: 
                          </ThemedText>
                          <ThemedText style={styles.expandedText}>
                            {stepItem.response}
                          </ThemedText>
                          
                      </>

                      )}


                  </div>
                )}
             </div>
              )
            })}
    </ThemedView>
          )}
          {/* Continue answer box for the student ^^^ */}

          <ThemedView style={styles.answerSection}>
            {(() => {
              const allStepsComplete = !!(stepData?.steps?.length) && currentStepIndex >= stepData.steps.length;
              const finalAnswerCorrect = answerCorrect === true && !stepData?.steps?.length;
              const problemDone = allStepsComplete || finalAnswerCorrect;
              if (problemDone) {
                return (
                  <>
                    <ThemedText style={styles.feedbackCorrect}>
                      Correct! Great job!
                    </ThemedText>
                    <button
                      type="button"
                      onClick={() => fetchMathProblem()}
                      style={styles.nextProblemButton}
                      disabled={loading}
                    >
                      <ThemedText style={styles.buttonText}>
                        {loading ? "Loading..." : "Next Problem"}
                      </ThemedText>
                    </button>
                  </>
                );
              }
              return null;
            })()}
            {(() => {
              const allStepsComplete = !!(stepData?.steps?.length) && currentStepIndex >= stepData.steps.length;
              const finalAnswerCorrect = answerCorrect === true && !stepData?.steps?.length;
              const problemDone = allStepsComplete || finalAnswerCorrect;
              return !problemDone;
            })() && (
            <>
            <ThemedText style={styles.answerLabel}>
              {stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length
                ? "Your Step Result:"
                : "Your Answer:"}
            </ThemedText>

            {stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length && (

              <div style={styles.stepInstructionRow}>

                <ThemedText style={styles.stepInstruction}>
                {stepData.steps[currentStepIndex]?.instruction}
              </ThemedText>

                <button type="button"
                  style={styles.pinConfirm}
                  onClick={() => {

                    const instruction = stepData.steps[currentStepIndex]?.instruction || "";

                setPinVisibility(true);
                setPinned({
                  title: `Step ${currentStepIndex + 1}`,
                  body: instruction,
                  typeOfInfo: "step",
                })
         }}

        >
          Pin Step
        </button>

              </div>

            )}

            <ThemedText style={styles.inputHint}>
              {stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length
                ? "Tip: Type the equation after doing this step. Example: '2x = 10' or 'x + 5 = 15'"
                : "Tip: You can type just the number (like '42') or the full equation (like 'x = 42')"}
            </ThemedText>
            <textarea
              style={styles.answerInput}
              placeholder={
                stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length
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
                (stepData && stepData.steps.length > 0 && currentStepIndex >= stepData.steps.length && answerCorrect === true) || false
              }
            />

            {role === "teacher" && (
              <div style={{ marginTop: 6, display: "flex", justifyContent: "flex-end"}}>
                <button type="button"
                  onClick={() => setShowCheatSheet((v) => !v)}
                  style={styles.debugLink} >
                  

                  {showCheatSheet ? "Hide (Demo)" : "Show (Demo)"}
                  </button>
              </div>
            )}

            {role === "teacher" && showCheatSheet && stepData && stepData.steps.length > 0 && (
              <div style={styles.debugBox}>
                <div style={styles.debugLine}>


                  <span style={styles.debugLabel}> Expected : </span>
                  <span style={styles.debugSingle}> {stepData.steps[currentStepIndex]?.checkpoint} </span>
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
                  <span style={styles.hintTitle}>Hint {hintLevel}/3</span>

                  <div style={styles.hintHeaderButtons}>
                    <button type="button"
                      onClick={() => {

                        setPinVisibility(true);
                        setPinned({
                          title: `Hint ${hintLevel}/3`,
                          body: currentHint,
                          typeOfInfo: "hint",

                        })
                    }}
                        style = {styles.pinHintButton}
                    >
                      Pin
                    </button>


                  </div>

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
                  if (stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length) {
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
                  (stepData && stepData.steps.length > 0 && currentStepIndex >= stepData.steps.length && answerCorrect === true) || false
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
                  ...(loadingHint || hintLevel >= 3
                    ? styles.buttonDisabled
                    : {}),
                }}
                disabled={loadingHint || hintLevel >= 3}
              >
                <ThemedText style={styles.buttonText}>
                  {loadingHint
                    ? "Loading..."
                    : hintLevel >= 3
                      ? "No More Hints"
                      : `Get Hint${hintLevel > 0 ? ` (${hintLevel}/3)` : ""}`}
                </ThemedText>
              </button>
            </div>
            {practiceFeedback === "submitted" &&
              !(stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length) &&
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
            {practiceFeedback === "submitted" &&
              !(stepData && stepData.steps.length > 0 && currentStepIndex < stepData.steps.length) &&
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
            </>
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

    <div style={styles.practiceRightGap}>
      {pinVisibility && (
        <div style={styles.pinResizeWrapper}>
          <Pin
            pinned={pinned}
            clear={() => setPinned(null)}
            dismiss={() => {
              setPinned(null);
              setPinVisibility(false);
            }}
          />
        </div>
      )}


      </div>
    
  </div>
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
        <div style={{marginTop: 24 }}>
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
    borderBottom: "1px solid rgba(167,139,250,0.18)",
    paddingBottom: 8,
    maxWidth: 900,
    margin: "0 auto",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "#f6f4ff",
  },

  tab: {
    padding: "12px 24px",
    backgroundColor: "transparent",
    border: "1px solid rgba(167,139,250,0.2)",
    borderRadius: "12px 12px 0 0",
    cursor: "pointer",
    transition: "all 0.2s",
    color: "#6b7280",
  },
  activeTab: {
    backgroundColor: "#6B46C1",
    borderColor: "rgba(167,139,250,0.4)",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },

  activeTabText: {
    color: "white",
  },
  titleContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: "#ffffff",
    border: "1px solid rgba(167,139,250,0.2)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,

    color: "#6B46C1",
    display: "block",


  },
  textInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    fontFamily: "inherit",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",


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
    color: "#6b7280",
    textAlign: "right",
    marginTop: 5,
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#6B46C1",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid rgba(167, 139, 250, 0.45)",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  generateButton: {
    flex: 1,
    backgroundColor: "#A78BFA",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid rgba(167, 139, 250, 0.45)",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",

  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
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
    borderTop: "4px solid #6B46C1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    display: "block",
    fontSize: 14,
    opacity: 0.7,
  },
  problemBox: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
  },
  problemText: {
    fontSize: 16,
    lineHeight: 1.5,
    color: "#1d1d1f",
  },
  equationContainer: {
    gap: 16,
    marginBottom: 16,
  },
  equationLabel: {
    marginBottom: 8,
    display: "block",
    color: "#6B46C1",
    fontWeight: "700",

  },
  equationBox: {
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 6px 12px rgba(0,0,0,0.06)",


  },
  equationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B46C1",
    marginBottom: 8,
    opacity: 0.8,
  },
  variablesBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  variableItem: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  saveButton: {
    backgroundColor: "#6B46C1",
    padding: "12px 32px",
    borderRadius: 8,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 6px 15px rgba(0,0,0,0.06)",
  },
  stepTitle: {
    display: "block",
    marginBottom: 8,
    fontWeight: "800",
    color: "#6B46C1",

  },

  stepMeta: {
    display: "block",
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 8,
    color: "#6b7280",
  },

  stepInstruction: {
    display: "block",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1d1d1f",
  },
  stepInstructionRow: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 10,
  },
  pinConfirm: {

    fontSize: 14,
    fontWeight: "700",

    
    borderRadius: 12,
    border: "1px solid rgba(167, 139, 250, 0.35)",
    backgroundColor: "1px solid rgba(167, 139, 250, 0.35)",
    padding: "8px",


    alignSelf: "flex-start",
    cursor: "pointer",
    color: "#6B46C1",

  },

  stepAttempts: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 8,
    color:"#6b7280",
  },
  roleToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    backgroundColor: "#f3e8ff",
    border: "1px solid rgba(167, 139, 250, 0.2)",
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
    color: "#6b7280",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#6B46C1",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 3px rbga(0,0,0,0.06)",
    cursor: "pointer",
    width: "100%",
  },

  answerSection: {

    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    boxShadow: "0 6px 15px rgba(0,0,0,0.06)",
    border: "1px solid rgba(167, 139, 250, 0.2)",
   
    
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
    color: "#6B46C1",
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
    backgroundColor: "#6B46C1",
    borderRadius: 8,
    padding: 12,
    border: "none",
    cursor: "pointer",
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B46C1",
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
    borderColor: "rgba(167,139,250,0.3)",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    fontFamily: "inherit",
    resize: "vertical" as "vertical",
    marginBottom: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  },
  answerButtons: {
    display: "flex",
    gap: 12,
    marginTop: 8,
  },
  submitAnswerButton: {
    flex: 1,
    backgroundColor: "#6B46C1",
    borderRadius: 8,
    padding: 12,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  nextProblemButton: {
    marginTop: 16,
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#6B46C1",
    borderRadius: 8,
    padding: "16px 24px",
    border: "1px solid rgba(167, 139, 250, 0.45)",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  cancelAnswerButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  hintButton: {
    flex: "1 1 auto",
    minWidth: 120,
    backgroundColor: "#A78BFA",
    borderRadius: 8,
    padding: 12,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  hintBox: {
    backgroundColor: "#faf5ff",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    border: "1px solid rgba(167, 139, 250, 0.2)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
  hintHeaderButtons: {
    display: "flex",
    alignItems: "center",
    gap: 5,


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
    color: "#6B46C1",
    fontSize: 16,
    fontWeight: "800",
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
    backgroundColor: "#f6f4ff",
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
    backgroundColor: "#f6f4ff",
  },
  scrollContainer: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    padding: 24,
    paddingTop: 0,
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
    boxSizing: "border-box",
  },

  completedStepsContainer: {
    backgroundColor: "#ffffff",
    padding: 16, 
    marginBottom: 16,
    border: "1px solid rgba(167,139,250,0.18)",
    borderRadius: 14,

    boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
  

    maxHeight: 300,
    overflowY: "auto",
    WebkitOverflowScrolling: 'touch',

  },
  completedStepsHeader: {
    display: "block",
    fontSize: 20,
    lineHeight: "24px",
    fontWeight: "700",
    marginBottom: 5,
    color: "#6B46C1",


  },
  completedStepsTitle: {
    display: "block",
    fontSize: 13,
    fontStyle: "normal",
    lineHeight: 1.4,
    color: "#86868b",
  

    marginBottom: 14,



  },
  completedRow: {
    backgroundColor:"#faf5ff",
    borderRadius: 14,
    border: "2px solid rgba(167,139, 250,0.35)",
    padding: 14,
    marginBottom: 10,
  
    boxShadow: "0 1px 3px rgba(167,139,250,0.1)",

  },
  completedTopRow: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 6,

  },
  completedStepSmallLabel: {
    display: "block",
    fontSize: 12,
    opacity: 0.9,
    color: "#86868b",
    marginBottom: 2,

  },
  completedStepBigLabel: {
    display: "block",
    fontSize: 16,
    color: "#1d1d1f",
    fontWeight: "700",
  
    marginBottom: 2,

  },
  completedButton: {

    marginTop: 8,
    borderRadius: 12,
    border: "1.5px solid #A78BFA",
    padding: "8px 12px",
    cursor: "pointer",
    backgroundColor: "#ffffff",
    color: "#6B46C1",
    fontSize: 12,
    fontWeight: "500",
    
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",

  
   
  },




  expandedMainContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(167,139, 250,0.2)",

    maxHeight: 120,
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    paddingRight: 10,


  },
  expandedHeader: {
    display: "block",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    color: "#6B46C1",

  },
  expandedLabel: {
    display: "block",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
    color: "#6B46C1",

  },
  expandedText: {
    display: "block",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,

    color: "#1d1d1f",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",

    lineHeight: 1.5,
    

  },
  pinContainer: {
    position: "sticky",
    marginBottom: 15,


    top: 15,
    zIndex: 6, 

  },
  pinHintButton: {

    fontSize: 12,
    fontWeight: "700",
    color: "#6B46C1",

    border: "1px solid rgba(167,139,250,0.35)",
    borderRadius: 10,
    backgroundColor: "1px solid rgba(167,139,250,0.15)",
    padding: "8px",

    cursor: "pointer",

    


  },
  pinBox: {
    width: 220,
    height: 220,
  },
  pinResizeWrapper: {
    resize: "both",
    overflow: "auto",
    minWidth: 260,
    minHeight: 220,
    width: 320,
    height: 380,
    maxWidth: 560,
    maxHeight: "85vh",
    boxSizing: "border-box",
  },
  pinMain: {
    minWidth: 0,
  },
  practiceLayout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 900px) 260px",
    justifyContent: "center",
    columnGap: 24,
    alignItems: "start",
  },

  practiceRightGap: {
    position: "sticky",
    top: 120,
    alignSelf: "start",
    zIndex: 20,


    minWidth: 0,
    paddingLeft: 90,
    boxSizing: "border-box",
    overflow: "visible",
    

  },
  pinSticky: {
    position: "sticky",
    top: 120,
    zIndex: 20,
    width: "100%",
    pointerEvents: "auto",
    alignSelf: "start",
  },

  

  practiceOuterContainer: {
    position: "relative",
    width: "100%",
  },
  practiceCentralContent: {
    maxWidth: 900,
    width: "100%",
    minWidth: 0,
  },
 
  pinClick: {
    pointerEvents: "auto",
  },






  
};
