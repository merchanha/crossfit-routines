import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  CheckCircle, 
  Circle, 
  Clock,
  Target,
  FileText,
  Trophy
} from 'lucide-react';
import { Card, Button, useToast } from '../components';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { useRoutinesContext } from '../contexts/RoutinesContext';

interface ExerciseProgress {
  exerciseIndex: number;
  completedSets: number;
  totalSets: number;
  notes: string;
}

export function WorkoutSessionView() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { scheduledWorkouts, markWorkoutCompleted } = useScheduledWorkoutsContext();
  const { routines } = useRoutinesContext();
  const { showToast, ToastContainer } = useToast();

  // Session state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Find the workout and routine
  const workout = useMemo(() => {
    return scheduledWorkouts.find((w: any) => w.id === workoutId);
  }, [scheduledWorkouts, workoutId]);

  const routine = useMemo(() => {
    if (!workout) return null;
    return routines.find(r => r.id === workout.routineId);
  }, [workout, routines]);

  // Initialize exercise progress
  useEffect(() => {
    if (routine?.exercises) {
      const initialProgress = routine.exercises.map((exercise, index) => ({
        exerciseIndex: index,
        completedSets: 0,
        totalSets: exercise.sets || 1,
        notes: ''
      }));
      setExerciseProgress(initialProgress);
    }
  }, [routine]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentExercise = routine?.exercises[currentExerciseIndex];
  const currentProgress = exerciseProgress[currentExerciseIndex];

  const totalExercises = routine?.exercises.length || 0;
  const completedExercises = exerciseProgress.filter(p => p.completedSets >= p.totalSets).length;
  const overallProgress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const handleSetComplete = () => {
    if (!currentProgress) return;
    
    setExerciseProgress(prev => 
      prev.map(p => 
        p.exerciseIndex === currentExerciseIndex
          ? { ...p, completedSets: Math.min(p.completedSets + 1, p.totalSets) }
          : p
      )
    );

    // Auto-advance to next exercise if current one is completed
    if (currentProgress.completedSets + 1 >= currentProgress.totalSets) {
      if (currentExerciseIndex < totalExercises - 1) {
        setTimeout(() => {
          setCurrentExerciseIndex(prev => prev + 1);
          showToast('Exercise completed! Moving to next.', 'success', 2000);
        }, 1000);
      } else {
        showToast('All exercises completed! 🎉', 'success');
      }
    }
  };

  const handleSetUndo = () => {
    if (!currentProgress) return;
    
    setExerciseProgress(prev => 
      prev.map(p => 
        p.exerciseIndex === currentExerciseIndex
          ? { ...p, completedSets: Math.max(p.completedSets - 1, 0) }
          : p
      )
    );
  };


  const handleCompleteWorkout = async () => {
    if (!workout) return;

    setIsCompleting(true);
    try {
      const finalNotes = [
        ...exerciseProgress
          .filter(p => p.notes.trim())
          .map(p => `${routine?.exercises[p.exerciseIndex]?.name}: ${p.notes}`)
      ].filter(Boolean).join('\n\n');

      await markWorkoutCompleted(workout.id, finalNotes);
      showToast('Workout completed! Great job! 🎉', 'success');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      showToast('Failed to complete workout. Please try again.', 'error');
      setIsCompleting(false);
    }
  };

  const isWorkoutComplete = completedExercises === totalExercises;
  const canGoNext = currentExerciseIndex < totalExercises - 1;
  const canGoPrevious = currentExerciseIndex > 0;

  if (!workout || !routine) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Workout not found</h2>
          <Button variant="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowLeft}
                onClick={() => navigate('/')}
                className="p-2"
              />
              <div>
                <h1 className="text-2xl font-bold">{routine.name}</h1>
                <p className="text-gray-400">Exercise {currentExerciseIndex + 1} of {totalExercises}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Session Time</div>
                <div className="text-xl font-mono">{formatTime(timerSeconds)}</div>
              </div>
              <Button
                variant={isTimerRunning ? "secondary" : "primary"}
                size="sm"
                icon={isTimerRunning ? Pause : Play}
                onClick={() => setIsTimerRunning(!isTimerRunning)}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Overall Progress</span>
                <span className="text-sm text-gray-400">{completedExercises}/{totalExercises} exercises</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Current Exercise */}
          <Card>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{currentExerciseIndex + 1}</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">{currentExercise?.name}</h2>
                
                <div className="flex items-center justify-center gap-6 text-gray-400">
                  {currentExercise?.sets && (
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{currentExercise.sets} sets</span>
                    </div>
                  )}
                  {currentExercise?.reps && (
                    <div className="flex items-center gap-2">
                      <span>{currentExercise.reps} reps</span>
                    </div>
                  )}
                  {currentExercise?.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{currentExercise.duration}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Set Tracking */}
              {currentProgress && (
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {Array.from({ length: currentProgress.totalSets }, (_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                          i < currentProgress.completedSets
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-gray-600 text-gray-400'
                        }`}
                      >
                        {i < currentProgress.completedSets ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center mb-4">
                    <span className="text-lg">
                      Set {currentProgress.completedSets + 1} of {currentProgress.totalSets}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={handleSetUndo}
                      disabled={currentProgress.completedSets === 0}
                      className="text-gray-400"
                    >
                      Undo Set
                    </Button>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSetComplete}
                      disabled={currentProgress.completedSets >= currentProgress.totalSets}
                      className="px-8"
                    >
                      Complete Set
                    </Button>
                  </div>
                </div>
              )}

              {/* Exercise Notes */}
              {currentExercise?.notes && (
                <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Exercise Notes</span>
                  </div>
                  <p className="text-gray-300 text-sm italic">{currentExercise.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              icon={SkipBack}
              onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
              disabled={!canGoPrevious}
            >
              Previous Exercise
            </Button>

            {isWorkoutComplete ? (
              <Button
                variant="primary"
                size="lg"
                icon={Trophy}
                onClick={handleCompleteWorkout}
                disabled={isCompleting}
                className="px-8"
              >
                {isCompleting ? 'Completing...' : 'Finish Workout'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={SkipForward}
                onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
                disabled={!canGoNext}
              >
                Next Exercise
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
