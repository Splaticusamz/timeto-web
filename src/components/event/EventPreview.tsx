import { format } from 'date-fns';
import { Event, Widget, LocationType } from '../../types/event';
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
} from '@heroicons/react/24/outline';

interface EventPreviewProps {
  event: Event;
}

export function EventPreview({ event }: EventPreviewProps) {
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
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {event.description}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDateOnly(event.start)}
                {event.end && event.start && 
                 formatDateOnly(event.start) !== formatDateOnly(event.end) && (
                  <>
                    {' '}to{' '}
                    {formatDateOnly(event.end)}
                  </>
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Time
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatTime(event.start)}
                {event.end && (
                  <>
                    {' '}to{' '}
                    {formatTime(event.end)}
                  </>
                )}
                {' '}({event.timezone})
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Recurrence
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatRecurrence()}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                Location
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatLocation()}
              </dd>
            </div>

            {/* Phone Number - moved here */}
            {event.phoneNumber && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <a 
                    href={`tel:${event.phoneNumber}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {event.phoneNumber}
                  </a>
                </dd>
              </div>
            )}

            {/* Website - moved here */}
            {event.website && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  Website
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  <a 
                    href={event.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {event.website}
                  </a>
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <UserGroupIcon className="h-4 w-4 mr-1" />
                Visibility
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {event.visibility === 'organization' ? 'Organization Members' : 'Invite Only'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Right column - Images */}
        <div className="space-y-6">
          {/* Event Image */}
          {event.coverImage && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">
                Event Image
              </h3>
              <div className="relative h-64 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <img 
                  src={event.coverImage} 
                  alt="Event cover"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Organization Logo */}
          {event.logoImage && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-gray-700 mb-4">
                Organization
              </h3>
              <div className="w-32 h-32 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <img 
                  src={event.logoImage} 
                  alt="Event logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
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