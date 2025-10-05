export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
}

/**
 * Upload a single image to Cloudinary using direct API call
 * @param file - The image file to upload
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadImageToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', `data:${file.type};base64,${base64}`);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options.public_id) {
      formData.append('public_id', options.public_id);
    }
    
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const result = await response.json();

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of image files to upload
 * @param options - Upload options
 * @returns Promise with array of upload results
 */
export async function uploadMultipleImagesToCloudinary(
  files: File[],
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map((file, index) => 
      uploadImageToCloudinary(file, {
        ...options,
        public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
      })
    );

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
}

/**
 * Get optimized image URL with transformations
 * @param publicId - The public ID of the image
 * @param transformations - Cloudinary transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  transformations: any = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
  
  // Build transformation string
  let transformString = '';
  if (transformations.width) transformString += `w_${transformations.width},`;
  if (transformations.height) transformString += `h_${transformations.height},`;
  if (transformations.crop) transformString += `c_${transformations.crop},`;
  if (transformations.gravity) transformString += `g_${transformations.gravity},`;
  if (transformations.quality) transformString += `q_${transformations.quality},`;
  if (transformations.format) transformString += `f_${transformations.format},`;
  
  // Remove trailing comma
  if (transformString.endsWith(',')) {
    transformString = transformString.slice(0, -1);
  }
  
  return `${baseUrl}/${transformString}/${publicId}`;
}

/**
 * Convert file to base64 string
 * @param file - The file to convert
 * @returns Promise with base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix to get just the base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to convert file to base64'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file before upload
 * @param file - The file to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: 'File must be an image (JPEG, PNG, WebP, or GIF)' 
    };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Image size must be less than 10MB' 
    };
  }

  return { valid: true };
}

/**
 * Get image dimensions from file
 * @param file - The image file
 * @returns Promise with image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a thumbnail URL from a Cloudinary public ID
 * @param publicId - The public ID of the image
 * @param size - The size of the thumbnail (default: 150x150)
 * @returns Thumbnail URL
 */
export function createThumbnailUrl(publicId: string, size: string = '150x150'): string {
  return cloudinary.url(publicId, {
    width: size.split('x')[0],
    height: size.split('x')[1],
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    format: 'auto',
    secure: true,
  });
}

/**
 * Create a responsive image URL with multiple sizes
 * @param publicId - The public ID of the image
 * @param sizes - Array of sizes to generate
 * @returns Object with different size URLs
 */
export function createResponsiveImageUrls(
  publicId: string,
  sizes: string[] = ['300x300', '600x600', '900x900']
): Record<string, string> {
  const urls: Record<string, string> = {};
  
  sizes.forEach(size => {
    const [width, height] = size.split('x');
    urls[size] = cloudinary.url(publicId, {
      width: parseInt(width),
      height: parseInt(height),
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      format: 'auto',
      secure: true,
    });
  });
  
  return urls;
}
