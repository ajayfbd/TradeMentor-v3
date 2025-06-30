'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Bug, 
  Lightbulb,
  X,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'rating';
  rating?: number;
  message: string;
  context: {
    page: string;
    userAgent: string;
    timestamp: string;
    userId?: string;
    sessionId: string;
    userJourney: string[];
  };
}

interface FeedbackWidgetProps {
  trigger?: 'action' | 'time' | 'manual';
  context?: string;
  showAfterAction?: string;
  className?: string;
}

export function FeedbackWidget({ 
  trigger = 'manual', 
  context = '', 
  showAfterAction,
  className 
}: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general' | 'rating'>('general');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-trigger based on conditions
    if (trigger === 'time') {
      const timer = setTimeout(() => {
        if (!hasSubmitted) {
          setIsOpen(true);
        }
      }, 30000); // Show after 30 seconds
      return () => clearTimeout(timer);
    }

    if (trigger === 'action' && showAfterAction) {
      // Listen for specific action completion
      const handleActionComplete = (event: CustomEvent) => {
        if (event.detail.action === showAfterAction && !hasSubmitted) {
          setTimeout(() => setIsOpen(true), 1000); // Delay slightly after action
        }
      };

      window.addEventListener('user:action' as any, handleActionComplete);
      return () => window.removeEventListener('user:action' as any, handleActionComplete);
    }
  }, [trigger, showAfterAction, hasSubmitted]);

  const handleSubmit = async () => {
    if (!message.trim() && feedbackType !== 'rating') {
      toast({
        title: "Message required",
        description: "Please provide your feedback message.",
        variant: "destructive",
      });
      return;
    }

    if (feedbackType === 'rating' && rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        rating: feedbackType === 'rating' ? rating : undefined,
        message: message.trim(),
        context: {
          page: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: getUserId(),
          sessionId: getSessionId(),
          userJourney: getUserJourney(),
        },
      };

      await submitFeedback(feedbackData);
      
      setHasSubmitted(true);
      setIsOpen(false);
      
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });

      // Reset form
      setMessage('');
      setRating(0);
      setFeedbackType('general');

    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen && trigger === 'manual') {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className={cn("fixed bottom-4 right-4 z-50 shadow-lg", className)}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Feedback
      </Button>
    );
  }

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-xl border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Share Your Feedback</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Feedback Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">What kind of feedback?</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={feedbackType === 'rating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('rating')}
              className="flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              Rating
            </Button>
            <Button
              variant={feedbackType === 'bug' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('bug')}
              className="flex items-center gap-1"
            >
              <Bug className="w-3 h-3" />
              Bug Report
            </Button>
            <Button
              variant={feedbackType === 'feature' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('feature')}
              className="flex items-center gap-1"
            >
              <Lightbulb className="w-3 h-3" />
              Feature Idea
            </Button>
            <Button
              variant={feedbackType === 'general' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFeedbackType('general')}
              className="flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              General
            </Button>
          </div>
        </div>

        {/* Rating Component */}
        {feedbackType === 'rating' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">How would you rate your experience?</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={cn(
                    "p-1 transition-colors",
                    rating >= star ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
                  )}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-sm text-gray-600">
                {rating === 1 && "Very poor - What went wrong?"}
                {rating === 2 && "Poor - How can we improve?"}
                {rating === 3 && "Okay - What would make it better?"}
                {rating === 4 && "Good - What did you like?"}
                {rating === 5 && "Excellent - What made it great?"}
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {feedbackType === 'bug' && "Describe the problem you encountered:"}
            {feedbackType === 'feature' && "What feature would you like to see?"}
            {feedbackType === 'rating' && "Tell us more about your experience:"}
            {feedbackType === 'general' && "Your feedback:"}
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              feedbackType === 'bug' 
                ? "What happened? What did you expect to happen?"
                : feedbackType === 'feature'
                ? "Describe the feature and how it would help you..."
                : "Share your thoughts..."
            }
            rows={3}
            className="resize-none"
          />
          <div className="text-xs text-gray-500">
            {message.length}/500 characters
          </div>
        </div>

        {/* Context Badge */}
        {context && (
          <Badge variant="secondary" className="text-xs">
            Context: {context}
          </Badge>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || (!message.trim() && feedbackType !== 'rating') || (feedbackType === 'rating' && rating === 0)}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Feedback
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData).id : undefined;
  } catch {
    return undefined;
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  return sessionStorage.getItem('sessionId') || 'unknown';
}

function getUserJourney(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const journey = sessionStorage.getItem('userJourney');
    return journey ? JSON.parse(journey) : [];
  } catch {
    return [];
  }
}

async function submitFeedback(feedback: FeedbackData): Promise<void> {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to submit feedback');
  }
}
