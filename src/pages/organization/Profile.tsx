import { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';

export function Profile() {
  const { currentOrganization } = useOrganization();
  const [error, setError] = useState<string | null>(null);

  if (!currentOrganization) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please select an organization first.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Organization Profile</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium dark:text-white">Basic Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {currentOrganization.name}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {currentOrganization.description || 'No description provided'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Created At
                </label>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {currentOrganization.createdAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 