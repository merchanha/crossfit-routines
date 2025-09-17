export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: Date;
  stats?: {
    totalWorkouts: number;
    currentStreak: number;
    favoriteExercise: string;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    profilePicture?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ScheduledWorkout {
  id: string;
  routineId: string;
  date: Date;
  notes?: string;
  completed: boolean;
  routine?: Routine;
}

export interface WorkoutNote {
  id: string;
  routineId?: string;
  date: Date;
  content: string;
  userId: string;
}
