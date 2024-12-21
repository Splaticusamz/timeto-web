import { useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CreateOrganizationData } from '../../types/organization';

interface CreateOrganizationFormProps {
  onError: (error: string | null) => void;
}

const defaultSettings = {
  allowPublicEvents: false,
  requireMemberApproval: true,
  defaultEventVisibility: 'organization' as const,
  allowSubOrganizations: false,
  maxSubOrganizations: 5,
};

export default function CreateOrganizationForm({ onError }: CreateOrganizationFormProps) {
  const { createOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationData>({
    name: '',
    description: '',
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
      onError(null);
      await createOrganization(formData);
    } catch (err) {
      console.error('Failed to create organization:', err);
      onError('Failed to create organization. Please try again.');
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
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">
            Organization Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:bg-gray-800 sm:text-sm sm:leading-6"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:bg-gray-800 sm:text-sm sm:leading-6"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Organization Settings</h3>
        
        <div className="space-y-3">
          <div className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                type="checkbox"
                id="allowPublicEvents"
                name="settings.allowPublicEvents"
                checked={formData.settings.allowPublicEvents}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor="allowPublicEvents" className="font-medium text-gray-900 dark:text-white">
                Allow public events
              </label>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                type="checkbox"
                id="requireMemberApproval"
                name="settings.requireMemberApproval"
                checked={formData.settings.requireMemberApproval}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor="requireMemberApproval" className="font-medium text-gray-900 dark:text-white">
                Require member approval
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="defaultVisibility" className="block text-sm font-medium text-gray-900 dark:text-white">
              Default Event Visibility
            </label>
            <select
              id="defaultVisibility"
              name="settings.defaultEventVisibility"
              value={formData.settings.defaultEventVisibility}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:bg-gray-800 sm:text-sm sm:leading-6"
            >
              <option value="public">Public</option>
              <option value="organization">Organization Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                type="checkbox"
                id="allowSubOrganizations"
                name="settings.allowSubOrganizations"
                checked={formData.settings.allowSubOrganizations}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor="allowSubOrganizations" className="font-medium text-gray-900 dark:text-white">
                Allow sub-organizations
              </label>
            </div>
          </div>

          {formData.settings.allowSubOrganizations && (
            <div>
              <label htmlFor="maxSubOrganizations" className="block text-sm font-medium text-gray-900 dark:text-white">
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
                className="mt-1 block w-32 rounded-md border-0 py-1.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-primary-600 dark:bg-gray-800 sm:text-sm sm:leading-6"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 sm:col-start-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Creating...
            </>
          ) : (
            'Create Organization'
          )}
        </button>
        <button
          type="button"
          onClick={() => onError(null)}
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 