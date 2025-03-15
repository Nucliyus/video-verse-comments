
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Check, Copy, Share } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';
import { VideoFile } from '../../lib/types';
import { toast } from 'sonner';

interface ShareDialogProps {
  video: VideoFile;
  isOpen: boolean;
  onClose: () => void;
  onShareComment: (name: string, comment: string) => Promise<void>;
}

export const ShareDialog = ({ video, isOpen, onClose, onShareComment }: ShareDialogProps) => {
  const [copying, setCopying] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestComment, setGuestComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const shareUrl = `${window.location.origin}/player/${video.id}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopying(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };
  
  const handleSubmitComment = async () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onShareComment(guestName, guestComment);
      toast.success('Comment added successfully');
      setGuestName('');
      setGuestComment('');
      onClose();
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Video</DialogTitle>
          <DialogDescription>
            Share this video with others or leave a comment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">Link</Label>
              <Input
                id="link"
                defaultValue={shareUrl}
                readOnly
                className="h-9"
              />
            </div>
            <Button 
              size="sm" 
              className="px-3" 
              onClick={handleCopyLink}
            >
              {copying ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
              {copying ? 'Copied' : 'Copy'}
            </Button>
          </div>
          
          <div className="aspect-video rounded-md overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt={video.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">No preview available</p>
                </div>
              )}
            </AspectRatio>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guestName">Your Name</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your name"
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guestComment">Comment (optional)</Label>
            <Textarea
              id="guestComment"
              value={guestComment}
              onChange={(e) => setGuestComment(e.target.value)}
              placeholder="Add a comment about this video"
              className="min-h-24"
            />
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleSubmitComment}
              disabled={!guestName.trim() || isSubmitting}
            >
              Add Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
