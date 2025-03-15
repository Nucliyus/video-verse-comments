
/**
 * Utilities for video processing and optimization
 */

// Interface for compression options
interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  useSimplifiedCompression?: boolean;
}

/**
 * Gets video metadata including dimensions and duration
 * 
 * @param file Video file
 * @returns Promise with video metadata
 */
export const getVideoMetadata = (file: File): Promise<{
  width: number;
  height: number;
  duration: number;
  format: string;
  aspectRatio: number;
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const aspectRatio = video.videoWidth / video.videoHeight;
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        format: file.type,
        aspectRatio
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Simple pass-through function that returns the original file
 * This is used when we want to skip compression but still need
 * to maintain the API contract for compressVideo
 * 
 * @param file Original video file
 * @returns Promise that resolves with the original file
 */
export const compressVideo = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  console.log(`Video compression bypassed for ${file.name}, using original file`);
  // Simply return the original file - we're skipping compression for now
  // This ensures the upload process continues without compression issues
  return file;
};
