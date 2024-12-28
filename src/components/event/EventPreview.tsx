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
  isPreview?: boolean;
}

function AttendeeAvatar({ member: { id } }: { member: { id: string } }) {
  const { registeredMembers } = useMember();
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    const loadMember = async () => {
      try {
        const foundMember = registeredMembers.find(m => m.id === id);
        if (foundMember) {
          setMember(foundMember);
        } else {
          // Fallback to showing first character of ID if member not found
          setMember({ firstName: id.charAt(0).toUpperCase(), lastName: '' });
        }
      } catch (error) {
        console.error('Failed to load member:', error);
        setMember({ firstName: id.charAt(0).toUpperCase(), lastName: '' });
      }
    };
    loadMember();
  }, [id, registeredMembers]);

  if (!member) {
    return (
      <div className="relative group cursor-pointer">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">?</span>
        </div>
      </div>
    );
  }

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
              {member.lastName ? member.lastName[0].toUpperCase() : ''}
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

export function EventPreview({ event, isPreview = false }: EventPreviewProps) {
  const formatLocation = () => {
    switch (event.location.type) {
      case 'organization':
        return 'Organization Location';
      case 'virtual':
        return 'Virtual Event';
      case 'hybrid':
        return `Hybrid: ${event.location.address} & Virtual`;
      case 'fixed':
        return event.location.address || 'Location TBD';
      default:
        return event.location.address || 'Location not specified';
    }
  };

  const formatDate = (date: Date | string | { seconds: number; nanoseconds: number } | undefined, formatStr: string): string => {
    if (!date) return 'Not specified';
    try {
      // Log the raw input
      console.log('Raw date input:', {
        date,
        type: typeof date,
        isDate: date instanceof Date,
        isTimestamp: typeof date === 'object' && 'seconds' in date,
        dateValue: date instanceof Date ? date.toISOString() : date
      });
      
      let dateObj: Date;
      
      // Handle Firestore Timestamp
      if (typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
        dateObj = new Date(date.seconds * 1000);
        console.log('Converted Timestamp to Date:', dateObj.toISOString());
      }
      // Handle Date object
      else if (date instanceof Date) {
        dateObj = date;
        console.log('Using existing Date object:', dateObj.toISOString());
      }
      // Handle string
      else if (typeof date === 'string') {
        dateObj = new Date(date);
        console.log('Converted string to Date:', dateObj.toISOString());
      }
      // Handle unknown format
      else {
        console.error('Unhandled date format:', date);
        return 'Invalid date format';
      }

      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', { input: date, converted: dateObj });
        return 'Invalid date';
      }

      const formatted = format(dateObj, formatStr);
      console.log('Successfully formatted date:', formatted);
      return formatted;
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const getWidgetIcon = (type: string) => {
    const icons: Record<string, any> = {
      photos: PhotoIcon,
      location: MapPinIcon,
      messageBoard: ChatBubbleLeftIcon,
      comments: ChatBubbleBottomCenterTextIcon,
      quickInfo: InformationCircleIcon,
      weather: CloudIcon,
      website: GlobeAltIcon,
      call: PhoneIcon,
    };
    return icons[type] || null;
  };

  // For debugging
  console.log('Event data:', {
    start: event.start,
    type: typeof event.start,
    isTimestamp: typeof event.start === 'object' && 'seconds' in event.start
  });

  return (
    <div className="space-y-8">
      {/* Images section at the top */}
      <div className="flex gap-4">
        <div className="w-64 flex-shrink-0">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Event Photo</h4>
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-black/10 dark:bg-white/10">
              {event.photo ? (
                <img
                  src={event.photo}
                  alt="Event Photo"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span className="text-sm">No photo uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover Image</h4>
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-black/10 dark:bg-white/10">
              {event.coverImage ? (
                <img
                  src={event.coverImage}
                  alt="Event Cover"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span className="text-sm">No cover image uploaded</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Event Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Event Details</h3>
            <dl className="mt-4 space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{event.title}</dd>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{event.description}</dd>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(event.start, 'MMMM d, yyyy')}
                </dd>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Time</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(event.start, 'h:mm a')}
                </dd>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">End Time</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(event.end, 'h:mm a')}
                </dd>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatLocation()}
                </dd>
              </div>
              {event.recurrence && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recurrence</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {event.recurrence.frequency === 'daily' ? 'Daily' :
                     event.recurrence.frequency === 'weekly' ? 'Weekly' :
                     'Monthly'} (every {event.recurrence.interval} {event.recurrence.frequency === 'daily' ? 'days' :
                                                                   event.recurrence.frequency === 'weekly' ? 'weeks' :
                                                                   'months'})
                  </dd>
                </div>
              )}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {event.visibility === 'organization' ? 'Organization Members' :
                   event.visibility === 'invite-only' ? 'Invite Only' :
                   'Public'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Widgets and Attendees Column */}
        <div className="space-y-6">
          {/* Widgets Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Widgets</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                'photos',
                'location',
                'messageBoard',
                'comments',
                'quickInfo',
                'weather',
                'website',
                'call'
              ].map((widgetType) => {
                const widget = Array.isArray(event.widgets) && event.widgets.find(w => w.type === widgetType);
                const isEnabled = widget?.isEnabled ?? false;
                const Icon = getWidgetIcon(widgetType);

                return (
                  <div
                    key={widgetType}
                    className={`h-[72px] p-4 rounded-lg border flex items-center justify-between ${
                      isEnabled
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {Icon && (
                        <Icon 
                          className={`h-5 w-5 ${
                            isEnabled
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        />
                      )}
                      <h4 className={`text-sm font-medium ${
                        isEnabled
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {widgetType === 'messageBoard' ? 'Message Board' :
                         widgetType === 'quickInfo' ? 'Quick Info' :
                         widgetType.charAt(0).toUpperCase() + widgetType.slice(1)}
                      </h4>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${
                      isEnabled
                        ? 'bg-green-500 dark:bg-green-400'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendees Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Attendees</h3>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                {/* Accepted attendees */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span>Attending</span>
                    <span className="text-xs text-gray-500">({event.accepted?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.accepted?.length > 0 ? (
                      event.accepted.map((memberId) => (
                        <AttendeeAvatar key={memberId} member={{ id: memberId }} />
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No accepted members yet</span>
                    )}
                  </div>
                </div>

                {/* Maybe/Undecided attendees */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span>Maybe</span>
                    <span className="text-xs text-gray-500">({event.undecided?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.undecided?.length > 0 ? (
                      event.undecided.map((memberId) => (
                        <AttendeeAvatar key={memberId} member={{ id: memberId }} />
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No undecided members</span>
                    )}
                  </div>
                </div>

                {/* Pending attendees */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span>Pending</span>
                    <span className="text-xs text-gray-500">({event.attendees?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.attendees?.length > 0 ? (
                      event.attendees.map((memberId) => (
                        <AttendeeAvatar key={memberId} member={{ id: memberId }} />
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No pending members</span>
                    )}
                  </div>
                </div>

                {/* Declined attendees */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between items-center">
                    <span>Declined</span>
                    <span className="text-xs text-gray-500">({event.declined?.length || 0})</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {event.declined?.length > 0 ? (
                      event.declined.map((memberId) => (
                        <AttendeeAvatar key={memberId} member={{ id: memberId }} />
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">No declined members</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="border-t pt-6">
        <EventMembers eventId={event.id} />
      </div>
    </div>
  );
} 