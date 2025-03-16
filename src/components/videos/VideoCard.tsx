
import { VideoFile } from '../../lib/types';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Video, Play } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';
import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';

interface VideoCardProps {
  video: VideoFile;
}

export const VideoCard = ({ video }: VideoCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset image states when the video changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [video]);

  // Format creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Format duration
  const formatDuration = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageError = () => {
    console.log(`Image failed to load for video: ${video.id}, thumbnail URL: ${video.thumbnail || 'none'}`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`Image loaded successfully for video: ${video.id}`);
    setImageLoaded(true);
  };

  // Determine gradient class for card
  const getGradientClass = () => {
    const gradients = [
      'pastel-gradient-blue',
      'pastel-gradient-green',
      'pastel-gradient-peach',
      'pastel-gradient-yellow'
    ];
    // Use a hash of the video ID to pick a consistent gradient for each video
    const hash = video.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <Link to={`/player/${video.id}`} className="video-card group">
      <div className="relative overflow-hidden rounded-xl glass-card">
        <div className="aspect-video relative overflow-hidden rounded-t-xl">
          <AspectRatio ratio={16/9} className="w-full h-full">
            {video.thumbnail && !imageError ? (
              <>
                {/* Pastel gradient background while image loads */}
                <div className={`absolute inset-0 ${getGradientClass()} flex items-center justify-center ${imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-500`}>
                  <Play className="w-12 h-12 text-white/70 filter drop-shadow-md" />
                </div>
                <img 
                  src={video.thumbnail} 
                  alt={video.name} 
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </>
            ) : (
              <div className={`w-full h-full ${getGradientClass()} flex items-center justify-center`}>
                <Play className="w-12 h-12 text-white/70 filter drop-shadow-md" />
                <span className="sr-only">No Preview</span>
              </div>
            )}
          </AspectRatio>
          {video.duration && (
            <div className="absolute bottom-2 right-2 backdrop-blur-md bg-black/30 text-white text-xs px-2 py-1 rounded-md border border-white/10">
              {formatDuration(video.duration)}
            </div>
          )}
          
          {/* Play button overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-16 h-16 rounded-full glass-effect flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-base text-foreground line-clamp-1 mb-2 text-shadow">{video.name}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{formatDate(video.createdAt)}</span>
            </div>
            {video.versions && video.versions.length > 0 && (
              <Badge variant="secondary" className="bg-[#E5DEFF]/50 text-[#6E56CF] border border-[#6E56CF]/20">
                {video.versions.length + 1} versions
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
