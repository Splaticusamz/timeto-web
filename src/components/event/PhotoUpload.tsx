import { PhotoIcon } from '@heroicons/react/24/outline';

interface PhotoUploadProps {
  photo?: string;
  onPhotoChange: (photo: string) => void;
}

export function PhotoUpload({ photo, onPhotoChange }: PhotoUploadProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Here you would typically upload to your storage service
      // For now, we'll just create a local URL
      const url = URL.createObjectURL(file);
      onPhotoChange(url);
    }
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
            onClick={() => onPhotoChange('')}
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
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
} 