
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { Button } from '../ui/button';
import { LogIn, LogOut } from 'lucide-react';

export const GoogleAuth = () => {
  const { user, isLoading, login, logout } = useGoogleAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" disabled className="opacity-70">
        <span className="animate-pulse">Loading...</span>
      </Button>
    );
  }

  if (user?.isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium hidden md:block">
          {user.name}
        </div>
        {user.image && (
          <img 
            src={user.image} 
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
        )}
        <Button variant="ghost" size="sm" onClick={() => logout()}>
          <LogOut size={18} className="mr-2" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => login()} className="bg-primary hover:bg-primary/90">
      <LogIn size={18} className="mr-2" />
      Sign in with Google
    </Button>
  );
};
