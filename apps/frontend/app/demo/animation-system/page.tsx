'use client';

import React, { useState, useEffect } from 'react';
import { EmotionSlider } from '@/components/EmotionSlider';
import { AnimatedScatterPlot } from '@/components/AnimatedScatterPlot';
import { 
  useAnimation, 
  useSuccessAnimation, 
  useErrorAnimation, 
  useWarningAnimation,
  usePageTransition,
  useStaggeredAnimation,
  useButtonAnimation,
  useCounterAnimation,
  useReducedMotion
} from '@/hooks/useAnimation';
import { 
  initializeAnimationSystem, 
  AnimationPerformance, 
  ANIMATION_PRESETS 
} from '@/lib/animation-config';

type DemoView = 'overview' | 'emotion-slider' | 'charts' | 'transitions' | 'interactions' | 'performance';

// Sample data for charts
const sampleChartData = [
  { emotion: 3, winRate: 0.2, outcome: 'loss' as const, tradeId: 'trade-1', details: { profit: -45.50, symbol: 'AAPL' } },
  { emotion: 4, winRate: 0.4, outcome: 'loss' as const, tradeId: 'trade-2', details: { profit: -22.30, symbol: 'GOOGL' } },
  { emotion: 5, winRate: 1, outcome: 'win' as const, tradeId: 'trade-3', details: { profit: 125.75, symbol: 'TSLA' } },
  { emotion: 6, winRate: 1, outcome: 'win' as const, tradeId: 'trade-4', details: { profit: 89.25, symbol: 'MSFT' } },
  { emotion: 7, winRate: 1, outcome: 'win' as const, tradeId: 'trade-5', details: { profit: 156.80, symbol: 'AMZN' } },
  { emotion: 8, winRate: 1, outcome: 'win' as const, tradeId: 'trade-6', details: { profit: 203.45, symbol: 'AAPL' } },
  { emotion: 6, winRate: 1, outcome: 'win' as const, tradeId: 'trade-7', details: { profit: 67.90, symbol: 'GOOGL' } },
  { emotion: 5, winRate: 0, outcome: 'loss' as const, tradeId: 'trade-8', details: { profit: -34.20, symbol: 'TSLA' } },
  { emotion: 7, winRate: 1, outcome: 'win' as const, tradeId: 'trade-9', details: { profit: 198.30, symbol: 'MSFT' } },
  { emotion: 8, winRate: 1, outcome: 'win' as const, tradeId: 'trade-10', details: { profit: 245.60, symbol: 'AMZN' } }
];

const sampleTrendLine = {
  path: '',
  slope: 0.12,
  intercept: -0.1,
  rSquared: 0.847
};

