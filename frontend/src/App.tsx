import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { RoutinesProvider } from './contexts/RoutinesContext';
import { ScheduledWorkoutsProvider } from './contexts/ScheduledWorkoutsContext';
import { Sidebar, MobileHeader, ProtectedRoute } from './components';
import { AuthView, Dashboard, RoutinesLibrary, RoutineDetailView, WorkoutSessionView, WorkoutHistoryView, CalendarView, ProfileView, RecommendationsView } from './views';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuthContext();

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/routines': return 'Routines';
      case '/recommendations': return 'AI Recommendations';
      case '/history': return 'Workout History';
      case '/calendar': return 'Calendar';
      case '/profile': return 'Profile';
      default: 
        if (pathname.startsWith('/routines/')) return 'Routine Details';
        if (pathname.startsWith('/workout/')) return 'Workout Session';
        return 'CrossFit Pro';
    }
  };

  // Show auth view if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthView />} />
        <Route path="*" element={<AuthView />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentPath={location.pathname}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={logout}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <MobileHeader
            title={getPageTitle(location.pathname)}
            onMenuToggle={() => setSidebarOpen(true)}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/routines" element={<ProtectedRoute><RoutinesLibrary /></ProtectedRoute>} />
                <Route path="/routines/:id" element={<ProtectedRoute><RoutineDetailView /></ProtectedRoute>} />
                <Route path="/recommendations" element={<ProtectedRoute><RecommendationsView /></ProtectedRoute>} />
                <Route path="/workout/:workoutId" element={<ProtectedRoute><WorkoutSessionView /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><WorkoutHistoryView /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><CalendarView /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
                <Route path="/login" element={<AuthView />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RoutinesProvider>
        <ScheduledWorkoutsProvider>
          <Router>
            <AppContent />
          </Router>
        </ScheduledWorkoutsProvider>
      </RoutinesProvider>
    </AuthProvider>
  );
}

export default App;