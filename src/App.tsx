import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import AppRoutes from './routes';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <OrganizationProvider>
            <AppRoutes />
          </OrganizationProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
