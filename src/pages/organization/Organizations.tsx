import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { collection, query, where, getDocs, orderBy, startAfter, limit, QueryDocumentSnapshot, DocumentData, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { mockStorage } from '../../services/mockStorage';
import { UserIcon, UsersIcon, MagnifyingGlassIcon, PlusIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';
import { Dialog, Transition } from '@headlessui/react';
import { CreateOrganizationData, OrganizationType, LocationType, Location } from '../../types/organization';
import { useNavigate } from 'react-router-dom';

interface OrganizationEventCounts {
  [key: string]: {
    private: number;
    public: number;
  };
}

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orgName: string) => void;
}

function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
  const { createOrganization, switchOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'business' as OrganizationType,
    photoUrl: '',
    location: {
      type: 'fixed' as LocationType,
      address: '',
      virtualLink: '',
      multiple: ['']
    },
    contactInfo: {
      email: '',
      phone: '',
      website: ''
    },
    settings: {
      allowPublicEvents: false,
      requireMemberApproval: true,
      defaultEventVisibility: 'organization' as 'public' | 'organization' | 'private',
      allowSubOrganizations: false,
      maxSubOrganizations: 0,
      discoverable: false
    }
  });

  const checkNameAvailability = useCallback(
    debounce(async (name: string) => {
      if (!name) {
        setIsNameAvailable(null);
        return;
      }

      setIsCheckingName(true);
      try {
        const nameQuery = query(
          collection(db, 'organizations'),
          where('nameLower', '==', name.toLowerCase())
        );
        const snapshot = await getDocs(nameQuery);
        setIsNameAvailable(snapshot.empty);
      } catch (err) {
        console.error('Error checking name availability:', err);
        setIsNameAvailable(null);
      } finally {
        setIsCheckingName(false);
      }
    }, 500),
    []
  );

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    
    // Check name availability when name changes
    if (path === 'name') {
      checkNameAvailability(value);
    }
    
    // Handle URL inputs by adding protocol if missing
    if (path === 'contactInfo.website' || path === 'location.virtualLink') {
      if (value && !value.match(/^https?:\/\//)) {
        value = 'https://' + value;
      }
    }

    // Handle phone number input to only allow numbers
    if (path === 'contactInfo.phone') {
      value = value.replace(/\D/g, '');
    }
    
    setFormData(prev => {
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate address for fixed location
      if (formData.location.type === 'fixed' && !formData.location.address) {
        throw new Error('Address is required for fixed location');
      }

      // Validate name availability
      if (!isNameAvailable) {
        throw new Error('Organization name is not available');
      }

      let imageUrl = '';
      // Upload logo if exists
      if (logoFile) {
        try {
          setUploadingLogo(true);
          imageUrl = await mockStorage.uploadImage(logoFile);
        } catch (err) {
          console.error('Failed to upload logo:', err);
          throw new Error('Failed to upload logo');
        } finally {
          setUploadingLogo(false);
        }
      }

      // Format the data to match the expected structure
      const organizationData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        location: formData.location,
        contactInfo: formData.contactInfo,
        settings: formData.settings,
        logoImage: imageUrl,
        previewImage: imageUrl,
        fullImage: imageUrl,
        photoUrl: imageUrl
      };

      // Create organization and get the result
      const createdOrg = await createOrganization(organizationData);
      
      // Close modal and notify parent first
      onClose();
      onSuccess(formData.name);

      // Wait a moment for the organization to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Switch to the new organization and navigate to profile
      try {
        await switchOrganization(createdOrg.id);
        navigate('/organizations/profile');
      } catch (switchError) {
        console.error('Failed to switch to new organization:', switchError);
        navigate('/organizations');
      }
    } catch (err) {
      console.error('Failed to create organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  // Update visibility settings when defaultEventVisibility changes
  useEffect(() => {
    const visibility = formData.settings.defaultEventVisibility;
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        allowPublicEvents: visibility === 'public' ? true : prev.settings.allowPublicEvents,
        requireMemberApproval: visibility === 'private' ? true : prev.settings.requireMemberApproval,
        discoverable: visibility === 'public'
      }
    }));
  }, [formData.settings.defaultEventVisibility]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-6 pb-6 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-6">
                      Create New Organization
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Basic Information</h4>
                        
                        {/* Logo Upload */}
                        <div>
                          <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Organization Logo (Optional)
                          </label>
                          <div className="flex items-center space-x-4">
                            {(formData.photoUrl || logoFile) && (
                              <div className="relative w-16 h-16">
                                <img
                                  src={formData.photoUrl || (logoFile ? URL.createObjectURL(logoFile) : '')}
                                  alt="Organization logo preview"
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLogoFile(null);
                                    handleInputChange('photoUrl', '');
                                  }}
                                  className="absolute -top-2 -right-2 rounded-full bg-red-100 dark:bg-red-900 p-1"
                                >
                                  <XMarkIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                              </div>
                            )}
                            <input
                              type="file"
                              id="logo"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setLogoFile(file);
                                }
                              }}
                              className="block w-full text-sm text-gray-500 dark:text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-primary-50 file:text-primary-700
                                dark:file:bg-primary-900 dark:file:text-primary-300
                                hover:file:bg-primary-100 dark:hover:file:bg-primary-800
                                file:cursor-pointer"
                            />
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Upload a square image (recommended size: 512x512px)
                          </p>
                        </div>

                        {/* Rest of the basic information fields */}
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Organization Name *
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="name"
                              required
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5 ${
                                isNameAvailable === false ? 'border-red-300 dark:border-red-600' : ''
                              }`}
                            />
                            {formData.name && (
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {isCheckingName ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                                ) : isNameAvailable === true ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                ) : isNameAvailable === false ? (
                                  <XMarkIcon className="h-5 w-5 text-red-500" />
                                ) : null}
                              </div>
                            )}
                          </div>
                          {formData.name && !isCheckingName && (
                            <p className={`mt-1 text-sm ${
                              isNameAvailable === true
                                ? 'text-green-600 dark:text-green-400'
                                : isNameAvailable === false
                                ? 'text-red-600 dark:text-red-400'
                                : ''
                            }`}>
                              {isNameAvailable === true
                                ? 'Organization name is available'
                                : isNameAvailable === false
                                ? 'Organization name is already taken'
                                : ''}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                          </label>
                          <textarea
                            id="description"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                          />
                        </div>
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Organization Type *
                          </label>
                          <select
                            id="type"
                            required
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                          >
                            <option value="business">Business</option>
                            <option value="school">School</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Location</h4>
                        <div>
                          <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Location Type *
                          </label>
                          <select
                            id="locationType"
                            required
                            value={formData.location.type}
                            onChange={(e) => handleInputChange('location.type', e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                          >
                            <option value="fixed">Fixed Location</option>
                            <option value="multiple">Multiple Locations</option>
                            <option value="virtual">Virtual</option>
                            <option value="tbd">To Be Determined</option>
                          </select>
                        </div>
                        {formData.location.type === 'fixed' && (
                          <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Address *
                            </label>
                            <input
                              type="text"
                              id="address"
                              required
                              value={formData.location.address}
                              onChange={(e) => handleInputChange('location.address', e.target.value)}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            />
                          </div>
                        )}
                        {formData.location.type === 'virtual' && (
                          <div>
                            <label htmlFor="virtualLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Virtual Link (Optional)
                            </label>
                            <input
                              type="url"
                              id="virtualLink"
                              value={formData.location.virtualLink}
                              onChange={(e) => handleInputChange('location.virtualLink', e.target.value)}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            />
                          </div>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Contact Information</h4>
                        <div>
                          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email (Optional)
                          </label>
                          <input
                            type="email"
                            id="contactEmail"
                            value={formData.contactInfo.email}
                            onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone (Optional)
                          </label>
                          <input
                            type="tel"
                            id="contactPhone"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            value={formData.contactInfo.phone}
                            onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            placeholder="Enter numbers only"
                          />
                        </div>
                        <div>
                          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Website (Optional)
                          </label>
                          <input
                            type="url"
                            id="website"
                            value={formData.contactInfo.website}
                            onChange={(e) => handleInputChange('contactInfo.website', e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                          />
                        </div>
                      </div>

                      {/* Settings */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Organization Settings</h4>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="defaultVisibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Default Event Visibility
                            </label>
                            <select
                              id="defaultVisibility"
                              value={formData.settings.defaultEventVisibility}
                              onChange={(e) => handleInputChange('settings.defaultEventVisibility', e.target.value)}
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            >
                              <option value="public">Public</option>
                              <option value="organization">Invite Only</option>
                              <option value="private">Private</option>
                            </select>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="discoverable"
                              checked={formData.settings.defaultEventVisibility === 'public' ? true : formData.settings.discoverable}
                              onChange={(e) => handleInputChange('settings.discoverable', e.target.checked)}
                              disabled={formData.settings.defaultEventVisibility === 'public'}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <label htmlFor="discoverable" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                              Discoverable {formData.settings.defaultEventVisibility === 'public' && '(Required for public organizations)'}
                            </label>
                          </div>

                          {formData.settings.defaultEventVisibility !== 'public' && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="requireMemberApproval"
                                checked={formData.settings.requireMemberApproval}
                                onChange={(e) => handleInputChange('settings.requireMemberApproval', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                              />
                              <label htmlFor="requireMemberApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Require Member Approval
                              </label>
                            </div>
                          )}

                          {formData.settings.defaultEventVisibility !== 'public' && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="allowPublicEvents"
                                checked={formData.settings.allowPublicEvents}
                                onChange={(e) => handleInputChange('settings.allowPublicEvents', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                              />
                              <label htmlFor="allowPublicEvents" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Allow Public Events
                              </label>
                            </div>
                          )}
                        </div>
                      </div>

                      {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md px-4 py-2">
                          {error}
                        </div>
                      )}

                      <div className="mt-6 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Creating...' : 'Create Organization'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export function Organizations() {
  const { currentOrganization, switchOrganization } = useOrganization();
  const [organizationEventCounts, setOrganizationEventCounts] = useState<OrganizationEventCounts>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hideZeroPrivate, setHideZeroPrivate] = useState(false);
  const [hideZeroPublic, setHideZeroPublic] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [toast, setToast] = useState<{ message: string; orgName: string } | null>(null);

  const handleToastClick = (orgName: string) => {
    setSearchTerm(orgName);
    setToast(null);
  };

  const Toast = () => {
    if (!toast) return null;

    return (
      <div
        onClick={() => handleToastClick(toast.orgName)}
        className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-green-50 dark:hover:bg-green-800 transition-colors duration-200 flex items-center space-x-2 z-50"
      >
        <CheckCircleIcon className="h-5 w-5" />
        <span>{toast.message}</span>
      </div>
    );
  };

  const loadOrganizations = async (searchQuery: string = '', lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      if (!searchQuery && lastDoc) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      let baseQuery;
      
      if (searchQuery) {
        // When searching, use a simple prefix search
        baseQuery = query(
          collection(db, 'organizations'),
          orderBy('name'),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // Normal paginated load when not searching
        baseQuery = query(
          collection(db, 'organizations'),
          orderBy(sortBy, sortOrder),
          limit(ITEMS_PER_PAGE)
        );

        if (lastDoc) {
          baseQuery = query(baseQuery, startAfter(lastDoc));
        }
      }

      console.log('Fetching organizations with query:', baseQuery);
      const snapshot = await getDocs(baseQuery);
      console.log('Found organizations:', snapshot.size);
      const fetchedOrgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Fetched organizations:', fetchedOrgs);

      // Update pagination state
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);

      // Filter out organizations that we already have event counts for
      const newOrgs = fetchedOrgs.filter(org => !organizationEventCounts[org.id]);

      // Load event counts only for new organizations
      if (newOrgs.length > 0) {
        const counts: OrganizationEventCounts = {};
        await Promise.all(
          newOrgs.map(async (org) => {
            // Query both private and public events in parallel
            const [eventsRef, publicEventsRef] = [
              collection(db, 'events'),
              collection(db, 'publicEvents')
            ];

            const [privateEventsQuery, publicEventsQuery] = [
              query(eventsRef, where('owner', '==', org.id)),
              query(publicEventsRef, where('owner', '==', org.id))
            ];

            try {
              const [privateEvents, publicEvents] = await Promise.all([
                getDocs(privateEventsQuery),
                getDocs(publicEventsQuery)
              ]);

              counts[org.id] = {
                private: privateEvents.size,
                public: publicEvents.size
              };
            } catch (error) {
              console.error(`Error loading events for org ${org.id}:`, error);
              counts[org.id] = {
                private: 0,
                public: 0
              };
            }
          })
        );

        setOrganizationEventCounts(prev => ({ ...prev, ...counts }));
      }

      // Update organizations state
      if (!searchQuery && lastDoc) {
        setOrganizations(prev => [...prev, ...fetchedOrgs]);
      } else {
        setOrganizations(fetchedOrgs);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setLastVisible(null);
      setHasMore(true);
      // Capitalize first letter to match the format in the database
      const formattedQuery = query ? query.charAt(0).toUpperCase() + query.slice(1) : '';
      loadOrganizations(formattedQuery);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadOrganizations(searchTerm, lastVisible);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, lastVisible, searchTerm]);

  const handleOrganizationClick = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
    } catch (err) {
      console.error('Failed to switch organization:', err);
    }
  };

  const EventCountPill = ({ type, count }: { type: 'private' | 'public', count: number }) => {
    const isPrimary = type === 'private';
    const Icon = isPrimary ? UserIcon : UsersIcon;
    const baseClasses = `inline-flex items-center px-3 py-1 text-sm rounded-full ${
      isPrimary 
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    }`;

    if (isLoading) {
      return (
        <span className={`${baseClasses} animate-pulse`}>
          <Icon className="w-4 h-4 mr-1 opacity-50" />
          <div className="h-4 w-6 bg-current opacity-20 rounded" />
        </span>
      );
    }

    return (
      <span className={baseClasses}>
        <Icon className="w-4 h-4 mr-1" />
        {count}
      </span>
    );
  };

  // Filter organizations based on event counts
  const filteredOrganizations = organizations.filter(org => {
    const counts = organizationEventCounts[org.id] || { private: 0, public: 0 };
    if (hideZeroPrivate && counts.private === 0) return false;
    if (hideZeroPublic && counts.public === 0) return false;
    return true;
  });

  // Reset pagination when sort changes
  useEffect(() => {
    setLastVisible(null);
    setHasMore(true);
    loadOrganizations();
  }, [sortBy, sortOrder]);

  return (
    <>
      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(orgName: string) => {
          setToast({
            message: `Organization "${orgName}" created successfully!`,
            orgName: orgName
          });
        }}
      />
      <Toast />
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        New Organization
      </button>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
            {/* Search and Sort Controls */}
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Sort Controls */}
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'updatedAt')}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent py-2 pl-3 pr-8 text-sm"
                >
                  <option value="name">Name</option>
                  <option value="createdAt">Created Date</option>
                  <option value="updatedAt">Updated Date</option>
                </select>

                <button
                  onClick={() => setSortOrder(current => current === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Legend and Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    <UserIcon className="w-4 h-4 mr-1" />
                    Private
                  </span>
                  <input
                    type="checkbox"
                    checked={hideZeroPrivate}
                    onChange={(e) => setHideZeroPrivate(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hide 0</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    Public
                  </span>
                  <input
                    type="checkbox"
                    checked={hideZeroPublic}
                    onChange={(e) => setHideZeroPublic(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hide 0</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {filteredOrganizations.map(org => (
            <div
              key={`org-list-${org.id}`}
              onClick={() => handleOrganizationClick(org.id)}
              className={`
                bg-white dark:bg-gray-800 shadow rounded-lg p-6 cursor-pointer
                transition-all duration-200 flex justify-between items-center
                ${org.id === currentOrganization?.id 
                  ? 'ring-2 ring-primary-500 dark:ring-primary-400' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <h2 className={`text-xl font-medium ${
                org.id === currentOrganization?.id
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {org.name}
              </h2>
              <div className="flex items-center space-x-3">
                <EventCountPill 
                  type="private" 
                  count={organizationEventCounts[org.id]?.private || 0} 
                />
                <EventCountPill 
                  type="public" 
                  count={organizationEventCounts[org.id]?.public || 0} 
                />
              </div>
            </div>
          ))}

          {/* Infinite scroll observer target */}
          <div 
            ref={observerTarget} 
            className="h-4"
            aria-hidden="true"
          />

          {(isLoading || isLoadingMore) && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {!isLoading && organizations.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No organizations found
            </div>
          )}
        </div>
      </div>
    </>
  );
} 