import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvent } from '../../contexts/EventContext';
import { EventPreview } from '../../components/event/EventPreview';

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events } = useEvent();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const event = events.find(e => e.id === id);
  
  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {event.title}
        </h1>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            isEditMode 
              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              : 'text-white bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isEditMode ? 'Done' : 'Edit'}
        </button>
      </div>
      
      <EventPreview event={event} isEditMode={isEditMode} />
    </div>
  );
} 