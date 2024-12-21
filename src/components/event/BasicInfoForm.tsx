import { useState } from 'react';
import { EventVisibility, LocationType, EventLocation, RecurrenceRule } from '../../types/event';
import { format } from 'date-fns';
import { Switch } from '@headlessui/react';
import { formClasses } from '../../styles/forms';

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

  const handleChange = (field: keyof BasicInfoFormProps['data'], value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className={formClasses.label}>
          Title
        </label>
        <input
          type="text"
          id="title"
          value={data.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className={formClasses.input}
          placeholder="Enter event title"
        />
      </div>

      <div>
        <label htmlFor="description" className={formClasses.label}>
          Description
        </label>
        <textarea
          id="description"
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className={formClasses.input}
          placeholder="Describe your event"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className={formClasses.label}>
            Start Date & Time
          </label>
          <input
            type="datetime-local"
            id="startDate"
            value={format(data.startDate, "yyyy-MM-dd'T'HH:mm")}
            onChange={(e) => handleChange('startDate', new Date(e.target.value))}
            className={formClasses.input}
          />
        </div>

        <div>
          <label htmlFor="endDate" className={formClasses.label}>
            End Date & Time (Optional)
          </label>
          <input
            type="datetime-local"
            id="endDate"
            value={data.endDate ? format(data.endDate, "yyyy-MM-dd'T'HH:mm") : ''}
            onChange={(e) => handleChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
            className={formClasses.input}
          />
        </div>
      </div>

      <div>
        <label htmlFor="timezone" className={formClasses.label}>
          Timezone
        </label>
        <select
          id="timezone"
          value={data.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
          className={formClasses.select}
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

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
        <label htmlFor="locationType" className={formClasses.label}>
          Location Type
        </label>
        <select
          id="locationType"
          value={data.location.type}
          onChange={(e) => handleChange('location', { ...data.location, type: e.target.value as LocationType })}
          className={formClasses.select}
        >
          <option value="fixed">Fixed Location</option>
          <option value="virtual">Virtual</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {data.location.type !== 'virtual' && (
        <div>
          <label htmlFor="address" className={formClasses.label}>
            Address
          </label>
          <input
            type="text"
            id="address"
            value={data.location.address}
            onChange={(e) => handleChange('location', { ...data.location, address: e.target.value })}
            className={formClasses.input}
            placeholder="Enter physical address"
          />
        </div>
      )}

      {data.location.type !== 'fixed' && (
        <div>
          <label htmlFor="meetingUrl" className={formClasses.label}>
            Meeting URL
          </label>
          <input
            type="url"
            id="meetingUrl"
            value={data.location.meetingUrl || ''}
            onChange={(e) => handleChange('location', { ...data.location, meetingUrl: e.target.value })}
            className={formClasses.input}
            placeholder="Enter virtual meeting URL"
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