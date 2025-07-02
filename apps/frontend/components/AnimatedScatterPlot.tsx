'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChartAnimation, useReducedMotion, useInViewAnimation } from '@/hooks/useAnimation';

interface DataPoint {
  emotion: number;
  winRate: number;
  outcome: 'win' | 'loss';
  tradeId: string;
  details?: {
    profit: number;
    symbol: string;
    date?: string;
  };
}

interface TrendLine {
  path: string;
  slope: number;
  intercept: number;
  rSquared: number;
}

interface AnimatedScatterPlotProps {
  data: DataPoint[];
  trendLine?: TrendLine;
  width?: number;
  height?: number;
  showTooltip?: boolean;
  animationDuration?: number;
  pointDelay?: number;
  className?: string;
  onPointClick?: (point: DataPoint) => void;
}

export function AnimatedScatterPlot({
  data,
  trendLine,
  width = 500,
  height = 300,
  showTooltip = true,
  animationDuration = 800,
  pointDelay = 100,
  className = '',
  onPointClick
}: AnimatedScatterPlotProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  const prefersReducedMotion = useReducedMotion();
  const { ref: containerRef, isInView } = useInViewAnimation(0.3);
  const { visiblePoints, showTrendLine, isComplete } = useChartAnimation(
    data, 
    prefersReducedMotion ? 10 : pointDelay, 
    prefersReducedMotion ? 50 : 300
  );

  // Chart dimensions and padding
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (emotion: number) => 
    padding.left + ((emotion - 1) / 9) * chartWidth;
  
  const yScale = (winRate: number) => 
    padding.top + (1 - winRate) * chartHeight;

  // Generate axis ticks
  const xTicks = Array.from({ length: 10 }, (_, i) => i + 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  // Handle point hover
  const handlePointHover = (point: DataPoint, event: React.MouseEvent) => {
    if (!showTooltip) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    setHoveredPoint(point);
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  // Calculate trend line path
  const getTrendLinePath = () => {
    if (!trendLine) return '';
    
    const x1 = xScale(1);
    const y1 = yScale(trendLine.slope * 1 + trendLine.intercept);
    const x2 = xScale(10);
    const y2 = yScale(trendLine.slope * 10 + trendLine.intercept);
    
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  const strokeDasharray = getTrendLinePath().length || 1000;

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`animated-scatter-plot ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path 
              d="M 40 0 L 0 0 0 30" 
              fill="none" 
              stroke="#f1f5f9" 
              strokeWidth="0.5"
            />
          </pattern>
          
          {/* Gradient for trend line */}
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        {/* Grid background */}
        <rect 
          x={padding.left} 
          y={padding.top} 
          width={chartWidth} 
          height={chartHeight} 
          fill="url(#grid)" 
        />
        
        {/* X-axis */}
        <line 
          x1={padding.left} 
          y1={padding.top + chartHeight} 
          x2={padding.left + chartWidth} 
          y2={padding.top + chartHeight} 
          stroke="#64748b" 
          strokeWidth="2"
        />
        
        {/* Y-axis */}
        <line 
          x1={padding.left} 
          y1={padding.top} 
          x2={padding.left} 
          y2={padding.top + chartHeight} 
          stroke="#64748b" 
          strokeWidth="2"
        />
        
        {/* X-axis labels (emotion levels) */}
        {xTicks.map(level => (
          <g key={level}>
            <line
              x1={xScale(level)}
              y1={padding.top + chartHeight}
              x2={xScale(level)}
              y2={padding.top + chartHeight + 5}
              stroke="#64748b"
              strokeWidth="1"
            />
            <text 
              x={xScale(level)}
              y={padding.top + chartHeight + 20}
              textAnchor="middle"
              fill="#475569"
              fontSize="12"
              fontWeight="medium"
            >
              {level}
            </text>
          </g>
        ))}
        
        {/* X-axis title */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - 15}
          textAnchor="middle"
          fill="#374151"
          fontSize="14"
          fontWeight="600"
        >
          Emotion Level
        </text>
        
        {/* Y-axis labels (win rates) */}
        {yTicks.map(rate => (
          <g key={rate}>
            <line
              x1={padding.left - 5}
              y1={yScale(rate)}
              x2={padding.left}
              y2={yScale(rate)}
              stroke="#64748b"
              strokeWidth="1"
            />
            <text 
              x={padding.left - 10}
              y={yScale(rate) + 4}
              textAnchor="end"
              fill="#475569"
              fontSize="12"
              fontWeight="medium"
            >
              {Math.round(rate * 100)}%
            </text>
          </g>
        ))}
        
        {/* Y-axis title */}
        <text
          x={15}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fill="#374151"
          fontSize="14"
          fontWeight="600"
          transform={`rotate(-90, 15, ${padding.top + chartHeight / 2})`}
        >
          Win Rate
        </text>
        
        {/* Trend line */}
        {trendLine && showTrendLine && isInView && (
          <g>
            {/* Trend line shadow */}
            <path
              d={getTrendLinePath()}
              fill="none"
              stroke="rgba(59, 130, 246, 0.2)"
              strokeWidth="6"
              strokeLinecap="round"
              className={prefersReducedMotion ? '' : 'animate-draw-line'}
              style={{
                strokeDasharray: prefersReducedMotion ? 'none' : strokeDasharray,
                animationDelay: '300ms',
                animationDuration: `${animationDuration}ms`
              }}
            />
            
            {/* Main trend line */}
            <path
              d={getTrendLinePath()}
              fill="none"
              stroke="url(#trendGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className={prefersReducedMotion ? '' : 'animate-draw-line'}
              style={{
                strokeDasharray: prefersReducedMotion ? 'none' : strokeDasharray,
                animationDelay: '300ms',
                animationDuration: `${animationDuration}ms`
              }}
            />
            
            {/* R-squared display */}
            {isComplete && (
              <text
                x={padding.left + chartWidth - 10}
                y={padding.top + 20}
                textAnchor="end"
                fill="#3b82f6"
                fontSize="12"
                fontWeight="600"
                className={prefersReducedMotion ? '' : 'animate-fade-in'}
              >
                R² = {trendLine.rSquared.toFixed(3)}
              </text>
            )}
          </g>
        )}
        
        {/* Data points */}
        {data.map((point, index) => {
          const isVisible = visiblePoints.includes(index) && isInView;
          const x = xScale(point.emotion);
          const y = yScale(point.winRate);
          const isWin = point.outcome === 'win';
          
          return (
            <g key={point.tradeId}>
              {/* Point shadow/glow */}
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                opacity={isVisible ? 1 : 0}
                className={prefersReducedMotion ? '' : 'transition-all duration-300'}
                style={{
                  transitionDelay: prefersReducedMotion ? '0ms' : `${index * pointDelay}ms`
                }}
              />
              
              {/* Main point */}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={isWin ? '#22c55e' : '#ef4444'}
                stroke="#ffffff"
                strokeWidth="2"
                opacity={isVisible ? 1 : 0}
                className={`cursor-pointer transition-all duration-300 ${
                  prefersReducedMotion ? '' : 'hover:scale-125'
                } ${hoveredPoint?.tradeId === point.tradeId ? 'scale-125' : ''}`}
                style={{
                  transitionDelay: prefersReducedMotion ? '0ms' : `${index * pointDelay}ms`,
                  filter: hoveredPoint?.tradeId === point.tradeId ? 'drop-shadow(0 0 8px rgba(0,0,0,0.3))' : 'none'
                }}
                onMouseEnter={(e) => handlePointHover(point, e)}
                onMouseLeave={handlePointLeave}
                onClick={() => onPointClick?.(point)}
              />
              
              {/* Profit/Loss indicator */}
              {point.details && isVisible && (
                <text
                  x={x}
                  y={y - 15}
                  textAnchor="middle"
                  fill={isWin ? '#22c55e' : '#ef4444'}
                  fontSize="10"
                  fontWeight="600"
                  opacity={hoveredPoint?.tradeId === point.tradeId ? 1 : 0}
                  className="transition-opacity duration-200 pointer-events-none"
                >
                  ${Math.abs(point.details.profit).toFixed(0)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredPoint && showTooltip && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none z-10 max-w-xs animate-fade-in"
          style={{
            left: `${tooltipPosition.x + 10}px`,
            top: `${tooltipPosition.y - 10}px`,
            transform: tooltipPosition.x > width / 2 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="text-sm font-medium text-gray-900">
            Trade: {hoveredPoint.details?.symbol || hoveredPoint.tradeId}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Emotion: {hoveredPoint.emotion}/10
          </div>
          <div className="text-xs text-gray-600">
            Outcome: <span className={hoveredPoint.outcome === 'win' ? 'text-green-600' : 'text-red-600'}>
              {hoveredPoint.outcome === 'win' ? 'Win' : 'Loss'}
            </span>
          </div>
          {hoveredPoint.details && (
            <div className={`text-xs font-medium mt-1 ${
              hoveredPoint.outcome === 'win' ? 'text-green-600' : 'text-red-600'
            }`}>
              {hoveredPoint.outcome === 'win' ? '+' : '-'}${Math.abs(hoveredPoint.details.profit).toFixed(2)}
            </div>
          )}
          {hoveredPoint.details?.date && (
            <div className="text-xs text-gray-500 mt-1">
              {hoveredPoint.details.date}
            </div>
          )}
        </div>
      )}
      
      {/* Chart legend */}
      <div className="flex justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Winning Trades</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Losing Trades</span>
        </div>
        {trendLine && (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <span className="text-sm text-gray-600">Trend Line</span>
          </div>
        )}
      </div>
    </div>
  );
}
