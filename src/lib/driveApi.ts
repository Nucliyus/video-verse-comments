import { VideoFile, VideoComment, VideoVersion } from './types';

// Application folder name in user's Google Drive
const APP_FOLDER_NAME = 'VideoVerse';

// Initialize the Drive API client using fetch instead of googleapis
export const getDriveClient = (accessToken: string) => {
  const baseFetchOptions = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  return {
    async getAppFolder() {
      // Check if folder already exists
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)&spaces=drive`,
        baseFetchOptions
      );
      
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      
      // Create folder if it doesn't exist
      const createResponse = await fetch(
        'https://www.googleapis.com/drive/v3/files',
        {
          ...baseFetchOptions,
          method: 'POST',
          body: JSON.stringify({
            name: APP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
          }),
        }
      );
      
      const folder = await createResponse.json();
      return folder.id;
    },
    
    async uploadFile(file: File, folderId: string) {
      // Use the Google Drive API v3 with fetch and FormData for file uploads
      const metadata = {
        name: file.name,
        parents: [folderId]
      };
      
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);
      
      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,thumbnailLink,createdTime,modifiedTime',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: form,
        }
      );
      
      return await uploadResponse.json();
    },
    
    async listFiles(folderId: string, query: string) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and ${query} and trashed=false&fields=files(id,name,thumbnailLink,createdTime,modifiedTime)&spaces=drive`,
        baseFetchOptions
      );
      
      return await response.json();
    },
    
    async getFileContent(fileId: string) {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        baseFetchOptions
      );
      
      return await response.json();
    },
    
    async createOrUpdateJsonFile(fileName: string, folderId: string, content: any) {
      // Check if file exists
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false&fields=files(id)&spaces=drive`,
        baseFetchOptions
      );
      
      const listData = await listResponse.json();
      
      const contentBlob = new Blob([JSON.stringify(content)], { type: 'application/json' });
      
      if (listData.files && listData.files.length > 0) {
        // Update existing file
        const fileId = listData.files[0].id;
        
        const form = new FormData();
        form.append('file', contentBlob);
        
        await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: form,
          }
        );
        
        return fileId;
      } else {
        // Create new file
        const metadata = {
          name: fileName,
          parents: [folderId],
          mimeType: 'application/json'
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', contentBlob);
        
        const createResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: form,
          }
        );
        
        const fileData = await createResponse.json();
        return fileData.id;
      }
    }
  };
};

// Create or find the app folder in Drive
export const getOrCreateAppFolder = async (accessToken: string): Promise<string> => {
  const drive = getDriveClient(accessToken);
  return await drive.getAppFolder();
};

// Upload a video file to Google Drive with real progress tracking
export const uploadVideoToDrive = async (
  accessToken: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.log('Starting upload to Drive:', file.name, 'Size:', file.size);
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);
  console.log('App folder ID:', folderId);
  
  // Use real progress tracking with Fetch API
  onProgress?.(0); // Start progress

  // Make sure we explicitly set the correct MIME type from the file
  const fileType = file.type || 'video/mp4'; // Fallback to video/mp4 if type is empty
  console.log('File MIME type for upload:', fileType);

  // Define metadata with explicit MIME type
  const metadata = {
    name: file.name,
    parents: [folderId],
    mimeType: fileType
  };
  
  console.log('Uploading with metadata:', metadata);
  
  return new Promise((resolve, reject) => {
    // Use XMLHttpRequest for better upload progress tracking
    const xhr = new XMLHttpRequest();
    
    let lastLoggedProgress = 0;
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        
        // Only log if progress has changed by at least 5%
        if (progress >= lastLoggedProgress + 5 || progress === 100) {
          console.log(`Upload progress: ${progress}%`);
          lastLoggedProgress = progress;
        }
        
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('Upload successful. Response:', response);
          if (response && response.id) {
            resolve(response.id);
          } else {
            console.error('Invalid response format, missing ID:', response);
            reject(new Error('Invalid response from Google Drive'));
          }
        } catch (error) {
          console.error('Error parsing response:', error, 'Response text:', xhr.responseText);
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', (event) => {
      console.error('Upload error event:', event);
      reject(new Error('Upload failed due to network error'));
    });
    
    xhr.addEventListener('abort', () => {
      console.warn('Upload aborted');
      reject(new Error('Upload was aborted'));
    });
    
    // Increase timeout for larger files
    xhr.timeout = 1800000; // 30 minutes timeout
    xhr.addEventListener('timeout', () => {
      console.error('Upload timed out');
      reject(new Error('Upload timed out after 30 minutes'));
    });
    
    // Explicitly create form data with proper multipart/form-data boundary
    const form = new FormData();
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    form.append('metadata', metadataBlob);
    form.append('file', file);
    
    console.log('Opening XHR connection to Drive API');
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,thumbnailLink,createdTime,modifiedTime');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.send(form);
  });
};

// List all videos from the app folder
export const listVideosFromDrive = async (accessToken: string): Promise<VideoFile[]> => {
  console.log('Listing videos from Drive');
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);

  const response = await drive.listFiles(folderId, "mimeType contains 'video/'");
  console.log('Drive API response:', response);

  if (!response.files) {
    console.warn('No files found in response');
    return [];
  }

  // Map Drive files to our VideoFile type
  return response.files.map((file: any) => ({
    id: file.id,
    name: file.name,
    thumbnail: file.thumbnailLink || undefined,
    createdAt: file.createdTime,
    updatedAt: file.modifiedTime,
    driveFileId: file.id,
    versions: [], // We'll handle versions separately
  }));
};

// Save comments for a video as a JSON file in Drive
export const saveCommentsForVideo = async (
  accessToken: string,
  videoId: string,
  comments: VideoComment[]
): Promise<void> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);
  
  await drive.createOrUpdateJsonFile(`${videoId}_comments.json`, folderId, comments);
};

// Get comments for a video from Drive
export const getCommentsForVideo = async (
  accessToken: string,
  videoId: string
): Promise<VideoComment[]> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);
  
  try {
    // Check if comments file exists
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${videoId}_comments.json' and '${folderId}' in parents and trashed=false&fields=files(id)&spaces=drive`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const listData = await listResponse.json();
    
    if (!listData.files || listData.files.length === 0) {
      return [];
    }
    
    const fileId = listData.files[0].id;
    
    const contentResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    return await contentResponse.json();
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
};

