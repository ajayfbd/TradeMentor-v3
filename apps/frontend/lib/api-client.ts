import { 
  User, 
  EmotionCheck, 
  Trade, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  EmotionCheckRequest,
  TradeRequest,
  PatternInsight,
  KeyInsight,
  ApiError 
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw error;
    }

    return response.json();
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Emotion endpoints
  async createEmotionCheck(data: EmotionCheckRequest): Promise<EmotionCheck> {
    return this.request<EmotionCheck>('/emotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEmotionChecks(limit = 50, offset = 0): Promise<EmotionCheck[]> {
    return this.request<EmotionCheck[]>(`/emotions?limit=${limit}&offset=${offset}`);
  }

  async getEmotionCheck(id: string): Promise<EmotionCheck> {
    return this.request<EmotionCheck>(`/emotions/${id}`);
  }

  // Trade endpoints
  async createTrade(data: TradeRequest): Promise<Trade> {
    return this.request<Trade>('/trades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrades(limit = 50, offset = 0): Promise<Trade[]> {
    return this.request<Trade[]>(`/trades?limit=${limit}&offset=${offset}`);
  }

  async getTrade(id: string): Promise<Trade> {
    return this.request<Trade>(`/trades/${id}`);
  }

  async updateTrade(id: string, data: Partial<TradeRequest>): Promise<Trade> {
    return this.request<Trade>(`/trades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTrade(id: string): Promise<void> {
    return this.request<void>(`/trades/${id}`, {
      method: 'DELETE',
    });
  }

  // Pattern analysis endpoints
  async getEmotionPerformanceCorrelation(): Promise<PatternInsight[]> {
    return this.request<PatternInsight[]>('/patterns/emotion-performance');
  }

  async getKeyInsights(): Promise<KeyInsight[]> {
    return this.request<KeyInsight[]>('/patterns/insights');
  }

  async getWeeklyTrend(weeks = 12): Promise<any[]> {
    return this.request<any[]>(`/patterns/weekly-trend?weeks=${weeks}`);
  }
}

export const apiClient = new ApiClient();
