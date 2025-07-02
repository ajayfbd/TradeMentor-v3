'use client';

import React from 'react';
// import { motion } from 'framer-motion';

interface EmptyStateProps {
  message: string;
  icon?: string;
  subMessage?: string;
}

export function EmptyState({ 
  message, 
  icon = '📊', 
  subMessage = 'Start tracking your emotions with trades to see insights.' 
}: EmptyStateProps) {
  return (
    <div 
      className="empty-state flex flex-col items-center justify-center h-full text-center p-8 animate-pulse"
    >
      <div 
        className="text-6xl mb-4"
      >
        {icon}
      </div>
      
      <h3 
        className="text-lg font-medium text-text-primary mb-2"
      >
        {message}
      </h3>
      
      <p 
        className="text-text-secondary max-w-xs"
      >
        {subMessage}
      </p>
      
      <div 
        className="mt-6 flex space-x-2"
      >
        {/* Animated dots to show it's waiting for data */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 200}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}
