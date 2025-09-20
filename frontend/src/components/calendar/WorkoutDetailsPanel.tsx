import { useState } from 'react';
import { Calendar, Plus, Edit, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import { ScheduledWorkout } from '../../types';
import { useScheduledWorkoutsContext } from '../../contexts/ScheduledWorkoutsContext';
import { useNotes } from '../../hooks/useApi';

interface WorkoutDetailsPanelProps {
  date: Date;
  workouts: ScheduledWorkout[];
  onScheduleMore: () => void;
}

export function WorkoutDetailsPanel({ date, workouts, onScheduleMore }: WorkoutDetailsPanelProps) {
  const { updateScheduledWorkout } = useScheduledWorkoutsContext();
  const { addNote, updateNote, getNotesForDate } = useNotes();
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');

  const dayNotes = getNotesForDate(date);

  const toggleWorkoutCompletion = async (workoutId: string, completed: boolean) => {
    try {
      await updateScheduledWorkout(workoutId, { completed });
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim()) {
      try {
        await addNote(newNote.trim(), date);
        setNewNote('');
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      await updateNote(noteId, content);
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Header */}
      <Card className="p-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-semibold text-white">
              {format(date, 'EEEE, MMMM dd')}
            </h3>
            <p className="text-sm text-gray-400">
              {format(date, 'yyyy')}
            </p>
          </div>
        </div>
      </Card>

      {/* Scheduled Workouts */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-white">Scheduled Workouts</h4>
          <Button
            variant="ghost"
            size="sm"
            icon={Plus}
            onClick={onScheduleMore}
            className="p-2"
          />
        </div>

        {workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map((workout) => {
              console.log('WorkoutDetailsPanel - workout:', workout);
              console.log('WorkoutDetailsPanel - routine:', workout.routine);
              return (
              <div key={workout.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-white mb-1">
                      {workout.routine?.name || 'Loading routine...'}
                    </h5>
                    <p className="text-sm text-gray-300 mb-2">
                      {workout.routine?.description || 'Loading routine details...'}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>{workout.routine?.exercises?.length || 0} exercises</span>
                      <span className={`px-2 py-1 rounded-full ${
                        workout.completed 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {workout.completed ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={workout.completed ? X : Check}
                    onClick={() => toggleWorkoutCompletion(workout.id, !workout.completed)}
                    className={`p-2 ${
                      workout.completed 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  />
                </div>

                {workout.routine && workout.routine.exercises && workout.routine.exercises.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400 uppercase">
                      Exercises Preview
                    </p>
                    <div className="space-y-1">
                      {workout.routine.exercises.slice(0, 3).map((exercise, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-300">{exercise.name}</span>
                          <span className="text-gray-500">
                            {exercise.sets && exercise.reps
                              ? `${exercise.sets}x${exercise.reps}`
                              : 'N/A'
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-3">No workouts scheduled</p>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onScheduleMore}
            >
              Schedule Workout
            </Button>
          </div>
        )}
      </Card>

      {/* Notes Section */}
      <Card className="p-4">
        <h4 className="font-medium text-white mb-4">Daily Notes</h4>
        
        {/* Existing Notes */}
        {dayNotes.length > 0 && (
          <div className="space-y-3 mb-4">
            {dayNotes.map((note) => (
              <div key={note.id} className="bg-gray-700 rounded-lg p-3">
                {editingNote === note.id ? (
                  <div className="space-y-3">
                    <TextArea
                      value={note.content}
                      onChange={(e) => updateNote(note.id, e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNote(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateNote(note.id, note.content)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <p className="text-gray-300 flex-1">{note.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit}
                      onClick={() => setEditingNote(note.id)}
                      className="p-2 text-gray-400 hover:text-white"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add New Note */}
        <div className="space-y-3">
          <TextArea
            placeholder="Add a note about your workout or how you're feeling..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNote}
            disabled={!newNote.trim()}
          >
            Add Note
          </Button>
        </div>
      </Card>
    </div>
  );
}