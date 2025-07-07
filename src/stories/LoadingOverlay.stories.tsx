import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Button } from '@/components/ui/button';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'UI/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="w-full h-screen bg-background">
        <Story />
      </div>
    ),
  ],
  render: (args) => {
    const [isLoading, setIsLoading] = useState(false);

    return (
      <>
        <div className="p-4">
          <Button onClick={() => setIsLoading(true)}>Show Overlay</Button>
        </div>
        <LoadingOverlay {...args} isLoading={isLoading} />
        {isLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
             <Button variant="destructive" onClick={() => setIsLoading(false)}>
              Hide Overlay
            </Button>
          </div>
        )}
      </>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        text: "Processing your request..."
    }
};

export const WithoutText: Story = {
    args: {
        text: undefined
    }
}; 