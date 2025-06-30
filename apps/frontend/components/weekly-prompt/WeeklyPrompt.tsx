'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useWeeklyPromptStore, useIsSunday } from '@/lib/weekly-prompt-store';
import { 
  MessageCircle, 
  Send, 
  SkipForward, 
  Calendar,
  CheckCircle,
  Clock,
  Lightbulb
} from 'lucide-react';

export function WeeklyPromptModal() {
  const [answer, setAnswer] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  const {
    currentPrompt,
    generateWeeklyPrompt,
    answerPrompt,
    markPromptAsSkipped,
    shouldShowPrompt,
  } = useWeeklyPromptStore();
  
  const isSunday = useIsSunday();

  useEffect(() => {
    // Generate prompt on Sundays
    if (isSunday) {
      generateWeeklyPrompt();
    }
  }, [isSunday, generateWeeklyPrompt]);

  useEffect(() => {
    // Show modal if we should show prompt
    if (shouldShowPrompt()) {
      setIsVisible(true);
    }
  }, [shouldShowPrompt]);

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      answerPrompt(answer.trim());
      setAnswer('');
      setIsVisible(false);
    }
  };

  const handleSkip = () => {
    markPromptAsSkipped();
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !currentPrompt || currentPrompt.isAnswered) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Weekly Reflection</CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Sunday Check-in</span>
                  <Badge variant="outline" className="ml-2">
                    Week {currentPrompt.week}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Intro */}
          <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900 mb-1">
                Take a moment to reflect
              </p>
              <p className="text-sm text-amber-700">
                This thoughtful question will help you learn from this week&apos;s trading journey and build better habits.
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium leading-relaxed">
              {currentPrompt.question}
            </h3>
          </div>

          {/* Answer Input */}
          <div className="space-y-3">
            <Textarea
              placeholder="Take your time to think deeply about this question. There are no right or wrong answers - this is your personal reflection space."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Your reflection will be saved privately and can help you track your growth over time.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              onClick={handleSubmitAnswer}
              disabled={!answer.trim()}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Save Reflection</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSkip}
              className="flex items-center justify-center space-x-2"
            >
              <SkipForward className="h-4 w-4" />
              <span>Skip This Week</span>
            </Button>
          </div>

          {/* Encouragement */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Taking time to reflect on your trading journey is a powerful habit for growth 🌱
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function WeeklyPromptCard() {
  const [answer, setAnswer] = useState('');
  
  const {
    currentPrompt,
    generateWeeklyPrompt,
    answerPrompt,
    shouldShowPrompt,
    getPromptHistory
  } = useWeeklyPromptStore();
  
  const isSunday = useIsSunday();
  const promptHistory = getPromptHistory();

  useEffect(() => {
    generateWeeklyPrompt();
  }, [generateWeeklyPrompt]);

  const handleSubmitAnswer = () => {
    if (answer.trim()) {
      answerPrompt(answer.trim());
      setAnswer('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Week Prompt */}
      {currentPrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span>This Week&apos;s Reflection</span>
              </div>
              <div className="flex items-center space-x-2">
                {isSunday && !currentPrompt.isAnswered && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                )}
                {currentPrompt.isAnswered && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Week {currentPrompt.week} • Sunday Reflection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">
              {currentPrompt.question}
            </p>
            
            {currentPrompt.isAnswered ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 mb-2 font-medium">Your reflection:</p>
                <p className="text-sm text-green-700">
                  {currentPrompt.answer || "You chose to skip this reflection."}
                </p>
                {currentPrompt.answeredAt && (
                  <p className="text-xs text-green-600 mt-2">
                    Completed on {new Date(currentPrompt.answeredAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Take your time to reflect deeply on this question..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim()}
                  className="w-full sm:w-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Save Reflection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Reflections */}
      {promptHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Reflections</CardTitle>
            <CardDescription>
              Your journey of growth and self-discovery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {promptHistory.slice(0, 3).map((prompt) => (
              <div key={prompt.id} className="p-4 rounded-lg border bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    Week {prompt.week}
                  </Badge>
                  {prompt.answeredAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(prompt.answeredAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium mb-2 text-gray-900">
                  {prompt.question}
                </p>
                {prompt.answer ? (
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {prompt.answer}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Skipped this reflection
                  </p>
                )}
              </div>
            ))}
            
            {promptHistory.length > 3 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                + {promptHistory.length - 3} more reflections in your history
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
