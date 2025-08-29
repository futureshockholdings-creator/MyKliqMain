export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  bio?: string;
  profileImageUrl?: string;
  isAdmin: boolean;
  interests?: string[];
  hobbies?: string[];
  kliqName?: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  youtubeUrl?: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
}

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  ranking: number;
  phone: string;
}

export interface Story {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  content?: string;
  createdAt: string;
}

export interface StoryGroup {
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  stories: Story[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface NavigationProps {
  navigation: any;
  route: any;
}