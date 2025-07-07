import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';

import { Button } from './button';
import { Toaster } from './toaster';

const meta: Meta<typeof Toaster> = {
  title: 'UI/Toaster',
  component: Toaster,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div>
      <Toaster {...args} />
      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          onClick={() => toast('This is a default toast.')}
        >
          Default
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.info('This is an info toast.')}
        >
          Info
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.success('This is a success toast.')}
        >
          Success
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning('This is a warning toast.')}
        >
          Warning
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error('This is an error toast.')}
        >
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast('Event has been created', {
              description: 'Sunday, December 03, 2023 at 9:00 AM',
              action: {
                label: 'Undo',
                onClick: () => console.log('Undo'),
              },
            })
          }
        >
          With Action
        </Button>
      </div>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {}; 