
import { VideoFile } from '../../lib/types';
import { Link } from 'react-router-dom';
import { Clock, Calendar, Video } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';

interface VideoCardProps {
  video: VideoFile;
}

export const VideoCard = ({ video }: VideoCardProps) => {
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

  return (
    <Link to={`/player/${video.id}`} className="video-card group">
      <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
        <AspectRatio ratio={16/9} className="w-full h-full">
          {video.thumbnail ? (
            <img 
              src={video.thumbnail} 
              alt={video.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
              <Video className="w-12 h-12 opacity-20" />
              <span className="sr-only">No Preview</span>
            </div>
          )}
        </AspectRatio>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-base text-foreground line-clamp-1 mb-2">{video.name}</h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>{formatDate(video.createdAt)}</span>
          </div>
          {video.versions && video.versions.length > 0 && (
            <div className="px-1.5 py-0.5 rounded bg-secondary text-xs">
              {video.versions.length + 1} versions
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
