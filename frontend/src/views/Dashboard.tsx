import React from 'react';
import { BookOpen, Calendar, Clock, Flame, TrendingUp } from 'lucide-react';
import { Card, Button } from '../components';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { useRoutines } from '../hooks/useApi';

export function Dashboard() {
  const { getWorkoutsForWeek } = useScheduledWorkoutsContext();
  const { routines } = useRoutines();

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const weekWorkouts = getWorkoutsForWeek(startOfWeek);
  const todayWorkouts = weekWorkouts.filter(workout => {
    // Use local date formatting to avoid timezone issues (same as Calendar)
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const todayDate = `${year}-${month}-${day}`;
    
    // workout.date is already normalized to YYYY-MM-DD format
    return workout.date === todayDate;
  });

  const stats = {
    totalRoutines: routines.length,
    weeklyWorkouts: weekWorkouts.length,
    completedThisWeek: weekWorkouts.filter(w => w.completed).length,
    streak: 7 // This would be calculated based on actual completion data
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Routines</p>
              <p className="text-2xl font-bold text-white">{stats.totalRoutines}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-500 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">This Week</p>
              <p className="text-2xl font-bold text-white">{stats.weeklyWorkouts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{stats.completedThisWeek}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Streak</p>
              <p className="text-2xl font-bold text-white">{stats.streak}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Workout of the Day */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Workout of the Day</h2>
          <div className="flex items-center space-x-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{today.toLocaleDateString()}</span>
          </div>
        </div>

        {todayWorkouts.length > 0 ? (
          <div className="space-y-4">
            {todayWorkouts.map((workout) => (
              <div key={workout.id} className="bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {workout.routine?.name}
                </h3>
                <p className="text-gray-300 mb-4">
                  {workout.routine?.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-400">
                      {workout.routine?.exercises.length} exercises
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      workout.completed 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {workout.completed ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>
                  <Button variant="primary" size="sm">
                    {workout.completed ? 'View Details' : 'Start Workout'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No workouts scheduled for today
            </h3>
            <p className="text-gray-500 mb-4">
              Schedule a routine to get started with your fitness journey
            </p>
            <Button variant="primary">Browse Routines</Button>
          </div>
        )}
      </Card>

      {/* Weekly Schedule */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-white mb-6">This Week's Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dayWorkouts = weekWorkouts.filter(workout => {
              // Use local date formatting to avoid timezone issues (same as Calendar)
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              const targetDate = `${year}-${month}-${day}`;
              
              // workout.date is already normalized to YYYY-MM-DD format
              return workout.date === targetDate;
            });

            return (
              <div key={i} className="bg-gray-700 rounded-lg p-4">
                <div className="text-center mb-3">
                  <p className="text-xs font-medium text-gray-400 uppercase">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold text-white">
                    {date.getDate()}
                  </p>
                </div>
                
                {dayWorkouts.length > 0 ? (
                  <div className="space-y-2">
                    {dayWorkouts.map((workout) => (
                      <div 
                        key={workout.id}
                        className={`p-2 rounded text-xs text-center ${
                          workout.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        {workout.routine?.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-xs">
                    Rest day
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}