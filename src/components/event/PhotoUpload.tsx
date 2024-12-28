import { PhotoIcon } from '@heroicons/react/24/outline';

interface PhotoUploadProps {
  photo?: string | null;
  onPhotoChange: (file: File | null) => Promise<void>;
  isUploading: boolean;
}

export function PhotoUpload({ photo, onPhotoChange, isUploading }: PhotoUploadProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onPhotoChange(file);
    }
  };

  const handleRemove = async () => {
    await onPhotoChange(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Event Photo
      </label>
      
      {photo ? (
        <div className="relative">
          <img 
            src={photo} 
            alt="Event" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload a photo</span>
                <input 
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
            {isUploading && (
              <div className="mt-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 