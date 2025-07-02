import React from 'react';

/**
 * Feature Flag System for TradeMentor Enhancement Rollout
 * 
 * This system allows us to safely roll out new features incrementally
 * and perform A/B testing on different implementations.
 */

export const FEATURES = {
  // Phase 1: Foundation Features
  ENHANCED_DESIGN_SYSTEM: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_DESIGN === 'true' || false,
  ERROR_MONITORING: process.env.NEXT_PUBLIC_FEATURE_ERROR_MONITORING === 'true' || true,
  
  // Phase 2: Core Features  
  PATTERN_INSIGHTS: process.env.NEXT_PUBLIC_FEATURE_PATTERN_INSIGHTS === 'true' || false,
  ENHANCED_API_INTEGRATION: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_API === 'true' || false,
  
  // Phase 3: Experience Features
  STREAK_SYSTEM: process.env.NEXT_PUBLIC_FEATURE_STREAK_SYSTEM === 'true' || false,
  ANIMATIONS: process.env.NEXT_PUBLIC_FEATURE_ANIMATIONS === 'true' || false,
  ENHANCED_REFLECTIONS: process.env.NEXT_PUBLIC_FEATURE_ENHANCED_REFLECTIONS === 'true' || false,
  
  // Development/Testing Features
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_FEATURE_PERFORMANCE_MONITORING === 'true' || true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature] === true;
}

/**
 * Get all enabled features for debugging
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(FEATURES)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature as FeatureFlag);
}

/**
 * Feature flag wrapper component for conditional rendering
 */
export function FeatureFlag({ 
  feature, 
  children, 
  fallback = null 
}: {
  feature: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (isFeatureEnabled(feature)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

/**
 * Hook for using feature flags in components
 */
export function useFeatureFlag(feature: FeatureFlag): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Multiple feature flag check
 */
export function areAllFeaturesEnabled(features: FeatureFlag[]): boolean {
  return features.every(feature => isFeatureEnabled(feature));
}

export function isAnyFeatureEnabled(features: FeatureFlag[]): boolean {
  return features.some(feature => isFeatureEnabled(feature));
}
