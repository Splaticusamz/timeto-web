import { format } from 'date-fns';
import { Event, Widget, LocationType, EventLocation, NotificationSettings } from '../../types/event';
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
  XMarkIcon,
  HandThumbUpIcon,
  BellIcon,
  BellSlashIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { EventMembers } from './EventMembers';
import { useMember } from '../../contexts/MemberContext';
import { ImageUpload } from './ImageUpload';

interface EventPreviewProps {
  event: Event;
  isEditMode?: boolean;
  isPreview?: boolean;
  hideMembers?: boolean;
  hideImages?: boolean;
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

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  type?: 'text' | 'date' | 'time' | 'select' | 'datetime';
  options?: { value: string; label: string; }[];
  min?: string;
  max?: string;
}

function EditableField({ label, value, onSave, isEditing, onEdit, onCancel, type = 'text', options = [], min, max }: EditableFieldProps) {
  const [editValue, setEditValue] = useState(value);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For datetime type, we need to handle date and time separately
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');

  // Initialize date and time values when starting to edit
  useEffect(() => {
    if (type === 'datetime' && isEditing && value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setDateValue(date.toISOString().split('T')[0]);
          setTimeValue(date.toTimeString().slice(0, 5));
          setEditValue(date.toISOString());
        }
      } catch (error) {
        console.error('Error parsing datetime:', error);
      }
    }
  }, [type, value, isEditing]);

  const handleChange = (newValue: string, isDate?: boolean) => {
    if (type === 'datetime') {
      let newDateValue = dateValue;
      let newTimeValue = timeValue;

      if (isDate) {
        newDateValue = newValue;
        setDateValue(newValue);
      } else {
        newTimeValue = newValue;
        setTimeValue(newValue);
      }
      
      // Only proceed if both date and time are set
      if (newDateValue && newTimeValue) {
        try {
          // Combine date and time
          const combinedDate = new Date(`${newDateValue}T${newTimeValue}`);
          if (!isNaN(combinedDate.getTime())) {
            setEditValue(combinedDate.toISOString());
            setShowConfirm(true);
            setError(null);

            // Only validate max if provided (for end time validation)
            if (max && combinedDate > new Date(max)) {
              setError(`Cannot be after end time (${format(new Date(max), 'MMMM d, yyyy h:mm a')})`);
            }
          }
        } catch (error) {
          console.error('Error combining date and time:', error);
          setShowConfirm(false);
          setError('Invalid date/time combination');
        }
      }
    } else {
      setEditValue(newValue);
      setShowConfirm(newValue !== value);
      setError(null);
    }
  };

  // Get current date and time in local format for min attribute
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const handleSave = async () => {
    if (error || !editValue) return;
    setIsSaving(true);
    try {
      await onSave(editValue);
      setShowConfirm(false);
      if (type === 'datetime') {
        setDateValue('');
        setTimeValue('');
      }
      // Clear editing state after successful save
      onCancel(); // This will call setEditingField(null)
    } catch (error) {
      console.error('Failed to save:', error);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setDateValue('');
    setTimeValue('');
    setShowConfirm(false);
    setError(null);
    onCancel();
  };

  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 relative group">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {type === 'select' ? (
                <select
                  value={editValue}
                  onChange={(e) => handleChange(e.target.value)}
                  className="flex-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  {options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : type === 'datetime' ? (
                <div className="flex-1 flex space-x-2">
                  <input
                    type="date"
                    value={dateValue}
                    onChange={(e) => handleChange(e.target.value, true)}
                    min={currentDate}
                    className="flex-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                  <input
                    type="time"
                    value={timeValue}
                    onChange={(e) => handleChange(e.target.value, false)}
                    min={dateValue === currentDate ? currentTime : undefined}
                    className="w-32 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              ) : (
                <input
                  type={type}
                  value={editValue}
                  onChange={(e) => handleChange(e.target.value)}
                  className="flex-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              )}
              {showConfirm ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !!error}
                    className={`p-1 ${error ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700 dark:text-green-400'}`}
                    title={error || "Save changes"}
                  >
                    {isSaving ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent dark:border-green-400 dark:border-t-transparent" />
                    ) : (
                      <HandThumbUpIcon className="h-5 w-5" />
                    )}
                  </button>
                  {!isSaving && (
                    <button
                      onClick={handleCancel}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                      title="Cancel changes"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={handleCancel}
                  className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  title="Exit edit mode"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {error && (
              <div className="text-xs text-red-500 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span>{value}</span>
            <button
              onClick={onEdit}
              className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 bg-white dark:bg-gray-700 rounded"
              title="Edit field"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </dd>
    </div>
  );
}

export function EventPreview({ event: initialEvent, isEditMode = false, ...props }: EventPreviewProps) {
  const { updateEvent } = useEvent();
  const [event, setEvent] = useState<Event>(initialEvent);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingNotification, setIsAddingNotification] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [newNotification, setNewNotification] = useState({ value: 5, unit: 'minutes' });
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  // Update the useEffect to properly sync with initialEvent changes
  useEffect(() => {
    console.log('Initial event updated:', initialEvent);
    setEvent(initialEvent);
  }, [initialEvent]);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleFieldSave = async (field: string, value: any): Promise<Event> => {
    console.log('handleFieldSave called with:', { field, value });
    
    try {
      if (field === 'notificationSettings') {
        const updatedEvent = await updateEvent(event.id, {
          notificationSettings: value
        });
        console.log('Update response:', updatedEvent);
        return updatedEvent;
      } else {
        const updatedEvent = await updateEvent(event.id, { [field]: value });
        return updatedEvent;
      }
    } catch (error) {
      console.error('Failed to update field:', error);
      throw error;
    }
  };

  const handleCoverImageUpload = async (file: File | null) => {
    try {
      setCoverImageUploading(true);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          await updateEvent(event.id, { coverImage: reader.result as string });
        };
        reader.readAsDataURL(file);
      } else {
        await updateEvent(event.id, { coverImage: null });
      }
    } catch (error) {
      console.error('Failed to upload cover image:', error);
    } finally {
      setCoverImageUploading(false);
    }
  };

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
      let dateObj: Date;
      
      if (typeof date === 'object' && 'seconds' in date) {
        dateObj = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return 'Invalid date format';
      }

      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }

      return format(dateObj, formatStr);
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

  const handleStartDateTimeSave = async (value: string) => {
    try {
      const newStart = new Date(value);
      if (event.end && newStart > new Date(event.end)) {
        throw new Error(`Cannot be after end time (${format(new Date(event.end), 'MMM d, yyyy h:mm a')})`);
      }
      
      // Pre-create the timestamp to avoid dynamic import during save
      const { Timestamp } = await import('firebase/firestore');
      const timestamp = Timestamp.fromDate(newStart);
      
      // Update only the necessary field
      await updateEvent(event.id, { start: timestamp });
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update start time:', error);
    }
  };

  const handleEndDateTimeSave = async (value: string) => {
    try {
      const newEnd = new Date(value);
      const startDate = new Date(event.start);
      if (newEnd < startDate) {
        throw new Error(`Cannot be before start time (${format(startDate, 'MMM d, yyyy h:mm a')})`);
      }
      
      // Pre-create the timestamp to avoid dynamic import during save
      const { Timestamp } = await import('firebase/firestore');
      const timestamp = Timestamp.fromDate(newEnd);
      
      // Update only the necessary field
      const updatedEvent = await updateEvent(event.id, { end: timestamp });
      
      // Verify the update was successful
      if (!updatedEvent.end || !(updatedEvent.end instanceof Date)) {
        throw new Error('Failed to update end time');
      }
      
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update end time:', error);
      throw error; // Re-throw to show error in UI
    }
  };

  const formatDateTime = (date: Date | string | { seconds: number; nanoseconds: number } | undefined): string => {
    if (!date) return '';
    try {
      let dateObj: Date;
      
      if (typeof date === 'object' && 'seconds' in date) {
        dateObj = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        return '';
      }

      if (isNaN(dateObj.getTime())) {
        return '';
      }

      return format(dateObj, 'MMMM d, yyyy h:mm a');
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const handleVisibilitySave = async (value: string) => {
    try {
      await updateEvent(event.id, { visibility: value });
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update visibility:', error);
    }
  };

  // For debugging
  console.log('Event data:', {
    start: event.start,
    type: typeof event.start,
    isTimestamp: typeof event.start === 'object' && 'seconds' in event.start
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Images section at the top */}
      {!props.hideImages && (
        <div>
          <div className="w-full">
            <div className="space-y-2">
              {!isEditMode && <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover Image</h4>}
              {isEditMode ? (
                <ImageUpload
                  label="Cover Image"
                  currentImage={event.coverImage}
                  onImageChange={handleCoverImageUpload}
                  isUploading={coverImageUploading}
                  aspectRatio="cover"
                  className="h-64"
                />
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Details */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Event Details</h3>
            <dl className="mt-4 space-y-4">
              {isEditMode ? (
                <>
                  <EditableField
                    label="Title"
                    value={event.title}
                    onSave={(value) => handleFieldSave('title', value)}
                    isEditing={editingField === 'title'}
                    onEdit={() => handleFieldEdit('title')}
                    onCancel={() => setEditingField(null)}
                  />
                  <EditableField
                    label="Description"
                    value={event.description}
                    onSave={(value) => handleFieldSave('description', value)}
                    isEditing={editingField === 'description'}
                    onEdit={() => handleFieldEdit('description')}
                    onCancel={() => setEditingField(null)}
                  />
                  <EditableField
                    label="Location"
                    value={formatLocation()}
                    onSave={(value) => handleFieldSave('location', value)}
                    isEditing={editingField === 'location'}
                    onEdit={() => handleFieldEdit('location')}
                    onCancel={() => setEditingField(null)}
                  />
                  <EditableField
                    label="Start Date & Time"
                    value={formatDateTime(event.start)}
                    onSave={handleStartDateTimeSave}
                    isEditing={editingField === 'startDateTime'}
                    onEdit={() => handleFieldEdit('startDateTime')}
                    onCancel={() => setEditingField(null)}
                    type="datetime"
                    max={event.end ? formatDateTime(event.end) : undefined}
                  />
                  <EditableField
                    label="End Date & Time"
                    value={formatDateTime(event.end)}
                    onSave={handleEndDateTimeSave}
                    isEditing={editingField === 'endDateTime'}
                    onEdit={() => handleFieldEdit('endDateTime')}
                    onCancel={() => setEditingField(null)}
                    type="datetime"
                    min={formatDateTime(event.start)}
                  />
                  <EditableField
                    label="Visibility"
                    value={event.visibility === 'organization' ? 'Organization Members' :
                           event.visibility === 'invite-only' ? 'Invite Only' :
                           'Public'}
                    onSave={handleVisibilitySave}
                    isEditing={editingField === 'visibility'}
                    onEdit={() => handleFieldEdit('visibility')}
                    onCancel={() => setEditingField(null)}
                    type="select"
                    options={[
                      { value: 'organization', label: 'Organization Members' },
                      { value: 'invite-only', label: 'Invite Only' },
                      { value: 'public', label: 'Public' }
                    ]}
                  />
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
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                      <BellIcon className="h-5 w-5" />
                      <span>Notifications</span>
                    </dt>
                    <dd className="mt-3 text-sm text-gray-900 dark:text-gray-100">
                      <div className="space-y-3">
                        {/* View Mode - List of existing notifications */}
                        {(event.notificationSettings?.reminderTimes || []).map((time, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                            {editingIndex === index ? (
                              // Edit Mode
                              <div className="flex-1 flex items-center space-x-2">
                                <select
                                  value={time >= 1440 ? time / 1440 : time >= 60 ? time / 60 : time}
                                  onChange={(e) => {
                                    const newTimes = [...(event.notificationSettings?.reminderTimes || [])];
                                    const value = parseInt(e.target.value);
                                    const multiplier = time >= 1440 ? 1440 : time >= 60 ? 60 : 1;
                                    newTimes[index] = value * multiplier;
                                    setEvent(prevEvent => ({
                                      ...prevEvent,
                                      notificationSettings: {
                                        enabled: true,
                                        reminderTimes: newTimes
                                      }
                                    }));
                                  }}
                                  className="w-24 rounded-md border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 px-3 py-1.5"
                                >
                                  {time >= 1440 ? (
                                    Array.from({ length: 7 }, (_, i) => i + 1).map(num => (
                                      <option key={num} value={num}>{num}</option>
                                    ))
                                  ) : time >= 60 ? (
                                    Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                      <option key={num} value={num}>{num}</option>
                                    ))
                                  ) : (
                                    [5, 10, 15, 30, 45].map(num => (
                                      <option key={num} value={num}>{num}</option>
                                    ))
                                  )}
                                </select>
                                <select
                                  value={time >= 1440 ? 'days' : time >= 60 ? 'hours' : 'minutes'}
                                  onChange={(e) => {
                                    const newTimes = [...(event.notificationSettings?.reminderTimes || [])];
                                    const currentValue = time >= 1440 ? time / 1440 : time >= 60 ? time / 60 : time;
                                    const multiplier = e.target.value === 'days' ? 1440 : e.target.value === 'hours' ? 60 : 1;
                                    newTimes[index] = currentValue * multiplier;
                                    setEvent(prevEvent => ({
                                      ...prevEvent,
                                      notificationSettings: {
                                        enabled: true,
                                        reminderTimes: newTimes
                                      }
                                    }));
                                  }}
                                  className="rounded-md border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 px-3 py-1.5"
                                >
                                  <option value="minutes">minutes</option>
                                  <option value="hours">hours</option>
                                  <option value="days">days</option>
                                </select>
                                <span className="text-gray-500 dark:text-gray-400">before event</span>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={async () => {
                                      if (isSaving) return;
                                      try {
                                        setIsSaving(true);
                                        await handleFieldSave('notificationSettings', {
                                          enabled: true,
                                          reminderTimes: event.notificationSettings?.reminderTimes || []
                                        });
                                        // Clear editing state after successful save
                                        setEditingIndex(-1);
                                        setEditingField(null);
                                      } catch (error) {
                                        console.error('Failed to save notification settings:', error);
                                        setEvent(initialEvent);
                                      } finally {
                                        setIsSaving(false);
                                      }
                                    }}
                                    className={`p-1 ${isSaving ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? (
                                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                    ) : (
                                      <HandThumbUpIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                  {!isSaving && (
                                    <button
                                      onClick={() => {
                                        setEvent(initialEvent);
                                        setEditingIndex(-1);
                                      }}
                                      className="p-1 text-red-600 hover:text-red-700"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // View Mode
                              <>
                                <span className="text-gray-700 dark:text-gray-300">
                                  {time >= 1440 
                                    ? `${time / 1440} day${time / 1440 > 1 ? 's' : ''}`
                                    : time >= 60 
                                      ? `${time / 60} hour${time / 60 > 1 ? 's' : ''}`
                                      : `${time} minute${time > 1 ? 's' : ''}`
                                  } before event
                                </span>
                                <div className="flex items-center space-x-2">
                                  {deletingIndex === index ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400 dark:border-t-transparent" />
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setEditingIndex(index)}
                                        className="p-1 text-gray-400 hover:text-blue-500"
                                      >
                                        <PencilIcon className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setDeletingIndex(index);
                                            const newTimes = event.notificationSettings?.reminderTimes.filter((_, i) => i !== index) || [];
                                            await handleFieldSave('notificationSettings', {
                                              enabled: newTimes.length > 0,
                                              reminderTimes: newTimes
                                            });
                                          } catch (error) {
                                            console.error('Failed to delete notification:', error);
                                            setEvent(initialEvent);
                                          } finally {
                                            setDeletingIndex(null);
                                          }
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        title="Remove notification"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Add New Notification */}
                        {isAddingNotification && (
                          <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                            <div className="flex-1 flex items-center space-x-2">
                              <select
                                value={newNotification.value}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (isNaN(value)) return;
                                  
                                  // Debug log to verify value being set
                                  console.log('Setting notification value:', value);
                                  
                                  setNewNotification(prev => ({
                                    ...prev,
                                    value
                                  }));
                                }}
                                className="w-24 rounded-md border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 px-3 py-1.5"
                              >
                                {newNotification.unit === 'days' ? (
                                  Array.from({ length: 7 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))
                                ) : newNotification.unit === 'hours' ? (
                                  Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))
                                ) : (
                                  [5, 10, 15, 30, 45].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                  ))
                                )}
                              </select>
                              <select
                                value={newNotification.unit}
                                onChange={(e) => {
                                  setNewNotification({
                                    value: 1,
                                    unit: e.target.value as 'minutes' | 'hours' | 'days'
                                  });
                                }}
                                className="rounded-md border-gray-300 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100 px-3 py-1.5"
                              >
                                <option value="minutes">minutes</option>
                                <option value="hours">hours</option>
                                <option value="days">days</option>
                              </select>
                              <span className="text-gray-500 dark:text-gray-400">before event</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={async () => {
                                  if (isSaving) return;
                                  try {
                                    setIsSaving(true);
                                    // Calculate minutes based on selected value and unit
                                    const multiplier = newNotification.unit === 'days' ? 1440 : 
                                                     newNotification.unit === 'hours' ? 60 : 1;
                                    const minutes = newNotification.value * multiplier;
                                    
                                    // Debug log to verify calculation
                                    console.log('Adding notification:', {
                                      value: newNotification.value,
                                      unit: newNotification.unit,
                                      multiplier,
                                      minutes
                                    });
                                    
                                    // Check if this notification already exists
                                    const existingTimes = event.notificationSettings?.reminderTimes || [];
                                    if (existingTimes.includes(minutes)) {
                                      console.error('This notification already exists');
                                      return;
                                    }
                                    
                                    // Create new array with sorted times
                                    const newTimes = [...existingTimes, minutes].sort((a, b) => a - b);
                                    
                                    // Save to database
                                    await handleFieldSave('notificationSettings', {
                                      enabled: true,
                                      reminderTimes: newTimes
                                    });
                                    
                                    setIsAddingNotification(false);
                                    setNewNotification({ value: 5, unit: 'minutes' }); // Reset to default values
                                  } catch (error) {
                                    console.error('Failed to save notification settings:', error);
                                    setEvent(initialEvent);
                                  } finally {
                                    setIsSaving(false);
                                  }
                                }}
                                className={`p-1 ${isSaving ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-700'}`}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                                ) : (
                                  <HandThumbUpIcon className="h-4 w-4" />
                                )}
                              </button>
                              {!isSaving && (
                                <button
                                  onClick={() => {
                                    setIsAddingNotification(false);
                                    setNewNotification({ value: 5, unit: 'minutes' });
                                  }}
                                  className="p-1 text-red-600 hover:text-red-700"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Add Notification Button */}
                        {!isAddingNotification && !editingField && (
                          <button
                            onClick={() => setIsAddingNotification(true)}
                            className="flex items-center space-x-1.5 text-sm text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span>Add notification</span>
                          </button>
                        )}
                      </div>
                    </dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{event.title}</dd>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{event.description}</dd>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatLocation()}</dd>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(event.start, 'MMMM d, yyyy h:mm a')}
                    </dd>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(event.end, 'MMMM d, yyyy h:mm a')}
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
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notifications</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {event.notificationSettings?.enabled ? (
                        <div>
                          <div className="flex items-center text-green-600">
                            <BellIcon className="h-4 w-4 mr-1" />
                            Enabled
                          </div>
                          <div className="mt-1">
                            Reminders set for:
                            <ul className="list-disc list-inside ml-2">
                              {(event.notificationSettings.reminderTimes || []).map((time, index) => (
                                <li key={index}>
                                  {time >= 60 
                                    ? `${time / 60} hour${time / 60 !== 1 ? 's' : ''}`
                                    : `${time} minute${time !== 1 ? 's' : ''}`
                                  } before event
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <BellSlashIcon className="h-4 w-4 mr-1" />
                          No Notifications
                        </div>
                      )}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </div>
        </div>

        {/* Widgets and Attendees Column */}
        <div className="space-y-6">
          {/* Widgets Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Widgets</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          {!props.hideMembers && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Attendees</h3>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <div className="space-y-6 sm:space-y-4">
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
          )}
        </div>
      </div>

      {/* Members Section */}
      {!props.hideMembers && (
        <div className="border-t pt-6">
          <EventMembers eventId={event.id} />
        </div>
      )}
    </div>
  );
} 