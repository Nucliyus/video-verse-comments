
import { useState, useEffect } from 'react';
import { VideoFile } from '../lib/types';

// Mock data for initial development
const mockVideos: VideoFile[] = [
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
];

export const useVideos = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, we would fetch from an API here
        // Simulate a network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setVideos(mockVideos);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const addVideo = async (file: File) => {
    // This would be an API call to upload to Google Drive in the real app
    // For now, we'll just simulate adding a new video to the list
    
    setIsLoading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newVideo: VideoFile = {
        id: `new-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        thumbnail: 'https://images.unsplash.com/photo-1516540438350-b775244013c1?q=80&w=3400&auto=format',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 0, // Would be determined after processing
        driveFileId: `gdrive-new-${Date.now()}`,
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

  return {
    videos,
    isLoading,
    error,
    addVideo,
    getVideo
  };
};
