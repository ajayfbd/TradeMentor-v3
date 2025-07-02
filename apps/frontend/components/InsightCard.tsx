'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  title: string;
  description: string;
  confidence: number;
  type?: 'performance_correlation' | 'warning' | 'trend' | 'default';
  onTellMeMore?: () => void;
}

export function InsightCard({ 
  title, 
  description, 
  confidence, 
  type = 'default',
  onTellMeMore 
}: InsightCardProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance_correlation': return '🎯';
      case 'warning': return '⚠️';
      case 'trend': return '📈';
      default: return '💡';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="insight-card glass-morphism rounded-xl p-6 mb-4 hover:shadow-lg transition-all duration-300">
      <div className="insight-header flex items-center justify-between mb-4">
        <div className="insight-icon text-2xl">
          {getInsightIcon(type)}
        </div>
        <div className="insight-confidence">
          <span className="text-sm font-medium text-text-secondary mb-1 block">
            {confidence}% confidence
          </span>
          <div className="confidence-bar w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn(
                "confidence-fill h-full transition-all duration-500 ease-out",
                getConfidenceColor(confidence)
              )}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
      
      <h3 className="insight-title text-lg font-semibold mb-3 text-text-primary">
        {title}
      </h3>
      <p className="insight-description text-text-secondary mb-4 leading-relaxed">
        {description}
      </p>
      
      <div className="insight-action">
        <button 
          className="btn-secondary flex items-center space-x-2 px-4 py-2 bg-surface border border-border hover:border-primary hover:text-primary transition-all duration-200 rounded-lg"
          onClick={onTellMeMore}
        >
          <span>Tell me more</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
