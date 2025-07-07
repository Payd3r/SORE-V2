import type { Meta, StoryObj } from '@storybook/react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof GlassCard> = {
  title: 'UI/GlassCard',
  component: GlassCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof GlassCard>;

export const Default: Story = {
  args: {
    children: 'This is a GlassCard',
  },
};

export const WithControls: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">A card with controls</h3>
        <p>This card has a button inside.</p>
        <Button variant="glass">Click me</Button>
      </div>
    ),
  },
}; 