import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { 
  User, 
  EmotionCheck, 
  Trade, 
  WeeklyReflection,
  MonthlyGoal,
  AuthResponse, 
  LoginRequest, 
  RegisterRequest,
  EmotionCheckRequest,
  TradeRequest,
  WeeklyReflectionRequest,
  MonthlyGoalRequest,
  PatternInsight,
  KeyInsight,
  ApiError 
} from './types';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202';

// API client instance
const axiosClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor for error handling
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt token refresh
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (!refreshToken) {
          // No refresh token, force logout
          if (typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            window.location.href = '/auth/login?session=expired';
          }
          return Promise.reject(error);
        }
        
        const response = await axios.post(`${baseURL}/api/auth/refresh`, {
          refreshToken,
        });
        
        const { token } = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        
        // Retry original request with new token
        if (originalRequest) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, force logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login?session=expired';
        }
        return Promise.reject(error);
      }
    }
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      // Add exponential backoff retry logic
      const retryAfter = error.response.headers['retry-after'] || '1';
      const retryDelay = parseInt(retryAfter, 10) * 1000;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          if (originalRequest) {
            resolve(axiosClient(originalRequest));
          }
        }, retryDelay);
      });
    }
    
    // Handle offline/network errors
    if (!error.response) {
      // Store request for later retry when online
      if (typeof window !== 'undefined') {
        const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
        offlineRequests.push({
          config: originalRequest,
          timestamp: Date.now(),
        });
        localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
        
        // Dispatch custom event for offline handling
        window.dispatchEvent(new CustomEvent('app:offline', {
          detail: {
            request: originalRequest,
          },
        }));
      }
      
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'You are currently offline. This action will be synced when your connection is restored.',
      });
    }
    
    return Promise.reject(error);
  }
);

// Enhanced API client functions
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    axiosClient.get<T>(url, config).then((response: AxiosResponse<T>) => response.data),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosClient.post<T>(url, data, config).then((response: AxiosResponse<T>) => response.data),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosClient.put<T>(url, data, config).then((response: AxiosResponse<T>) => response.data),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    axiosClient.delete<T>(url, config).then((response: AxiosResponse<T>) => response.data),
};

// Legacy ApiClient class (for backwards compatibility)
class ApiClient {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${baseURL}/api${endpoint}`;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ');
          }
        } catch (e) {
          // Use default error message
        }
        
        const error: ApiError = { message: errorMessage };
        throw error;
      }

      return response.json();
    } catch (fetchError) {
      // Handle network errors for offline support
      if (!navigator.onLine) {
        if (typeof window !== 'undefined') {
          const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
          offlineRequests.push({
            config: { url, ...options },
            timestamp: Date.now(),
          });
          localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
          
          window.dispatchEvent(new CustomEvent('app:offline', {
            detail: { request: { url, ...options } },
          }));
        }
        
        throw {
          message: 'You are currently offline. This action will be synced when your connection is restored.',
          isOffline: true,
        };
      }
      
      throw fetchError;
    }
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
    return this.request<EmotionCheck>('/emotion', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEmotionChecks(limit = 50, offset = 0): Promise<EmotionCheck[]> {
    return this.request<EmotionCheck[]>(`/emotion?limit=${limit}&offset=${offset}`);
  }

  async getEmotionCheck(id: string): Promise<EmotionCheck> {
    return this.request<EmotionCheck>(`/emotion/${id}`);
  }

  // Trade endpoints
  async createTrade(data: TradeRequest): Promise<Trade> {
    return this.request<Trade>('/trade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrades(limit = 50, offset = 0): Promise<Trade[]> {
    return this.request<Trade[]>(`/trade?limit=${limit}&offset=${offset}`);
  }

  async getTrade(id: string): Promise<Trade> {
    return this.request<Trade>(`/trade/${id}`);
  }

  async updateTrade(id: string, data: Partial<TradeRequest>): Promise<Trade> {
    return this.request<Trade>(`/trade/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTrade(id: string): Promise<void> {
    return this.request<void>(`/trade/${id}`, {
      method: 'DELETE',
    });
  }

  // Pattern analysis endpoints
  async getEmotionPerformanceCorrelation(): Promise<PatternInsight[]> {
    return this.request<PatternInsight[]>('/pattern/emotion-performance');
  }

  async getPatternCorrelation(): Promise<any> {
    return this.request<any>('/patterns/correlation');
  }

  async getKeyInsights(): Promise<KeyInsight[]> {
    return this.request<KeyInsight[]>('/patterns/insights');
  }

  async getWeeklyTrend(weeks = 12): Promise<any[]> {
    return this.request<any[]>(`/patterns/weekly-trend?weeks=${weeks}`);
  }

