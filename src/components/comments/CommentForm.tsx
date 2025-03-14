
import { useState } from 'react';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';

interface CommentFormProps {
  currentTime: number;
  onSubmit: (text: string, timestamp: number) => void;
}

export const CommentForm = ({ currentTime, onSubmit }: CommentFormProps) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (text.trim()) {
      onSubmit(text, currentTime);
      setText('');
    }
  };

  // Format timestamp as MM:SS
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-grow space-y-2">
        <div className="text-xs font-medium text-muted-foreground">
          Adding comment at {formatTimestamp(currentTime)}
        </div>
        <div className="relative">
          <textarea
            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input 
              focus:outline-none focus:ring-2 focus:ring-primary/30 
              placeholder:text-muted-foreground/60 resize-none"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={!text.trim()}
        className="bg-primary hover:bg-primary/90"
      >
        <Send size={16} className="mr-2" />
        Send
      </Button>
    </form>
  );
};
