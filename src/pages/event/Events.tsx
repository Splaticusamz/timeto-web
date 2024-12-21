import { useState } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

export function Events() {
  const navigate = useNavigate();
  const { events } = useEvent();
  const { currentOrganization } = useOrganization();
  const [error, setError] = useState<string | null>(null);

  if (!currentOrganization) {
    return <Navigate to="/organizations" replace />;
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Events</h1>
        <button
          type="button"
          onClick={() => navigate('/events/new')}
          className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Create Event
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4">
          {events && events.length > 0 ? (
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {events.map((event) => (
                    <tr 
                      key={event.id} 
                      onClick={() => navigate(`/events/${event.id}/edit`)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {event.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No events found for {currentOrganization.name}. Create one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 