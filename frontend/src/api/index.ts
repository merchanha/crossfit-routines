import {
  Routine,
  ScheduledWorkout,
  WorkoutNote,
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../types";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Token management
const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};

const setToken = (token: string): void => {
  localStorage.setItem("authToken", token);
};

const removeToken = (): void => {
  localStorage.removeItem("authToken");
};

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  console.log(
    `API Request: ${options.method || "GET"} ${url}`,
    options.body ? JSON.parse(options.body as string) : ""
  );

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, remove it
        removeToken();
        window.location.href = "/login";
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`API Response: ${options.method || "GET"} ${url}`, data);
    return data;
  } catch (error) {
    console.error(`API Error: ${options.method || "GET"} ${url}`, error);
    throw error;
  }
}

// Authentication API
export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    console.log("Logging in user", {
      email: credentials.email,
      password: credentials.password,
    });
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Store token after successful login
    setToken(response.accessToken);
    return response;
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    console.log("Registering new user", { email: userData.email });
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    // Store token after successful registration
    setToken(response.accessToken);
    return response;
  },

  // Logout user
  logout: (): void => {
    console.log("Logging out user");
    removeToken();
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return getToken() !== null;
  },

  // Get current token
  getToken: (): string | null => {
    return getToken();
  },
};

// User API
export const userApi = {
  // Get current user profile
  getCurrentUser: (): Promise<User> => {
    console.log("Getting current user");
    return apiRequest<User>("/users/profile");
  },

  // Update user profile
  updateProfile: (updates: Partial<User>): Promise<User> => {
    console.log("Updating user profile", updates);
    return apiRequest<User>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Get user stats
  getUserStats: (): Promise<User["stats"]> => {
    console.log("Getting user stats");
    return apiRequest<User["stats"]>("/user/stats");
  },
};

// Routines API
export const routinesApi = {
  // Get all routines for current user
  getAll: (): Promise<Routine[]> => {
    console.log("Getting all routines");
    return apiRequest<Routine[]>("/routines");
  },

  // Get routine by ID
  getById: (id: string): Promise<Routine> => {
    console.log("Getting routine by ID", { id });
    return apiRequest<Routine>(`/routines/${id}`);
  },

  // Create new routine
  create: (
    routineData: Omit<Routine, "id" | "createdAt" | "updatedAt" | "userId">
  ): Promise<Routine> => {
    console.log("Creating new routine", routineData);
    return apiRequest<Routine>("/routines", {
      method: "POST",
      body: JSON.stringify(routineData),
    });
  },

  // Update routine
  update: (id: string, updates: Partial<Routine>): Promise<Routine> => {
    console.log("Updating routine", { id, updates });
    return apiRequest<Routine>(`/routines/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Delete routine
  delete: (id: string): Promise<void> => {
    console.log("Deleting routine", { id });
    return apiRequest<void>(`/routines/${id}`, {
      method: "DELETE",
    });
  },
};

// Scheduled Workouts API
export const scheduledWorkoutsApi = {
  // Get all scheduled workouts for current user
  getAll: (): Promise<ScheduledWorkout[]> => {
    console.log("Getting all scheduled workouts");
    return apiRequest<ScheduledWorkout[]>("/scheduled-workouts");
  },

  // Get scheduled workouts for a specific date
  getByDate: (date: Date): Promise<ScheduledWorkout[]> => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    console.log("Getting scheduled workouts for date", { date: dateStr });
    return apiRequest<ScheduledWorkout[]>(
      `/scheduled-workouts?date=${dateStr}`
    );
  },

  // Get scheduled workouts for a date range
  getByDateRange: (
    startDate: Date,
    endDate: Date
  ): Promise<ScheduledWorkout[]> => {
    // Use local date formatting to avoid timezone issues
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    console.log("Getting scheduled workouts for date range", {
      startDate: startStr,
      endDate: endStr,
    });
    return apiRequest<ScheduledWorkout[]>(
      `/scheduled-workouts?startDate=${startStr}&endDate=${endStr}`
    );
  },

  // Schedule a new workout
  schedule: (
    routineId: string,
    date: Date,
    notes?: string
  ): Promise<ScheduledWorkout> => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    console.log("Scheduling new workout", { routineId, date: dateStr, notes });
    return apiRequest<ScheduledWorkout>("/scheduled-workouts", {
      method: "POST",
      body: JSON.stringify({
        routineId,
        date: dateStr,
        notes,
      }),
    });
  },

  // Update scheduled workout
  update: (
    id: string,
    updates: Partial<ScheduledWorkout>
  ): Promise<ScheduledWorkout> => {
    console.log("Updating scheduled workout", { id, updates });
    return apiRequest<ScheduledWorkout>(`/scheduled-workouts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  // Mark workout as completed
  markCompleted: (
    id: string,
    notes?: string,
    finalDuration?: number
  ): Promise<ScheduledWorkout> => {
    console.log("Marking workout as completed", { id, notes, finalDuration });
    const queryParams = new URLSearchParams();
    if (notes) queryParams.append("notes", notes);
    if (finalDuration !== undefined)
      queryParams.append("finalDuration", finalDuration.toString());

    return apiRequest<ScheduledWorkout>(
      `/scheduled-workouts/${id}/complete?${queryParams.toString()}`,
      {
        method: "PATCH",
      }
    );
  },

  // Delete scheduled workout
  delete: (id: string): Promise<void> => {
    console.log("Deleting scheduled workout", { id });
    return apiRequest<void>(`/scheduled-workouts/${id}`, {
      method: "DELETE",
    });
  },
};

// Workout Notes API
export const notesApi = {
  // Get all notes for current user
  getAll: (): Promise<WorkoutNote[]> => {
    console.log("Getting all notes");
    return apiRequest<WorkoutNote[]>("/notes");
  },

  // Get notes for a specific date
  getByDate: (date: Date): Promise<WorkoutNote[]> => {
    const dateStr = date.toISOString().split("T")[0];
    console.log("Getting notes for date", { date: dateStr });
    return apiRequest<WorkoutNote[]>(`/notes?date=${dateStr}`);
  },

  // Get notes for a specific routine
  getByRoutine: (routineId: string): Promise<WorkoutNote[]> => {
    console.log("Getting notes for routine", { routineId });
    return apiRequest<WorkoutNote[]>(`/notes?routineId=${routineId}`);
  },

  // Create new note
  create: (
    content: string,
    date: Date,
    routineId?: string
  ): Promise<WorkoutNote> => {
    console.log("Creating new note", { content, date, routineId });
    return apiRequest<WorkoutNote>("/notes", {
      method: "POST",
      body: JSON.stringify({
        content,
        date: date.toISOString(),
        routineId,
      }),
    });
  },

  // Update note
  update: (id: string, content: string): Promise<WorkoutNote> => {
    console.log("Updating note", { id, content });
    return apiRequest<WorkoutNote>(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
  },

  // Delete note
  delete: (id: string): Promise<void> => {
    console.log("Deleting note", { id });
    return apiRequest<void>(`/notes/${id}`, {
      method: "DELETE",
    });
  },
};

// Combined API object
export const api = {
  auth: authApi,
  user: userApi,
  routines: routinesApi,
  scheduledWorkouts: scheduledWorkoutsApi,
  notes: notesApi,
};
