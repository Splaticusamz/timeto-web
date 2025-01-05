import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { Events } from './pages/event/Events';
import { Organizations } from './pages/organization/Organizations';
import { Profile } from './pages/organization/Profile';
import { Members } from './pages/members/Members';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Calendar } from './pages/calendar/Calendar';
import { EventDetails } from './pages/event/EventDetails';
import { EventWizard } from './components/event/EventWizard';
import { MemberManagement } from './pages/admin/MemberManagement';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Organizations />,
      },
      {
        path: 'organizations',
        element: <Organizations />,
      },
      {
        path: 'organizations/profile',
        element: <Profile />,
      },
      {
        path: 'admin/organizations/:organizationId/members',
        element: <MemberManagement />,
      },
      {
        path: 'events',
        element: <Events />,
      },
      {
        path: 'events/new',
        element: <EventWizard />,
      },
      {
        path: 'events/:id',
        element: <EventDetails />,
      },
      {
        path: 'calendar',
        element: <Calendar />,
      },
      {
        path: 'members',
        element: <Members />,
      },
    ],
  },
]); 