import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { OrganizationProvider } from './contexts/OrganizationContext';
import { EventProvider } from './contexts/EventContext';
import { MemberProvider } from './contexts/MemberContext';

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
