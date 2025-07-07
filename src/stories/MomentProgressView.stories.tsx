import type { Meta, StoryObj } from '@storybook/react';
import MomentProgressView from '@/components/momento/MomentProgressView';

const meta: Meta<typeof MomentProgressView> = {
  title: 'Momento/MomentProgressView',
  component: MomentProgressView,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['uploading', 'processing', 'completed', 'failed'],
    },
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MomentProgressView>;

export const Uploading: Story = {
  args: {
    status: 'uploading',
    progress: 30,
  },
};

export const Processing: Story = {
  args: {
    status: 'processing',
    progress: 70,
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
    progress: 100,
  },
};

export const Failed: Story = {
  args: {
    status: 'failed',
    progress: 50,
  },
}; 