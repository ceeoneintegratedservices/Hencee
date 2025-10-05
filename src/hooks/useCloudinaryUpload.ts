import { useState, useCallback } from 'react';
import { 
  uploadImageToCloudinary, 
  uploadMultipleImagesToCloudinary, 
  validateImageFile,
  type CloudinaryUploadResult,
  type CloudinaryUploadOptions 
} from '@/services/cloudinary';

export interface UploadProgress {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

export interface UseCloudinaryUploadReturn {
  uploadProgress: UploadProgress;
  uploadImage: (file: File, options?: CloudinaryUploadOptions) => Promise<CloudinaryUploadResult>;
  uploadMultipleImages: (files: File[], options?: CloudinaryUploadOptions) => Promise<CloudinaryUploadResult[]>;
  resetUpload: () => void;
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadImage = useCallback(async (
    file: File, 
    options?: CloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult> => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    setUploadProgress({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      // Simulate progress (Cloudinary doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const result = await uploadImageToCloudinary(file, options);

      clearInterval(progressInterval);
      
      setUploadProgress({
        isUploading: false,
        progress: 100,
        error: null,
      });

      return result;
    } catch (error: any) {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        error: error.message || 'Upload failed',
      });
      throw error;
    }
  }, []);

  const uploadMultipleImages = useCallback(async (
    files: File[], 
    options?: CloudinaryUploadOptions
  ): Promise<CloudinaryUploadResult[]> => {
    // Validate all files
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }
    }

    setUploadProgress({
      isUploading: true,
      progress: 0,
      error: null,
    });

    try {
      // Simulate progress for multiple uploads
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 5, 90),
        }));
      }, 100);

      const results = await uploadMultipleImagesToCloudinary(files, options);

      clearInterval(progressInterval);
      
      setUploadProgress({
        isUploading: false,
        progress: 100,
        error: null,
      });

      return results;
    } catch (error: any) {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        error: error.message || 'Upload failed',
      });
      throw error;
    }
  }, []);

  const resetUpload = useCallback(() => {
    setUploadProgress({
      isUploading: false,
      progress: 0,
      error: null,
    });
  }, []);

  return {
    uploadProgress,
    uploadImage,
    uploadMultipleImages,
    resetUpload,
  };
}
