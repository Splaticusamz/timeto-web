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
import { useState, useEffect } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { EventMembers } from './EventMembers';
import { useMember } from '../../contexts/MemberContext';

interface EventPreviewProps {
  event: Event;
  isEditMode?: boolean;
}

function AttendeeAvatar({ member }: { member: Member }) {
  return (
    <div className="relative group cursor-pointer">
      <div className="h-8 w-8 transition-transform group-hover:scale-110">
        {member.photoUrl ? (
          <img 
            src={member.photoUrl} 
            alt={`${member.firstName} ${member.lastName}`}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {member.firstName ? member.firstName[0].toUpperCase() : '?'}
            </span>
          </div>
        )}

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap invisible group-hover:visible transition-all">
          {member.firstName || member.lastName ? 
            `${member.firstName} ${member.lastName}`.trim() : 
            'Unknown Member'}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventPreview({ event, isEditMode = false }: EventPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const { updateEvent } = useEvent();
  const { registeredMembers, loadMembers } = useMember();
  
  // Load members when component mounts
  useEffect(() => {
    loadMembers(event.id);
  }, [event.id, loadMembers]);

  // Helper function to get member data
  const getMemberData = (memberId: string) => {
    const member = registeredMembers.find(m => m.id === memberId);
    console.log('Getting member data:', { memberId, found: !!member, member });
    return member || {
      id: memberId,
      type: 'member' as const,
      firstName: '',
      lastName: '',
      phoneNumber: '',
      status: 'accepted' as const,
      organizations: [],
      photoUrl: ''
    };
  };

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
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
          value ? (
            <div className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${
              field === 'coverImage' ? 'h-64 w-full' : 'h-32 w-32'
            }`}>
              <img
                src={value}
                alt={label}
                className="h-full w-full object-cover"
              />
              {isEditMode && (
                <button
                  onClick={() => setEditingField(field)}
                  className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <PencilIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </button>
              )}
            </div>
          ) : isEditMode ? (
            <button
              onClick={() => setEditingField(field)}
              className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500"
            >
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </button>
          ) : null
        )}
      </dd>
    </div>
  );

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
      return 'Invalid Date';
    }
  };

  type WidgetType = Widget['type'];
  
  const getWidgetIcon = (type: Widget['type'], isEnabled: boolean) => {
    const icons: Record<string, typeof CloudIcon> = {
      description: InformationCircleIcon,
      weather: CloudIcon,
      location: MapPinIcon,
      website: GlobeAltIcon,
      phoneNumber: PhoneIcon,
      photos: PhotoIcon,
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

  const getWidgetName = (type: Widget['type']) => {
    const names: Record<string, string> = {
      description: 'Description',
      weather: 'Weather',
      location: 'Location',
      website: 'Website',
      phoneNumber: 'Phone',
      photos: 'Photos',
      messageBoard: 'Message Board',
      comments: 'Comments',
      quickInfo: 'Quick Info',
      call: 'Call',
    };
    
    return names[type] || type;
  };

  const getWidgetStatus = (widgetType: Widget['type']) => {
    // Check if the widget type exists in the event widgets array
    return event.widgets?.some(widget => 
      typeof widget === 'object' && widget.type === widgetType
    );
  };

  // Keep the exact names from the database for the enabled widgets
  const availableWidgets: Widget['type'][] = [
    'description',
    'weather',
    'location',
    'photos',
    'website',
    'phoneNumber',
    'messageBoard',
    'comments',
    'quickInfo',
    'call',
  ];

  const renderAttendees = () => {
    // Get attendees from event document
    const attendeesList = Array.isArray(event?.attendees) ? event.attendees : [];
    const acceptedList = Array.isArray(event?.accepted) ? event.accepted : [];
    const declinedList = Array.isArray(event?.declined) ? event.declined : [];
    const undecidedList = Array.isArray(event?.undecided) ? event.undecided : [];

    // Debug logs
    console.log('Raw event data:', event);
    console.log('Event attendees arrays:', {
      attendeesList,
      acceptedList,
      declinedList,
      undecidedList
    });

    // Get member details for each attendee
    const attendeeMembers = attendeesList.map(id => registeredMembers.find(m => m.id === id)).filter(Boolean);
    const acceptedMembers = acceptedList.map(id => registeredMembers.find(m => m.id === id)).filter(Boolean);
    const undecidedMembers = undecidedList.map(id => registeredMembers.find(m => m.id === id)).filter(Boolean);

    console.log('Mapped member details:', {
      attendeeMembers,
      acceptedMembers,
      undecidedMembers
    });

    return (
      <div>
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Attendees
        </dt>
        <dd className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-4">
            {/* Accepted attendees */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                <span>Attending</span>
                <span className="text-xs text-gray-500">({acceptedList.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {acceptedList.map((attendeeId) => (
                  <AttendeeAvatar key={attendeeId} member={getMemberData(attendeeId)} />
                ))}
              </div>
            </div>

            {/* Maybe/Undecided attendees */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                <span>Maybe</span>
                <span className="text-xs text-gray-500">({undecidedList.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {undecidedList.map((attendeeId) => (
                  <AttendeeAvatar key={attendeeId} member={getMemberData(attendeeId)} />
                ))}
              </div>
            </div>

            {/* Pending attendees */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                <span>Pending</span>
                <span className="text-xs text-gray-500">({attendeesList.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {attendeesList.map((attendeeId) => (
                  <AttendeeAvatar key={attendeeId} member={getMemberData(attendeeId)} />
                ))}
              </div>
            </div>

            {/* Declined attendees */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                <span>Declined</span>
                <span className="text-xs text-gray-500">({declinedList.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {declinedList.map((attendeeId) => (
                  <AttendeeAvatar key={attendeeId} member={getMemberData(attendeeId)} />
                ))}
              </div>
            </div>
          </div>

          {(!attendeesList.length && !acceptedList.length && 
            !declinedList.length && !undecidedList.length) && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              No attendees yet
            </span>
          )}
        </dd>
      </div>
    );
  };

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
            {renderAttendees()}
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
            const isEnabled = getWidgetStatus(widgetType);
            console.log('Widget Render:', {
              widgetType,
              isEnabled,
              widgetsList: availableWidgets
            });
            
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

      {/* Members Section */}
      <div className="border-t pt-6">
        <EventMembers eventId={event.id} />
      </div>
    </div>
  );
} 