import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Organizations from './pages/organization/Organizations';
import Events from './pages/Events';
import EventWizard from './components/event/EventWizard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Organizations />,
      },
      {
        path: '/organizations',
        element: <Organizations />,
      },
      {
        path: '/events',
        element: <Events />,
      },
      {
        path: '/events/new',
        element: <EventWizard />,
      },
      {
        path: '/events/:id/edit',
        element: <EventWizard />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
]); 