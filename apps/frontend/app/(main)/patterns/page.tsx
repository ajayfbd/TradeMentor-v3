'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatternInsightsCard } from '@/components/pattern-insights/PatternInsightsCard';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Filter,
  RefreshCw,
  Clock,
  Award,
} from 'lucide-react';

// Types for our data structures
interface EmotionPerformanceData {
  emotionLevel: number;
  tradeOutcome: number; // Percentage return
  tradeType: 'win' | 'loss' | 'breakeven';
  date: string;
  symbol?: string;
  size: number; // For bubble size in scatter plot
}

interface WeeklyTrendData {
  week: string;
  avgEmotion: number;
  winRate: number;
  totalTrades: number;
  avgReturn: number;
}

interface PatternInsights {
  highEmotionWinRate: number;
  bestTradingDays: string[];
  anxietyThreshold: number;
  optimalEmotionRange: [number, number];
  correlationStrength: number;
  totalPatterns: number;
}

// Date range options
const dateRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 3 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

// Mock API functions (replace with real API calls)
const fetchEmotionPerformance = async (dateRange: string): Promise<EmotionPerformanceData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock data based on realistic trading patterns
  const mockData: EmotionPerformanceData[] = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const emotionLevel = Math.floor(Math.random() * 10) + 1;
    const date = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    
    // Simulate correlation: higher emotion levels tend to have better outcomes
    const baseReturn = (emotionLevel - 5) * 2 + (Math.random() - 0.5) * 20;
    const tradeOutcome = Math.max(-15, Math.min(25, baseReturn));
    
    let tradeType: 'win' | 'loss' | 'breakeven';
    if (tradeOutcome > 1) tradeType = 'win';
    else if (tradeOutcome < -1) tradeType = 'loss';
    else tradeType = 'breakeven';
    
    mockData.push({
      emotionLevel,
      tradeOutcome,
      tradeType,
      date: date.toISOString(),
      symbol: ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ'][Math.floor(Math.random() * 5)],
      size: Math.abs(tradeOutcome) + 5, // For bubble size
    });
  }
  
  return mockData;
};

const fetchWeeklyTrend = async (dateRange: string): Promise<WeeklyTrendData[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  return weeks.map(week => ({
    week,
    avgEmotion: 4 + Math.random() * 4,
    winRate: 40 + Math.random() * 40,
    totalTrades: Math.floor(5 + Math.random() * 20),
    avgReturn: -5 + Math.random() * 15,
  }));
};

const fetchPatternInsights = async (dateRange: string): Promise<PatternInsights> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return {
    highEmotionWinRate: 65 + Math.random() * 20,
    bestTradingDays: ['Tuesday', 'Thursday'],
    anxietyThreshold: 6,
    optimalEmotionRange: [6, 8],
    correlationStrength: 0.65 + Math.random() * 0.25,
    totalPatterns: Math.floor(45 + Math.random() * 30),
  };
};

