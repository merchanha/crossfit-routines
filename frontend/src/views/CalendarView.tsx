import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { Card, Button, ScheduleWorkoutModal, WorkoutDetailsPanel } from '../components';
import { useScheduledWorkoutsContext } from '../contexts/ScheduledWorkoutsContext';
import { useRoutinesContext } from '../contexts/RoutinesContext';

export function CalendarView() {
  const { getWorkoutsForDate, scheduledWorkouts } = useScheduledWorkoutsContext();
  const { routines } = useRoutinesContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Force re-render when scheduledWorkouts changes
  const [forceRender, setForceRender] = useState(0);
  useEffect(() => {
    setForceRender(prev => prev + 1);
  }, [scheduledWorkouts.length]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Merge fresh routine data with selected date workouts to avoid stale data
  const rawSelectedDateWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : [];
  const selectedDateWorkouts = rawSelectedDateWorkouts.map((workout: any) => {
    const freshRoutine = routines.find(r => r.id === workout.routineId);
    return {
      ...workout,
      routine: freshRoutine || workout.routine // Use fresh routine data if available
    };
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleScheduleClick = (date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
    setShowScheduleModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Workout Calendar</h1>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => handleScheduleClick()}
        >
          Schedule Workout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={() => navigateMonth('prev')}
                  className="p-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ChevronRight}
                  onClick={() => navigateMonth('next')}
                  className="p-2"
                />
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2" key={`calendar-${scheduledWorkouts.length}-${scheduledWorkouts.map(w => w.id).join('-')}`}>
              {calendarDays.map(day => {
                const rawDayWorkouts = getWorkoutsForDate(day);
                const dayWorkouts = rawDayWorkouts.map((workout: any) => {
                  const freshRoutine = routines.find(r => r.id === workout.routineId);
                  return {
                    ...workout,
                    routine: freshRoutine || workout.routine
                  };
                });
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                
                

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      aspect-square p-2 rounded-lg cursor-pointer transition-all duration-200
                      border-2 hover:border-emerald-500
                      ${isSelected 
                        ? 'border-emerald-500 bg-emerald-500 bg-opacity-10' 
                        : 'border-transparent hover:bg-gray-700'
                      }
                      ${!isSameMonth(day, currentDate) ? 'opacity-40' : ''}
                    `}
                  >
                    <div className="h-full flex flex-col">
                      <div className={`
                        text-sm font-medium mb-1
                        ${isToday ? 'text-emerald-400' : 'text-white'}
                      `}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayWorkouts.slice(0, 2).map((workout) => (
                          <div
                            key={workout.id}
                            className={`
                              text-xs p-1 rounded truncate
                              ${workout.completed 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-gray-600 text-gray-200'
                              }
                            `}
                            title={workout.routine?.name}
                          >
                            {workout.routine?.name}
                          </div>
                        ))}
                        
                        {dayWorkouts.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{dayWorkouts.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Workout Details Panel */}
        <div className="space-y-4">
          {selectedDate ? (
            <WorkoutDetailsPanel
              date={selectedDate}
              workouts={selectedDateWorkouts}
              onScheduleMore={() => handleScheduleClick(selectedDate)}
            />
          ) : (
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                Select a Date
              </h3>
              <p className="text-gray-500 mb-4">
                Click on a calendar day to view or schedule workouts
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      <ScheduleWorkoutModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
}