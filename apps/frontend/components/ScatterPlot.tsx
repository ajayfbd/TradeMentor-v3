'use client';

import React, { useEffect, useRef, useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

interface DataPoint {
  emotion: number;
  winRate: number;
  outcome: 'win' | 'loss';
  tradeId: string;
  details?: {
    profit?: number;
    symbol?: string;
    timestamp?: string;
  };
}

interface TrendLine {
  slope: number;
  intercept: number;
  confidence: number;
}

interface ScatterPlotProps {
  data: DataPoint[];
  trendLine?: boolean;
  animationDuration?: number;
  animationStagger?: number;
  width?: number;
  height?: number;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: DataPoint | null;
}

export function ScatterPlot({
  data,
  trendLine = true,
  animationDuration = 800,
  animationStagger = 100,
  width = 500,
  height = 300
}: ScatterPlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null
  });
  const [trendLineData, setTrendLineData] = useState<TrendLine | null>(null);

  // Chart dimensions and margins
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Calculate trend line using linear regression
  useEffect(() => {
    if (data.length < 3) return;

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.emotion, 0);
    const sumY = data.reduce((sum, d) => sum + d.winRate, 0);
    const sumXY = data.reduce((sum, d) => sum + d.emotion * d.winRate, 0);
    const sumXX = data.reduce((sum, d) => sum + d.emotion * d.emotion, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const totalSumSquares = data.reduce((sum, d) => sum + Math.pow(d.winRate - meanY, 2), 0);
    const residualSumSquares = data.reduce((sum, d) => {
      const predicted = slope * d.emotion + intercept;
      return sum + Math.pow(d.winRate - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    setTrendLineData({
      slope,
      intercept,
      confidence: Math.max(0, Math.min(100, rSquared * 100))
    });
  }, [data]);

  // Scale functions
  const xScale = (value: number) => (value - 1) * (chartWidth / 9); // 1-10 emotion scale
  const yScale = (value: number) => chartHeight - (value * chartHeight / 100); // 0-100% win rate

  const handleMouseEnter = (point: DataPoint, event: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        content: point
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  const getPointColor = (outcome: 'win' | 'loss') => {
    return outcome === 'win' ? '#10B981' : '#EF4444'; // green for wins, red for losses
  };

  return (
    <div className="scatter-plot-container relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible"
      >
        {/* Grid lines */}
        <g className="grid-lines">
          {/* Vertical grid lines (emotion levels) */}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`v-grid-${i}`}
              x1={margin.left + xScale(i + 1)}
              y1={margin.top}
              x2={margin.left + xScale(i + 1)}
              y2={height - margin.bottom}
              stroke="#E5E7EB"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
          
          {/* Horizontal grid lines (win rate) */}
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={`h-grid-${i}`}
              x1={margin.left}
              y1={margin.top + yScale(i * 20)}
              x2={width - margin.right}
              y2={margin.top + yScale(i * 20)}
              stroke="#E5E7EB"
              strokeWidth={1}
              opacity={0.5}
            />
          ))}
        </g>

        {/* Axes */}
        <g className="axes">
          {/* X-axis */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#374151"
            strokeWidth={2}
          />
          
          {/* Y-axis */}
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#374151"
            strokeWidth={2}
          />
        </g>

        {/* Axis labels */}
        <g className="axis-labels">
          {/* X-axis labels (emotion levels) */}
          {Array.from({ length: 10 }, (_, i) => (
            <text
              key={`x-label-${i}`}
              x={margin.left + xScale(i + 1)}
              y={height - margin.bottom + 20}
              textAnchor="middle"
              fontSize="12"
              fill="#6B7280"
            >
              {i + 1}
            </text>
          ))}
          
          {/* Y-axis labels (win rate) */}
          {Array.from({ length: 6 }, (_, i) => (
            <text
              key={`y-label-${i}`}
              x={margin.left - 10}
              y={margin.top + yScale(i * 20) + 4}
              textAnchor="end"
              fontSize="12"
              fill="#6B7280"
            >
              {i * 20}%
            </text>
          ))}
        </g>

        {/* Trend line */}
        {trendLine && trendLineData && (
          <line
            x1={margin.left + xScale(1)}
            y1={margin.top + yScale(trendLineData.slope * 1 + trendLineData.intercept)}
            x2={margin.left + xScale(10)}
            y2={margin.top + yScale(trendLineData.slope * 10 + trendLineData.intercept)}
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="5,5"
            opacity={0.7}
            className="animate-pulse"
          />
        )}

        {/* Data points */}
        <g className="data-points">
          {data.map((point, index) => (
            <circle
              key={`${point.tradeId}-${index}`}
              cx={margin.left + xScale(point.emotion)}
              cy={margin.top + yScale(point.winRate * 100)}
              r={6}
              fill={getPointColor(point.outcome)}
              stroke="white"
              strokeWidth={2}
              className="cursor-pointer hover:r-8 transition-all duration-200 opacity-0 animate-pulse"
              style={{
                animationDelay: `${index * animationStagger}ms`,
                animationFillMode: 'forwards'
              }}
              onMouseEnter={(e: React.MouseEvent) => handleMouseEnter(point, e)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
        </g>

        {/* Axis titles */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="500"
        >
          Emotion Level
        </text>
        
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          fontWeight="500"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          Win Rate (%)
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none opacity-0 animate-pulse"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            animationFillMode: 'forwards',
            animationDuration: '150ms'
          }}
        >
          <div className="text-sm">
            <div className="font-medium mb-1">
              {tooltip.content.outcome === 'win' ? '🟢 Win' : '🔴 Loss'}
            </div>
            <div className="text-gray-600">
              Emotion: {tooltip.content.emotion}/10
            </div>
            <div className="text-gray-600">
              Win Rate: {(tooltip.content.winRate * 100).toFixed(1)}%
            </div>
            {tooltip.content.details && (
              <>
                {tooltip.content.details.symbol && (
                  <div className="text-gray-600">
                    Symbol: {tooltip.content.details.symbol}
                  </div>
                )}
                {tooltip.content.details.profit && (
                  <div className={tooltip.content.details.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                    P&L: ${tooltip.content.details.profit.toFixed(2)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">Wins</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-gray-600">Losses</span>
        </div>
        {trendLineData && (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-0.5 bg-blue-500 opacity-70" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-sm text-gray-600">
              Trend ({trendLineData.confidence.toFixed(0)}% confidence)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
