
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data since we aren't implementing the actual Google OAuth yet
const mockUser: User = {
  id: '1',
  name: 'Alex Chen',
  email: 'alex@example.com',
  image: 'https://i.pravatar.cc/150?img=12',
  isAuthenticated: true,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // In a real app, we would check the session or token here
        // For now, we'll use localStorage as a mock
        const savedUser = localStorage.getItem('videoApp_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      // Mock login - in real app, this would initiate Google OAuth flow
      setUser(mockUser);
      localStorage.setItem('videoApp_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Mock logout - in real app, this would clear tokens and end session
      setUser(null);
      localStorage.removeItem('videoApp_user');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within an AuthProvider');
  }
  return context;
};
