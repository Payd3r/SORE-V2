import { 
  Heart, 
  Plane, 
  Camera, 
  Utensils, 
  Home, 
  Star, 
  Users, 
  MapPin, 
  Calendar,
  Gift,
  Music,
  Book,
  Trophy,
  Target
} from 'lucide-react';

export interface ChallengeCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  examples: string[];
}

export const challengeCategories: ChallengeCategory[] = [
  {
    id: 'relationship',
    name: 'Relationship',
    description: 'Challenges to strengthen your bond',
    icon: Heart,
    color: 'text-red-500',
    examples: [
      'Say "I love you" every day for a week',
      'Plan surprise dates for each other',
      'Write love letters to exchange',
      'Have deep conversations for 30 minutes daily'
    ],
  },
  {
    id: 'adventure',
    name: 'Adventure',
    description: 'Exciting adventures to explore together',
    icon: Plane,
    color: 'text-blue-500',
    examples: [
      'Visit 5 new places in your city',
      'Try a new outdoor activity together',
      'Take a weekend trip somewhere new',
      'Go on a spontaneous day trip'
    ],
  },
  {
    id: 'photography',
    name: 'Photography',
    description: 'Capture beautiful memories together',
    icon: Camera,
    color: 'text-purple-500',
    examples: [
      'Take a photo together every day for a month',
      'Create a themed photo series',
      'Learn photography techniques together',
      'Document a day in your life'
    ],
  },
  {
    id: 'food',
    name: 'Food & Cooking',
    description: 'Culinary adventures and discoveries',
    icon: Utensils,
    color: 'text-orange-500',
    examples: [
      'Cook a new recipe together each week',
      'Try cuisine from different countries',
      'Visit farmers markets together',
      'Create your own special recipe'
    ],
  },
  {
    id: 'home',
    name: 'Home & Lifestyle',
    description: 'Improve your shared living space',
    icon: Home,
    color: 'text-green-500',
    examples: [
      'Redecorate a room together',
      'Start a garden or grow plants',
      'Organize and declutter your space',
      'Create a cozy reading corner'
    ],
  },
  {
    id: 'goals',
    name: 'Personal Goals',
    description: 'Support each other in achieving dreams',
    icon: Target,
    color: 'text-indigo-500',
    examples: [
      'Learn a new skill together',
      'Exercise together for 30 days',
      'Read the same book and discuss',
      'Practice meditation daily'
    ],
  },
  {
    id: 'memories',
    name: 'Memory Making',
    description: 'Create lasting memories together',
    icon: Star,
    color: 'text-yellow-500',
    examples: [
      'Create a scrapbook of your relationship',
      'Record video messages for future you',
      'Visit places from your past',
      'Recreate your first date'
    ],
  },
  {
    id: 'social',
    name: 'Social & Friends',
    description: 'Strengthen your social connections',
    icon: Users,
    color: 'text-pink-500',
    examples: [
      'Host a dinner party together',
      'Make new couple friends',
      'Visit family members regularly',
      'Join a club or activity group'
    ],
  },
  {
    id: 'cultural',
    name: 'Culture & Learning',
    description: 'Expand your horizons together',
    icon: Book,
    color: 'text-teal-500',
    examples: [
      'Visit museums and art galleries',
      'Attend cultural events',
      'Learn about each other\'s heritage',
      'Take a class together'
    ],
  },
  {
    id: 'seasonal',
    name: 'Seasonal',
    description: 'Celebrate seasons and holidays',
    icon: Calendar,
    color: 'text-amber-500',
    examples: [
      'Create holiday traditions',
      'Celebrate each season with activities',
      'Plan themed date nights',
      'Make seasonal decorations'
    ],
  },
];

export const challengeDifficulties = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Simple challenges that can be completed quickly',
    color: 'text-green-500',
    estimatedTime: '1-3 days',
    icon: '🌱',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Moderate challenges requiring some planning',
    color: 'text-yellow-500',
    estimatedTime: '1-2 weeks',
    icon: '🌟',
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Complex challenges requiring dedication',
    color: 'text-red-500',
    estimatedTime: '1+ months',
    icon: '🏆',
  },
];

export const challengeStatuses = [
  {
    id: 'active',
    name: 'Active',
    description: 'Currently working on this challenge',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    icon: '🎯',
  },
  {
    id: 'completed',
    name: 'Completed',
    description: 'Successfully finished this challenge',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    icon: '✅',
  },
  {
    id: 'paused',
    name: 'Paused',
    description: 'Temporarily paused this challenge',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50',
    icon: '⏸️',
  },
];

