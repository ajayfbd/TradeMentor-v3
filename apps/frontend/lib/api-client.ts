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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202/api';

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
}

export const apiClient = new ApiClient();
