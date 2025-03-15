import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CommentForm } from '../components/comments/CommentForm';
import { CommentList } from '../components/comments/CommentList';
import { ShareDialog } from '../components/videos/ShareDialog';
import { VideoComment } from '../lib/types';
import { useVideos } from '../hooks/useVideos';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { 
  ArrowLeft, MessageSquare, 
  Clock, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

const Player = () => {
  const { id } = useParams<{ id: string }>();
  const { getVideo, addComment, getComments } = useVideos();
  const { user } = useGoogleAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9);
  const [showMarkers, setShowMarkers] = useState(true);

  const video = id ? getVideo(id) : null;
  
  useEffect(() => {
    // Load comments for this video
    const loadComments = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const videoComments = await getComments(id);
          setComments(videoComments);
        } catch (error) {
          console.error('Error loading comments:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadComments();
  }, [id, user?.isAuthenticated]);

  // Initialize Plyr video player
  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      const player = new Plyr(videoRef.current, {
        controls: [
          'play-large', 'play', 'progress', 'current-time', 
          'mute', 'volume', 'captions', 'settings', 'fullscreen'
        ],
        hideControls: false,
        autoplay: false
      });

      player.on('timeupdate', () => {
        setCurrentTime(player.currentTime);
      });

      player.on('loadedmetadata', () => {
        if (videoRef.current) {
          setDuration(player.duration);
          
          // Calculate video aspect ratio
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          
          if (videoWidth && videoHeight) {
            setVideoAspectRatio(videoWidth / videoHeight);
          }
        }
      });

      playerRef.current = player;

      return () => {
        player.destroy();
        playerRef.current = null;
      };
    }
  }, [videoRef.current]);

  // Add comment markers to the timeline when comments are loaded
  useEffect(() => {
    if (playerRef.current && comments.length > 0 && showMarkers) {
      // Get the Plyr progress bar
      const progressBar = document.querySelector('.plyr__progress');
      
      if (progressBar) {
        // Clear previous markers
        const existingMarkers = progressBar.querySelectorAll('.comment-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Add new markers
        comments.forEach(comment => {
          if (comment.timestamp && duration > 0) {
            const marker = document.createElement('div');
            marker.className = 'comment-marker';
            marker.title = `${comment.user.name}: ${comment.text}`;
            
            // Position marker based on timestamp
            const position = (comment.timestamp / duration) * 100;
            marker.style.left = `${position}%`;
            
            // Add click handler to seek to this position
            marker.addEventListener('click', (e) => {
              e.stopPropagation();
              handleSeekToComment(comment.timestamp);
            });
            
            progressBar.appendChild(marker);
          }
        });
      }
    }
  }, [comments, duration, showMarkers, currentTime]);

  const handleSeekToComment = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
      setCurrentTime(time);
      
      // Start playing from this point
      playerRef.current.play();
    }
  };

  const handleAddComment = async (text: string, timestamp: number) => {
    if (!user) {
      toast.error('Please sign in to add comments');
      return;
    }

    if (!id) return;
    
    try {
      const newComment = await addComment(id, {
        text,
        timestamp,
        user: {
          id: user.id,
          name: user.name,
          image: user.image
        }
      });
      
      setComments(prev => [...prev, newComment]);
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleShareComment = async (name: string, comment: string) => {
    if (!id) return;
    
    try {
      const newComment = await addComment(id, {
        text: comment || `${name} viewed this video`,
        timestamp: currentTime,
        user: {
          id: `guest-${Date.now()}`,
          name: name,
          isGuest: true
        }
      });
      
      setComments(prev => [...prev, newComment]);
      return Promise.resolve();
    } catch (error) {
      console.error('Error adding guest comment:', error);
      return Promise.reject(error);
    }
  };

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!video) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <p className="text-lg font-medium">Loading video...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-2 p-1" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-xl font-semibold">{video.name}</h1>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-1" 
          onClick={() => setShowShareDialog(true)}
        >
          <Share2 size={16} />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-md overflow-hidden relative bg-black">
            <AspectRatio ratio={videoAspectRatio}>
              <video
                ref={videoRef}
                className="plyr-video"
                src={`https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media`}
                preload="metadata"
                crossOrigin="anonymous"
              />
            </AspectRatio>
          </div>
          
          <div>
            <Tabs defaultValue="comments">
              <TabsList className="mb-4">
                <TabsTrigger value="comments" className="flex items-center gap-1">
                  <MessageSquare size={14} /> Comments ({comments.length})
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-1">
                  <Clock size={14} /> Timeline
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="space-y-4">
                {user?.isAuthenticated ? (
                  <CommentForm currentTime={currentTime} onSubmit={handleAddComment} />
                ) : (
                  <div className="text-center py-4 border border-dashed border-border rounded-md">
                    <p className="text-sm text-muted-foreground">
                      Sign in to add comments or click Share to comment as a guest
                    </p>
                  </div>
                )}
                
                <CommentList comments={comments} onSeek={handleSeekToComment} />
              </TabsContent>
              
              <TabsContent value="timeline">
                <CommentList comments={comments} onSeek={handleSeekToComment} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-card rounded-md border border-border p-4">
            <h2 className="text-lg font-medium mb-3">Video Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(video.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm">{new Date(video.updatedAt).toLocaleDateString()}</p>
              </div>
              {video.duration && (
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm">{formatTime(video.duration)}</p>
                </div>
              )}
              {video.versions && video.versions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Versions</p>
                  <p className="text-sm">{video.versions.length}</p>
                </div>
              )}
            </div>
          </div>
          
          {video.versions && video.versions.length > 0 && (
            <div className="bg-card rounded-md border border-border p-4">
              <h2 className="text-lg font-medium mb-3">Versions</h2>
              <div className="space-y-2">
                {video.versions.map((version) => (
                  <div 
                    key={version.id}
                    className="p-2 border border-border rounded-md flex justify-between items-center hover:bg-accent cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium">{version.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      v{version.versionNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ShareDialog 
        video={video}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onShareComment={handleShareComment}
      />

      <style jsx global>{`
        .comment-marker {
          position: absolute;
          width: 4px;
          height: 12px;
          background-color: rgb(239 68 68); /* Red */
          top: -5px;
          border-radius: 2px;
          cursor: pointer;
          z-index: 10;
          transition: height 0.2s;
        }
        
        .comment-marker:hover {
          height: 16px;
          background-color: rgb(248 113 113); /* Lighter red */
        }
        
        .plyr__progress {
          position: relative;
        }
      `}</style>
    </Layout>
  );
};

export default Player;
