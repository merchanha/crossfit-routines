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
  notes?: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  estimatedDuration?: number; // Estimated duration in minutes
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
  finalDuration?: number; // Final duration in seconds when completed
  routine?: Routine;
}

export interface WorkoutNote {
  id: string;
  routineId?: string;
  date: Date;
  content: string;
  userId: string;
}

// Recommendations types
export interface PerformanceAnalysis {
  averageDelta: number;
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  strengths: string[];
  weaknesses: string[];
  trends: {
    improving?: boolean;
    declining?: boolean;
    stable?: boolean;
  };
  workoutHistory: Array<{
    routineName: string;
    estimatedDuration: number;
    averageFinalDuration: number;
    delta: number;
    completionCount: number;
  }>;
}

export interface RecommendationItem {
  id: string;
  itemType: "existing" | "ai_generated";
  routineId?: string;
  reasoning?: string;
  priority: number;
  routine?: Routine;
  routineData?: {
    name: string;
    description: string;
    estimatedDuration?: number;
    exercises: Exercise[];
    videoUrl?: string;
  };
}

export interface Recommendation {
  id: string;
  performanceAnalysis: PerformanceAnalysis;
  items: RecommendationItem[];
  status: string;
  expiresAt?: Date;
  createdAt: Date;
}
