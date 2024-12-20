import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { Login } from './pages/Login';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

// Temporary placeholders until we implement these features
const Dashboard = () => <div className="p-4">Dashboard (Coming soon)</div>;
const Tasks = () => <div className="p-4">Tasks (Coming soon)</div>;
const Calendar = () => <div className="p-4">Calendar (Coming soon)</div>;
const Settings = () => <div className="p-4">Settings (Coming soon)</div>;

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <MainLayout>
                <Tasks />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <MainLayout>
                <Calendar />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <Settings />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes; 