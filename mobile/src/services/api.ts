import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api'; // Change to your deployed URL

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface LoginRequest {
  phoneNumber: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isAdmin: boolean;
    profileImageUrl?: string;
    bio?: string;
  };
}

interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
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

interface FeedResponse {
  posts: Post[];
  page: number;
  hasMore: boolean;
}

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  ranking: number;
  phone: string;
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  private async clearAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.makeRequest<LoginResponse>('/mobile/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.token) {
      await this.setAuthToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.clearAuthToken();
  }

  // User Profile
  async getUserProfile(): Promise<any> {
    return this.makeRequest('/mobile/user/profile');
  }

  // Feed
  async getFeed(page: number = 1, limit: number = 20): Promise<FeedResponse> {
    return this.makeRequest(`/mobile/feed?page=${page}&limit=${limit}`);
  }

  // Posts
  async createPost(postData: {
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    youtubeUrl?: string;
  }): Promise<Post> {
    return this.makeRequest('/mobile/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async likePost(postId: string): Promise<{ liked: boolean; message: string }> {
    return this.makeRequest(`/mobile/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // Friends
  async getFriends(): Promise<{ friends: Friend[] }> {
    return this.makeRequest('/mobile/friends');
  }

  // Stories
  async getStories(): Promise<any> {
    return this.makeRequest('/mobile/stories');
  }

  // Push Notifications
  async registerPushToken(pushToken: string, platform: string): Promise<any> {
    return this.makeRequest('/mobile/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ pushToken, platform }),
    });
  }

  // File Upload
  async prepareFileUpload(fileName: string, fileType: string): Promise<any> {
    return this.makeRequest('/mobile/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType }),
    });
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.makeRequest('/mobile/health');
  }
}

export default new ApiService();
export type { Post, Friend, FeedResponse, LoginRequest, LoginResponse };