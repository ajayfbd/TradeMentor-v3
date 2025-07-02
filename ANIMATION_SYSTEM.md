# Animation & Motion Design System 🎨

A comprehensive animation system for TradeMentor-v3 that provides emotion-based visual feedback, haptic interactions, and performance-optimized animations.

## 🚀 Features

- **Emotion-Based Animations**: Visual feedback that responds to user emotional states
- **Haptic Feedback**: Native vibration API integration for mobile devices
- **Performance Optimized**: 60fps animations with GPU acceleration
- **Accessibility Compliant**: Respects reduced motion preferences
- **Mobile Optimized**: Device detection and adaptive animation complexity
- **Interactive Charts**: Staggered data visualization animations
- **Page Transitions**: Smooth navigation effects
- **Real-time Monitoring**: Performance metrics and frame rate tracking

## 📁 System Architecture

```
├── styles/
│   └── animation-utils.css           # Core CSS keyframes and utilities
├── hooks/
│   └── useAnimation.ts              # React hooks for animation state
├── components/
│   ├── EmotionSlider.tsx            # Enhanced with animations
│   └── AnimatedScatterPlot.tsx      # Interactive chart animations
├── lib/
│   └── animation-config.ts          # Configuration and performance monitoring
└── app/demo/animation-system/
    └── page.tsx                     # Comprehensive demo page
```

## 🎯 Core Components

### 1. CSS Animation Framework (`styles/animation-utils.css`)

**30+ Keyframe Definitions:**
- Emotion-based animations (anxiety-shake, steady-pulse, confident-glow)
- Page transitions (fade-in, slide-up, scale-in)
- Feedback states (success-bounce, error-shake, warning-pulse)
- Loading animations (gentle-spin, dots-loading, progress-fill)
- Chart animations (draw-line, stagger-points)

**Utility Classes:**
- Hardware-accelerated transforms
- Reduced motion support
- Dark mode adaptations
- Mobile optimizations

### 2. React Animation Hooks (`hooks/useAnimation.ts`)

**12 Custom Hooks:**
- `useAnimation()` - Core animation state management
- `usePageTransition()` - Smooth page navigation
- `useSuccessAnimation()` - Success feedback with bounce
- `useErrorAnimation()` - Error feedback with shake
- `useWarningAnimation()` - Warning feedback with pulse
- `useChartAnimation()` - Chart data visualization
- `useStaggeredAnimation()` - Sequential item animations
- `useButtonAnimation()` - Interactive button effects
- `useCounterAnimation()` - Animated number counting
- `useHapticFeedback()` - Mobile vibration integration
- `useReducedMotion()` - Accessibility compliance
- `useIntersectionAnimation()` - Viewport-based triggers

### 3. Enhanced Components

#### EmotionSlider (`components/EmotionSlider.tsx`)
- **Emotion-responsive animations**: Visual feedback based on slider value
- **Haptic feedback**: Vibration on value changes (mobile)
- **Smooth transitions**: Eased value changes with visual feedback
- **Accessibility**: Screen reader support and reduced motion compliance

#### AnimatedScatterPlot (`components/AnimatedScatterPlot.tsx`)
- **Staggered point animation**: Points appear sequentially with configurable delay
- **Trend line drawing**: Animated path drawing with SVG
- **Interactive tooltips**: Hover effects with smooth transitions
- **Performance optimized**: Intersection observer for viewport detection
- **Accessibility**: Keyboard navigation and screen reader support

### 4. Configuration System (`lib/animation-config.ts`)

#### AnimationUtils Class
```typescript
// Configuration management
AnimationUtils.setConfig({ duration: 300, easing: 'ease-out' });
AnimationUtils.getConfig('duration'); // 300

// Device optimization
AnimationUtils.optimizeForDevice();
AnimationUtils.isLowEndDevice(); // boolean
```

#### Performance Monitoring
```typescript
// Track animation performance
AnimationPerformance.startTracking('chart-animation');
AnimationPerformance.endTracking('chart-animation');
AnimationPerformance.getReport(); // Performance metrics
AnimationPerformance.logReport(); // Console output
```

#### Accessibility Features
```typescript
// Reduced motion detection
AnimationAccessibility.prefersReducedMotion(); // boolean
AnimationAccessibility.applyReducedMotion(); // Apply globally
AnimationAccessibility.getAccessibleDuration(300); // Auto-adjust
```

## 🎮 Demo & Testing

### Interactive Demo Page
Visit `/demo/animation-system` to explore all animation features:

1. **Emotion Slider Demo**: Test haptic feedback and emotion-based animations
2. **Chart Animations**: Interactive scatter plot with staggered animations
3. **Feedback Systems**: Success, error, and warning animations
4. **Performance Tools**: Real-time monitoring and device optimization
5. **Transitions**: Page navigation effects
6. **Interactive Elements**: Button animations and counter effects

### Usage Examples

#### Basic Animation
```tsx
import { useAnimation } from '@/hooks/useAnimation';

function MyComponent() {
  const { className, isAnimating, trigger } = useAnimation('fade-in');
  
  return (
    <div className={className} onClick={trigger}>
      Animated content
    </div>
  );
}
```

