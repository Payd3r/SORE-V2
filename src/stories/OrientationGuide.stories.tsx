import type { Meta, StoryObj } from '@storybook/react';
import OrientationGuide from '@/components/momento/OrientationGuide';

const meta: Meta<typeof OrientationGuide> = {
  title: 'Momento/OrientationGuide',
  component: OrientationGuide,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    }
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrientationGuide>;

export const Default: Story = {
  args: {},
}; 