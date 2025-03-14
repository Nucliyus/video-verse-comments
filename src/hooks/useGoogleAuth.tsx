
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../lib/types';

interface GoogleAuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  getAccessToken: async () => null,
});

export const useGoogleAuth = () => {
  return useContext(GoogleAuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

// Google API Client ID - this should be replaced with your actual client ID
// in real implementation this should come from environment variables
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

// Define the scopes we need for the app
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.file' // Access to files created or opened by the app
];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient | null>(null);

  useEffect(() => {
    // Load the Google API client
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleAuth;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGoogleAuth = () => {
    if (!window.google) {
      console.error('Google API not loaded');
      setIsLoading(false);
      return;
    }

    // Initialize the token client
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES.join(' '),
      callback: handleTokenResponse,
    });

    setTokenClient(client);

    // Check if user is already authenticated
    checkAuth();
  };

  const checkAuth = () => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('googleAccessToken');
    const userData = localStorage.getItem('googleUserData');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          ...parsedUser,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If there's an error, clear localStorage
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('googleUserData');
      }
    }
    
    setIsLoading(false);
  };

  const handleTokenResponse = async (response: google.accounts.oauth2.TokenResponse) => {
    if (response.error) {
      console.error('Token error:', response.error);
      return;
    }

    // Store the token
    localStorage.setItem('googleAccessToken', response.access_token);
    
    // Fetch user info
    try {
      const userInfo = await fetchUserInfo(response.access_token);
      setUser({
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.picture,
        isAuthenticated: true
      });
      
      // Store user data
      localStorage.setItem('googleUserData', JSON.stringify({
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        image: userInfo.picture
      }));
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchUserInfo = async (accessToken: string) => {
    const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return response.json();
  };

  const login = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      console.error('Token client not initialized');
    }
  };

  const logout = () => {
    // Revoke token and sign out
    const token = localStorage.getItem('googleAccessToken');
    if (token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    }
    
    // Clear localStorage
    localStorage.removeItem('googleAccessToken');
    localStorage.removeItem('googleUserData');
    
    // Reset user state
    setUser(null);
  };

  const getAccessToken = async (): Promise<string | null> => {
    return localStorage.getItem('googleAccessToken');
  };

  return (
    <GoogleAuthContext.Provider value={{ user, isLoading, login, logout, getAccessToken }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

// Define Google types for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: google.accounts.oauth2.TokenResponse) => void;
          }) => google.accounts.oauth2.TokenClient;
        };
      };
    };
  }

  namespace google.accounts.oauth2 {
    interface TokenClient {
      requestAccessToken: (overrideConfig?: object) => void;
    }
    
    interface TokenResponse {
      access_token: string;
      error?: string;
      expires_in: number;
      scope: string;
      token_type: string;
    }
  }
}
