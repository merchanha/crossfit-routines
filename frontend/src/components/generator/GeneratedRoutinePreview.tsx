import React from 'react';
import { Clock, Play, Dumbbell } from 'lucide-react';
import { Card } from '../ui/Card';
import { GeneratedRoutine } from '../../api';

interface GeneratedRoutinePreviewProps {
  routine: GeneratedRoutine;
}

export function GeneratedRoutinePreview({ routine }: GeneratedRoutinePreviewProps) {
  const getVideoThumbnail = (videoUrl?: string) => {
    if (!videoUrl) return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400';
    
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    
    return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=400';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">{routine.name}</h3>
        <p className="text-gray-300">{routine.description}</p>
      </div>

      {/* Video Preview */}
      {routine.videoUrl && (
        <div className="relative">
          <img
            src={getVideoThumbnail(routine.videoUrl)}
            alt={routine.name}
            className="w-full h-48 object-cover rounded-lg"
          />
          <a
            href={routine.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-70 transition-opacity rounded-lg group"
          >
            <div className="flex items-center space-x-2 text-white">
              <Play className="w-8 h-8" />
              <span className="font-semibold">Watch Video</span>
            </div>
          </a>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center space-x-6 text-gray-400">
        {routine.estimatedDuration && (
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{routine.estimatedDuration} minutes</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Dumbbell className="w-5 h-5" />
          <span>{routine.exercises.length} exercises</span>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-white">Exercises</h4>
        <div className="space-y-2">
          {routine.exercises.map((exercise, index) => (
            <Card key={exercise.id || index} className="p-4 bg-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-semibold text-white mb-1">{exercise.name}</h5>
                  {(exercise.sets || exercise.reps) && (
                    <p className="text-sm text-gray-400">
                      {exercise.sets && exercise.reps
                        ? `${exercise.sets} sets × ${exercise.reps} reps`
                        : exercise.sets
                        ? `${exercise.sets} sets`
                        : exercise.reps
                        ? `${exercise.reps} reps`
                        : ''}
                    </p>
                  )}
                  {exercise.notes && (
                    <p className="text-sm text-gray-300 mt-2 italic">{exercise.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

