'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { cn, getEmotionColor, getEmotionLabel } from '@/lib/utils';

interface EmotionSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

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

  // Update internal state when prop changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleValueChange = useCallback((newValue: number) => {
    const clampedValue = Math.max(1, Math.min(10, Math.round(newValue)));
    setCurrentValue(clampedValue);
    onChange(clampedValue);
    
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [onChange]);

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

  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-12'
  };

  const thumbSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Emotion Level Display */}
      <div className="text-center space-y-2">
        <div 
          className="text-6xl font-bold transition-colors duration-200"
          style={{ color: getEmotionColor(currentValue) }}
        >
          {currentValue}
        </div>
        {showLabels && (
          <div className="text-lg font-medium text-muted-foreground">
            {getEmotionLabel(currentValue)}
          </div>
        )}
      </div>

      {/* Custom Slider */}
      <div className="relative px-4">
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={currentValue}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          disabled={disabled}
          className={cn(
            'w-full appearance-none bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200',
            sizeClasses[size],
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            background: `linear-gradient(to right, 
              rgb(220, 38, 38) 0%, 
              rgb(245, 158, 11) 50%, 
              rgb(5, 150, 105) 100%)`,
            borderRadius: '9999px',
          }}
          aria-label={`Emotion level: ${currentValue} out of 10`}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={currentValue}
          aria-valuetext={getEmotionLabel(currentValue)}
        />
        
        {/* Custom slider thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white border-2 border-primary shadow-lg transition-all duration-200 pointer-events-none',
            thumbSizeClasses[size],
            isDragging && 'scale-110 shadow-xl'
          )}
          style={{
            left: `${((currentValue - 1) / 9) * 100}%`,
            borderColor: getEmotionColor(currentValue),
          }}
        />
      </div>

      {/* Scale Labels */}
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground px-4">
          <span className="flex flex-col items-center">
            <span className="font-medium">1</span>
            <span>Anxious</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="font-medium">5</span>
            <span>Neutral</span>
          </span>
          <span className="flex flex-col items-center">
            <span className="font-medium">10</span>
            <span>Confident</span>
          </span>
        </div>
      )}

      {/* Quick Selection Buttons */}
      <div className="flex justify-center space-x-2">
        {[1, 3, 5, 7, 10].map((level) => (
          <button
            key={level}
            onClick={() => handleValueChange(level)}
            disabled={disabled}
            className={cn(
              'w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
              currentValue === level
                ? 'text-white scale-110 focus:ring-primary'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-gray-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              backgroundColor: currentValue === level ? getEmotionColor(level) : undefined,
            }}
            aria-label={`Set emotion level to ${level}`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}
