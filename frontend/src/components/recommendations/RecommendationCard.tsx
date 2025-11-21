import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Play, ExternalLink } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RecommendationItem, Routine } from '../../types';
import { useRoutinesContext } from '../../contexts/RoutinesContext';
import { api } from '../../api';

interface RecommendationCardProps {
  item: RecommendationItem;
  onSave?: () => void;
}

export function RecommendationCard({ item, onSave }: RecommendationCardProps) {
  const navigate = useNavigate();
  const { createRoutine } = useRoutinesContext();
  const [isSaving, setIsSaving] = useState(false);

  const routine = item.routine || item.routineData;
  if (!routine) return null;

  const isAIGenerated = item.itemType === 'ai_generated';
  const exercises = routine.exercises || [];

  const getVideoThumbnail = (videoUrl?: string) => {
    if (!videoUrl) return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400';
    
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    
    return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  const handleSave = async () => {
    if (!isAIGenerated || !item.routineData) return;

    setIsSaving(true);
    try {
      await createRoutine({
        name: item.routineData.name,
        description: item.routineData.description,
        estimatedDuration: item.routineData.estimatedDuration,
        exercises: item.routineData.exercises.map((ex, idx) => ({
          id: crypto.randomUUID(),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          notes: ex.notes,
        })),
        videoUrl: item.routineData.videoUrl,
      });
      onSave?.();
    } catch (error) {
      console.error('Failed to save routine:', error);
      alert('Failed to save routine. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = () => {
    if (item.routineId) {
      navigate(`/routines/${item.routineId}`);
    } else if (item.routineData) {
      // For AI-generated routines, we could show a preview modal
      // For now, just save it first
      handleSave();
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Badge */}
      {isAIGenerated && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI Generated
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-48">
        <img
          src={getVideoThumbnail(routine.videoUrl)}
          alt={routine.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          {routine.videoUrl && (
            <a
              href={routine.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-8 h-8" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Reasoning */}
        {item.reasoning && (
          <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-300">{item.reasoning}</p>
          </div>
        )}

        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
          {routine.name}
        </h3>

        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {routine.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
          <span>{exercises.length} exercises</span>
          <span>
            {routine.estimatedDuration
              ? `~${routine.estimatedDuration} min`
              : 'Duration not set'}
          </span>
        </div>

        {/* Exercises Preview */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase">
            Exercises Preview
          </p>
          <div className="space-y-1">
            {exercises.slice(0, 3).map((exercise, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-300">{exercise.name}</span>
                <span className="text-gray-500">
                  {exercise.sets && exercise.reps
                    ? `${exercise.sets}x${exercise.reps}`
                    : 'N/A'}
                </span>
              </div>
            ))}
            {exercises.length > 3 && (
              <p className="text-xs text-gray-500">
                +{exercises.length - 3} more exercises
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isAIGenerated ? (
            <>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save to Library'}
              </Button>
              <Button
                variant="ghost"
                icon={Play}
                onClick={handleView}
                className="px-4"
              >
                Preview
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              icon={Play}
              onClick={handleView}
              className="w-full"
            >
              View Routine
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

