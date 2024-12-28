import { useState } from 'react';
import { EventVisibility, LocationType, EventLocation, RecurrenceRule } from '../../types/event';
import { format } from 'date-fns';
import { Switch } from '@headlessui/react';
import { formClasses } from '../../styles/forms';
import { useOrganization } from '../../contexts/OrganizationContext';

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
    ...(currentOrganization?.address ? [{ value: 'organization', label: 'Organization Location' }] : []),
    { value: 'fixed', label: 'Fixed Location' },
    { value: 'virtual', label: 'Virtual Meeting' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const handleLocationTypeChange = (type: LocationType) => {
    const newLocation: EventLocation = {
      type,
      address: type === 'organization' ? '' : data.location.address || '',
      meetingUrl: ['virtual', 'hybrid'].includes(type) ? data.location.meetingUrl || '' : '',
      meetingId: ['virtual', 'hybrid'].includes(type) ? data.location.meetingId || '' : '',
      meetingPassword: ['virtual', 'hybrid'].includes(type) ? data.location.meetingPassword || '' : '',
      meetingProvider: ['virtual', 'hybrid'].includes(type) ? data.location.meetingProvider || 'zoom' : undefined,
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

      {(data.location.type === 'virtual' || data.location.type === 'hybrid') && (
        <div className="space-y-4">
          <div>
            <label className={formClasses.label}>
              Meeting URL
            </label>
            <input
              type="url"
              value={data.location.meetingUrl}
              onChange={(e) => onChange({
                ...data,
                location: { ...data.location, meetingUrl: e.target.value }
              })}
              className={formClasses.input}
            />
          </div>

          <div>
            <label className={formClasses.label}>
              Meeting ID (Optional)
            </label>
            <input
              type="text"
              value={data.location.meetingId || ''}
              onChange={(e) => onChange({
                ...data,
                location: { ...data.location, meetingId: e.target.value }
              })}
              className={formClasses.input}
            />
          </div>

          <div>
            <label className={formClasses.label}>
              Meeting Password (Optional)
            </label>
            <input
              type="text"
              value={data.location.meetingPassword || ''}
              onChange={(e) => onChange({
                ...data,
                location: { ...data.location, meetingPassword: e.target.value }
              })}
              className={formClasses.input}
            />
          </div>

          <div>
            <label className={formClasses.label}>
              Meeting Provider
            </label>
            <select
              value={data.location.meetingProvider || 'zoom'}
              onChange={(e) => onChange({
                ...data,
                location: { ...data.location, meetingProvider: e.target.value }
              })}
              className={formClasses.select}
            >
              <option value="zoom">Zoom</option>
              <option value="teams">Microsoft Teams</option>
              <option value="meet">Google Meet</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {data.location.type === 'hybrid' && (
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

      <div className="pt-2">
        <Switch.Group>
          <div className="flex items-center justify-between">
            <Switch.Label className={formClasses.label}>
              Recurring Event
            </Switch.Label>
            <Switch
              checked={showRecurrence}
              onChange={(checked) => {
                setShowRecurrence(checked);
                if (!checked) {
                  handleChange('recurrence', undefined);
                }
              }}
              className={`${formClasses.switch.base} ${showRecurrence ? formClasses.switch.active : formClasses.switch.inactive}`}
            >
              <span className={`${formClasses.switch.dot.base} ${showRecurrence ? formClasses.switch.dot.active : formClasses.switch.dot.inactive}`} />
            </Switch>
          </div>
        </Switch.Group>

        {showRecurrence && (
          <div className="mt-4 space-y-4 pl-4">
            <div>
              <label htmlFor="frequency" className={formClasses.label}>
                Frequency
              </label>
              <select
                id="frequency"
                value={data.recurrence?.frequency || 'weekly'}
                onChange={(e) => handleChange('recurrence', {
                  frequency: e.target.value,
                  interval: data.recurrence?.interval || 1,
                  isOngoing: data.recurrence?.isOngoing || true,
                })}
                className={formClasses.select}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label htmlFor="interval" className={formClasses.label}>
                Repeat every
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  id="interval"
                  min="1"
                  value={data.recurrence?.interval || 1}
                  onChange={(e) => handleChange('recurrence', {
                    ...data.recurrence,
                    interval: parseInt(e.target.value) || 1,
                  })}
                  className={`${formClasses.input} w-24`}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {data.recurrence?.frequency === 'daily' ? 'days' :
                   data.recurrence?.frequency === 'weekly' ? 'weeks' : 'months'}
                </span>
              </div>
            </div>

            <div>
              <Switch.Group>
                <div className="flex items-center justify-between">
                  <Switch.Label className={formClasses.label}>
                    No end date
                  </Switch.Label>
                  <Switch
                    checked={data.recurrence?.isOngoing ?? true}
                    onChange={(checked) => handleChange('recurrence', {
                      ...data.recurrence,
                      isOngoing: checked,
                      endDate: checked ? undefined : data.recurrence?.endDate,
                    })}
                    className={`${formClasses.switch.base} ${data.recurrence?.isOngoing ? formClasses.switch.active : formClasses.switch.inactive}`}
                  >
                    <span className={`${formClasses.switch.dot.base} ${data.recurrence?.isOngoing ? formClasses.switch.dot.active : formClasses.switch.dot.inactive}`} />
                  </Switch>
                </div>
              </Switch.Group>

              {!data.recurrence?.isOngoing && (
                <div className="mt-4">
                  <label htmlFor="recurrenceEnd" className={formClasses.label}>
                    End date
                  </label>
                  <input
                    type="date"
                    id="recurrenceEnd"
                    value={data.recurrence?.endDate ? format(data.recurrence.endDate, 'yyyy-MM-dd') : ''}
                    min={format(data.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleChange('recurrence', {
                      ...data.recurrence,
                      endDate: e.target.value ? new Date(e.target.value) : undefined,
                    })}
                    className={formClasses.input}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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