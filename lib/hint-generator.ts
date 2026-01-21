const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export type HintLevel = 1 | 2 | 3;

export interface HintResponse {
  hint: string;
  level: HintLevel;
}

export interface EquationData {
  equation: string;
  substitutedEquation: string;
  variables: string[];
}

export class HintGenerator {
  private problem: string;
  private equationData: EquationData | null;
  private currentLevel: HintLevel;
  private cachedHints: Map<HintLevel, string>;

  constructor(problem: string, equationData: EquationData | null) {
    this.problem = problem;
    this.equationData = equationData;
    this.currentLevel = 1;
    this.cachedHints = new Map();
  }

  async getNextHint(): Promise<HintResponse | null> {
    if (this.currentLevel > 3) {
      return null;
    }

    if (this.cachedHints.has(this.currentLevel)) {
      const hint = this.cachedHints.get(this.currentLevel)!;
      const level = this.currentLevel;
      this.currentLevel = Math.min(this.currentLevel + 1, 4) as HintLevel;
      return { hint, level };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/openai/generate-hint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problem: this.problem,
          equation: this.equationData?.equation || null,
          substitutedEquation: this.equationData?.substitutedEquation || null,
          variables: this.equationData?.variables || [],
          hintLevel: this.currentLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate hint: ${response.status}`);
      }

      const data = await response.json();
      const hint = data.hint;

      if (!hint) {
        throw new Error("No hint returned from API");
      }

      this.cachedHints.set(this.currentLevel, hint);
      const level = this.currentLevel;
      this.currentLevel = Math.min(this.currentLevel + 1, 4) as HintLevel;

      return { hint, level };
    } catch (error) {
      console.error("Error generating hint:", error);
      throw error;
    }
  }

  reset(): void {
    this.currentLevel = 1;
    this.cachedHints.clear();
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  hasMoreHints(): boolean {
    return this.currentLevel <= 3;
  }
}
