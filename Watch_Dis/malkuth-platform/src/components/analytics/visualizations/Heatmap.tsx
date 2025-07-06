'use client';

import React, { useState } from 'react';
import { HeatmapData } from '@/types';

interface HeatmapProps {
  data: HeatmapData[];
  width?: number;
  height?: number;
  className?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple';
  showTooltip?: boolean;
  onCellClick?: (data: HeatmapData) => void;
  xLabels?: string[];
  yLabels?: string[];
}

const Heatmap: React.FC<HeatmapProps> = ({
  data,
  width = 400,
  height = 300,
  className = '',
  colorScheme = 'blue',
  showTooltip = true,
  onCellClick,
  xLabels = [],
  yLabels = []
}) => {
  const [hoveredCell, setHoveredCell] = useState<HeatmapData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Calculate grid dimensions
  const maxX = Math.max(...data.map(d => d.x));
  const maxY = Math.max(...data.map(d => d.y));
  const cols = maxX + 1;
  const rows = maxY + 1;

  // Calculate cell dimensions
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  // Find value range for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;

  // Color schemes
  const colorSchemes = {
    blue: {
      empty: 'rgb(31, 41, 55)', // gray-800
      colors: [
        'rgb(30, 58, 138)', // blue-900
        'rgb(29, 78, 216)', // blue-700
        'rgb(59, 130, 246)', // blue-500
        'rgb(147, 197, 253)', // blue-300
        'rgb(219, 234, 254)' // blue-100
      ]
    },
    green: {
      empty: 'rgb(31, 41, 55)',
      colors: [
        'rgb(20, 83, 45)', // green-900
        'rgb(21, 128, 61)', // green-700
        'rgb(34, 197, 94)', // green-500
        'rgb(134, 239, 172)', // green-300
        'rgb(220, 252, 231)' // green-100
      ]
    },
    red: {
      empty: 'rgb(31, 41, 55)',
      colors: [
        'rgb(127, 29, 29)', // red-900
        'rgb(185, 28, 28)', // red-700
        'rgb(239, 68, 68)', // red-500
        'rgb(252, 165, 165)', // red-300
        'rgb(254, 226, 226)' // red-100
      ]
    },
    purple: {
      empty: 'rgb(31, 41, 55)',
      colors: [
        'rgb(88, 28, 135)', // purple-900
        'rgb(126, 34, 206)', // purple-700
        'rgb(168, 85, 247)', // purple-500
        'rgb(196, 181, 253)', // purple-300
        'rgb(237, 233, 254)' // purple-100
      ]
    }
  };

  const getColor = (value: number) => {
    if (valueRange === 0) return colorSchemes[colorScheme].empty;
    
    const intensity = (value - minValue) / valueRange;
    const colorIndex = Math.floor(intensity * (colorSchemes[colorScheme].colors.length - 1));
    const clampedIndex = Math.max(0, Math.min(colorSchemes[colorScheme].colors.length - 1, colorIndex));
    
    return colorSchemes[colorScheme].colors[clampedIndex];
  };

  const getDataForCell = (x: number, y: number): HeatmapData | null => {
    return data.find(d => d.x === x && d.y === y) || null;
  };

  const handleCellHover = (cellData: HeatmapData | null, event: React.MouseEvent) => {
    setHoveredCell(cellData);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Heatmap Grid */}
      <svg width={width} height={height} className="border border-gray-700 rounded">
        {/* Generate grid cells */}
        {Array.from({ length: rows }, (_, y) =>
          Array.from({ length: cols }, (_, x) => {
            const cellData = getDataForCell(x, y);
            const value = cellData?.value || 0;
            const color = cellData ? getColor(value) : colorSchemes[colorScheme].empty;
            
            return (
              <rect
                key={`${x}-${y}`}
                x={x * cellWidth}
                y={y * cellHeight}
                width={cellWidth}
                height={cellHeight}
                fill={color}
                stroke="rgba(0,0,0,0.1)"
                strokeWidth={0.5}
                className="cursor-pointer hover:stroke-white hover:stroke-2 transition-all"
                onMouseEnter={(e) => handleCellHover(cellData, e)}
                onMouseLeave={() => handleCellHover(null, {} as React.MouseEvent)}
                onMouseMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
                onClick={() => cellData && onCellClick && onCellClick(cellData)}
              />
            );
          })
        )}
      </svg>

      {/* X-axis labels */}
      {xLabels.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {xLabels.map((label, index) => (
            <div key={index} className="text-center" style={{ width: `${100 / cols}%` }}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Y-axis labels */}
      {yLabels.length > 0 && (
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between -ml-12">
          {yLabels.map((label, index) => (
            <div key={index} className="text-xs text-gray-400 text-right">
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Color Legend */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">Less</span>
        <div className="flex space-x-1">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: colorSchemes[colorScheme].empty }}
          ></div>
          {colorSchemes[colorScheme].colors.map((color, index) => (
            <div 
              key={index}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            ></div>
          ))}
        </div>
        <span className="text-xs text-gray-400">More</span>
      </div>

      {/* Value Range */}
      <div className="mt-2 flex justify-between text-xs text-gray-400">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && hoveredCell && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded p-3 pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="text-sm font-medium text-white">
            {hoveredCell.label || `Cell (${hoveredCell.x}, ${hoveredCell.y})`}
          </div>
          <div className="text-sm text-gray-400">
            Value: {formatValue(hoveredCell.value)}
          </div>
          {xLabels[hoveredCell.x] && (
            <div className="text-xs text-gray-500">
              X: {xLabels[hoveredCell.x]}
            </div>
          )}
          {yLabels[hoveredCell.y] && (
            <div className="text-xs text-gray-500">
              Y: {yLabels[hoveredCell.y]}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Heatmap;