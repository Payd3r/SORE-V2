import type { Meta, StoryObj } from '@storybook/react';
import Timeline from './Timeline'; // Adjusted import path
import { groupMemoriesByPeriod, TimelineData } from '@/lib/timeline-system';
import { mockMemories } from '@/mocks/memories';

const memories = mockMemories(25);
const timelineData: TimelineData = {
  groups: groupMemoriesByPeriod(memories, 'month'),
  summary: {
    totalMemories: memories.length,
    dateRange: {
      start: new Date('2023-01-01'),
      end: new Date('2023-12-31'),
    },
    moodStats: {
      totalMoods: 20,
      averageIntensity: 3.5,
    },
    topLocations: [{ location: 'New York', count: 5 }],
    topCategories: [{ category: 'Work', count: 10 }],
  },
};

const meta: Meta<typeof Timeline> = {
  title: 'Timeline/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    initialData: timelineData,
    showFilters: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutFilters: Story = {
  args: {
    showFilters: false,
  },
}; 