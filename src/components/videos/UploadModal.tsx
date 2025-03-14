
import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Upload, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<any>;
}

export const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Check if it's a video file
      if (!selectedFile.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const droppedFile = e.dataTransfer.files?.[0] || null;
    
    if (droppedFile) {
      if (!droppedFile.type.startsWith('video/')) {
        toast.error('Please drop a valid video file');
        return;
      }
      
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + (100 - prev) * 0.1;
          return Math.min(newProgress, 99); // Cap at 99% until finished
        });
      }, 300);
      
      await onUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Video uploaded successfully');
      
      // Reset and close after a short delay
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetFileInput = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Upload Video</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {!file ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 text-center"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              
              <h3 className="text-lg font-medium mb-2">Drag & drop your video</h3>
              <p className="text-sm text-muted-foreground mb-4">
                or select a file from your computer
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            </div>
          ) : (
            <div className="rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                    <svg 
                      className="w-5 h-5 text-primary" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M16 10l-4 4-4-4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M12 14V4" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M20 16v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4" 
                        stroke="currentColor"
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {!isUploading && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={resetFileInput}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {isUploading && (
                <div className="mb-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-right text-muted-foreground">
                    {uploadProgress.toFixed(0)}%
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                {!isUploading && (
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : uploadProgress === 100 ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Done
                    </>
                  ) : (
                    'Upload Video'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
