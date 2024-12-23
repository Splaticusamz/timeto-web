import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEvent } from '../../contexts/EventContext';
import { UserIcon, UsersIcon, GlobeAltIcon, MapPinIcon, PhoneIcon, GlobeAsiaAustraliaIcon } from '@heroicons/react/24/outline';

export function EventDetails() {
  console.log('EventDetails component rendered');
  const { id } = useParams();
  const navigate = useNavigate();
  const { events } = useEvent();
  const location = useLocation();
  
  console.log('EventDetails rendered with id:', id);
  console.log('Current path:', location.pathname);
  console.log('Available events:', events);
  
  const event = events.find(e => e.id === id);
  
  if (!event) {
    console.log('Event not found');
    return <div className="p-6">Event not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{event.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/events/${id}/edit`)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={() => navigate(`/events/${id}/delete`)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-red-100 dark:bg-red-900 p-4 rounded mb-6">
        <div className="flex items-center">
          {event.source === 'publicEvents' ? <GlobeAltIcon className="h-5 w-5 mr-2" /> : <UserIcon className="h-5 w-5 mr-2" />}
          <span className="text-red-800 dark:text-red-200">
            {event.source === 'publicEvents' ? 'Public Event' : 'Private Event'}
          </span>
          <span className="text-red-600 dark:text-red-300 ml-2">
            This event is {event.source === 'publicEvents' ? 'public and can be viewed by anyone' : 'private and can only be viewed by organization members'}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Event Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Start</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {new Date(event.start).toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">End</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {new Date(event.end).toLocaleString()}
                </div>
              </div>

              {event.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {event.description}
                  </div>
                </div>
              )}

              {event.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    Location
                  </label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {event.location.type === 'fixed' && event.location.address}
                  </div>
                </div>
              )}

              {event.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    <GlobeAsiaAustraliaIcon className="h-4 w-4 inline mr-1" />
                    Website
                  </label>
                  <a 
                    href={event.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {event.website}
                  </a>
                </div>
              )}

              {event.phoneNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    <PhoneIcon className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {event.phoneNumber}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {event.widgets && event.widgets.length > 0 && (
              <div>
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Widgets</h2>
                <div className="grid grid-cols-4 gap-2">
                  {event.widgets.map((widget, index) => (
                    <div 
                      key={index}
                      className="p-2 bg-gray-100 dark:bg-gray-700 rounded text-center text-sm text-gray-600 dark:text-gray-300"
                    >
                      {widget}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 