export default function AnimationSystemDemo() {
  const [currentView, setCurrentView] = useState<DemoView>('overview');
  const [emotionValue, setEmotionValue] = useState(5);
  const [demoCounter, setDemoCounter] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);
  
  const pageTransition = usePageTransition();
  const prefersReducedMotion = useReducedMotion();
  const { className: successClass, triggerSuccess } = useSuccessAnimation();
  const { className: errorClass, triggerError } = useErrorAnimation();
  const { className: warningClass, triggerWarning } = useWarningAnimation();
  const { value: counterValue } = useCounterAnimation(demoCounter, 1000);

  // Initialize animation system
  useEffect(() => {
    initializeAnimationSystem();
  }, []);

  const demoItems = [
    'Page Transitions',
    'Emotion Animations', 
    'Chart Visualizations',
    'Button Interactions',
    'Success States',
    'Error Feedback'
  ];
  
  const visibleItems = useStaggeredAnimation(demoItems, 150);

  if (currentView === 'emotion-slider') {
    return (
      <div className={`min-h-screen bg-gray-50 ${pageTransition.className || ''}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Enhanced Emotion Slider with Animations</h1>
        </div>
        
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-xl font-medium mb-6 text-center">Emotion Slider with Haptic Feedback</h2>
            <EmotionSlider
              value={emotionValue}
              onChange={setEmotionValue}
              size="lg"
              showLabels={true}
            />
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Animation Features:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Emotion-based visual feedback (shake, pulse, glow)</li>
                <li>• Haptic feedback on mobile devices</li>
                <li>• Smooth value transitions with easing</li>
                <li>• Hover and focus animations</li>
                <li>• Accessibility-compliant reduced motion support</li>
                <li>• Progressive enhancement for touch devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'charts') {
    return (
      <div className={`min-h-screen bg-gray-50 ${pageTransition.className || ''}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Animated Data Visualizations</h1>
        </div>
        
        <div className="max-w-6xl mx-auto p-6">
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-xl font-medium mb-6">Scatter Plot with Staggered Animations</h2>
            <AnimatedScatterPlot
              data={sampleChartData}
              trendLine={sampleTrendLine}
              width={800}
              height={400}
              showTooltip={true}
              pointDelay={100}
              onPointClick={(point) => alert(`Clicked trade: ${point.details?.symbol}`)}
            />
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Chart Animation Features:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Staggered point appearance with configurable delay</li>
                  <li>• Animated trend line drawing</li>
                  <li>• Intersection observer for performance</li>
                  <li>• Hover animations and tooltips</li>
                  <li>• SVG-based for sharp rendering</li>
                </ul>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Performance Optimizations:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• GPU-accelerated transforms</li>
                  <li>• Reduced animation duration on low-end devices</li>
                  <li>• Minimal DOM updates during animation</li>
                  <li>• Automatic reduced motion compliance</li>
                  <li>• Efficient SVG rendering pipeline</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'interactions') {
    return (
      <div className={`min-h-screen bg-gray-50 ${pageTransition.className || ''}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Interactive Animations & Feedback</h1>
        </div>
        
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          {/* Feedback Animations */}
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-xl font-medium mb-6">Feedback Animations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={triggerSuccess}
                className={`p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${successClass}`}
              >
                Trigger Success Animation
              </button>
              
              <button
                onClick={triggerError}
                className={`p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors ${errorClass}`}
              >
                Trigger Error Animation
              </button>
              
              <button
                onClick={triggerWarning}
                className={`p-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors ${warningClass}`}
              >
                Trigger Warning Animation
              </button>
            </div>
          </div>

          {/* Counter Animation */}
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-xl font-medium mb-6">Counter Animation</h2>
            
            <div className="text-center">
              <div className="text-4xl font-bold mb-4">
                {counterValue.toLocaleString()}
              </div>
              
              <div className="space-x-4">
                <button
                  onClick={() => setDemoCounter(1000)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Count to 1,000
                </button>
                <button
                  onClick={() => setDemoCounter(50000)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Count to 50,000
                </button>
                <button
                  onClick={() => setDemoCounter(0)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Staggered List Animation */}
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-xl font-medium mb-6">Staggered List Animation</h2>
            
            <div className="space-y-3">
              {demoItems.map((item, index) => (
                <div
                  key={item}
                  className={`p-4 bg-gray-100 rounded-lg transition-all duration-300 ${
                    visibleItems.includes(index) ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'
                  }`}
                  style={{
                    transitionDelay: `${index * 150}ms`
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Replay Animation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'performance') {
    return (
      <div className={`min-h-screen bg-gray-50 ${pageTransition.className || ''}`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => setCurrentView('overview')}
            className="flex items-center text-primary hover:text-primary-hover transition-colors mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Demo Overview
          </button>
          <h1 className="text-2xl font-medium">Performance Monitoring & Optimization</h1>
        </div>
        
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-xl font-medium mb-6">Animation Performance Tools</h2>
            
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">System Detection</h3>
                <div className="text-sm space-y-1">
                  <div>Reduced Motion: {prefersReducedMotion ? '✅ Enabled' : '❌ Disabled'}</div>
                  <div>Device Type: {typeof navigator !== 'undefined' && /Mobile/i.test(navigator.userAgent) ? '📱 Mobile' : '🖥️ Desktop'}</div>
                  <div>Animation System: ✅ Initialized</div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium mb-2">Performance Metrics</h3>
                <button
                  onClick={() => {
                    AnimationPerformance.logReport();
                    setShowMetrics(true);
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  Generate Performance Report
                </button>
                {showMetrics && (
                  <div className="mt-3 text-sm text-green-700">
                    Check browser console for detailed performance metrics
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Optimization Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automatic device capability detection</li>
                  <li>• Reduced animation complexity on low-end devices</li>
                  <li>• GPU acceleration for transform animations</li>
                  <li>• Intersection Observer for viewport-based animations</li>
                  <li>• Configurable animation durations and delays</li>
                  <li>• Performance monitoring and frame rate tracking</li>
                  <li>• Accessibility compliance with reduced motion preferences</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main overview
  return (
    <div className={`animation-system-demo max-w-6xl mx-auto p-6 ${pageTransition.className || ''}`}>
      {/* Demo Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Animation & Motion Design System 🎨</h1>
        <p className="text-gray-600 text-lg mb-6">
          Comprehensive animation system with emotion-based feedback, haptic support, and performance optimization for TradeMentor.
        </p>
      </div>

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Emotion Slider */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-hover-lift">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🎛️</span>
            <h3 className="text-lg font-medium">Enhanced Emotion Slider</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Interactive emotion slider with haptic feedback, animated visual responses, and accessibility features.
          </p>
          <button
            onClick={() => setCurrentView('emotion-slider')}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            Try Emotion Slider
          </button>
        </div>

        {/* Chart Animations */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-hover-lift">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">📊</span>
            <h3 className="text-lg font-medium">Animated Charts</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Staggered data visualization animations with smooth trend line drawing and interactive tooltips.
          </p>
          <button
            onClick={() => setCurrentView('charts')}
            className="w-full py-2 px-4 border border-primary text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
          >
            View Chart Animations
          </button>
        </div>

        {/* Interactive Feedback */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-hover-lift">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">⚡</span>
            <h3 className="text-lg font-medium">Interactive Feedback</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Success, error, and warning animations with button interactions and staggered list animations.
          </p>
          <button
            onClick={() => setCurrentView('interactions')}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Test Interactions
          </button>
        </div>

        {/* Performance Monitoring */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-hover-lift">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🔍</span>
            <h3 className="text-lg font-medium">Performance Tools</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Animation performance monitoring, device optimization, and accessibility compliance tools.
          </p>
          <button
            onClick={() => setCurrentView('performance')}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            View Performance
          </button>
        </div>

        {/* Page Transitions */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-hover-lift">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🔄</span>
            <h3 className="text-lg font-medium">Page Transitions</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Smooth page transitions with fade, slide, and scale effects using CSS animations.
          </p>
          <button
            onClick={() => {
              // Demo page transition
              const body = document.body;
              body.style.opacity = '0';
              setTimeout(() => {
                body.style.opacity = '1';
                body.classList.add('animate-fade-in');
              }, 300);
            }}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Demo Transition
          </button>
        </div>

        {/* CSS Utilities */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-hover-lift">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🎭</span>
            <h3 className="text-lg font-medium">CSS Animation Utils</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Comprehensive CSS utility classes for keyframes, transitions, and emotion-based animations.
          </p>
          <button
            onClick={() => alert('Animation utilities are loaded in styles/animation-utils.css')}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            View CSS Utils
          </button>
        </div>
      </div>

      {/* Technical Features */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-medium mb-4 text-center">🔧 Animation System Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">📱</div>
            <h4 className="font-medium mb-1">Haptic Feedback</h4>
            <p className="text-sm text-gray-600">Native vibration API integration for mobile devices</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h4 className="font-medium mb-1">Emotion-Based</h4>
            <p className="text-sm text-gray-600">Animations that respond to user emotional state</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">⚡</div>
            <h4 className="font-medium mb-1">Performance</h4>
            <p className="text-sm text-gray-600">60fps animations with GPU acceleration</p>
          </div>
          <div className="feature-item text-center">
            <div className="text-2xl mb-2">♿</div>
            <h4 className="font-medium mb-1">Accessible</h4>
            <p className="text-sm text-gray-600">Respects reduced motion preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
