import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { setupAdminUser } from '../utils/adminSetup';

export const Settings = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSetupAdmin = async () => {
    if (!currentUser) return;
    
    try {
      const success = await setupAdminUser(currentUser.uid);
      if (success) {
        setMessage({ type: 'success', text: 'Admin user setup completed. Please refresh the page.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to setup admin user.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while setting up admin user.' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Admin Setup</h2>
            <button
              onClick={handleSetupAdmin}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Initialize Admin User
            </button>
            {message && (
              <div className={`mt-4 p-4 rounded ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">General Settings</h2>
            <p className="text-gray-600 dark:text-gray-300">More settings will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 