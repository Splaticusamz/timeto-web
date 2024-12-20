import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark text-gray-900 dark:text-gray-100">
      <Header onMenuClick={toggleSidebar} onLogout={handleLogout} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className="pt-14 md:ml-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}; 