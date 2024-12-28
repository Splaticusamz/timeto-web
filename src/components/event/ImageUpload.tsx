import { useState, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  label: string;
  currentImage?: string;
  onImageChange: (file: File) => Promise<void>;
  isUploading: boolean;
  aspectRatio?: 'square' | 'cover';
  maxSizeMB?: number;
  className?: string;
}

export function ImageUpload({
  label,
  currentImage,
  onImageChange,
  isUploading,
  aspectRatio = 'square',
  className = ''
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onImageChange(file);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div
        onClick={handleClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer ${className}`}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={label || "Uploaded image"}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <PhotoIcon className="mx-auto h-12 w-12" />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Click or drag to upload
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              PNG, JPG, GIF up to 5MB
            </div>
          </div>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-white">Uploading...</div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onImageChange(file);
          }
        }}
      />
    </div>
  );
} 