import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Target,
  FileText,
  Trophy,
  Timer
} from 'lucide-react';
import { Card, Button, useToast, TextArea } from '../components';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { useRoutinesContext } from '../contexts/RoutinesContext';

export function WorkoutSessionView() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { scheduledWorkouts, markWorkoutCompleted } = useScheduledWorkoutsContext();
  const { routines } = useRoutinesContext();
  const { showToast, ToastContainer } = useToast();

  // Session state
  const [sessionNotes, setSessionNotes] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);

  // Find the workout and routine
  const workout = useMemo(() => {
    return scheduledWorkouts.find((w: any) => w.id === workoutId);
  }, [scheduledWorkouts, workoutId]);

  const routine = useMemo(() => {
    if (!workout) return null;
    // Use fresh routine data from context to avoid stale data
    const freshRoutine = routines.find(r => r.id === workout.routineId);
    return freshRoutine || workout.routine;
  }, [workout, routines]);

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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    setIsTimerRunning(true);
    showToast('Workout started! Good luck! 💪', 'success', 2000);
  };

  const handlePauseResume = () => {
    setIsTimerRunning(!isTimerRunning);
    showToast(isTimerRunning ? 'Timer paused' : 'Timer resumed', 'info', 1500);
  };

  const handleResetTimer = () => {
    setTimerSeconds(0);
    setIsTimerRunning(false);
    showToast('Timer reset to 00:00', 'info', 1500);
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;

    setIsCompleting(true);
    try {
      // Stop the timer
      setIsTimerRunning(false);
      
      // Prepare final notes with workout duration
      const durationNote = `Workout Duration: ${formatTime(timerSeconds)}`;
      const finalNotes = [durationNote, sessionNotes].filter(Boolean).join('\n\n');

      // Update the workout with completion status and final duration
      await markWorkoutCompleted(workout.id, finalNotes, timerSeconds);
      
      showToast(`Workout completed in ${formatTime(timerSeconds)}! Great job! 🎉`, 'success');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      showToast('Failed to complete workout. Please try again.', 'error');
      setIsCompleting(false);
    }
  };

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
                <p className="text-gray-400">{routine.exercises.length} exercises</p>
              </div>
            </div>
          </div>

          {/* Timer Card */}
          <Card>
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-500">
                  <div className="text-center">
                    <Timer className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="text-2xl font-mono font-bold text-white">
                      {formatTime(timerSeconds)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  {!workoutStarted ? (
                    <Button
                      variant="primary"
                      size="lg"
                      icon={Play}
                      onClick={handleStartWorkout}
                      className="px-8"
                    >
                      Start Workout
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={isTimerRunning ? "secondary" : "primary"}
                        size="lg"
                        icon={isTimerRunning ? Pause : Play}
                        onClick={handlePauseResume}
                        className="px-6"
                      >
                        {isTimerRunning ? 'Pause' : 'Resume'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="lg"
                        icon={RotateCcw}
                        onClick={handleResetTimer}
                        className="px-6"
                      >
                        Reset
                      </Button>
                      
                      <Button
                        variant="primary"
                        size="lg"
                        icon={Trophy}
                        onClick={handleCompleteWorkout}
                        disabled={isCompleting}
                        className="px-8 bg-emerald-600 hover:bg-emerald-700"
                      >
                        {isCompleting ? 'Completing...' : 'Complete Workout'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Routine Description */}
          {routine.description && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Workout Description
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  {routine.description}
                </p>
              </div>
            </Card>
          )}

          {/* Exercises List */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Exercises ({routine.exercises.length})
              </h2>
              
              <div className="space-y-4">
                {routine.exercises.map((exercise: any, index: any) => (
                  <div
                    key={exercise.id || index}
                    className="bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {exercise.name}
                        </h3>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-400 mb-2">
                          {exercise.sets && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              <strong className="text-white">{exercise.sets}</strong> sets
                            </span>
                          )}
                          {exercise.reps && (
                            <span className="flex items-center gap-1">
                              <strong className="text-white">{exercise.reps}</strong> reps
                            </span>
                          )}
                        </div>
                        
                        {exercise.notes && (
                          <p className="text-sm text-gray-300 italic bg-gray-600 p-2 rounded">
                            💡 {exercise.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Workout Notes */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Workout Notes
              </h2>
              <TextArea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="How did this workout feel? Any observations, improvements, or thoughts..."
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-gray-400 mt-2">
                These notes will be saved with your completed workout
              </p>
            </div>
          </Card>

          {/* Workout Stats */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Workout Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-500">{routine.exercises.length}</div>
                  <div className="text-sm text-gray-400">Exercises</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatTime(timerSeconds)}</div>
                  <div className="text-sm text-gray-400">Current Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">
                    {routine.estimatedDuration || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-400">Est. Duration (min)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {routine.exercises.reduce((total: any, ex: { reps: any; }) => total + (ex.reps || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Reps</div>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </>
  );
}