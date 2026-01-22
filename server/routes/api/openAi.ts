import {
  ErrorType,
  parseDatabaseError,
  parseNetworkError,
} from "@/lib/error-utils";
import { IncomingMessage, ServerResponse } from "http";

import { OpenAIHandler } from "@/utilities/openAiUtility";
import ToggleLogs, { LogLevel } from "../../utilities/toggle_logs";
import UrlUtils from "../../utilities/url_utils";

const endpoint = "/api/openai";
type QueryBody = { prompt: string; image?: string };

type StepCheckpointsBody = { problem: string; substitutedEquation: string };

type GradeStepBody = {
    startEquation: string;
    targetVariable: string;
    stepInstruction: string;
    expectedCheckpoint: string;
    studentInput: string;
};

export function handles(req: IncomingMessage): boolean {
  if (req == undefined || req.url == undefined) return false;
  return req.url.startsWith("/api/openai");
}

export async function handle(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.url?.startsWith("/api/openai/generate-hint")) {
    ToggleLogs.log("Handling generate hint request..", LogLevel.INFO);

    if (req.method !== "POST") {
      ToggleLogs.log(
        `Generate hint endpoint only handles POST. Received: ${req.method}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 405, {
        error: "Method Not Allowed",
        message: "Only POST requests are allowed for this endpoint.",
      });
      return;
    }

    const body = (await UrlUtils.getBody(req)) as {
      problem: string;
      hintLevel: number;
    };
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.problem !== "string" ||
      typeof body.hintLevel !== "number"
    ) {
      ToggleLogs.log(
        `Invalid request body for generate hint endpoint. Body: ${JSON.stringify(body)}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 400, {
        error: "Bad Request",
        message:
          'Request body must contain "problem" (string) and "hintLevel" (number) fields.',
      });
      return;
    }

    try {
      ToggleLogs.log(
        `Generating hint level ${body.hintLevel} for problem: ${body.problem.substring(0, 100)}...`,
        LogLevel.INFO,
      );
      OpenAIHandler.generateHint(body.problem, body.hintLevel)
        .then((hint: string) => {
          ToggleLogs.log(
            `Generated hint: ${hint.substring(0, 100)}...`,
            LogLevel.DEBUG,
          );
          UrlUtils.sendJson(res, 200, {
            hint: hint,
            level: body.hintLevel,
          });
        })
        .catch((err: any) => {
          ToggleLogs.log(`Error generating hint: ${err}`, LogLevel.CRITICAL);
          UrlUtils.sendJson(res, 500, {
            error: "Internal Server Error",
            message: "An error occurred while generating the hint.",
          });
        });
    } catch (err: any) {
      ToggleLogs.log(
        `Error processing hint generation request: ${err}`,
        LogLevel.CRITICAL,
      );
      UrlUtils.sendJson(res, 500, {
        error: "Internal Server Error",
        message: "An error occurred while processing the request.",
      });
    }

    return;
  }

  if (req.url?.startsWith("/api/openai/step-checkpoints")) {
        ToggleLogs.log('Handling step checkpoints request..', LogLevel.INFO);

        if (req.method !== 'POST') {
            UrlUtils.sendJson(res, 405, {
                error: 'Method Not Allowed',
                message: 'Only POST requests are allowed for this endpoint.',
            });
            return;
        }

        const body = (await UrlUtils.getBody(req)) as StepCheckpointsBody;
        if (!body || typeof body !== 'object' || typeof body.problem !== 'string' || typeof body.substitutedEquation !== 'string') {
            UrlUtils.sendJson(res, 400, {
                error: 'Bad Request',
                message: 'Request body must contain "problem" and "substitutedEquation" string fields.',
            });
            return;
        }

        try {
            OpenAIHandler.generateStepCheckpoints(body.problem, body.substitutedEquation)
                .then((result) => {
                    UrlUtils.sendJson(res, 200, result);
                })
                .catch((err: any) => {
                    ToggleLogs.log(`Error generating step checkpoints: ${err}`, LogLevel.CRITICAL);
                    UrlUtils.sendJson(res, 500, {
                        error: 'Internal Server Error',
                        message: 'An error occurred while generating step checkpoints.',
                    });
                });
        } catch (err: any) {
            ToggleLogs.log(`Error processing step checkpoints request: ${err}`, LogLevel.CRITICAL);
            UrlUtils.sendJson(res, 500, {
                error: 'Internal Server Error',
                message: 'An error occurred while processing the request.',
            });
        }

        return;
    }

  if (req.url?.startsWith("/api/openai/grade-step")) {
        ToggleLogs.log('Handling grade step request..', LogLevel.INFO);

        if (req.method !== 'POST') {
            UrlUtils.sendJson(res, 405, {
                error: 'Method Not Allowed',
                message: 'Only POST requests are allowed for this endpoint.',
            });
            return;
        }

        const body = (await UrlUtils.getBody(req)) as GradeStepBody;
        if (
            !body ||
            typeof body !== 'object' ||
            typeof body.startEquation !== 'string' ||
            typeof body.targetVariable !== 'string' ||
            typeof body.stepInstruction !== 'string' ||
            typeof body.expectedCheckpoint !== 'string' ||
            typeof body.studentInput !== 'string'
        ) {
            UrlUtils.sendJson(res, 400, {
                error: 'Bad Request',
                message:
                    'Request body must contain "startEquation", "targetVariable", "stepInstruction", "expectedCheckpoint", and "studentInput" string fields.',
            });
            return;
        }

        try {
            OpenAIHandler.gradeStepAttempt({
                startEquation: body.startEquation,
                targetVariable: body.targetVariable,
                stepInstruction: body.stepInstruction,
                expectedCheckpoint: body.expectedCheckpoint,
                studentInput: body.studentInput,
            })
                .then((result) => {
                    UrlUtils.sendJson(res, 200, result);
                })
                .catch((err: any) => {
                    ToggleLogs.log(`Error grading step: ${err}`, LogLevel.CRITICAL);
                    UrlUtils.sendJson(res, 500, {
                        error: 'Internal Server Error',
                        message: 'An error occurred while grading the step.',
                    });
                });
        } catch (err: any) {
            ToggleLogs.log(`Error processing grade step request: ${err}`, LogLevel.CRITICAL);
            UrlUtils.sendJson(res, 500, {
                error: 'Internal Server Error',
                message: 'An error occurred while processing the request.',
            });
        }

        return;
    }

  if (req.url?.startsWith("/api/openai/math-problem")) {
    ToggleLogs.log("Handling OpenAI math problem request..", LogLevel.INFO);

    if (req.method !== "GET") {
      ToggleLogs.log(
        `Math problem endpoint only handles GET. Received: ${req.method}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 405, {
        error: "Method Not Allowed",
        message: "Only GET requests are allowed for this endpoint.",
      });
      return;
    }

    try {
      const queryParams = UrlUtils.getQuery(req);
      const topicsParam = queryParams.get("topics");
      const topicIds = topicsParam
        ? topicsParam.split(",").filter((id) => id.trim())
        : [];

      ToggleLogs.log(
        `Generating math problem with ${topicIds.length} topic(s)...`,
        LogLevel.INFO,
      );

      OpenAIHandler.generateMathProblem(topicIds)
        .then((problemText: string) => {
          ToggleLogs.log(
            `Generated problem: ${problemText.substring(0, 100)}...`,
            LogLevel.DEBUG,
          );
          UrlUtils.sendJson(res, 200, {
            problem: problemText,
          });
        })
        .catch((err: any) => {
          ToggleLogs.log(
            `Error generating math problem: ${err}`,
            LogLevel.CRITICAL,
          );
          UrlUtils.sendJson(res, 500, {
            error: "Internal Server Error",
            message: "An error occurred while generating the math problem.",
          });
        });
    } catch (err: any) {
      ToggleLogs.log(
        `Error processing math problem request: ${err}`,
        LogLevel.CRITICAL,
      );
      UrlUtils.sendJson(res, 500, {
        error: "Internal Server Error",
        message: "An error occurred while processing the request.",
      });
    }

    return;
  }

  if (req.url?.startsWith("/api/openai/extract-equation")) {
    ToggleLogs.log("Handling equation extraction request..", LogLevel.INFO);

    if (req.method !== "POST") {
      ToggleLogs.log(
        `Extract equation endpoint only handles POST. Received: ${req.method}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 405, {
        error: "Method Not Allowed",
        message: "Only POST requests are allowed for this endpoint.",
      });
      return;
    }

    const body = (await UrlUtils.getBody(req)) as { problem: string };
    if (!body || typeof body !== "object" || typeof body.problem !== "string") {
      ToggleLogs.log(
        `Invalid request body for extract equation endpoint. Body: ${body}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 400, {
        error: "Bad Request",
        message: 'Request body must contain a "problem" string field.',
      });
      return;
    }

    try {
      ToggleLogs.log(
        `Extracting equation from problem: ${body.problem.substring(0, 100)}...`,
        LogLevel.INFO,
      );
      OpenAIHandler.extractEquation(body.problem)
        .then((result) => {
          ToggleLogs.log(
            `Extracted equation: ${result.equation}`,
            LogLevel.DEBUG,
          );
          UrlUtils.sendJson(res, 200, result);
        })
        .catch((err: any) => {
          ToggleLogs.log(
            `Error extracting equation: ${err}`,
            LogLevel.CRITICAL,
          );
          UrlUtils.sendJson(res, 500, {
            error: "Internal Server Error",
            message: "An error occurred while extracting the equation.",
          });
        });
    } catch (err: any) {
      ToggleLogs.log(
        `Error processing equation extraction request: ${err}`,
        LogLevel.CRITICAL,
      );
      UrlUtils.sendJson(res, 500, {
        error: "Internal Server Error",
        message: "An error occurred while processing the request.",
      });
    }

    return;
  }

  if (req.url?.startsWith("/api/openai/query")) {
    ToggleLogs.log("Handling OpenAI query request..", LogLevel.INFO);

    if (req.method !== "POST") {
      ToggleLogs.log(
        `Query endpoint only handles POST. Received: ${req.method}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 405, {
        error: "Method Not Allowed",
        message: "Only POST requests are allowed for this endpoint.",
      });
      return;
    }

    const body = (await UrlUtils.getBody(req)) as QueryBody;
    if (!body || typeof body !== "object") {
      ToggleLogs.log(
        `Invalid request body for OpenAI query endpoint. Body: ${body}`,
        LogLevel.WARN,
      );
      UrlUtils.sendJson(res, 400, {
        error: "Bad Request",
        message: "Request body must be a valid JSON object.",
      });
      return;
    }

    const { prompt: userPrompt, image } = body;

    if (typeof userPrompt !== "string" || !userPrompt.trim()) {
      UrlUtils.sendJson(res, 400, {
        error: "Bad Request",
        message: 'Field "prompt" is required.',
      });
      return;
    }

    try {
      if (typeof image === "string" && userPrompt.trim()) {
        if (!body.image) {
          UrlUtils.sendJson(res, 400, {
            error: "Bad Request",
            message: "Missing image data",
          });
          return;
        }

        ToggleLogs.log(
          `Sending image analysis prompt to OpenAI=${body.prompt}...`,
          LogLevel.INFO,
        );
        OpenAIHandler.generateFromImage(body.prompt, body.image)
          .then((responseText) => {
            ToggleLogs.log(
              `Received response from OpenAI=${responseText}`,
              LogLevel.DEBUG,
            );
            UrlUtils.sendJson(res, 200, {
              response: responseText,
            });
          })
          .catch((err: any) => {
            ToggleLogs.log(
              `Error generating from image: ${err}`,
              LogLevel.CRITICAL,
            );
            UrlUtils.sendJson(res, 500, {
              error: "Internal Server Error",
              message: "An error occurred while processing the image request.",
            });
          });
      } else {
        ToggleLogs.log(
          `Sending text prompt to OpenAI=${body.prompt}...`,
          LogLevel.INFO,
        );
        OpenAIHandler.generateText(body.prompt)
          .then((responseText) => {
            ToggleLogs.log(
              `Received response from OpenAI=${responseText}`,
              LogLevel.DEBUG,
            );
            UrlUtils.sendJson(res, 200, {
              response: responseText,
            });
          })
          .catch((err: any) => {
            ToggleLogs.log(`Error generating text: ${err}`, LogLevel.CRITICAL);
            UrlUtils.sendJson(res, 500, {
              error: "Internal Server Error",
              message: "An error occurred while processing the text request.",
            });
          });
      }
    } catch (err: any) {
      ToggleLogs.log(
        `Error processing OpenAI query request: ${err}`,
        LogLevel.CRITICAL,
      );
      UrlUtils.sendJson(res, 500, {
        error: "Internal Server Error",
        message: "An error occurred while processing the request.",
      });
    }

    return;
  }

  try {
    UrlUtils.simulateDelay(res, 500, 200, "Mocked OpenAI response");
    return;
  } catch (error: any) {
    let appError;

    if (
      error?.message?.includes("ECONNRESET") ||
      error?.message?.includes("connection") ||
      error?.code === "ECONNRESET"
    ) {
      appError = parseDatabaseError(error);
    } else if (
      error?.message?.includes("timeout") ||
      error?.message?.includes("TIMEOUT")
    ) {
      appError = parseNetworkError(error);
    } else {
      appError = {
        type: ErrorType.INTERNAL_ERROR,
        message: error?.message || "Unknown error",
        userMessage: "Internal server error",
        code: error?.code || "UNKNOWN",
        details: { originalError: error },
      };
    }

    console.error(`[${appError.type}] ${endpoint} handler error:`, {
      message: appError.message,
      code: appError.code,
      details: appError.details,
      timestamp: new Date().toISOString(),
    });

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Internal server error",
        message: "Something went wrong",
        code: appError.code,
      }),
    );
  }
}

export default { handles, handle };
