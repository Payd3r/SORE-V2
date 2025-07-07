import type { Meta, StoryObj } from '@storybook/react';
import PartnerStatusIndicator from '@/components/momento/PartnerStatusIndicator';

const meta: Meta<typeof PartnerStatusIndicator> = {
  title: 'Momento/PartnerStatusIndicator',
  component: PartnerStatusIndicator,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    }
  },
  tags: ['autodocs'],
  argTypes: {
    momentId: {
      control: false,
    },
    status: {
      control: { type: 'select' },
      options: ['disconnected', 'connecting', 'connected', 'capturing', 'captured', 'error'],
    }
  }
};

export default meta;
type Story = StoryObj<typeof PartnerStatusIndicator>;

export const Disconnected: Story = {
  args: {
    momentId: '1',
    status: 'disconnected',
  },
};

export const Connecting: Story = {
  args: {
    momentId: '1',
    status: 'connecting',
  },
};

export const Connected: Story = {
  args: {
    momentId: '1',
    status: 'connected',
  },
};

export const Capturing: Story = {
  args: {
    momentId: '1',
    status: 'capturing',
  },
};

export const Captured: Story = {
  args: {
    momentId: '1',
    status: 'captured',
  },
};

export const Error: Story = {
  args: {
    momentId: '1',
    status: 'error',
  },
}; 