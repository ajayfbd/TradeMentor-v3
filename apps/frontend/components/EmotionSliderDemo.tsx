'use client';

import React, { useState } from 'react';
import { EmotionSlider } from './EmotionSlider';

export function EmotionSliderDemo() {
  const [emotionValue, setEmotionValue] = useState(5);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Get emotion class for demo container
  const getEmotionClass = (value: number): string => {
    if (value <= 3) return 'emotion-low';
    if (value <= 6) return 'emotion-mid';
    return 'emotion-high';
  };

  // Get current emotion info
  const getEmotionInfo = (value: number) => {
    const emotionRanges = {
      'Panic Zone': { range: [1, 2], color: 'var(--emotion-1)', description: 'High cortisol, fight/flight response' },
      'Stress Zone': { range: [2, 3], color: 'var(--emotion-2)', description: 'Elevated stress, impaired judgment' },
      'Anxiety Zone': { range: [3, 4], color: 'var(--emotion-3)', description: 'Mild anxiety, cautious thinking' },
      'Caution Zone': { range: [4, 5], color: 'var(--emotion-4)', description: 'Cognitive processing, careful analysis' },
      'Neutral Zone': { range: [5, 6], color: 'var(--emotion-5)', description: 'Balanced state, clear thinking' },
      'Confidence Zone': { range: [6, 8], color: 'var(--emotion-7)', description: 'Growing confidence, positive outlook' },
      'Mastery Zone': { range: [8, 9], color: 'var(--emotion-8)', description: 'Strong confidence, optimal performance' },
      'Flow Zone': { range: [9, 10], color: 'var(--emotion-9)', description: 'Peak performance, effortless execution' },
      'Zen Zone': { range: [10, 10], color: 'var(--emotion-10)', description: 'Ultimate calm, master-level focus' }
    };

    for (const [zone, info] of Object.entries(emotionRanges)) {
      if (value >= info.range[0] && value <= info.range[1]) {
        return { zone, ...info };
      }
    }
    return { zone: 'Unknown', range: [5, 5], color: 'var(--emotion-5)', description: 'Balanced state' };
  };

  const currentEmotion = getEmotionInfo(emotionValue);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Advanced Emotion Slider Demo
        </h1>
        <p className="text-gray-600">
          Experience the psychology-based emotion tracking system
        </p>
      </div>

      {/* Demo Controls */}
      <div className="glass-surface rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Demo Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value as 'sm' | 'md' | 'lg')}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isDisabled}
                onChange={(e) => setIsDisabled(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Disabled State
              </span>
            </label>
          </div>
          
          <div className="flex items-center justify-center">
            <button
              onClick={() => setEmotionValue(Math.floor(Math.random() * 10) + 1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Random Value
            </button>
          </div>
        </div>
      </div>

      {/* Current State Display */}
      <div 
        className={`glass-surface rounded-xl p-6 transition-all duration-500 ${getEmotionClass(emotionValue)}`}
        style={{ 
          borderLeft: `4px solid ${currentEmotion.color}`,
          boxShadow: `0 4px 20px ${currentEmotion.color}20`
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Current Emotion State</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Value:</span>
                <span className="text-xl font-bold" style={{ color: currentEmotion.color }}>
                  {emotionValue.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Zone:</span>
                <span className="font-semibold" style={{ color: currentEmotion.color }}>
                  {currentEmotion.zone}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {currentEmotion.description}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Psychological Impact</h3>
            <div className="space-y-2 text-sm">
              {emotionValue <= 3 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-800">High Stress State</div>
                  <div className="text-red-600">Elevated cortisol levels may impair decision-making</div>
                </div>
              )}
              {emotionValue > 3 && emotionValue <= 6 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-800">Transitional State</div>
                  <div className="text-yellow-600">Balanced cognitive processing</div>
                </div>
              )}
              {emotionValue > 6 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800">Confident State</div>
                  <div className="text-green-600">Optimal conditions for clear thinking</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Emotion Slider */}
      <div className="glass-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">How are you feeling right now?</h3>
        <EmotionSlider
          value={emotionValue}
          onChange={setEmotionValue}
          disabled={isDisabled}
          size={selectedSize}
          showLabels={true}
          className="w-full"
        />
      </div>

      {/* Animation Demo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-surface rounded-xl p-4 emotion-low">
          <h4 className="font-semibold mb-2 text-red-600">Anxiety Animation</h4>
          <div className="w-full h-4 bg-red-200 rounded-full">
            <div className="h-full w-1/3 bg-red-600 rounded-full"></div>
          </div>
          <p className="text-sm text-red-600 mt-2">Jittery, anxious motion</p>
        </div>
        
        <div className="glass-surface rounded-xl p-4 emotion-mid">
          <h4 className="font-semibold mb-2 text-yellow-600">Neutral Animation</h4>
          <div className="w-full h-4 bg-yellow-200 rounded-full">
            <div className="h-full w-1/2 bg-yellow-600 rounded-full"></div>
          </div>
          <p className="text-sm text-yellow-600 mt-2">Stable, controlled motion</p>
        </div>
        
        <div className="glass-surface rounded-xl p-4 emotion-high">
          <h4 className="font-semibold mb-2 text-green-600">Confidence Animation</h4>
          <div className="w-full h-4 bg-green-200 rounded-full">
            <div className="h-full w-4/5 bg-green-600 rounded-full"></div>
          </div>
          <p className="text-sm text-green-600 mt-2">Smooth, confident motion</p>
        </div>
      </div>

      {/* Technical Details */}
      <div className="glass-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Technical Implementation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Features Implemented</h4>
            <ul className="space-y-1 text-gray-600">
              <li>✅ 10-point emotion scale with CSS variables</li>
              <li>✅ Emoji visual feedback system</li>
              <li>✅ Dynamic gradient backgrounds</li>
              <li>✅ Haptic feedback for mobile devices</li>
              <li>✅ Touch-friendly design (44px+ targets)</li>
              <li>✅ Emotion-based animations</li>
              <li>✅ Glass morphism effects</li>
              <li>✅ Accessibility compliance (WCAG AA)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Psychology-Based Design</h4>
            <ul className="space-y-1 text-gray-600">
              <li>🧠 Scientifically calibrated color scale</li>
              <li>🎨 Color psychology for trader emotions</li>
              <li>📱 Optimized for mobile trading apps</li>
              <li>🌙 Dark mode for late-night trading</li>
              <li>⚡ Reduced motion for accessibility</li>
              <li>🎯 Visual cues beyond color alone</li>
              <li>🔄 Real-time emotional feedback</li>
              <li>📊 Data-driven emotion tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CSS Variables Reference */}
      <div className="glass-surface rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">CSS Variables Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
            <div
              key={level}
              className="p-3 rounded-lg text-white text-center font-medium text-sm"
              style={{ backgroundColor: `var(--emotion-${level})` }}
            >
              <div>Level {level}</div>
              <div className="text-xs opacity-90">
                --emotion-{level}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
