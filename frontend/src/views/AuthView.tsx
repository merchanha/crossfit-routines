import { useState } from "react";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";

type AuthMode = "login" | "register";

export function AuthView() {
  const [mode, setMode] = useState<AuthMode>("login");

  const handleSuccess = () => {
    // Redirect to dashboard after successful authentication
    window.location.href = "/";
  };

  const switchToLogin = () => setMode("login");
  const switchToRegister = () => setMode("register");

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">CF</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white">CrossFit Pro</h1>
          <p className="mt-2 text-gray-400">Your personal fitness companion</p>
        </div>

        {/* Auth Forms */}
        {mode === "login" ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={handleSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </div>
    </div>
  );
}
