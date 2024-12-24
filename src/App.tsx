import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { EventDetails } from './pages/event/EventDetails';
import { MemberProvider } from './contexts/MemberContext';

export default function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <MemberProvider>
      <Layout>
        <Outlet />
      </Layout>
    </MemberProvider>
  );
}
