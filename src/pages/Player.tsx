
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { CommentForm } from '../components/comments/CommentForm';
import { CommentList } from '../components/comments/CommentList';
import { ShareDialog } from '../components/videos/ShareDialog';
import { VideoComment } from '../lib/types';
import { useVideos } from '../hooks/useVideos';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { AspectRatio } from '../components/ui/aspect-ratio';
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, MessageSquare, 
  Clock, SkipBack, SkipForward, Share, Share2
} from 'lucide-react';
import { toast } from 'sonner';

const Player = () => {
  const { id } = useParams<{ id: string }>();
  const { getVideo, addComment, getComments } = useVideos();
  const { user } = useGoogleAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9);

  const video = id ? getVideo(id) : null;
  
  useEffect(() => {
    if (!video) {
      if (!isLoading) {
        toast.error('Video not found');
        navigate('/');
      }
      return;
    }

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Calculate video aspect ratio
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      if (videoWidth && videoHeight) {
        setVideoAspectRatio(videoWidth / videoHeight);
      }
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleSeekToComment = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
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

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
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
          <div className="bg-black rounded-md overflow-hidden relative">
            <AspectRatio ratio={videoAspectRatio}>
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                src={`https://www.googleapis.com/drive/v3/files/${video.driveFileId}?alt=media`}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls={false}
                preload="metadata"
              />
            </AspectRatio>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-2 mb-2">
                <Progress
                  value={(currentTime / duration) * 100}
                  className="h-1.5 flex-grow cursor-pointer"
                  onClick={(e) => {
                    if (videoRef.current) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const pos = (e.clientX - rect.left) / rect.width;
                      videoRef.current.currentTime = duration * pos;
                    }
                  }}
                />
                <span className="text-xs text-white">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={skipBackward}
                  >
                    <SkipBack size={16} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-white hover:bg-white/20"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={skipForward}
                  >
                    <SkipForward size={16} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-white hover:bg-white/20 ml-2"
                    onClick={handleMuteToggle}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </Button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
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
    </Layout>
  );
};

export default Player;
