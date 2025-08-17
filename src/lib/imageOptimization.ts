// Image Optimization Utilities
// Handles compression, format conversion, and optimization

interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

// Check browser support for modern formats
export const supportsWebP = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

export const supportsAVIF = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
};

// Get optimal format based on browser support
export const getOptimalFormat = (): 'avif' | 'webp' | 'jpeg' => {
  if (supportsAVIF()) return 'avif';
  if (supportsWebP()) return 'webp';
  return 'jpeg';
};

// Compress and optimize image
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    quality = 0.85,
    maxWidth = 1200,
    maxHeight = 1200,
    format = getOptimalFormat()
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate optimal dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File(
              [blob],
              `${file.name.split('.')[0]}.${format === 'jpeg' ? 'jpg' : format}`,
              {
                type: `image/${format}`,
                lastModified: Date.now()
              }
            );

            resolve(compressedFile);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Generate low-resolution placeholder
export const generatePlaceholder = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Create tiny placeholder (20x20)
        canvas.width = 20;
        canvas.height = 20;

        ctx?.drawImage(img, 0, 0, 20, 20);
        
        // Convert to base64 with heavy compression
        const placeholder = canvas.toDataURL('image/jpeg', 0.1);
        resolve(placeholder);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to generate placeholder'));
    img.src = URL.createObjectURL(file);
  });
};

// Validate image file
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize;
};

// Get optimized image URL with parameters
export const getOptimizedImageUrl = (url: string, width?: number, height?: number): string => {
  if (!url) return '';
  
  try {
    // Handle Supabase storage URLs
    if (url.includes('supabase') && url.includes('/storage/v1/object/public/')) {
      const urlObj = new URL(url);
      if (width) urlObj.searchParams.set('width', width.toString());
      if (height) urlObj.searchParams.set('height', height.toString());
      urlObj.searchParams.set('quality', '85');
      urlObj.searchParams.set('format', 'webp');
      return urlObj.toString();
    }
    
    // Handle relative URLs
    if (url.startsWith('/') && !url.startsWith('//')) {
      return `${window.location.origin}${url}`;
    }
    
    return url;
  } catch (error) {
    console.warn('Error optimizing image URL:', error);
    return url;
  }
};