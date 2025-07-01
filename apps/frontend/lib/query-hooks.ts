import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient, api } from './api-client';
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
  UserSessionResponse,
  UserInsightResponse,
  CreateSessionRequest,
  UpdateInsightRequest,
} from './types';

// Query Keys
export const QUERY_KEYS = {
  // Auth
  currentUser: ['auth', 'currentUser'] as const,
  
  // Emotions
  emotionChecks: (limit?: number, offset?: number) => ['emotions', { limit, offset }] as const,
  emotionCheck: (id: string) => ['emotions', id] as const,
  
  // Trades
  trades: (limit?: number, offset?: number) => ['trades', { limit, offset }] as const,
  trade: (id: string) => ['trades', id] as const,
  
  // Patterns
  emotionPerformanceCorrelation: ['patterns', 'emotionPerformance'] as const,
  patternCorrelation: ['patterns', 'correlation'] as const,
  keyInsights: ['patterns', 'insights'] as const,
  weeklyTrend: (weeks?: number) => ['patterns', 'weeklyTrend', { weeks }] as const,
  
  // Weekly Reflections
  weeklyReflections: (limit?: number) => ['weeklyReflections', { limit }] as const,
  currentWeekReflection: ['weeklyReflections', 'current'] as const,
  previousWeekReflection: ['weeklyReflections', 'previous'] as const,
  
  // Monthly Goals
  monthlyGoals: (limit?: number) => ['monthlyGoals', { limit }] as const,
  currentMonthGoal: ['monthlyGoals', 'current'] as const,
  
  // User Sessions
  sessions: (params?: { startDate?: string; endDate?: string }) => ['sessions', params] as const,
  sessionByDate: (date: string) => ['sessions', 'byDate', date] as const,
  sessionStreak: ['sessions', 'streak'] as const,
  averageSessionQuality: (params?: { startDate?: string; endDate?: string }) => ['sessions', 'averageQuality', params] as const,
  
  // User Insights
  insights: (params?: { insightType?: string; isActive?: boolean }) => ['insights', params] as const,
  insight: (id: string) => ['insights', id] as const,
  topInsights: (count?: number) => ['insights', 'top', { count }] as const,
} as const;

// ============================================================================
// AUTH HOOKS
// ============================================================================

export const useCurrentUser = (options?: UseQueryOptions<User>) => {
  return useQuery({
    queryKey: QUERY_KEYS.currentUser,
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    ...options,
  });
};

export const useLogin = (options?: UseMutationOptions<AuthResponse, Error, LoginRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiClient.login(credentials),
    onSuccess: (data) => {
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      }
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
    },
    ...options,
  });
};

export const useRegister = (options?: UseMutationOptions<AuthResponse, Error, RegisterRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: RegisterRequest) => apiClient.register(userData),
    onSuccess: (data) => {
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      }
      
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUser });
    },
    ...options,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Clear tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
      }
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();
    },
  });
};

// ============================================================================
// EMOTION HOOKS
// ============================================================================

