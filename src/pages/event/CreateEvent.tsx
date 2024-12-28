import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventWizard } from '../../components/event/EventWizard';
import { useOrganization } from '../../contexts/OrganizationContext';

export function CreateEvent() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const [error, setError] = useState<string | null>(null);

  if (!currentOrganization) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">No Organization Selected</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Please select an organization before creating an event.
          </p>
          <button
            onClick={() => navigate('/organizations')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
          >
            Go to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Event</h1>
        <button
          onClick={() => navigate('/events')}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-md">
          {error}
        </div>
      )}

      <EventWizard
        mode="create"
        onSave={(event) => {
          navigate(`/events/${event.id}`);
        }}
      />
    </div>
  );
} 