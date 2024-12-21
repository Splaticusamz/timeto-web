import { useState } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface CreateEventFormProps {
  onError: (error: string | null) => void;
  onSuccess: () => void;
}

export function CreateEventForm({ onError, onSuccess }: CreateEventFormProps) {
  const { createEvent } = useEvent();
  const { currentOrganization } = useOrganization();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) {
      onError('No organization selected');
      return;
    }

    setLoading(true);
    try {
      await createEvent({
        title,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(startDate).toISOString(), // For now, end date is same as start date
        organizationId: currentOrganization.id,
        status: 'scheduled',
        visibility: 'public',
      });
      onSuccess();
      onError(null);
    } catch (err) {
      console.error('Failed to create event:', err);
      onError('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Title
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="title"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Date
        </label>
        <div className="mt-1">
          <input
            type="datetime-local"
            name="startDate"
            id="startDate"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            onError(null);
            onSuccess();
          }}
          className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </form>
  );
} 