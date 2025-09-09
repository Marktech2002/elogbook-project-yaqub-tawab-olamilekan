/**
 * Service for handling image uploads to Cloudinary
 */
export const UploadService = {
  /**
   * Upload an image to Cloudinary
   * @param file File to upload
   * @returns Object containing URL and other metadata of uploaded image
   */
  uploadImage: async (file: File) => {
    // Check if Cloudinary is configured
    const isMockMode = !import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (isMockMode) {
      console.log('DEV MODE: Mocking image upload');
      
      // Create a mock URL for development
      // Return a fixed placeholder image URL for development
      return {
        url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format',
        publicId: 'mock-' + Date.now(),
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 12345
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'the_preset');
    const cloudName = 'dbnl2tlya';
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
      };
    } catch (error: any) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(error.message || 'Image upload failed');
    }
  },

  /**
   * Upload multiple images to Cloudinary
   * @param files Array of files to upload
   * @returns Array of objects containing URLs and metadata of uploaded images
   */
  uploadMultipleImages: async (files: File[]) => {
    // Check if Cloudinary is configured
    const isMockMode = !import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || !import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (isMockMode) {
      console.log('DEV MODE: Mocking multiple image uploads');
      
      // Return different placeholder images
      const placeholders = [
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format',
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format'
      ];
      
      // Return as many placeholders as files requested, cycling through the list if needed
      const mockUrls = files.map((_, index) => placeholders[index % placeholders.length]);
      return mockUrls;
    }

    const uploadPromises = files.map((file) => UploadService.uploadImage(file));
    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.url);
  },
}; 