
import { useState, useMemo } from 'react';
import { VideoComment } from '../../lib/types';
import { MessageCircle, Clock, X, UserCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface CommentListProps {
  comments: VideoComment[];
  onSeek: (time: number) => void;
  onDelete?: (id: string) => void;
}

export const CommentList = ({ comments, onSeek, onDelete }: CommentListProps) => {
  const [filter, setFilter] = useState<'all' | 'timeline'>('all');
  
  // Sort comments by timestamp and memoize to prevent unnecessary re-renders
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => a.timestamp - b.timestamp);
  }, [comments]);

  // Format timestamp as MM:SS
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date as relative time (e.g. "2 days ago")
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageCircle className="w-6 h-6 text-muted-foreground" />
        </div>
        <h4 className="font-medium mb-1">No comments yet</h4>
        <p className="text-sm text-muted-foreground">
          Add comments by pausing the video and typing your feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-primary hover:bg-primary/90' : ''}
        >
          All Comments ({comments.length})
        </Button>
        <Button
          variant={filter === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('timeline')}
          className={filter === 'timeline' ? 'bg-primary hover:bg-primary/90' : ''}
        >
          Timeline View
        </Button>
      </div>

      {filter === 'all' ? (
        <div className="space-y-4">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="bg-white border border-border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {comment.user.isGuest ? (
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                      <UserCircle size={20} />
                    </div>
                  ) : comment.user.image ? (
                    <img 
                      src={comment.user.image} 
                      alt={comment.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {comment.user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {comment.user.name}
                      {comment.user.isGuest && <span className="text-xs ml-1 text-muted-foreground">(Guest)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => onSeek(comment.timestamp)}
                  >
                    <Clock size={12} className="mr-1" />
                    {formatTimestamp(comment.timestamp)}
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDelete(comment.id)}
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative border-l-2 border-border pl-6 ml-3">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="mb-6 relative">
              <div 
                className="absolute -left-[calc(0.75rem+1px)] top-0 w-3 h-3 rounded-full bg-primary"
                style={{
                  top: `${(comment.timestamp / (sortedComments[sortedComments.length - 1]?.timestamp || 1)) * 100}%`
                }}
              ></div>
              <div className="bg-white border border-border rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {comment.user.isGuest ? (
                      <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs">
                        <UserCircle size={14} />
                      </div>
                    ) : comment.user.image ? (
                      <img 
                        src={comment.user.image} 
                        alt={comment.user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                        {comment.user.name.charAt(0)}
                      </div>
                    )}
                    <p className="font-medium text-xs">
                      {comment.user.name}
                      {comment.user.isGuest && <span className="text-xs ml-1 text-muted-foreground">(Guest)</span>}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => onSeek(comment.timestamp)}
                  >
                    {formatTimestamp(comment.timestamp)}
                  </Button>
                </div>
                <p className="text-xs">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
