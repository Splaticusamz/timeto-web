import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Settings } from './pages/Settings';
import { Profile } from './pages/organization/Profile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
      },
      {
        path: '/tasks',
        element: <Tasks />,
      },
      {
        path: '/calendar',
        element: <Calendar />,
      },
      {
        path: '/settings',
        element: <Settings />,
      },
      {
        path: '/organization/profile',
        element: <Profile />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]); 