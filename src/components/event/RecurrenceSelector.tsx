import { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { type WeekDay, type RecurrenceType } from '../../types/event';

interface RecurrenceSelectorProps {
  value: {
    type?: RecurrenceType;
    startDate?: Date;
    endDate?: Date;
    weekDays?: WeekDay[];
    time?: string;
    duration?: number;
    customDuration?: number;
    timezone?: string;
  };
  onChange: (value: any) => void;
}

interface TimeOption {
  label: string;
  value: string;
}

interface DurationOption {
  label: string;
  value: number;
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  onTimeZoneChange: (timezone: string) => void;
  selectedTimezone: string;
}

const TimePicker = ({ value, onChange, onTimeZoneChange, selectedTimezone }: TimePickerProps) => {
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');

  const POPULAR_TIMEZONES = [
    'Israel Time',
    'Eastern Time',
    'Central Time',
    'Pacific Time',
    'Mountain Time',
    'GMT',
    'Central European Time',
    'Japan Standard Time',
    'Indian Standard Time',
    'Australian Eastern Time'
  ];

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    onChange(`${newHours}:${newMinutes} ${period}`);
  };

  // Generate hours options (1-12)
  const hoursOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(1, '0'));
  
  // Generate minutes options (0-55, step 5)
  const minutesOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="flex items-center">
            <div className="relative">
              <input
                type="text"
                value={hours}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                    setHours(val);
                    handleTimeChange(val, minutes);
                  }
                }}
                className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 pr-8"
                maxLength={2}
              />
              <select
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value);
                  handleTimeChange(e.target.value, minutes);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {hoursOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
            <span className="mx-1">:</span>
            <div className="relative">
              <input
                type="text"
                value={minutes}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                    setMinutes(val.padStart(2, '0'));
                    handleTimeChange(hours, val.padStart(2, '0'));
                  }
                }}
                className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 pr-8"
                maxLength={2}
              />
              <select
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value);
                  handleTimeChange(hours, e.target.value);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              >
                {minutesOptions.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as 'AM' | 'PM');
                handleTimeChange(hours, minutes);
              }}
              className="ml-2 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        <select
          value={selectedTimezone}
          onChange={(e) => onTimeZoneChange(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
        >
          {POPULAR_TIMEZONES.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export function RecurrenceSelector({ value, onChange }: RecurrenceSelectorProps) {
  const weekDays: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const timeOptions: TimeOption[] = [
    { label: '12:00 AM', value: '00:00' },
    { label: '12:30 AM', value: '00:30' },
    { label: '11:30 PM', value: '23:30' },
  ];

  const durationOptions: DurationOption[] = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes', value: 60 },
    { label: 'Custom', value: -1 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Recurrence Type
        </label>
        <div className="mt-2 w-full h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center">
          <button
            className={`flex-1 h-full rounded-lg ${
              value.type === 'weekly' ? 'bg-purple-500 text-white' : 'text-gray-700 dark:text-gray-200'
            }`}
            onClick={() => onChange({ ...value, type: 'weekly' })}
          >
            Weekly
          </button>
          <button
            className={`flex-1 h-full rounded-lg ${
              value.type === 'yearly' ? 'bg-purple-500 text-white' : 'text-gray-700 dark:text-gray-200'
            }`}
            onClick={() => onChange({ ...value, type: 'yearly' })}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {value.type === 'weekly' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Recurrence Start
              </label>
              <input
                type="date"
                value={value.startDate ? new Date(value.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => onChange({ ...value, startDate: new Date(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Recurrence End
              </label>
              <input
                type="date"
                value={value.endDate ? new Date(value.endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => onChange({ ...value, endDate: new Date(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
              />
            </div>
          </>
        ) : (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Recurrence Date
            </label>
            <input
              type="date"
              value={value.startDate ? new Date(value.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => onChange({ 
                ...value, 
                startDate: new Date(e.target.value),
                endDate: new Date(e.target.value) // For yearly, start and end are the same
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Time
          </label>
          <div className="mt-1">
            <TimePicker
              value={value.time || '12:00 PM'}
              onChange={(time) => onChange({ ...value, time })}
              onTimeZoneChange={(timezone) => onChange({ ...value, timezone })}
              selectedTimezone={value.timezone || 'Israel Time'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Duration
          </label>
          <div className="mt-1 relative">
            <select
              value={value.duration || 60}
              onChange={(e) => onChange({ ...value, duration: Number(e.target.value) })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {value.duration === -1 && (
              <div className="mt-2">
                <input
                  type="number"
                  placeholder="Custom duration in minutes"
                  value={value.customDuration || ''}
                  onChange={(e) => onChange({ ...value, customDuration: Number(e.target.value) })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {value.type === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Repeat on
          </label>
          <div className="mt-2 flex justify-between gap-1">
            {weekDays.map((day) => (
              <button
                key={day}
                onClick={() => {
                  const currentDays = value.weekDays || [];
                  const newDays = currentDays.includes(day)
                    ? currentDays.filter(d => d !== day)
                    : [...currentDays, day];
                  onChange({ ...value, weekDays: newDays });
                }}
                className={`flex-1 h-12 rounded-lg ${
                  value.weekDays?.includes(day)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
              >
                {day.charAt(0)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 