'use client';

import React from 'react';
import { PRIORITY_LEVELS, PriorityLevel, getPriorityInfo } from '@/lib/priority-system';

interface PrioritySelectorProps {
  value?: PriorityLevel | string;
  onChange: (priority: PriorityLevel) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'badge';
  showDescription?: boolean;
  placeholder?: string;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  variant = 'default',
  showDescription = false,
  placeholder = 'Seleziona priorità'
}) => {
  const currentPriority = value ? getPriorityInfo(value) : null;

  if (variant === 'badge' && value) {
    const info = getPriorityInfo(value);
    return (
      <span 
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.color}`}
      >
        <span className="mr-1">{info.icon}</span>
        {info.label}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex gap-1">
        {Object.entries(PRIORITY_LEVELS).map(([key, info]) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => !disabled && onChange(key as PriorityLevel)}
              disabled={disabled}
              className={`
                p-2 rounded-md text-sm font-medium transition-all duration-200
                ${isSelected 
                  ? `${info.color} ring-2 ring-offset-2 ring-blue-500` 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={info.description}
            >
              <span className="mr-1">{info.icon}</span>
              {info.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Priorità
      </label>
      
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value as PriorityLevel)}
          disabled={disabled}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <option value="">{placeholder}</option>
          {Object.entries(PRIORITY_LEVELS).map(([key, info]) => (
            <option key={key} value={key}>
              {info.icon} {info.label}
            </option>
          ))}
        </select>
      </div>

      {showDescription && currentPriority && (
        <p className="text-xs text-gray-500 mt-1">
          {currentPriority.description}
        </p>
      )}

      {/* Priority visualization */}
      <div className="flex gap-2 mt-2">
        {Object.entries(PRIORITY_LEVELS).map(([key, info]) => {
          const isSelected = value === key;
          return (
            <div
              key={key}
              className={`
                flex items-center space-x-1 px-2 py-1 rounded-full text-xs
                ${isSelected ? info.color : 'bg-gray-50 text-gray-400'}
                transition-all duration-200
              `}
            >
              <span>{info.icon}</span>
              <span className="font-medium">{info.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente per visualizzare la priorità come badge
export const PriorityBadge: React.FC<{ 
  priority: PriorityLevel | string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  priority, 
  size = 'md' 
}) => {
  const info = getPriorityInfo(priority);
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span 
      className={`
        inline-flex items-center rounded-full font-medium
        ${info.color} ${sizeClasses[size]}
      `}
    >
      <span className="mr-1">{info.icon}</span>
      {info.label}
    </span>
  );
};

// Componente per visualizzare statistiche delle priorità
export const PriorityStats: React.FC<{
  distribution: Record<PriorityLevel, { count: number; percentage: number }>;
}> = ({ distribution }) => {
  const total = Object.values(distribution).reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Distribuzione Priorità
      </h3>
      
      <div className="space-y-2">
        {Object.entries(PRIORITY_LEVELS).map(([key, info]) => {
          const data = distribution[key as PriorityLevel];
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                  <span className="mr-1">{info.icon}</span>
                  {info.label}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      key === 'high' ? 'bg-red-500' :
                      key === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 min-w-[3rem] text-right">
                  {data.count} ({data.percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {total > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Totale: {total} idee
          </div>
        </div>
      )}
    </div>
  );
}; 