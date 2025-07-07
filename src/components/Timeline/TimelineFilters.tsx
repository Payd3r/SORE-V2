'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  MapPin, 
  User, 
  Heart,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import MoodSelector from '@/components/MoodSelector';
import { type TimelineFilters as ITimelineFilters } from '@/lib/timeline-system';

interface TimelineFiltersProps {
  filters: ITimelineFilters;
  onFiltersChange: (filters: ITimelineFilters) => void;
  isLoading?: boolean;
  className?: string;
}

export function TimelineFilters({
  filters,
  onFiltersChange,
  isLoading = false,
  className = '',
}: TimelineFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<ITimelineFilters>(filters);

  const handleFilterChange = (key: keyof ITimelineFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    handleFilterChange('search', value || undefined);
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      handleFilterChange('startDate', value ? new Date(value) : undefined);
    } else {
      handleFilterChange('endDate', value ? new Date(value) : undefined);
    }
  };

  const handleLocationChange = (value: string) => {
    handleFilterChange('location', value || undefined);
  };

  const handleMoodChange = (moodIds: string[]) => {
    handleFilterChange('moods', moodIds.length > 0 ? moodIds : undefined);
  };

  const handleCategoryChange = (categories: string[]) => {
    handleFilterChange('categories', categories.length > 0 ? categories : undefined);
  };

  const handleAuthorChange = (authorId: string) => {
    handleFilterChange('authorId', authorId || undefined);
  };

  const clearAllFilters = () => {
    const emptyFilters: ITimelineFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.location) count++;
    if (filters.moods && filters.moods.length > 0) count++;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.authorId) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">Filtri Timeline</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {getActiveFiltersCount()} attiv{getActiveFiltersCount() === 1 ? 'o' : 'i'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                disabled={isLoading}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Pulisci
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              disabled={isLoading}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search - Always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Cerca nelle memorie..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={isLoading}
            className="pl-10"
          />
        </div>

        {/* Expandable Filters */}
        {isExpanded && (
          <div className="space-y-4 border-t pt-4">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data inizio
                </Label>
                <Input
                  type="date"
                  value={localFilters.startDate ? localFilters.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data fine
                </Label>
                <Input
                  type="date"
                  value={localFilters.endDate ? localFilters.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Luogo
              </Label>
              <Input
                placeholder="Filtra per luogo..."
                value={localFilters.location || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Mood Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Stati d'animo
              </Label>
              <MoodSelector
                selectedMood={localFilters.moods?.[0] || null}
                onMoodSelect={(moodId) => handleMoodChange(moodId ? [moodId] : [])}
                variant="compact"
                disabled={isLoading}
                allowMultiple={true}
                placeholder="Seleziona stati d'animo..."
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categorie</Label>
              <div className="flex flex-wrap gap-2">
                {['viaggio', 'cibo', 'famiglia', 'amici', 'lavoro', 'hobby', 'sport', 'cultura'].map((category) => (
                  <Button
                    key={category}
                    variant={localFilters.categories?.includes(category) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const currentCategories = localFilters.categories || [];
                      const newCategories = currentCategories.includes(category)
                        ? currentCategories.filter(c => c !== category)
                        : [...currentCategories, category];
                      handleCategoryChange(newCategories);
                    }}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Author Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Autore
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={!localFilters.authorId ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAuthorChange('')}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Tutti
                </Button>
                <Button
                  variant={localFilters.authorId === 'me' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAuthorChange('me')}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Le mie memorie
                </Button>
                <Button
                  variant={localFilters.authorId === 'partner' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAuthorChange('partner')}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Del mio partner
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && !isExpanded && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.search && (
              <Badge variant="secondary" className="text-xs">
                Ricerca: "{filters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleSearchChange('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            
            {(filters.startDate || filters.endDate) && (
              <Badge variant="secondary" className="text-xs">
                Periodo selezionato
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => {
                    handleDateRangeChange('start', '');
                    handleDateRangeChange('end', '');
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            
            {filters.location && (
              <Badge variant="secondary" className="text-xs">
                Luogo: {filters.location}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleLocationChange('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            
            {filters.moods && filters.moods.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.moods.length} stato/i d'animo
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleMoodChange([])}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            
            {filters.categories && filters.categories.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.categories.length} categori{filters.categories.length === 1 ? 'a' : 'e'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleCategoryChange([])}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 