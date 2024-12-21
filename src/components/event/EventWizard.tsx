import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../../contexts/EventContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Event, CreateEventData, EventVisibility, LocationType } from '../../types/event';

type WizardStep = 'basic-info' | 'widgets' | 'publish';

interface EventWizardProps {
  event?: Event;
  onSave?: (event: Event) => void;
}

export default function EventWizard({ event, onSave }: EventWizardProps) {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const { createEvent, updateEvent, publishEvent, saveDraft } = useEvent();

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<CreateEventData>({
    title: event?.title || '',
    description: event?.description || '',
    location: event?.location || {
      type: 'fixed' as LocationType,
      name: '',
    },
    startDate: event?.startDate || new Date(),
    endDate: event?.endDate || new Date(),
    timezone: event?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    visibility: event?.visibility || 'organization' as EventVisibility,
    status: event?.status || 'draft',
    widgets: event?.widgets || [],
    organizationId: event?.organizationId || currentOrganization?.id || '',
    owner: event?.owner || '',
  });

  useEffect(() => {
    // Auto-save draft every 30 seconds if editing an existing event
    if (!event?.id) return;

    const interval = setInterval(async () => {
      try {
        await saveDraft(event.id, state);
      } catch (err) {
        console.error('Failed to auto-save draft:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [event?.id, state, saveDraft]);

  const handleChange = (field: keyof CreateEventData, value: any) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 'basic-info') setCurrentStep('widgets');
    else if (currentStep === 'widgets') setCurrentStep('publish');
  };

  const handleBack = () => {
    if (currentStep === 'publish') setCurrentStep('widgets');
    else if (currentStep === 'widgets') setCurrentStep('basic-info');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      let savedEvent: Event;
      if (event?.id) {
        savedEvent = await updateEvent(event.id, state);
      } else {
        savedEvent = await createEvent(state);
      }

      if (onSave) {
        onSave(savedEvent);
      } else {
        navigate(`/events/${savedEvent.id}/edit`);
      }
    } catch (err) {
      console.error('Failed to save event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!event?.id) {
      setError('Please save the event before publishing.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const publishedEvent = await publishEvent(event.id);
      if (onSave) {
        onSave(publishedEvent);
      } else {
        navigate(`/events/${publishedEvent.id}`);
      }
    } catch (err) {
      console.error('Failed to publish event:', err);
      setError('Failed to publish event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
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
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {currentStep === 'basic-info' && (
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={state.title}
              onChange={(e) => handleChange('title', e.target.value)}
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
              value={state.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Start Date *
              </label>
              <input
                type="datetime-local"
                id="startDate"
                value={state.startDate.toISOString().slice(0, 16)}
                onChange={(e) => handleChange('startDate', new Date(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date *
              </label>
              <input
                type="datetime-local"
                id="endDate"
                value={state.endDate.toISOString().slice(0, 16)}
                onChange={(e) => handleChange('endDate', new Date(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Visibility *
            </label>
            <select
              id="visibility"
              value={state.visibility}
              onChange={(e) => handleChange('visibility', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="public">Public</option>
              <option value="organization">Organization Only</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      )}

      {currentStep === 'widgets' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-yellow-700">Widget selection coming soon...</p>
          </div>
        </div>
      )}

      {currentStep === 'publish' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Review Event Details</h3>
            
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{state.title}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{state.description || 'No description'}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {state.startDate.toLocaleString()} - {state.endDate.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{state.visibility}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 'basic-info'}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          {currentStep === 'publish' ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 