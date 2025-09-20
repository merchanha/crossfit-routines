import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  Target,
  Trophy
} from 'lucide-react';
import { Card, Button, Input } from '../components';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { useRoutinesContext } from '../contexts/RoutinesContext';
import { format } from 'date-fns';

type SortField = 'date' | 'routineName' | 'finalDuration' | 'delta';
type SortDirection = 'asc' | 'desc';

export function WorkoutHistoryView() {
  const navigate = useNavigate();
  const { scheduledWorkouts } = useScheduledWorkoutsContext();
  const { routines } = useRoutinesContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Get completed workouts with fresh routine data
  const completedWorkouts = useMemo(() => {
    const completed = scheduledWorkouts
      .filter((workout: any) => workout.completed)
      .map((workout: any) => {
        const freshRoutine = routines.find(r => r.id === workout.routineId);
        const routine = freshRoutine || workout.routine;
        
        // Calculate delta (difference between estimated and actual duration)
        let delta = null;
        let deltaType: 'faster' | 'slower' | 'exact' | null = null;
        
        if (routine?.estimatedDuration && workout.finalDuration) {
          const estimatedSeconds = routine.estimatedDuration * 60; // Convert minutes to seconds
          delta = workout.finalDuration - estimatedSeconds;
          
          if (delta > 30) deltaType = 'slower';
          else if (delta < -30) deltaType = 'faster';
          else deltaType = 'exact';
        }

        return {
          ...workout,
          routine,
          delta,
          deltaType,
          estimatedDurationSeconds: routine?.estimatedDuration ? routine.estimatedDuration * 60 : null
        };
      });

    // Apply search filter
    const filtered = completed.filter(workout => 
      workout.routine?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.routine?.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'routineName':
          aValue = a.routine?.name || '';
          bValue = b.routine?.name || '';
          break;
        case 'finalDuration':
          aValue = a.finalDuration || 0;
          bValue = b.finalDuration || 0;
          break;
        case 'delta':
          aValue = a.delta || 0;
          bValue = b.delta || 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [scheduledWorkouts, routines, searchTerm, sortField, sortDirection]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDelta = (delta: number) => {
    const absDelta = Math.abs(delta);
    const mins = Math.floor(absDelta / 60);
    const secs = absDelta % 60;
    
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getDeltaIcon = (deltaType: string | null) => {
    switch (deltaType) {
      case 'faster': return <TrendingDown className="w-4 h-4 text-emerald-500" />;
      case 'slower': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'exact': return <Minus className="w-4 h-4 text-gray-400" />;
      default: return null;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalWorkouts = completedWorkouts.length;
    const avgDuration = totalWorkouts > 0 
      ? completedWorkouts.reduce((sum, w) => sum + (w.finalDuration || 0), 0) / totalWorkouts
      : 0;
    const fasterCount = completedWorkouts.filter(w => w.deltaType === 'faster').length;
    const slowerCount = completedWorkouts.filter(w => w.deltaType === 'slower').length;
    
    return {
      totalWorkouts,
      avgDuration,
      fasterCount,
      slowerCount,
      improvementRate: totalWorkouts > 0 ? (fasterCount / totalWorkouts) * 100 : 0
    };
  }, [completedWorkouts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Workout History</h1>
        <div className="flex items-center gap-2 text-gray-400">
          <Trophy className="w-5 h-5" />
          <span>{stats.totalWorkouts} completed workouts</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.totalWorkouts}</div>
            <div className="text-sm text-gray-400">Total Workouts</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{formatDuration(Math.round(stats.avgDuration))}</div>
            <div className="text-sm text-gray-400">Avg Duration</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.fasterCount}</div>
            <div className="text-sm text-gray-400">Faster than Est.</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{Math.round(stats.improvementRate)}%</div>
            <div className="text-sm text-gray-400">Improvement Rate</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <div className="flex gap-1">
              {[
                { field: 'date' as SortField, label: 'Date' },
                { field: 'routineName' as SortField, label: 'Routine' },
                { field: 'finalDuration' as SortField, label: 'Duration' },
                { field: 'delta' as SortField, label: 'Performance' }
              ].map(({ field, label }) => (
                <Button
                  key={field}
                  variant={sortField === field ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => handleSort(field)}
                  className="flex items-center gap-1"
                >
                  {label}
                  {getSortIcon(field)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Workout History List */}
      {completedWorkouts.length > 0 ? (
        <div className="space-y-4">
          {completedWorkouts.map((workout: any) => (
            <Card key={workout.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {workout.routine?.name || 'Unknown Routine'}
                    </h3>
                    {workout.deltaType && (
                      <div className="flex items-center gap-1">
                        {getDeltaIcon(workout.deltaType)}
                        <span className={`text-sm font-medium ${
                          workout.deltaType === 'faster' ? 'text-emerald-500' : 
                          workout.deltaType === 'slower' ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                          {workout.deltaType === 'exact' ? 'On target' : 
                           workout.deltaType === 'faster' ? `${formatDelta(Math.abs(workout.delta))} faster` :
                           `${formatDelta(Math.abs(workout.delta))} slower`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-4">{workout.routine?.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Date</div>
                      <div className="text-white font-medium">
                        {format(new Date(workout.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Estimated</div>
                      <div className="text-white font-medium">
                        {workout.routine?.estimatedDuration ? `${workout.routine.estimatedDuration} min` : 'Not set'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Actual Duration</div>
                      <div className="text-white font-medium">
                        {workout.finalDuration ? formatDuration(workout.finalDuration) : 'Not recorded'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Performance</div>
                      <div className={`font-medium flex items-center gap-1 ${
                        workout.deltaType === 'faster' ? 'text-emerald-500' : 
                        workout.deltaType === 'slower' ? 'text-orange-500' : 'text-gray-400'
                      }`}>
                        {workout.delta !== null ? (
                          <>
                            {getDeltaIcon(workout.deltaType)}
                            {workout.deltaType === 'exact' ? 'Perfect' : formatDelta(Math.abs(workout.delta))}
                          </>
                        ) : (
                          'No comparison'
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400">Exercises</div>
                      <div className="text-white font-medium">
                        {workout.routine?.exercises.length || 0}
                      </div>
                    </div>
                  </div>
                  
                  {workout.notes && (
                    <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Workout Notes:</div>
                      <p className="text-gray-300 text-sm">{workout.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={() => navigate(`/routines/${workout.routineId}`)}
                  >
                    View Routine
                  </Button>
                  
                  <div className="text-xs text-gray-400 text-center">
                    {format(new Date(workout.createdAt || workout.date), 'HH:mm')}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No completed workouts yet
          </h3>
          <p className="text-gray-500 mb-4">
            Complete your first workout to start tracking your progress!
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/calendar')}
          >
            Schedule a Workout
          </Button>
        </Card>
      )}

      {/* Performance Insights */}
      {completedWorkouts.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-500 mb-2">{stats.fasterCount}</div>
              <div className="text-gray-400">Workouts completed faster than estimated</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500 mb-2">{stats.slowerCount}</div>
              <div className="text-gray-400">Workouts that took longer than estimated</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">{Math.round(stats.improvementRate)}%</div>
              <div className="text-gray-400">Improvement rate (faster completions)</div>
            </div>
          </div>
          
          {stats.improvementRate > 60 && (
            <div className="mt-4 p-4 bg-emerald-500 bg-opacity-10 border border-emerald-500 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-500">
                <Trophy className="w-5 h-5" />
                <span className="font-medium">Excellent Performance!</span>
              </div>
              <p className="text-emerald-400 text-sm mt-1">
                You're consistently beating your estimated times. Consider increasing the difficulty or duration of your routines!
              </p>
            </div>
          )}
          
          {stats.improvementRate < 30 && stats.totalWorkouts >= 3 && (
            <div className="mt-4 p-4 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
              <div className="flex items-center gap-2 text-blue-500">
                <Target className="w-5 h-5" />
                <span className="font-medium">Focus on Consistency</span>
              </div>
              <p className="text-blue-400 text-sm mt-1">
                Your workouts are taking longer than estimated. Consider adjusting your routine estimates or building up your endurance gradually.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
