'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmotionStore, type EmotionContext } from '@/lib/emotion-store';
import { useToast } from '@/hooks/use-toast';
import { EmotionSlider } from '@/components/EmotionSlider';
import { Button } from '@/components/ui/button';
import { BreathingGuide } from '@/components/ui/breathing-guide';
import { OptimizedBreathingGuide } from '@/components/optimized/LazyComponents';
import { LoadingButton } from '@/components/ui/loading-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ValidatedInput, ValidatedTextarea } from '@/components/form/ValidatedInput';
import { OfflineStatusCard, OfflineIndicator } from '@/components/offline/OfflineIndicators';
import { getContextualToast } from '@/components/ui/enhanced-toast';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';
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
  const getMessage = () => {
    if (streakCount === 7) return "Amazing! 7 days in a row! 🔥";
    if (streakCount === 30) return "Incredible! 30 day streak! 🏆";
    if (streakCount === 100) return "LEGENDARY! 100 day streak! 🚀";
    return `${streakCount} day streak! Keep going! ✨`;
  };

  const getDetailMessage = () => {
    if (streakCount >= 100) return 'You\'ve achieved the ultimate trading discipline milestone. Your emotional awareness is extraordinary!';
    if (streakCount >= 30) return 'One month of consistent emotion tracking! You\'re building the habits of successful traders.';
    if (streakCount >= 7) return 'One week of daily emotion checks! Consistency is the foundation of trading excellence.';
    return 'Great start! Keep building this powerful habit for better trading results.';
  };

  // Enhanced auto-close after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-8 relative overflow-hidden">
          {/* Background celebration effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 opacity-80" />
          
          {/* Floating particles effect */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${20 + (i % 2) * 30}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10">
            <div className="text-7xl mb-4 animate-pulse">
              {streakCount >= 100 ? '🚀' : streakCount >= 30 ? '🏆' : '🔥'}
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {getMessage()}
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              {getDetailMessage()}
            </p>
            <div className="flex items-center justify-center space-x-2 text-lg font-semibold text-orange-600">
              <Flame className="h-5 w-5" />
              <span>{streakCount} Days Strong</span>
              <Flame className="h-5 w-5" />
            </div>
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 h-8 w-8 p-0"
          >
            ✕
          </Button>
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
  // Performance monitoring for critical user flow
  const { connectionInfo } = usePerformanceMonitor({
    enableMetrics: true,
    enableErrorTracking: true,
    slowLoadThreshold: 2000, // 2s threshold for emotion check
    reportToConsole: process.env.NODE_ENV === 'development'
  });

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
    submitEmotionCheck,
    syncPendingEntries,
  } = useEmotionStore();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateSymbolField = useCallback((symbolValue: string): string => {
    if (symbolValue && symbolValue.length > 10) return 'Symbol too long (max 10 characters)';
    if (symbolValue && !/^[A-Z0-9]*$/.test(symbolValue)) return 'Symbol can only contain letters and numbers';
    return '';
  }, []);

  const validateNotesField = useCallback((notesValue: string): string => {
    if (notesValue && notesValue.length > 500) return 'Notes too long (max 500 characters)';
    return '';
  }, []);

  const handleSymbolChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setSymbol(upperValue);
    
    // Clear error when user starts typing
    if (fieldErrors.symbol) {
      setFieldErrors(prev => ({ ...prev, symbol: '' }));
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    
    // Clear error when user starts typing  
    if (fieldErrors.notes) {
      setFieldErrors(prev => ({ ...prev, notes: '' }));
    }
  };

  // Handle emotion submission
  const handleSubmit = useCallback(async () => {
    if (!selectedContext) {
      toast({
        title: 'Please select a context',
        description: 'Choose when this emotion check occurred',
        variant: 'destructive',
      });
      return;
    }

    // Validate fields
    const errors = {
      symbol: validateSymbolField(symbol),
      notes: validateNotesField(notes),
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      toast({
        title: 'Please fix the errors',
        description: 'Check the form for validation errors.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await submitEmotionCheck();
      const toastContent = getContextualToast('emotion-check', 'success', `Level ${currentLevel} recorded for ${selectedContext}`);
      toast({
        title: toastContent.title,
        description: toastContent.description,
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to submit emotion check:', error);
      const toastContent = getContextualToast('emotion-check', 'error');
      toast({
        title: toastContent.title,
        description: toastContent.description,
        variant: 'default', // Use default instead of destructive for offline saves
      });
    }
  }, [selectedContext, currentLevel, symbol, notes, submitEmotionCheck, toast, validateSymbolField, validateNotesField]);

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

  // Auto-sync pending entries when coming online
  useEffect(() => {
    if (isOnline) {
      syncPendingEntries().catch(console.error);
    }
  }, [isOnline, syncPendingEntries]);

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
    <ErrorBoundary onRetry={() => window.location.reload()}>
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
            {/* Breathing Exercise Card - Show when high stress levels */}
            {(currentLevel >= 8 || currentLevel <= 3) && (
              <OptimizedBreathingGuide
                className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                onComplete={() => {
                  toast({
                    title: "Breathing Exercise Complete",
                    description: "Take a moment to reassess how you're feeling now.",
                    duration: 5000,
                  });
                }}
                duration={60}
              />
            )}

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
                  <OfflineIndicator />
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

          {/* Offline Status Card */}
          <OfflineStatusCard />

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
                <ValidatedInput
                  id="symbol"
                  label="Custom Symbol"
                  placeholder="Enter symbol (e.g., MSFT)"
                  value={symbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  error={fieldErrors.symbol}
                  disabled={isSubmitting}
                  className="touch-target uppercase"
                  maxLength={10}
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
              <ValidatedTextarea
                placeholder="What's influencing your emotions right now?"
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                error={fieldErrors.notes}
                disabled={isSubmitting}
                rows={3}
                className="touch-target resize-none"
                maxLength={500}
                showCharCount={true}
              />
            </CardContent>
          </Card>

          {/* Submit Button - Prominent */}
          <div className="sticky bottom-20 md:relative md:bottom-0">
            <LoadingButton
              onClick={handleSubmit}
              disabled={!canSubmit()}
              loading={isSubmitting}
              loadingText="Saving..."
              size="lg"
              icon={<Check className="h-5 w-5" />}
              className={cn(
                'w-full h-14 text-lg font-semibold shadow-lg',
                'touch-target-xl transition-all duration-200',
                canSubmit() 
                  ? 'bg-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95' 
                  : 'bg-gray-300'
              )}
            >
              Log Emotion Check
            </LoadingButton>
            
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
    </ErrorBoundary>
  );
}
