
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { VideoGrid } from '../components/videos/VideoGrid';
import { UploadModal } from '../components/videos/UploadModal';
import { useVideos } from '../hooks/useVideos';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { Button } from '../components/ui/button';
import { Upload, Film, Folder } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const { videos, isLoading, addVideo } = useVideos();
  const { user } = useGoogleAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  const handleUpload = async (file: File) => {
    try {
      await addVideo(file);
      return true;
    } catch (error) {
      console.error('Upload error:', error);
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
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
      />
    </Layout>
  );
};

export default Index;
