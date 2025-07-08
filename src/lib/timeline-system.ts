import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from 'date-fns';
import { it } from 'date-fns/locale';
import { getMoodById, getMoodEmoji, getMoodColor, getMoodName, type Mood } from './mood-system';

export interface TimelineMemory {
  id: string;
  title: string;
  description?: string;
  date: Date;
  location?: string;
  mood?: string;
  category?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  images?: Array<{
    id: string;
    filename: string;
    thumbnailPath?: string;
  }>;
  moments?: TimelineMoment[];
  ideas?: Array<{
    id: string;
    title: string;
    status: string;
  }>;
}

export interface TimelineGroup {
  id: string;
  period: string;
  periodType: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  label: string;
  labelIt: string;
  memories: TimelineMemory[];
  moodSummary: {
    dominantMood?: Mood;
    moodCount: number;
    averageIntensity: number;
    moodDistribution: { [moodId: string]: number };
  };
  stats: {
    totalMemories: number;
    locationsVisited: number;
    categoriesUsed: string[];
    imageCount: number;
    momentCount: number;
  };
}

export interface TimelineData {
  groups: TimelineGroup[];
  summary: {
    totalMemories: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    moodStats: {
      totalMoods: number;
      averageIntensity: number;
      mostCommonMood?: Mood;
    };
    topLocations: Array<{
      location: string;
      count: number;
    }>;
    topCategories: Array<{
      category: string;
      count: number;
    }>;
  };
}

export type TimelineView = 'day' | 'week' | 'month' | 'year';

// Timeline grouping functions
export const groupMemoriesByPeriod = (
  memories: TimelineMemory[],
  view: TimelineView = 'month'
): TimelineGroup[] => {
  const groups = new Map<string, TimelineMemory[]>();
  
  memories.forEach(memory => {
    let groupKey: string;
    let startDate: Date;
    let endDate: Date;
    
    switch (view) {
      case 'day':
        groupKey = format(memory.date, 'yyyy-MM-dd');
        startDate = startOfDay(memory.date);
        endDate = endOfDay(memory.date);
        break;
      case 'week':
        groupKey = format(startOfWeek(memory.date), 'yyyy-MM-dd');
        startDate = startOfWeek(memory.date);
        endDate = endOfWeek(memory.date);
        break;
      case 'month':
        groupKey = format(memory.date, 'yyyy-MM');
        startDate = startOfMonth(memory.date);
        endDate = endOfMonth(memory.date);
        break;
      case 'year':
        groupKey = format(memory.date, 'yyyy');
        startDate = startOfYear(memory.date);
        endDate = endOfYear(memory.date);
        break;
    }
    
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(memory);
  });
  
  return Array.from(groups.entries()).map(([period, groupMemories]) => {
    const firstMemory = groupMemories[0];
    const startDate = getGroupStartDate(firstMemory.date, view);
    const endDate = getGroupEndDate(firstMemory.date, view);
    
    // Calculate mood summary
    const moodSummary = calculateMoodSummary(groupMemories);
    
    // Calculate stats
    const stats = calculateGroupStats(groupMemories);
    
    // Generate labels
    const labels = generatePeriodLabels(startDate, endDate, view);
    
    return {
      id: period,
      period,
      periodType: view,
      startDate,
      endDate,
      label: labels.label,
      labelIt: labels.labelIt,
      memories: groupMemories.sort((a, b) => b.date.getTime() - a.date.getTime()),
      moodSummary,
      stats,
    };
  }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
};

// Helper functions
const getGroupStartDate = (date: Date, view: TimelineView): Date => {
  switch (view) {
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date);
    case 'month':
      return startOfMonth(date);
    case 'year':
      return startOfYear(date);
  }
};

const getGroupEndDate = (date: Date, view: TimelineView): Date => {
  switch (view) {
    case 'day':
      return endOfDay(date);
    case 'week':
      return endOfWeek(date);
    case 'month':
      return endOfMonth(date);
    case 'year':
      return endOfYear(date);
  }
};

