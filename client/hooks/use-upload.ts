import { useState } from 'react';
import { UploadService } from '../lib/services/upload.service';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrls: string[];
}

export function useUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrls: [],
  });

  const resetUploadState = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrls: [],
    });
  };

  const uploadImage = async (file: File) => {
    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
      progress: 10, // Initial progress indicator
    }));

    try {
      // Simulate progress (since Cloudinary doesn't provide progress updates)
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 500);

      const result = await UploadService.uploadImage(file);
      clearInterval(progressInterval);

      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedUrls: [...prev.uploadedUrls, result.url],
      }));

      return result.url;
    } catch (error: any) {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: error.message || 'Upload failed',
      }));
      throw error;
    }
  };

  const uploadMultipleImages = async (files: File[]) => {
    setUploadState((prev) => ({
      ...prev,
      isUploading: true,
      error: null,
      progress: 5,
    }));

    try {
      // Upload files one by one to show progress
      const urls: string[] = [];
      let completed = 0;

      for (const file of files) {
        const result = await UploadService.uploadImage(file);
        urls.push(result.url);
        completed++;

        // Update progress based on completed uploads
        setUploadState((prev) => ({
          ...prev,
          progress: Math.floor((completed / files.length) * 100),
        }));
      }

      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploadedUrls: [...prev.uploadedUrls, ...urls],
      }));

      return urls;
    } catch (error: any) {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: error.message || 'Upload failed',
      }));
      throw error;
    }
  };

  return {
    ...uploadState,
    uploadImage,
    uploadMultipleImages,
    resetUploadState,
  };
} 