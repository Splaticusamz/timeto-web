import { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CreateOrganizationData } from '../../types/organization';

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateOrganizationForm = ({ onSuccess, onCancel }: CreateOrganizationFormProps) => {
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    description: '',
    settings: {
      allowPublicEvents: false,
      requireMemberApproval: true,
      defaultEventVisibility: 'organization',
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { createOrganization } = useOrganization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Organization name is required');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await createOrganization(formData);
      onSuccess?.();
    } catch (err) {
      setError('Failed to create organization');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Organization Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization Settings</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowPublicEvents"
            checked={formData.settings?.allowPublicEvents}
            onChange={(e) =>
              setFormData({
                ...formData,
                settings: { ...formData.settings, allowPublicEvents: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="allowPublicEvents" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Allow public events
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="requireMemberApproval"
            checked={formData.settings?.requireMemberApproval}
            onChange={(e) =>
              setFormData({
                ...formData,
                settings: { ...formData.settings, requireMemberApproval: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="requireMemberApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Require member approval
          </label>
        </div>

        <div>
          <label htmlFor="defaultVisibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Default Event Visibility
          </label>
          <select
            id="defaultVisibility"
            value={formData.settings?.defaultEventVisibility}
            onChange={(e) =>
              setFormData({
                ...formData,
                settings: {
                  ...formData.settings,
                  defaultEventVisibility: e.target.value as 'public' | 'organization' | 'private',
                },
              })
            }
            className="mt-1 block w-full rounded-md border dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="public">Public</option>
            <option value="organization">Organization Only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
      </div>
    </form>
  );
}; 