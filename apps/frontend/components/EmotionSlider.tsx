'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { cn, getEmotionColor, getEmotionLabel } from '@/lib/utils';

interface EmotionSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

// Emotion labels for accessibility and user guidance
const emotionLabels = {
  1: 'Extremely Anxious',
  2: 'Very Anxious', 
  3: 'Anxious',
  4: 'Somewhat Anxious',
  5: 'Neutral',
  6: 'Somewhat Confident',
  7: 'Confident',
  8: 'Very Confident',
  9: 'Extremely Confident',
  10: 'Peak Confidence'
};

// Emotion colors mapping to our Tailwind config
const emotionColors = {
  1: '#DC2626', // red-600
  2: '#EA580C', // orange-600
  3: '#D97706', // amber-600
  4: '#CA8A04', // yellow-600
  5: '#65A30D', // lime-600
  6: '#16A34A', // green-600
  7: '#059669', // emerald-600
  8: '#0891B2', // cyan-600
  9: '#0284C7', // sky-600
  10: '#2563EB' // blue-600
};

export function EmotionSlider({ 
  value, 
  onChange, 
  disabled = false,
  size = 'md',
  showLabels = true,
  className 
}: EmotionSliderProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [lastValue, setLastValue] = useState(value);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Update internal state when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      // Modern browsers with vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(10); // Short vibration
      }
      
      // iOS Safari haptic feedback
      if ('haptic' in navigator) {
        // @ts-ignore - iOS specific API
        navigator.haptic?.impact?.('light');
      }
    }
  }, []);

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(1, Math.min(10, Math.round(newValue)));
    setCurrentValue(clampedValue);
    onChange(clampedValue);
    
    // Trigger haptic feedback only when value actually changes
    if (clampedValue !== lastValue) {
      triggerHapticFeedback();
      setLastValue(clampedValue);
    }
  }, [onChange, lastValue, triggerHapticFeedback]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleValueChange(Number(e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        handleValueChange(currentValue - 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        handleValueChange(currentValue + 1);
        break;
      case 'Home':
        e.preventDefault();
        handleValueChange(1);
        break;
      case 'End':
        e.preventDefault();
        handleValueChange(10);
        break;
    }
  };

  // Handle mouse/touch events for better UX
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  // Size configurations with touch-friendly dimensions
  const sizeConfigs = {
    sm: {
      container: 'h-16',
      track: 'h-2',
      thumb: 'w-6 h-6',
      display: 'text-4xl',
      label: 'text-xs',
      spacing: 'space-y-2'
    },
    md: {
      container: 'h-20',
      track: 'h-3',
      thumb: 'w-8 h-8',
      display: 'text-6xl',
      label: 'text-sm',
      spacing: 'space-y-3'
    },
    lg: {
      container: 'h-24',
      track: 'h-4',
      thumb: 'w-10 h-10',
      display: 'text-8xl',
      label: 'text-base',
      spacing: 'space-y-4'
    }
  };

  const config = sizeConfigs[size];

  // Generate gradient background for the track
  const generateGradient = () => {
    const colors = Object.values(emotionColors);
    return `linear-gradient(to right, ${colors.join(', ')})`;
  };

  // Get current emotion color
  const getCurrentColor = () => {
    return emotionColors[currentValue as keyof typeof emotionColors] || emotionColors[5];
  };

  return (
    <div className={cn('w-full', config.container, config.spacing, className)}>
      {/* Current Value Display */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div 
            className={cn(
              'rounded-full transition-all duration-300 flex items-center justify-center font-bold text-white shadow-lg emotion-scale',
              config.thumb,
              isDragging && 'scale-110 shadow-xl'
            )}
            style={{ 
              backgroundColor: getCurrentColor(),
              boxShadow: `0 4px 20px ${getCurrentColor()}40`
            }}
          >
            {currentValue}
          </div>
          <div>
            <div className={cn('font-semibold text-gray-900', config.label)}>
              Level {currentValue}
            </div>
            {showLabels && (
              <div className={cn('text-gray-600', config.label)}>
                {emotionLabels[currentValue as keyof typeof emotionLabels]}
              </div>
            )}
          </div>
        </div>
        
        {/* Emotion Scale Legend */}
        {showLabels && (
          <div className={cn('text-right', config.label)}>
            <div className="text-red-600 font-medium">1-3 Anxious</div>
            <div className="text-amber-600 font-medium">4-6 Neutral</div>
            <div className="text-green-600 font-medium">7-10 Confident</div>
          </div>
        )}
      </div>

      {/* Slider Container */}
      <div className="relative touch-target">
        {/* Custom Track Background */}
        <div 
          className={cn(
            'w-full rounded-full relative overflow-hidden',
            config.track
          )}
          style={{ 
            background: generateGradient(),
            opacity: disabled ? 0.5 : 1
          }}
        >
          {/* Progress Indicator */}
          <div
            className={cn(
              'absolute top-0 left-0 h-full bg-white bg-opacity-20 rounded-full transition-all duration-300',
              isDragging && 'bg-opacity-30'
            )}
            style={{ 
              width: `${((currentValue - 1) / 9) * 100}%`
            }}
          />
        </div>

        {/* Actual Range Input (Hidden but functional) */}
        <input
          ref={sliderRef}
          type="range"
          min="1"
          max="10"
          step="1"
          value={currentValue}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className={cn(
            'absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer touch-target',
            'focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-30 rounded-full',
            disabled && 'cursor-not-allowed'
          )}
          aria-label={`Emotion level: ${currentValue} out of 10, ${emotionLabels[currentValue as keyof typeof emotionLabels]}`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={currentValue}
          aria-valuetext={`${currentValue}: ${emotionLabels[currentValue as keyof typeof emotionLabels]}`}
        />

        {/* Custom Thumb */}
        <div
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 pointer-events-none',
            'rounded-full border-4 border-white shadow-lg transition-all duration-300 emotion-scale',
            config.thumb,
            isDragging && 'scale-125 shadow-xl',
            disabled && 'opacity-60'
          )}
          style={{ 
            left: `${((currentValue - 1) / 9) * 100}%`,
            backgroundColor: getCurrentColor(),
            boxShadow: `0 0 0 4px white, 0 4px 12px ${getCurrentColor()}60`
          }}
        />
      </div>

      {/* Scale Markers */}
      <div className="flex justify-between mt-2 px-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => handleValueChange(level)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center space-y-1 transition-all duration-200 touch-target',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded',
              currentValue === level 
                ? 'text-gray-900 font-bold' 
                : 'text-gray-400 hover:text-gray-600',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label={`Set emotion level to ${level}: ${emotionLabels[level as keyof typeof emotionLabels]}`}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-200',
                currentValue === level && 'scale-150 shadow-md'
              )}
              style={{ 
                backgroundColor: emotionColors[level as keyof typeof emotionColors],
                opacity: currentValue === level ? 1 : 0.6
              }}
            />
            <span className={cn('text-xs font-medium', config.label)}>
              {level}
            </span>
          </button>
        ))}
      </div>

      {/* Visual Feedback for Current State */}
      <div className="mt-4 text-center">
        <div 
          className={cn(
            'inline-flex items-center px-4 py-2 rounded-full text-white font-medium transition-all duration-300',
            config.label,
            isDragging && 'scale-105 shadow-lg'
          )}
          style={{ 
            backgroundColor: getCurrentColor(),
            boxShadow: `0 4px 12px ${getCurrentColor()}40`
          }}
        >
          {currentValue <= 3 && '😰'} 
          {currentValue >= 4 && currentValue <= 6 && '😐'}
          {currentValue >= 7 && '😊'}
          <span className="ml-2">
            {emotionLabels[currentValue as keyof typeof emotionLabels]}
          </span>
        </div>
      </div>

      {/* Accessibility Instructions */}
      <div className="sr-only" aria-live="polite">
        Current emotion level is {currentValue} out of 10: {emotionLabels[currentValue as keyof typeof emotionLabels]}.
        Use arrow keys or click on markers to adjust.
      </div>

      {/* Quick Selection Buttons */}
      <div className="flex justify-center space-x-2 mt-4">
        {[1, 3, 5, 7, 10].map((level) => (
          <button
            key={level}
            onClick={() => handleValueChange(level)}
            disabled={disabled}
            className={cn(
              'touch-target w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
              currentValue === level
                ? 'text-white scale-110 focus:ring-primary shadow-lg'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: currentValue === level ? getCurrentColor() : undefined,
              boxShadow: currentValue === level ? `0 4px 8px ${getCurrentColor()}40` : undefined
            }}
            aria-label={`Set emotion level to ${level}: ${emotionLabels[level as keyof typeof emotionLabels]}`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}
