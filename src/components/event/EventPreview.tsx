import { format } from 'date-fns';
import { Event } from '../../types/event';
import { getWidgetDefinition } from './widgets/WidgetRegistry';

interface EventPreviewProps {
  event: Event;
}

export function EventPreview({ event }: EventPreviewProps) {
  const formatLocation = () => {
    if (event.location.type === 'virtual') {
      return 'Virtual Event';
    } else if (event.location.type === 'hybrid') {
      return `Hybrid Event - ${event.location.address} and Virtual`;
    } else {
      return event.location.address;
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Event Details</h3>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{event.title}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{event.description}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {format(event.startDate, 'PPpp')}
              {event.endDate && (
                <>
                  {' '}to{' '}
                  {format(event.endDate, 'PPpp')}
                </>
              )}
              {' '}({event.timezone})
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Recurrence</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatRecurrence()}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatLocation()}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {event.visibility === 'organization' ? 'Organization Members' : 'Invite Only'}
            </dd>
          </div>
        </dl>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Enabled Widgets</h3>
        <ul className="mt-4 space-y-4">
          {event.widgets.filter(w => w.isEnabled).map((widget) => {
            const definition = getWidgetDefinition(widget.id);
            return (
              <li key={widget.id} className="text-sm text-gray-900 dark:text-gray-100">
                {definition?.name}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 