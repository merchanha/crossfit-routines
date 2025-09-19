import { useState, useCallback, useEffect } from "react";
import {
  Routine,
  Exercise,
  ScheduledWorkout,
  WorkoutNote,
  User,
} from "../types";
import { api } from "../api";

// User hook
export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await api.user.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      setError(null);
      const updatedUser = await api.user.updateProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
      throw err;
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    isLoading,
    error,
    updateUser,
    refetch: loadUser,
  };
}

// Routines hook
export function useRoutines() {
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
    async (
      routineData: Omit<Routine, "id" | "createdAt" | "updatedAt" | "userId">
    ) => {
      try {
        setError(null);
        const newRoutine = await api.routines.create(routineData);
        setRoutines((prev) => [...prev, newRoutine]);
        return newRoutine;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create routine"
        );
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
        setError(
          err instanceof Error ? err.message : "Failed to update routine"
        );
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

  return {
    routines,
    isLoading,
    error,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    getRoutineById,
    refetch: loadRoutines,
  };
}

// Scheduled Workouts hook
export function useScheduledWorkouts() {
  const [scheduledWorkouts, setScheduledWorkouts] = useState<
    ScheduledWorkout[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScheduledWorkouts = useCallback(async () => {
    // Only load scheduled workouts if user is authenticated
    if (!api.auth.isAuthenticated()) {
      setScheduledWorkouts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const workoutsData = await api.scheduledWorkouts.getAll();

      // Normalize date formats to ensure consistency
      const normalizedWorkouts = workoutsData.map((workout: any) => ({
        ...workout,
        date: workout.date.includes("T")
          ? workout.date.split("T")[0]
          : workout.date,
      }));

      console.log(
        "loadScheduledWorkouts - Loaded workouts:",
        normalizedWorkouts.length
      );
      console.log(
        "loadScheduledWorkouts - Sample workout:",
        normalizedWorkouts[0]
      );
      setScheduledWorkouts(normalizedWorkouts);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load scheduled workouts"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scheduleWorkout = useCallback(
    async (routineId: string, date: Date, notes?: string) => {
      try {
        setError(null);
        const newScheduledWorkout: any = await api.scheduledWorkouts.schedule(
          routineId,
          date,
          notes
        );

        console.log("API Response - newScheduledWorkout:", newScheduledWorkout);
        console.log("Routine data:", newScheduledWorkout.routine);

        // Normalize the date format to ensure consistency
        const normalizedWorkout = {
          ...newScheduledWorkout,
          date: newScheduledWorkout.date.includes("T")
            ? newScheduledWorkout.date.split("T")[0]
            : newScheduledWorkout.date,
        };

        console.log("Normalized workout:", normalizedWorkout);

        setScheduledWorkouts((prev) => {
          const newState = [...prev, normalizedWorkout];
          return newState;
        });
        return normalizedWorkout;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to schedule workout"
        );
        throw err;
      }
    },
    []
  );

  const updateScheduledWorkout = useCallback(
    async (id: string, updates: Partial<ScheduledWorkout>) => {
      try {
        setError(null);
        const updatedWorkout = await api.scheduledWorkouts.update(id, updates);
        setScheduledWorkouts((prev) =>
          prev.map((workout) => (workout.id === id ? updatedWorkout : workout))
        );
        return updatedWorkout;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update scheduled workout"
        );
        throw err;
      }
    },
    []
  );

  const markWorkoutCompleted = useCallback(
    async (id: string, notes?: string) => {
      try {
        setError(null);
        const completedWorkout = await api.scheduledWorkouts.markCompleted(
          id,
          notes
        );
        setScheduledWorkouts((prev) =>
          prev.map((workout) =>
            workout.id === id ? completedWorkout : workout
          )
        );
        return completedWorkout;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to mark workout as completed"
        );
        throw err;
      }
    },
    []
  );

  const deleteScheduledWorkout = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.scheduledWorkouts.delete(id);
      setScheduledWorkouts((prev) =>
        prev.filter((workout) => workout.id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete scheduled workout"
      );
      throw err;
    }
  }, []);

  const getWorkoutsForDate = useCallback(
    (date: Date) => {
      // Use local date formatting to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const filteredWorkouts = scheduledWorkouts.filter((workout: any) => {
        // Handle both date formats from backend
        let workoutDate = workout.date;

        // If the date is in ISO format (e.g., "2025-09-28T00:00:00.000Z"), extract just the date part
        if (workoutDate.includes("T")) {
          workoutDate = workoutDate.split("T")[0];
        }

        return workoutDate === dateStr;
      });

      return filteredWorkouts;
    },
    [scheduledWorkouts]
  );

  const getWorkoutsForWeek = useCallback(
    (startDate: Date) => {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      // Use local date formatting to avoid timezone issues
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const startStr = formatDate(startDate);
      const endStr = formatDate(endDate);

      return scheduledWorkouts.filter((workout: any) => {
        // Handle both date formats from backend
        let workoutDate = workout.date;

        // If the date is in ISO format (e.g., "2025-09-28T00:00:00.000Z"), extract just the date part
        if (workoutDate.includes("T")) {
          workoutDate = workoutDate.split("T")[0];
        }

        return workoutDate >= startStr && workoutDate <= endStr;
      });
    },
    [scheduledWorkouts]
  );

  useEffect(() => {
    loadScheduledWorkouts();
  }, [loadScheduledWorkouts]);

  return {
    scheduledWorkouts,
    isLoading,
    error,
    scheduleWorkout,
    updateScheduledWorkout,
    markWorkoutCompleted,
    deleteScheduledWorkout,
    getWorkoutsForDate,
    getWorkoutsForWeek,
    refetch: loadScheduledWorkouts,
  };
}

// Notes hook
export function useNotes() {
  const [notes, setNotes] = useState<WorkoutNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    // Only load notes if user is authenticated
    if (!api.auth.isAuthenticated()) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const notesData = await api.notes.getAll();
      setNotes(notesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addNote = useCallback(
    async (content: string, date: Date, routineId?: string) => {
      try {
        setError(null);
        const newNote = await api.notes.create(content, date, routineId);
        setNotes((prev) => [...prev, newNote]);
        return newNote;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add note");
        throw err;
      }
    },
    []
  );

  const updateNote = useCallback(async (id: string, content: string) => {
    try {
      setError(null);
      const updatedNote = await api.notes.update(id, content);
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? updatedNote : note))
      );
      return updatedNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    try {
      setError(null);
      await api.notes.delete(id);
      setNotes((prev) => prev.filter((note) => note.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
      throw err;
    }
  }, []);

  const getNotesForDate = useCallback(
    (date: Date) => {
      const dateStr = date.toDateString();
      return notes.filter(
        (note) => new Date(note.date).toDateString() === dateStr
      );
    },
    [notes]
  );

  const getNotesForRoutine = useCallback(
    (routineId: string) => {
      return notes.filter((note) => note.routineId === routineId);
    },
    [notes]
  );

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    getNotesForDate,
    getNotesForRoutine,
    refetch: loadNotes,
  };
}