// Create a new version of a video
export const createVideoVersion = async (
  accessToken: string,
  originalVideoId: string,
  newFile: File,
  versionName: string
): Promise<VideoVersion> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);
  
  // Get existing versions to determine version number
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name contains '${originalVideoId}_version_' and '${folderId}' in parents and trashed=false&fields=files(name)&spaces=drive`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const versionsData = await response.json();
  const versionNumber = versionsData.files ? versionsData.files.length + 1 : 1;
  
  // Create new file name with version info
  const versionFileName = `${originalVideoId}_version_${versionNumber}_${versionName}`;
  
  // Modify the file object to have the version filename
  const versionFile = new File([newFile], versionFileName, { type: newFile.type });
  
  // Upload the new version
  const uploadResponse = await drive.uploadFile(versionFile, folderId);
  
  return {
    id: uploadResponse.id,
    name: versionName,
    createdAt: uploadResponse.createdTime,
    driveFileId: uploadResponse.id,
    versionNumber: versionNumber,
  };
};

// Get versions for a video
export const getVideoVersions = async (
  accessToken: string,
  videoId: string
): Promise<VideoVersion[]> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);
  
  const response = await drive.listFiles(folderId, `name contains '${videoId}_version_'`);
  
  if (!response.files) {
    return [];
  }
  
  return response.files.map((file: any) => {
    // Extract version number and name from filename pattern
    const nameParts = file.name.split('_version_');
    const versionParts = nameParts && nameParts.length > 1 
      ? nameParts[1].split('_') 
      : ['1', 'Unknown'];
    
    return {
      id: file.id,
      name: versionParts.slice(1).join('_') || `Version ${versionParts[0]}`,
      createdAt: file.createdTime,
      driveFileId: file.id,
      versionNumber: parseInt(versionParts[0]) || 1,
    };
  });
};
