
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isAuthenticated: boolean;
}

export interface VideoFile {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  duration?: number;
  versions?: VideoVersion[];
  driveFileId: string;
}

export interface VideoVersion {
  id: string;
  name: string;
  createdAt: string;
  driveFileId: string;
  versionNumber: number;
}

export interface VideoComment {
  id: string;
  text: string;
  timestamp: number; // In seconds
  user: {
    id: string;
    name: string;
    image?: string;
    isGuest?: boolean;
  };
  createdAt: string;
}
