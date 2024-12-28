import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../../contexts/EventContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Event } from '../../types/event';
import { UserIcon, UsersIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

export function Events() {
  const navigate = useNavigate();
  const { events, deleteEvent, createEvent } = useEvent();
  const { currentOrganization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');

  // Separate events by type
  const privateEvents = events.filter(event => event.source === 'events');
  const publicEvents = events.filter(event => event.source === 'publicEvents');

  // Filter events based on search
  const filteredPrivateEvents = privateEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredPublicEvents = publicEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(event.id);
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    try {
      const duplicateData = {
        ...event,
        title: `${event.title} (Copy)`,
        status: 'draft'
      };
      await createEvent(duplicateData);
    } catch (error) {
      console.error('Failed to duplicate event:', error);
    }
  };

  const EventSection = ({ title, events, icon: Icon }: { title: string; events: Event[]; icon: any }) => (
    <>
      <div className="flex items-center mt-6">
        <Icon className="w-4 h-4 mr-2 text-gray-500" />
        <span className="text-sm text-gray-900 dark:text-white">{title}</span>
        <span className="text-sm text-gray-500 ml-1">({events.length})</span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded mt-2">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="w-[40%] py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
                Title
              </th>
              <th className="w-[25%] py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
                Date
              </th>
              <th className="w-[25%] py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
                Time
              </th>
              <th className="w-[10%] py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr 
                key={event.id}
                onClick={(e) => {
                  e.preventDefault();
                  const path = `/events/${event.id}`;
                  console.log('Navigating to:', path);
                  navigate(path, { replace: true });
                }}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
                  {event.title}
                </td>
                <td className="py-2 text-sm text-gray-500 dark:text-gray-400 px-4">
                  {new Date(event.start).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '-')}
                </td>
                <td className="py-2 text-sm text-gray-500 dark:text-gray-400 px-4">
                  {new Date(event.start).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  }).toLowerCase()}
                </td>
                <td className="py-2 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleDuplicate(e, event)}
                      className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Duplicate event"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, event)}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Delete event"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Events</h1>
        <button
          onClick={() => navigate('/events/new')}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          Create Event
        </button>
      </div>

      <input
        type="text"
        placeholder="Search events..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 mb-6 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded"
      />

      <div>
        <EventSection 
          title="Private Events" 
          events={filteredPrivateEvents}
          icon={UserIcon}
        />
        
        <EventSection 
          title="Public Events" 
          events={filteredPublicEvents}
          icon={UsersIcon}
        />
      </div>
    </div>
  );
} 