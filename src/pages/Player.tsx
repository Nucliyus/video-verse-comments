
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { CommentList } from '../components/comments/CommentList';
import { CommentForm } from '../components/comments/CommentForm';
import { useVideos } from '../hooks/useVideos';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { VideoComment } from '../lib/types';
import { Button } from '../components/ui/button';
import { ArrowLeft, Share2, MoreVertical, Play, Pause, Volume2, VolumeX, MessageCircle, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

// Mock comments data
const mockComments: VideoComment[] = [
  {
    id: '1',
    text: 'The transition here feels a bit abrupt. Can we add a fade?',
    timestamp: 8,
    user: {
      id: '1',
      name: 'Alex Chen',
      image: 'https://i.pravatar.cc/150?img=12',
    },
    createdAt: '2023-10-15T14:52:00.000Z',
  },
  {
    id: '2',
    text: 'Great concept! Let\'s add a bit more emphasis on the product features here.',
    timestamp: 45,
    user: {
      id: '1',
      name: 'Alex Chen',
      image: 'https://i.pravatar.cc/150?img=12',
    },
    createdAt: '2023-10-15T14:58:00.000Z',
  },
  {
    id: '3',
    text: 'Can we adjust the background music to be a bit quieter around this section?',
    timestamp: 67,
    user: {
      id: '2',
      name: 'Taylor Kim',
      image: 'https://i.pravatar.cc/150?img=32',
    },
    createdAt: '2023-10-16T09:12:00.000Z',
  },
];

const Player = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVideo } = useVideos();
  const { user } = useGoogleAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState(getVideo(id || ''));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>(mockComments);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(true);

  useEffect(() => {
    // If video not found, navigate back to home
    if (!video) {
      toast.error('Video not found');
      navigate('/');
    }
  }, [video, navigate]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(videoElement.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('durationchange', handleDurationChange);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('durationchange', handleDurationChange);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    
    videoRef.current.currentTime = time;
    if (!isPlaying) {
      videoRef.current.play();
    }
  };

  const handleAddComment = (text: string, timestamp: number) => {
    if (!user) {
      toast.error('Please sign in to add comments');
      return;
    }

    const newComment: VideoComment = {
      id: `comment-${Date.now()}`,
      text,
      timestamp,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      createdAt: new Date().toISOString(),
    };

    setComments(prev => [...prev, newComment]);
    toast.success('Comment added');
  };

  const handleDeleteComment = (id: string) => {
    setComments(prev => prev.filter(comment => comment.id !== id));
    toast.success('Comment deleted');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!video) return null;

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">{video.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl overflow-hidden bg-black relative mb-4">
            <video 
              ref={videoRef}
              className="w-full h-auto"
              poster={video.thumbnail}
              controls={false}
              src="https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <Button 
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                
                <div className="flex-grow h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
                
                <Button 
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  onClick={handleMuteToggle}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {video.versions && video.versions.length > 0 && (
                <div className="px-2 py-1 rounded-full bg-secondary text-xs font-medium">
                  v{(video.versions.length || 0) + 1}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(video.updatedAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => toast.info('Share functionality coming soon!')}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => toast.info('More options coming soon!')}
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="comments" className="mb-6">
            <TabsList>
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="versions">
                Versions ({(video.versions?.length || 0) + 1})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="pt-4">
              <CommentForm 
                currentTime={currentTime}
                onSubmit={handleAddComment}
              />
            </TabsContent>
            
            <TabsContent value="versions" className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Current Version (v{(video.versions?.length || 0) + 1})</div>
                    <div className="text-sm text-muted-foreground">
                      Updated on {new Date(video.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Replace</Button>
                    <Button variant="ghost" size="sm">Download</Button>
                  </div>
                </div>
                
                {video.versions?.map((version, index) => (
                  <div key={version.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium">Version {version.versionNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        Created on {new Date(version.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Restore</Button>
                      <Button variant="ghost" size="sm">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className={`lg:block ${showCommentsSidebar ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Comments Timeline
            </h3>
            <Button 
              variant="ghost" 
              size="icon"
              className="lg:hidden"
              onClick={() => setShowCommentsSidebar(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CommentList 
            comments={comments}
            onSeek={handleSeek}
            onDelete={handleDeleteComment}
          />
        </div>
        
        <Button
          variant="outline"
          className="fixed bottom-6 right-6 lg:hidden"
          onClick={() => setShowCommentsSidebar(true)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Show Comments
        </Button>
      </div>
    </Layout>
  );
};

export default Player;
