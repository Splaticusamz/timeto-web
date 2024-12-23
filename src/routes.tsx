import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { Events } from './pages/event/Events';
import { Organizations } from './pages/organization/Organizations';
import { Profile } from './pages/organization/Profile';
import { EventWizard } from './components/event/EventWizard';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Calendar } from './pages/calendar/Calendar';

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
        path: 'events',
        element: <Events />,
      },
      {
        path: 'events/new',
        element: <EventWizard />,
      },
      {
        path: 'events/:id',
        element: <EventWizard mode="view" />,
      },
      {
        path: 'events/:id/edit',
        element: <EventWizard mode="edit" />,
      },
      {
        path: 'calendar',
        element: <Calendar />,
      },
    ],
  },
]); 