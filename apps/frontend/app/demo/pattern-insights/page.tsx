import React from 'react';
import { PatternInsightsDemo } from '@/components/PatternInsightsDemo';

/**
 * Pattern Insights Demo Page
 * 
 * This page showcases the complete pattern insights functionality including:
 * - Complete PatternView with scatter plots and insights
 * - Individual InsightCard components with different types
 * - Interactive ScatterPlot with trend analysis
 * - EmptyState component for insufficient data
 * - Backend PatternService integration overview
 * 
 * Technical Features Demonstrated:
 * - Linear regression analysis with confidence intervals
 * - Emotion-performance correlation tracking
 * - Statistical significance validation
 * - Responsive design for mobile/desktop
 * - Smooth animations and interactions
 * - Glass morphism design elements
 */
export default function PatternInsightsDemoPage() {
  return (
    <div className="pattern-insights-demo-page min-h-screen bg-gray-50">
      <PatternInsightsDemo />
    </div>
  );
}
