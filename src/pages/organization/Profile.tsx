import { useState, useRef } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { PencilIcon, CheckIcon, XMarkIcon, PhotoIcon, TrashIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { mockStorage } from '../../services/mockStorage';
import { db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const { currentOrganization, updateOrganization, deleteOrganization } = useOrganization();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(currentOrganization || {});
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fieldLoading, setFieldLoading] = useState<{ [key: string]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentOrganization) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please select an organization first.
      </div>
    );
  }

  const hasFieldChanged = (path: string): boolean => {
    const keys = path.split('.');
    let currentValue = formData;
    let originalValue = currentOrganization;
    
    for (const key of keys) {
      if (!currentValue || !originalValue) return false;
      currentValue = currentValue[key];
      originalValue = originalValue[key];
    }

    // Handle undefined/null cases
    if (currentValue === undefined && originalValue === undefined) return false;
    if (currentValue === null && originalValue === null) return false;
    if (!currentValue && !originalValue) return false;

    // Convert both to strings for comparison
    const current = currentValue?.toString() || '';
    const original = originalValue?.toString() || '';
    return current !== original;
  };

  const handleFieldSave = async (path: string) => {
    try {
      setFieldLoading(prev => ({ ...prev, [path]: true }));
      setError(null);

      const keys = path.split('.');
      let value = formData;
      for (const key of keys) {
        value = value[key];
      }

      // Create an update object with just the changed field
      const updateObj = { ...currentOrganization };
      let current = updateObj;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      await updateOrganization(currentOrganization.id, updateObj);
      
      // Update the form data to match the current organization data
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setFieldLoading(prev => ({ ...prev, [path]: false }));
    }
  };

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const newData = { ...prev };
      let current = newData;
      
      // Ensure all parent objects exist
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };  // Create new reference for nested object
        current = current[keys[i]];
      }
      
      // Set the value
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 800; // Max width or height

        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.7 // Quality (0.7 = 70% quality)
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setPhotoUploading(true);
        setError(null);

        // Use mockStorage instead of Firebase Storage
        const imageUrl = await mockStorage.uploadImage(file);
        
        // Update the form data and organization with all image fields
        handleInputChange('photoUrl', imageUrl);
        await updateOrganization(currentOrganization.id, {
          ...currentOrganization,
          photoUrl: imageUrl,
          logoImage: imageUrl,
          previewImage: imageUrl,
          fullImage: imageUrl
        });
      } catch (err) {
        console.error('Failed to upload photo:', err);
        setError('Failed to upload photo. Please try again.');
      } finally {
        setPhotoUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      await updateOrganization(currentOrganization.id, formData);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(currentOrganization);
    setIsEditing(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!currentOrganization) return;
    
    try {
      setDeleteLoading(true);
      setError(null);
      await deleteOrganization(currentOrganization.id);
      navigate('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Organization Profile</h1>
        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-sm font-medium rounded-md shadow-sm text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Organization</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{currentOrganization?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-8">
            {/* Organization Photo */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Organization Photo</h3>
              <div className="flex flex-col items-center">
                <div 
                  className="relative w-48 h-48 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-4"
                  onClick={isEditing ? handlePhotoClick : undefined}
                  style={{ cursor: isEditing ? 'pointer' : 'default' }}
                >
                  {formData.photoUrl ? (
                    <img 
                      src={formData.photoUrl} 
                      alt={formData.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PhotoIcon className="w-24 h-24 text-gray-400" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm">
                        {photoUploading ? 'Uploading...' : 'Change Photo'}
                      </span>
                    </div>
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={photoUploading}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="email"
                        value={formData.contactInfo?.email || ''}
                        onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                      <div className="flex items-center space-x-2">
                        {isEditing && hasFieldChanged('contactInfo.email') && !fieldLoading['contactInfo.email'] && (
                          <>
                            <button
                              onClick={() => handleFieldSave('contactInfo.email')}
                              disabled={fieldLoading['contactInfo.email']}
                              className={`p-1 ${fieldLoading['contactInfo.email'] ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                            >
                              <HandThumbUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  contactInfo: {
                                    ...prev.contactInfo,
                                    email: currentOrganization.contactInfo?.email || ''
                                  }
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fieldLoading['contactInfo.email'] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {currentOrganization.contactInfo?.email || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="tel"
                        value={formData.contactInfo?.phone || ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          handleInputChange('contactInfo.phone', value);
                        }}
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                      <div className="flex items-center space-x-2">
                        {isEditing && hasFieldChanged('contactInfo.phone') && !fieldLoading['contactInfo.phone'] && (
                          <>
                            <button
                              onClick={() => handleFieldSave('contactInfo.phone')}
                              disabled={fieldLoading['contactInfo.phone']}
                              className={`p-1 ${fieldLoading['contactInfo.phone'] ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                            >
                              <HandThumbUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  contactInfo: {
                                    ...prev.contactInfo,
                                    phone: currentOrganization.contactInfo?.phone || ''
                                  }
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fieldLoading['contactInfo.phone'] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {currentOrganization.contactInfo?.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={formData.contactInfo?.website || ''}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value && !value.match(/^https?:\/\//)) {
                            value = 'https://' + value;
                          }
                          handleInputChange('contactInfo.website', value);
                        }}
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                      <div className="flex items-center space-x-2">
                        {isEditing && hasFieldChanged('contactInfo.website') && !fieldLoading['contactInfo.website'] && (
                          <>
                            <button
                              onClick={() => handleFieldSave('contactInfo.website')}
                              disabled={fieldLoading['contactInfo.website']}
                              className={`p-1 ${fieldLoading['contactInfo.website'] ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                            >
                              <HandThumbUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  contactInfo: {
                                    ...prev.contactInfo,
                                    website: currentOrganization.contactInfo?.website || ''
                                  }
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fieldLoading['contactInfo.website'] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {currentOrganization.contactInfo?.website ? (
                        <a 
                          href={currentOrganization.contactInfo.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          {currentOrganization.contactInfo.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                      <div className="flex items-center space-x-2">
                        {isEditing && hasFieldChanged('name') && !fieldLoading['name'] && (
                          <>
                            <button
                              onClick={() => handleFieldSave('name')}
                              disabled={fieldLoading['name']}
                              className={`p-1 ${fieldLoading['name'] ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                            >
                              <HandThumbUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  name: currentOrganization.name || ''
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fieldLoading['name'] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {currentOrganization.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  {isEditing ? (
                    <div className="flex items-start space-x-2">
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                      <div className="flex items-center space-x-2">
                        {isEditing && hasFieldChanged('description') && !fieldLoading['description'] && (
                          <>
                            <button
                              onClick={() => handleFieldSave('description')}
                              disabled={fieldLoading['description']}
                              className={`p-1 ${fieldLoading['description'] ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                            >
                              <HandThumbUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  description: currentOrganization.description || ''
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fieldLoading['description'] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {currentOrganization.description || 'No description provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Event Visibility
                  </label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={formData.defaultEventVisibility || 'organization'}
                        onChange={(e) => handleInputChange('defaultEventVisibility', e.target.value)}
                        className="block flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      >
                        <option value="organization">Organization Only</option>
                        <option value="invite-only">Invite Only</option>
                        <option value="public">Public</option>
                      </select>
                      <div className="flex items-center space-x-2">
                        {isEditing && hasFieldChanged('defaultEventVisibility') && !fieldLoading['defaultEventVisibility'] && (
                          <>
                            <button
                              onClick={() => handleFieldSave('defaultEventVisibility')}
                              disabled={fieldLoading['defaultEventVisibility']}
                              className={`p-1 ${fieldLoading['defaultEventVisibility'] ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                            >
                              <HandThumbUpIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  defaultEventVisibility: currentOrganization.defaultEventVisibility || 'organization'
                                }));
                              }}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {fieldLoading['defaultEventVisibility'] && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {currentOrganization.defaultEventVisibility === 'organization' ? 'Organization Only' :
                       currentOrganization.defaultEventVisibility === 'invite-only' ? 'Invite Only' :
                       currentOrganization.defaultEventVisibility === 'public' ? 'Public' : 'Organization Only'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Location</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location Type
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.location?.type}
                      onChange={(e) => handleInputChange('location.type', e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                    >
                      <option value="fixed">Fixed Location</option>
                      <option value="multiple">Multiple Locations</option>
                      <option value="virtual">Virtual</option>
                      <option value="tbd">To Be Determined</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                      {currentOrganization.location?.type}
                    </div>
                  )}
                </div>

                {(isEditing ? formData.location?.type : currentOrganization.location?.type) === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.location?.address}
                        onChange={(e) => handleInputChange('location.address', e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {currentOrganization.location?.address}
                      </div>
                    )}
                  </div>
                )}

                {(isEditing ? formData.location?.type : currentOrganization.location?.type) === 'virtual' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Virtual Link
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={formData.location?.virtualLink}
                        onChange={(e) => handleInputChange('location.virtualLink', e.target.value)}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {currentOrganization.location?.virtualLink}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Organization Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Event Visibility
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.settings?.defaultEventVisibility}
                      onChange={(e) => handleInputChange('settings.defaultEventVisibility', e.target.value)}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2"
                    >
                      <option value="public">Public</option>
                      <option value="organization">Invite Only</option>
                      <option value="private">Private</option>
                    </select>
                  ) : (
                    <div className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                      {currentOrganization.settings?.defaultEventVisibility}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.settings?.discoverable}
                          onChange={(e) => handleInputChange('settings.discoverable', e.target.checked)}
                          disabled={formData.settings?.defaultEventVisibility === 'public'}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Discoverable {formData.settings?.defaultEventVisibility === 'public' && '(Required for public organizations)'}
                        </span>
                      </label>

                      {formData.settings?.defaultEventVisibility !== 'public' && (
                        <>
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.settings?.requireMemberApproval}
                              onChange={(e) => handleInputChange('settings.requireMemberApproval', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Require Member Approval
                            </span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={formData.settings?.allowPublicEvents}
                              onChange={(e) => handleInputChange('settings.allowPublicEvents', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Allow Public Events
                            </span>
                          </label>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        Discoverable: {currentOrganization.settings?.discoverable ? 'Yes' : 'No'}
                      </div>
                      {currentOrganization.settings?.defaultEventVisibility !== 'public' && (
                        <>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            Require Member Approval: {currentOrganization.settings?.requireMemberApproval ? 'Yes' : 'No'}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            Allow Public Events: {currentOrganization.settings?.allowPublicEvents ? 'Yes' : 'No'}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Organization ID
                  </label>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                    {currentOrganization.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 