const calculateMoodSummary = (memories: TimelineMemory[]) => {
  const memoriesWithMoods = memories.filter(m => m.mood);
  const moodCounts = new Map<string, number>();
  let totalIntensity = 0;
  let moodCount = 0;
  
  memoriesWithMoods.forEach(memory => {
    if (memory.mood) {
      const mood = getMoodById(memory.mood);
      if (mood) {
        moodCounts.set(memory.mood, (moodCounts.get(memory.mood) || 0) + 1);
        totalIntensity += mood.intensity;
        moodCount++;
      }
    }
  });
  
  // Find dominant mood
  let dominantMoodId = '';
  let maxCount = 0;
  moodCounts.forEach((count, moodId) => {
    if (count > maxCount) {
      maxCount = count;
      dominantMoodId = moodId;
    }
  });
  
  const dominantMood = dominantMoodId ? getMoodById(dominantMoodId) : undefined;
  const averageIntensity = moodCount > 0 ? totalIntensity / moodCount : 0;
  
  return {
    dominantMood,
    moodCount,
    averageIntensity,
    moodDistribution: Object.fromEntries(moodCounts),
  };
};

const calculateGroupStats = (memories: TimelineMemory[]) => {
  const locations = new Set<string>();
  const categories = new Set<string>();
  let imageCount = 0;
  let momentCount = 0;
  
  memories.forEach(memory => {
    if (memory.location) {
      locations.add(memory.location);
    }
    if (memory.category) {
      categories.add(memory.category);
    }
    if (memory.images) {
      imageCount += memory.images.length;
    }
    if (memory.moments) {
      momentCount += memory.moments.length;
    }
  });
  
  return {
    totalMemories: memories.length,
    locationsVisited: locations.size,
    categoriesUsed: Array.from(categories),
    imageCount,
    momentCount,
  };
};

const generatePeriodLabels = (startDate: Date, endDate: Date, view: TimelineView) => {
  const formatOptions = { locale: it };
  
  switch (view) {
    case 'day':
      return {
        label: format(startDate, 'EEEE, MMMM d, yyyy', formatOptions),
        labelIt: format(startDate, 'EEEE, d MMMM yyyy', formatOptions),
      };
    case 'week':
      return {
        label: `Week of ${format(startDate, 'MMMM d', formatOptions)}`,
        labelIt: `Settimana del ${format(startDate, 'd MMMM', formatOptions)}`,
      };
    case 'month':
      return {
        label: format(startDate, 'MMMM yyyy', formatOptions),
        labelIt: format(startDate, 'MMMM yyyy', formatOptions),
      };
    case 'year':
      return {
        label: format(startDate, 'yyyy'),
        labelIt: format(startDate, 'yyyy'),
      };
  }
};

// Timeline filtering functions
export const filterTimelineByDateRange = (
  memories: TimelineMemory[],
  startDate: Date,
  endDate: Date
): TimelineMemory[] => {
  return memories.filter(memory => 
    memory.date >= startDate && memory.date <= endDate
  );
};

export const filterTimelineByMood = (
  memories: TimelineMemory[],
  moodIds: string[]
): TimelineMemory[] => {
  return memories.filter(memory => 
    memory.mood && moodIds.includes(memory.mood)
  );
};

export const filterTimelineByLocation = (
  memories: TimelineMemory[],
  locations: string[]
): TimelineMemory[] => {
  return memories.filter(memory => 
    memory.location && locations.some(loc => 
      memory.location!.toLowerCase().includes(loc.toLowerCase())
    )
  );
};

export const filterTimelineByCategory = (
  memories: TimelineMemory[],
  categories: string[]
): TimelineMemory[] => {
  return memories.filter(memory => 
    memory.category && categories.includes(memory.category)
  );
};

export const filterTimelineByAuthor = (
  memories: TimelineMemory[],
  authorIds: string[]
): TimelineMemory[] => {
  return memories.filter(memory => 
    authorIds.includes(memory.author.id)
  );
};

// Timeline search functions
export const searchTimelineMemories = (
  memories: TimelineMemory[],
  query: string
): TimelineMemory[] => {
  if (!query.trim()) {
    return memories;
  }
  
  const lowercaseQuery = query.toLowerCase();
  
  return memories.filter(memory => 
    memory.title.toLowerCase().includes(lowercaseQuery) ||
    memory.description?.toLowerCase().includes(lowercaseQuery) ||
    memory.location?.toLowerCase().includes(lowercaseQuery) ||
    memory.category?.toLowerCase().includes(lowercaseQuery) ||
    memory.author.name.toLowerCase().includes(lowercaseQuery)
  );
};

