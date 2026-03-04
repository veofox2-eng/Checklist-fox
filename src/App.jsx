import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProfileSelection from './pages/ProfileSelection';
import CreateProfile from './pages/CreateProfile';
import Dashboard from './pages/Dashboard';
import ChecklistView from './pages/ChecklistView';
import AnimatedBackground from './components/AnimatedBackground';
import ThemeToggle from './components/ThemeToggle';
import { MasterProvider } from './contexts/MasterContext';

// Simple auth check component
const ProtectedRoute = ({ children }) => {
  const profileId = localStorage.getItem('activeProfileId');
  if (!profileId) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <MasterProvider>
      <AnimatedBackground />
      <ThemeToggle />
      <div className="layout-container">
        <Routes>
          <Route path="/" element={<ProfileSelection />} />
          <Route path="/create-profile" element={<CreateProfile />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/checklist/:id" element={
            <ProtectedRoute>
              <ChecklistView />
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </MasterProvider>
  );
}

export default App;
