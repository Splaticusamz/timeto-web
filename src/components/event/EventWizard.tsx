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
    endDate: event?.end,
    timezone: event?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: event?.location || {
      type: 'fixed' as LocationType,
      address: '',
    },
    visibility: event?.visibility || 'organization',
    recurrence: event?.recurrence,
  });

  const [widgetConfig, setWidgetConfig] = useState<WidgetFormData>({
    widgets: event?.widgets || [],
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

  const validateBasicInfo = (): boolean => {
    if (!basicInfo.title || !basicInfo.startDate || !basicInfo.location) {
      setError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateWidgets = (): boolean => {
    // At least one widget should be enabled
    if (!widgetConfig.widgets.some(w => w.isEnabled)) {
      setError('Please enable at least one widget');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 'basic-info') {
      if (validateBasicInfo()) {
        setCurrentStep('widgets');
      }
    } else if (currentStep === 'widgets') {
      if (validateWidgets()) {
        setCurrentStep('publish');
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 'publish') setCurrentStep('widgets');
    else if (currentStep === 'widgets') setCurrentStep('basic-info');
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true);
      setError(null);

      if (!validateBasicInfo() || !validateWidgets()) {
        return;
      }

      const eventData: CreateEventData = {
        title: basicInfo.title,
        description: basicInfo.description,
        start: basicInfo.startDate,
        end: basicInfo.endDate,
        timezone: basicInfo.timezone,
        location: basicInfo.location,
        visibility: basicInfo.visibility,
        recurrence: basicInfo.recurrence,
        widgets: widgetConfig.widgets,
        organizationId: currentOrganization?.id || '',
        status: publish ? 'published' : 'draft',
        photo: event?.photo,
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
      endType: typeof currentEvent.end
    });

    // Ensure dates are properly formatted and handle potential invalid dates
    const formattedEvent = {
      ...currentEvent,
      start: (() => {
        try {
          const date = currentEvent.start instanceof Date 
            ? currentEvent.start 
            : new Date(currentEvent.start);
          // Check if date is valid
          return isNaN(date.getTime()) ? new Date() : date;
        } catch (e) {
          console.error('Error parsing start date:', e);
          return new Date();
        }
      })(),
      end: (() => {
        if (!currentEvent.end) return undefined;
        try {
          const date = currentEvent.end instanceof Date 
            ? currentEvent.end 
            : new Date(currentEvent.end);
          // Check if date is valid
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
        <nav className="flex justify-center">
          <ol className="flex items-center space-x-4">
            <li className={`flex items-center ${currentStep === 'basic-info' ? 'text-primary-600' : 'text-gray-500'}`}>
              <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium">1. Basic Info</span>
            </li>
            <li className="flex-shrink-0">→</li>
            <li className={`flex items-center ${currentStep === 'widgets' ? 'text-primary-600' : 'text-gray-500'}`}>
              <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium">2. Widgets</span>
            </li>
            <li className="flex-shrink-0">→</li>
            <li className={`flex items-center ${currentStep === 'publish' ? 'text-primary-600' : 'text-gray-500'}`}>
              <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium">3. Publish</span>
            </li>
          </ol>
        </nav>
        <div className="mt-4 flex items-center justify-center space-x-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-3 py-1 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-md hover:bg-primary-50"
            disabled={saving}
          >
            Save Draft
          </button>
          {draftStatus && (
            <span className="text-sm text-gray-500">
              {draftStatus === 'saving' ? 'Saving...' : 'Saved'}
            </span>
          )}
        </div>
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
              <PhotoUpload 
                photo={event?.photo}
                onPhotoChange={(photo) => {
                  if (event) {
                    updateEvent(event.id, {
                      ...event,
                      photo,
                    });
                  }
                }}
              />
            </div>
          </div>
        )}

        {currentStep === 'widgets' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium !text-gray-900 dark:!text-white">Configure Widgets</h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <WidgetSelector
                  selectedWidgets={widgetConfig.widgets}
                  onWidgetsChange={(widgets) => setWidgetConfig({ widgets })}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="space-y-8">
                  {widgetConfig.widgets.filter(w => w.isEnabled).map((widget) => (
                    <WidgetConfigForm
                      key={widget.id}
                      widget={widget}
                      onChange={(updatedWidget) => {
                        setWidgetConfig({
                          widgets: widgetConfig.widgets.map((w) =>
                            w.id === updatedWidget.id ? updatedWidget : w
                          ),
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'publish' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium !text-gray-900 dark:!text-white">Review & Publish</h2>
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
                widgets: widgetConfig.widgets,
                createdAt: event?.createdAt || new Date(),
                updatedAt: new Date(),
                organizationId: currentOrganization?.id || '',
                owner: event?.owner || '',
                status: event?.status || 'draft',
                source: event?.source || 'events',
                photo: event?.photo,
                coverImage: event?.coverImage,
                logoImage: event?.logoImage,
              }}
            />
          </div>
        )}

        <div className="mt-6 flex justify-between">
          {currentStep !== 'basic-info' && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          )}
          <div className="flex space-x-3">
            {currentStep !== 'publish' ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                disabled={saving}
              >
                Next
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-md hover:bg-primary-50"
                  disabled={saving}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  disabled={saving}
                >
                  Publish
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 