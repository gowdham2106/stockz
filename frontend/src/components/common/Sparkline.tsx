import React from 'react';

interface SparklineProps {
  data: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  isPositive = true,
  width = 120,
  height = 36,
  strokeWidth = 1.8,
  className = ''
}) => {
  if (!data || data.length < 2) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center opacity-30">
        <div className="h-[1px] w-full bg-trade-muted"></div>
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableHeight = height - padding * 2;
  const usableWidth = width - padding * 2;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * usableWidth;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const color = isPositive ? '#22C55E' : '#EF4444';
  const fillGradientId = `grad-${isPositive ? 'pos' : 'neg'}-${Math.abs(data[0] || 1)}`;

  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <svg width={width} height={height} className={`overflow-visible ${className}`} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${fillGradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
