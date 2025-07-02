'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAnimation, useHapticFeedback, useReducedMotion, useButtonAnimation } from '@/hooks/useAnimation';

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
  1: 'Panic State',
  2: 'High Stress',
  3: 'Anxious',
  4: 'Cautious',
  5: 'Neutral',
  6: 'Slight Confidence',
  7: 'Good Confidence', 
  8: 'Strong Confidence',
  9: 'Peak Performance',
  10: 'Zen Mastery'
};

// Emoji mapping for the emotion scale
const emotionEmojis = {
  1: '😰',
  2: '😟', 
  3: '😐',
  4: '🤔',
  5: '🙂',
  6: '😊',
  7: '😎',
  8: '🚀',
  9: '💪',
  10: '🧘'
};

// Get emotion label helper
const getEmotionLabel = (value: number): string => {
  return emotionLabels[Math.round(value) as keyof typeof emotionLabels] || 'Neutral';
};

// Get emotion class for animations
const getEmotionClass = (value: number): string => {
  if (value <= 3) return 'emotion-low';
  if (value <= 6) return 'emotion-mid';
  return 'emotion-high';
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

  // Animation hooks
  const animationClass = useAnimation(currentValue);
  const triggerHaptic = useHapticFeedback([10, 20, 10]);
  const prefersReducedMotion = useReducedMotion();

  // Update internal state when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = useCallback(() => {
    // Use the enhanced haptic hook
    triggerHaptic();
    
    // Fallback for older devices
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
  }, [triggerHaptic]);

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(1, Math.min(10, Number(newValue)));
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

  // Generate dynamic gradient based on current value
  const generateDynamicGradient = () => {
    const lowerBound = Math.floor(currentValue);
    const upperBound = Math.ceil(currentValue);
    
    return `linear-gradient(to right, 
      var(--emotion-${lowerBound}) 0%, 
      var(--emotion-${upperBound}) 100%)`;
  };

  return (
    <div className={cn(
      'emotion-slider-container w-full smooth-animation', 
      !prefersReducedMotion ? animationClass : '',
      !prefersReducedMotion ? getEmotionClass(currentValue) : '',
      className
    )}>
      {/* Emoji Scale */}
      <div className="emoji-scale">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
          <span 
            key={level}
            className={cn(
              'emoji-marker touch-feedback cursor-pointer transition-all duration-200',
              'hover:scale-110 focus:scale-110 active:scale-95',
              currentValue >= level - 0.5 && currentValue <= level + 0.5 && 'active scale-125 filter drop-shadow-lg',
              !prefersReducedMotion && 'animate-hover-lift'
            )}
            onClick={() => handleValueChange(level)}
            role="button"
            tabIndex={0}
            aria-label={`Set emotion to level ${level}: ${emotionLabels[level as keyof typeof emotionLabels]}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleValueChange(level);
              }
            }}
          >
            {emotionEmojis[level as keyof typeof emotionEmojis]}
          </span>
        ))}
      </div>
      
      {/* Custom Range Input */}
      <div className="relative">
        <input 
          ref={sliderRef}
          type="range" 
          min="1" 
          max="10" 
          step="0.1"
          value={currentValue}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          disabled={disabled}
          className={cn(
            'emotion-range w-full',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            background: generateDynamicGradient()
          }}
          aria-label={`Emotion level: ${currentValue.toFixed(1)} out of 10`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={currentValue}
          aria-valuetext={`${currentValue.toFixed(1)}: ${getEmotionLabel(currentValue)}`}
        />
        
        {/* Value indicator bubble */}
        <div
          className={cn(
            'absolute -top-12 transform -translate-x-1/2 pointer-events-none transition-all duration-300',
            'bg-white rounded-lg px-3 py-1 shadow-lg border text-sm font-medium',
            isDragging ? 'opacity-100 scale-110 animate-scale-in' : 'opacity-0 scale-95',
            !prefersReducedMotion && 'animate-hover-lift'
          )}
          style={{ 
            left: `${((currentValue - 1) / 9) * 100}%`,
            color: `var(--emotion-${Math.round(currentValue)})`
          }}
        >
          {currentValue.toFixed(1)}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      </div>
      
      {/* Dynamic Labels */}
      <div className="emotion-labels">
        <span className="text-red-600 font-medium">Anxious</span>
        <span className={cn(
          'current-emotion transition-all duration-300',
          getEmotionClass(currentValue)
        )}>
          {getEmotionLabel(currentValue)}
        </span>
        <span className="text-blue-600 font-medium">Zen Master</span>
      </div>

      {/* Current State Display */}
      <div className="flex items-center justify-center mt-4">
        <div 
          className={cn(
            'flex items-center space-x-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 glass-surface',
            getEmotionClass(currentValue),
            isDragging && 'scale-105'
          )}
          style={{ 
            backgroundColor: `var(--emotion-${Math.round(currentValue)})`,
            boxShadow: `var(--shadow-emotion)`
          }}
        >
          <span className="text-2xl">
            {emotionEmojis[Math.round(currentValue) as keyof typeof emotionEmojis]}
          </span>
          <div className="text-center">
            <div className="text-sm opacity-90">Level {currentValue.toFixed(1)}</div>
            <div className="font-bold">{getEmotionLabel(currentValue)}</div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex justify-center space-x-2 mt-6">
        {[
          { value: 1, label: 'Panic', emoji: '😰' },
          { value: 3, label: 'Anxious', emoji: '😐' },
          { value: 5, label: 'Neutral', emoji: '🙂' },
          { value: 7, label: 'Confident', emoji: '😎' },
          { value: 10, label: 'Zen', emoji: '🧘' }
        ].map((preset) => (
          <button
            key={preset.value}
            onClick={() => handleValueChange(preset.value)}
            disabled={disabled}
            className={cn(
              'touch-feedback flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 text-xs font-medium',
              Math.round(currentValue) === preset.value
                ? 'bg-white text-gray-900 scale-110 shadow-lg ring-2'
                : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: Math.round(currentValue) === preset.value 
                ? 'white' 
                : undefined,
              borderColor: Math.round(currentValue) === preset.value 
                ? `var(--emotion-${preset.value})` 
                : 'transparent'
            }}
            aria-label={`Set emotion to ${preset.label} (${preset.value})`}
          >
            <span className="text-lg mb-1">{preset.emoji}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-between mt-4 px-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
          <div
            key={level}
            className={cn(
              'w-1 h-6 rounded-full transition-all duration-300',
              currentValue >= level ? 'opacity-100' : 'opacity-30'
            )}
            style={{ 
              backgroundColor: `var(--emotion-${level})`,
              transform: currentValue >= level ? 'scaleY(1)' : 'scaleY(0.5)'
            }}
          />
        ))}
      </div>

      {/* Accessibility Instructions */}
      <div className="sr-only" aria-live="polite">
        Current emotion level is {currentValue.toFixed(1)} out of 10: {getEmotionLabel(currentValue)}.
        Use arrow keys, click on emojis, or use preset buttons to adjust.
      </div>
    </div>
  );
}
