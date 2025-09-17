import { useState, useCallback, useEffect } from "react";
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from "../types";
import { api } from "../api";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (api.auth.isAuthenticated()) {
          // Try to get user profile to verify token is still valid
          const userData = await api.user.getCurrentUser();
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            profilePicture: userData.profilePicture,
          });
        }
      } catch (err) {
        // Token is invalid, clear it
        api.auth.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.auth.login(credentials);
        setUser(response.user);

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (userData: RegisterRequest): Promise<AuthResponse> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.auth.register(userData);
        setUser(response.user);

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Registration failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    api.auth.logout();
    setUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };
}
