
import { Link } from 'react-router-dom';
import { GoogleAuth } from '../auth/GoogleAuth';
import { Upload, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface HeaderProps {
  onUploadClick?: () => void;
}

export const Header = ({ onUploadClick }: HeaderProps) => {
  return (
    <header className="w-full py-4 px-6 border-b border-border backdrop-blur-lg bg-white/80 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <svg 
              className="w-8 h-8 text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M4 6.4C4 5.08497 4 4.42746 4.21799 3.98228C4.40973 3.59722 4.71569 3.29126 5.10074 3.09953C5.54592 2.88153 6.20343 2.88153 7.51846 2.88153H16.4815C17.7966 2.88153 18.4541 2.88153 18.8993 3.09953C19.2843 3.29126 19.5903 3.59722 19.782 3.98228C20 4.42746 20 5.08497 20 6.4V17.6C20 18.915 20 19.5725 19.782 20.0177C19.5903 20.4028 19.2843 20.7087 18.8993 20.9005C18.4541 21.1185 17.7966 21.1185 16.4815 21.1185H7.51846C6.20343 21.1185 5.54592 21.1185 5.10074 20.9005C4.71569 20.7087 4.40973 20.4028 4.21799 20.0177C4 19.5725 4 18.915 4 17.6V6.4Z" 
                stroke="currentColor" 
                strokeWidth="2"
              />
              <path 
                d="M10 16.5L16 12L10 7.5V16.5Z" 
                fill="currentColor" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xl font-semibold">VideoVerse</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {onUploadClick && (
            <Button 
              onClick={onUploadClick}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              <Upload size={16} />
              <span className="hidden md:inline">Upload</span>
            </Button>
          )}
          <GoogleAuth />
        </div>
      </div>
    </header>
  );
};