// Timeline statistics functions
export const calculateTimelineStats = (memories: TimelineMemory[]) => {
  if (memories.length === 0) {
    return {
      totalMemories: 0,
      dateRange: { start: new Date(), end: new Date() },
      moodStats: { totalMoods: 0, averageIntensity: 0 },
      topLocations: [],
      topCategories: [],
    };
  }
  
  const dates = memories.map(m => m.date);
  const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Location analysis
  const locationCounts = new Map<string, number>();
  memories.forEach(memory => {
    if (memory.location) {
      locationCounts.set(memory.location, (locationCounts.get(memory.location) || 0) + 1);
    }
  });
  
  const topLocations = Array.from(locationCounts.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Category analysis
  const categoryCounts = new Map<string, number>();
  memories.forEach(memory => {
    if (memory.category) {
      categoryCounts.set(memory.category, (categoryCounts.get(memory.category) || 0) + 1);
    }
  });
  
  const topCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Mood analysis
  const memoriesWithMoods = memories.filter(m => m.mood);
  let totalIntensity = 0;
  const moodCounts = new Map<string, number>();
  
  memoriesWithMoods.forEach(memory => {
    if (memory.mood) {
      const mood = getMoodById(memory.mood);
      if (mood) {
        totalIntensity += mood.intensity;
        moodCounts.set(memory.mood, (moodCounts.get(memory.mood) || 0) + 1);
      }
    }
  });
  
  const averageIntensity = memoriesWithMoods.length > 0 ? totalIntensity / memoriesWithMoods.length : 0;
  
  // Find most common mood
  let mostCommonMoodId = '';
  let maxCount = 0;
  moodCounts.forEach((count, moodId) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommonMoodId = moodId;
    }
  });
  
  const mostCommonMood = mostCommonMoodId ? getMoodById(mostCommonMoodId) : undefined;
  
  return {
    totalMemories: memories.length,
    dateRange: { start: startDate, end: endDate },
    moodStats: {
      totalMoods: memoriesWithMoods.length,
      averageIntensity,
      mostCommonMood,
    },
    topLocations,
    topCategories,
  };
};

// Timeline generation function
export const generateTimeline = (
  memories: TimelineMemory[],
  options: {
    view?: TimelineView;
    dateRange?: { start: Date; end: Date };
    moodFilter?: string[];
    locationFilter?: string[];
    categoryFilter?: string[];
    authorFilter?: string[];
    searchQuery?: string;
  } = {}
): TimelineData => {
  let filteredMemories = [...memories];
  
  // Apply filters
  if (options.dateRange) {
    filteredMemories = filterTimelineByDateRange(
      filteredMemories,
      options.dateRange.start,
      options.dateRange.end
    );
  }
  
  if (options.moodFilter && options.moodFilter.length > 0) {
    filteredMemories = filterTimelineByMood(filteredMemories, options.moodFilter);
  }
  
  if (options.locationFilter && options.locationFilter.length > 0) {
    filteredMemories = filterTimelineByLocation(filteredMemories, options.locationFilter);
  }
  
  if (options.categoryFilter && options.categoryFilter.length > 0) {
    filteredMemories = filterTimelineByCategory(filteredMemories, options.categoryFilter);
  }
  
  if (options.authorFilter && options.authorFilter.length > 0) {
    filteredMemories = filterTimelineByAuthor(filteredMemories, options.authorFilter);
  }
  
  if (options.searchQuery) {
    filteredMemories = searchTimelineMemories(filteredMemories, options.searchQuery);
  }
  
  // Group memories by period
  const groups = groupMemoriesByPeriod(filteredMemories, options.view || 'month');
  
  // Calculate summary statistics
  const summary = calculateTimelineStats(filteredMemories);
  
  return {
    groups,
    summary,
  };
};

export default {
  groupMemoriesByPeriod,
  filterTimelineByDateRange,
  filterTimelineByMood,
  filterTimelineByLocation,
  filterTimelineByCategory,
  filterTimelineByAuthor,
  searchTimelineMemories,
  calculateTimelineStats,
  generateTimeline,
};

export interface TimelineMomentImage {
  id: string;
  path: string;
  isLivePhoto: boolean;
  Video?: {
    id: string;
    mp4Path?: string;
  } | null;
}

export interface TimelineMoment {
  id: string;
  status: string;
  combinedImage?: string | null;
  images: TimelineMomentImage[];
} 