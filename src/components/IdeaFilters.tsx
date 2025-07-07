'use client';

import React, { useState, useEffect } from 'react';
import { IDEA_CATEGORIES } from '@/lib/idea-categories';
import { PRIORITY_LEVELS, PriorityLevel } from '@/lib/priority-system';

interface IdeaFiltersProps {
  onFiltersChange: (filters: IdeaFilters) => void;
  initialFilters?: Partial<IdeaFilters>;
  disabled?: boolean;
}

export interface IdeaFilters {
  status: string;
  category: string;
  priority: string;
  search: string;
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: IdeaFilters = {
  status: '',
  category: '',
  priority: '',
  search: '',
  sortBy: 'priority',
  sortOrder: 'desc'
};

export const IdeaFiltersComponent: React.FC<IdeaFiltersProps> = ({
  onFiltersChange,
  initialFilters = {},
  disabled = false
}) => {
  const [filters, setFilters] = useState<IdeaFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Aggiorna i filtri e notifica il parent
  const updateFilters = (newFilters: Partial<IdeaFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Gestione della ricerca con debounce
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      updateFilters({ search: value });
    }, 300); // Debounce di 300ms
    
    setSearchTimeout(timeout);
  };

  // Reset filtri
  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  // Conteggio filtri attivi
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy' || key === 'sortOrder') return false;
    return value !== '';
  }).length;

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header con ricerca principale */}
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {/* Barra di ricerca */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cerca idee per titolo o descrizione..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              disabled={disabled}
              className={`
                block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              `}
            />
          </div>

          {/* Ordinamento rapido */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Ordina:</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [IdeaFilters['sortBy'], IdeaFilters['sortOrder']];
                updateFilters({ sortBy, sortOrder });
              }}
              disabled={disabled}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority-desc">Priorità (Alta → Bassa)</option>
              <option value="priority-asc">Priorità (Bassa → Alta)</option>
              <option value="createdAt-desc">Più recenti</option>
              <option value="createdAt-asc">Meno recenti</option>
              <option value="dueDate-asc">Scadenza (Prima → Dopo)</option>
              <option value="dueDate-desc">Scadenza (Dopo → Prima)</option>
              <option value="title-asc">Titolo (A → Z)</option>
              <option value="title-desc">Titolo (Z → A)</option>
            </select>
          </div>

          {/* Toggle filtri avanzati */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={disabled}
            className={`
              flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-sm font-medium">Filtri</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
                {activeFiltersCount}
              </span>
            )}
            <svg 
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtri avanzati (collassabili) */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                disabled={disabled}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti gli stati</option>
                <option value="pending">In attesa</option>
                <option value="in-progress">In corso</option>
                <option value="completed">Completata</option>
                <option value="cancelled">Annullata</option>
              </select>
            </div>

            {/* Filtro Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                disabled={disabled}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutte le categorie</option>
                {IDEA_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Priorità */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorità
              </label>
              <select
                value={filters.priority}
                onChange={(e) => updateFilters({ priority: e.target.value })}
                disabled={disabled}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutte le priorità</option>
                {Object.entries(PRIORITY_LEVELS).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Azioni filtri */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              {activeFiltersCount > 0 && (
                <span>
                  {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 'i' : ''} attivo{activeFiltersCount !== 1 ? 'i' : ''}
                </span>
              )}
            </div>
            
            <button
              type="button"
              onClick={resetFilters}
              disabled={disabled || activeFiltersCount === 0}
              className={`
                text-sm text-blue-600 hover:text-blue-800 focus:outline-none
                ${disabled || activeFiltersCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Reset filtri
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook personalizzato per gestire i filtri
export const useIdeaFilters = (initialFilters?: Partial<IdeaFilters>) => {
  const [filters, setFilters] = useState<IdeaFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  const updateFilters = (newFilters: Partial<IdeaFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Costruisce la query string per l'API
  const getQueryString = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value);
      }
    });
    
    return params.toString();
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    getQueryString
  };
}; 