// Predefined challenge templates
export interface ChallengeTemplate {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number; // days
  reward?: string;
  steps?: string[];
}

export const challengeTemplates: ChallengeTemplate[] = [
  // Relationship challenges
  {
    title: '7 Days of Love Notes',
    description: 'Write a heartfelt note for your partner every day for a week',
    category: 'relationship',
    difficulty: 'easy',
    estimatedDuration: 7,
    reward: 'A romantic dinner date',
    steps: [
      'Day 1: Write about what you love most about them',
      'Day 2: Share a favorite memory together',
      'Day 3: Describe how they make you feel',
      'Day 4: Write about your future dreams together',
      'Day 5: Thank them for something specific',
      'Day 6: Share why you chose them',
      'Day 7: Write a poem or song lyrics'
    ],
  },
  {
    title: 'Date Night Challenge',
    description: 'Plan and execute 5 unique date nights in a month',
    category: 'relationship',
    difficulty: 'medium',
    estimatedDuration: 30,
    reward: 'Weekend getaway',
    steps: [
      'Week 1: Outdoor adventure date',
      'Week 2: Cultural or educational date',
      'Week 3: Cooking or food-focused date',
      'Week 4: Creative or artistic date'
    ],
  },
  // Adventure challenges
  {
    title: 'Local Explorer',
    description: 'Discover 10 new places in your city or town',
    category: 'adventure',
    difficulty: 'medium',
    estimatedDuration: 30,
    reward: 'Plan a trip to a new city',
    steps: [
      'Research hidden gems in your area',
      'Visit 2-3 places per week',
      'Document each place with photos',
      'Rate and review each location'
    ],
  },
  // Photography challenges
  {
    title: '30-Day Photo Challenge',
    description: 'Take a meaningful photo together every day for a month',
    category: 'photography',
    difficulty: 'medium',
    estimatedDuration: 30,
    reward: 'Create a custom photo book',
    steps: [
      'Week 1: Focus on daily life moments',
      'Week 2: Capture emotions and feelings',
      'Week 3: Explore different locations',
      'Week 4: Get creative with poses and angles'
    ],
  },
  // Food challenges
  {
    title: 'World Cuisine Adventure',
    description: 'Cook dishes from 8 different countries together',
    category: 'food',
    difficulty: 'hard',
    estimatedDuration: 60,
    reward: 'Professional cooking class',
    steps: [
      'Choose 8 countries from different continents',
      'Research authentic recipes for each',
      'Shop for ingredients together',
      'Cook and document each meal',
      'Rate and review each cuisine'
    ],
  },
  // Goals challenges
  {
    title: 'Fitness Journey Together',
    description: 'Exercise together for 30 days straight',
    category: 'goals',
    difficulty: 'hard',
    estimatedDuration: 30,
    reward: 'New workout gear or gym membership',
    steps: [
      'Choose activities you both enjoy',
      'Create a weekly workout schedule',
      'Track progress together',
      'Celebrate weekly milestones'
    ],
  },
];

// Utility functions
export function getCategoryById(id: string): ChallengeCategory | undefined {
  return challengeCategories.find(category => category.id === id);
}

export function getDifficultyById(id: string) {
  return challengeDifficulties.find(difficulty => difficulty.id === id);
}

export function getStatusById(id: string) {
  return challengeStatuses.find(status => status.id === id);
}

export function getTemplatesByCategory(categoryId: string): ChallengeTemplate[] {
  return challengeTemplates.filter(template => template.category === categoryId);
}

export function getTemplatesByDifficulty(difficulty: string): ChallengeTemplate[] {
  return challengeTemplates.filter(template => template.difficulty === difficulty);
}

export function generateProgressBadges(progress: number) {
  const badges = [];
  
  if (progress >= 25) badges.push({ name: 'First Quarter', emoji: '🌱', achieved: true });
  else badges.push({ name: 'First Quarter', emoji: '🌱', achieved: false });
  
  if (progress >= 50) badges.push({ name: 'Halfway Hero', emoji: '⭐', achieved: true });
  else badges.push({ name: 'Halfway Hero', emoji: '⭐', achieved: false });
  
  if (progress >= 75) badges.push({ name: 'Final Stretch', emoji: '🚀', achieved: true });
  else badges.push({ name: 'Final Stretch', emoji: '🚀', achieved: false });
  
  if (progress >= 100) badges.push({ name: 'Challenge Master', emoji: '🏆', achieved: true });
  else badges.push({ name: 'Challenge Master', emoji: '🏆', achieved: false });
  
  return badges;
} 