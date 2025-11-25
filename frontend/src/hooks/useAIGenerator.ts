import { useState, useCallback } from "react";
import { api, GenerateRoutineRequest, GeneratedRoutine } from "../api";

export function useAIGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedRoutine, setGeneratedRoutine] =
    useState<GeneratedRoutine | null>(null);

  const generateRoutine = useCallback(
    async (request: GenerateRoutineRequest) => {
      setIsGenerating(true);
      setError(null);
      setGeneratedRoutine(null);

      try {
        const result = await api.generator.generateRoutine(request);
        setGeneratedRoutine(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate routine";
        setError(errorMessage);
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setGeneratedRoutine(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generateRoutine,
    isGenerating,
    error,
    generatedRoutine,
    reset,
  };
}
