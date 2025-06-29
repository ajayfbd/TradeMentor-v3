'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmotionStore, type EmotionContext } from '@/lib/emotion-store';
import { useToast } from '@/hooks/use-toast';
import { EmotionSlider } from '@/components/EmotionSlider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  RefreshCw,
  Wifi,
  WifiOff,
  Sparkles,
  Trophy,
  Target,
} from 'lucide-react';

// Context configuration
const contexts = [
  {
    value: 'pre-trade' as EmotionContext,
    label: 'Pre-Trade',
    description: 'Before entering a position',
    icon: Target,
    color: 'bg-blue-500',
    activeColor: 'bg-blue-600',
  },
  {
    value: 'post-trade' as EmotionContext,
    label: 'Post-Trade',
    description: 'After closing a position',
    icon: TrendingUp,
    color: 'bg-green-500',
    activeColor: 'bg-green-600',
  },
  {
    value: 'market-event' as EmotionContext,
    label: 'Market Event',
    description: 'During market volatility',
    icon: AlertTriangle,
    color: 'bg-amber-500',
    activeColor: 'bg-amber-600',
  },
];

// Popular trading symbols for quick selection
const popularSymbols = ['AAPL', 'TSLA', 'NVDA', 'SPY', 'QQQ', 'BTC', 'ETH'];

interface CelebrationModalProps {
  streakCount: number;
  onClose: () => void;
}

function CelebrationModal({ streakCount, onClose }: CelebrationModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getMessage = () => {
    if (streakCount === 7) return "Amazing! 7 days in a row! 🔥";
    if (streakCount === 30) return "Incredible! 30 day streak! 🏆";
    if (streakCount === 100) return "LEGENDARY! 100 day streak! 🚀";
    return `${streakCount} day streak! Keep going! ✨`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm mx-auto animate-bounce">
        <CardContent className="text-center py-8">
          <div className="text-6xl mb-4">
            {streakCount >= 100 ? '🚀' : streakCount >= 30 ? '🏆' : '🔥'}
          </div>
          <h3 className="text-xl font-bold mb-2">{getMessage()}</h3>
          <p className="text-muted-foreground">
            Consistency builds discipline in trading
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff * 0.5, 100));
      setIsPulling(diff > 60);
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && pullDistance > 60) {
      await onRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ transform: `translateY(${pullDistance * 0.3}px)` }}
      className="transition-transform duration-200"
    >
      {pullDistance > 0 && (
        <div className="flex justify-center py-2">
          <RefreshCw 
            className={cn(
              'transition-all duration-200',
              isPulling ? 'text-primary animate-spin' : 'text-gray-400'
            )}
            size={20}
          />
        </div>
      )}
      {children}
    </div>
  );
}

