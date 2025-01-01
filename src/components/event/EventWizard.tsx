import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvent } from '../../contexts/EventContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Event, CreateEventData, EventVisibility, LocationType, Widget, EventLocation, RecurrenceRule } from '../../types/event';
import { BasicInfoForm } from './BasicInfoForm';
import { WidgetSelector } from './widgets/WidgetSelector';
import { WidgetConfigForm } from './WidgetConfigForm';
import { EventPreview } from './EventPreview';
import { PhotoUpload } from './PhotoUpload';
import { WidgetConfig } from './WidgetConfig';
import { ImageUpload } from './ImageUpload';
import { PhotoIcon } from '@heroicons/react/24/outline';

type WizardStep = 'basic-info' | 'widgets' | 'publish';

interface EventWizardProps {
  event?: Event;
  onSave?: (event: Event) => void;
  mode?: 'view' | 'edit' | 'create';
}

interface BasicInfoFormData {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  timezone: string;
  location: EventLocation;
  visibility: EventVisibility;
  recurrence?: RecurrenceRule;
}

interface WidgetFormData {
  widgets: Widget[];
}

export function EventWizard({ event, onSave, mode = 'create' }: EventWizardProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentOrganization } = useOrganization();
  const { createEvent, updateEvent, saveDraft, events } = useEvent();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | null>(null);

  const [basicInfo, setBasicInfo] = useState<BasicInfoFormData>({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.start || new Date(),
    endDate: event?.end || new Date(new Date().setHours(new Date().getHours() + 1)),
    timezone: event?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: event?.location || {
      type: currentOrganization?.location?.address ? 'organization' : 'fixed',
      address: currentOrganization?.location?.address || '',
      meetingUrl: '',
    },
    visibility: event?.visibility || currentOrganization?.settings?.defaultEventVisibility || 'organization',
    recurrence: event?.recurrence,
  });

  const [widgetConfig, setWidgetConfig] = useState<WidgetFormData>({
    widgets: event?.widgets || [],
  });

  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [logoImageUploading, setLogoImageUploading] = useState(false);

  const [eventPhotos, setEventPhotos] = useState({
    coverImage: event?.coverImage || null,
    logoImage: event?.logoImage || null,
  });

  useEffect(() => {
    // Auto-save draft every 30 seconds if editing an existing event
    if (!event?.id) return;

    const interval = setInterval(async () => {
      try {
        setDraftStatus('saving');
        await saveDraft(event.id, {
          ...basicInfo,
          ...widgetConfig,
          organizationId: currentOrganization?.id || '',
          status: 'draft',
        });
        setDraftStatus('saved');
        // Clear the 'saved' status after 2 seconds
        setTimeout(() => setDraftStatus(null), 2000);
      } catch (err) {
        console.error('Failed to auto-save draft:', err);
        setDraftStatus(null);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [event?.id, basicInfo, widgetConfig, currentOrganization?.id, saveDraft]);

  useEffect(() => {
    // When start date changes, update end date to be 1 hour later if not already set
    if (basicInfo.startDate && (!event?.end || !basicInfo.endDate)) {
      const newEndDate = new Date(basicInfo.startDate);
      newEndDate.setHours(newEndDate.getHours() + 1);
      setBasicInfo(prev => ({
        ...prev,
        endDate: newEndDate
      }));
    }
  }, [basicInfo.startDate, event?.end]);

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

  const handleCoverImageUpload = async (file: File) => {
    try {
      setCoverImageUploading(true);
      setError(null);
      
      // Compress the image
      const compressedBlob = await compressImage(file);
      const previewUrl = URL.createObjectURL(compressedBlob);
      setEventPhotos(prev => ({ ...prev, coverImage: previewUrl }));

      if (event?.id) {
        await updateEvent(event.id, {
          ...event,
          coverImage: previewUrl,
        });
      }
    } catch (err) {
      console.error('Failed to upload cover image:', err);
      setError('Failed to upload cover image. Please try again.');
    } finally {
      setCoverImageUploading(false);
    }
  };

  const handleLogoImageUpload = async (file: File) => {
    try {
      setLogoImageUploading(true);
      setError(null);
      
      const previewUrl = URL.createObjectURL(file);
      setEventPhotos(prev => ({ ...prev, logoImage: previewUrl }));

      if (event?.id) {
        await updateEvent(event.id, {
          ...event,
          logoImage: previewUrl,
        });
      }
    } catch (err) {
      console.error('Failed to upload logo image:', err);
      setError('Failed to upload logo image. Please try again.');
    } finally {
      setLogoImageUploading(false);
    }
  };

  const validateBasicInfo = (): boolean => {
    if (!basicInfo.title) {
      setError('Please enter a title');
      return false;
    }
    if (!basicInfo.startDate) {
      setError('Please select a start date');
      return false;
    }
    if (basicInfo.endDate && basicInfo.endDate < basicInfo.startDate) {
      setError('End date must be after start date');
      return false;
    }
    if (basicInfo.location.type === 'fixed' && !basicInfo.location.address) {
      setError('Please enter a location address');
      return false;
    }
    if ((basicInfo.location.type === 'virtual' || basicInfo.location.type === 'hybrid') && !basicInfo.location.meetingUrl) {
      setError('Please enter a meeting URL');
      return false;
    }
    return true;
  };

  const validateWidgets = (): boolean => {
    // Debug logging
    console.log('Validating widgets:', widgetConfig.widgets);

    // At least one widget should be enabled
    if (!widgetConfig.widgets.some(w => w.isEnabled)) {
      setError('Please enable at least one widget');
      return false;
    }

    // Check each enabled widget for required fields
    for (const widget of widgetConfig.widgets) {
      if (!widget.isEnabled) continue;

      console.log('Checking widget:', widget.type, widget.config);

      if (widget.type === 'website') {
        // If org has no website, only check custom URL
        if (!currentOrganization?.website) {
          if (!widget.config.customUrl) {
            setError('Please enter a website URL');
            return false;
          }
        } else {
          // If org has website, check based on selection
          if (widget.config.useOrganizationWebsite) {
            if (!currentOrganization.website) {
              setError('Please enter a website URL');
              return false;
            }
          } else if (!widget.config.customUrl) {
            setError('Please enter a website URL');
            return false;
          }
        }
      }

      if (widget.type === 'phoneNumber' || widget.type === 'call') {
        // If org has no phone, only check custom phone
        if (!currentOrganization?.phoneNumber) {
          if (!widget.config.customPhone) {
            setError('Please enter a phone number');
            return false;
          }
        } else {
          // If org has phone, check based on selection
          if (widget.config.useOrganizationPhone) {
            if (!currentOrganization.phoneNumber) {
              setError('Please enter a phone number');
              return false;
            }
          } else if (!widget.config.customPhone) {
            setError('Please enter a phone number');
            return false;
          }
        }
      }

      if (widget.type === 'messageBoard') {
        if (!widget.config.messages || widget.config.messages.length === 0) {
          setError('Please add at least one message to the message board');
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 'basic-info') {
      if (validateBasicInfo()) {
        setError(null);
        setCurrentStep('widgets');
      }
    } else if (currentStep === 'widgets') {
      if (validateWidgets()) {
        setError(null);
        setCurrentStep('publish');
      }
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep === 'publish') setCurrentStep('widgets');
    else if (currentStep === 'widgets') setCurrentStep('basic-info');
  };

  const blobToDataUrl = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting blob to data URL:', error);
      return blobUrl;
    }
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true);
      setError(null);

      // Validate all steps before publishing
      if (!validateBasicInfo()) {
        setCurrentStep('basic-info');
        setSaving(false);
        return;
      }

      if (!validateWidgets()) {
        setCurrentStep('widgets');
        setSaving(false);
        return;
      }

      // Ensure we have an organization
      if (!currentOrganization?.id) {
        setError('No organization selected');
        setSaving(false);
        return;
      }

      // Convert blob URLs to compressed data URLs
      let photoDataUrl = null;
      let coverImageDataUrl = null;

      if (eventPhotos.coverImage?.startsWith('blob:')) {
        try {
          const response = await fetch(eventPhotos.coverImage);
          const blob = await response.blob();
          const compressedBlob = await compressImage(new File([blob], 'cover.jpg', { type: 'image/jpeg' }));
          coverImageDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(compressedBlob);
          });
        } catch (error) {
          console.error('Failed to convert cover image blob to data URL:', error);
        }
      }

      // Ensure dates are valid
      const startDate = new Date(basicInfo.startDate);
      if (isNaN(startDate.getTime())) {
        setError('Invalid start date');
        setCurrentStep('basic-info');
        setSaving(false);
        return;
      }

      let endDate: Date | undefined;
      if (basicInfo.endDate) {
        endDate = new Date(basicInfo.endDate);
        if (isNaN(endDate.getTime())) {
          setError('Invalid end date');
          setCurrentStep('basic-info');
          setSaving(false);
          return;
        }
      }

      // Log the dates for debugging
      console.log('Saving event with dates:', {
        startInput: basicInfo.startDate,
        startDate,
        endInput: basicInfo.endDate,
        endDate,
        startValid: !isNaN(startDate.getTime()),
        endValid: endDate ? !isNaN(endDate.getTime()) : true
      });

      const eventData: CreateEventData = {
        title: basicInfo.title.trim(),
        description: basicInfo.description.trim(),
        start: startDate,
        end: endDate,
        timezone: basicInfo.timezone,
        location: basicInfo.location,
        visibility: basicInfo.visibility,
        recurrence: basicInfo.recurrence ? {
          ...basicInfo.recurrence,
          endDate: basicInfo.recurrence.endDate ? new Date(basicInfo.recurrence.endDate) : undefined
        } : undefined,
        widgets: widgetConfig.widgets
          .filter(w => w.isEnabled)
          .map(w => {
            // Convert phoneNumber type to call
            if (w.type === 'phoneNumber') {
              return {
                ...w,
                type: 'call',
                config: {
                  useOrganizationPhone: w.config.useOrganizationPhone,
                  customPhone: w.config.customPhone,
                  organizationPhone: currentOrganization?.phoneNumber
                }
              };
            }
            // Clean up website widget
            if (w.type === 'website') {
              return {
                ...w,
                config: {
                  useOrganizationWebsite: w.config.useOrganizationWebsite,
                  customUrl: w.config.customUrl,
                  organizationWebsite: currentOrganization?.website
                }
              };
            }
            // Clean up message board widget
            if (w.type === 'messageBoard') {
              return {
                ...w,
                config: {
                  messages: w.config.messages || []
                }
              };
            }
            return w;
          }),
        organizationId: currentOrganization?.id || '',
        status: publish ? 'published' : 'draft',
        coverImage: coverImageDataUrl,
        logoImage: eventPhotos.logoImage,
      };

      let savedEvent: Event;
      if (event?.id) {
        savedEvent = await updateEvent(event.id, eventData);
      } else {
        savedEvent = await createEvent(eventData);
      }

      if (onSave) {
        onSave(savedEvent);
      } else {
        navigate(`/events/${savedEvent.id}`);
      }
    } catch (err) {
      console.error('Failed to save event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // If we have an ID but no event prop, find it in the events
  const currentEvent = event || (id ? events.find(e => e.id === id) : undefined);
  
  // If in view mode, show read-only version
  if (mode === 'view' && currentEvent) {
    // Debug the incoming dates
    console.log('Original event dates:', {
      start: currentEvent.start,
      end: currentEvent.end,
      startType: typeof currentEvent.start,
      endType: typeof currentEvent.end,
      isTimestamp: currentEvent.start && typeof currentEvent.start === 'object' && 'seconds' in currentEvent.start
    });

    // Ensure dates are properly formatted and handle potential invalid dates
    const formattedEvent = {
      ...currentEvent,
      start: (() => {
        if (!currentEvent.start) return new Date();
        if (typeof currentEvent.start === 'object' && 'seconds' in currentEvent.start) {
          return new Date(currentEvent.start.seconds * 1000);
        }
        if (currentEvent.start instanceof Date) {
          return currentEvent.start;
        }
        try {
          const date = new Date(currentEvent.start);
          return isNaN(date.getTime()) ? new Date() : date;
        } catch (e) {
          console.error('Error parsing start date:', e);
          return new Date();
        }
      })(),
      end: (() => {
        if (!currentEvent.end) return undefined;
        if (typeof currentEvent.end === 'object' && 'seconds' in currentEvent.end) {
          return new Date(currentEvent.end.seconds * 1000);
        }
        if (currentEvent.end instanceof Date) {
          return currentEvent.end;
        }
        try {
          const date = new Date(currentEvent.end);
          return isNaN(date.getTime()) ? undefined : date;
        } catch (e) {
          console.error('Error parsing end date:', e);
          return undefined;
        }
      })()
    };

    // Debug the formatted dates
    console.log('Formatted event dates:', {
      start: formattedEvent.start,
      end: formattedEvent.end,
      startType: typeof formattedEvent.start,
      endType: typeof formattedEvent.end,
      startIsValid: formattedEvent.start instanceof Date && !isNaN(formattedEvent.start.getTime()),
      endIsValid: formattedEvent.end instanceof Date && !isNaN(formattedEvent.end?.getTime())
    });

    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {formattedEvent.title}
          </h1>
          <button
            onClick={() => navigate(`/events/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Edit
          </button>
        </div>
        <EventPreview event={formattedEvent} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <nav className="flex justify-center overflow-x-auto">
          <ol className="flex items-center min-w-full sm:min-w-0">
            <li className="flex items-center">
              <div className="flex items-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  currentStep === 'basic-info' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  1
                </span>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === 'basic-info' ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  Basic Info
                </span>
              </div>
              <div className="mx-2 sm:mx-4 w-12 sm:w-24 border-t border-gray-300"></div>
            </li>

            <li className="flex items-center">
              <div className="flex items-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  currentStep === 'widgets' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  2
                </span>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === 'widgets' ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  Widgets
                </span>
              </div>
              <div className="mx-2 sm:mx-4 w-12 sm:w-24 border-t border-gray-300"></div>
            </li>

            <li className="flex items-center">
              <div className="flex items-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  currentStep === 'publish' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-gray-300 text-gray-500'
                }`}>
                  3
                </span>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === 'publish' ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  Publish
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {currentStep === 'basic-info' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium !text-gray-900 dark:!text-white">Basic Information</h2>
            <BasicInfoForm
              data={basicInfo}
              onChange={setBasicInfo}
            />
            
            <div className="mt-8">
              <div className="w-full">
                <ImageUpload
                  label="Event Cover Image"
                  currentImage={eventPhotos.coverImage}
                  onImageChange={handleCoverImageUpload}
                  isUploading={coverImageUploading}
                  aspectRatio="cover"
                  className="h-64"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'widgets' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium !text-gray-900 dark:!text-white">Configure Widgets</h2>
            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Available Widgets</h3>
                <WidgetSelector
                  selectedWidgets={widgetConfig.widgets}
                  onWidgetsChange={(widgets) => setWidgetConfig({ widgets })}
                />
              </div>

              {widgetConfig.widgets.some(w => ['messageBoard', 'website', 'phoneNumber', 'call'].includes(w.type)) && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Widget Configuration</h3>
                  <div className="space-y-6">
                    {widgetConfig.widgets
                      .filter(w => ['messageBoard', 'website', 'phoneNumber', 'call'].includes(w.type))
                      .map((widget) => (
                        <div key={widget.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                            {widget.type === 'messageBoard' ? 'Message Board' :
                             widget.type === 'website' ? 'Website' :
                             widget.type === 'phoneNumber' || widget.type === 'call' ? 'Phone Number' :
                             'Phone Number'}
                          </h4>
                          {(widget.type === 'website') && (
                            <div className="space-y-4">
                              {currentOrganization?.website && (
                                <div>
                                  <select
                                    id={`${widget.id}-website-type`}
                                    value={widget.config.useOrganizationWebsite ? 'organization' : 'custom'}
                                    onChange={(e) => {
                                      const useOrg = e.target.value === 'organization';
                                      const updatedWidgets = widgetConfig.widgets.map(w =>
                                        w.id === widget.id
                                          ? { ...w, config: { ...w.config, useOrganizationWebsite: useOrg } }
                                          : w
                                      );
                                      setWidgetConfig({ widgets: updatedWidgets });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                                  >
                                    <option value="organization">Use Organization Website</option>
                                    <option value="custom">Use Custom Website</option>
                                  </select>
                                </div>
                              )}
                              {(!widget.config.useOrganizationWebsite || !currentOrganization?.website) && (
                                <div>
                                  <input
                                    type="url"
                                    id={`${widget.id}-custom-url`}
                                    value={widget.config.customUrl || ''}
                                    onChange={(e) => {
                                      const updatedWidgets = widgetConfig.widgets.map(w =>
                                        w.id === widget.id
                                          ? { 
                                              ...w, 
                                              config: { 
                                                ...w.config, 
                                                customUrl: e.target.value,
                                                useOrganizationWebsite: false // Force this to false when entering custom URL
                                              } 
                                            }
                                          : w
                                      );
                                      setWidgetConfig({ widgets: updatedWidgets });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                                    placeholder="https://"
                                    required={widget.isEnabled}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {(widget.type === 'phoneNumber' || widget.type === 'call') && (
                            <div className="space-y-4">
                              {currentOrganization?.phoneNumber && (
                                <div>
                                  <select
                                    id={`${widget.id}-phone-type`}
                                    value={widget.config.useOrganizationPhone ? 'organization' : 'custom'}
                                    onChange={(e) => {
                                      const useOrg = e.target.value === 'organization';
                                      const updatedWidgets = widgetConfig.widgets.map(w =>
                                        w.id === widget.id
                                          ? { ...w, config: { ...w.config, useOrganizationPhone: useOrg } }
                                          : w
                                      );
                                      setWidgetConfig({ widgets: updatedWidgets });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                                  >
                                    <option value="organization">Use Organization Phone Number</option>
                                    <option value="custom">Use Custom Phone Number</option>
                                  </select>
                                </div>
                              )}
                              {(!widget.config.useOrganizationPhone || !currentOrganization?.phoneNumber) && (
                                <div>
                                  <input
                                    type="tel"
                                    id={`${widget.id}-custom-phone`}
                                    value={widget.config.customPhone || ''}
                                    onChange={(e) => {
                                      const updatedWidgets = widgetConfig.widgets.map(w =>
                                        w.id === widget.id
                                          ? { ...w, config: { ...w.config, customPhone: e.target.value } }
                                          : w
                                      );
                                      setWidgetConfig({ widgets: updatedWidgets });
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                                    placeholder="+1234567890"
                                    required={widget.isEnabled}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {widget.type === 'messageBoard' && (
                            <div className="space-y-4">
                              {widget.config.messages?.map((message: any, index: number) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  <div className="flex-1">
                                    <p className="text-sm text-gray-900 dark:text-gray-100">{message.content}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {new Date(message.timestamp).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div className="flex space-x-3">
                                <textarea
                                  placeholder="Add a message..."
                                  value={widget.config.newMessage || ''}
                                  onChange={(e) => {
                                    const updatedWidgets = widgetConfig.widgets.map(w =>
                                      w.id === widget.id
                                        ? { ...w, config: { ...w.config, newMessage: e.target.value } }
                                        : w
                                    );
                                    setWidgetConfig({ widgets: updatedWidgets });
                                  }}
                                  rows={1}
                                  style={{ minHeight: '42px', resize: 'vertical' }}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!widget.config.newMessage?.trim()) return;
                                    
                                    const newMessage = {
                                      content: widget.config.newMessage.trim(),
                                      timestamp: new Date().toISOString(),
                                      creatorId: currentOrganization?.id
                                    };
                                    
                                    const updatedWidgets = widgetConfig.widgets.map(w =>
                                      w.id === widget.id
                                        ? {
                                            ...w,
                                            config: {
                                              ...w.config,
                                              messages: [...(w.config.messages || []), newMessage],
                                              newMessage: ''
                                            }
                                          }
                                        : w
                                    );
                                    setWidgetConfig({ widgets: updatedWidgets });
                                  }}
                                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                    ))}
                  </div>
                </div>
              )}
              </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 'publish' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium !text-gray-900 dark:!text-white">Review & Publish</h2>
            
            <div className="space-y-8">
              {/* Event Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden p-6">
                <EventPreview
                  event={{
                    id: event?.id || '',
                    title: basicInfo.title,
                    description: basicInfo.description,
                    start: basicInfo.startDate,
                    end: basicInfo.endDate,
                    timezone: basicInfo.timezone,
                    location: basicInfo.location,
                    visibility: basicInfo.visibility,
                    recurrence: basicInfo.recurrence,
                    widgets: widgetConfig.widgets.filter(w => w.isEnabled),
                    createdAt: event?.createdAt || new Date(),
                    updatedAt: new Date(),
                    organizationId: currentOrganization?.id || '',
                    owner: event?.owner || '',
                    status: event?.status || 'draft',
                    source: event?.source || 'events',
                    coverImage: eventPhotos.coverImage,
                    logoImage: eventPhotos.logoImage,
                    isPublic: basicInfo.visibility === 'public',
                    isDiscoverable: basicInfo.visibility === 'public',
                    attendees: [],
                    accepted: [],
                    declined: [],
                    undecided: [],
                  }}
                  isPreview={true}
                  hideMembers={true}
                  hideImages={false}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                disabled={saving}
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 