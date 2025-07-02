'use client';

/**
 * Animation Configuration System
 * Provides centralized animation settings and preferences
 */

export interface AnimationConfig {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
  delays: {
    stagger: number;
    hover: number;
    focus: number;
  };
  emotions: {
    anxiety: {
      intensity: number;
      duration: number;
    };
    confidence: {
      intensity: number;
      duration: number;
    };
    calm: {
      intensity: number;
      duration: number;
    };
  };
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 600
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0.0, 1, 1)',
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  delays: {
    stagger: 100,
    hover: 50,
    focus: 0
  },
  emotions: {
    anxiety: {
      intensity: 2,
      duration: 500
    },
    confidence: {
      intensity: 1.02,
      duration: 1500
    },
    calm: {
      intensity: 20,
      duration: 2000
    }
  }
};

/**
 * Animation utility functions
 */
export class AnimationUtils {
  private static config: AnimationConfig = DEFAULT_ANIMATION_CONFIG;
  
  static setConfig(config: Partial<AnimationConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  static getConfig(): AnimationConfig {
    return this.config;
  }
  
  static getDuration(type: keyof AnimationConfig['duration']): number {
    return this.config.duration[type];
  }
  
  static getEasing(type: keyof AnimationConfig['easing']): string {
    return this.config.easing[type];
  }
  
  static getStaggerDelay(index: number): number {
    return index * this.config.delays.stagger;
  }
  
  static getEmotionAnimation(emotion: number): string {
    if (emotion <= 3) {
      return 'emotion-low';
    } else if (emotion <= 6) {
      return 'emotion-mid';
    } else {
      return 'emotion-high';
    }
  }
  
  static createKeyframes(name: string, keyframes: Record<string, Record<string, string>>): string {
    const keyframeStr = Object.entries(keyframes)
      .map(([percentage, styles]) => {
        const styleStr = Object.entries(styles)
          .map(([prop, value]) => `${prop}: ${value};`)
          .join(' ');
        return `${percentage} { ${styleStr} }`;
      })
      .join(' ');
    
    return `@keyframes ${name} { ${keyframeStr} }`;
  }
  
  static generateCSS(): string {
    const config = this.getConfig();
    
    return `
      :root {
        --animation-duration-fast: ${config.duration.fast}ms;
        --animation-duration-normal: ${config.duration.normal}ms;
        --animation-duration-slow: ${config.duration.slow}ms;
        --animation-easing: ${config.easing.ease};
        --animation-easing-bounce: ${config.easing.bounce};
        --animation-stagger-delay: ${config.delays.stagger}ms;
      }
      
      .animate-emotion-anxiety {
        animation: anxiety-shake ${config.emotions.anxiety.duration}ms ease-in-out;
      }
      
      .animate-emotion-confidence {
        animation: confident-glow ${config.emotions.confidence.duration}ms ease-in-out infinite;
      }
      
      .animate-emotion-calm {
        animation: steady-pulse ${config.emotions.calm.duration}ms ease-in-out infinite;
      }
    `;
  }
}

/**
 * Performance monitoring for animations
 */
export class AnimationPerformance {
  private static metrics: Map<string, number[]> = new Map();
  
  static startTimer(animationName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(animationName)) {
        this.metrics.set(animationName, []);
      }
      
      this.metrics.get(animationName)!.push(duration);
      
      // Keep only last 10 measurements
      const measurements = this.metrics.get(animationName)!;
      if (measurements.length > 10) {
        measurements.shift();
      }
      
      // Log performance warnings
      if (duration > 16.67) { // 60fps threshold
        console.warn(`Animation "${animationName}" took ${duration.toFixed(2)}ms (> 16.67ms for 60fps)`);
      }
    };
  }
  
  static getAverageTime(animationName: string): number {
    const measurements = this.metrics.get(animationName);
    if (!measurements || measurements.length === 0) return 0;
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }
  
  static getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((measurements, name) => {
      result[name] = {
        average: this.getAverageTime(name),
        count: measurements.length
      };
    });
    
    return result;
  }
  
  static logReport(): void {
    const metrics = this.getAllMetrics();
    console.group('Animation Performance Report');
    
    Object.entries(metrics).forEach(([name, data]) => {
      console.log(`${name}: ${data.average.toFixed(2)}ms avg (${data.count} samples)`);
    });
    
    console.groupEnd();
  }
}

/**
 * Animation accessibility helpers
 */
export class AnimationAccessibility {
  static respectsReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  static applyReducedMotion(element: HTMLElement): void {
    if (this.respectsReducedMotion()) {
      element.style.animationDuration = '0.01ms';
      element.style.animationIterationCount = '1';
      element.style.transitionDuration = '0.01ms';
    }
  }
  
  static getReducedMotionCSS(): string {
    return `
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        /* Keep essential feedback animations */
        .animate-success,
        .animate-error,
        .animate-warning {
          animation-duration: 200ms !important;
        }
      }
    `;
  }
}

/**
 * Device-specific animation optimizations
 */
export class DeviceOptimization {
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  static isLowEndDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    
    // Check for device memory API
    if ('deviceMemory' in navigator) {
      // @ts-ignore
      return navigator.deviceMemory <= 2; // 2GB or less
    }
    
    // Fallback: check for slow connection
    if ('connection' in navigator) {
      // @ts-ignore - Network Information API
      const connection = (navigator as any).connection;
      return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    }
    
    return false;
  }
  
  static getOptimizedConfig(): Partial<AnimationConfig> {
    if (this.isLowEndDevice()) {
      return {
        duration: {
          fast: 100,
          normal: 200,
          slow: 300
        },
        delays: {
          stagger: 50,
          hover: 0,
          focus: 0
        }
      };
    }
    
    if (this.isMobile()) {
      return {
        duration: {
          fast: 150,
          normal: 250,
          slow: 400
        }
      };
    }
    
    return {};
  }
  
  static applyOptimizations(): void {
    const optimizedConfig = this.getOptimizedConfig();
    if (Object.keys(optimizedConfig).length > 0) {
      AnimationUtils.setConfig(optimizedConfig);
    }
  }
}

/**
 * Animation presets for common use cases
 */
export const ANIMATION_PRESETS = {
  pageTransition: {
    enter: 'animate-fade-in animate-slide-up',
    exit: 'animate-fade-out animate-slide-down'
  },
  modalTransition: {
    enter: 'animate-scale-in',
    exit: 'animate-scale-out'
  },
  cardHover: {
    enter: 'animate-hover-lift',
    exit: ''
  },
  buttonPress: {
    active: 'animate-button-press'
  },
  emotionFeedback: {
    low: 'animate-emotion-anxiety',
    mid: 'animate-emotion-calm',
    high: 'animate-emotion-confidence'
  },
  dataVisualization: {
    chartEnter: 'animate-draw-line',
    barFill: 'animate-fill-bar',
    counterUp: 'animate-counter'
  },
  feedback: {
    success: 'animate-success',
    error: 'animate-error',
    warning: 'animate-warning'
  }
};

/**
 * Initialize animation system
 */
export function initializeAnimationSystem(): void {
  // Apply device optimizations
  DeviceOptimization.applyOptimizations();
  
  // Inject CSS variables
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = AnimationUtils.generateCSS() + AnimationAccessibility.getReducedMotionCSS();
    document.head.appendChild(style);
  }
  
  // Log initialization
  console.log('TradeMentor Animation System initialized', {
    config: AnimationUtils.getConfig(),
    reducedMotion: AnimationAccessibility.respectsReducedMotion(),
    mobile: DeviceOptimization.isMobile(),
    lowEnd: DeviceOptimization.isLowEndDevice()
  });
}
