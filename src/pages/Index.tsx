
import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { VideoGrid } from '../components/videos/VideoGrid';
import { UploadModal } from '../components/videos/UploadModal';
import { useVideos } from '../hooks/useVideos';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { Button } from '../components/ui/button';
import { Upload, Film, Folder, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { videos, isLoading, addVideo, fetchVideos } = useVideos();
  const { user } = useGoogleAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure videos are loaded when the component mounts
  useEffect(() => {
    if (user?.isAuthenticated) {
      fetchVideos(true); // Force refresh on initial load
    }
  }, [user?.isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchVideos(true); // Force refresh
      toast.success('Videos refreshed');
    } catch (error) {
      toast.error('Failed to refresh videos');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUploadClick = () => {
    if (!user?.isAuthenticated) {
      toast.error('Please sign in to upload videos', {
        description: 'You need to be signed in with Google to upload videos.',
        action: {
          label: 'Dismiss',
          onClick: () => {}
        }
      });
      return;
    }
    setShowUploadModal(true);
  };

  const handleUpload = async (file: File, onProgress?: (progress: number) => void) => {
    try {
      console.log('Starting video upload process...');
      const result = await addVideo(file, onProgress);
      
      // Explicitly refresh videos after upload completes
      if (result) {
        console.log('Upload successful, refreshing videos list');
        // Wait a bit longer for Google Drive to process the video
        setTimeout(() => {
          fetchVideos(true); // Force refresh
        }, 3000); 
      }
      
      return !!result;
    } catch (error) {
      console.error('Upload error in Index:', error);
      return false;
    }
  };

  return (
    <Layout onUploadClick={handleUploadClick}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1 text-foreground">Videos</h1>
          <p className="text-muted-foreground">
            {videos.length > 0 
              ? `${videos.length} video${videos.length !== 1 ? 's' : ''} in your library`
              : 'Upload your first video to get started'
            }
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => toast.info('Folders coming soon!')}
          >
            <Folder size={16} />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
          <Button 
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            onClick={handleUploadClick}
          >
            <Upload size={16} />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>
      
      {!user?.isAuthenticated && !isLoading && videos.length === 0 && (
        <div className="glass-panel rounded-xl p-6 mb-8 text-center">
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-secondary flex items-center justify-center text-primary">
            <Film size={24} />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to VideoVerse</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Sign in with your Google account to upload videos, add comments, 
            and manage versions. Your videos are stored in your Google Drive.
          </p>
        </div>
      )}
      
      <VideoGrid videos={videos} isLoading={isLoading} />
      
      <UploadModal 
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          // Refresh videos when modal is closed
          fetchVideos(true); // Force refresh
        }}
        onUpload={handleUpload}
      />
    </Layout>
  );
};

export default Index;
