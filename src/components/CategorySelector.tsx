'use client';

import React, { useState, useEffect } from 'react';
import { IDEA_CATEGORIES } from '@/lib/idea-categories';
import { formatNumber, t } from '@/lib/localization';

interface Category {
  id: string;
  name: string;
  icon: string;
  description?: string;
  count?: number;
  completionRate?: number;
}

interface CategorySelectorProps {
  value?: string;
  onChange: (categoryId: string | null) => void;
  disabled?: boolean;
  showStats?: boolean;
  variant?: 'default' | 'compact' | 'grid';
  placeholder?: string;
  allowClear?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showStats = false,
  variant = 'default',
  placeholder = 'Seleziona una categoria',
  allowClear = true,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carica le categorie
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const url = showStats 
          ? '/api/ideas/categories?includeStats=true'
          : '/api/ideas/categories';
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data.categories);
        }
      } catch (error) {
        console.error('Errore nel caricamento delle categorie:', error);
        // Fallback alle categorie predefinite
        setCategories(IDEA_CATEGORIES.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          description: cat.description,
        })));
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [showStats]);

  const selectedCategory = categories.find(cat => cat.id === value);

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setIsOpen(false);
  };

  if (variant === 'grid') {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allowClear && (
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className={`
                p-3 rounded-lg border-2 text-center transition-all duration-200
                ${!value 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
              `}
            >
              <div className="text-2xl mb-1">🚫</div>
              <div className="text-xs font-medium">Nessuna</div>
            </button>
          )}
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelect(category.id)}
              disabled={disabled}
              className={`
                p-3 rounded-lg border-2 text-center transition-all duration-200
                ${value === category.id 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
              `}
            >
              <div className="text-2xl mb-1">{category.icon}</div>
              <div className="text-xs font-medium">{category.name}</div>
              {showStats && category.count !== undefined && (
                <div className="text-xs text-gray-500 mt-1">
                  {category.count > 0 ? `${category.count}` : '0'}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          <option value="">{placeholder}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
              {showStats && category.count !== undefined ? ` (${category.count})` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Variant default (dropdown personalizzato)
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Categoria
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedCategory ? (
                <>
                  <span className="text-lg">{selectedCategory.icon}</span>
                  <span className="text-gray-900">{selectedCategory.name}</span>
                  {showStats && selectedCategory.count !== undefined && (
                    <span className="text-sm text-gray-500">
                      ({selectedCategory.count})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {allowClear && selectedCategory && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  ✕
                </button>
              )}
              <span className="text-gray-400">
                {isOpen ? '▲' : '▼'}
              </span>
            </div>
          </div>
        </button>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Caricamento...
              </div>
            ) : (
              <>
                {allowClear && (
                  <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">🚫</span>
                      <span className="text-gray-600">Nessuna categoria</span>
                    </div>
                  </button>
                )}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.id)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                      ${value === category.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{category.icon}</span>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-500">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {showStats && category.count !== undefined && (
                        <div className="text-right">
                          <div className="text-sm font-medium">{category.count}</div>
                          {category.completionRate !== undefined && (
                            <div className="text-xs text-gray-500">
                              {formatNumber(category.completionRate, 0)}% completato
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Overlay per chiudere il dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CategorySelector; 