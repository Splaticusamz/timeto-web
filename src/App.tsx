import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { ThemeProvider } from './contexts/ThemeContext';

export const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <OrganizationProvider>
          <RouterProvider router={router} />
        </OrganizationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};
