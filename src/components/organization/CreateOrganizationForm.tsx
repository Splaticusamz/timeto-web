import { useState, useRef } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { mockStorage } from '../../services/mockStorage';

interface CreateOrganizationFormProps {
  onError: (error: string | null) => void;
  onSuccess: () => void;
}

export function CreateOrganizationForm({ onError, onSuccess }: CreateOrganizationFormProps) {
  const { createOrganization } = useOrganization();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[DEBUG] 🖼️ File selected:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)}KB`,
        type: file.type
      });
      setSelectedFile(file);
    } else {
      console.log('[DEBUG] 🖼️ File cleared');
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = '';
      if (selectedFile) {
        console.log('[DEBUG] 🖼️ Using mock image URL');
        imageUrl = await mockStorage.uploadImage(selectedFile);
      }

      const orgData = {
        name,
        description,
        type: 'business',
        location: {
          type: 'fixed',
          address: '',
          virtualLink: '',
          multiple: []
        },
        contactInfo: {},
        settings: {
          allowPublicEvents: false,
          requireMemberApproval: true,
          defaultEventVisibility: 'organization',
          discoverable: false
        },
        logoImage: imageUrl,
        previewImage: imageUrl,
        fullImage: imageUrl
      };

      await createOrganization(orgData);
      onSuccess();
      onError(null);
    } catch (err) {
      console.error('Failed to create organization:', err);
      onError('Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="name"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Organization Image
        </label>
        <div className="mt-1">
          <input
            type="file"
            id="image"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-primary-600 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
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