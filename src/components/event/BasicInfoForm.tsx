import { useState } from 'react';
import { EventVisibility, LocationType, EventLocation, RecurrenceRule } from '../../types/event';
import { format } from 'date-fns';
import { Switch } from '@headlessui/react';
import { formClasses } from '../../styles/forms';
import { useOrganization } from '../../contexts/OrganizationContext';
import { RecurrenceSelector } from './RecurrenceSelector';

// Helper function to format date for datetime-local input
function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  } catch (e) {
    console.error('Error formatting date for input:', e);
    return '';
  }
}

// Helper function to parse date from input
function parseDateFromInput(value: string): Date | undefined {
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  } catch (e) {
    console.error('Error parsing date from input:', e);
    return undefined;
  }
}

interface BasicInfoFormProps {
  data: {
    title: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    timezone: string;
    location: EventLocation;
    visibility: EventVisibility;
    recurrence?: RecurrenceRule;
  };
  onChange: (data: BasicInfoFormProps['data']) => void;
}

const COMMON_TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
];

export function BasicInfoForm({ data, onChange }: BasicInfoFormProps) {
  const [showRecurrence, setShowRecurrence] = useState(!!data.recurrence);
  const { currentOrganization } = useOrganization();

  const handleChange = (field: keyof BasicInfoFormProps['data'], value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const locationTypes = [
    ...(currentOrganization?.location?.address ? [{ value: 'organization', label: 'Organization Location' }] : []),
    { value: 'fixed', label: 'Fixed Location' },
    { value: 'virtual', label: 'Virtual Meeting' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const handleLocationTypeChange = (type: LocationType) => {
    const newLocation: EventLocation = {
      type,
      address: type === 'organization' ? currentOrganization?.location?.address || '' : data.location.address || '',
      meetingUrl: '',
    };
    onChange({ ...data, location: newLocation });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className={formClasses.label}>
          Title
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className={formClasses.input}
        />
      </div>

      <div>
        <label className={formClasses.label}>
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          rows={3}
          className={formClasses.input}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Recurring Event
        </label>
        <button
          type="button"
          onClick={() => {
            if (data.recurrence) {
              onChange({ ...data, recurrence: undefined });
            } else {
              onChange({
                ...data,
                recurrence: {
                  type: 'weekly',
                  startDate: data.startDate,
                  endDate: undefined,
                  weekDays: []
                }
              });
            }
          }}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            data.recurrence ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              data.recurrence ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {data.recurrence ? (
        <RecurrenceSelector
          value={data.recurrence}
          onChange={(recurrence) => onChange({ ...data, recurrence })}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={formClasses.label}>
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(data.startDate)}
              onChange={(e) => {
                const date = parseDateFromInput(e.target.value);
                if (date) {
                  onChange({ ...data, startDate: date });
                }
              }}
              className={formClasses.input}
            />
          </div>

          <div>
            <label className={formClasses.label}>
              End Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={formatDateForInput(data.endDate)}
              onChange={(e) => {
                const date = parseDateFromInput(e.target.value);
                onChange({ ...data, endDate: date });
              }}
              className={formClasses.input}
            />
          </div>
        </div>
      )}

      <div>
        <label className={formClasses.label}>
          Location Type
        </label>
        <select
          value={data.location.type}
          onChange={(e) => handleLocationTypeChange(e.target.value as LocationType)}
          className={formClasses.select}
        >
          {locationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {(data.location.type === 'organization') && (
        <div>
          <label className={formClasses.label}>
            Organization Address
          </label>
          <input
            type="text"
            value={currentOrganization?.location?.address || ''}
            disabled
            className={`${formClasses.input} bg-gray-100 dark:bg-gray-600 cursor-not-allowed`}
          />
        </div>
      )}

      {data.location.type === 'fixed' && (
        <div>
          <label className={formClasses.label}>
            Address
          </label>
          <input
            type="text"
            value={data.location.address}
            onChange={(e) => onChange({
              ...data,
              location: { ...data.location, address: e.target.value }
            })}
            className={formClasses.input}
          />
        </div>
      )}

      {(data.location.type === 'virtual' || data.location.type === 'hybrid') && data.location.type !== 'organization' && (
        <div className="space-y-4">
          <div>
            <label className={formClasses.label}>
              Meeting URL
            </label>
            <input
              type="url"
              value={data.location.meetingUrl || ''}
              onChange={(e) => onChange({
                ...data,
                location: { ...data.location, meetingUrl: e.target.value }
              })}
              className={formClasses.input}
              required={data.location.type === 'virtual' || data.location.type === 'hybrid'}
            />
          </div>
        </div>
      )}

      {data.location.type === 'hybrid' && data.location.type !== 'organization' && (
        <div>
          <label className={formClasses.label}>
            Physical Location Address
          </label>
          <input
            type="text"
            value={data.location.address}
            onChange={(e) => onChange({
              ...data,
              location: { ...data.location, address: e.target.value }
            })}
            className={formClasses.input}
          />
        </div>
      )}

      <div>
        <label htmlFor="visibility" className={formClasses.label}>
          Visibility
        </label>
        <select
          id="visibility"
          value={data.visibility}
          onChange={(e) => handleChange('visibility', e.target.value as EventVisibility)}
          className={formClasses.select}
        >
          <option value="organization">Organization Members</option>
          <option value="invite-only">Invite Only</option>
        </select>
      </div>
    </div>
  );
} 