import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../../contexts/EventContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Event, CreateEventData, EventVisibility, LocationType, Widget, EventLocation, RecurrenceRule } from '../../types/event';
import { BasicInfoForm } from './BasicInfoForm';
import { WidgetSelector } from './widgets/WidgetSelector';
import { WidgetConfigForm } from './WidgetConfigForm';
import { EventPreview } from './EventPreview';

type WizardStep = 'basic-info' | 'widgets' | 'publish';

interface EventWizardProps {
  event?: Event;
  onSave?: (event: Event) => void;
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

export function EventWizard({ event, onSave }: EventWizardProps) {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const { createEvent, updateEvent, saveDraft } = useEvent();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | null>(null);

  const [basicInfo, setBasicInfo] = useState<BasicInfoFormData>({
    title: event?.title || '',
    description: event?.description || '',
    startDate: event?.startDate || new Date(),
    endDate: event?.endDate,
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
        ...basicInfo,
        ...widgetConfig,
        organizationId: currentOrganization?.id || '',
        status: publish ? 'published' : 'draft',
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
                  {widgetConfig.widgets.map((widget) => (
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
                startDate: basicInfo.startDate,
                endDate: basicInfo.endDate,
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