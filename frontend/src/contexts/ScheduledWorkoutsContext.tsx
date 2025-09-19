import { createContext, useContext, ReactNode } from 'react';
import { useScheduledWorkouts } from '../hooks/useApi';
import { ScheduledWorkout } from '../types';

interface ScheduledWorkoutsContextType {
  scheduledWorkouts: ScheduledWorkout[];
  isLoading: boolean;
  error: string | null;
  scheduleWorkout: (routineId: string, date: Date, notes?: string) => Promise<ScheduledWorkout>;
  updateScheduledWorkout: (id: string, updates: Partial<ScheduledWorkout>) => Promise<ScheduledWorkout>;
  markWorkoutCompleted: (id: string, completed: boolean) => Promise<ScheduledWorkout>;
  deleteScheduledWorkout: (id: string) => Promise<void>;
  getWorkoutsForDate: (date: Date) => ScheduledWorkout[];
  getWorkoutsForWeek: (startDate: Date) => ScheduledWorkout[];
  refetch: () => Promise<void>;
}

const ScheduledWorkoutsContext = createContext<ScheduledWorkoutsContextType | any>(undefined);

interface ScheduledWorkoutsProviderProps {
  children: ReactNode;
}

export function ScheduledWorkoutsProvider({ children }: ScheduledWorkoutsProviderProps) {
  const scheduledWorkoutsData = useScheduledWorkouts();

  return (
    <ScheduledWorkoutsContext.Provider value={scheduledWorkoutsData}>
      {children}
    </ScheduledWorkoutsContext.Provider>
  );
}

export function useScheduledWorkoutsContext() {
  const context = useContext(ScheduledWorkoutsContext);
  if (context === undefined) {
    throw new Error('useScheduledWorkoutsContext must be used within a ScheduledWorkoutsProvider');
  }
  return context;
}
