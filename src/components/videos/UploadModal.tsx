
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Upload, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, onProgress?: (progress: number) => void) => Promise<any>;
}

export const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadError(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      
      console.log('File selected:', selectedFile.name, 'Type:', selectedFile.type, 'Size:', selectedFile.size);
      setFile(selectedFile);
      setUploadError(null);
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
      
      console.log('File dropped:', droppedFile.name, 'Type:', droppedFile.type, 'Size:', droppedFile.size);
      setFile(droppedFile);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      console.log('Starting upload for file:', file.name);
      await onUpload(file, (progress) => {
        console.log(`Upload progress in modal: ${progress}%`);
        setUploadProgress(progress);
      });
      
      console.log('Upload completed successfully');
      toast.success('Video uploaded successfully');
      
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      toast.error('Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const resetFileInput = () => {
    setFile(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const retryUpload = () => {
    setUploadError(null);
    setUploadProgress(0);
    handleUpload();
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
              
              {uploadError ? (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Upload failed</p>
                    <p className="text-sm">{uploadError}</p>
                  </div>
                </div>
              ) : isUploading ? (
                <div className="mb-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="mt-2 text-xs text-right text-muted-foreground">
                    {uploadProgress.toFixed(0)}%
                  </div>
                </div>
              ) : null}
              
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
                {uploadError ? (
                  <Button 
                    onClick={retryUpload}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Retry Upload
                  </Button>
                ) : (
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
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
