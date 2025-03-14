
import { google } from 'googleapis';
import { User, VideoFile, VideoComment, VideoVersion } from './types';

// Application folder name in user's Google Drive
const APP_FOLDER_NAME = 'VideoVerse';

// Initialize the Drive API client
export const getDriveClient = (accessToken: string) => {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
};

// Create or find the app folder in Drive
export const getOrCreateAppFolder = async (accessToken: string): Promise<string> => {
  const drive = getDriveClient(accessToken);

  // Check if folder already exists
  const response = await drive.files.list({
    q: `name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id as string;
  }

  // Create folder if it doesn't exist
  const folderMetadata = {
    name: APP_FOLDER_NAME,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return folder.data.id as string;
};

// Upload a video file to Google Drive
export const uploadVideoToDrive = async (
  accessToken: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const fileMetadata = {
    name: file.name,
    parents: [folderId],
  };

  const media = {
    mimeType: file.type,
    body: uint8Array,
  };

  const uploadResponse = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id,name,thumbnailLink,createdTime,modifiedTime',
  });

  return uploadResponse.data.id as string;
};

// List all videos from the app folder
export const listVideosFromDrive = async (accessToken: string): Promise<VideoFile[]> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);

  const response = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'video/' and trashed=false`,
    fields: 'files(id, name, thumbnailLink, createdTime, modifiedTime)',
    spaces: 'drive',
  });

  if (!response.data.files) {
    return [];
  }

  // Map Drive files to our VideoFile type
  return response.data.files.map(file => ({
    id: file.id as string,
    name: file.name as string,
    thumbnail: file.thumbnailLink || undefined,
    createdAt: file.createdTime as string,
    updatedAt: file.modifiedTime as string,
    driveFileId: file.id as string,
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
  
  // Check if comments file already exists
  const response = await drive.files.list({
    q: `name='${videoId}_comments.json' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  const commentsJson = JSON.stringify(comments);
  const commentsBlob = new Blob([commentsJson], { type: 'application/json' });
  const arrayBuffer = await commentsBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  if (response.data.files && response.data.files.length > 0) {
    // Update existing file
    const fileId = response.data.files[0].id as string;
    await drive.files.update({
      fileId: fileId,
      media: {
        mimeType: 'application/json',
        body: uint8Array,
      },
    });
  } else {
    // Create new file
    const fileMetadata = {
      name: `${videoId}_comments.json`,
      parents: [folderId],
    };

    await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'application/json',
        body: uint8Array,
      },
    });
  }
};

// Get comments for a video from Drive
export const getCommentsForVideo = async (
  accessToken: string,
  videoId: string
): Promise<VideoComment[]> => {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);
  
  const response = await drive.files.list({
    q: `name='${videoId}_comments.json' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (!response.data.files || response.data.files.length === 0) {
    return [];
  }

  const fileId = response.data.files[0].id as string;
  const fileResponse = await drive.files.get({
    fileId: fileId,
    alt: 'media',
  });

  return fileResponse.data as VideoComment[];
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

  // Get the original video to determine version number
  const versionsResponse = await drive.files.list({
    q: `name contains '${originalVideoId}_version_' and '${folderId}' in parents and trashed=false`,
    fields: 'files(name)',
    spaces: 'drive',
  });

  const versionNumber = versionsResponse.data.files 
    ? versionsResponse.data.files.length + 1 
    : 1;

  // Upload the new version file
  const arrayBuffer = await newFile.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const fileMetadata = {
    name: `${originalVideoId}_version_${versionNumber}_${versionName}`,
    parents: [folderId],
  };

  const media = {
    mimeType: newFile.type,
    body: uint8Array,
  };

  const uploadResponse = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id,name,createdTime',
  });

  return {
    id: uploadResponse.data.id as string,
    name: versionName,
    createdAt: uploadResponse.data.createdTime as string,
    driveFileId: uploadResponse.data.id as string,
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
  
  const response = await drive.files.list({
    q: `name contains '${videoId}_version_' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, createdTime)',
    spaces: 'drive',
    orderBy: 'createdTime desc',
  });

  if (!response.data.files) {
    return [];
  }

  return response.data.files.map(file => {
    // Extract version number and name from filename pattern
    const nameParts = file.name?.split('_version_');
    const versionParts = nameParts && nameParts.length > 1 
      ? nameParts[1].split('_') 
      : ['1', 'Unknown'];
    
    return {
      id: file.id as string,
      name: versionParts.slice(1).join('_') || `Version ${versionParts[0]}`,
      createdAt: file.createdTime as string,
      driveFileId: file.id as string,
      versionNumber: parseInt(versionParts[0]) || 1,
    };
  });
};
