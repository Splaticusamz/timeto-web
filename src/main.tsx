import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { OrganizationProvider } from './contexts/OrganizationContext'
import { EventProvider } from './contexts/EventContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <OrganizationProvider>
          <EventProvider>
            <RouterProvider router={router} />
          </EventProvider>
        </OrganizationProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
