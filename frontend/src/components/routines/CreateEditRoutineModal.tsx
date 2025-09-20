import { useState, useEffect } from 'react';
import { Plus, Trash2, Play } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { useRoutinesContext } from '../../contexts/RoutinesContext';
import { Routine, Exercise } from '../../types';

interface CreateEditRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  routine?: Routine | null;
}

interface ExerciseForm extends Exercise {
  tempId: string;
}

export function CreateEditRoutineModal({ isOpen, onClose, routine }: CreateEditRoutineModalProps) {
  const { createRoutine, updateRoutine } = useRoutinesContext();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    videoUrl: '',
    estimatedDuration: ''
  });

  const [exercises, setExercises] = useState<ExerciseForm[]>([]);
  const [videoPreview, setVideoPreview] = useState<string>('');

  // Initialize form when routine changes
  useEffect(() => {
    if (routine) {
      setFormData({
        name: routine.name,
        description: routine.description,
        videoUrl: routine.videoUrl || '',
        estimatedDuration: routine.estimatedDuration?.toString() || ''
      });
      setExercises(routine.exercises.map(ex => ({ ...ex, tempId: crypto.randomUUID() })));
    } else {
      setFormData({ name: '', description: '', videoUrl: '', estimatedDuration: '' });
      setExercises([]);
    }
    setVideoPreview('');
  }, [routine, isOpen]);

  // Generate video preview URL
  useEffect(() => {
    if (formData.videoUrl) {
      const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = formData.videoUrl.match(youtubeRegex);
      
      if (match) {
        setVideoPreview(`https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`);
      } else {
        setVideoPreview('');
      }
    } else {
      setVideoPreview('');
    }
  }, [formData.videoUrl]);

  const addExercise = () => {
    const newExercise: ExerciseForm = {
      id: crypto.randomUUID(),
      tempId: crypto.randomUUID(),
      name: '',
      sets: 0,
      reps: 0,
      notes: ''
    };
    setExercises(prev => [...prev, newExercise]);
  };

  const updateExercise = (tempId: string, updates: Partial<ExerciseForm>) => {
    setExercises(prev => prev.map(ex => 
      ex.tempId === tempId ? { ...ex, ...updates } : ex
    ));
  };

  const removeExercise = (tempId: string) => {
    setExercises(prev => prev.filter(ex => ex.tempId !== tempId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const routineData = {
        ...formData,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        exercises: exercises.map(({ tempId, ...ex }) => ex)
      };

      if (routine) {
        await updateRoutine(routine.id, routineData);
      } else {
        await createRoutine(routineData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving routine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={routine ? `Edit ${routine.name}` : 'Create New Routine'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <Input
            label="Routine Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Morning HIIT, Strength Training"
            required
          />

          <TextArea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the workout routine..."
            rows={3}
          />

          <div>
            <Input
              label="Video URL"
              value={formData.videoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              helperText="YouTube, Vimeo, or other video platform URL"
            />
            
            {videoPreview && (
              <div className="mt-3">
                <div className="relative w-full h-32 bg-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={videoPreview}
                    alt="Video preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Input
            label="Estimated Duration (minutes)"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
            placeholder="30"
            helperText="How long do you estimate this workout will take?"
            min="1"
            max="300"
          />
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Exercises</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={addExercise}
            >
              Add Exercise
            </Button>
          </div>

          {exercises.length === 0 && (
            <div className="text-center py-8 bg-gray-700 rounded-lg">
              <p className="text-gray-400 mb-4">No exercises added yet</p>
              <Button
                type="button"
                variant="primary"
                icon={Plus}
                onClick={addExercise}
              >
                Add Your First Exercise
              </Button>
            </div>
          )}

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {exercises.map((exercise, index) => (
              <div key={exercise.tempId} className="bg-gray-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-300">
                    Exercise {index + 1}
                  </h4>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeExercise(exercise.tempId)}
                    className="p-2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Exercise Name"
                      value={exercise.name}
                      onChange={(e) => updateExercise(exercise.tempId, { name: e.target.value })}
                      placeholder="e.g., Push-ups, Squats, Plank"
                      required
                    />
                  </div>

                  <Input
                    label="Sets"
                    type="number"
                    value={exercise.sets || ''}
                    onChange={(e) => updateExercise(exercise.tempId, { sets: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />

                  <Input
                    label="Reps"
                    type="number"
                    value={exercise.reps || ''}
                    onChange={(e) => updateExercise(exercise.tempId, { reps: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />


                  <div className="md:col-span-2">
                    <TextArea
                      label="Notes (optional)"
                      value={exercise.notes || ''}
                      onChange={(e) => updateExercise(exercise.tempId, { notes: e.target.value })}
                      placeholder="Special instructions, form tips, modifications..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!formData.name.trim() || exercises.length === 0}
          >
            {routine ? 'Update Routine' : 'Create Routine'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}