export default function EmotionCheckPage() {
  const {
    currentLevel,
    selectedContext,
    symbol,
    notes,
    isSubmitting,
    streakCount,
    totalChecks,
    showCelebration,
    isOnline,
    setLevel,
    setContext,
    setSymbol,
    setNotes,
    setSubmitting,
    addPendingEntry,
    incrementStreak,
    setCelebration,
    reset,
    canSubmit,
  } = useEmotionStore();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-focus on emotion slider when page loads
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.focus();
    }
  }, []);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => useEmotionStore.getState().setOnlineStatus(true);
    const handleOffline = () => useEmotionStore.getState().setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with input fields
      }

      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          setLevel(parseInt(e.key));
          break;
        case '0':
          e.preventDefault();
          setLevel(10);
          break;
        case 'Enter':
          e.preventDefault();
          if (canSubmit()) {
            handleSubmit();
          }
          break;
        case 'Escape':
          e.preventDefault();
          reset();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLevel, canSubmit, reset, handleSubmit]);

  // Mutation for saving emotion entries
  const saveEmotionMutation = useMutation({
    mutationFn: async (data: {
      level: number;
      context: EmotionContext;
      symbol?: string;
      notes?: string;
    }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!isOnline) {
        throw new Error('Network unavailable');
      }
      
      // In real app, this would be an API call
      return { success: true, id: `entry-${Date.now()}` };
    },
    onMutate: () => setSubmitting(true),
    onSuccess: () => {
      incrementStreak();
      queryClient.invalidateQueries({ queryKey: ['emotions'] });
      toast({
        title: 'Emotion logged successfully! 🎉',
        description: `Level ${currentLevel} recorded for ${selectedContext}`,
      });
      reset();
    },
    onError: (error: Error) => {
      // Add to offline queue
      addPendingEntry({
        level: currentLevel,
        context: selectedContext!,
        symbol: symbol || undefined,
        notes: notes || undefined,
      });
      
      toast({
        title: 'Saved offline',
        description: 'Your emotion check will sync when online',
        variant: 'default',
      });
      
      incrementStreak(); // Still count toward streak
      reset();
    },
    onSettled: () => setSubmitting(false),
  });

  const handleSubmit = useCallback(() => {
    if (!selectedContext) {
      toast({
        title: 'Please select a context',
        description: 'Choose when this emotion check occurred',
        variant: 'destructive',
      });
      return;
    }

    saveEmotionMutation.mutate({
      level: currentLevel,
      context: selectedContext,
      symbol: symbol || undefined,
      notes: notes || undefined,
    });
  }, [selectedContext, currentLevel, symbol, notes, toast, saveEmotionMutation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Sync pending entries or refresh data
    setIsRefreshing(false);
  };

  const handleQuickSymbol = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-24">
        {/* Celebration Modal */}
        {showCelebration && (
          <CelebrationModal
            streakCount={streakCount}
            onClose={() => setCelebration(false)}
          />
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header with Streak Counter */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">How are you feeling?</CardTitle>
                  <CardDescription>
                    Take 30 seconds to check in with your emotions
                  </CardDescription>
                </div>
                
                {/* Online/Offline Indicator */}
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="h-5 w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>
              
              {/* Streak Counter */}
              {streakCount > 0 && (
                <div className="flex items-center justify-center mt-4">
                  <Badge variant="secondary" className="px-4 py-2 text-lg">
                    <Flame className="h-5 w-5 mr-2 text-orange-500" />
                    {streakCount} day streak
                    {streakCount >= 7 && <Sparkles className="h-4 w-4 ml-2 text-yellow-500" />}
                  </Badge>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Emotion Slider - Primary CTA */}
          <Card className="relative">
            <CardContent className="p-8" ref={sliderRef} tabIndex={-1}>
              <EmotionSlider
                value={currentLevel}
                onChange={setLevel}
                disabled={isSubmitting}
                size="lg"
                className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Context Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When is this happening?</CardTitle>
              <CardDescription>
                Select the trading context for this emotion check
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contexts.map((context) => {
                const Icon = context.icon;
                const isSelected = selectedContext === context.value;
                
                return (
                  <button
                    key={context.value}
                    type="button"
                    onClick={() => setContext(context.value)}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full flex items-start p-4 rounded-lg border text-left transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      'touch-target hover:scale-[1.02] active:scale-95',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50 text-gray-700',
                      isSubmitting && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-full mr-4 transition-colors',
                      isSelected ? context.activeColor : context.color
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{context.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {context.description}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary mt-1" />
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Optional Symbol Quick-Add */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Symbol (Optional)</CardTitle>
              <CardDescription>
                What are you trading or watching?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Symbol Buttons */}
              <div className="flex flex-wrap gap-2">
                {popularSymbols.map((symbolOption) => (
                  <Button
                    key={symbolOption}
                    type="button"
                    variant={symbol === symbolOption ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSymbol(symbolOption)}
                    disabled={isSubmitting}
                    className="touch-target"
                  >
                    {symbolOption}
                  </Button>
                ))}
              </div>
              
              {/* Custom Symbol Input */}
              <div className="space-y-2">
                <Label htmlFor="symbol">Custom Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="Enter symbol (e.g., MSFT)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  disabled={isSubmitting}
                  className="touch-target"
                />
              </div>
            </CardContent>
          </Card>

          {/* Optional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes (Optional)</CardTitle>
              <CardDescription>
                Any additional context or thoughts?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What's influencing your emotions right now?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={3}
                className="touch-target resize-none"
              />
            </CardContent>
          </Card>

          {/* Submit Button - Prominent */}
          <div className="sticky bottom-20 md:relative md:bottom-0">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              size="lg"
              className={cn(
                'w-full h-14 text-lg font-semibold shadow-lg',
                'touch-target-xl transition-all duration-200',
                canSubmit() 
                  ? 'bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95' 
                  : 'bg-gray-300'
              )}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Log Emotion Check
                </>
              )}
            </Button>
            
            {/* Keyboard Shortcut Hint */}
            <p className="text-center text-xs text-muted-foreground mt-2">
              Press Enter to submit • ESC to reset • 1-9,0 for emotion levels
            </p>
          </div>

          {/* Stats Footer */}
          {totalChecks > 0 && (
            <Card className="mt-8">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-1" />
                    {totalChecks} total checks
                  </div>
                  {streakCount > 0 && (
                    <div className="flex items-center">
                      <Flame className="h-4 w-4 mr-1 text-orange-500" />
                      {streakCount} day streak
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
