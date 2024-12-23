import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function CreateEvent() {
  console.log('CreateEvent component rendered');
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Event</h1>
        <button
          onClick={() => navigate('/events')}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>

      {/* Your event creation form content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="space-y-6">
            {/* Basic Information section */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h2>
              {/* Form fields will go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 