import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  color?: 'emerald' | 'blue' | 'amber' | 'rose' | 'red' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = true,
  color = 'auto',
  size = 'md',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  let barColorClass = 'bg-red-600';
  if (color === 'auto') {
    if (clamped >= 80) barColorClass = 'bg-emerald-600';
    else if (clamped >= 60) barColorClass = 'bg-blue-600';
    else if (clamped >= 40) barColorClass = 'bg-amber-500';
    else barColorClass = 'bg-red-600';
  } else {
    const map = {
      emerald: 'bg-emerald-600',
      blue: 'bg-blue-600',
      amber: 'bg-amber-500',
      rose: 'bg-red-600',
      red: 'bg-red-600',
    };
    barColorClass = map[color];
  }

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-1">
          {label && <span className="truncate">{label}</span>}
          {showPercentage && <span className="font-mono text-gray-500 ml-auto">{clamped}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${heightClass} border border-gray-200`}>
        <div
          className={`${heightClass} ${barColorClass} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
