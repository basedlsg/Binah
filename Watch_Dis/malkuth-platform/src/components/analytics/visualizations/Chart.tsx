'use client';

import React, { useRef, useEffect } from 'react';
import { ChartData } from '@/types';

interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'area';
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  animate?: boolean;
}

const Chart: React.FC<ChartProps> = ({
  data,
  type,
  height = 300,
  className = '',
  showGrid = true,
  showLegend = true,
  animate = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Calculate chart area
    const padding = 60;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = height - (padding * 2);
    const chartX = padding;
    const chartY = padding;

    // Find data ranges
    const allValues = data.datasets.flatMap(dataset => dataset.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues, 0);
    const valueRange = maxValue - minValue;

    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = '#374151'; // gray-700
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = chartY + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(chartX, y);
        ctx.lineTo(chartX + chartWidth, y);
        ctx.stroke();
      }
      
      // Vertical grid lines
      const stepX = chartWidth / (data.labels.length - 1);
      for (let i = 0; i < data.labels.length; i++) {
        const x = chartX + stepX * i;
        ctx.beginPath();
        ctx.moveTo(x, chartY);
        ctx.lineTo(x, chartY + chartHeight);
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = '#9CA3AF'; // gray-400
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX, chartY + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(chartX, chartY + chartHeight);
    ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
    ctx.stroke();

    // Draw y-axis labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
      const value = maxValue - (valueRange / 5) * i;
      const y = chartY + (chartHeight / 5) * i;
      ctx.fillText(value.toFixed(0), chartX - 10, y);
    }

    // Draw x-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const stepX = chartWidth / (data.labels.length - 1);
    
    data.labels.forEach((label, index) => {
      const x = chartX + stepX * index;
      ctx.fillText(label, x, chartY + chartHeight + 10);
    });

    // Draw datasets
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = dataset.borderColor || dataset.backgroundColor || `hsl(${datasetIndex * 60}, 70%, 60%)`;
      
      if (type === 'line' || type === 'area') {
        // Draw line/area chart
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Create path
        ctx.beginPath();
        dataset.data.forEach((value, index) => {
          const x = chartX + stepX * index;
          const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        if (type === 'area' && dataset.fill) {
          // Fill area
          ctx.lineTo(chartX + stepX * (dataset.data.length - 1), chartY + chartHeight);
          ctx.lineTo(chartX, chartY + chartHeight);
          ctx.closePath();
          ctx.fillStyle = color + '40'; // Add transparency
          ctx.fill();
        }

        ctx.stroke();

        // Draw data points
        ctx.fillStyle = color;
        dataset.data.forEach((value, index) => {
          const x = chartX + stepX * index;
          const y = chartY + chartHeight - ((value - minValue) / valueRange) * chartHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (type === 'bar') {
        // Draw bar chart
        const barWidth = (chartWidth / data.labels.length) * 0.8;
        const barSpacing = chartWidth / data.labels.length;
        
        ctx.fillStyle = color;
        
        dataset.data.forEach((value, index) => {
          const x = chartX + (barSpacing * index) + (barSpacing - barWidth) / 2;
          const barHeight = ((value - minValue) / valueRange) * chartHeight;
          const y = chartY + chartHeight - barHeight;
          
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      }
    });

    // Draw legend if enabled
    if (showLegend && data.datasets.length > 1) {
      const legendY = 20;
      let legendX = rect.width - 200;
      
      data.datasets.forEach((dataset, index) => {
        const color = dataset.borderColor || dataset.backgroundColor || `hsl(${index * 60}, 70%, 60%)`;
        
        // Legend color box
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY + index * 25, 15, 15);
        
        // Legend text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(dataset.label, legendX + 25, legendY + index * 25 + 7);
      });
    }

  }, [data, type, height, showGrid, showLegend]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default Chart;