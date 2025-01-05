import { useState, useEffect, useRef } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

interface SlideActionProps {
  onDelete: () => Promise<void>;
  children: React.ReactNode;
}

export function SlideAction({ onDelete, children }: SlideActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (slideRef.current && !slideRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!onDelete) {
        console.error('No delete handler provided');
        return;
      }
      
      await onDelete();
      setIsOpen(false);
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  return (
    <div className="relative overflow-hidden group" ref={slideRef}>
      <div
        className={`transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-16' : 'translate-x-0'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
      </div>
      <div 
        className={`absolute top-0 left-0 h-full flex items-center transition-all duration-200 rounded-lg ${
          isOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{
          background: `linear-gradient(to right, ${
            document.documentElement.classList.contains('dark') 
              ? 'rgb(55 65 81)' 
              : 'rgb(243 244 246)'
          } 0%, transparent 100%)`
        }}
      >
        <button
          onClick={handleDelete}
          className="p-2 w-16 flex justify-center text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete this item? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 