'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Heart, TrendingUp, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  {
    name: 'Check',
    href: '/emotion',
    icon: Heart,
    label: 'Emotion Check'
  },
  {
    name: 'Log',
    href: '/trade',
    icon: TrendingUp,
    label: 'Trade Log'
  },
  {
    name: 'Insights',
    href: '/patterns',
    icon: BarChart3,
    label: 'Pattern Insights'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    label: 'Profile'
  }
];

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted hover:text-primary'
              )}
              aria-label={tab.label}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 transition-all duration-200',
                  isActive && 'scale-110'
                )} 
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className={cn(
                'text-xs font-medium transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
