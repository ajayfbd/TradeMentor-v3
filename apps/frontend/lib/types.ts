export interface User {
  id: string;
  email: string;
  createdAt: Date;
  timezone: string;
  streakCount: number;
  lastCheckDate?: Date;
  isActive: boolean;
}

export interface EmotionCheck {
  id: string;
  userId: string;
  level: number; // 1-10 scale
  context: 'pre-trade' | 'post-trade' | 'market-event';
  timestamp: Date;
  notes?: string;
  symbol?: string;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: 'buy' | 'sell';
  outcome: 'win' | 'loss' | 'breakeven';
  pnl?: number;
  emotionCheckId?: string;
  timestamp: Date;
}

export interface PatternInsight {
  emotionLevel: number;
  winRate: number;
  avgPnL: number;
  tradeCount: number;
  confidence: number;
}

export interface WeeklyTrend {
  week: string;
  avgEmotionLevel: number;
  tradeCount: number;
  totalPnL: number;
}

export interface KeyInsight {
  type: 'performance' | 'emotion' | 'timing' | 'symbol';
  message: string;
  confidence: number;
  actionable: boolean;
  emotionRange?: [number, number];
  improvement?: number;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  timezone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EmotionCheckRequest {
  level: number;
  context: 'pre-trade' | 'post-trade' | 'market-event';
  notes?: string;
  symbol?: string;
}

export interface TradeRequest {
  symbol: string;
  type: 'buy' | 'sell';
  outcome: 'win' | 'loss' | 'breakeven';
  pnl?: number;
  emotionCheckId?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// UI State types
export interface EmotionState {
  currentLevel: number;
  selectedContext: 'pre-trade' | 'post-trade' | 'market-event';
  notes: string;
  symbol: string;
  isSubmitting: boolean;
}

export interface TradeState {
  symbol: string;
  type: 'buy' | 'sell';
  outcome: 'win' | 'loss' | 'breakeven';
  pnl: string;
  isSubmitting: boolean;
}

// Chart data types
export interface EmotionPerformanceData {
  emotionLevel: number;
  winRate: number;
  avgPnL: number;
  tradeCount: number;
}

export interface EmotionTrendData {
  date: string;
  avgEmotion: number;
  tradeCount: number;
}
