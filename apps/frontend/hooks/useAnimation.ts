'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook for emotion-based animations
 * @param emotionLevel - Current emotion level (1-10)
 * @returns Animation class name based on emotion level
 */
export function useAnimation(emotionLevel: number): string {
  const [animationClass, setAnimationClass] = useState('');
  
  useEffect(() => {
    if (emotionLevel <= 3) {
      setAnimationClass('emotion-low');
    } else if (emotionLevel <= 6) {
      setAnimationClass('emotion-mid');
    } else {
      setAnimationClass('emotion-high');
    }
  }, [emotionLevel]);
  
  return animationClass;
}

/**
 * Hook for page transition animations
 * @param delay - Optional delay before animation starts (ms)
 * @returns Object with className and style for page transitions
 */
export function usePageTransition(delay: number = 0) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return {
    className: isVisible ? 'animate-fade-in animate-slide-up' : '',
    style: { opacity: isVisible ? 1 : 0 }
  };
}

/**
 * Hook for success animation feedback
 * @returns Object with className and trigger function
 */
export function useSuccessAnimation() {
  const [isSuccess, setIsSuccess] = useState(false);
  
  const triggerSuccess = useCallback(() => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 1000);
  }, []);
  
  return {
    className: isSuccess ? 'animate-success' : '',
    triggerSuccess,
    isAnimating: isSuccess
  };
}

/**
 * Hook for error animation feedback
 * @returns Object with className and trigger function
 */
export function useErrorAnimation() {
  const [isError, setIsError] = useState(false);
  
  const triggerError = useCallback(() => {
    setIsError(true);
    setTimeout(() => setIsError(false), 500);
  }, []);
  
  return {
    className: isError ? 'animate-error' : '',
    triggerError,
    isAnimating: isError
  };
}

/**
 * Hook for warning animation feedback
 * @returns Object with className and trigger function
 */
export function useWarningAnimation() {
  const [isWarning, setIsWarning] = useState(false);
  
  const triggerWarning = useCallback(() => {
    setIsWarning(true);
    setTimeout(() => setIsWarning(false), 600);
  }, []);
  
  return {
    className: isWarning ? 'animate-warning' : '',
    triggerWarning,
    isAnimating: isWarning
  };
}

/**
 * Hook for staggered list animations
 * @param items - Array of items to animate
 * @param staggerDelay - Delay between each item animation (ms)
 * @returns Array of visible item indices
 */
export function useStaggeredAnimation<T>(items: T[], staggerDelay: number = 100) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  
  useEffect(() => {
    setVisibleItems([]); // Reset on items change
    
    items.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * staggerDelay);
    });
  }, [items, staggerDelay]);
  
  return visibleItems;
}

/**
 * Hook for chart animation timing
 * @param data - Chart data array
 * @param pointDelay - Delay between each point animation (ms)
 * @param trendLineDelay - Additional delay before trend line animation (ms)
 * @returns Object with animation states
 */
export function useChartAnimation<T>(
  data: T[], 
  pointDelay: number = 100, 
  trendLineDelay: number = 300
) {
  const [visiblePoints, setVisiblePoints] = useState<number[]>([]);
  const [showTrendLine, setShowTrendLine] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Reset animation state
    setVisiblePoints([]);
    setShowTrendLine(false);
    setIsComplete(false);
    
    // Animate points appearing
    data.forEach((_, index) => {
      setTimeout(() => {
        setVisiblePoints(prev => [...prev, index]);
      }, index * pointDelay);
    });
    
    // Show trend line after all points
    const trendLineTimer = setTimeout(() => {
      setShowTrendLine(true);
    }, data.length * pointDelay + trendLineDelay);
    
    // Mark animation as complete
    const completeTimer = setTimeout(() => {
      setIsComplete(true);
    }, data.length * pointDelay + trendLineDelay + 1000);
    
    return () => {
      clearTimeout(trendLineTimer);
      clearTimeout(completeTimer);
    };
  }, [data, pointDelay, trendLineDelay]);
  
  return {
    visiblePoints,
    showTrendLine,
    isComplete
  };
}

/**
 * Hook for button interaction animations
 * @returns Object with animation handlers
 */
export function useButtonAnimation() {
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    if (buttonRef.current) {
      buttonRef.current.classList.add('animate-button-press');
    }
  }, []);
  
  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
    if (buttonRef.current) {
      setTimeout(() => {
        buttonRef.current?.classList.remove('animate-button-press');
      }, 150);
    }
  }, []);
  
  return {
    ref: buttonRef,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    isPressed
  };
}

/**
 * Hook for haptic feedback (mobile devices)
 * @param pattern - Vibration pattern or duration
 * @returns Function to trigger haptic feedback
 */
export function useHapticFeedback(pattern: number | number[] = 10) {
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [pattern]);
  
  return triggerHaptic;
}

/**
 * Hook for intersection observer animations
 * @param threshold - Intersection threshold (0-1)
 * @returns Ref and visibility state
 */
export function useInViewAnimation(threshold: number = 0.1) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Only animate once
        }
      },
      { threshold }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [threshold]);
  
  return {
    ref,
    isInView,
    className: isInView ? 'animate-fade-in animate-slide-up' : ''
  };
}

/**
 * Hook for counter animation
 * @param endValue - Target number to count to
 * @param duration - Animation duration in ms
 * @param startValue - Starting number (default 0)
 * @returns Current animated value
 */
export function useCounterAnimation(
  endValue: number, 
  duration: number = 1000, 
  startValue: number = 0
) {
  const [currentValue, setCurrentValue] = useState(startValue);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsAnimating(true);
    const startTime = Date.now();
    const difference = endValue - startValue;
    
    const updateCounter = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const newValue = Math.round(startValue + difference * easedProgress);
      
      setCurrentValue(newValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setIsAnimating(false);
      }
    };
    
    requestAnimationFrame(updateCounter);
  }, [endValue, duration, startValue]);
  
  return {
    value: currentValue,
    isAnimating
  };
}

/**
 * Hook for managing reduced motion preferences
 * @returns Whether user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}

/**
 * Hook for loading skeleton animations
 * @param isLoading - Loading state
 * @returns Class name for skeleton animation
 */
export function useSkeletonAnimation(isLoading: boolean): string {
  return isLoading ? 'animate-shimmer' : '';
}
