import { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CreateOrganizationForm } from '../../components/organization/CreateOrganizationForm';

export const Profile = () => {
  const { currentOrganization, loading, error } = useOrganization();
  const [formError, setFormError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Organization Profile</h1>
      
      {currentOrganization ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">{currentOrganization.name}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{currentOrganization.description || 'No description provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Owner</label>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{currentOrganization.ownerId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created At</label>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{currentOrganization.createdAt.toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
              <p className="mt-1 text-gray-600 dark:text-gray-400">{currentOrganization.updatedAt.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Create Organization</h2>
          {formError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{formError}</span>
            </div>
          )}
          <CreateOrganizationForm onError={setFormError} />
        </div>
      )}
    </div>
  );
}; 