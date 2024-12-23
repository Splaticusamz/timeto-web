import { format } from 'date-fns';
import { Event, Widget, LocationType, EventLocation } from '../../types/event';
import { getWidgetDefinition } from './widgets/WidgetRegistry';
import { 
  PhoneIcon, 
  GlobeAltIcon, 
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CloudIcon,
  UsersIcon,
  PhotoIcon,
  ChatBubbleLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useEvent } from '../../contexts/EventContext';

interface EventPreviewProps {
  event: Event;
  isEditMode?: boolean;
}

export function EventPreview({ event, isEditMode = false }: EventPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const { updateEvent } = useEvent();

  const EditButton = ({ field }: { field: string }) => (
    <button
      onClick={() => setEditingField(field)}
      className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  );

  const renderField = (field: string, value: string, label: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {label}
        {isEditMode && editingField !== field && <EditButton field={field} />}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                // Handle change
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
            />
            <button
              onClick={() => {
                setEditingField(null);
              }}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          value
        )}
      </dd>
    </div>
  );

  const renderTextField = (field: string, value: string, label: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {label}
        {isEditMode && editingField !== field && <EditButton field={field} />}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            {field === 'description' ? (
              <textarea
                value={value}
                rows={4}
                onChange={(e) => {
                  // Handle change
                }}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  // Handle change
                }}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
              />
            )}
            <button
              onClick={() => {
                setEditingField(null);
              }}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className={field === 'description' ? 'whitespace-pre-wrap' : ''}>
            {value}
          </div>
        )}
      </dd>
    </div>
  );

  const renderDateField = (field: string, value: Date, label: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {label}
        {isEditMode && editingField !== field && <EditButton field={field} />}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={value.toISOString().split('T')[0]}
              onChange={(e) => {
                // Handle change
              }}
              className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
            />
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          formatDateOnly(value)
        )}
      </dd>
    </div>
  );

  const renderTimeField = (field: string, value: Date, label: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {label}
        {isEditMode && editingField !== field && <EditButton field={field} />}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <input
              type="time"
              value={format(value, 'HH:mm')}
              onChange={(e) => {
                // Handle change
              }}
              className="block rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
            />
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          formatTime(value)
        )}
      </dd>
    </div>
  );

  const renderDropdownField = (
    field: string, 
    value: string, 
    label: string, 
    options: { label: string; value: string }[]
  ) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {label}
        {isEditMode && editingField !== field && <EditButton field={field} />}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <select
              value={value}
              onChange={(e) => {
                // Handle change
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          options.find(o => o.value === value)?.label || value
        )}
      </dd>
    </div>
  );

  const renderLocationField = (field: string, value: EventLocation, label: string) => (
    <div>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
        {label}
        {isEditMode && editingField !== field && <EditButton field={field} />}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={value.address || ''}
              onChange={(e) => {
                // Handle change
              }}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-2 py-2"
            />
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          formatLocation()
        )}
      </dd>
    </div>
  );

  const renderImageField = (field: string, value: string | undefined, label: string) => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">
        {label}
      </h3>
      <dd className="mt-1">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                // Handle image upload
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
            >
              Save
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          value && (
            <div className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${
              field === 'coverImage' ? 'h-64 w-full' : 'h-32 w-32'
            }`}>
              <img
                src={value}
                alt={label}
                className="h-full w-full object-cover"
              />
            </div>
          )
        )}
      </dd>
    </div>
  );

  console.log('Full event data:', JSON.stringify(event, null, 2));

  console.log('Event data in preview:', {
    photo: event.photo,
    widgets: event.widgets,
    fullEvent: event
  });

  const formatLocation = () => {
    switch (event.location.type) {
      case 'virtual':
        return 'Virtual Event';
      case 'multiple':
        return `Multiple Locations: ${event.location.multipleLocations?.join(', ')}`;
      case 'fixed':
        return event.location.address || 'Location TBD';
      case 'tbd':
        return 'Location TBD';
      default:
        return event.location.address || 'Location not specified';
    }
  };

  const formatRecurrence = () => {
    if (!event.recurrence) return 'One-time event';

    const { frequency, interval } = event.recurrence;
    const intervalText = interval > 1 ? `${interval} ` : '';
    const frequencyText = frequency === 'daily' ? 'days' :
                         frequency === 'weekly' ? 'weeks' :
                         'months';

    return `Repeats every ${intervalText}${frequencyText}`;
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, 'h:mm a');
    } catch (e) {
      console.error('Error formatting time:', e);
      return 'Invalid Date';
    }
  };

  const formatDateOnly = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return format(dateObj, 'MMMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  type WidgetType = Widget['type'];
  
  const getWidgetIcon = (type: Widget['type'], isEnabled: boolean) => {
    const icons: Record<Widget['type'], typeof CloudIcon> = {
      weather: CloudIcon,
      location: MapPinIcon,
      attendees: UsersIcon,
      photos: PhotoIcon,
      website: GlobeAltIcon,
      messageBoard: ChatBubbleLeftIcon,
      comments: ChatBubbleBottomCenterTextIcon,
      quickInfo: InformationCircleIcon,
      call: PhoneIcon,
    };
    
    const Icon = icons[type] || QuestionMarkCircleIcon;
    return <Icon className={`h-6 w-6 mr-3 ${
      isEnabled
        ? 'text-green-700 dark:text-green-300'
        : 'text-red-700 dark:text-red-300'
    }`} />;
  };

  const getWidgetName = (type: WidgetType) => {
    const names: Record<WidgetType, string> = {
      weather: 'Weather',
      location: 'Location',
      attendees: 'Attendees',
      photos: 'Photos/Media',
      website: 'Website',
      messageBoard: 'Message Board',
      comments: 'Comments',
      quickInfo: 'Quick Info',
      call: 'Call',
    };
    
    return names[type] || type;
  };

  const availableWidgets: Widget['type'][] = [
    'weather',
    'location',
    'attendees',
    'photos',
    'website',
    'messageBoard',
    'comments',
    'quickInfo',
    'call',
  ];

  return (
    <div className="space-y-6">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column - Event Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-gray-700">
            Event Details
          </h3>
          <dl className="mt-4 space-y-4">
            {renderTextField('title', event.title, 'Title')}
            {renderTextField('description', event.description, 'Description')}
            {renderDateField('date', event.start, 'Date')}
            {renderTimeField('time', event.start, 'Time')}
            {renderDropdownField('recurrence', 
              event.recurrence?.frequency || 'none', 
              'Recurrence',
              [
                { label: 'One-time event', value: 'none' },
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' }
              ]
            )}
            {renderLocationField('location', event.location, 'Location')}
            {event.phoneNumber && renderTextField('phoneNumber', event.phoneNumber, 'Phone')}
            {event.website && renderTextField('website', event.website, 'Website')}
            {renderDropdownField('visibility',
              event.visibility,
              'Visibility',
              [
                { label: 'Organization Members', value: 'organization' },
                { label: 'Invite Only', value: 'invite-only' },
                { label: 'Public', value: 'public' }
              ]
            )}
          </dl>
        </div>

        {/* Right column - Images */}
        <div className="space-y-6">
          {renderImageField('coverImage', event.coverImage, 'Event Image')}
          {renderImageField('logoImage', event.logoImage, 'Organization Logo')}
        </div>
      </div>

      {/* Widgets */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Widgets</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          {availableWidgets.map(widgetType => {
            const widget = event.widgets.find(w => w.type === widgetType);
            const isEnabled = widget?.isEnabled ?? false;
            
            return (
              <div 
                key={widgetType}
                className={`flex items-center p-4 rounded-lg border ${
                  isEnabled 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                {getWidgetIcon(widgetType, isEnabled)}
                <div>
                  <span className={`text-sm font-medium ${
                    isEnabled
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {getWidgetName(widgetType)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 