  // Weekly Reflection endpoints
  async createWeeklyReflection(data: WeeklyReflectionRequest): Promise<WeeklyReflection> {
    return this.request<WeeklyReflection>('/weeklyreflections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWeeklyReflections(limit = 10): Promise<WeeklyReflection[]> {
    return this.request<WeeklyReflection[]>(`/weeklyreflections?limit=${limit}`);
  }

  async getCurrentWeekReflection(): Promise<WeeklyReflection> {
    return this.request<WeeklyReflection>('/weeklyreflections/current');
  }

  async getPreviousWeekReflection(): Promise<WeeklyReflection> {
    return this.request<WeeklyReflection>('/weeklyreflections/previous');
  }

  async deleteWeeklyReflection(id: string): Promise<void> {
    return this.request<void>(`/weeklyreflections/${id}`, {
      method: 'DELETE',
    });
  }

  // Monthly Goal endpoints
  async createMonthlyGoal(data: MonthlyGoalRequest): Promise<MonthlyGoal> {
    return this.request<MonthlyGoal>('/monthlygoals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMonthlyGoals(limit = 10): Promise<MonthlyGoal[]> {
    return this.request<MonthlyGoal[]>(`/monthlygoals?limit=${limit}`);
  }

  async getCurrentMonthGoal(): Promise<MonthlyGoal> {
    return this.request<MonthlyGoal>('/monthlygoals/current');
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<MonthlyGoal> {
    return this.request<MonthlyGoal>(`/monthlygoals/${goalId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  }

  async updateMonthlyGoal(id: string, data: Partial<MonthlyGoalRequest>): Promise<MonthlyGoal> {
    return this.request<MonthlyGoal>(`/monthlygoals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMonthlyGoal(id: string): Promise<void> {
    return this.request<void>(`/monthlygoals/${id}`, {
      method: 'DELETE',
    });
  }

  // Enhanced session endpoints
  async getSessions(params?: { startDate?: string, endDate?: string }): Promise<UserSessionResponse[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<UserSessionResponse[]>(`/usersessions${queryParams ? `?${queryParams}` : ''}`);
  }

  async getSessionByDate(date: string): Promise<UserSessionResponse> {
    return this.request<UserSessionResponse>(`/usersessions/${date}`);
  }

  async createOrUpdateSession(data: CreateSessionRequest): Promise<UserSessionResponse> {
    return this.request<UserSessionResponse>('/usersessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSessionQuality(sessionId: string, qualityScore: number): Promise<UserSessionResponse> {
    return this.request<UserSessionResponse>(`/usersessions/${sessionId}/quality-score`, {
      method: 'PUT',
      body: JSON.stringify({ qualityScore }),
    });
  }

  async getSessionStreak(): Promise<UserSessionResponse[]> {
    return this.request<UserSessionResponse[]>('/usersessions/streak');
  }

  async getAverageSessionQuality(params?: { startDate?: string, endDate?: string }): Promise<number> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<number>(`/usersessions/average-quality${queryParams ? `?${queryParams}` : ''}`);
  }

  // Enhanced insight endpoints
  async getInsights(params?: { insightType?: string, isActive?: boolean }): Promise<UserInsightResponse[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<UserInsightResponse[]>(`/userinsights${queryParams ? `?${queryParams}` : ''}`);
  }

  async getInsightById(insightId: string): Promise<UserInsightResponse> {
    return this.request<UserInsightResponse>(`/userinsights/${insightId}`);
  }

  async getTopInsights(count: number = 5): Promise<UserInsightResponse[]> {
    return this.request<UserInsightResponse[]>(`/userinsights/top?count=${count}`);
  }

  async generatePerformanceCorrelation(): Promise<UserInsightResponse> {
    return this.request<UserInsightResponse>('/userinsights/generate/performance-correlation', {
      method: 'POST',
    });
  }

  async generateBestTimes(): Promise<UserInsightResponse> {
    return this.request<UserInsightResponse>('/userinsights/generate/best-times', {
      method: 'POST',
    });
  }

  async generateEmotionPatterns(): Promise<UserInsightResponse> {
    return this.request<UserInsightResponse>('/userinsights/generate/emotion-patterns', {
      method: 'POST',
    });
  }

  async generateStreakMilestone(): Promise<UserInsightResponse> {
    return this.request<UserInsightResponse>('/userinsights/generate/streak-milestone', {
      method: 'POST',
    });
  }

  async generateAllInsights(): Promise<UserInsightResponse[]> {
    return this.request<UserInsightResponse[]>('/userinsights/generate/all', {
      method: 'POST',
    });
  }

  async updateInsight(insightId: string, data: UpdateInsightRequest): Promise<UserInsightResponse> {
    return this.request<UserInsightResponse>(`/userinsights/${insightId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInsight(insightId: string): Promise<void> {
    return this.request<void>(`/userinsights/${insightId}`, {
      method: 'DELETE',
    });
  }
}

// Additional type definitions for enhanced API
export interface CreateSessionRequest {
  date: string;
  emotionsLogged?: number;
  tradesLogged?: number;
}

export interface UserSessionResponse {
  id: string;
  userId: string;
  date: string;
  emotionsLogged: number;
  tradesLogged: number;
  sessionQualityScore?: number;
  createdAt: string;
}

export interface UserInsightResponse {
  id: string;
  userId: string;
  insightType: string;
  title: string;
  description: string;
  data?: any;
  confidenceScore: number;
  generatedAt: string;
  isActive: boolean;
}

export interface UpdateInsightRequest {
  title?: string;
  description?: string;
  isActive?: boolean;
}

// Export both the legacy client and new enhanced API
export const apiClient = new ApiClient();
export default apiClient;
