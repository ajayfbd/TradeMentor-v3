# Feature Flag Integration Guide

## Quick Setup

### 1. Wrap your app with the FeatureFlagProvider

```tsx
// In your main App component or layout
import { FeatureFlagProvider } from '@/lib/feature-flags';

export default function App({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagProvider>
      {children}
    </FeatureFlagProvider>
  );
}
```

### 2. Use feature gates in components

```tsx
import { FeatureGate, useFeatureFlags } from '@/lib/feature-flags';

function MyComponent() {
  const { isEnabled } = useFeatureFlags();
  
  return (
    <div>
      <FeatureGate flag="darkMode">
        <DarkModeToggle />
      </FeatureGate>
      
      {isEnabled('enhancedAnalytics') && (
        <AdvancedAnalyticsPanel />
      )}
    </div>
  );
}
```

### 3. Enable features for testing

```tsx
import { featureFlagManager } from '@/lib/feature-flags';

// Enable a single feature
featureFlagManager.enable('darkMode');

// Enable an entire phase
featureFlagManager.enablePhase(1); // Enables enhancedAnalytics & emotionTracking
```

### 4. A/B Testing

```tsx
import { useABTest } from '@/lib/feature-flags';

function TestComponent() {
  const variant = useABTest('button-color', userId);
  
  if (variant === 'red') {
    return <button className="bg-red-500">Click me</button>;
  } else if (variant === 'blue') {
    return <button className="bg-blue-500">Click me</button>;
  }
  
  return <button>Default button</button>;
}
```

## Phase Implementation Order

The feature flags are organized by implementation phases:

- **Phase 1**: `enhancedAnalytics`, `emotionTracking`
- **Phase 2**: `advancedPatterns`, `riskAnalysis`
- **Phase 3**: `darkMode`, `animations`, `responsiveDesign`
- **Phase 4**: `socialTrading`, `mentorSystem`
- **Phase 5**: `aiInsights`, `predictiveAnalytics`
- **Phase 6**: `mobileOptimization`, `offlineMode`
- **Phase 7**: `thirdPartyIntegrations`, `advancedApi`
- **Phase 8**: `performanceOptimizations`, `enhancedSecurity`

## Safety Features

- **Gradual Rollout**: Features can be enabled for specific user groups first
- **A/B Testing**: Compare different implementations before full rollout
- **Instant Rollback**: Disable features immediately if issues arise
- **Phase Management**: Enable entire feature sets systematically