// Chart components
function EmotionPerformanceScatter({ data, isLoading }: { data: EmotionPerformanceData[]; isLoading: boolean }) {
  // Calculate trend line data
  const trendData = useMemo(() => {
    if (data.length === 0) return [];
    
    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.emotionLevel, 0);
    const sumY = data.reduce((sum, d) => sum + d.tradeOutcome, 0);
    const sumXY = data.reduce((sum, d) => sum + d.emotionLevel * d.tradeOutcome, 0);
    const sumXX = data.reduce((sum, d) => sum + d.emotionLevel * d.emotionLevel, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return [
      { emotionLevel: 1, trend: slope * 1 + intercept },
      { emotionLevel: 10, trend: slope * 10 + intercept },
    ];
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-80 w-full">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const getPointColor = (type: string) => {
    switch (type) {
      case 'win': return '#22c55e';
      case 'loss': return '#ef4444';
      case 'breakeven': return '#eab308';
      default: return '#6b7280';
    }
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey="emotionLevel"
          domain={[1, 10]}
          label={{ value: 'Emotion Level', position: 'insideBottom', offset: -10 }}
        />
        <YAxis
          type="number"
          domain={[-20, 30]}
          label={{ value: 'Trade Return (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload as EmotionPerformanceData;
              return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                  <p className="font-medium">{data.symbol}</p>
                  <p>Emotion Level: {data.emotionLevel}</p>
                  <p>Return: {data.tradeOutcome.toFixed(1)}%</p>
                  <p>Date: {new Date(data.date).toLocaleDateString()}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
        
        {/* Trend line */}
        <Line
          data={trendData}
          type="monotone"
          dataKey="trend"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
        
        {/* Data points */}
        {['win', 'loss', 'breakeven'].map(type => (
          <Scatter
            key={type}
            data={data.filter(d => d.tradeType === type)}
            fill={getPointColor(type)}
            opacity={0.7}
          />
        ))}
        
        <Legend
          content={() => (
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <span className="text-sm">Wins</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <span className="text-sm">Losses</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                <span className="text-sm">Breakeven</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-0.5 bg-purple-500 mr-2" style={{ borderStyle: 'dashed' }} />
                <span className="text-sm">Trend</span>
              </div>
            </div>
          )}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

function WeeklyTrendChart({ data, isLoading }: { data: WeeklyTrendData[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="h-80 w-full">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" />
        <YAxis yAxisId="emotion" domain={[1, 10]} label={{ value: 'Avg Emotion', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="winRate" orientation="right" domain={[0, 100]} label={{ value: 'Win Rate (%)', angle: 90, position: 'insideRight' }} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                  <p className="font-medium">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }}>
                      {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{entry.name === 'Win Rate' ? '%' : ''}
                    </p>
                  ))}
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          yAxisId="emotion"
          type="monotone"
          dataKey="avgEmotion"
          stroke="#8b5cf6"
          strokeWidth={3}
          name="Avg Emotion"
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
        />
        <Line
          yAxisId="winRate"
          type="monotone"
          dataKey="winRate"
          stroke="#22c55e"
          strokeWidth={3}
          name="Win Rate"
          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
        />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}

function InsightsCard({ insights, isLoading }: { insights: PatternInsights | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!insights) return null;

  const getCorrelationColor = (strength: number) => {
    if (strength > 0.7) return 'text-green-600';
    if (strength > 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCorrelationLabel = (strength: number) => {
    if (strength > 0.7) return 'Strong';
    if (strength > 0.4) return 'Moderate';
    return 'Weak';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
          Key Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your trading patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* High Emotion Performance */}
        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              High Emotion Performance
            </p>
            <p className="text-sm text-green-700">
              You win <span className="font-semibold">{insights.highEmotionWinRate.toFixed(0)}%</span> of trades when emotion level is 7+
            </p>
          </div>
        </div>

        {/* Best Trading Days */}
        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Optimal Trading Days
            </p>
            <p className="text-sm text-blue-700">
              Your best performance: <span className="font-semibold">{insights.bestTradingDays.join(', ')}</span>
            </p>
          </div>
        </div>

        {/* Anxiety Warning */}
        <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">
              Anxiety Threshold Alert
            </p>
            <p className="text-sm text-red-700">
              Consider avoiding trades when anxiety exceeds level <span className="font-semibold">{insights.anxietyThreshold}</span>
            </p>
          </div>
        </div>

        {/* Optimal Range */}
        <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <Target className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900">
              Sweet Spot Range
            </p>
            <p className="text-sm text-purple-700">
              Optimal emotion range: <span className="font-semibold">{insights.optimalEmotionRange[0]}-{insights.optimalEmotionRange[1]}</span>
            </p>
          </div>
        </div>

        {/* Correlation Strength */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Correlation Strength:</span>
          </div>
          <Badge variant="outline" className={getCorrelationColor(insights.correlationStrength)}>
            {getCorrelationLabel(insights.correlationStrength)} ({(insights.correlationStrength * 100).toFixed(0)}%)
          </Badge>
        </div>

        {/* Total Patterns */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Patterns Analyzed:</span>
          </div>
          <span className="text-sm font-medium">{insights.totalPatterns}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PatternsPage() {
  const [dateRange, setDateRange] = useState('30d');

  // Data fetching with TanStack Query
  const {
    data: emotionPerformanceData,
    isLoading: isLoadingPerformance,
    refetch: refetchPerformance,
  } = useQuery({
    queryKey: ['emotion-performance', dateRange],
    queryFn: () => fetchEmotionPerformance(dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  const {
    data: weeklyTrendData,
    isLoading: isLoadingTrend,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ['weekly-trend', dateRange],
    queryFn: () => fetchWeeklyTrend(dateRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const {
    data: insightsData,
    isLoading: isLoadingInsights,
    refetch: refetchInsights,
  } = useQuery({
    queryKey: ['pattern-insights', dateRange],
    queryFn: () => fetchPatternInsights(dateRange),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleRefresh = () => {
    refetchPerformance();
    refetchTrend();
    refetchInsights();
  };

  const isAnyLoading = isLoadingPerformance || isLoadingTrend || isLoadingInsights;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading Patterns</h1>
            <p className="text-muted-foreground">
              Discover how your emotions impact your trading performance
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isAnyLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isAnyLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Patterns</p>
                  <p className="text-2xl font-bold">
                    {isLoadingInsights ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      insightsData?.totalPatterns || 0
                    )}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                  <p className="text-2xl font-bold">
                    {isLoadingPerformance ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      emotionPerformanceData?.length || 0
                    )}
                  </p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time Range</p>
                  <p className="text-2xl font-bold">
                    {dateRanges.find(r => r.value === dateRange)?.label || 'All time'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Emotion vs Performance Scatter Plot */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Emotion vs Trade Performance</CardTitle>
              <CardDescription>
                Each point represents a trade. Higher emotion levels tend to correlate with better outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionPerformanceScatter
                data={emotionPerformanceData || []}
                isLoading={isLoadingPerformance}
              />
            </CardContent>
          </Card>

          {/* Key Insights */}
          <div>
            <PatternInsightsCard />
          </div>
        </div>

        {/* Weekly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Emotion & Performance Trend</CardTitle>
            <CardDescription>
              Track how your average emotion levels correlate with your win rate over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyTrendChart
              data={weeklyTrendData || []}
              isLoading={isLoadingTrend}
            />
          </CardContent>
        </Card>

        {/* Empty State */}
        {!isAnyLoading && (!emotionPerformanceData || emotionPerformanceData.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No patterns found</h3>
              <p className="text-muted-foreground mb-4">
                Start logging your emotions and trades to see powerful insights about your trading patterns.
              </p>
              <Button>
                <Target className="h-4 w-4 mr-2" />
                Log Your First Emotion
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
