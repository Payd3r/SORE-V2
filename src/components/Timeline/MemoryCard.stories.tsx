import type { Meta, StoryObj } from '@storybook/react';
import { MemoryCard } from './MemoryCard';
import { TimelineMemory } from '@/lib/timeline-system';
import { action } from '@storybook/addon-actions';

const mockMemory: TimelineMemory = {
  id: '1',
  title: 'A Wonderful Day at the Beach',
  description: 'We spent the entire day building sandcastles, swimming in the ocean, and watching the beautiful sunset. It was a perfect escape from the city hustle.',
  date: new Date('2023-07-15T15:30:00Z'),
  location: 'Sunny Isles Beach, FL',
  mood: 'happy',
  category: 'travel',
  author: { id: 'user1', name: 'Alex', email: 'alex@example.com' },
  images: [
    { id: 'img1', filename: 'beach-sunset.jpg', thumbnailPath: 'https://picsum.photos/id/1018/400/300' },
    { id: 'img2', filename: 'sandcastle.jpg', thumbnailPath: 'https://picsum.photos/id/1015/400/300' },
  ],
  moments: [
    { id: 'moment1', status: 'completed', combinedImagePath: '' }
  ],
  ideas: [
    { id: 'idea1', title: 'Go kayaking next time', status: 'pending' }
  ]
};

const meta: Meta<typeof MemoryCard> = {
  title: 'Timeline/MemoryCard',
  component: MemoryCard,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['compact', 'normal', 'detailed'],
    },
    isSelected: {
      control: 'boolean',
    },
  },
  args: {
    memory: mockMemory,
    onSelect: action('onSelect'),
    onView: action('onView'),
    onShare: action('onShare'),
    onMore: action('onMore'),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'normal',
    isSelected: false,
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    isSelected: false,
  },
};

export const Detailed: Story = {
  args: {
    variant: 'detailed',
    isSelected: false,
  },
};

export const Selected: Story = {
    args: {
      variant: 'normal',
      isSelected: true,
    },
  }; 