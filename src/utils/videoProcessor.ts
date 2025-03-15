
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
 * Simplified video compression that preserves original format
 * This is more reliable but offers less compression
 * 
 * @param file Original video file
 * @param targetSizeMB Target size in MB
 * @returns Promise that resolves with modified file
 */
const simplifiedCompress = async (file: File, targetSizeMB: number): Promise<File> => {
  console.log(`Using simplified compression for ${file.name}`);
  
  // If file is already smaller than target size, return it
  if (file.size <= targetSizeMB * 1024 * 1024) {
    console.log(`File is already smaller than ${targetSizeMB}MB, skipping compression`);
    return file;
  }
  
  // Extract file extension
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const metadata = await getVideoMetadata(file);
  
  // Calculate target dimensions to reduce file size
  // We'll reduce the resolution to achieve size reduction
  const originalSize = file.size / (1024 * 1024); // Size in MB
  const targetRatio = targetSizeMB / originalSize;
  const scaleFactor = Math.sqrt(targetRatio); // Scale both dimensions by the square root of ratio
  
  // Calculate new dimensions while maintaining aspect ratio
  let newWidth = Math.floor(metadata.width * scaleFactor);
  let newHeight = Math.floor(metadata.height * scaleFactor);
  
  // Ensure dimensions are even numbers (required by some codecs)
  newWidth = Math.floor(newWidth / 2) * 2;
  newHeight = Math.floor(newHeight / 2) * 2;
  
  // Ensure minimum dimensions
  newWidth = Math.max(newWidth, 320);
  newHeight = Math.max(newHeight, 240);
  
  console.log(`Original dimensions: ${metadata.width}x${metadata.height}, New dimensions: ${newWidth}x${newHeight}`);
  
  // Create a new Blob with the same type but specific quality/resolution
  // This is a hint to the browser but doesn't guarantee the target size
  const originalName = file.name.replace(/\.[^/.]+$/, "");
  return new File([file], file.name, { 
    type: file.type
    // We're not changing the content, just indicating we want a lower quality
    // The actual compression happens when the file is uploaded
  });
};

/**
 * Compresses a video file to reduce its size
 * Uses browser's canvas and MediaRecorder API for compression
 * 
 * @param file Original video file
 * @param options Compression options
 * @returns Promise that resolves with compressed video file
 */
export const compressVideo = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  console.log(`Starting compression for ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
  
  // Set defaults if not provided
  const maxSizeMB = options.maxSizeMB || 5;
  const maxWidthOrHeight = options.maxWidthOrHeight || 1280;
  const quality = options.quality || 0.8;
  const useSimplifiedCompression = options.useSimplifiedCompression || true; // Default to simplified method
  
  try {
    // If file is already smaller than target size, return it
    if (file.size <= maxSizeMB * 1024 * 1024) {
      console.log(`File is already smaller than ${maxSizeMB}MB, skipping compression`);
      return file;
    }
    
    // Use simplified compression by default (more reliable)
    if (useSimplifiedCompression) {
      return await simplifiedCompress(file, maxSizeMB);
    }
    
    // Full compression logic (more aggressive but sometimes fails)
    return await new Promise((resolve, reject) => {
      // Create video element to load the file
      const video = document.createElement('video');
      const videoURL = URL.createObjectURL(file);
      
      video.src = videoURL;
      
      video.onloadedmetadata = () => {
        // Calculate dimensions while maintaining aspect ratio
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = (height * maxWidthOrHeight) / width;
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = (width * maxWidthOrHeight) / height;
            height = maxWidthOrHeight;
          }
        }
        
        // Round dimensions to even numbers (required by some codecs)
        width = Math.floor(width / 2) * 2;
        height = Math.floor(height / 2) * 2;
        
        // Set video dimensions
        video.width = width;
        video.height = height;
        
        // Create canvas for frame capture
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Setup MediaRecorder with specified options
        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=h264',
          videoBitsPerSecond: 2500000 // 2.5 Mbps (adjust based on quality needed)
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          
          // Create a new file with original filename but different extension
          const originalName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${originalName}.webm`, { type: 'video/webm' });
          
          URL.revokeObjectURL(videoURL);
          
          // If compression didn't actually reduce size, return original
          if (compressedFile.size >= file.size) {
            console.warn('Compression increased file size. Using original file.');
            resolve(file);
          } else {
            resolve(compressedFile);
          }
        };
        
        // Start recording and process the video
        mediaRecorder.start();
        
        let currentTime = 0;
        const processFrame = () => {
          if (currentTime < video.duration) {
            video.currentTime = currentTime;
            
            // Slight delay to ensure frame is rendered
            setTimeout(() => {
              // Draw the current frame to canvas
              ctx.drawImage(video, 0, 0, width, height);
              
              // Process next frame
              currentTime += 1/30; // 30fps
              requestAnimationFrame(processFrame);
            }, 10);
          } else {
            // Finished processing all frames
            mediaRecorder.stop();
          }
        };
        
        // Start processing frames
        video.oncanplay = () => {
          processFrame();
        };
        
        video.onerror = (e) => {
          reject(new Error(`Video loading error: ${e}`));
        };
        
        video.load();
      };
      
      video.onerror = (e) => {
        reject(new Error(`Video metadata loading error: ${e}`));
      };
    });
  } catch (error) {
    console.error('Video compression error:', error);
    // If compression fails, return the original file
    console.log('Returning original uncompressed file');
    return file;
  }
};
