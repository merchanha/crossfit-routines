import { TrendingUp, TrendingDown, Minus, Target, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { PerformanceAnalysis } from '../../types';

interface PerformanceInsightsProps {
  analysis: PerformanceAnalysis;
}

export function PerformanceInsights({ analysis }: PerformanceInsightsProps) {
  const getTrendIcon = () => {
    if (analysis.trends.improving) {
      return <TrendingUp className="w-5 h-5 text-emerald-400" />;
    } else if (analysis.trends.declining) {
      return <TrendingDown className="w-5 h-5 text-red-400" />;
    } else {
      return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTrendText = () => {
    if (analysis.trends.improving) {
      return 'Improving';
    } else if (analysis.trends.declining) {
      return 'Declining';
    } else {
      return 'Stable';
    }
  };

  const formatDelta = (delta: number) => {
    const absDelta = Math.abs(delta);
    const minutes = Math.floor(absDelta / 60);
    const seconds = absDelta % 60;

    if (delta < 0) {
      return `${minutes}m ${seconds}s faster`;
    } else if (delta > 0) {
      return `${minutes}m ${seconds}s slower`;
    } else {
      return 'On time';
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Performance Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">Total Workouts</span>
              </div>
              <p className="text-2xl font-bold text-white">{analysis.totalWorkouts}</p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">Completed</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {analysis.completedWorkouts}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {analysis.completionRate}% completion rate
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {getTrendIcon()}
                <span className="text-sm text-gray-400">Trend</span>
              </div>
              <p className="text-2xl font-bold text-white">{getTrendText()}</p>
            </div>
          </div>

          {/* Average Delta */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Average Time vs Estimated</p>
            <p className="text-xl font-bold text-emerald-300">
              {formatDelta(analysis.averageDelta)}
            </p>
          </div>
        </div>
      </Card>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 bg-orange-400 rounded-full" />
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

