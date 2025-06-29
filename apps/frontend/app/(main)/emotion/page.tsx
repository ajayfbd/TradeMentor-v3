'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EmotionSlider } from '@/components/EmotionSlider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEmotionStore } from '@/lib/emotion-store';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const contexts = [
  { value: 'pre-trade', label: 'Pre-Trade', description: 'Before placing a trade' },
  { value: 'post-trade', label: 'Post-Trade', description: 'After closing a trade' },
  { value: 'market-event', label: 'Market Event', description: 'During market movement' },
] as const;

export default function EmotionCheckPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const {
    currentLevel,
    selectedContext,
    notes,
    symbol,
    isSubmitting,
    setLevel,
    setContext,
    setNotes,
    setSymbol,
    setSubmitting,
    reset
  } = useEmotionStore();

  const createEmotionMutation = useMutation({
    mutationFn: apiClient.createEmotionCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotions'] });
      toast({
        title: 'Emotion logged! 🎉',
        description: 'Your emotional state has been recorded.',
      });
      reset();
      
      // Celebration animation for streaks
      if (user?.streakCount && user.streakCount > 0 && user.streakCount % 7 === 0) {
        toast({
          title: `🔥 ${user.streakCount} Day Streak!`,
          description: 'You\'re building a great habit!',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to log emotion',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    },
    onMutate: () => setSubmitting(true),
    onSettled: () => setSubmitting(false),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to track emotions.',
        variant: 'destructive',
      });
      return;
    }

    createEmotionMutation.mutate({
      level: currentLevel,
      context: selectedContext,
      notes: notes || undefined,
      symbol: symbol || undefined,
    });
  };

  return (
    <div className="max-w-md mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          How are you feeling?
        </h1>
        <p className="text-muted-foreground">
          Take 30 seconds to check in with your emotions
        </p>
        
        {/* Streak Counter */}
        {user?.streakCount && user.streakCount > 0 && (
          <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary">
            <span className="text-sm font-medium">
              🔥 {user.streakCount} day streak
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Emotion Slider */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <EmotionSlider
            value={currentLevel}
            onChange={setLevel}
            disabled={isSubmitting}
            size="lg"
          />
        </div>

        {/* Context Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">What&apos;s happening?</Label>
          <div className="grid gap-2">
            {contexts.map((context) => (
              <button
                key={context.value}
                type="button"
                onClick={() => setContext(context.value)}
                disabled={isSubmitting}
                className={cn(
                  'flex flex-col items-start p-4 rounded-lg border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  selectedContext === context.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50 text-gray-600',
                  isSubmitting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className="font-medium">{context.label}</span>
                <span className="text-sm text-muted-foreground">
                  {context.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Symbol Input */}
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol (optional)</Label>
          <Input
            id="symbol"
            placeholder="e.g., AAPL, TSLA"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            disabled={isSubmitting}
            className="uppercase"
            maxLength={10}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            placeholder="What's on your mind?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            className="w-full min-h-[80px] px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 resize-none"
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {notes.length}/500
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full h-12 text-base font-medium"
        >
          {isSubmitting ? 'Logging...' : 'Log Emotion'}
        </Button>
      </form>

      {/* Quick Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be honest about your current emotional state</li>
          <li>• Log before making important trading decisions</li>
          <li>• Track patterns to improve your performance</li>
        </ul>
      </div>
    </div>
  );
}
