import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';

export default function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
