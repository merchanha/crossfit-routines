import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Recommendation } from "../types";

export function useRecommendations() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async (refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.recommendations.getRecommendations(refresh);
      setRecommendation(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recommendations"
      );
      console.error("Error loading recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const dismissRecommendation = useCallback(
    async (recommendationId: string) => {
      try {
        setError(null);
        await api.recommendations.dismiss(recommendationId);
        // Reload recommendations after dismissing
        await loadRecommendations();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to dismiss recommendation"
        );
        throw err;
      }
    },
    [loadRecommendations]
  );

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    recommendation,
    isLoading,
    error,
    refresh: () => loadRecommendations(true),
    dismiss: dismissRecommendation,
  };
}
