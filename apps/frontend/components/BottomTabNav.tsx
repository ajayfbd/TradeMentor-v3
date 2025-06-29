'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTabStore, type TabKey } from '@/lib/tab-store';
import {
  Heart,
  TrendingUp,
  BarChart3,
  BookOpen,
  User,
  type LucideIcon
} from 'lucide-react';

interface TabConfig {
  key: TabKey;
  name: string;
  label: string;
  icon: LucideIcon;
  href: string;
  color: string;
  activeColor: string;
}

// Enhanced tab configuration with icons and routes
const tabs: TabConfig[] = [
  {
    key: 'emotion',
    name: 'Emotion',
    label: 'Emotion Check',
    icon: Heart,
    href: '/emotion',
    color: 'text-gray-500',
    activeColor: 'text-red-500'
  },
  {
    key: 'trade',
    name: 'Trade',
    label: 'Trade Log',
    icon: TrendingUp,
    href: '/trade',
    color: 'text-gray-500',
    activeColor: 'text-green-500'
  },
  {
    key: 'patterns',
    name: 'Patterns',
    label: 'Pattern Insights',
    icon: BarChart3,
    href: '/patterns',
    color: 'text-gray-500',
    activeColor: 'text-blue-500'
  },
  {
    key: 'reflection',
    name: 'Reflection',
    label: 'Reflection Journal',
    icon: BookOpen,
    href: '/reflection',
    color: 'text-gray-500',
    activeColor: 'text-purple-500'
  },
  {
    key: 'profile',
    name: 'Profile',
    label: 'Profile',
    icon: User,
    href: '/profile',
    color: 'text-gray-500',
    activeColor: 'text-indigo-500'
  }
];

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
}

function TabItem({ tab, isActive, onClick }: TabItemProps) {
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center space-y-1 transition-all duration-200 ease-in-out',
        'touch-target-lg rounded-lg relative overflow-hidden px-2 py-1',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50',
        'active:scale-95 hover:bg-gray-50'
      )}
      aria-label={tab.label}
    >
      {/* Active indicator background */}
      <div
        className={cn(
          'absolute inset-0 bg-current opacity-0 transition-opacity duration-200',
          isActive && 'opacity-5'
        )}
        style={{ color: isActive ? tab.activeColor : 'transparent' }}
      />
      
      {/* Icon container */}
      <div className={cn('relative z-10', isActive && 'tab-active')}>
        <Icon
          size={24}
          className={cn(
            'transition-all duration-200 ease-in-out',
            isActive ? tab.activeColor : tab.color,
            isActive && 'scale-110'
          )}
          strokeWidth={isActive ? 2.5 : 2}
          fill={isActive ? 'currentColor' : 'none'}
        />
      </div>
      
      {/* Label */}
      <span
        className={cn(
          'text-xs font-medium transition-all duration-200 ease-in-out',
          isActive ? tab.activeColor : tab.color,
          isActive && 'font-semibold'
        )}
      >
        {tab.name}
      </span>
      
      {/* Active indicator dot */}
      <div
        className={cn(
          'absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-200',
          isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
        style={{ backgroundColor: isActive ? tab.activeColor : 'transparent' }}
      />
    </Link>
  );
}

interface BottomTabNavProps {
  className?: string;
}

export function BottomTabNav({ className }: BottomTabNavProps = {}) {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useTabStore();

  // Update active tab based on current route
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.href === pathname);
    if (currentTab && currentTab.key !== activeTab) {
      setActiveTab(currentTab.key);
    }
  }, [pathname, activeTab, setActiveTab]);

  const handleTabClick = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    
    // Haptic feedback for mobile devices
    if (typeof window !== 'undefined' && 'navigator' in window) {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bottom-nav border-t border-gray-200 shadow-lg',
        'safe-bottom', // iOS safe area padding
        className
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around px-1 py-2 min-h-[56px]">
        {tabs.map((tab) => (
          <TabItem
            key={tab.key}
            tab={tab}
            isActive={activeTab === tab.key}
            onClick={() => handleTabClick(tab.key)}
          />
        ))}
      </div>
    </nav>
  );
}

// Hook to check if bottom nav should be shown
export function useShowBottomNav() {
  const pathname = usePathname();
  
  // Hide on auth pages and landing page
  const hiddenRoutes = ['/auth/login', '/auth/register', '/'];
  
  return !hiddenRoutes.includes(pathname);
}

// Export default for convenience
export default BottomTabNav;
