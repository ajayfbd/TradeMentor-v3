import React from 'react';

/**
 * Feature Flag System for TradeMentor Enhancement Rollout
 * 
 * This system allows us to safely roll out new features incrementally
 * and perform A/B testing on different implementations.
 */

export interface FeatureFlags {
  // Phase 1: Database & Core Architecture
  enhancedAnalytics: boolean;
  emotionTracking: boolean;
  
  // Phase 2: Trading Features
  advancedPatterns: boolean;
  riskAnalysis: boolean;
  
  // Phase 3: UI/UX Enhancements
  darkMode: boolean;
  animations: boolean;
  responsiveDesign: boolean;
  
  // Phase 4: Social Features
  socialTrading: boolean;
  mentorSystem: boolean;
  
  // Phase 5: AI Features
  aiInsights: boolean;
  predictiveAnalytics: boolean;
  
  // Phase 6: Mobile & PWA
  mobileOptimization: boolean;
  offlineMode: boolean;
  
  // Phase 7: Integration & API
  thirdPartyIntegrations: boolean;
  advancedApi: boolean;
  
  // Phase 8: Performance & Security
  performanceOptimizations: boolean;
  enhancedSecurity: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  enhancedAnalytics: false,
  emotionTracking: false,
  advancedPatterns: false,
  riskAnalysis: false,
  darkMode: false,
  animations: false,
  responsiveDesign: false,
  socialTrading: false,
  mentorSystem: false,
  aiInsights: false,
  predictiveAnalytics: false,
  mobileOptimization: false,
  offlineMode: false,
  thirdPartyIntegrations: false,
  advancedApi: false,
  performanceOptimizations: false,
  enhancedSecurity: false,
};

// Feature flag provider for React context
interface FeatureFlagContextType {
  flags: FeatureFlags;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const FeatureFlagContext = React.createContext<FeatureFlagContextType | null>(null);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = React.useState<FeatureFlags>(defaultFeatureFlags);

  const setFlag = React.useCallback((flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({ ...prev, [flag]: value }));
  }, []);

  const isEnabled = React.useCallback((flag: keyof FeatureFlags) => {
    return flags[flag];
  }, [flags]);

  const value = React.useMemo(() => ({
    flags,
    setFlag,
    isEnabled,
  }), [flags, setFlag, isEnabled]);

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = React.useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};

// Feature gate component
interface FeatureGateProps {
  flag: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ flag, children, fallback = null }) => {
  const { isEnabled } = useFeatureFlags();
  
  if (isEnabled(flag)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// A/B testing utilities
export interface ABTestConfig {
  name: string;
  variants: string[];
  traffic: number; // 0-1, percentage of users to include
  enabledFor: string[]; // user IDs or groups
}

export const getABTestVariant = (testName: string, userId: string, config: ABTestConfig): string | null => {
  // Simple hash-based assignment for consistent user experience
  const hash = simpleHash(testName + userId);
  const userPercent = hash % 100;
  
  if (userPercent >= config.traffic * 100) {
    return null; // User not in test
  }
  
  const variantIndex = hash % config.variants.length;
  return config.variants[variantIndex];
};

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Enhanced feature flag management
export class FeatureFlagManager {
  private flags: FeatureFlags;
  private abTests: Map<string, ABTestConfig> = new Map();
  
  constructor(initialFlags: Partial<FeatureFlags> = {}) {
    this.flags = { ...defaultFeatureFlags, ...initialFlags };
  }
  
  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }
  
  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
  }
  
  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
  }
  
  enablePhase(phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8): void {
    const phaseFlags = this.getPhaseFlags(phase);
    phaseFlags.forEach(flag => {
      this.flags[flag] = true;
    });
  }
  
  private getPhaseFlags(phase: number): (keyof FeatureFlags)[] {
    const phases: Record<number, (keyof FeatureFlags)[]> = {
      1: ['enhancedAnalytics', 'emotionTracking'],
      2: ['advancedPatterns', 'riskAnalysis'],
      3: ['darkMode', 'animations', 'responsiveDesign'],
      4: ['socialTrading', 'mentorSystem'],
      5: ['aiInsights', 'predictiveAnalytics'],
      6: ['mobileOptimization', 'offlineMode'],
      7: ['thirdPartyIntegrations', 'advancedApi'],
      8: ['performanceOptimizations', 'enhancedSecurity'],
    };
    
    return phases[phase] || [];
  }
  
  setupABTest(config: ABTestConfig): void {
    this.abTests.set(config.name, config);
  }
  
  getABTestVariant(testName: string, userId: string): string | null {
    const config = this.abTests.get(testName);
    if (!config) return null;
    
    return getABTestVariant(testName, userId, config);
  }
  
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }
}

// Global feature flag manager instance
export const featureFlagManager = new FeatureFlagManager();

// React hook for A/B testing
export const useABTest = (testName: string, userId: string) => {
  const [variant, setVariant] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const testVariant = featureFlagManager.getABTestVariant(testName, userId);
    setVariant(testVariant);
  }, [testName, userId]);
  
  return variant;
};
