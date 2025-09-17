import { createContext, useContext, ReactNode } from 'react';
import { useRoutines } from '../hooks/useApi';
import { Routine } from '../types';

interface RoutinesContextType {
  routines: Routine[];
  isLoading: boolean;
  error: string | null;
  createRoutine: (
    routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => Promise<Routine>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<Routine>;
  deleteRoutine: (id: string) => Promise<void>;
  getRoutineById: (id: string) => Routine | undefined;
  refetch: () => Promise<void>;
}

const RoutinesContext = createContext<RoutinesContextType | undefined>(undefined);

interface RoutinesProviderProps {
  children: ReactNode;
}

export function RoutinesProvider({ children }: RoutinesProviderProps) {
  const routinesData = useRoutines();

  return (
    <RoutinesContext.Provider value={routinesData}>
      {children}
    </RoutinesContext.Provider>
  );
}

export function useRoutinesContext() {
  const context = useContext(RoutinesContext);
  if (context === undefined) {
    throw new Error('useRoutinesContext must be used within a RoutinesProvider');
  }
  return context;
}