export const useEmotionChecks = (
  limit = 50, 
  offset = 0, 
  options?: UseQueryOptions<EmotionCheck[]>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.emotionChecks(limit, offset),
    queryFn: () => apiClient.getEmotionChecks(limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useEmotionCheck = (id: string, options?: UseQueryOptions<EmotionCheck>) => {
  return useQuery({
    queryKey: QUERY_KEYS.emotionCheck(id),
    queryFn: () => apiClient.getEmotionCheck(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateEmotionCheck = (options?: UseMutationOptions<EmotionCheck, Error, EmotionCheckRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: EmotionCheckRequest) => apiClient.createEmotionCheck(data),
    onSuccess: () => {
      // Invalidate emotion queries
      queryClient.invalidateQueries({ queryKey: ['emotions'] });
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    ...options,
  });
};

// ============================================================================
// TRADE HOOKS
// ============================================================================

export const useTrades = (
  limit = 50, 
  offset = 0, 
  options?: UseQueryOptions<Trade[]>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.trades(limit, offset),
    queryFn: () => apiClient.getTrades(limit, offset),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useTrade = (id: string, options?: UseQueryOptions<Trade>) => {
  return useQuery({
    queryKey: QUERY_KEYS.trade(id),
    queryFn: () => apiClient.getTrade(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateTrade = (options?: UseMutationOptions<Trade, Error, TradeRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TradeRequest) => apiClient.createTrade(data),
    onSuccess: () => {
      // Invalidate trade queries
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    ...options,
  });
};

export const useUpdateTrade = (options?: UseMutationOptions<Trade, Error, { id: string; data: Partial<TradeRequest> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TradeRequest> }) => 
      apiClient.updateTrade(id, data),
    onSuccess: (data, variables) => {
      // Update specific trade in cache
      queryClient.setQueryData(QUERY_KEYS.trade(variables.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
    },
    ...options,
  });
};

export const useDeleteTrade = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteTrade(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.trade(id) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['patterns'] });
    },
    ...options,
  });
};

// ============================================================================
// PATTERN ANALYSIS HOOKS
// ============================================================================

export const useEmotionPerformanceCorrelation = (options?: UseQueryOptions<PatternInsight[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.emotionPerformanceCorrelation,
    queryFn: () => apiClient.getEmotionPerformanceCorrelation(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const usePatternCorrelation = (options?: UseQueryOptions<any>) => {
  return useQuery({
    queryKey: QUERY_KEYS.patternCorrelation,
    queryFn: () => apiClient.getPatternCorrelation(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useKeyInsights = (options?: UseQueryOptions<KeyInsight[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.keyInsights,
    queryFn: () => apiClient.getKeyInsights(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useWeeklyTrend = (weeks = 12, options?: UseQueryOptions<any[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.weeklyTrend(weeks),
    queryFn: () => apiClient.getWeeklyTrend(weeks),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ============================================================================
// WEEKLY REFLECTION HOOKS
// ============================================================================

export const useWeeklyReflections = (limit = 10, options?: UseQueryOptions<WeeklyReflection[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.weeklyReflections(limit),
    queryFn: () => apiClient.getWeeklyReflections(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCurrentWeekReflection = (options?: UseQueryOptions<WeeklyReflection>) => {
  return useQuery({
    queryKey: QUERY_KEYS.currentWeekReflection,
    queryFn: () => apiClient.getCurrentWeekReflection(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if no reflection exists
    ...options,
  });
};

export const usePreviousWeekReflection = (options?: UseQueryOptions<WeeklyReflection>) => {
  return useQuery({
    queryKey: QUERY_KEYS.previousWeekReflection,
    queryFn: () => apiClient.getPreviousWeekReflection(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if no reflection exists
    ...options,
  });
};

export const useCreateWeeklyReflection = (options?: UseMutationOptions<WeeklyReflection, Error, WeeklyReflectionRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WeeklyReflectionRequest) => apiClient.createWeeklyReflection(data),
    onSuccess: () => {
      // Invalidate reflection queries
      queryClient.invalidateQueries({ queryKey: ['weeklyReflections'] });
    },
    ...options,
  });
};

export const useDeleteWeeklyReflection = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteWeeklyReflection(id),
    onSuccess: () => {
      // Invalidate reflection queries
      queryClient.invalidateQueries({ queryKey: ['weeklyReflections'] });
    },
    ...options,
  });
};

// ============================================================================
// MONTHLY GOAL HOOKS
// ============================================================================

export const useMonthlyGoals = (limit = 10, options?: UseQueryOptions<MonthlyGoal[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.monthlyGoals(limit),
    queryFn: () => apiClient.getMonthlyGoals(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCurrentMonthGoal = (options?: UseQueryOptions<MonthlyGoal>) => {
  return useQuery({
    queryKey: QUERY_KEYS.currentMonthGoal,
    queryFn: () => apiClient.getCurrentMonthGoal(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if no goal exists
    ...options,
  });
};

export const useCreateMonthlyGoal = (options?: UseMutationOptions<MonthlyGoal, Error, MonthlyGoalRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: MonthlyGoalRequest) => apiClient.createMonthlyGoal(data),
    onSuccess: () => {
      // Invalidate goal queries
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    ...options,
  });
};

export const useUpdateGoalProgress = (options?: UseMutationOptions<MonthlyGoal, Error, { goalId: string; progress: number }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ goalId, progress }: { goalId: string; progress: number }) => 
      apiClient.updateGoalProgress(goalId, progress),
    onSuccess: () => {
      // Invalidate goal queries
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    ...options,
  });
};

export const useUpdateMonthlyGoal = (options?: UseMutationOptions<MonthlyGoal, Error, { id: string; data: Partial<MonthlyGoalRequest> }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MonthlyGoalRequest> }) => 
      apiClient.updateMonthlyGoal(id, data),
    onSuccess: () => {
      // Invalidate goal queries
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    ...options,
  });
};

export const useDeleteMonthlyGoal = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteMonthlyGoal(id),
    onSuccess: () => {
      // Invalidate goal queries
      queryClient.invalidateQueries({ queryKey: ['monthlyGoals'] });
    },
    ...options,
  });
};

// ============================================================================
// USER SESSION HOOKS
// ============================================================================

export const useSessions = (
  params?: { startDate?: string; endDate?: string },
  options?: UseQueryOptions<UserSessionResponse[]>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.sessions(params),
    queryFn: () => apiClient.getSessions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useSessionByDate = (date: string, options?: UseQueryOptions<UserSessionResponse>) => {
  return useQuery({
    queryKey: QUERY_KEYS.sessionByDate(date),
    queryFn: () => apiClient.getSessionByDate(date),
    enabled: !!date,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // Don't retry if no session exists
    ...options,
  });
};

export const useSessionStreak = (options?: UseQueryOptions<UserSessionResponse[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.sessionStreak,
    queryFn: () => apiClient.getSessionStreak(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useAverageSessionQuality = (
  params?: { startDate?: string; endDate?: string },
  options?: UseQueryOptions<number>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.averageSessionQuality(params),
    queryFn: () => apiClient.getAverageSessionQuality(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCreateOrUpdateSession = (options?: UseMutationOptions<UserSessionResponse, Error, CreateSessionRequest>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => apiClient.createOrUpdateSession(data),
    onSuccess: (data) => {
      // Update specific session in cache
      queryClient.setQueryData(QUERY_KEYS.sessionByDate(data.date), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    ...options,
  });
};

export const useUpdateSessionQuality = (options?: UseMutationOptions<UserSessionResponse, Error, { sessionId: string; qualityScore: number }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, qualityScore }: { sessionId: string; qualityScore: number }) => 
      apiClient.updateSessionQuality(sessionId, qualityScore),
    onSuccess: () => {
      // Invalidate session queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    ...options,
  });
};

// ============================================================================
// USER INSIGHT HOOKS
// ============================================================================

export const useInsights = (
  params?: { insightType?: string; isActive?: boolean },
  options?: UseQueryOptions<UserInsightResponse[]>
) => {
  return useQuery({
    queryKey: QUERY_KEYS.insights(params),
    queryFn: () => apiClient.getInsights(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useInsight = (id: string, options?: UseQueryOptions<UserInsightResponse>) => {
  return useQuery({
    queryKey: QUERY_KEYS.insight(id),
    queryFn: () => apiClient.getInsightById(id),
    enabled: !!id,
    ...options,
  });
};

export const useTopInsights = (count = 5, options?: UseQueryOptions<UserInsightResponse[]>) => {
  return useQuery({
    queryKey: QUERY_KEYS.topInsights(count),
    queryFn: () => apiClient.getTopInsights(count),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Insight generation hooks
export const useGeneratePerformanceCorrelation = (options?: UseMutationOptions<UserInsightResponse, Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.generatePerformanceCorrelation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

export const useGenerateBestTimes = (options?: UseMutationOptions<UserInsightResponse, Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.generateBestTimes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

export const useGenerateEmotionPatterns = (options?: UseMutationOptions<UserInsightResponse, Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.generateEmotionPatterns(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

export const useGenerateStreakMilestone = (options?: UseMutationOptions<UserInsightResponse, Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.generateStreakMilestone(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

export const useGenerateAllInsights = (options?: UseMutationOptions<UserInsightResponse[], Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.generateAllInsights(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

export const useUpdateInsight = (options?: UseMutationOptions<UserInsightResponse, Error, { id: string; data: UpdateInsightRequest }>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInsightRequest }) => 
      apiClient.updateInsight(id, data),
    onSuccess: (data, variables) => {
      // Update specific insight in cache
      queryClient.setQueryData(QUERY_KEYS.insight(variables.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

export const useDeleteInsight = (options?: UseMutationOptions<void, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteInsight(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.insight(id) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['insights'] });
    },
    ...options,
  });
};

// ============================================================================
// OPTIMISTIC UPDATE UTILITIES
// ============================================================================

export const optimisticUpdateTrade = (
  queryClient: ReturnType<typeof useQueryClient>,
  tradeId: string,
  updatedData: Partial<Trade>
) => {
  queryClient.setQueryData(QUERY_KEYS.trade(tradeId), (oldData: Trade | undefined) => {
    if (!oldData) return oldData;
    return { ...oldData, ...updatedData };
  });
};

export const optimisticUpdateSession = (
  queryClient: ReturnType<typeof useQueryClient>,
  date: string,
  updatedData: Partial<UserSessionResponse>
) => {
  queryClient.setQueryData(QUERY_KEYS.sessionByDate(date), (oldData: UserSessionResponse | undefined) => {
    if (!oldData) return oldData;
    return { ...oldData, ...updatedData };
  });
};

// ============================================================================
// BACKGROUND SYNC UTILITIES
// ============================================================================

export const prefetchEmotionChecks = (queryClient: ReturnType<typeof useQueryClient>) => {
  return queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.emotionChecks(),
    queryFn: () => apiClient.getEmotionChecks(),
    staleTime: 2 * 60 * 1000,
  });
};

export const prefetchTrades = (queryClient: ReturnType<typeof useQueryClient>) => {
  return queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.trades(),
    queryFn: () => apiClient.getTrades(),
    staleTime: 2 * 60 * 1000,
  });
};

export const prefetchInsights = (queryClient: ReturnType<typeof useQueryClient>) => {
  return queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.topInsights(),
    queryFn: () => apiClient.getTopInsights(),
    staleTime: 10 * 60 * 1000,
  });
};
