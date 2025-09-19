import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { api } from '../api';
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
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    // Only load routines if user is authenticated
    if (!api.auth.isAuthenticated()) {
      setRoutines([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const routinesData = await api.routines.getAll();
      setRoutines(routinesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load routines");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoutine = useCallback(
    async (routineData: Omit<Routine, "id" | "createdAt" | "updatedAt" | "userId">) => {
      try {
        setError(null);
        const newRoutine = await api.routines.create(routineData);
        setRoutines((prev) => [...prev, newRoutine]);
        return newRoutine;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create routine");
        throw err;
      }
    },
    []
  );

  const updateRoutine = useCallback(
    async (id: string, updates: Partial<Routine>) => {
      try {
        setError(null);
        const updatedRoutine = await api.routines.update(id, updates);
        setRoutines((prev) =>
          prev.map((routine) => (routine.id === id ? updatedRoutine : routine))
        );
        return updatedRoutine;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update routine");
        throw err;
      }
    },
    []
  );

  const deleteRoutine = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.routines.delete(id);
      setRoutines((prev) => prev.filter((routine) => routine.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete routine");
      throw err;
    }
  }, []);

  const getRoutineById = useCallback(
    (id: string) => {
      return routines.find((routine) => routine.id === id);
    },
    [routines]
  );

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const contextValue = {
    routines,
    isLoading,
    error,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getRoutineById,
    refetch: loadRoutines,
  };

  return (
    <RoutinesContext.Provider value={contextValue}>
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
