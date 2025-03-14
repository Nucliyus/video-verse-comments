
/**
 * Utilities for video processing and optimization
 */

// Interface for compression options
interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

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
  // Set defaults if not provided
  const maxSizeMB = options.maxSizeMB || 5;
  const maxWidthOrHeight = options.maxWidthOrHeight || 1280;
  const quality = options.quality || 0.8;
  
  return new Promise((resolve, reject) => {
    // If file is already smaller than target size, return it
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

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
};

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
}> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        format: file.type
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};
