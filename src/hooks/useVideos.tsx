import { useState, useEffect } from 'react';
import { VideoFile, VideoComment, VideoVersion } from '../lib/types';
import { useGoogleAuth } from './useGoogleAuth';
import { 
  listVideosFromDrive, 
  uploadVideoToDrive, 
  getVideoVersions,
  createVideoVersion,
  saveCommentsForVideo,
  getCommentsForVideo
} from '../lib/driveApi';
import { toast } from 'sonner';

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, getAccessToken } = useGoogleAuth();

  const fetchVideos = async () => {
    if (!user?.isAuthenticated) {
      setVideos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      const driveVideos = await listVideosFromDrive(accessToken);
      
      // For each video, fetch its versions
      const videosWithVersions = await Promise.all(
        driveVideos.map(async (video) => {
          const versions = await getVideoVersions(accessToken, video.id);
          return { ...video, versions };
        })
      );
      
      setVideos(videosWithVersions);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again later.');
      
      // Fallback to mock data for development purposes
      setVideos([
        {
          id: '1',
          name: 'Product Intro v2',
          thumbnail: 'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=3270&auto=format',
          createdAt: '2023-10-15T14:48:00.000Z',
          updatedAt: '2023-10-17T09:12:00.000Z',
          duration: 84,
          driveFileId: 'gdrive-1234',
          versions: [
            {
              id: '1-1',
              name: 'v1',
              createdAt: '2023-10-15T14:48:00.000Z',
              driveFileId: 'gdrive-1234-v1',
              versionNumber: 1
            },
            {
              id: '1-2',
              name: 'v2',
              createdAt: '2023-10-17T09:12:00.000Z',
              driveFileId: 'gdrive-1234-v2',
              versionNumber: 2
            }
          ]
        },
        {
          id: '2',
          name: 'Client Presentation Final',
          thumbnail: 'https://images.unsplash.com/photo-1626763847023-b1c347a2b265?q=80&w=3270&auto=format',
          createdAt: '2023-10-12T10:23:00.000Z',
          updatedAt: '2023-10-12T10:23:00.000Z',
          duration: 246,
          driveFileId: 'gdrive-5678',
          versions: []
        },
        {
          id: '3',
          name: 'Tutorial Screencast',
          thumbnail: 'https://images.unsplash.com/photo-1626544827765-restaring-of-a-digitalization?q=80&w=3270&auto=format',
          createdAt: '2023-10-08T16:05:00.000Z',
          updatedAt: '2023-10-09T11:30:00.000Z',
          duration: 324,
          driveFileId: 'gdrive-9012',
          versions: []
        },
        {
          id: '4',
          name: 'Team Update',
          thumbnail: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=3387&auto=format',
          createdAt: '2023-10-05T09:47:00.000Z',
          updatedAt: '2023-10-05T09:47:00.000Z',
          duration: 178,
          driveFileId: 'gdrive-3456',
          versions: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user?.isAuthenticated]);

  const addVideo = async (file: File) => {
    if (!user?.isAuthenticated) {
      toast.error('You need to be logged in to upload videos');
      throw new Error('Not authenticated');
    }
    
    setIsLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      const driveFileId = await uploadVideoToDrive(
        accessToken, 
        file, 
        (progress) => {
          // Progress updates can be used in the UI
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      const newVideo: VideoFile = {
        id: driveFileId,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        thumbnail: undefined, // Drive might generate this later
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 0, // Will be determined when played
        driveFileId: driveFileId,
        versions: []
      };
      
      setVideos(prev => [newVideo, ...prev]);
      return newVideo;
    } catch (err) {
      console.error('Error adding video:', err);
      setError('Failed to upload video. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getVideo = (id: string) => {
    return videos.find(video => video.id === id) || null;
  };

  const addComment = async (videoId: string, comment: Omit<VideoComment, 'id' | 'createdAt'>) => {
    if (!user?.isAuthenticated) {
      toast.error('You need to be logged in to add comments');
      throw new Error('Not authenticated');
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      // Get existing comments
      const existingComments = await getCommentsForVideo(accessToken, videoId);
      
      // Create new comment
      const newComment: VideoComment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...comment,
        createdAt: new Date().toISOString()
      };
      
      const updatedComments = [...existingComments, newComment];
      
      // Save back to Drive
      await saveCommentsForVideo(accessToken, videoId, updatedComments);
      
      return newComment;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment. Please try again.');
      throw err;
    }
  };

  const getComments = async (videoId: string) => {
    if (!user?.isAuthenticated) {
      return [];
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      return await getCommentsForVideo(accessToken, videoId);
    } catch (err) {
      console.error('Error getting comments:', err);
      toast.error('Failed to load comments. Please try again.');
      return [];
    }
  };

  const addVersion = async (videoId: string, file: File, versionName: string) => {
    if (!user?.isAuthenticated) {
      toast.error('You need to be logged in to create versions');
      throw new Error('Not authenticated');
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      const newVersion = await createVideoVersion(
        accessToken,
        videoId,
        file,
        versionName
      );
      
      // Update local state
      setVideos(prev => 
        prev.map(video => {
          if (video.id === videoId) {
            return {
              ...video,
              versions: [...(video.versions || []), newVersion]
            };
          }
          return video;
        })
      );
      
      return newVersion;
    } catch (err) {
      console.error('Error adding version:', err);
      toast.error('Failed to create new version. Please try again.');
      throw err;
    }
  };

  return {
    videos,
    isLoading,
    error,
    addVideo,
    getVideo,
    fetchVideos,
    addComment,
    getComments,
    addVersion
  };
};

