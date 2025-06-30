'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './button';
import { Card } from './card';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreathingGuideProps {
  className?: string;
  onComplete?: () => void;
  duration?: number; // in seconds
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'pause';

export function BreathingGuide({ 
  className, 
  onComplete, 
  duration = 60 // 1 minute default
}: BreathingGuideProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase>('inhale');
  const [cycleProgress, setCycleProgress] = useState(0);

  // 4-7-8 breathing pattern (in seconds)
  const breathingPattern = useMemo(() => ({
    inhale: 4,
    hold: 7,
    exhale: 8,
    pause: 1
  }), []);

  const totalCycleTime = useMemo(() => 
    Object.values(breathingPattern).reduce((a, b) => a + b, 0),
    [breathingPattern]
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let phaseInterval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      // Main timer
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Breathing cycle timer
      let phaseTime = 0;
      phaseInterval = setInterval(() => {
        phaseTime += 0.1;
        const cyclePosition = phaseTime % totalCycleTime;
        
        let currentPhaseTime = 0;
        let phase: BreathingPhase = 'inhale';
        
        if (cyclePosition < breathingPattern.inhale) {
          phase = 'inhale';
          currentPhaseTime = cyclePosition;
        } else if (cyclePosition < breathingPattern.inhale + breathingPattern.hold) {
          phase = 'hold';
          currentPhaseTime = cyclePosition - breathingPattern.inhale;
        } else if (cyclePosition < breathingPattern.inhale + breathingPattern.hold + breathingPattern.exhale) {
          phase = 'exhale';
          currentPhaseTime = cyclePosition - breathingPattern.inhale - breathingPattern.hold;
        } else {
          phase = 'pause';
          currentPhaseTime = cyclePosition - breathingPattern.inhale - breathingPattern.hold - breathingPattern.exhale;
        }

        setCurrentPhase(phase);
        setCycleProgress((currentPhaseTime / breathingPattern[phase]) * 100);
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (phaseInterval) clearInterval(phaseInterval);
    };
  }, [isActive, timeLeft, onComplete, breathingPattern, totalCycleTime]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration);
    setCurrentPhase('inhale');
    setCycleProgress(0);
  };

  const getPhaseInstruction = () => {
    switch (currentPhase) {
      case 'inhale':
        return 'Breathe in slowly...';
      case 'hold':
        return 'Hold your breath...';
      case 'exhale':
        return 'Breathe out slowly...';
      case 'pause':
        return 'Rest...';
    }
  };

  const getCircleScale = () => {
    switch (currentPhase) {
      case 'inhale':
        return 0.5 + (cycleProgress / 100) * 0.5; // Scale from 0.5 to 1
      case 'hold':
        return 1; // Stay at full size
      case 'exhale':
        return 1 - (cycleProgress / 100) * 0.5; // Scale from 1 to 0.5
      case 'pause':
        return 0.5; // Stay at small size
    }
  };

  return (
    <Card className={cn('p-6 bg-gradient-to-br from-blue-50 to-indigo-50', className)}>
      <div className="text-center space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Breathing Exercise
          </h3>
          <p className="text-sm text-gray-600">
            Take a moment to center yourself with guided breathing
          </p>
        </div>

        {/* Breathing Circle Animation */}
        <div className="flex justify-center items-center h-48">
          <div className="relative">
            <div
              className={cn(
                'w-32 h-32 rounded-full border-4 transition-all duration-1000 ease-in-out',
                'flex items-center justify-center',
                currentPhase === 'inhale' && 'border-blue-400 bg-blue-100',
                currentPhase === 'hold' && 'border-purple-400 bg-purple-100',
                currentPhase === 'exhale' && 'border-green-400 bg-green-100',
                currentPhase === 'pause' && 'border-gray-400 bg-gray-100'
              )}
              style={{
                transform: `scale(${getCircleScale()})`,
              }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {isActive ? getPhaseInstruction() : 'Ready to begin'}
                </div>
              </div>
            </div>
            
            {/* Progress ring */}
            <div className="absolute inset-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${cycleProgress}, 100`}
                  className={cn(
                    'transition-all duration-300',
                    currentPhase === 'inhale' && 'text-blue-500',
                    currentPhase === 'hold' && 'text-purple-500',
                    currentPhase === 'exhale' && 'text-green-500',
                    currentPhase === 'pause' && 'text-gray-500'
                  )}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          {!isActive ? (
            <Button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={timeLeft === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              {timeLeft === duration ? 'Start' : 'Resume'}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {timeLeft === 0 && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-800 font-medium">
              Great job! You&apos;ve completed your breathing exercise.
            </p>
            <p className="text-green-600 text-sm mt-1">
              Take a moment to notice how you feel now.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
