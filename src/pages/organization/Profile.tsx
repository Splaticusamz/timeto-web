import { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CreateOrganizationForm } from '../../components/organization/CreateOrganizationForm';

export const OrganizationProfile = () => {
  const { currentOrganization, userOrganizations, loading, error } = useOrganization();
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!currentOrganization && !showCreateForm) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to TimeTo
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Create your first organization to get started
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
          >
            Create Organization
          </button>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Create New Organization
        </h2>
        <CreateOrganizationForm
          onSuccess={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  if (!currentOrganization) return null;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Profile
          </h2>
          {userOrganizations.length > 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
            >
              Create New Organization
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {currentOrganization.name}
              </h3>
              {currentOrganization.description && (
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {currentOrganization.description}
                </p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</h4>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Public Events</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {currentOrganization.settings.allowPublicEvents ? 'Allowed' : 'Not Allowed'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Member Approval</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {currentOrganization.settings.requireMemberApproval ? 'Required' : 'Not Required'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Default Event Visibility</dt>
                  <dd className="text-sm text-gray-900 dark:text-white capitalize">
                    {currentOrganization.settings.defaultEventVisibility}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization Details</h4>
              <dl className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Created</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {currentOrganization.createdAt.toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600 dark:text-gray-400">Last Updated</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {currentOrganization.updatedAt.toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 