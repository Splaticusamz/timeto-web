import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { EventDetails } from './pages/event/EventDetails';
import { MemberProvider } from './contexts/MemberContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { EventProvider } from './contexts/EventContext';

export default function App() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <OrganizationProvider>
      <EventProvider>
        <MemberProvider>
          <Layout>
            <Outlet />
          </Layout>
        </MemberProvider>
      </EventProvider>
    </OrganizationProvider>
  );
}
