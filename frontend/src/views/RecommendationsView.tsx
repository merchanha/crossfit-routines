import { RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PerformanceInsights, RecommendationCard } from '../components/recommendations';
import { useRecommendations } from '../hooks/useRecommendations';

export function RecommendationsView() {
  const { recommendation, isLoading, error, refresh } = useRecommendations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Analyzing your workout performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Recommendations</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => refresh()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Recommendations Yet</h2>
          <p className="text-gray-400 mb-4">
            Complete some workouts to get personalized recommendations!
          </p>
          <Button variant="primary" onClick={() => refresh()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Sort items by priority (higher first)
  const sortedItems = [...recommendation.items].sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-emerald-400" />
            AI Recommendations
          </h1>
          <p className="text-gray-400 mt-1">
            Personalized workout suggestions based on your performance
          </p>
        </div>
        <Button variant="ghost" icon={RefreshCw} onClick={() => refresh()}>
          Refresh
        </Button>
      </div>

      {/* Performance Insights */}
      <PerformanceInsights analysis={recommendation.performanceAnalysis} />

      {/* Recommendations */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Recommended Routines ({sortedItems.length})
        </h2>

        {sortedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                onSave={() => refresh()}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400">
              No recommendations available. Complete more workouts to get suggestions!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

