
import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
  onUploadClick?: () => void;
}

export const Layout = ({ children, onUploadClick }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header onUploadClick={onUploadClick} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:px-6">
        {children}
      </main>
      <footer className="py-6 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VideoVerse. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Help
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