#### Emotion-Based Feedback
```tsx
import { EmotionSlider } from '@/components/EmotionSlider';

function TradingInterface() {
  const [emotion, setEmotion] = useState(5);
  
  return (
    <EmotionSlider
      value={emotion}
      onChange={setEmotion}
      size="lg"
      showLabels={true}
    />
  );
}
```

#### Chart Animations
```tsx
import { AnimatedScatterPlot } from '@/components/AnimatedScatterPlot';

function TradingResults() {
  return (
    <AnimatedScatterPlot
      data={tradeData}
      trendLine={trendLineData}
      width={800}
      height={400}
      pointDelay={100}
      showTooltip={true}
      onPointClick={(point) => console.log(point)}
    />
  );
}
```

#### Performance Monitoring
```tsx
import { initializeAnimationSystem, AnimationPerformance } from '@/lib/animation-config';

// Initialize system
useEffect(() => {
  initializeAnimationSystem();
}, []);

// Track performance
const handleAnimation = () => {
  AnimationPerformance.startTracking('user-interaction');
  // ... animation code ...
  AnimationPerformance.endTracking('user-interaction');
};
```

## ⚡ Performance Optimizations

### GPU Acceleration
- Hardware-accelerated transforms (`transform3d`, `will-change`)
- Optimized animation properties (transform, opacity)
- Efficient CSS keyframes with minimal reflows

### Device Adaptation
- Automatic low-end device detection
- Reduced animation complexity on mobile
- Network-aware optimizations
- Battery level considerations

### Accessibility
- Automatic reduced motion detection
- Configurable animation durations
- Screen reader compatibility
- Keyboard navigation support

### Memory Management
- Intersection observer for viewport animations
- Animation cleanup on component unmount
- Performance metrics tracking
- Frame rate monitoring

## 🛠️ Configuration

### Global Settings
```typescript
// Duration presets
ANIMATION_PRESETS.durations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800
};

// Easing functions
ANIMATION_PRESETS.easings = {
  linear: 'linear',
  easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};
```

### Device-Specific Optimizations
```typescript
// Automatic device detection
DeviceOptimization.isMobileDevice(); // boolean
DeviceOptimization.isLowEndDevice(); // boolean
DeviceOptimization.getOptimalDuration(300); // Adjusted duration
DeviceOptimization.shouldUseReducedAnimations(); // boolean
```

## 🎨 CSS Utility Classes

### Animation Classes
```css
/* Emotion-based animations */
.animate-anxiety-shake    /* Subtle shake for anxiety */
.animate-steady-pulse     /* Calm pulse for balance */
.animate-confident-glow   /* Bright glow for confidence */

/* Page transitions */
.animate-fade-in          /* Smooth fade entrance */
.animate-slide-up         /* Upward slide motion */
.animate-scale-in         /* Scale-based entrance */

/* Feedback states */
.animate-success-bounce   /* Success confirmation */
.animate-error-shake      /* Error indication */
.animate-warning-pulse    /* Warning attention */

/* Interactive states */
.animate-hover-lift       /* Lift effect on hover */
.animate-button-press     /* Press feedback */
.animate-loading-spin     /* Loading indicators */
```

### Performance Classes
```css
/* Hardware acceleration */
.gpu-accelerated         /* Force GPU layer */
.will-change-transform   /* Optimize for transforms */
.backface-hidden         /* Hide backfaces */

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .animate-* {
    animation-duration: 0.01ms !important;
  }
}
```

## 📊 Animation Metrics

The system tracks comprehensive performance metrics:

- **Frame Rate**: Average FPS during animations
- **Duration Tracking**: Actual vs. expected animation times
- **Memory Usage**: Animation-related memory consumption
- **Device Performance**: Hardware capability assessment
- **User Preferences**: Reduced motion adoption rates
- **Error Tracking**: Animation failures and fallbacks

## 🔧 Troubleshooting

### Common Issues

1. **Animations not appearing**: Check if `initializeAnimationSystem()` is called
2. **Poor performance**: Enable device optimization with `DeviceOptimization.apply()`
3. **Accessibility warnings**: Ensure reduced motion detection is active
4. **Mobile issues**: Verify haptic feedback permissions and device support

### Debug Mode
```typescript
// Enable detailed logging
AnimationUtils.setDebugMode(true);

// Check system status
AnimationUtils.getSystemStatus();

// Performance report
AnimationPerformance.logReport();
```

## 🎯 Future Enhancements

- [ ] WebGL-based particle effects for advanced visualizations
- [ ] Voice-controlled animation triggers for accessibility
- [ ] AI-driven emotion detection for automatic animation selection
- [ ] VR/AR animation support for immersive trading experiences
- [ ] Real-time collaboration animations for team trading
- [ ] Advanced gesture recognition for mobile interactions

## 📝 License

This animation system is part of the TradeMentor-v3 project and follows the same licensing terms.

---

**Built with ❤️ for TradeMentor-v3** - Enhancing trading psychology through thoughtful animation design.
