import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Edit3, Calendar, Clock, Target, FileText, CheckCircle } from 'lucide-react';
import { Card, Button, useToast } from '../components';
import { useRoutinesContext } from '../contexts/RoutinesContext';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { Routine } from '../types';

export function RoutineDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { routines } = useRoutinesContext();
  const { scheduleWorkout, scheduledWorkouts } = useScheduledWorkoutsContext();
  const { showToast, ToastContainer } = useToast();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (id) {
      const foundRoutine = routines.find(r => r.id === id);
      setRoutine(foundRoutine || null);
    }
  }, [id, routines]);

  // Check if the routine is already scheduled for today
  const isScheduledForToday = useMemo(() => {
    if (!routine) return false;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;
    
    return scheduledWorkouts.some(
      (workout: any) => workout.routineId === routine.id && workout.date === todayStr
    );
  }, [routine, scheduledWorkouts]);

  const getYouTubeEmbedUrl = (videoUrl?: string) => {
    if (!videoUrl) return null;
    
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    return null;
  };

  const getVideoThumbnail = (videoUrl?: string) => {
    if (!videoUrl) return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800';
    
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = videoUrl.match(youtubeRegex);
    
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
    }
    
    return 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800';
  };

  const handleScheduleForToday = async () => {
    if (!routine || isScheduledForToday) return;
    
    setIsScheduling(true);
    try {
      await scheduleWorkout(routine.id, new Date());
      setShowScheduleOptions(false);
      showToast('Workout scheduled for today!', 'success');
    } catch (error: any) {
      console.error('Error scheduling workout:', error);
      
      // Handle specific error messages
      if (error.message?.includes('already scheduled')) {
        showToast('This workout is already scheduled for today', 'warning');
      } else {
        showToast('Failed to schedule workout. Please try again.', 'error');
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleScheduleForDate = () => {
    // Navigate to calendar with this routine pre-selected
    navigate('/calendar', { state: { selectedRoutine: routine } });
  };

  if (!routine) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Routine not found</h2>
          <Button variant="primary" onClick={() => navigate('/routines')}>
            Back to Routines
          </Button>
        </div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(routine.videoUrl);
  const thumbnailUrl = getVideoThumbnail(routine.videoUrl);

  return (
    <>
      <ToastContainer />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/routines')}
          className="p-2"
        />
        <h1 className="text-3xl font-bold text-white">{routine.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Section */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-gray-800">
              {isVideoPlaying && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={routine.name}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={thumbnailUrl}
                    alt={routine.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={Play}
                      onClick={() => setIsVideoPlaying(true)}
                      disabled={!embedUrl}
                      className="text-lg px-8 py-4"
                    >
                      {embedUrl ? 'Play Video' : 'No Video Available'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Description */}
          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description
              </h2>
              <p className="text-gray-300 leading-relaxed">
                {routine.description}
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {isScheduledForToday ? (
                  <Button
                    variant="secondary"
                    icon={CheckCircle}
                    disabled
                    className="w-full bg-emerald-600 text-white cursor-not-allowed"
                  >
                    Already Scheduled for Today
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    icon={Calendar}
                    onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                    className="w-full"
                  >
                    Schedule Workout
                  </Button>
                )}
                
                {showScheduleOptions && !isScheduledForToday && (
                  <div className="space-y-2 pl-4 border-l-2 border-emerald-500">
                    <Button
                      variant="ghost"
                      onClick={handleScheduleForToday}
                      disabled={isScheduling}
                      className="w-full justify-start text-sm"
                    >
                      {isScheduling ? 'Scheduling...' : 'Schedule for Today'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleScheduleForDate}
                      className="w-full justify-start text-sm"
                    >
                      Choose Date
                    </Button>
                  </div>
                )}
                
              </div>
            </div>
          </Card>

          {/* Routine Stats */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Routine Info</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Target className="w-4 h-4" />
                    <span>Exercises</span>
                  </div>
                  <span className="text-white font-medium">{routine.exercises.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Est. Duration</span>
                  </div>
                  <span className="text-white font-medium">
                    {Math.ceil(routine.exercises.length * 2.5)} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Created</span>
                  </div>
                  <span className="text-white font-medium">
                    {new Date(routine.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Exercises List */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Exercises ({routine.exercises.length})
          </h2>
          
          <div className="space-y-4">
            {routine.exercises.map((exercise, index) => (
              <div
                key={exercise.id || index}
                className="bg-gray-700 rounded-lg p-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {exercise.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-400 mb-2">
                    {exercise.sets && (
                      <span className="flex items-center gap-1">
                        <strong className="text-white">{exercise.sets}</strong> sets
                      </span>
                    )}
                    {exercise.reps && (
                      <span className="flex items-center gap-1">
                        <strong className="text-white">{exercise.reps}</strong> reps
                      </span>
                    )}
                    {exercise.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <strong className="text-white">{exercise.duration}</strong>
                      </span>
                    )}
                  </div>
                  
                  {exercise.notes && (
                    <p className="text-sm text-gray-300 italic">
                      {exercise.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      </div>
    </>
  );
}
