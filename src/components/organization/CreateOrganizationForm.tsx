import { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CreateOrganizationData } from '../../types/organization';

interface CreateOrganizationFormProps {
  onError: (error: string) => void;
  parentOrgId?: string;
}

const defaultSettings = {
  allowPublicEvents: false,
  requireMemberApproval: true,
  defaultEventVisibility: 'organization' as const,
  allowSubOrganizations: false,
  maxSubOrganizations: 5,
};

export const CreateOrganizationForm = ({ onError, parentOrgId }: CreateOrganizationFormProps) => {
  const { createOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    description: '',
    parentOrgId,
    settings: defaultSettings,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onError('Organization name is required');
      return;
    }

    try {
      setLoading(true);
      await createOrganization(formData);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
            settingName === 'maxSubOrganizations' ? parseInt(value, 10) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Organization Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Organization Settings</h3>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowPublicEvents"
            name="settings.allowPublicEvents"
            checked={formData.settings.allowPublicEvents}
            onChange={handleChange}
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
            name="settings.requireMemberApproval"
            checked={formData.settings.requireMemberApproval}
            onChange={handleChange}
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
            name="settings.defaultEventVisibility"
            value={formData.settings.defaultEventVisibility}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="public">Public</option>
            <option value="organization">Organization Only</option>
            <option value="private">Private</option>
          </select>
        </div>

        {!parentOrgId && (
          <>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowSubOrganizations"
                name="settings.allowSubOrganizations"
                checked={formData.settings.allowSubOrganizations}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="allowSubOrganizations" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Allow sub-organizations
              </label>
            </div>

            {formData.settings.allowSubOrganizations && (
              <div>
                <label htmlFor="maxSubOrganizations" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maximum Sub-Organizations
                </label>
                <input
                  type="number"
                  id="maxSubOrganizations"
                  name="settings.maxSubOrganizations"
                  value={formData.settings.maxSubOrganizations}
                  onChange={handleChange}
                  min={1}
                  max={100}
                  className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
              Creating...
            </>
          ) : (
            'Create Organization'
          )}
        </button>
      </div>
    </form>
  );
}; 